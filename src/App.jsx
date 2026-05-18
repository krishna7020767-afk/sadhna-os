import { useEffect, useState, useRef } from "react";
import { db } from './firebase';
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";

// ─── Themes ───────────────────────────────────────────────
const lightTheme = {
  bg: "#fff7ed",
  card: "#ffffff",
  text: "#1f2937",
  sub: "#6b7280",
  border: "#fed7aa",
  input: "#fff7ed",
  navBg: "#ffffff",
  taskBg: "#fff7ed",
  doneBg: "#f0fdf4",
  doneText: "#16a34a",
};
const darkTheme = {
  bg: "#0f0f0f",
  card: "#1a1a1a",
  text: "#f5f5f5",
  sub: "#9ca3af",
  border: "#2d2d2d",
  input: "#222222",
  navBg: "#1a1a1a",
  taskBg: "#222222",
  doneBg: "#052e16",
  doneText: "#4ade80",
};

const ORANGE = "#f97316";
const ORANGE_DARK = "#ea580c";

// ─── Main App ─────────────────────────────────────────────
export default function App() {
  const [tasks, setTasks] = useState([]);
  const [screen, setScreen] = useState("home");
  const [dark, setDark] = useState(false);
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

  // ── Firestore fetch ──────────────────────────────────────
  useEffect(() => {
    const docRef = doc(db, "sadhna-os", "Prabhupad_1896");
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = Object.entries(snap.data()).map(([title, v]) => ({
          title,
          time: v.time || "",
          category: v.category || "Custom",
          date: v.date || new Date().toDateString(),
          done: v.done || false,
        }));
        setTasks(data.filter((t) => t.date === selectedDate.toDateString()));
      }
    });
    return () => unsub();
  }, [selectedDate]);

  // ── Streak logic (fixed — only on date change, not every render) ──
  useEffect(() => {
    const completed = tasks.filter((t) => t.done).length;
    const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    const todayIndex = new Date(selectedDate).getDay();
    setWeeklyProgress((prev) => {
      const copy = [...prev];
      copy[todayIndex] = progress;
      return copy;
    });
  }, [tasks]);

  // Streak saved in localStorage to prevent reset on reload
  useEffect(() => {
    const saved = localStorage.getItem("sadhna_streak");
    if (saved) setStreak(parseInt(saved));
  }, []);

  const markStreakDone = () => {
    const today = new Date().toDateString();
    const last = localStorage.getItem("sadhna_streak_date");
    if (last !== today) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem("sadhna_streak", newStreak);
      localStorage.setItem("sadhna_streak_date", today);
    }
  };

  // ── Task toggle ──────────────────────────────────────────
  const toggleTask = async (index) => {
    const updated = [...tasks];
    updated[index].done = !updated[index].done;
    setTasks(updated);
    const allDone = updated.every((t) => t.done);
    if (allDone) markStreakDone();
    try {
      const docRef = doc(db, "sadhna-os", "Prabhupad_1896");
      const updateData = {};
      updated.forEach((t) => { updateData[t.title] = { ...t }; });
      await updateDoc(docRef, updateData);
    } catch (e) { console.error(e); }
  };

  // ── Add task ─────────────────────────────────────────────
  const addTask = async () => {
    if (!newTime || !newTask) return;
    const entry = { time: newTime, title: newTask, done: false, date: selectedDate.toDateString(), category: "Custom" };
    setTasks([...tasks, entry]);
    try {
      const docRef = doc(db, "sadhna-os", "Prabhupad_1896");
      await updateDoc(docRef, { [newTask]: entry });
    } catch (e) { console.error(e); }
    setNewTime(""); setNewTask("");
  };

  const resetDay = async () => {
    const updated = tasks.map((t) => ({ ...t, done: false }));
    setTasks(updated);
    setNotes("");
    try {
      const docRef = doc(db, "sadhna-os", "Prabhupad_1896");
      const updateData = {};
      updated.forEach((t) => { updateData[t.title] = { ...t }; });
      await updateDoc(docRef, updateData);
    } catch (e) { console.error(e); }
  };

  const deleteTask = async (index) => {
    const task = tasks[index];
    const updated = tasks.filter((_, i) => i !== index);
    setTasks(updated);
    try {
      const docRef = doc(db, "sadhna-os", "Prabhupad_1896");
      const updateData = {};
      updated.forEach((t) => { updateData[t.title] = { ...t }; });
      // setDoc to overwrite and remove deleted key
      await setDoc(docRef, updateData);
    } catch (e) { console.error(e); }
  };

  // ── Timer ────────────────────────────────────────────────
  const startTimer = () => {
    if (timerRunning) return;
    setTimerRunning(true);
    timerRef.current = setInterval(() => setTimerSecs((s) => s + 1), 1000);
  };
  const pauseTimer = () => {
    setTimerRunning(false);
    clearInterval(timerRef.current);
  };
  const resetTimer = () => {
    pauseTimer();
    setTimerSecs(0);
  };
  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // ── WhatsApp Report ──────────────────────────────────────
  const sendWhatsApp = () => {
    const completed = tasks.filter((t) => t.done).length;
    const pending = tasks.length - completed;
    const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    const score = Math.min(100, Math.round(progress * 1.1));
    const dateStr = selectedDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
    const report = `🙏 *Hare Krishna Prabhuji!*\n\n📅 *${dateStr}*\n\n✅ *Sadhana Report:*\n• Progress: ${progress}%\n• Daily Score: ${score}/100\n• Completed: ${completed}/${tasks.length}\n• Pending: ${pending}\n• Streak: ${streak} days 🔥\n\n📝 *Notes:*\n${notes || "No notes added."}\n\n_Sent from Sadhana OS_ 🕉️`;
    window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, "_blank");
  };

  // ── Ekadashi dates 2025–2026 ─────────────────────────────
  const ekadashiDates = [
    { name: "Nirjala Ekadashi", date: "Jun 17, 2025" },
    { name: "Yogini Ekadashi", date: "Jul 2, 2025" },
    { name: "Devshayani Ekadashi", date: "Jul 17, 2025" },
    { name: "Kamika Ekadashi", date: "Aug 1, 2025" },
    { name: "Shravana Putrada Ekadashi", date: "Aug 15, 2025" },
    { name: "Aja Ekadashi", date: "Aug 31, 2025" },
    { name: "Parsva Ekadashi", date: "Sep 14, 2025" },
    { name: "Indira Ekadashi", date: "Sep 29, 2025" },
    { name: "Papankusha Ekadashi", date: "Oct 13, 2025" },
    { name: "Rama Ekadashi", date: "Oct 29, 2025" },
    { name: "Devutthana Ekadashi", date: "Nov 11, 2025" },
    { name: "Utpanna Ekadashi", date: "Nov 26, 2025" },
    { name: "Mokshada Ekadashi", date: "Dec 11, 2025" },
    { name: "Saphala Ekadashi", date: "Dec 26, 2025" },
    { name: "Pausha Putrada Ekadashi", date: "Jan 10, 2026" },
    { name: "Shattila Ekadashi", date: "Jan 25, 2026" },
    { name: "Jaya Ekadashi", date: "Feb 8, 2026" },
    { name: "Vijaya Ekadashi", date: "Feb 24, 2026" },
    { name: "Amalaki Ekadashi", date: "Mar 10, 2026" },
    { name: "Papamochani Ekadashi", date: "Mar 25, 2026" },
    { name: "Kamada Ekadashi", date: "Apr 8, 2026" },
    { name: "Varuthini Ekadashi", date: "Apr 23, 2026" },
    { name: "Mohini Ekadashi", date: "May 8, 2026" },
    { name: "Apara Ekadashi", date: "May 23, 2026" },
    { name: "Nirjala Ekadashi", date: "Jun 6, 2026" },
    { name: "Yogini Ekadashi", date: "Jun 21, 2026" },
  ];

  const today = new Date();
  const upcoming = ekadashiDates
    .map((e) => ({ ...e, dateObj: new Date(e.date) }))
    .filter((e) => e.dateObj >= today)
    .slice(0, 5);

  const daysUntil = (d) => {
    const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
    return diff === 0 ? "Aaj!" : diff === 1 ? "Kal" : `${diff} din mein`;
  };

  // ── Computed values ──────────────────────────────────────
  const completedCount = tasks.filter((t) => t.done).length;
  const pendingCount = tasks.length - completedCount;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const score = Math.min(100, Math.round(progress * 1.1));

  // ── Styles ───────────────────────────────────────────────
  const s = {
    page: {
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      padding: "20px 0",
      background: theme.bg,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      transition: "background 0.3s",
    },
    phone: {
      width: "100%",
      maxWidth: "420px",
      minHeight: "100vh",
      background: theme.card,
      borderRadius: "24px",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      boxShadow: dark ? "0 0 40px rgba(0,0,0,0.6)" : "0 8px 40px rgba(0,0,0,0.12)",
      transition: "background 0.3s",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 20px 12px",
      borderBottom: `1px solid ${theme.border}`,
    },
    title: { margin: 0, fontSize: "22px", fontWeight: "700", color: ORANGE },
    subtitle: { margin: "2px 0 0", fontSize: "12px", color: theme.sub },
    iconBtn: {
      background: "transparent",
      border: `1px solid ${theme.border}`,
      borderRadius: "50%",
      width: "38px", height: "38px",
      cursor: "pointer",
      fontSize: "18px",
      display: "flex", alignItems: "center", justifyContent: "center",
    },
    calendar: {
      padding: "10px 20px",
      borderBottom: `1px solid ${theme.border}`,
    },
    dateInput: {
      width: "100%",
      padding: "8px 12px",
      borderRadius: "10px",
      border: `1px solid ${theme.border}`,
      background: theme.input,
      color: theme.text,
      fontSize: "14px",
      outline: "none",
      boxSizing: "border-box",
    },
    scrollArea: {
      flex: 1,
      overflowY: "auto",
      padding: "16px 20px",
    },
    hero: {
      background: dark ? "#1f1f1f" : "#fff7ed",
      borderRadius: "16px",
      padding: "20px",
      marginBottom: "16px",
      border: `1px solid ${theme.border}`,
    },
    heroLabel: { margin: "0 0 4px", fontSize: "12px", color: theme.sub, textTransform: "uppercase", letterSpacing: "0.05em" },
    heroBig: { margin: "0 0 12px", fontSize: "42px", fontWeight: "800", color: ORANGE },
    bar: {
      height: "8px",
      background: dark ? "#333" : "#fed7aa",
      borderRadius: "99px",
      overflow: "hidden",
    },
    fill: {
      height: "100%",
      background: `linear-gradient(90deg, ${ORANGE}, ${ORANGE_DARK})`,
      borderRadius: "99px",
      transition: "width 0.5s ease",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "10px",
      marginBottom: "16px",
    },
    card: {
      background: dark ? "#222" : "#fff7ed",
      border: `1px solid ${theme.border}`,
      borderRadius: "14px",
      padding: "14px",
      textAlign: "center",
    },
    cardLabel: { margin: "0 0 4px", fontSize: "11px", color: theme.sub, textTransform: "uppercase" },
    cardValue: { margin: 0, fontSize: "22px", fontWeight: "700", color: theme.text },
    sectionTitle: { margin: "0 0 12px", fontSize: "16px", fontWeight: "600", color: theme.text },
    task: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 14px",
      background: theme.taskBg,
      border: `1px solid ${theme.border}`,
      borderRadius: "12px",
      marginBottom: "8px",
      transition: "all 0.2s",
    },
    doneTask: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 14px",
      background: theme.doneBg,
      border: `1px solid ${dark ? "#14532d" : "#bbf7d0"}`,
      borderRadius: "12px",
      marginBottom: "8px",
      opacity: 0.8,
    },
    taskTitle: { margin: "0", fontSize: "14px", fontWeight: "500" },
    taskTime: { margin: "0 0 2px", fontSize: "11px", color: theme.sub },
    checkbox: { width: "18px", height: "18px", accentColor: ORANGE, cursor: "pointer", flexShrink: 0 },
    deleteBtn: {
      marginLeft: "auto",
      background: "transparent",
      border: "none",
      color: dark ? "#ef4444" : "#dc2626",
      cursor: "pointer",
      fontSize: "16px",
      padding: "2px 6px",
      borderRadius: "6px",
      flexShrink: 0,
    },
    chart: {
      display: "flex",
      alignItems: "flex-end",
      gap: "6px",
      height: "80px",
      padding: "8px 0 0",
      marginTop: "16px",
    },
    chartItem: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "4px",
      height: "100%",
      justifyContent: "flex-end",
    },
    chartBarWrap: {
      flex: 1,
      width: "100%",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
    },
    input: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: "12px",
      border: `1px solid ${theme.border}`,
      background: theme.input,
      color: theme.text,
      fontSize: "14px",
      outline: "none",
      marginBottom: "10px",
      boxSizing: "border-box",
    },
    textarea: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: "12px",
      border: `1px solid ${theme.border}`,
      background: theme.input,
      color: theme.text,
      fontSize: "14px",
      outline: "none",
      marginBottom: "10px",
      boxSizing: "border-box",
      minHeight: "100px",
      resize: "vertical",
      fontFamily: "inherit",
    },
    orangeBtn: {
      width: "100%",
      padding: "13px",
      background: ORANGE,
      color: "#fff",
      border: "none",
      borderRadius: "12px",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      marginBottom: "10px",
    },
    grayBtn: {
      width: "100%",
      padding: "13px",
      background: dark ? "#333" : "#e5e7eb",
      color: theme.text,
      border: "none",
      borderRadius: "12px",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      marginBottom: "10px",
    },
    greenBtn: {
      width: "100%",
      padding: "13px",
      background: "#16a34a",
      color: "#fff",
      border: "none",
      borderRadius: "12px",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      marginBottom: "10px",
    },
    nav: {
      display: "flex",
      borderTop: `1px solid ${theme.border}`,
      background: theme.navBg,
      padding: "8px 4px",
    },
    navBtn: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "2px",
      padding: "6px 2px",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      color: theme.sub,
      fontSize: "10px",
      borderRadius: "10px",
    },
    navActive: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "2px",
      padding: "6px 2px",
      background: dark ? "#2d1a0e" : "#fff7ed",
      border: "none",
      cursor: "pointer",
      color: ORANGE,
      fontSize: "10px",
      fontWeight: "600",
      borderRadius: "10px",
    },
    timerDisplay: {
      fontSize: "64px",
      fontWeight: "800",
      color: ORANGE,
      textAlign: "center",
      letterSpacing: "-2px",
      margin: "20px 0",
      fontVariantNumeric: "tabular-nums",
    },
    timerRow: {
      display: "flex",
      gap: "10px",
      marginBottom: "10px",
    },
    ekCard: {
      background: theme.taskBg,
      border: `1px solid ${theme.border}`,
      borderRadius: "14px",
      padding: "14px 16px",
      marginBottom: "10px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    badge: {
      background: ORANGE,
      color: "#fff",
      borderRadius: "20px",
      padding: "3px 10px",
      fontSize: "11px",
      fontWeight: "600",
    },
    emptyState: {
      textAlign: "center",
      padding: "40px 20px",
      color: theme.sub,
    },
  };

  // ─── Render ────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.phone}>

        {/* Header */}
        <header style={s.header}>
          <div>
            <h1 style={s.title}>Sadhana OS 🕉️</h1>
            <p style={s.subtitle}>Krishna Conscious Daily Tracker</p>
          </div>
          <button style={s.iconBtn} onClick={() => setDark(!dark)} title="Toggle theme">
            {dark ? "☀️" : "🌙"}
          </button>
        </header>

        {/* Date picker */}
        <div style={s.calendar}>
          <input
            type="date"
            style={s.dateInput}
            value={selectedDate.toISOString().substr(0, 10)}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
          />
        </div>

        {/* Scrollable content */}
        <div style={s.scrollArea}>

          {/* ── HOME ── */}
          {screen === "home" && (
            <>
              <div style={s.hero}>
                <p style={s.heroLabel}>Daily Progress</p>
                <h2 style={s.heroBig}>{progress}%</h2>
                <div style={s.bar}>
                  <div style={{ ...s.fill, width: `${progress}%` }} />
                </div>
              </div>

              <div style={s.grid}>
                <StatCard label="Score" value={`${score}/100`} theme={theme} s={s} />
                <StatCard label="Streak" value={`${streak} 🔥`} theme={theme} s={s} />
                <StatCard label="Done" value={`${completedCount}/${tasks.length}`} theme={theme} s={s} />
                <StatCard label="Pending" value={pendingCount} theme={theme} s={s} />
              </div>

              <h3 style={s.sectionTitle}>Today's Sadhana</h3>
              {tasks.length === 0 && (
                <div style={s.emptyState}>
                  <p style={{ fontSize: "32px", margin: "0 0 8px" }}>🙏</p>
                  <p style={{ margin: 0 }}>Koi task nahi hai. "Add" se add karo.</p>
                </div>
              )}
              {tasks.map((task, i) => (
                <div key={i} style={task.done ? s.doneTask : s.task}>
                  <input
                    type="checkbox"
                    style={s.checkbox}
                    checked={task.done}
                    onChange={() => toggleTask(i)}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={s.taskTime}>{task.time} · {task.category}</p>
                    <p style={{ ...s.taskTitle, color: task.done ? theme.doneText : theme.text, textDecoration: task.done ? "line-through" : "none" }}>
                      {task.title}
                    </p>
                  </div>
                  <button style={s.deleteBtn} onClick={() => deleteTask(i)} title="Delete">✕</button>
                </div>
              ))}

              {/* Weekly chart */}
              <h3 style={{ ...s.sectionTitle, marginTop: "20px" }}>Weekly Overview</h3>
              <div style={s.chart}>
                {weeklyProgress.map((v, i) => {
                  const isToday = i === new Date().getDay();
                  return (
                    <div key={i} style={s.chartItem}>
                      <div style={s.chartBarWrap}>
                        <div style={{
                          width: "100%",
                          height: `${Math.max(v, 4)}%`,
                          background: isToday ? ORANGE : (dark ? "#444" : "#fed7aa"),
                          borderRadius: "6px 6px 0 0",
                          minHeight: "4px",
                          transition: "height 0.4s",
                        }} />
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

          {/* ── ADD ── */}
          {screen === "add" && (
            <>
              <h3 style={s.sectionTitle}>Sadhana Add / Edit karo</h3>
              <input
                style={s.input}
                placeholder="Time (e.g. 5:00 AM)"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
              <input
                style={s.input}
                placeholder="Activity (e.g. 16 rounds japa)"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
              />
              <button style={s.orangeBtn} onClick={addTask}>+ Activity Add Karo</button>
              <button style={s.grayBtn} onClick={resetDay}>🔄 Aaj Reset Karo</button>

              {tasks.length > 0 && (
                <>
                  <h3 style={{ ...s.sectionTitle, marginTop: "8px" }}>Current Tasks</h3>
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

          {/* ── FOCUS / TIMER ── */}
          {screen === "focus" && (
            <>
              <h3 style={s.sectionTitle}>Sadhana Timer</h3>
              <select
                style={{ ...s.input, marginBottom: "4px" }}
                value={timerLabel}
                onChange={(e) => setTimerLabel(e.target.value)}
              >
                <option>Japa</option>
                <option>Meditation</option>
                <option>Puja</option>
                <option>Paath</option>
                <option>Yoga</option>
                <option>Svadhyaya</option>
              </select>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: theme.sub, textAlign: "center" }}>
                {timerLabel} chal raha hai...
              </p>
              <div style={s.timerDisplay}>{formatTime(timerSecs)}</div>
              <div style={s.timerRow}>
                <button
                  style={{ ...s.orangeBtn, margin: 0, flex: 1 }}
                  onClick={timerRunning ? pauseTimer : startTimer}
                >
                  {timerRunning ? "⏸ Pause" : "▶ Start"}
                </button>
                <button
                  style={{ ...s.grayBtn, margin: 0, flex: 1 }}
                  onClick={resetTimer}
                >
                  ↺ Reset
                </button>
              </div>
              {timerSecs > 0 && !timerRunning && (
                <div style={{
                  background: dark ? "#052e16" : "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "12px",
                  padding: "14px",
                  textAlign: "center",
                  marginTop: "8px",
                }}>
                  <p style={{ margin: 0, color: "#16a34a", fontWeight: "600" }}>
                    🙏 {timerLabel} complete! {formatTime(timerSecs)} ki sadhna hui.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── EKADASHI ── */}
          {screen === "ekadashi" && (
            <>
              <h3 style={s.sectionTitle}>🌙 Aane Wali Ekadashi</h3>
              <p style={{ margin: "0 0 16px", fontSize: "13px", color: theme.sub }}>
                Yeh dates 2025–2026 ki hain. Ek din pehle notification aayegi.
              </p>
              {upcoming.map((e, i) => (
                <div key={i} style={s.ekCard}>
                  <div>
                    <p style={{ margin: "0 0 3px", fontSize: "14px", fontWeight: "600", color: theme.text }}>{e.name}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: theme.sub }}>{e.date}</p>
                  </div>
                  <span style={{
                    ...s.badge,
                    background: e.dateObj - today < 3 * 86400000 ? "#dc2626" : ORANGE,
                  }}>
                    {daysUntil(e.dateObj)}
                  </span>
                </div>
              ))}
            </>
          )}

          {/* ── REPORT ── */}
          {screen === "report" && (
            <>
              <h3 style={s.sectionTitle}>📤 Sadhana Report</h3>

              <div style={s.hero}>
                <p style={s.heroLabel}>Aaj ka Score</p>
                <h2 style={s.heroBig}>{score}/100</h2>
                <div style={s.bar}>
                  <div style={{ ...s.fill, width: `${progress}%` }} />
                </div>
                <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
                  <span style={{ fontSize: "13px", color: theme.sub }}>✅ Done: <b style={{ color: theme.text }}>{completedCount}</b></span>
                  <span style={{ fontSize: "13px", color: theme.sub }}>⏳ Pending: <b style={{ color: theme.text }}>{pendingCount}</b></span>
                  <span style={{ fontSize: "13px", color: theme.sub }}>🔥 Streak: <b style={{ color: ORANGE }}>{streak}</b></span>
                </div>
              </div>

              <label style={{ fontSize: "13px", color: theme.sub, display: "block", marginBottom: "6px" }}>
                Notes (optional — WhatsApp mein jayega)
              </label>
              <textarea
                style={s.textarea}
                placeholder="Aaj ki sadhna kaisi rahi? Koi anubhav?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <button style={s.greenBtn} onClick={sendWhatsApp}>
                📲 WhatsApp par bhejo
              </button>
              <button style={s.grayBtn} onClick={() => {
                Notification.requestPermission().then(p => {
                  if (p === "granted") new Notification("Sadhana OS 🙏", { body: "Aaj ki sadhna complete karo!" });
                });
              }}>
                🔔 Test Notification
              </button>
            </>
          )}

          {/* ── AI INSIGHTS ── */}
          {screen === "insights" && (
            <>
              <h3 style={s.sectionTitle}>🤖 Sadhana Insights</h3>
              <div style={{
                background: dark ? "#1a1a2e" : "#eff6ff",
                border: `1px solid ${dark ? "#2d2d5e" : "#bfdbfe"}`,
                borderRadius: "14px",
                padding: "16px",
                marginBottom: "12px",
              }}>
                <p style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600", color: dark ? "#93c5fd" : "#1d4ed8" }}>
                  📊 Aaj ka Analysis
                </p>
                <p style={{ margin: "0 0 6px", fontSize: "13px", color: theme.text }}>
                  • Progress: <b>{progress}%</b> — {progress >= 80 ? "Bahut accha! 🌟" : progress >= 50 ? "Theek hai, aur karo 💪" : "Aaj thoda slow raha 🙏"}
                </p>
                <p style={{ margin: "0 0 6px", fontSize: "13px", color: theme.text }}>
                  • Streak: <b>{streak} din</b> — {streak >= 21 ? "21 din complete! Habit ban gayi 🎉" : streak >= 7 ? "7 din ho gaye! 🔥" : "Streak badhaao!"}
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: theme.text }}>
                  • Score: <b>{score}/100</b> — {score >= 90 ? "Perfect sadhana! 🙏" : score >= 70 ? "Acchi progress!" : "Kal aur behtar karo"}
                </p>
              </div>

              <div style={{
                background: dark ? "#1a2e1a" : "#f0fdf4",
                border: `1px solid ${dark ? "#14532d" : "#bbf7d0"}`,
                borderRadius: "14px",
                padding: "16px",
                marginBottom: "12px",
              }}>
                <p style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600", color: "#16a34a" }}>
                  💡 Sujhav
                </p>
                {progress < 100 && pendingCount > 0 && (
                  <p style={{ margin: "0 0 6px", fontSize: "13px", color: theme.text }}>
                    • {pendingCount} task abhi baki hai — abhi complete karo!
                  </p>
                )}
                {streak === 0 && (
                  <p style={{ margin: "0 0 6px", fontSize: "13px", color: theme.text }}>
                    • Aaj sadhna puri karo aur streak start karo 🔥
                  </p>
                )}
                {streak > 0 && streak < 7 && (
                  <p style={{ margin: "0 0 6px", fontSize: "13px", color: theme.text }}>
                    • {7 - streak} din aur — 7-day milestone tak pahuncho!
                  </p>
                )}
                <p style={{ margin: 0, fontSize: "13px", color: theme.text }}>
                  • Subah 4-5 baje ki sadhna sabse powerful hoti hai (Brahma Muhurta) 🌅
                </p>
              </div>

              <div style={{
                background: dark ? "#2d1a0e" : "#fff7ed",
                border: `1px solid ${theme.border}`,
                borderRadius: "14px",
                padding: "16px",
              }}>
                <p style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "600", color: ORANGE }}>
                  🕉️ Aaj ka Shloka
                </p>
                <p style={{ margin: "0 0 6px", fontSize: "14px", color: theme.text, fontStyle: "italic" }}>
                  "योगः कर्मसु कौशलम्"
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: theme.sub }}>
                  Yoga is skill in action. — Bhagavad Gita 2.50
                </p>
              </div>
            </>
          )}

        </div>

        {/* Bottom Nav */}
        <nav style={s.nav}>
          {[
            { label: "Home", icon: "🏠", id: "home" },
            { label: "Add", icon: "➕", id: "add" },
            { label: "Timer", icon: "⏱️", id: "focus" },
            { label: "Eka", icon: "🌙", id: "ekadashi" },
            { label: "Report", icon: "📤", id: "report" },
            { label: "Insights", icon: "🤖", id: "insights" },
          ].map((n) => (
            <button
              key={n.id}
              style={screen === n.id ? s.navActive : s.navBtn}
              onClick={() => setScreen(n.id)}
            >
              <span style={{ fontSize: "18px" }}>{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>

      </div>
    </div>
  );
}

// ── Helper components ────────────────────────────────────────
function StatCard({ label, value, theme, s }) {
  return (
    <div style={s.card}>
      <p style={s.cardLabel}>{label}</p>
      <h2 style={s.cardValue}>{value}</h2>
    </div>
  );
}