"use client";

import React, { useState } from "react";
import {
  Shield,
  Lock,
  EyeOff,
  Server,
  Cpu,
  FileCheck2,
  HardDriveDownload,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

export default function PrivacyCenter() {
  const [activeTab, setActiveTab] = useState<"architecture" | "data-lifecycle" | "guarantees">("architecture");

  return (
    <section id="privacy" className="py-16 md:py-20 bg-white border-b border-[#E8E6E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF9F6] border border-[#E8E6E1] text-xs font-semibold text-[#202124] mb-3">
              <Shield className="w-3.5 h-3.5 text-[#38C9A7]" />
              <span className="tracking-wide uppercase font-bold text-[10px] text-[#5F6368]">
                Transparency &amp; Governance
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#202124] tracking-tight">
              Privacy &amp; Data Security Architecture
            </h2>
            <p className="mt-1 text-sm text-[#5F6368] max-w-2xl">
              Honest, code-accurate technical documentation detailing how inputs, images, URLs, and ML telemetry are processed and safeguarded.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#FAF9F6] p-1 rounded-xl border border-[#E8E6E1]">
            <button
              onClick={() => setActiveTab("architecture")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "architecture"
                  ? "bg-white text-[#202124] shadow-xs border border-[#E8E6E1]"
                  : "text-[#5F6368] hover:text-[#202124]"
              }`}
            >
              Data Lifecycle
            </button>
            <button
              onClick={() => setActiveTab("data-lifecycle")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "data-lifecycle"
                  ? "bg-white text-[#202124] shadow-xs border border-[#E8E6E1]"
                  : "text-[#5F6368] hover:text-[#202124]"
              }`}
            >
              Processing Location
            </button>
            <button
              onClick={() => setActiveTab("guarantees")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "guarantees"
                  ? "bg-white text-[#202124] shadow-xs border border-[#E8E6E1]"
                  : "text-[#5F6368] hover:text-[#202124]"
              }`}
            >
              Security Guarantees
            </button>
          </div>
        </div>

        {/* 4 Technical Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1]">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#E8E6E1] flex items-center justify-center text-[#38C9A7] mb-3 shadow-2xs">
              <EyeOff className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#202124]">Zero Persistent Storage</h4>
            <p className="text-xs text-[#5F6368] mt-1.5 leading-relaxed">
              No database, Redis store, or persistent disk storage is connected. Raw text, email fields, and image uploads are discarded immediately upon response.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1]">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#E8E6E1] flex items-center justify-center text-[#6D5DFB] mb-3 shadow-2xs">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#202124]">Client-Side Wasm OCR</h4>
            <p className="text-xs text-[#5F6368] mt-1.5 leading-relaxed">
              Optical Character Recognition runs directly in the client browser using WebAssembly via Tesseract.js. Text extraction happens locally before optional inference.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1]">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#E8E6E1] flex items-center justify-center text-[#FF6B6B] mb-3 shadow-2xs">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#202124]">Local URL Heuristics</h4>
            <p className="text-xs text-[#5F6368] mt-1.5 leading-relaxed">
              URLs are analyzed using deterministic algorithmic rules (punycode, shorteners, path keywords, redirect parameters) without notifying external target servers.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1]">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#E8E6E1] flex items-center justify-center text-[#F5B942] mb-3 shadow-2xs">
              <Server className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#202124]">Session-Only History</h4>
            <p className="text-xs text-[#5F6368] mt-1.5 leading-relaxed">
              Recent analysis history lives strictly in volatile React component state in memory. No tracking cookies or remote telemetry are retained across sessions.
            </p>
          </div>
        </div>

        {/* Tab Content 1: Architecture & Data Breakdown */}
        {activeTab === "architecture" && (
          <div className="p-6 sm:p-8 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1]">
            <h3 className="text-base font-bold text-[#202124] mb-4 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#6D5DFB]" />
              <span>Exact Data Lifecycle Specification</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#5F6368] leading-relaxed">
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-[#E8E6E1]">
                  <p className="font-bold text-[#202124] mb-1">1. Message Text &amp; SMS Content</p>
                  <p>
                    When you click "Analyze Message", the string is transmitted over HTTP POST to <code className="font-mono text-[11px] bg-[#FAF9F6] px-1 py-0.5 rounded">/predict</code>. The Python FastAPI process tokenizes, creates a TF-IDF vector, executes Scikit-learn inference in RAM, and yields the response JSON. The string is not recorded in any database or file system.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E8E6E1]">
                  <p className="font-bold text-[#202124] mb-1">2. Uploaded Images &amp; Screenshots</p>
                  <p>
                    Images uploaded for OCR analysis are processed client-side inside the user's browser using <code className="font-mono text-[11px] bg-[#FAF9F6] px-1 py-0.5 rounded">tesseract.js</code> WebAssembly. When sent to <code className="font-mono text-[11px] bg-[#FAF9F6] px-1 py-0.5 rounded">/analyze-image</code> for QR detection, bytes are buffered in volatile memory by OpenCV's <code className="font-mono text-[11px] bg-[#FAF9F6] px-1 py-0.5 rounded">QRCodeDetector</code> and immediately freed upon exit.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-[#E8E6E1]">
                  <p className="font-bold text-[#202124] mb-1">3. URLs &amp; QR Payloads</p>
                  <p>
                    URLs are decomposed locally via URI grammar regexes. The system extracts scheme, domain, path, query, and flags potential security threats (e.g. Punycode spoofing, IP addresses, known URL shorteners). We <strong>never execute automatic network GET requests</strong> to target websites, preventing drive-by malware execution or canary token triggering.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E8E6E1]">
                  <p className="font-bold text-[#202124] mb-1">4. Email Fields &amp; Header Data</p>
                  <p>
                    Email analysis checks domain alignment between the "From" and "Reply-To" headers, detecting classic display-name spoofing and free webmail impersonation. No external SMTP or IMAP connection is created; analysis is 100% heuristic and based purely on the submitted payload.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Processing Location */}
        {activeTab === "data-lifecycle" && (
          <div className="p-6 sm:p-8 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1]">
            <h3 className="text-base font-bold text-[#202124] mb-4 flex items-center gap-2">
              <Server className="w-4 h-4 text-[#38C9A7]" />
              <span>Client Browser vs. Backend Responsibilities</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="bg-white p-5 rounded-xl border border-[#E8E6E1]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#38C9A7]" />
                  <h4 className="font-bold text-[#202124] text-sm">Processed Locally in Browser</h4>
                </div>
                <ul className="space-y-2 text-[#5F6368]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#38C9A7] shrink-0 mt-0.5" />
                    <span><strong>Tesseract.js Wasm OCR:</strong> Image text extraction happens entirely on your machine.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#38C9A7] shrink-0 mt-0.5" />
                    <span><strong>Session History:</strong> Analysis history is maintained in React component state.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#38C9A7] shrink-0 mt-0.5" />
                    <span><strong>Theme Preferences:</strong> Accent configuration saved in browser <code className="font-mono bg-[#FAF9F6] px-1 py-0.5 rounded">localStorage</code>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#38C9A7] shrink-0 mt-0.5" />
                    <span><strong>Visual URL Breakdown:</strong> URL segment parsing rendered via browser regex.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#E8E6E1]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6D5DFB]" />
                  <h4 className="font-bold text-[#202124] text-sm">Processed on Local FastAPI Backend</h4>
                </div>
                <ul className="space-y-2 text-[#5F6368]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#6D5DFB] shrink-0 mt-0.5" />
                    <span><strong>Scikit-Learn ML Models:</strong> MultinomialNB and LogisticRegression vector evaluation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#6D5DFB] shrink-0 mt-0.5" />
                    <span><strong>OpenCV QR Decoding:</strong> In-memory optical barcode reading and payload extraction.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#6D5DFB] shrink-0 mt-0.5" />
                    <span><strong>Corpus Metrics:</strong> Confusion matrix and threshold trade-off curve serving.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#6D5DFB] shrink-0 mt-0.5" />
                    <span><strong>Header Intelligence:</strong> Strict heuristic comparison of sender and return paths.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 3: Security Guarantees */}
        {activeTab === "guarantees" && (
          <div className="p-6 sm:p-8 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1]">
            <h3 className="text-base font-bold text-[#202124] mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#FF6B6B]" />
              <span>Strict Security &amp; Safety Commitments</span>
            </h3>

            <div className="space-y-3 text-xs text-[#5F6368]">
              <div className="bg-white p-4 rounded-xl border border-[#E8E6E1] flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#38C9A7] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#202124]">Safe Preview &bull; No Drive-By Execution</p>
                  <p className="mt-0.5">
                    We deliberately do not auto-render embedded iframes or ping destination servers for thumbnail previews. This ensures malicious scripts, pixel trackers, or CSRF payloads cannot detonate in your browser.
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E8E6E1] flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#38C9A7] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#202124]">No Account Required &bull; Zero Identification</p>
                  <p className="mt-0.5">
                    SpamGuard does not demand registration, authentication tokens, or email collection. Users can analyze suspicious communications completely anonymously.
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E8E6E1] flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#38C9A7] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#202124]">Clear External Reputation Separation</p>
                  <p className="mt-0.5">
                    Whenever an external domain service or threat intelligence feed is offline or not configured, the platform clearly labels results as <em>Local Heuristic Signals</em> rather than fabricating external reputational trust scores.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
