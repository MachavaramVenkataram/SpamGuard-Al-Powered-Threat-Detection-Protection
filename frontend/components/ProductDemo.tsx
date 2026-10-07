"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  SkipForward,
  Volume2,
  VolumeX,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Layers,
  Cpu,
  Binary,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Mail,
  Link2,
  Image as ImageIcon,
  Smartphone,
  Eye,
  Check,
  TrendingUp,
  Activity,
  Compass,
} from "lucide-react";

type DemoMode = "text" | "email" | "url" | "image" | "screenshot";

interface DemoStage {
  id: number;
  label: string;
  sub: string;
  durationMs: number; // default duration at 1x
}

const STAGES: DemoStage[] = [
  { id: 0, label: "Incoming Message", sub: "Untrusted Ingress", durationMs: 3200 },
  { id: 1, label: "Content Intake", sub: "Signal Inspection", durationMs: 3000 },
  { id: 2, label: "NLP Preprocessing", sub: "Cleaning & Tokens", durationMs: 3500 },
  { id: 3, label: "TF-IDF Extraction", sub: "4,000 Dimensions", durationMs: 3400 },
  { id: 4, label: "ML Inference", sub: "Multinomial Naive Bayes", durationMs: 3200 },
  { id: 5, label: "Model Decision", sub: "Probability Distribution", durationMs: 3000 },
  { id: 6, label: "Threat Signals", sub: "Linguistic Evidence", durationMs: 3400 },
  { id: 7, label: "Explainability", sub: "Why Was This Flagged?", durationMs: 3200 },
  { id: 8, label: "Final Verdict", sub: "High Risk & Action Center", durationMs: 4000 },
];

