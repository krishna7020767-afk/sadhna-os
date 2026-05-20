import { useEffect, useState, useRef } from "react";
import { db, auth } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

/* ──────────────────────────────────────────────
   Helpers
─────────────────────────────────────────────── */
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
    day: "numeric",
    month: "short",
  });
}

/* Permanent / fixed sadhna items */
const FIXED = [
  { id: "mangalAarti", en: "Mangal Aarti", hi: "मंगल आरती", type: "time" },
  { id: "wakeTime", en: "Wake-up / Morning walk", hi: "उठने / मॉर्निंग वॉक", type: "time" },
  { id: "chanting16", en: "Chanting — 16 rounds", hi: "जप — 16 माला", type: "bool" },
  { id: "chantingFinishTime", en: "Chanting finished at", hi: "जप समाप्त समय", type: "time" },
  { id: "reading2hr", en: "Reading — 2 hours", hi: "पठन — 2 घंटे", type: "bool" },
  { id: "readingDuration", en: "Reading duration (min)", hi: "पठन अवधि (मिनट)", type: "number", show: (log) => log.reading2hr },
  { id: "hearingSB", en: "SB class heard", hi: "भागवतम् क्लास सुनी", type: "bool" },
  { id: "hearingExtra", en: "Extra lecture heard", hi: "अतिरिक्त प्रवचन सुना", type: "bool" },
  { id: "hearingExtraDuration", en: "Extra lecture duration (min)", hi: "अतिरिक्त प्रवचन अवधि (मिनट)", type: "number", show: (log) => log.hearingExtra },
  { id: "exercise", en: "Exercise", hi: "व्यायाम", type: "bool" },
  { id: "exerciseDuration", en: "Exercise duration (min)", hi: "व्यायाम अवधि (मिनट)", type: "number", show: (log) => log.exercise },
];
const BOOL_IDS = FIXED.filter((f) => f.type === "bool").map((f) => f.id);

/* Tiny translation map */
const T = {
  home: { en: "Home", hi: "होम" },
  add: { en: "Add", hi: "जोड़ें" },
  timer: { en: "Timer", hi: "टाइमर" },
  report: { en: "Report", hi: "रिपोर्ट" },
  ai: { en: "AI", hi: "AI" },
  notes: { en: "Notes", hi: "नोट्स" },
  insights: { en: "Insights", hi: "विश्लेषण" },
  todaySadhna: { en: "Today's Sadhna", hi: "आज की साधना" },
  progress: { en: "Today's Progress", hi: "आज की प्रगति" },
  done: { en: "Done", hi: "पूर्ण" },
  pending: { en: "Pending", hi: "बाकी" },
  logout: { en: "Logout", hi: "लॉगआउट" },
};
const tr = (k, lang) => (T[k] ? T[k][lang] : k);

