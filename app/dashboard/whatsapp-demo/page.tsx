"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import {
  MessageSquareCheck,
  Search,
  Phone,
  Mail,
  MapPin,
  Tag,
  Star,
  Clock,
  Building2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingUp,
  Loader2,
  Globe,
  SendHorizonal,
} from "lucide-react";

interface DemoLead {
  id: number;
  name: string;
  phone: string;
  email: string;
  domain: string;
  category: string;
  city: string;
  source: string;
  rating: number;
  reviews_count: number;
  whatsapp_demo_sent: number;
  whatsapp_demo_sent_at: string;
  created_at: string;
  last_contacted: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "just now";
  } catch {
    return "—";
  }
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 flex items-center gap-4">
      <div className={`rounded-xl p-3 ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{label}</p>
        <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export default function WhatsAppDemoPage() {
  const [leads, setLeads] = useState<DemoLead[]>([]);
  const [filtered, setFiltered] = useState<DemoLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<keyof DemoLead>("whatsapp_demo_sent_at");
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/leads/whatsapp-demo-sent");
        if (!res.ok) throw new Error("Failed to fetch WhatsApp demo leads");
        const data = await res.json();
        setLeads(data);
        setFiltered(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  useEffect(() => {
    let result = [...leads];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q) ||
          l.domain.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      if (av < bv) return sortDesc ? 1 : -1;
      if (av > bv) return sortDesc ? -1 : 1;
      return 0;
    });
    setFiltered(result);
  }, [search, leads, sortField, sortDesc]);

  const handleSort = (field: keyof DemoLead) => {
    if (sortField === field) setSortDesc((d) => !d);
    else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  const SortIcon = ({ field }: { field: keyof DemoLead }) => {
    if (sortField !== field) return <ChevronDown className="h-3 w-3 opacity-30" />;
    return sortDesc ? (
      <ChevronDown className="h-3 w-3 text-green-500" />
    ) : (
      <ChevronUp className="h-3 w-3 text-green-500" />
    );
  };

  // Avg rating
  const avgRating =
    leads.length > 0
      ? (leads.reduce((s, l) => s + l.rating, 0) / leads.length).toFixed(1)
      : "—";

  // Most recent demo sent
  const latestDemo = leads.length > 0 ? timeAgo(leads[0].whatsapp_demo_sent_at) : "—";

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-zinc-50 dark:bg-zinc-950 grid-bg transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="flex items-center justify-between py-4 px-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-tr from-green-500 to-emerald-500 p-1.5 text-white shadow-md shadow-green-500/20">
                <MessageSquareCheck className="h-4 w-4" />
              </div>
              <h1 className="text-md font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                WhatsApp Demo Sent
              </h1>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              All businesses that received a WhatsApp demo message
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                id="demo-search"
                type="text"
                placeholder="Search businesses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-green-500/30 w-56 transition-all"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-950/50 dark:bg-rose-950/20">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            <p className="text-xs font-medium text-rose-700 dark:text-rose-400">{error}</p>
          </div>
        )}

        {/* KPI Row */}
        {!loading && !error && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Demos Sent"
              value={leads.length}
              icon={SendHorizonal}
              accent="bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400"
            />
            <StatCard
              label="Showing (filtered)"
              value={filtered.length}
              icon={TrendingUp}
              accent="bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400"
            />
            <StatCard
              label="Latest Demo"
              value={latestDemo}
              icon={Clock}
              accent="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
            />
            <StatCard
              label="Avg. Rating"
              value={avgRating !== "—" ? `${avgRating} ★` : "—"}
              icon={Star}
              accent="bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400"
            />
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-zinc-200 dark:bg-zinc-900" />
            ))}
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-5">
                  <MessageSquareCheck className="h-8 w-8 text-zinc-400" />
                </div>
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  {leads.length === 0
                    ? "No WhatsApp demos sent yet"
                    : "No results match your search"}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {leads.length === 0
                    ? "Use the API endpoint POST /api/leads/whatsapp-demo-sent to record a demo"
                    : "Try adjusting your search query"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80">
                      {[
                        { label: "Business", field: "name" as keyof DemoLead },
                        { label: "Contact", field: "phone" as keyof DemoLead },
                        { label: "Location", field: "city" as keyof DemoLead },
                        { label: "Category", field: "category" as keyof DemoLead },
                        { label: "Source", field: "source" as keyof DemoLead },
                        { label: "Demo Sent At", field: "whatsapp_demo_sent_at" as keyof DemoLead },
                        { label: "Rating", field: "rating" as keyof DemoLead },
                      ].map(({ label, field }) => (
                        <th
                          key={field}
                          onClick={() => handleSort(field)}
                          className="px-4 py-3 text-left font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            {label}
                            <SortIcon field={field} />
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {filtered.map((lead) => (
                      <React.Fragment key={lead.id}>
                        <tr
                          onClick={() =>
                            setExpandedId(expandedId === lead.id ? null : lead.id)
                          }
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer group"
                        >
                          {/* Business */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {lead.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <p className="font-semibold text-zinc-900 dark:text-zinc-50 leading-tight">
                                  {lead.name || "—"}
                                </p>
                                {lead.domain && (
                                  <p className="text-[10px] text-zinc-400 truncate max-w-[140px]">
                                    {lead.domain}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="px-4 py-3.5">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                                <Phone className="h-3 w-3 text-zinc-400" />
                                <span>{lead.phone || "—"}</span>
                              </div>
                              {lead.email && (
                                <div className="flex items-center gap-1 text-zinc-400">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate max-w-[150px]">{lead.email}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Location */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                              <MapPin className="h-3 w-3 text-zinc-400" />
                              <span>{lead.city || "—"}</span>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-green-100 dark:bg-green-950/40 px-2.5 py-1 text-[11px] font-semibold text-green-700 dark:text-green-300">
                              <Tag className="h-3 w-3" />
                              {lead.category || "—"}
                            </span>
                          </td>

                          {/* Source */}
                          <td className="px-4 py-3.5">
                            <span className="text-zinc-500 dark:text-zinc-400">
                              {lead.source || "—"}
                            </span>
                          </td>

                          {/* Demo Sent At */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                              <Clock className="h-3 w-3" />
                              <span>{timeAgo(lead.whatsapp_demo_sent_at)}</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-0.5">
                              {formatDate(lead.whatsapp_demo_sent_at).split(",")[0]}
                            </p>
                          </td>

                          {/* Rating */}
                          <td className="px-4 py-3.5">
                            {lead.rating ? (
                              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {lead.rating.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded detail row */}
                        {expandedId === lead.id && (
                          <tr className="bg-zinc-50/80 dark:bg-zinc-800/20">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                <div>
                                  <p className="text-zinc-400 font-medium mb-0.5 flex items-center gap-1">
                                    <Globe className="h-3 w-3" /> Domain
                                  </p>
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 break-all">
                                    {lead.domain || "—"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-zinc-400 font-medium mb-0.5 flex items-center gap-1">
                                    <Mail className="h-3 w-3" /> Email
                                  </p>
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 break-all">
                                    {lead.email || "—"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-zinc-400 font-medium mb-0.5 flex items-center gap-1">
                                    <Star className="h-3 w-3" /> Reviews
                                  </p>
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                                    {lead.reviews_count
                                      ? `${lead.reviews_count.toLocaleString()} reviews`
                                      : "—"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-zinc-400 font-medium mb-0.5 flex items-center gap-1">
                                    <Building2 className="h-3 w-3" /> Lead Created
                                  </p>
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                                    {formatDate(lead.created_at)}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>

                {/* Table footer */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
                  <p className="text-[11px] text-zinc-400">
                    {filtered.length} of {leads.length} businesses shown
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Click any row to expand details
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
