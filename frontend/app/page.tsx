"use client";

import React, { useState, useEffect } from "react";
import { Bot } from "lucide-react";
import { ThemeProvider } from "@/components/ThemeContext";
import { ToastProvider, useToast } from "@/components/ToastContext";
import Navbar from "@/components/Navbar";
import CommandPalette from "@/components/CommandPalette";
import Hero from "@/components/Hero";
import LiveSystemStatus from "@/components/LiveSystemStatus";
import MultimodalWorkspace from "@/components/MultimodalWorkspace";
import ThreatSignalMap from "@/components/ThreatSignalMap";
import SecurityCenter from "@/components/SecurityCenter";
import ThreatEducation from "@/components/ThreatEducation";
import CompareMessages from "@/components/CompareMessages";
import SecurityTraining from "@/components/SecurityTraining";
import PredictionHistory, { HistoryItem } from "@/components/PredictionHistory";
import DatasetExplorer from "@/components/DatasetExplorer";
import TextAnalysis from "@/components/TextAnalysis";
import NLPipeline from "@/components/NLPipeline";
import ModelComparison from "@/components/ModelComparison";
import ConfusionMatrix from "@/components/ConfusionMatrix";
import ThresholdExplorer from "@/components/ThresholdExplorer";
import SystemArchitecture from "@/components/SystemArchitecture";
import TechnicalDeepDive from "@/components/TechnicalDeepDive";
import ProductDemo from "@/components/ProductDemo";
import PrivacyCenter from "@/components/PrivacyCenter";
import ApiDiagnostics from "@/components/ApiDiagnostics";
import AboutProject from "@/components/AboutProject";
import Footer from "@/components/Footer";
import SecurityCopilot from "@/components/SecurityCopilot";
import SettingsModal from "@/components/SettingsModal";
import GlobalDropZone from "@/components/GlobalDropZone";
import { fetchModelMetrics, ModelMetadata } from "@/lib/api";

