import re
import urllib.parse
from typing import Dict, Any, List, Optional
import io

KNOWN_SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
    "buff.ly", "cutt.ly", "rb.gy", "rebrand.ly", "shorturl.at", "soo.gd",
    "linktr.ee", "bl.ink", "snip.ly"
}

SUSPICIOUS_TLDS = {
    ".xyz", ".top", ".tk", ".ml", ".ga", ".cf", ".gq", ".work",
    ".click", ".loan", ".live", ".guru", ".surf", ".monster", ".cam",
    ".support", ".buzz", ".fit", ".rest", ".racing"
}

SUSPICIOUS_PATH_KEYWORDS = {
    "login", "signin", "verify", "verification", "secure", "security",
    "account", "banking", "wallet", "update", "password", "authenticate",
    "confirm", "claim", "prize", "invoice", "refund", "suspend", "unlock",
    "validate", "reset", "billing", "signin-flow", "auth"
}

CREDENTIAL_HARVESTING_TRIGGERS = [
    r"password", r"passcode", r"pin\b", r"ssn\b", r"social security",
    r"credit card", r"debit card", r"cvv", r"security code", r"otp\b",
    r"one[- ]time password", r"enter your credentials", r"confirm your identity"
]

FINANCIAL_SCAM_TRIGGERS = [
    r"wire transfer", r"gift card", r"bitcoin", r"crypto", r"western union",
    r"moneygram", r"urgent payment", r"invoice overdue", r"bank transfer",
    r"unclaimed funds", r"lottery", r"inheritance", r"compensation fund"
]

URGENCY_TRIGGERS = [
    r"immediately", r"within 24 hours", r"account (?:suspended|locked|restricted)",
    r"action required", r"urgent\b", r"final notice", r"immediate response",
    r"temporarily locked", r"unauthorized access", r"terminate(?:d)?"
]

