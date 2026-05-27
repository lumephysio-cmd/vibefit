import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const COLORS = ["#6EE7B7","#93C5FD","#F9A8D4","#FCD34D","#C4B5FD","#FB923C","#34D399","#F472B6"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;
  if (!prompt?.trim()) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a corporate wellness coach. Generate 3 fun fitness challenge ideas based on this request: "${prompt}"

Respond with ONLY a valid JSON array (no markdown, no explanation) in this exact format:
[
  {
    "title": "Challenge Name",
    "icon": "emoji",
    "unit": "steps/ml/reps/mins/km",
    "goal": 10000,
    "color": "#6EE7B7",
    "desc": "Short motivating description (max 60 chars)",
    "difficulty": "Easy"
  }
]

Rules:
- difficulty must be exactly "Easy", "Medium", or "Hard"
- goal must be a realistic number
- color must be one of: ${COLORS.join(", ")}
- icon must be a single emoji
- Keep desc under 60 characters`,
        },
      ],
    });

    const raw = message.content[0].text.trim();
    const suggestions = JSON.parse(raw);

    return res.status(200).json({ suggestions });
  } catch (err) {
    console.error("Chat API error:", err);
    return res.status(500).json({ error: "Failed to generate suggestions" });
  }
}
