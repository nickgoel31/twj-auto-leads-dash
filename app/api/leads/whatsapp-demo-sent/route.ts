import { NextRequest, NextResponse } from "next/server";
import { client, initializeDatabase } from "@/lib/turso";

/**
 * POST /api/leads/whatsapp-demo-sent
 *
 * Body (JSON):
 *   - phone        (required) — the business phone number
 *   - name         (optional) — business name
 *   - email        (optional)
 *   - domain       (optional)
 *   - category     (optional)
 *   - city         (optional)
 *   - source       (optional, defaults to "WhatsApp Demo")
 *
 * Creates a new lead (or upserts if phone already exists) and sets
 * whatsapp_demo_sent = 1 with the current timestamp.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { phone, name, email, domain, category, city, source } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Normalise Indian numbers that come with country code
    if (phone.startsWith("91") && phone.length > 10) {
      phone = phone.substring(2);
    }

    await initializeDatabase();

    const now = new Date().toISOString();

    await client.execute({
      sql: `
        INSERT INTO leads (phone, name, email, domain, category, city, source, created_at, whatsapp_demo_sent, whatsapp_demo_sent_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        ON CONFLICT(phone) DO UPDATE SET
          whatsapp_demo_sent     = 1,
          whatsapp_demo_sent_at  = excluded.whatsapp_demo_sent_at,
          name                   = COALESCE(NULLIF(excluded.name, ''),    leads.name),
          email                  = COALESCE(NULLIF(excluded.email, ''),   leads.email),
          domain                 = COALESCE(NULLIF(excluded.domain, ''),  leads.domain),
          category               = COALESCE(NULLIF(excluded.category, ''), leads.category),
          city                   = COALESCE(NULLIF(excluded.city, ''),    leads.city)
      `,
      args: [
        phone,
        name || "",
        email || "",
        domain || "",
        category || "",
        city || "",
        source || "WhatsApp Demo",
        now,
        now,
      ],
    });

    return NextResponse.json(
      { success: true, message: "WhatsApp demo marked as sent" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating whatsapp_demo_sent:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leads/whatsapp-demo-sent
 * Returns all leads where whatsapp_demo_sent = 1
 */
export async function GET() {
  try {
    await initializeDatabase();

    const res = await client.execute(
      `SELECT id, name, phone, email, domain, category, city, source, rating, reviews_count,
              whatsapp_demo_sent, whatsapp_demo_sent_at, created_at, last_contacted
       FROM leads
       WHERE whatsapp_demo_sent = 1
       ORDER BY whatsapp_demo_sent_at DESC`
    );

    const leads = res.rows.map((row) => ({
      id: Number(row.id),
      name: String(row.name || ""),
      phone: String(row.phone || ""),
      email: String(row.email || ""),
      domain: String(row.domain || ""),
      category: String(row.category || ""),
      city: String(row.city || ""),
      source: String(row.source || ""),
      rating: Number(row.rating || 0),
      reviews_count: Number(row.reviews_count || 0),
      whatsapp_demo_sent: Number(row.whatsapp_demo_sent || 0),
      whatsapp_demo_sent_at: String(row.whatsapp_demo_sent_at || ""),
      created_at: String(row.created_at || ""),
      last_contacted: String(row.last_contacted || ""),
    }));

    return NextResponse.json(leads, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching whatsapp demo leads:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
