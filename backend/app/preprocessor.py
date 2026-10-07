import re
import string
from typing import List, Dict, Any

# Standard English stopwords list (self-contained and deterministic)
STOPWORDS = {
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
    "aren't", 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but',
    'by', 'can', 'cannot', 'could', 'couldn', "couldn't", 'd', 'did', 'didn', "didn't", 'do', 'does',
    'doesn', "doesn't", 'doing', 'don', "don't", 'down', 'during', 'each', 'few', 'for', 'from',
    'further', 'had', 'hadn', "hadn't", 'has', 'hasn', "hasn't", 'have', 'haven', "haven't", 'having',
    'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into',
    'is', 'isn', "isn't", 'it', "it's", 'its', 'itself', 'just', 'll', 'm', 'ma', 'me', 'mightn',
    "mightn't", 'more', 'most', 'mustn', "mustn't", 'my', 'myself', 'needn', "needn't", 'no', 'nor',
    'not', 'now', 'o', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves',
    'out', 'over', 'own', 're', 's', 'same', 'shan', "shan't", 'she', "she'd", "she'll", "she's",
    'should', "should've", 'shouldn', "shouldn't", 'so', 'some', 'such', 't', 'than', 'that', "that'll",
    'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those',
    'through', 'to', 'too', 'under', 'until', 'up', 've', 'very', 'was', 'wasn', "wasn't", 'we', 'were',
    'weren', "weren't", 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with',
    'won', "won't", 'would', 'wouldn', "wouldn't", 'y', 'you', "you'd", "you'll", "you're", "you've",
    'your', 'yours', 'yourself', 'yourselves'
}

def clean_text(text: str) -> str:
    """
    NLP Preprocessing function:
    1. Convert text to lowercase
    2. Normalize URLs, email addresses, and phone numbers
    3. Remove punctuation and non-alphanumeric characters
    4. Normalize whitespace
    """
    if not isinstance(text, str):
        return ""
    
    # 1. Lowercase
    text = text.lower()
    
    # 2. Normalize URLs
    text = re.sub(r'https?://\S+|www\.\S+', ' url ', text)
    
    # Normalize email addresses
    text = re.sub(r'\S+@\S+', ' email ', text)
    
    # Normalize phone numbers or long digits (often spam indicators)
    text = re.sub(r'\b\d{5,}\b', ' numseq ', text)
    
    # Normalize currency symbols
    text = re.sub(r'[$£€₹]', ' currency ', text)
    
    # 3. Remove punctuation
    text = re.sub(r'[' + re.escape(string.punctuation) + ']', ' ', text)
    
    # 4. Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def tokenize(text: str) -> List[str]:
    """Tokenize cleaned text into individual word tokens."""
    return [word for word in text.split() if len(word) > 1]

def remove_stopwords(tokens: List[str]) -> List[str]:
    """Filter out common stopwords from token list."""
    return [token for token in tokens if token not in STOPWORDS]

from sklearn.base import BaseEstimator, TransformerMixin

class TextCleaner(BaseEstimator, TransformerMixin):
    """Scikit-learn compatible transformer for NLP text cleaning."""
    def fit(self, X, y=None):
        return self
    
    def transform(self, X):
        if hasattr(X, "values"):
            X = X.values
        return [clean_text(text) for text in X]

def get_preprocessing_breakdown(raw_text: str) -> Dict[str, Any]:
    """
    Returns step-by-step visualization data for the NLP preprocessing pipeline.
    """
    original = str(raw_text) if raw_text else ""
    lowercased = original.lower()
    cleaned = clean_text(original)
    tokens = tokenize(cleaned)
    filtered = remove_stopwords(tokens)
    
    return {
        "step_1_original": original,
        "step_2_lowercased": lowercased,
        "step_3_cleaned": cleaned,
        "step_4_tokens": tokens,
        "step_5_stopwords_removed": filtered,
        "token_count": len(tokens),
        "filtered_count": len(filtered),
        "removed_stopwords": [t for t in tokens if t in STOPWORDS]
    }

