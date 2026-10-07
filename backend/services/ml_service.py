"""
SpamGuard ML Service Abstraction
Encapsulates Scikit-Learn Multinomial Naive Bayes and Logistic Regression pipelines,
TF-IDF feature attribution, and linguistic signal extraction.
Preserves existing model weights, datasets, and preprocessing without modification.
"""

import os
import re
import time
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
import joblib
import numpy as np

logger = logging.getLogger("spamguard.ml")

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
MODELS_DIR = os.path.join(BACKEND_DIR, "models")
NB_PATH = os.path.join(MODELS_DIR, "spam_pipeline_nb.joblib")
LR_PATH = os.path.join(MODELS_DIR, "spam_pipeline_lr.joblib")
METADATA_PATH = os.path.join(MODELS_DIR, "model_metadata.json")

# Keywords
URGENCY_KEYWORDS = {"urgent", "immediately", "expire", "expires", "expiring", "valid", "hurry", "now", "today", "instant", "last", "chance"}
PROMO_KEYWORDS = {"free", "discount", "offer", "ringtone", "tones", "poly", "polyphonic", "promo", "voucher", "deal", "cheap"}
FINANCIAL_KEYWORDS = {"cash", "reward", "prize", "payout", "bonus", "cost", "fee", "rate", "guaranteed", "loan", "debt", "refund"}
PRIZE_KEYWORDS = {"won", "win", "winner", "winning", "selected", "awarded", "claim", "claims", "congratulations", "draw"}
ACTION_KEYWORDS = {"call", "txt", "text", "reply", "dial", "send", "stop", "unsubscribe", "visit", "click"}
CONVERSATIONAL_KEYWORDS = {"hey", "hello", "hi", "ok", "got", "come", "home", "good", "later", "sorry", "thanks", "love", "night", "morning", "meet", "meeting"}

