"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Flame,
  AlertTriangle,
  Link2,
  Users,
  DollarSign,
  UserCheck,
  FileCode,
  Info,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Activity,
} from "lucide-react";

interface ThreatNode {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  indicators: string[];
  detectionMethod: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  activeWeight: number; // 0-100 default demonstration weight
}

const THREAT_NODES: ThreatNode[] = [
  {
    id: "spam",
    title: "Spam & Promotions",
    subtitle: "Carriers & Bulk Ads",
    icon: Flame,
    color: "#FF6B6B",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    description: "Evaluates token frequency anomalies, marketing carrier markers, and promotional phrases against the 5,572-message SMS baseline corpus.",
    indicators: ["Free/Prize keywords", "Unsolicited promotional codes", "Call-to-action repetition", "Bulk broadcast syntax"],
    detectionMethod: "TF-IDF 4,000-feature sparse projections + Multinomial Naive Bayes log-odds likelihood",
    severity: "HIGH",
    activeWeight: 84,
  },
  {
    id: "phishing",
    title: "Phishing & Theft",
    subtitle: "Credential Harvesting",
    icon: ShieldAlert,
    color: "#E96A9A",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    description: "Detects fraudulent prompts directing recipients to enter login passwords, two-factor auth OTPs, or confidential account credentials.",
    indicators: ["Account restriction claims", "Verify identity prompts", "Mismatched reply-to domains", "Credential harvest forms"],
    detectionMethod: "Regex heuristic scanners + Scikit-Learn Logistic Regression decision function",
    severity: "CRITICAL",
    activeWeight: 92,
  },
  {
    id: "urgency",
    title: "Urgency Manipulation",
    subtitle: "Coercive Time Pressure",
    icon: AlertTriangle,
    color: "#F5A623",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    description: "Identifies artificial countdowns, panic-inducing ultimatums, and time limits engineered to bypass logical threat scrutiny.",
    indicators: ["'Within 24 hours'", "'Immediate action required'", "'Account suspended TODAY'", "All-caps panic phrases"],
    detectionMethod: "Linguistic temporal extraction + Capitalization density analysis",
    severity: "HIGH",
    activeWeight: 88,
  },
  {
    id: "url",
    title: "URL Intelligence",
    subtitle: "Malicious Hyperlinks",
    icon: Link2,
    color: "#6D5DFB",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    description: "Deconstructs destination hyperlinks across 10 deterministic structural heuristics without relying on fabricated external reputation databases.",
    indicators: ["IP address hosts (e.g. 192.168.x.x)", "Excessive subdomains (>3 levels)", "Lookalike typo domains (.xyz, .top)", "Open redirect query params"],
    detectionMethod: "Deterministic URL structural parser + RFC 3986 lexical audit",
    severity: "CRITICAL",
    activeWeight: 96,
  },
  {
    id: "social",
    title: "Social Engineering",
    subtitle: "Psychological Coercion",
    icon: Users,
    color: "#4F46E5",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    description: "Spots manipulative pretexting, authority intimidation, emotional extortion, and simulated relationship building.",
    indicators: ["Authority impersonation (CEO, IT Dept)", "Fear-uncertainty-doubt triggers", "Secrecy demands", "Sympathy exploitation"],
    detectionMethod: "Semantic sentiment scoring + Lexical role-assumption patterns",
    severity: "HIGH",
    activeWeight: 78,
  },
  {
    id: "financial",
    title: "Financial Fraud",
    subtitle: "Payment & Wire Scams",
    icon: DollarSign,
    color: "#38C9A7",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    description: "Flags fraudulent wire instructions, fake gift card requests, cryptocurrency wallet deposits, and invoice diversion attempts.",
    indicators: ["Crypto wallet strings", "Gift card redemption requests", "Overdue invoice attachments", "Direct wire transfer details"],
    detectionMethod: "Currency regex extraction + Banking terminology entity matching",
    severity: "CRITICAL",
    activeWeight: 90,
  },
  {
    id: "impersonation",
    title: "Brand Mimicry",
    subtitle: "Spoofed Identities",
    icon: UserCheck,
    color: "#0284C7",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    description: "Detects unauthorized spoofing of globally recognized enterprise brands like PayPal, Apple, Microsoft, Amazon, DHL, and Postal Services.",
    indicators: ["Brand name in subdomain", "Homoglyphic character substitution", "Display name vs header disparity", "Counterfeit support signatures"],
    detectionMethod: "Levenshtein distance algorithm + Brand identity heuristic dictionary",
    severity: "HIGH",
    activeWeight: 82,
  },
  {
    id: "payload",
    title: "Payload & Attachments",
    subtitle: "Harmful Artifacts",
    icon: FileCode,
    color: "#8B5CF6",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    description: "Evaluates dangerous file extensions, obfuscated scripts, malicious macros, and optical QR-embedded redirection payloads.",
    indicators: ["Executable extensions (.exe, .scr, .vbs)", "Double extension evasion (.pdf.exe)", "Suspicious optical QR links", "Password-protected archives"],
    detectionMethod: "MIME type verification + Optical QR OpenCV decoder + Extension risk index",
    severity: "CRITICAL",
    activeWeight: 85,
  },
];

