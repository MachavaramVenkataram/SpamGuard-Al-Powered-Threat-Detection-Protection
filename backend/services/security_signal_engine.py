"""
SpamGuard Local Security Signal Engine
Performs deterministic, rule-based security inspections on URLs, text payloads, and email headers.
No external network dependencies — executes in <1ms with zero leakage.
"""

import re
import urllib.parse
from typing import Dict, Any, List, Optional

KNOWN_SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
    "buff.ly", "cutt.ly", "rb.gy", "rebrand.ly", "shorturl.at", "soo.gd",
    "linktr.ee", "bl.ink", "snip.ly"
}

SUSPICIOUS_TLDS = {
    ".xyz", ".top", ".tk", ".ml", ".ga", ".cf", ".gq", ".work",
    ".click", ".loan", ".live", ".guru", ".surf", ".monster", ".cam",
    ".support", ".buzz", ".fit", ".rest", ".racing", ".country", ".stream"
}

SUSPICIOUS_PATH_KEYWORDS = {
    "login", "signin", "verify", "verification", "secure", "security",
    "account", "banking", "wallet", "update", "password", "authenticate",
    "confirm", "claim", "prize", "invoice", "refund", "suspend", "unlock",
    "validate", "reset", "billing", "signin-flow", "auth", "otp", "checkout"
}

POPULAR_BRANDS = [
    "paypal", "apple", "google", "microsoft", "amazon", "netflix",
    "facebook", "instagram", "chase", "wellsfargo", "bankofamerica",
    "dhl", "fedex", "usps", "ups", "coinbase", "binance"
]