def analyze_single_url(raw_url: str) -> Dict[str, Any]:
    """
    Performs deterministic local heuristic security inspection on a URL.
    Clearly distinguishes local heuristics from external reputation feeds.
    """
    raw_url = raw_url.strip()
    if not raw_url.startswith(("http://", "https://")):
        test_url = "http://" + raw_url
    else:
        test_url = raw_url

    parsed = urllib.parse.urlparse(test_url)
    protocol = parsed.scheme.lower()
    is_https = protocol == "https"
    hostname = (parsed.hostname or "").lower()
    port = parsed.port
    path = parsed.path or "/"
    query = parsed.query or ""

    reasons: List[str] = []
    risk_score = 10  # Baseline neutral

    # 1. Protocol check
    if not is_https:
        risk_score += 25
        reasons.append("Insecure HTTP protocol: Transport layer lacks SSL/TLS encryption.")

    # 2. IP address host check
    ip_pattern = r"^(?:\d{1,3}\.){3}\d{1,3}$"
    is_ip = bool(re.match(ip_pattern, hostname))
    if is_ip:
        risk_score += 40
        reasons.append(f"Host uses raw numeric IP address ({hostname}) rather than a registered domain name.")

    # 3. URL Shortener check
    is_shortened = hostname in KNOWN_SHORTENERS
    shortener_name = hostname if is_shortened else None
    if is_shortened:
        risk_score += 25
        reasons.append(f"Known URL redirection / shortening service ({hostname}) disguises true destination.")

    # 4. TLD analysis
    tld = ""
    for suspicious_tld in SUSPICIOUS_TLDS:
        if hostname.endswith(suspicious_tld):
            tld = suspicious_tld
            risk_score += 20
            reasons.append(f"Domain utilizes high-abuse top-level domain ({suspicious_tld}).")
            break

    # 5. Subdomain hierarchy (subdomain spoofing check)
    parts = hostname.split(".")
    subdomains = parts[:-2] if len(parts) > 2 else []
    subdomain_count = len(subdomains)
    if subdomain_count >= 3:
        risk_score += 25
        reasons.append(f"Excessive subdomain nesting ({subdomain_count} levels) characteristic of domain masquerading.")

    # Brand in subdomain check (e.g. paypal.com.evil.com)
    famous_brands = ["paypal", "apple", "google", "microsoft", "netflix", "amazon", "chase", "wellsfargo", "bankofamerica"]
    for brand in famous_brands:
        if brand in ".".join(subdomains) and not hostname.endswith(f"{brand}.com"):
            risk_score += 35
            reasons.append(f"Well-known trademark '{brand}' appears in subdomain prefix on unrelated parent domain.")
            break

    # 6. Punycode check (homograph attacks)
    has_punycode = "xn--" in hostname
    if has_punycode:
        risk_score += 30
        reasons.append("Punycode (IDN) detected: May indicate visual lookalike spoofing (homograph attack).")

    # 7. Suspicious characters
    has_at_symbol = "@" in raw_url
    if has_at_symbol:
        risk_score += 35
        reasons.append("URL contains '@' symbol: Browser may discard preceding authority and navigate to suffix host.")

    # 8. Path keywords analysis
    lower_path = path.lower()
    path_keywords = [kw for kw in SUSPICIOUS_PATH_KEYWORDS if kw in lower_path]
    if path_keywords:
        risk_score += min(25, len(path_keywords) * 10)
        reasons.append(f"Suspicious path tokens identified: {', '.join(path_keywords[:4])}.")

    # 9. Query parameters inspection
    query_params = urllib.parse.parse_qs(query)
    suspicious_query_keys = ["redirect", "url", "next", "dest", "target", "goto", "return"]
    has_open_redirect = any(k.lower() in query_params for k in suspicious_query_keys)
    if has_open_redirect:
        risk_score += 20
        reasons.append("Query string contains open redirection parameters (e.g. redirect/next/dest).")

    # 10. URL length heuristics
    if len(raw_url) > 100:
        risk_score += 15
        reasons.append(f"Excessive URL character length ({len(raw_url)} chars).")

    # Clamp risk score
    risk_score = min(100, max(0, risk_score))

    # Map to semantic level
    if risk_score <= 25:
        risk_level = "SAFE"
    elif risk_score <= 45:
        risk_level = "LOW_RISK"
    elif risk_score <= 70:
        risk_level = "SUSPICIOUS"
    elif risk_score <= 88:
        risk_level = "HIGH_RISK"
    else:
        risk_level = "CRITICAL"

    return {
        "url": raw_url,
        "normalized_url": test_url,
        "protocol": protocol,
        "is_https": is_https,
        "domain": hostname,
        "tld": tld,
        "subdomains": subdomains,
        "subdomain_count": subdomain_count,
        "path": path,
        "query": query,
        "query_param_count": len(query_params),
        "is_ip_address": is_ip,
        "is_shortened": is_shortened,
        "shortener_service": shortener_name,
        "has_punycode": has_punycode,
        "has_at_symbol": has_at_symbol,
        "suspicious_path_keywords": path_keywords,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "reasons": reasons if reasons else ["No prominent heuristic threat signatures detected."],
        "reputation_source": "Local Deterministic URL Heuristics (Deterministic Security Engine)",
        "components": {
            "protocol": protocol,
            "domain": hostname,
            "path": path,
            "query": query,
            "port": str(port) if port else None,
        }
    }

