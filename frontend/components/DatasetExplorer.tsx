"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  PieChart as PieIcon,
  BarChart3,
  Layers,
  X,
  ShieldCheck,
  ShieldAlert,
  Info,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import {
  fetchDatasetRecords,
  fetchDatasetAnalysis,
  fetchDatasetSummary,
  DatasetRecordItem,
  DatasetAnalysis,
  DatasetSummary,
} from "@/lib/api";

const PIE_COLORS = ["#10b981", "#f43f5e"];

interface DatasetExplorerProps {
  onSelectMessage?: (msg: string) => void;
}

export default function DatasetExplorer({ onSelectMessage }: DatasetExplorerProps) {
  const [records, setRecords] = useState<DatasetRecordItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(5572);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortDir, setSortDir] = useState<string>("asc");
  const [loading, setLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  // Inspector modal state
  const [inspectorRecord, setInspectorRecord] = useState<DatasetRecordItem | null>(null);

  // Analytics data
  const [analysis, setAnalysis] = useState<DatasetAnalysis | null>(null);
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [wordTab, setWordTab] = useState<"spam" | "ham">("spam");

  // Track initial mount to prevent duplicate effect executions
  const initialSearchMountRef = React.useRef(true);

  const loadRecords = async (page = 1) => {
    setLoading(true);
    setRecordsError(null);
    try {
      const res = await fetchDatasetRecords({
        search: searchQuery,
        label: selectedLabel || undefined,
        sortBy,
        sortDir,
        page,
        limit: 8,
      });
      setRecords(res.records);
      setTotalRecords(res.total);
      setTotalPages(res.total_pages);
      setCurrentPage(res.page);
      setRecordsError(null);
    } catch (err: any) {
      setRecordsError(err?.message || "Dataset records unavailable. Please ensure the backend is running.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords(1);
  }, [selectedLabel, sortBy, sortDir]);

  useEffect(() => {
    if (initialSearchMountRef.current) {
      initialSearchMountRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      loadRecords(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadStats = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const [analysisResult, summaryResult] = await Promise.allSettled([
        fetchDatasetAnalysis(),
        fetchDatasetSummary(),
      ]);

      if (analysisResult.status === "fulfilled") {
        setAnalysis(analysisResult.value);
      } else {
        console.warn("Dataset analysis not loaded:", analysisResult.reason);
      }

      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value);
        setTotalRecords(summaryResult.value.total_messages);
      } else {
        console.warn("Dataset summary not loaded:", summaryResult.reason);
      }

      if (analysisResult.status === "rejected" && summaryResult.status === "rejected") {
        setStatsError("Dataset statistics & analytics temporarily unavailable from backend.");
      }
    } catch (err: any) {
      setStatsError(err?.message || "Failed to load dataset statistics.");
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const classData = summary
    ? [
        { name: "Ham (Safe)", value: summary.ham_count, label: "ham" },
        { name: "Spam", value: summary.spam_count, label: "spam" },
      ]
    : [];

  const topWords =
    wordTab === "spam"
      ? analysis?.top_spam_words?.slice(0, 8) || []
      : analysis?.top_ham_words?.slice(0, 8) || [];

  return (
    <section id="dataset" className="py-16 md:py-20 bg-slate-50/50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-700 mb-2">
              <Database className="w-3.5 h-3.5" />
              <span>Full Corpus Workspace</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Dataset Explorer &amp; Text Analytics
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl">
              Search, filter, and inspect all 5,572 authentic messages from the SMS Spam Collection corpus. Click any row or chart segment to filter records dynamically.
            </p>
          </div>

          <span className="text-xs font-mono text-slate-400">Total Volume: 5,572 Messages</span>
        </div>

        {/* Top Visualizations Row: Donut + Histogram */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          {/* Class Distribution Interactive Donut */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-indigo-600" />
                  <span>Class Imbalance</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">Click slice to filter</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Ham represents 86.6% of messages; Spam represents 13.4%.
              </p>

              <div className="h-48 w-full flex flex-col items-center justify-center">
                {classData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={classData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={72}
                        paddingAngle={4}
                        dataKey="value"
                        onClick={(entry: any) => setSelectedLabel(entry?.label || "")}
                        className="cursor-pointer"
                      >
                        {classData.map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any) => [
                          `${Number(val).toLocaleString()} messages`,
                          name,
                        ]}
                        contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                      />
                      <Legend verticalAlign="bottom" height={28} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-xs text-slate-500 font-semibold mb-2">
                      {statsError ? "Class distribution unavailable" : "Loading corpus metrics..."}
                    </p>
                    {statsError && (
                      <button
                        onClick={loadStats}
                        className="px-3 py-1 bg-white border border-slate-200 text-xs font-semibold text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Filter: <strong className="text-slate-800">{selectedLabel ? selectedLabel.toUpperCase() : "ALL"}</strong></span>
              {selectedLabel && (
                <button
                  type="button"
                  onClick={() => setSelectedLabel("")}
                  className="text-indigo-600 hover:underline font-semibold"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Message Length Distribution */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Message Character Length Histogram</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Ham vs Spam Distribution</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Ham concentrates under 80 characters; spam peaks at 140–160 characters (full SMS length).
            </p>

            <div className="h-48 w-full flex flex-col items-center justify-center">
              {analysis?.length_distribution && analysis.length_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysis.length_distribution} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                    <Bar dataKey="ham" name="Ham" fill="#10b981" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="spam" name="Spam" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center p-4">
                  <p className="text-xs text-slate-500 font-semibold mb-2">
                    {statsError ? "Histogram data unavailable" : "Loading length distribution..."}
                  </p>
                  {statsError && (
                    <button
                      onClick={loadStats}
                      className="px-3 py-1 bg-white border border-slate-200 text-xs font-semibold text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Avg Ham: <strong className="text-emerald-700">{analysis?.ham_stats?.mean_char_length ? `${analysis.ham_stats.mean_char_length} chars` : "--"}</strong></span>
              <span>Avg Spam: <strong className="text-rose-700">{analysis?.spam_stats?.mean_char_length ? `${analysis.spam_stats.mean_char_length} chars` : "--"}</strong></span>
              <span>Total Vocabulary: <strong className="text-slate-900">{analysis ? "4,000+ features" : "--"}</strong></span>
            </div>
          </div>
        </div>

        {/* Dataset Search, Filter, Sort & Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all 5,572 messages..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter & Sort Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Class Tabs */}
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
                {["", "ham", "spam"].map((lbl) => (
                  <button
                    key={lbl}
                    onClick={() => setSelectedLabel(lbl)}
                    className={`px-3 py-1.5 rounded-md capitalize transition-colors ${
                      selectedLabel === lbl
                        ? "bg-white text-slate-900 font-bold shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {lbl === "" ? "All Classes" : lbl}
                  </button>
                ))}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <select
                  value={`${sortBy}-${sortDir}`}
                  onChange={(e) => {
                    const [f, d] = e.target.value.split("-");
                    setSortBy(f);
                    setSortDir(d);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
                >
                  <option value="id-asc">Sort: ID (Asc)</option>
                  <option value="id-desc">Sort: ID (Desc)</option>
                  <option value="char_length-desc">Length (Longest)</option>
                  <option value="char_length-asc">Length (Shortest)</option>
                  <option value="word_count-desc">Word Count (High)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-3 px-4 w-16">ID</th>
                  <th className="py-3 px-4 w-24">Label</th>
                  <th className="py-3 px-4">Message Content (Click row to inspect)</th>
                  <th className="py-3 px-4 w-24 text-right">Length</th>
                  <th className="py-3 px-4 w-28 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Querying corpus records...
                    </td>
                  </tr>
                ) : recordsError ? (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center">
                      <div className="max-w-md mx-auto p-4 rounded-xl bg-rose-50/60 border border-rose-200 text-rose-800">
                        <AlertTriangle className="w-5 h-5 text-rose-500 mx-auto mb-2" />
                        <p className="font-bold text-xs uppercase tracking-wider mb-1">Dataset records unavailable</p>
                        <p className="text-xs text-rose-600 mb-3">{recordsError}</p>
                        <button
                          onClick={() => loadRecords(currentPage)}
                          className="px-3.5 py-1.5 bg-white border border-rose-300 text-rose-700 text-xs font-semibold rounded-lg hover:bg-rose-50 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No matching messages found for current query.
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => {
                    const isSpam = rec.label.toLowerCase() === "spam";
                    return (
                      <tr
                        key={rec.id}
                        onClick={() => setInspectorRecord(rec)}
                        className="hover:bg-indigo-50/30 cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-4 font-mono text-slate-400">#{rec.id}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isSpam
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {rec.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-sans leading-relaxed max-w-lg">
                          <p className="line-clamp-2">{rec.message}</p>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500 whitespace-nowrap">
                          {rec.char_length} ch
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectMessage?.(rec.message);
                              document.querySelector("#detector")?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            <span>Test</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span className="font-mono">
              Showing {records.length} of {totalRecords.toLocaleString()} messages &bull; Page {currentPage} of {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1 || loading}
                onClick={() => loadRecords(currentPage - 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono font-bold text-slate-800 px-2">{currentPage}</span>
              <button
                type="button"
                disabled={currentPage >= totalPages || loading}
                onClick={() => loadRecords(currentPage + 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sample Inspector Modal */}
        {inspectorRecord && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in"
            onClick={() => setInspectorRecord(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-xl w-full p-6 border border-slate-200 shadow-2xl animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">Record #{inspectorRecord.id}</span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                      inspectorRecord.label === "spam"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {inspectorRecord.label}
                  </span>
                </div>
                <button
                  onClick={() => setInspectorRecord(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
                <p className="text-sm text-slate-900 leading-relaxed font-sans font-medium">
                  {inspectorRecord.message}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-slate-600 mb-6">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Length</span>
                  <strong className="text-slate-900">{inspectorRecord.char_length} chars</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Word Count</span>
                  <strong className="text-slate-900">{inspectorRecord.word_count} words</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Corpus Class</span>
                  <strong className={inspectorRecord.label === "spam" ? "text-rose-700" : "text-emerald-700"}>
                    {inspectorRecord.label.toUpperCase()}
                  </strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Format</span>
                  <strong className="text-slate-900">SMS / Mobile</strong>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInspectorRecord(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectMessage?.(inspectorRecord.message);
                    setInspectorRecord(null);
                    document.querySelector("#detector")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs inline-flex items-center gap-1.5"
                >
                  <span>Test in Detector &rarr;</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
