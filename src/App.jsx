import { useEffect, useState, useRef } from "react";
import { db, auth } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

function dateKey(d = new Date()) {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}
function prettyDate(key) {
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const FIXED = [
  { id: "mangalAarti", en: "Mangal Aarti on time", hi: "मंगल आरती समय पर", type: "bool" },
  { id: "wakeTime", en: "Wake-up / Morning walk time", hi: "उठने / मॉर्निंग वॉक समय", type: "time" },
  { id: "chanting16", en: "Chanting — 16 rounds", hi: "जप — 16 माला", type: "bool" },
  { id: "chantingFinishTime", en: "Chanting finished at", hi: "जप समाप्त समय", type: "time" },
  { id: "reading2hr", en: "Reading — 2 hours", hi: "पठन — 2 घंटे", type: "bool" },
  { id: "hearingSB", en: "SB class heard", hi: "भागवतम् क्लास सुनी", type: "bool" },
  { id: "hearingExtra", en: "Extra lecture heard", hi: "अतिरिक्त प्रवचन सुना", type: "bool" },
  { id: "hearingExtraDuration", en: "Extra lecture duration", hi: "प्रवचन की अवधि", type: "duration" },
  { id: "exercise", en: "Exercise", hi: "व्यायाम", type: "bool" },
  { id: "exerciseDuration", en: "Exercise duration", hi: "व्यायाम की अवधि", type: "duration" },
];
const BOOL_IDS = FIXED.filter((f) => f.type === "bool").map((f) => f.id);

// ── Updated playlists ─────────────────────────────────────
const PLAYLISTS = [
  { title: "SB Classes — Playlist 1", id: "PLKVQRAZMT7-k-VHcGd_h9xg5c7Jyqa11w" },
  { title: "BG Classes — Playlist 2", id: "PLKVQRAZMT7-lrqg0KaiNxT41U7CPpoyJJ" },
  { title: "Special Lectures — Playlist 3", id: "PLKVZK40wEWjf27uvED15jEP9oT2j3RrVQ" },
];

const T = {
  home: { en: "Home", hi: "होम" },
  add: { en: "Add", hi: "जोड़ें" },
  timer: { en: "Timer", hi: "टाइमर" },
  playlist: { en: "Lectures", hi: "प्रवचन" },
  report: { en: "Report", hi: "रिपोर्ट" },
  ai: { en: "AI", hi: "AI" },
  insights: { en: "Insights", hi: "विश्लेषण" },
  todaySadhna: { en: "Today's Sadhna", hi: "आज की साधना" },
  progress: { en: "Today's Progress", hi: "आज की प्रगति" },
  done: { en: "Done", hi: "पूर्ण" },
  pending: { en: "Pending", hi: "बाकी" },
  logout: { en: "Logout", hi: "लॉगआउट" },
};
const tr = (k, lang) => (T[k] ? T[k][lang] : k);

// ── Splash ────────────────────────────────────────────────
function SplashScreen({ onDone }) {
  const imgs = [
    "/prabhupada1.jpg",
    "/prabhupada2.jpg",
    "/prabhupada3.jpg",
    "/prabhupada4.jpg",
  ];
  const [i, setI] = useState(0);
  const next = () => {
    if (i >= imgs.length - 1) onDone();
    else setI(i + 1);
  };
  return (
    <div onClick={next} style={{ position: "fixed", inset: 0, background: "#1a0e05", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 9999 }}>
      <img src={imgs[i]} alt="" style={{ maxWidth: "82%", maxHeight: "62%", borderRadius: 16, objectFit: "cover", boxShadow: "0 10px 40px rgba(0,0,0,.6)" }} />
      <div style={{ color: "#ff9933", fontSize: 22, fontWeight: 700, marginTop: 26, textAlign: "center", padding: "0 20px" }}>
        All Glories to Srila Prabhupada
      </div>
      <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
        {imgs.map((_, k) => (
          <span key={k} style={{ width: 8, height: 8, borderRadius: "50%", background: k === i ? "#ff9933" : "rgba(255,255,255,.3)", display: "inline-block" }} />
        ))}
      </div>
      <div style={{ color: "rgba(255,255,255,.45)", fontSize: 13, marginTop: 22 }}>Tap to continue →</div>
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────
function Login() {
  const go = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (e) { alert("Login failed: " + e.message); }
  };
  return (
    <div style={{ minHeight: "100vh", background: "#120a04", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <img src="/prabhupada4.jpg" alt="" style={{ width: 130, height: 130, borderRadius: "50%", objectFit: "cover" }} />
      <h1 style={{ color: "#ff9933", marginTop: 22, fontSize: 26, textAlign: "center" }}>Sadhna OS</h1>
      <p style={{ color: "#bbb", marginTop: 6, textAlign: "center" }}>All Glories to Srila Prabhupada</p>
      <button onClick={go} style={{ marginTop: 30, background: "#fff", color: "#333", border: "none", padding: "13px 26px", borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
        Sign in with Google
      </button>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────
export default function App() {
  const [splash, setSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [lang, setLang] = useState("hi");
  const [dark, setDark] = useState(true);
  const [screen, setScreen] = useState("home");
  const [data, setData] = useState({ log: {}, custom: {} });
  // Selected playlist for in-app player
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  const today = dateKey();

  useEffect(() => {
    const un = onAuthStateChanged(auth, (u) => { setUser(u); setAuthReady(true); });
    return un;
  }, []);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const un = onSnapshot(ref, (snap) => {
      if (snap.exists()) setData({ log: {}, custom: {}, ...snap.data() });
    });
    return un;
  }, [user]);

  const save = async (patch) => {
    if (!user) return;
    const next = { ...data, ...patch };
    setData(next);
    await setDoc(
      doc(db, "users", user.uid),
      { ...next, name: user.displayName || "", photo: user.photoURL || "" },
      { merge: true }
    );
  };

  const dayLog = data.log?.[today] || {};
  const setField = (id, val) =>
    save({ log: { ...data.log, [today]: { ...dayLog, [id]: val } } });

  const customToday = data.custom?.[today] || [];
  const setCustom = (arr) =>
    save({ custom: { ...data.custom, [today]: arr } });

  const doneCount =
    BOOL_IDS.filter((id) => dayLog[id]).length +
    customToday.filter((c) => c.done).length;
  const totalCount = BOOL_IDS.length + customToday.length;
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const C = dark
    ? { bg: "#0f0a05", card: "#1c140b", text: "#f3ede2", sub: "#9b8f7d", line: "#2e2316" }
    : { bg: "#fdf8f0", card: "#fff", text: "#2a2118", sub: "#7a6f5e", line: "#ece2d0" };
  const accent = "#ff9933";

  const S = {
    page: { background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "system-ui, sans-serif", paddingBottom: 78 },
    head: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${C.line}`, position: "sticky", top: 0, background: C.bg, zIndex: 5 },
    card: { background: C.card, borderRadius: 14, padding: 16, margin: "12px 16px", border: `1px solid ${C.line}` },
    row: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${C.line}` },
    btn: { background: accent, color: "#1a0e05", border: "none", padding: "12px 18px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%" },
    chk: (on) => ({ width: 26, height: 26, borderRadius: 7, border: `2px solid ${on ? accent : C.sub}`, background: on ? accent : "transparent", color: "#1a0e05", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 800, flexShrink: 0 }),
    input: { background: C.bg, color: C.text, border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 10px", fontSize: 14 },
    tabs: { position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", background: C.card, borderTop: `1px solid ${C.line}` },
    tab: (a) => ({ flex: 1, textAlign: "center", padding: "10px 0", fontSize: 11, color: a ? accent : C.sub, cursor: "pointer", fontWeight: a ? 700 : 500 }),
  };

  if (splash) return <SplashScreen onDone={() => setSplash(false)} />;
  if (!authReady) return <div style={{ background: C.bg, minHeight: "100vh" }} />;
  if (!user) return <Login />;

  const Header = () => (
    <div style={S.head}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {user.photoURL && <img src={user.photoURL} alt="" style={{ width: 34, height: 34, borderRadius: "50%" }} />}
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{lang === "hi" ? "हरे कृष्ण" : "Hare Krishna"}, {user.displayName?.split(" ")[0]}</div>
          <div style={{ fontSize: 10, color: accent }}>All Glories to Srila Prabhupada</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setLang(lang === "hi" ? "en" : "hi")} style={{ ...S.input, cursor: "pointer" }}>{lang === "hi" ? "EN" : "हिं"}</button>
        <button onClick={() => setDark(!dark)} style={{ ...S.input, cursor: "pointer" }}>{dark ? "☀" : "🌙"}</button>
      </div>
    </div>
  );

  // ── Home ─────────────────────────────────────────────────
  const Home = () => (
    <>
      <div style={S.card}>
        <div style={{ color: C.sub, fontSize: 13 }}>{tr("progress", lang)}</div>
        <div style={{ fontSize: 34, fontWeight: 800, color: accent, marginTop: 4 }}>{pct}%</div>
        <div style={{ height: 8, background: C.bg, borderRadius: 6, marginTop: 10, overflow: "hidden" }}>
          <div style={{ width: pct + "%", height: "100%", background: accent, transition: "width 0.4s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 13 }}>
          <span style={{ color: "#5cb85c" }}>{tr("done", lang)}: {doneCount}</span>
          <span style={{ color: C.sub }}>{tr("pending", lang)}: {totalCount - doneCount}</span>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{tr("todaySadhna", lang)}</div>
        {FIXED.map((f) => {
          // duration fields — show only if parent bool is checked
          if (f.type === "duration") {
            const parentId = f.id === "hearingExtraDuration" ? "hearingExtra" : "exercise";
            if (!dayLog[parentId]) return null;
            return (
              <div key={f.id} style={{ ...S.row, paddingLeft: 16 }}>
                <span style={{ fontSize: 13, color: C.sub }}>⏱ {lang === "hi" ? f.hi : f.en}</span>
                <input
                  type="text"
                  value={dayLog[f.id] || ""}
                  onChange={(e) => setField(f.id, e.target.value)}
                  placeholder={lang === "hi" ? "जैसे: 45 मिनट" : "e.g. 45 min"}
                  style={{ ...S.input, width: 110, fontSize: 13 }}
                />
              </div>
            );
          }
          return (
            <div key={f.id} style={S.row}>
              <span style={{ fontSize: 14 }}>{lang === "hi" ? f.hi : f.en}</span>
              {f.type === "bool" ? (
                <div style={S.chk(!!dayLog[f.id])} onClick={() => setField(f.id, !dayLog[f.id])}>
                  {dayLog[f.id] ? "✓" : ""}
                </div>
              ) : (
                <input
                  type="time"
                  value={dayLog[f.id] || ""}
                  onChange={(e) => setField(f.id, e.target.value)}
                  style={S.input}
                />
              )}
            </div>
          );
        })}
        {customToday.map((c, idx) => (
          <div key={idx} style={S.row}>
            <span style={{ fontSize: 14 }}>{c.label}</span>
            <div style={S.chk(c.done)} onClick={() => {
              const a = [...customToday];
              a[idx] = { ...c, done: !c.done };
              setCustom(a);
            }}>
              {c.done ? "✓" : ""}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  // ── Add ──────────────────────────────────────────────────
  function AddScreen() {
    const [val, setVal] = useState("");
    return (
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>{lang === "hi" ? "अपना कार्य जोड़ें" : "Add a custom task"}</div>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={lang === "hi" ? "जैसे: तुलसी सेवा" : "e.g. Tulsi seva"}
          style={{ ...S.input, width: "100%", marginBottom: 10, boxSizing: "border-box" }}
        />
        <button style={S.btn} onClick={() => {
          if (!val.trim()) return;
          setCustom([...customToday, { label: val.trim(), done: false }]);
          setVal("");
        }}>
          {lang === "hi" ? "जोड़ें" : "Add"}
        </button>
        <div style={{ marginTop: 14 }}>
          {customToday.map((c, idx) => (
            <div key={idx} style={S.row}>
              <span>{c.label}</span>
              <button onClick={() => setCustom(customToday.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "#d9534f", cursor: "pointer", fontSize: 13 }}>
                {lang === "hi" ? "हटाएं" : "Remove"}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Timer ────────────────────────────────────────────────
  function TimerScreen() {
    const [mode, setMode] = useState("reading");
    const [sec, setSec] = useState(0);
    const [run, setRun] = useState(false);
    const ref = useRef();
    useEffect(() => {
      if (run) ref.current = setInterval(() => setSec((s) => s + 1), 1000);
      return () => clearInterval(ref.current);
    }, [run]);
    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    return (
      <div style={S.card}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["reading", "chanting"].map((m) => (
            <button key={m} onClick={() => { setMode(m); setSec(0); setRun(false); }}
              style={{ flex: 1, ...S.input, cursor: "pointer", background: mode === m ? accent : C.bg, color: mode === m ? "#1a0e05" : C.text, fontWeight: 700 }}>
              {m === "reading" ? (lang === "hi" ? "पठन (निजी)" : "Reading (personal)") : (lang === "hi" ? "जप / श्रवण" : "Chanting / Hearing")}
            </button>
          ))}
        </div>
        <div style={{ textAlign: "center", fontSize: 56, fontWeight: 800, color: accent }}>{mm}:{ss}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button style={{ ...S.btn, background: run ? "#d9534f" : accent }} onClick={() => setRun(!run)}>
            {run ? (lang === "hi" ? "रोकें" : "Pause") : (lang === "hi" ? "शुरू" : "Start")}
          </button>
          <button style={{ ...S.btn, background: C.bg, color: C.text, border: `1px solid ${C.line}` }} onClick={() => { setSec(0); setRun(false); }}>
            {lang === "hi" ? "रीसेट" : "Reset"}
          </button>
        </div>
        {mode === "reading" && (
          <button style={{ ...S.btn, marginTop: 12, background: "#5cb85c", color: "#fff" }}
            onClick={() => { setField("reading2hr", true); setRun(false); alert(lang === "hi" ? "पठन पूर्ण के रूप में चिह्नित" : "Reading marked done"); }}>
            {lang === "hi" ? "पठन पूर्ण चिह्नित करें" : "Mark reading done"}
          </button>
        )}
      </div>
    );
  }

  // ── Playlist — in-app player ──────────────────────────────
  function PlaylistScreen() {
    const [active, setActive] = useState(selectedPlaylist || PLAYLISTS[0].id);

    const current = PLAYLISTS.find(p => p.id === active);

    return (
      <div>
        {/* Playlist selector tabs */}
        <div style={{ display: "flex", gap: 8, padding: "12px 16px 0", overflowX: "auto" }}>
          {PLAYLISTS.map((p) => (
            <button key={p.id} onClick={() => { setActive(p.id); setSelectedPlaylist(p.id); }}
              style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 20, border: `1px solid ${active === p.id ? accent : C.line}`, background: active === p.id ? accent : C.bg, color: active === p.id ? "#1a0e05" : C.text, fontWeight: active === p.id ? 700 : 500, fontSize: 13, cursor: "pointer" }}>
              {p.title}
            </button>
          ))}
        </div>

        {/* Embedded player */}
        <div style={S.card}>
          <div style={{ fontWeight: 700, marginBottom: 10, color: accent }}>{current?.title}</div>
          <div style={{ position: "relative", paddingTop: "56%", borderRadius: 10, overflow: "hidden", background: "#000" }}>
            <iframe
              key={active}
              title={current?.title}
              src={`https://www.youtube.com/embed/videoseries?list=${active}&autoplay=0`}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </div>

        {/* Today's lecture note */}
        <div style={S.card}>
          <div style={{ fontSize: 14, marginBottom: 8, fontWeight: 600 }}>
            {lang === "hi" ? "आज कौन सा प्रवचन सुना?" : "Which lecture did you hear today?"}
          </div>
          <input
            value={dayLog.hearingExtraNote || ""}
            onChange={(e) => setField("hearingExtraNote", e.target.value)}
            placeholder={lang === "hi" ? "प्रवचन का नाम / नंबर" : "Lecture name / number"}
            style={{ ...S.input, width: "100%", boxSizing: "border-box" }}
          />
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 13, color: C.sub, marginBottom: 6 }}>
              {lang === "hi" ? "अवधि (कितना सुना)" : "Duration (how long listened)"}
            </div>
            <input
              value={dayLog.hearingExtraDuration || ""}
              onChange={(e) => setField("hearingExtraDuration", e.target.value)}
              placeholder={lang === "hi" ? "जैसे: 45 मिनट" : "e.g. 45 min"}
              style={{ ...S.input, width: "100%", boxSizing: "border-box" }}
            />
          </div>
          {/* Mark done button */}
          <button style={{ ...S.btn, marginTop: 12, background: dayLog.hearingExtra ? "#5cb85c" : accent, color: dayLog.hearingExtra ? "#fff" : "#1a0e05" }}
            onClick={() => setField("hearingExtra", !dayLog.hearingExtra)}>
            {dayLog.hearingExtra
              ? (lang === "hi" ? "✓ प्रवचन सुना (पूर्ण)" : "✓ Lecture heard (done)")
              : (lang === "hi" ? "प्रवचन पूर्ण चिह्नित करें" : "Mark lecture done")}
          </button>
        </div>
      </div>
    );
  }

  // ── Report ───────────────────────────────────────────────
  function ReportScreen() {
    const [showCard, setShowCard] = useState(false);
    const msg =
      `🙏 ${lang === "hi" ? "आज की साधना" : "Today's Sadhna"} — ${prettyDate(today)}\n` +
      `${user.displayName}\n` +
      FIXED.filter((f) => f.type === "bool")
        .map((f) => `${dayLog[f.id] ? "✅" : "⬜"} ${lang === "hi" ? f.hi : f.en}`)
        .join("\n") +
      (dayLog.hearingExtraNote ? `\n📖 Lecture: ${dayLog.hearingExtraNote}` : "") +
      (dayLog.hearingExtraDuration ? ` (${dayLog.hearingExtraDuration})` : "") +
      (dayLog.exerciseDuration ? `\n🏃 Exercise: ${dayLog.exerciseDuration}` : "") +
      `\n\n${doneCount}/${totalCount} • All Glories to Srila Prabhupada`;

    return (
      <div>
        <div style={S.card}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{prettyDate(today)} — {doneCount}/{totalCount}</div>
          {FIXED.filter((f) => f.type === "bool").map((f) => (
            <div key={f.id} style={S.row}>
              <span style={{ fontSize: 14 }}>{lang === "hi" ? f.hi : f.en}</span>
              <span style={{ color: dayLog[f.id] ? "#5cb85c" : C.sub, fontWeight: 700 }}>
                {dayLog[f.id] ? tr("done", lang) : tr("pending", lang)}
              </span>
            </div>
          ))}
          {dayLog.hearingExtraNote && (
            <div style={{ ...S.row, borderBottom: "none" }}>
              <span style={{ fontSize: 13, color: C.sub }}>📖 {dayLog.hearingExtraNote}{dayLog.hearingExtraDuration ? ` — ${dayLog.hearingExtraDuration}` : ""}</span>
            </div>
          )}
          {dayLog.exerciseDuration && (
            <div style={{ ...S.row, borderBottom: "none" }}>
              <span style={{ fontSize: 13, color: C.sub }}>🏃 {dayLog.exerciseDuration}</span>
            </div>
          )}
          {customToday.map((c, i) => (
            <div key={i} style={S.row}>
              <span style={{ fontSize: 14 }}>{c.label}</span>
              <span style={{ color: c.done ? "#5cb85c" : C.sub, fontWeight: 700 }}>
                {c.done ? tr("done", lang) : tr("pending", lang)}
              </span>
            </div>
          ))}
          <button style={{ ...S.btn, marginTop: 14, background: "#25D366", color: "#fff" }}
            onClick={() => window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank")}>
            {lang === "hi" ? "WhatsApp पर भेजें" : "Share on WhatsApp"}
          </button>
          <button style={{ ...S.btn, marginTop: 10, background: "#7b3fe4", color: "#fff" }}
            onClick={() => setShowCard(true)}>
            {lang === "hi" ? "सुंदर कार्ड बनाएं" : "Beautiful Card"}
          </button>
        </div>

        {showCard && (
          <div onClick={() => setShowCard(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "#1a0e05", border: `2px solid ${accent}`, borderRadius: 16, padding: 24, maxWidth: 340, width: "100%", textAlign: "center" }}>
              <img src="/prabhupada4.jpg" alt="" style={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover" }} />
              <div style={{ color: accent, fontWeight: 700, marginTop: 10 }}>All Glories to Srila Prabhupada</div>
              <div style={{ color: "#fff", fontWeight: 700, marginTop: 14, fontSize: 18 }}>{user.displayName}</div>
              <div style={{ color: "#bbb", fontSize: 13 }}>{prettyDate(today)}</div>
              <div style={{ color: accent, fontSize: 40, fontWeight: 800, marginTop: 14 }}>{doneCount}/{totalCount}</div>
              <div style={{ color: "#bbb", fontSize: 13 }}>Sadhna completed</div>
              <button style={{ ...S.btn, marginTop: 18 }}
                onClick={() => window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank")}>
                {lang === "hi" ? "शेयर करें" : "Share"}
              </button>
              <button onClick={() => setShowCard(false)} style={{ background: "none", border: "none", color: "#888", marginTop: 12, cursor: "pointer" }}>
                {lang === "hi" ? "बंद करें" : "Close"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── AI ───────────────────────────────────────────────────
  function AIScreen() {
    const [q, setQ] = useState("");
    const [chat, setChat] = useState([]);
    const [loading, setLoading] = useState(false);
    const endRef = useRef();

    const ask = async () => {
      if (!q.trim() || loading) return;
      const question = q.trim();
      setChat((c) => [...c, { r: "u", t: question }]);
      setQ("");
      setLoading(true);
      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        });
        const d = await res.json();
        setChat((c) => [...c, { r: "a", t: d.answer || d.error || "..." }]);
      } catch (e) {
        setChat((c) => [...c, { r: "a", t: "Error: " + e.message }]);
      }
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    return (
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>
          {lang === "hi" ? "प्रभुपाद की पुस्तकों से पूछें" : "Ask from Prabhupada's books"}
        </div>
        <div style={{ color: C.sub, fontSize: 12, marginBottom: 12 }}>
          {lang === "hi" ? "गीता, भागवतम् आदि के आधार पर उत्तर" : "Answers grounded in Gita, Bhagavatam etc."}
        </div>
        <div style={{ minHeight: 160, maxHeight: 380, overflowY: "auto", marginBottom: 12 }}>
          {chat.length === 0 && (
            <div style={{ color: C.sub, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
              🙏 {lang === "hi" ? "कोई भी प्रश्न पूछें..." : "Ask any question..."}
            </div>
          )}
          {chat.map((m, i) => (
            <div key={i} style={{ background: m.r === "u" ? accent : C.bg, color: m.r === "u" ? "#1a0e05" : C.text, padding: "10px 12px", borderRadius: 10, margin: "6px 0", fontSize: 14, whiteSpace: "pre-wrap", textAlign: m.r === "u" ? "right" : "left" }}>
              {m.t}
            </div>
          ))}
          {loading && (
            <div style={{ color: C.sub, fontSize: 13, padding: "8px 0" }}>
              🙏 {lang === "hi" ? "उत्तर खोज रहे हैं..." : "Searching answer..."}
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder={lang === "hi" ? "अपना प्रश्न लिखें…" : "Type your question…"}
            style={{ ...S.input, flex: 1 }}
          />
          <button onClick={ask} style={{ ...S.btn, width: "auto", padding: "10px 18px" }}>
            {lang === "hi" ? "पूछें" : "Ask"}
          </button>
        </div>
      </div>
    );
  }

  // ── Insights ─────────────────────────────────────────────
  function InsightsScreen() {
    const last7 = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const k = dateKey(d);
      const lg = data.log?.[k] || {};
      const cu = data.custom?.[k] || [];
      const dn = BOOL_IDS.filter((id) => lg[id]).length + cu.filter((c) => c.done).length;
      const tt = BOOL_IDS.length + cu.length;
      return { k, pct: tt ? Math.round((dn / tt) * 100) : 0 };
    });
    return (
      <div>
        <div style={S.card}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>{lang === "hi" ? "पिछले 7 दिन" : "Last 7 days"}</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 130 }}>
            {last7.map((x) => (
              <div key={x.k} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: Math.max(4, x.pct) + "%", background: accent, borderRadius: 4, transition: "height .3s" }} />
                <div style={{ fontSize: 9, color: C.sub, marginTop: 6 }}>{x.k.slice(8)}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <button onClick={() => signOut(auth)} style={{ ...S.btn, background: "#d9534f", color: "#fff" }}>
            {tr("logout", lang)}
          </button>
        </div>
      </div>
    );
  }

  const screens = {
    home: <Home />,
    add: <AddScreen />,
    timer: <TimerScreen />,
    playlist: <PlaylistScreen />,
    report: <ReportScreen />,
    ai: <AIScreen />,
    insights: <InsightsScreen />,
  };
  const tabIds = ["home", "add", "timer", "playlist", "report", "ai", "insights"];

  return (
    <div style={S.page}>
      <Header />
      {screens[screen]}
      <div style={S.tabs}>
        {tabIds.map((id) => (
          <div key={id} style={S.tab(screen === id)} onClick={() => setScreen(id)}>
            {tr(id, lang)}
          </div>
        ))}
      </div>
    </div>
  );
}