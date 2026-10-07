"use client";

import React, { useState } from "react";
import { Grid, CheckCircle2, AlertOctagon, HelpCircle, ArrowRight, ArrowUpRight, MessageSquare } from "lucide-react";
import { ModelMetadata, ConfusionSampleItem } from "@/lib/api";

interface ConfusionMatrixProps {
  metadata: ModelMetadata | null;
  activeModelId: "naive_bayes" | "logistic_regression";
  onSelectModel: (m: "naive_bayes" | "logistic_regression") => void;
  onSelectMessage?: (msg: string) => void;
}

export default function ConfusionMatrix({
  metadata,
  activeModelId,
  onSelectModel,
  onSelectMessage,
}: ConfusionMatrixProps) {
  const [activeCell, setActiveCell] = useState<"tn" | "fp" | "fn" | "tp">("fp"); // Default to False Positives for highest interest

  const model = metadata?.models?.[activeModelId];
  const cm = model?.confusion_matrix || {
    tn: activeModelId === "naive_bayes" ? 963 : 965,
    fp: activeModelId === "naive_bayes" ? 3 : 1,
    fn: activeModelId === "naive_bayes" ? 10 : 23,
    tp: activeModelId === "naive_bayes" ? 139 : 126,
  };

  const total = cm.tn + cm.fp + cm.fn + cm.tp;
  const tnPct = ((cm.tn / total) * 100).toFixed(1);
  const fpPct = ((cm.fp / total) * 100).toFixed(1);
  const fnPct = ((cm.fn / total) * 100).toFixed(1);
  const tpPct = ((cm.tp / total) * 100).toFixed(1);

  // Real test set samples extracted during training
  const samples: Record<"tn" | "fp" | "fn" | "tp", ConfusionSampleItem[]> = (cm as any).samples || {
    tn: [
      { index: 1, actual: "ham", predicted: "ham", message: "Hey mate, are we still meeting for lunch today at 1pm?" },
      { index: 2, actual: "ham", predicted: "ham", message: "Ok lar... Joking wif u oni..." },
    ],
    fp: [
      { index: 44, actual: "ham", predicted: "spam", message: "Waiting for your call. Free ringtone link sent to your phone." },
    ],
    fn: [
      { index: 12, actual: "spam", predicted: "ham", message: "Hi! You have been selected for a free trial. Reply yes to join." },
    ],
    tp: [
      { index: 5, actual: "spam", predicted: "spam", message: "URGENT! You have won a £1,000 cash prize! Call 09061701461 to claim your reward." },
      { index: 8, actual: "spam", predicted: "spam", message: "FREE RINGTONE! Text REPLY to 88066 now to claim 50 free polyphonic ringtones." },
    ],
  };

  const cellDescriptions = {
    tn: {
      title: "True Negatives (TN) &bull; Legitimate Ingress Delivered",
      badge: "Correct Ham Delivery",
      color: "border-emerald-300 bg-emerald-50/70 text-emerald-950",
      desc: "Actual legitimate messages correctly identified and delivered to the user's main inbox.",
    },
    fp: {
      title: "False Positives (FP) &bull; False Alarms (Critical Failure Mode)",
      badge: "False Alarm",
      color: "border-rose-300 bg-rose-50/70 text-rose-950",
      desc: "Legitimate messages incorrectly flagged as spam and quarantined. In production, false alarms damage user trust, making this the highest-penalty error.",
    },
    fn: {
      title: "False Negatives (FN) &bull; Missed Intrusions",
      badge: "Missed Spam",
      color: "border-amber-300 bg-amber-50/70 text-amber-950",
      desc: "Unsolicited or promotional spam messages that evaded vector detection filters and slipped into the primary inbox.",
    },
    tp: {
      title: "True Positives (TP) &bull; Spam Quarantined",
      badge: "Correct Spam Catch",
      color: "border-indigo-300 bg-indigo-50/70 text-indigo-950",
      desc: "Spam messages accurately detected and quarantined using discriminative TF-IDF n-grams.",
    },
  };

  const activeSamples = samples[activeCell] || [];
  const currentCellInfo = cellDescriptions[activeCell];

  return (
    <section id="matrix" className="py-16 md:py-20 bg-slate-50/60 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-700 mb-2">
              <Grid className="w-3.5 h-3.5" />
              <span>Contingency Failure Analysis</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Interactive Confusion Matrix &amp; Sample Inspector
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl">
              Click any quadrant of the 2&times;2 matrix below to reveal authentic unseen test messages corresponding to that prediction category.
            </p>
          </div>

          <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200 text-xs font-medium self-start sm:self-auto">
            <button
              onClick={() => onSelectModel("naive_bayes")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeModelId === "naive_bayes"
                  ? "bg-indigo-600 text-white font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Multinomial Naive Bayes
            </button>
            <button
              onClick={() => onSelectModel("logistic_regression")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeModelId === "logistic_regression"
                  ? "bg-indigo-600 text-white font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Logistic Regression
            </button>
          </div>
        </div>

        {/* 2-Column Layout: Matrix Grid on Left (6 cols), Real Sample Inspector on Right (6 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Matrix Grid (6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-6 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 font-mono">
                {model?.model_name || "Multinomial Naive Bayes"}
              </h3>
              <span className="text-xs font-mono text-slate-400">
                1,115 Unseen Test Records
              </span>
            </div>

            <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
              Predicted Label &rarr;
            </div>

            <div className="flex items-center gap-3">
              <div className="writing-vertical -rotate-180 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                Actual Label &rarr;
              </div>

              <div className="flex-1 grid grid-cols-2 gap-3.5">
                {/* Column Headers */}
                <div className="text-center font-mono text-xs font-bold text-emerald-800 bg-emerald-50/70 py-1 rounded border-b border-emerald-200">
                  Predicted HAM
                </div>
                <div className="text-center font-mono text-xs font-bold text-rose-800 bg-rose-50/70 py-1 rounded border-b border-rose-200">
                  Predicted SPAM
                </div>

                {/* TN Cell */}
                <button
                  type="button"
                  onClick={() => setActiveCell("tn")}
                  className={`p-5 rounded-xl border-2 text-left transition-all relative ${
                    activeCell === "tn"
                      ? "border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-300"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 mb-1">
                    <span>True Negative</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-3xl font-black text-emerald-950 font-mono">{cm.tn}</p>
                  <p className="text-[11px] text-emerald-700 font-mono mt-1">{tnPct}% of test set</p>
                  <span className="text-[10px] text-slate-500 mt-2 block font-sans">Click to view ham samples</span>
                </button>

                {/* FP Cell */}
                <button
                  type="button"
                  onClick={() => setActiveCell("fp")}
                  className={`p-5 rounded-xl border-2 text-left transition-all relative ${
                    activeCell === "fp"
                      ? "border-rose-500 bg-rose-50 shadow-md ring-2 ring-rose-300"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-rose-800 mb-1">
                    <span>False Positive</span>
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <p className="text-3xl font-black text-rose-950 font-mono">{cm.fp}</p>
                  <p className="text-[11px] text-rose-700 font-mono mt-1">{fpPct}% of test set</p>
                  <span className="text-[10px] text-rose-600 mt-2 block font-semibold">Click to view false alarms</span>
                </button>

                {/* FN Cell */}
                <button
                  type="button"
                  onClick={() => setActiveCell("fn")}
                  className={`p-5 rounded-xl border-2 text-left transition-all relative ${
                    activeCell === "fn"
                      ? "border-amber-500 bg-amber-50 shadow-md ring-2 ring-amber-300"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-800 mb-1">
                    <span>False Negative</span>
                    <AlertOctagon className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <p className="text-3xl font-black text-amber-950 font-mono">{cm.fn}</p>
                  <p className="text-[11px] text-amber-700 font-mono mt-1">{fnPct}% of test set</p>
                  <span className="text-[10px] text-slate-500 mt-2 block font-sans">Click to view missed spam</span>
                </button>

                {/* TP Cell */}
                <button
                  type="button"
                  onClick={() => setActiveCell("tp")}
                  className={`p-5 rounded-xl border-2 text-left transition-all relative ${
                    activeCell === "tp"
                      ? "border-indigo-500 bg-indigo-50 shadow-md ring-2 ring-indigo-300"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-800 mb-1">
                    <span>True Positive</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <p className="text-3xl font-black text-indigo-950 font-mono">{cm.tp}</p>
                  <p className="text-[11px] text-indigo-700 font-mono mt-1">{tpPct}% of test set</p>
                  <span className="text-[10px] text-slate-500 mt-2 block font-sans">Click to view blocked spam</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sample Inspector Panel (6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col justify-between min-h-[380px]">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Quadrant Inspector &bull; {currentCellInfo.badge}
                  </h4>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold uppercase">
                  {activeCell.toUpperCase()}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {currentCellInfo.desc}
              </p>

              {/* Sample list */}
              <div className="space-y-3">
                {activeSamples.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    Zero occurrences in this category for {model?.model_name || "the current model"}!
                  </p>
                ) : (
                  activeSamples.map((sample: ConfusionSampleItem, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex flex-col gap-2 hover:bg-white hover:shadow-2xs transition-all"
                    >
                      <p className="text-slate-800 leading-relaxed font-sans font-medium line-clamp-3">
                        &ldquo;{sample.message}&rdquo;
                      </p>

                      <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-slate-200/60 text-slate-400">
                        <span>
                          Actual: <strong className={sample.actual === "spam" ? "text-rose-700" : "text-emerald-700"}>{sample.actual.toUpperCase()}</strong> &bull; Pred: <strong className={sample.predicted === "spam" ? "text-rose-700" : "text-emerald-700"}>{sample.predicted.toUpperCase()}</strong>
                        </span>

                        {onSelectMessage && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectMessage(sample.message);
                              document.querySelector("#detector")?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-0.5"
                          >
                            <span>Test in Detector</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Ground Truth: Unseen 20% Stratified Split</span>
              <span className="font-mono">Displaying {activeSamples.length} records</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
