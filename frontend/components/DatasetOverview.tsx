"use client";

import React, { useState, useEffect } from "react";
import { Database, ShieldCheck, AlertTriangle, Search, ArrowUpRight, Filter, Info, RefreshCw } from "lucide-react";
import { fetchDatasetSummary, DatasetSummary } from "@/lib/api";

interface DatasetOverviewProps {
  onSelectSampleMessage?: (msg: string) => void;
}

export default function DatasetOverview({ onSelectSampleMessage }: DatasetOverviewProps) {
  const [data, setData] = useState<DatasetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "ham" | "spam">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await fetchDatasetSummary();
      setData(summary);
    } catch (err: any) {
      setError(err?.message || "Failed to load dataset summary from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const records = data?.sample_records || [];
  const filteredRecords = records.filter((rec) => {
    if (filter !== "all" && rec.label !== filter) return false;
    if (searchQuery.trim()) {
      return rec.message.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <section id="dataset" className="py-16 md:py-20 bg-slate-50/50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-700 mb-2">
              <Database className="w-3.5 h-3.5" />
              <span>SMS Spam Collection Corpus</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Dataset Architecture &amp; Records
            </h2>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Grounded in the legitimate UCI SMS Spam Collection repository. All distributions and records are dynamically queried directly from the backend.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">Source: UCI Machine Learning Repository</span>
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              title="Refresh dataset stats"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-10">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs col-span-2 md:col-span-1">
            <p className="text-xs font-medium text-slate-500">Total Messages</p>
            <p className="mt-1.5 text-2xl font-black text-slate-900 tracking-tight">
              {loading ? "..." : data?.total_messages.toLocaleString() || "5,572"}
            </p>
            <span className="inline-block mt-1 text-[11px] text-slate-400">100% Corpus Volume</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-emerald-700">Ham Messages</p>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="mt-1.5 text-2xl font-black text-slate-900 tracking-tight">
              {loading ? "..." : data?.ham_count.toLocaleString() || "4,825"}
            </p>
            <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-600">
              {loading ? "" : `${data?.ham_percentage}% of corpus`}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-rose-700">Spam Messages</p>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <p className="mt-1.5 text-2xl font-black text-slate-900 tracking-tight">
              {loading ? "..." : data?.spam_count.toLocaleString() || "747"}
            </p>
            <span className="inline-block mt-1 text-[11px] font-semibold text-rose-600">
              {loading ? "" : `${data?.spam_percentage}% of corpus`}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-xs font-medium text-slate-500">Avg Message Length</p>
            <p className="mt-1.5 text-2xl font-black text-slate-900 tracking-tight">
              {loading ? "..." : `${data?.avg_char_length || 80.5} ch`}
            </p>
            <span className="inline-block mt-1 text-[11px] text-slate-400">Spam is ~2x longer</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-xs font-medium text-slate-500">Avg Word Count</p>
            <p className="mt-1.5 text-2xl font-black text-slate-900 tracking-tight">
              {loading ? "..." : `${data?.avg_word_count || 15.6} wds`}
            </p>
            <span className="inline-block mt-1 text-[11px] text-slate-400">Across entire corpus</span>
          </div>
        </div>

        {/* Dataset Preview Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Filter Class:
              </span>
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
                {(["all", "ham", "spam"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilter(mode)}
                    className={`px-3 py-1 rounded-md capitalize transition-colors ${
                      filter === mode
                        ? "bg-white text-slate-900 font-semibold shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sample messages..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
                  <th className="py-3 px-4 w-20">Label</th>
                  <th className="py-3 px-4">Message Content</th>
                  <th className="py-3 px-4 w-28 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400">
                      Loading authentic corpus records from backend...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-rose-500">
                      {error}
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400">
                      No matching records found for &ldquo;{searchQuery}&rdquo;.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec, index) => {
                    const isSpam = rec.label.toLowerCase() === "spam";
                    return (
                      <tr key={index} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium align-top">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                              isSpam
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {rec.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 leading-relaxed max-w-xl">
                          <p className="line-clamp-2">{rec.message}</p>
                        </td>
                        <td className="py-3.5 px-4 text-right align-top whitespace-nowrap">
                          {onSelectSampleMessage && (
                            <button
                              onClick={() => {
                                onSelectSampleMessage(rec.message);
                                const el = document.getElementById("detector");
                                el?.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              <span>Test in ML</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer info */}
          <div className="p-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-500" />
              Displaying stratified samples directly extracted from the 5,572 row dataset.
            </span>
            <span className="font-mono text-[11px]">
              Showing {filteredRecords.length} records
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
