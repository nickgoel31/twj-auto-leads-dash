"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import {
  FileCheck,
  Search,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Tag,
  Star,
  Calendar,
  DollarSign,
  Loader2,
  TrendingUp,
  Clock,
  Building2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface ProposalLead {
  id: number;
  name: string;
  phone: string;
  email: string;
  domain: string;
  category: string;
  city: string;
  rating: number;
  reviews_count: number;
  proposal_sent: number;
  proposal_link: string;
  last_contacted: string;
  created_at: string;
  services_sold: string;
  final_pricing_agreed: string;
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
    <div className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 flex items-center gap-4`}>
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

export default function ProposalsSentPage() {
  const [leads, setLeads] = useState<ProposalLead[]>([]);
  const [filtered, setFiltered] = useState<ProposalLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<keyof ProposalLead>("last_contacted");
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/proposals-sent");
        if (!res.ok) throw new Error("Failed to fetch proposal leads");
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
          l.services_sold?.toLowerCase().includes(q)
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

  const totalRevenue = leads.reduce((sum, l) => {
    const val = parseFloat((l.final_pricing_agreed || "").replace(/[^0-9.]/g, ""));
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const handleSort = (field: keyof ProposalLead) => {
    if (sortField === field) setSortDesc((d) => !d);
    else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  const SortIcon = ({ field }: { field: keyof ProposalLead }) => {
    if (sortField !== field) return <ChevronDown className="h-3 w-3 opacity-30" />;
    return sortDesc ? (
      <ChevronDown className="h-3 w-3 text-violet-500" />
    ) : (
      <ChevronUp className="h-3 w-3 text-violet-500" />
    );
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-zinc-50 dark:bg-zinc-950 grid-bg transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="flex items-center justify-between py-4 px-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500 p-1.5 text-white shadow-md shadow-emerald-500/20">
                <FileCheck className="h-4 w-4" />
              </div>
              <h1 className="text-md font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Proposals Sent
              </h1>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              All leads with a proposal dispatched — track status, pricing &amp; follow-up
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-violet-500/30 w-56 transition-all"
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
              label="Proposals Sent"
              value={leads.length}
              icon={FileCheck}
              accent="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              label="Showing (filtered)"
              value={filtered.length}
              icon={TrendingUp}
              accent="bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400"
            />
            <StatCard
              label="Revenue Pipeline"
              value={
                totalRevenue > 0
                  ? `₹${totalRevenue.toLocaleString("en-IN")}`
                  : "—"
              }
              icon={DollarSign}
              accent="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
            />
            <StatCard
              label="Avg. Rating"
              value={
                leads.length > 0
                  ? (leads.reduce((s, l) => s + l.rating, 0) / leads.length).toFixed(1)
                  : "—"
              }
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
                  <FileCheck className="h-8 w-8 text-zinc-400" />
                </div>
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  {leads.length === 0 ? "No proposals sent yet" : "No results match your search"}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {leads.length === 0
                    ? "Send a proposal from the Proposal Builder page to see it here"
                    : "Try adjusting your search query"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80">
                      {[
                        { label: "Business", field: "name" as keyof ProposalLead },
                        { label: "Contact", field: "phone" as keyof ProposalLead },
                        { label: "Location", field: "city" as keyof ProposalLead },
                        { label: "Category", field: "category" as keyof ProposalLead },
                        { label: "Services", field: "services_sold" as keyof ProposalLead },
                        { label: "Pricing Agreed", field: "final_pricing_agreed" as keyof ProposalLead },
                        { label: "Last Contacted", field: "last_contacted" as keyof ProposalLead },
                        { label: "Proposal", field: "proposal_link" as keyof ProposalLead },
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
                              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
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
                            <span className="inline-flex items-center gap-1 rounded-lg bg-violet-100 dark:bg-violet-950/40 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                              <Tag className="h-3 w-3" />
                              {lead.category || "—"}
                            </span>
                          </td>

                          {/* Services */}
                          <td className="px-4 py-3.5 max-w-[160px]">
                            <p className="text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                              {lead.services_sold || "—"}
                            </p>
                          </td>

                          {/* Pricing */}
                          <td className="px-4 py-3.5">
                            {lead.final_pricing_agreed ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 className="h-3 w-3" />
                                {lead.final_pricing_agreed}
                              </span>
                            ) : (
                              <span className="text-zinc-400">Pending</span>
                            )}
                          </td>

                          {/* Last Contacted */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                              <Clock className="h-3 w-3" />
                              <span>{timeAgo(lead.last_contacted)}</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-0.5">
                              {formatDate(lead.last_contacted).split(",")[0]}
                            </p>
                          </td>

                          {/* Proposal Link */}
                          <td className="px-4 py-3.5">
                            {lead.proposal_link ? (
                              <a
                                href={lead.proposal_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold text-white dark:text-zinc-900 hover:bg-violet-600 dark:hover:bg-violet-100 transition-colors"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View
                              </a>
                            ) : (
                              <span className="text-zinc-400 text-[11px]">No link</span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded detail row */}
                        {expandedId === lead.id && (
                          <tr className="bg-zinc-50/80 dark:bg-zinc-800/20">
                            <td colSpan={8} className="px-6 py-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                <div>
                                  <p className="text-zinc-400 font-medium mb-0.5 flex items-center gap-1">
                                    <Star className="h-3 w-3" /> Rating
                                  </p>
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                                    {lead.rating ? `${lead.rating} ★` : "—"}
                                    {lead.reviews_count
                                      ? ` (${lead.reviews_count.toLocaleString()} reviews)`
                                      : ""}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-zinc-400 font-medium mb-0.5 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> Lead Created
                                  </p>
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                                    {formatDate(lead.created_at)}
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
                                    <Building2 className="h-3 w-3" /> Domain
                                  </p>
                                  <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                                    {lead.domain || "—"}
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
                    {filtered.length} of {leads.length} proposals shown
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
