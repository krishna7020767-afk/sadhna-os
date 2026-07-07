import { useEffect, useState, useRef } from "react";
import { supabase } from "./supabaseClient";
import { mapUser, dateKey, prettyDate, notify } from "./lib/helpers";
import { getPalette, ThemeContext, accent, green, warn, danger } from "./theme";
import { AppContext } from "./appContext";
import {
  EMPTY, DEFAULT_TIMERS, DEFAULT_WIDGETS, DEFAULT_TEMPLATE, RUN_KEY, tr,
} from "./lib/constants";
import { dayMetric } from "./lib/metrics";
import { Toast } from "./components/Toast";
import { ConfirmSheet } from "./components/ConfirmSheet";
import { Header } from "./components/Header";
import { Drawer } from "./components/Drawer";
import { Icon } from "./components/Icon";
import { Home } from "./screens/Home";
import { Timers } from "./screens/Timers";
import { Goals } from "./screens/Goals";
import { Reports } from "./screens/Reports";
import { Notifications } from "./screens/Notifications";
import { Insights } from "./screens/Insights";
import { AI } from "./screens/AI";
import { Notes } from "./screens/Notes";

/* Quote + Photo pairs for the splash screen */
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

/* ──────────────────────────────────────────────
   Skeleton loading (auth check in progress)
─────────────────────────────────────────────── */
function SkeletonScreen({ C }) {
  const block = { background: C.card, borderRadius: 14, margin: "12px 14px", border: `1px solid ${C.line}` };
  return (
    <div style={{ background: C.bg, minHeight: "100dvh", paddingTop: 20 }}>
      <style>{`
        .skeleton-block { animation: pulseSkeleton 1.2s ease-in-out infinite; }
        @keyframes pulseSkeleton { 0%, 100% { opacity: .5; } 50% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .skeleton-block { animation: none; } }
      `}</style>
      <div className="skeleton-block" style={{ ...block, height: 90 }} />
      <div className="skeleton-block" style={{ ...block, height: 140 }} />
      <div className="skeleton-block" style={{ ...block, height: 140 }} />
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
  const [lang, setLang] = useState("en");
  const [dark, setDark] = useState(true);
  const [screen, setScreen] = useState("home");
  const [drawer, setDrawer] = useState(false);
  const [editingHome, setEditingHome] = useState(false);
  const [data, setData] = useState(EMPTY);
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };
  const [confirmState, setConfirmState] = useState(null); // { message, onConfirm }
  const askConfirm = (message, onConfirm) => setConfirmState({ message, onConfirm });

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local UI state from a remote row, not derivable from props
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

  const pendingSaveRef = useRef(null);
  const saveTimer = useRef(null);
  const flushSave = () => {
    clearTimeout(saveTimer.current);
    const next = pendingSaveRef.current;
    if (!next || !user) return;
    pendingSaveRef.current = null;
    supabase.from("user_data").upsert({
      id: user.id,
      name: user.displayName || "",
      photo: user.photoURL || "",
      log: next.log, custom: next.custom, notes: next.notes, settings: next.settings,
      timers: next.timers, goals: next.goals, widgets: next.widgets, templates: next.templates,
      updated_at: new Date().toISOString(),
    });
  };
  const save = (patch) => {
    if (!user) return;
    setData((prev) => {
      const next = { ...prev, ...patch };
      pendingSaveRef.current = next;
      return next;
    });
    // debounce the Supabase write so rapid edits (typing, quick taps) don't fire one upsert each
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushSave, 500);
  };
  const saveSetting = (patch) => save({ settings: { ...data.settings, ...patch } });

  // flush a pending debounced save immediately if the tab is backgrounded/closed
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === "hidden") flushSave(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flushSave);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flushSave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const dayLog = data.log?.[today] || {};
  const setField = (id, val) => save({ log: { ...data.log, [today]: { ...dayLog, [id]: val } } });
  const customToday = data.custom?.[today] || [];
  const setCustom = (arr) => save({ custom: { ...data.custom, [today]: arr } });

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
    let out = (tmplText || DEFAULT_TEMPLATE.text).replace(/\{(\w+)\}/g, (m, k) => (k in map ? map[k] : ""));
    const done = customToday.filter((c) => c.done);
    if (done.length) out += "\n\n" + done.map((c) => `✅ ${c.label}`).join("\n");
    return out;
  }

  /* theme tokens */
  const C = getPalette(dark);

  const S = {
    page: { background: C.bg, minHeight: "100dvh", color: C.text, fontFamily: "system-ui, -apple-system, sans-serif", paddingBottom: 92, touchAction: "pan-x pan-y", maxWidth: 480, margin: "0 auto" },
    head: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: `1px solid ${C.line}`, position: "sticky", top: 0, background: C.bg, zIndex: 20 },
    row: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${C.line}` },
    chk: (on) => ({ width: 30, height: 30, borderRadius: 8, border: `2px solid ${on ? accent : C.sub}`, background: on ? accent : "transparent", color: "#1a0e05", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 800, fontSize: 18, flexShrink: 0 }),
    input: { background: C.bg, color: C.text, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 12px", fontSize: 15, width: "100%", minHeight: 44, boxSizing: "border-box" },
    tabs: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, display: "flex", background: C.card, borderTop: `1px solid ${C.line}`, paddingTop: 8, paddingBottom: "calc(8px + env(safe-area-inset-bottom))", zIndex: 20 },
    tab: (a) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 4px", fontSize: 11, fontWeight: a ? 700 : 500, color: a ? accent : C.sub, cursor: "pointer" }),
    sectionTitle: { fontWeight: 700, fontSize: 16, marginBottom: 12 },
  };

  if (splash) return <SplashScreen onDone={() => setSplash(false)} />;
  if (!authReady) return <SkeletonScreen C={C} />;
  if (!user) return <Login />;

  const toggleDark = () => { const v = !dark; setDark(v); saveSetting({ dark: v }); };
  const toggleLang = () => { const v = lang === "hi" ? "en" : "hi"; setLang(v); saveSetting({ lang: v }); };

  const appContextValue = {
    S, data, save, saveSetting, lang, user, today, dayLog, customToday, setField, setCustom,
    runs, toggleRun, resetRun, elapsedOf, timers, widgets, templates, showToast, askConfirm,
    setScreen, setDrawer, drawer, buildReport, activeTemplateText, dark, toggleDark, toggleLang,
    editingHome, setEditingHome,
  };

  const screens = {
    home: <Home />,
    timers: <Timers />,
    goals: <Goals />,
    reports: <Reports />,
    insights: <Insights />,
    notes: <Notes />,
    ai: <AI />,
    notifications: <Notifications />,
  };
  const navItems = [
    { id: "home", icon: "home", label: tr("home", lang) },
    { id: "timers", icon: "timer", label: tr("timers", lang) },
    { id: "goals", icon: "goal", label: tr("goals", lang) },
    { id: "reports", icon: "report", label: tr("reports", lang) },
  ];
  const headerTitle = { insights: tr("insights", lang), notes: tr("notes", lang), ai: tr("ai", lang), notifications: tr("notifications", lang) }[screen];

  return (
    <ThemeContext.Provider value={{ C, accent, green, warn, danger }}>
      <AppContext.Provider value={appContextValue}>
        <div style={{ background: C.bg, minHeight: "100dvh" }}>
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
            <Toast message={toast} />
            <ConfirmSheet
              open={!!confirmState}
              message={confirmState?.message}
              confirmLabel={lang === "hi" ? "हटाएं" : "Delete"}
              cancelLabel={lang === "hi" ? "रद्द करें" : "Cancel"}
              onConfirm={() => { confirmState?.onConfirm(); setConfirmState(null); }}
              onCancel={() => setConfirmState(null)}
            />
          </div>
        </div>
      </AppContext.Provider>
    </ThemeContext.Provider>
  );
}
