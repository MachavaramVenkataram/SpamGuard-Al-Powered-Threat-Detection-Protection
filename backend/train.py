import os
import sys
import json
import numpy as np
import pandas as pd
from collections import Counter
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    roc_auc_score,
)
import joblib
import time

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.preprocessor import clean_text, tokenize, remove_stopwords, TextCleaner, STOPWORDS

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "sms_spam_collection.csv")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def train_and_evaluate():
    print(f"Loading dataset from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)
    
    # Validation & cleaning
    df = df.dropna(subset=['message', 'label'])
    df['message'] = df['message'].astype(str)
    df['label'] = df['label'].astype(str).str.strip().str.lower()
    
    # Filter valid labels
    df = df[df['label'].isin(['ham', 'spam'])].copy()
    
    total_messages = len(df)
    spam_count = int((df['label'] == 'spam').sum())
    ham_count = int((df['label'] == 'ham').sum())
    spam_pct = round((spam_count / total_messages) * 100, 2)
    ham_pct = round((ham_count / total_messages) * 100, 2)
    
    print(f"Total: {total_messages}, Ham: {ham_count} ({ham_pct}%), Spam: {spam_count} ({spam_pct}%)")
    
    # Compute message lengths & word counts
    df['char_length'] = df['message'].apply(len)
    df['word_count'] = df['message'].apply(lambda x: len(x.split()))
    
    ham_df = df[df['label'] == 'ham']
    spam_df = df[df['label'] == 'spam']
    
    # Word frequency analysis (pure NLP from cleaned tokens)
    def extract_top_words(texts, top_n=25):
        words = []
        for t in texts:
            cleaned = clean_text(t)
            tokens = tokenize(cleaned)
            filtered = remove_stopwords(tokens)
            words.extend(filtered)
        counter = Counter(words)
        return [{"word": w, "count": c} for w, c in counter.most_common(top_n)]
    
    top_ham_words = extract_top_words(ham_df['message'], 25)
    top_spam_words = extract_top_words(spam_df['message'], 25)
    
    # Message length distribution bins
    bins = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 300, 1000]
    bin_labels = ["0-20", "21-40", "41-60", "61-80", "81-100", "101-120", "121-140", "141-160", "161-180", "181-200", "201-300", "300+"]
    
    ham_hist, _ = np.histogram(ham_df['char_length'], bins=bins)
    spam_hist, _ = np.histogram(spam_df['char_length'], bins=bins)
    
    length_distribution = []
    for lbl, h_count, s_count in zip(bin_labels, ham_hist, spam_hist):
        length_distribution.append({
            "range": lbl,
            "ham": int(h_count),
            "spam": int(s_count)
        })
        
    dataset_summary = {
        "total_messages": total_messages,
        "spam_count": spam_count,
        "ham_count": ham_count,
        "spam_percentage": spam_pct,
        "ham_percentage": ham_pct,
        "avg_char_length": round(float(df['char_length'].mean()), 2),
        "avg_word_count": round(float(df['word_count'].mean()), 2),
        "ham_stats": {
            "mean_char_length": round(float(ham_df['char_length'].mean()), 2),
            "median_char_length": round(float(ham_df['char_length'].median()), 2),
            "min_char_length": int(ham_df['char_length'].min()),
            "max_char_length": int(ham_df['char_length'].max()),
            "mean_word_count": round(float(ham_df['word_count'].mean()), 2),
        },
        "spam_stats": {
            "mean_char_length": round(float(spam_df['char_length'].mean()), 2),
            "median_char_length": round(float(spam_df['char_length'].median()), 2),
            "min_char_length": int(spam_df['char_length'].min()),
            "max_char_length": int(spam_df['char_length'].max()),
            "mean_word_count": round(float(spam_df['word_count'].mean()), 2),
        },
        "sample_records": [
            {"id": int(i), "label": row['label'], "message": row['message']}
            for i, row in pd.concat([ham_df.sample(n=5, random_state=42), spam_df.sample(n=5, random_state=42)]).sample(frac=1.0, random_state=42).iterrows()
        ],
        "top_ham_words": top_ham_words,
        "top_spam_words": top_spam_words,
        "length_distribution": length_distribution
    }
    
    # Save dataset analysis JSON
    analysis_file = os.path.join(MODELS_DIR, "dataset_analysis.json")
    with open(analysis_file, "w", encoding="utf-8") as f:
        json.dump(dataset_summary, f, indent=2)
    print(f"Saved dataset analysis to {analysis_file}")

    # Prepare ML split
    # Map label: ham -> 0, spam -> 1
    X = df['message']
    y = (df['label'] == 'spam').astype(int).values
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    print(f"Train samples: {len(X_train)} (Spam: {y_train.sum()}), Test samples: {len(X_test)} (Spam: {y_test.sum()})")
    
    # Feature Extraction Comparison: Bag of Words vs TF-IDF
    bow_vectorizer = CountVectorizer(max_features=4000, ngram_range=(1, 2), stop_words='english')
    X_train_cleaned = [clean_text(t) for t in X_train]
    bow_vectorizer.fit(X_train_cleaned)
    bow_features_count = len(bow_vectorizer.vocabulary_)
    
    tfidf_vectorizer = TfidfVectorizer(max_features=4000, ngram_range=(1, 2), sublinear_tf=True, stop_words='english')
    tfidf_vectorizer.fit(X_train_cleaned)
    tfidf_features_count = len(tfidf_vectorizer.vocabulary_)
    
    sample_vocab_terms = list(tfidf_vectorizer.vocabulary_.keys())[:30]
    
    # Train Model 1: Multinomial Naive Bayes Pipeline
    nb_pipeline = Pipeline([
        ('cleaner', TextCleaner()),
        ('tfidf', TfidfVectorizer(max_features=4000, ngram_range=(1, 2), sublinear_tf=True, stop_words='english')),
        ('classifier', MultinomialNB(alpha=0.1))
    ])
    
    print("Training Multinomial Naive Bayes pipeline...")
    t0_nb = time.perf_counter()
    nb_pipeline.fit(X_train, y_train)
    nb_train_s = round(time.perf_counter() - t0_nb, 3)
    y_pred_nb = nb_pipeline.predict(X_test)
    y_prob_nb = nb_pipeline.predict_proba(X_test)[:, 1]
    
    cm_nb = confusion_matrix(y_test, y_pred_nb)
    tn_nb, fp_nb, fn_nb, tp_nb = cm_nb.ravel()
    
    nb_metrics = {
        "model_id": "naive_bayes",
        "model_name": "Multinomial Naive Bayes",
        "algorithm": "MultinomialNB (alpha=0.1)",
        "vectorizer": "TF-IDF (1-2 ngrams, sublinear_tf=True, max_features=4000)",
        "accuracy": round(float(accuracy_score(y_test, y_pred_nb)), 4),
        "precision": round(float(precision_score(y_test, y_pred_nb, pos_label=1, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred_nb, pos_label=1, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_test, y_pred_nb, pos_label=1, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, y_prob_nb)), 4),
        "training_time_s": nb_train_s,
        "confusion_matrix": {
            "matrix": cm_nb.tolist(),
            "tn": int(tn_nb),
            "fp": int(fp_nb),
            "fn": int(fn_nb),
            "tp": int(tp_nb),
        }
    }
    
    # Train Model 2: Logistic Regression Pipeline
    lr_pipeline = Pipeline([
        ('cleaner', TextCleaner()),
        ('tfidf', TfidfVectorizer(max_features=4000, ngram_range=(1, 2), sublinear_tf=True, stop_words='english')),
        ('classifier', LogisticRegression(C=1.0, max_iter=1000, random_state=42))
    ])
    
    print("Training Logistic Regression pipeline...")
    t0_lr = time.perf_counter()
    lr_pipeline.fit(X_train, y_train)
    lr_train_s = round(time.perf_counter() - t0_lr, 3)
    y_pred_lr = lr_pipeline.predict(X_test)
    y_prob_lr = lr_pipeline.predict_proba(X_test)[:, 1]
    
    cm_lr = confusion_matrix(y_test, y_pred_lr)
    tn_lr, fp_lr, fn_lr, tp_lr = cm_lr.ravel()
    
    lr_metrics = {
        "model_id": "logistic_regression",
        "model_name": "Logistic Regression",
        "algorithm": "LogisticRegression (C=1.0, max_iter=1000)",
        "vectorizer": "TF-IDF (1-2 ngrams, sublinear_tf=True, max_features=4000)",
        "accuracy": round(float(accuracy_score(y_test, y_pred_lr)), 4),
        "precision": round(float(precision_score(y_test, y_pred_lr, pos_label=1, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred_lr, pos_label=1, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_test, y_pred_lr, pos_label=1, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, y_prob_lr)), 4),
        "training_time_s": lr_train_s,
        "confusion_matrix": {
            "matrix": cm_lr.tolist(),
            "tn": int(tn_lr),
            "fp": int(fp_lr),
            "fn": int(fn_lr),
            "tp": int(tp_lr),
        }
    }
    
    # Feature importance extraction from Logistic Regression coefficients
    fitted_tfidf = lr_pipeline.named_steps['tfidf']
    feature_names = fitted_tfidf.get_feature_names_out()
    lr_coefs = lr_pipeline.named_steps['classifier'].coef_[0]
    
    # Top spam features (highest positive weights)
    top_spam_indices = np.argsort(lr_coefs)[::-1][:20]
    top_spam_features = [{"term": str(feature_names[i]), "weight": round(float(lr_coefs[i]), 4)} for i in top_spam_indices]
    
    # Top ham features (lowest negative weights)
    top_ham_indices = np.argsort(lr_coefs)[:20]
    top_ham_features = [{"term": str(feature_names[i]), "weight": round(float(lr_coefs[i]), 4)} for i in top_ham_indices]
    
    # Best model selection dynamically based on F1 Score & Precision
    if lr_metrics["f1_score"] >= nb_metrics["f1_score"]:
        best_model_id = "logistic_regression"
        best_model_name = "Logistic Regression"
        best_pipeline = lr_pipeline
        selection_reason = (
            f"Logistic Regression achieved higher F1-score ({lr_metrics['f1_score']:.4f} vs {nb_metrics['f1_score']:.4f}) "
            f"with exceptional precision ({lr_metrics['precision']:.4f}) and well-calibrated probabilities."
        )
    else:
        best_model_id = "naive_bayes"
        best_model_name = "Multinomial Naive Bayes"
        best_pipeline = nb_pipeline
        selection_reason = (
            f"Multinomial Naive Bayes achieved higher F1-score ({nb_metrics['f1_score']:.4f} vs {lr_metrics['f1_score']:.4f}) "
            f"with recall of {nb_metrics['recall']:.4f}."
        )
        
    print(f"\n--- Model Comparison ---")
    print(f"Naive Bayes: Accuracy={nb_metrics['accuracy']}, Precision={nb_metrics['precision']}, Recall={nb_metrics['recall']}, F1={nb_metrics['f1_score']}")
    print(f"Logistic Regression: Accuracy={lr_metrics['accuracy']}, Precision={lr_metrics['precision']}, Recall={lr_metrics['recall']}, F1={lr_metrics['f1_score']}")
    print(f"Best Model Selected: {best_model_name}")
    
    # Benchmark inference speed (real timing)
    benchmark_samples = list(X_test.iloc[:50])
    
    t0 = time.perf_counter()
    for s in benchmark_samples:
        _ = nb_pipeline.predict_proba([s])
    nb_inference_ms = round(((time.perf_counter() - t0) / len(benchmark_samples)) * 1000, 2)
    
    t0 = time.perf_counter()
    for s in benchmark_samples:
        _ = lr_pipeline.predict_proba([s])
    lr_inference_ms = round(((time.perf_counter() - t0) / len(benchmark_samples)) * 1000, 2)
    
    nb_metrics["inference_time_ms"] = nb_inference_ms
    lr_metrics["inference_time_ms"] = lr_inference_ms

    # Extract test samples for each cell of the Confusion Matrix (TN, FP, FN, TP)
    def extract_cm_samples(y_true, y_pred, texts, max_per_type=5):
        samples = {"tn": [], "fp": [], "fn": [], "tp": []}
        texts_list = list(texts)
        for i, (yt, yp, txt) in enumerate(zip(y_true, y_pred, texts_list)):
            category = None
            if yt == 0 and yp == 0:
                category = "tn"
            elif yt == 0 and yp == 1:
                category = "fp"
            elif yt == 1 and yp == 0:
                category = "fn"
            elif yt == 1 and yp == 1:
                category = "tp"
            
            if category and len(samples[category]) < max_per_type:
                samples[category].append({
                    "index": i,
                    "actual": "ham" if yt == 0 else "spam",
                    "predicted": "ham" if yp == 0 else "spam",
                    "message": txt
                })
        return samples

    nb_cm_samples = extract_cm_samples(y_test, y_pred_nb, X_test, max_per_type=5)
    lr_cm_samples = extract_cm_samples(y_test, y_pred_lr, X_test, max_per_type=5)
    
    nb_metrics["confusion_matrix"]["samples"] = nb_cm_samples
    lr_metrics["confusion_matrix"]["samples"] = lr_cm_samples

    # Compute Threshold Analysis Curves (Precision vs Recall Trade-off across operating thresholds)
    thresholds = [0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90]
    
    def calculate_threshold_curve(y_true, y_probs):
        curve = []
        for t in thresholds:
            preds = (y_probs >= t).astype(int)
            p = float(precision_score(y_true, preds, pos_label=1, zero_division=0))
            r = float(recall_score(y_true, preds, pos_label=1, zero_division=0))
            f1 = float(f1_score(y_true, preds, pos_label=1, zero_division=0))
            cm_t = confusion_matrix(y_true, preds)
            tn_t, fp_t, fn_t, tp_t = cm_t.ravel()
            curve.append({
                "threshold": t,
                "precision": round(p, 4),
                "recall": round(r, 4),
                "f1_score": round(f1, 4),
                "tp": int(tp_t),
                "fp": int(fp_t),
                "fn": int(fn_t),
                "tn": int(tn_t)
            })
        return curve

    nb_threshold_curve = calculate_threshold_curve(y_test, y_prob_nb)
    lr_threshold_curve = calculate_threshold_curve(y_test, y_prob_lr)
    
    metadata = {
        "dataset_name": "SMS Spam Collection (UCI Machine Learning Repository)",
        "total_records": total_messages,
        "train_records": len(X_train),
        "test_records": len(X_test),
        "train_test_split": "80% Train / 20% Test (Stratified, random_state=42)",
        "last_trained_timestamp": pd.Timestamp.now(tz='UTC').strftime('%Y-%m-%d %H:%M:%S UTC'),
        "vectorizer_info": {
            "type": "TfidfVectorizer",
            "ngram_range": [1, 2],
            "max_features": 4000,
            "sublinear_tf": True,
            "vocabulary_size": tfidf_features_count,
            "bow_vocabulary_size": bow_features_count,
            "sample_vocabulary": sample_vocab_terms,
        },
        "models": {
            "naive_bayes": nb_metrics,
            "logistic_regression": lr_metrics,
        },
        "threshold_analysis": {
            "naive_bayes": nb_threshold_curve,
            "logistic_regression": lr_threshold_curve,
        },
        "best_model": {
            "model_id": best_model_id,
            "model_name": best_model_name,
            "reason": selection_reason,
        },
        "feature_importance": {
            "top_spam_indicators": top_spam_features,
            "top_ham_indicators": top_ham_features,
        }
    }
    
    metadata_file = os.path.join(MODELS_DIR, "model_metadata.json")
    with open(metadata_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved metadata to {metadata_file}")
    print("Training complete successfully!")

if __name__ == "__main__":
    train_and_evaluate()