export default function ProductDemo() {
  const [demoMode, setDemoMode] = useState<DemoMode>("text");
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasStartedOnce, setHasStartedOnce] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [highlightedSignal, setHighlightedSignal] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sound generator using Web Audio API (subtle, non-intrusive)
  const playBeep = (freq = 440, type: OscillatorType = "sine", duration = 0.08) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context restricted or unavailable
    }
  };

  // Autoplay on intersection observer (runs once)
  useEffect(() => {
    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setStageIndex(8); // jump straight to complete static state
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStartedOnce) {
            setHasStartedOnce(true);
            setIsPlaying(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasStartedOnce]);

  // Stepper loop
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const currentStage = STAGES[stageIndex];
    const duration = currentStage.durationMs / playbackSpeed;

    timerRef.current = setTimeout(() => {
      if (stageIndex < STAGES.length - 1) {
        setStageIndex((prev) => prev + 1);
        playBeep(520 + stageIndex * 40);
      } else {
        setIsPlaying(false); // Finished loop
        playBeep(880, "triangle", 0.2);
      }
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, stageIndex, playbackSpeed]);

  const handlePlayPause = () => {
    if (stageIndex >= STAGES.length - 1) {
      setStageIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
    playBeep(440);
  };

  const handleReplay = () => {
    setStageIndex(0);
    setIsPlaying(true);
    playBeep(600);
  };

  const handleSkip = () => {
    setStageIndex(STAGES.length - 1);
    setIsPlaying(false);
    playBeep(700);
  };

  const handleJumpToLive = () => {
    const el = document.getElementById("workspace");
    if (el) {
      // Pass the demo message to the actual workspace
      window.dispatchEvent(
        new CustomEvent("load-workspace-text", {
          detail: "URGENT! Congratulations! You have won a £1,000 cash prize. Claim your reward now by visiting https://example.invalid/claim",
        })
      );
      window.dispatchEvent(new CustomEvent("switch-workspace-mode", { detail: "text" }));
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Demo tokens for stage 2 and 3
  const demoTokens = [
    { token: "urgent", weight: 0.318, spam: true, category: "Urgency" },
    { token: "congratulations", weight: 0.264, spam: true, category: "Prize" },
    { token: "won", weight: 0.295, spam: true, category: "Prize" },
    { token: "cash", weight: 0.281, spam: true, category: "Financial" },
    { token: "prize", weight: 0.384, spam: true, category: "Prize" },
    { token: "claim", weight: 0.342, spam: true, category: "Action" },
    { token: "reward", weight: 0.251, spam: true, category: "Prize" },
    { token: "url_link", weight: 0.412, spam: true, category: "Link" },
  ];

  return (
    <section
      id="demo"
      ref={containerRef}
      className="py-16 md:py-24 bg-[#FAF9F6] border-b border-[#E8E6E1] relative overflow-hidden"
    >
      {/* Subtle background ambient mesh */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-rose-200/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-grid-ivory opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E8E6E1] text-xs font-semibold text-[#202124] mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#6D5DFB]" />
            <span className="tracking-wide uppercase font-bold text-[10px] text-[#5F6368]">
              Interactive Product Demo
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#38C9A7] animate-pulse" />
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#202124] tracking-tight">
            See SpamGuard in Action
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#5F6368] font-medium max-w-2xl mx-auto">
            From raw message to explainable AI verdict — watch the complete detection pipeline.
          </p>

          {/* Multimodal Demo Type Selector */}
          <div className="mt-6 inline-flex p-1 rounded-xl bg-white border border-[#E8E6E1] shadow-2xs gap-1">
            <button
              onClick={() => {
                setDemoMode("text");
                handleReplay();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                demoMode === "text"
                  ? "bg-[#6D5DFB] text-white shadow-xs"
                  : "text-[#5F6368] hover:text-[#202124] hover:bg-[#FAF9F6]"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Text SMS</span>
            </button>
            <button
              onClick={() => {
                setDemoMode("email");
                handleReplay();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                demoMode === "email"
                  ? "bg-[#6D5DFB] text-white shadow-xs"
                  : "text-[#5F6368] hover:text-[#202124] hover:bg-[#FAF9F6]"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Header</span>
            </button>
            <button
              onClick={() => {
                setDemoMode("url");
                handleReplay();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                demoMode === "url"
                  ? "bg-[#6D5DFB] text-white shadow-xs"
                  : "text-[#5F6368] hover:text-[#202124] hover:bg-[#FAF9F6]"
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>URL Intelligence</span>
            </button>
            <button
              onClick={() => {
                setDemoMode("image");
                handleReplay();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                demoMode === "image"
                  ? "bg-[#6D5DFB] text-white shadow-xs"
                  : "text-[#5F6368] hover:text-[#202124] hover:bg-[#FAF9F6]"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Image OCR</span>
            </button>
            <button
              onClick={() => {
                setDemoMode("screenshot");
                handleReplay();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                demoMode === "screenshot"
                  ? "bg-[#6D5DFB] text-white shadow-xs"
                  : "text-[#5F6368] hover:text-[#202124] hover:bg-[#FAF9F6]"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Screenshot</span>
            </button>
          </div>
        </div>

        {/* Cinematic Demo Stage Stepper Indicator */}
        <div className="hidden lg:grid grid-cols-9 gap-2 mb-6">
          {STAGES.map((st, i) => {
            const isActive = stageIndex === i;
            const isCompleted = stageIndex > i;
            return (
              <div
                key={st.id}
                onClick={() => {
                  setStageIndex(i);
                  setIsPlaying(false);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? "bg-white border-[#6D5DFB] shadow-md shadow-[#6D5DFB]/10 ring-2 ring-[#6D5DFB]/20"
                    : isCompleted
                    ? "bg-white/80 border-[#38C9A7]/40 text-[#202124]"
                    : "bg-white/40 border-[#E8E6E1] text-[#5F6368]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono font-bold text-[#5F6368]">0{i + 1}</span>
                  {isCompleted ? (
                    <Check className="w-3 h-3 text-[#38C9A7]" />
                  ) : isActive ? (
                    <span className="w-2 h-2 rounded-full bg-[#6D5DFB] animate-ping" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E8E6E1]" />
                  )}
                </div>
                <p className="text-[11px] font-bold leading-tight truncate text-[#202124]">{st.label}</p>
                <p className="text-[9px] text-[#5F6368] truncate font-mono mt-0.5">{st.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Mobile Stage Progress Bar */}
        <div className="lg:hidden flex items-center justify-between mb-4 px-1 text-xs">
          <span className="font-mono text-[11px] text-[#5F6368]">
            Stage {stageIndex + 1} of {STAGES.length}:{" "}
            <strong className="text-[#202124]">{STAGES[stageIndex].label}</strong>
          </span>
          <span className="text-[10px] font-bold text-[#6D5DFB] bg-[#F2F0FF] px-2 py-0.5 rounded">
            {STAGES[stageIndex].sub}
          </span>
        </div>

        {/* CINEMATIC ANIMATED DEMO WORKSPACE CANVAS */}
        <div className="bg-white rounded-2xl border border-[#E8E6E1] shadow-lg shadow-black/[0.03] overflow-hidden min-h-[480px] flex flex-col justify-between">
          {/* Workspace Title Bar */}
          <div className="px-5 py-3.5 bg-[#FAF9F6] border-b border-[#E8E6E1] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#F5B942]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#38C9A7]" />
              <span className="ml-2 text-xs font-mono font-bold text-[#202124]">
                SpamGuard Intelligence Pipeline Canvas
              </span>
              <span className="hidden sm:inline px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-white border border-[#E8E6E1] text-[#5F6368]">
                Mode: {demoMode.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-[#5F6368]">
              <span className="hidden md:flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#38C9A7]" />
                <span>Simulated Latency: 12.4ms</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-white border border-[#E8E6E1] text-[10px] font-bold text-[#6D5DFB]">
                Stage {stageIndex + 1}/{STAGES.length}
              </span>
            </div>
          </div>

          {/* Interactive Scene Canvas Body */}
          <div className="p-6 sm:p-10 flex-1 flex flex-col justify-center">
            {/* SCENE 0: Message Arrives */}
            {stageIndex === 0 && (
              <div className="max-w-2xl mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
                <div className="text-center mb-4">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-[#FFF0F0] text-[#FF6B6B] border border-[#FFD4D4]">
                    DEMO MESSAGE &bull; UNTRUSTED INCOMING CARRIER
                  </span>
                </div>

                <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-[#E8E6E1] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E8E6E1] text-xs">
                    <div>
                      <span className="text-[#5F6368] font-mono">From: </span>
                      <strong className="text-[#202124]">unknown-sender@example.com</strong>
                    </div>
                    <span className="text-[11px] font-mono text-[#5F6368]">Just now</span>
                  </div>

                  <div>
                    <span className="text-xs text-[#5F6368] font-mono">Subject: </span>
                    <strong className="text-sm text-[#202124]">Congratulations! You Won!</strong>
                  </div>

                  <div className="pt-2 text-sm text-[#202124] leading-relaxed font-mono bg-white p-4 rounded-xl border border-[#E8E6E1]">
                    <span className="text-[#FF6B6B] font-bold">URGENT! </span>
                    <span>Congratulations! You have won a </span>
                    <span className="bg-[#FFF0F0] text-[#FF6B6B] px-1 py-0.5 rounded font-bold">£1,000 cash prize</span>
                    <span>. Claim your reward now by visiting the link below:</span>
                    <div className="mt-2 text-xs text-[#6D5DFB] underline font-semibold break-all">
                      https://example.invalid/claim
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#5F6368]">
                  <span className="w-2 h-2 rounded-full bg-[#6D5DFB] animate-pulse" />
                  <span>Payload arriving at SpamGuard ingestion gateway...</span>
                </div>
              </div>
            )}

            {/* SCENE 1: Content Ingestion */}
            {stageIndex === 1 && (
              <div className="max-w-2xl mx-auto w-full animate-in fade-in duration-300">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-[#202124]">Content Intake &amp; Entity Identification</h3>
                  <p className="text-xs text-[#5F6368]">
                    Scanning message components and cataloging structural payload carriers
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6E1] flex items-center gap-3 animate-in slide-in-from-left duration-200">
                    <CheckCircle2 className="w-4 h-4 text-[#38C9A7]" />
                    <div>
                      <h4 className="text-xs font-bold text-[#202124]">Plain Text Payload</h4>
                      <p className="text-[10px] text-[#5F6368]">118 characters &bull; 19 words identified</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#FFD4D4] flex items-center gap-3 animate-in slide-in-from-right duration-250">
                    <AlertTriangle className="w-4 h-4 text-[#FF6B6B]" />
                    <div>
                      <h4 className="text-xs font-bold text-[#202124]">Embedded URL Detected</h4>
                      <p className="text-[10px] font-mono text-[#FF6B6B]">https://example.invalid/claim</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#FCE1B6] flex items-center gap-3 animate-in slide-in-from-left duration-300">
                    <AlertTriangle className="w-4 h-4 text-[#F5B942]" />
                    <div>
                      <h4 className="text-xs font-bold text-[#202124]">Currency Reference</h4>
                      <p className="text-[10px] font-mono text-[#F5B942]">£1,000 cash prize identifier</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#FFD4D4] flex items-center gap-3 animate-in slide-in-from-right duration-350">
                    <AlertTriangle className="w-4 h-4 text-[#FF6B6B]" />
                    <div>
                      <h4 className="text-xs font-bold text-[#202124]">Urgency Psychological Trigger</h4>
                      <p className="text-[10px] font-mono text-[#FF6B6B]">"URGENT!", "now" markers</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#E8E6E1] rounded-xl text-center text-xs text-[#5F6368] font-mono">
                  Ingress checks complete: <strong className="text-[#FF6B6B]">4 High-Risk Markers Found</strong> &bull; Passing to NLP Engine
                </div>
              </div>
            )}

            {/* SCENE 2: NLP Preprocessing */}
            {stageIndex === 2 && (
              <div className="max-w-3xl mx-auto w-full animate-in fade-in duration-300">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-[#202124]">NLP Preprocessing &amp; Tokenization</h3>
                  <p className="text-xs text-[#5F6368]">
                    Transforming noisy human text into normalized mathematical token sequences
                  </p>
                </div>

                <div className="space-y-3 mb-6 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E6E1]">
                    <span className="text-[10px] uppercase font-bold text-[#5F6368] block mb-1">Original Text:</span>
                    <p className="text-[#202124]">
                      "URGENT! Congratulations! You have won a £1,000 cash prize. Claim your reward now by visiting https://example.invalid/claim"
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E6E1]">
                    <span className="text-[10px] uppercase font-bold text-[#6D5DFB] block mb-1">
                      Lowercasing &amp; Carrier Normalization:
                    </span>
                    <p className="text-[#5F6368]">
                      "urgent congratulations you have won a <strong className="text-[#F5B942]">_CURRENCY_</strong> cash prize claim your reward now by visiting <strong className="text-[#FF6B6B]">_URL_</strong>"
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#202124] block mb-2">
                      Extracted Clean Tokens (Stopwords pruned):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {demoTokens.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#DCD8FF] text-[#6D5DFB] font-bold text-xs shadow-2xs animate-in zoom-in duration-200"
                          style={{ animationDelay: `${idx * 60}ms` }}
                        >
                          {t.token}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SCENE 3: TF-IDF Feature Extraction */}
            {stageIndex === 3 && (
              <div className="max-w-3xl mx-auto w-full animate-in fade-in duration-300">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-[#202124]">TF-IDF 4,000-Dimensional Vector Space</h3>
                  <p className="text-xs text-[#5F6368]">
                    Computing sublinear term frequencies across the SMS Spam Collection corpus
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {demoTokens.slice(0, 4).map((t, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white border border-[#E8E6E1] shadow-2xs">
                      <div className="flex items-center justify-between text-[10px] text-[#5F6368] mb-1 font-mono">
                        <span>Token</span>
                        <span className="text-[#6D5DFB]">{t.category}</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#202124]">{t.token}</h4>
                      <div className="mt-2 flex items-center justify-between text-xs font-mono">
                        <span className="text-[#5F6368]">Weight:</span>
                        <strong className="text-[#FF6B6B]">{t.weight.toFixed(3)}</strong>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full bg-[#FAF9F6] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#6D5DFB] rounded-full transition-all duration-500"
                          style={{ width: `${t.weight * 200}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E6E1] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                  <div>
                    <span className="text-[#5F6368]">Vector Shape:</span>{" "}
                    <strong className="text-[#202124]">(1, 4000) Sparse CSR Matrix</strong>
                  </div>
                  <div>
                    <span className="text-[#5F6368]">Active Features:</span>{" "}
                    <strong className="text-[#6D5DFB]">8 Non-Zero Dimensions</strong>
                  </div>
                  <div>
                    <span className="text-[#5F6368]">Normalization:</span>{" "}
                    <strong className="text-[#38C9A7]">Euclidean L2</strong>
                  </div>
                </div>
              </div>
            )}

            {/* SCENE 4: ML Model Inference */}
            {stageIndex === 4 && (
              <div className="max-w-2xl mx-auto w-full animate-in fade-in duration-300">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-[#202124]">Supervised Machine Learning Inference</h3>
                  <p className="text-xs text-[#5F6368]">
                    Evaluating posterior probability P(Spam|X) via Multinomial Naive Bayes (α=0.1)
                  </p>
                </div>

                <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-[#E8E6E1] shadow-2xs mb-6 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#202124] flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#6D5DFB]" />
                      <span>Model: MultinomialNB</span>
                    </span>
                    <span className="font-mono text-[#38C9A7] font-semibold">Trained on 4,457 messages</span>
                  </div>

                  {/* Flowing Animation Progress */}
                  <div>
                    <div className="flex justify-between text-xs font-mono text-[#5F6368] mb-1.5">
                      <span>Computing Log-Likelihoods...</span>
                      <span>100%</span>
                    </div>
                    <div className="h-2.5 w-full bg-white border border-[#E8E6E1] rounded-full overflow-hidden p-0.5">
                      <div className="h-full bg-gradient-to-r from-[#6D5DFB] via-[#FF6B6B] to-[#E96A9A] rounded-full animate-pulse w-full" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                    <div className="p-3 bg-white rounded-xl border border-[#E8E6E1]">
                      <span className="text-[#5F6368] block text-[10px]">Decision Formula</span>
                      <strong className="text-[#202124] text-[11px]">arg max P(C) ∏ P(w|C)</strong>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#E8E6E1]">
                      <span className="text-[#5F6368] block text-[10px]">Laplace Smoothing</span>
                      <strong className="text-[#202124] text-[11px]">α = 0.1 (Calibrated)</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SCENE 5: Model Decision */}
            {stageIndex === 5 && (
              <div className="max-w-2xl mx-auto w-full animate-in fade-in duration-300">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-[#202124]">Calibrated Class Probability Distribution</h3>
                  <p className="text-xs text-[#5F6368]">
                    Comparing likelihood of legitimate communication versus fraudulent spam
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Spam Probability Bar */}
                  <div className="p-4 rounded-xl bg-white border border-[#FFD4D4] shadow-xs">
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      <span className="flex items-center gap-2 text-[#FF6B6B]">
                        <ShieldAlert className="w-4 h-4" />
                        <span>SPAM PROBABILITY</span>
                      </span>
                      <span className="text-base font-mono text-[#FF6B6B]">99.6%</span>
                    </div>
                    <div className="h-3 w-full bg-[#FFF0F0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#FF6B6B] rounded-full transition-all duration-700"
                        style={{ width: "99.6%" }}
                      />
                    </div>
                    <p className="text-[10px] text-[#5F6368] mt-1.5 font-mono">
                      Overwhelming posterior evidence toward malicious classification
                    </p>
                  </div>

                  {/* Ham Probability Bar */}
                  <div className="p-4 rounded-xl bg-white border border-[#E8E6E1] shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      <span className="flex items-center gap-2 text-[#38C9A7]">
                        <ShieldCheck className="w-4 h-4" />
                        <span>HAM (NOT SPAM) PROBABILITY</span>
                      </span>
                      <span className="text-base font-mono text-[#38C9A7]">0.4%</span>
                    </div>
                    <div className="h-3 w-full bg-[#EDFBF7] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#38C9A7] rounded-full transition-all duration-700"
                        style={{ width: "0.4%" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF9F6] border border-[#E8E6E1] rounded-xl text-center text-xs text-[#5F6368] font-mono">
                  Classification Threshold: <strong className="text-[#202124]">T = 0.50</strong> &bull; Verdict Confirmed: <strong className="text-[#FF6B6B]">SPAM (Confidence 99.6%)</strong>
                </div>
              </div>
            )}

            {/* SCENE 6: Threat Signals */}
            {stageIndex === 6 && (
              <div className="max-w-3xl mx-auto w-full animate-in fade-in duration-300">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-[#202124]">Suspicious Indicators Identified</h3>
                  <p className="text-xs text-[#5F6368]">
                    Synthesizing lexical, psychological, financial, and URL threat signals
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  <div
                    onMouseEnter={() => setHighlightedSignal("urgency")}
                    onMouseLeave={() => setHighlightedSignal(null)}
                    className="p-3.5 rounded-xl bg-white border border-[#FFD4D4] shadow-2xs hover:border-[#FF6B6B] transition-all cursor-pointer"
                  >
                    <span className="text-xs font-bold text-[#FF6B6B] flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Urgency Language</span>
                    </span>
                    <p className="text-[11px] text-[#5F6368]">"URGENT!", "now" create psychological pressure.</p>
                  </div>

                  <div
                    onMouseEnter={() => setHighlightedSignal("prize")}
                    onMouseLeave={() => setHighlightedSignal(null)}
                    className="p-3.5 rounded-xl bg-white border border-[#FCE1B6] shadow-2xs hover:border-[#F5B942] transition-all cursor-pointer"
                  >
                    <span className="text-xs font-bold text-[#F5B942] flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Prize / Reward Trap</span>
                    </span>
                    <p className="text-[11px] text-[#5F6368]">"won", "cash prize", "reward" incentive.</p>
                  </div>

                  <div
                    onMouseEnter={() => setHighlightedSignal("financial")}
                    onMouseLeave={() => setHighlightedSignal(null)}
                    className="p-3.5 rounded-xl bg-white border border-[#FFD4D4] shadow-2xs hover:border-[#FF6B6B] transition-all cursor-pointer"
                  >
                    <span className="text-xs font-bold text-[#FF6B6B] flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Financial Incentive</span>
                    </span>
                    <p className="text-[11px] text-[#5F6368]">Specific monetary bait (£1,000 cash).</p>
                  </div>

                  <div
                    onMouseEnter={() => setHighlightedSignal("cta")}
                    onMouseLeave={() => setHighlightedSignal(null)}
                    className="p-3.5 rounded-xl bg-white border border-[#E8E6E1] shadow-2xs hover:border-[#6D5DFB] transition-all cursor-pointer"
                  >
                    <span className="text-xs font-bold text-[#202124] flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#6D5DFB]" />
                      <span>Call-to-Action</span>
                    </span>
                    <p className="text-[11px] text-[#5F6368]">Direct command encouraging instant response.</p>
                  </div>

                  <div
                    onMouseEnter={() => setHighlightedSignal("url")}
                    onMouseLeave={() => setHighlightedSignal(null)}
                    className="p-3.5 rounded-xl bg-white border border-[#FFD4D4] shadow-2xs hover:border-[#FF6B6B] transition-all cursor-pointer"
                  >
                    <span className="text-xs font-bold text-[#FF6B6B] flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Suspicious URL Link</span>
                    </span>
                    <p className="text-[11px] text-[#5F6368]">External link masking redirection risk.</p>
                  </div>

                  <div
                    onMouseEnter={() => setHighlightedSignal("sender")}
                    onMouseLeave={() => setHighlightedSignal(null)}
                    className="p-3.5 rounded-xl bg-white border border-[#E8E6E1] shadow-2xs hover:border-[#5F6368] transition-all cursor-pointer"
                  >
                    <span className="text-xs font-bold text-[#5F6368] flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Unknown Sender</span>
                    </span>
                    <p className="text-[11px] text-[#5F6368]">Unsolicited origin lacking trust history.</p>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF9F6] border border-[#E8E6E1] rounded-xl text-center text-xs text-[#5F6368]">
                  Hover any card above to highlight corresponding trigger in the message
                </div>
              </div>
            )}

            {/* SCENE 7: Explainable AI */}
            {stageIndex === 7 && (
              <div className="max-w-3xl mx-auto w-full animate-in fade-in duration-300">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-[#202124]">Why Was This Flagged? &bull; AI Explanation</h3>
                  <p className="text-xs text-[#5F6368]">
                    Transparent rationale combining statistical weights with human-readable evidence
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-white border border-[#E8E6E1] shadow-2xs space-y-2.5">
                    <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#FF6B6B]" />
                      <span>High-Risk Linguistic Evidence</span>
                    </h4>
                    <ul className="text-xs text-[#5F6368] space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="text-[#FF6B6B] font-bold">&bull;</span>
                        <span>Prize-related terminology ('won', 'cash prize')</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#FF6B6B] font-bold">&bull;</span>
                        <span>Urgent call to action demanding immediate compliance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#FF6B6B] font-bold">&bull;</span>
                        <span>Financial incentive coupled with external web destination</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#FF6B6B] font-bold">&bull;</span>
                        <span>Suspicious unverified link path</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-[#E8E6E1] shadow-2xs space-y-2.5">
                    <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#6D5DFB]" />
                      <span>Model Feature Weights</span>
                    </h4>
                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between text-[#5F6368]">
                        <span>prize</span>
                        <strong className="text-[#FF6B6B]">+0.384 (Spam)</strong>
                      </div>
                      <div className="flex justify-between text-[#5F6368]">
                        <span>claim</span>
                        <strong className="text-[#FF6B6B]">+0.342 (Spam)</strong>
                      </div>
                      <div className="flex justify-between text-[#5F6368]">
                        <span>urgent</span>
                        <strong className="text-[#FF6B6B]">+0.318 (Spam)</strong>
                      </div>
                      <div className="flex justify-between text-[#5F6368]">
                        <span>won</span>
                        <strong className="text-[#FF6B6B]">+0.295 (Spam)</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-[#5F6368] text-center italic">
                  Note: Linguistic signals represent supporting correlation evidence rather than absolute explanations.
                </p>
              </div>
            )}

            {/* SCENE 8: Final Verdict (Climax) */}
            {stageIndex === 8 && (
              <div className="max-w-2xl mx-auto w-full animate-in zoom-in-95 duration-400">
                <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#FFD4D4] shadow-xl text-center space-y-5">
                  <div className="inline-flex p-3 rounded-2xl bg-[#FFF0F0] text-[#FF6B6B] border border-[#FFD4D4] shadow-xs">
                    <ShieldAlert className="w-10 h-10 animate-bounce" />
                  </div>

                  <div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-[#FF6B6B] text-white tracking-wider">
                      HIGH RISK &bull; SPAM DETECTED
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-[#202124] mt-3 tracking-tight">
                      Malicious Promotional Phishing Trap
                    </h3>
                    <p className="text-xs text-[#5F6368] mt-1">
                      Probability: <strong className="text-[#FF6B6B] font-mono">99.6%</strong> &bull; Composite Threat Score:{" "}
                      <strong className="text-[#FF6B6B] font-mono">98 / 100</strong>
                    </p>
                  </div>

                  {/* Circular / Multi-Axis Risk Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6E1]">
                      <span className="text-[10px] text-[#5F6368] block">Text Risk</span>
                      <strong className="text-sm text-[#FF6B6B]">96%</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6E1]">
                      <span className="text-[10px] text-[#5F6368] block">URL Risk</span>
                      <strong className="text-sm text-[#FF6B6B]">88%</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6E1]">
                      <span className="text-[10px] text-[#5F6368] block">Sender Risk</span>
                      <strong className="text-sm text-[#F5B942]">75%</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#E8E6E1]">
                      <span className="text-[10px] text-[#5F6368] block">Content Risk</span>
                      <strong className="text-sm text-[#FF6B6B]">94%</strong>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="p-3.5 rounded-xl bg-[#FFF0F0] border border-[#FFD4D4] text-xs text-[#FF6B6B] font-semibold">
                    Recommendation: Do not click the link, do not reply, and mark sender as spam immediately.
                  </div>

                  {/* Action CTA to Live Detector */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={handleJumpToLive}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white text-xs font-bold shadow-md shadow-[#6D5DFB]/20 transition-all hover:-translate-y-0.5 cursor-pointer"
                    >
                      <span>Analyze a Message &rarr;</span>
                    </button>
                    <button
                      onClick={handleReplay}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FAF9F6] hover:bg-[#E8E6E1] text-[#202124] text-xs font-bold border border-[#E8E6E1] transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Replay Animation</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Control Bar */}
          <div className="px-6 py-4 bg-[#FAF9F6] border-t border-[#E8E6E1] flex flex-wrap items-center justify-between gap-4">
            {/* Play, Pause, Replay */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayPause}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202124] hover:bg-[#333] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title={isPlaying ? "Pause Demo" : "Play Demo"}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? "Pause" : "Play"}</span>
              </button>

              <button
                onClick={handleReplay}
                className="p-1.5 rounded-lg bg-white hover:bg-[#FAF9F6] border border-[#E8E6E1] text-[#202124] text-xs transition-colors cursor-pointer"
                title="Replay from Beginning"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleSkip}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FAF9F6] border border-[#E8E6E1] text-[#5F6368] hover:text-[#202124] text-xs transition-colors cursor-pointer"
                title="Skip to Final Verdict"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Skip</span>
              </button>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[#5F6368] text-[11px] mr-1">Speed:</span>
              {[0.5, 1, 1.5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-1 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                    playbackSpeed === spd
                      ? "bg-[#6D5DFB] text-white"
                      : "bg-white text-[#5F6368] hover:text-[#202124] border border-[#E8E6E1]"
                  }`}
                >
                  {spd}&times;
                </button>
              ))}
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled((p) => !p)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  soundEnabled
                    ? "bg-[#F2F0FF] text-[#6D5DFB] border-[#DCD8FF]"
                    : "bg-white text-[#5F6368] border-[#E8E6E1] hover:text-[#202124]"
                }`}
                title={soundEnabled ? "Mute Demo Sound" : "Enable Demo Sound"}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleJumpToLive}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#6D5DFB] hover:text-[#5B4CE0] transition-colors cursor-pointer"
              >
                <span>Try Live Detection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* End of Section CTA Banner */}
        <div className="mt-12 text-center">
          <p className="text-sm font-bold text-[#202124]">
            Your inbox deserves intelligent protection.
          </p>
          <div className="mt-3 flex items-center justify-center gap-4">
            <button
              onClick={handleJumpToLive}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white text-xs font-bold shadow-md shadow-[#6D5DFB]/15 transition-all cursor-pointer"
            >
              <span>Analyze Your Message &rarr;</span>
            </button>
            <a
              href="#architecture"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF9F6] text-[#202124] text-xs font-bold border border-[#E8E6E1] shadow-2xs transition-all"
            >
              <span>Explore the AI Pipeline</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
