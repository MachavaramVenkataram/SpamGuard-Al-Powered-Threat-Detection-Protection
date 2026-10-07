"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Trash2,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Zap,
  BarChart2,
  HelpCircle,
  Hash,
  Link2,
  DollarSign,
  Copy,
  Check,
  Layers,
  FileText,
  Keyboard,
  Info,
} from "lucide-react";
import { predictMessage, PredictResponse, TokenExplorerItem } from "@/lib/api";
import { useToast } from "./ToastContext";

const SAMPLE_PRESETS = [
  {
    type: "ham",
    title: "Personal Lunch Meeting",
    label: "Safe Ham",
    message: "Hey mate, are we still meeting for lunch today at 1pm? Let me know if you are free.",
  },
  {
    type: "spam",
    title: "£1,000 Cash Prize Reward",
    label: "Urgent Spam",
    message: "URGENT! You have won a £1,000 cash prize! Call 09061701461 to claim your reward. Claim code 8492. Valid 12hrs only.",
  },
  {
    type: "spam",
    title: "Free Mobile Ringtone & UK Claim",
    label: "Promo Spam",
    message: "FREE RINGTONE! Text REPLY to 88066 now to claim 50 free polyphonic ringtones for your mobile. 150p/msg stop to cancel.",
  },
  {
    type: "ham",
    title: "Casual Office Coordination",
    label: "Safe Ham",
    message: "Hi Sarah, I left the project reports on your desk. Please review section 3 before our client presentation tomorrow.",
  },
];

interface SpamDetectorProps {
  initialMessage?: string;
  activeModelId: "naive_bayes" | "logistic_regression";
  onSelectModel: (m: "naive_bayes" | "logistic_regression") => void;
  onAddHistory?: (item: { message: string; prediction: string; probability: number; model: string; timestamp: string }) => void;
  onRecordLatency?: (ms: number) => void;
}

