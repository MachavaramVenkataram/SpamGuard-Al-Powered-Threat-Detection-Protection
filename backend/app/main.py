import os
import sys
import json
import re
import time
import uuid
import asyncio
import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Response, Request
from fastapi.middleware.cors import CORSMiddleware
import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger("spamguard.api")
SERVER_START_TIME = time.time()

# Ensure backend root is on path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

from services.gemini_service import gemini_service
from services.virustotal_service import virustotal_service
from services.ml_service import ml_service
from services.risk_engine import risk_engine

from app.preprocessor import clean_text, tokenize, remove_stopwords, TextCleaner, STOPWORDS, get_preprocessing_breakdown
from app.intelligence import analyze_single_url, analyze_email_payload, detect_qr_code_from_bytes
from app.schemas import (
    PredictRequest,
    PredictResponse,
    PreprocessRequest,
    PreprocessResponse,
    FeatureContribution,
    MessageStats,
    LinguisticSignals,
    TokenExplorerItem,
    DatasetRecordsResponse,
    DatasetRecordItem,
    URLAnalyzeRequest,
    URLAnalyzeResponse,
    EmailAnalyzeRequest,
    EmailAnalyzeResponse,
    ImageAnalyzeResponse,
    UnifiedScanRequest,
    UnifiedScanResponse,
    CopilotChatRequest,
    CopilotChatResponse,
    ApiHealthResponse,
    ServiceHealthStatus,
    FeedbackSubmission,
    FeedbackStatsResponse,
    DiagnosticsResponse,
    EmailHealthTestResponse,
)

MODELS_DIR = os.path.join(BACKEND_DIR, "models")
DATA_PATH = os.path.join(BACKEND_DIR, "data", "sms_spam_collection.csv")
NB_PATH = os.path.join(MODELS_DIR, "spam_pipeline_nb.joblib")
LR_PATH = os.path.join(MODELS_DIR, "spam_pipeline_lr.joblib")
METADATA_PATH = os.path.join(MODELS_DIR, "model_metadata.json")
DATASET_ANALYSIS_PATH = os.path.join(MODELS_DIR, "dataset_analysis.json")

# In-memory cached artifacts
loaded_models: Dict[str, Any] = {}
model_metadata: Dict[str, Any] = {}
dataset_analysis: Dict[str, Any] = {}
cached_df: Optional[pd.DataFrame] = None

# Linguistic keyword dictionaries
URGENCY_KEYWORDS = {"urgent", "immediately", "expire", "expires", "expiring", "valid", "hurry", "now", "today", "instant", "last", "chance"}
PROMO_KEYWORDS = {"free", "discount", "offer", "ringtone", "tones", "poly", "polyphonic", "promo", "voucher", "deal", "cheap"}
FINANCIAL_KEYWORDS = {"cash", "reward", "prize", "payout", "bonus", "cost", "fee", "rate", "guaranteed", "loan", "debt", "refund"}
PRIZE_KEYWORDS = {"won", "win", "winner", "winning", "selected", "awarded", "claim", "claims", "congratulations", "draw"}
ACTION_KEYWORDS = {"call", "txt", "text", "reply", "dial", "send", "stop", "unsubscribe", "visit", "click"}
CONVERSATIONAL_KEYWORDS = {"hey", "hello", "hi", "ok", "got", "come", "home", "good", "later", "sorry", "thanks", "love", "night", "morning", "meet", "meeting"}

@asynccontextmanager
async def lifespan(app: FastAPI):
    global cached_df
    # Startup: Load or train models
    if not (os.path.exists(NB_PATH) and os.path.exists(LR_PATH) and os.path.exists(METADATA_PATH)):
        print("Models not found, running train_and_evaluate()...")
        from train import train_and_evaluate
        train_and_evaluate()
        
    print("Loading models and metadata into memory...")
    loaded_models["naive_bayes"] = joblib.load(NB_PATH)
    loaded_models["logistic_regression"] = joblib.load(LR_PATH)
    
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        model_metadata.update(json.load(f))
        
    if os.path.exists(DATASET_ANALYSIS_PATH):
        with open(DATASET_ANALYSIS_PATH, "r", encoding="utf-8") as f:
            dataset_analysis.update(json.load(f))
            
    if os.path.exists(DATA_PATH):
        print(f"Loading dataset CSV from {DATA_PATH}...")
        df = pd.read_csv(DATA_PATH)
        df['char_length'] = df['message'].apply(lambda x: len(str(x)))
        df['word_count'] = df['message'].apply(lambda x: len(str(x).split()))
        df['id'] = range(1, len(df) + 1)
        cached_df = df
        
    print(f"Models loaded successfully: {list(loaded_models.keys())}")
    yield
    loaded_models.clear()

