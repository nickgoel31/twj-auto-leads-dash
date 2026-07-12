import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { ParsedProposal, ProposalMeta } from "@/lib/proposal-types";

const VIOLET = "#7c3aed";
const DARK = "#18181b";
const MUTED = "#52525b";
const BORDER = "#e4e4e7";
const LIGHT_BG = "#f3f0ff";

export const styles = StyleSheet.create({
  // ─── Page ───────────────────────────────────────────────────────────────────
  page: { fontFamily: "Helvetica", backgroundColor: "#ffffff", color: DARK },

  // ─── Cover Page ─────────────────────────────────────────────────────────────
  coverPage: { position: "relative", width: "100%", height: "100%", backgroundColor: "#ffffff" },

  // Top-left orange triangle
  coverTriangleTop: {
    position: "absolute", top: 0, left: 0,
    width: 220, height: 180,
    backgroundColor: VIOLET,
  },
  // Bottom-right dark block
  coverBlockDark: {
    position: "absolute", bottom: 0, right: 0,
    width: 230, height: 170,
    backgroundColor: DARK,
  },
  // Bottom-right orange accent
  coverBlockOrange: {
    position: "absolute", bottom: 0, right: 0,
    width: 195, height: 140,
    backgroundColor: VIOLET,
  },

  coverContent: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    padding: 55,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  coverTopRow: { flexDirection: "row", justifyContent: "flex-end" },
  coverBrandName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: VIOLET },

  coverTitleBlock: { marginTop: 60 },
  coverTitleLabel: { fontSize: 36, fontFamily: "Helvetica-Bold", color: VIOLET, letterSpacing: 1, lineHeight: 1.2 },
  coverSubtitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: DARK, marginTop: 12, maxWidth: 310 },

  coverMeta: { marginBottom: 48 },
  coverMetaLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: DARK, textTransform: "uppercase", letterSpacing: 1 },
  coverMetaName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: VIOLET, marginTop: 3 },
  coverMetaRole: { fontSize: 9, fontFamily: "Helvetica", color: MUTED, marginTop: 2 },
  coverMetaInfo: { fontSize: 9, fontFamily: "Courier", color: MUTED, marginTop: 1 },

  coverDateRow: { marginTop: 10 },
  coverDate: { fontSize: 9, color: MUTED },

  // ─── Content Page ───────────────────────────────────────────────────────────
  contentPage: { padding: "40px 50px" },
  pageHeader: {
    borderBottomWidth: 2, borderBottomColor: VIOLET, borderBottomStyle: "solid",
    paddingBottom: 10, marginBottom: 24, flexDirection: "row",
    justifyContent: "space-between", alignItems: "flex-end",
  },
  pageHeaderTitle: { fontSize: 18, fontFamily: "Helvetica-Bold", color: DARK },
  pageHeaderSub: { fontSize: 9, fontFamily: "Helvetica", color: MUTED },

  // ─── Sections ───────────────────────────────────────────────────────────────
  section: { marginBottom: 22 },
  sectionHeading: {
    fontSize: 12, fontFamily: "Helvetica-Bold", color: VIOLET,
    marginBottom: 6, paddingBottom: 4,
    borderBottomWidth: 1, borderBottomColor: BORDER, borderBottomStyle: "solid",
  },
  sectionText: { fontSize: 9.5, fontFamily: "Helvetica", color: DARK, lineHeight: 1.6, marginBottom: 6 },

  // ─── Bullet List ────────────────────────────────────────────────────────────
  bulletList: { marginTop: 4 },
  bulletRow: { flexDirection: "row", marginBottom: 5 },
  bulletDot: { fontSize: 9, fontFamily: "Helvetica-Bold", color: VIOLET, width: 14 },
  bulletText: { fontSize: 9.5, fontFamily: "Helvetica", color: DARK, lineHeight: 1.6, flex: 1 },

  // ─── Numbered List ──────────────────────────────────────────────────────────
  numberedRow: { flexDirection: "row", marginBottom: 5 },
  numberedNum: { fontSize: 9, fontFamily: "Helvetica-Bold", color: VIOLET, width: 18 },
  numberedText: { fontSize: 9.5, fontFamily: "Helvetica", color: DARK, lineHeight: 1.6, flex: 1 },

  // ─── Pricing Table ──────────────────────────────────────────────────────────
  table: { marginTop: 10, borderWidth: 1, borderColor: BORDER, borderStyle: "solid", borderRadius: 4 },
  tableHeader: { flexDirection: "row", backgroundColor: DARK, padding: "7px 10px" },
  tableHeaderCell: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  tableRow: { flexDirection: "row", padding: "7px 10px", borderTopWidth: 1, borderTopColor: BORDER, borderTopStyle: "solid" },
  tableRowAlt: { flexDirection: "row", padding: "7px 10px", borderTopWidth: 1, borderTopColor: BORDER, borderTopStyle: "solid", backgroundColor: LIGHT_BG },
  tableCell: { fontSize: 9, fontFamily: "Helvetica", color: DARK, lineHeight: 1.5 },
  tableCellBold: { fontSize: 9, fontFamily: "Helvetica-Bold", color: DARK },

  colName: { flex: 2.2 },
  colPrice: { flex: 1 },
  colBilling: { flex: 1 },
  colDesc: { flex: 3 },

  // ─── Total row ──────────────────────────────────────────────────────────────
  totalRow: {
    flexDirection: "row", justifyContent: "flex-end",
    marginTop: 8, paddingTop: 6,
    borderTopWidth: 2, borderTopColor: VIOLET, borderTopStyle: "solid",
  },
  totalLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: DARK, marginRight: 8 },
  totalValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: VIOLET },

  // ─── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    position: "absolute", bottom: 28, left: 50, right: 50,
    flexDirection: "row", justifyContent: "space-between",
    borderTopWidth: 1, borderTopColor: BORDER, borderTopStyle: "solid",
    paddingTop: 6,
  },
  footerText: { fontSize: 8, fontFamily: "Helvetica", color: MUTED },

  // ─── Portfolio Page ──────────────────────────────────────────────────────────
  portfolioPage: { padding: "40px 50px" },
  portfolioGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 15 },
  portfolioCard: { width: "48%", marginBottom: 15, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 6, backgroundColor: "#fafafa" },
  portfolioImage: { width: "100%", height: 120, objectFit: "cover", borderRadius: 2 },
  portfolioMetaLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: VIOLET, marginTop: 4 },
  portfolioDesc: { fontSize: 7.5, color: MUTED, marginTop: 2, lineHeight: 1.3 },
});

