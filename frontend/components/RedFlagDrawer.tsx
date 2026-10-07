"use client";

import React from "react";
import {
  X,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  Brain,
  Cpu,
  Globe,
  Terminal,
  CheckCircle2,
  Info,
  Layers,
} from "lucide-react";
import { RedFlagItem, UnifiedScanResult, PredictResponse } from "@/lib/api";

interface RedFlagDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFlag: RedFlagItem | null;
  unifiedScanResult: UnifiedScanResult | null;
  textResult: PredictResponse | null;
  mode: string;
}

export default function RedFlagDrawer({
  isOpen,
  onClose,
  selectedFlag,
  unifiedScanResult,
  textResult,
  mode,
}: RedFlagDrawerProps) {
  if (!isOpen) return null;

  const redFlags = unifiedScanResult?.red_flags || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#202124]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white border-l border-[#E8E6E1] shadow-2xl h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#E8E6E1] bg-[#FAF9F6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F2F0FF] text-[#6D5DFB] border border-[#E8E6E1] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#202124]">
                {selectedFlag ? selectedFlag.title : "Why Was This Flagged?"}
              </h3>
              <p className="text-xs text-[#5F6368]">
                {selectedFlag ? "Detailed threat breakdown & evidence" : "Multi-layer security assessment explanation"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#5F6368] hover:text-[#202124] hover:bg-white transition-colors cursor-pointer"
            aria-label="Close Explanation Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* If a specific flag is selected */}
          {selectedFlag ? (
            <div className="space-y-4">
              {/* Category & Contribution Pill */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1]">
                <div>
                  <span className="text-[10px] font-bold text-[#5F6368] uppercase tracking-wider block">
                    CATEGORY
                  </span>
                  <span className="font-mono font-bold text-xs text-[#202124] uppercase">
                    {selectedFlag.category.replace("_", " ")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#5F6368] uppercase tracking-wider block">
                    RISK CONTRIBUTION
                  </span>
                  <span className="font-mono font-bold text-sm text-rose-600">
                    +{selectedFlag.risk_contribution} pts
                  </span>
                </div>
              </div>

              {/* WHY IT MATTERS */}
              <div className="p-4 rounded-2xl bg-white border border-[#E8E6E1] shadow-2xs space-y-1.5">
                <h4 className="font-bold text-[#202124] uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-rose-700">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Why It Matters</span>
                </h4>
                <p className="text-[#5F6368] leading-relaxed">
                  {selectedFlag.description}
                </p>
              </div>

              {/* EVIDENCE */}
              <div className="p-4 rounded-2xl bg-[#FFF8F8] border border-rose-100 space-y-1.5">
                <h4 className="font-bold text-rose-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Identified Evidence</span>
                </h4>
                <div className="p-3 bg-white rounded-xl border border-rose-200 font-mono text-xs text-rose-950 font-semibold break-words">
                  {selectedFlag.evidence}
                </div>
              </div>

              {/* SOURCE */}
              <div className="p-4 rounded-2xl bg-white border border-[#E8E6E1] shadow-2xs space-y-1.5">
                <h4 className="font-bold text-[#202124] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#6D5DFB]" />
                  <span>Detection Source</span>
                </h4>
                <p className="text-[#5F6368]">
                  Identified by: <strong className="text-[#202124]">{selectedFlag.source}</strong>.
                </p>
              </div>
            </div>
          ) : (
            /* General "Explain More" view */
            <div className="space-y-5">
              {/* Threat Summary */}
              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1] space-y-2">
                <h4 className="font-bold text-[#202124] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#6D5DFB]" />
                  <span>Threat Summary</span>
                </h4>
                <p className="text-[#202124] leading-relaxed font-sans">
                  {unifiedScanResult?.gemini?.summary ||
                    `This item received an overall threat score of ${unifiedScanResult?.risk_score ?? 0}/100. Multiple security layers evaluated the content for statistical fraud tokens, cognitive manipulation cues, and technical anomalies.`}
                </p>
              </div>

              {/* All Red Flags Detected */}
              {redFlags.length > 0 && (
                <div>
                  <h4 className="font-bold text-[#202124] uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Red Flags Detected ({redFlags.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {redFlags.map((flag) => (
                      <div
                        key={flag.id}
                        className="p-3.5 rounded-xl bg-white border border-[#E8E6E1] shadow-2xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#202124] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            {flag.title}
                          </span>
                          <span className="font-mono text-[11px] text-rose-600 font-bold">
                            +{flag.risk_contribution} pts
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5F6368]">{flag.description}</p>
                        <div className="pt-1 text-[10px] font-mono text-[#5F6368] flex items-center justify-between border-t border-[#F0EFEA]">
                          <span>Evidence: {flag.evidence}</span>
                          <span className="text-[#6D5DFB]">{flag.source}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI & ML Analysis Breakdown */}
              <div className="p-4 rounded-2xl bg-white border border-[#E8E6E1] shadow-2xs space-y-2">
                <h4 className="font-bold text-[#202124] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-[#6D5DFB]" />
                  <span>AI &amp; Contextual Understanding</span>
                </h4>
                <p className="text-[#5F6368] leading-relaxed">
                  {unifiedScanResult?.gemini?.available
                    ? `Google Gemini examined social engineering tactics, urgency escalation, and credential harvesting patterns.`
                    : "Gemini AI was not reachable; deterministic fallback rules and supervised Scikit-Learn classifiers provided the security verdict."}
                </p>
                {unifiedScanResult?.gemini?.social_engineering_tactics && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {unifiedScanResult.gemini.social_engineering_tactics.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#F2F0FF] text-[#6D5DFB] border border-[#6D5DFB]/20"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Scikit-Learn ML Classifier */}
              <div className="p-4 rounded-2xl bg-white border border-[#E8E6E1] shadow-2xs space-y-2">
                <h4 className="font-bold text-[#202124] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Supervised Machine Learning</span>
                </h4>
                <p className="text-[#5F6368] leading-relaxed">
                  Evaluated through TF-IDF vectorized token distributions trained on 5,572 verified SMS and email fraud samples.
                </p>
                {textResult?.top_features && textResult.top_features.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] text-[#5F6368] font-bold block mb-1">Top Vocabulary Indicators:</span>
                    <div className="flex flex-wrap gap-1">
                      {textResult.top_features.slice(0, 6).map((f, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            f.direction === "spam"
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          {f.term} ({f.weight > 0 ? "+" : ""}{f.weight})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Threat Intelligence Source */}
              <div className="p-4 rounded-2xl bg-white border border-[#E8E6E1] shadow-2xs space-y-2">
                <h4 className="font-bold text-[#202124] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#38C9A7]" />
                  <span>External Threat Intelligence (VirusTotal)</span>
                </h4>
                <p className="text-[#5F6368] leading-relaxed">
                  {unifiedScanResult?.virustotal?.available
                    ? `VirusTotal verified target links across 90+ antivirus engines and domain blocklists.`
                    : "No external domain query executed or VirusTotal service was offline."}
                </p>
              </div>

              {/* Confidence System */}
              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#5F6368] uppercase tracking-wider block">
                    ASSESSMENT CONFIDENCE
                  </span>
                  <span className="font-mono font-bold text-xs text-[#202124]">
                    {(unifiedScanResult?.confidence || "HIGH").toUpperCase()}
                  </span>
                </div>
                <div className="text-right text-[11px] text-[#5F6368]">
                  Based on source agreement &amp; engine availability
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E8E6E1] bg-[#FAF9F6] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#202124] hover:bg-black text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
