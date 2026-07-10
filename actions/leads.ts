"use server";

import * as db from "@/lib/turso";

export async function fetchDashboardData(filters: {
  city?: string;
  category?: string;
  source?: string;
  ratingMin?: number;
  ratingMax?: number;
  hasWebsite?: string;
  reviewsMin?: number;
  reviewsMax?: number;
  search?: string;
  dateStart?: string;
  dateEnd?: string;
  sortBy?: string;
}) {
  const [
    stats,
    leads,
    cityStats,
    categoryStats,
    sourceStats,
    ratingDistribution,
    growthData,
  ] = await Promise.all([
    db.getDashboardStats(filters),
    db.getLeads(filters),
    db.getCityStats(filters),
    db.getCategoryStats(filters),
    db.getSourceStats(filters),
    db.getRatingDistribution(filters),
    db.getGrowthData(filters),
  ]);

  return {
    stats,
    leads,
    cityStats,
    categoryStats,
    sourceStats,
    ratingDistribution,
    growthData,
  };
}
