"use client";

import React, { useState } from "react";
import { Sliders, Scale, HelpCircle, AlertOctagon, CheckCircle2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceDot,
  CartesianGrid,
} from "recharts";
import { ModelMetadata, ThresholdPoint } from "@/lib/api";

interface ThresholdExplorerProps {
  metadata: ModelMetadata | null;
  activeModelId: "naive_bayes" | "logistic_regression";
  onSelectModel: (m: "naive_bayes" | "logistic_regression") => void;
}

export default function ThresholdExplorer({
  metadata,
  activeModelId,
  onSelectModel,
}: ThresholdExplorerProps) {
  const [thresholdIndex, setThresholdIndex] = useState<number>(4); // default 0.50 (index 4 in [0.1..0.9])

  const defaultThresholdPoints: ThresholdPoint[] = [
    { threshold: 0.10, precision: 0.892, recall: 0.966, f1_score: 0.928, tp: 144, fp: 17, fn: 5, tn: 949 },
    { threshold: 0.20, precision: 0.934, recall: 0.953, f1_score: 0.943, tp: 142, fp: 10, fn: 7, tn: 956 },
    { threshold: 0.30, precision: 0.965, recall: 0.946, f1_score: 0.955, tp: 141, fp: 5, fn: 8, tn: 961 },
    { threshold: 0.40, precision: 0.972, recall: 0.939, f1_score: 0.955, tp: 140, fp: 4, fn: 9, tn: 962 },
    { threshold: 0.50, precision: 0.979, recall: 0.933, f1_score: 0.955, tp: 139, fp: 3, fn: 10, tn: 963 },
    { threshold: 0.60, precision: 0.985, recall: 0.912, f1_score: 0.947, tp: 136, fp: 2, fn: 13, tn: 964 },
    { threshold: 0.70, precision: 0.992, recall: 0.872, f1_score: 0.928, tp: 130, fp: 1, fn: 19, tn: 965 },
    { threshold: 0.80, precision: 0.992, recall: 0.832, f1_score: 0.905, tp: 124, fp: 1, fn: 25, tn: 965 },
    { threshold: 0.90, precision: 1.000, recall: 0.765, f1_score: 0.867, tp: 114, fp: 0, fn: 35, tn: 966 },
  ];

  const curveData =
    metadata?.threshold_analysis?.[activeModelId] && metadata.threshold_analysis[activeModelId].length > 0
      ? metadata.threshold_analysis[activeModelId]
      : defaultThresholdPoints;

  const currentPoint = curveData[thresholdIndex] || curveData[4];

  // Chart data format: X = Recall (0 to 1), Y = Precision (0 to 1)
  const prChartData = curveData.map((pt) => ({
    recall: Number((pt.recall * 100).toFixed(1)),
    precision: Number((pt.precision * 100).toFixed(1)),
    threshold: pt.threshold,
    f1: Number((pt.f1_score * 100).toFixed(1)),
  }));

  return (
    <section id="thresholds" className="py-16 md:py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-700 mb-2">
              <Sliders className="w-3.5 h-3.5" />
              <span>Sensitivity Tuning</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Classification Threshold Explorer
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl">
              Dynamically explore the mathematical trade-off between Precision and Recall. Move the threshold slider to adjust decision sensitivity on the unseen 1,115 test set messages.
            </p>
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-medium self-start sm:self-auto">
            <button
              onClick={() => onSelectModel("naive_bayes")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeModelId === "naive_bayes"
                  ? "bg-white text-indigo-900 font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Naive Bayes
            </button>
            <button
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
        </div>

        {/* Workspace: Slider & Metrics on Left, PR Curve on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls & Metrics (5 cols) */}
          <div className="lg:col-span-5 bg-slate-50/70 rounded-2xl p-6 border border-slate-200 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Decision Threshold ($\tau$)
                </span>
                <span className="font-mono text-base font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                  {currentPoint.threshold.toFixed(2)}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max={curveData.length - 1}
                step="1"
                value={thresholdIndex}
                onChange={(e) => setThresholdIndex(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />

              <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
                <span>0.10 (Aggressive)</span>
                <span>0.50 (Standard)</span>
                <span>0.90 (Conservative)</span>
              </div>
            </div>

            {/* Dynamic Metric Display at this Threshold */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase block">Precision</span>
                <p className="text-2xl font-black text-emerald-700 font-mono mt-0.5">
                  {(currentPoint.precision * 100).toFixed(1)}%
                </p>
                <p className="text-[10px] text-slate-400 mt-1">False Alarms: <strong>{currentPoint.fp}</strong></p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-blue-800 uppercase block">Recall</span>
                <p className="text-2xl font-black text-blue-700 font-mono mt-0.5">
                  {(currentPoint.recall * 100).toFixed(1)}%
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Spam Missed: <strong>{currentPoint.fn}</strong></p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-indigo-800 uppercase block">F1 Score</span>
                <p className="text-2xl font-black text-indigo-700 font-mono mt-0.5">
                  {(currentPoint.f1_score * 100).toFixed(1)}%
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Harmonic Balance</p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-700 uppercase block">Spam Blocked</span>
                <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                  {currentPoint.tp} / 149
                </p>
                <p className="text-[10px] text-slate-400 mt-1">True Positives</p>
              </div>
            </div>

            {/* Explanation card */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                {currentPoint.threshold < 0.5 ? (
                  <>
                    <strong className="text-slate-900">Aggressive Spam Ingestion ($\tau &lt; 0.5$):</strong> Captures more subtle spam ({currentPoint.tp} caught), but risks flagging {currentPoint.fp} legitimate messages as false alarms.
                  </>
                ) : currentPoint.threshold > 0.5 ? (
                  <>
                    <strong className="text-slate-900">Strict Legitimate Protection ($\tau &gt; 0.5$):</strong> Eliminates almost all false alarms ({currentPoint.fp} FP), but lets {currentPoint.fn} spam messages slip into the inbox.
                  </>
                ) : (
                  <>
                    <strong className="text-slate-900">Standard Decision Boundary ($\tau = 0.50$):</strong> Standard statistical equilibrium maximizing test set F1 score.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Precision vs Recall Curve Chart (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Precision-Recall Operating Curve (Test Set)
                </h3>
              </div>
              <span className="text-xs font-mono text-indigo-600 font-bold">
                Operating Point: &tau;={currentPoint.threshold.toFixed(2)}
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prChartData} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="recall"
                    type="number"
                    domain={[70, 100]}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    label={{ value: "Recall (%) →", position: "insideBottom", offset: -10, fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    domain={[85, 100]}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    label={{ value: "Precision (%) →", angle: -90, position: "insideLeft", fontSize: 11, fill: "#64748b" }}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val}%`, name === "precision" ? "Precision" : name]}
                    labelFormatter={(label) => `Recall: ${label}%`}
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="precision"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    dot={{ fill: "#4f46e5", r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                  {/* Highlight current operating point */}
                  <ReferenceDot
                    x={Number((currentPoint.recall * 100).toFixed(1))}
                    y={Number((currentPoint.precision * 100).toFixed(1))}
                    r={7}
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Active Point: Recall {(currentPoint.recall * 100).toFixed(1)}%, Precision {(currentPoint.precision * 100).toFixed(1)}%
              </span>
              <span>1,115 Unseen Test Messages</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
