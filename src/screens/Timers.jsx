import { useState } from "react";
import { useApp } from "../appContext";
import { useTheme, fontDisplay } from "../theme";
import { tr, DEFAULT_TIMERS } from "../lib/constants";
import { fmtHMS } from "../lib/helpers";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { IconButton } from "../components/IconButton";
import { Chip } from "../components/Chip";
import { Icon, Ring } from "../components/Icon";

export function Timers() {
  const { S, lang, timers, save, showToast, runs, elapsedOf, toggleRun, resetRun, askConfirm, setField, dayLog } = useApp();
  const { C, accent, green, danger } = useTheme();
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [mode, setMode] = useState("stopwatch");
  const [mins, setMins] = useState(15);

  const addTimer = () => {
    if (!name.trim()) return;
    const id = name.trim().toLowerCase().replace(/\s+/g, "-") + "-" + Date.now().toString(36).slice(-4);
    save({ timers: [...timers, { id, name: name.trim(), mode, duration: mode === "countdown" ? mins * 60 : 0 }] });
    setName(""); setMode("stopwatch"); setMins(15); setShow(false);
    showToast(lang === "hi" ? "टाइमर जोड़ा गया 🙏" : "Timer added 🙏");
  };
  const removeTimer = (id) => askConfirm(lang === "hi" ? "टाइमर हटाएं?" : "Delete this timer?", () => { resetRun(id); save({ timers: timers.filter((t) => t.id !== id) }); });
  const logToReading = (id, sec) => setField("reading", (Number(dayLog.reading) || 0) + Math.round(sec / 60));

  return (
    <div style={{ padding: "6px 0 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px" }}>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: fontDisplay }}>{tr("timers", lang)}</div>
        <Button onClick={() => setShow(!show)} style={{ width: "auto", padding: "0 16px", minHeight: 42 }}><Icon name="plus" size={18} /> {lang === "hi" ? "नया" : "Add"}</Button>
      </div>

      {show && (
        <Card>
          <div style={S.sectionTitle}>{lang === "hi" ? "नया टाइमर" : "New timer"}</div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={lang === "hi" ? "नाम (जैसे जप)" : "Name (e.g. Japa)"} style={{ ...S.input, marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <Chip active={mode === "stopwatch"} onClick={() => setMode("stopwatch")} style={{ flex: 1 }}>{lang === "hi" ? "स्टॉपवॉच" : "Stopwatch"}</Chip>
            <Chip active={mode === "countdown"} onClick={() => setMode("countdown")} style={{ flex: 1 }}>{lang === "hi" ? "काउंटडाउन" : "Countdown"}</Chip>
          </div>
          {mode === "countdown" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <input type="number" inputMode="numeric" value={mins} onChange={(e) => setMins(Math.max(1, parseInt(e.target.value) || 1))} style={{ ...S.input, width: 90, textAlign: "center" }} />
              <span style={{ color: C.sub }}>{lang === "hi" ? "मिनट" : "minutes"}</span>
            </div>
          )}
          <Button onClick={addTimer}>{lang === "hi" ? "जोड़ें" : "Add timer"}</Button>
        </Card>
      )}

      {timers.map((t) => {
        const el = elapsedOf(t.id);
        const running = runs[t.id]?.running;
        const isCd = t.mode === "countdown";
        const remaining = isCd ? Math.max(0, t.duration - el) : el;
        const p = isCd ? (t.duration ? (el / t.duration) * 100 : 0) : 0;
        const done = isCd && el >= t.duration;
        const isDefault = DEFAULT_TIMERS.some((d) => d.id === t.id);
        return (
          <Card key={t.id}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{t.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: .5 }}>{isCd ? (lang === "hi" ? "काउंटडाउन" : "countdown") : (lang === "hi" ? "स्टॉपवॉच" : "stopwatch")}</span>
                {!isDefault && <IconButton aria-label="delete" onClick={() => removeTimer(t.id)} style={{ width: 34, height: 34, color: danger }}><Icon name="trash" size={16} /></IconButton>}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              {isCd ? (
                <Ring pct={p} size={150} stroke={11} color={done ? green : accent} track={C.line}>
                  <span style={{ fontSize: 32, color: done ? green : accent, fontFamily: fontDisplay, fontVariantNumeric: "tabular-nums" }}>{fmtHMS(remaining)}</span>
                </Ring>
              ) : (
                <div style={{ fontSize: 52, fontWeight: 700, color: accent, fontVariantNumeric: "tabular-nums", fontFamily: fontDisplay }}>{fmtHMS(el)}</div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button onClick={() => toggleRun(t.id)} style={{ background: running ? danger : accent }}>
                <Icon name={running ? "pause" : "play"} size={18} /> {running ? (lang === "hi" ? "रोकें" : "Pause") : (lang === "hi" ? "शुरू" : "Start")}
              </Button>
              <Button ghost onClick={() => resetRun(t.id)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Icon name="reset" size={18} /> {lang === "hi" ? "रीसेट" : "Reset"}</Button>
            </div>
            {t.id === "reading" && el > 30 && (
              <Button ghost onClick={() => { logToReading(t.id, el); resetRun(t.id); }} style={{ width: "100%", marginTop: 10, color: green }}>
                {lang === "hi" ? "पठन में जोड़ें" : `Log ${Math.round(el / 60)} min to Reading`}
              </Button>
            )}
          </Card>
        );
      })}
    </div>
  );
}
