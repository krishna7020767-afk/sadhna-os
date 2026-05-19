// File location: /api/ask.js  (project root, api folder — jo abhi hai usi me)
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { question } = req.body || {};
  if (!question) return res.status(400).json({ error: "No question" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        "AI key not set. Vercel project settings me GEMINI_API_KEY add karo.",
    });
  }

  const SYSTEM =
    "You are a humble devotional assistant. Answer ONLY based on the books and teachings of His Divine Grace A.C. Bhaktivedanta Swami Srila Prabhupada — Bhagavad-gita As It Is, Srimad-Bhagavatam, Sri Caitanya-caritamrta, Nectar of Devotion, and his lectures. Be respectful and clear. If a question is outside Prabhupada's books, gently say it is not covered there. Reply in the same language the user asks (Hindi or English). Keep answers concise and practical for a devotee's daily sadhana.";

  try {
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: "user", parts: [{ text: question }] }],
        }),
      }
    );
    const data = await r.json();
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join("\n")
        .trim() || "";
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