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
  console.log("Checking leads schema...");
  const schemaRes = await client.execute(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='leads'"
  );
  console.log("Table SQL:", schemaRes.rows[0]?.sql);

  console.log("\nChecking indexes on leads table...");
  const indexesRes = await client.execute(
    "SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='leads'"
  );
  for (const row of indexesRes.rows) {
    console.log(`Index: ${row.name}, SQL: ${row.sql}`);
  }
}

main().catch(console.error);
