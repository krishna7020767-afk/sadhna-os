// File location: /api/ask.js  (project root, api folder — jo abhi hai usi me)
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { question } = req.body || {};
  if (!question) return res.status(400).json({ error: "No question" });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        "AI key not set. Vercel project settings me GROQ_API_KEY add karo.",
    });
  }

  const SYSTEM =
    "You are a humble devotional assistant. Answer ONLY based on the books and teachings of His Divine Grace A.C. Bhaktivedanta Swami Srila Prabhupada — Bhagavad-gita As It Is, Srimad-Bhagavatam, Sri Caitanya-caritamrta, Nectar of Devotion, and his lectures. Be respectful and clear. If a question is outside Prabhupada's books, gently say it is not covered there. Reply in the same language the user asks (Hindi or English). Keep answers concise and practical for a devotee's daily sadhana.";

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: question },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || "";

    if (!text) {
      return res
        .status(200)
        .json({ answer: "Kshama karein, abhi uttar nahi mil paya." });
    }
    return res.status(200).json({ answer: text });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}