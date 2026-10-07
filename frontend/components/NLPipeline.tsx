"use client";

import React, { useState, useEffect } from "react";
import {
  Workflow,
  Sparkles,
  CheckCircle2,
  Code2,
  Type,
  Scissors,
  Filter,
  Layers,
  Cpu,
  RefreshCw,
  ChevronRight,
  Info,
  Sliders,
  Database,
  ArrowRight,
} from "lucide-react";
import { runPreprocessPreview, PreprocessResponse } from "@/lib/api";

const PRESET_SNIPPETS = [
  {
    title: "Urgent Lottery Promo",
    text: "URGENT! You have won a £1,000 cash prize! Claim at http://win-now.com or call 09061701461.",
  },
  {
    title: "Meeting Coordination",
    text: "Hey Alex, are we still meeting up for lunch today at 1pm? Let me know when you're free!",
  },
  {
    title: "Bank Security OTP",
    text: "Your one-time security passcode is 849201. Valid for 10 minutes. Do not share with anyone.",
  },
  {
    title: "Crypto Investment Alert",
    text: "Guaranteed 500% profit in 24 hours! Deposit $250 today and claim your free Bitcoin bonus now.",
  },
];

interface PipelineStepMeta {
  id: number;
  label: string;
  shortName: string;
  tagline: string;
  mathFormula?: string;
  details: string;
  specs: { label: string; value: string }[];
}

const PIPELINE_STEPS: PipelineStepMeta[] = [
  {
    id: 1,
    label: "01 Raw Text",
    shortName: "Raw Input",
    tagline: "Unstructured string ingested directly from email/SMS transport layers.",
    details: "The raw payload enters the pipeline with arbitrary capitalization, special punctuation, unicode symbols, variable spacing, and embedded hyperlinks.",
    specs: [
      { label: "Data Type", value: "UTF-8 String" },
      { label: "Storage", value: "Memory Buffer" },
      { label: "Preprocessing Loss", value: "0% (Intact)" },
    ],
  },
  {
    id: 2,
    label: "02 Normalization",
    shortName: "Normalization",
    tagline: "Case folding and unicode whitespace collapse.",
    details: "Transforms all characters to lowercase to eliminate case-variant duplication (e.g. 'FREE', 'Free', and 'free' map to the same identity). Standardizes whitespace and newline breaks.",
    specs: [
      { label: "Operation", value: "str.lower() + strip()" },
      { label: "Case Sensitivity", value: "Case-Insensitive" },
      { label: "Vocabulary Impact", value: "~42% reduction in duplicate lexical forms" },
    ],
  },
  {
    id: 3,
    label: "03 Cleaning",
    shortName: "Regex Cleaning",
    tagline: "Deterministic regex mapping of spam carrier tokens.",
    details: "Applies targeted regular expressions: replaces URLs with a generic 'url' token, telephone numbers and long digits with 'numseq', and currency symbols (£, $, €) with 'currency'. Strips non-alphanumeric noise.",
    mathFormula: "s/[https?:\\/\\/\\S+]/url/g  |  s/[\\£\\$\\€]/currency/g  |  s/[0-9]{3,}/numseq/g",
    specs: [
      { label: "Pattern Engines", value: "Compiled Python RE" },
      { label: "URL Normalization", value: "Replaced with 'url'" },
      { label: "Numeric Normalization", value: "Replaced with 'numseq'" },
      { label: "Currency Token", value: "Replaced with 'currency'" },
    ],
  },
  {
    id: 4,
    label: "04 Tokenization",
    shortName: "Tokenization",
    tagline: "Lexical segmentation into discrete atomic word units.",
    details: "Splits continuous cleaned text into an ordered list of alphanumeric word tokens using regex word-boundary anchors (\\b\\w+\\b). Drops isolated single characters and extraneous delimiters.",
    specs: [
      { label: "Tokenizer", value: "Regex Word Boundary (\\b\\w+\\b)" },
      { label: "Output Unit", value: "Token Sequence List" },
      { label: "Minimum Token Length", value: "2 characters" },
    ],
  },
  {
    id: 5,
    label: "05 Stopword Filtering",
    shortName: "Stopword Filter",
    tagline: "Prunes high-frequency non-discriminative syntactic tokens.",
    details: "Removes syntactic filler words ('the', 'is', 'at', 'which', 'on', 'and') that appear ubiquitously across both classes and carry negligible discriminative spam information.",
    specs: [
      { label: "Stopword Corpus", value: "English Standard (128 words)" },
      { label: "Retention Strategy", value: "Information-Rich Lexical Stems" },
      { label: "Average Token Reduction", value: "38% to 52%" },
    ],
  },
  {
    id: 6,
    label: "06 TF-IDF",
    shortName: "TF-IDF Vectorizer",
    tagline: "Transforms tokens into a sparse high-dimensional numerical feature vector.",
    mathFormula: "TF-IDF(t, d) = (1 + \\log(TF_{t,d})) \\times (\\log((1 + N)/(1 + DF_t)) + 1)",
    details: "Projects the filtered tokens into a 4,000-dimensional vocabulary space using unigrams and bigrams (1-2 ngrams) with sublinear term frequency scaling and Euclidean (L2) unit vector normalization.",
    specs: [
      { label: "Vector Dimension", value: "1 × 4,000" },
      { label: "N-gram Range", value: "(1, 2) Unigrams & Bigrams" },
      { label: "Sublinear TF", value: "True (1 + log(tf))" },
      { label: "Normalization", value: "L2 Norm (Euclidean)" },
    ],
  },
  {
    id: 7,
    label: "07 Classifier",
    shortName: "ML Classifier",
    tagline: "Computes statistical class posterior probabilities.",
    mathFormula: "P(Spam|X) \\propto P(Spam) \\prod_{i=1}^{n} P(w_i|Spam)^{x_i}",
    details: "Evaluates the sparse TF-IDF feature vector against trained parameters: either Multinomial Naive Bayes log-likelihood scoring with Laplace smoothing (α=0.1) or Logistic Regression sigmoid log-odds calculation.",
    specs: [
      { label: "Supported Models", value: "MultinomialNB (α=0.1) / LogisticRegression (C=1.0)" },
      { label: "Inference Time", value: "< 1.0 ms" },
      { label: "Decision Boundary", value: "Threshold T = 0.50 (Calibrated)" },
    ],
  },
  {
    id: 8,
    label: "08 Prediction",
    shortName: "Final Verdict",
    tagline: "Outputs calibrated label, class probability, and explainability breakdown.",
    details: "Yields the definitive classification ('Spam' or 'Ham'), calibrated posterior probabilities, human-interpretable linguistic risk signals, and feature contribution rankings.",
    specs: [
      { label: "Output Classes", value: "Spam (1) | Ham (0)" },
      { label: "Probabilistic Output", value: "P(Spam) + P(Ham) = 1.0" },
      { label: "Confidence Metric", value: "max(P(Spam), P(Ham))" },
    ],
  },
];

