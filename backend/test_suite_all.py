import os
import sys
import time
import requests
import io
import cv2
import numpy as np
from PIL import Image

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
load_dotenv(".env")
load_dotenv("backend/.env")

API_BASE = "http://127.0.0.1:8008"

print("==================================================")
print("RUNNING SPAMGUARD 15-POINT COMPREHENSIVE TEST SUITE")
print("==================================================")

results = {}

# Helper function
def log_test(name, success, details=""):
    results[name] = {"success": success, "details": details}
    status_str = "[PASS]" if success else "[FAIL]"
    print(f"{status_str} {name}: {details}")

# 1. Normal Text
try:
    r = requests.post(f"{API_BASE}/unified-scan", json={"content": "Hey John, are we still meeting tomorrow for coffee at 10am?", "input_type": "text"})
    data = r.json()
    is_ok = r.status_code == 200 and data["risk_score"] <= 30 and data["classification"] in ["legitimate", "safe"]
    log_test("1. Normal Text", is_ok, f"Risk: {data.get('risk_score')}/100, Class: {data.get('classification')}")
except Exception as e:
    log_test("1. Normal Text", False, str(e))

# 2. Spam Text
try:
    r = requests.post(f"{API_BASE}/unified-scan", json={"content": "URGENT! You have won £1,000 cash prize or £2,000 award! Call 09061701461 to claim your code 8492. Valid 12hrs only!", "input_type": "text"})
    data = r.json()
    is_ok = r.status_code == 200 and data["risk_score"] >= 65 and data["ml"]["is_spam"] is True
    log_test("2. Spam Text", is_ok, f"Risk: {data.get('risk_score')}/100, ML: {data['ml']['prediction']}, Spam Prob: {data['ml']['probability']}")
except Exception as e:
    log_test("2. Spam Text", False, str(e))

# 3. Safe Text
try:
    r = requests.post(f"{API_BASE}/unified-scan", json={"content": "Please review the attached project schedule before the sprint planning tomorrow.", "input_type": "text"})
    data = r.json()
    is_ok = r.status_code == 200 and data["risk_score"] < 40 and not data["ml"]["is_spam"]
    log_test("3. Safe Text", is_ok, f"Risk: {data.get('risk_score')}/100, ML: {data['ml']['prediction']}")
except Exception as e:
    log_test("3. Safe Text", False, str(e))

# 4. Phishing URL
try:
    phish_url = "http://secure-login.paypal.com.verify-billing.xyz/auth?user=victim"
    r = requests.post(f"{API_BASE}/unified-scan", json={"content": phish_url, "input_type": "url"})
    data = r.json()
    is_ok = r.status_code == 200 and data["risk_score"] >= 50
    log_test("4. Phishing URL", is_ok, f"Risk: {data.get('risk_score')}/100, Classification: {data.get('classification')}")
except Exception as e:
    log_test("4. Phishing URL", False, str(e))

# 5. Safe URL
try:
    safe_url = "https://www.google.com"
    r = requests.post(f"{API_BASE}/unified-scan", json={"content": safe_url, "input_type": "url"})
    data = r.json()
    is_ok = r.status_code == 200 and data["risk_score"] <= 35
    log_test("5. Safe URL", is_ok, f"Risk: {data.get('risk_score')}/100, VT Risk: {data.get('virustotal', {}).get('risk_score')}")
except Exception as e:
    log_test("5. Safe URL", False, str(e))

