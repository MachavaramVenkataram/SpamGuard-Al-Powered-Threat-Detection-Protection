"use client";

import React from "react";
import {
  Cpu,
  Clock,
  BarChart2,
  HelpCircle,
  Hash,
  Link2,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { PredictResponse } from "@/lib/api";
import SpamRiskIcon from "@/components/SpamRiskIcon";

interface ResultCardProps {
  result: PredictResponse;
}

export default function ResultCard({ result }: ResultCardProps) {
  const isSpam = result.is_spam;
  const spamPct = (result.spam_probability * 100).toFixed(1);
  const hamPct = (result.ham_probability * 100).toFixed(1);

  // Extract detected linguistic signals for chips
  const signals: string[] = [];
  if (result.linguistic_signals?.urgency_detected) signals.push("Urgency Language");
  if (result.linguistic_signals?.prize_language) signals.push("Prize / Reward Trap");
  if (result.linguistic_signals?.financial_terms) signals.push("Financial Incentive");
  if (result.linguistic_signals?.has_urls) signals.push("Embedded URL Destination");
  if (result.linguistic_signals?.promotional_language) signals.push("Promotional Vocabulary");

  return (
    <div
      aria-live="polite"
      className="rounded-3xl border border-[#E8E6E1] p-6 sm:p-8 bg-white transition-all shadow-sm space-y-6"
    >
      {/* Custom Animated Spam Risk Detection Icon Hero */}
      <SpamRiskIcon
        isSpam={isSpam}
        riskScore={Math.round(result.spam_probability * 100)}
        riskLevel={isSpam ? (result.spam_probability > 0.85 ? "HIGH_RISK" : "SUSPICIOUS") : "SAFE"}
        modelName={result.model}
        probability={result.spam_probability}
        latencyMs={result.process_time_ms}
        detectedSignals={signals}
        resultData={result}
      />

      {/* Model Posterior Probability Breakdown */}
      <div className="py-5 border-t border-b border-[#E8E6E1]">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-[#202124] flex items-center gap-1.5 font-bold">
            <BarChart2 className="w-4 h-4 text-[#6D5DFB]" />
            Model Posterior Probability
          </span>
          <span className="font-mono text-[#5F6368]">Confidence: {(result.confidence * 100).toFixed(1)}%</span>
        </div>

        {/* Bi-directional progress bar */}
        <div className="h-3 w-full bg-[#FAF9F6] rounded-full overflow-hidden flex border border-[#E8E6E1]">
          <div
            style={{ width: `${hamPct}%` }}
            className="bg-[#38C9A7] transition-all duration-700 ease-out"
            title={`Ham: ${hamPct}%`}
          />
          <div
            style={{ width: `${spamPct}%` }}
            className="bg-[#FF6B6B] transition-all duration-700 ease-out"
            title={`Spam: ${spamPct}%`}
          />
        </div>

        <div className="flex items-center justify-between text-xs mt-2.5 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38C9A7]" />
            <span className="text-[#5F6368]">Ham (Legitimate):</span>
            <strong className="text-[#38C9A7] font-bold">{hamPct}%</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B]" />
            <span className="text-[#5F6368]">Spam Probability:</span>
            <strong className="text-[#FF6B6B] font-bold">{spamPct}%</strong>
          </div>
        </div>
      </div>

      {/* Message Statistics Grid */}
      <div className="pb-5 border-b border-[#E8E6E1]">
        <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider mb-3">
          Message Structural Diagnostics
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E8E6E1] text-center">
            <p className="text-[10px] text-[#5F6368] font-bold uppercase">Characters</p>
            <p className="text-base font-bold text-[#202124] font-mono mt-0.5">{result.message_stats.char_length}</p>
          </div>
          <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E8E6E1] text-center">
            <p className="text-[10px] text-[#5F6368] font-bold uppercase">Words</p>
            <p className="text-base font-bold text-[#202124] font-mono mt-0.5">{result.message_stats.word_count}</p>
          </div>
          <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E8E6E1] text-center">
            <p className="text-[10px] text-[#5F6368] font-bold uppercase">Tokens</p>
            <p className="text-base font-bold text-[#202124] font-mono mt-0.5">{result.message_stats.token_count}</p>
          </div>
          <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E8E6E1] text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] text-[#5F6368] font-bold uppercase">
              <Link2 className="w-3 h-3" />
              URLs
            </div>
            <p className={`text-base font-bold font-mono mt-0.5 ${result.message_stats.has_urls ? "text-[#FF6B6B]" : "text-[#5F6368]"}`}>
              {result.message_stats.has_urls ? "Yes" : "None"}
            </p>
          </div>
          <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E8E6E1] text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] text-[#5F6368] font-bold uppercase">
              <DollarSign className="w-3 h-3" />
              Currency
            </div>
            <p className={`text-base font-bold font-mono mt-0.5 ${result.message_stats.has_currency ? "text-[#FF6B6B]" : "text-[#5F6368]"}`}>
              {result.message_stats.has_currency ? "Detected" : "None"}
            </p>
          </div>
          <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E8E6E1] text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] text-[#5F6368] font-bold uppercase">
              <Hash className="w-3 h-3" />
              Num Seq
            </div>
            <p className={`text-base font-bold font-mono mt-0.5 ${result.message_stats.has_numseq ? "text-[#FF6B6B]" : "text-[#5F6368]"}`}>
              {result.message_stats.has_numseq ? "Detected" : "None"}
            </p>
          </div>
        </div>
      </div>

      {/* Interpretable Explanation ("Why was this classified this way?") */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="w-4 h-4 text-[#6D5DFB]" />
          <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider">
            Why was this classified this way?
          </h4>
        </div>

        {/* Narrative explanation */}
        <p className="text-xs sm:text-sm text-[#202124] leading-relaxed bg-[#FAF9F6] p-4 rounded-xl border border-[#E8E6E1] mb-4">
          {result.explanation}
        </p>

        {/* Detected contributing feature chips */}
        {result.top_features && result.top_features.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#5F6368] mb-2">
              Most Influential Vocabulary Features Identified in Message:
            </p>
            <div className="flex flex-wrap gap-2">
              {result.top_features.map((feat, idx) => (
                <div
                  key={idx}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono shadow-2xs ${
                    feat.direction === "spam"
                      ? "bg-[#FFF0F0] text-[#FF6B6B] border-[#FFD4D4]"
                      : "bg-[#EDFBF7] text-[#38C9A7] border-[#BCEFE3]"
                  }`}
                >
                  <span className="font-bold">{feat.term}</span>
                  <span
                    className={`text-[10px] px-1 rounded font-bold ${
                      feat.direction === "spam" ? "bg-[#FFD4D4] text-[#FF6B6B]" : "bg-[#BCEFE3] text-[#38C9A7]"
                    }`}
                  >
                    {feat.direction === "spam" ? `+${feat.weight.toFixed(2)} SPAM` : `${feat.weight.toFixed(2)} HAM`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[11px] text-[#5F6368] mt-4 leading-normal italic">
          * Note: This explanation reflects feature weights and log-odds ratios extracted from the trained TF-IDF model. It provides statistical interpretability rather than absolute deterministic reasoning.
        </p>
      </div>
    </div>
  );
}