class SecuritySignalEngine:
    """Deterministic local security signal analysis for URLs and text."""

    def __init__(self):
        # Regex trigger sets for text analysis
        self.urgency_patterns = [
            (r"\b(?:immediately|urgent(?:ly)?|act now|instant(?:ly)?)\b", "Immediate action pressure", 85),
            (r"\bwithin (?:24|12|48|2) (?:hours?|hrs?)\b", "Artificial strict time limit", 90),
            (r"\b(?:account (?:will be |has been )?(?:suspended|locked|restricted|terminated|frozen))\b", "Account punitive threat", 95),
            (r"\b(?:final notice|last warning|immediate attention required)\b", "Escalated urgency indicator", 88),
            (r"\b(?:unauthorized (?:access|sign-in|activity|charges?))\b", "Panic induction via security scare", 85),
            (r"\b(?:verify now|act now|click now|confirm now|resolve now)\b", "Urgent action pressure", 85)
        ]

        self.credential_patterns = [
            (r"\b(?:enter|confirm|verify|update|reset) your (?:password|passcode|pin|credentials?)\b", "Direct credential harvesting request", 95),
            (r"\b(?:ssn|social security (?:number)?|tax id)\b", "Sensitive national identity number requested", 98),
            (r"\b(?:credit card|debit card|cvv|expir(?:y|ation) date)\b", "Payment card data harvesting request", 95),
            (r"\b(?:one[- ]time (?:password|passcode|pin)|otp)\b", "Multi-factor authentication interception risk", 92)
        ]

        self.financial_patterns = [
            (r"\b(?:wire transfer|western union|moneygram|crypto(?:currency)?|bitcoin|usdt|eth)\b", "Irreversible payment method solicitation", 90),
            (r"\b(?:lottery|unclaimed (?:funds|inheritance|prize|grant)|compensation fund)\b", "Advance-fee / lottery reward deception", 94),
            (r"\b(?:overdue invoice|payment outstanding|unpaid balance|tax refund)\b", "Financial coercion / false debt lure", 85),
            (r"\b(?:claim your (?:cash|reward|bonus|gift card|\$\d+))\b", "Unsolicited monetary reward inducement", 88),
            (r"\b(?:fraud alert|security alert|debit(?: transaction)?|pending charge|\$\d+(?:\.\d{2})?)\b", "Financial panic lure", 85)
        ]

        self.social_engineering_patterns = [
            (r"\b(?:dear (?:customer|user|client|valued member|friend))\b", "Impersonal generic greeting typical of mass campaigns", 65),
            (r"\b(?:do not share this (?:code|message|link) with anyone)\b", "Anti-verification secrecy coercion", 80),
            (r"\b(?:click (?:here|the link below|this button) to (?:verify|unlock|reactivate))\b", "Coercive call-to-action funnel", 85),
            (r"\b(?:confidential|strictly private|do not disclose)\b", "Artificial confidentiality barrier", 75)
        ]

        self.threat_patterns = [
            (r"\b(?:legal action|law enforcement|arrest warrant|fbi|irs|police)\b", "Authoritarian intimidation threat", 96),
            (r"\b(?:lawsuit|court summons|penalt(?:y|ies)|fine of \$\d+)\b", "Fabricated legal coercion", 92)
        ]

    def analyze_url(self, raw_url: str) -> Dict[str, Any]:
        """
        Deep deterministic inspection of a single URL string.
        Returns structured signals, score, and individual heuristics.
        """
        raw_url = raw_url.strip()
        if not raw_url.startswith(("http://", "https://")):
            test_url = "http://" + raw_url
        else:
            test_url = raw_url

        try:
            parsed = urllib.parse.urlparse(test_url)
        except Exception:
            return {
                "risk_score": 80,
                "severity": "high",
                "signals": [{
                    "signal": "malformed_url",
                    "severity": "high",
                    "score": 80,
                    "reason": "URL syntax is malformed or unparseable."
                }],
                "details": {"url": raw_url, "valid": False}
            }

        hostname = (parsed.hostname or "").lower()
        protocol = parsed.scheme.lower()
        path = parsed.path or "/"
        query = parsed.query or ""
        full_dest = parsed.netloc + path + ("?" + query if query else "")

        signals: List[Dict[str, Any]] = []
        evidence: List[Dict[str, Any]] = []
        base_score = 5

        # 1. Suspicious URL Length
        if len(raw_url) > 100:
            signals.append({
                "signal": "excessive_length",
                "severity": "medium",
                "score": 70,
                "reason": f"Abnormally long URL ({len(raw_url)} characters) frequently used to conceal redirection targets."
            })
            evidence.append({
                "phrase": raw_url[:50] + "...",
                "category": "Excessive Length",
                "reason": "Abnormally long URL concealing redirect destination"
            })
            base_score += 20
        elif len(raw_url) > 75:
            base_score += 10

        # 2. IP-based host check
        ip_pattern = r"^(?:\d{1,3}\.){3}\d{1,3}$"
        if re.match(ip_pattern, hostname):
            signals.append({
                "signal": "ip_address_host",
                "severity": "critical",
                "score": 95,
                "reason": f"Direct numeric IP address ({hostname}) bypasses standard domain name reputation systems."
            })
            evidence.append({
                "phrase": hostname,
                "category": "IP Host Indicator",
                "reason": "Direct numeric IP host bypasses DNS registration"
            })
            base_score += 45

        # 3. Protocol check
        if protocol != "https":
            signals.append({
                "signal": "insecure_http",
                "severity": "medium",
                "score": 60,
                "reason": "Cleartext HTTP protocol lacks cryptographic SSL/TLS verification."
            })
            evidence.append({
                "phrase": "http://",
                "category": "Insecure Protocol",
                "reason": "Unencrypted cleartext HTTP lacks SSL/TLS verification"
            })
            base_score += 20

        # 4. URL Shortener detection
        if hostname in KNOWN_SHORTENERS:
            signals.append({
                "signal": "url_shortener",
                "severity": "medium",
                "score": 65,
                "reason": f"Known URL shortening service ({hostname}) conceals the ultimate landing domain."
            })
            evidence.append({
                "phrase": hostname,
                "category": "URL Shortener",
                "reason": f"Shortener service {hostname} conceals destination"
            })
            base_score += 25

        # 5. Suspicious TLD
        matched_tld = None
        for tld in SUSPICIOUS_TLDS:
            if hostname.endswith(tld):
                matched_tld = tld
                break
        if matched_tld:
            signals.append({
                "signal": "suspicious_tld",
                "severity": "high",
                "score": 80,
                "reason": f"High-abuse top-level domain extension ({matched_tld}) commonly leveraged in disposable phishing campaigns."
            })
            evidence.append({
                "phrase": matched_tld,
                "category": "Suspicious TLD",
                "reason": f"High-abuse top-level domain {matched_tld}"
            })
            base_score += 25

        # 6. Excessive subdomains (masquerading)
        parts = hostname.split(".")
        subdomain_count = len(parts) - 2 if len(parts) > 2 else 0
        if subdomain_count >= 3:
            signals.append({
                "signal": "excessive_subdomains",
                "severity": "high",
                "score": 85,
                "reason": f"Complex subdomain hierarchy ({subdomain_count} nested levels) characteristic of multi-tenant domain impersonation."
            })
            evidence.append({
                "phrase": hostname,
                "category": "Subdomain Hierarchy",
                "reason": f"{subdomain_count} nested subdomains characteristic of impersonation"
            })
            base_score += 30
        elif subdomain_count == 2:
            base_score += 10

        # 7. Brand Impersonation in subdomain/path
        for brand in POPULAR_BRANDS:
            # Check if brand appears in hostname but is NOT the apex domain
            if brand in hostname:
                apex = ".".join(parts[-2:]) if len(parts) >= 2 else hostname
                if not apex.startswith(brand + "."):
                    signals.append({
                        "signal": "brand_masquerade",
                        "severity": "critical",
                        "score": 95,
                        "reason": f"Targeted impersonation of brand '{brand.title()}' embedded inside an unrelated domain ({hostname})."
                    })
                    evidence.append({
                        "phrase": brand,
                        "category": "Brand Impersonation",
                        "reason": f"Brand {brand.title()} used inside unrelated host {hostname}"
                    })
                    base_score += 45
                    break

        # 8. Credential & Auth Related Paths
        path_lower = path.lower()
        found_kw = [kw for kw in SUSPICIOUS_PATH_KEYWORDS if kw in path_lower]
        if found_kw:
            signals.append({
                "signal": "credential_path",
                "severity": "high",
                "score": 80,
                "reason": f"Path contains security-sensitive authentication triggers ({', '.join(found_kw[:3])})."
            })
            for kw in found_kw[:2]:
                evidence.append({
                    "phrase": kw,
                    "category": "Credential Path Keyword",
                    "reason": f"Authentication keyword '{kw}' in URL path"
                })
            base_score += 25

        # 9. Hex / URL Encoded Characters in Query/Path
        if "%" in path or "%" in query:
            signals.append({
                "signal": "encoded_payload",
                "severity": "medium",
                "score": 65,
                "reason": "URL contains percent-encoded hex sequences frequently used to obfuscate payloads from static web filters."
            })
            base_score += 15

        # 10. Unicode / Homograph Indicators (Punycode)
        if hostname.startswith("xn--") or any(ord(c) > 127 for c in raw_url):
            signals.append({
                "signal": "homograph_punycode",
                "severity": "critical",
                "score": 92,
                "reason": "Punycode (xn--) or non-ASCII characters detected, suggesting an IDN homograph visual spoofing attack."
            })
            evidence.append({
                "phrase": "xn--",
                "category": "Homograph Punycode",
                "reason": "IDN visual homograph spoofing pattern"
            })
            base_score += 40

        clamped_score = min(100, max(0, base_score))
        severity = "safe"
        if clamped_score >= 80:
            severity = "critical"
        elif clamped_score >= 60:
            severity = "high"
        elif clamped_score >= 35:
            severity = "suspicious"
        elif clamped_score >= 20:
            severity = "low"

        return {
            "risk_score": clamped_score,
            "severity": severity,
            "signals": signals,
            "evidence": evidence,
            "details": {
                "hostname": hostname,
                "protocol": protocol,
                "path": path,
                "is_https": protocol == "https",
                "subdomain_count": subdomain_count,
                "is_shortened": hostname in KNOWN_SHORTENERS,
                "tld": matched_tld
            }
        }

    def analyze_text(self, text: str) -> Dict[str, Any]:
        """
        Deep deterministic inspection of text content.
        Identifies urgency, financial lures, credential demands, threats,
        excessive capitalization, and social engineering patterns.
        """
        if not text or not text.strip():
            return {
                "risk_score": 0,
                "severity": "safe",
                "signals": [],
                "evidence": []
            }

        signals: List[Dict[str, Any]] = []
        evidence: List[Dict[str, Any]] = []
        base_score = 0

        # 1. Urgency Patterns
        for pat, reason, score in self.urgency_patterns:
            matches = list(re.finditer(pat, text, re.IGNORECASE))
            if matches:
                signals.append({
                    "signal": "urgency",
                    "severity": "high" if score >= 85 else "medium",
                    "score": score,
                    "reason": reason
                })
                base_score += 25
                for m in matches[:2]:
                    evidence.append({
                        "phrase": m.group(0),
                        "category": "Urgency Trigger",
                        "reason": reason,
                        "start": m.start(),
                        "end": m.end()
                    })
                break

        # 2. Credential Harvesting Patterns
        for pat, reason, score in self.credential_patterns:
            matches = list(re.finditer(pat, text, re.IGNORECASE))
            if matches:
                signals.append({
                    "signal": "credential_request",
                    "severity": "critical",
                    "score": score,
                    "reason": reason
                })
                base_score += 35
                for m in matches[:2]:
                    evidence.append({
                        "phrase": m.group(0),
                        "category": "Credential Harvesting",
                        "reason": reason,
                        "start": m.start(),
                        "end": m.end()
                    })
                break

        # 3. Financial Lures
        for pat, reason, score in self.financial_patterns:
            matches = list(re.finditer(pat, text, re.IGNORECASE))
            if matches:
                signals.append({
                    "signal": "financial_intent",
                    "severity": "high",
                    "score": score,
                    "reason": reason
                })
                base_score += 25
                for m in matches[:2]:
                    evidence.append({
                        "phrase": m.group(0),
                        "category": "Financial Lure",
                        "reason": reason,
                        "start": m.start(),
                        "end": m.end()
                    })
                break

        # 4. Social Engineering Language
        for pat, reason, score in self.social_engineering_patterns:
            matches = list(re.finditer(pat, text, re.IGNORECASE))
            if matches:
                signals.append({
                    "signal": "social_engineering",
                    "severity": "medium",
                    "score": score,
                    "reason": reason
                })
                base_score += 15
                for m in matches[:2]:
                    evidence.append({
                        "phrase": m.group(0),
                        "category": "Social Engineering",
                        "reason": reason,
                        "start": m.start(),
                        "end": m.end()
                    })
                break

        # 5. Authoritarian Threats
        for pat, reason, score in self.threat_patterns:
            matches = list(re.finditer(pat, text, re.IGNORECASE))
            if matches:
                signals.append({
                    "signal": "intimidation_threat",
                    "severity": "critical",
                    "score": score,
                    "reason": reason
                })
                base_score += 30
                for m in matches[:2]:
                    evidence.append({
                        "phrase": m.group(0),
                        "category": "Intimidation Threat",
                        "reason": reason,
                        "start": m.start(),
                        "end": m.end()
                    })
                break

        # 6. Excessive Capitalization
        letters = [c for c in text if c.isalpha()]
        if len(letters) >= 12:
            upper_ratio = sum(1 for c in letters if c.isupper()) / len(letters)
            if upper_ratio >= 0.45:
                signals.append({
                    "signal": "excessive_capitalization",
                    "severity": "medium",
                    "score": 65,
                    "reason": f"High uppercase density ({round(upper_ratio*100, 1)}%) used to manufacture urgency or alarm."
                })
                base_score += 15

        # 7. Suspicious Punctuation Clumping
        if re.search(r"[!?]{2,}", text):
            signals.append({
                "signal": "suspicious_punctuation",
                "severity": "low",
                "score": 50,
                "reason": "Repeated exclamation/question marks indicative of aggressive promotional or scare tactics."
            })
            base_score += 10

        clamped_score = min(100, max(0, base_score))
        severity = "safe"
        if clamped_score >= 80:
            severity = "critical"
        elif clamped_score >= 60:
            severity = "high"
        elif clamped_score >= 35:
            severity = "suspicious"
        elif clamped_score >= 20:
            severity = "low"

        return {
            "risk_score": clamped_score,
            "severity": severity,
            "signals": signals,
            "evidence": evidence
        }

# Singleton instance
security_signal_engine = SecuritySignalEngine()
