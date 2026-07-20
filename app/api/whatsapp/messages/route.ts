import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/turso";

// GET /api/whatsapp/messages?phone=XXXXXXXXXX
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }
  try {
    const messages = await db.getConversationMessages(phone);
    return NextResponse.json(messages, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
