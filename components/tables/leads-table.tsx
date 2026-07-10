"use client";

import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { Lead } from "@/lib/turso";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Download,
  Copy,
  Check,
  Eye,
  SlidersHorizontal,
  Mail,
  Trash2,
  Calendar,
} from "lucide-react";

interface LeadsTableProps {
  leads: Lead[];
  onDeleteBulk?: (ids: number[]) => void;
}

export function LeadsTable({ leads, onDeleteBulk }: LeadsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");

  const handleCopy = (lead: Lead) => {
    const dataStr = `Name: ${lead.name}\nDomain: ${lead.domain}\nEmail: ${lead.email}\nPhone: ${lead.phone}\nCategory: ${lead.category}\nCity: ${lead.city}\nRating: ${lead.rating}★\nReviews: ${lead.reviews_count}\nWebsite: ${lead.has_website ? "Yes" : "No"}`;
    navigator.clipboard.writeText(dataStr);
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExportCSV = () => {
    const headers = ["Domain", "Name", "Email", "Phone", "Source", "Category", "City", "Rating", "Reviews", "Website Status", "Created At"];
    const rows = leads.map((l) => [
      l.domain,
      l.name,
      l.email,
      l.phone,
      l.source,
      l.category,
      l.city,
      l.rating,
      l.reviews_count,
      l.has_website ? "Has Website" : "No Website",
      l.created_at,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `aura_leads_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = useMemo<ColumnDef<Lead>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-offset-zinc-900"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-offset-zinc-900"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        size: 40,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="font-semibold text-zinc-900 dark:text-zinc-50">
            {row.getValue("name")}
          </div>
        ),
      },
      {
        accessorKey: "domain",
        header: "Domain",
        cell: ({ row }) => (
          <a
            href={`https://${row.getValue("domain")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {row.getValue("domain")}
          </a>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <div className="text-zinc-600 dark:text-zinc-400">{row.getValue("email")}</div>
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => (
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{row.getValue("phone") || "—"}</div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
            {row.getValue("category")}
          </span>
        ),
      },
      {
        accessorKey: "city",
        header: "City",
      },
      {
        accessorKey: "rating",
        header: "Rating",
        cell: ({ row }) => {
          const rating = Number(row.getValue("rating"));
          const colorClass =
            rating >= 4.5
              ? "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400"
              : rating >= 4.0
              ? "text-indigo-600 bg-indigo-500/10 dark:text-indigo-400"
              : rating >= 3.5
              ? "text-amber-600 bg-amber-500/10 dark:text-amber-400"
              : "text-rose-600 bg-rose-500/10 dark:text-rose-400";

          return (
            <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${colorClass}`}>
              ★ {rating}
            </span>
          );
        },
      },
      {
        accessorKey: "reviews_count",
        header: "Reviews",
        cell: ({ row }) => (
          <div className="font-mono text-xs">{row.getValue("reviews_count")}</div>
        ),
      },
      {
        accessorKey: "has_website",
        header: "Website Status",
        cell: ({ row }) => {
          const hasWeb = Number(row.getValue("has_website"));
          return (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                hasWeb
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"
              }`}
            >
              {hasWeb ? "Has Website" : "No Website"}
            </span>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ row }) => {
          const dateStr = String(row.getValue("created_at"));
          return (
            <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {dateStr.split("T")[0]}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const lead = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => handleCopy(lead)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 transition-colors"
                title="Copy Lead Data"
              >
                {copiedId === lead.id ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          );
        },
      },
    ],
    [copiedId]
  );

  const filteredLeads = useMemo(() => {
    if (!globalSearch) return leads;
    const lower = globalSearch.toLowerCase();
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(lower) ||
        l.domain.toLowerCase().includes(lower) ||
        l.email.toLowerCase().includes(lower) ||
        l.city.toLowerCase().includes(lower) ||
        l.category.toLowerCase().includes(lower)
    );
  }, [leads, globalSearch]);

  const table = useReactTable({
    data: filteredLeads,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedRows = table.getSelectedRowModel().flatRows;

  return (
    <div className="space-y-4">
      {/* Search, Action bar, Column Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <input
            type="text"
            placeholder="Search leads in current table results..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="max-w-xs rounded-xl border border-zinc-200 bg-white py-1.5 px-3.5 text-xs transition-all focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
          {selectedRows.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-indigo-50/80 px-3 py-1 text-xs text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
              <span>{selectedRows.length} selected</span>
              <button
                onClick={() => {
                  if (onDeleteBulk) {
                    onDeleteBulk(selectedRows.map((r) => r.original.id));
                    setRowSelection({});
                  }
                }}
                className="ml-2 flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-500 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Selected
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white py-1.5 px-3 text-xs font-semibold text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 hover:dark:border-zinc-700"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>

          {/* Column Toggle Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white py-1.5 px-3 text-xs font-semibold text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 hover:dark:border-zinc-700">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Columns
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 origin-top-right rounded-xl border border-zinc-200 bg-white p-3 shadow-lg ring-1 ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 z-50 hidden group-hover:block">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Toggle columns</p>
              <div className="space-y-1.5">
                {table.getAllLeafColumns().map((column) => {
                  if (column.id === "select" || column.id === "actions") return null;
                  return (
                    <label
                      key={column.id}
                      className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        onChange={column.getToggleVisibilityHandler()}
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                      />
                      <span className="capitalize">{column.id.replace("_", " ")}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/20">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-zinc-50/75 backdrop-blur-md dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="py-3.5 px-4 font-semibold text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider select-none cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1.5">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <span>
                          {header.column.getIsSorted() === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 text-zinc-300 dark:text-zinc-700" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-zinc-500 dark:text-zinc-400"
                >
                  <Eye className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-2" />
                  No leads found. Refine your filters.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3.5 px-4 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between py-2 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span>
              Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of{" "}
              <strong>{table.getPageCount()}</strong>
            </span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="rounded-lg border border-zinc-200 bg-white p-1 text-[11px] dark:border-zinc-800 dark:bg-zinc-950"
            >
              {[10, 20, 30, 45, 100].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-xl border border-zinc-200 bg-white py-1 px-3.5 font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:pointer-events-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-xl border border-zinc-200 bg-white py-1 px-3.5 font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:pointer-events-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
