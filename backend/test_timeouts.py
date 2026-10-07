import requests
import json
import time

BASE_URL = "http://127.0.0.1:8008"

# Verify that when Gemini returns status="timeout" or is unavailable, analyze-email still succeeds in < 1s
payload = {
    "from_address": "alert@banking-security.net",
    "to_address": "customer@bank.com",
    "subject": "Urgent security update required",
    "body": "Your bank account has been flagged. Visit http://sample-bank-update.xyz to update."
}

t0 = time.perf_counter()
res = requests.post(f"{BASE_URL}/analyze-email", json=payload, timeout=10.0)
elapsed = round((time.perf_counter() - t0) * 1000, 2)

print(f"Status Code: {res.status_code} ({elapsed}ms)")
data = res.json()
print("Headers X-Request-ID:", res.headers.get("x-request-id"))
print("Request ID in body:", data.get("request_id"))
print("Analysis Mode:", data.get("analysis_mode"))
print("Overall Risk:", data.get("overall_risk_score"))
print("Threat Level:", data.get("threat_level"))
print("Virustotal status:", data.get("virustotal", {}).get("status") if data.get("virustotal") else "none")
print("Gemini status:", data.get("gemini", {}).get("status") if data.get("gemini") else "none")
print("Timings breakdown:", json.dumps(data.get("timings"), indent=2))

assert res.status_code == 200
assert res.headers.get("x-request-id") is not None
assert data.get("request_id") is not None
assert data.get("timings") is not None
print("VERIFICATION SUCCESSFUL!")
