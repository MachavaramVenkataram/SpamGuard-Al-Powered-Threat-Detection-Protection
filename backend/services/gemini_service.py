"""
SpamGuard Gemini AI Service
Provides LLM-driven security analysis, multimodal OCR/screenshot inspection,
social engineering analysis, and contextual Security Copilot reasoning.
API key is loaded strictly from the environment; never logged or exposed.
"""

import os
import json
import re
import time
import logging
import concurrent.futures
from typing import Dict, Any, List, Optional

logger = logging.getLogger("spamguard.gemini")

# Shared module-level executor to prevent blocking shutdown on request timeout
_GEMINI_EXECUTOR = concurrent.futures.ThreadPoolExecutor(max_workers=4, thread_name_prefix="gemini_worker")

# Primary and fallback model identifiers
PREFERRED_MODELS = ["gemini-2.5-flash", "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemma-4-26b-a4b-it"]

class GeminiService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "").strip()
        self.client = None
        self.active_model = "gemini-2.5-flash"
        self._health_cache: Optional[Dict[str, Any]] = None
        self._health_cache_time: float = 0.0
        self._quota_exhausted_until: float = 0.0
        self._init_client()

    def _init_client(self):
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not set. Gemini service will run in degraded/mock mode.")
            return

        try:
            from google import genai
            from google.genai import types
            http_opts = types.HttpOptions(
                timeout=4,  # 4 seconds strict socket timeout (integer required by Pydantic)
                retry_options=types.HttpRetryOptions(attempts=1)  # Disable tenacity retries
            )
            self.client = genai.Client(api_key=self.api_key, http_options=http_opts)
            logger.info("Initialized Gemini client with 4s timeout and single-attempt policy.")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            self.client = None

    def check_health(self) -> Dict[str, Any]:
        """Probes Gemini connectivity with cached results to avoid latency spikes and quota exhaustion."""
        now = time.time()
        if self._health_cache and (now - self._health_cache_time < 60.0):
            return dict(self._health_cache)

        if not self.client or not self.api_key:
            res = {
                "status": "unavailable",
                "available": False,
                "model": "none",
                "latency_ms": 0.0,
                "error": "GEMINI_API_KEY is not configured or client failed to initialize."
            }
            self._health_cache = res
            self._health_cache_time = now
            return res

        if now < self._quota_exhausted_until:
            res = {
                "status": "degraded",
                "available": False,
                "model": self.active_model,
                "latency_ms": 0.0,
                "error": "Gemini API cooldown active due to upstream demand/quota."
            }
            self._health_cache = res
            self._health_cache_time = now
            return res

        t0 = time.perf_counter()
        last_error = None

        try:
            from google.genai import types
            cfg = types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0),
                max_output_tokens=10
            )
            response = self.client.models.generate_content(
                model=self.active_model,
                contents="OK",
                config=cfg
            )
            latency = round((time.perf_counter() - t0) * 1000, 2)
            res = {
                "status": "connected",
                "available": True,
                "model": self.active_model,
                "latency_ms": latency,
                "error": None
            }
            self._health_cache = res
            self._health_cache_time = now
            return res
        except Exception as e:
            err_str = str(e)
            last_error = err_str
            logger.warning(f"Gemini health probe failed on {self.active_model}: {e}")
            latency = round((time.perf_counter() - t0) * 1000, 2)
            if "RESOURCE_EXHAUSTED" in err_str or "429" in err_str or "503" in err_str or "UNAVAILABLE" in err_str:
                self._quota_exhausted_until = now + 30.0
                res = {
                    "status": "quota_exhausted",
                    "available": False,
                    "model": self.active_model,
                    "latency_ms": latency,
                    "error": "Gemini API high demand / quota reached."
                }
            else:
                res = {
                    "status": "unavailable",
                    "available": False,
                    "model": "none",
                    "latency_ms": latency,
                    "error": f"API probe failed: {last_error[:100]}"
                }
            self._health_cache = res
            self._health_cache_time = now
            return res

    def _clean_json_markdown(self, raw_text: str) -> str:
        """Strips markdown code fences and extracts the outermost JSON object."""
        text = raw_text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
            text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
        
        # Locate outermost { ... }
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            text = text[start:end+1]
        return text

    def analyze_text(self, text: str, timeout: float = 7.5) -> Dict[str, Any]:
        """
        Performs deep security analysis of a message:
        urgency triggers, social engineering pretexting, financial coercion,
        and provides suspicious phrase breakdowns and mitigation recommendations.
        Strictly enforces timeout to never block request lifecycles.
        """
        if not self.client or not self.api_key:
            return {
                "available": False,
                "status": "unavailable",
                "risk_score": 0,
                "confidence": 0.0,
                "classification": "unknown",
                "summary": "Gemini API unavailable. Relying on local ML & heuristics.",
                "signals": [],
                "suspicious_phrases": [],
                "recommendations": []
            }

        if time.time() < self._quota_exhausted_until:
            return {
                "available": False,
                "status": "unavailable",
                "risk_score": 0,
                "confidence": 0.0,
                "classification": "unknown",
                "summary": "Gemini API quota cooldown active. Relying on local ML and heuristics.",
                "signals": ["AI Analysis temporarily unavailable due to API rate limit."],
                "suspicious_phrases": [],
                "recommendations": []
            }

        prompt = f"""
You are SpamGuard's AI Security Analyst. Analyze the following digital message for communication threats, phishing tactics, spam indicators, and psychological manipulation.

Target Message:
\"\"\"{text}\"\"\"

Return ONLY a valid JSON object with the following schema:
{{
  "risk_score": <integer 0-100 indicating threat severity>,
  "confidence": <float 0.0-1.0 indicating analysis certainty>,
  "classification": <"safe" | "spam" | "phishing" | "scam" | "social_engineering">,
  "urgency_level": <"none" | "low" | "medium" | "high" | "critical">,
  "social_engineering_tactics": [<list of tactics like "urgency manipulation", "authority impersonation", "lottery lure", "fear coercion">],
  "suspicious_phrases": [
    {{
      "phrase": "<exact or partial flagged text>",
      "reason": "<why this phrase is dangerous or deceptive>",
      "severity": "<low | medium | high | critical>"
    }}
  ],
  "summary": "<clear 2-3 sentence executive security summary>",
  "recommendations": [<list of 3-5 concrete defensive steps the recipient should take>]
}}
"""

        def _call_gemini():
            from google.genai import types
            cfg = types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0),
                max_output_tokens=650,
                temperature=0.1,
                response_mime_type="application/json"
            )
            return self.client.models.generate_content(
                model=self.active_model,
                contents=prompt,
                config=cfg
            )

        future = _GEMINI_EXECUTOR.submit(_call_gemini)
        try:
            response = future.result(timeout=timeout)
            raw = response.text or "{}"
            cleaned = self._clean_json_markdown(raw)
            parsed = json.loads(cleaned)

            # Validate and normalize fields
            risk = int(parsed.get("risk_score", 0))
            risk = max(0, min(100, risk))
            conf = float(parsed.get("confidence", 0.8))
            conf = max(0.0, min(1.0, conf))

            signals = []
            for tactic in parsed.get("social_engineering_tactics", []):
                signals.append(f"AI Detected: {tactic}")
            if parsed.get("urgency_level") in ["high", "critical"]:
                signals.append(f"AI Detected: {parsed.get('urgency_level').upper()} urgency pressure")

            return {
                "available": True,
                "status": "available",
                "risk_score": risk,
                "confidence": conf,
                "classification": str(parsed.get("classification", "suspicious")),
                "urgency_level": str(parsed.get("urgency_level", "medium")),
                "social_engineering_tactics": parsed.get("social_engineering_tactics", []),
                "suspicious_phrases": parsed.get("suspicious_phrases", []),
                "summary": str(parsed.get("summary", "Analysis completed by Gemini Security.")),
                "recommendations": parsed.get("recommendations", []),
                "signals": signals
            }
        except concurrent.futures.TimeoutError:
            logger.warning(f"[GEMINI] analyze_text timed out after {timeout}s.")
            return {
                "available": False,
                "status": "timeout",
                "risk_score": 0,
                "confidence": 0.0,
                "classification": "unknown",
                "summary": f"Gemini AI threat analysis reached {timeout}s service limit; baseline secured via local heuristics.",
                "signals": ["AI Analysis timed out; falling back to local ML and threat engines."],
                "suspicious_phrases": [],
                "recommendations": []
            }
        except Exception as e:
            err_str = str(e)
            logger.warning(f"[GEMINI] analyze_text error: {e}")
            if any(term in err_str for term in ["RESOURCE_EXHAUSTED", "429", "503", "UNAVAILABLE", "ConnectTimeout", "timed out"]):
                self._quota_exhausted_until = time.time() + 25.0
                logger.warning("[GEMINI] Upstream throttle or capacity spike detected. Setting 25s cooldown.")
            return {
                "available": False,
                "status": "unavailable",
                "risk_score": 0,
                "confidence": 0.0,
                "classification": "unknown",
                "summary": "External AI service temporarily unavailable. Relying on local ML & deterministic heuristics.",
                "signals": ["AI analysis temporarily unavailable due to upstream service demand."],
                "suspicious_phrases": [],
                "recommendations": []
            }

    def analyze_image(self, image_bytes: bytes, mime_type: str = "image/png", timeout: float = 6.0) -> Dict[str, Any]:
        """
        Multimodal visual analysis of screenshots, fraudulent login forms,
        payment slips, or QR images.
        """
        if not self.client or not self.api_key:
            return {
                "available": False,
                "status": "unavailable",
                "risk_score": 0,
                "ocr_text": "",
                "visual_threats": [],
                "summary": "Gemini multimodal inspection unavailable."
            }

        prompt = """
Analyze this uploaded image / screenshot for cybersecurity threats:
1. Extract any visible text (OCR assistance).
2. Check if this mimics a trusted brand login (Google, PayPal, Apple, Microsoft, Bank, etc.).
3. Check for fake warning banners, malware download prompts, or invoice scams.

Return ONLY a valid JSON object:
{
  "risk_score": <integer 0-100>,
  "confidence": <float 0.0-1.0>,
  "classification": <"clean" | "phishing_form" | "fake_security_alert" | "spam_ad" | "impersonation">,
  "extracted_text": "<text recognized in image>",
  "visual_threats": [<list of detected visual indicators>],
  "brand_impersonated": "<brand name or null>",
  "summary": "<concise explanation of findings>",
  "recommendations": [<defensive recommendations>]
}
"""

        def _call_gemini_image():
            from google.genai import types
            part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            return self.client.models.generate_content(
                model=self.active_model,
                contents=[part, prompt]
            )

        future = _GEMINI_EXECUTOR.submit(_call_gemini_image)
        try:
            response = future.result(timeout=timeout)
            raw = response.text or ""
            cleaned = self._clean_json_markdown(raw)
            parsed = json.loads(cleaned)

            risk = int(parsed.get("risk_score", 0))
            return {
                "available": True,
                "status": "available",
                "risk_score": max(0, min(100, risk)),
                "confidence": float(parsed.get("confidence", 0.85)),
                "classification": str(parsed.get("classification", "clean")),
                "ocr_text": str(parsed.get("extracted_text", "")),
                "visual_threats": parsed.get("visual_threats", []),
                "brand_impersonated": parsed.get("brand_impersonated"),
                "summary": str(parsed.get("summary", "Image evaluated by Gemini Multimodal.")),
                "recommendations": parsed.get("recommendations", [])
            }
        except concurrent.futures.TimeoutError:
            logger.warning(f"[GEMINI] analyze_image timed out after {timeout}s.")
            return {
                "available": False,
                "status": "timeout",
                "risk_score": 0,
                "ocr_text": "",
                "visual_threats": [],
                "summary": f"Image inspection timed out after {timeout}s."
            }
        except Exception as e:
            logger.warning(f"[GEMINI] analyze_image failed: {e}")
            return {
                "available": False,
                "status": "degraded",
                "risk_score": 0,
                "ocr_text": "",
                "visual_threats": [],
                "summary": f"Image analysis error: {e}"
            }

    def copilot_chat(self, user_query: str, scan_context: Dict[str, Any], history: Optional[List[Dict[str, str]]] = None) -> str:
        """
        Interactive Security Copilot chat grounded in actual scan results.
        Will NOT hallucinate or contradict empirical findings.
        """
        if not self.client or not self.api_key:
            # Fallback to local rule-based response
            risk = scan_context.get("risk_score", 0)
            ml_pred = scan_context.get("ml", {}).get("prediction", "unknown")
            return f"[Offline Copilot] Content has an Overall Risk of {risk}/100 ({ml_pred}). Gemini API is currently unavailable."

        context_summary = json.dumps(scan_context, indent=2, default=str)
        prompt = f"""
You are the SpamGuard Security Copilot. You are an expert AI cybersecurity assistant embedded directly inside the SpamGuard SaaS platform.

Your mission is to answer user questions about their current threat scan clearly, concisely, and with high technical accuracy.

GROUNDING RULES:
1. Ground your answers strictly in the provided Scan Context. Do not invent threats or scores that are not in the context.
2. If the user asks "Why is this suspicious?", explain the exact tokens, signals, and heuristics flagged.
3. If the user asks "What should I do?", provide 3-4 numbered defensive steps tailored to the threat severity.
4. If the user asks to explain in simple language, eliminate jargon and explain like speaking to a non-technical family member.
5. If the scan is safe, reassure the user while reinforcing good cybersecurity hygiene.

Scan Context:
\"\"\"{context_summary}\"\"\"

User Question:
\"\"\"{user_query}\"\"\"

Provide your response in crisp, professional GitHub-flavored Markdown. Keep your answer under 150 words unless detailed explanation is specifically asked.
"""

        try:
            response = self.client.models.generate_content(
                model=self.active_model,
                contents=prompt
            )
            return (response.text or "").strip()
        except Exception as e:
            logger.warning(f"Gemini copilot_chat API call failed ({e}); serving local grounded Copilot.")
            return self._local_copilot_fallback(user_query, scan_context)

    def _local_copilot_fallback(self, query: str, scan_context: Dict[str, Any]) -> str:
        """Grounded fallback reasoning generated directly from scan context when Gemini API is rate-limited."""
        q = query.lower()
        risk = scan_context.get("risk_score", 0)
        risk_lvl = scan_context.get("risk_level", "unknown").upper()
        classification = scan_context.get("classification", "content")
        ml = scan_context.get("ml", {})
        vt = scan_context.get("virustotal", {})
        recs = scan_context.get("recommendations", [])

        if any(w in q for w in ["why", "suspicious", "flagged", "warning", "danger"]):
            reasons = []
            if ml.get("is_spam"):
                reasons.append(f"Supervised ML model ({ml.get('model', 'Classifier')}) flagged content as **{ml.get('prediction', 'spam').upper()}** with {round(ml.get('probability', 0)*100, 1)}% probability.")
            for f in ml.get("top_features", [])[:3]:
                if f.get("direction") == "spam":
                    reasons.append(f"High-impact promotional/threat token: **'{f.get('term')}'** (weight {f.get('weight')}).")
            if vt.get("stats", {}).get("malicious", 0) > 0:
                reasons.append(f"VirusTotal threat intelligence confirmed **{vt['stats']['malicious']} security engines** flagged the link as malicious.")
            for s in scan_context.get("heuristics", {}).get("signals", [])[:2]:
                reasons.append(s)

            if not reasons:
                reasons.append("No prominent threat indicators detected. Vocabulary distribution is consistent with standard non-malicious communication.")

            return f"### Why Was This Evaluated as {risk_lvl}?\n\n**Overall Threat Index: {risk} / 100**\n\n" + "\n".join(f"- {r}" for r in reasons)

        elif any(w in q for w in ["what should i do", "action", "recommend", "how to respond"]):
            if recs:
                rec_lines = "\n".join(f"{i+1}. {r}" for i, r in enumerate(recs[:4]))
                return f"### Recommended Safety Protocol\n\n{rec_lines}"
            elif risk >= 50:
                return "### Recommended Safety Protocol\n\n1. Do **NOT** click any embedded hyperlinks or scan QR codes.\n2. Do **NOT** enter passwords, OTP codes, or financial account details.\n3. Verify the sender independently through official phone or web channels.\n4. Mark this item as Junk/Phishing in your client."
            else:
                return "### Recommended Safety Protocol\n\n1. Content appears safe with no active threat indicators.\n2. Proceed with normal business while maintaining standard cybersecurity vigilance."

        elif any(w in q for w in ["simple", "plain", "explain"]):
            if risk >= 60:
                return f"**In plain language:** This message looks like an attack. Someone is trying to pressure or trick you into taking an action that could compromise your accounts or money. **Delete or ignore it.**"
            else:
                return f"**In plain language:** This message appears to be ordinary, legitimate communication. There are no signs of scams, fake urgency, or deceptive links."

        else:
            return f"**Threat Dossier Summary:**\n- Overall Risk Score: **{risk} / 100** ({risk_lvl})\n- Threat Vector: **{classification.replace('_', ' ').title()}**\n- ML Supervised Confidence: **{round(ml.get('probability', 0)*100, 1)}%**\n- External Intelligence: **{'Flagged by VirusTotal engines' if vt.get('stats', {}).get('malicious', 0) > 0 else 'Clean / Unseen'}**"


# Singleton instance
gemini_service = GeminiService()
