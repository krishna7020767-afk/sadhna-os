import { useApp } from "../appContext";
import { useTheme, fontDisplay } from "../theme";
import { tr, METRICS, BOOL_IDS } from "../lib/constants";
import { dayMetric } from "../lib/metrics";
import { dateKey, addDays } from "../lib/helpers";
import { Card } from "../components/Card";
import { Ring } from "../components/Icon";

export function Insights() {
  const { S, lang, data, today } = useApp();
  const { C, accent, accentGradient } = useTheme();
  const last7 = [...Array(7)].map((_, i) => {
    const k = dateKey(addDays(new Date(), -(6 - i)));
    const lg = data.log?.[k] || {}; const cu = data.custom?.[k] || [];
    const dn = BOOL_IDS.filter((id) => lg[id]).length + cu.filter((c) => c.done).length;
    const tt = BOOL_IDS.length + cu.length;
    return { k, pct: tt ? Math.round((dn / tt) * 100) : 0 };
  });
  const avg = Math.round(last7.reduce((a, b) => a + b.pct, 0) / 7);
  return (
    <div style={{ padding: "6px 0 8px" }}>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: fontDisplay, padding: "8px 14px" }}>{tr("insights", lang)}</div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <Ring pct={avg} size={72} stroke={8} color={accent} track={C.line}><span style={{ fontSize: 18, color: accent, fontFamily: fontDisplay }}>{avg}%</span></Ring>
          <div><div style={{ color: C.sub, fontSize: 13 }}>{lang === "hi" ? "7-दिन औसत" : "7-day average"}</div><div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{lang === "hi" ? "साधना पूर्णता" : "Sadhna completion"}</div></div>
        </div>
        <div style={{ display: "flex", gap: 10, height: 140 }}>
          {last7.map((x) => (
            <div key={x.k} style={{ flex: 1, textAlign: "center", height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 10, color: C.sub, marginBottom: 4 }}>{x.pct}%</div>
              <div style={{ flex: 1, display: "flex", alignItems: "flex-end" }}>
                <div style={{ width: "100%", height: Math.max(4, x.pct) + "%", background: accentGradient, borderRadius: 6, transition: "height .3s ease" }} />
              </div>
              <div style={{ fontSize: 10, color: C.sub, marginTop: 8 }}>{x.k.slice(8)}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div style={S.sectionTitle}>{lang === "hi" ? "मेट्रिक्स (आज)" : "Metrics (today)"}</div>
        {Object.keys(METRICS).map((k) => (
          <div key={k} style={S.row}>
            <span>{METRICS[k][lang]}</span>
            <b style={{ color: accent, fontVariantNumeric: "tabular-nums" }}>{dayMetric(data, k, today)} {METRICS[k].unit}</b>
          </div>
        ))}
      </Card>
    </div>
  );
}
