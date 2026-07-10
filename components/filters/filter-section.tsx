"use client";

import React, { useMemo } from "react";
import { Filter, RotateCcw, X, Search, Calendar, Star, Globe, Eye } from "lucide-react";
import { Lead } from "@/lib/turso";

interface FilterSectionProps {
  allLeads: Lead[];
  filters: any;
  setFilters: (filters: any) => void;
  onReset: () => void;
}

export function FilterSection({
  allLeads,
  filters,
  setFilters,
  onReset,
}: FilterSectionProps) {
  // Extract unique options for filter select elements
  const { cities, categories, sources } = useMemo(() => {
    const citySet = new Set<string>();
    const categorySet = new Set<string>();
    const sourceSet = new Set<string>();

    allLeads.forEach((l) => {
      if (l.city) citySet.add(l.city);
      if (l.category) categorySet.add(l.category);
      if (l.source) sourceSet.add(l.source);
    });

    return {
      cities: Array.from(citySet).sort(),
      categories: Array.from(categorySet).sort(),
      sources: Array.from(sourceSet).sort(),
    };
  }, [allLeads]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.city) count++;
    if (filters.category) count++;
    if (filters.source) count++;
    if (filters.ratingMin !== 0 || filters.ratingMax !== 5) count++;
    if (filters.hasWebsite !== "all") count++;
    if (filters.reviewsMin !== 0 || filters.reviewsMax !== 100000) count++;
    if (filters.search) count++;
    if (filters.dateStart || filters.dateEnd) count++;
    return count;
  }, [filters]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const removeFilter = (key: string, defaultValue: any) => {
    setFilters((prev: any) => {
      const updated = { ...prev };
      if (key === "rating") {
        updated.ratingMin = 0;
        updated.ratingMax = 5;
      } else if (key === "reviews") {
        updated.reviewsMin = 0;
        updated.reviewsMax = 100000;
      } else if (key === "date") {
        updated.dateStart = "";
        updated.dateEnd = "";
      } else {
        updated[key] = defaultValue;
      }
      return updated;
    });
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-indigo-500" />
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Advanced Filters
          </h2>
          {activeFiltersCount > 0 && (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
              {activeFiltersCount}
            </span>
          )}
        </div>

        {activeFiltersCount > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 self-start text-xs font-semibold text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Filters
          </button>
        )}
      </div>

      {/* Inputs grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Global Search */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Search
          </label>
          <div className="relative">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search domain, name, email..."
              value={filters.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pr-4 pl-9 text-sm transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-indigo-500 dark:focus:bg-zinc-900"
            />
          </div>
        </div>

        {/* City Filter */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            City
          </label>
          <select
            value={filters.city || ""}
            onChange={(e) => handleFilterChange("city", e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-indigo-500"
          >
            <option value="">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Category
          </label>
          <select
            value={filters.category || ""}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Source Filter */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Source
          </label>
          <select
            value={filters.source || ""}
            onChange={(e) => handleFilterChange("source", e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-indigo-500"
          >
            <option value="">All Sources</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>

        {/* Has Website Toggle */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Website Presence
          </label>
          <div className="flex rounded-xl bg-zinc-50 p-1 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            {["all", "yes", "no"].map((option) => (
              <button
                key={option}
                onClick={() => handleFilterChange("hasWebsite", option)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold capitalize transition-all ${
                  filters.hasWebsite === option
                    ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {option === "all" ? "All" : option === "yes" ? "Has Website" : "No Website"}
              </button>
            ))}
          </div>
        </div>

        {/* Rating Range */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Min Rating ({filters.ratingMin}★)
            </label>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {filters.ratingMin} - 5.0
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={filters.ratingMin || 0}
            onChange={(e) => handleFilterChange("ratingMin", parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        {/* Reviews Range */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Min Reviews ({filters.reviewsMin})
            </label>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {filters.reviewsMin}+
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="10000"
            step="100"
            value={filters.reviewsMin || 0}
            onChange={(e) => handleFilterChange("reviewsMin", parseInt(e.target.value))}
            className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-600"
          />
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Created Date (Start)
          </label>
          <div className="relative">
            <input
              type="date"
              value={filters.dateStart || ""}
              onChange={(e) => handleFilterChange("dateStart", e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-sm text-zinc-800 dark:text-zinc-100 transition-all focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>
        </div>
      </div>

      {/* Active Chips */}
      {activeFiltersCount > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
            Active:
          </span>
          {filters.search && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 py-1 pr-1.5 pl-2.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              Search: "{filters.search}"
              <button onClick={() => removeFilter("search", "")}>
                <X className="h-3 w-3 hover:text-rose-500" />
              </button>
            </span>
          )}
          {filters.city && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 py-1 pr-1.5 pl-2.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              City: {filters.city}
              <button onClick={() => removeFilter("city", "")}>
                <X className="h-3 w-3 hover:text-rose-500" />
              </button>
            </span>
          )}
          {filters.category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 py-1 pr-1.5 pl-2.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              Category: {filters.category}
              <button onClick={() => removeFilter("category", "")}>
                <X className="h-3 w-3 hover:text-rose-500" />
              </button>
            </span>
          )}
          {filters.source && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 py-1 pr-1.5 pl-2.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              Source: {filters.source}
              <button onClick={() => removeFilter("source", "")}>
                <X className="h-3 w-3 hover:text-rose-500" />
              </button>
            </span>
          )}
          {filters.hasWebsite !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 py-1 pr-1.5 pl-2.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              Website: {filters.hasWebsite === "yes" ? "Yes" : "No"}
              <button onClick={() => removeFilter("hasWebsite", "all")}>
                <X className="h-3 w-3 hover:text-rose-500" />
              </button>
            </span>
          )}
          {(filters.ratingMin !== 0 || filters.ratingMax !== 5) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 py-1 pr-1.5 pl-2.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              Rating: {filters.ratingMin}★+
              <button onClick={() => removeFilter("rating", null)}>
                <X className="h-3 w-3 hover:text-rose-500" />
              </button>
            </span>
          )}
          {(filters.reviewsMin !== 0 || filters.reviewsMax !== 100000) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 py-1 pr-1.5 pl-2.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              Reviews: {filters.reviewsMin}+
              <button onClick={() => removeFilter("reviews", null)}>
                <X className="h-3 w-3 hover:text-rose-500" />
              </button>
            </span>
          )}
          {(filters.dateStart || filters.dateEnd) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 py-1 pr-1.5 pl-2.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              Date: From {filters.dateStart || "Any"}
              <button onClick={() => removeFilter("date", null)}>
                <X className="h-3 w-3 hover:text-rose-500" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
