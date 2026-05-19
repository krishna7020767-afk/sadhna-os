import { useEffect, useState, useRef } from "react";
import { db, auth } from './firebase';
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import lang from './lang';
import ShareCard from './ShareCard';

const lightTheme = {
  bg: "#fff7ed", card: "#ffffff", text: "#1f2937", sub: "#6b7280",
  border: "#fed7aa", input: "#fff7ed", navBg: "#ffffff",
  taskBg: "#fff7ed", doneBg: "#f0fdf4", doneText: "#16a34a",
};
const darkTheme = {
  bg: "#0f0f0f", card: "#1a1a1a", text: "#f5f5f5", sub: "#9ca3af",
  border: "#2d2d2d", input: "#222222", navBg: "#1a1a1a",
  taskBg: "#222222", doneBg: "#052e16", doneText: "#4ade80",
};

const ORANGE = "#f97316";
const ORANGE_DARK = "#ea580c";

const SPLASH_IMAGES = [
  "/prabhupada1.jpg",
  "/prabhupada2.jpg",
  "/prabhupada3.jpg",
  "/prabhupada4.jpg",
];

// ── Splash Screen ─────────────────────────────────────────
function SplashScreen({ onDone }) {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);

  const goNext = () => {
    if (current >= SPLASH_IMAGES.length - 1) {
      onDone();
      return;
    }
    setFade(false);
    setTimeout(() => {
      setCurrent((c) => c + 1);
      setFade(true);
    }, 400);
  };

  return (
    <div onClick={goNext} style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#000", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      overflow: "hidden", cursor: "pointer", userSelect: "none",
    }}>
      <div style={{ position: "absolute", inset: 0, opacity: fade ? 1 : 0, transition: "opacity 0.4s ease" }}>
        <img src={SPLASH_IMAGES[current]} alt="Srila Prabhupada" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.55)" }} />
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "60px", textAlign: "center", padding: "0 32px", opacity: fade ? 1 : 0, transition: "opacity 0.4s ease", pointerEvents: "none" }}>
        <p style={{ margin: "0 0 8px", fontSize: "13px", color: "rgba(255,255,255,0.6)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Sadhana OS</p>
        <h1 style={{ margin: "0 0 4px", fontSize: "26px", fontWeight: "700", color: "#fff", fontFamily: "'Segoe UI', system-ui, sans-serif", lineHeight: 1.3 }}>All Glories to</h1>
        <h1 style={{ margin: "0 0 20px", fontSize: "26px", fontWeight: "700", color: ORANGE, fontFamily: "'Segoe UI', system-ui, sans-serif", lineHeight: 1.3 }}>Srila Prabhupada</h1>
        <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>Tap to continue →</p>
      </div>
      <div style={{ position: "absolute", bottom: "24px", display: "flex", gap: "8px", pointerEvents: "none" }}>
        {SPLASH_IMAGES.map((_, i) => (
          <div key={i} style={{ width: i === current ? "24px" : "8px", height: "8px", borderRadius: "99px", background: i === current ? ORANGE : "rgba(255,255,255,0.3)", transition: "all 0.3s ease" }} />
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showShareCard, setShowShareCard] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [screen, setScreen] = useState("home");
  const [dark, setDark] = useState(false);
  const [hindi, setHindi] = useState(false);
  const [newTime, setNewTime] = useState("");
  const [newTask, setNewTask] = useState("");
  const [notes, setNotes] = useState("");
  const [streak, setStreak] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weeklyProgress, setWeeklyProgress] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [timerSecs, setTimerSecs] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerLabel, setTimerLabel] = useState("Japa");
  const timerRef = useRef(null);

  const theme = dark ? darkTheme : lightTheme;
  const t = hindi ? lang.hi : lang.en;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); });
    return () => unsub();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); }
    catch (e) { console.error(e); alert("Login failed."); }
  };

  const logout = async () => { await signOut(auth); setTasks([]); setStreak(0); };

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, "sadhna-os", user.uid);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = Object.entries(snap.data()).map(([title, v]) => ({
          title, time: v.time || "", category: v.category || "Custom",
          date: v.date || new Date().toDateString(), done: v.done || false,
        }));
        setTasks(data.filter((tk) => tk.date === selectedDate.toDateString()));
      } else setTasks([]);
    });
    return () => unsub();
  }, [user, selectedDate]);

  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(`sadhna_streak_${user.uid}`);
    if (saved) setStreak(parseInt(saved));
  }, [user]);

  useEffect(() => {
    const completed = tasks.filter((tk) => tk.done).length;
    const prog = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    const todayIndex = new Date(selectedDate).getDay();
    setWeeklyProgress((prev) => { const copy = [...prev]; copy[todayIndex] = prog; return copy; });
  }, [tasks]);

  const markStreakDone = () => {
    if (!user) return;
    const today = new Date().toDateString();
    const last = localStorage.getItem(`sadhna_streak_date_${user.uid}`);
    if (last !== today) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem(`sadhna_streak_${user.uid}`, newStreak);
      localStorage.setItem(`sadhna_streak_date_${user.uid}`, today);
    }
  };

  const toggleTask = async (index) => {
    if (!user) return;
    const updated = [...tasks];
    updated[index].done = !updated[index].done;
    setTasks(updated);
    if (updated.every((tk) => tk.done)) markStreakDone();
    try {
      const docRef = doc(db, "sadhna-os", user.uid);
      const updateData = {};
      updated.forEach((tk) => { updateData[tk.title] = { ...tk }; });
      await updateDoc(docRef, updateData);
    } catch (e) { console.error(e); }
  };

  const addTask = async () => {
    if (!user || !newTime || !newTask) return;
    const entry = { time: newTime, title: newTask, done: false, date: selectedDate.toDateString(), category: "Custom" };
    setTasks([...tasks, entry]);
    try {
      const docRef = doc(db, "sadhna-os", user.uid);
      try { await updateDoc(docRef, { [newTask]: entry }); }
      catch { await setDoc(docRef, { [newTask]: entry }); }
    } catch (e) { console.error(e); }
    setNewTime(""); setNewTask("");
  };

  const resetDay = async () => {
    if (!user) return;
    const updated = tasks.map((tk) => ({ ...tk, done: false }));
    setTasks(updated); setNotes("");
    try {
      const docRef = doc(db, "sadhna-os", user.uid);
      const updateData = {};
      updated.forEach((tk) => { updateData[tk.title] = { ...tk }; });
      await updateDoc(docRef, updateData);
    } catch (e) { console.error(e); }
  };

  const deleteTask = async (index) => {
    if (!user) return;
    const updated = tasks.filter((_, i) => i !== index);
    setTasks(updated);
    try {
      const docRef = doc(db, "sadhna-os", user.uid);
      const updateData = {};
      updated.forEach((tk) => { updateData[tk.title] = { ...tk }; });
      await setDoc(docRef, updateData);
    } catch (e) { console.error(e); }
  };

  const startTimer = () => {
    if (timerRunning) return;
    setTimerRunning(true);
    timerRef.current = setInterval(() => setTimerSecs((s) => s + 1), 1000);
  };
  const pauseTimer = () => { setTimerRunning(false); clearInterval(timerRef.current); };
  const resetTimer = () => { pauseTimer(); setTimerSecs(0); };
  const formatTime = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const sendWhatsApp = () => {
    const completed = tasks.filter((tk) => tk.done).length;
    const pending = tasks.length - completed;
    const prog = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    const sc = Math.min(100, Math.round(prog * 1.1));
    const dateStr = selectedDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
    const userName = user?.displayName || "Devotee";
    const report = `🙏 *All Glories to Srila Prabhupada!*\n\n👤 *${userName}*\n📅 *${dateStr}*\n\n✅ *Sadhana Report:*\n• Progress: ${prog}%\n• Daily Score: ${sc}/100\n• Completed: ${completed}/${tasks.length}\n• Pending: ${pending}\n• Streak: ${streak} days 🔥\n\n📝 *Notes:*\n${notes || "No notes added."}\n\n_Sent from Sadhana OS_ 🙏`;
    window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, "_blank");
  };

  const ekadashiDates = [
    { name: "Apara Ekadashi", date: "May 23, 2026" },
    { name: "Nirjala Ekadashi", date: "Jun 6, 2026" },
    { name: "Yogini Ekadashi", date: "Jun 21, 2026" },
    { name: "Devshayani Ekadashi", date: "Jul 6, 2026" },
    { name: "Kamika Ekadashi", date: "Jul 21, 2026" },
    { name: "Shravana Putrada Ekadashi", date: "Aug 4, 2026" },
    { name: "Aja Ekadashi", date: "Aug 19, 2026" },
    { name: "Parsva Ekadashi", date: "Sep 3, 2026" },
    { name: "Indira Ekadashi", date: "Sep 18, 2026" },
  ];
  const today = new Date();
  const upcoming = ekadashiDates.map((e) => ({ ...e, dateObj: new Date(e.date) })).filter((e) => e.dateObj >= today).slice(0, 5);
  const daysUntil = (d) => {
    const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
    if (diff === 0) return t.today;
    if (diff === 1) return t.tomorrow;
    return `${diff} ${t.daysLeft}`;
  };

  const completedCount = tasks.filter((tk) => tk.done).length;
  const pendingCount = tasks.length - completedCount;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const score = Math.min(100, Math.round(progress * 1.1));

  const s = {
    page: { minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "20px 0", background: theme.bg, fontFamily: "'Segoe UI', system-ui, sans-serif", transition: "background 0.3s" },
    phone: { width: "100%", maxWidth: "420px", minHeight: "100vh", background: theme.card, borderRadius: "24px", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: dark ? "0 0 40px rgba(0,0,0,0.6)" : "0 8px 40px rgba(0,0,0,0.12)" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 12px", borderBottom: `1px solid ${theme.border}` },
    title: { margin: 0, fontSize: "18px", fontWeight: "700", color: ORANGE },
    subtitle: { margin: "2px 0 0", fontSize: "10px", color: theme.sub },
    headerBtns: { display: "flex", gap: "8px", alignItems: "center" },
    iconBtn: { background: "transparent", border: `1px solid ${theme.border}`, borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: theme.text },
    calendar: { padding: "10px 20px", borderBottom: `1px solid ${theme.border}` },
    dateInput: { width: "100%", padding: "8px 12px", borderRadius: "10px", border: `1px solid ${theme.border}`, background: theme.input, color: theme.text, fontSize: "14px", outline: "none", boxSizing: "border-box" },
    scrollArea: { flex: 1, overflowY: "auto", padding: "16px 20px" },
    hero: { background: dark ? "#1f1f1f" : "#fff7ed", borderRadius: "16px", padding: "18px", marginBottom: "14px", border: `1px solid ${theme.border}` },
    heroLabel: { margin: "0 0 4px", fontSize: "11px", color: theme.sub, textTransform: "uppercase", letterSpacing: "0.05em" },
    heroBig: { margin: "0 0 10px", fontSize: "40px", fontWeight: "800", color: ORANGE },
    bar: { height: "8px", background: dark ? "#333" : "#fed7aa", borderRadius: "99px", overflow: "hidden" },
    fill: { height: "100%", background: `linear-gradient(90deg, ${ORANGE}, ${ORANGE_DARK})`, borderRadius: "99px", transition: "width 0.5s ease" },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" },
    card: { background: dark ? "#222" : "#fff7ed", border: `1px solid ${theme.border}`, borderRadius: "14px", padding: "12px", textAlign: "center" },
    cardLabel: { margin: "0 0 4px", fontSize: "11px", color: theme.sub, textTransform: "uppercase" },
    cardValue: { margin: 0, fontSize: "20px", fontWeight: "700", color: theme.text },
    sectionTitle: { margin: "0 0 12px", fontSize: "16px", fontWeight: "600", color: theme.text },
    task: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: theme.taskBg, border: `1px solid ${theme.border}`, borderRadius: "12px", marginBottom: "8px" },
    doneTask: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: theme.doneBg, border: `1px solid ${dark ? "#14532d" : "#bbf7d0"}`, borderRadius: "12px", marginBottom: "8px", opacity: 0.8 },
    taskTitle: { margin: 0, fontSize: "14px", fontWeight: "500" },
    taskTime: { margin: "0 0 2px", fontSize: "11px", color: theme.sub },
    checkbox: { width: "18px", height: "18px", accentColor: ORANGE, cursor: "pointer", flexShrink: 0 },
    deleteBtn: { marginLeft: "auto", background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "16px", padding: "2px 6px", borderRadius: "6px", flexShrink: 0 },
    chart: { display: "flex", alignItems: "flex-end", gap: "6px", height: "80px", padding: "8px 0 0", marginTop: "16px" },
    chartItem: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%", justifyContent: "flex-end" },
    chartBarWrap: { flex: 1, width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center" },
    input: { width: "100%", padding: "12px 14px", borderRadius: "12px", border: `1px solid ${theme.border}`, background: theme.input, color: theme.text, fontSize: "14px", outline: "none", marginBottom: "10px", boxSizing: "border-box" },
    textarea: { width: "100%", padding: "12px 14px", borderRadius: "12px", border: `1px solid ${theme.border}`, background: theme.input, color: theme.text, fontSize: "14px", outline: "none", marginBottom: "10px", boxSizing: "border-box", minHeight: "100px", resize: "vertical", fontFamily: "inherit" },
    orangeBtn: { width: "100%", padding: "13px", background: ORANGE, color: "#fff", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer", marginBottom: "10px" },
    grayBtn: { width: "100%", padding: "13px", background: dark ? "#333" : "#e5e7eb", color: theme.text, border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer", marginBottom: "10px" },
    greenBtn: { width: "100%", padding: "13px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer", marginBottom: "10px" },
    purpleBtn: { width: "100%", padding: "13px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer", marginBottom: "10px" },
    redBtn: { width: "100%", padding: "13px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer", marginBottom: "10px" },
    nav: { display: "flex", borderTop: `1px solid ${theme.border}`, background: theme.navBg, padding: "8px 4px" },
    navBtn: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "6px 2px", background: "transparent", border: "none", cursor: "pointer", color: theme.sub, fontSize: "10px", borderRadius: "10px" },
    navActive: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "6px 2px", background: dark ? "#2d1a0e" : "#fff7ed", border: "none", cursor: "pointer", color: ORANGE, fontSize: "10px", fontWeight: "600", borderRadius: "10px" },
    timerDisplay: { fontSize: "64px", fontWeight: "800", color: ORANGE, textAlign: "center", letterSpacing: "-2px", margin: "20px 0", fontVariantNumeric: "tabular-nums" },
    timerRow: { display: "flex", gap: "10px", marginBottom: "10px" },
    ekCard: { background: theme.taskBg, border: `1px solid ${theme.border}`, borderRadius: "14px", padding: "14px 16px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    badge: { background: ORANGE, color: "#fff", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: "600" },
    emptyState: { textAlign: "center", padding: "40px 20px", color: theme.sub },
    loginPage: { minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: theme.bg, fontFamily: "'Segoe UI', system-ui, sans-serif" },
    loginCard: { background: theme.card, borderRadius: "24px", padding: "40px 32px", textAlign: "center", maxWidth: "340px", width: "90%", boxShadow: "0 8px 40px rgba(0,0,0,0.12)" },
    loginTitle: { fontSize: "32px", fontWeight: "800", color: ORANGE, margin: "0 0 8px" },
    loginSub: { fontSize: "14px", color: theme.sub, margin: "0 0 32px" },
    googleBtn: { width: "100%", padding: "14px", background: "#fff", color: "#1f2937", border: "1px solid #e5e7eb", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
    langToggle: { background: hindi ? ORANGE : "transparent", border: `1px solid ${hindi ? ORANGE : theme.border}`, borderRadius: "20px", padding: "4px 10px", cursor: "pointer", fontSize: "12px", fontWeight: "600", color: hindi ? "#fff" : theme.sub, transition: "all 0.2s" },
  };

  if (showSplash) return <SplashScreen onDone={() => setShowSplash(false)} />;

  if (authLoading) {
    return (
      <div style={s.loginPage}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "48px", margin: "0 0 12px" }}>🙏</p>
          <p style={{ color: "#9ca3af", fontSize: "14px" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={s.loginPage}>
        <div style={s.loginCard}>
          <p style={{ fontSize: "56px", margin: "0 0 8px" }}>🙏</p>
          <h1 style={s.loginTitle}>{t.loginTitle}</h1>
          <p style={s.loginSub}>{t.loginSub}</p>
          <button style={s.googleBtn} onClick={loginWithGoogle}>
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {t.loginBtn}
          </button>
          <p style={{ margin: "20px 0 0", fontSize: "12px", color: theme.sub }}>{t.loginFooter}</p>
          <button style={{ ...s.langToggle, marginTop: "16px" }} onClick={() => setHindi(!hindi)}>{hindi ? "EN" : "हिं"}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.phone}>

        {/* ShareCard overlay */}
        {showShareCard && (
          <ShareCard
            user={user}
            progress={progress}
            score={score}
            streak={streak}
            completedCount={completedCount}
            totalCount={tasks.length}
            date={selectedDate}
            onClose={() => setShowShareCard(false)}
          />
        )}

        <header style={s.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {user.photoURL && (
              <img src={user.photoURL} alt="profile" style={{ width: "32px", height: "32px", borderRadius: "50%", border: `2px solid ${ORANGE}` }} />
            )}
            <div>
              <h1 style={s.title}>Sadhana OS</h1>
              <p style={s.subtitle}>All Glories to Srila Prabhupada 🙏</p>
            </div>
          </div>
          <div style={s.headerBtns}>
            <button style={s.langToggle} onClick={() => setHindi(!hindi)}>{hindi ? "EN" : "हिं"}</button>
            <button style={s.iconBtn} onClick={() => setDark(!dark)}>{dark ? "☀️" : "🌙"}</button>
          </div>
        </header>

        <div style={s.calendar}>
          <input type="date" style={s.dateInput} value={selectedDate.toISOString().substr(0, 10)} onChange={(e) => setSelectedDate(new Date(e.target.value))} />
        </div>

        <div style={s.scrollArea}>

          {screen === "home" && (
            <>
              <div style={s.hero}>
                <p style={s.heroLabel}>{t.dailyProgress}</p>
                <h2 style={s.heroBig}>{progress}%</h2>
                <div style={s.bar}><div style={{ ...s.fill, width: `${progress}%` }} /></div>
              </div>
              <div style={s.grid}>
                <StatCard label={t.score} value={`${score}/100`} s={s} />
                <StatCard label={t.streak} value={`${streak} 🔥`} s={s} />
                <StatCard label={t.done} value={`${completedCount}/${tasks.length}`} s={s} />
                <StatCard label={t.pending} value={pendingCount} s={s} />
              </div>
              <h3 style={s.sectionTitle}>{t.todaySadhana}</h3>
              {tasks.length === 0 && (
                <div style={s.emptyState}>
                  <p style={{ fontSize: "32px", margin: "0 0 8px" }}>🙏</p>
                  <p style={{ margin: 0 }}>{t.noTask}</p>
                </div>
              )}
              {tasks.map((task, i) => (
                <div key={i} style={task.done ? s.doneTask : s.task}>
                  <input type="checkbox" style={s.checkbox} checked={task.done} onChange={() => toggleTask(i)} />
                  <div style={{ flex: 1 }}>
                    <p style={s.taskTime}>{task.time} · {task.category}</p>
                    <p style={{ ...s.taskTitle, color: task.done ? theme.doneText : theme.text, textDecoration: task.done ? "line-through" : "none" }}>{task.title}</p>
                  </div>
                  <button style={s.deleteBtn} onClick={() => deleteTask(i)}>✕</button>
                </div>
              ))}
              <h3 style={{ ...s.sectionTitle, marginTop: "20px" }}>{t.weeklyOverview}</h3>
              <div style={s.chart}>
                {weeklyProgress.map((v, i) => {
                  const isToday = i === new Date().getDay();
                  return (
                    <div key={i} style={s.chartItem}>
                      <div style={s.chartBarWrap}>
                        <div style={{ width: "100%", height: `${Math.max(v, 4)}%`, background: isToday ? ORANGE : (dark ? "#444" : "#fed7aa"), borderRadius: "6px 6px 0 0", minHeight: "4px", transition: "height 0.4s" }} />
                      </div>
                      <small style={{ fontSize: "10px", color: isToday ? ORANGE : theme.sub, fontWeight: isToday ? "700" : "400" }}>
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][i]}
                      </small>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {screen === "add" && (
            <>
              <h3 style={s.sectionTitle}>{t.addTitle}</h3>
              <input style={s.input} placeholder={t.timePlaceholder} value={newTime} onChange={(e) => setNewTime(e.target.value)} />
              <input style={s.input} placeholder={t.activityPlaceholder} value={newTask} onChange={(e) => setNewTask(e.target.value)} />
              <button style={s.orangeBtn} onClick={addTask}>{t.addBtn}</button>
              <button style={s.grayBtn} onClick={resetDay}>{t.resetBtn}</button>
              {tasks.length > 0 && (
                <>
                  <h3 style={{ ...s.sectionTitle, marginTop: "8px" }}>{t.currentTasks}</h3>
                  {tasks.map((task, i) => (
                    <div key={i} style={s.task}>
                      <div style={{ flex: 1 }}>
                        <p style={s.taskTime}>{task.time}</p>
                        <p style={{ ...s.taskTitle, color: theme.text }}>{task.title}</p>
                      </div>
                      <button style={s.deleteBtn} onClick={() => deleteTask(i)}>✕</button>
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {screen === "focus" && (
            <>
              <h3 style={s.sectionTitle}>{t.timerTitle}</h3>
              <select style={{ ...s.input, marginBottom: "4px" }} value={timerLabel} onChange={(e) => setTimerLabel(e.target.value)}>
                <option>Japa</option>
                <option>Meditation</option>
                <option>Puja</option>
                <option>Paath</option>
                <option>Yoga</option>
                <option>Svadhyaya</option>
              </select>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: theme.sub, textAlign: "center" }}>{timerLabel} {t.timerRunning}</p>
              <div style={s.timerDisplay}>{formatTime(timerSecs)}</div>
              <div style={s.timerRow}>
                <button style={{ ...s.orangeBtn, margin: 0, flex: 1 }} onClick={timerRunning ? pauseTimer : startTimer}>{timerRunning ? t.pauseBtn : t.startBtn}</button>
                <button style={{ ...s.grayBtn, margin: 0, flex: 1 }} onClick={resetTimer}>{t.resetTimerBtn}</button>
              </div>
              {timerSecs > 0 && !timerRunning && (
                <div style={{ background: dark ? "#052e16" : "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "14px", textAlign: "center", marginTop: "8px" }}>
                  <p style={{ margin: 0, color: "#16a34a", fontWeight: "600" }}>🙏 {timerLabel} {t.timerDone} {formatTime(timerSecs)}</p>
                </div>
              )}
            </>
          )}

          {screen === "ekadashi" && (
            <>
              <h3 style={s.sectionTitle}>{t.ekTitle}</h3>
              <p style={{ margin: "0 0 16px", fontSize: "13px", color: theme.sub }}>{t.ekSubtitle}</p>
              {upcoming.map((e, i) => (
                <div key={i} style={s.ekCard}>
                  <div>
                    <p style={{ margin: "0 0 3px", fontSize: "14px", fontWeight: "600", color: theme.text }}>{e.name}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: theme.sub }}>{e.date}</p>
                  </div>
                  <span style={{ ...s.badge, background: e.dateObj - today < 3 * 86400000 ? "#dc2626" : ORANGE }}>{daysUntil(e.dateObj)}</span>
                </div>
              ))}
            </>
          )}

          {screen === "report" && (
            <>
              <h3 style={s.sectionTitle}>{t.reportTitle}</h3>
              <div style={s.hero}>
                <p style={s.heroLabel}>{t.todayScore}</p>
                <h2 style={s.heroBig}>{score}/100</h2>
                <div style={s.bar}><div style={{ ...s.fill, width: `${progress}%` }} /></div>
                <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
                  <span style={{ fontSize: "13px", color: theme.sub }}>✅ {t.done}: <b style={{ color: theme.text }}>{completedCount}</b></span>
                  <span style={{ fontSize: "13px", color: theme.sub }}>⏳ {t.pending}: <b style={{ color: theme.text }}>{pendingCount}</b></span>
                  <span style={{ fontSize: "13px", color: theme.sub }}>🔥 {t.streak}: <b style={{ color: ORANGE }}>{streak}</b></span>
                </div>
              </div>
              <label style={{ fontSize: "13px", color: theme.sub, display: "block", marginBottom: "6px" }}>{t.notesLabel}</label>
              <textarea style={s.textarea} placeholder={t.notesPlaceholder} value={notes} onChange={(e) => setNotes(e.target.value)} />
              {/* Beautiful Card Share Button */}
              <button style={s.purpleBtn} onClick={() => setShowShareCard(true)}>
                🎴 Beautiful Card Share Karo
              </button>
              {/* Simple WhatsApp text */}
              <button style={s.greenBtn} onClick={sendWhatsApp}>{t.whatsappBtn}</button>
            </>
          )}

          {screen === "insights" && (
            <>
              <h3 style={s.sectionTitle}>{t.insightsTitle}</h3>
              <div style={{ background: dark ? "#1a1a2e" : "#eff6ff", border: `1px solid ${dark ? "#2d2d5e" : "#bfdbfe"}`, borderRadius: "14px", padding: "16px", marginBottom: "12px" }}>
                <p style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600", color: dark ? "#93c5fd" : "#1d4ed8" }}>{t.analysisTitle}</p>
                <p style={{ margin: "0 0 6px", fontSize: "13px", color: theme.text }}>• {t.progress}: <b>{progress}%</b> — {progress >= 80 ? t.great : progress >= 50 ? t.ok : t.slow}</p>
                <p style={{ margin: "0 0 6px", fontSize: "13px", color: theme.text }}>• {t.streak}: <b>{streak}</b> — {streak >= 21 ? t.streakMsg1 : streak >= 7 ? t.streakMsg2 : t.streakMsg3}</p>
                <p style={{ margin: 0, fontSize: "13px", color: theme.text }}>• {t.score}: <b>{score}/100</b></p>
              </div>
              <div style={{ background: dark ? "#1a2e1a" : "#f0fdf4", border: `1px solid ${dark ? "#14532d" : "#bbf7d0"}`, borderRadius: "14px", padding: "16px", marginBottom: "12px" }}>
                <p style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600", color: "#16a34a" }}>{t.suggTitle}</p>
                {pendingCount > 0 && <p style={{ margin: "0 0 6px", fontSize: "13px", color: theme.text }}>• {pendingCount} {t.suggPending}</p>}
                <p style={{ margin: 0, fontSize: "13px", color: theme.text }}>• {t.suggBrahma}</p>
              </div>
              <div style={{ background: dark ? "#2d1a0e" : "#fff7ed", border: `1px solid ${theme.border}`, borderRadius: "14px", padding: "16px", marginBottom: "16px" }}>
                <p style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600", color: ORANGE }}>{t.shlokaTitle}</p>
                <p style={{ margin: "0 0 6px", fontSize: "14px", color: theme.text, fontStyle: "italic" }}>"योगः कर्मसु कौशलम्"</p>
                <p style={{ margin: 0, fontSize: "12px", color: theme.sub }}>Yoga is skill in action. — BG 2.50</p>
              </div>
              <button style={s.redBtn} onClick={logout}>{t.logout}</button>
            </>
          )}

        </div>

        <nav style={s.nav}>
          {[
            { label: "Home", icon: "🏠", id: "home" },
            { label: "Add", icon: "➕", id: "add" },
            { label: "Timer", icon: "⏱️", id: "focus" },
            { label: "Eka", icon: "🌙", id: "ekadashi" },
            { label: "Report", icon: "📤", id: "report" },
            { label: "Insights", icon: "🤖", id: "insights" },
          ].map((n) => (
            <button key={n.id} style={screen === n.id ? s.navActive : s.navBtn} onClick={() => setScreen(n.id)}>
              <span style={{ fontSize: "18px" }}>{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>

      </div>
    </div>
  );
}

function StatCard({ label, value, s }) {
  return (
    <div style={s.card}>
      <p style={s.cardLabel}>{label}</p>
      <h2 style={s.cardValue}>{value}</h2>
    </div>
  );
}