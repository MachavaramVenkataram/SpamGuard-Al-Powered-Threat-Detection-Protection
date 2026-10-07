"""
SpamGuard Unified Risk Engine
Synthesizes signals from:
1. Supervised Machine Learning (Scikit-Learn TF-IDF + MultinomialNB/LogReg)
2. Generative AI Security Analysis (Google Gemini)
3. External Threat Intelligence (VirusTotal v3)
4. Local Deterministic Heuristics (RFC 3986 Lexical Audit, Header & Regex Rules)
Calculates calibrated multi-source risk assessment and actionable recommendations.
"""

import re
import time
import uuid
import logging
import concurrent.futures
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from services.ml_service import ml_service
from services.gemini_service import gemini_service
from services.virustotal_service import virustotal_service
from services.security_signal_engine import security_signal_engine
from app.intelligence import analyze_single_url, analyze_email_payload

logger = logging.getLogger("spamguard.risk_engine")

# Persistent module-level executor for parallel threat lookups without thread teardown traps
_RISK_PARALLEL_EXECUTOR = concurrent.futures.ThreadPoolExecutor(max_workers=6, thread_name_prefix="risk_worker")

class RiskEngine:
    def __init__(self):
        pass

    def _extract_urls(self, text: str) -> List[str]:
        """Extracts valid web URLs from raw text."""
        url_pattern = r'https?://[^\s<>"]+|www\.[^\s<>"]+'
        matches = re.findall(url_pattern, text, re.IGNORECASE)
        seen = set()
        clean_urls = []
        for u in matches:
            cleaned = u.rstrip(".,;!?'\")>]}")
            if cleaned not in seen:
                seen.add(cleaned)
                clean_urls.append(cleaned)
        return clean_urls

    def assess_threat(
        self,
        content: str,
        input_type: str = "text",
        model_id: str = "naive_bayes",
        email_data: Optional[Dict[str, str]] = None,
        image_bytes: Optional[bytes] = None,
        mime_type: str = "image/png"
    ) -> Dict[str, Any]:
        """
        Master orchestration: Runs ML, Gemini, VirusTotal, and Local Heuristics in parallel,
        aggregates distinct signals with individual source attributions,
        and computes a calibrated, non-linear risk score (0-100), red flags, and action plan.
        """
        t_start = time.perf_counter()
        req_id = f"sg-scan-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6]}"
        raw_text = content.strip() if content else ""
        extracted_urls: List[str] = []

        logger.info(f"[UNIFIED-SCAN][{req_id}] received type={input_type} content_len={len(raw_text)}")

        # Initialize signal sources
        ml_result: Dict[str, Any] = {"available": False, "status": "unavailable", "risk_score": 0, "signals": []}
        gemini_result: Dict[str, Any] = {"available": False, "status": "unavailable", "risk_score": 0, "signals": []}
        vt_result: Dict[str, Any] = {"available": False, "status": "unavailable", "risk_score": 0, "signals": []}
        heuristic_result: Dict[str, Any] = {"available": True, "status": "available", "risk_score": 0, "signals": []}
        local_signals_list: List[Dict[str, Any]] = []
        evidence_list: List[Dict[str, Any]] = []

        # -------------------------------------------------------------
        # 1. Local Extraction & Parsing
        # -------------------------------------------------------------
        t_parse_start = time.perf_counter()
        if input_type == "url":
            extracted_urls = [raw_text] if raw_text else []
        elif input_type in ["text", "email", "file"]:
            extracted_urls = self._extract_urls(raw_text)
        t_parse_ms = round((time.perf_counter() - t_parse_start) * 1000, 2)
        logger.info(f"[UNIFIED-SCAN][{req_id}] parsing completed: {t_parse_ms}ms (urls={len(extracted_urls)})")

        # -------------------------------------------------------------
        # 2. Local Deterministic Heuristics & Signals (<2ms)
        # -------------------------------------------------------------
        local_risk_score = 0
        if raw_text and input_type in ["text", "email", "file"]:
            try:
                sig_text = security_signal_engine.analyze_text(raw_text)
                local_signals_list.extend(sig_text.get("signals", []))
                evidence_list.extend(sig_text.get("evidence", []))
                local_risk_score = max(local_risk_score, sig_text.get("risk_score", 0))
            except Exception as e:
                logger.error(f"[UNIFIED-SCAN][{req_id}] Local text security signals error: {e}")

        if extracted_urls:
            try:
                sig_url = security_signal_engine.analyze_url(extracted_urls[0])
                local_signals_list.extend(sig_url.get("signals", []))
                evidence_list.extend(sig_url.get("evidence", []))
                local_risk_score = max(local_risk_score, sig_url.get("risk_score", 0))
            except Exception as e:
                logger.error(f"[UNIFIED-SCAN][{req_id}] Local URL security signals error: {e}")

            try:
                local_url_intel = analyze_single_url(extracted_urls[0])
                h_score = local_url_intel.get("risk_score", 0)
                h_reasons = local_url_intel.get("reasons", [])
                local_risk_score = max(local_risk_score, h_score)
                heuristic_result["signals"].extend([f"URL Heuristic: {r}" for r in h_reasons])
            except Exception as e:
                logger.error(f"[UNIFIED-SCAN][{req_id}] Local URL heuristics error: {e}")

        if input_type == "email" and email_data:
            try:
                email_intel = analyze_email_payload(
                    from_address=email_data.get("from", ""),
                    to_address=email_data.get("to", ""),
                    subject=email_data.get("subject", ""),
                    body=email_data.get("body", ""),
                    reply_to=email_data.get("reply_to", "")
                )
                header_score = email_intel["header_analysis"]["header_risk_score"]
                local_risk_score = max(local_risk_score, header_score)
                heuristic_result["signals"].extend(email_intel["header_analysis"]["header_flags"])
                heuristic_result["signals"].extend(email_intel["content_analysis"]["content_flags"])
            except Exception as e:
                logger.error(f"[UNIFIED-SCAN][{req_id}] Email header intelligence error: {e}")

        heuristic_result["risk_score"] = local_risk_score
        for s in local_signals_list:
            reason = s.get("reason") if isinstance(s, dict) else str(s)
            if reason not in heuristic_result["signals"]:
                heuristic_result["signals"].append(reason)

        # -------------------------------------------------------------
        # 3. Parallel Execution: ML, VirusTotal, Gemini
        # -------------------------------------------------------------
        target_url = extracted_urls[0] if extracted_urls else None

        def _task_ml():
            t0 = time.perf_counter()
            res = {"available": False, "status": "unavailable", "risk_score": 0, "signals": []}
            if input_type in ["text", "email", "file"] and raw_text:
                try:
                    res = ml_service.predict(raw_text, model_id=model_id)
                except Exception as e:
                    logger.error(f"[UNIFIED-SCAN][{req_id}] ML evaluation failed: {e}")
            elif input_type in ["image", "screenshot", "qr"] and image_bytes:
                # ML will be run after OCR text is extracted
                pass
            return res, round((time.perf_counter() - t0) * 1000, 2)

        def _task_vt():
            t0 = time.perf_counter()
            res = {"available": False, "status": "unavailable", "risk_score": 0, "signals": []}
            if target_url:
                try:
                    vt_data = virustotal_service.analyze_url(target_url, timeout=3.0)
                    vt_available = vt_data.get("available", False)
                    res = {
                        "available": vt_available,
                        "status": vt_data.get("status", "unavailable"),
                        "risk_score": vt_data.get("risk_score", 0),
                        "url": target_url,
                        "stats": vt_data.get("stats", {}),
                        "reputation": vt_data.get("reputation", 0),
                        "cached": vt_data.get("cached", False),
                        "signals": vt_data.get("signals", []),
                        "error": vt_data.get("error")
                    }
                except Exception as e:
                    logger.error(f"[UNIFIED-SCAN][{req_id}] VirusTotal error: {e}")
                    res = {
                        "available": False,
                        "status": "unavailable",
                        "risk_score": 0,
                        "signals": ["VirusTotal intelligence temporarily unreachable."],
                        "error": str(e)
                    }
            return res, round((time.perf_counter() - t0) * 1000, 2)

        def _task_gemini():
            t0 = time.perf_counter()
            res = {"available": False, "status": "unavailable", "risk_score": 0, "signals": []}
            if input_type in ["text", "email", "file", "url"] and raw_text:
                try:
                    res = gemini_service.analyze_text(raw_text, timeout=4.5)
                except Exception as e:
                    logger.error(f"[UNIFIED-SCAN][{req_id}] Gemini text analysis error: {e}")
                    res = {
                        "available": False,
                        "status": "unavailable",
                        "risk_score": 0,
                        "signals": ["Gemini analysis temporarily unavailable."],
                        "error": str(e)
                    }
            elif input_type in ["image", "screenshot", "qr"] and image_bytes:
                try:
                    res = gemini_service.analyze_image(image_bytes, mime_type=mime_type, timeout=10.0)
                except Exception as e:
                    logger.error(f"[UNIFIED-SCAN][{req_id}] Gemini image analysis error: {e}")
                    res = {
                        "available": False,
                        "status": "unavailable",
                        "risk_score": 0,
                        "signals": ["Gemini multimodal inspection failed."],
                        "error": str(e)
                    }
            return res, round((time.perf_counter() - t0) * 1000, 2)

        # Launch in thread pool concurrently
        future_ml = _RISK_PARALLEL_EXECUTOR.submit(_task_ml)
        future_vt = _RISK_PARALLEL_EXECUTOR.submit(_task_vt)
        future_gem = _RISK_PARALLEL_EXECUTOR.submit(_task_gemini)

        try:
            (ml_result, ml_ms) = future_ml.result(timeout=4.0)
            logger.info(f"[UNIFIED-SCAN][{req_id}] ML completed: {ml_ms}ms")
        except concurrent.futures.TimeoutError:
            ml_result = {"available": False, "status": "timeout", "risk_score": 0, "signals": []}
            ml_ms = 4000.0
            logger.warning(f"[UNIFIED-SCAN][{req_id}] ML inference timed out")
        except Exception as e:
            ml_result = {"available": False, "status": "unavailable", "risk_score": 0, "signals": [], "error": str(e)}
            ml_ms = 0.0
            logger.error(f"[UNIFIED-SCAN][{req_id}] ML inference exception: {e}")

        try:
            (vt_result, vt_ms) = future_vt.result(timeout=2.8)
            logger.info(f"[UNIFIED-SCAN][{req_id}] VirusTotal completed: {vt_ms}ms (status={vt_result.get('status')})")
        except concurrent.futures.TimeoutError:
            vt_result = {"available": False, "status": "timeout", "risk_score": 0, "signals": ["VirusTotal intelligence lookup timed out."]}
            vt_ms = 2800.0
            logger.warning(f"[UNIFIED-SCAN][{req_id}] VirusTotal lookup timed out")
        except Exception as e:
            vt_result = {"available": False, "status": "unavailable", "risk_score": 0, "signals": [], "error": str(e)}
            vt_ms = 0.0
            logger.error(f"[UNIFIED-SCAN][{req_id}] VirusTotal lookup exception: {e}")

        try:
            (gemini_result, gemini_ms) = future_gem.result(timeout=3.5)
            logger.info(f"[UNIFIED-SCAN][{req_id}] Gemini completed: {gemini_ms}ms (status={gemini_result.get('status')})")
        except concurrent.futures.TimeoutError:
            gemini_result = {"available": False, "status": "timeout", "risk_score": 0, "signals": ["Gemini AI analysis timed out; baseline secured via local heuristics."]}
            gemini_ms = 3500.0
            logger.warning(f"[UNIFIED-SCAN][{req_id}] Gemini analysis timed out")
        except Exception as e:
            gemini_result = {"available": False, "status": "unavailable", "risk_score": 0, "signals": [], "error": str(e)}
            gemini_ms = 0.0
            logger.error(f"[UNIFIED-SCAN][{req_id}] Gemini analysis exception: {e}")

        # Handle OCR text if from image
        if input_type in ["image", "screenshot", "qr"] and gemini_result.get("ocr_text"):
            try:
                ocr_text = gemini_result["ocr_text"].strip()
                if ocr_text:
                    ml_result = ml_service.predict(ocr_text, model_id=model_id)
            except Exception as e:
                logger.error(f"[UNIFIED-SCAN][{req_id}] Post-OCR ML prediction error: {e}")

        # Include Gemini suspicious phrases into evidence_list
        if gemini_result.get("suspicious_phrases"):
            for sp in gemini_result["suspicious_phrases"]:
                if isinstance(sp, dict):
                    evidence_list.append({
                        "phrase": sp.get("phrase", ""),
                        "category": sp.get("severity", "AI Threat Indicator"),
                        "reason": sp.get("reason", "Identified by AI threat analysis")
                    })
                elif isinstance(sp, str):
                    evidence_list.append({
                        "phrase": sp,
                        "category": "AI Threat Indicator",
                        "reason": "Identified by AI threat analysis"
                    })

        # -------------------------------------------------------------
        # 4. Risk Engine Aggregation & Calibration
        # -------------------------------------------------------------
        t_risk_start = time.perf_counter()
        logger.info(f"[UNIFIED-SCAN][{req_id}] risk engine calculating...")

        active_weights = {}
        active_scores = {}

        if ml_result.get("available"):
            active_weights["ml"] = 0.35
            active_scores["ml"] = ml_result.get("risk_score", 0)

        if gemini_result.get("available"):
            active_weights["gemini"] = 0.30
            active_scores["gemini"] = gemini_result.get("risk_score", 0)

        if vt_result.get("available"):
            active_weights["virustotal"] = 0.20
            active_scores["virustotal"] = vt_result.get("risk_score", 0)

        if heuristic_result.get("signals"):
            active_weights["heuristics"] = 0.15
            active_scores["heuristics"] = heuristic_result.get("risk_score", 0)

        if not active_weights:
            overall_risk = ml_result.get("risk_score", 0)
        else:
            total_weight = sum(active_weights.values())
            weighted_sum = sum(active_scores[k] * (active_weights[k] / total_weight) for k in active_weights)
            overall_risk = int(round(weighted_sum))

        # Security Override: If VirusTotal flagged malicious engines, anchor to high/critical
        vt_malicious_count = vt_result.get("stats", {}).get("malicious", 0)
        if vt_malicious_count >= 2:
            overall_risk = max(overall_risk, 85)
        elif vt_malicious_count == 1:
            overall_risk = max(overall_risk, 70)

        # Local High-Confidence Override: Credential harvesting + Suspicious URL
        has_credential_evidence = any("credential" in str(e.get("category", "")).lower() or "credential" in str(e.get("reason", "")).lower() for e in evidence_list)
        if has_credential_evidence and target_url and overall_risk < 65:
            overall_risk = max(overall_risk, 68)

        overall_risk = max(0, min(100, overall_risk))

        # -------------------------------------------------------------
        # 5. Semantic Risk Levels (0-20 SAFE, 21-40 LOW, 41-60 SUSPICIOUS, 61-80 HIGH, 81-100 CRITICAL)
        # -------------------------------------------------------------
        if overall_risk <= 20:
            risk_level = "safe"
        elif overall_risk <= 40:
            risk_level = "low"
        elif overall_risk <= 60:
            risk_level = "suspicious"
        elif overall_risk <= 80:
            risk_level = "high"
        else:
            risk_level = "critical"

        # Determine primary threat classification
        if vt_malicious_count > 0 or "phishing" in str(gemini_result.get("classification", "")).lower() or has_credential_evidence:
            classification = "phishing"
        elif ml_result.get("is_spam") or "spam" in str(gemini_result.get("classification", "")).lower():
            classification = "spam"
        elif any("urgency" in str(s).lower() or "threat" in str(s).lower() for s in heuristic_result.get("signals", [])):
            classification = "social_engineering"
        elif overall_risk > 30:
            classification = "suspicious_communication"
        else:
            classification = "legitimate"

        top_status = "completed"
        if input_type == "url" and (not vt_result.get("available") or vt_result.get("status") in ["unavailable", "timeout"]):
            top_status = "unavailable"
            if risk_level == "safe":
                risk_level = "suspicious"
            if classification in ["legitimate", "safe"]:
                classification = "unverified_url"

        # -------------------------------------------------------------
        # 6. Structured Red Flag System (Section 9)
        # -------------------------------------------------------------
        red_flags: List[Dict[str, Any]] = []

        # A. Suspicious URL Flag
        if target_url and (heuristic_result.get("risk_score", 0) >= 40 or vt_result.get("risk_score", 0) >= 30):
            url_reasons = [s for s in heuristic_result.get("signals", []) if "URL" in s]
            red_flags.append({
                "id": "suspicious_url",
                "title": "Suspicious URL",
                "color": "rose",
                "severity": "critical" if vt_malicious_count > 0 or heuristic_result.get("risk_score", 0) >= 70 else "high",
                "why_it_matters": "Directs users to unverified external domains that may harvest login credentials, infect devices, or host deceptive replicas.",
                "evidence": target_url,
                "source": "VirusTotal Threat Intel" if vt_result.get("available") else "Local Deterministic URL Engine",
                "risk_contribution": max(30, int(vt_result.get("risk_score", 0) * 0.4) + int(heuristic_result.get("risk_score", 0) * 0.4))
            })

        # B. Urgency Manipulation Flag
        urgency_ev = [e for e in evidence_list if "urgency" in str(e.get("category", "")).lower() or "urgency" in str(e.get("reason", "")).lower()]
        if urgency_ev or any("urgency" in str(s).lower() for s in gemini_result.get("signals", [])):
            sample_phrase = urgency_ev[0].get("phrase", "") if urgency_ev else "Artificial strict deadline detected"
            red_flags.append({
                "id": "urgency_manipulation",
                "title": "Urgency Manipulation",
                "color": "amber",
                "severity": "high",
                "why_it_matters": "Attackers manufacture artificial deadlines (e.g. 'account suspension within 24h') to trigger panic and bypass critical rational evaluation.",
                "evidence": sample_phrase,
                "source": "Local Linguistic Engine" if urgency_ev else "Gemini AI Threat Analysis",
                "risk_contribution": 25
            })

        # C. Credential Request Flag
        cred_ev = [e for e in evidence_list if "credential" in str(e.get("category", "")).lower() or "credential" in str(e.get("reason", "")).lower() or "password" in str(e.get("phrase", "")).lower()]
        if cred_ev:
            sample_phrase = cred_ev[0].get("phrase", "")
            red_flags.append({
                "id": "credential_request",
                "title": "Credential Request",
                "color": "rose",
                "severity": "critical",
                "why_it_matters": "Legitimate services almost never demand password re-entry or credential verification via unsolicited links or email prompts.",
                "evidence": sample_phrase,
                "source": "Deterministic Heuristics Engine",
                "risk_contribution": 35
            })

        # D. Financial Request / Lure Flag
        fin_ev = [e for e in evidence_list if "financial" in str(e.get("category", "")).lower() or "prize" in str(e.get("category", "")).lower()]
        if fin_ev:
            sample_phrase = fin_ev[0].get("phrase", "")
            red_flags.append({
                "id": "financial_request",
                "title": "Financial Solicitation / Lure",
                "color": "amber",
                "severity": "high",
                "why_it_matters": "Soliciting wire payments, cryptocurrency, fee prepayments, or enticing with unexpected lotteries is a hallmark of fraud.",
                "evidence": sample_phrase,
                "source": "Linguistic Signal Engine",
                "risk_contribution": 25
            })

        # E. Possible Impersonation Flag
        if input_type == "email" and email_data and (email_data.get("from") != email_data.get("reply_to")):
            red_flags.append({
                "id": "possible_impersonation",
                "title": "Sender / Reply-To Mismatch",
                "color": "purple",
                "severity": "high",
                "why_it_matters": "The 'Reply-To' header directs your responses to an attacker-controlled address different from the purported corporate sender domain.",
                "evidence": f"From: {email_data.get('from')} ➔ Reply-To: {email_data.get('reply_to')}",
                "source": "RFC 5322 Header Inspector",
                "risk_contribution": 25
            })
        elif gemini_result.get("brand_impersonated"):
            red_flags.append({
                "id": "possible_impersonation",
                "title": f"Possible Impersonation: {gemini_result.get('brand_impersonated')}",
                "color": "purple",
                "severity": "high",
                "why_it_matters": f"Visual indicators or message structure imitate legitimate communications from {gemini_result.get('brand_impersonated')}.",
                "evidence": gemini_result.get("brand_impersonated"),
                "source": "Gemini AI Threat Analysis",
                "risk_contribution": 30
            })

        # F. Social Engineering Tactics Flag
        if gemini_result.get("social_engineering_tactics"):
            tactics = ", ".join(gemini_result["social_engineering_tactics"][:3])
            red_flags.append({
                "id": "social_engineering",
                "title": "Social Engineering",
                "color": "rose",
                "severity": "medium",
                "why_it_matters": "Uses psychological persuasion techniques like authority posturing, fear coercion, or false rewards to manipulate recipient actions.",
                "evidence": tactics,
                "source": "Gemini Behavioral Model",
                "risk_contribution": 20
            })

        # -------------------------------------------------------------
        # 7. Safe Checks (Section 8: For low risk content)
        # -------------------------------------------------------------
        safe_checks: List[str] = []
        if overall_risk <= 40:
            if not target_url:
                safe_checks.append("No suspicious URL detected")
            elif vt_malicious_count == 0 and heuristic_result.get("risk_score", 0) <= 20:
                safe_checks.append("URL verified clean across security checks")
            if not cred_ev:
                safe_checks.append("No credential harvesting signals found")
            if not urgency_ev:
                safe_checks.append("No artificial urgency or coercion pressure")
            if not ml_result.get("is_spam"):
                safe_checks.append("Supervised NLP model matched natural conversational patterns")

        # -------------------------------------------------------------
        # 8. Contextual "What Should I Do?" Action Plan (Sections 20-23)
        # -------------------------------------------------------------
        dos: List[str] = []
        donts: List[str] = []

        if classification == "phishing" or overall_risk >= 60:
            donts.append("Don't click any link or open attached files")
            donts.append("Don't enter your password, PIN, or payment details")
            donts.append("Don't reply to the sender or call numbers in the message")
            dos.append("Verify independently: Open the organization's official app or type their verified website manually into your browser")
            dos.append("Report and mark this message as phishing or spam in your provider")
        elif classification == "spam":
            donts.append("Don't click unsubscribe links in unrecognized spam messages (this confirms your active address)")
            donts.append("Don't engage or purchase promoted offers")
            dos.append("Block the sender and delete the message")
        elif overall_risk > 30:
            donts.append("Don't provide sensitive personal data before verifying sender authenticity")
            dos.append("Inspect sender details and embedded link addresses carefully")
        else:
            dos.append("Content appears normal; continue standard routine digital hygiene")
            dos.append("Always exercise normal caution when sharing sensitive personal information")

        safer_alternative = "Instead of clicking links in unexpected communications, open the organization's verified mobile application directly or type their established website URL into a new browser tab."

        action_plan = {
            "dos": dos,
            "donts": donts,
            "safer_alternative": safer_alternative,
            "before_you_click": "Verify domain spelling and SSL certificate. Never enter credentials on pages opened through unsolicited message links." if target_url else None,
            "before_you_scan": "Inspect the decoded destination domain before visiting. Attackers use QR codes to bypass visual email scanner filters." if input_type in ["qr", "image"] else None,
            "already_clicked_options": [
                {"scenario": "I clicked the link", "step": "Close the tab immediately. Do not submit any forms or allow file downloads."},
                {"scenario": "I entered my password", "step": "Immediately change your password from a separate trusted device and enable 2-Factor Authentication (2FA)."},
                {"scenario": "I entered financial information", "step": "Contact your bank or credit card company immediately via the number on your physical card to freeze the account."},
                {"scenario": "I downloaded a file", "step": "Do NOT open the file. Disconnect from Wi-Fi, delete the file, and run a full antivirus scan."},
                {"scenario": "I replied to the sender", "step": "Cease all further communication. Block the sender and monitor for secondary targeted phishing."}
            ]
        }

        # Recommendations for backwards compatibility
        recommendations: List[str] = []
        if gemini_result.get("recommendations"):
            recommendations.extend(gemini_result["recommendations"][:4])
        else:
            recommendations.extend(donts[:2])
            recommendations.extend(dos[:2])

        # -------------------------------------------------------------
        # 9. Confidence Calculation (Phase 10 & 13)
        # -------------------------------------------------------------
        avail_sources = [
            ml_result.get("available", False),
            gemini_result.get("available", False),
            (vt_result.get("available", False) if target_url else True)
        ]
        num_available = sum(1 for a in avail_sources if a)

        # Baseline confidence from available sources
        if num_available >= 3:
            confidence = "HIGH"
        elif num_available == 2:
            confidence = "MEDIUM"
        else:
            confidence = "LIMITED"

        # Disagreement detection (Phase 10 & Phase 13)
        ml_score = ml_result.get("risk_score", 0)
        gem_score = gemini_result.get("risk_score", 0)
        has_disagreement = False

        if ml_result.get("available") and gemini_result.get("available"):
            if abs(ml_score - gem_score) >= 50:
                has_disagreement = True
                
        if ml_result.get("model_disagreement"):
            has_disagreement = True

        if has_disagreement:
            if confidence == "HIGH":
                confidence = "MEDIUM"
            elif confidence == "MEDIUM":
                confidence = "LIMITED"
            logger.info(f"[UNIFIED-SCAN][{req_id}] Signal/Model disagreement detected; confidence adjusted to {confidence}")

        # If external services failed/timed out, mark analysis as limited
        if not gemini_result.get("available") and target_url and not vt_result.get("available"):
            confidence = "LIMITED"

        t_risk_ms = round((time.perf_counter() - t_risk_start) * 1000, 2)
        total_time_ms = round((time.perf_counter() - t_start) * 1000, 2)
        logger.info(f"[UNIFIED-SCAN][{req_id}] completed TOTAL={total_time_ms}ms risk={overall_risk} ({risk_level})")

        # Telemetry breakdown for Expert Mode
        calculation_breakdown = {
            "ml_signal": {
                "source": "Scikit-Learn Classifier (UCI Corpus)",
                "score": ml_result.get("risk_score", 0),
                "weight_percent": int(round(active_weights.get("ml", 0) / max(0.01, sum(active_weights.values())) * 100)) if "ml" in active_weights else 0,
                "available": ml_result.get("available", False),
                "summary": f"{ml_result.get('model', 'Model')}: {round(ml_result.get('probability', 0)*100, 1)}% spam probability"
            },
            "ai_signal": {
                "source": "Google Gemini Security Model",
                "score": gemini_result.get("risk_score", 0),
                "weight_percent": int(round(active_weights.get("gemini", 0) / max(0.01, sum(active_weights.values())) * 100)) if "gemini" in active_weights else 0,
                "available": gemini_result.get("available", False),
                "summary": gemini_result.get("summary", "Gemini linguistic & social engineering assessment")
            },
            "threat_intelligence": {
                "source": "VirusTotal v3 Intelligence",
                "score": vt_result.get("risk_score", 0),
                "weight_percent": int(round(active_weights.get("virustotal", 0) / max(0.01, sum(active_weights.values())) * 100)) if "virustotal" in active_weights else 0,
                "available": vt_result.get("available", False),
                "summary": f"Scanned by {vt_result.get('stats', {}).get('total_engines', 0)} security engines ({vt_malicious_count} malicious)" if vt_result.get("available") else "No external links evaluated"
            },
            "heuristics": {
                "source": "Deterministic Heuristics Engine",
                "score": heuristic_result.get("risk_score", 0),
                "weight_percent": int(round(active_weights.get("heuristics", 0) / max(0.01, sum(active_weights.values())) * 100)) if "heuristics" in active_weights else 0,
                "available": True,
                "summary": f"{len(heuristic_result.get('signals', []))} deterministic rules triggered"
            }
        }

        local_signals_data = {
            "available": True,
            "status": "available",
            "risk_score": heuristic_result.get("risk_score", 0),
            "signals": local_signals_list,
            "reasons": heuristic_result.get("signals", [])
        }

        return {
            "risk_score": overall_risk,
            "risk_level": risk_level,
            "classification": classification,
            "confidence": confidence,
            "status": top_status,
            "input_type": input_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "ml": ml_result,
            "gemini": gemini_result,
            "virustotal": vt_result,
            "heuristics": heuristic_result,
            "local_signals": local_signals_data,
            "evidence": evidence_list,
            "red_flags": red_flags,
            "action_plan": action_plan,
            "safe_checks": safe_checks,
            "recommendations": recommendations,
            "sources": {
                "ml": "available" if ml_result.get("available") else "unavailable",
                "gemini": "available" if gemini_result.get("available") else "unavailable",
                "virustotal": "available" if vt_result.get("available") else "unavailable",
                "local_engine": "available",
                "heuristics": "available"
            },
            "calculation_breakdown": calculation_breakdown,
            "request_id": req_id,
            "execution_time_ms": total_time_ms,
            "timings": {
                "parsing_ms": t_parse_ms,
                "ml_ms": ml_ms,
                "virustotal_ms": vt_ms,
                "gemini_ms": gemini_ms,
                "risk_calc_ms": t_risk_ms,
                "total_ms": total_time_ms
            }
        }

# Singleton instance
risk_engine = RiskEngine()
