import { NextRequest, NextResponse } from "next/server";
import { client, initializeDatabase } from "@/lib/turso";

// POST /api/whatsapp/send
// Body: { phone: string; message: string; to_wa_id: string }
// Sends a manual message to a WhatsApp number and logs it to chat_history as role "owner"
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, message, to_wa_id } = body;

    if (!phone || !message) {
      return NextResponse.json({ error: "phone and message are required" }, { status: 400 });
    }

    const phoneNumberId = process.env.PHONE_NUMBER_ID;
    const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN;

    // The WhatsApp API needs the full international number (with country code, no +)
    // to_wa_id is the raw number as it came from WhatsApp (e.g. "919876543210")
    // If not supplied, attempt to prefix with "91" for India
    const recipientId = to_wa_id || (phone.startsWith("91") ? phone : `91${phone}`);

    // Send via WhatsApp Cloud API
    const waRes = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${whatsappToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipientId,
          type: "text",
          text: { body: message },
        }),
      }
    );

    if (!waRes.ok) {
      const errData = await waRes.text();
      console.error("WhatsApp API error:", errData);
      return NextResponse.json(
        { error: `WhatsApp API error: ${errData}` },
        { status: 502 }
      );
    }

    // Log message to chat_history with role = "owner"
    await initializeDatabase();
    await client.execute({
      sql: "INSERT INTO chat_history (phone, role, message) VALUES (?, ?, ?)",
      args: [phone, "owner", message],
    });

    // Also update last_contacted on the lead
    const ts = new Date().toISOString();
    await client.execute({
      sql: "UPDATE leads SET last_contacted = ? WHERE phone = ?",
      args: [ts, phone],
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error in POST /api/whatsapp/send:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
