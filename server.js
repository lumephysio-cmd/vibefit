// Local dev API server — runs alongside Vite on port 3001
import { readFileSync } from "fs";
import { resolve } from "path";
import express from "express";

// Parse .env.local manually (handles keys with -- in values)
try {
  const envFile = readFileSync(resolve(".env.local"), "utf8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
  console.log("✅ Loaded .env.local");
} catch {
  console.warn("⚠️  No .env.local found");
}

const app = express();
app.use(express.json());

// Dynamically load the Vercel-style handler from api/chat.js
app.post("/api/chat", async (req, res) => {
  try {
    const { default: handler } = await import(`./api/chat.js?t=${Date.now()}`);
    await handler(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ API server running at http://localhost:${PORT}`);
});
