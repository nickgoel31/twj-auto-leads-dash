import { createClient, Client } from "@libsql/client";

// Detect if environment variables are provided
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN || "";

if (!url) {
  throw new Error("Missing environment variable: TURSO_DATABASE_URL. Please configure it in your .env file.");
}

const client = createClient({
  url: url,
  authToken: authToken,
});

export { client };


export interface Lead {
  id: number;
  domain: string;
  name: string;
  email: string;
  source: string;
  created_at: string;
  phone: string;
  category: string;
  city: string;
  rating: number;
  reviews_count: number;
  has_website: number;
  call_summary?: string;
  isCalled?: number;
  callback_scheduled?: number;
  services_sold?: string;
  pain_points_post_call?: string;
  final_pricing_agreed?: string;
}

export interface DashboardStats {
  totalLeads: number;
  uniqueCities: number;
  uniqueCategories: number;
  avgRating: number;
  hasWebsite: number;
  noWebsite: number;
}

export interface PricingItem {
  id: number;
  name: string;
  price: number;
  billing: string;
  description: string;
}

// Automatically initialize the database schema and seed data if table doesn't exist or is empty
export async function initializeDatabase() {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain TEXT,
        name TEXT,
        email TEXT,
        source TEXT,
        created_at TEXT,
        phone TEXT UNIQUE,
        category TEXT,
        city TEXT,
        rating REAL,
        reviews_count INTEGER,
        has_website INTEGER,
        call_summary TEXT,
        isCalled INTEGER DEFAULT 0,
        callback_scheduled INTEGER DEFAULT 0,
        services_sold TEXT,
        pain_points_post_call TEXT,
        final_pricing_agreed TEXT,
        proposal_sent INTEGER DEFAULT 0,
        proposal_link TEXT,
        last_contacted TEXT
      )
    `);

    // WhatsApp tables
    await client.execute(`
      CREATE TABLE IF NOT EXISTS leads_for_whatsapp (
        phone TEXT PRIMARY KEY,
        name TEXT,
        proposal_sent INTEGER DEFAULT 0,
        proposal_link TEXT,
        last_contacted TEXT,
        notes TEXT
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        role TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_chat_history_phone ON chat_history(phone)
    `);

    // Dynamic migrations: add columns if they do not exist
    const newColumns = [
      "ALTER TABLE leads ADD COLUMN call_summary TEXT",
      "ALTER TABLE leads ADD COLUMN isCalled INTEGER DEFAULT 0",
      "ALTER TABLE leads ADD COLUMN callback_scheduled INTEGER DEFAULT 0",
      "ALTER TABLE leads ADD COLUMN services_sold TEXT",
      "ALTER TABLE leads ADD COLUMN pain_points_post_call TEXT",
      "ALTER TABLE leads ADD COLUMN final_pricing_agreed TEXT",
      "ALTER TABLE leads ADD COLUMN proposal_sent INTEGER DEFAULT 0",
      "ALTER TABLE leads ADD COLUMN proposal_link TEXT",
      "ALTER TABLE leads ADD COLUMN last_contacted TEXT"
    ];

    for (const sql of newColumns) {
      try {
        await client.execute(sql);
      } catch (e) {
        // Ignored if column already exists
      }
    }

    // Initialize pricing table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS pricing (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        price REAL,
        billing TEXT,
        description TEXT
      )
    `);

    // Seed pricing if empty
    const pricingCountRes = await client.execute("SELECT count(*) as count FROM pricing");
    const pricingCount = Number(pricingCountRes.rows[0]?.count || 0);

    if (pricingCount === 0) {
      const defaultPricing = [
        { name: "Landing page", price: 10000, billing: "One-Time", description: "Single-page design, WhatsApp + contact form, Mobile optimised, 5–7 days. For promotions, events, coaching offers." },
        { name: "Business website", price: 20000, billing: "One-Time", description: "4–6 pages (Home, About, Services, Contact), Google Maps embed, WhatsApp chat, On-page SEO ready. 10–14 days. Restaurant, salon, clinic, broker, coaching." },
        { name: "Ecommerce store", price: 42500, billing: "One-Time", description: "Product catalogue + cart + payments, Razorpay / PhonePe integration, Inventory management panel. 20–30 days. Boutiques, D2C brands, retail stores." },
        { name: "Custom / large portal", price: 105000, billing: "One-Time", description: "Real estate listings portal, Booking / appointment systems, Custom CRM or lead management. 30–60 days. Multi-branch businesses, institutions." },
        { name: "Local SEO — starter", price: 5000, billing: "Monthly", description: "Up to 10 keywords (city-level), On-page optimisation, Monthly ranking report, Min. 3 months. Salons, single-location restaurants, clinics." },
        { name: "Local SEO — growth", price: 10000, billing: "Monthly", description: "Up to 25 keywords + competitor tracking, 2 blog / content pieces per month, Backlink building, Min. 3 months. Real estate brokers, coaching, service biz." },
        { name: "SEO — aggressive growth", price: 20000, billing: "Monthly", description: "50+ keywords, multi-location, 4 content pieces per month, Technical SEO audits, Core Web Vitals. Min. 6 months. Ecommerce, large institutes, developers." },
        { name: "GMB setup only", price: 2500, billing: "One-Time", description: "Full profile setup + verification. Categories, photos, timings, description. For businesses starting from scratch." },
        { name: "GMB management", price: 4250, billing: "Monthly", description: "4 Google posts per month, Review response management, Photo updates, Q&A management, Monthly performance report. Min. 3 months." },
        { name: "Starter pack", price: 12000, billing: "Bundle: + ₹6,500/mo", description: "Landing page GMB setup Starter SEO Monthly report. For very small local businesses." },
        { name: "Growth pack", price: 22000, billing: "Bundle: + ₹12,000/mo", description: "Business website GMB management Local SEO growth 25 keywords 2 blogs/mo Monthly report. Restaurant, broker, clinic, salon, coaching." },
        { name: "Scale pack", price: 45000, billing: "Bundle: + ₹22,000/mo", description: "Ecommerce / large site Aggressive SEO GMB management 50+ keywords 4 blogs/mo Backlinks." }
      ];

      for (const item of defaultPricing) {
        await client.execute({
          sql: `INSERT OR IGNORE INTO pricing (name, price, billing, description) VALUES (?, ?, ?, ?)`,
          args: [item.name, item.price, item.billing, item.description],
        });
      }
    }

    // Check if leads table has data
    const result = await client.execute("SELECT count(*) as count FROM leads");
    const count = Number(result.rows[0]?.count || 0);

    if (count === 0) {
      // Seed data
      const mockLeads = [
        { domain: "apex-design.com", name: "Apex Creative Design", email: "info@apex-design.com", source: "Google Search", created_at: "2026-05-10T10:00:00Z", phone: "512-555-0199", category: "Agency", city: "Austin", rating: 4.8, reviews_count: 42, has_website: 1, call_summary: "Client wants to scale their web presence. Highlighted interested in UI design, custom React applications, and continuous maintenance updates." },
        { domain: "bostondental.com", name: "Boston Dental Clinic", email: "contact@bostondental.com", source: "Referral", created_at: "2026-05-12T14:30:00Z", phone: "617-555-0121", category: "Clinic", city: "Boston", rating: 4.5, reviews_count: 128, has_website: 1, call_summary: "Discussed online booking integration. Wants to improve search engine rankings locally." },
        { domain: "chicagosteak.com", name: "Chicago Prime Steakhouse", email: "reservations@chicagosteak.com", source: "Google Search", created_at: "2026-05-15T18:45:00Z", phone: "312-555-0143", category: "Restaurant", city: "Chicago", rating: 4.7, reviews_count: 310, has_website: 1, call_summary: "Interested in a digital menu redesign and loyalty program API integration." },
        { domain: "dallaslawyers.org", name: "Dallas Legal Associates", email: "help@dallaslawyers.org", source: "LinkedIn", created_at: "2026-05-18T09:15:00Z", phone: "214-555-0188", category: "Law Firm", city: "Dallas", rating: 4.2, reviews_count: 18, has_website: 1, call_summary: "Requires secure document upload portal and automated lead collection forms." },
        { domain: "eliterealty.net", name: "Elite Miami Realty", email: "agent@eliterealty.net", source: "Cold Outreach", created_at: "2026-05-20T11:00:00Z", phone: "305-555-0105", category: "Real Estate", city: "Miami", rating: 4.9, reviews_count: 85, has_website: 1, call_summary: "Wants premium map search dashboard for local property listings." },
        { domain: "flowersbyval.com", name: "Flowers by Valerie", email: "val@flowersbyval.com", source: "Twitter", created_at: "2026-05-22T16:20:00Z", phone: "206-555-0112", category: "Retail Store", city: "Seattle", rating: 4.6, reviews_count: 64, has_website: 1, call_summary: "Needs simple Shopify setup or bespoke checkout experience to reduce cart abandonment rates." },
        { domain: "greenenergy.co", name: "Green Energy Solutions", email: "hello@greenenergy.co", source: "LinkedIn", created_at: "2026-05-25T08:30:00Z", phone: "415-555-0155", category: "Tech Startup", city: "San Francisco", rating: 4.4, reviews_count: 29, has_website: 1, call_summary: "Discussed carbon-offset visualization API. High priority for green certifications." },
        { domain: "harborcafe.com", name: "The Harbor Cafe", email: "manager@harborcafe.com", source: "Google Search", created_at: "2026-05-28T12:00:00Z", phone: "619-555-0177", category: "Restaurant", city: "San Diego", rating: 4.3, reviews_count: 215, has_website: 1, call_summary: "Wants contactless ordering interface integrated with existing local POS system." },
        { domain: "innovate-tech.io", name: "Innovate Tech Labs", email: "support@innovate-tech.io", source: "Cold Outreach", created_at: "2026-06-01T09:00:00Z", phone: "212-555-0130", category: "Tech Startup", city: "New York", rating: 4.1, reviews_count: 14, has_website: 1, call_summary: "Spoke about AI automation pipelines for customer success routing." },
        { domain: "jacksautorepair.com", name: "Jack's Auto Repair", email: "jack@jacksautorepair.com", source: "Google Search", created_at: "2026-06-03T15:10:00Z", phone: "303-555-0164", category: "Automotive", city: "Denver", rating: 4.9, reviews_count: 195, has_website: 1, call_summary: "Interested in automated text message updates for vehicle repair status." },
      ];

      for (const lead of mockLeads) {
        await client.execute({
          sql: `INSERT INTO leads (domain, name, email, source, created_at, phone, category, city, rating, reviews_count, has_website, call_summary)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            lead.domain,
            lead.name,
            lead.email,
            lead.source,
            lead.created_at,
            lead.phone,
            lead.category,
            lead.city,
            lead.rating,
            lead.reviews_count,
            lead.has_website,
            lead.call_summary,
          ],
        });
      }
      console.log("Database seeded successfully!");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}


// Core helper to construct SQL queries based on UI filters
function buildFiltersQuery(filters: {
  city?: string;
  category?: string;
  source?: string;
  ratingMin?: number;
  ratingMax?: number;
  hasWebsite?: string; // 'all' | 'yes' | 'no'
  reviewsMin?: number;
  reviewsMax?: number;
  search?: string;
  dateStart?: string;
  dateEnd?: string;
}) {
  let whereClauses: string[] = [];
  let args: any[] = [];

  if (filters.city) {
    whereClauses.push("city = ?");
    args.push(filters.city);
  }
  if (filters.category) {
    whereClauses.push("category = ?");
    args.push(filters.category);
  }
  if (filters.source) {
    whereClauses.push("source = ?");
    args.push(filters.source);
  }
  if (filters.ratingMin !== undefined) {
    whereClauses.push("rating >= ?");
    args.push(filters.ratingMin);
  }
  if (filters.ratingMax !== undefined) {
    whereClauses.push("rating <= ?");
    args.push(filters.ratingMax);
  }
  if (filters.hasWebsite === "yes") {
    whereClauses.push("has_website = 1");
  } else if (filters.hasWebsite === "no") {
    whereClauses.push("has_website = 0");
  }
  if (filters.reviewsMin !== undefined) {
    whereClauses.push("reviews_count >= ?");
    args.push(filters.reviewsMin);
  }
  if (filters.reviewsMax !== undefined) {
    whereClauses.push("reviews_count <= ?");
    args.push(filters.reviewsMax);
  }
  if (filters.search) {
    whereClauses.push("(name LIKE ? OR domain LIKE ? OR email LIKE ? OR phone LIKE ?)");
    const likeVal = `%${filters.search}%`;
    args.push(likeVal, likeVal, likeVal, likeVal);
  }
  if (filters.dateStart) {
    whereClauses.push("created_at >= ?");
    args.push(filters.dateStart);
  }
  if (filters.dateEnd) {
    whereClauses.push("created_at <= ?");
    args.push(filters.dateEnd);
  }

  const whereSql = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";
  return { whereSql, args };
}

// Reusable Query Functions

export async function getLeads(filters: any = {}) {
  await initializeDatabase();
  const { whereSql, args } = buildFiltersQuery(filters);

  // Sorting
  let orderBy = "ORDER BY created_at DESC";
  if (filters.sortBy) {
    // e.g. [{ id: 'name', desc: true }]
    try {
      const sorting = JSON.parse(filters.sortBy);
      if (Array.isArray(sorting) && sorting.length > 0) {
        orderBy = "ORDER BY " + sorting.map((s: any) => `${s.id} ${s.desc ? "DESC" : "ASC"}`).join(", ");
      }
    } catch (e) {}
  }

  const query = `SELECT * FROM leads ${whereSql} ${orderBy}`;
  const res = await client.execute({ sql: query, args });

  return res.rows.map((row) => ({
    id: Number(row.id),
    domain: String(row.domain),
    name: String(row.name),
    email: String(row.email),
    source: String(row.source),
    created_at: String(row.created_at),
    phone: String(row.phone),
    category: String(row.category),
    city: String(row.city),
    rating: Number(row.rating),
    reviews_count: Number(row.reviews_count),
    has_website: Number(row.has_website),
    call_summary: row.call_summary ? String(row.call_summary) : "",
  })) as Lead[];
}

export async function getDashboardStats(filters: any = {}): Promise<DashboardStats> {
  await initializeDatabase();
  const { whereSql, args } = buildFiltersQuery(filters);

  const query = `
    SELECT 
      COUNT(*) as totalLeads,
      COUNT(DISTINCT city) as uniqueCities,
      COUNT(DISTINCT category) as uniqueCategories,
      AVG(rating) as avgRating,
      SUM(CASE WHEN has_website = 1 THEN 1 ELSE 0 END) as hasWebsite,
      SUM(CASE WHEN has_website = 0 THEN 1 ELSE 0 END) as noWebsite
    FROM leads
    ${whereSql}
  `;

  const res = await client.execute({ sql: query, args });
  const row = res.rows[0];

  return {
    totalLeads: Number(row?.totalLeads || 0),
    uniqueCities: Number(row?.uniqueCities || 0),
    uniqueCategories: Number(row?.uniqueCategories || 0),
    avgRating: Math.round(Number(row?.avgRating || 0) * 10) / 10,
    hasWebsite: Number(row?.hasWebsite || 0),
    noWebsite: Number(row?.noWebsite || 0),
  };
}

export async function getCityStats(filters: any = {}) {
  await initializeDatabase();
  const { whereSql, args } = buildFiltersQuery(filters);

  const query = `
    SELECT city, COUNT(*) as count 
    FROM leads 
    ${whereSql} 
    GROUP BY city 
    ORDER BY count DESC
  `;
  const res = await client.execute({ sql: query, args });
  return res.rows.map((r) => ({
    city: String(r.city),
    count: Number(r.count),
  }));
}

export async function getCategoryStats(filters: any = {}) {
  await initializeDatabase();
  const { whereSql, args } = buildFiltersQuery(filters);

  const query = `
    SELECT category, COUNT(*) as count, AVG(rating) as avgRating, SUM(reviews_count) as totalReviews
    FROM leads 
    ${whereSql} 
    GROUP BY category 
    ORDER BY count DESC
  `;
  const res = await client.execute({ sql: query, args });
  return res.rows.map((r) => ({
    category: String(r.category),
    count: Number(r.count),
    avgRating: Math.round(Number(r.avgRating || 0) * 10) / 10,
    totalReviews: Number(r.totalReviews || 0),
  }));
}

export async function getSourceStats(filters: any = {}) {
  await initializeDatabase();
  const { whereSql, args } = buildFiltersQuery(filters);

  const query = `
    SELECT source, COUNT(*) as count 
    FROM leads 
    ${whereSql} 
    GROUP BY source 
    ORDER BY count DESC
  `;
  const res = await client.execute({ sql: query, args });
  return res.rows.map((r) => ({
    source: String(r.source),
    count: Number(r.count),
  }));
}

export async function getRatingDistribution(filters: any = {}) {
  await initializeDatabase();
  const { whereSql, args } = buildFiltersQuery(filters);

  const query = `
    SELECT 
      CASE 
        WHEN rating >= 4.5 THEN '4.5 - 5.0'
        WHEN rating >= 4.0 THEN '4.0 - 4.4'
        WHEN rating >= 3.5 THEN '3.5 - 3.9'
        ELSE 'Below 3.5'
      END as ratingGroup,
      COUNT(*) as count
    FROM leads
    ${whereSql}
    GROUP BY ratingGroup
    ORDER BY ratingGroup DESC
  `;
  const res = await client.execute({ sql: query, args });
  return res.rows.map((r) => ({
    ratingGroup: String(r.ratingGroup),
    count: Number(r.count),
  }));
}

export async function getGrowthData(filters: any = {}) {
  await initializeDatabase();
  const { whereSql, args } = buildFiltersQuery(filters);

  const query = `
    SELECT 
      strftime('%Y-%m-%d', created_at) as date,
      COUNT(*) as count
    FROM leads
    ${whereSql}
    GROUP BY date
    ORDER BY date ASC
  `;
  const res = await client.execute({ sql: query, args });
  
  // Accumulate count to show running total (growth) over time
  let total = 0;
  return res.rows.map((r) => {
    total += Number(r.count);
    return {
      date: String(r.date),
      newLeads: Number(r.count),
      totalLeads: total,
    };
  });
}

export async function getPricing(): Promise<PricingItem[]> {
  await initializeDatabase();
  const res = await client.execute("SELECT * FROM pricing ORDER BY price DESC");
  return res.rows.map((row) => ({
    id: Number(row.id),
    name: String(row.name),
    price: Number(row.price),
    billing: String(row.billing),
    description: String(row.description),
  }));
}

export async function updatePricingItem(id: number, price: number, description: string) {
  await initializeDatabase();
  await client.execute({
    sql: "UPDATE pricing SET price = ?, description = ? WHERE id = ?",
    args: [price, description, id],
  });
}

export async function updateLeadCallSummary(id: number, callSummary: string) {
  await initializeDatabase();
  await client.execute({
    sql: "UPDATE leads SET call_summary = ? WHERE id = ?",
    args: [callSummary, id],
  });
}

export interface ProposalLead {
  id: number;
  name: string;
  phone: string;
  email: string;
  domain: string;
  category: string;
  city: string;
  rating: number;
  reviews_count: number;
  proposal_sent: number;
  proposal_link: string;
  last_contacted: string;
  created_at: string;
  services_sold: string;
  final_pricing_agreed: string;
}

export async function getProposalSentLeads(): Promise<ProposalLead[]> {
  await initializeDatabase();
  const res = await client.execute(
    "SELECT id, name, phone, email, domain, category, city, rating, reviews_count, proposal_sent, proposal_link, last_contacted, created_at, services_sold, final_pricing_agreed FROM leads WHERE proposal_sent = 1 ORDER BY last_contacted DESC"
  );
  return res.rows.map((row) => ({
    id: Number(row.id),
    name: String(row.name || ""),
    phone: String(row.phone || ""),
    email: String(row.email || ""),
    domain: String(row.domain || ""),
    category: String(row.category || ""),
    city: String(row.city || ""),
    rating: Number(row.rating || 0),
    reviews_count: Number(row.reviews_count || 0),
    proposal_sent: Number(row.proposal_sent || 0),
    proposal_link: String(row.proposal_link || ""),
    last_contacted: String(row.last_contacted || ""),
    created_at: String(row.created_at || ""),
    services_sold: String(row.services_sold || ""),
    final_pricing_agreed: String(row.final_pricing_agreed || ""),
  })) as ProposalLead[];
}

export interface WhatsAppConversation {
  phone: string;
  name: string;
  last_message: string;
  last_message_role: string;
  last_message_time: string;
  message_count: number;
  proposal_sent: number;
}

export async function getWhatsAppConversations(): Promise<WhatsAppConversation[]> {
  await initializeDatabase();
  const res = await client.execute(`
    SELECT 
      ch.phone,
      COALESCE(l.name, ch.phone) as name,
      COALESCE(l.proposal_sent, 0) as proposal_sent,
      MAX(ch.created_at) as last_message_time,
      COUNT(ch.id) as message_count
    FROM chat_history ch
    LEFT JOIN leads l ON l.phone = ch.phone
    GROUP BY ch.phone
    ORDER BY last_message_time DESC
  `);

  // For each conversation, get the latest message text and role
  const conversations: WhatsAppConversation[] = [];
  for (const row of res.rows) {
    const phone = String(row.phone);
    const lastMsgRes = await client.execute({
      sql: "SELECT role, message FROM chat_history WHERE phone = ? ORDER BY created_at DESC LIMIT 1",
      args: [phone],
    });
    const lastMsg = lastMsgRes.rows[0];
    conversations.push({
      phone,
      name: String(row.name || phone),
      last_message: lastMsg ? String(lastMsg.message || "") : "",
      last_message_role: lastMsg ? String(lastMsg.role || "") : "",
      last_message_time: String(row.last_message_time || ""),
      message_count: Number(row.message_count || 0),
      proposal_sent: Number(row.proposal_sent || 0),
    });
  }
  return conversations;
}

export interface ChatMessage {
  id: number;
  phone: string;
  role: string;
  message: string;
  created_at: string;
}

export async function getConversationMessages(phone: string): Promise<ChatMessage[]> {
  await initializeDatabase();
  const res = await client.execute({
    sql: "SELECT id, phone, role, message, created_at FROM chat_history WHERE phone = ? ORDER BY created_at ASC",
    args: [phone],
  });
  return res.rows.map((row) => ({
    id: Number(row.id),
    phone: String(row.phone),
    role: String(row.role),
    message: String(row.message),
    created_at: String(row.created_at),
  })) as ChatMessage[];
}
