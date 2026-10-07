"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Image as ImageIcon,
  Link2,
  FileText,
  Mail,
  QrCode,
  FileUp,
  Workflow,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
} from "lucide-react";
import UniversalScannerIcon from "./UniversalScannerIcon";

export default function Hero() {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [heroActiveTab, setHeroActiveTab] = useState<"text" | "email" | "url" | "image" | "qr" | "file">("text");

  const handleCtaClick = (mode: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("switch-workspace-mode", { detail: mode }));
      const el = document.getElementById("workspace");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleHeroSampleScan = (sampleText: string, mode: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("switch-workspace-mode", { detail: mode }));
      window.dispatchEvent(new CustomEvent("load-workspace-text", { detail: sampleText }));
      const el = document.getElementById("workspace");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const pipelineNodes = [
    {
      id: "input",
      title: "Content Input",
      sub: "Text • URL • Image • QR",
      tooltip: "Universal ingress capturing plain text, MIME emails, raw URLs, image screenshots, and optical QR barcodes.",
      icon: Layers,
      accent: "text-violet-600 bg-violet-50/80 border-violet-200",
    },
    {
      id: "extract",
      title: "Signal Extraction",
      sub: "Wasm OCR • Heuristics",
      tooltip: "Client-side Tesseract.js neural OCR text extraction + 10 deterministic URL security heuristics + OpenCV QR decoding.",
      icon: Sparkles,
      accent: "text-amber-600 bg-amber-50/80 border-amber-200",
    },
    {
      id: "nlp",
      title: "NLP Processing",
      sub: "Regex & Stopwords",
      tooltip: "Lowercasing, spam carrier token normalization (currency, URLs, phone numbers), punctuation stripping, and tokenization.",
      icon: FileText,
      accent: "text-slate-700 bg-slate-100 border-slate-300",
    },
    {
      id: "ml",
      title: "AI Inference",
      sub: "Naive Bayes & LogReg",
      tooltip: "4,000-dimensional TF-IDF feature projections evaluated through Scikit-Learn MultinomialNB and Logistic Regression.",
      icon: Cpu,
      accent: "text-indigo-600 bg-indigo-50/80 border-indigo-200",
    },
    {
      id: "verdict",
      title: "Risk & Explainability",
      sub: "Score & Dossier",
      tooltip: "Multimodal weighted risk score (0-100), 8-factor breakdown, in-situ highlighting, and Copilot guidance.",
      icon: ShieldCheck,
      accent: "text-emerald-700 bg-emerald-50/80 border-emerald-200",
    },
  ];

  return (
    <section id="overview" className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden bg-mesh-subtle border-b border-[#E8E6E1]">
      {/* Subtle radial accents: Violet & Mint & Coral */}
      <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-violet-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-emerald-200/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/2 w-[450px] h-[450px] bg-rose-200/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          {/* Technical Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E8E6E1] text-xs font-semibold text-[#202124] mb-6 shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-[#6D5DFB] animate-pulse" />
            <span className="tracking-wide uppercase font-bold text-[11px] text-[#5F6368]">
              SPAMGUARD &bull; AI-Powered Threat Detection & Protection
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#F2F0FF] text-[#6D5DFB] font-mono font-semibold">
              v2.5 SaaS
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#202124] tracking-tight leading-[1.12]">
            Is this safe?
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-lg sm:text-xl font-medium text-[#202124]/90 max-w-2xl mx-auto">
            Analyze messages, links, emails, screenshots and files before you interact with them.
          </p>

          {/* Supporting Text */}
          <p className="mt-3 text-xs sm:text-sm text-[#5F6368] leading-relaxed max-w-2xl mx-auto font-normal">
            Analyze suspicious messages, emails, links, images, QR codes and files with AI-powered threat analysis. Powered by supervised ML, Gemini intelligence, VirusTotal reputation, and deterministic local security rules.
          </p>

          {/* Dominant Action CTAs */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            {/* Premium Capsule CTA Button: [ ✦ Scan Anything → ] */}
            <div className="relative group inline-block">
              {/* Subtle Ambient Multi-Color Glow */}
              <div
                aria-hidden="true"
                className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#6D5DFB]/30 via-[#8B7FFD]/25 to-[#06B6D4]/30 blur-md opacity-60 group-hover:opacity-100 group-hover:blur-lg transition-all duration-300 pointer-events-none"
              />

              <button
                onClick={() => {
                  const el = document.getElementById("workspace");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="relative px-6 py-3.5 rounded-full font-bold text-sm text-white bg-gradient-to-r from-[#6D5DFB] via-[#7867FB] to-[#5B4CE0] hover:from-[#6251FA] hover:to-[#5040D6] border border-white/25 shadow-[0_4px_16px_rgba(109,93,251,0.28)] hover:shadow-[0_8px_24px_rgba(109,93,251,0.38)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 flex items-center gap-2.5 cursor-pointer select-none"
              >
                {/* ✦ Spark + Shield + Scan Icon */}
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/15 border border-white/30 text-white shadow-2xs group-hover:rotate-12 transition-transform duration-300">
                  <UniversalScannerIcon size={13} state="idle" />
                </span>

                <span className="tracking-tight font-semibold text-white drop-shadow-xs">
                  Scan Anything
                </span>

                {/* Arrow with translate-x animation */}
                <ArrowRight className="w-4 h-4 text-white/90 group-hover:translate-x-1.5 transition-transform duration-200" />
              </button>
            </div>

            {/* Secondary Soft Button: Try Demo */}
            <button
              onClick={() => {
                const el = document.getElementById("demo");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-5 py-3.5 bg-white hover:bg-[#FAF9F6] text-[#202124] border border-[#E8E6E1] hover:border-[#D5D2CB] rounded-full text-sm font-bold shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-[#6D5DFB] fill-current" />
              <span>Try Demo</span>
            </button>
          </div>

          {/* Interactive Hero Quick Ingress Card */}
          <div className="mt-8 bg-white/90 backdrop-blur-md rounded-3xl border border-[#E8E6E1] p-4 sm:p-6 shadow-md max-w-2xl mx-auto text-left space-y-4">
            {/* Quick Hero Tabs */}
            <div className="flex items-center justify-between border-b border-[#E8E6E1] pb-3 overflow-x-auto gap-2">
              {[
                { id: "text" as const, label: "TEXT", icon: FileText },
                { id: "email" as const, label: "EMAIL", icon: Mail },
                { id: "url" as const, label: "URL", icon: Link2 },
                { id: "image" as const, label: "IMAGE", icon: ImageIcon },
                { id: "qr" as const, label: "QR", icon: QrCode },
                { id: "file" as const, label: "FILE", icon: FileUp },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = heroActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setHeroActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#202124] text-white shadow-2xs"
                        : "text-[#5F6368] hover:text-[#202124] hover:bg-[#FAF9F6]"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Interactive Input Sample Area */}
            <div className="space-y-3">
              {heroActiveTab === "text" && (
                <div className="space-y-2">
                  <p className="text-xs text-[#5F6368]">
                    Sample text payload ready for immediate inference:
                  </p>
                  <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E8E6E1] font-mono text-xs text-[#202124]">
                    &quot;URGENT! You have won a £1,000 cash prize or a £2,000 reward! Call 09061701461 to claim your code 8492. Valid 12hrs only!&quot;
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-rose-600 font-bold">&bull; Urgency + Prize features</span>
                    <button
                      onClick={() => handleHeroSampleScan("URGENT! You have won a £1,000 cash prize or a £2,000 reward! Call 09061701461 to claim your code 8492. Valid 12hrs only!", "text")}
                      className="px-4 py-2 bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Scan in Workspace</span>
                    </button>
                  </div>
                </div>
              )}

              {heroActiveTab === "email" && (
                <div className="space-y-2">
                  <p className="text-xs text-[#5F6368]">
                    Phishing lure email header &amp; body sample:
                  </p>
                  <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E8E6E1] font-mono text-xs text-[#202124] space-y-1">
                    <div><strong>From:</strong> security-update@paypal-verify.com</div>
                    <div><strong>Subject:</strong> URGENT: Your PayPal account has been restricted!</div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-amber-600 font-bold">&bull; Spoofed domain + credential link</span>
                    <button
                      onClick={() => handleCtaClick("email")}
                      className="px-4 py-2 bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Open Email Forensics</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {heroActiveTab === "url" && (
                <div className="space-y-2">
                  <p className="text-xs text-[#5F6368]">
                    Typosquatting deceptive URL destination:
                  </p>
                  <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E8E6E1] font-mono text-xs text-[#202124] break-all">
                    http://secure-login.apple.com.verify-account.xyz/auth?redirect=evil.com
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-rose-600 font-bold">&bull; Subdomain masquerade (.xyz)</span>
                    <button
                      onClick={() => handleCtaClick("url")}
                      className="px-4 py-2 bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Inspect Target Link</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {(heroActiveTab === "image" || heroActiveTab === "qr" || heroActiveTab === "file") && (
                <div className="space-y-2">
                  <p className="text-xs text-[#5F6368]">
                    Drag &amp; drop any image, screenshot, QR code or document to analyze:
                  </p>
                  <div
                    onClick={() => handleCtaClick(heroActiveTab)}
                    className="p-6 bg-[#FAF9F6] hover:bg-[#F2F0FF]/40 rounded-xl border-2 border-dashed border-[#D5D2CB] hover:border-[#6D5DFB] text-center cursor-pointer transition-all space-y-1"
                  >
                    <Sparkles className="w-6 h-6 text-[#6D5DFB] mx-auto mb-1" />
                    <span className="text-xs font-bold text-[#202124] block">
                      Click to launch {heroActiveTab.toUpperCase()} Scanner
                    </span>
                    <span className="text-[11px] text-[#5F6368]">
                      Wasm OCR &amp; OpenCV QR decoding ready
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Multimodal Flow Visualization Node Stream */}
        <div className="mt-14 pt-8 border-t border-[#E8E6E1] max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#202124] uppercase tracking-wider">
              <Workflow className="w-3.5 h-3.5 text-[#6D5DFB]" />
              <span>Multimodal Architecture &bull; Hover node to view pipeline logic</span>
            </div>
            <span className="text-[11px] font-mono text-[#5F6368] hidden sm:inline">
              End-to-End Latency: &lt;15ms
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
            {pipelineNodes.map((node, i) => {
              const Icon = node.icon;
              const isHovered = activeTooltip === node.id;
              return (
                <div
                  key={node.id}
                  onMouseEnter={() => setActiveTooltip(node.id)}
                  onMouseLeave={() => setActiveTooltip(null)}
                  className={`relative p-4 rounded-xl border transition-all cursor-pointer bg-white ${node.accent} ${
                    isHovered ? "shadow-md scale-102 z-20 border-[#6D5DFB]" : "shadow-2xs opacity-95 hover:opacity-100 border-[#E8E6E1]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-[#5F6368]">0{i + 1}</span>
                    <Icon className="w-4 h-4 opacity-90" />
                  </div>
                  <h4 className="text-xs font-bold leading-tight text-[#202124]">{node.title}</h4>
                  <p className="text-[11px] text-[#5F6368] mt-0.5 font-mono">{node.sub}</p>

                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 rounded-xl bg-[#202124] text-white text-[11px] leading-relaxed shadow-xl border border-slate-700 z-30 pointer-events-none animate-in fade-in duration-150">
                      <p className="font-bold text-[#B8A7FF] mb-1">{node.title}</p>
                      <p className="text-slate-300 font-normal leading-normal">{node.tooltip}</p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#202124]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
