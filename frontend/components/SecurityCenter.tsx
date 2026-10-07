"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Link2,
  FileText,
  Search,
  CheckCircle2,
  TrendingUp,
  Layers,
  ArrowRight,
  Filter,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { HistoryItem } from "./PredictionHistory";

interface SecurityCenterProps {
  history: HistoryItem[];
  onSelectMessage?: (msg: string) => void;
}

interface ThreatCategory {
  title: string;
  count: number;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  color: string;
  badgeBg: string;
  description: string;
  iconName: string;
}

const THREAT_CATEGORIES: ThreatCategory[] = [
  {
    title: "Phishing & Credential Theft",
    count: 0,
    riskLevel: "CRITICAL",
    color: "#FF6B6B",
    badgeBg: "bg-rose-50 text-rose-800 border-rose-200",
    description: "Fake login forms, identity verification lures, password resets.",
    iconName: "ShieldAlert",
  },
  {
    title: "Spam & Promotional Bulk",
    count: 0,
    riskLevel: "MEDIUM",
    color: "#6D5DFB",
    badgeBg: "bg-violet-50 text-violet-800 border-violet-200",
    description: "Unsolicited promotional broadcasts, sweepstakes, bulk marketing.",
    iconName: "FileText",
  },
  {
    title: "Urgency & Extortion Scams",
    count: 0,
    riskLevel: "HIGH",
    color: "#F5A623",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
    description: "Artificial deadlines, legal threats, account termination panic.",
    iconName: "AlertTriangle",
  },
  {
    title: "Unsafe URLs & Typosquatting",
    count: 0,
    riskLevel: "CRITICAL",
    color: "#E96A9A",
    badgeBg: "bg-pink-50 text-pink-800 border-pink-200",
    description: "Lookalike domains, IP-address links, open redirects, suspicious TLDs.",
    iconName: "Link2",
  },
  {
    title: "Financial & Wire Scams",
    count: 0,
    riskLevel: "CRITICAL",
    color: "#38C9A7",
    badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    description: "Fraudulent invoices, cryptocurrency addresses, gift card demands.",
    iconName: "Activity",
  },
  {
    title: "Brand Impersonation",
    count: 0,
    riskLevel: "HIGH",
    color: "#4F46E5",
    badgeBg: "bg-indigo-50 text-indigo-800 border-indigo-200",
    description: "Spoofing of Apple, PayPal, Microsoft, Amazon, DHL, FedEx.",
    iconName: "Layers",
  },
];

