import { NextRequest, NextResponse } from "next/server";
import { client, initializeDatabase } from "@/lib/turso";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { phone, proposal_sent, proposal_link } = body;

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    if (phone.startsWith("91") && phone.length > 10) {
      phone = phone.substring(2);
    }

    if (proposal_sent === undefined) {
      return NextResponse.json({ error: "proposal_sent is required" }, { status: 400 });
    }

    await initializeDatabase();

    // Check if the lead exists
    const leadResult = await client.execute({
      sql: "SELECT * FROM leads WHERE phone = ?",
      args: [phone],
    });

    if (leadResult.rows.length === 0) {
      return NextResponse.json({ error: "Lead with this phone number not found" }, { status: 404 });
    }

    // Build the update query dynamically
    let updateSql = "UPDATE leads SET proposal_sent = ?";
    const args: any[] = [proposal_sent];

    // Optionally update proposal_link if it was provided
    if (proposal_link !== undefined) {
      updateSql += ", proposal_link = ?";
      args.push(proposal_link);
    }

    updateSql += " WHERE phone = ?";
    args.push(phone);

    await client.execute({
      sql: updateSql,
      args: args,
    });

    return NextResponse.json({ success: true, message: "Lead updated successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating proposal status:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