function AppContent() {
  const { toast } = useToast();
  const [activeModelId, setActiveModelId] = useState<"naive_bayes" | "logistic_regression">("naive_bayes");
  const [detectorMessage, setDetectorMessage] = useState<string>("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [lastInferenceLatencyMs, setLastInferenceLatencyMs] = useState<number | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);

  // Load model metadata on mount
  useEffect(() => {
    let isMounted = true;
    async function loadMeta() {
      try {
        const data = await fetchModelMetrics();
        if (isMounted) setMetadata(data);
      } catch (err) {
        console.error("Failed to load model metadata on startup:", err);
      }
    }
    loadMeta();
    return () => {
      isMounted = false;
    };
  }, []);

  // Global Ctrl + K shortcut to open Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelectMessage = (msg: string) => {
    setDetectorMessage(msg);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("switch-workspace-mode", { detail: "text" }));
      window.dispatchEvent(new CustomEvent("load-workspace-text", { detail: msg }));
    }
    const elem = document.getElementById("workspace");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
    toast("Payload loaded into Universal Threat Scanner", "info");
  };

  const handleAddHistory = (item: {
    type?: string;
    message: string;
    prediction: string;
    probability: number;
    model: string;
    timestamp: string;
  }) => {
    const newItem: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...item,
    };
    setHistory((prev) => [newItem, ...prev.slice(0, 24)]); // Keep last 25 items in session
  };

  const handleClearHistory = () => {
    setHistory([]);
    toast("Session analysis history cleared", "info");
  };

  const handleModelChange = (modelId: "naive_bayes" | "logistic_regression") => {
    setActiveModelId(modelId);
    toast(
      `Switched to ${modelId === "naive_bayes" ? "Multinomial Naive Bayes" : "Logistic Regression"}`,
      "info"
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#202124] selection:bg-[#F2F0FF] selection:text-[#6D5DFB]">
      {/* Global Drag & Drop Listener */}
      <GlobalDropZone />

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        activeModelId={activeModelId}
        onSelectModel={handleModelChange}
        onClearHistory={handleClearHistory}
      />

      {/* Platform Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        activeModelId={activeModelId}
        onSelectModel={handleModelChange}
        onClearHistory={handleClearHistory}
      />

      {/* Floating AI Security Copilot Drawer */}
      <SecurityCopilot
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        currentRiskScore={
          history.length > 0 ? Math.round((history[0].probability ?? 0.1) * 100) : 0
        }
        threatLevel={
          history.length > 0 && (history[0].probability ?? 0) > 0.5 ? "SUSPICIOUS" : "SAFE"
        }
        activeText={detectorMessage}
      />

      {/* Navigation Header */}
      <Navbar
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenCopilot={() => setCopilotOpen((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* 1. Hero Area with Interactive Quick Ingress */}
        <Hero />

        {/* 2. Live System Status & Telemetry KPIs */}
        <LiveSystemStatus lastInferenceLatencyMs={lastInferenceLatencyMs} />

        {/* 3. Universal Threat Scanner (Centerpiece SaaS Console) */}
        <MultimodalWorkspace
          initialMessage={detectorMessage}
          activeModelId={activeModelId}
          onSelectModel={handleModelChange}
          onAddHistory={handleAddHistory}
          onRecordLatency={setLastInferenceLatencyMs}
          onOpenCopilot={() => setCopilotOpen(true)}
        />

        {/* 4. Interactive Threat Signal Map (Visual Vector Topology) */}
        <ThreatSignalMap />

        {/* 5. Personal Security Center & Session Risk Trend */}
        <SecurityCenter history={history} onSelectMessage={handleSelectMessage} />

        {/* 6. Interactive Threat Education (Learn About Threats) */}
        <ThreatEducation />

        {/* 6b. Interactive Side-by-Side Message Comparison */}
        <CompareMessages />

        {/* 6c. Interactive Security Training Micro-Quiz */}
        <SecurityTraining />

        {/* 7. Fully Animated 'How SpamGuard Works' Demo */}
        <div id="demo">
          <ProductDemo />
        </div>

        {/* 8. Session-Only Prediction History Timeline */}
        <div id="history">
          <PredictionHistory
            history={history}
            onClearHistory={handleClearHistory}
            onSelectMessage={handleSelectMessage}
          />
        </div>

        {/* 9. Searchable Dataset Explorer (5,572 messages) */}
        <DatasetExplorer onSelectMessage={handleSelectMessage} />

        {/* 10. Exploratory Corpus Analytics */}
        <TextAnalysis />

        {/* 11. 8-Stage NLP Preprocessing Pipeline Visualizer */}
        <NLPipeline />

        {/* 12. Model Lab: Comparison & Benchmarking Playground */}
        <div id="models">
          <ModelComparison
            activeModelId={activeModelId}
            onSelectModel={(id) => handleModelChange(id as "naive_bayes" | "logistic_regression")}
          />
        </div>

        {/* 13. Evaluation Suite: Confusion Matrix & Classification Threshold Explorer */}
        <div id="evaluation">
          <ConfusionMatrix
            metadata={metadata}
            activeModelId={activeModelId}
            onSelectModel={handleModelChange}
            onSelectMessage={handleSelectMessage}
          />
          <ThresholdExplorer
            metadata={metadata}
            activeModelId={activeModelId}
            onSelectModel={handleModelChange}
          />
        </div>

        {/* 14. Multimodal System Architecture Flow */}
        <SystemArchitecture />

        {/* 15. Technical Deep Dive & Linguistic Signals */}
        <TechnicalDeepDive />

        {/* 16. Privacy Center & Data Lifecycle Governance */}
        <PrivacyCenter />

        {/* 17. API Diagnostics & Telemetry Monitor */}
        <ApiDiagnostics lastInferenceLatencyMs={lastInferenceLatencyMs} />

        {/* 18. Project Summary & Architecture Highlights */}
        <AboutProject />
      </main>

      {/* Floating Bottom-Right Copilot Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setCopilotOpen((prev) => !prev)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white shadow-lg shadow-[#6D5DFB]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer font-bold text-xs"
          title="Open AI Security Copilot"
        >
          <Bot className="w-4 h-4" />
          <span>Security Copilot</span>
        </button>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}
