import { useState } from "react";
import { useApp } from "../appContext";
import { useTheme, fontDisplay } from "../theme";
import { tr, METRICS } from "../lib/constants";
import { dayMetric, rangeMetric, streakMetric } from "../lib/metrics";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { IconButton } from "../components/IconButton";
import { Chip } from "../components/Chip";
import { Icon, Ring } from "../components/Icon";
import { StatTile } from "../components/StatTile";
import { EmptyState } from "../components/EmptyState";

export function Goals() {
  const { S, lang, data, save, showToast, askConfirm, today } = useApp();
  const { C, accent, green, danger } = useTheme();
  const [show, setShow] = useState(false);
  const [label, setLabel] = useState("");
  const [metric, setMetric] = useState("rounds");
  const [dailyT, setDailyT] = useState(16);
  const [reminder, setReminder] = useState("21:00");
  const goals = data.goals || [];

  const addGoal = () => {
    if (!label.trim()) return;
    const g = { id: Date.now().toString(36), label: label.trim(), metric, daily: Number(dailyT) || METRICS[metric].target, reminder };
    save({ goals: [...goals, g] });
    setLabel(""); setShow(false);
    showToast(lang === "hi" ? "लक्ष्य जोड़ा गया 🙏" : "Goal added 🙏");
  };
  const remove = (id) => askConfirm(lang === "hi" ? "लक्ष्य हटाएं?" : "Delete goal?", () => save({ goals: goals.filter((g) => g.id !== id) }));

  return (
    <div style={{ padding: "6px 0 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px" }}>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: fontDisplay }}>{tr("goals", lang)}</div>
        <Button onClick={() => setShow(!show)} style={{ width: "auto", padding: "0 16px", minHeight: 42 }}><Icon name="plus" size={18} /> {lang === "hi" ? "नया" : "Add"}</Button>
      </div>

      {show && (
        <Card>
          <div style={S.sectionTitle}>{lang === "hi" ? "नया लक्ष्य" : "New goal"}</div>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={lang === "hi" ? "लक्ष्य का नाम" : "Goal name"} style={{ ...S.input, marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {Object.keys(METRICS).map((k) => (
              <Chip key={k} active={metric === k} onClick={() => { setMetric(k); setDailyT(METRICS[k].target); }}>{METRICS[k][lang]}</Chip>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, color: C.sub, display: "block", marginBottom: 6 }}>{lang === "hi" ? "दैनिक लक्ष्य" : "Daily target"}</label>
              <input type="number" inputMode="numeric" value={dailyT} onChange={(e) => setDailyT(e.target.value)} style={{ ...S.input, textAlign: "center" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, color: C.sub, display: "block", marginBottom: 6 }}>{lang === "hi" ? "रिमाइंडर" : "Reminder"}</label>
              <input type="time" value={reminder} onChange={(e) => setReminder(e.target.value)} onClick={(e) => e.target.showPicker?.()} style={S.input} />
            </div>
          </div>
          <Button onClick={addGoal}>{lang === "hi" ? "लक्ष्य जोड़ें" : "Add goal"}</Button>
        </Card>
      )}

      {goals.length === 0 && !show && (
        <Card>
          <EmptyState text={lang === "hi" ? "अभी कोई लक्ष्य नहीं। ऊपर 'जोड़ें' दबाएं।" : "No goals yet. Tap Add to create one."} />
        </Card>
      )}

      {goals.map((g) => {
        const today_v = dayMetric(data, g.metric, today);
        const p = g.daily ? Math.min(100, Math.round((today_v / g.daily) * 100)) : 0;
        const week = rangeMetric(data, g.metric, 7);
        const month = rangeMetric(data, g.metric, 30);
        const streak = streakMetric(data, g.metric, g.daily);
        const unit = METRICS[g.metric]?.unit || "";
        return (
          <Card key={g.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Ring pct={p} size={78} stroke={9} color={p >= 100 ? green : accent} track={C.line}>
                <span style={{ fontSize: 18, color: p >= 100 ? green : accent, fontFamily: fontDisplay }}>{p}%</span>
              </Ring>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{g.label}</div>
                  <IconButton aria-label="delete" onClick={() => remove(g.id)} style={{ width: 32, height: 32, color: danger }}><Icon name="trash" size={15} /></IconButton>
                </div>
                <div style={{ fontSize: 14, color: C.sub, marginTop: 4 }}>{lang === "hi" ? "आज" : "Today"}: <b style={{ color: C.text }}>{today_v}/{g.daily} {unit}</b></div>
                <div style={{ fontSize: 13, color: accent, marginTop: 4, fontWeight: 700 }}>🔥 {streak} {lang === "hi" ? "दिन की श्रृंखला" : "day streak"}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <StatTile label={lang === "hi" ? "साप्ताहिक" : "Weekly"} value={week} unit={`/ ${g.daily * 7}`} />
              <StatTile label={lang === "hi" ? "मासिक" : "Monthly"} value={month} unit={`/ ${g.daily * 30}`} />
            </div>
            {g.reminder && <div style={{ fontSize: 12, color: C.sub, marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}><Icon name="bell" size={14} color={C.sub} /> {lang === "hi" ? "रिमाइंडर" : "Reminder"} {g.reminder}</div>}
          </Card>
        );
      })}
    </div>
  );
}