class MLService:
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.metadata: Dict[str, Any] = {}
        self._load_models()

    def _load_models(self):
        try:
            if os.path.exists(NB_PATH):
                self.models["naive_bayes"] = joblib.load(NB_PATH)
            if os.path.exists(LR_PATH):
                self.models["logistic_regression"] = joblib.load(LR_PATH)
            if os.path.exists(METADATA_PATH):
                with open(METADATA_PATH, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
            logger.info(f"MLService loaded models: {list(self.models.keys())}")
        except Exception as e:
            logger.error(f"Failed to load ML models: {e}")

    def check_health(self) -> Dict[str, Any]:
        """Verifies models are present in memory and operational."""
        is_ready = bool("naive_bayes" in self.models and "logistic_regression" in self.models)
        return {
            "status": "connected" if is_ready else "unavailable",
            "available": is_ready,
            "models_loaded": list(self.models.keys()),
            "dataset_records": 5572,
            "error": None if is_ready else "Models not loaded from disk."
        }

    def predict(self, text: str, model_id: str = "naive_bayes") -> Dict[str, Any]:
        """
        Runs ML prediction with full feature attribution and linguistic signals.
        Returns: prediction, probability, model, signals, top_features, token_breakdown.
        """
        raw_text = text.strip()
        if not raw_text:
            return {
                "available": False,
                "status": "error",
                "error": "Empty text provided"
            }

        selected_id = model_id if model_id in self.models else "naive_bayes"
        pipeline = self.models.get(selected_id)
        if not pipeline:
            return {
                "available": False,
                "status": "unavailable",
                "error": f"Model {selected_id} is not loaded"
            }

        t0 = time.perf_counter()
        pred_class = int(pipeline.predict([raw_text])[0])
        probabilities = pipeline.predict_proba([raw_text])[0]
        ham_prob = float(probabilities[0])
        spam_prob = float(probabilities[1])
        is_spam = (pred_class == 1)
        conf = spam_prob if is_spam else ham_prob

        # Model display name
        display_names = {
            "naive_bayes": "Multinomial Naive Bayes",
            "logistic_regression": "Logistic Regression"
        }
        model_name = display_names.get(selected_id, selected_id)

        # Feature explanation & Token Explorer
        top_features, token_breakdown = self._analyze_tokens(pipeline, raw_text, selected_id)

        # Extract linguistic threat signals
        linguistic = self._extract_linguistic_signals(raw_text)

        signals = []
        if is_spam:
            signals.append(f"ML Classifier: Flagged as SPAM with {round(spam_prob * 100, 1)}% probability")
            for f in top_features[:3]:
                if f["direction"] == "spam":
                    signals.append(f"ML Feature: Suspicious term '{f['term']}' (weight {f['weight']})")
        else:
            signals.append(f"ML Classifier: Evaluated as SAFE with {round(ham_prob * 100, 1)}% certainty")

        if linguistic["urgency_detected"]:
            signals.append("Linguistic: Urgency manipulation keyword detected")
        if linguistic["has_urls"]:
            signals.append("Linguistic: Embedded web hyperlink detected")
        if linguistic["financial_terms"]:
            signals.append("Linguistic: Financial/monetary transaction term detected")
        if linguistic["prize_language"]:
            signals.append("Linguistic: Prize/lottery winning claim detected")

        # Multi-model comparison (Phase 13: Model Disagreement)
        model_comparison = None
        model_disagreement = False
        disagreement_details = None

        alt_id = "logistic_regression" if selected_id == "naive_bayes" else "naive_bayes"
        if alt_id in self.models:
            alt_pipeline = self.models[alt_id]
            alt_pred_class = int(alt_pipeline.predict([raw_text])[0])
            alt_probs = alt_pipeline.predict_proba([raw_text])[0]
            alt_spam_prob = float(alt_probs[1])
            alt_name = display_names.get(alt_id, alt_id)
            
            if pred_class != alt_pred_class:
                model_disagreement = True
                disagreement_details = (
                    f"Model Disagreement: {model_name} predicts {'SPAM' if pred_class == 1 else 'HAM'} ({round(spam_prob * 100, 1)}%), "
                    f"whereas {alt_name} predicts {'SPAM' if alt_pred_class == 1 else 'HAM'} ({round(alt_spam_prob * 100, 1)}%)."
                )
                signals.append(disagreement_details)

            model_comparison = {
                "primary": {
                    "model_id": selected_id,
                    "model_name": model_name,
                    "prediction": "spam" if is_spam else "ham",
                    "probability": round(spam_prob, 4)
                },
                "secondary": {
                    "model_id": alt_id,
                    "model_name": alt_name,
                    "prediction": "spam" if alt_pred_class == 1 else "ham",
                    "probability": round(alt_spam_prob, 4)
                },
                "agreement": not model_disagreement,
                "disagreement_details": disagreement_details
            }

        latency_ms = round((time.perf_counter() - t0) * 1000, 2)

        return {
            "available": True,
            "status": "available",
            "prediction": "spam" if is_spam else "ham",
            "is_spam": is_spam,
            "probability": round(spam_prob, 4),
            "ham_probability": round(ham_prob, 4),
            "confidence": round(conf, 4),
            "risk_score": int(round(spam_prob * 100)),
            "model": model_name,
            "model_id": selected_id,
            "latency_ms": latency_ms,
            "signals": signals,
            "top_features": top_features,
            "token_breakdown": token_breakdown,
            "linguistic_signals": linguistic,
            "model_disagreement": model_disagreement,
            "disagreement_details": disagreement_details,
            "model_comparison": model_comparison
        }

    def _extract_linguistic_signals(self, raw_text: str) -> Dict[str, Any]:
        lower_text = raw_text.lower()
        words = set(re.findall(r'\b[a-z]{2,}\b', lower_text))

        return {
            "urgency_detected": bool(words & URGENCY_KEYWORDS or re.search(r'\b(valid|expire|now|today only|12hrs)\b', lower_text)),
            "promotional_language": bool(words & PROMO_KEYWORDS),
            "financial_terms": bool(words & FINANCIAL_KEYWORDS),
            "prize_language": bool(words & PRIZE_KEYWORDS),
            "has_urls": bool(re.search(r'https?://|www\.', raw_text, re.IGNORECASE)),
            "has_currency": bool(re.search(r'[$£€₹]', raw_text)),
            "has_numseq": bool(re.search(r'\b\d{5,}\b', raw_text)),
            "excessive_punctuation": bool(re.search(r'[!?]{2,}', raw_text)),
            "uppercase_ratio": round((sum(1 for c in raw_text if c.isupper()) / max(1, sum(1 for c in raw_text if c.isalpha()))) * 100, 1),
            "detected_keywords": list((words & (URGENCY_KEYWORDS | PROMO_KEYWORDS | FINANCIAL_KEYWORDS | PRIZE_KEYWORDS | ACTION_KEYWORDS)))[:8]
        }

    def _analyze_tokens(self, pipeline, message: str, model_id: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        try:
            from app.preprocessor import clean_text, tokenize
            tfidf = pipeline.named_steps['tfidf']
            classifier = pipeline.named_steps['classifier']
            vocab = tfidf.vocabulary_
            feature_names = tfidf.get_feature_names_out()

            vec = tfidf.transform([message])
            nonzero_indices = set(vec.nonzero()[1])

            if model_id == "logistic_regression" and hasattr(classifier, "coef_"):
                weights = classifier.coef_[0]
            elif hasattr(classifier, "feature_log_prob_"):
                weights = classifier.feature_log_prob_[1] - classifier.feature_log_prob_[0]
            else:
                weights = np.zeros(len(feature_names))

            feature_contributions = []
            for idx in nonzero_indices:
                term = str(feature_names[idx])
                tf_val = float(vec[0, idx])
                contrib = float(weights[idx] * tf_val)
                feature_contributions.append({
                    "term": term,
                    "weight": round(contrib, 4),
                    "direction": "spam" if contrib > 0 else "ham",
                    "abs_weight": abs(contrib)
                })

            feature_contributions.sort(key=lambda x: x["abs_weight"], reverse=True)
            top_features = [
                {"term": c["term"], "weight": c["weight"], "direction": c["direction"]}
                for c in feature_contributions[:8]
            ]

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

                token_breakdown.append({
                    "token": tok,
                    "in_vocabulary": in_voc,
                    "tfidf_weight": tfidf_w,
                    "contribution": contrib,
                    "direction": direction
                })

            return top_features, token_breakdown
        except Exception as e:
            logger.error(f"Token analysis error: {e}")
            return [], []


# Singleton instance
ml_service = MLService()
