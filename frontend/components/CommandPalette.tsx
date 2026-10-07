"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  FileText,
  Image as ImageIcon,
  Link2,
  Mail,
  Database,
  Cpu,
  History,
  ShieldCheck,
  Activity,
  BookOpen,
  ArrowRight,
  X,
  Sparkles,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  activeModelId?: "naive_bayes" | "logistic_regression";
  onClearHistory?: () => void;
  onSelectModel?: (m: "naive_bayes" | "logistic_regression") => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onClearHistory,
  onSelectModel,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigateTo = (hash: string, workspaceMode?: string) => {
    onClose();
    if (workspaceMode && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("switch-workspace-mode", { detail: workspaceMode }));
    }
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const actions = [
    {
      id: "scan-anything",
      title: "Scan Anything",
      desc: "Universal scanner for text, emails, URLs, images and files",
      icon: Sparkles,
      category: "Scanner",
      action: () => navigateTo("#workspace"),
    },
    {
      id: "analyze-text",
      title: "Analyze Text",
      desc: "Paste SMS or chat message to classify spam risk",
      icon: FileText,
      category: "Analysis",
      action: () => navigateTo("#workspace", "text"),
    },
    {
      id: "analyze-url",
      title: "Analyze URL",
      desc: "Inspect links for punycode, shorteners and heuristic threats",
      icon: Link2,
      category: "Analysis",
      action: () => navigateTo("#workspace", "url"),
    },
    {
      id: "analyze-email",
      title: "Analyze Email",
      desc: "Inspect email headers, sender spoofing and embedded URLs",
      icon: Mail,
      category: "Analysis",
      action: () => navigateTo("#workspace", "email"),
    },
    {
      id: "upload-image",
      title: "Upload Image",
      desc: "Upload image screenshot for neural OCR text extraction",
      icon: ImageIcon,
      category: "Analysis",
      action: () => navigateTo("#workspace", "image"),
    },
    {
      id: "scan-qr",
      title: "Scan QR",
      desc: "Decode and inspect optical QR code destinations",
      icon: ImageIcon,
      category: "Analysis",
      action: () => navigateTo("#workspace", "qr"),
    },
    {
      id: "security-training",
      title: "Security Training",
      desc: "Interactive quiz: 'Would you trust this?' with 7 scenarios",
      icon: BookOpen,
      category: "Education",
      action: () => navigateTo("#training"),
    },
    {
      id: "compare-messages",
      title: "Compare Messages",
      desc: "Benchmark two messages side-by-side to compare risk vectors",
      icon: Sparkles,
      category: "Education",
      action: () => navigateTo("#compare"),
    },
    {
      id: "open-history",
      title: "Open History",
      desc: "Review recent session analysis results and latency",
      icon: History,
      category: "Session",
      action: () => navigateTo("#history"),
    },
    {
      id: "security-center",
      title: "Security Center",
      desc: "Session threat risk index and trend analytics",
      icon: ShieldCheck,
      category: "Security",
      action: () => navigateTo("#security-center"),
    },
    {
      id: "open-model-lab",
      title: "Model Lab",
      desc: "Benchmark MultinomialNB vs LogisticRegression",
      icon: Cpu,
      category: "Models",
      action: () => navigateTo("#models"),
    },
    {
      id: "open-dataset",
      title: "Dataset Explorer",
      desc: "Explore all 5,572 messages in the SMS Spam corpus",
      icon: Database,
      category: "Explore",
      action: () => navigateTo("#dataset"),
    },
    {
      id: "api-health",
      title: "API Health",
      desc: "View real-time ping latency, model status and endpoints",
      icon: Activity,
      category: "Telemetry",
      action: () => navigateTo("#diagnostics"),
    },
    {
      id: "open-privacy",
      title: "Privacy Center",
      desc: "Review privacy center, data lifecycle and security guarantees",
      icon: ShieldCheck,
      category: "Security",
      action: () => navigateTo("#privacy"),
    },
  ];

  const filteredActions = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.desc.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-[#202124]/40 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E8E6E1] overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E8E6E1] gap-3">
          <Search className="w-4 h-4 text-[#5F6368]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to feature (e.g. 'Analyze Image')..."
            className="flex-1 bg-transparent text-sm text-[#202124] placeholder-[#5F6368] outline-none"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-[#FAF9F6] text-[#5F6368] rounded border border-[#E8E6E1]">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1 text-[#5F6368] hover:text-[#202124] rounded-lg hover:bg-[#FAF9F6]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#E8E6E1]/50">
          {filteredActions.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#5F6368]">
              No actions matching "{query}". Try "Analyze", "Dataset", or "Privacy".
            </div>
          ) : (
            filteredActions.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#FAF9F6] text-left transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF9F6] border border-[#E8E6E1] flex items-center justify-center text-[#202124] group-hover:border-[#6D5DFB] group-hover:text-[#6D5DFB] transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#202124] group-hover:text-[#6D5DFB] transition-colors">
                          {cmd.title}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#FAF9F6] text-[#5F6368] border border-[#E8E6E1]">
                          {cmd.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5F6368] mt-0.5">{cmd.desc}</p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-[#5F6368] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#6D5DFB]" />
                </button>
              );
            })
          )}
        </div>

        {/* Palette Footer */}
        <div className="px-4 py-2 bg-[#FAF9F6] border-t border-[#E8E6E1] flex items-center justify-between text-[11px] text-[#5F6368]">
          <div className="flex items-center gap-3">
            <span>Navigation: <kbd className="font-mono">Tab</kbd> / <kbd className="font-mono">Enter</kbd></span>
            <span>Close: <kbd className="font-mono">Esc</kbd></span>
          </div>
          <span className="font-mono text-[10px]">SpamGuard Command Suite</span>
        </div>
      </div>
    </div>
  );
}
