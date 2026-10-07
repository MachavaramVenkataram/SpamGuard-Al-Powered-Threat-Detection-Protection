"use client";

import React, { useState } from "react";
import {
  Layers,
  ArrowRight,
  Server,
  Cpu,
  Database,
  Sparkles,
  CheckCircle2,
  Workflow,
  Globe,
  Sliders,
  Code2,
  FileText,
  Image as ImageIcon,
  Link2,
  Mail,
  QrCode,
  ShieldCheck,
  Binary,
  Compass,
} from "lucide-react";

interface PipelineStep {
  id: string;
  number: string;
  name: string;
  stageType: string;
  tech: string;
  inputs: string;
  outputs: string;
  latency: string;
  role: string;
  specs: { label: string; value: string }[];
  details: string;
}

const MULTIMODAL_STEPS: PipelineStep[] = [
  {
    id: "inputs",
    number: "01",
    name: "MULTIMODAL INGRESS",
    stageType: "TEXT / IMAGE / URL / EMAIL / QR",
    tech: "MIME Ingestion • Drag & Drop • Client Buffers",
    inputs: "SMS, Email header/body, raw HTTP/HTTPS URLs, PNG/JPG files, optical QR scans",
    outputs: "Standardized raw payload objects (string, URI, image buffer)",
    latency: "< 1 ms client ingress",
    role: "Universal multi-format intake supporting simultaneous raw text, email header structures, URLs, image screenshots, and camera/upload QR barcodes.",
    specs: [
      { label: "Supported Types", value: "Text, Email, URL, PNG, JPG, QR" },
      { label: "Ingress Protocol", value: "HTTP/1.1 REST & Multipart" },
      { label: "Input Validation", value: "Pydantic v2 & Wasm Blob" },
    ],
    details:
      "Direct user entry point. Handles format validation, length checks, file size constraints (<10MB), and client-side memory buffering before routing to extraction engines.",
  },
  {
    id: "extraction",
    number: "02",
    name: "CONTENT EXTRACTION",
    stageType: "DATA DECOUPLING & UNPACKING",
    tech: "Wasm Tesseract OCR • OpenCV QR Detector • URI Parser",
    inputs: "Raw multimodal payloads",
    outputs: "Extracted unicode text stream, parsed URI tokens, decoded QR strings",
    latency: "~120 ms OCR / < 2 ms QR",
    role: "Converts diverse non-text formats into clean, structured digital strings ready for downstream computational analysis.",
    specs: [
      { label: "OCR Engine", value: "Tesseract.js v5 Wasm" },
      { label: "QR Engine", value: "OpenCV cv2.QRCodeDetector" },
      { label: "URI Parser", value: "urllib.parse & RFC 3986" },
    ],
    details:
      "Performs optical character recognition on screenshots of messages, decodes matrix barcodes to uncover obfuscated URLs, and extracts embedded links from email bodies.",
  },
  {
    id: "analysis",
    number: "03",
    name: "NLP / OCR / URL ANALYSIS",
    stageType: "HEURISTIC & SIGNAL INTELLIGENCE",
    tech: "10-Point URL Heuristics • Email Header Mismatch • Regex Lexicon",
    inputs: "Normalized text, URL strings, sender headers",
    outputs: "Suspicious flags (punycode, shortener, reply-to mismatch, urgency tokens)",
    latency: "~0.40 ms execution",
    role: "Evaluates deterministic threat patterns including Punycode spoofing, IP-based hosts, sender domain impersonation, and phishing trigger words.",
    specs: [
      { label: "URL Rules", value: "10 Algorithmic Heuristics" },
      { label: "Spoof Detector", value: "From vs Reply-To Domain Match" },
      { label: "Lexical Markers", value: "Urgency, Financial, Prize, Auth" },
    ],
    details:
      "Calculates structural risk before statistical ML. Uncovers homograph attacks, shortened links hiding redirects, and corporate impersonation originating from free email providers.",
  },
  {
    id: "feature-engineering",
    number: "04",
    name: "FEATURE ENGINEERING",
    stageType: "MATHEMATICAL VECTORIZATION",
    tech: "Scikit-Learn TfidfVectorizer • Sublinear TF",
    inputs: "Cleaned token sequence",
    outputs: "4,000-dimensional sparse CSR matrix vector",
    latency: "~0.25 ms transform",
    role: "Transforms unstructured human language into a normalized numerical vector space using TF-IDF: TF-IDF(t,d) = (1 + log(tf)) * log(N/df).",
    specs: [
      { label: "Dimensions", value: "4,000 Features" },
      { label: "N-gram Range", value: "(1, 2) Unigram + Bigram" },
      { label: "Norm", value: "Euclidean L2" },
      { label: "Stopwords", value: "128 English Stems" },
    ],
    details:
      "Suppresses ubiquitous English stopwords while magnifying decisive spam tokens (e.g. 'claim', 'urgent', 'prize', 'winner') discovered across the 5,572-message training corpus.",
  },
  {
    id: "ml-classification",
    number: "05",
    name: "ML CLASSIFICATION",
    stageType: "SUPERVISED INFERENCE",
    tech: "Multinomial Naive Bayes (α=0.1) & Logistic Regression",
    inputs: "4,000-dimensional TF-IDF vector",
    outputs: "Posterior probability P(Spam|X) & log-odds decision score",
    latency: "~0.55 ms inference",
    role: "Executes supervised probabilistic classification to determine whether the message exhibits linguistic characteristics of spam vs legitimate communication.",
    specs: [
      { label: "Primary Model", value: "MultinomialNB (98.39% Acc)" },
      { label: "Alt Model", value: "LogisticRegression (97.94% Acc)" },
      { label: "Training Split", value: "4,457 msgs (80%)" },
      { label: "Test Split", value: "1,115 msgs (20%)" },
    ],
    details:
      "Runs fast in-memory Scikit-learn inference with calibrated probabilities, computing class likelihoods without remote external API dependency.",
  },
  {
    id: "risk-engine",
    number: "06",
    name: "RISK ENGINE",
    stageType: "MULTIMODAL ENSEMBLE AGGREGATION",
    tech: "Weighted Signal Aggregator • Non-Fabricated Scoring",
    inputs: "ML probability + URL risk score + Header risk + OCR urgency",
    outputs: "Unified Risk Score (0-100) & Category Sub-scores",
    latency: "~0.12 ms aggregation",
    role: "Synthesizes textual machine-learning probabilities with deterministic URL heuristics and sender signals into a calibrated composite threat score.",
    specs: [
      { label: "Score Range", value: "0 to 100 Integer" },
      { label: "Category Bars", value: "Text, URL, Sender, Behavior" },
      { label: "Calibrated Weight", value: "Dynamic Multi-factor Matrix" },
    ],
    details:
      "Ensures that an innocent message with a highly toxic phishing URL or spoofed sender header is accurately flagged even if the body text seems conversational.",
  },
  {
    id: "explainability",
    number: "07",
    name: "EXPLAINABILITY & EVIDENCE",
    stageType: "TRANSPARENCY & AUDITING",
    tech: "Linguistic Signal Highlighting • Top Coefficients",
    inputs: "Risk results & Token vector",
    outputs: "Interactive evidence list ('Why We Flagged This') & clickable token highlights",
    latency: "~0.10 ms synthesis",
    role: "Exposes the exact evidence behind the prediction, rendering clickable highlighted tokens and human-readable threat rationale.",
    specs: [
      { label: "Evidence Engine", value: "Why We Flagged This" },
      { label: "Token Highlighting", value: "Semantic Color Mapping" },
      { label: "Copilot Context", value: "Evidence-Grounded Q&A" },
    ],
    details:
      "Empowers users to understand why content was flagged, linking specific words, shorteners, or header mismatches directly to security risks without hallucinations.",
  },
  {
    id: "final-verdict",
    number: "08",
    name: "FINAL VERDICT & ACTION CENTER",
    stageType: "PROTECTION & RESPONSE",
    tech: "5-Tier Semantic Threat System • Contextual Actions",
    inputs: "Composite risk score & evidence matrix",
    outputs: "SAFE, LOW RISK, SUSPICIOUS, HIGH RISK, or CRITICAL verdict + action advice",
    latency: "< 1 ms UI dispatch",
    role: "Delivers an actionable verdict with contextual safety recommendations (e.g. 'Do not click links', 'Verify sender', 'Block contact').",
    specs: [
      { label: "Threat States", value: "Safe, Low, Suspicious, High, Critical" },
      { label: "Actions", value: "Contextual Guidance Checklist" },
      { label: "Safe Preview", value: "Inspect without Detonating" },
    ],
    details:
      "Closes the loop from Detection to Protection, providing unambiguous guidance to non-technical users and security analysts alike.",
  },
];

