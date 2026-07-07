import { useState } from "react";
import { useApp } from "../appContext";
import { useTheme } from "../theme";
import { Card } from "../components/Card";
import { Button } from "../components/Button";

export function AI() {
  const { S, lang } = useApp();
  const { C, accent } = useTheme();
  const [q, setQ] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const ask = async () => {
    if (!q.trim() || loading) return;
    const question = q.trim();
    setChat((c) => [...c, { r: "u", t: question }]); setQ(""); setLoading(true);
    try {
      const res = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) });
      const d = await res.json();
      setChat((c) => [...c, { r: "a", t: d.answer || d.error || "..." }]);
    } catch (e) { setChat((c) => [...c, { r: "a", t: "Error: " + e.message }]); }
    setLoading(false);
  };
  return (
    <Card>
      <div style={S.sectionTitle}>{lang === "hi" ? "प्रभुपाद की पुस्तकों से पूछें" : "Ask from Prabhupada's books"}</div>
      <div style={{ color: C.sub, fontSize: 13, marginBottom: 14 }}>{lang === "hi" ? "गीता, भागवतम् आदि के आधार पर उत्तर" : "Answers grounded in Gita, Bhagavatam etc."}</div>
      <div style={{ minHeight: 180, maxHeight: 360, overflowY: "auto", marginBottom: 14 }}>
        {chat.map((m, i) => (
          <div key={i} style={{ background: m.r === "u" ? accent : C.bg, color: m.r === "u" ? "#1a0e05" : C.text, padding: "12px 14px", borderRadius: 12, margin: "8px 0", fontSize: 15, whiteSpace: "pre-wrap" }}>{m.t}</div>
        ))}
        {loading && <div style={{ color: C.sub, fontSize: 14 }}>…</div>}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder={lang === "hi" ? "अपना प्रश्न लिखें…" : "Type your question…"} style={{ ...S.input, flex: 1 }} />
        <Button onClick={ask} style={{ width: "auto", padding: "0 20px" }}>{lang === "hi" ? "पूछें" : "Ask"}</Button>
      </div>
    </Card>
  );
}