/* Quote + Photo pairs */
const QUOTES = [
  {
    text: "So far as controlling 'kama' or lust, best thing is don't eat any highly spiced food stuffs and always think of Krishna. Chant regularly.",
    ref: "Letter to Niranjana - Calcutta 27 May, 1971",
    img: "/p1.jpg"
  },
  {
    text: "If you think of Krishna twenty-four hours, Krishna will think of you twenty-six hours. (laughter) Krishna is so kind. If you do some service for Krishna, Krishna will reward you hundred times.",
    ref: "Srila Prabhupada Lecture SB 01.14.44 - New York",
    img: "/p2.jpg"
  },
  {
    text: "The disciple's duty is to be ready always to serve the spiritual master, at any cost.",
    ref: "Los Angeles, June 23, 1972",
    img: "/p3.jpg"
  },
  {
    text: "Hold my hand and I promise to take you back to Krishna!",
    ref: "Srila Prabhupada",
    img: "/p4.jpg"
  },
  {
    text: "Even after trying our best, if we fail, Krishna will help us. Just like a child tries his best, but he falls down. The mother takes up and 'All right, come on. Walk' Like that!",
    ref: "Morning Walk March 23, 1968",
    img: "/p5.jpg"
  },
  {
    text: "Without attentive hearing our Japa will become mechanical and tasteless. Chant your Japa with utmost attention.",
    ref: "Srila Prabhupada",
    img: "/p6.jpg"
  },
  {
    text: "But work hard here. Not that eating, sleeping. No. That cannot be done. They must be engaged twenty-four hours. That is wanted. It is not a lazy free hotel. Anyone who lives here, must be engaged twenty-four hours.",
    ref: "REF: Room Conversation - September 5, 1976, Vrindavana",
    img: "/p7.jpg"
  },
  {
    text: "Obedience is the first discipline. If you do not obey the representative, authority, then there cannot be any discipline. Then everything will be topsy-turvy.",
    ref: "REF: Room Conversation - Vrindavana, March 16, 1974",
    img: "/p8.jpg"
  },
  {
    text: "The best devotee sees, 'Everyone is better than me'. Just like Caitanya-caritamrta's author, Krsnadasa Kaviraja says: jagāi mādhāi haite muñi se pāpistha purisera kita haite muni se laghista",
    ref: "Srila Prabhupada",
    img: "/p9.jpg"
  },
  {
    text: "Let us all obey the Supreme Lord, whose hand is in everything, without exception.",
    ref: "Ref: Srimad Bhagavatam 2.10.51 Purport",
    img: "/p10.jpg"
  },
  {
    text: "The argument that 'We do not see Krsna personally. How we can satisfy Him?'... You satisfy your spiritual master, then Krsna is pleased. Yasya prasādād bhagavat-prasādo yasyāprasādāt...",
    ref: "REF: SB.1.5.23 — Vrindavana, August 4, 1974",
    img: "/p11.jpg"
  },
  {
    text: "Chanting Hare Krishna is our life and soul. Without chanting, we cannot live. Just like a fish cannot live without water.",
    ref: "Srila Prabhupada",
    img: "/p12.jpg"
  },
  {
    text: "The spiritual master is the transparent via medium to Krishna. If you keep the via medium transparent, then you'll be able to see Krishna.",
    ref: "Srila Prabhupada",
    img: "/p13.jpg"
  },
];

