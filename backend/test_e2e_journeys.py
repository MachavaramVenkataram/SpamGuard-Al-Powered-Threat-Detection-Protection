"""
Phase 33 - End-to-End User Journeys Test Script
Executes all 5 end-to-end user journeys defined in Phase 33:
- TEST A: Text scan -> verdict -> explanation -> recommendations
- TEST B: Phishing URL -> threat intel -> risk -> protection recommendations
- TEST C: Upload screenshot -> OCR -> text analysis -> result
- TEST D: Upload QR code -> decode -> URL analyze -> result
- TEST E: Analyze email -> ML -> Gemini -> URL intel -> final risk
"""

import sys
import requests
import io
import cv2
import numpy as np

BACKEND_URL = "http://127.0.0.1:8008"

def run_e2e():
    print("=" * 70)
    print("PHASE 33: END-TO-END USER JOURNEYS VALIDATION")
    print("=" * 70)
    all_ok = True

    # TEST A: Plain text scan
    print("\n--- TEST A: Plain Text Security Scan ---")
    res_a = requests.post(
        f"{BACKEND_URL}/unified-scan",
        json={
            "content": "URGENT: Your account has been compromised. Verify your credentials immediately or access will be revoked.",
            "input_type": "text"
        },
        timeout=10
    )
    data_a = res_a.json()
    recs_count = len(data_a.get("recommendations", [])) or len(data_a.get("action_plan", {}).get("dos", []))
    ok_a = (
        res_a.status_code == 200
        and data_a.get("risk_score", 0) > 50
        and "action_plan" in data_a
        and "calculation_breakdown" in data_a
        and recs_count > 0
    )
    print(f"  Result: Status={res_a.status_code}, RiskScore={data_a.get('risk_score')}, Verdict={data_a.get('risk_level')}, Recommendations={recs_count} items")
    all_ok = all_ok and ok_a

    # TEST B: Phishing URL scan
    print("\n--- TEST B: Phishing URL Scan ---")
    res_b = requests.post(
        f"{BACKEND_URL}/analyze-url",
        json={"url": "http://paypal-verification-center.xyz/secure-login/update.php"},
        timeout=10
    )
    data_b = res_b.json()
    ok_b = (
        res_b.status_code == 200
        and data_b.get("risk_score", 0) >= 60
        and len(data_b.get("reasons", [])) > 0
    )
    print(f"  Result: Status={res_b.status_code}, RiskScore={data_b.get('risk_score')}, TLD={data_b.get('tld')}, Reasons={data_b.get('reasons')[:2]}")
    all_ok = all_ok and ok_b

    # TEST C: Upload screenshot / image
    print("\n--- TEST C: Image OCR & Multimodal Analysis ---")
    dummy_img = np.zeros((150, 300, 3), dtype=np.uint8)
    dummy_img[:] = 240
    cv2.putText(dummy_img, "SECURITY ALERT", (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
    _, buf = cv2.imencode(".png", dummy_img)
    files_c = {"file": ("screenshot.png", io.BytesIO(buf.tobytes()), "image/png")}
    res_c = requests.post(f"{BACKEND_URL}/analyze-image", files=files_c, timeout=10)
    data_c = res_c.json()
    ok_c = res_c.status_code == 200 and data_c.get("status") == "success"
    print(f"  Result: Status={res_c.status_code}, StatusField={data_c.get('status')}, Metadata={data_c.get('metadata')}")
    all_ok = all_ok and ok_c

    # TEST D: Upload QR code
    print("\n--- TEST D: QR Code Decode & Destination Intelligence ---")
    # Generate actual QR code using OpenCV
    enc = cv2.QRCodeEncoder_create()
    qr_matrix = enc.encode("https://suspicious-banking-portal.xyz/login")
    resized_qr = cv2.resize(qr_matrix, (200, 200), interpolation=cv2.INTER_NEAREST)
    padded_qr = cv2.copyMakeBorder(resized_qr, 20, 20, 20, 20, cv2.BORDER_CONSTANT, value=255)
    _, qr_buf = cv2.imencode(".png", padded_qr)
    qr_bytes = qr_buf.tobytes()

    files_d = {"file": ("qrcode.png", io.BytesIO(qr_bytes), "image/png")}
    res_d = requests.post(f"{BACKEND_URL}/analyze-image", files=files_d, timeout=10)
    data_d = res_d.json()
    ok_d = res_d.status_code == 200 and data_d.get("has_qr") and data_d.get("is_url")
    print(f"  Result: Status={res_d.status_code}, HasQR={data_d.get('has_qr')}, Payload={data_d.get('qr_payload')}, IsURL={data_d.get('is_url')}")
    all_ok = all_ok and ok_d

    # TEST E: Email Analysis Pipeline
    print("\n--- TEST E: Email Multi-Tier Analysis Pipeline ---")
    res_e = requests.post(
        f"{BACKEND_URL}/analyze-email",
        json={
            "from_address": "security@chase-alert-service.xyz",
            "reply_to": "hacker-drop@tempmail.com",
            "subject": "CRITICAL: Chase Online Banking Suspended",
            "body": "Your bank account has been locked due to unauthorized logins. Click to unlock: https://chase-secure-auth.xyz/login immediately."
        },
        timeout=15
    )
    data_e = res_e.json()
    ok_e = (
        res_e.status_code == 200
        and data_e.get("overall_risk_score", 0) >= 40
        and data_e.get("threat_level") in ["SUSPICIOUS", "HIGH_RISK", "CRITICAL"]
        and "header_analysis" in data_e
        and "extracted_urls" in data_e
        and "timings" in data_e
    )
    print(f"  Result: Status={res_e.status_code}, RiskScore={data_e.get('overall_risk_score')}, ThreatLevel={data_e.get('threat_level')}, ExtractedURLs={len(data_e.get('extracted_urls', []))}, Timings={data_e.get('timings')}")
    all_ok = all_ok and ok_e

    print("\n" + "=" * 70)
    print(f"ALL 5 E2E JOURNEYS PASSED: {all_ok}")
    print("=" * 70)
    return all_ok

if __name__ == "__main__":
    success = run_e2e()
    sys.exit(0 if success else 1)
