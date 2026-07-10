"use client";

import React from "react";
import { Users, MapPin, Tag, Star, Globe, Globe2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { DashboardStats } from "@/lib/turso";

interface KpiCardsProps {
  stats: DashboardStats;
}

export function KpiCards({ stats }: KpiCardsProps) {
  const websitePct = stats.totalLeads > 0 ? Math.round((stats.hasWebsite / stats.totalLeads) * 100) : 0;
  
  // Custom cards configuration
  const cardData = [
    {
      title: "Total Leads",
      value: stats.totalLeads.toLocaleString(),
      icon: Users,
      color: "text-violet-500 dark:text-violet-400",
      bg: "bg-violet-500/10",
      trend: "+12.4%",
      trendUp: true,
      description: "Leads captured in database",
    },
    {
      title: "Unique Cities",
      value: stats.uniqueCities.toString(),
      icon: MapPin,
      color: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      trend: "+4.2%",
      trendUp: true,
      description: "Geographic reach",
    },
    {
      title: "Unique Categories",
      value: stats.uniqueCategories.toString(),
      icon: Tag,
      color: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-500/10",
      trend: "Stable",
      trendUp: true,
      description: "Business verticals",
    },
    {
      title: "Average Rating",
      value: `${stats.avgRating} / 5.0`,
      icon: Star,
      color: "text-rose-500 dark:text-rose-400",
      bg: "bg-rose-500/10",
      trend: "+0.3",
      trendUp: true,
      description: "Average customer sentiment",
    },
    {
      title: "Leads With Website",
      value: stats.hasWebsite.toLocaleString(),
      icon: Globe,
      color: "text-sky-500 dark:text-sky-400",
      bg: "bg-sky-500/10",
      trend: `${websitePct}% of total`,
      trendUp: true,
      description: "Valid digital presence",
    },
    {
      title: "Leads Without Website",
      value: stats.noWebsite.toLocaleString(),
      icon: Globe2,
      color: "text-zinc-500 dark:text-zinc-400",
      bg: "bg-zinc-500/10",
      trend: `${100 - websitePct}% of total`,
      trendUp: false,
      description: "Outreach opportunities",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cardData.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700 dark:hover:shadow-2xl dark:hover:shadow-violet-500/5 glow-card"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`rounded-xl p-2.5 ${card.bg} ${card.color} transition-transform duration-300 group-hover:scale-110`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {card.value}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                {card.description}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                  card.trend === "Stable"
                    ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    : card.trendUp
                    ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
                }`}
              >
                {card.trend === "Stable" ? null : card.trendUp ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {card.trend}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
