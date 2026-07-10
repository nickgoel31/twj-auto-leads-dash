"use client";

import React from "react";
import { Sparkles, Trophy, Award, Star, Activity, Globe, Compass } from "lucide-react";
import { Lead } from "@/lib/turso";

interface InsightsSectionProps {
  leads: Lead[];
  cityStats: { city: string; count: number }[];
  categoryStats: { category: string; count: number; avgRating: number; totalReviews: number }[];
  sourceStats: { source: string; count: number }[];
}

export function InsightsSection({
  leads,
  cityStats,
  categoryStats,
  sourceStats,
}: InsightsSectionProps) {
  if (leads.length === 0) {
    return null;
  }

  // Calculate insights
  const topCity = cityStats[0];
  
  // Best rated category (only considering categories with at least 1 lead)
  const bestRatedCategory = [...categoryStats]
    .filter(c => c.count > 0)
    .sort((a, b) => b.avgRating - a.avgRating)[0];

  // Total reviews / total leads
  const totalReviews = leads.reduce((sum, lead) => sum + lead.reviews_count, 0);
  const avgReviews = Math.round(totalReviews / leads.length);

  // Website percentage
  const totalWithWeb = leads.filter((l) => l.has_website === 1).length;
  const webPct = Math.round((totalWithWeb / leads.length) * 100);

  // Top source
  const topSource = sourceStats[0];

  const insightsList = [
    {
      title: "Geographic Density",
      description: topCity
        ? `The most active location is ${topCity.city} representing ${Math.round((topCity.count / leads.length) * 100)}% of your target leads.`
        : "No geographic data available.",
      icon: Trophy,
      color: "text-violet-500 bg-violet-500/10",
    },
    {
      title: "Category Quality Leader",
      description: bestRatedCategory
        ? `"${bestRatedCategory.category}" leads have the highest satisfaction score with an average rating of ${bestRatedCategory.avgRating} stars.`
        : "No category rating data available.",
      icon: Award,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      title: "Engagement & Reviews",
      description: `Leads have accumulated ${totalReviews.toLocaleString()} total reviews, averaging ${avgReviews} reviews per lead.`,
      icon: Star,
      color: "text-rose-500 bg-rose-500/10",
    },
    {
      title: "Outreach Potential",
      description: `${webPct}% of leads have a registered website. The remaining ${100 - webPct}% represent direct cold outreach potential.`,
      icon: Globe,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      title: "Primary Channel",
      description: topSource
        ? `"${topSource.source}" is your top-performing lead acquisition channel, producing ${topSource.count} total leads.`
        : "No channel data available.",
      icon: Compass,
      color: "text-sky-500 bg-sky-500/10",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-violet-500" />
        <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          TWJ Smart Insights
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {insightsList.map((ins, i) => {
          const Icon = ins.icon;
          return (
            <div
              key={i}
              className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${ins.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {ins.title}
                  </h3>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {ins.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