app = FastAPI(
    title="SpamGuard Intelligence API",
    description="Production-grade Machine Learning & NLP API for Spam Classification and Threat Intelligence",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration for Next.js frontend
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

@app.middleware("http")
async def request_tracing_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID") or f"sg-{uuid.uuid4().hex[:8]}"
    request.state.request_id = req_id
    t_start = time.perf_counter()
    logger.info(f"[SG][{req_id}] {request.method} {request.url.path} received")
    
    response = await call_next(request)
    
    elapsed_ms = round((time.perf_counter() - t_start) * 1000, 2)
    response.headers["X-Request-ID"] = req_id
    logger.info(f"[SG][{req_id}] TOTAL: {elapsed_ms}ms (status={response.status_code})")
    return response

def extract_linguistic_signals(raw_text: str) -> LinguisticSignals:
    """Analyzes raw message for linguistic threat indicators and stylistic cues."""
    lower_text = raw_text.lower()
    words = set(re.findall(r'\b[a-z]{2,}\b', lower_text))
    
    detected_urgency = bool(words & URGENCY_KEYWORDS or re.search(r'\b(valid|expire|now|today only|12hrs)\b', lower_text))
    detected_promo = bool(words & PROMO_KEYWORDS)
    detected_financial = bool(words & FINANCIAL_KEYWORDS)
    detected_prize = bool(words & PRIZE_KEYWORDS)
    
    has_urls = bool(re.search(r'https?://|www\.', raw_text, re.IGNORECASE))
    has_currency = bool(re.search(r'[$£€₹]', raw_text))
    has_numseq = bool(re.search(r'\b\d{5,}\b', raw_text))
    excessive_punct = bool(re.search(r'[!?]{2,}', raw_text))
    
    total_letters = sum(1 for c in raw_text if c.isalpha())
    uppercase_letters = sum(1 for c in raw_text if c.isupper())
    uppercase_ratio = round((uppercase_letters / total_letters) * 100, 1) if total_letters > 0 else 0.0
    
    detected_kws = list((words & (URGENCY_KEYWORDS | PROMO_KEYWORDS | FINANCIAL_KEYWORDS | PRIZE_KEYWORDS | ACTION_KEYWORDS)))[:8]
    
    return LinguisticSignals(
        urgency_detected=detected_urgency,
        promotional_language=detected_promo,
        financial_terms=detected_financial,
        prize_language=detected_prize,
        has_urls=has_urls,
        has_currency=has_currency,
        has_numseq=has_numseq,
        excessive_punctuation=excessive_punct,
        uppercase_ratio=uppercase_ratio,
        detected_keywords=detected_kws
    )

def categorize_token(tok: str) -> str:
    t = tok.lower()
    if t in URGENCY_KEYWORDS:
        return "Urgency"
    if t in FINANCIAL_KEYWORDS:
        return "Financial"
    if t in PRIZE_KEYWORDS:
        return "Prize"
    if t in PROMO_KEYWORDS:
        return "Promotion"
    if t in ACTION_KEYWORDS:
        return "Action"
    if t in CONVERSATIONAL_KEYWORDS:
        return "Conversational"
    return "Standard"

def analyze_tokens_and_explanation(pipeline, message: str, model_id: str):
    """
    Computes token-level TF-IDF weights, model direction, and top explanatory features.
    """
    try:
        tfidf = pipeline.named_steps['tfidf']
        classifier = pipeline.named_steps['classifier']
        vocab = tfidf.vocabulary_
        feature_names = tfidf.get_feature_names_out()
        
        vec = tfidf.transform([message])
        nonzero_indices = set(vec.nonzero()[1])
        
        # Determine weight vector
        if model_id == "logistic_regression" and hasattr(classifier, "coef_"):
            weights = classifier.coef_[0]
        elif hasattr(classifier, "feature_log_prob_"):
            weights = classifier.feature_log_prob_[1] - classifier.feature_log_prob_[0]
        else:
            weights = np.zeros(len(feature_names))
            
        # Top features for explanation
        feature_contributions = []
        for idx in nonzero_indices:
            term = str(feature_names[idx])
            tf_val = float(vec[0, idx])
            contrib = float(weights[idx] * tf_val)
            direction = "spam" if contrib > 0 else "ham"
            feature_contributions.append({
                "term": term,
                "weight": round(contrib, 4),
                "direction": direction,
                "abs_weight": abs(contrib)
            })
            
        feature_contributions.sort(key=lambda x: x["abs_weight"], reverse=True)
        top_features = [
            FeatureContribution(
                term=c["term"],
                weight=c["weight"],
                direction=c["direction"]
            )
            for c in feature_contributions[:8]
        ]
        
        # Token breakdown
        raw_tokens = tokenize(clean_text(message))
        seen = set()
        token_breakdown = []
        
        for tok in raw_tokens:
            if tok in seen:
                continue
            seen.add(tok)
            
            in_voc = tok in vocab
            tfidf_w = 0.0
            contrib = 0.0
            direction = "neutral"
            
            if in_voc:
                idx = vocab[tok]
                tfidf_w = round(float(vec[0, idx]), 4) if idx in nonzero_indices else 0.0
                contrib = round(float(weights[idx] * tfidf_w), 4)
                if contrib > 0.05:
                    direction = "spam"
                elif contrib < -0.05:
                    direction = "ham"
                    
            token_breakdown.append(TokenExplorerItem(
                token=tok,
                in_vocabulary=in_voc,
                tfidf_weight=tfidf_w,
                contribution=contrib,
                direction=direction,
                category=categorize_token(tok)
            ))
            
        return top_features, token_breakdown
    except Exception as e:
        print(f"Token analysis error: {e}")
        return [], []

@app.get("/health", tags=["System"])
async def health_check():
    """
    Non-blocking health probe returning real service telemetry.
    Uses cached probes for external APIs to guarantee sub-millisecond response.
    """
    ml_h = ml_service.check_health()
    gemini_h = await asyncio.to_thread(gemini_service.check_health)
    vt_h = await asyncio.to_thread(virustotal_service.check_health)

    is_overall_healthy = ml_h.get("available", False)
    return {
        "status": "healthy" if is_overall_healthy else "degraded",
        "service": "SpamGuard Intelligence API",
        "models_loaded": list(loaded_models.keys()),
        "dataset_name": model_metadata.get("dataset_name", "SMS Spam Collection (UCI Machine Learning Repository)"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "ml": ml_h,
            "gemini": gemini_h,
            "virustotal": vt_h
        }
    }

@app.get("/diagnostics", response_model=DiagnosticsResponse, tags=["System"])
def get_diagnostics():
    """
    Returns non-sensitive health, model readiness, and service configurations.
    Safe response with possible states: ready, configured, unavailable, error.
    NEVER returns or exposes API keys or secrets.
    """
    uptime = round(time.time() - SERVER_START_TIME, 2)
    
    # ML status
    ml_status = "ready" if bool(loaded_models) else "unavailable"
    
    # Gemini status
    if not gemini_service.api_key:
        gem_status = "unavailable"
    elif gemini_service.client and not (time.time() < gemini_service._quota_exhausted_until):
        gem_status = "ready"
    elif gemini_service.client:
        gem_status = "configured"
    else:
        gem_status = "unavailable"
        
    # VirusTotal status
    if not virustotal_service.api_key:
        vt_status = "unavailable"
    elif time.time() < virustotal_service._quota_exhausted_until:
        vt_status = "configured"
    else:
        vt_status = "ready"

    return DiagnosticsResponse(
        backend="ready",
        version="2.5.0",
        uptime_seconds=uptime,
        ml={
            "status": ml_status,
            "models_loaded": list(loaded_models.keys()),
            "default_model": "naive_bayes",
            "feature_extractor": "TfidfVectorizer"
        },
        gemini={
            "status": gem_status,
            "configured": bool(gemini_service.api_key),
            "model": gemini_service.active_model
        },
        virustotal={
            "status": vt_status,
            "configured": bool(virustotal_service.api_key),
            "cache_ttl_seconds": 3600
        },
        ocr={
            "status": "ready",
            "qr_engine": "OpenCV QRCodeDetector",
            "multimodal_vision": gem_status
        },
        storage={
            "status": "ready" if cached_df is not None else "unavailable",
            "records_cached": len(cached_df) if cached_df is not None else 0,
            "dataset": "SMS Spam Collection (UCI Corpus)"
        },
        system_time=datetime.now(timezone.utc).isoformat()
    )

@app.get("/dataset-summary", tags=["Dataset"])
def get_dataset_summary():
    """Returns dynamic dataset statistics, record counts, and preview samples."""
    if not dataset_analysis:
        raise HTTPException(status_code=503, detail="Dataset summary not loaded.")
        
    return {
        "total_messages": dataset_analysis.get("total_messages", 0),
        "spam_count": dataset_analysis.get("spam_count", 0),
        "ham_count": dataset_analysis.get("ham_count", 0),
        "spam_percentage": dataset_analysis.get("spam_percentage", 0.0),
        "ham_percentage": dataset_analysis.get("ham_percentage", 0.0),
        "avg_char_length": dataset_analysis.get("avg_char_length", 0.0),
        "avg_word_count": dataset_analysis.get("avg_word_count", 0.0),
        "sample_records": dataset_analysis.get("sample_records", [])
    }

@app.get("/dataset-records", response_model=DatasetRecordsResponse, tags=["Dataset"])
def get_dataset_records(
    search: Optional[str] = Query(None, description="Search message text"),
    label: Optional[str] = Query(None, description="Filter by 'ham' or 'spam'"),
    sort_by: Optional[str] = Query("id", description="Sort field ('id', 'char_length', 'word_count', 'label')"),
    sort_dir: Optional[str] = Query("asc", description="'asc' or 'desc'"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
):
    """
    Paginated search and filter across all 5,572 records in the corpus.
    Powers the interactive Dataset Explorer.
    """
    global cached_df
    if cached_df is None:
        raise HTTPException(status_code=503, detail="Dataset not cached in memory.")
        
    filtered = cached_df
    if label and label.lower() in ["ham", "spam"]:
        filtered = filtered[filtered['label'] == label.lower()]
        
    if search and search.strip():
        q = search.strip().lower()
        filtered = filtered[filtered['message'].str.lower().str.contains(q, regex=False, na=False)]
        
    # Sort
    valid_sorts = ["id", "char_length", "word_count", "label"]
    sort_field = sort_by if sort_by in valid_sorts else "id"
    ascending = (sort_dir.lower() != "desc")
    filtered = filtered.sort_values(by=sort_field, ascending=ascending)
    
    total = len(filtered)
    total_pages = max(1, (total + limit - 1) // limit)
    offset = (page - 1) * limit
    page_df = filtered.iloc[offset:offset + limit]
    
    records = [
        DatasetRecordItem(
            id=int(row['id']),
            label=str(row['label']),
            message=str(row['message']),
            char_length=int(row['char_length']),
            word_count=int(row['word_count']),
        )
        for _, row in page_df.iterrows()
    ]
    
    return DatasetRecordsResponse(
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
        records=records
    )

@app.get("/dataset-analysis", tags=["Dataset"])
def get_dataset_analysis():
    """Returns detailed text analytics: word frequency and message length distributions."""
    if not dataset_analysis:
        raise HTTPException(status_code=503, detail="Dataset analysis not available.")
        
    return {
        "top_ham_words": dataset_analysis.get("top_ham_words", []),
        "top_spam_words": dataset_analysis.get("top_spam_words", []),
        "length_distribution": dataset_analysis.get("length_distribution", []),
        "ham_stats": dataset_analysis.get("ham_stats", {}),
        "spam_stats": dataset_analysis.get("spam_stats", {})
    }

@app.get("/model-metrics", tags=["Models"])
def get_model_metrics():
    """Returns dynamic performance metrics, confusion matrices, and threshold curves."""
    if not model_metadata:
        raise HTTPException(status_code=503, detail="Model metadata not loaded.")
        
    return model_metadata

@app.post("/preprocess-preview", response_model=PreprocessResponse, tags=["NLP Pipeline"])
def preview_preprocessing(req: PreprocessRequest):
    """
    Simulates the multi-step NLP preprocessing pipeline for a given message in real-time.
    """
    raw = req.message.strip()
    if not raw:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
        
    breakdown = get_preprocessing_breakdown(raw)
    
    matched_features = []
    total_vocab_size = 4000
    if "naive_bayes" in loaded_models:
        tfidf = loaded_models["naive_bayes"].named_steps['tfidf']
        feature_names = tfidf.get_feature_names_out()
        total_vocab_size = len(tfidf.vocabulary_)
        vec = tfidf.transform([raw])
        for idx in vec.nonzero()[1]:
            term = str(feature_names[idx])
            matched_features.append({
                "term": term,
                "tfidf_value": round(float(vec[0, idx]), 4),
                "in_vocabulary": True
            })
            
    return PreprocessResponse(
        step_1_original=breakdown["step_1_original"],
        step_2_lowercased=breakdown["step_2_lowercased"],
        step_3_cleaned=breakdown["step_3_cleaned"],
        step_4_tokens=breakdown["step_4_tokens"],
        step_5_stopwords_removed=breakdown["step_5_stopwords_removed"],
        token_count=breakdown["token_count"],
        filtered_count=breakdown["filtered_count"],
        removed_stopwords=breakdown["removed_stopwords"],
        matched_features=matched_features,
        vector_shape=[1, total_vocab_size],
        total_vocabulary_features=total_vocab_size
    )

@app.post("/predict", response_model=PredictResponse, tags=["Inference"])
def predict_spam(req: PredictRequest):
    """
    Real-time classification of an email or SMS message using the trained ML models.
    """
    t_start = time.perf_counter()
    raw_message = req.message.strip()
    if not raw_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    if len(raw_message) > 10000:
        raise HTTPException(status_code=400, detail="Message exceeds maximum allowed length of 10,000 characters.")
        
    selected_model_id = req.model_id if req.model_id in loaded_models else "naive_bayes"
    pipeline = loaded_models.get(selected_model_id)
    if not pipeline:
        raise HTTPException(status_code=500, detail=f"Model '{selected_model_id}' is not loaded.")
        
    # Model inference
    prediction_class = int(pipeline.predict([raw_message])[0])
    probabilities = pipeline.predict_proba([raw_message])[0]
    ham_prob = float(probabilities[0])
    spam_prob = float(probabilities[1])
    
    is_spam = bool(prediction_class == 1)
    label = "spam" if is_spam else "ham"
    confidence = spam_prob if is_spam else ham_prob
    
    # Message structural statistics
    words = raw_message.split()
    tokens = tokenize(clean_text(raw_message))
    filtered_tokens = remove_stopwords(tokens)
    
    has_urls = bool(re.search(r'https?://|www\.', raw_message, re.IGNORECASE))
    has_currency = bool(re.search(r'[$£€₹]', raw_message))
    has_numseq = bool(re.search(r'\b\d{5,}\b', raw_message))
    
    msg_stats = MessageStats(
        char_length=len(raw_message),
        word_count=len(words),
        token_count=len(tokens),
        filtered_token_count=len(filtered_tokens),
        has_urls=has_urls,
        has_currency=has_currency,
        has_numseq=has_numseq
    )
    
    # Linguistic Threat Signals
    signals = extract_linguistic_signals(raw_message)
    
    # Feature explanation & Token Explorer
    top_features, token_breakdown = analyze_tokens_and_explanation(pipeline, raw_message, selected_model_id)
    
    # Model display name
    model_name_map = {
        "naive_bayes": "Multinomial Naive Bayes",
        "logistic_regression": "Logistic Regression"
    }
    model_display_name = model_name_map.get(selected_model_id, selected_model_id)
    
    # Cautious interpretable explanation
    spam_indicators = [f"'{f.term}'" for f in top_features if f.direction == "spam"]
    ham_indicators = [f"'{f.term}'" for f in top_features if f.direction == "ham"]
    
    if is_spam:
        if spam_indicators:
            terms_str = ", ".join(spam_indicators[:4])
            explanation = (
                f"Classified as Spam ({round(spam_prob * 100, 1)}% probability) using {model_display_name}. "
                f"The model detected high-impact promotional or urgency tokens including {terms_str}."
            )
        else:
            explanation = (
                f"Classified as Spam ({round(spam_prob * 100, 1)}% probability) based on structural message features "
                f"and statistical token distribution."
            )
    else:
        if ham_indicators:
            terms_str = ", ".join(ham_indicators[:4])
            explanation = (
                f"Classified as Safe Ham ({round(ham_prob * 100, 1)}% confidence) using {model_display_name}. "
                f"The message exhibits conversational patterns and vocabulary such as {terms_str} without aggressive spam triggers."
            )
        else:
            explanation = (
                f"Classified as Safe Ham ({round(ham_prob * 100, 1)}% confidence) using {model_display_name}. "
                f"No significant spam triggers or high-frequency promotional patterns were identified."
            )
            
    # Multi-model comparison (Phase 13: Model Disagreement)
    alt_model_id = "logistic_regression" if selected_model_id == "naive_bayes" else "naive_bayes"
    model_comparison = None
    model_disagreement = False
    if alt_model_id in loaded_models:
        alt_pipe = loaded_models[alt_model_id]
        alt_pred_class = int(alt_pipe.predict([raw_message])[0])
        alt_probs = alt_pipe.predict_proba([raw_message])[0]
        alt_spam_prob = float(alt_probs[1])
        alt_is_spam = bool(alt_pred_class == 1)
        alt_name = model_name_map.get(alt_model_id, alt_model_id)
        if prediction_class != alt_pred_class:
            model_disagreement = True
        model_comparison = {
            "primary": {
                "model_id": selected_model_id,
                "model_name": model_display_name,
                "prediction": "spam" if is_spam else "ham",
                "probability": round(spam_prob, 4)
            },
            "secondary": {
                "model_id": alt_model_id,
                "model_name": alt_name,
                "prediction": "spam" if alt_is_spam else "ham",
                "probability": round(alt_spam_prob, 4)
            },
            "agreement": not model_disagreement
        }

    t_elapsed_ms = round((time.perf_counter() - t_start) * 1000, 2)
    
    return PredictResponse(
        prediction=label,
        is_spam=is_spam,
        spam_probability=round(spam_prob, 4),
        ham_probability=round(ham_prob, 4),
        confidence=round(confidence, 4),
        model=model_display_name,
        model_id=selected_model_id,
        process_time_ms=t_elapsed_ms,
        message_stats=msg_stats,
        linguistic_signals=signals,
        token_breakdown=token_breakdown,
        top_features=top_features,
        explanation=explanation,
        timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        model_comparison=model_comparison,
        model_disagreement=model_disagreement
    )

@app.post("/analyze-url", response_model=URLAnalyzeResponse)
async def analyze_url_endpoint(payload: URLAnalyzeRequest):
    """
    Analyzes a URL using deterministic security heuristics and VirusTotal intelligence.
    """
    if not payload.url or not payload.url.strip():
        raise HTTPException(status_code=400, detail="URL cannot be empty.")
    result = analyze_single_url(payload.url)
    
    # Enrich with VirusTotal Threat Intelligence without blocking event loop
    try:
        vt_data = await asyncio.to_thread(virustotal_service.analyze_url, payload.url)
        result["virustotal"] = vt_data
        if vt_data.get("available") and vt_data.get("stats", {}).get("malicious", 0) > 0:
            result["risk_score"] = max(result["risk_score"], vt_data.get("risk_score", 0))
            result["reasons"].extend(vt_data.get("signals", []))
    except Exception as e:
        logger.error(f"VirusTotal lookup error: {e}")

    return URLAnalyzeResponse(**result)

@app.post("/analyze-email/health-test", response_model=EmailHealthTestResponse, tags=["Testing"])
def analyze_email_health_test(payload: EmailAnalyzeRequest):
    """
    Lightweight health test endpoint for /analyze-email.
    It does NOT call external APIs (No Gemini, No VirusTotal).
    Verifies route, request validation, email parsing, local ML, and serialization.
    Executes in < 25ms.
    """
    t0 = time.perf_counter()
    req_id = f"sg-test-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6]}"

    # Validate model
    selected_model_id = payload.model_id if payload.model_id in loaded_models else "naive_bayes"
    if selected_model_id not in loaded_models:
        raise HTTPException(status_code=503, detail="Classification model not ready.")

    # Validate & Parse
    email_intel = analyze_email_payload(
        from_address=payload.from_address,
        to_address=payload.to_address,
        subject=payload.subject,
        body=payload.body,
        reply_to=payload.reply_to,
    )

    # Local ML prediction only
    composite_text = f"{payload.subject}\n{payload.body}".strip() or "Empty test email"
    predict_req = PredictRequest(message=composite_text, model_id=selected_model_id)
    ml_res = predict_spam(predict_req)

    elapsed = round((time.perf_counter() - t0) * 1000, 2)

    return EmailHealthTestResponse(
        status="ok",
        request_id=req_id,
        health_test=True,
        execution_time_ms=elapsed,
        route_status="healthy",
        parsing="passed",
        ml_status="passed",
        detected_urls_count=len(email_intel.get("extracted_urls", [])),
        sender_reply_mismatch=email_intel["header_analysis"]["sender_reply_mismatch"],
        ml_prediction={
            "prediction": ml_res.prediction,
            "confidence": ml_res.confidence,
            "is_spam": ml_res.is_spam,
            "spam_probability": ml_res.spam_probability,
            "process_time_ms": ml_res.process_time_ms,
        }
    )

@app.post("/analyze-email", response_model=EmailAnalyzeResponse)
async def analyze_email_endpoint(payload: EmailAnalyzeRequest, response: Response, request: Request):
    """
    Full email intelligence analysis:
    Runs local parsing, concurrent ML inference, VirusTotal URL threat intelligence,
    and Gemini AI social engineering analysis via non-blocking worker threads.
    """
    t_start = time.perf_counter()
    incoming_id = request.headers.get("X-Request-ID") if hasattr(request, "headers") else None
    state_id = getattr(request.state, "request_id", None) if hasattr(request, "state") else None
    req_id = incoming_id or state_id or f"sg-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6]}"
    response.headers["X-Request-ID"] = req_id

    body_len = len(payload.body or "")
    logger.info(f"[SG][{req_id}] /analyze-email received (body_chars={body_len})")

    # 1. Validation & email parsing (Local)
    t_parse_start = time.perf_counter()
    if body_len > 100000:
        raise HTTPException(status_code=413, detail="Email body exceeds maximum allowed size (100,000 characters).")

    selected_model_id = payload.model_id if payload.model_id in loaded_models else "naive_bayes"
    if selected_model_id not in loaded_models:
        raise HTTPException(status_code=503, detail="Classification model not ready.")

    email_intel = analyze_email_payload(
        from_address=payload.from_address,
        to_address=payload.to_address,
        subject=payload.subject,
        body=payload.body,
        reply_to=payload.reply_to,
    )
    t_parse_ms = round((time.perf_counter() - t_parse_start) * 1000, 2)
    logger.info(f"[SG][{req_id}] parsing: {t_parse_ms}ms")

    composite_text = f"{payload.subject}\n{payload.body}".strip() or "Empty message"

    # Tasks for concurrent background execution
    def _run_ml():
        t0 = time.perf_counter()
        req = PredictRequest(message=composite_text, model_id=selected_model_id)
        res = predict_spam(req)
        return res, round((time.perf_counter() - t0) * 1000, 2)

    target_url = email_intel["extracted_urls"][0]["url"] if email_intel["extracted_urls"] else None
    def _run_vt():
        if not target_url:
            return None, 0.0
        t0 = time.perf_counter()
        try:
            res = virustotal_service.analyze_url(target_url, timeout=2.5)
        except Exception as e:
            logger.error(f"[SG][{req_id}] VirusTotal error: {e}")
            res = {"available": False, "status": "unavailable", "signals": ["External threat intelligence unavailable."], "risk_score": 0, "error": str(e)}
        return res, round((time.perf_counter() - t0) * 1000, 2)

    def _run_gemini():
        t0 = time.perf_counter()
        try:
            res = gemini_service.analyze_text(composite_text, timeout=3.2)
        except Exception as e:
            logger.error(f"[SG][{req_id}] Gemini error: {e}")
            res = {"available": False, "status": "unavailable", "signals": [], "risk_score": 0, "error": str(e)}
        return res, round((time.perf_counter() - t0) * 1000, 2)

    # 2. Concurrently execute independent analyses without blocking asyncio event loop
    try:
        (ml_res, ml_ms), (vt_res, vt_ms), (gemini_res, gemini_ms) = await asyncio.wait_for(
            asyncio.gather(
                asyncio.to_thread(_run_ml),
                asyncio.to_thread(_run_vt),
                asyncio.to_thread(_run_gemini)
            ),
            timeout=3.6
        )
    except asyncio.TimeoutError:
        logger.warning(f"[SG][{req_id}] External lookup ceiling reached (3.6s). Finalizing with local ML and heuristics.")
        req = PredictRequest(message=composite_text, model_id=selected_model_id)
        ml_res = predict_spam(req)
        ml_ms = 4.0
        vt_res = {"available": False, "status": "timeout", "signals": ["External threat intelligence unavailable (lookup timed out)."], "risk_score": 0}
        vt_ms = 3600.0
        gemini_res = {"available": False, "status": "timeout", "signals": ["Gemini AI analysis timed out; baseline secured via local heuristics."], "risk_score": 0}
        gemini_ms = 3600.0
    except Exception as e:
        logger.error(f"[SG][{req_id}] Gathering error: {e}")
        req = PredictRequest(message=composite_text, model_id=selected_model_id)
        ml_res = predict_spam(req)
        ml_ms = 4.0
        vt_res = {"available": False, "status": "unavailable", "signals": ["External threat intelligence unavailable."], "risk_score": 0}
        vt_ms = 0.0
        gemini_res = {"available": False, "status": "unavailable", "signals": [], "risk_score": 0}
        gemini_ms = 0.0

    logger.info(f"[SG][{req_id}] ML completed: {ml_ms}ms (is_spam={ml_res.is_spam})")
    vt_status = vt_res.get("status") if vt_res else "skipped (no urls)"
    logger.info(f"[SG][{req_id}] VirusTotal completed: {vt_ms}ms (status={vt_status})")
    gem_status = gemini_res.get("status") if gemini_res else "unavailable"
    logger.info(f"[SG][{req_id}] Gemini completed: {gemini_ms}ms (status={gem_status})")

    # Update email_intel with VT results
    if vt_res and vt_res.get("available") and vt_res.get("risk_score", 0) > email_intel["highest_url_risk"]:
        email_intel["highest_url_risk"] = vt_res["risk_score"]

    # 3. Risk engine aggregation (Local math)
    t_risk_start = time.perf_counter()
    gemini_ok = bool(gemini_res and gemini_res.get("available"))
    vt_ok = bool(vt_res and vt_res.get("available"))

    if gemini_ok and (vt_ok or not target_url):
        analysis_mode = "standard"
    elif not gemini_ok and not vt_ok and target_url:
        analysis_mode = "limited"
    else:
        analysis_mode = "degraded"

    ml_risk_component = int(ml_res.spam_probability * 100)
    header_risk_component = email_intel["header_analysis"]["header_risk_score"]
    url_risk_component = email_intel["highest_url_risk"]
    gemini_risk_component = gemini_res.get("risk_score", ml_risk_component) if gemini_ok else ml_risk_component

    if gemini_ok:
        overall_risk = int(
            (ml_risk_component * 0.35) +
            (gemini_risk_component * 0.25) +
            (header_risk_component * 0.20) +
            (url_risk_component * 0.20)
        )
    else:
        overall_risk = int(
            (ml_risk_component * 0.50) +
            (header_risk_component * 0.25) +
            (url_risk_component * 0.25)
        )
    overall_risk = min(100, max(0, overall_risk))

    if overall_risk <= 20:
        threat_lvl = "SAFE"
    elif overall_risk <= 40:
        threat_lvl = "LOW_RISK"
    elif overall_risk <= 60:
        threat_lvl = "SUSPICIOUS"
    elif overall_risk <= 80:
        threat_lvl = "HIGH_RISK"
    else:
        threat_lvl = "CRITICAL"

    reasons: List[str] = []
    if ml_res.is_spam:
        reasons.append(f"ML Classifier ({ml_res.model}) flagged textual content as Spam ({round(ml_res.spam_probability * 100, 1)}% probability).")
    reasons.extend(email_intel["header_analysis"]["header_flags"])
    reasons.extend(email_intel["content_analysis"]["content_flags"])
    if url_risk_component >= 50:
        reasons.append(f"High-risk embedded URL detected (Risk Score: {url_risk_component}/100).")
    if gemini_res and gemini_res.get("signals"):
        reasons.extend(gemini_res["signals"][:2])
    elif gemini_res and gemini_res.get("status") == "timeout":
        reasons.append("AI threat analysis timed out; baseline secured via ML and header heuristics.")

    recommended_actions: List[str] = []
    if gemini_res and gemini_res.get("recommendations"):
        recommended_actions.extend(gemini_res["recommendations"][:4])
    elif overall_risk >= 50:
        recommended_actions.append("Do NOT click any hyperlinks or download attachments in this email.")
        if email_intel["header_analysis"]["sender_reply_mismatch"]:
            recommended_actions.append("Verify the sender through an independent, verified communication channel.")
        if email_intel["content_analysis"]["credential_harvesting_detected"]:
            recommended_actions.append("Never enter passwords, PINs, or credentials from email prompts.")
        recommended_actions.append("Mark this message as phishing/spam and block the sender address.")
    else:
        recommended_actions.append("Message appears consistent with standard communication patterns.")
        recommended_actions.append("Continue to exercise routine security precautions with unexpected links.")

    t_risk_ms = round((time.perf_counter() - t_risk_start) * 1000, 2)
    logger.info(f"[SG][{req_id}] Risk engine completed: {t_risk_ms}ms")

    total_time_ms = round((time.perf_counter() - t_start) * 1000, 2)
    logger.info(f"[SG][{req_id}] TOTAL: {total_time_ms}ms (risk={overall_risk})")

    return EmailAnalyzeResponse(
        overall_risk_score=overall_risk,
        threat_level=threat_lvl,
        is_threat=overall_risk >= 50,
        ml_prediction=ml_res,
        header_analysis=email_intel["header_analysis"],
        content_analysis=email_intel["content_analysis"],
        extracted_urls=[URLAnalyzeResponse(**u) for u in email_intel["extracted_urls"]],
        highest_url_risk=url_risk_component,
        recommended_actions=recommended_actions,
        reasons=reasons if reasons else ["No prominent threat indicators detected."],
        virustotal=vt_res,
        gemini=gemini_res,
        request_id=req_id,
        analysis_mode=analysis_mode,
        execution_time_ms=total_time_ms,
        timings={
            "parsing_ms": t_parse_ms,
            "ml_ms": ml_ms,
            "virustotal_ms": vt_ms,
            "gemini_ms": gemini_ms,
            "risk_calc_ms": t_risk_ms,
            "total_ms": total_time_ms,
        }
    )

@app.post("/analyze-image", response_model=ImageAnalyzeResponse)
async def analyze_image_endpoint(file: UploadFile = File(...)):
    """
    Multimodal image analysis:
    Extracts QR codes using OpenCV, computes image metadata,
    and runs Gemini multimodal OCR and visual threat inspection.
    """
    MAX_SIZE = 10 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Image file exceeds maximum allowable size (10 MB).")

    # Non-blocking OpenCV QR parsing in thread pool
    qr_res = await asyncio.to_thread(detect_qr_code_from_bytes, content)
    qr_url = URLAnalyzeResponse(**qr_res["qr_url_analysis"]) if qr_res.get("qr_url_analysis") else None

    # Run Gemini multimodal inspection in thread pool
    gemini_data = None
    try:
        gemini_data = await asyncio.to_thread(
            gemini_service.analyze_image,
            content,
            file.content_type or "image/png"
        )
    except Exception as e:
        logger.error(f"Gemini image analysis error: {e}")

    return ImageAnalyzeResponse(
        has_qr=qr_res.get("has_qr", False),
        qr_payload=qr_res.get("qr_payload"),
        is_url=qr_res.get("is_url", False),
        qr_url_analysis=qr_url,
        metadata=qr_res.get("metadata", {}),
        status="success",
        gemini=gemini_data,
    )

@app.post("/unified-scan", response_model=UnifiedScanResponse, tags=["Inference"])
async def unified_scan_endpoint(req: UnifiedScanRequest):
    """
    Unified AI Threat Scanner API:
    Executes ML Model + Google Gemini + VirusTotal + Local Heuristics
    through the centralized RiskEngine with full signal aggregation.
    """
    result = await asyncio.to_thread(
        risk_engine.assess_threat,
        content=req.content,
        input_type=req.input_type,
        model_id=req.model_id,
        email_data=req.email_data
    )
    return UnifiedScanResponse(**result)

@app.post("/copilot-chat", response_model=CopilotChatResponse, tags=["Copilot"])
async def copilot_chat_endpoint(req: CopilotChatRequest):
    """
    Security Copilot Conversational Assistant:
    Grounded strictly in the active scan result using Gemini 2.5 Flash
    with rule-based fallback if external API is unreachable.
    """
    response_text = await asyncio.to_thread(
        gemini_service.copilot_chat,
        user_query=req.query,
        scan_context=req.scan_context,
        history=req.history
    )
    return CopilotChatResponse(
        response=response_text,
        provider="Google Gemini (gemini-2.5-flash)" if gemini_service.client else "Local Deterministic Fallback",
        model=gemini_service.active_model,
        timestamp=datetime.now(timezone.utc).isoformat()
    )


# -------------------------------------------------------------
# User Feedback Loop & Continuous Improvement Endpoints
# -------------------------------------------------------------
user_feedback_records: List[Dict[str, Any]] = []

@app.post("/feedback", response_model=FeedbackStatsResponse, tags=["Feedback"])
def submit_feedback_endpoint(feedback: FeedbackSubmission):
    """
    Records user feedback for scan accuracy to power continuous evaluation.
    """
    entry = feedback.dict()
    if not entry.get("timestamp"):
        entry["timestamp"] = datetime.now(timezone.utc).isoformat()
    user_feedback_records.append(entry)

    total = len(user_feedback_records)
    helpful = sum(1 for f in user_feedback_records if f.get("helpful"))
    unhelpful = total - helpful
    helpful_rate = round((helpful / total * 100), 1) if total > 0 else 100.0

    issue_breakdown: Dict[str, int] = {}
    for f in user_feedback_records:
        if not f.get("helpful") and f.get("issue_type"):
            issue_breakdown[f["issue_type"]] = issue_breakdown.get(f["issue_type"], 0) + 1

    return FeedbackStatsResponse(
        total_feedback=total,
        helpful_count=helpful,
        unhelpful_count=unhelpful,
        helpful_rate_percent=helpful_rate,
        issue_breakdown=issue_breakdown
    )

@app.get("/feedback-stats", response_model=FeedbackStatsResponse, tags=["Feedback"])
def get_feedback_stats_endpoint():
    """Returns aggregated feedback analytics."""
    total = len(user_feedback_records)
    helpful = sum(1 for f in user_feedback_records if f.get("helpful"))
    unhelpful = total - helpful
    helpful_rate = round((helpful / total * 100), 1) if total > 0 else 100.0

    issue_breakdown: Dict[str, int] = {}
    for f in user_feedback_records:
        if not f.get("helpful") and f.get("issue_type"):
            issue_breakdown[f["issue_type"]] = issue_breakdown.get(f["issue_type"], 0) + 1

    return FeedbackStatsResponse(
        total_feedback=total,
        helpful_count=helpful,
        unhelpful_count=unhelpful,
        helpful_rate_percent=helpful_rate,
        issue_breakdown=issue_breakdown
    )

