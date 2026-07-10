"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useTransition } from "react";
import { fetchPricingCatalog, updateCatalogPricing } from "@/actions/proposals";
import { PricingItem } from "@/lib/turso";
import { ShieldCheck, Edit2, Check, X, RefreshCw, DollarSign } from "lucide-react";

export default function PricingCatalogPage() {
  const [catalog, setCatalog] = useState<PricingItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [editDesc, setEditDesc] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const loadCatalog = async () => {
    try {
      const items = await fetchPricingCatalog();
      setCatalog(items);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleStartEdit = (item: PricingItem) => {
    setEditingId(item.id);
    setEditPrice(item.price.toString());
    setEditDesc(item.description);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = (id: number) => {
    const parsedPrice = parseFloat(editPrice);
    if (isNaN(parsedPrice)) return;

    startTransition(async () => {
      try {
        await updateCatalogPricing(id, parsedPrice, editDesc);
        setMessage("Catalog item updated successfully!");
        setEditingId(null);
        await loadCatalog();
        setTimeout(() => setMessage(null), 3000);
      } catch (e) {
        console.error(e);
      }
    });
  };

  return (
    <div className="flex-1 min-h-screen bg-zinc-50 dark:bg-zinc-950 grid-bg transition-colors duration-300">
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="flex items-center justify-between py-4 px-6">
          <div>
            <h1 className="text-md font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Services & Pricing Catalog
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Configure available service offerings and pricing models evaluated by the AI
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-950/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 text-xs font-semibold">
            {message}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 space-y-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-violet-500" />
            <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Active Offerings
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {catalog.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/40 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        {item.name}
                      </h3>
                      {!isEditing && (
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors p-1"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="mt-4 space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                            Price ($)
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2 h-4 w-4 text-zinc-400" />
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs focus:border-violet-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                            Description
                          </label>
                          <textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs focus:border-violet-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 resize-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          {item.description}
                        </p>
                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                            ${item.price.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
                            / {item.billing}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {isEditing && (
                    <div className="mt-4 flex gap-2 justify-end">
                      <button
                        onClick={handleCancelEdit}
                        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 flex items-center gap-1"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        disabled={isPending}
                        className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50 flex items-center gap-1"
                      >
                        {isPending ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