export function ProposalDocument({ proposal, meta, originUrl }: { proposal: ParsedProposal; meta: ProposalMeta; originUrl?: string }) {
  const getFullImageUrl = (path: string) => {
    if (originUrl) {
      return `${originUrl}${path}`;
    }
    if (typeof window !== "undefined") {
      return `${window.location.origin}${path}`;
    }
    return path;
  };

  return (
    <Document title={proposal.title} author="The Walking Jumbo" creator="The Walking Jumbo Dashboard">

      {/* ── Cover Page ── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <View style={styles.coverTriangleTop} />
          <View style={styles.coverBlockDark} />
          <View style={styles.coverBlockOrange} />

          <View style={styles.coverContent}>
            <View style={styles.coverTopRow}>
              <Text style={styles.coverBrandName}>The Walking Jumbo</Text>
            </View>

            <View style={styles.coverTitleBlock}>
              <Text style={styles.coverTitleLabel}>PROJECT{"\n"}PROPOSAL</Text>
              <Text style={styles.coverSubtitle}>{proposal.title}</Text>
            </View>

            <View style={styles.coverMeta}>
              <Text style={styles.coverMetaLabel}>Prepared For:</Text>
              <Text style={styles.coverMetaName}>{meta.clientName}</Text>
              <Text style={styles.coverMetaRole}>{meta.clientCategory} · {meta.clientCity}</Text>
              <Text style={styles.coverMetaInfo}>{meta.clientPhone}</Text>
              <View style={styles.coverDateRow}>
                <Text style={styles.coverDate}>Date: {meta.generatedAt}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>

      {/* ── Content Page ── */}
      <Page size="A4" style={[styles.page, styles.contentPage]}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageHeaderTitle}>Project Proposal</Text>
          <Text style={styles.pageHeaderSub}>{meta.clientName} · {meta.generatedAt}</Text>
        </View>

        {proposal.sections.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionText}>{section.content}</Text>

            {section.listItems && section.listItems.length > 0 && (
              <View style={styles.bulletList}>
                {section.listItems.map((item, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {section.orderedList && section.orderedList.length > 0 && (
              <View style={styles.bulletList}>
                {section.orderedList.map((item, i) => (
                  <View key={i} style={styles.numberedRow}>
                    <Text style={styles.numberedNum}>{i + 1}.</Text>
                    <Text style={styles.numberedText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {section.heading.startsWith("3.") && proposal.pricingRows.length > 0 && (
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, styles.colName]}>Service</Text>
                  <Text style={[styles.tableHeaderCell, styles.colPrice]}>Price</Text>
                  <Text style={[styles.tableHeaderCell, styles.colBilling]}>Billing</Text>
                  <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
                </View>

                {proposal.pricingRows.map((row, i) => (
                  <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                    <Text style={[styles.tableCellBold, styles.colName]}>{row.name}</Text>
                    <Text style={[styles.tableCellBold, styles.colPrice]}>{row.price}</Text>
                    <Text style={[styles.tableCell, styles.colBilling]}>{row.billing}</Text>
                    <Text style={[styles.tableCell, styles.colDesc]}>{row.description}</Text>
                  </View>
                ))}

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Investment:</Text>
                  <Text style={styles.totalValue}>{proposal.totalInvestment}</Text>
                </View>
              </View>
            )}
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>The Walking Jumbo — Confidential</Text>
          <Text style={styles.footerText}>{meta.generatedAt}</Text>
        </View>
      </Page>

      {/* ── Portfolio Page ── */}
      {proposal.wantsPortfolio && proposal.portfolioItems && proposal.portfolioItems.length > 0 && (
        <Page size="A4" style={[styles.page, styles.portfolioPage]}>
          <View style={styles.pageHeader}>
            <Text style={styles.pageHeaderTitle}>Selected Portfolio</Text>
            <Text style={styles.pageHeaderSub}>{meta.clientName} · {meta.generatedAt}</Text>
          </View>
          
          <Text style={styles.sectionText}>
            Here are selected designs and concepts representing our capability in this domain:
          </Text>

          <View style={styles.portfolioGrid}>
            {proposal.portfolioItems.map((item, i) => (
              <View key={i} style={styles.portfolioCard}>
                <Image src={getFullImageUrl(item.imageUrl)} style={styles.portfolioImage} />
                <Text style={styles.portfolioMetaLabel}>{item.category}</Text>
                <Text style={styles.portfolioDesc}>{item.description}</Text>
              </View>
            ))}
          </View>

          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>The Walking Jumbo — Confidential</Text>
            <Text style={styles.footerText}>{meta.generatedAt}</Text>
          </View>
        </Page>
      )}
    </Document>
  );
}
