"use client";

import React from "react";
import { ShieldCheck, ArrowUp, Lock, ExternalLink, Mail, CheckCircle2 } from "lucide-react";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const techBadges = [
    "Next.js 15",
    "TypeScript",
    "FastAPI",
    "Python 3.13",
    "Scikit-learn",
    "Tesseract.js Wasm",
    "OpenCV",
    "Tailwind CSS",
  ];

  return (
    <footer className="bg-white border-t border-[#E8E6E1] pt-14 pb-10 text-[#5F6368] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-10 pb-10 border-b border-[#E8E6E1]">
          {/* Brand & Mission */}
          <div className="max-w-sm space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#6D5DFB] text-white flex items-center justify-center font-bold shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-[#202124] text-base tracking-tight">SpamGuard</span>
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-[#F2F0FF] text-[#6D5DFB] border border-[#DCD8FF] rounded">
                Multimodal AI
              </span>
            </div>
            <p className="text-xs text-[#5F6368] leading-relaxed">
              Intelligent Message &amp; Content Security platform. Combining supervised NLP machine learning (MultinomialNB &amp; LogisticRegression) with heuristic URL analysis and in-browser neural OCR.
            </p>

            {/* Technology Badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {techBadges.map((badge, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#FAF9F6] text-[#202124] border border-[#E8E6E1]"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs text-[#5F6368]">
            <div>
              <p className="font-bold text-[#202124] uppercase tracking-wider text-[11px] mb-3">Intelligence</p>
              <ul className="space-y-2">
                <li><a href="#overview" className="hover:text-[#6D5DFB] transition-colors">Security Overview</a></li>
                <li><a href="#workspace" className="hover:text-[#6D5DFB] transition-colors">Multimodal Workspace</a></li>
                <li><a href="#dataset" className="hover:text-[#6D5DFB] transition-colors">Dataset Explorer (5.5k)</a></li>
                <li><a href="#analytics" className="hover:text-[#6D5DFB] transition-colors">Corpus Linguistics</a></li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-[#202124] uppercase tracking-wider text-[11px] mb-3">Model Suite</p>
              <ul className="space-y-2">
                <li><a href="#models" className="hover:text-[#6D5DFB] transition-colors">Model Benchmarks</a></li>
                <li><a href="#evaluation" className="hover:text-[#6D5DFB] transition-colors">Confusion Matrix</a></li>
                <li><a href="#evaluation" className="hover:text-[#6D5DFB] transition-colors">Threshold Explorer</a></li>
                <li><a href="#pipeline" className="hover:text-[#6D5DFB] transition-colors">NLP 8-Stage Pipeline</a></li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-[#202124] uppercase tracking-wider text-[11px] mb-3">Governance</p>
              <ul className="space-y-2">
                <li><a href="#privacy" className="hover:text-[#6D5DFB] transition-colors font-medium">Privacy Center</a></li>
                <li><a href="#architecture" className="hover:text-[#6D5DFB] transition-colors">System Architecture</a></li>
                <li><a href="#diagnostics" className="hover:text-[#6D5DFB] transition-colors">API Diagnostics</a></li>
                <li>
                  <a
                    href="https://archive.ics.uci.edu/dataset/228/sms+spam+collection"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-[#6D5DFB] transition-colors"
                  >
                    <span>UCI Machine Learning</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Privacy Notice & Back to Top */}
          <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E6E1] text-[#202124] hover:bg-[#FAF9F6] transition-colors font-semibold shadow-2xs cursor-pointer"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5 text-[#6D5DFB]" />
            </button>
            <div className="flex items-center gap-1.5 text-[11px] text-[#5F6368]">
              <Lock className="w-3.5 h-3.5 text-[#38C9A7]" />
              <span>Zero data retained on disk</span>
            </div>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#5F6368]">
          <p>&copy; {new Date().getFullYear()} SpamGuard &bull; Intelligent Message &amp; Content Security.</p>
          <div className="flex items-center gap-4">
            <a href="#privacy" className="hover:text-[#202124] transition-colors">Privacy Policy</a>
            <span>&bull;</span>
            <a href="#architecture" className="hover:text-[#202124] transition-colors">Architecture Specifications</a>
            <span>&bull;</span>
            <a href="#diagnostics" className="hover:text-[#202124] transition-colors">System Status</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
