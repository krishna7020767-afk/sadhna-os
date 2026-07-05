import { useEffect, useState, useRef } from "react";
import { supabase } from "./supabaseClient";

/* ──────────────────────────────────────────────
   Helpers
─────────────────────────────────────────────── */
function mapUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    displayName: u.user_metadata?.full_name || u.user_metadata?.name || u.email || "",
    photoURL: u.user_metadata?.avatar_url || u.user_metadata?.picture || "",
  };
}
function dateKey(d = new Date()) {
  return (
    d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0")
  );
}
function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}
function prettyDate(key) {
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function fmtHMS(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const p = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${p(h)}:${p(m)}:${p(ss)}` : `${p(m)}:${p(ss)}`;
}

/* Permanent / fixed sadhna items */
const FIXED = [
  { id: "mangalAarti", en: "Mangal Aarti", hi: "मंगल आरती", type: "time" },
  { id: "wakeTime", en: "Wake-up / Morning walk", hi: "उठने / मॉर्निंग वॉक", type: "time" },
  { id: "chanting16", en: "Chanting — 16 rounds", hi: "जप — 16 माला", type: "bool" },
  { id: "chantingFinishTime", en: "Chanting finished at", hi: "जप समाप्त समय", type: "time" },
  { id: "reading", en: "Reading (minutes)", hi: "पठन (मिनट)", type: "number" },
  { id: "hearingSB", en: "SB class heard", hi: "भागवतम् क्लास सुनी", type: "bool" },
  { id: "hearingExtra", en: "Extra lecture heard", hi: "अतिरिक्त प्रवचन सुना", type: "bool" },
  { id: "hearingExtraDuration", en: "Extra lecture duration (min)", hi: "अतिरिक्त प्रवचन अवधि (मिनट)", type: "number", show: (log) => log.hearingExtra },
  { id: "exercise", en: "Exercise", hi: "व्यायाम", type: "bool" },
  { id: "exerciseDuration", en: "Exercise duration (min)", hi: "व्यायाम अवधि (मिनट)", type: "number", show: (log) => log.exercise },
];
const BOOL_IDS = FIXED.filter((f) => f.type === "bool").map((f) => f.id);

/* Goal metrics — derived from the daily log (no schema change) */
const METRICS = {
  rounds: { en: "Chanting rounds", hi: "जप माला", unit: "", target: 16 },
  reading: { en: "Reading", hi: "पठन", unit: "min", target: 30 },
  hearing: { en: "Hearing", hi: "श्रवण", unit: "min", target: 30 },
  mangala: { en: "Morning program", hi: "मंगल आरती", unit: "", target: 1 },
  sadhna: { en: "Sadhna items done", hi: "साधना कार्य", unit: "", target: BOOL_IDS.length },
};
function dayMetric(data, key, k) {
  const lg = data.log?.[k] || {};
  const cu = data.custom?.[k] || [];
  switch (key) {
    case "rounds": return lg.chanting16 ? 16 : 0;
    case "reading": return Number(lg.reading) || 0;
    case "hearing": return Number(lg.hearingExtraDuration) || 0;
    case "mangala": return lg.mangalAarti ? 1 : 0;
    case "sadhna": return BOOL_IDS.filter((id) => lg[id]).length + cu.filter((c) => c.done).length;
    default: return 0;
  }
}
function rangeMetric(data, key, days) {
  let sum = 0;
  for (let i = 0; i < days; i++) sum += dayMetric(data, key, dateKey(addDays(new Date(), -i)));
  return sum;
}
function streakMetric(data, key, target) {
  let n = 0;
  for (let i = 0; i < 400; i++) {
    if (dayMetric(data, key, dateKey(addDays(new Date(), -i))) >= target) n++;
    else if (i === 0) continue; // today may not be done yet — don't break the streak on day 0
    else break;
  }
  return n;
}

/* Tiny translation map */
const T = {
  home: { en: "Home", hi: "होम" },
  timers: { en: "Timers", hi: "टाइमर" },
  goals: { en: "Goals", hi: "लक्ष्य" },
  reports: { en: "Reports", hi: "रिपोर्ट" },
  insights: { en: "Insights", hi: "विश्लेषण" },
  notes: { en: "Notes", hi: "नोट्स" },
  ai: { en: "Ask AI", hi: "AI से पूछें" },
  notifications: { en: "Notifications", hi: "सूचनाएं" },
  todaySadhna: { en: "Today's Sadhna", hi: "आज की साधना" },
  progress: { en: "Today's Progress", hi: "आज की प्रगति" },
  done: { en: "Done", hi: "पूर्ण" },
  pending: { en: "Pending", hi: "बाकी" },
  logout: { en: "Logout", hi: "लॉगआउट" },
  customize: { en: "Customize", hi: "अनुकूलित करें" },
  doneEditing: { en: "Done", hi: "पूर्ण" },
  addWidget: { en: "Add widget", hi: "विजेट जोड़ें" },
};
const tr = (k, lang) => (T[k] ? T[k][lang] : k);

/* Quote + Photo pairs */
const QUOTES = [
  { text: "So far as controlling 'kama' or lust, best thing is don't eat any highly spiced food stuffs and always think of Krishna. Chant regularly.", ref: "Letter to Niranjana - Calcutta 27 May, 1971", img: "/p1.jpg" },
  { text: "If you think of Krishna twenty-four hours, Krishna will think of you twenty-six hours. (laughter) Krishna is so kind. If you do some service for Krishna, Krishna will reward you hundred times.", ref: "Srila Prabhupada Lecture SB 01.14.44 - New York", img: "/p2.jpg" },
  { text: "The disciple's duty is to be ready always to serve the spiritual master, at any cost.", ref: "Los Angeles, June 23, 1972", img: "/p3.jpg" },
  { text: "Hold my hand and I promise to take you back to Krishna!", ref: "Srila Prabhupada", img: "/p4.jpg" },
  { text: "Even after trying our best, if we fail, Krishna will help us. Just like a child tries his best, but he falls down. The mother takes up and 'All right, come on. Walk' Like that!", ref: "Morning Walk March 23, 1968", img: "/p5.jpg" },
  { text: "Without attentive hearing our Japa will become mechanical and tasteless. Chant your Japa with utmost attention.", ref: "Srila Prabhupada", img: "/p6.jpg" },
  { text: "But work hard here. Not that eating, sleeping. No. That cannot be done. They must be engaged twenty-four hours. That is wanted. It is not a lazy free hotel. Anyone who lives here, must be engaged twenty-four hours.", ref: "REF: Room Conversation - September 5, 1976, Vrindavana", img: "/p7.jpg" },
  { text: "Obedience is the first discipline. If you do not obey the representative, authority, then there cannot be any discipline. Then everything will be topsy-turvy.", ref: "REF: Room Conversation - Vrindavana, March 16, 1974", img: "/p8.jpg" },
  { text: "The best devotee sees, 'Everyone is better than me'. Just like Caitanya-caritamrta's author, Krsnadasa Kaviraja says: jagāi mādhāi haite muñi se pāpistha purisera kita haite muni se laghista", ref: "Srila Prabhupada", img: "/p9.jpg" },
  { text: "Let us all obey the Supreme Lord, whose hand is in everything, without exception.", ref: "Ref: Srimad Bhagavatam 2.10.51 Purport", img: "/p10.jpg" },
  { text: "The argument that 'We do not see Krsna personally. How we can satisfy Him?'... You satisfy your spiritual master, then Krsna is pleased. Yasya prasādād bhagavat-prasādo yasyāprasādāt...", ref: "REF: SB.1.5.23 — Vrindavana, August 4, 1974", img: "/p11.jpg" },
  { text: "Chanting Hare Krishna is our life and soul. Without chanting, we cannot live. Just like a fish cannot live without water.", ref: "Srila Prabhupada", img: "/p12.jpg" },
  { text: "The spiritual master is the transparent via medium to Krishna. If you keep the via medium transparent, then you'll be able to see Krishna.", ref: "Srila Prabhupada", img: "/p13.jpg" },
];

/* ──────────────────────────────────────────────
   SVG icon set (structural nav — no emoji)
─────────────────────────────────────────────── */
const ICONS = {
  home: "M3 11l9-8 9 8M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10",
  timer: "M12 22a9 9 0 100-18 9 9 0 000 18M12 8v5l3 2M9 2h6",
  goal: "M12 22a10 10 0 100-20 10 10 0 000 20M12 17a5 5 0 100-10 5 5 0 000 10M12 12h.01",
  report: "M4 4h16v12H5.2L4 17.2zM8 9h8M8 12.5h5",
  menu: "M4 6h16M4 12h16M4 18h16",
  plus: "M12 5v14M5 12h14",
  x: "M6 6l12 12M18 6L6 18",
  bell: "M6 8a6 6 0 1112 0c0 7 3 7 3 7H3s3 0 3-7M9.5 21a2.5 2.5 0 005 0",
  share: "M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13",
  up: "M6 15l6-6 6 6",
  down: "M6 9l6 6 6-6",
  chart: "M4 20V4M4 20h16M8 16v-5M13 16V8M18 16v-9",
  moon: "M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z",
  sun: "M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4M12 8a4 4 0 100 8 4 4 0 000-8z",
  note: "M5 3h11l3 3v15H5zM9 8h6M9 12h6M9 16h4",
  ai: "M12 3a4 4 0 014 4v1a4 4 0 010 8v1a4 4 0 01-8 0v-1a4 4 0 010-8V7a4 4 0 014-4zM9 9h.01M15 9h.01",
  logout: "M9 21H5a1 1 0 01-1-1V4a1 1 0 011-1h4M16 17l5-5-5-5M21 12H9",
  play: "M7 4l13 8-13 8z",
  pause: "M7 5h4v14H7zM13 5h4v14h-4z",
  reset: "M3 12a9 9 0 109-9 9 9 0 00-7 3.5M3 3v4h4",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14",
  check: "M4 12l5 5L20 6",
};
function Icon({ name, size = 22, color = "currentColor", w = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={ICONS[name] || ""} />
    </svg>
  );
}
function Ring({ pct, size = 68, stroke = 7, color, track, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(1, Math.max(0, pct / 100)));
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: "stroke-dashoffset .5s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
        {children}
      </div>
    </div>
  );
}

/* Notification helper (best-effort; real push needs a server) */
// ponytail: local Notification API only — fires while a tab is open. Add web-push + a server cron for true background alerts.
function notify(title, body) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/p1.jpg" });
    }
  } catch { /* ignore */ }
}

/* ──────────────────────────────────────────────
   Splash
─────────────────────────────────────────────── */
function SplashScreen({ onDone }) {
  const [i, setI] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance && i < QUOTES.length - 1) setI(i + 1);
    if (distance < -minSwipeDistance && i > 0) setI(i - 1);
  };

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
    }, 3000);
    return () => clearInterval(timer);
  }, [onDone]);

  const skip = () => { setExiting(true); setTimeout(onDone, 500); };
  const quote = QUOTES[i];

  return (
    <div
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      style={{ position: "fixed", inset: 0, background: "linear-gradient(135deg, #1a0e05 0%, #2d1810 100%)", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "space-between", zIndex: 9999, cursor: "pointer", opacity: exiting ? 0 : 1, transition: "opacity 0.6s ease-out", padding: "40px 24px" }}
    >
      <style>{`
        @keyframes fadeInQuote { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulsePhoto { 0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255,153,51,0.3); } 50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(255,153,51,0.5); } }
      `}</style>
      <div style={{ alignSelf: "flex-end" }}>
        <img key={i} src={quote.img} alt="" style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: "4px solid #ff9933", animation: "pulsePhoto 3s ease-in-out infinite" }} />
      </div>
      <div key={i} style={{ animation: "fadeInQuote 0.8s ease-out", maxWidth: "90%" }}>
        <div style={{ color: "#f5e6d3", fontSize: 19, lineHeight: 1.6, fontWeight: 500, marginBottom: 16, fontStyle: "italic" }}>"{quote.text}"</div>
        <div style={{ color: "#ff9933", fontSize: 13, fontWeight: 600 }}>— {quote.ref}</div>
      </div>
      <div style={{ alignSelf: "center", textAlign: "center", width: "100%" }}>
        <div style={{ color: "#ff9933", fontSize: 16, fontWeight: 700, marginBottom: 14 }}>All Glories to Srila Prabhupada</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {QUOTES.map((_, k) => (
            <span key={k} style={{ width: k === i ? 24 : 8, height: 8, borderRadius: 4, background: k === i ? "#ff9933" : "rgba(255,255,255,.2)", transition: "all 0.3s" }} />
          ))}
        </div>
        <div style={{ color: "rgba(255,255,255,.4)", fontSize: 12, marginTop: 14, marginBottom: 16 }}>👈 Swipe to browse quotes 👉</div>
        <button onClick={skip} style={{ background: "#ff9933", color: "#1a0e05", border: "none", padding: "14px 32px", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,.35)" }}>Continue to App →</button>
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
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
      if (error) throw error;
    } catch (e) { alert("Login failed: " + e.message); }
  };
  return (
    <div style={{ minHeight: "100dvh", background: "#120a04", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <img src="/p13.jpg" alt="" style={{ width: 140, height: 140, borderRadius: "50%", objectFit: "cover", border: "3px solid #ff9933" }} />
      <h1 style={{ color: "#ff9933", marginTop: 24, fontSize: 28, textAlign: "center" }}>Sadhna OS</h1>
      <p style={{ color: "#bbb", marginTop: 8, textAlign: "center", fontSize: 15 }}>All Glories to Srila Prabhupada</p>
      <button onClick={go} style={{ marginTop: 36, background: "#fff", color: "#333", border: "none", padding: "16px 34px", borderRadius: 12, fontSize: 17, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,.35)" }}>Sign in with Google</button>
    </div>
  );
}

const EMPTY = { log: {}, custom: {}, notes: [], settings: {}, timers: [], goals: [], widgets: [], templates: [] };
const DEFAULT_TIMERS = [
  { id: "japa", name: "Japa", mode: "stopwatch", duration: 0 },
  { id: "reading", name: "Reading", mode: "stopwatch", duration: 0 },
  { id: "hearing", name: "Hearing", mode: "stopwatch", duration: 0 },
  { id: "kirtan", name: "Kirtan", mode: "stopwatch", duration: 0 },
  { id: "mangala", name: "Mangala Arati", mode: "countdown", duration: 1800 },
];
const WIDGET_META = {
  progress: { en: "Progress", hi: "प्रगति" },
  japa: { en: "Today's Japa", hi: "आज का जप" },
  reading: { en: "Reading", hi: "पठन" },
  goals: { en: "Goals", hi: "लक्ष्य" },
  quicktimer: { en: "Quick Timer", hi: "त्वरित टाइमर" },
  activity: { en: "Recent Activity", hi: "हाल की गतिविधि" },
  calendar: { en: "Calendar", hi: "कैलेंडर" },
};
const DEFAULT_WIDGETS = ["progress", "japa", "reading", "goals", "quicktimer"];
const DEFAULT_TEMPLATE = {
  id: "std",
  name: "Standard",
  text: "Hare Krishna Prabhu 🙏\nDandwat Pranam\n\nSadhna Report — {date}\n\nRounds: {rounds}\nReading: {reading} min\nHearing: {hearing} min\nMorning program: {mangala}\n\nAll glories to Srila Prabhupada 🙏",
};
const RUN_KEY = "sadhna_runs_v1";

/* ──────────────────────────────────────────────
   Main App
─────────────────────────────────────────────── */
export default function App() {
  const [splash, setSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [lang, setLang] = useState("en");
  const [dark, setDark] = useState(true);
  const [screen, setScreen] = useState("home");
  const [drawer, setDrawer] = useState(false);
  const [editingHome, setEditingHome] = useState(false);
  const [data, setData] = useState(EMPTY);
  const [now, setNow] = useState(Date.now());

  // running timer state (persisted to localStorage so it survives reload/close)
  const [runs, setRuns] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RUN_KEY) || "{}"); } catch { return {}; }
  });
  const notifiedRef = useRef({});

  const today = dateKey();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(mapUser(session?.user));
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  // live sync of user row
  useEffect(() => {
    if (!user) return;
    let channel;
    (async () => {
      const { data: row } = await supabase.from("user_data").select("*").eq("id", user.id).maybeSingle();
      if (row) setData({ ...EMPTY, ...row });
      channel = supabase
        .channel(`user_data_${user.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "user_data", filter: `id=eq.${user.id}` },
          (payload) => { if (payload.new) setData({ ...EMPTY, ...payload.new }); })
        .subscribe();
    })();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [user]);

  // load persisted theme/lang once data arrives
  useEffect(() => {
    if (data.settings?.dark !== undefined) setDark(!!data.settings.dark);
    if (data.settings?.lang) setLang(data.settings.lang);
  }, [data.settings?.dark, data.settings?.lang]);

  // global 1s tick — drives all timestamp-based timers
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // persist running timer state
  useEffect(() => {
    try { localStorage.setItem(RUN_KEY, JSON.stringify(runs)); } catch { /* ignore */ }
  }, [runs]);

  // countdown completion detection
  useEffect(() => {
    (data.timers?.length ? data.timers : DEFAULT_TIMERS).forEach((t) => {
      if (t.mode !== "countdown") return;
      const r = runs[t.id];
      if (!r) return;
      const elapsed = (r.accumulated || 0) + (r.running && r.startedAt ? (now - r.startedAt) / 1000 : 0);
      if (elapsed >= t.duration && !notifiedRef.current[t.id]) {
        notifiedRef.current[t.id] = true;
        notify(`${t.name} complete`, "Hare Krishna 🙏 Your timer finished.");
        setRuns((s) => ({ ...s, [t.id]: { accumulated: t.duration, running: false, startedAt: null } }));
      }
    });
  }, [now, runs, data.timers]);

  // goal reminders (best-effort while app open)
  useEffect(() => {
    if (!user || !data.settings?.notificationsEnabled) return;
    const check = () => {
      const d = new Date();
      const cur = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      (data.goals || []).forEach((g) => {
        if (!g.reminder || cur < g.reminder) return;
        const val = dayMetric(data, g.metric, today);
        const flag = `goalnotif_${g.id}_${today}`;
        if (val < (g.daily || 0) && localStorage.getItem(flag) !== "1") {
          localStorage.setItem(flag, "1");
          notify("Your Sadhana is not done 🙏", `${g.label}: ${val}/${g.daily}`);
        }
      });
    };
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, [user, data.goals, data.settings?.notificationsEnabled, data, today]);

  // scheduled WhatsApp report prompt (kept from before)
  useEffect(() => {
    if (!user || !data.settings?.autoSendEnabled) return;
    const nowD = new Date();
    const cur = `${String(nowD.getHours()).padStart(2, "0")}:${String(nowD.getMinutes()).padStart(2, "0")}`;
    const scheduled = data.settings.autoSendTime || "20:00";
    if (cur >= scheduled && localStorage.getItem("lastReportSent") !== today) {
      const msg = buildReport(activeTemplateText());
      const ok = window.confirm(lang === "hi" ? "समय हो गया है! WhatsApp रिपोर्ट भेजें?" : "It's time! Send your Sadhna report on WhatsApp?");
      if (ok) { localStorage.setItem("lastReportSent", today); window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank"); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, data.settings?.autoSendEnabled]);

  const save = async (patch) => {
    if (!user) return;
    const next = { ...data, ...patch };
    setData(next);
    await supabase.from("user_data").upsert({
      id: user.id,
      name: user.displayName || "",
      photo: user.photoURL || "",
      log: next.log, custom: next.custom, notes: next.notes, settings: next.settings,
      timers: next.timers, goals: next.goals, widgets: next.widgets, templates: next.templates,
      updated_at: new Date().toISOString(),
    });
  };
  const saveSetting = (patch) => save({ settings: { ...data.settings, ...patch } });

  const dayLog = data.log?.[today] || {};
  const setField = (id, val) => save({ log: { ...data.log, [today]: { ...dayLog, [id]: val } } });
  const customToday = data.custom?.[today] || [];
  const setCustom = (arr) => save({ custom: { ...data.custom, [today]: arr } });

  const doneCount = BOOL_IDS.filter((id) => dayLog[id]).length + customToday.filter((c) => c.done).length;
  const totalCount = BOOL_IDS.length + customToday.length;
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const timers = data.timers?.length ? data.timers : DEFAULT_TIMERS;
  const widgets = data.widgets?.length ? data.widgets : DEFAULT_WIDGETS;
  const templates = data.templates?.length ? data.templates : [DEFAULT_TEMPLATE];

  function elapsedOf(id) {
    const r = runs[id];
    if (!r) return 0;
    return Math.floor((r.accumulated || 0) + (r.running && r.startedAt ? (now - r.startedAt) / 1000 : 0));
  }
  function toggleRun(id) {
    setRuns((s) => {
      const r = s[id] || { accumulated: 0, running: false, startedAt: null };
      if (r.running) {
        const acc = (r.accumulated || 0) + (r.startedAt ? (Date.now() - r.startedAt) / 1000 : 0);
        return { ...s, [id]: { accumulated: acc, running: false, startedAt: null } };
      }
      notifiedRef.current[id] = false;
      return { ...s, [id]: { accumulated: r.accumulated || 0, running: true, startedAt: Date.now() } };
    });
  }
  function resetRun(id) {
    notifiedRef.current[id] = false;
    setRuns((s) => ({ ...s, [id]: { accumulated: 0, running: false, startedAt: null } }));
  }

  function activeTemplateText() {
    const id = data.settings?.activeTemplate;
    const t = templates.find((x) => x.id === id) || templates[0] || DEFAULT_TEMPLATE;
    return t.text;
  }
  function buildReport(tmplText) {
    const map = {
      date: prettyDate(today),
      name: user?.displayName || "",
      rounds: dayLog.chanting16 ? "16" : "0",
      reading: String(Number(dayLog.reading) || 0),
      hearing: String(Number(dayLog.hearingExtraDuration) || 0),
      mangala: dayLog.mangalAarti ? "✅ " + dayLog.mangalAarti : "❌",
    };
    let out = (tmplText || DEFAULT_TEMPLATE.text).replace(/\{(\w+)\}/g, (m, k) => (k in map ? map[k] : m));
    const done = customToday.filter((c) => c.done);
    if (done.length) out += "\n\n" + done.map((c) => `✅ ${c.label}`).join("\n");
    return out;
  }

  /* theme tokens */
  const C = dark
    ? { bg: "#0f0a05", card: "#1c140b", text: "#f3ede2", sub: "#9b8f7d", line: "#2e2316", elev: "#241a10" }
    : { bg: "#fdf8f0", card: "#ffffff", text: "#2a2118", sub: "#7a6f5e", line: "#ece2d0", elev: "#fbf3e6" };
  const accent = "#ff9933";
  const green = "#5cb85c";

  const S = {
    page: { background: C.bg, minHeight: "100dvh", color: C.text, fontFamily: "system-ui, -apple-system, sans-serif", paddingBottom: 92, touchAction: "pan-x pan-y" },
    head: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: `1px solid ${C.line}`, position: "sticky", top: 0, background: C.bg, zIndex: 20 },
    card: { background: C.card, borderRadius: 16, padding: 16, margin: "12px 14px", border: `1px solid ${C.line}` },
    row: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${C.line}` },
    btn: { background: accent, color: "#1a0e05", border: "none", padding: "14px 20px", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 48 },
    btnGhost: { background: C.elev, color: C.text, border: `1px solid ${C.line}`, padding: "13px 18px", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer", minHeight: 44 },
    chk: (on) => ({ width: 30, height: 30, borderRadius: 8, border: `2px solid ${on ? accent : C.sub}`, background: on ? accent : "transparent", color: "#1a0e05", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 800, fontSize: 18, flexShrink: 0 }),
    input: { background: C.bg, color: C.text, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 12px", fontSize: 15, width: "100%", minHeight: 44, boxSizing: "border-box" },
    tabs: { position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", background: C.card, borderTop: `1px solid ${C.line}`, paddingTop: 8, paddingBottom: "calc(8px + env(safe-area-inset-bottom))", zIndex: 20 },
    tab: (a) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 4px", fontSize: 11, fontWeight: a ? 700 : 500, color: a ? accent : C.sub, cursor: "pointer" }),
    sectionTitle: { fontWeight: 700, fontSize: 16, marginBottom: 12 },
    iconBtn: { background: C.elev, border: `1px solid ${C.line}`, color: C.text, borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 },
    chip: (a) => ({ padding: "9px 14px", borderRadius: 999, border: `1px solid ${a ? accent : C.line}`, background: a ? accent : "transparent", color: a ? "#1a0e05" : C.text, fontWeight: 600, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }),
  };

  if (splash) return <SplashScreen onDone={() => setSplash(false)} />;
  if (!authReady) return <div style={{ background: C.bg, minHeight: "100dvh" }} />;
  if (!user) return <Login />;

  const toggleDark = () => { const v = !dark; setDark(v); saveSetting({ dark: v }); };
  const toggleLang = () => { const v = lang === "hi" ? "en" : "hi"; setLang(v); saveSetting({ lang: v }); };

  const Header = ({ title }) => (
    <div style={S.head}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button aria-label="Menu" onClick={() => setDrawer(true)} style={S.iconBtn}><Icon name="menu" /></button>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{title || `${lang === "hi" ? "हरे कृष्ण" : "Hare Krishna"}, ${user.displayName?.split(" ")[0] || ""}`}</div>
          <div style={{ fontSize: 11, color: accent }}>All Glories to Srila Prabhupada</div>
        </div>
      </div>
      <button aria-label="Theme" onClick={toggleDark} style={S.iconBtn}><Icon name={dark ? "sun" : "moon"} /></button>
    </div>
  );

  /* ───────── Sidebar drawer ───────── */
  const Drawer = () => {
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
      <div onClick={() => setDrawer(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 60, display: "flex" }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: 288, maxWidth: "84%", background: C.card, height: "100%", padding: 18, display: "flex", flexDirection: "column", borderRight: `1px solid ${C.line}`, animation: "slideIn .25s ease" }}>
          <style>{`@keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 16, borderBottom: `1px solid ${C.line}` }}>
            {user.photoURL && <img src={user.photoURL} alt="" style={{ width: 44, height: 44, borderRadius: "50%" }} />}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.displayName}</div>
              <div style={{ fontSize: 12, color: accent }}>Sadhna OS</div>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", paddingTop: 8 }}>
            {items.map((it) => (
              <button key={it.s} onClick={() => go(it.s)} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", background: "none", border: "none", color: C.text, padding: "14px 8px", fontSize: 15, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                <Icon name={it.icon} color={accent} /> {it.label}
              </button>
            ))}
            <div style={{ borderTop: `1px solid ${C.line}`, margin: "8px 0", paddingTop: 12 }}>
              <div style={{ fontSize: 12, color: C.sub, padding: "0 8px 8px" }}>{lang === "hi" ? "थीम" : "Theme"}</div>
              <div style={{ display: "flex", gap: 8, padding: "0 8px" }}>
                <button onClick={toggleDark} style={{ ...S.chip(false), flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Icon name={dark ? "sun" : "moon"} size={16} /> {dark ? "Light" : "Dark"}
                </button>
                <button onClick={toggleLang} style={{ ...S.chip(false), flex: 1 }}>{lang === "hi" ? "English" : "हिंदी"}</button>
              </div>
            </div>
            <button onClick={() => { navigator.share ? navigator.share({ title: "Sadhna OS", text: "Track your daily sadhna 🙏", url: window.location.origin }).catch(() => {}) : window.open("https://wa.me/?text=" + encodeURIComponent("Track your daily sadhna with Sadhna OS 🙏 " + window.location.origin), "_blank"); setDrawer(false); }} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", background: "none", border: "none", color: C.text, padding: "14px 8px", fontSize: 15, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
              <Icon name="share" color={accent} /> {lang === "hi" ? "ऐप शेयर करें" : "Share App"}
            </button>
          </div>
          <button onClick={() => supabase.auth.signOut()} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", background: "none", border: "none", color: "#d9534f", padding: "14px 8px", fontSize: 15, fontWeight: 700, cursor: "pointer", textAlign: "left", borderTop: `1px solid ${C.line}` }}>
            <Icon name="logout" /> {tr("logout", lang)}
          </button>
        </div>
      </div>
    );
  };

  /* ───────── Widgets ───────── */
  function renderWidget(id) {
    switch (id) {
      case "progress":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Ring pct={pct} size={84} stroke={9} color={accent} track={C.line}>
              <span style={{ fontSize: 22, color: accent }}>{pct}%</span>
            </Ring>
            <div>
              <div style={{ color: C.sub, fontSize: 13 }}>{tr("progress", lang)}</div>
              <div style={{ fontSize: 15, color: green, fontWeight: 700, marginTop: 6 }}>{tr("done", lang)}: {doneCount}</div>
              <div style={{ fontSize: 15, color: C.sub, fontWeight: 700 }}>{tr("pending", lang)}: {totalCount - doneCount}</div>
            </div>
          </div>
        );
      case "japa": {
        const on = !!dayLog.chanting16;
        return (
          <div>
            <div style={S.sectionTitle}>{WIDGET_META.japa[lang]}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: accent, fontVariantNumeric: "tabular-nums" }}>{on ? 16 : 0}<span style={{ fontSize: 15, color: C.sub, fontWeight: 600 }}> / 16 {lang === "hi" ? "माला" : "rounds"}</span></div>
              <div style={S.chk(on)} onClick={() => setField("chanting16", !on)}>{on ? "✓" : ""}</div>
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
              <button onClick={() => setScreen("timers")} style={{ ...S.btnGhost, marginLeft: "auto" }}>{lang === "hi" ? "टाइमर" : "Timer"}</button>
            </div>
          </div>
        );
      case "goals": {
        const gs = data.goals || [];
        return (
          <div>
            <div style={{ ...S.sectionTitle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{WIDGET_META.goals[lang]}</span>
              <button onClick={() => setScreen("goals")} style={{ background: "none", border: "none", color: accent, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{lang === "hi" ? "सभी" : "All ›"}</button>
            </div>
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
                  <div style={{ height: 8, background: C.bg, borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ width: p + "%", height: "100%", background: p >= 100 ? green : accent, transition: "width .4s" }} />
                  </div>
                </div>
              );
            })}
          </div>
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
                  <button key={t.id} onClick={() => { toggleRun(t.id); setScreen("timers"); }} style={{ ...S.chip(running), display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name={running ? "pause" : "play"} size={15} /> {t.name}
                  </button>
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
                <div key={x.k} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ height: Math.max(4, x.pct) + "%", background: accent, borderRadius: 5, transition: "height .3s" }} />
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
                  <div key={i} style={{ textAlign: "center", fontSize: 12, padding: "6px 0", borderRadius: 8, background: isToday ? accent : has ? C.elev : "transparent", color: isToday ? "#1a0e05" : C.text, fontWeight: isToday ? 800 : 500, border: has && !isToday ? `1px solid ${accent}` : "1px solid transparent" }}>{n}</div>
                );
              })}
            </div>
          </div>
        );
      }
      default: return null;
    }
  }

  const Home = () => {
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
          <div style={{ fontSize: 20, fontWeight: 800 }}>{lang === "hi" ? "डैशबोर्ड" : "Dashboard"}</div>
          <button onClick={() => setEditingHome(!editingHome)} style={{ ...S.btnGhost, minHeight: 40, padding: "9px 14px", color: editingHome ? accent : C.text }}>
            {editingHome ? tr("doneEditing", lang) : tr("customize", lang)}
          </button>
        </div>
        {widgets.map((id, i) => (
          <div key={id} style={{ ...S.card, position: "relative", ...(editingHome ? { borderColor: accent, borderStyle: "dashed" } : {}) }}>
            {editingHome && (
              <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6, zIndex: 2 }}>
                <button aria-label="up" onClick={() => move(i, -1)} style={{ ...S.iconBtn, width: 32, height: 32 }}><Icon name="up" size={16} /></button>
                <button aria-label="down" onClick={() => move(i, 1)} style={{ ...S.iconBtn, width: 32, height: 32 }}><Icon name="down" size={16} /></button>
                <button aria-label="remove" onClick={() => save({ widgets: widgets.filter((w) => w !== id) })} style={{ ...S.iconBtn, width: 32, height: 32, color: "#d9534f" }}><Icon name="x" size={16} /></button>
              </div>
            )}
            {renderWidget(id)}
          </div>
        ))}
        {editingHome && missing.length > 0 && (
          <div style={S.card}>
            <div style={{ ...S.sectionTitle }}>{tr("addWidget", lang)}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {missing.map((k) => (
                <button key={k} onClick={() => save({ widgets: [...widgets, k] })} style={{ ...S.chip(false), display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="plus" size={15} /> {WIDGET_META[k][lang]}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* the full daily checklist still lives here, below the widgets */}
        <div style={S.card}>
          <div style={S.sectionTitle}>{tr("todaySadhna", lang)}</div>
          {FIXED.filter((f) => !f.show || f.show(dayLog)).map((f) => (
            <div key={f.id} style={S.row}>
              <span style={{ fontSize: 15 }}>{lang === "hi" ? f.hi : f.en}</span>
              {f.type === "bool" ? (
                <div style={S.chk(!!dayLog[f.id])} onClick={() => setField(f.id, !dayLog[f.id])}>{dayLog[f.id] ? "✓" : ""}</div>
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
              <div style={S.chk(c.done)} onClick={() => { const a = [...customToday]; a[idx] = { ...c, done: !c.done }; setCustom(a); }}>{c.done ? "✓" : ""}</div>
            </div>
          ))}
          <AddCustom />
        </div>
      </>
    );
  };

  function AddCustom() {
    const [val, setVal] = useState("");
    return (
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input value={val} onChange={(e) => setVal(e.target.value)} placeholder={lang === "hi" ? "अपना कार्य जोड़ें" : "Add a custom task"} style={{ ...S.input, flex: 1 }} />
        <button onClick={() => { if (!val.trim()) return; setCustom([...customToday, { label: val.trim(), done: false }]); setVal(""); }} style={{ ...S.btn, width: "auto", padding: "0 18px" }}><Icon name="plus" /></button>
      </div>
    );
  }

  /* ───────── Timers (multiple, background, one page) ───────── */
  function TimersScreen() {
    const [show, setShow] = useState(false);
    const [name, setName] = useState("");
    const [mode, setMode] = useState("stopwatch");
    const [mins, setMins] = useState(15);

    const addTimer = () => {
      if (!name.trim()) return;
      const id = name.trim().toLowerCase().replace(/\s+/g, "-") + "-" + Date.now().toString(36).slice(-4);
      save({ timers: [...timers, { id, name: name.trim(), mode, duration: mode === "countdown" ? mins * 60 : 0 }] });
      setName(""); setMode("stopwatch"); setMins(15); setShow(false);
    };
    const removeTimer = (id) => { resetRun(id); save({ timers: timers.filter((t) => t.id !== id) }); };
    const logToReading = (id, sec) => setField("reading", (Number(dayLog.reading) || 0) + Math.round(sec / 60));

    return (
      <div style={{ padding: "6px 0 8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px" }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{tr("timers", lang)}</div>
          <button onClick={() => setShow(!show)} style={{ ...S.btn, width: "auto", padding: "0 16px", minHeight: 42 }}><Icon name="plus" size={18} /> {lang === "hi" ? "नया" : "Add"}</button>
        </div>

        {show && (
          <div style={S.card}>
            <div style={S.sectionTitle}>{lang === "hi" ? "नया टाइमर" : "New timer"}</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={lang === "hi" ? "नाम (जैसे जप)" : "Name (e.g. Japa)"} style={{ ...S.input, marginBottom: 10 }} />
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button onClick={() => setMode("stopwatch")} style={{ ...S.chip(mode === "stopwatch"), flex: 1 }}>{lang === "hi" ? "स्टॉपवॉच" : "Stopwatch"}</button>
              <button onClick={() => setMode("countdown")} style={{ ...S.chip(mode === "countdown"), flex: 1 }}>{lang === "hi" ? "काउंटडाउन" : "Countdown"}</button>
            </div>
            {mode === "countdown" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <input type="number" inputMode="numeric" value={mins} onChange={(e) => setMins(Math.max(1, parseInt(e.target.value) || 1))} style={{ ...S.input, width: 90, textAlign: "center" }} />
                <span style={{ color: C.sub }}>{lang === "hi" ? "मिनट" : "minutes"}</span>
              </div>
            )}
            <button onClick={addTimer} style={S.btn}>{lang === "hi" ? "जोड़ें" : "Add timer"}</button>
          </div>
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
            <div key={t.id} style={S.card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{t.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: .5 }}>{isCd ? (lang === "hi" ? "काउंटडाउन" : "countdown") : (lang === "hi" ? "स्टॉपवॉच" : "stopwatch")}</span>
                  {!isDefault && <button aria-label="delete" onClick={() => removeTimer(t.id)} style={{ ...S.iconBtn, width: 34, height: 34, color: "#d9534f" }}><Icon name="trash" size={16} /></button>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                {isCd ? (
                  <Ring pct={p} size={150} stroke={11} color={done ? green : accent} track={C.line}>
                    <span style={{ fontSize: 34, color: done ? green : accent }}>{fmtHMS(remaining)}</span>
                  </Ring>
                ) : (
                  <div style={{ fontSize: 52, fontWeight: 800, color: accent, fontVariantNumeric: "tabular-nums" }}>{fmtHMS(el)}</div>
                )}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => toggleRun(t.id)} style={{ ...S.btn, background: running ? "#d9534f" : accent }}>
                  <Icon name={running ? "pause" : "play"} size={18} /> {running ? (lang === "hi" ? "रोकें" : "Pause") : (lang === "hi" ? "शुरू" : "Start")}
                </button>
                <button onClick={() => resetRun(t.id)} style={{ ...S.btnGhost, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Icon name="reset" size={18} /> {lang === "hi" ? "रीसेट" : "Reset"}</button>
              </div>
              {t.id === "reading" && el > 30 && (
                <button onClick={() => { logToReading(t.id, el); resetRun(t.id); }} style={{ ...S.btnGhost, width: "100%", marginTop: 10, color: green }}>
                  {lang === "hi" ? "पठन में जोड़ें" : `Log ${Math.round(el / 60)} min to Reading`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  /* ───────── Goals ───────── */
  function GoalsScreen() {
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
    };
    const remove = (id) => confirm(lang === "hi" ? "लक्ष्य हटाएं?" : "Delete goal?") && save({ goals: goals.filter((g) => g.id !== id) });

    return (
      <div style={{ padding: "6px 0 8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px" }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{tr("goals", lang)}</div>
          <button onClick={() => setShow(!show)} style={{ ...S.btn, width: "auto", padding: "0 16px", minHeight: 42 }}><Icon name="plus" size={18} /> {lang === "hi" ? "नया" : "Add"}</button>
        </div>

        {show && (
          <div style={S.card}>
            <div style={S.sectionTitle}>{lang === "hi" ? "नया लक्ष्य" : "New goal"}</div>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={lang === "hi" ? "लक्ष्य का नाम" : "Goal name"} style={{ ...S.input, marginBottom: 10 }} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {Object.keys(METRICS).map((k) => (
                <button key={k} onClick={() => { setMetric(k); setDailyT(METRICS[k].target); }} style={S.chip(metric === k)}>{METRICS[k][lang]}</button>
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
            <button onClick={addGoal} style={S.btn}>{lang === "hi" ? "लक्ष्य जोड़ें" : "Add goal"}</button>
          </div>
        )}

        {goals.length === 0 && !show && (
          <div style={{ ...S.card, textAlign: "center", color: C.sub, padding: "40px 20px" }}>
            {lang === "hi" ? "अभी कोई लक्ष्य नहीं। ऊपर 'जोड़ें' दबाएं।" : "No goals yet. Tap Add to create one."}
          </div>
        )}

        {goals.map((g) => {
          const today_v = dayMetric(data, g.metric, today);
          const p = g.daily ? Math.min(100, Math.round((today_v / g.daily) * 100)) : 0;
          const week = rangeMetric(data, g.metric, 7);
          const month = rangeMetric(data, g.metric, 30);
          const streak = streakMetric(data, g.metric, g.daily);
          const unit = METRICS[g.metric]?.unit || "";
          return (
            <div key={g.id} style={S.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Ring pct={p} size={78} stroke={9} color={p >= 100 ? green : accent} track={C.line}>
                  <span style={{ fontSize: 18, color: p >= 100 ? green : accent }}>{p}%</span>
                </Ring>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{g.label}</div>
                    <button aria-label="delete" onClick={() => remove(g.id)} style={{ ...S.iconBtn, width: 32, height: 32, color: "#d9534f" }}><Icon name="trash" size={15} /></button>
                  </div>
                  <div style={{ fontSize: 14, color: C.sub, marginTop: 4 }}>{lang === "hi" ? "आज" : "Today"}: <b style={{ color: C.text }}>{today_v}/{g.daily} {unit}</b></div>
                  <div style={{ fontSize: 13, color: accent, marginTop: 4, fontWeight: 700 }}>🔥 {streak} {lang === "hi" ? "दिन की श्रृंखला" : "day streak"}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <div style={{ flex: 1, background: C.bg, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, color: C.sub }}>{lang === "hi" ? "साप्ताहिक" : "Weekly"}</div>
                  <div style={{ fontWeight: 800, fontSize: 17, fontVariantNumeric: "tabular-nums" }}>{week}<span style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}> / {g.daily * 7}</span></div>
                </div>
                <div style={{ flex: 1, background: C.bg, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, color: C.sub }}>{lang === "hi" ? "मासिक" : "Monthly"}</div>
                  <div style={{ fontWeight: 800, fontSize: 17, fontVariantNumeric: "tabular-nums" }}>{month}<span style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}> / {g.daily * 30}</span></div>
                </div>
              </div>
              {g.reminder && <div style={{ fontSize: 12, color: C.sub, marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}><Icon name="bell" size={14} color={C.sub} /> {lang === "hi" ? "रिमाइंडर" : "Reminder"} {g.reminder}</div>}
            </div>
          );
        })}
      </div>
    );
  }

  /* ───────── Reports (templates + share) ───────── */
  function ReportsScreen() {
    const [tab, setTab] = useState("share");
    const [editing, setEditing] = useState(null); // template being edited
    const [name, setName] = useState("");
    const [text, setText] = useState("");
    const [numbersStr, setNumbersStr] = useState((data.settings?.waNumbers || []).join(", "));

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
    };
    const delTmpl = (id) => save({ templates: templates.filter((t) => t.id !== id) });

    return (
      <div style={{ padding: "6px 0 8px" }}>
        <div style={{ fontSize: 20, fontWeight: 800, padding: "8px 14px" }}>{tr("reports", lang)}</div>
        <div style={{ display: "flex", gap: 8, padding: "0 14px 4px" }}>
          <button onClick={() => setTab("share")} style={{ ...S.chip(tab === "share"), flex: 1 }}>{lang === "hi" ? "शेयर करें" : "Share"}</button>
          <button onClick={() => setTab("templates")} style={{ ...S.chip(tab === "templates"), flex: 1 }}>{lang === "hi" ? "टेम्पलेट" : "Templates"}</button>
        </div>

        {tab === "share" && (
          <>
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={S.sectionTitle}>{lang === "hi" ? "पूर्वावलोकन" : "Preview"}</div>
                <select value={activeId} onChange={(e) => saveSetting({ activeTemplate: e.target.value })} style={{ ...S.input, width: "auto", padding: "8px 10px" }}>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ background: C.bg, borderRadius: 12, padding: 14, whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.5, border: `1px solid ${C.line}` }}>{preview}</div>
              <button onClick={() => share()} style={{ ...S.btn, marginTop: 14, background: "#25D366", color: "#fff" }}><Icon name="share" size={18} /> {lang === "hi" ? "WhatsApp पर भेजें" : "Share on WhatsApp"}</button>
            </div>
            <div style={S.card}>
              <div style={S.sectionTitle}>{lang === "hi" ? "पूर्वनिर्धारित नंबर" : "Predefined numbers"}</div>
              {numbers.length > 0 ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  {numbers.map((n) => <button key={n} onClick={() => share(n)} style={{ ...S.chip(false), display: "flex", alignItems: "center", gap: 6 }}><Icon name="share" size={14} /> {n}</button>)}
                </div>
              ) : <div style={{ color: C.sub, fontSize: 14, marginBottom: 12 }}>{lang === "hi" ? "नीचे नंबर जोड़ें (कॉमा से अलग)" : "Add numbers below (comma-separated, with country code)"}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <input value={numbersStr} onChange={(e) => setNumbersStr(e.target.value)} placeholder="91XXXXXXXXXX, 91YYYYYYYYYY" style={{ ...S.input, flex: 1 }} />
                <button onClick={() => saveSetting({ waNumbers: numbersStr.split(",").map((x) => x.trim()).filter(Boolean) })} style={{ ...S.btn, width: "auto", padding: "0 16px" }}>{lang === "hi" ? "सहेजें" : "Save"}</button>
              </div>
            </div>
          </>
        )}

        {tab === "templates" && (
          <>
            {editing ? (
              <div style={S.card}>
                <div style={S.sectionTitle}>{editing === "new" ? (lang === "hi" ? "नया टेम्पलेट" : "New template") : (lang === "hi" ? "संपादित करें" : "Edit template")}</div>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder={lang === "hi" ? "टेम्पलेट नाम" : "Template name"} style={{ ...S.input, marginBottom: 10 }} />
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} style={{ ...S.input, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />
                <div style={{ fontSize: 12, color: C.sub, marginTop: 8 }}>{lang === "hi" ? "प्लेसहोल्डर" : "Placeholders"}: {"{date} {name} {rounds} {reading} {hearing} {mangala}"}</div>
                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  <button onClick={saveTmpl} style={S.btn}>{lang === "hi" ? "सहेजें" : "Save"}</button>
                  <button onClick={() => setEditing(null)} style={{ ...S.btnGhost, flex: 1 }}>{lang === "hi" ? "रद्द करें" : "Cancel"}</button>
                </div>
              </div>
            ) : (
              <div style={{ padding: "0 14px" }}>
                <button onClick={startNew} style={{ ...S.btn, marginBottom: 12 }}><Icon name="plus" size={18} /> {lang === "hi" ? "नया टेम्पलेट" : "New template"}</button>
                {templates.map((t) => (
                  <div key={t.id} style={{ ...S.card, margin: "0 0 12px" }}>
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
                      {templates.length > 1 && <button onClick={() => delTmpl(t.id)} style={{ background: "none", border: "none", color: "#d9534f", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{lang === "hi" ? "हटाएं" : "Delete"}</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  /* ───────── Notifications settings ───────── */
  function NotificationsScreen() {
    const [perm, setPerm] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
    const req = async () => {
      if (typeof Notification === "undefined") return;
      const p = await Notification.requestPermission();
      setPerm(p);
      if (p === "granted") { saveSetting({ notificationsEnabled: true }); notify("Notifications on 🙏", "You'll get sadhana & timer reminders."); }
    };
    const s = data.settings || {};
    return (
      <div style={{ padding: "6px 0 8px" }}>
        <div style={{ fontSize: 20, fontWeight: 800, padding: "8px 14px" }}>{tr("notifications", lang)}</div>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700 }}>{lang === "hi" ? "ब्राउज़र सूचनाएं" : "Browser notifications"}</div>
              <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>{perm === "granted" ? (lang === "hi" ? "सक्षम" : "Enabled") : perm === "denied" ? (lang === "hi" ? "ब्राउज़र में अवरुद्ध" : "Blocked in browser") : (lang === "hi" ? "अनुमति चाहिए" : "Permission needed")}</div>
            </div>
            {perm !== "granted" && <button onClick={req} style={{ ...S.btn, width: "auto", padding: "0 18px" }}>{lang === "hi" ? "चालू करें" : "Enable"}</button>}
          </div>
          <div style={{ ...S.row, marginTop: 8 }}>
            <span>{lang === "hi" ? "लक्ष्य रिमाइंडर" : "Goal reminders"}</span>
            <div style={S.chk(!!s.notificationsEnabled)} onClick={() => saveSetting({ notificationsEnabled: !s.notificationsEnabled })}>{s.notificationsEnabled ? "✓" : ""}</div>
          </div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 8 }}>{lang === "hi" ? "टाइमर पूरा होने और लक्ष्य छूटने पर सूचना (ऐप खुला रहने पर सर्वोत्तम)।" : "Fires on timer completion and missed goals. Works best while the app is open — true background push needs a server."}</div>
        </div>

        <div style={S.card}>
          <div style={S.sectionTitle}>{lang === "hi" ? "स्वचालित WhatsApp रिपोर्ट" : "Auto WhatsApp report"}</div>
          <div style={S.row}>
            <span>{lang === "hi" ? "सक्षम करें" : "Enable"}</span>
            <div style={S.chk(!!s.autoSendEnabled)} onClick={() => saveSetting({ autoSendEnabled: !s.autoSendEnabled })}>{s.autoSendEnabled ? "✓" : ""}</div>
          </div>
          {s.autoSendEnabled && (
            <div style={{ ...S.row, borderBottom: "none" }}>
              <span>{lang === "hi" ? "समय" : "Time"}</span>
              <input type="time" value={s.autoSendTime || "20:00"} onChange={(e) => saveSetting({ autoSendTime: e.target.value })} onClick={(e) => e.target.showPicker?.()} style={{ ...S.input, width: "auto" }} />
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ───────── Insights ───────── */
  function InsightsScreen() {
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
        <div style={{ fontSize: 20, fontWeight: 800, padding: "8px 14px" }}>{tr("insights", lang)}</div>
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <Ring pct={avg} size={72} stroke={8} color={accent} track={C.line}><span style={{ fontSize: 18, color: accent }}>{avg}%</span></Ring>
            <div><div style={{ color: C.sub, fontSize: 13 }}>{lang === "hi" ? "7-दिन औसत" : "7-day average"}</div><div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{lang === "hi" ? "साधना पूर्णता" : "Sadhna completion"}</div></div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 140 }}>
            {last7.map((x) => (
              <div key={x.k} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.sub, marginBottom: 4 }}>{x.pct}%</div>
                <div style={{ height: Math.max(4, x.pct) + "%", background: accent, borderRadius: 6, transition: "height .3s" }} />
                <div style={{ fontSize: 10, color: C.sub, marginTop: 8 }}>{x.k.slice(8)}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>{lang === "hi" ? "मेट्रिक्स (आज)" : "Metrics (today)"}</div>
          {Object.keys(METRICS).map((k) => (
            <div key={k} style={S.row}>
              <span>{METRICS[k][lang]}</span>
              <b style={{ color: accent, fontVariantNumeric: "tabular-nums" }}>{dayMetric(data, k, today)} {METRICS[k].unit}</b>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ───────── AI ───────── */
  function AIScreen() {
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
      <div style={S.card}>
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
          <button onClick={ask} style={{ ...S.btn, width: "auto", padding: "0 20px" }}>{lang === "hi" ? "पूछें" : "Ask"}</button>
        </div>
      </div>
    );
  }

  /* ───────── Notes ───────── */
  function NotesScreen() {
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
    };
    const deleteNote = (id) => confirm(lang === "hi" ? "नोट हटाएं?" : "Delete note?") && save({ notes: notes.filter((n) => n.id !== id) });
    const shareNote = (note) => window.open("https://wa.me/?text=" + encodeURIComponent(`${note.title ? note.title + "\n\n" : ""}${note.body}`), "_blank");

    return (
      <>
        {showEditor && (
          <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 100, display: "flex", flexDirection: "column" }}>
            <div style={{ ...S.head }}>
              <button onClick={() => { setShowEditor(false); setEditing(null); setTitle(""); setBody(""); }} style={{ ...S.iconBtn }}><Icon name="x" /></button>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{editing ? (lang === "hi" ? "संपादित करें" : "Edit") : (lang === "hi" ? "नया नोट" : "New Note")}</div>
              <button onClick={saveNote} style={{ ...S.btn, width: "auto", padding: "0 16px", minHeight: 40 }}>{lang === "hi" ? "सहेजें" : "Save"}</button>
            </div>
            <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={lang === "hi" ? "शीर्षक" : "Title"} style={{ ...S.input, marginBottom: 16, fontWeight: 700, fontSize: 20, border: "none", borderBottom: `1px solid ${C.line}`, borderRadius: 0, padding: "12px 0" }} />
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={lang === "hi" ? "अपने विचार लिखें…" : "Write your thoughts..."} style={{ ...S.input, minHeight: "calc(100dvh - 260px)", resize: "none", fontFamily: "inherit", border: "none", fontSize: 16 }} />
            </div>
          </div>
        )}
        <div style={{ padding: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>{tr("notes", lang)}</div>
          <button onClick={() => setShowEditor(true)} style={{ ...S.btn, marginBottom: 16 }}><Icon name="plus" size={18} /> {lang === "hi" ? "नया नोट" : "New Note"}</button>
          {notes.length === 0 ? (
            <div style={{ textAlign: "center", color: C.sub, padding: "40px 20px", fontSize: 15 }}>{lang === "hi" ? "कोई नोट्स नहीं हैं" : "No notes yet"}</div>
          ) : notes.map((note) => (
            <div key={note.id} style={{ background: C.card, borderRadius: 14, padding: 16, marginBottom: 12, border: `1px solid ${C.line}` }}>
              {note.title && <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{note.title}</div>}
              <div style={{ color: C.sub, fontSize: 14, marginBottom: 12, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{note.body.length > 150 ? note.body.slice(0, 150) + "..." : note.body}</div>
              <div style={{ fontSize: 11, color: C.sub, marginBottom: 12 }}>{new Date(note.date).toLocaleString("en-IN")}</div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <button onClick={() => { setEditing(note); setTitle(note.title); setBody(note.body); setShowEditor(true); }} style={{ background: "none", border: "none", color: accent, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>{lang === "hi" ? "संपादित" : "Edit"}</button>
                <button onClick={() => shareNote(note)} style={{ background: "none", border: "none", color: "#25D366", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>{lang === "hi" ? "शेयर" : "Share"}</button>
                <button onClick={() => deleteNote(note.id)} style={{ background: "none", border: "none", color: "#d9534f", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>{lang === "hi" ? "हटाएं" : "Delete"}</button>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  const screens = {
    home: <Home />,
    timers: <TimersScreen />,
    goals: <GoalsScreen />,
    reports: <ReportsScreen />,
    insights: <InsightsScreen />,
    notes: <NotesScreen />,
    ai: <AIScreen />,
    notifications: <NotificationsScreen />,
  };
  const navItems = [
    { id: "home", icon: "home", label: tr("home", lang) },
    { id: "timers", icon: "timer", label: tr("timers", lang) },
    { id: "goals", icon: "goal", label: tr("goals", lang) },
    { id: "reports", icon: "report", label: tr("reports", lang) },
  ];
  const headerTitle = { insights: tr("insights", lang), notes: tr("notes", lang), ai: tr("ai", lang), notifications: tr("notifications", lang) }[screen];

  return (
    <div style={S.page}>
      <Header title={headerTitle} />
      <Drawer />
      {screens[screen]}
      <div style={S.tabs}>
        {navItems.map((n) => (
          <button key={n.id} onClick={() => setScreen(n.id)} style={S.tab(screen === n.id)}>
            <Icon name={n.icon} size={22} color={screen === n.id ? accent : C.sub} w={screen === n.id ? 2.4 : 2} />
            {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}
