import { useApp } from "../appContext";
import { useTheme } from "../theme";
import { supabase } from "../supabaseClient";
import { tr } from "../lib/constants";
import { Chip } from "./Chip";
import { Icon } from "./Icon";

export function Drawer() {
  const { drawer, setDrawer, setScreen, lang, user, dark, toggleDark, toggleLang, askConfirm } = useApp();
  const { C, accent, danger } = useTheme();
  if (!drawer) return null;
  const go = (s) => { setScreen(s); setDrawer(false); };
  const items = [
    { s: "insights", icon: "chart", label: tr("insights", lang) },
    { s: "goals", icon: "goal", label: tr("goals", lang) },
    { s: "notes", icon: "note", label: tr("notes", lang) },
    { s: "ai", icon: "ai", label: tr("ai", lang) },
    { s: "notifications", icon: "bell", label: tr("notifications", lang) },
  ];
  return (
    <div onClick={() => setDrawer(false)} style={{ position: "fixed", inset: 0, background: "rgba(10,6,2,.6)", backdropFilter: "blur(2px)", zIndex: 60, display: "flex", animation: "pw-fade .18s ease-out" }}>
      <style>{`@keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}} @keyframes pw-fade{from{opacity:0}to{opacity:1}}`}</style>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 288, maxWidth: "84%", background: C.card, height: "100%", padding: 18, display: "flex", flexDirection: "column", borderRight: `1px solid ${C.line}`, animation: "slideIn .25s ease-out", boxShadow: C.shadowLg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 16, borderBottom: `1px solid ${C.line}` }}>
          {user.photoURL && <img src={user.photoURL} alt="" style={{ width: 46, height: 46, borderRadius: "50%", border: `2px solid ${accent}` }} />}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.displayName}</div>
            <div style={{ fontSize: 12, color: accent, fontWeight: 600 }}>Sadhna OS</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", paddingTop: 8 }}>
          {items.map((it) => (
            <button key={it.s} className="pw-tap" onClick={() => go(it.s)} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", background: "none", border: "none", color: C.text, padding: "14px 8px", fontSize: 15, fontWeight: 600, cursor: "pointer", textAlign: "left", borderRadius: 12 }}>
              <Icon name={it.icon} color={accent} /> {it.label}
            </button>
          ))}
          <div style={{ borderTop: `1px solid ${C.line}`, margin: "8px 0", paddingTop: 12 }}>
            <div style={{ fontSize: 12, color: C.sub, padding: "0 8px 8px" }}>{lang === "hi" ? "थीम" : "Theme"}</div>
            <div style={{ display: "flex", gap: 8, padding: "0 8px" }}>
              <Chip onClick={toggleDark} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icon name={dark ? "sun" : "moon"} size={16} /> {dark ? "Light" : "Dark"}
              </Chip>
              <Chip onClick={toggleLang} style={{ flex: 1 }}>{lang === "hi" ? "English" : "हिंदी"}</Chip>
            </div>
          </div>
          <button className="pw-tap" onClick={() => { navigator.share ? navigator.share({ title: "Sadhna OS", text: "Track your daily sadhna 🙏", url: window.location.origin }).catch(() => {}) : window.open("https://wa.me/?text=" + encodeURIComponent("Track your daily sadhna with Sadhna OS 🙏 " + window.location.origin), "_blank"); setDrawer(false); }} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", background: "none", border: "none", color: C.text, padding: "14px 8px", fontSize: 15, fontWeight: 600, cursor: "pointer", textAlign: "left", borderRadius: 12 }}>
            <Icon name="share" color={accent} /> {lang === "hi" ? "ऐप शेयर करें" : "Share App"}
          </button>
        </div>
        <button className="pw-tap" onClick={() => { setDrawer(false); askConfirm(lang === "hi" ? "लॉगआउट करें?" : "Log out?", () => supabase.auth.signOut()); }} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", background: "none", border: "none", color: danger, padding: "14px 8px", fontSize: 15, fontWeight: 700, cursor: "pointer", textAlign: "left", borderTop: `1px solid ${C.line}` }}>
          <Icon name="logout" /> {tr("logout", lang)}
        </button>
      </div>
    </div>
  );
}
