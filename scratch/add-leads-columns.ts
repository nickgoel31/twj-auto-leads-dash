import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";

// Manually parse .env file
const envPath = path.join(process.cwd(), ".env");
let url = process.env.TURSO_DATABASE_URL;
let authToken = process.env.TURSO_AUTH_TOKEN || "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split("=");
    const key = parts[0]?.trim();
    let value = parts.slice(1).join("=").trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    if (key === "TURSO_DATABASE_URL") url = value;
    if (key === "TURSO_AUTH_TOKEN") authToken = value;
  }
}

if (!url) {
  console.error("Missing TURSO_DATABASE_URL");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function migrate() {
  console.log("Migrating database leads table: adding new columns...");
  
  const migrations = [
    "ALTER TABLE leads ADD COLUMN isCalled INTEGER DEFAULT 0",
    "ALTER TABLE leads ADD COLUMN callback_scheduled INTEGER DEFAULT 0",
    "ALTER TABLE leads ADD COLUMN services_sold TEXT",
    "ALTER TABLE leads ADD COLUMN pain_points_post_call TEXT",
    "ALTER TABLE leads ADD COLUMN final_pricing_agreed TEXT"
  ];

  for (const sql of migrations) {
    try {
      console.log(`Executing: ${sql}`);
      await client.execute(sql);
      console.log("Success!");
    } catch (e: any) {
      if (e.message && e.message.includes("duplicate column name")) {
        console.log("Column already exists, skipping.");
      } else {
        console.warn(`Warning executing migration (${sql}):`, e.message || e);
      }
    }
  }

  console.log("Migration complete!");
}

migrate().catch(console.error);
