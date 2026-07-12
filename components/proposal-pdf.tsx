"use client";

import React from "react";
import { pdf } from "@react-pdf/renderer";
import type { ParsedProposal, ProposalMeta } from "@/lib/proposal-types";
import { ProposalDocument } from "./proposal-document";

// ─── Download trigger ────────────────────────────────────────────────────────
export async function downloadProposalPDF(proposal: ParsedProposal, meta: ProposalMeta) {
  const doc = <ProposalDocument proposal={proposal} meta={meta} />;
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeName = meta.clientName.replace(/[^a-z0-9]/gi, "_").slice(0, 40);
  link.download = `proposal_${safeName}_${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
