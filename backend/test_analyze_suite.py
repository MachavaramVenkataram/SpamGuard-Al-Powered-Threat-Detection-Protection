import requests
import json
import time
import concurrent.futures

BASE_URL = "http://127.0.0.1:8008"

def run_test(name, fn):
    print(f"\n==========================================")
    print(f"RUNNING: {name}")
    print(f"==========================================")
    try:
        t0 = time.perf_counter()
        result = fn()
        elapsed = round((time.perf_counter() - t0) * 1000, 2)
        print(f"PASS: {name} ({elapsed}ms)")
        return True, result
    except Exception as e:
        print(f"FAIL: {name} - Error: {e}")
        return False, str(e)

# TEST 1: GET /health
def test_1_health():
    res = requests.get(f"{BASE_URL}/health", timeout=5.0)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert "status" in data
    print(f"Health response: {data['status']}, services: {list(data.get('services', {}).keys())}")
    return data

# TEST 2: GET /diagnostics
def test_2_diagnostics():
    res = requests.get(f"{BASE_URL}/diagnostics", timeout=5.0)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data["backend"] == "healthy"
    assert "ml" in data and "gemini" in data and "virustotal" in data
    print(f"Diagnostics: backend={data['backend']}, ml={data['ml']['status']}, uptime={data['uptime_seconds']}s")
    return data

# TEST 3: POST /analyze-email/health-test
def test_3_health_test():
    payload = {
        "from_address": "test@example.com",
        "to_address": "me@example.com",
        "subject": "System Verification",
        "body": "This is a quick system verification test message."
    }
    res = requests.post(f"{BASE_URL}/analyze-email/health-test", json=payload, timeout=5.0)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data["status"] == "ok"
    assert data["health_test"] is True
    print(f"Health-test: executed in {data['execution_time_ms']}ms, ml_status={data['ml_status']}")
    return data

# TEST 4: POST /analyze-email with simple plain-text email
def test_4_plain_text():
    payload = {
        "from_address": "colleague@company.org",
        "to_address": "macha@company.org",
        "subject": "Quarterly Planning Meeting Notes",
        "body": "Hi team, please find attached the meeting notes from today's session. Let me know if you have any questions."
    }
    res = requests.post(f"{BASE_URL}/analyze-email", json=payload, timeout=15.0)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert "overall_risk_score" in data
    print(f"Plain text email: risk={data['overall_risk_score']}, threat_level={data['threat_level']}, mode={data.get('analysis_mode')}, time={data.get('execution_time_ms')}ms")
    return data

# TEST 5: email containing URL
def test_5_with_url():
    payload = {
        "from_address": "support@service-update.xyz",
        "to_address": "user@example.com",
        "subject": "Verify your billing details",
        "body": "Your account has an overdue invoice. Please visit http://billing-update.xyz/login to settle immediately."
    }
    res = requests.post(f"{BASE_URL}/analyze-email", json=payload, timeout=15.0)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert len(data.get("extracted_urls", [])) > 0
    print(f"Email with URL: risk={data['overall_risk_score']}, threat_level={data['threat_level']}, vt={data.get('virustotal', {}).get('status') if data.get('virustotal') else 'none'}, time={data.get('execution_time_ms')}ms")
    return data

# TEST 6: email containing suspicious language
def test_6_suspicious_language():
    payload = {
        "from_address": "security@alert-verify.com",
        "reply_to": "hacker@evil-domain.com",
        "subject": "URGENT: Unauthorized login detected. Account suspended in 24 hours",
        "body": "Immediate action required! Enter your password, PIN, and social security number to verify your identity and unlock your funds: http://verify-identity.top/auth"
    }
    res = requests.post(f"{BASE_URL}/analyze-email", json=payload, timeout=15.0)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert data["is_threat"] is True
    print(f"Suspicious email: risk={data['overall_risk_score']}, threat={data['threat_level']}, reasons={len(data['reasons'])}")
    return data

# TEST 11: Malformed email (empty body)
def test_11_malformed():
    payload = {
        "from_address": "bad@example.com",
        "to_address": "user@example.com",
        "subject": "Empty",
        "body": ""
    }
    res = requests.post(f"{BASE_URL}/analyze-email", json=payload, timeout=5.0)
    assert res.status_code == 422, f"Expected 422 Unprocessable Entity, got {res.status_code}"
    print(f"Malformed email successfully rejected with HTTP 422")
    return res.status_code

# TEST 12: Oversized email (>100k chars)
def test_12_oversized():
    payload = {
        "from_address": "spammer@big.com",
        "to_address": "user@example.com",
        "subject": "Massive spam payload",
        "body": "A" * 120000
    }
    res = requests.post(f"{BASE_URL}/analyze-email", json=payload, timeout=5.0)
    assert res.status_code in [413, 422], f"Expected 413 or 422, got {res.status_code}"
    print(f"Oversized email successfully rejected with HTTP {res.status_code}")
    return res.status_code

# TEST 15: Concurrent requests
def test_15_concurrent():
    payloads = [
        {"subject": f"Notice {i}", "body": f"Meeting notes update {i} with content.", "from_address": f"user{i}@test.com"}
        for i in range(5)
    ]
    t0 = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(requests.post, f"{BASE_URL}/analyze-email", json=p, timeout=20.0) for p in payloads]
        results = [f.result() for f in futures]
    total_elapsed = round((time.perf_counter() - t0) * 1000, 2)
    for r in results:
        assert r.status_code == 200
    print(f"5 Concurrent requests completed in {total_elapsed}ms (avg {round(total_elapsed/5, 1)}ms per req)")
    return total_elapsed

if __name__ == "__main__":
    tests = [
        ("TEST 1: GET /health", test_1_health),
        ("TEST 2: GET /diagnostics", test_2_diagnostics),
        ("TEST 3: POST /analyze-email/health-test", test_3_health_test),
        ("TEST 4: POST /analyze-email (Plain Text)", test_4_plain_text),
        ("TEST 5: POST /analyze-email (With URL)", test_5_with_url),
        ("TEST 6: POST /analyze-email (Suspicious Language)", test_6_suspicious_language),
        ("TEST 11: Malformed Email Handling", test_11_malformed),
        ("TEST 12: Oversized Email Handling", test_12_oversized),
        ("TEST 15: Concurrent Requests", test_15_concurrent),
    ]

    passed = 0
    for name, fn in tests:
        ok, _ = run_test(name, fn)
        if ok:
            passed += 1

    print(f"\n==========================================")
    print(f"TEST RUNNER COMPLETE: {passed}/{len(tests)} PASSED")
    print(f"==========================================")
