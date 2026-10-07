# Spam Mail Detector — Production NLP & Machine Learning Application

An intelligent, full-stack Natural Language Processing (NLP) web application that classifies email and SMS messages into **Spam** or **Ham (Not Spam)**.

This project delivers an end-to-end machine learning system: raw text preprocessing, sparse TF-IDF feature extraction, supervised model training, dynamic metric evaluation, confusion matrix contingency analysis, an interactive live pipeline simulator, and real-time prediction with statistical feature explanations.

---

## 1. Project Overview

Spam detection is a quintessential classification problem in machine learning. However, real-world deployment requires balancing **high precision** (avoiding false positives where a legitimate personal or business email is incorrectly routed to spam) with **high recall** (preventing malicious or promotional spam from penetrating the user's primary inbox).

This application was engineered with a modern, decoupled architecture:
* **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons, and Recharts.
* **Backend**: Python 3.13, FastAPI microservice, Uvicorn asynchronous server.
* **Machine Learning & NLP**: Scikit-Learn, Pandas, NumPy, NLTK, and Joblib.
* **Dataset**: Legitimate UCI SMS Spam Collection repository (5,572 labeled records).

---

## 2. Key Features

1. **Interactive Spam Detector**:
   * Large input text area with live character and word counters.
   * Preset realistic messages for instant testing (safe personal ham, lottery spam, mobile ringtone promo, casual office coordination).
   * Model selector toggle between **Multinomial Naive Bayes (Recommended)** and **Logistic Regression**.
   * Real-time inference returning posterior probabilities, confidence scores, structural diagnostics, and feature contribution breakdowns.

2. **Interpretable Feature Explanation ("Why was this classified this way?")**:
   * Extracts top contributing unigram and bigram tokens with their positive (spam) and negative (ham) weights.
   * Grounded in mathematical feature weights rather than hard-coded rules.

3. **Interactive 7-Stage NLP Pipeline Visualizer**:
   * Visualizes how any raw message transforms through each phase:
     1. Original Text &rarr; 2. Lowercasing &rarr; 3. Regex Pattern Normalization &rarr; 4. Tokenization &rarr; 5. Stopword Filtering &rarr; 6. TF-IDF Feature Matching &rarr; 7. Classifier Inference.
   * Live interactive testing tool connected to `/preprocess-preview`.

4. **Authentic Dataset Architecture & Analytics**:
   * 100% dynamic statistics: Total Messages (5,572), Ham (4,825 / 86.59%), Spam (747 / 13.41%), Average Length (80.49 chars).
   * Interactive dataset preview table with real stratified records, search bar, and filter tabs.
   * Recharts visual analytics: Class distribution donut chart, character length histogram, and top 10 empirical token frequency charts for Spam vs Ham.

5. **Supervised Model Comparison Dashboard**:
   * Side-by-side comparison of **Multinomial Naive Bayes** vs. **Logistic Regression**.
   * Accuracy, Precision, Recall, F1-Score, and ROC-AUC calculated on an unseen 20% test split (1,115 messages).
   * In-depth educational breakdown of why Precision is paramount over naive Accuracy.

6. **Interactive Contingency Matrix (Confusion Matrix)**:
   * 2x2 contingency grid displaying True Negatives (TN), False Positives (FP), False Negatives (FN), and True Positives (TP).
   * Interactive model toggle highlighting the trade-offs between Naive Bayes and Logistic Regression.

---

## 3. Dataset Information

The model is trained on the legitimate **SMS Spam Collection dataset** from the **UCI Machine Learning Repository** (Almeida & Gómez Hidalgo):
* **Total Records**: 5,572 messages
* **Ham (Legitimate)**: 4,825 messages (86.59%)
* **Spam**: 747 messages (13.41%)
* **Class Imbalance**: ~6.5 to 1 ratio
* **Average Message Length**:
  * Ham: 71.02 characters (14.9 words)
  * Spam: 138.87 characters (23.9 words) — nearly 2x longer, maximizing the standard 160-character SMS payload limit.

---

## 4. NLP Preprocessing Pipeline

Text normalization is handled deterministically by `backend/app/preprocessor.py`:

```text
Raw Text Input
      ↓
[1] Lowercase Normalization: Converts all characters to lowercase.
      ↓
[2] Pattern & Entity Normalization:
    - URLs (http/https/www) → 'url'
    - Email addresses → 'email'
    - Phone / Long digit sequences (≥5 digits) → 'numseq'
    - Currency symbols ($ £ € ₹) → 'currency'
      ↓
[3] Punctuation & Whitespace Stripping:
    - Removes punctuation marks while preserving alphanumeric word boundaries.
    - Compresses multi-space sequences into single spaces.
      ↓
[4] Tokenization:
    - Splits text into distinct word tokens (filtering single-character noise).
      ↓
[5] Stopword Filtering:
    - Removes non-informative English function words ('the', 'is', 'at', 'which').
      ↓
[6] TF-IDF Sparse Matrix Construction:
    - Maps tokens and bigrams against the fitted 4,000-feature vocabulary.
```

---

## 5. TF-IDF Feature Extraction

Unlike a raw Bag-of-Words (CountVectorizer) approach, which overweights common words in long messages, this system uses **Term Frequency - Inverse Document Frequency (TF-IDF)** with sublinear scaling:

$$\text{TF-IDF}(t, d, D) = \text{TF}(t, d) \times \log\left(\frac{1 + |D|}{1 + \text{DF}(t, D)}\right) + 1$$

* **N-gram Range**: `(1, 2)` (captures single words and key phrase pairs like `"cash prize"`, `"claim code"`).
* **Max Features**: 4,000 highest frequency n-grams.
* **Sublinear TF Scaling**: `sublinear_tf=True` replaces raw count $tf$ with $1 + \log(tf)$ to dampen the impact of repeated spam keywords.
* **Stopwords**: Standard English stopword list.

---

## 6. Machine Learning Models & Evaluation

The dataset is partitioned into an **80% Training Set (4,457 messages)** and a **20% Test Set (1,115 messages)** using stratified sampling (`random_state=42`).

### Empirical Test Set Results (N = 1,115 Unseen Messages)

| Metric | Multinomial Naive Bayes | Logistic Regression | Best Model Selection |
| :--- | :---: | :---: | :---: |
| **Accuracy** | **98.83%** | 97.85% | **Naive Bayes** |
| **Precision** | 97.89% | **99.21%** | **Logistic Regression** |
| **Recall** | **93.29%** | 84.56% | **Naive Bayes** |
| **F1 Score** | **95.53%** | 91.30% | **Naive Bayes (Overall Best)** |
| **ROC-AUC** | **99.37%** | 99.15% | **Naive Bayes** |

### Confusion Matrix Breakdown (Test Set)

#### Model 1: Multinomial Naive Bayes (Selected Best Overall)
* **True Negative (TN)**: 963 (Legitimate Ham correctly allowed)
* **False Positive (FP)**: 3 (Legitimate Ham misclassified as spam — 0.3% error)
* **False Negative (FN)**: 10 (Spam messages missed)
* **True Positive (TP)**: 139 (Spam messages correctly blocked — 93.3% recall)

#### Model 2: Logistic Regression (Ultra-High Precision)
* **True Negative (TN)**: 965 (Legitimate Ham correctly allowed)
* **False Positive (FP)**: 1 (Only 1 legitimate message flagged across 966 ham)
* **False Negative (FN)**: 23 (Spam messages missed)
* **True Positive (TP)**: 126 (Spam messages correctly blocked — 84.6% recall)

---

## 7. Model Persistence & Architecture

Both trained pipelines are serialized using **Joblib** to guarantee fast, zero-recomputation inference:

```text
backend/models/
├── best_model.joblib          # Active production pipeline
├── spam_pipeline_nb.joblib    # MultinomialNB pipeline
├── spam_pipeline_lr.joblib    # Logistic Regression pipeline
├── model_metadata.json        # Test evaluation metrics & feature weights
└── dataset_analysis.json      # Dynamic distributions & word frequencies
```

---

## 8. Backend API Documentation

### Base URL: `http://127.0.0.1:8008`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status, active models, and timestamp |
| `GET` | `/dataset-summary` | Total records, class breakdown, percentages, and stratified samples |
| `GET` | `/dataset-analysis` | Top ham/spam word frequencies and length distributions |
| `GET` | `/model-metrics` | Benchmark performance metrics and confusion matrices |
| `POST` | `/preprocess-preview` | Step-by-step trace of text through lowercasing, cleaning, tokens, and TF-IDF |
| `POST` | `/predict` | Real-time spam prediction, probabilities, diagnostics, and feature weights |

#### Sample Prediction Request (`POST /predict`)
```json
{
  "message": "URGENT! You have won a £1,000 cash prize! Call 09061701461 to claim your reward.",
  "model_id": "naive_bayes"
}
```

#### Sample Prediction Response
```json
{
  "prediction": "spam",
  "is_spam": true,
  "spam_probability": 1.0,
  "ham_probability": 0.0,
  "confidence": 1.0,
  "model": "Multinomial Naive Bayes",
  "model_id": "naive_bayes",
  "message_stats": {
    "char_length": 81,
    "word_count": 14,
    "token_count": 14,
    "filtered_token_count": 9,
    "has_urls": false,
    "has_currency": true,
    "has_numseq": true
  },
  "top_features": [
    { "term": "1000", "weight": 1.9121, "direction": "spam" },
    { "term": "prize", "weight": 1.9067, "direction": "spam" },
    { "term": "reward", "weight": 1.8967, "direction": "spam" },
    { "term": "claim", "weight": 1.8477, "direction": "spam" },
    { "term": "urgent", "weight": 0.8707, "direction": "spam" }
  ],
  "explanation": "Classified as Spam (100.0% probability) using Multinomial Naive Bayes. The model detected high-impact promotional or urgency tokens including '1000', 'prize', 'reward', 'claim'.",
  "timestamp": "2026-10-04 14:05:00 UTC"
}
```

---

## 9. Project Directory Structure

```text
Spam Mail Detector/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI REST endpoints & inference logic
│   │   ├── preprocessor.py      # NLP text cleaning, TextCleaner transformer
│   │   └── schemas.py           # Pydantic request & response models
│   ├── data/
│   │   ├── SMSSpamCollection.txt
│   │   └── sms_spam_collection.csv
│   ├── models/
│   │   ├── best_model.joblib
│   │   ├── dataset_analysis.json
│   │   ├── model_metadata.json
│   │   ├── spam_pipeline_lr.joblib
│   │   └── spam_pipeline_nb.joblib
│   ├── requirements.txt         # Python dependencies
│   ├── train.py                 # Dataset ingestion, training & evaluation
│   └── venv/                    # Virtual environment
│
├── frontend/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css          # Tailwind CSS styles & SaaS tokens
│   │   ├── layout.tsx           # Root HTML layout with Inter font
│   │   └── page.tsx             # Master page orchestrating all 9 sections
│   ├── components/
│   │   ├── AboutProject.tsx     # Technical documentation & tech stack
│   │   ├── ConfusionMatrix.tsx  # 2x2 contingency matrix with model toggle
│   │   ├── DatasetOverview.tsx  # Dataset statistics & preview table
│   │   ├── Footer.tsx           # Page footer with smooth scroll navigation
│   │   ├── Hero.tsx             # Hero section with 4 stats & quick actions
│   │   ├── ModelComparison.tsx  # Dynamic metrics table & conceptual guide
│   │   ├── Navbar.tsx           # Responsive header with live API health badge
│   │   ├── NLPipeline.tsx       # 7-stage NLP visualizer & live simulator
│   │   ├── ResultCard.tsx       # Verdict banner, probability gauge, diagnostics
│   │   ├── SpamDetector.tsx     # Interactive message input & presets
│   │   └── TextAnalysis.tsx     # Recharts charts for class, length & tokens
│   ├── lib/
│   │   └── api.ts               # Typed API client with proxy fallback
│   ├── next.config.ts           # Rewrites to proxy /api/py to FastAPI port 8008
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.local
│
└── README.md
```

---

## 10. Local Setup & Execution Guide

### Prerequisites
* **Python 3.10+** (Python 3.13 tested)
* **Node.js 18+** (Node.js 24 tested)
* **npm 9+**

### Step 1: Backend Setup & Model Training

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate the virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
# source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Train the models & generate evaluation metrics (one-time)
python train.py

# 6. Start the FastAPI microservice on port 8008
uvicorn app.main:app --host 127.0.0.1 --port 8008 --reload
```

The backend API will be available at:
* API Root: `http://127.0.0.1:8008`
* Interactive Swagger Docs: `http://127.0.0.1:8008/docs`
* Health Check: `http://127.0.0.1:8008/health`

### Step 2: Frontend Setup & Launch

```bash
# 1. Open a new terminal and navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start the Next.js development server on port 3001
npm run dev -- -p 3001
```

The web application will be live at:
* **Web UI**: `http://localhost:3001`

---

## 11. Example Predictions

| Category | Message Text | Predicted Class | Spam Probability | Top Features |
| :--- | :--- | :---: | :---: | :--- |
| **Spam** | `"URGENT! You have won a £1,000 cash prize! Call 09061701461 to claim your reward."` | **Spam** | **100.0%** | `1000`, `prize`, `reward`, `claim`, `urgent` |
| **Spam** | `"FREE RINGTONE! Text REPLY to 88066 now to claim 50 free polyphonic ringtones for your mobile."` | **Spam** | **100.0%** | `ringtone`, `free`, `mobile`, `reply`, `txt` |
| **Ham** | `"Hey mate, are we still meeting for lunch today at 1pm? Let me know if you are free."` | **Ham** | **0.01%** | `free` (offset by conversational syntax), `ok`, `lunch` |
| **Ham** | `"Hi Sarah, I left the project reports on your desk. Please review section 3 before our client presentation."` | **Ham** | **0.00%** | Conversational structure, lack of promotional urgency tokens |

---

## 12. Future Enhancements

1. **Transformer Ensembles**: Fine-tuning lightweight DistilRoBERTa for domain-specific email header semantics.
2. **Contextual Embeddings**: Utilizing sub-word tokenizers to detect adversarial character obfuscations (e.g. `P-R-1-Z-E` or `fr33`).
3. **Multi-Class Intent Tagging**: Sub-classifying detected spam into Phishing, Commercial Marketing, Malware Delivery, and Financial Fraud.
4. **Browser Extension**: Real-time client-side email client plugin via Chrome WebExtensions Manifest V3.

---

## 13. License & Acknowledgments

* Dataset: **SMS Spam Collection** from the UCI Machine Learning Repository.
* Developed for **QSkills Internship Program**.