export default function SystemArchitecture() {
  const [selectedStepId, setSelectedStepId] = useState<string>("inputs");
  const activeStep = MULTIMODAL_STEPS.find((s) => s.id === selectedStepId) || MULTIMODAL_STEPS[0];

  return (
    <section id="architecture" className="py-16 md:py-20 bg-mesh-subtle border-b border-[#E8E6E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E8E6E1] text-xs font-semibold text-[#202124] mb-3 shadow-2xs">
              <Workflow className="w-3.5 h-3.5 text-[#6D5DFB]" />
              <span className="tracking-wide uppercase font-bold text-[10px] text-[#5F6368]">
                Multimodal Pipeline Architecture
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#202124] tracking-tight">
              Detect &rarr; Analyze &rarr; Explain &rarr; Protect
            </h2>
            <p className="mt-1 text-sm text-[#5F6368] max-w-3xl">
              End-to-end interactive architecture mapping raw inputs through extraction, NLP, feature engineering, ML classification, risk scoring, explainability, and final protection verdicts. Click any node below to inspect logic.
            </p>
          </div>
          <span className="text-xs font-mono text-[#5F6368] bg-white px-3 py-1.5 rounded-lg border border-[#E8E6E1] self-start sm:self-auto">
            Pipeline Stages: 8 Nodes
          </span>
        </div>

        {/* 8-Stage Interactive Pipeline Visualizer */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8E6E1] shadow-2xs mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {MULTIMODAL_STEPS.map((step, idx) => {
              const isSelected = selectedStepId === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setSelectedStepId(step.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? "bg-[#6D5DFB] text-white border-[#6D5DFB] shadow-md shadow-[#6D5DFB]/20 scale-102 z-10"
                      : "bg-[#FAF9F6] hover:bg-white text-[#202124] border-[#E8E6E1] hover:border-[#D5D2CB]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isSelected ? "bg-white/20 text-white" : "bg-white text-[#5F6368] border border-[#E8E6E1]"
                        }`}
                      >
                        {step.number}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold leading-tight uppercase tracking-tight">{step.name}</h4>
                    <p className={`text-[10px] mt-1 font-mono line-clamp-1 ${isSelected ? "text-white/80" : "text-[#5F6368]"}`}>
                      {step.stageType}
                    </p>
                  </div>

                  <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[9px] font-semibold ${
                    isSelected ? "border-white/20 text-white" : "border-[#E8E6E1] text-[#6D5DFB]"
                  }`}>
                    <span>Inspect</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Node Detailed Inspector */}
        <div className="bg-white rounded-2xl border border-[#E8E6E1] shadow-2xs p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E8E6E1]">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#F2F0FF] text-[#6D5DFB] border border-[#DCD8FF]">
                  Stage {activeStep.number} of 08
                </span>
                <h3 className="text-xl font-black text-[#202124]">{activeStep.name}</h3>
              </div>
              <p className="text-xs font-mono text-[#5F6368] mt-1">{activeStep.tech}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {activeStep.specs.map((sp, i) => (
                <div key={i} className="px-3 py-1.5 bg-[#FAF9F6] rounded-xl border border-[#E8E6E1]">
                  <span className="block text-[9px] text-[#5F6368] uppercase font-bold tracking-wider">{sp.label}</span>
                  <span className="block text-xs font-mono font-bold text-[#202124]">{sp.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-[#202124] uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5 text-[#6D5DFB]" />
                  <span>Operational Role</span>
                </h4>
                <p className="text-[#5F6368] leading-relaxed bg-[#FAF9F6] p-4 rounded-xl border border-[#E8E6E1]">
                  {activeStep.role}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#202124] uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#38C9A7]" />
                  <span>I/O Data Flow</span>
                </h4>
                <div className="bg-[#FAF9F6] p-4 rounded-xl border border-[#E8E6E1] space-y-2">
                  <div>
                    <span className="font-bold text-[#202124] block">Ingress Input:</span>
                    <span className="text-[#5F6368] font-mono text-[11px]">{activeStep.inputs}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#202124] block">Egress Output:</span>
                    <span className="text-[#5F6368] font-mono text-[11px]">{activeStep.outputs}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-[#202124] uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-[#FF6B6B]" />
                  <span>Technical Implementation &amp; Execution</span>
                </h4>
                <p className="text-[#5F6368] leading-relaxed bg-[#FAF9F6] p-4 rounded-xl border border-[#E8E6E1]">
                  {activeStep.details}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E6E1] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#5F6368] block">Measured Pipeline Latency</span>
                  <span className="text-sm font-mono font-bold text-[#202124]">{activeStep.latency}</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-[#E8E6E1] text-[#38C9A7]">
                  Verified In-Memory
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