export default function ThreatSignalMap() {
  const [selectedNode, setSelectedNode] = useState<ThreatNode>(THREAT_NODES[0]);

  return (
    <section id="threat-map" className="py-14 md:py-20 bg-[#FAF9F6] border-b border-[#E8E6E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E8E6E1] text-xs font-semibold text-[#6D5DFB] shadow-2xs mb-3">
            <Activity className="w-3.5 h-3.5 text-[#6D5DFB]" />
            <span>Interactive Threat Vector Topology</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#202124] tracking-tight">
            Comprehensive Threat Signal Map
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#5F6368] leading-relaxed">
            SpamGuard unifies 8 distinct threat dimensions into a single centralized risk calculus. Select any peripheral node to inspect its detection heuristics.
          </p>
        </div>

        {/* Central Visualization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* LEFT: Interactive Radial / Grid Signal Hub (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E8E6E1] p-6 sm:p-8 shadow-xs relative overflow-hidden">
            {/* Background subtle radial rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <div className="w-[480px] h-[480px] rounded-full border border-dashed border-[#E8E6E1]" />
              <div className="absolute w-[320px] h-[320px] rounded-full border border-[#E8E6E1]" />
              <div className="absolute w-[180px] h-[180px] rounded-full border border-[#D5D2CB]" />
            </div>

            {/* Central Node: Overall Risk */}
            <div className="flex flex-col items-center justify-center mb-8 relative z-10">
              <div className="p-1 rounded-2xl bg-gradient-to-br from-[#6D5DFB] via-[#4F46E5] to-[#FF6B6B] shadow-md shadow-[#6D5DFB]/20">
                <div className="px-6 py-4 rounded-xl bg-white text-center flex flex-col items-center">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#6D5DFB]">
                    <Sparkles className="w-4 h-4 text-[#6D5DFB] animate-spin-slow" />
                    <span>Central Risk Engine</span>
                  </div>
                  <div className="text-3xl font-black text-[#202124] mt-1 font-mono tracking-tight">
                    0 — 100
                  </div>
                  <span className="text-[11px] text-[#5F6368] font-medium mt-0.5">
                    Unified Threat Calculus
                  </span>
                </div>
              </div>
            </div>

            {/* 8 Peripheral Threat Signal Nodes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
              {THREAT_NODES.map((node) => {
                const Icon = node.icon;
                const isSelected = selectedNode.id === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-white shadow-md -translate-y-1 scale-102 border-[#6D5DFB] ring-2 ring-[#6D5DFB]/20"
                        : "bg-[#FAF9F6] hover:bg-white border-[#E8E6E1] hover:border-[#D5D2CB] shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-xl ${node.bgColor} flex items-center justify-center border ${node.borderColor}`}>
                        <Icon className="w-4 h-4" style={{ color: node.color }} />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-[#E8E6E1] text-[#202124]">
                        {node.activeWeight}%
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#202124] leading-tight">{node.title}</h4>
                      <p className="text-[10px] text-[#5F6368] mt-0.5 truncate">{node.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explanatory footer strip */}
            <div className="mt-6 pt-4 border-t border-[#E8E6E1] flex items-center justify-between text-xs text-[#5F6368]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#38C9A7] animate-pulse" />
                <span>All 8 threat detectors active in inference pipeline</span>
              </span>
              <span className="font-mono text-[11px] hidden sm:inline">
                Click any card to inspect
              </span>
            </div>
          </div>

          {/* RIGHT: Detailed Deep-Dive Dossier for Selected Node (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E8E6E1] p-6 sm:p-7 shadow-xs space-y-5">
            {/* Header info */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl ${selectedNode.bgColor} flex items-center justify-center border ${selectedNode.borderColor} shadow-xs`}>
                  {React.createElement(selectedNode.icon, {
                    className: "w-6 h-6",
                    style: { color: selectedNode.color },
                  })}
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#5F6368]">
                    Threat Dimension
                  </span>
                  <h3 className="text-lg font-black text-[#202124] leading-tight">
                    {selectedNode.title}
                  </h3>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border ${
                selectedNode.severity === "CRITICAL"
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : selectedNode.severity === "HIGH"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}>
                {selectedNode.severity} RISK
              </span>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#5F6368] leading-relaxed">
              {selectedNode.description}
            </p>

            {/* Primary Indicators List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#38C9A7]" />
                <span>Observed Threat Signals</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-[#202124]">
                {selectedNode.indicators.map((ind, i) => (
                  <li key={i} className="flex items-center gap-2 p-2 rounded-xl bg-[#FAF9F6] border border-[#E8E6E1]">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: selectedNode.color }} />
                    <span className="font-medium">{ind}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Detection Mechanism */}
            <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
                <Info className="w-3.5 h-3.5 text-[#6D5DFB]" />
                <span>Detection Methodology</span>
              </div>
              <p className="text-xs text-[#202124] font-mono leading-relaxed">
                {selectedNode.detectionMethod}
              </p>
            </div>

            {/* Action Callout */}
            <button
              onClick={() => {
                const ws = document.getElementById("workspace");
                if (ws) ws.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#FAF9F6] hover:bg-[#F2F0FF] border border-[#E8E6E1] hover:border-[#6D5DFB] text-xs font-bold text-[#202124] hover:text-[#6D5DFB] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Test this threat pattern in Scanner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
