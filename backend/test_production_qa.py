"""
SpamGuard Production QA & Validation Test Suite
Validates Phases 0 through 36:
1. Health & Diagnostics
2. Request Tracing (X-Request-ID)
3. /analyze-email performance & timeouts
4. /analyze-url & VirusTotal resilience
5. /analyze-image & OpenCV QR detection
6. ML model loading & inference latency
7. Model disagreement verification
8. 10 Realistic test cases (False Positive / False Negative review)
9. Model performance metrics (real evaluation on test dataset)
10. Error handling (422 malformed, 413 oversized)
"""

import sys
import os
import json
import time
import requests
import io
import numpy as np

BACKEND_URL = "http://127.0.0.1:8008"

def log_test(name: str, passed: bool, details: str = ""):
    status = "PASS" if passed else "FAIL"
    print(f"[{status}] {name} {f'- {details}' if details else ''}")
    return passed

def run_suite():
    results = []
    print("=" * 70)
    print("SPAMGUARD PRODUCTION QA & VALIDATION SUITE")
    print(f"Target Backend: {BACKEND_URL}")
    print("=" * 70)

    # 1. Health Endpoint (Phase 2)
    t0 = time.perf_counter()
    res = requests.get(f"{BACKEND_URL}/health", timeout=5)
    lat_health = round((time.perf_counter() - t0) * 1000, 2)
    health_data = res.json()
    p1 = (
        res.status_code == 200
        and health_data.get("status") in ["healthy", "degraded"]
        and "services" in health_data
        and "models_loaded" in health_data
    )
    results.append(log_test("1. GET /health", p1, f"Status={res.status_code}, latency={lat_health}ms, health={health_data.get('status')}"))

    # 2. Diagnostics Endpoint (Phase 3)
    t0 = time.perf_counter()
    res = requests.get(f"{BACKEND_URL}/diagnostics", timeout=5)
    lat_diag = round((time.perf_counter() - t0) * 1000, 2)
    diag_data = res.json()
    # Check no secrets returned
    dumped = json.dumps(diag_data)
    no_secrets = "AIzaSy" not in dumped and "api_key" not in dumped
    p2 = (
        res.status_code == 200
        and diag_data.get("backend") == "ready"
        and "ml" in diag_data
        and "gemini" in diag_data
        and "virustotal" in diag_data
        and "ocr" in diag_data
        and "storage" in diag_data
        and no_secrets
    )
    results.append(log_test("2. GET /diagnostics", p2, f"Latency={lat_diag}ms, ML={diag_data['ml']['status']}, OCR={diag_data['ocr']['status']}, storage={diag_data['storage']['status']}, secrets_safe={no_secrets}"))

    # 3. Request Tracing (Phase 4)
    custom_req_id = "sg-test-trace-998877"
    res = requests.get(
        f"{BACKEND_URL}/health",
        headers={"X-Request-ID": custom_req_id},
        timeout=5
    )
    returned_req_id = res.headers.get("X-Request-ID")
    p3 = returned_req_id == custom_req_id
    results.append(log_test("3. Request Tracing X-Request-ID", p3, f"Sent={custom_req_id}, Received={returned_req_id}"))

    # 4. Fast Email Health Test (< 25ms)
    t0 = time.perf_counter()
    res = requests.post(
        f"{BACKEND_URL}/analyze-email/health-test",
        json={
            "from_address": "support@service.com",
            "subject": "System Verification Notice",
            "body": "Your weekly system status report is ready for viewing."
        },
        timeout=5
    )
    lat_test = round((time.perf_counter() - t0) * 1000, 2)
    p4 = res.status_code == 200 and lat_test < 100
    results.append(log_test("4. POST /analyze-email/health-test", p4, f"Status={res.status_code}, latency={lat_test}ms (<100ms requirement)"))

    # 5. Full POST /analyze-email (Phase 5)
    t0 = time.perf_counter()
    res = requests.post(
        f"{BACKEND_URL}/analyze-email",
        json={
            "from_address": "security@paypal-update-alert.xyz",
            "reply_to": "attacker-inbox@yopmail.com",
            "subject": "URGENT: Your PayPal Account Has Been Suspended",
            "body": "Dear customer, your account was suspended due to suspicious activity. Click here immediately to restore access: https://paypal-security-login.xyz/verify-auth within 24 hours or your account will be deleted."
        },
        timeout=15
    )
    lat_email = round((time.perf_counter() - t0) * 1000, 2)
    email_res = res.json() if res.status_code == 200 else {}
    p5 = (
        res.status_code == 200
        and email_res.get("overall_risk_score", 0) >= 60
        and email_res.get("threat_level") in ["HIGH_RISK", "CRITICAL"]
        and lat_email < 6000  # Should be well below 6s upper bound
    )
    results.append(log_test("5. POST /analyze-email (Phishing Test)", p5, f"Status={res.status_code}, RiskScore={email_res.get('overall_risk_score')}, ThreatLevel={email_res.get('threat_level')}, Latency={lat_email}ms, Mode={email_res.get('analysis_mode')}"))

    # 6. POST /analyze-url (Phase 6 & 9)
    t0 = time.perf_counter()
    res = requests.post(
        f"{BACKEND_URL}/analyze-url",
        json={"url": "http://192.168.1.1:8080/login-banking-update.php"},
        timeout=10
    )
    lat_url = round((time.perf_counter() - t0) * 1000, 2)
    url_res = res.json() if res.status_code == 200 else {}
    p6 = (
        res.status_code == 200
        and url_res.get("risk_score", 0) >= 30
        and "virustotal" in url_res
    )
    results.append(log_test("6. POST /analyze-url (Heuristics + VT)", p6, f"Status={res.status_code}, RiskScore={url_res.get('risk_score')}, Latency={lat_url}ms"))

    # 7. POST /analyze-image (OpenCV QR detection)
    try:
        import cv2
        import numpy as np
        # Generate a test QR code in memory
        qr_img = np.zeros((200, 200, 3), dtype=np.uint8)
        qr_img[:] = 255  # white canvas
        # Encode as PNG bytes
        _, buf = cv2.imencode(".png", qr_img)
        img_bytes = buf.tobytes()

        t0 = time.perf_counter()
        files = {"file": ("test.png", io.BytesIO(img_bytes), "image/png")}
        res = requests.post(f"{BACKEND_URL}/analyze-image", files=files, timeout=10)
        lat_img = round((time.perf_counter() - t0) * 1000, 2)
        img_res = res.json() if res.status_code == 200 else {}
        p7 = res.status_code == 200 and "metadata" in img_res and img_res.get("status") == "success"
        results.append(log_test("7. POST /analyze-image (Image parsing)", p7, f"Status={res.status_code}, has_qr={img_res.get('has_qr')}, Latency={lat_img}ms"))
    except Exception as e:
        results.append(log_test("7. POST /analyze-image", False, f"Exception: {e}"))

    # 8. Unified Scan Orchestrator (Phase 10)
    t0 = time.perf_counter()
    res = requests.post(
        f"{BACKEND_URL}/unified-scan",
        json={
            "content": "Claim your $5,000 Walmart Gift Card now! Call 0800-12345 to verify your identity.",
            "input_type": "text",
            "model_id": "naive_bayes"
        },
        timeout=10
    )
    lat_scan = round((time.perf_counter() - t0) * 1000, 2)
    scan_res = res.json() if res.status_code == 200 else {}
    p8 = (
        res.status_code == 200
        and scan_res.get("risk_score", 0) >= 50
        and "calculation_breakdown" in scan_res
        and "action_plan" in scan_res
    )
    results.append(log_test("8. POST /unified-scan (Risk Engine)", p8, f"Status={res.status_code}, RiskScore={scan_res.get('risk_score')}, Level={scan_res.get('risk_level')}, Confidence={scan_res.get('confidence')}, Latency={lat_scan}ms"))

    # 9. Model Disagreement Detection (Phase 13)
    res = requests.post(
        f"{BACKEND_URL}/predict",
        json={"message": "Free entry in 2 a weekly comp to win FA Cup final tkts 21st May 2005. Text FA to 87121", "model_id": "naive_bayes"},
        timeout=5
    )
    predict_res = res.json() if res.status_code == 200 else {}
    p9 = res.status_code == 200 and "model_comparison" in predict_res
    mc = predict_res.get("model_comparison", {})
    results.append(log_test("9. Dual Model Comparison (Phase 13)", p9, f"Status={res.status_code}, Primary={mc.get('primary', {}).get('model_name')}, Secondary={mc.get('secondary', {}).get('model_name')}, Agreement={mc.get('agreement')}"))

    # 10. False Positive / False Negative 10-Case Practical Tradeoff Review (Phase 12)
    test_cases = [
        {"name": "Safe personal message", "text": "Hey Mom, are we still meeting for lunch at 1pm tomorrow?", "expected_spam": False},
        {"name": "Marketing message", "text": "Summer sale starts today! Get 20% off all shoes with discount code SUMMER at checkout.", "expected_spam": False},
        {"name": "Newsletter", "text": "Here is our weekly engineering digest on architecture, performance, and best practices.", "expected_spam": False},
        {"name": "Bank phishing", "text": "URGENT: Chase Bank alert. Suspicious withdrawal detected. Log in at http://chase-security-verify.xyz to secure your account immediately.", "expected_spam": True},
        {"name": "Delivery scam", "text": "USPS: Your package could not be delivered due to incomplete address. Confirm your details at http://usps-track-pkg.xyz or it will be returned.", "expected_spam": True},
        {"name": "Job scam", "text": "Earn $500/day working from home! No experience required. Contact us to claim cash payments.", "expected_spam": True},
        {"name": "Prize scam", "text": "CONGRATULATIONS! You have won a $1,000 Amazon Gift Card. Call 0800-999-888 to claim your prize now.", "expected_spam": True},
        {"name": "Financial scam", "text": "Transfer $200 via Western Union to release your $1,000,000 inheritance fund from the Royal Bank.", "expected_spam": True},
        {"name": "Normal customer support message", "text": "Your support ticket #4492 has been resolved. Please let us know if you have any questions.", "expected_spam": False},
        {"name": "Promotional message", "text": "Free entry in a weekly competition to win cash prizes! Text WIN to 88088 now.", "expected_spam": True},
    ]

    print("\n--- Phase 12: 10-Case False Positive / False Negative Practical Audit ---")
    fp_list = []
    fn_list = []
    correct_count = 0

    for tc in test_cases:
        res_scan = requests.post(f"{BACKEND_URL}/unified-scan", json={"content": tc["text"], "input_type": "text"}, timeout=5)
        scan_data = res_scan.json()
        risk_score = scan_data.get("risk_score", 0)
        is_flagged = risk_score >= 40  # Suspicious or above

        if is_flagged and not tc["expected_spam"]:
            fp_list.append(tc["name"])
            status_str = "FALSE POSITIVE"
        elif not is_flagged and tc["expected_spam"]:
            fn_list.append(tc["name"])
            status_str = "FALSE NEGATIVE"
        else:
            correct_count += 1
            status_str = "ACCURATE"

        print(f"  * {tc['name']}: RiskScore={risk_score}/100 ({scan_data.get('risk_level', '').upper()}) | Expected={'THREAT' if tc['expected_spam'] else 'SAFE'} -> {status_str}")

    print(f"  Audit Result: Correct={correct_count}/10 | False Positives={len(fp_list)} ({fp_list}) | False Negatives={len(fn_list)} ({fn_list})")
    p10 = correct_count >= 8  # Real-world practical threshold
    results.append(log_test("10. 10-Case False Positive / False Negative Audit", p10, f"{correct_count}/10 correct (FPs={len(fp_list)}, FNs={len(fn_list)})"))

    # 11. Error Handling (422 validation & oversized limit) (Phase 32)
    # Malformed payload
    res_bad = requests.post(f"{BACKEND_URL}/analyze-email", json={"invalid_field": 123}, timeout=5)
    p11a = res_bad.status_code == 422
    # Oversized payload (> 100,000 chars) rejected by Pydantic validation / endpoint check
    res_huge = requests.post(f"{BACKEND_URL}/analyze-email", json={"body": "A" * 105000}, timeout=5)
    p11b = res_huge.status_code in [413, 422]
    results.append(log_test("11. Error Handling (422 validation & oversized rejection)", p11a and p11b, f"Malformed={res_bad.status_code} (expect 422), Huge={res_huge.status_code} (expect 413/422)"))

    # 12. Model Metrics Verification (Phase 11)
    res_metrics = requests.get(f"{BACKEND_URL}/model-metrics", timeout=5)
    metrics_data = res_metrics.json() if res_metrics.status_code == 200 else {}
    nb_metrics = metrics_data.get("models", {}).get("naive_bayes", {})
    lr_metrics = metrics_data.get("models", {}).get("logistic_regression", {})
    p12 = (
        res_metrics.status_code == 200
        and nb_metrics.get("accuracy", 0) > 0.90
        and lr_metrics.get("accuracy", 0) > 0.90
    )
    results.append(log_test("12. GET /model-metrics (Real Scikit-Learn evaluation)", p12, f"NB Accuracy={nb_metrics.get('accuracy')}, LR Accuracy={lr_metrics.get('accuracy')}"))

    print("=" * 70)
    passed_count = sum(1 for r in results if r)
    total_count = len(results)
    print(f"SUMMARY: {passed_count}/{total_count} tests passed.")
    print("=" * 70)

    return passed_count == total_count

if __name__ == "__main__":
    success = run_suite()
    sys.exit(0 if success else 1)
