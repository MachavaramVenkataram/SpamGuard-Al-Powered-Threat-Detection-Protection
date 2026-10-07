"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Zap,
  Clock,
  Code,
  ShieldCheck,
} from "lucide-react";
import { checkHealth, HealthResponse } from "@/lib/api";

interface ApiDiagnosticsProps {
  lastInferenceLatencyMs?: number | null;
}

export default function ApiDiagnostics({
  lastInferenceLatencyMs = null,
}: ApiDiagnosticsProps) {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [pingLatencyMs, setPingLatencyMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<string>("Not checked yet");
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  const testPing = async () => {
    setLoading(true);
    const t0 = performance.now();
    try {
      const res = await checkHealth();
      const elapsed = Math.round(performance.now() - t0);
      setHealthData(res);
      setPingLatencyMs(elapsed);
      setIsHealthy(res.status === "healthy");
      setLastChecked(new Date().toLocaleTimeString());
    } catch {
      setIsHealthy(false);
      setPingLatencyMs(null);
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testPing();
    const interval = setInterval(testPing, 30000);
    return () => clearInterval(interval);
  }, []);

  const endpoints = [
    { method: "GET", path: "/health", desc: "Service status, model readiness, and loaded pipelines" },
    { method: "GET", path: "/dataset-summary", desc: "Corpus statistics (5,572 messages, 13.41% spam)" },
    { method: "GET", path: "/dataset-records", desc: "Live paginated search, filter by label, and sorting" },
    { method: "GET", path: "/dataset-analysis", desc: "Token frequencies and character length distribution" },
    { method: "GET", path: "/model-metrics", desc: "Confusion matrix samples and threshold trade-off curves" },
    { method: "POST", path: "/preprocess-preview", desc: "8-stage real-time text transformation trace" },
    { method: "POST", path: "/predict", desc: "Sub-millisecond classification and linguistic risk signals" },
  ];

  return (
    <section id="diagnostics" className="py-16 md:py-20 bg-slate-50/60 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 mb-2">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              <span>Telemetry &amp; Service Health</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              API Diagnostics &amp; Real-Time Health Monitor
            </h2>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Live status, ping response time, and endpoint inventory connecting the Next.js client to the FastAPI backend microservice on port 8008.
            </p>
          </div>

          <button
            onClick={testPing}
            disabled={loading}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            <span>Ping Service</span>
          </button>
        </div>

        {/* Live Diagnostics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: API Operational Status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">API Status</span>
              <Server className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isHealthy ? "bg-emerald-500 animate-pulse" : isHealthy === false ? "bg-rose-500" : "bg-amber-400"
                }`}
              />
              <span className="text-lg font-black text-slate-900">
                {isHealthy ? "Operational" : isHealthy === false ? "Unavailable" : "Checking..."}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Port: 8008 • FastUvicorn ASGI
            </p>
          </div>

          {/* Card 2: Ping Latency */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Ping Latency</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-indigo-600 font-mono">
                {pingLatencyMs !== null ? pingLatencyMs : "--"}
              </span>
              <span className="text-xs font-semibold text-slate-500">ms</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Last checked: {lastChecked}
            </p>
          </div>

          {/* Card 3: Backend Inference Latency */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Inference Timing</span>
              <Zap className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-600 font-mono">
                {lastInferenceLatencyMs !== null ? `${lastInferenceLatencyMs}` : "< 1.0"}
              </span>
              <span className="text-xs font-semibold text-slate-500">ms</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Vectorization + Model Log-odds
            </p>
          </div>

          {/* Card 4: Model Status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Model Ready</span>
              <ShieldCheck className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-slate-900">
                {healthData?.model_status?.is_ready ? "Dual Loaded" : isHealthy ? "Online" : "Offline"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              NB (α=0.1) &amp; LR (C=1.0)
            </p>
          </div>
        </div>

        {/* Endpoint Catalog Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Code className="w-3.5 h-3.5 text-indigo-600" />
              <span>Registered Production Endpoints (FastAPI)</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">7 Active Endpoints</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs font-mono">
            {endpoints.map((ep, i) => (
              <div
                key={i}
                className="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ep.method === "GET"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-bold text-slate-900">{ep.path}</span>
                </div>
                <span className="text-slate-500 font-sans text-xs">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
