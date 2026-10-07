"use client";

import React from "react";
import { History, Trash2, ArrowUpRight, ShieldCheck, ShieldAlert, Lock } from "lucide-react";
import { useToast } from "./ToastContext";

export interface HistoryItem {
  id: string;
  type?: string;
  message: string;
  prediction: string;
  probability: number;
  model: string;
  timestamp: string;
}

interface PredictionHistoryProps {
  history: HistoryItem[];
  onClearHistory: () => void;
  onSelectMessage: (msg: string) => void;
}

export default function PredictionHistory({
  history,
  onClearHistory,
  onSelectMessage,
}: PredictionHistoryProps) {
  const { toast } = useToast();

  const handleClear = () => {
    onClearHistory();
    toast("Prediction history cleared", "info");
  };

  return (
    <section className="py-12 bg-slate-50/50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Session Analysis History</h3>
              <p className="text-xs text-slate-500">In-memory session log of recent classifications</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-rose-600 hover:bg-white rounded-lg border border-slate-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
          </div>
        </div>

        {history.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-400">
            No analyses performed yet in this session. Messages classified above will appear here for reference.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {history.map((item) => {
              const isSpam = item.prediction.toLowerCase() === "spam";
              const spamPct = (item.probability * 100).toFixed(1);
              return (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSpam ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {isSpam ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{item.message}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-0.5">
                        <span>{item.timestamp}</span>
                        <span>&bull;</span>
                        <span>Model: {item.model}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold font-mono ${
                        isSpam
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {isSpam ? `SPAM (${spamPct}%)` : `HAM (${(100 - parseFloat(spamPct)).toFixed(1)}%)`}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectMessage(item.message);
                        document.querySelector("#detector")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-0.5"
                    >
                      <span>Reload</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Section 25: Privacy Notice */}
        <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>
            <strong>Privacy Notice:</strong> Messages are analyzed in volatile memory for classification and are not persisted to any database.
          </span>
        </div>
      </div>
    </section>
  );
}