export default function SpamDetector({
  initialMessage = "",
  activeModelId,
  onSelectModel,
  onAddHistory,
  onRecordLatency,
}: SpamDetectorProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState(initialMessage);
  const [loading, setLoading] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>("");
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenExplorerItem | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialMessage) {
      setMessage(initialMessage);
    }
  }, [initialMessage]);

  // Keyboard shortcut listener: Ctrl+Enter (Analyze), Esc (Clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleAnalyze();
      } else if (e.key === "Escape" && document.activeElement === textareaRef.current) {
        handleClear();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const charCount = message.length;
  const wordCount = message.trim() ? message.trim().split(/\s+/).length : 0;

  const handleClear = () => {
    setMessage("");
    setResult(null);
    setError(null);
    setSelectedToken(null);
    toast("Composer cleared", "info");
  };

  const handleSelectPreset = (presetMessage: string, label: string) => {
    setMessage(presetMessage);
    setResult(null);
    setError(null);
    setSelectedToken(null);
    toast(`Loaded preset: ${label}`, "info");
  };

  const handleAnalyze = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setError("Please paste or type a message to analyze.");
      toast("Please enter a message to analyze", "error");
      return;
    }
    if (trimmed.length > 10000) {
      setError("Message exceeds maximum supported length (10,000 characters).");
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedToken(null);

    // Realistic processing animation sequence (Cleaning -> Tokenizing -> TF-IDF -> Classifier)
    const stages = [
      "Cleaning and normalizing text patterns...",
      "Tokenizing and filtering stopwords...",
      "Extracting 4,000-dimensional TF-IDF vectors...",
      "Executing estimator classification...",
    ];

    let stageIdx = 0;
    setProcessingStage(stages[0]);
    const stageInterval = setInterval(() => {
      stageIdx++;
      if (stageIdx < stages.length) {
        setProcessingStage(stages[stageIdx]);
      }
    }, 180);

    try {
      const res = await predictMessage(trimmed, activeModelId);
      clearInterval(stageInterval);
      setResult(res);

      if (onRecordLatency && res.client_latency_ms) {
        onRecordLatency(res.client_latency_ms);
      }

      if (onAddHistory) {
        onAddHistory({
          message: trimmed.substring(0, 80) + (trimmed.length > 80 ? "..." : ""),
          prediction: res.prediction,
          probability: res.spam_probability,
          model: res.model,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      }

      toast(
        res.is_spam ? "Spam detected!" : "Message classified as safe ham.",
        res.is_spam ? "error" : "success"
      );
    } catch (err: any) {
      clearInterval(stageInterval);
      setError(
        err?.message ||
          "Unable to connect to the prediction backend. Ensure FastAPI backend is running on port 8008."
      );
      toast("Prediction request failed", "error");
    } finally {
      setLoading(false);
      setProcessingStage("");
    }
  };

  const handleCopy = () => {
    if (!message) return;
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast("Message copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const spamPct = result ? (result.spam_probability * 100).toFixed(1) : "0.0";
  const hamPct = result ? (result.ham_probability * 100).toFixed(1) : "0.0";

  return (
    <section id="detector" className="py-16 md:py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-700 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Model Workspace</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Interactive Spam Detector
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl">
              Input any message to evaluate its spam probability in real time. The engine applies deterministic cleaning, sparse TF-IDF projection, and extracts token-level feature evidence.
            </p>
          </div>

          {/* Model Switcher & Shortcuts Help */}
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => onSelectModel("naive_bayes")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeModelId === "naive_bayes"
                    ? "bg-white text-indigo-900 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Naive Bayes (Rec)
              </button>
              <button
                type="button"
                onClick={() => onSelectModel("logistic_regression")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeModelId === "logistic_regression"
                    ? "bg-white text-indigo-900 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Logistic Regression
              </button>
            </div>

            <button
              onClick={() => setShowShortcutsModal(true)}
              className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-xl border border-slate-200 transition-colors"
              title="Keyboard shortcuts"
              aria-label="View keyboard shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preset Quick Selectors */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Try Example:
          </span>
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(preset.message, preset.title)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                preset.type === "spam"
                  ? "bg-rose-50/80 text-rose-800 border-rose-200 hover:bg-rose-100"
                  : "bg-emerald-50/80 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <span className="font-bold">{preset.label}:</span> {preset.title}
            </button>
          ))}
        </div>

        {/* Section 10: Split Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Message Composer (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border-2 border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label
                  htmlFor="composer-textarea"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Message Composer</span>
                </label>

                {message && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-xs text-slate-500 hover:text-rose-600 inline-flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <textarea
                  id="composer-textarea"
                  ref={textareaRef}
                  rows={8}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Paste an email or message here to check whether it is spam..."
                  className="w-full p-4 text-sm sm:text-base text-slate-900 placeholder-slate-400 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-sans leading-relaxed resize-y"
                />
              </div>

              {/* Counters & Shortcuts Hint */}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-mono">
                <div className="flex items-center gap-4">
                  <span>
                    Chars: <strong className="text-slate-800">{charCount}</strong>
                  </span>
                  <span>
                    Words: <strong className="text-slate-800">{wordCount}</strong>
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Press <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded">Ctrl+Enter</kbd> to analyze
                </span>
              </div>
            </div>

            {/* Action Button & Processing Sequence Animation */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              {loading ? (
                <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 flex items-center gap-3 text-indigo-900 text-xs sm:text-sm animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
                  <span className="font-semibold">{processingStage || "Analyzing message..."}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!message.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-indigo-100 transition-all hover:shadow-lg active:scale-99"
                >
                  <Send className="w-4 h-4" />
                  <span>Detect Spam</span>
                </button>
              )}

              {error && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Error Notice</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Intelligence Panel (5 cols) */}
          <div className="lg:col-span-5">
            {!result ? (
              /* Before Analysis State */
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center min-h-[380px] flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Ready for Analysis</h3>
                <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed">
                  Enter or select a message on the left and click &ldquo;Detect Spam&rdquo; to execute full NLP featurization and model inference.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2 text-[11px] text-slate-400 font-mono">
                  <span className="px-2 py-1 rounded bg-slate-50 border border-slate-200">TF-IDF Vector</span>
                  <span className="px-2 py-1 rounded bg-slate-50 border border-slate-200">Probability Gauge</span>
                  <span className="px-2 py-1 rounded bg-slate-50 border border-slate-200">Linguistic Signals</span>
                </div>
              </div>
            ) : (
              /* After Analysis State */
              <div
                className={`bg-white rounded-2xl border-2 p-6 shadow-sm animate-in fade-in duration-200 ${
                  result.is_spam ? "border-rose-300 shadow-rose-50" : "border-emerald-300 shadow-emerald-50"
                }`}
              >
                {/* Result Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md ${
                        result.is_spam ? "bg-rose-600 shadow-rose-200" : "bg-emerald-600 shadow-emerald-200"
                      }`}
                    >
                      {result.is_spam ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                    </div>
                    <div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          result.is_spam ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        Model Verdict
                      </span>
                      <h3
                        className={`text-xl font-black tracking-tight mt-0.5 ${
                          result.is_spam ? "text-rose-600" : "text-emerald-700"
                        }`}
                      >
                        {result.is_spam ? "SPAM DETECTED" : "MESSAGE APPEARS SAFE"}
                      </h3>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-mono block">Latency</span>
                    <span className="text-xs font-mono font-bold text-indigo-600">
                      {result.process_time_ms} ms
                    </span>
                  </div>
                </div>

                {/* Probability Gauge */}
                <div className="py-4 border-b border-slate-100">
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-700">Posterior Probability</span>
                    <span className="font-mono text-slate-500">Confidence: {(result.confidence * 100).toFixed(1)}%</span>
                  </div>

                  {/* Dual Bar */}
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${hamPct}%` }}
                      className="bg-emerald-500 transition-all duration-700"
                      title={`Ham: ${hamPct}%`}
                    />
                    <div
                      style={{ width: `${spamPct}%` }}
                      className="bg-rose-500 transition-all duration-700"
                      title={`Spam: ${spamPct}%`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs mt-2 font-mono">
                    <span className="text-emerald-700 font-bold">Ham: {hamPct}%</span>
                    <span className="text-rose-700 font-bold">Spam: {spamPct}%</span>
                  </div>
                </div>

                {/* Diagnostics Mini-Strip */}
                <div className="py-3 border-b border-slate-100 grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-mono block">Tokens</span>
                    <span className="font-bold text-slate-800 font-mono">{result.message_stats.token_count}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-mono block">URLs</span>
                    <span className={`font-bold font-mono ${result.message_stats.has_urls ? "text-rose-600" : "text-slate-600"}`}>
                      {result.message_stats.has_urls ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-mono block">Currency</span>
                    <span className={`font-bold font-mono ${result.message_stats.has_currency ? "text-rose-600" : "text-slate-600"}`}>
                      {result.message_stats.has_currency ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-mono block">Num Seq</span>
                    <span className={`font-bold font-mono ${result.message_stats.has_numseq ? "text-rose-600" : "text-slate-600"}`}>
                      {result.message_stats.has_numseq ? "Yes" : "No"}
                    </span>
                  </div>
                </div>

                {/* Narrative Summary */}
                <div className="pt-4">
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    {result.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 13 & 14 & 15: Post-Prediction Deep Dive (Linguistic Signals, Token Explorer & Explainability) */}
        {result && (
          <div className="mt-10 pt-10 border-t border-slate-200 space-y-8 animate-in fade-in duration-300">
            {/* Section 13: Message Intelligence (Linguistic Signals) */}
            <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Message Intelligence &bull; Detected Linguistic Signals
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Structural and syntactic signals identified during text analysis. Labeled as stylistic indicators rather than direct model causes.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className={`p-3 rounded-xl border text-center ${result.linguistic_signals.urgency_detected ? "bg-rose-50 border-rose-200 text-rose-800 font-bold" : "bg-white border-slate-200 text-slate-500"}`}>
                  <span className="text-[11px] block">Urgency Tone</span>
                  <span className="text-xs font-mono">{result.linguistic_signals.urgency_detected ? "Detected" : "None"}</span>
                </div>
                <div className={`p-3 rounded-xl border text-center ${result.linguistic_signals.promotional_language ? "bg-rose-50 border-rose-200 text-rose-800 font-bold" : "bg-white border-slate-200 text-slate-500"}`}>
                  <span className="text-[11px] block">Promo Offers</span>
                  <span className="text-xs font-mono">{result.linguistic_signals.promotional_language ? "Detected" : "None"}</span>
                </div>
                <div className={`p-3 rounded-xl border text-center ${result.linguistic_signals.financial_terms ? "bg-rose-50 border-rose-200 text-rose-800 font-bold" : "bg-white border-slate-200 text-slate-500"}`}>
                  <span className="text-[11px] block">Financial Words</span>
                  <span className="text-xs font-mono">{result.linguistic_signals.financial_terms ? "Detected" : "None"}</span>
                </div>
                <div className={`p-3 rounded-xl border text-center ${result.linguistic_signals.prize_language ? "bg-rose-50 border-rose-200 text-rose-800 font-bold" : "bg-white border-slate-200 text-slate-500"}`}>
                  <span className="text-[11px] block">Prize / Claims</span>
                  <span className="text-xs font-mono">{result.linguistic_signals.prize_language ? "Detected" : "None"}</span>
                </div>
                <div className={`p-3 rounded-xl border text-center ${result.linguistic_signals.excessive_punctuation ? "bg-amber-50 border-amber-200 text-amber-800 font-bold" : "bg-white border-slate-200 text-slate-500"}`}>
                  <span className="text-[11px] block">Excessive Punctuation</span>
                  <span className="text-xs font-mono">{result.linguistic_signals.excessive_punctuation ? "Detected (!!/??)" : "Normal"}</span>
                </div>
                <div className="p-3 rounded-xl border bg-white border-slate-200 text-slate-700 text-center">
                  <span className="text-[11px] block">Uppercase Ratio</span>
                  <span className="text-xs font-mono font-bold">{result.linguistic_signals.uppercase_ratio}%</span>
                </div>
              </div>
            </div>

            {/* Section 15: Interactive Token Explorer */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Interactive Token Explorer
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Click any token to inspect TF-IDF weights</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Tokens parsed from the message. Click on any token chip below to inspect its exact mathematical TF-IDF weight and model contribution direction.
              </p>

              {/* Token Chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {result.token_breakdown && result.token_breakdown.length > 0 ? (
                  result.token_breakdown.map((item, idx) => {
                    const isSelected = selectedToken?.token === item.token;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedToken(item)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                          isSelected
                            ? "ring-2 ring-indigo-500 font-bold bg-indigo-50 border-indigo-300"
                            : item.direction === "spam"
                            ? "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                            : item.direction === "ham"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span>{item.token}</span>
                        {item.in_vocabulary ? (
                          <span
                            className={`text-[10px] px-1 rounded font-bold ${
                              item.direction === "spam"
                                ? "bg-rose-200/70 text-rose-900"
                                : item.direction === "ham"
                                ? "bg-emerald-200/70 text-emerald-900"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {item.tfidf_weight > 0 ? item.tfidf_weight.toFixed(2) : "Vocab"}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">OOV</span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 italic">No non-trivial tokens parsed.</p>
                )}
              </div>

              {/* Selected Token Detail Inspector */}
              {selectedToken && (
                <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 text-xs text-slate-700 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-indigo-950 font-mono">
                      Token: &ldquo;{selectedToken.token}&rdquo;
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-indigo-200 text-indigo-800 font-semibold">
                      Category: {selectedToken.category}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono mt-3">
                    <div>
                      <span className="text-slate-400 text-[11px] block">TF-IDF Vector Weight:</span>
                      <strong className="text-slate-900">{selectedToken.tfidf_weight.toFixed(4)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">In 4,000 Vocabulary:</span>
                      <strong className={selectedToken.in_vocabulary ? "text-emerald-700 font-bold" : "text-slate-500"}>
                        {selectedToken.in_vocabulary ? "Yes (Fitted)" : "No (Out of Vocab)"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Model Contribution:</span>
                      <strong className={selectedToken.direction === "spam" ? "text-rose-700 font-bold" : selectedToken.direction === "ham" ? "text-emerald-700 font-bold" : "text-slate-700"}>
                        {selectedToken.contribution > 0 ? `+${selectedToken.contribution.toFixed(4)}` : selectedToken.contribution.toFixed(4)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Influence Direction:</span>
                      <strong className={selectedToken.direction === "spam" ? "text-rose-700 uppercase" : selectedToken.direction === "ham" ? "text-emerald-700 uppercase" : "text-slate-600"}>
                        {selectedToken.direction}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 14: NLP Explainability ("Why Did the Model Predict This?") */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  NLP Explainability &bull; Feature Evidence Breakdown
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Mathematical evidence derived directly from model weights. Positive weights push the classification toward <strong className="text-rose-700">Spam</strong>; negative weights push toward <strong className="text-emerald-700">Ham</strong>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {result.top_features && result.top_features.length > 0 ? (
                  result.top_features.map((feat, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
                        feat.direction === "spam"
                          ? "bg-rose-50/50 border-rose-200 text-rose-900"
                          : "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                      }`}
                    >
                      <span className="font-bold text-sm">{feat.term}</span>
                      <span className="px-2 py-0.5 rounded font-bold bg-white border border-slate-200">
                        {feat.direction === "spam" ? `+${feat.weight.toFixed(3)} SPAM` : `${feat.weight.toFixed(3)} HAM`}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 col-span-2 italic">
                    No active high-impact vocabulary tokens found in this message.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Modal */}
        {showShortcutsModal && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setShowShortcutsModal(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-900 text-sm">Keyboard Shortcuts</h4>
                <button onClick={() => setShowShortcutsModal(false)} className="text-slate-400 hover:text-slate-600">
                  &times;
                </button>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-700">Analyze Message</span>
                  <kbd className="px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold">Ctrl + Enter</kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-700">Clear Message</span>
                  <kbd className="px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold">Esc</kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-700">Command Palette</span>
                  <kbd className="px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold">Ctrl + K</kbd>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