def analyze_email_payload(
    from_address: str,
    to_address: str,
    subject: str,
    body: str,
    reply_to: str = "",
) -> Dict[str, Any]:
    """
    Performs comprehensive email security analysis combining:
    - Header mismatch heuristics
    - Content threat extraction
    - Embedded URL extraction
    """
    header_flags: List[str] = []
    header_risk = 5

    # 1. From vs Reply-To analysis
    from_domain = ""
    reply_domain = ""
    if "@" in from_address:
        from_domain = from_address.split("@")[-1].strip().lower().rstrip(">")
    if "@" in reply_to:
        reply_domain = reply_to.split("@")[-1].strip().lower().rstrip(">")

    sender_reply_mismatch = False
    if from_domain and reply_domain and from_domain != reply_domain:
        sender_reply_mismatch = True
        header_risk += 45
        header_flags.append(f"Sender / Reply-To Domain Mismatch: From '@{from_domain}' replies to '@{reply_domain}'.")

    # 2. Free email claiming corporate status
    free_providers = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com"]
    corporate_keywords = ["security", "support", "billing", "service", "admin", "paypal", "apple", "bank"]
    is_free_corporate = False
    if from_domain in free_providers:
        for kw in corporate_keywords:
            if kw in from_address.lower() or kw in subject.lower():
                is_free_corporate = True
                header_risk += 35
                header_flags.append(f"Official / security tone sent from public free webmail address ('{from_domain}').")
                break

    # 3. Content heuristics
    full_text = f"{subject}\n{body}".lower()
    
    cred_harvesting = any(re.search(pat, full_text) for pat in CREDENTIAL_HARVESTING_TRIGGERS)
    financial_request = any(re.search(pat, full_text) for pat in FINANCIAL_SCAM_TRIGGERS)
    urgency_detected = any(re.search(pat, full_text) for pat in URGENCY_TRIGGERS)

    content_risk = 10
    content_flags: List[str] = []
    if cred_harvesting:
        content_risk += 35
        content_flags.append("Credential or identity harvesting language detected.")
    if financial_request:
        content_risk += 30
        content_flags.append("Urgent financial transfer, invoice, or prize compensation request.")
    if urgency_detected:
        content_risk += 25
        content_flags.append("Coercive psychological urgency (e.g. account suspension deadline).")

    # 4. Extract embedded URLs
    url_pattern = r"https?://[^\s<>\"']+|www\.[^\s<>\"']+"
    found_urls = re.findall(url_pattern, body)
    analyzed_urls = [analyze_single_url(u) for u in found_urls[:5]]  # Analyze up to top 5

    highest_url_risk = max([u["risk_score"] for u in analyzed_urls], default=0)

    # Header risk clamp
    header_risk = min(100, header_risk)
    content_risk = min(100, content_risk)

    return {
        "header_analysis": {
            "from_domain": from_domain,
            "reply_domain": reply_domain,
            "sender_reply_mismatch": sender_reply_mismatch,
            "free_email_corporate_impersonation": is_free_corporate,
            "header_risk_score": header_risk,
            "header_flags": header_flags,
        },
        "content_analysis": {
            "credential_harvesting_detected": cred_harvesting,
            "financial_request_detected": financial_request,
            "urgency_detected": urgency_detected,
            "content_risk_score": content_risk,
            "content_flags": content_flags,
        },
        "extracted_urls": analyzed_urls,
        "highest_url_risk": highest_url_risk,
        "url_count": len(found_urls),
    }

def detect_qr_code_from_bytes(image_bytes: bytes) -> Dict[str, Any]:
    """
    Uses OpenCV's QRCodeDetector to decode QR codes from image buffer.
    """
    try:
        import cv2
        import numpy as np
        from PIL import Image

        pil_image = Image.open(io.BytesIO(image_bytes))
        width, height = pil_image.size
        img_format = pil_image.format or "UNKNOWN"

        # Convert to OpenCV BGR array
        np_arr = np.frombuffer(image_bytes, np.uint8)
        cv_img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if cv_img is None:
            # Fallback PIL conversion
            cv_img = cv2.cvtColor(np.array(pil_image.convert("RGB")), cv2.COLOR_RGB2BGR)

        detector = cv2.QRCodeDetector()
        data, bbox, _ = detector.detectAndDecode(cv_img)

        has_qr = bool(data and len(data.strip()) > 0)
        qr_url_analysis = None
        if has_qr:
            cleaned_data = data.strip()
            if cleaned_data.startswith(("http://", "https://")) or "." in cleaned_data:
                qr_url_analysis = analyze_single_url(cleaned_data)

        return {
            "has_qr": has_qr,
            "qr_payload": data if has_qr else None,
            "is_url": bool(qr_url_analysis is not None),
            "qr_url_analysis": qr_url_analysis,
            "metadata": {
                "width": width,
                "height": height,
                "format": img_format,
                "size_kb": round(len(image_bytes) / 1024, 2),
            }
        }
    except Exception as e:
        return {
            "has_qr": False,
            "qr_payload": None,
            "error": str(e),
            "metadata": {
                "size_kb": round(len(image_bytes) / 1024, 2),
            }
        }
