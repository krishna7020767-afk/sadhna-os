import { useEffect, useRef, useState } from "react";
import { useApp } from "../appContext";
import { useTheme, fontDisplay } from "../theme";
import { tr, DEFAULT_TEMPLATE } from "../lib/constants";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { Icon } from "../components/Icon";

const FIXED_PLACEHOLDERS = ["date", "name", "rounds", "reading", "hearing", "mangala"];

export function Reports() {
  const { S, lang, data, templates, save, saveSetting, showToast, askConfirm, buildReport, activeTemplateText, customToday } = useApp();
  const { C, accent, danger } = useTheme();
  const [tab, setTab] = useState("share");
  const [editing, setEditing] = useState(null); // template being edited
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [numbersStr, setNumbersStr] = useState((data.settings?.waNumbers || []).join(", "));
  const textareaRef = useRef(null);

  // data.settings arrives asynchronously from Supabase after this component may have
  // already mounted with the useState initializer above — resync once the real row lands
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local form buffer from a remote row, not derivable from props
    setNumbersStr((data.settings?.waNumbers || []).join(", "));
  }, [data.settings?.waNumbers]);

  const activeId = data.settings?.activeTemplate || templates[0]?.id;
  const preview = buildReport(activeTemplateText());
  const numbers = data.settings?.waNumbers || [];

  const share = (num) => {
    const msg = encodeURIComponent(buildReport(activeTemplateText()));
    window.open(num ? `https://wa.me/${num.replace(/[^\d]/g, "")}?text=${msg}` : `https://wa.me/?text=${msg}`, "_blank");
  };
  const startNew = () => { setEditing("new"); setName(""); setText(DEFAULT_TEMPLATE.text); };
  const startEdit = (t) => { setEditing(t.id); setName(t.name); setText(t.text); };
  const saveTmpl = () => {
    if (!name.trim()) return;
    if (editing === "new") {
      const t = { id: Date.now().toString(36), name: name.trim(), text };
      save({ templates: [...templates, t], settings: { ...data.settings, activeTemplate: t.id } });
    } else {
      save({ templates: templates.map((t) => (t.id === editing ? { ...t, name: name.trim(), text } : t)) });
    }
    setEditing(null);
    showToast(lang === "hi" ? "सहेजा गया 🙏" : "Saved 🙏");
  };
  const delTmpl = (id) => askConfirm(lang === "hi" ? "टेम्पलेट हटाएं?" : "Delete this template?", () => save({ templates: templates.filter((t) => t.id !== id) }));
  const insertPlaceholder = (token) => {
    const el = textareaRef.current;
    if (!el) { setText((t) => t + token); return; }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    setText(text.slice(0, start) + token + text.slice(end));
    requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = start + token.length; });
  };

  return (
    <div style={{ padding: "6px 0 8px" }}>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: fontDisplay, padding: "8px 14px" }}>{tr("reports", lang)}</div>
      <div style={{ display: "flex", gap: 8, padding: "0 14px 4px" }}>
        <Chip active={tab === "share"} onClick={() => setTab("share")} style={{ flex: 1 }}>{lang === "hi" ? "शेयर करें" : "Share"}</Chip>
        <Chip active={tab === "templates"} onClick={() => setTab("templates")} style={{ flex: 1 }}>{lang === "hi" ? "टेम्पलेट" : "Templates"}</Chip>
      </div>

      {tab === "share" && (
        <>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={S.sectionTitle}>{lang === "hi" ? "पूर्वावलोकन" : "Preview"}</div>
              <select value={activeId} onChange={(e) => saveSetting({ activeTemplate: e.target.value })} style={{ ...S.input, width: "auto", padding: "8px 10px" }}>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ background: C.bg, borderRadius: 12, padding: 14, whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.5, border: `1px solid ${C.line}` }}>{preview}</div>
            <Button onClick={() => share()} style={{ marginTop: 14, background: "#25D366", color: "#fff" }}><Icon name="share" size={18} /> {lang === "hi" ? "WhatsApp पर भेजें" : "Share on WhatsApp"}</Button>
          </Card>
          <Card>
            <div style={S.sectionTitle}>{lang === "hi" ? "पूर्वनिर्धारित नंबर" : "Predefined numbers"}</div>
            {numbers.length > 0 ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {numbers.map((n) => <Chip key={n} onClick={() => share(n)} style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="share" size={14} /> {n}</Chip>)}
              </div>
            ) : <div style={{ color: C.sub, fontSize: 14, marginBottom: 12 }}>{lang === "hi" ? "नीचे नंबर जोड़ें (कॉमा से अलग)" : "Add numbers below (comma-separated, with country code)"}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <input value={numbersStr} onChange={(e) => setNumbersStr(e.target.value)} placeholder="91XXXXXXXXXX, 91YYYYYYYYYY" style={{ ...S.input, flex: 1 }} />
              <Button onClick={() => { saveSetting({ waNumbers: numbersStr.split(",").map((x) => x.trim()).filter(Boolean) }); showToast(lang === "hi" ? "सहेजा गया 🙏" : "Saved 🙏"); }} style={{ width: "auto", padding: "0 16px" }}>{lang === "hi" ? "सहेजें" : "Save"}</Button>
            </div>
          </Card>
        </>
      )}

      {tab === "templates" && (
        <>
          {editing ? (
            <Card>
              <div style={S.sectionTitle}>{editing === "new" ? (lang === "hi" ? "नया टेम्पलेट" : "New template") : (lang === "hi" ? "संपादित करें" : "Edit template")}</div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={lang === "hi" ? "टेम्पलेट नाम" : "Template name"} style={{ ...S.input, marginBottom: 10 }} />
              <textarea ref={textareaRef} value={text} onChange={(e) => setText(e.target.value)} rows={10} style={{ ...S.input, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />
              <div style={{ fontSize: 12, color: C.sub, margin: "10px 0 6px" }}>{lang === "hi" ? "जोड़ने के लिए टैप करें" : "Tap to insert"}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {FIXED_PLACEHOLDERS.map((k) => (
                  <Chip key={k} onClick={() => insertPlaceholder(`{${k}}`)} style={{ fontSize: 12, padding: "6px 10px", minHeight: "auto" }}>{`{${k}}`}</Chip>
                ))}
                {customToday.map((c) => (
                  <Chip key={c.label} onClick={() => insertPlaceholder(`{{${c.label}}}`)} style={{ fontSize: 12, padding: "6px 10px", minHeight: "auto" }}>{`{{${c.label}}}`}</Chip>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <Button onClick={saveTmpl}>{lang === "hi" ? "सहेजें" : "Save"}</Button>
                <Button ghost onClick={() => setEditing(null)} style={{ flex: 1 }}>{lang === "hi" ? "रद्द करें" : "Cancel"}</Button>
              </div>
            </Card>
          ) : (
            <div style={{ padding: "0 14px" }}>
              <Button onClick={startNew} style={{ marginBottom: 12 }}><Icon name="plus" size={18} /> {lang === "hi" ? "नया टेम्पलेट" : "New template"}</Button>
              {templates.map((t) => (
                <Card key={t.id} style={{ margin: "0 0 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                      {t.name}
                      {activeId === t.id && <span style={{ fontSize: 11, color: "#1a0e05", background: accent, padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>{lang === "hi" ? "सक्रिय" : "Active"}</span>}
                    </div>
                  </div>
                  <div style={{ color: C.sub, fontSize: 13, whiteSpace: "pre-wrap", maxHeight: 66, overflow: "hidden", marginBottom: 12 }}>{t.text}</div>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                    <button onClick={() => saveSetting({ activeTemplate: t.id })} style={{ background: "none", border: "none", color: accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{lang === "hi" ? "उपयोग करें" : "Use"}</button>
                    <button onClick={() => startEdit(t)} style={{ background: "none", border: "none", color: accent, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{lang === "hi" ? "संपादित" : "Edit"}</button>
                    {templates.length > 1 && <button onClick={() => delTmpl(t.id)} style={{ background: "none", border: "none", color: danger, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{lang === "hi" ? "हटाएं" : "Delete"}</button>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