/* ──────────────────────────────────────────────
   Splash - Quote Cards with Circular Photo
─────────────────────────────────────────────── */
function SplashScreen({ onDone }) {
  const [i, setI] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setI((prev) => {
        if (prev >= QUOTES.length - 1) {
          clearInterval(timer);
          setExiting(true);
          setTimeout(onDone, 800);
          return prev;
        }
        return prev + 1;
      });
    }, 3000); // 3 seconds per quote
    return () => clearInterval(timer);
  }, [onDone]);

  const skip = () => {
    setExiting(true);
    setTimeout(onDone, 500);
  };

  const quote = QUOTES[i];

  return (
    <div
      onClick={skip}
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(135deg, #1a0e05 0%, #2d1810 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        zIndex: 9999,
        cursor: "pointer",
        opacity: exiting ? 0 : 1,
        transition: "opacity 0.6s ease-out",
        padding: "40px 24px",
      }}
    >
      <style>{`
        @keyframes fadeInQuote {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulsePhoto {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255,153,51,0.3); }
          50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(255,153,51,0.5); }
        }
      `}</style>

      {/* Circular Photo - Top Right */}
      <div style={{ alignSelf: "flex-end" }}>
        <img
          key={i}
          src={quote.img}
          alt=""
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            objectFit: "cover",
            border: "4px solid #ff9933",
            animation: "pulsePhoto 3s ease-in-out infinite",
          }}
        />
      </div>

      {/* Quote Text - Bottom Left */}
      <div
        key={i}
        style={{
          animation: "fadeInQuote 0.8s ease-out",
          maxWidth: "90%",
        }}
      >
        <div
          style={{
            color: "#f5e6d3",
            fontSize: 19,
            lineHeight: 1.6,
            fontWeight: 500,
            marginBottom: 16,
            fontStyle: "italic",
          }}
        >
          "{quote.text}"
        </div>
        <div
          style={{
            color: "#ff9933",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          — {quote.ref}
        </div>
      </div>

      {/* Progress Dots + Title */}
      <div style={{ alignSelf: "center", textAlign: "center" }}>
        <div
          style={{
            color: "#ff9933",
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          All Glories to Srila Prabhupada
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {QUOTES.map((_, k) => (
            <span
              key={k}
              style={{
                width: k === i ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: k === i ? "#ff9933" : "rgba(255,255,255,.2)",
                transition: "all 0.3s",
              }}
            />
          ))}
        </div>
        <div style={{ color: "rgba(255,255,255,.4)", fontSize: 12, marginTop: 14 }}>
          Tap to skip →
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Login
─────────────────────────────────────────────── */
function Login() {
  const go = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      alert("Login failed: " + e.message);
    }
  };
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#120a04",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <img
        src="/p13.jpg"
        alt=""
        style={{ width: 140, height: 140, borderRadius: "50%", objectFit: "cover", border: "3px solid #ff9933" }}
      />
      <h1 style={{ color: "#ff9933", marginTop: 24, fontSize: 28, textAlign: "center" }}>
        Sadhna OS
      </h1>
      <p style={{ color: "#bbb", marginTop: 8, textAlign: "center", fontSize: 15 }}>
        All Glories to Srila Prabhupada
      </p>
      <button
        onClick={go}
        style={{
          marginTop: 36,
          background: "#fff",
          color: "#333",
          border: "none",
          padding: "16px 34px",
          borderRadius: 12,
          fontSize: 17,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(0,0,0,.35)",
        }}
      >
        Sign in with Google
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main App
─────────────────────────────────────────────── */
export default function App() {
  const [splash, setSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [lang, setLang] = useState("hi");
  const [dark, setDark] = useState(true);
  const [screen, setScreen] = useState("home");
  const [data, setData] = useState({ log: {}, custom: {}, notes: [] });

  const today = dateKey();

  useEffect(() => {
    const un = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return un;
  }, []);

  // live sync of user doc
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const un = onSnapshot(ref, (snap) => {
      if (snap.exists()) setData({ log: {}, custom: {}, notes: [], ...snap.data() });
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

  /* theme */
  const C = dark
    ? { bg: "#0f0a05", card: "#1c140b", text: "#f3ede2", sub: "#9b8f7d", line: "#2e2316" }
    : { bg: "#fdf8f0", card: "#fff", text: "#2a2118", sub: "#7a6f5e", line: "#ece2d0" };
  const accent = "#ff9933";

  const S = {
    page: { background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "system-ui, sans-serif", paddingBottom: 105, touchAction: "pan-x pan-y" },
    head: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${C.line}`, position: "sticky", top: 0, background: C.bg, zIndex: 5 },
    card: { background: C.card, borderRadius: 14, padding: 16, margin: "12px 16px", border: `1px solid ${C.line}` },
    row: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${C.line}` },
    btn: { background: accent, color: "#1a0e05", border: "none", padding: "15px 20px", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer", width: "100%" },
    chk: (on) => ({ width: 30, height: 30, borderRadius: 8, border: `2px solid ${on ? accent : C.sub}`, background: on ? accent : "transparent", color: "#1a0e05", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 800, fontSize: 18 }),
    input: { background: C.bg, color: C.text, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 12px", fontSize: 15, width: "100%" },
    tabs: { position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", background: C.card, borderTop: `1px solid ${C.line}`, paddingTop: 12, paddingBottom: 12, gap: 6 },
    tab: (a) => ({ flex: 1, textAlign: "center", padding: "13px 4px", fontSize: 15, fontWeight: a ? 700 : 500, color: a ? accent : C.sub, cursor: "pointer", borderRadius: 8 }),
  };

  if (splash) return <SplashScreen onDone={() => setSplash(false)} />;
  if (!authReady)
    return <div style={{ background: C.bg, minHeight: "100vh" }} />;
  if (!user) return <Login />;

  const Header = () => (
    <div style={S.head}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {user.photoURL && (
          <img src={user.photoURL} alt="" style={{ width: 36, height: 36, borderRadius: "50%" }} />
        )}
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {lang === "hi" ? "हरे कृष्ण" : "Hare Krishna"}, {user.displayName?.split(" ")[0]}
          </div>
          <div style={{ fontSize: 11, color: accent }}>All Glories to Srila Prabhupada</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setLang(lang === "hi" ? "en" : "hi")} style={{ ...S.input, cursor: "pointer", width: "auto", padding: "8px 14px", fontSize: 14 }}>
          {lang === "hi" ? "EN" : "हिं"}
        </button>
        <button onClick={() => setDark(!dark)} style={{ ...S.input, cursor: "pointer", width: "auto", padding: "8px 14px", fontSize: 14 }}>
          {dark ? "☀" : "🌙"}
        </button>
      </div>
    </div>
  );

  /* ───── Screens ───── */
  const Home = () => (
    <>
      <div style={S.card}>
        <div style={{ color: C.sub, fontSize: 14 }}>{tr("progress", lang)}</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: accent, marginTop: 6 }}>
          {pct}%
        </div>
        <div style={{ height: 10, background: C.bg, borderRadius: 6, marginTop: 12, overflow: "hidden" }}>
          <div style={{ width: pct + "%", height: "100%", background: accent, transition: "width 0.3s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 14 }}>
          <span style={{ color: "#5cb85c" }}>{tr("done", lang)}: {doneCount}</span>
          <span style={{ color: C.sub }}>{tr("pending", lang)}: {totalCount - doneCount}</span>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 16 }}>{tr("todaySadhna", lang)}</div>
        {FIXED.filter(f => !f.show || f.show(dayLog)).map((f) => (
          <div key={f.id} style={S.row}>
            <span style={{ fontSize: 15 }}>{lang === "hi" ? f.hi : f.en}</span>
            {f.type === "bool" ? (
              <div style={S.chk(!!dayLog[f.id])} onClick={() => setField(f.id, !dayLog[f.id])}>
                {dayLog[f.id] ? "✓" : ""}
              </div>
            ) : f.type === "time" ? (
              <input
                type="time"
                value={dayLog[f.id] || ""}
                onChange={(e) => setField(f.id, e.target.value)}
                style={{ ...S.input, width: "auto", padding: "8px 12px" }}
              />
            ) : (
              <input
                type="number"
                value={dayLog[f.id] || ""}
                onChange={(e) => setField(f.id, e.target.value)}
                placeholder="0"
                style={{ ...S.input, width: "90px", padding: "8px 12px", textAlign: "center" }}
              />
            )}
          </div>
        ))}
        {customToday.map((c, idx) => (
          <div key={idx} style={S.row}>
            <span style={{ fontSize: 15 }}>{c.label}</span>
            <div
              style={S.chk(c.done)}
              onClick={() => {
                const a = [...customToday];
                a[idx] = { ...c, done: !c.done };
                setCustom(a);
              }}
            >
              {c.done ? "✓" : ""}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  function AddScreen() {
    const [val, setVal] = useState("");
    return (
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 16 }}>
          {lang === "hi" ? "अपना कार्य जोड़ें" : "Add a custom task"}
        </div>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={lang === "hi" ? "जैसे: तुलसी सेवा" : "e.g. Tulsi seva"}
          style={{ ...S.input, marginBottom: 12 }}
        />
        <button
          style={S.btn}
          onClick={() => {
            if (!val.trim()) return;
            setCustom([...customToday, { label: val.trim(), done: false }]);
            setVal("");
          }}
        >
          {lang === "hi" ? "जोड़ें" : "Add"}
        </button>
        <div style={{ marginTop: 16 }}>
          {customToday.map((c, idx) => (
            <div key={idx} style={S.row}>
              <span style={{ fontSize: 15 }}>{c.label}</span>
              <button
                onClick={() => setCustom(customToday.filter((_, i) => i !== idx))}
                style={{ background: "none", border: "none", color: "#d9534f", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
              >
                {lang === "hi" ? "हटाएं" : "Remove"}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function TimerScreen() {
    const [mode, setMode] = useState("reading");
    const [readingTimer, setReadingTimer] = useState({ sec: 0, run: false });
    const [chantingTimer, setChantingTimer] = useState({ sec: 0, run: false });
    const readingRef = useRef();
    const chantingRef = useRef();

    useEffect(() => {
      if (readingTimer.run) {
        readingRef.current = setInterval(() => setReadingTimer(t => ({ ...t, sec: t.sec + 1 })), 1000);
      } else {
        clearInterval(readingRef.current);
      }
      return () => clearInterval(readingRef.current);
    }, [readingTimer.run]);

    useEffect(() => {
      if (chantingTimer.run) {
        chantingRef.current = setInterval(() => setChantingTimer(t => ({ ...t, sec: t.sec + 1 })), 1000);
      } else {
        clearInterval(chantingRef.current);
      }
      return () => clearInterval(chantingRef.current);
    }, [chantingTimer.run]);

    const current = mode === "reading" ? readingTimer : chantingTimer;
    const setCurrent = mode === "reading" ? setReadingTimer : setChantingTimer;

    const mm = String(Math.floor(current.sec / 60)).padStart(2, "0");
    const ss = String(current.sec % 60).padStart(2, "0");

    return (
      <div style={S.card}>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {["reading", "chanting"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                ...S.input,
                cursor: "pointer",
                background: mode === m ? accent : C.bg,
                color: mode === m ? "#1a0e05" : C.text,
                fontWeight: 700,
                padding: "12px",
              }}
            >
              {m === "reading"
                ? lang === "hi" ? "पठन (निजी)" : "Reading (personal)"
                : lang === "hi" ? "जप / श्रवण" : "Chanting / Hearing"}
            </button>
          ))}
        </div>
        <div style={{ textAlign: "center", fontSize: 64, fontWeight: 800, color: accent, marginBottom: 24 }}>
          {mm}:{ss}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            style={{ ...S.btn, background: current.run ? "#d9534f" : accent }}
            onClick={() => setCurrent(t => ({ ...t, run: !t.run }))}
          >
            {current.run ? (lang === "hi" ? "रोकें" : "Pause") : (lang === "hi" ? "शुरू" : "Start")}
          </button>
          <button
            style={{ ...S.btn, background: C.bg, color: C.text, border: `1px solid ${C.line}` }}
            onClick={() => setCurrent({ sec: 0, run: false })}
          >
            {lang === "hi" ? "रीसेट" : "Reset"}
          </button>
        </div>
        {mode === "reading" && (
          <button
            style={{ ...S.btn, marginTop: 14, background: "#5cb85c", color: "#fff" }}
            onClick={() => {
              setField("reading2hr", true);
              setField("readingDuration", Math.floor(readingTimer.sec / 60));
              alert(lang === "hi" ? "पठन पूर्ण के रूप में चिह्नित" : "Reading marked done");
            }}
          >
            {lang === "hi" ? "पठन पूर्ण चिह्नित करें" : "Mark reading done"}
          </button>
        )}
      </div>
    );
  }

  function ReportScreen() {
    const [showCard, setShowCard] = useState(false);

    let msg = `${prettyDate(today)}\n\n`;
    FIXED.forEach(f => {
      if (f.type === "bool" && dayLog[f.id]) {
        msg += `✅ ${f.en}\n`;
      } else if (f.type === "time" && dayLog[f.id]) {
        msg += `✅ ${f.en}: ${dayLog[f.id]}\n`;
      } else if (f.type === "number" && dayLog[f.id]) {
        msg += `   └ Duration: ${dayLog[f.id]} min\n`;
      }
    });
    customToday.forEach(c => {
      if (c.done) msg += `✅ ${c.label}\n`;
    });

    return (
      <div>
        <div style={S.card}>
          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 16 }}>
            {prettyDate(today)}
          </div>
          {FIXED.filter(f => f.type === "bool" || f.type === "time").map((f) => (
            <div key={f.id} style={S.row}>
              <span style={{ fontSize: 15 }}>{lang === "hi" ? f.hi : f.en}</span>
              <span style={{ color: dayLog[f.id] ? "#5cb85c" : C.sub, fontWeight: 700, fontSize: 14 }}>
                {f.type === "time" && dayLog[f.id] ? dayLog[f.id] : dayLog[f.id] ? tr("done", lang) : tr("pending", lang)}
              </span>
            </div>
          ))}
          {customToday.map((c, i) => (
            <div key={i} style={S.row}>
              <span style={{ fontSize: 15 }}>{c.label}</span>
              <span style={{ color: c.done ? "#5cb85c" : C.sub, fontWeight: 700, fontSize: 14 }}>
                {c.done ? tr("done", lang) : tr("pending", lang)}
              </span>
            </div>
          ))}
          <button
            style={{ ...S.btn, marginTop: 16, background: "#25D366", color: "#fff" }}
            onClick={() =>
              window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank")
            }
          >
            {lang === "hi" ? "WhatsApp पर भेजें" : "Share on WhatsApp"}
          </button>
          <button
            style={{ ...S.btn, marginTop: 12, background: "#7b3fe4", color: "#fff" }}
            onClick={() => setShowCard(true)}
          >
            {lang === "hi" ? "सुंदर कार्ड बनाएं" : "Beautiful Card"}
          </button>
        </div>

        {showCard && (
          <div
            onClick={() => setShowCard(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ background: "#1a0e05", border: `2px solid ${accent}`, borderRadius: 16, padding: 28, maxWidth: 360, width: "100%", textAlign: "center" }}
            >
              <img src="/p1.jpg" alt="" style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover" }} />
              <div style={{ color: accent, fontWeight: 700, marginTop: 12, fontSize: 16 }}>
                All Glories to Srila Prabhupada
              </div>
              <div style={{ color: "#fff", fontWeight: 700, marginTop: 16, fontSize: 20 }}>
                {user.displayName}
              </div>
              <div style={{ color: "#bbb", fontSize: 14, marginTop: 4 }}>{prettyDate(today)}</div>
              <div style={{ color: accent, fontSize: 48, fontWeight: 800, marginTop: 16 }}>
                {doneCount}/{totalCount}
              </div>
              <div style={{ color: "#bbb", fontSize: 14 }}>Sadhna completed</div>
              <button
                style={{ ...S.btn, marginTop: 20 }}
                onClick={() =>
                  window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank")
                }
              >
                {lang === "hi" ? "शेयर करें" : "Share"}
              </button>
              <button
                onClick={() => setShowCard(false)}
                style={{ background: "none", border: "none", color: "#999", marginTop: 14, cursor: "pointer", fontSize: 14 }}
              >
                {lang === "hi" ? "बंद करें" : "Close"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  function AIScreen() {
    const [q, setQ] = useState("");
    const [chat, setChat] = useState([]);
    const [loading, setLoading] = useState(false);
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
    };
    return (
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 16 }}>
          {lang === "hi" ? "प्रभुपाद की पुस्तकों से पूछें" : "Ask from Prabhupada's books"}
        </div>
        <div style={{ color: C.sub, fontSize: 13, marginBottom: 14 }}>
          {lang === "hi"
            ? "गीता, भागवतम् आदि के आधार पर उत्तर"
            : "Answers grounded in Gita, Bhagavatam etc."}
        </div>
        <div style={{ minHeight: 180, maxHeight: 360, overflowY: "auto", marginBottom: 14 }}>
          {chat.map((m, i) => (
            <div
              key={i}
              style={{
                background: m.r === "u" ? accent : C.bg,
                color: m.r === "u" ? "#1a0e05" : C.text,
                padding: "12px 14px",
                borderRadius: 12,
                margin: "8px 0",
                fontSize: 15,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.t}
            </div>
          ))}
          {loading && <div style={{ color: C.sub, fontSize: 14 }}>…</div>}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder={lang === "hi" ? "अपना प्रश्न लिखें…" : "Type your question…"}
            style={{ ...S.input, flex: 1 }}
          />
          <button onClick={ask} style={{ ...S.btn, width: "auto", padding: "12px 20px" }}>
            {lang === "hi" ? "पूछें" : "Ask"}
          </button>
        </div>
      </div>
    );
  }

  function NotesScreen() {
    const [editing, setEditing] = useState(null);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");

    const notes = data.notes || [];

    const saveNote = () => {
      if (!title.trim() && !body.trim()) return;
      const note = { id: Date.now(), title: title.trim(), body: body.trim(), date: Date.now() };
      if (editing) {
        save({ notes: notes.map(n => n.id === editing.id ? note : n) });
      } else {
        save({ notes: [...notes, note] });
      }
      setEditing(null);
      setTitle("");
      setBody("");
    };

    const deleteNote = (id) => {
      if (confirm(lang === "hi" ? "नोट हटाएं?" : "Delete note?")) {
        save({ notes: notes.filter(n => n.id !== id) });
      }
    };

    const shareNote = (note) => {
      const msg = `${note.title ? note.title + "\n\n" : ""}${note.body}`;
      window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
    };

    return (
      <div>
        <div style={S.card}>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 16 }}>
            {editing ? (lang === "hi" ? "नोट संपादित करें" : "Edit note") : (lang === "hi" ? "नया नोट" : "New note")}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={lang === "hi" ? "शीर्षक (वैकल्पिक)" : "Title (optional)"}
            style={{ ...S.input, marginBottom: 10, fontWeight: 600 }}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={lang === "hi" ? "नोट्स लिखें…" : "Write notes…"}
            style={{ ...S.input, minHeight: 120, resize: "vertical", fontFamily: "inherit" }}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button onClick={saveNote} style={S.btn}>
              {editing ? (lang === "hi" ? "सहेजें" : "Save") : (lang === "hi" ? "जोड़ें" : "Add")}
            </button>
            {editing && (
              <button
                onClick={() => { setEditing(null); setTitle(""); setBody(""); }}
                style={{ ...S.btn, background: C.bg, color: C.text, border: `1px solid ${C.line}` }}
              >
                {lang === "hi" ? "रद्द करें" : "Cancel"}
              </button>
            )}
          </div>
        </div>

        {notes.length > 0 && (
          <div style={S.card}>
            <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 16 }}>
              {lang === "hi" ? "मेरे नोट्स" : "My notes"}
            </div>
            {notes.map(note => (
              <div key={note.id} style={{ ...S.row, flexDirection: "column", alignItems: "flex-start", padding: "14px 0" }}>
                {note.title && <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{note.title}</div>}
                <div style={{ color: C.sub, fontSize: 14, marginBottom: 10, whiteSpace: "pre-wrap" }}>
                  {note.body.length > 120 ? note.body.slice(0, 120) + "..." : note.body}
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button
                    onClick={() => { setEditing(note); setTitle(note.title); setBody(note.body); }}
                    style={{ background: "none", border: "none", color: accent, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                  >
                    {lang === "hi" ? "संपादित करें" : "Edit"}
                  </button>
                  <button
                    onClick={() => shareNote(note)}
                    style={{ background: "none", border: "none", color: "#25D366", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                  >
                    {lang === "hi" ? "शेयर" : "Share"} 📤
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    style={{ background: "none", border: "none", color: "#d9534f", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                  >
                    {lang === "hi" ? "हटाएं" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

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
          <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 16 }}>
            {lang === "hi" ? "पिछले 7 दिन" : "Last 7 days"}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 140 }}>
            {last7.map((x) => (
              <div key={x.k} style={{ flex: 1, textAlign: "center" }}>
                <div
                  style={{
                    height: Math.max(4, x.pct) + "%",
                    background: accent,
                    borderRadius: 6,
                    transition: "height .3s",
                  }}
                />
                <div style={{ fontSize: 10, color: C.sub, marginTop: 8 }}>
                  {x.k.slice(8)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <button
            onClick={() => signOut(auth)}
            style={{ ...S.btn, background: "#d9534f", color: "#fff" }}
          >
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
    report: <ReportScreen />,
    ai: <AIScreen />,
    notes: <NotesScreen />,
    insights: <InsightsScreen />,
  };
  const tabIds = ["home", "add", "timer", "report", "ai", "notes", "insights"];

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