"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Sparkles,
  Scale,
  ShieldAlert,
  Target,
  Zap,
} from "lucide-react";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  summary: string;
  details: string;
  keyTakeaway: string;
}

const DEEP_DIVE_ITEMS: FAQItem[] = [
  {
    id: "why-tfidf",
    category: "Feature Engineering",
    question: "Why TF-IDF Vectorization over simple CountVectorizer?",
    summary:
      "Simple word counts overweight generic language. TF-IDF downscales ubiquitous terms and elevates distinctive spam tokens.",
    details:
      "In a raw Bag-of-Words (CountVectorizer) representation, frequent words like 'call', 'will', or 'can' receive large numerical magnitudes simply because of message length. TF-IDF (Term Frequency-Inverse Document Frequency) multiplies the local frequency by log(N / DF). If a term appears in nearly every message across the dataset, its IDF factor collapses toward zero, whereas rare tokens like 'guaranteed', 'claim', or 'prize' retain high discriminative weight. Additionally, using sublinear TF scaling (1 + log(tf)) prevents high-frequency repetitions from dominating the linear decision boundary.",
    keyTakeaway:
      "Penalizes ubiquitous noise and amplifies signal-bearing lexical triggers.",
  },
  {
    id: "why-naive-bayes",
    category: "Classification Algorithms",
    question: "Why Multinomial Naive Bayes for text classification?",
    summary:
      "Exceptional computational efficiency, linear scaling, and strong theoretical grounding for sparse count distributions.",
    details:
      "Multinomial Naive Bayes assumes conditional independence between features given the class: P(X|c) = ∏ P(x_i|c). While word occurrence in human language is clearly not strictly independent, this 'naive' assumption works remarkably well in practice for text classification because the decision boundary requires only correct relative ranking of class probabilities rather than perfectly calibrated joint densities. With Laplace smoothing (α=0.1), it handles out-of-vocabulary and zero-frequency tokens gracefully without zeroing out probability estimates.",
    keyTakeaway:
      "Sub-millisecond inference, minimal memory footprint, and high empirical F1-score (95.53%).",
  },
  {
    id: "why-logistic-regression",
    category: "Classification Algorithms",
    question: "Why Logistic Regression as a comparative benchmark?",
    summary:
      "Discriminative linear model providing direct feature interpretability via signed log-odds coefficients.",
    details:
      "Unlike generative Naive Bayes which models the joint probability P(X, Y), Logistic Regression models the posterior probability directly using the logit link function: log(P / (1 - P)) = w^T x + b. With L2 regularization (Ridge penalty, C=1.0), it penalizes collinearity between unigram and bigram features and achieves extraordinary precision (99.21%) on our test set with only a single False Positive out of 966 legitimate messages.",
    keyTakeaway:
      "Superior precision (99.21%) and direct explainability via feature coefficient magnitudes.",
  },
  {
    id: "why-f1-score",
    category: "Model Evaluation",
    question: "Why F1-Score instead of simple Accuracy?",
    summary:
      "The SMS Spam Collection is heavily imbalanced (86.6% ham vs 13.4% spam). Accuracy produces dangerous illusions of quality.",
    details:
      "A trivial 'dummy classifier' that predicts 'Ham' for 100% of messages would achieve an impressive 86.59% accuracy without ever detecting a single spam message (0% recall). The F1-score is the harmonic mean of precision and recall: 2 × (P × R) / (P + R). By weighting false positives and false negatives equally in the harmonic formulation, F1 collapses to zero if either precision or recall fails.",
    keyTakeaway:
      "Forces models to demonstrate real detection capability without hiding behind class imbalance.",
  },
  {
    id: "why-precision-matters",
    category: "Operational Trade-offs",
    question: "Why does Precision matter so critically in mail filtering?",
    summary:
      "A False Positive means a critical job offer, flight ticket, or password reset is dumped into the spam folder.",
    details:
      "In enterprise email administration, the cost of a False Positive (legitimate message flagged as spam) is orders of magnitude higher than a False Negative (annoying spam slipping into the inbox). High precision guarantees that when a message is quarantined or blocked, the administrator and user can trust the verdict with near-total certainty.",
    keyTakeaway:
      "Preserves legitimate correspondence from being lost or mistakenly quarantined.",
  },
  {
    id: "why-recall-matters",
    category: "Operational Trade-offs",
    question: "Why does Recall matter in adversarial threat environments?",
    summary:
      "A False Negative allows phishing campaigns, credential harvesters, and malicious malware into the user's inbox.",
    details:
      "In high-risk security environments (e.g. banking, enterprise executive accounts), users are susceptible to social engineering. High recall ensures that the platform aggressively captures sophisticated spam variants even if they use deceptive spelling or non-standard formatting.",
    keyTakeaway:
      "Protects downstream users from phishing, malware payloads, and financial scams.",
  },
  {
    id: "what-causes-false-positives",
    category: "Error Analysis",
    question: "What linguistic patterns cause False Positives in our test set?",
    summary:
      "Legitimate messages that employ aggressive promotional, numeric, or urgent vocabulary.",
    details:
      "In our 1,115-sample test set, Naive Bayes produced only 3 False Positives. Inspecting the actual text reveals they contained capitalized urgency or numeric sequences, such as: 'MY NO. IN LUTON 0125698789 RING ME IF UR AROUND!' and 'How much would it cost to hire a hitman'. The occurrence of 'RING ME', telephone number sequences, and non-standard syntax triggered high statistical likelihoods in the spam model.",
    keyTakeaway:
      "All-caps text, phone numbers, and urgent personal coordination mimic spam feature vectors.",
  },
  {
    id: "what-causes-false-negatives",
    category: "Error Analysis",
    question: "What linguistic patterns cause False Negatives (missed spam)?",
    summary:
      "Conversational camouflage, novel promotional phrasing, or short joke-formatted messages.",
    details:
      "In our test set, missed spam messages (10 for Naive Bayes, 23 for Logistic Regression) frequently utilized colloquial phrasing or joke structures, such as: 'Sorry I missed your call let\\'s talk when you have the time. I\\'m on 07090201529' or 'Latest News! Police station toilet stolen, cops have nothing to go on!'. These lack blatant keywords like 'FREE' or 'WIN' and mimic natural conversational syntax.",
    keyTakeaway:
      "Adversaries employ conversational syntax and subtle social engineering to bypass keyword filters.",
  },
];

