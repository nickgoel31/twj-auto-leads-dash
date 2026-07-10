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

async function seed() {
  console.log("Seeding new pricing into the database...");
  await client.execute("DELETE FROM pricing");
  
  const newPricing = [
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

  for (const item of newPricing) {
    await client.execute({
      sql: "INSERT INTO pricing (name, price, billing, description) VALUES (?, ?, ?, ?)",
      args: [item.name, item.price, item.billing, item.description]
    });
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
