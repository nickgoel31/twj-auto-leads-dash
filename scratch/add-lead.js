const { createClient } = require("@libsql/client");
const fs = require("fs");
const path = require("path");

// Read env variables manually
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const parts = line.split("=");
    if (parts.length >= 2) {
      process.env[parts[0].trim()] = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
    }
  });
}

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error("Missing TURSO_DATABASE_URL in .env");
  process.exit(1);
}

const client = createClient({
  url: url,
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

async function run() {
  try {
    const res = await client.execute({
      sql: `INSERT INTO leads (phone, name, domain, city, category, rating, reviews_count, has_website, email, source, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        "+919971438900",
        "The Walking Jumbo",
        "twjlabs.com",
        "Ghaziabad",
        "IT Industry",
        4.9,
        0,
        1,
        "info@twjlabs.com",
        "Manual Entry",
        new Date().toISOString()
      ]
    });
    console.log("Successfully inserted lead! lastInsertRowid:", res.lastInsertRowid);
  } catch (e) {
    console.error("Insertion failed:", e);
  }
}

run();
