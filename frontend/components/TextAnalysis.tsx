"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, PieChart as PieIcon, Type, Layers, Info } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { fetchDatasetAnalysis, DatasetAnalysis } from "@/lib/api";

const PIE_COLORS = ["#10b981", "#f43f5e"]; // Emerald for Ham, Rose for Spam

export default function TextAnalysis() {
  const [data, setData] = useState<DatasetAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeWordTab, setActiveWordTab] = useState<"spam" | "ham">("spam");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetchDatasetAnalysis();
        setData(res);
      } catch (err: any) {
        setError(err?.message || "Failed to load dataset analysis.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const classData = [
    { name: "Ham (Safe)", value: 4825, percentage: 86.59 },
    { name: "Spam", value: 747, percentage: 13.41 },
  ];

  const topWords = activeWordTab === "spam" ? data?.top_spam_words?.slice(0, 10) || [] : data?.top_ham_words?.slice(0, 10) || [];

  return (
    <section id="analytics" className="py-16 md:py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200/80 text-xs font-semibold text-blue-700 mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Exploratory Data Analysis</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Text Analytics &amp; Feature Distributions
          </h2>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Empirical insights derived from the text corpora. Observe the statistical divergence between legitimate conversational messages and structured commercial spam.
          </p>
        </div>

        {/* Grid: Class Distribution & Message Length */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Class Distribution Donut Chart */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Class Imbalance Distribution</h3>
                </div>
                <span className="text-xs font-mono text-slate-400">Total: 5,572</span>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Real-world email/SMS traffic is heavily skewed towards legitimate messages. The model must handle this class imbalance without high false positive rates.
              </p>

              <div className="h-60 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={88}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {classData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `${Number(val).toLocaleString()} messages (${name.includes("Ham") ? "86.6%" : "13.4%"})`,
                        name,
                      ]}
                      contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-center">
              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100">
                <p className="text-[11px] font-medium text-emerald-800">Ham Majority</p>
                <p className="text-lg font-bold text-emerald-700">4,825 (86.6%)</p>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-100">
                <p className="text-[11px] font-medium text-rose-800">Spam Minority</p>
                <p className="text-lg font-bold text-rose-700">747 (13.4%)</p>
              </div>
            </div>
          </div>

          {/* Message Length Distribution Histogram */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Message Length Distribution (Characters)</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Ham vs Spam</span>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Ham messages cluster sharply under 80 characters (short conversational bursts), whereas Spam messages concentrate at 140–160 characters (maximizing standard 160-char SMS limits).
            </p>

            <div className="h-64 w-full">
              {loading ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Calculating character length distribution...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.length_distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis
                      dataKey="range"
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                    />
                    <Legend verticalAlign="top" height={30} iconType="circle" />
                    <Bar dataKey="ham" name="Ham Messages" fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="spam" name="Spam Messages" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>Avg Ham Length: <strong className="text-emerald-700 font-mono">71.0 chars</strong></span>
              <span>Avg Spam Length: <strong className="text-rose-700 font-mono">138.9 chars</strong></span>
              <span className="text-slate-400 text-[11px]">(Ratio: ~1.96x length)</span>
            </div>
          </div>
        </div>

        {/* Word Frequency Comparison */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Empirical Word Frequency Comparison</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Top occurring vocabulary tokens extracted after lowercasing, punctuation normalization, and stopword removal.
              </p>
            </div>

            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium self-start sm:self-auto">
              <button
                onClick={() => setActiveWordTab("spam")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeWordTab === "spam"
                    ? "bg-rose-500 text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Top Spam Words
              </button>
              <button
                onClick={() => setActiveWordTab("ham")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeWordTab === "ham"
                    ? "bg-emerald-600 text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Top Ham Words
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Horizontal Bar Chart */}
            <div className="lg:col-span-8 h-72 w-full">
              {loading ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Computing token frequencies...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={topWords}
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis
                      dataKey="word"
                      type="category"
                      tick={{ fontSize: 11, fill: "#1e293b", fontWeight: 600 }}
                    />
                    <Tooltip
                      formatter={(val: any) => [`${val} occurrences`, "Frequency"]}
                      contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                    />
                    <Bar
                      dataKey="count"
                      name="Occurrences"
                      fill={activeWordTab === "spam" ? "#f43f5e" : "#10b981"}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Keyword insights callout */}
            <div className="lg:col-span-4 bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                <span>Linguistic Signature Insight</span>
              </div>
              {activeWordTab === "spam" ? (
                <div className="text-xs text-slate-600 leading-relaxed space-y-2">
                  <p>
                    Spam messages are dominated by urgency and transactional terms like <strong className="text-slate-900">numseq</strong> (phone numbers), <strong className="text-slate-900">currency</strong> symbols, <strong className="text-slate-900">free</strong>, <strong className="text-slate-900">claim</strong>, <strong className="text-slate-900">txt</strong>, and <strong className="text-slate-900">won</strong>.
                  </p>
                  <p className="text-slate-500">
                    These strong commercial incentives and imperative call-to-actions form the core TF-IDF feature signals used during model training.
                  </p>
                </div>
              ) : (
                <div className="text-xs text-slate-600 leading-relaxed space-y-2">
                  <p>
                    Ham messages reflect personal peer-to-peer dialogues containing conversational terms like <strong className="text-slate-900">ok</strong>, <strong className="text-slate-900">ll</strong> (&quot;I&apos;ll&quot;), <strong className="text-slate-900">got</strong>, <strong className="text-slate-900">come</strong>, <strong className="text-slate-900">good</strong>, and <strong className="text-slate-900">home</strong>.
                  </p>
                  <p className="text-slate-500">
                    The presence of social greetings and casual availability queries heavily correlates with legitimate sender intent.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
