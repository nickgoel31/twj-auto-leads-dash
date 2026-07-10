"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useTransition } from "react";
import { fetchDashboardData } from "@/actions/leads";
import { KpiCards } from "@/components/cards/kpi-cards";
import { FilterSection } from "@/components/filters/filter-section";
import { AnalyticsCharts } from "@/components/charts/analytics-charts";
import { InsightsSection } from "@/components/cards/insights-section";
import { LeadsTable } from "@/components/tables/leads-table";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, Database, Loader2, Sparkles, Keyboard } from "lucide-react";
import { Lead } from "@/lib/turso";

const INITIAL_FILTERS = {
  city: "",
  category: "",
  source: "",
  ratingMin: 0,
  ratingMax: 5,
  hasWebsite: "all",
  reviewsMin: 0,
  reviewsMax: 100000,
  search: "",
  dateStart: "",
  dateEnd: "",
};

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load initial data and refresh when filters change
  const refreshData = (currentFilters = filters) => {
    startTransition(async () => {
      try {
        const res = await fetchDashboardData(currentFilters);
        setData(res);
        setError(null);
      } catch (err: any) {
        console.error("Dashboard error:", err);
        setError(err.message || "Failed to load database. Check environment variables.");
      }
    });
  };

  useEffect(() => {
    // Initial fetch
    refreshData(INITIAL_FILTERS);
  }, []);

  // Debounced filters watch
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshData();
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [filters]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle dark mode (CMD/CTRL + D)
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        toggleTheme();
      }
      // Reset filters (Escape)
      if (e.key === "Escape") {
        setFilters(INITIAL_FILTERS);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleTheme]);

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  return (
    <div className="flex-1 min-h-screen bg-zinc-50 dark:bg-zinc-950 grid-bg transition-colors duration-300">
      {/* Header bar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="flex items-center justify-between py-4 px-6">
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-md font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Analytics Overview
              </h1>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Real-time Turso database metrics and distribution insights
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Keyboard shortcut legend */}
            <div className="hidden items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 py-1 px-2.5 text-[10px] font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 sm:flex">
              <Keyboard className="h-3.5 w-3.5" />
              <span>Press <kbd className="font-sans font-bold">Esc</kbd> to reset filters</span>
            </div>
          </div>
        </div>
      </header>


      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Error State Banner */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-950/50 dark:bg-rose-950/20">
            <h3 className="text-sm font-semibold text-rose-800 dark:text-rose-400">
              Database Sync Failed
            </h3>
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-500">
              {error}
            </p>
          </div>
        )}

        {/* Filters panel */}
        <FilterSection
          allLeads={data?.leads || []}
          filters={filters}
          setFilters={setFilters}
          onReset={handleResetFilters}
        />

        {/* Loading overlay indicator */}
        {isPending && (
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Querying database...
          </div>
        )}

        {/* Dashboard visual container */}
        {!data ? (
          // Skeleton loaders for initial state
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-zinc-200 dark:bg-zinc-900" />
              ))}
            </div>
            <div className="h-40 rounded-2xl bg-zinc-200 dark:bg-zinc-900" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="h-80 rounded-2xl bg-zinc-200 dark:bg-zinc-900 lg:col-span-2" />
              <div className="h-80 rounded-2xl bg-zinc-200 dark:bg-zinc-900" />
            </div>
            <div className="h-96 rounded-2xl bg-zinc-200 dark:bg-zinc-900" />
          </div>
        ) : (
          <>
            {/* KPI metrics */}
            <KpiCards stats={data.stats} />

            {/* Smart insights section */}
            <InsightsSection
              leads={data.leads}
              cityStats={data.cityStats}
              categoryStats={data.categoryStats}
              sourceStats={data.sourceStats}
            />

            {/* Recharts Analytics Charts */}
            <AnalyticsCharts
              cityStats={data.cityStats}
              categoryStats={data.categoryStats}
              sourceStats={data.sourceStats}
              ratingDistribution={data.ratingDistribution}
              growthData={data.growthData}
              hasWebsiteCount={data.stats.hasWebsite}
              noWebsiteCount={data.stats.noWebsite}
            />

            {/* Data Table */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Leads Inventory
                </h2>
              </div>
              <LeadsTable leads={data.leads} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
