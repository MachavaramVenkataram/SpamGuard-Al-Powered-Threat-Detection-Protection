"use client";

import React, { useState } from "react";
import {
  X,
  Palette,
  Sliders,
  Shield,
  Eye,
  Zap,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useTheme, ThemeName, THEME_OPTIONS } from "./ThemeContext";
import { useToast } from "./ToastContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModelId?: "naive_bayes" | "logistic_regression";
  onSelectModel?: (m: "naive_bayes" | "logistic_regression") => void;
  onClearHistory?: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  activeModelId = "naive_bayes",
  onSelectModel,
  onClearHistory,
}: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"appearance" | "analysis" | "privacy" | "accessibility">("appearance");

  // Local preferences state
  const [sensitivity, setSensitivity] = useState<"standard" | "high" | "strict">("standard");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [autoOcr, setAutoOcr] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#E8E6E1] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E8E6E1] flex items-center justify-between bg-[#FAF9F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E6E1] flex items-center justify-center text-[#6D5DFB] shadow-2xs">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#202124]">Platform Settings</h3>
              <p className="text-[11px] text-[#5F6368]">Configure themes, sensitivity, and privacy preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#E8E6E1] text-[#5F6368] hover:text-[#202124] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-[#E8E6E1] bg-white px-6 overflow-x-auto text-xs font-bold text-[#5F6368]">
          {[
            { id: "appearance" as const, label: "Appearance", icon: Palette },
            { id: "analysis" as const, label: "Analysis Engine", icon: Sliders },
            { id: "privacy" as const, label: "Privacy & Data", icon: Shield },
            { id: "accessibility" as const, label: "Accessibility", icon: Eye },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "border-[#6D5DFB] text-[#6D5DFB]"
                    : "border-transparent hover:text-[#202124]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {/* TAB 1: Appearance */}
          {activeTab === "appearance" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider mb-1">
                  Accent Color Theme
                </h4>
                <p className="text-xs text-[#5F6368]">
                  Select from 6 curated light SaaS color themes. SpamGuard uses warm ivory and white foundations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {THEME_OPTIONS.map((opt) => {
                  const isSelected = theme === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setTheme(opt.id);
                        toast(`Switched theme to ${opt.name}`, "info");
                      }}
                      className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? "bg-white border-[#6D5DFB] ring-2 ring-[#6D5DFB]/20 shadow-xs"
                          : "bg-[#FAF9F6] hover:bg-white border-[#E8E6E1]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-5 h-5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: opt.primaryColor }}
                        />
                        <div>
                          <span className="font-bold text-[#202124] block">{opt.name}</span>
                          <span className="text-[11px] text-[#5F6368]">{opt.palette}</span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#6D5DFB]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Analysis Engine */}
          {activeTab === "analysis" && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider mb-1">
                  Default Supervised Classifier
                </h4>
                <p className="text-xs text-[#5F6368] mb-3">
                  Choose the active model evaluated across the 4,000-dimensional TF-IDF sparse matrix.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      onSelectModel?.("naive_bayes");
                      toast("Default engine: Multinomial Naive Bayes", "info");
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      activeModelId === "naive_bayes"
                        ? "bg-white border-[#6D5DFB] ring-2 ring-[#6D5DFB]/20"
                        : "bg-[#FAF9F6] border-[#E8E6E1]"
                    }`}
                  >
                    <span className="font-bold text-[#202124] block">Multinomial Naive Bayes</span>
                    <span className="text-[11px] text-[#5F6368]">Fast probabilistic prior, 98.4% Acc</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectModel?.("logistic_regression");
                      toast("Default engine: Logistic Regression", "info");
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      activeModelId === "logistic_regression"
                        ? "bg-white border-[#6D5DFB] ring-2 ring-[#6D5DFB]/20"
                        : "bg-[#FAF9F6] border-[#E8E6E1]"
                    }`}
                  >
                    <span className="font-bold text-[#202124] block">Logistic Regression</span>
                    <span className="text-[11px] text-[#5F6368]">Log-odds coefficients, 98.1% Acc</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8E6E1]">
                <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider mb-1">
                  Detection Sensitivity Threshold
                </h4>
                <p className="text-xs text-[#5F6368] mb-3">
                  Adjust probability threshold for classifying content as suspicious or spam.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "standard" as const, label: "Standard (50%)", desc: "Balanced recall" },
                    { id: "high" as const, label: "High (40%)", desc: "Catch low-confidence" },
                    { id: "strict" as const, label: "Strict (30%)", desc: "Maximum protection" },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => setSensitivity(lvl.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        sensitivity === lvl.id
                          ? "bg-white border-[#6D5DFB] font-bold"
                          : "bg-[#FAF9F6] border-[#E8E6E1] text-[#5F6368]"
                      }`}
                    >
                      <span className="block text-xs text-[#202124] font-bold">{lvl.label}</span>
                      <span className="text-[10px] text-[#5F6368]">{lvl.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Privacy & Data */}
          {activeTab === "privacy" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider mb-1">
                  Session Data Governance
                </h4>
                <p className="text-xs text-[#5F6368]">
                  SpamGuard runs stateless inference. No messages or email bodies are stored in permanent server databases.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-[#202124]">Local Prediction History</h5>
                    <p className="text-xs text-[#5F6368]">Stored exclusively in your local browser memory</p>
                  </div>
                  <button
                    onClick={() => {
                      onClearHistory?.();
                      toast("Session history wiped cleanly", "info");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors"
                  >
                    Clear History
                  </button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E8E6E1]">
                  <div>
                    <h5 className="font-bold text-[#202124]">Reset Local Preferences</h5>
                    <p className="text-xs text-[#5F6368]">Revert theme and thresholds to defaults</p>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.clear();
                      setTheme("violet");
                      toast("Preferences reset to defaults", "info");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#E8E6E1] text-[#202124] hover:bg-[#FAF9F6] text-xs font-bold transition-colors"
                  >
                    Reset All
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Accessibility */}
          {activeTab === "accessibility" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider mb-1">
                  Motion &amp; Visual Settings
                </h4>
                <p className="text-xs text-[#5F6368]">
                  Customize animation speeds and reduced-motion behavior.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1] space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-[#202124] block">Respect Reduced Motion</span>
                    <span className="text-xs text-[#5F6368]">Disable pulsing scanner laser and micro-transitions</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={reducedMotion}
                    onChange={(e) => {
                      setReducedMotion(e.target.checked);
                      toast(e.target.checked ? "Reduced motion enabled" : "Animations restored", "info");
                    }}
                    className="w-4 h-4 rounded text-[#6D5DFB] focus:ring-[#6D5DFB]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-[#E8E6E1]">
                  <div>
                    <span className="font-bold text-[#202124] block">Automatic Wasm OCR</span>
                    <span className="text-xs text-[#5F6368]">Immediately extract text upon image drag-and-drop</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoOcr}
                    onChange={(e) => setAutoOcr(e.target.checked)}
                    className="w-4 h-4 rounded text-[#6D5DFB] focus:ring-[#6D5DFB]"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E8E6E1] bg-[#FAF9F6] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-[#6D5DFB] hover:bg-[#5B4CE0] rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
