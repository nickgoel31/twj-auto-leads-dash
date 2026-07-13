import { NextResponse } from "next/server";
import * as db from "@/lib/turso";

export async function GET(request: Request) {
  try {
    const leads = await db.getLeads();

    // Map lead fields to ensure compatibility with client platforms (e.g. mapping phone to phone_number)
    const formattedLeads = leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      phone_number: lead.phone, // compatibility fallback
      email: lead.email,
      domain: lead.domain,
      category: lead.category,
      city: lead.city,
      rating: lead.rating,
      reviews_count: lead.reviews_count,
      has_website: lead.has_website,
      call_summary: lead.call_summary,
      created_at: lead.created_at,
    }));

    return new NextResponse(JSON.stringify(formattedLeads), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error: any) {
    console.error("API error in GET /api/leads:", error);
    return new NextResponse(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