export default function SecurityCenter({ history, onSelectMessage }: SecurityCenterProps) {
  const [trendRange, setTrendRange] = useState<"7d" | "30d" | "all">("7d");

  // Compute live real metrics from session history
  const metrics = useMemo(() => {
    const total = history.length;
    let threats = 0;
    let highRisk = 0;
    let safe = 0;
    let urls = 0;

    history.forEach((h) => {
      const isThreat =
        h.prediction?.toLowerCase().includes("spam") ||
        h.prediction?.toLowerCase().includes("high") ||
        h.prediction?.toLowerCase().includes("critical") ||
        (h.probability && h.probability > 0.5);

      if (isThreat) threats++;
      else safe++;

      if (h.probability && h.probability >= 0.7) highRisk++;
      if (h.type === "url" || h.message?.startsWith("http")) urls++;
    });

    return { total, threats, highRisk, safe, urls };
  }, [history]);

  // Generate trend data from real history or show empty state if none
  const chartData = useMemo(() => {
    if (history.length === 0) return [];

    // Map history items into chronological data points
    const reversed = [...history].reverse();
    return reversed.map((item, idx) => ({
      name: `#${idx + 1}`,
      riskScore: Math.round((item.probability ?? 0.1) * 100),
      time: item.timestamp || `Scan ${idx + 1}`,
    }));
  }, [history]);

  return (
    <section id="security-center" className="py-14 md:py-20 bg-white border-b border-[#E8E6E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF9F6] border border-[#E8E6E1] text-xs font-semibold text-[#202124] shadow-2xs mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-[#6D5DFB]" />
              <span>Personal Security Center</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#202124] tracking-tight">
              Threat Intelligence &amp; Session Center
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#5F6368] max-w-2xl">
              Real-time audit of all scanned content, detected attack vectors, and empirical risk telemetry from your session.
            </p>
          </div>

          <button
            onClick={() => {
              const ws = document.getElementById("workspace");
              if (ws) ws.scrollIntoView({ behavior: "smooth" });
            }}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#6D5DFB] hover:bg-[#5B4CE0] rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <span>Launch Universal Scanner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 5 Real Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-10">
          {/* Card 1: Scans Completed */}
          <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1] shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368]">
              Scans Completed
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#202124] font-mono">
                {metrics.total}
              </span>
              <span className="text-[10px] text-[#5F6368]">sessions</span>
            </div>
            <div className="mt-3 pt-2 border-t border-[#E8E6E1] text-[11px] text-[#5F6368] flex items-center gap-1.5">
              <FileText className="w-3 h-3 text-[#6D5DFB]" />
              <span>Verified local</span>
            </div>
          </div>

          {/* Card 2: Threats Detected */}
          <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1] shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368]">
              Threats Detected
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-3xl font-black font-mono ${metrics.threats > 0 ? "text-[#FF6B6B]" : "text-[#202124]"}`}>
                {metrics.threats}
              </span>
              <span className="text-[10px] text-[#5F6368]">flagged</span>
            </div>
            <div className="mt-3 pt-2 border-t border-[#E8E6E1] text-[11px] text-[#5F6368] flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3 text-[#FF6B6B]" />
              <span>&gt;50% probability</span>
            </div>
          </div>

          {/* Card 3: High Risk Items */}
          <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1] shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368]">
              Critical &amp; High Risk
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-3xl font-black font-mono ${metrics.highRisk > 0 ? "text-[#F5A623]" : "text-[#202124]"}`}>
                {metrics.highRisk}
              </span>
              <span className="text-[10px] text-[#5F6368]">severe</span>
            </div>
            <div className="mt-3 pt-2 border-t border-[#E8E6E1] text-[11px] text-[#5F6368] flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-[#F5A623]" />
              <span>&gt;70% risk index</span>
            </div>
          </div>

          {/* Card 4: Safe Content */}
          <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1] shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368]">
              Safe Messages
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#38C9A7] font-mono">
                {metrics.safe}
              </span>
              <span className="text-[10px] text-[#5F6368]">benign</span>
            </div>
            <div className="mt-3 pt-2 border-t border-[#E8E6E1] text-[11px] text-[#5F6368] flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-[#38C9A7]" />
              <span>Legitimate ham</span>
            </div>
          </div>

          {/* Card 5: URLs Inspected */}
          <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1] shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368]">
              URLs Inspected
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#6D5DFB] font-mono">
                {metrics.urls}
              </span>
              <span className="text-[10px] text-[#5F6368]">links</span>
            </div>
            <div className="mt-3 pt-2 border-t border-[#E8E6E1] text-[11px] text-[#5F6368] flex items-center gap-1.5">
              <Link2 className="w-3 h-3 text-[#6D5DFB]" />
              <span>RFC lexical audit</span>
            </div>
          </div>
        </div>

        {/* Risk Trend & Threat Categories Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Risk Score Trend Chart (7 Cols) */}
          <div className="lg:col-span-7 bg-[#FAF9F6] rounded-3xl border border-[#E8E6E1] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[#202124] uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#6D5DFB]" />
                  <span>Session Risk Trend</span>
                </h3>
                <p className="text-[11px] text-[#5F6368] mt-0.5">
                  Dynamic risk trajectory across your active analysis session
                </p>
              </div>

              {/* Range Filters */}
              <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-[#E8E6E1] text-[11px] font-mono">
                {(["7d", "30d", "all"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTrendRange(r)}
                    className={`px-2 py-0.5 rounded transition-all ${
                      trendRange === r
                        ? "bg-[#6D5DFB] text-white font-bold"
                        : "text-[#5F6368] hover:text-[#202124]"
                    }`}
                  >
                    {r === "7d" ? "Recent" : r === "30d" ? "Session" : "All"}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Area or Empty State */}
            {chartData.length > 0 ? (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6D5DFB" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6D5DFB" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E6E1" />
                    <XAxis dataKey="name" stroke="#5F6368" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#5F6368" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E8E6E1",
                        borderRadius: "12px",
                        fontSize: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                      formatter={(val: any) => [`${val} / 100`, "Risk Score"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="riskScore"
                      stroke="#6D5DFB"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#riskGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-dashed border-[#E8E6E1] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1] flex items-center justify-center text-[#5F6368]">
                  <Activity className="w-6 h-6 text-[#6D5DFB]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#202124]">No analysis history yet</h4>
                  <p className="text-[11px] text-[#5F6368] mt-1 max-w-xs">
                    Analyze your first message, email, or URL in the scanner above to chart your empirical risk trajectory.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const ws = document.getElementById("workspace");
                    if (ws) ws.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#FAF9F6] hover:bg-[#F2F0FF] border border-[#E8E6E1] text-[11px] font-bold text-[#6D5DFB] transition-colors"
                >
                  Start First Scan
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Threat Categories Grid (5 Cols) */}
          <div className="lg:col-span-5 bg-[#FAF9F6] rounded-3xl border border-[#E8E6E1] p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-black text-[#202124] uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#6D5DFB]" />
                <span>Observed Threat Categories</span>
              </h3>
              <p className="text-[11px] text-[#5F6368] mt-0.5">
                Core communication risk taxonomy mapped by SpamGuard
              </p>
            </div>

            <div className="space-y-2.5">
              {THREAT_CATEGORIES.map((cat, i) => (
                <div
                  key={i}
                  className="p-3 bg-white rounded-xl border border-[#E8E6E1] hover:border-[#D5D2CB] transition-all flex items-start justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[#202124] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{cat.title}</span>
                    </h4>
                    <p className="text-[11px] text-[#5F6368] mt-0.5 leading-snug">
                      {cat.description}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${cat.badgeBg}`}>
                    {cat.riskLevel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