export default function TechnicalDeepDive() {
  const [openIds, setOpenIds] = useState<string[]>(["why-tfidf", "why-f1-score"]);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const expandAll = () => setOpenIds(DEEP_DIVE_ITEMS.map((item) => item.id));
  const collapseAll = () => setOpenIds([]);

  return (
    <section id="deepdive" className="py-16 md:py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200/70 text-xs font-semibold text-indigo-700 mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Machine Learning Theory &amp; Error Analysis</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Technical Deep Dive &amp; NLP Foundations
            </h2>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Rigorous technical rationales answering architectural decisions, metric trade-offs, and empirical error modes observed in test evaluations.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium shrink-0">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Accordion Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEEP_DIVE_ITEMS.map((item) => {
            const isOpen = openIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all ${
                  isOpen
                    ? "bg-white border-indigo-200 shadow-sm"
                    : "bg-slate-50/50 hover:bg-slate-50 border-slate-200"
                }`}
              >
                <button
                  onClick={() => toggleOpen(item.id)}
                  className="w-full p-5 text-left flex items-start justify-between gap-3 focus:outline-none"
                >
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">
                      {item.question}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {item.summary}
                    </p>
                  </div>
                  <div className="p-1 rounded-md text-slate-400 hover:text-slate-600 shrink-0 mt-1">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-100 text-xs text-slate-700 space-y-3 animate-fadeIn">
                    <p className="leading-relaxed text-slate-600">{item.details}</p>
                    <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-indigo-950 font-medium">
                      <span className="font-bold text-indigo-800 uppercase text-[10px] tracking-wider block mb-0.5">
                        Key Takeaway
                      </span>
                      {item.keyTakeaway}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
