"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import {
  LogOut,
  Filter,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  Clock,
  Inbox,
  AlertTriangle,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowUpDown,
  Calendar,
  Gauge,
  Smile,
  ChevronLeft,
  ChevronRight,
  Brain
} from "lucide-react";

type Category = "Bug" | "Feature Request" | "Improvement" | "Other";
type Status = "New" | "In Review" | "Resolved";
type Sentiment = "Positive" | "Neutral" | "Negative";

interface FeedbackItem {
  _id: string;
  title: string;
  category: Category;
  status: Status;
  ai_sentiment?: Sentiment;
  ai_priority?: number;
  ai_summary?: string;
  ai_tags: string[];
  createdAt: string;
}

interface DashboardStats {
  totalFeedback: number;
  openItems: number;
  avgPriorityScore: number;
  mostCommonTag: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface WeeklySummary {
  periodDays: number;
  topThemes: string[];
  summary: string;
}

type SortBy = "date" | "priority" | "sentiment";
type SortOrder = "asc" | "desc";

const categoryFilters: Array<Category | ""> = ["", "Bug", "Feature Request", "Improvement", "Other"];
const statusFilters: Array<Status | ""> = ["", "New", "In Review", "Resolved"];

export default function DashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState("");
  const [error, setError] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [status, setStatus] = useState<Status | "">("");
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<DashboardStats>({
    totalFeedback: 0,
    openItems: 0,
    avgPriorityScore: 0,
    mostCommonTag: "-"
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [summary, setSummary] = useState<WeeklySummary>({
    periodDays: 7,
    topThemes: [],
    summary: "Loading..."
  });

  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("adminToken") || "";
  }, []);

  const loadFeedback = useCallback(async () => {
    if (!token) {
      router.replace("/admin");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        sortBy,
        sortOrder
      });
      if (category) params.set("category", category);
      if (status) params.set("status", status);
      if (search) params.set("search", search);

      const response = await apiFetch<{
        items: FeedbackItem[];
        stats: DashboardStats;
        pagination: Pagination;
      }>(`/api/feedback?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setItems(response.data.items);
      setStats(response.data.stats);
      setPagination(response.data.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [token, category, status, search, page, sortBy, sortOrder, router]);

  const loadSummary = useCallback(async () => {
    if (!token) return;

    setSummaryLoading(true);
    try {
      const response = await apiFetch<WeeklySummary>("/api/feedback/summary", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate summary");
    } finally {
      setSummaryLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const updateStatus = async (id: string, nextStatus: Status) => {
    if (!token) return;

    try {
      await apiFetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus })
      });

      setItems((prev) => prev.map((item) => (item._id === id ? { ...item, status: nextStatus } : item)));
      loadFeedback();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    }
  };

  const retriggerAnalysis = async (id: string) => {
    if (!token) return;

    setAnalyzingId(id);
    setError("");
    try {
      const response = await apiFetch<FeedbackItem>(`/api/feedback/${id}/reanalyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      setItems((prev) => prev.map((item) => (item._id === id ? response.data : item)));
      loadSummary();
      loadFeedback();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to re-run AI analysis");
    } finally {
      setAnalyzingId("");
    }
  };

  const applySearch = () => {
    setPage(1);
    setSearch(searchDraft.trim());
  };

  const logout = () => {
    document.cookie = "adminToken=; path=/; max-age=0";
    localStorage.removeItem("adminToken");
    router.push("/admin");
  };

