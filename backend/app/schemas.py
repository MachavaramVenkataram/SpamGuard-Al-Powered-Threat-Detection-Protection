from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class PredictRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000, description="The email or SMS message to classify")
    model_id: Optional[str] = Field(default="naive_bayes", description="Model to use ('naive_bayes' or 'logistic_regression')")

class FeatureContribution(BaseModel):
    term: str
    weight: float
    direction: str  # 'spam' or 'ham'

class MessageStats(BaseModel):
    char_length: int
    word_count: int
    token_count: int
    filtered_token_count: int
    has_urls: bool
    has_currency: bool
    has_numseq: bool

class LinguisticSignals(BaseModel):
    urgency_detected: bool
    promotional_language: bool
    financial_terms: bool
    prize_language: bool
    has_urls: bool
    has_currency: bool
    has_numseq: bool
    excessive_punctuation: bool
    uppercase_ratio: float
    detected_keywords: List[str]

class TokenExplorerItem(BaseModel):
    token: str
    in_vocabulary: bool
    tfidf_weight: float
    contribution: float
    direction: str  # 'spam' | 'ham' | 'neutral'
    category: str

class PredictResponse(BaseModel):
    prediction: str  # 'spam' or 'ham'
    is_spam: bool
    spam_probability: float
    ham_probability: float
    confidence: float
    model: str
    model_id: str
    process_time_ms: float
    message_stats: MessageStats
    linguistic_signals: LinguisticSignals
    token_breakdown: List[TokenExplorerItem]
    top_features: List[FeatureContribution]
    explanation: str
    timestamp: str
    model_comparison: Optional[Dict[str, Any]] = None
    model_disagreement: Optional[bool] = False

class PreprocessRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)

class PreprocessResponse(BaseModel):
    step_1_original: str
    step_2_lowercased: str
    step_3_cleaned: str
    step_4_tokens: List[str]
    step_5_stopwords_removed: List[str]
    token_count: int
    filtered_count: int
    removed_stopwords: List[str]
    matched_features: List[Dict[str, Any]]
    vector_shape: List[int]
    total_vocabulary_features: int

class DatasetRecordItem(BaseModel):
    id: int
    label: str
    message: str
    char_length: int
    word_count: int

class DatasetRecordsResponse(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
    records: List[DatasetRecordItem]

class URLAnalyzeRequest(BaseModel):
    url: str = Field(..., min_length=1, max_length=2048)

class URLAnalyzeResponse(BaseModel):
    url: str
    normalized_url: str
    protocol: str
    is_https: bool
    domain: str
    tld: str
    subdomains: List[str]
    subdomain_count: int
    path: str
    query: str
    query_param_count: int
    is_ip_address: bool
    is_shortened: bool
    shortener_service: Optional[str] = None
    has_punycode: bool
    has_at_symbol: bool
    suspicious_path_keywords: List[str]
    risk_score: int
    risk_level: str
    reasons: List[str]
    reputation_source: str
    components: Dict[str, Optional[str]]
    virustotal: Optional[Dict[str, Any]] = None

class EmailAnalyzeRequest(BaseModel):
    from_address: str = Field(default="")
    to_address: str = Field(default="")
    subject: str = Field(default="")
    body: str = Field(..., min_length=1, max_length=100000)
    reply_to: str = Field(default="")
    model_id: str = Field(default="naive_bayes")

class EmailAnalyzeResponse(BaseModel):
    overall_risk_score: int
    threat_level: str
    is_threat: bool
    ml_prediction: PredictResponse
    header_analysis: Dict[str, Any]
    content_analysis: Dict[str, Any]
    extracted_urls: List[URLAnalyzeResponse]
    highest_url_risk: int
    recommended_actions: List[str]
    reasons: List[str]
    virustotal: Optional[Dict[str, Any]] = None
    gemini: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None
    analysis_mode: Optional[str] = "standard"
    execution_time_ms: Optional[float] = None
    timings: Optional[Dict[str, float]] = None

class DiagnosticsResponse(BaseModel):
    backend: str
    version: str
    uptime_seconds: float
    ml: Dict[str, Any]
    gemini: Dict[str, Any]
    virustotal: Dict[str, Any]
    ocr: Optional[Dict[str, Any]] = None
    storage: Optional[Dict[str, Any]] = None
    system_time: str

class EmailHealthTestResponse(BaseModel):
    status: str
    request_id: str
    health_test: bool
    execution_time_ms: float
    route_status: str
    parsing: str
    ml_status: str
    detected_urls_count: int
    sender_reply_mismatch: bool
    ml_prediction: Dict[str, Any]

class ImageAnalyzeResponse(BaseModel):
    has_qr: bool
    qr_payload: Optional[str] = None
    is_url: bool
    qr_url_analysis: Optional[URLAnalyzeResponse] = None
    metadata: Dict[str, Any]
    status: str
    gemini: Optional[Dict[str, Any]] = None

# New Unified SaaS Architecture Schemas
class UnifiedScanRequest(BaseModel):
    content: str = Field(default="", description="The text, email payload, or URL to inspect")
    input_type: str = Field(default="text", description="'text' | 'email' | 'url' | 'image' | 'file'")
    model_id: str = Field(default="naive_bayes")
    email_data: Optional[Dict[str, str]] = None

class UnifiedScanResponse(BaseModel):
    risk_score: int
    risk_level: str
    classification: str
    confidence: Optional[str] = "high"
    status: Optional[str] = "completed"
    input_type: str
    timestamp: str
    ml: Dict[str, Any]
    gemini: Dict[str, Any]
    virustotal: Dict[str, Any]
    heuristics: Dict[str, Any]
    local_signals: Optional[Dict[str, Any]] = None
    evidence: Optional[List[Dict[str, Any]]] = None
    red_flags: Optional[List[Dict[str, Any]]] = None
    action_plan: Optional[Dict[str, Any]] = None
    safe_checks: Optional[List[str]] = None
    recommendations: List[str]
    sources: Dict[str, str]
    calculation_breakdown: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None
    execution_time_ms: Optional[float] = None
    timings: Optional[Dict[str, float]] = None

class FeedbackSubmission(BaseModel):
    scan_id: Optional[str] = None
    helpful: bool
    issue_type: Optional[str] = None
    comment: Optional[str] = None
    user_classification: Optional[str] = None
    timestamp: Optional[str] = None

class FeedbackStatsResponse(BaseModel):
    total_feedback: int
    helpful_count: int
    unhelpful_count: int
    helpful_rate_percent: float
    issue_breakdown: Dict[str, int]

class CopilotChatRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Question asked by user")
    scan_context: Dict[str, Any] = Field(..., description="Active scan results dictionary")
    history: Optional[List[Dict[str, str]]] = None

class CopilotChatResponse(BaseModel):
    response: str
    provider: str
    model: str
    timestamp: str

class ServiceHealthStatus(BaseModel):
    status: str  # 'connected' | 'degraded' | 'unavailable'
    available: bool
    latency_ms: Optional[float] = None
    error: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class ApiHealthResponse(BaseModel):
    status: str
    service: str
    timestamp: str
    services: Dict[str, ServiceHealthStatus]
