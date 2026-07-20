import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/turso";

// GET /api/whatsapp/conversations - list all conversations
export async function GET() {
  try {
    const conversations = await db.getWhatsAppConversations();
    return NextResponse.json(conversations, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
