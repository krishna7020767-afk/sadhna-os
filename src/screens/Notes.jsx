import { useState } from "react";
import { useApp } from "../appContext";
import { useTheme } from "../theme";
import { tr } from "../lib/constants";
import { Button } from "../components/Button";
import { IconButton } from "../components/IconButton";
import { Icon } from "../components/Icon";
import { EmptyState } from "../components/EmptyState";

export function Notes() {
  const { S, lang, data, save, showToast, askConfirm } = useApp();
  const { C, accent, danger } = useTheme();
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const notes = data.notes || [];
  const saveNote = () => {
    if (!title.trim() && !body.trim()) return;
    const note = { id: editing?.id || Date.now(), title: title.trim(), body: body.trim(), date: Date.now() };
    save({ notes: editing ? notes.map((n) => (n.id === editing.id ? note : n)) : [...notes, note] });
    setEditing(null); setTitle(""); setBody(""); setShowEditor(false);
    showToast(lang === "hi" ? "सहेजा गया 🙏" : "Saved 🙏");
  };
  const deleteNote = (id) => askConfirm(lang === "hi" ? "नोट हटाएं?" : "Delete note?", () => save({ notes: notes.filter((n) => n.id !== id) }));
  const shareNote = (note) => window.open("https://wa.me/?text=" + encodeURIComponent(`${note.title ? note.title + "\n\n" : ""}${note.body}`), "_blank");

  return (
    <>
      {showEditor && (
        <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 100, display: "flex", flexDirection: "column" }}>
          <div style={{ ...S.head }}>
            <IconButton onClick={() => { setShowEditor(false); setEditing(null); setTitle(""); setBody(""); }}><Icon name="x" /></IconButton>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{editing ? (lang === "hi" ? "संपादित करें" : "Edit") : (lang === "hi" ? "नया नोट" : "New Note")}</div>
            <Button onClick={saveNote} style={{ width: "auto", padding: "0 16px", minHeight: 40 }}>{lang === "hi" ? "सहेजें" : "Save"}</Button>
          </div>
          <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={lang === "hi" ? "शीर्षक" : "Title"} style={{ ...S.input, marginBottom: 16, fontWeight: 700, fontSize: 20, border: "none", borderBottom: `1px solid ${C.line}`, borderRadius: 0, padding: "12px 0" }} />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={lang === "hi" ? "अपने विचार लिखें…" : "Write your thoughts..."} style={{ ...S.input, minHeight: "calc(100dvh - 260px)", resize: "none", fontFamily: "inherit", border: "none", fontSize: 16 }} />
          </div>
        </div>
      )}
      <div style={{ padding: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>{tr("notes", lang)}</div>
        <Button onClick={() => setShowEditor(true)} style={{ marginBottom: 16 }}><Icon name="plus" size={18} /> {lang === "hi" ? "नया नोट" : "New Note"}</Button>
        {notes.length === 0 ? (
          <EmptyState text={lang === "hi" ? "कोई नोट्स नहीं हैं" : "No notes yet"} />
        ) : notes.map((note) => (
          <div key={note.id} style={{ background: C.card, borderRadius: 14, padding: 16, marginBottom: 12, border: `1px solid ${C.line}` }}>
            {note.title && <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{note.title}</div>}
            <div style={{ color: C.sub, fontSize: 14, marginBottom: 12, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{note.body.length > 150 ? note.body.slice(0, 150) + "..." : note.body}</div>
            <div style={{ fontSize: 11, color: C.sub, marginBottom: 12 }}>{new Date(note.date).toLocaleString("en-IN")}</div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <button onClick={() => { setEditing(note); setTitle(note.title); setBody(note.body); setShowEditor(true); }} style={{ background: "none", border: "none", color: accent, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>{lang === "hi" ? "संपादित" : "Edit"}</button>
              <button onClick={() => shareNote(note)} style={{ background: "none", border: "none", color: "#25D366", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>{lang === "hi" ? "शेयर" : "Share"}</button>
              <button onClick={() => deleteNote(note.id)} style={{ background: "none", border: "none", color: danger, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>{lang === "hi" ? "हटाएं" : "Delete"}</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
