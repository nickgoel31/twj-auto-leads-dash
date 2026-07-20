import { NextResponse } from "next/server";
import * as db from "@/lib/turso";

export async function GET() {
  try {
    const leads = await db.getProposalSentLeads();
    return NextResponse.json(leads, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
