"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useTransition } from "react";
import { generateLeadProposal } from "@/actions/proposals";
import { fetchDashboardData } from "@/actions/leads";
import { Lead } from "@/lib/turso";
import type { ParsedProposal, ProposalMeta } from "@/lib/proposal-types";
import {
  Sparkles,
  MapPin,
  Tag,
  Phone,
  FileText,
  Copy,
  Check,
  Code,
  Loader2,
  Download,
} from "lucide-react";

export default function ProposalsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [callSummary, setCallSummary] = useState("");
  const [proposal, setProposal] = useState<ParsedProposal | null>(null);
  const [meta, setMeta] = useState<ProposalMeta | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDownloading, setIsDownloading] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [wantsPortfolio, setWantsPortfolio] = useState(false);
  const [serviceType, setServiceType] = useState<"website" | "marketing" | "ai-chatbot" | "ai-voice-agent" >("website");
  const [agreedPricing, setAgreedPricing] = useState<string>("");
  const [curlTab, setCurlTab] = useState<"id" | "fields">("id");

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const res = await fetchDashboardData({});
        setLeads(res.leads);
        if (res.leads.length > 0) {
          setSelectedLeadId(res.leads[0].id);
          setCallSummary(res.leads[0].call_summary || "");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingLeads(false);
      }
    };
    loadLeads();
  }, []);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  const handleLeadChange = (id: number) => {
    setSelectedLeadId(id);
    const lead = leads.find((l) => l.id === id);
    if (lead) {
      setCallSummary(lead.call_summary || "");
      setProposal(null);
      setMeta(null);
    }
  };

  const handleGenerateProposal = () => {
    if (!selectedLeadId) return;
    startTransition(async () => {
      try {
        const res = await generateLeadProposal(selectedLeadId, callSummary, wantsPortfolio, serviceType, agreedPricing ? Number(agreedPricing) : undefined);
        if (res.success) {
          setProposal(res.proposal);
          setMeta(res.meta);
          setLeads((prev) =>
            prev.map((l) => (l.id === selectedLeadId ? { ...l, call_summary: callSummary } : l))
          );
        }
      } catch (e) {
        console.error(e);
      }
    });
  };

  const handleDownloadPDF = async () => {
    if (!proposal || !meta) return;
    setIsDownloading(true);
    try {
      const { downloadProposalPDF } = await import("@/components/proposal-pdf");
      await downloadProposalPDF(proposal, meta);
    } catch (e) {
      console.error("PDF download failed:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  const curlCodeId = `curl -X POST https://stunning-semolina-2f5d9a.netlify.app/api/proposals/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "leadId": ${selectedLeadId || 1},
    "callSummary": "${(callSummary || "Client wants standard web application support.").replace(/"/g, '\\"').slice(0, 100)}",
    "wantsPortfolio": ${wantsPortfolio},
    "serviceType": "${serviceType}"${agreedPricing ? `,
    "agreedPricing": ${agreedPricing}` : ""}
  }'`;

  const curlCodeFields = `curl -X POST https://stunning-semolina-2f5d9a.netlify.app/api/proposals/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "${selectedLead?.phone || "9876543210"}",
    "name": "${(selectedLead?.name || "Acme Corp").replace(/"/g, '\\"')}",
    "city": "${(selectedLead?.city || "Mumbai").replace(/"/g, '\\"')}",
    "category": "${(selectedLead?.category || "Restaurant").replace(/"/g, '\\"')}",
    "callSummary": "${(callSummary || "Client wants standard web application support.").replace(/"/g, '\\"').slice(0, 100)}",
    "wantsPortfolio": ${wantsPortfolio},
    "serviceType": "${serviceType}"${agreedPricing ? `,
    "agreedPricing": ${agreedPricing}` : ""}
  }'`;

  const activeCurlCode = curlTab === "id" ? curlCodeId : curlCodeFields;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCurlCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyProposal = () => {
    if (!proposal) return;
    const text = [
      proposal.title,
      "",
      ...proposal.sections.flatMap((s) => [
        s.heading,
        s.content,
        ...(s.listItems?.map((i) => `• ${i}`) ?? []),
        ...(s.orderedList?.map((i, idx) => `${idx + 1}. ${i}`) ?? []),
        "",
      ]),
      "PRICING",
      ...proposal.pricingRows.map((r) => `${r.name} - ${r.price} (${r.billing}): ${r.description}`),
      `Total Investment: ${proposal.totalInvestment}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 min-h-screen bg-zinc-50 dark:bg-zinc-950 grid-bg transition-colors duration-300">
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="flex items-center justify-between py-4 px-6">
          <div>
            <h1 className="text-md font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              AI Proposal Generator & API Console
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Generate structured sales proposals with a downloadable PDF
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Configure Proposal Details
              </h2>
            </div>

            {loadingLeads ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Select Target Lead
                  </label>
                  <select
                    value={selectedLeadId || ""}
                    onChange={(e) => handleLeadChange(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs transition-all focus:border-violet-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Service Type
                    </label>
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value as any)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs transition-all focus:border-violet-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    >
                      <option value="website">Website</option>
                      <option value="marketing">Marketing</option>
                      <option value="ai-chatbot">AI Chatbot</option>
                      <option value="ai-voice-agent">AI Voice Agent</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="wantsPortfolio"
                      checked={wantsPortfolio}
                      onChange={(e) => setWantsPortfolio(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                    />
                    <label htmlFor="wantsPortfolio" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      Include Portfolio
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Agreed Price (₹, optional)
                  </label>
                  <input
                    type="number"
                    value={agreedPricing}
                    onChange={(e) => setAgreedPricing(e.target.value)}
                    placeholder="e.g., 4000"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs transition-all focus:border-violet-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>

                {selectedLead && (
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800/50 dark:bg-zinc-950/20 space-y-2.5">
                    <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Lead Context</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                        <MapPin className="h-3.5 w-3.5 text-violet-500" />
                        <span>City: <strong>{selectedLead.city}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                        <Tag className="h-3.5 w-3.5 text-violet-500" />
                        <span>Category: <strong>{selectedLead.category}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 col-span-2">
                        <Phone className="h-3.5 w-3.5 text-violet-500" />
                        <span>Phone: <strong className="font-mono">{selectedLead.phone}</strong></span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Call Summary & Client Context
                  </label>
                  <textarea
                    value={callSummary}
                    onChange={(e) => setCallSummary(e.target.value)}
                    rows={6}
                    placeholder="Enter what was discussed (e.g., goals, pain points, budget, timeline)..."
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs focus:border-violet-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 resize-none"
                  />
                </div>

                <button
                  onClick={handleGenerateProposal}
                  disabled={isPending || !selectedLeadId}
                  className="w-full rounded-xl bg-violet-600 py-3 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Generating Proposal...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" />Generate Proposal</>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* API Console */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-violet-500" />
                <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Developer Endpoint
                </h2>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                POST /api/proposals/generate
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Automate from telephony webhooks, CRMs, or external applications.
            </p>
            <div className="flex gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <button
                onClick={() => setCurlTab("id")}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-colors ${
                  curlTab === "id"
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400"
                    : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                }`}
              >
                By Lead ID
              </button>
              <button
                onClick={() => setCurlTab("fields")}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-colors ${
                  curlTab === "fields"
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400"
                    : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                }`}
              >
                By Client Details / Mobile
              </button>
            </div>
            <div className="relative">
              <button
                onClick={handleCopyCode}
                className="absolute right-2.5 top-2.5 rounded-lg p-1 bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <pre className="rounded-xl bg-zinc-950 p-4 text-[10px] text-zinc-300 font-mono overflow-x-auto leading-relaxed border border-zinc-800">
                {activeCurlCode}
              </pre>
            </div>
          </div>
        </div>

        {/* Right: Preview Panel */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 h-full flex flex-col min-h-[500px]">
            {proposal && meta ? (
              <div className="flex-1 flex flex-col space-y-4">
                {/* Action bar */}
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-violet-500" />
                    <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                      Proposal Preview
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyProposal}
                      className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white py-1.5 px-3 text-xs font-semibold text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 transition-colors"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied" : "Copy Text"}
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      disabled={isDownloading}
                      className="flex items-center gap-1.5 rounded-xl bg-violet-600 py-1.5 px-3 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-60 transition-colors"
                    >
                      {isDownloading ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" />Building PDF...</>
                      ) : (
                        <><Download className="h-3.5 w-3.5" />Download PDF</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Preview content */}
                <div className="flex-1 overflow-y-auto max-h-[620px] space-y-5 p-2">
                  {/* Title */}
                  <h1 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 border-b-2 border-violet-500 pb-2">
                    {proposal.title}
                  </h1>

                  {proposal.sections.map((section, idx) => (
                    <div key={idx} className="space-y-2">
                      <h2 className="text-sm font-bold text-violet-600 dark:text-violet-400 border-b border-zinc-100 dark:border-zinc-800 pb-1">
                        {section.heading}
                      </h2>
                      <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {section.content}
                      </p>

                      {/* Bullet list */}
                      {section.listItems && section.listItems.length > 0 && (
                        <ul className="space-y-1 mt-1">
                          {section.listItems.map((item, i) => (
                            <li key={i} className="flex gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                              <span className="text-violet-500 font-bold mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Ordered list */}
                      {section.orderedList && section.orderedList.length > 0 && (
                        <ol className="space-y-1 mt-1">
                          {section.orderedList.map((item, i) => (
                            <li key={i} className="flex gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                              <span className="text-violet-500 font-bold w-4 shrink-0">{i + 1}.</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ol>
                      )}

                      {/* Pricing table after section 3 */}
                      {section.heading.startsWith("3.") && proposal.pricingRows.length > 0 && (
                        <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-zinc-900 text-white">
                              <tr>
                                <th className="px-3 py-2.5 font-semibold">Service</th>
                                <th className="px-3 py-2.5 font-semibold">Price</th>
                                <th className="px-3 py-2.5 font-semibold">Billing</th>
                                <th className="px-3 py-2.5 font-semibold">Description</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                              {proposal.pricingRows.map((row, i) => (
                                <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-zinc-900/20" : "bg-zinc-50 dark:bg-zinc-900/40"}>
                                  <td className="px-3 py-2.5 font-semibold text-zinc-900 dark:text-zinc-100">{row.name}</td>
                                  <td className="px-3 py-2.5 font-bold text-violet-600 dark:text-violet-400">{row.price}</td>
                                  <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-400">{row.billing}</td>
                                  <td className="px-3 py-2.5 text-zinc-500 dark:text-zinc-400">{row.description}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-violet-500">
                                <td colSpan={3} className="px-3 py-2.5 text-right text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                  Total Investment:
                                </td>
                                <td className="px-3 py-2.5 font-extrabold text-violet-600 dark:text-violet-400">
                                  {proposal.totalInvestment}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Portfolio Section Preview */}
                  {proposal.wantsPortfolio && proposal.portfolioItems && proposal.portfolioItems.length > 0 && (
                    <div className="space-y-3 mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                      <h2 className="text-sm font-bold text-violet-600 dark:text-violet-400">
                        Selected Portfolio Projects
                      </h2>
                      <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                        The following works will be included in the PDF:
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {proposal.portfolioItems.map((item, idx) => (
                          <div key={idx} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-2 bg-zinc-50/50 dark:bg-zinc-950/20 space-y-2">
                            <img
                              src={item.imageUrl}
                              alt={item.category}
                              className="w-full h-20 object-cover rounded-lg border border-zinc-250 dark:border-zinc-800"
                            />
                            <p className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100">{item.category}</p>
                            <p className="text-[9px] text-zinc-500 dark:text-zinc-400 leading-tight">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No Proposal Generated</h3>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                  Select a lead, add call notes, and click Generate Proposal. Download as PDF once ready.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
