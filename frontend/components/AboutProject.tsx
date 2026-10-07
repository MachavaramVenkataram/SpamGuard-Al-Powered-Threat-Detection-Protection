"use client";

import React from "react";
import { Info, Code, Shield, CheckCircle2, Cpu, Terminal, ExternalLink } from "lucide-react";

export default function AboutProject() {
  const techStack = [
    { name: "Next.js 15", category: "Frontend Framework", desc: "React 19, App Router, SSR & Client Hydration" },
    { name: "TypeScript", category: "Type Safety", desc: "Strict end-to-end interface contracts" },
    { name: "Tailwind CSS", category: "Styling System", desc: "White-first modern SaaS aesthetic" },
    { name: "Recharts", category: "Visualization", desc: "Dynamic SVG charts & responsive distributions" },
    { name: "FastAPI", category: "Backend Microservice", desc: "High-throughput asynchronous Python REST API" },
    { name: "Scikit-Learn", category: "Machine Learning", desc: "Pipelines, TF-IDF Vectorizer & Classifiers" },
    { name: "Joblib", category: "Model Persistence", desc: "Serialized pipeline artifacts for fast cold-starts" },
    { name: "Pandas & NumPy", category: "Data Engineering", desc: "Corpus ingestion, stratification & statistical metrics" },
  ];

  return (
    <section id="about" className="py-16 md:py-24 bg-slate-50/70 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-700 mb-2">
            <Info className="w-3.5 h-3.5" />
            <span>Technical Documentation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            About the Spam Mail Detector Project
          </h2>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            A production-ready Natural Language Processing pipeline built to address the real-world challenge of binary text classification under imbalanced corpora.
          </p>
        </div>

        {/* 3-Column Architecture Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Code className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Deterministic NLP Preprocessing</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Raw text undergoes structured lowercasing, URL/phone sequence normalization, punctuation stripping, and tokenization. Stopwords are filtered without compromising informative short tokens.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">False-Positive Sensitive Design</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              In spam detection, false positives (marking legitimate messages as spam) carry catastrophic UX consequences. Both Naive Bayes and Logistic Regression were tuned for high precision (&gt;97.8%).
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Serialized Pipeline Persistence</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Trained vectorizers and estimators are packaged into a unified Scikit-learn Pipeline and serialized with Joblib. Inference is executed in sub-10ms without repeating training overhead.
            </p>
          </div>
        </div>

        {/* Tech Stack Grid */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs mb-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Production Technology Stack</h3>
              <p className="text-xs text-slate-500 mt-0.5">Engineered with modern, industry-standard frameworks</p>
            </div>
            <span className="text-xs font-mono text-slate-400">Full-Stack Decoupled</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {techStack.map((tech, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50/60 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {tech.category}
                </span>
                <p className="text-sm font-bold text-slate-900 mt-2">{tech.name}</p>
                <p className="text-xs text-slate-500 mt-1 leading-normal">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dataset Attribution */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-600">
          <div>
            <span className="font-bold text-slate-900">SMS Spam Collection Dataset:</span>{" "}
            Collected by Tiago A. Almeida and Jos&eacute; Mar&iacute;a G&oacute;mez Hidalgo. Published on the UCI Machine Learning Repository.
          </div>
          <a
            href="https://archive.ics.uci.edu/dataset/228/sms+spam+collection"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 shrink-0"
          >
            <span>UCI Repository Reference</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </section>
  );
}