  // Helper renderers for beautiful badges
  const StatusBadge = ({ status }: { status: Status }) => {
    const configs = {
      New: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: <Inbox size={14} /> },
      "In Review": { color: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock size={14} /> },
      Resolved: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 size={14} /> }
    };
    const c = configs[status];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.color}`}>
        {c.icon} {status}
      </span>
    );
  };

  const SentimentBadge = ({ sentiment }: { sentiment?: Sentiment }) => {
    if (!sentiment) return <span className="text-slate-400 text-sm">—</span>;
    const configs = {
      Positive: { color: "bg-green-100 text-green-800", icon: "😊" },
      Neutral: { color: "bg-slate-100 text-slate-700", icon: "😐" },
      Negative: { color: "bg-rose-100 text-rose-800", icon: "😞" }
    };
    const c = configs[sentiment];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${c.color}`}>
        <span>{c.icon}</span> {sentiment}
      </span>
    );
  };
  
  const PriorityBadge = ({ priority }: { priority?: number }) => {
    if (priority === undefined) return <span className="text-slate-400 text-sm">—</span>;
    const high = priority >= 8;
    const med = priority >= 4 && priority < 8;
    return (
      <div className="flex items-center gap-2">
        <span className={`font-semibold ${high ? 'text-rose-600' : med ? 'text-amber-600' : 'text-slate-500'}`}>
          {priority}/10
        </span>
        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
          <div className={`h-full rounded-full ${high ? 'bg-rose-500' : med ? 'bg-amber-500' : 'bg-slate-400'}`} style={{ width: `${priority * 10}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Banner Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 p-2 rounded-lg text-white shadow-sm">
              {/* <Activity size={20} /> */}
              <ShieldCheck size={32} className="relative z-10" />

            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">FeedPulse <span className="text-slate-400 font-medium">Admin</span></span>
          </div>
          
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header & Stats area */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Feedback Inbox
            </h1>
            <p className="text-slate-500 mt-1">Review, prioritize, and respond to user feedback.</p>
          </div>
          
          <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
            <div className="flex flex-col px-4 py-1.5 border-r border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</span>
              <span className="text-xl font-bold text-slate-800">{stats.totalFeedback}</span>
            </div>
            <div className="flex flex-col px-4 py-1.5 border-r border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open</span>
              <span className="text-xl font-bold text-blue-600">{stats.openItems}</span>
            </div>
            <div className="flex flex-col px-4 py-1.5 border-r border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Priority</span>
              <span className="text-xl font-bold text-emerald-600">{stats.avgPriorityScore}</span>
            </div>
            <div className="flex flex-col px-4 py-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Tag</span>
              <span className="text-xl font-bold text-violet-600">{stats.mostCommonTag}</span>
            </div>
          </div>
        </div>

        <section className="bg-gradient-to-r from-sky-50 to-indigo-50 rounded-2xl border border-sky-100 p-5 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
                <Sparkles size={16} />
                Top 3 themes from the last {summary.periodDays} days
              </p>
              <p className="mt-2 text-slate-700">{summary.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {summary.topThemes.map((theme) => (
                  <span key={theme} className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-sky-700 border border-sky-200">
                    {theme}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={loadSummary}
              className="btn bg-white border border-sky-200 text-sky-700 hover:bg-sky-100"
              disabled={summaryLoading}
            >
              {summaryLoading ? <RefreshCw size={16} className="animate-spin" /> : <Brain size={16} />}
              <span className="ml-2">Refresh Summary</span>
            </button>
          </div>
        </section>

        {/* Filters */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-slate-500 font-medium whitespace-nowrap px-2">
            <Filter size={18} />
            Filters:
          </div>

          <div className="w-full grid gap-4 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-24 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                placeholder="Search title or AI summary"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applySearch();
                  }
                }}
              />
              <button
                className="absolute right-1.5 top-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white"
                onClick={applySearch}
              >
                Search
              </button>
            </div>

            <div className="relative">
              <select 
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
                value={category} 
                onChange={(e) => {
                  setPage(1);
                  setCategory(e.target.value as Category | "");
                }}
              >
                {categoryFilters.map((item) => (
                  <option key={item || "all"} value={item}>{item || "All Categories"}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select 
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
                value={status} 
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value as Status | "");
                }}
              >
                {statusFilters.map((item) => (
                  <option key={item || "all"} value={item}>{item || "All Statuses"}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
                value={sortBy}
                onChange={(e) => {
                  setPage(1);
                  setSortBy(e.target.value as SortBy);
                }}
              >
                <option value="date">Sort by Date</option>
                <option value="priority">Sort by Priority</option>
                <option value="sentiment">Sort by Sentiment</option>
              </select>
              <ArrowUpDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setPage(1);
                  setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                }}
                className="btn w-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                {sortOrder === "asc" ? "Ascending" : "Descending"}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={loadFeedback}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl px-4 py-2.5 font-medium transition-colors whitespace-nowrap"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </section>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 border border-red-100 p-4 text-red-700">
            <AlertTriangle size={20} />
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        {/* Data Table */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin"></div>
                <span className="text-sm font-medium text-slate-500">Loading data...</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-left">
                  <th className="py-4 px-6 font-semibold text-slate-600 whitespace-nowrap">Feedback Details</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 whitespace-nowrap">Type & Date</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 whitespace-nowrap text-center">AI Sentiment</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 whitespace-nowrap">AI Score</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 whitespace-nowrap">AI Action</th>
                  <th className="py-4 px-6 font-semibold text-slate-600 whitespace-nowrap text-right">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="inline-flex flex-col items-center text-slate-400">
                        <Inbox size={48} className="mb-4 text-slate-300" strokeWidth={1} />
                        <span className="text-lg font-medium text-slate-600">No feedback found</span>
                        <span className="mt-1">Try adjusting your filters above.</span>
                      </div>
                    </td>
                  </tr>
                )}
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors text-base max-w-sm truncate" title={item.title}>
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 max-w-sm truncate" title={item.ai_summary || "No AI summary yet"}>
                        {item.ai_summary || "No AI summary yet"}
                      </p>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-slate-700">{item.category}</span>
                        <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <SentimentBadge sentiment={item.ai_sentiment} />
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <PriorityBadge priority={item.ai_priority} />
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <button
                        onClick={() => retriggerAnalysis(item._id)}
                        disabled={analyzingId === item._id}
                        className="inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                      >
                        {analyzingId === item._id ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        <span className="ml-1.5">Re-analyze</span>
                      </button>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-right">
                      <div className="inline-flex items-center justify-end w-full relative">
                        <select
                          className="appearance-none bg-transparent font-medium py-1.5 pl-3 pr-8 rounded-lg outline-none cursor-pointer border border-transparent hover:border-slate-200 hover:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-right transition-all"
                          value={item.status}
                          onChange={(e) => updateStatus(item._id, e.target.value as Status)}
                          style={{
                            color: item.status === 'New' ? '#2563eb' : item.status === 'In Review' ? '#d97706' : '#059669',
                          }}
                        >
                          {statusFilters.filter(Boolean).map((s) => (
                            <option key={s} value={s} className="text-slate-800">{s}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <p className="text-slate-500">
            Page {pagination.page} of {pagination.totalPages} • {pagination.total} results
          </p>
          <div className="flex items-center gap-2">
            <button
              className="btn border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              disabled={pagination.page <= 1 || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              <ChevronLeft size={16} />
              <span className="ml-1">Prev</span>
            </button>
            <button
              className="btn border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
            >
              <span className="mr-1">Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

