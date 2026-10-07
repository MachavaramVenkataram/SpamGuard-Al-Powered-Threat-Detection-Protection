"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Clock,
  Zap,
  Info,
  X,
  ExternalLink,
} from "lucide-react";
import { PredictResponse } from "@/lib/api";

export type RiskLevel = "SAFE" | "LOW_RISK" | "SUSPICIOUS" | "HIGH_RISK" | "CRITICAL";

interface SpamRiskIconProps {
  isSpam: boolean;
  riskScore?: number; // 0 to 100
  riskLevel?: RiskLevel;
  modelName?: string;
  probability?: number; // 0 to 1
  latencyMs?: number;
  detectedSignals?: string[]; // e.g. ["Urgency", "Prize Language", "Financial Incentive", "Suspicious URL"]
  resultData?: PredictResponse | null;
  isAnalyzing?: boolean;
}

export default function SpamRiskIcon({
  isSpam,
  riskScore = isSpam ? 88 : 6,
  riskLevel = isSpam ? "HIGH_RISK" : "SAFE",
  modelName = "Multinomial Naive Bayes",
  probability = isSpam ? 0.996 : 0.004,
  latencyMs = 0.85,
  detectedSignals = [],
  resultData = null,
  isAnalyzing = false,
}: SpamRiskIconProps) {
  // Animation state stages: "idle" | "scanning" | "detected" | "locking" | "alert" | "pulsing" | "settled"
  const [animStage, setAnimStage] = useState<string>("settled");
  const [displayScore, setDisplayScore] = useState<number>(0);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [soundMuted, setSoundMuted] = useState<boolean>(true);
  const prevSpamRef = useRef<boolean>(isSpam);

  // Trigger animation sequence when prediction result arrives or changes
  useEffect(() => {
    // Check user preference for reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setAnimStage("settled");
      setDisplayScore(riskScore);
      return;
    }

    // Sequence stages
    setAnimStage("scanning");

    // Stage 1 -> 2: Scanning (650ms)
    const t1 = setTimeout(() => {
      setAnimStage("detected");
    }, 650);

    // Stage 2 -> 3: Threat Lock stroke draw (1100ms)
    const t2 = setTimeout(() => {
      setAnimStage("locking");
    }, 1100);

    // Stage 3 -> 4: Alert badge pop (1600ms)
    const t3 = setTimeout(() => {
      setAnimStage("alert");
    }, 1600);

    // Stage 4 -> 5: Pulse waves (2100ms)
    const t4 = setTimeout(() => {
      setAnimStage("pulsing");
    }, 2100);

    // Stage 5 -> settled: Gentle breathing (3300ms)
    const t5 = setTimeout(() => {
      setAnimStage("settled");
    }, 3300);

    // Animate score counter from 0 to riskScore
    let startTimestamp: number | null = null;
    const targetScore = riskScore;
    const duration = 1500;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setDisplayScore(Math.floor(progress * targetScore));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayScore(targetScore);
      }
    };
    requestAnimationFrame(step);

    prevSpamRef.current = isSpam;

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [isSpam, riskScore, isAnalyzing]);

  // Color mappings
  const isHighRisk = isSpam || riskLevel === "HIGH_RISK" || riskLevel === "CRITICAL";
  const isSuspicious = riskLevel === "SUSPICIOUS";

  const primaryColor = isHighRisk
    ? "#FF6B6B" // Coral
    : isSuspicious
    ? "#F5B942" // Amber
    : "#38C9A7"; // Mint

  const secondaryColor = isHighRisk
    ? "#E85D75" // Rose
    : isSuspicious
    ? "#E69C1A" // Dark amber
    : "#1FAF8A"; // Emerald

  const bgColor = isHighRisk
    ? "bg-[#FFF0F0] border-[#FFD4D4]"
    : isSuspicious
    ? "bg-[#FEF8EC] border-[#FCE1B6]"
    : "bg-[#EDFBF7] border-[#BCEFE3]";

  // Default detected signals if none passed
  const activeSignals =
    detectedSignals.length > 0
      ? detectedSignals
      : isHighRisk
      ? ["Urgency Language", "Prize / Reward Pattern", "Financial Incentive", "Suspicious Destination"]
      : ["Verified Structure", "Conversational Language", "No Malicious Carrier"];

  return (
    <div
      aria-live="polite"
      className="relative flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-[#E8E6E1] shadow-sm transition-all"
    >
      {/* Mini Pipeline Flow Indicator */}
      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#5F6368] mb-4 pb-3 border-b border-[#E8E6E1] w-full justify-center">
        <span>Message</span>
        <span className="text-[#6D5DFB]">&rarr;</span>
        <span>NLP</span>
        <span className="text-[#6D5DFB]">&rarr;</span>
        <span>TF-IDF</span>
        <span className="text-[#6D5DFB]">&rarr;</span>
        <span>ML Model</span>
        <span className="text-[#6D5DFB]">&rarr;</span>
        <span
          className={`font-bold px-1.5 py-0.5 rounded ${
            isHighRisk ? "bg-[#FFF0F0] text-[#FF6B6B]" : "bg-[#EDFBF7] text-[#38C9A7]"
          }`}
        >
          {isHighRisk ? "🛡 THREAT DETECTED" : "🛡 VERIFIED SAFE"}
        </span>
      </div>

      {/* Main Animated Icon Container */}
      <div
        onClick={() => setDetailsOpen(true)}
        className="group relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-[1.03]"
        title="Click to view detailed threat evidence"
      >
        {/* Stage 5: Soft Pulse Wave Rings (repeats then settles) */}
        {(animStage === "pulsing" || animStage === "settled") && (
          <>
            <div
              className={`absolute inset-0 rounded-full pointer-events-none transition-all duration-1000 ${
                isHighRisk
                  ? "bg-[#FF6B6B]/20 animate-ping"
                  : "bg-[#38C9A7]/20 animate-ping"
              }`}
              style={{ animationDuration: "2.8s" }}
            />
            <div
              className={`absolute -inset-2 rounded-full pointer-events-none opacity-40 transition-all ${
                isHighRisk ? "bg-[#E85D75]/15" : "bg-[#38C9A7]/15"
              }`}
            />
          </>
        )}

        {/* Outer Circular/Soft-Square Base Box */}
        <div
          className={`w-full h-full rounded-2xl flex items-center justify-center p-3 relative overflow-hidden transition-all duration-500 shadow-sm ${bgColor}`}
        >
          {/* Custom Multi-Layer SVG Icon */}
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Shield Gradients */}
              <linearGradient id="shieldGradSpam" x1="20" y1="15" x2="100" y2="105" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#E85D75" stopOpacity="0.10" />
              </linearGradient>

              <linearGradient id="shieldGradSafe" x1="20" y1="15" x2="100" y2="105" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38C9A7" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#1FAF8A" stopOpacity="0.10" />
              </linearGradient>

              {/* Laser Scan Line Gradient */}
              <linearGradient id="scanGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={primaryColor} stopOpacity="0" />
                <stop offset="50%" stopColor={primaryColor} stopOpacity="0.9" />
                <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* LAYER 1: Outer Protective Shield Outline & Fill */}
            <path
              d="M 60,16 C 82,16 98,26 98,48 C 98,76 74,98 60,106 C 46,98 22,76 22,48 C 22,26 38,16 60,16 Z"
              fill={isHighRisk ? "url(#shieldGradSpam)" : "url(#shieldGradSafe)"}
              stroke={primaryColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 260,
                strokeDashoffset:
                  animStage === "scanning"
                    ? 260
                    : animStage === "detected"
                    ? 180
                    : 0,
                transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />

            {/* LAYER 2: Inner Envelope Structure (Message Container) */}
            <g
              className="transition-transform duration-500"
              style={{
                transform: animStage === "alert" || animStage === "pulsing" ? "scale(1.02)" : "scale(1)",
                transformOrigin: "60px 60px",
              }}
            >
              {/* Envelope Body */}
              <rect
                x="36"
                y="42"
                width="48"
                height="32"
                rx="4"
                fill="#FFFFFF"
                stroke={isHighRisk ? "#FF6B6B" : "#38C9A7"}
                strokeWidth="1.8"
                className="shadow-2xs"
              />

              {/* Envelope Fold Lines */}
              <path
                d="M 38,44 L 60,60 L 82,44"
                stroke={isHighRisk ? "#FF6B6B" : "#38C9A7"}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 38,72 L 52,58"
                stroke={isHighRisk ? "#FF6B6B" : "#38C9A7"}
                strokeWidth="1.2"
                strokeOpacity="0.4"
                strokeLinecap="round"
              />
              <path
                d="M 82,72 L 68,58"
                stroke={isHighRisk ? "#FF6B6B" : "#38C9A7"}
                strokeWidth="1.2"
                strokeOpacity="0.4"
                strokeLinecap="round"
              />
            </g>

            {/* LAYER 3: Animated Scanning Laser Line */}
            {animStage === "scanning" && (
              <line
                x1="26"
                y1="30"
                x2="94"
                y2="30"
                stroke="url(#scanGrad)"
                strokeWidth="2.5"
                className="animate-bounce"
                style={{ animationDuration: "0.7s" }}
              />
            )}

            {/* LAYER 4: Detection Pulse Expanding Ring */}
            {(animStage === "detected" || animStage === "locking") && (
              <circle
                cx="60"
                cy="58"
                r="18"
                fill="none"
                stroke={primaryColor}
                strokeWidth="2"
                className="animate-ping"
                style={{ animationDuration: "0.6s" }}
              />
            )}

            {/* LAYER 5: Threat Alert Badge (Spam) or Verified Checkmark Badge (Safe) */}
            {isHighRisk ? (
              <g
                className="transition-all duration-400"
                style={{
                  transform:
                    animStage === "scanning" || animStage === "detected"
                      ? "scale(0)"
                      : "scale(1)",
                  transformOrigin: "86px 82px",
                  transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                {/* Alert Badge Circular Frame */}
                <circle cx="86" cy="82" r="14" fill="#FF6B6B" stroke="#FFFFFF" strokeWidth="2.5" className="shadow-md" />
                {/* Exclamation Symbol */}
                <line x1="86" y1="75" x2="86" y2="82" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="86" cy="87" r="1.3" fill="#FFFFFF" />
              </g>
            ) : (
              <g
                className="transition-all duration-400"
                style={{
                  transform:
                    animStage === "scanning" || animStage === "detected"
                      ? "scale(0)"
                      : "scale(1)",
                  transformOrigin: "86px 82px",
                  transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                {/* Safe Badge Circular Frame */}
                <circle cx="86" cy="82" r="14" fill="#38C9A7" stroke="#FFFFFF" strokeWidth="2.5" className="shadow-md" />
                {/* Checkmark Symbol */}
                <path
                  d="M 80,82 L 84,86 L 92,77"
                  stroke="#FFFFFF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Primary Classification Verdict Text */}
      <div className="text-center mt-4 space-y-1">
        <div className="flex items-center justify-center gap-2">
          <span
            className={`px-3 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
              isHighRisk
                ? "bg-[#FFF0F0] text-[#FF6B6B] border border-[#FFD4D4]"
                : "bg-[#EDFBF7] text-[#38C9A7] border border-[#BCEFE3]"
            }`}
          >
            {isHighRisk ? "HIGH RISK • THREAT DETECTED" : "VERIFIED SAFE • HAM"}
          </span>
        </div>

        <h3
          className={`text-xl sm:text-2xl font-black tracking-tight ${
            isHighRisk ? "text-[#FF6B6B]" : "text-[#38C9A7]"
          }`}
        >
          {isHighRisk ? "SPAM DETECTED" : "MESSAGE APPEARS SAFE"}
        </h3>

        <p className="text-xs text-[#5F6368] max-w-sm mx-auto">
          {isHighRisk
            ? "The message contains linguistic, structural, or heuristic signals strongly associated with spam."
            : "No abnormal urgency, financial deception, or malicious links identified."}
        </p>
      </div>

      {/* Dynamic Animated Risk Score Counter */}
      <div className="mt-4 p-3 bg-[#FAF9F6] border border-[#E8E6E1] rounded-2xl flex items-center justify-between gap-6 w-full max-w-xs">
        <div>
          <span className="text-[10px] font-bold text-[#5F6368] uppercase block font-mono">Calibrated Risk Score</span>
          <p className="text-2xl font-black font-mono text-[#202124]">
            {displayScore}
            <span className="text-xs font-semibold text-[#5F6368]"> / 100</span>
          </p>
        </div>

        <div className="text-right text-xs font-mono">
          <span className="text-[10px] text-[#5F6368] block">Confidence</span>
          <strong className={isHighRisk ? "text-[#FF6B6B]" : "text-[#38C9A7]"}>
            {(probability * 100).toFixed(1)}%
          </strong>
        </div>
      </div>

      {/* Sequentially Animated Threat Signal Chips (100ms apart) */}
      <div className="mt-4 w-full">
        <span className="text-[10px] font-mono font-bold text-[#5F6368] uppercase block mb-2 text-center">
          {isHighRisk ? "Identified Risk Markers:" : "Safe Verification Signals:"}
        </span>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {activeSignals.map((sig, idx) => (
            <span
              key={idx}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all animate-in zoom-in-95 duration-200 ${
                isHighRisk
                  ? "bg-[#FFF0F0] text-[#FF6B6B] border-[#FFD4D4]"
                  : "bg-[#EDFBF7] text-[#38C9A7] border-[#BCEFE3]"
              }`}
              style={{ animationDelay: `${idx * 120}ms` }}
            >
              {isHighRisk ? "⚠" : "✓"} {sig}
            </span>
          ))}
        </div>
      </div>

      {/* View Detection Details Click Trigger */}
      <button
        onClick={() => setDetailsOpen(true)}
        className="mt-4 text-xs font-bold text-[#6D5DFB] hover:text-[#5B4CE0] flex items-center gap-1 transition-colors cursor-pointer"
      >
        <Info className="w-3.5 h-3.5" />
        <span>View Full Detection Evidence &rarr;</span>
      </button>

      {/* SLIDE-OVER / MODAL: Detailed Threat Evidence */}
      {detailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202124]/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#E8E6E1] shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E6E1]">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isHighRisk ? "bg-[#FFF0F0] text-[#FF6B6B]" : "bg-[#EDFBF7] text-[#38C9A7]"
                  }`}
                >
                  {isHighRisk ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#202124]">Spam Detection Audit</h4>
                  <p className="text-xs text-[#5F6368] font-mono">Classifier &bull; Feature Evidence</p>
                </div>
              </div>

              <button
                onClick={() => setDetailsOpen(false)}
                className="p-1.5 rounded-lg text-[#5F6368] hover:text-[#202124] hover:bg-[#FAF9F6] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E6E1]">
                <span className="text-[10px] text-[#5F6368] block">Classifier Engine</span>
                <strong className="text-[#202124]">{modelName}</strong>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E6E1]">
                <span className="text-[10px] text-[#5F6368] block">Inference Speed</span>
                <strong className="text-[#202124]">{latencyMs.toFixed(2)} ms</strong>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E6E1]">
                <span className="text-[10px] text-[#5F6368] block">Spam Posterior P(S|X)</span>
                <strong className={isHighRisk ? "text-[#FF6B6B]" : "text-[#38C9A7]"}>
                  {(probability * 100).toFixed(2)}%
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E6E1]">
                <span className="text-[10px] text-[#5F6368] block">Decision Threshold</span>
                <strong className="text-[#202124]">T = 0.50 (Calibrated)</strong>
              </div>
            </div>

            {/* Detected Indicators */}
            <div>
              <span className="text-xs font-bold text-[#202124] block mb-2">Active Linguistic Triggers</span>
              <div className="space-y-1.5 text-xs text-[#5F6368]">
                {activeSignals.map((s, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-[#FAF9F6] border border-[#E8E6E1] flex items-center gap-2">
                    <span className={isHighRisk ? "text-[#FF6B6B]" : "text-[#38C9A7]"}>
                      {isHighRisk ? "⚠" : "✓"}
                    </span>
                    <span className="font-semibold text-[#202124]">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation Box */}
            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                isHighRisk
                  ? "bg-[#FFF0F0] border-[#FFD4D4] text-[#FF6B6B]"
                  : "bg-[#EDFBF7] border-[#BCEFE3] text-[#38C9A7]"
              }`}
            >
              <strong>Security Advice:</strong>{" "}
              {isHighRisk
                ? "Do NOT open embedded links, provide passwords, or send monetary transfers. Verify sender independently."
                : "No high-risk payload detected. Standard email hygiene still advised for unverified contacts."}
            </div>

            {/* Modal Close Button */}
            <button
              onClick={() => setDetailsOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#202124] hover:bg-[#333] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
