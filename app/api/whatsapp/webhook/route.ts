import { NextRequest, NextResponse } from "next/server";
import { client, initializeDatabase } from "@/lib/turso";
import { NEW_LEAD_PROMPT, POST_PROPOSAL_PROMPT } from "@/lib/prompts";
import OpenAI from "openai";

// Initialize OpenAI client (reads OPENAI_API_KEY from environment variables)
const openai = new OpenAI();

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } else {
    return new NextResponse("Forbidden", { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Log the incoming payload shape for debugging
    console.log("Incoming Webhook Payload:", JSON.stringify(body, null, 2));

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
    const dbPhone = from.startsWith("91") && from.length > 10 ? from.substring(2) : from;
    const text = message.text?.body || "";
    const contactName = change?.contacts?.[0]?.profile?.name || "there";

    // 2. Query the leads table
    await initializeDatabase();
    const leadResult = await client.execute({
      sql: "SELECT * FROM leads WHERE phone = ?",
      args: [dbPhone],
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
      args: [dbPhone],
    });

    let historyText = "No previous conversation.";
    if (historyResult.rows.length > 0) {
      historyText = historyResult.rows
        .map((row) => `${row.role}: ${row.message}`)
        .join("\\n");
    }

    const userMessage = `Conversation so far:\\n${historyText}\\n\\nNew message from ${contactName}: ${text}`;

    // 4. Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const replyText = response.choices[0].message?.content || "";

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
      args: [dbPhone, "user", text],
    });
    await client.execute({
      sql: "INSERT INTO chat_history (phone, role, message) VALUES (?, ?, ?)",
      args: [dbPhone, "assistant", replyText],
    });

    // 7. Upsert leads table
    const currentTimestamp = new Date().toISOString();
    await client.execute({
      sql: `
        INSERT INTO leads (phone, name, proposal_sent, last_contacted, created_at, source) 
        VALUES (?, ?, 0, ?, ?, 'WhatsApp')
        ON CONFLICT(phone) DO UPDATE SET 
          last_contacted = excluded.last_contacted
      `,
      args: [dbPhone, contactName, currentTimestamp, currentTimestamp],
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
