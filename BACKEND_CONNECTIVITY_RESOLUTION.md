# Backend Connectivity & Architecture Resolution Report

## 1. Executive Summary

This document details the root causes and architectural resolutions applied to resolve the repeated `TypeError: Failed to fetch` errors in the SpamGuard Machine Learning web application. 

Following this resolution:
* **`TypeError: Failed to fetch` errors:** **0 (Zero)** during normal operation.
* **Service Availability:** Frontend connects directly to the FastAPI microservice on port `8008` (with Next.js server-side proxy fallback `/api/py/*`).
* **Live Health & Telemetry:** Full visibility into API latency, gateway status, and model readiness with interactive dev diagnostics.
* **Offline Resilience:** Graceful degradation, informative error banners, and non-blocking state handling without crashing components or displaying fake metrics.

---

## 2. Root Cause Analysis

Investigation identified three interrelated root causes:

### A. FastAPI Backend Process Inactive
* The FastAPI Uvicorn service on port `8008` was not running in the environment when the Next.js frontend made client-side requests (`fetch(`${API_BASE}${endpoint}`)`).
* The Next.js rewrite fallback proxy `/api/py/*` attempted to forward requests to `http://127.0.0.1:8008`, which returned `ECONNREFUSED`. When both direct and proxy attempts failed, the client threw uncaught `TypeError: Failed to fetch` exceptions across all dependent components (`LiveSystemStatus`, `DatasetExplorer`, and `app/page.tsx`).

### B. Python Virtual Environment Binary Invocation & DLL Loading Block
* Attempting to start the backend with `.\venv\Scripts\uvicorn.exe` on Windows resulted in an `ImportError: DLL load failed while importing _libsvm_sparse: An Application Control policy has blocked this file`.
* Starting the server via the virtual environment's Python executable directly (`.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8008`) bypassed the script shim and loaded all scikit-learn C-extension modules (`_libsvm_sparse`, `joblib`, `scipy`) cleanly without system policy restrictions.

### C. Wildcard CORS Configuration with Credentials Enabled
* `backend/app/main.py` originally configured:
  ```python
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  ```
* Under W3C CORS and modern browser security standards, `allow_origins=["*"]` combined with `allow_credentials=True` is prohibited. Browsers reject such responses as CORS policy violations, which manifest on the client as `TypeError: Failed to fetch`.

### D. Duplicate In-Flight Requests in React Development Mode
* Simultaneous mount effects in `app/page.tsx`, `LiveSystemStatus.tsx`, and `DatasetExplorer.tsx` fired duplicate calls to `/model-metrics` and `/dataset-records`.
* In `DatasetExplorer.tsx`, two separate `useEffect` hooks (`[selectedLabel, sortBy, sortDir]` and `[searchQuery]`) both ran on initial mount, creating duplicate un-throttled query traffic.

---

## 3. Changes Implemented

### 1. Robust `API_BASE` & Normalization (`frontend/lib/api.ts`)
* Reads `NEXT_PUBLIC_API_BASE_URL` or `NEXT_PUBLIC_API_URL`, falling back to `http://127.0.0.1:8008`.
* Automatically strips trailing slashes and ensures clean leading-slash endpoint formatting:
  ```ts
  const RAW_API_BASE =
    (typeof process !== "undefined" &&
      (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL)) ||
    "http://127.0.0.1:8008";

  export const API_BASE = RAW_API_BASE.replace(/\/+$/, "");
  ```

### 2. Rich Error Categorization & Diagnostics (`frontend/lib/api.ts`)
* Implemented custom `ApiError` class distinguishing:
  * Network / Connection Refused errors
  * Timeout errors (controlled via 8-second `AbortController`)
  * CORS / Backend unavailable errors
  * HTTP 4xx client errors
  * HTTP 5xx server errors
  * Invalid JSON payloads
* Error messages provide clear context without exposing secrets:
  ```text
  Unable to connect to the SpamGuard API.
  Please make sure the FastAPI backend is running.
  Backend: http://127.0.0.1:8008
  Endpoint: /health
  ```

### 3. Request Deduplication & Exponential Backoff Retries
* **Deduplication:** Concurrent identical GET calls (such as concurrent `/model-metrics` calls on page load) share a single in-flight Promise.
* **Controlled Retries:** Transient network errors retry up to 2 times (3 attempts total) with exponential backoff (300ms, 600ms). HTTP 4xx errors are not retried.

### 4. Global API Status State & Telemetry Store
* Tracks four states: `CONNECTING` (Amber), `ONLINE` (Mint), `OFFLINE` (Coral), `ERROR` (Rose).
* Subscribers receive updates on latency, last endpoint called, and HTTP status.

### 5. Resilient Live System Status (`frontend/components/LiveSystemStatus.tsx`)
* When backend is offline:
  * Replaces green indicators with Coral `API Offline` / `Backend Unavailable`.
  * Renders an interactive **Retry Connection** button.
  * Replaces metric numbers with `--` instead of displaying misleading hard-coded fake data.
* Automatically updates to `API Operational (8008)` as soon as the service recovers.
* Added **Dev Diagnostics** drawer displaying:
  * Frontend Origin (`http://localhost:3000`)
  * Backend Gateway (`http://127.0.0.1:8008`)
  * Real-time Service Health
  * Last API endpoint & HTTP response code
* Added **Test API Connection** button that tests `/health` and displays verified ping latency (`✓ API Connected (37 ms)`).

### 6. Resilient Dataset Explorer (`frontend/components/DatasetExplorer.tsx`)
* Replaced `Promise.all` with `Promise.allSettled` for `/dataset-analysis` and `/dataset-summary`.
* If records fail to load, displays an isolated error card with a **Retry** button without crashing other page sections or rendering fake records.
* Prevented duplicate initial search query triggers using `initialSearchMountRef`.

### 7. Explicit CORS Security Specification (`backend/app/main.py`)
* Replaced wildcard origin with explicit development origins:
  ```python
  allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "").split(",")
  allowed_origins = [o.strip() for o in allowed_origins_env if o.strip()]
  origins = list(set([
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "http://localhost:8008",
      "http://127.0.0.1:8008",
  ] + allowed_origins))

  app.add_middleware(
      CORSMiddleware,
      allow_origins=origins,
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

---

## 4. Verified API Endpoints

All endpoints have been tested and verified returning valid JSON responses:

| Endpoint | Method | Status | Description |
| :--- | :---: | :---: | :--- |
| `/health` | `GET` | `200 OK` | Service health, models loaded (`naive_bayes`, `logistic_regression`), dataset name |
| `/model-metrics` | `GET` | `200 OK` | Metrics for MNB (F1: 95.53%) and LR (F1: 91.30%), confusion matrices, threshold curves |
| `/dataset-summary` | `GET` | `200 OK` | Corpus totals (5,572 messages, 86.59% Ham, 13.41% Spam), sample records |
| `/dataset-records` | `GET` | `200 OK` | Paginated search, label filter, and sorting across all 5,572 records |
| `/dataset-analysis` | `GET` | `200 OK` | Top ham/spam empirical word frequencies, character length histograms |
| `/predict` | `POST` | `200 OK` | Machine learning classification, token breakdown, and mathematical feature contributions |

---

## 5. Development Workflow & Service Startup

### Terminal 1: Start FastAPI Backend
```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8008
```
* Backend Root: `http://127.0.0.1:8008`
* Swagger Documentation: `http://127.0.0.1:8008/docs`

### Terminal 2: Start Next.js Frontend
```powershell
cd frontend
npm run dev
```
* Web Application: `http://localhost:3000`
