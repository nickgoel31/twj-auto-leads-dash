import React from "react";
import { NextResponse } from "next/server";
import { generateLeadProposal } from "@/actions/proposals";
import * as db from "@/lib/turso";
import { renderToBuffer } from "@react-pdf/renderer";
import { ProposalDocument } from "@/components/proposal-document";
import { UTApi } from "uploadthing/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { leadId, callSummary } = body;
    const wantsPortfolio = body.wantsPortfolio === true || body.wantsPortfolio === "true" || body.wants_portfolio === true || body.wants_portfolio === "true";
    const serviceType = body.serviceType || body.service_type || "website";
    
    let agreedPricing = body.agreedPricing ? Number(body.agreedPricing) : (body.agreed_pricing ? Number(body.agreed_pricing) : undefined);
    if (agreedPricing === undefined && body.quoted_price) {
      const parsedVal = Number(String(body.quoted_price).replace(/[^0-9]/g, ""));
      if (!isNaN(parsedVal)) {
        agreedPricing = parsedVal;
      }
    }
    
    const url = new URL(request.url);
    const format = url.searchParams.get("format") || body.format;

    // Fallback variables if leadId is not provided
    const phone = body.phone || body.mobileNumber || body.mobile_number || body.mobile;
    const name = body.name;
    const city = body.city || body.City;
    const category = body.category;
    const payloadCallSummary = callSummary || body.callSummary || body.call_summary;

    let leadIdToUse: number;

    if (!leadId) {
      if (!phone) {
        return NextResponse.json(
          { error: "Missing required parameter: leadId or mobile number (phone)" },
          { status: 400 }
        );
      }

      // Check if lead already exists by phone
      const leads = await db.getLeads();
      const existingLead = leads.find((l) => l.phone === phone);

      if (existingLead) {
        leadIdToUse = existingLead.id;
        
        // Update existing lead details if new ones were provided
        await db.client.execute({
          sql: `UPDATE leads SET 
                  name = COALESCE(?, name), 
                  city = COALESCE(?, city), 
                  category = COALESCE(?, category), 
                  call_summary = COALESCE(?, call_summary)
                WHERE id = ?`,
          args: [
            name || null,
            city || null,
            category || null,
            payloadCallSummary || null,
            leadIdToUse
          ]
        });
      } else {
        // Create new lead in database
        const insertResult = await db.client.execute({
          sql: `INSERT INTO leads (domain, name, email, source, created_at, phone, category, city, rating, reviews_count, has_website, call_summary)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            "api-lead.com",
            name || "API Lead",
            "info@api-lead.com",
            "Developer API",
            new Date().toISOString(),
            phone,
            category || "Local Business",
            city || "Unknown",
            5.0,
            0,
            0,
            payloadCallSummary || "Lead registered via API."
          ]
        });
        leadIdToUse = Number(insertResult.lastInsertRowid);
      }
    } else {
      leadIdToUse = Number(leadId);
    }

    const leads = await db.getLeads();
    const lead = leads.find((l) => l.id === leadIdToUse);

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    const summaryToUse = payloadCallSummary || body.requirement_summary || lead.call_summary || "General service discussion.";

    // Trigger proposal generation
    const result = await generateLeadProposal(
      leadIdToUse, 
      summaryToUse, 
      wantsPortfolio, 
      serviceType, 
      agreedPricing,
      {
        call_outcome: body.call_outcome,
        need_clarity: body.need_clarity,
        deal_status: body.deal_status,
        business_type_detail: body.business_type_detail,
        requirement_summary: body.requirement_summary,
        quoted_price: body.quoted_price,
        discount_offered_pct: body.discount_offered_pct,
        proposal_notes: body.proposal_notes,
        proposal_intent: body.proposal_intent,
      }
    );

    if (format === "pdf") {
      if (!process.env.UPLOADTHING_TOKEN) {
        return NextResponse.json(
          { error: "Missing environment variable: UPLOADTHING_TOKEN. Please set this in your Netlify variables or .env file." },
          { status: 500 }
        );
      }

      const doc = React.createElement(ProposalDocument, { proposal: result.proposal, meta: result.meta, originUrl: url.origin });
      const buffer = await renderToBuffer(doc as any);
      const clientNameSafe = result.meta.clientName.replace(/[^a-z0-9]/gi, "_");
      
      const file = new File([buffer as any], `proposal_${clientNameSafe}_${Date.now()}.pdf`, {
        type: "application/pdf",
      });

      const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN });
      const uploadRes = await utapi.uploadFiles(file);
      const uploadData = Array.isArray(uploadRes) ? uploadRes[0] : uploadRes;

      if (uploadData.error) {
        throw new Error(uploadData.error.message || "UploadThing upload failed");
      }

      return NextResponse.json({
        success: true,
        pdfUrl: uploadData.data.url,
        lead: {
          id: lead.id,
          name: lead.name,
          domain: lead.domain,
          category: lead.category,
          city: lead.city,
          phone: lead.phone,
        },
      });
    }

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        name: lead.name,
        domain: lead.domain,
        category: lead.category,
        city: lead.city,
        phone: lead.phone,
      },
      proposal: result.proposal,
      generated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("API error in proposals route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
