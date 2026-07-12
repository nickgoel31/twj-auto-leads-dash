import { NextResponse } from "next/server";
import * as db from "@/lib/turso";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const phone = url.searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        { error: "Missing 'phone' query parameter" },
        { status: 400 }
      );
    }

    const leads = await db.getLeads();
    const lead = leads.find((l) => l.phone === phone);

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      lead,
    });
  } catch (error: any) {
    console.error("API error in get lead by phone route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