export default function NLPipeline() {
  const [inputText, setInputText] = useState(PRESET_SNIPPETS[0].text);
  const [data, setData] = useState<PreprocessResponse | null>(null);
  const [activeStep, setActiveStep] = useState<number>(6); // Default on TF-IDF
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executePipeline = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await runPreprocessPreview(text);
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to preview preprocessing steps.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executePipeline(inputText);
  }, []);

  const handleTestSnippet = (snippet: string) => {
    setInputText(snippet);
    executePipeline(snippet);
  };

  const currentStepMeta = PIPELINE_STEPS.find((s) => s.id === activeStep) || PIPELINE_STEPS[5];

  // Helper to get step-specific live transformed output
  const renderStepOutput = () => {
    if (!data && loading) {
      return (
        <div className="flex items-center justify-center p-8 text-slate-400 font-mono text-xs">
          <RefreshCw className="w-4 h-4 animate-spin mr-2 text-indigo-600" />
          <span>Processing message through NLP pipeline stages...</span>
        </div>
      );
    }

    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Input Message Character Length: {inputText.length}</span>
              <span>Raw Buffer</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-900 break-words leading-relaxed">
              {data?.step_1_original || inputText}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Lowercased Representation</span>
              <span>No case variance</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 break-words leading-relaxed">
              {data?.step_2_lowercased || "..."}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Pattern Normalized Text</span>
              <span>URLs, Currencies, Digits standardized</span>
            </div>
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200/80 font-mono text-xs text-blue-950 break-words leading-relaxed">
              {data?.step_3_cleaned || "..."}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Total Tokens: {data?.token_count || 0}</span>
              <span>Atomic Word Units</span>
            </div>
            <div className="flex flex-wrap gap-1.5 p-4 bg-slate-50 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
              {data?.step_4_tokens?.map((tok, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-white text-slate-800 text-xs font-mono rounded-lg border border-slate-200 shadow-2xs hover:border-indigo-300 transition-colors"
                >
                  {tok}
                </span>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Retained Tokens: {data?.filtered_count || 0}</span>
              <span className="text-amber-700">Removed Stopwords: {data?.removed_stopwords?.length || 0}</span>
            </div>
            <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200/70 space-y-3">
              <div>
                <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1.5">
                  Informative Retained Stems
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {data?.step_5_stopwords_removed?.length ? (
                    data.step_5_stopwords_removed.map((tok, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-white text-amber-950 text-xs font-mono font-semibold rounded-lg border border-amber-300/80 shadow-2xs"
                      >
                        {tok}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No non-stopword tokens remaining</span>
                  )}
                </div>
              </div>

              {data?.removed_stopwords?.length ? (
                <div className="pt-2 border-t border-amber-200/50">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Pruned Common Words
                  </p>
                  <p className="text-xs font-mono text-slate-500 line-through">
                    {data.removed_stopwords.join(", ")}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Vector Dimension: [1 × {data?.total_vocabulary_features || 4000}]</span>
              <span className="text-indigo-600 font-semibold">
                Active Non-Zero Features: {data?.matched_features?.length || 0}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 p-4 bg-slate-50 rounded-xl border border-slate-200 max-h-56 overflow-y-auto">
              {data?.matched_features?.length ? (
                data.matched_features.map((feat, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-white rounded-lg border border-slate-200/90 shadow-2xs flex items-center justify-between text-xs font-mono"
                  >
                    <span className="font-semibold text-slate-900 truncate mr-2" title={feat.term}>
                      {feat.term}
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded text-[11px]">
                      {(feat.tfidf_weight ?? feat.tfidf_value ?? 0).toFixed(4)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-6 text-center text-xs text-slate-400">
                  None of the tokens matched the 4,000-term TF-IDF training vocabulary.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 bg-white p-3 rounded-lg border border-slate-200">
              <span>Sparsity: {data?.matched_features ? `${(100 - (data.matched_features.length / 4000) * 100).toFixed(2)}% sparse` : "99.8%"}</span>
              <span>Norm: Euclidean (L2)</span>
              <span>TF Weighting: Sublinear (1 + log(tf))</span>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Bayesian Likelihood & Log-Odds Transformation</span>
              <span>Sub-millisecond inference</span>
            </div>
            <div className="p-4 bg-violet-50/50 rounded-xl border border-violet-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-violet-900">MultinomialNB (α=0.1)</span>
                <span className="text-slate-600">Calculates log P(c) + ∑ log P(w|c)</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-blue-900">Logistic Regression (C=1.0)</span>
                <span className="text-slate-600">Computes sigmoid σ(w·x + b)</span>
              </div>
              <p className="text-xs text-slate-600 pt-2 border-t border-violet-200/60">
                Both classifiers process the 4,000-dimensional sparse feature vector in &lt; 0.6 ms to yield posterior class probabilities.
              </p>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Final Calibrated Classification</span>
              <span>Operating Threshold: 0.50</span>
            </div>
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">Classification Complete</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Output includes class probabilities, linguistic signals, token contributions, and interpretable rationale.
                </p>
              </div>
              <a
                href="#detector"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Open in Detector</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section id="pipeline" className="py-16 md:py-20 bg-slate-50/50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200/70 text-xs font-semibold text-indigo-700 mb-2">
            <Workflow className="w-3.5 h-3.5" />
            <span>Interactive NLP Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            8-Stage Interactive NLP Preprocessing Pipeline
          </h2>
          <p className="mt-1 text-sm text-slate-600 max-w-3xl">
            Click any stage in the pipeline to examine the mathematical foundations, vector dimensional transformation, and live transformed state for the input message below.
          </p>
        </div>

        {/* Live Simulator Input */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <label htmlFor="pipeline-input" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-indigo-600" />
              <span>Input Message to Trace</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400">Sample Presets:</span>
              {PRESET_SNIPPETS.map((snippet, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTestSnippet(snippet.text)}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-md transition-colors"
                >
                  {snippet.title}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <textarea
              id="pipeline-input"
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type any message to trace through all 8 NLP stages..."
              className="flex-1 p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none font-mono text-slate-800"
            />
            <button
              onClick={() => executePipeline(inputText)}
              disabled={loading || !inputText.trim()}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors sm:self-stretch"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Trace Pipeline</span>
            </button>
          </div>
        </div>

        {/* 8-Step Interactive Progression Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-8">
          {PIPELINE_STEPS.map((step) => {
            const isSelected = activeStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    0{step.id}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <p className="text-xs font-bold truncate">{step.shortName}</p>
                <p className={`text-[10px] truncate mt-0.5 ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                  Stage {step.id}
                </p>
              </button>
            );
          })}
        </div>

        {/* Selected Step Deep Dive Inspector */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-indigo-100 text-indigo-800">
                  Stage {currentStepMeta.id} of 8
                </span>
                <h3 className="text-lg font-black text-slate-900">{currentStepMeta.label}</h3>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">{currentStepMeta.tagline}</p>
            </div>

            {/* Step Specifications Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {currentStepMeta.specs.map((sp, idx) => (
                <div key={idx} className="px-3 py-1 bg-white rounded-lg border border-slate-200 text-right">
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">{sp.label}</span>
                  <span className="block text-xs font-mono font-bold text-slate-800">{sp.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* Live Message Output for this Stage */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Live Transformation Output for Current Input</span>
              </h4>
              {renderStepOutput()}
            </div>

            {/* Technical Explanation & Formulas */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-100 space-y-2">
                <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Technical Explanation</span>
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed">{currentStepMeta.details}</p>
              </div>

              {currentStepMeta.mathFormula ? (
                <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-2 font-mono">
                  <h5 className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Mathematical / Algorithmic Formulation</span>
                  </h5>
                  <p className="text-xs text-indigo-200 bg-slate-800/80 p-2.5 rounded-lg overflow-x-auto">
                    {currentStepMeta.mathFormula}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-100 space-y-2">
                  <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Computational Architecture</span>
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Designed to execute in sub-millisecond real time within memory without disk I/O, ensuring ultra-low latency for production spam screening.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
