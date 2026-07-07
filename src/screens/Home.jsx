import { useState } from "react";
import { useApp } from "../appContext";
import { useTheme, fontDisplay } from "../theme";
import { FIXED, WIDGET_META, BOOL_IDS, tr } from "../lib/constants";
import { dateKey, addDays } from "../lib/helpers";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { IconButton } from "../components/IconButton";
import { Chip } from "../components/Chip";
import { Section } from "../components/Section";
import { Icon, Ring } from "../components/Icon";
import { ProgressBar } from "../components/ProgressBar";
import { dayMetric } from "../lib/metrics";

function AddCustom() {
  const { S, lang, customToday, setCustom } = useApp();
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <input value={val} onChange={(e) => setVal(e.target.value)} placeholder={lang === "hi" ? "अपना कार्य जोड़ें" : "Add a custom task"} style={{ ...S.input, flex: 1 }} />
      <Button onClick={() => { if (!val.trim()) return; setCustom([...customToday, { label: val.trim(), done: false }]); setVal(""); }} style={{ width: "auto", padding: "0 18px" }}><Icon name="plus" /></Button>
    </div>
  );
}

function Widget({ id }) {
  const { S, lang, dayLog, setField, data, timers, runs, toggleRun, setScreen } = useApp();
  const { C, accent, accentGradient, green, warn } = useTheme();
  const today = dateKey();
  switch (id) {
    case "progress": {
      const doneCount = BOOL_IDS.filter((i) => dayLog[i]).length + (data.custom?.[today] || []).filter((c) => c.done).length;
      const totalCount = BOOL_IDS.length + (data.custom?.[today] || []).length;
      const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Ring pct={pct} size={84} stroke={9} color={accent} track={C.line}>
            <span style={{ fontSize: 22, color: accent, fontFamily: fontDisplay }}>{pct}%</span>
          </Ring>
          <div>
            <div style={{ color: C.sub, fontSize: 13 }}>{tr("progress", lang)}</div>
            <div style={{ fontSize: 15, color: green, fontWeight: 700, marginTop: 6 }}>{tr("done", lang)}: {doneCount}</div>
            <div style={{ fontSize: 15, color: totalCount - doneCount > 0 ? warn : C.sub, fontWeight: 700 }}>{tr("pending", lang)}: {totalCount - doneCount}</div>
          </div>
        </div>
      );
    }
    case "japa": {
      const on = !!dayLog.chanting16;
      return (
        <div>
          <div style={S.sectionTitle}>{WIDGET_META.japa[lang]}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: accent, fontVariantNumeric: "tabular-nums", fontFamily: fontDisplay }}>{on ? 16 : 0}<span style={{ fontSize: 15, color: C.sub, fontWeight: 600 }}> / 16 {lang === "hi" ? "माला" : "rounds"}</span></div>
            <div className="pw-tap" style={S.chk(on)} onClick={() => setField("chanting16", !on)}>{on ? "✓" : ""}</div>
          </div>
        </div>
      );
    }
    case "reading":
      return (
        <div>
          <div style={S.sectionTitle}>{WIDGET_META.reading[lang]}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="number" inputMode="numeric" value={dayLog.reading || ""} placeholder="0"
              onChange={(e) => setField("reading", e.target.value)}
              style={{ ...S.input, width: 90, textAlign: "center", fontSize: 22, fontWeight: 800 }} />
            <span style={{ color: C.sub }}>{lang === "hi" ? "मिनट पढ़ा" : "min read"}</span>
            <Button ghost onClick={() => setScreen("timers")} style={{ width: "auto", marginLeft: "auto" }}>{lang === "hi" ? "टाइमर" : "Timer"}</Button>
          </div>
        </div>
      );
    case "goals": {
      const gs = data.goals || [];
      return (
        <Section title={WIDGET_META.goals[lang]} action={lang === "hi" ? "सभी" : "All ›"} onAction={() => setScreen("goals")}>
          {gs.length === 0 ? (
            <div style={{ color: C.sub, fontSize: 14 }}>{lang === "hi" ? "कोई लक्ष्य नहीं — जोड़ें" : "No goals yet — add one"}</div>
          ) : gs.slice(0, 3).map((g) => {
            const v = dayMetric(data, g.metric, today);
            const p = g.daily ? Math.min(100, Math.round((v / g.daily) * 100)) : 0;
            return (
              <div key={g.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                  <span>{g.label}</span><span style={{ color: C.sub }}>{v}/{g.daily}</span>
                </div>
                <ProgressBar pct={p} color={p >= 100 ? green : accentGradient} />
              </div>
            );
          })}
        </Section>
      );
    }
    case "quicktimer":
      return (
        <div>
          <div style={S.sectionTitle}>{WIDGET_META.quicktimer[lang]}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {timers.slice(0, 3).map((t) => {
              const running = runs[t.id]?.running;
              return (
                <Chip key={t.id} active={running} onClick={() => { toggleRun(t.id); setScreen("timers"); }} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name={running ? "pause" : "play"} size={15} /> {t.name}
                </Chip>
              );
            })}
          </div>
        </div>
      );
    case "activity": {
      const days = [...Array(7)].map((_, i) => {
        const k = dateKey(addDays(new Date(), -(6 - i)));
        const lg = data.log?.[k] || {}; const cu = data.custom?.[k] || [];
        const dn = BOOL_IDS.filter((id) => lg[id]).length + cu.filter((c) => c.done).length;
        const tt = BOOL_IDS.length + cu.length;
        return { k, pct: tt ? Math.round((dn / tt) * 100) : 0 };
      });
      return (
        <div>
          <div style={S.sectionTitle}>{WIDGET_META.activity[lang]}</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 90 }}>
            {days.map((x) => (
              <div key={x.k} style={{ flex: 1, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                <div style={{ height: Math.max(4, x.pct) + "%", background: accentGradient, borderRadius: 6, transition: "height .3s ease" }} />
                <div style={{ fontSize: 10, color: C.sub, marginTop: 6 }}>{x.k.slice(8)}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "calendar": {
      const d = new Date();
      const y = d.getFullYear(), m = d.getMonth();
      const first = new Date(y, m, 1).getDay();
      const days = new Date(y, m + 1, 0).getDate();
      const cells = [...Array(first).fill(null), ...[...Array(days)].map((_, i) => i + 1)];
      return (
        <div>
          <div style={S.sectionTitle}>{d.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
            {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => <div key={i} style={{ textAlign: "center", fontSize: 10, color: C.sub }}>{w}</div>)}
            {cells.map((n, i) => {
              if (!n) return <div key={i} />;
              const k = dateKey(new Date(y, m, n));
              const lg = data.log?.[k] || {};
              const has = BOOL_IDS.some((id) => lg[id]);
              const isToday = k === today;
              return (
                <div key={i} style={{ textAlign: "center", fontSize: 12, padding: "6px 0", borderRadius: 8, background: isToday ? accentGradient : has ? C.elev : "transparent", color: isToday ? "#1a0e05" : C.text, fontWeight: isToday ? 800 : 500, border: has && !isToday ? `1px solid ${accent}` : "1px solid transparent" }}>{n}</div>
              );
            })}
          </div>
        </div>
      );
    }
    default: return null;
  }
}

export function Home() {
  const { S, lang, widgets, save, editingHome, setEditingHome, dayLog, setField, customToday, setCustom } = useApp();
  const { accent, danger } = useTheme();
  const missing = Object.keys(WIDGET_META).filter((k) => !widgets.includes(k));
  const move = (i, dir) => {
    const arr = [...widgets];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    save({ widgets: arr });
  };
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 14px 0" }}>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: fontDisplay }}>{lang === "hi" ? "डैशबोर्ड" : "Dashboard"}</div>
        <Button ghost onClick={() => setEditingHome(!editingHome)} style={{ minHeight: 40, padding: "9px 14px", width: "auto", color: editingHome ? accent : undefined }}>
          {editingHome ? tr("doneEditing", lang) : tr("customize", lang)}
        </Button>
      </div>
      {widgets.map((id, i) => (
        <Card key={id} style={{ position: "relative", ...(editingHome ? { borderColor: accent, borderStyle: "dashed" } : {}) }}>
          {editingHome && (
            <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6, zIndex: 2 }}>
              <IconButton aria-label="up" onClick={() => move(i, -1)} style={{ width: 32, height: 32 }}><Icon name="up" size={16} /></IconButton>
              <IconButton aria-label="down" onClick={() => move(i, 1)} style={{ width: 32, height: 32 }}><Icon name="down" size={16} /></IconButton>
              <IconButton aria-label="remove" onClick={() => save({ widgets: widgets.filter((w) => w !== id) })} style={{ width: 32, height: 32, color: danger }}><Icon name="x" size={16} /></IconButton>
            </div>
          )}
          <Widget id={id} />
        </Card>
      ))}
      {editingHome && missing.length > 0 && (
        <Card>
          <div style={S.sectionTitle}>{tr("addWidget", lang)}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {missing.map((k) => (
              <Chip key={k} onClick={() => save({ widgets: [...widgets, k] })} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="plus" size={15} /> {WIDGET_META[k][lang]}
              </Chip>
            ))}
          </div>
        </Card>
      )}
      {/* the full daily checklist still lives here, below the widgets */}
      <Card>
        <div style={S.sectionTitle}>{tr("todaySadhna", lang)}</div>
        {FIXED.filter((f) => !f.show || f.show(dayLog)).map((f) => (
          <div key={f.id} style={S.row}>
            <span style={{ fontSize: 15 }}>{lang === "hi" ? f.hi : f.en}</span>
            {f.type === "bool" ? (
              <div className="pw-tap" style={S.chk(!!dayLog[f.id])} onClick={() => setField(f.id, !dayLog[f.id])}>{dayLog[f.id] ? "✓" : ""}</div>
            ) : f.type === "time" ? (
              <input type="time" value={dayLog[f.id] || ""} onChange={(e) => setField(f.id, e.target.value)} onClick={(e) => e.target.showPicker?.()} style={{ ...S.input, width: "auto", padding: "10px 12px" }} />
            ) : (
              <input type="number" inputMode="numeric" value={dayLog[f.id] || ""} onChange={(e) => setField(f.id, e.target.value)} placeholder="0" style={{ ...S.input, width: 90, textAlign: "center" }} />
            )}
          </div>
        ))}
        {customToday.map((c, idx) => (
          <div key={idx} style={S.row}>
            <span style={{ fontSize: 15 }}>{c.label}</span>
            <div className="pw-tap" style={S.chk(c.done)} onClick={() => { const a = [...customToday]; a[idx] = { ...c, done: !c.done }; setCustom(a); }}>{c.done ? "✓" : ""}</div>
          </div>
        ))}
        <AddCustom />
      </Card>
    </>
  );
}
