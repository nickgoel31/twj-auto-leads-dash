import { NextRequest, NextResponse } from "next/server";
import { client, initializeDatabase } from "@/lib/turso";
import { NEW_LEAD_PROMPT, POST_PROPOSAL_PROMPT } from "@/lib/prompts";
import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client (reads ANTHROPIC_API_KEY from environment variables)
const anthropic = new Anthropic();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  } else {
    return new NextResponse("Forbidden", { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Parse incoming JSON body
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const messages = change?.messages;

    // If it's a status update or something else without a message, skip it
    if (!messages || messages.length === 0) {
      return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
    }

    const message = messages[0];
    const from = message.from;
    const text = message.text?.body || "";
    const contactName = change?.contacts?.[0]?.profile?.name || "there";

    // 2. Query the leads_for_whatsapp table
    await initializeDatabase();
    const leadResult = await client.execute({
      sql: "SELECT * FROM leads_for_whatsapp WHERE phone = ?",
      args: [from],
    });
    
    let systemPrompt = NEW_LEAD_PROMPT;
    let proposalLink = "";
    
    if (leadResult.rows.length > 0) {
      const lead = leadResult.rows[0];
      if (lead.proposal_sent === 1) {
        systemPrompt = POST_PROPOSAL_PROMPT;
        proposalLink = String(lead.proposal_link || "");
      }
    }

    // Replace placeholders
    systemPrompt = systemPrompt
      .replace(/{{contactName}}/g, contactName)
      .replace(/{{proposal_link}}/g, proposalLink);

    // 3. Query the last 10 rows from chat_history
    const historyResult = await client.execute({
      sql: "SELECT * FROM (SELECT role, message, created_at FROM chat_history WHERE phone = ? ORDER BY created_at DESC LIMIT 10) ORDER BY created_at ASC",
      args: [from],
    });

    let historyText = "No previous conversation.";
    if (historyResult.rows.length > 0) {
      historyText = historyResult.rows
        .map((row) => `${row.role}: ${row.message}`)
        .join("\\n");
    }

    const userMessage = `Conversation so far:\\n${historyText}\\n\\nNew message from ${contactName}: ${text}`;

    // 4. Call Anthropic API
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5", 
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const replyText = response.content[0].type === "text" ? response.content[0].text : "";

    // 5. Send reply via WhatsApp API
    const phoneNumberId = process.env.PHONE_NUMBER_ID;
    const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN;
    
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${whatsappToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: from,
          type: "text",
          text: { body: replyText },
        }),
      }
    );

    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.text();
      console.error("WhatsApp API Error:", errorData);
    }

    // 6. Insert into chat_history
    await client.execute({
      sql: "INSERT INTO chat_history (phone, role, message) VALUES (?, ?, ?)",
      args: [from, "user", text],
    });
    await client.execute({
      sql: "INSERT INTO chat_history (phone, role, message) VALUES (?, ?, ?)",
      args: [from, "assistant", replyText],
    });

    // 7. Upsert leads table
    const currentTimestamp = new Date().toISOString();
    await client.execute({
      sql: `
        INSERT INTO leads_for_whatsapp (phone, name, proposal_sent, last_contacted) 
        VALUES (?, ?, 0, ?)
        ON CONFLICT(phone) DO UPDATE SET 
          last_contacted = excluded.last_contacted
      `,
      args: [from, contactName, currentTimestamp],
    });

    // 8. Return success
    return NextResponse.json({ ok: true, reply: replyText }, { status: 200 });
  } catch (error: any) {
    console.error("Error processing WhatsApp webhook:", error);
    // Return 200 to prevent Meta from retrying indefinitely on a failure
    return NextResponse.json(
      { ok: false, error: error.message || "Unknown error" },
      { status: 200 }
    );
  }
}