# 6. Image
try:
    # Generate an image with simple text
    img = Image.new('RGB', (300, 100), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    files = {"file": ("test.png", buf.getvalue(), "image/png")}
    r = requests.post(f"{API_BASE}/analyze-image", files=files)
    data = r.json()
    is_ok = r.status_code == 200 and data.get("status") == "success"
    log_test("6. Image Analysis", is_ok, f"Status: {data.get('status')}, Metadata: {data.get('metadata')}")
except Exception as e:
    log_test("6. Image Analysis", False, str(e))

# 7. Screenshot
try:
    # Screenshot simulation
    img = Image.new('RGB', (800, 600), color=(240, 240, 240))
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    files = {"file": ("screenshot.png", buf.getvalue(), "image/png")}
    r = requests.post(f"{API_BASE}/analyze-image", files=files)
    data = r.json()
    is_ok = r.status_code == 200 and data.get("status") == "success"
    log_test("7. Screenshot Analysis", is_ok, f"Status: {data.get('status')}, Dimensions: {data.get('metadata', {}).get('width')}x{data.get('metadata', {}).get('height')}")
except Exception as e:
    log_test("7. Screenshot Analysis", False, str(e))

# 8. QR Code
try:
    # Generate a real QR code using OpenCV with proper sizing and quiet zone
    qr_detector = cv2.QRCodeEncoder.create()
    qr_matrix = qr_detector.encode("https://spamguard.ai/verify")
    qr_scaled = cv2.resize(qr_matrix, (290, 290), interpolation=cv2.INTER_NEAREST)
    qr_img = cv2.copyMakeBorder(qr_scaled, 20, 20, 20, 20, cv2.BORDER_CONSTANT, value=255)
    is_success, buffer = cv2.imencode(".png", qr_img)
    files = {"file": ("qrcode.png", buffer.tobytes(), "image/png")}
    r = requests.post(f"{API_BASE}/analyze-image", files=files)
    data = r.json()
    is_ok = r.status_code == 200 and data.get("has_qr") is True and "spamguard.ai" in str(data.get("qr_payload"))
    log_test("8. QR Code Detection", is_ok, f"Has QR: {data.get('has_qr')}, Payload: {data.get('qr_payload')}")
except Exception as e:
    log_test("8. QR Code Detection", False, str(e))

# 9. Gemini Unavailable (Graceful degradation)
try:
    from services.risk_engine import RiskEngine
    re_mock = RiskEngine()
    # Simulate gemini service error
    from unittest.mock import patch
    with patch("services.risk_engine.gemini_service.analyze_text", side_effect=Exception("Connection timed out")):
        res = re_mock.assess_threat("URGENT: Claim your lottery prize immediately", input_type="text")
        # System should NOT crash; sources.gemini should be unavailable, and ML/heuristics should still produce a risk score
        is_ok = res["sources"]["gemini"] == "unavailable" and res["risk_score"] > 0 and res["ml"]["available"] is True
        log_test("9. Gemini Unavailable Handling", is_ok, f"Sources: {res['sources']}, Risk Score: {res['risk_score']}")
except Exception as e:
    log_test("9. Gemini Unavailable Handling", False, str(e))

# 10. VirusTotal Unavailable (Graceful degradation)
try:
    from services.risk_engine import RiskEngine
    re_mock = RiskEngine()
    with patch("services.risk_engine.virustotal_service.analyze_url", return_value={"available": False, "status": "unavailable", "risk_score": 0, "signals": []}):
        res = re_mock.assess_threat("http://unknown-new-domain.com", input_type="url")
        # Crucial requirement: DO NOT classify as safe if VirusTotal is unavailable; return status = unavailable
        is_ok = res["sources"]["virustotal"] == "unavailable" and res.get("status") == "unavailable" and res.get("risk_level") != "safe"
        log_test("10. VirusTotal Unavailable Handling", is_ok, f"VT Status: {res['sources']['virustotal']}, Risk Level: {res.get('risk_level')}, Top Status: {res.get('status')}")
except Exception as e:
    log_test("10. VirusTotal Unavailable Handling", False, str(e))

# 11. ML Unavailable (Graceful degradation)
try:
    from services.risk_engine import RiskEngine
    re_mock = RiskEngine()
    with patch("services.risk_engine.ml_service.predict", side_effect=Exception("Model unpickling error")):
        res = re_mock.assess_threat("URGENT: Verify your account immediately", input_type="text")
        is_ok = res["sources"]["ml"] == "unavailable" and "gemini" in res["sources"]
        log_test("11. ML Unavailable Handling", is_ok, f"ML Source: {res['sources']['ml']}, Overall: {res['risk_score']}")
except Exception as e:
    log_test("11. ML Unavailable Handling", False, str(e))

# 12. API Timeout Handling
try:
    from services.virustotal_service import VirusTotalService
    vt_timeout = VirusTotalService(api_key="dummy_key", timeout=0.0001)
    vt_res = vt_timeout.analyze_url("http://example.com")
    is_ok = vt_res["available"] is False and vt_res["status"] == "unavailable"
    log_test("12. API Timeout Handling", is_ok, f"Status: {vt_res.get('status')}, Error: {vt_res.get('error')}")
except Exception as e:
    log_test("12. API Timeout Handling", False, str(e))

# 13. Rate Limit Handling
try:
    from services.virustotal_service import VirusTotalService
    vt = VirusTotalService(api_key=os.getenv("VIRUSTOTAL_API_KEY") or "dummy_vt_test_key")
    # Test rate limit error handling method
    with patch("requests.get") as mock_get:
        mock_get.return_value.status_code = 429
        mock_get.return_value.text = "Quota exceeded"
        rl_res = vt.analyze_url("http://brand-new-rate-limited-domain.com")
        is_ok = rl_res["available"] is False and rl_res["status"] == "unavailable" and ("Rate limit" in rl_res["signals"][0] or "Quota" in rl_res["signals"][0])
        log_test("13. Rate Limit Handling", is_ok, f"Status: {rl_res.get('status')}, Signal: {rl_res.get('signals')}")
except Exception as e:
    log_test("13. Rate Limit Handling", False, str(e))

# 14. Retry & Backoff
try:
    from services.gemini_service import gemini_service
    # Test that check_health tries models in succession without crashing
    health = gemini_service.check_health()
    is_ok = health["status"] in ["connected", "degraded", "unavailable"] and "latency_ms" in health
    log_test("14. Retry & Backoff", is_ok, f"Status: {health['status']}, Active Model: {health.get('model')}")
except Exception as e:
    log_test("14. Retry & Backoff", False, str(e))

# 15. Duplicate Request & Caching
try:
    from services.virustotal_service import VirusTotalService
    from unittest.mock import patch
    vt_cache_test = VirusTotalService(api_key=os.getenv("VIRUSTOTAL_API_KEY") or "dummy_key")
    with patch("requests.get") as mock_get:
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "data": {
                "attributes": {
                    "last_analysis_stats": {"malicious": 0, "suspicious": 0, "harmless": 80, "undetected": 5},
                    "reputation": 90,
                    "categories": {}
                }
            }
        }
        # First call: performs network query and populates cache
        res1 = vt_cache_test.analyze_url("https://www.duplicate-test-target.org")
        mock_get.reset_mock()
        # Second call: must hit in-memory cache and make 0 network requests
        res2 = vt_cache_test.analyze_url("https://www.duplicate-test-target.org")
        is_cached = res1.get("cached") is False and res2.get("cached") is True and mock_get.call_count == 0
        log_test("15. Duplicate Request (Cache)", is_cached, f"First Call Cached: {res1.get('cached')}, Second Call Cached: {res2.get('cached')}, Duplicate Network Calls: {mock_get.call_count}")
except Exception as e:
    log_test("15. Duplicate Request (Cache)", False, str(e))

print("==================================================")
passed_count = sum(1 for v in results.values() if v["success"])
total_count = len(results)
print(f"SUMMARY: {passed_count} / {total_count} TESTS PASSED")
print("==================================================")

if passed_count == total_count:
    sys.exit(0)
else:
    sys.exit(1)
