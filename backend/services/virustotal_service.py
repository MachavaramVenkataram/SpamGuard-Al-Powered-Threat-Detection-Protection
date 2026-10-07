"""
SpamGuard VirusTotal Threat Intelligence Service
Provides external security scanning, URL reputation analysis, and hash auditing
via VirusTotal v3 REST API.
Implements in-memory TTL caching, rate-limit resilience, and graceful degradation.
API key is kept strictly backend-side; never exposed to clients.
"""

import os
import base64
import time
import logging
from typing import Dict, Any, Optional
import requests

logger = logging.getLogger("spamguard.virustotal")

CACHE_TTL_SECONDS = 3600  # 1 hour cache to strictly conserve API rate limits

class VirusTotalService:
    def __init__(self, api_key: Optional[str] = None, timeout: float = 3.0):
        self.api_key = api_key or os.getenv("VIRUSTOTAL_API_KEY", "").strip()
        self.timeout = timeout
        self.base_url = "https://www.virustotal.com/api/v3"
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._health_cache: Optional[Dict[str, Any]] = None
        self._health_cache_time: float = 0.0
        self._quota_exhausted_until: float = 0.0

    def _get_headers(self) -> Dict[str, str]:
        return {
            "x-apikey": self.api_key,
            "Accept": "application/json",
            "User-Agent": "SpamGuard-ThreatScanner/2.5"
        }

    def check_health(self) -> Dict[str, Any]:
        """Probes VirusTotal API connectivity with cached results to avoid quota exhaustion."""
        now = time.time()
        if self._health_cache and (now - self._health_cache_time < 60.0):
            return dict(self._health_cache)

        if not self.api_key:
            res = {
                "status": "unavailable",
                "available": False,
                "latency_ms": 0.0,
                "error": "VIRUSTOTAL_API_KEY is not configured in backend environment."
            }
            self._health_cache = res
            self._health_cache_time = now
            return res

        t0 = time.perf_counter()
        try:
            # Query a high-reputation domain to test key validity
            res = requests.get(
                f"{self.base_url}/domains/google.com",
                headers=self._get_headers(),
                timeout=self.timeout
            )
            latency = round((time.perf_counter() - t0) * 1000, 2)

            if res.status_code == 200:
                result = {
                    "status": "connected",
                    "available": True,
                    "latency_ms": latency,
                    "error": None
                }
            elif res.status_code == 429:
                result = {
                    "status": "degraded",
                    "available": False,
                    "latency_ms": latency,
                    "error": "VirusTotal API quota / rate limit reached."
                }
            elif res.status_code in [401, 403]:
                result = {
                    "status": "unavailable",
                    "available": False,
                    "latency_ms": latency,
                    "error": "Invalid or unauthorized VirusTotal API key."
                }
            else:
                result = {
                    "status": "degraded",
                    "available": False,
                    "latency_ms": latency,
                    "error": f"VirusTotal returned HTTP {res.status_code}"
                }
        except requests.exceptions.Timeout:
            latency = round((time.perf_counter() - t0) * 1000, 2)
            result = {
                "status": "timeout",
                "available": False,
                "latency_ms": latency,
                "error": f"Connection to VirusTotal API timed out ({self.timeout}s)."
            }
        except Exception as e:
            latency = round((time.perf_counter() - t0) * 1000, 2)
            result = {
                "status": "unavailable",
                "available": False,
                "latency_ms": latency,
                "error": f"Network exception: {str(e)}"
            }

        self._health_cache = result
        self._health_cache_time = now
        return result

    def _get_url_id(self, url: str) -> str:
        """Converts raw URL to VirusTotal v3 URL ID (base64url without trailing '=')."""
        return base64.urlsafe_b64encode(url.encode()).decode().strip("=")

    def analyze_url(self, url: str, timeout: Optional[float] = None) -> Dict[str, Any]:
        """
        Inspects URL threat intelligence on VirusTotal.
        Uses cached reports when available to prevent rate exhaustion.
        If VT is unavailable, returns available=False and does NOT classify as safe.
        """
        req_timeout = timeout if timeout is not None else self.timeout
        normalized_url = url.strip()
        if not normalized_url:
            return {
                "available": False,
                "status": "unavailable",
                "risk_score": 0,
                "reputation": 0,
                "stats": {},
                "signals": [],
                "error": "Empty URL provided."
            }

        if not self.api_key:
            return {
                "available": False,
                "status": "unavailable",
                "risk_score": 0,
                "reputation": 0,
                "stats": {},
                "signals": ["External threat intelligence unavailable."],
                "error": "API key missing."
            }

        if time.time() < self._quota_exhausted_until:
            return {
                "available": False,
                "status": "unavailable",
                "risk_score": 0,
                "reputation": 0,
                "stats": {},
                "signals": ["External threat intelligence unavailable (rate-limit cooldown active)."],
                "error": "Rate limit cooldown active"
            }

        # Check in-memory TTL cache
        cache_key = f"url:{normalized_url}"
        now = time.time()
        if cache_key in self._cache:
            entry = self._cache[cache_key]
            if now - entry["timestamp"] < CACHE_TTL_SECONDS:
                logger.info(f"Serving VirusTotal result from local cache for {normalized_url}")
                cached_res = dict(entry["data"])
                cached_res["cached"] = True
                return cached_res

        url_id = self._get_url_id(normalized_url)

        try:
            res = requests.get(
                f"{self.base_url}/urls/{url_id}",
                headers=self._get_headers(),
                timeout=req_timeout
            )

            if res.status_code == 200:
                data = res.json().get("data", {})
                attributes = data.get("attributes", {})
                stats = attributes.get("last_analysis_stats", {})

                malicious = stats.get("malicious", 0)
                suspicious = stats.get("suspicious", 0)
                harmless = stats.get("harmless", 0)
                undetected = stats.get("undetected", 0)
                total_engines = malicious + suspicious + harmless + undetected

                # Calculate calibrated risk score (0-100)
                if malicious > 0:
                    # Even 1-2 malicious engines indicates serious risk
                    risk_score = min(100, int(60 + (malicious * 10) + (suspicious * 5)))
                elif suspicious > 0:
                    risk_score = min(70, int(35 + (suspicious * 15)))
                else:
                    risk_score = 5

                signals = []
                if malicious > 0:
                    signals.append(f"VirusTotal: Flagged MALICIOUS by {malicious} security engines")
                if suspicious > 0:
                    signals.append(f"VirusTotal: Flagged SUSPICIOUS by {suspicious} security engines")
                if malicious == 0 and suspicious == 0 and harmless > 0:
                    signals.append(f"VirusTotal: Confirmed clean by {harmless} antivirus engines")

                result = {
                    "available": True,
                    "status": "available",
                    "risk_score": risk_score,
                    "reputation": attributes.get("reputation", 0),
                    "stats": {
                        "malicious": malicious,
                        "suspicious": suspicious,
                        "harmless": harmless,
                        "undetected": undetected,
                        "total_engines": total_engines
                    },
                    "categories": attributes.get("categories", {}),
                    "signals": signals,
                    "cached": False,
                    "error": None
                }

                # Store in cache
                self._cache[cache_key] = {"timestamp": now, "data": result}
                return result

            elif res.status_code == 404:
                # URL has not been analyzed by VT yet
                logger.info(f"URL {normalized_url} not yet in VirusTotal database.")
                return {
                    "available": True,
                    "status": "unseen",
                    "risk_score": 25,  # Moderate unknown risk
                    "reputation": 0,
                    "stats": {"malicious": 0, "suspicious": 0, "harmless": 0, "undetected": 0},
                    "signals": ["VirusTotal: Unseen domain/URL with no historical telemetry"],
                    "cached": False,
                    "error": "URL not found in VirusTotal database"
                }

            elif res.status_code == 429:
                self._quota_exhausted_until = time.time() + 60.0
                logger.warning("VirusTotal rate limit exceeded. Setting 60s cooldown.")
                return {
                    "available": False,
                    "status": "unavailable",
                    "risk_score": 0,
                    "reputation": 0,
                    "stats": {},
                    "signals": ["VirusTotal unavailable: Rate limit exceeded / Quota exhausted"],
                    "error": "Rate limit exceeded"
                }
            else:
                logger.warning(f"VirusTotal returned error {res.status_code}: {res.text[:150]}")
                return {
                    "available": False,
                    "status": "unavailable",
                    "risk_score": 0,
                    "reputation": 0,
                    "stats": {},
                    "signals": ["External threat intelligence unavailable."],
                    "error": f"HTTP {res.status_code}"
                }

        except requests.exceptions.Timeout:
            logger.warning(f"VirusTotal lookup timed out for {normalized_url}")
            return {
                "available": False,
                "status": "timeout",
                "risk_score": 0,
                "reputation": 0,
                "stats": {},
                "signals": ["External threat intelligence unavailable (lookup timed out)."],
                "error": "Request timed out"
            }
        except Exception as e:
            logger.error(f"VirusTotal error during URL analysis: {e}")
            return {
                "available": False,
                "status": "unavailable",
                "risk_score": 0,
                "reputation": 0,
                "stats": {},
                "signals": ["External threat intelligence unavailable."],
                "error": str(e)
            }


# Singleton instance
virustotal_service = VirusTotalService()
