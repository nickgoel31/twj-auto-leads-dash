import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN || "";

if (!url) {
  console.error("Missing TURSO_DATABASE_URL");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function main() {
  console.log("Starting migration to remove UNIQUE constraint from domain column...");

  // 1. Create the new table
  console.log("Creating leads_new table...");
  await client.execute(`
    CREATE TABLE leads_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT,
      name TEXT,
      email TEXT,
      source TEXT,
      created_at TEXT,
      phone TEXT,
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

  // 2. Copy data
  console.log("Copying data from leads to leads_new...");
  await client.execute(`
    INSERT INTO leads_new (
      id, domain, name, email, source, created_at, phone, category, city, 
      rating, reviews_count, has_website, call_summary, isCalled, 
      callback_scheduled, services_sold, pain_points_post_call, 
      final_pricing_agreed, proposal_sent, proposal_link, last_contacted
    )
    SELECT 
      id, domain, name, email, source, created_at, phone, category, city, 
      rating, reviews_count, has_website, call_summary, isCalled, 
      callback_scheduled, services_sold, pain_points_post_call, 
      final_pricing_agreed, proposal_sent, proposal_link, last_contacted
    FROM leads
  `);

  // 3. Drop old table
  console.log("Dropping old leads table...");
  await client.execute("DROP TABLE leads");

  // 4. Rename leads_new to leads
  console.log("Renaming leads_new to leads...");
  await client.execute("ALTER TABLE leads_new RENAME TO leads");

  // 5. Recreate index
  console.log("Recreating index idx_leads_phone...");
  await client.execute("CREATE UNIQUE INDEX idx_leads_phone ON leads(phone) WHERE phone != ''");

  console.log("Migration completed successfully!");

  // Verify the schema
  const schemaRes = await client.execute(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='leads'"
  );
  console.log("New Table SQL:", schemaRes.rows[0]?.sql);
}

main().catch(console.error);
