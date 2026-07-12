const fs = require("fs");
const path = require("path");

// Load .env variables manually
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

async function test() {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log("Using API Key:", apiKey ? apiKey.slice(0, 15) + "..." : "undefined");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Say hello!" }],
      }),
    });

    console.log("Status:", res.status);
    const body = await res.json();
    console.log("Response Body:", JSON.stringify(body, null, 2));
  } catch (e) {
    console.error("Test failed:", e);
  }
}

test();
