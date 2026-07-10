"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { LayoutDashboard, FileText, Settings, Sun, Moon, Database, HelpCircle, LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const navigation = [
    { name: "Analytics", href: "/dashboard", icon: LayoutDashboard },
    { name: "Proposal Builder", href: "/dashboard/proposals", icon: FileText },
    { name: "Services & Pricing", href: "/dashboard/pricing", icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-zinc-200 bg-white/70 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/70 flex flex-col justify-between h-screen sticky top-0">
      <div className="flex flex-col gap-6 p-6">
        {/* Branding header */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-tr from-violet-500 to-purple-600 p-2.5 text-white shadow-md shadow-violet-500/20">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-md font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              The Walking Jumbo
            </h1>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Turso Workspace
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold transition-all ${
                  isActive
                      ? "bg-violet-500 text-white shadow-md shadow-violet-500/10"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Settings */}
      <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        {/* Quick info */}
        <div className="flex items-center gap-2 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>API Endpoint Active</span>
        </div>

        {/* Toggle Theme button */}
        <button
          onClick={toggleTheme}
          className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-colors"
        >
          <span className="flex items-center gap-2">
            {theme === "light" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            Theme
          </span>
          <span className="text-[10px] text-zinc-400 capitalize">{theme}</span>
        </button>

        {/* Log Out button */}
        <button
          onClick={async () => {
            await logoutAction();
            window.location.href = "/login";
          }}
          className="flex w-full items-center gap-2 rounded-xl border border-red-200 bg-red-50/50 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-950/30 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
