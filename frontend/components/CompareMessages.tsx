"use client";

import React, { useState } from "react";
import {
  GitCompare,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { predictMessage, PredictResponse } from "@/lib/api";

const SAMPLE_A = "Dear customer, your Chase debit card has been temporarily locked due to suspicious activity. Verify immediately at http://chase.com.security-verify.xyz or card will be closed.";
const SAMPLE_B = "Hi Alex, your monthly bank statement for October is now available. Log in to your Chase mobile app or visit chase.com to review your statement.";

export default function CompareMessages() {
  const [messageA, setMessageA] = useState(SAMPLE_A);
  const [messageB, setMessageB] = useState(SAMPLE_B);
  const [loading, setLoading] = useState(false);
  const [resultA, setResultA] = useState<PredictResponse | null>(null);
  const [resultB, setResultB] = useState<PredictResponse | null>(null);

  const handleCompare = async () => {
    if (!messageA.trim() || !messageB.trim()) return;
    setLoading(true);
    try {
      const [resA, resB] = await Promise.all([
        predictMessage(messageA),
        predictMessage(messageB),
      ]);
      setResultA(resA);
      setResultB(resB);
    } catch (err) {
      console.error("Comparison error:", err);
    } finally {
      setLoading(false);
    }
  };

  const scoreA = resultA ? Math.round(resultA.spam_probability * 100) : null;
  const scoreB = resultB ? Math.round(resultB.spam_probability * 100) : null;

  return (
    <section id="compare" className="py-14 bg-white border-b border-[#E8E6E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF9F6] border border-[#E8E6E1] text-xs font-semibold text-[#6D5DFB] mb-2 shadow-2xs">
              <GitCompare className="w-3.5 h-3.5" />
              <span>Comparative Threat Analysis &bull; Educational Benchmarking</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#202124] tracking-tight">
              Compare Two Messages
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#5F6368] max-w-2xl">
              Inspect two communications side-by-side to understand why subtle cues like urgency, fake subdomains, and credential requests shift risk profiles.
            </p>
          </div>

          <button
            onClick={handleCompare}
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Comparing...</span>
              </>
            ) : (
              <>
                <GitCompare className="w-4 h-4" />
                <span>Compare Messages</span>
              </>
            )}
          </button>
        </div>

        {/* Side by side inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Message A */}
          <div className="p-6 rounded-3xl bg-[#FAF9F6] border border-[#E8E6E1] space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#202124] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#202124] text-white text-[11px] font-mono flex items-center justify-center">A</span>
                <span>Message Variant A</span>
              </span>
              {scoreA !== null && (
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                    scoreA > 50
                      ? "bg-rose-50 text-rose-800 border-rose-300"
                      : "bg-emerald-50 text-emerald-800 border-emerald-300"
                  }`}
                >
                  Risk: {scoreA}/100 ({resultA?.prediction.toUpperCase()})
                </span>
              )}
            </div>

            <textarea
              rows={5}
              value={messageA}
              onChange={(e) => setMessageA(e.target.value)}
              placeholder="Paste first message..."
              className="w-full p-3.5 bg-white border border-[#E8E6E1] rounded-2xl text-xs font-mono text-[#202124] resize-none focus:outline-none focus:border-[#6D5DFB]"
            />

            {resultA && (
              <div className="p-4 rounded-2xl bg-white border border-[#E8E6E1] space-y-2 text-xs">
                <div className="font-bold text-[#202124] flex items-center justify-between">
                  <span>Detected Signals:</span>
                  <span className="font-mono text-[#5F6368]">{resultA.process_time_ms}ms</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {resultA.top_features.map((f, i) => (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        f.direction === "spam"
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {f.term}
                    </span>
                  ))}
                  {resultA.linguistic_signals.urgency_detected && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Urgency Trigger
                    </span>
                  )}
                  {resultA.linguistic_signals.has_urls && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
                      Embedded Link
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Message B */}
          <div className="p-6 rounded-3xl bg-[#FAF9F6] border border-[#E8E6E1] space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#202124] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#6D5DFB] text-white text-[11px] font-mono flex items-center justify-center">B</span>
                <span>Message Variant B</span>
              </span>
              {scoreB !== null && (
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${
                    scoreB > 50
                      ? "bg-rose-50 text-rose-800 border-rose-300"
                      : "bg-emerald-50 text-emerald-800 border-emerald-300"
                  }`}
                >
                  Risk: {scoreB}/100 ({resultB?.prediction.toUpperCase()})
                </span>
              )}
            </div>

            <textarea
              rows={5}
              value={messageB}
              onChange={(e) => setMessageB(e.target.value)}
              placeholder="Paste second message..."
              className="w-full p-3.5 bg-white border border-[#E8E6E1] rounded-2xl text-xs font-mono text-[#202124] resize-none focus:outline-none focus:border-[#6D5DFB]"
            />

            {resultB && (
              <div className="p-4 rounded-2xl bg-white border border-[#E8E6E1] space-y-2 text-xs">
                <div className="font-bold text-[#202124] flex items-center justify-between">
                  <span>Detected Signals:</span>
                  <span className="font-mono text-[#5F6368]">{resultB.process_time_ms}ms</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {resultB.top_features.map((f, i) => (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        f.direction === "spam"
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {f.term}
                    </span>
                  ))}
                  {resultB.linguistic_signals.urgency_detected && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Urgency Trigger
                    </span>
                  )}
                  {resultB.linguistic_signals.has_urls && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
                      Embedded Link
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comparative Verdict Summary */}
        {scoreA !== null && scoreB !== null && (
          <div className="mt-8 p-6 rounded-3xl bg-[#F2F0FF]/40 border border-[#6D5DFB]/30 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#6D5DFB]" />
              <h3 className="text-base font-bold text-[#202124]">Comparative Security Verdict</h3>
            </div>
            <p className="text-xs text-[#5F6368] leading-relaxed">
              {scoreA > scoreB ? (
                <>
                  <strong className="text-rose-600">Message A is riskier</strong> by{" "}
                  <strong>{scoreA - scoreB} points</strong>. Message A relies on coercive ultimatums (&apos;temporarily locked&apos;, &apos;immediately&apos;) and points to an unverified subdomain, whereas Message B advises opening the official mobile app or known website without panic triggers.
                </>
              ) : scoreB > scoreA ? (
                <>
                  <strong className="text-rose-600">Message B is riskier</strong> by{" "}
                  <strong>{scoreB - scoreA} points</strong>. It exhibits higher statistical correlation with fraud corpora.
                </>
              ) : (
                <>Both messages exhibit identical risk profiles under the supervised classifier.</>
              )}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
