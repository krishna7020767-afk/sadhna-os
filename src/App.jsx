import { useEffect, useState } from "react";
import { db, auth } from './firebase'; // Firebase import
import { db, auth } from './firebase'; // Firebase import


const defaultTasks = [
  { time: "4:00 AM", title: "Wake Up", category: "Morning", done: false },
  { time: "4:00 - 4:30 AM", title: "Cleaning + Bath + Ready", category: "Morning", done: false },
  { time: "4:30 - 5:00 AM", title: "Chanting - 4 Rounds", category: "Japa", done: false },
  { time: "5:00 AM", title: "Mangala Arati", category: "Temple", done: false },
  { time: "5:45 - 7:00 AM", title: "Japa - 9 Rounds", category: "Japa", done: false },
  { time: "7:00 - 7:30 AM", title: "Reading", category: "Reading", done: false },
  { time: "7:30 - 7:55 AM", title: "Chanting - 3 Rounds", category: "Japa", done: false },
  { time: "7:55 - 8:15 AM", title: "Exercise", category: "Health", done: false },
  { time: "8:20 - 9:10 AM", title: "Bhagavatam Class", category: "Hearing", done: false },
  { time: "Before 9:30 AM", title: "Prasadam + Lecture", category: "Prasadam", done: false },
  { time: "10:00 AM - 1:00 PM", title: "Job / Service Work", category: "Work", done: false },
  { time: "1:00 - 2:00 PM", title: "Lunch + 30 Min Reading", category: "Reading", done: false },
  { time: "2:00 - 7:00 PM", title: "Job / Service Work", category: "Work", done: false },
  { time: "7:00 - 7:30 PM", title: "Dinner Prasadam", category: "Prasadam", done: false },
  { time: "7:30 - 8:30 PM", title: "Evening Reading", category: "Reading", done: false },
  { time: "8:30 - 9:00 PM", title: "Service / Seva", category: "Seva", done: false },
];

export default function App() {
  const [screen, setScreen] = useState("home");
  const [dark, setDark] = useState(false);
  const [tasks, setTasks] = useState(defaultTasks);
  const [newTime, setNewTime] = useState("");
  const [newTask, setNewTask] = useState("");
  const [notes, setNotes] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [reminders, setReminders] = useState(true);
  const [streak, setStreak] = useState(3);

  useEffect(() => {
    const saved = localStorage.getItem("sadhana-v3");
    if (saved) {
      const data = JSON.parse(saved);
      setTasks(data.tasks || defaultTasks);
      setNotes(data.notes || "");
      setDark(data.dark || false);
      setStreak(data.streak || 3);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "sadhana-v3",
      JSON.stringify({ tasks, notes, dark, streak })
    );
  }, [tasks, notes, dark, streak]);

  const completed = tasks.filter((t) => t.done).length;
  const progress = Math.round((completed / tasks.length) * 100);
  const score = Math.min(100, Math.round(progress * 1.1));
  const pending = tasks.length - completed;

  const toggleTask = (index) => {
    const updated = [...tasks];
    updated[index].done = !updated[index].done;
    setTasks(updated);
  };

  const addTask = () => {
    if (!newTime || !newTask) return;
    setTasks([
      ...tasks,
      { time: newTime, title: newTask, category: "Custom", done: false },
    ]);
    setNewTime("");
    setNewTask("");
  };

  const resetDay = () => {
    setTasks(tasks.map((t) => ({ ...t, done: false })));
    setNotes("");
  };

  const sendWhatsApp = () => {
    const report = `Hare Krishna Prabhuji 🙏

Today's Sadhana Report:
Progress: ${progress}%
Daily Score: ${score}/100
Completed: ${completed}/${tasks.length}
Pending: ${pending}

Notes:
${notes || "No notes added."}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, "_blank");
  };

  const theme = dark ? darkTheme : lightTheme;

  return (
    <div style={{ ...styles.page, background: theme.bg, color: theme.text }}>
      <div style={{ ...styles.phone, background: theme.card }}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Sadhana OS</h1>
            <p style={styles.subtitle}>Personal Krishna Conscious Tracker</p>
          </div>
          <button style={styles.iconBtn} onClick={() => setDark(!dark)}>
            {dark ? "☀️" : "🌙"}
          </button>
        </header>

        {screen === "home" && (
          <>
            <div style={styles.hero}>
              <p style={styles.label}>Daily Progress</p>
              <h2 style={styles.big}>{progress}%</h2>
              <div style={styles.bar}>
                <div style={{ ...styles.fill, width: `${progress}%` }} />
              </div>
            </div>

            <div style={styles.grid}>
              <Card title="Score" value={`${score}/100`} />
              <Card title="Streak" value={`${streak} Days`} />
              <Card title="Pending" value={pending} />
              <Card title="Engagement" value="18h" />
            </div>

            <div style={styles.section}>
              <h3>Today’s Sadhana</h3>
              {tasks.map((task, index) => (
                <div key={index} style={task.done ? styles.doneTask : styles.task}>
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(index)}
                  />
                  <div>
                    <small>{task.time} • {task.category}</small>
                    <p>{task.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {screen === "add" && (
          <div style={styles.section}>
            <h2>Add / Customize Sadhana</h2>
            <input
              style={styles.input}
              placeholder="Time e.g. 9:30 PM"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
            <input
              style={styles.input}
              placeholder="Activity e.g. Extra 4 Rounds"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
            <button style={styles.orangeBtn} onClick={addTask}>Add Activity</button>
            <button style={styles.grayBtn} onClick={resetDay}>Reset Today</button>
          </div>
        )}

        {screen === "insights" && (
          <div style={styles.section}>
            <h2>AI Assistant</h2>
            <div style={styles.aiBox}>
              <h3>Today’s Suggestion</h3>
              <p>
                Morning is your strongest foundation. Protect phone usage before
                Japa, keep lecture hearing during bath/cleaning/prasadam, and recover
                one pending task before sleep.
              </p>
            </div>

            <h3>Sadhana Chart</h3>
            <div style={styles.chart}>
              {[45, 60, 52, 78, 70, progress].map((v, i) => (
                <div key={i} style={styles.chartItem}>
                  <div style={{ ...styles.chartBar, height: `${v}%` }} />
                  <small>D{i + 1}</small>
                </div>
              ))}
            </div>

            <div style={styles.recovery}>
              <h3>Missed Recovery Mode</h3>
              <p>{pending} pending activities. Complete 1 before dinner and 1 before sleep.</p>
            </div>
          </div>
        )}

        {screen === "ekadashi" && (
          <div style={styles.section}>
            <h2>Ekadashi Dashboard</h2>
            <div style={styles.ekaCard}>
              <p style={styles.label}>Special Mode</p>
              <h2>Extra Japa + No Grain</h2>
              <p>Track fasting, extra rounds, reading, and parana reminder.</p>
            </div>

            {["No Grain", "Extra 16 Rounds", "Ekadashi Katha", "Less Phone Use", "Parana Reminder"].map((x, i) => (
              <div key={i} style={styles.task}>
                <input type="checkbox" />
                <p>{x}</p>
              </div>
            ))}
          </div>
        )}

        {screen === "focus" && (
          <div style={styles.section}>
            <h2>Japa Focus Mode</h2>
            <div style={focusMode ? styles.focusOn : styles.focusOff}>
              <h3>{focusMode ? "Focus Mode Active" : "Focus Mode Off"}</h3>
              <p>
                During Japa, avoid Instagram, Shorts, unnecessary browsing, and chat distractions.
              </p>
            </div>
            <button style={styles.orangeBtn} onClick={() => setFocusMode(!focusMode)}>
              {focusMode ? "Stop Focus Mode" : "Start Focus Mode"}
            </button>

            <div style={styles.aiBox}>
              <h3>Reminder Settings</h3>
              <p>Mock reminders are {reminders ? "ON" : "OFF"}.</p>
              <button style={styles.grayBtn} onClick={() => setReminders(!reminders)}>
                Toggle Reminders
              </button>
            </div>
          </div>
        )}

        {screen === "report" && (
          <div style={styles.section}>
            <h2>Daily Report</h2>
            <textarea
              style={styles.textarea}
              placeholder="Daily notes / realization / struggle..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button style={styles.whatsappBtn} onClick={sendWhatsApp}>
              Send WhatsApp Report
            </button>
          </div>
        )}

        <nav style={styles.nav}>
          <Nav label="Home" icon="🏠" active={screen === "home"} onClick={() => setScreen("home")} />
          <Nav label="Add" icon="➕" active={screen === "add"} onClick={() => setScreen("add")} />
          <Nav label="AI" icon="🤖" active={screen === "insights"} onClick={() => setScreen("insights")} />
          <Nav label="Eka" icon="🌙" active={screen === "ekadashi"} onClick={() => setScreen("ekadashi")} />
          <Nav label="Focus" icon="🧘" active={screen === "focus"} onClick={() => setScreen("focus")} />
          <Nav label="Report" icon="📤" active={screen === "report"} onClick={() => setScreen("report")} />
        </nav>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={styles.card}>
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

function Nav({ label, icon, active, onClick }) {
  return (
    <button onClick={onClick} style={active ? styles.navActive : styles.navBtn}>
      <span>{icon}</span>
      <small>{label}</small>
    </button>
  );
}

const lightTheme = {
  bg: "#fff7ed",
  card: "#ffffff",
  text: "#1f2937",
};

const darkTheme = {
  bg: "#111827",
  card: "#1f2937",
  text: "#f9fafb",
};

const styles = {
  page: {
    minHeight: "100vh",
    padding: 16,
    fontFamily: "Arial, sans-serif",
  },
  phone: {
    maxWidth: 430,
    margin: "0 auto",
    minHeight: "92vh",
    borderRadius: 32,
    padding: 18,
    boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
    paddingBottom: 90,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { margin: 0, fontSize: 28 },
  subtitle: { marginTop: 4, color: "#777", fontSize: 13 },
  iconBtn: {
    border: "none",
    borderRadius: 999,
    padding: 12,
    fontSize: 18,
    background: "#ffedd5",
  },
  hero: {
    background: "linear-gradient(135deg,#fb923c,#f97316)",
    color: "white",
    borderRadius: 28,
    padding: 20,
    marginTop: 18,
  },
  label: { fontSize: 13, opacity: 0.85 },
  big: { fontSize: 42, margin: "8px 0" },
  bar: {
    height: 12,
    background: "rgba(255,255,255,0.45)",
    borderRadius: 30,
    overflow: "hidden",
  },
  fill: { height: "100%", background: "white", borderRadius: 30 },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: 14,
  },
  card: {
    background: "#ffedd5",
    borderRadius: 22,
    padding: 15,
    textAlign: "center",
    color: "#1f2937",
  },
  section: { marginTop: 22 },
  task: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    background: "#fff7ed",
    color: "#1f2937",
    border: "1px solid #fed7aa",
    borderRadius: 18,
    padding: 13,
    marginBottom: 10,
  },
  doneTask: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    background: "#dcfce7",
    color: "#1f2937",
    border: "1px solid #86efac",
    borderRadius: 18,
    padding: 13,
    marginBottom: 10,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: 14,
    borderRadius: 16,
    border: "1px solid #fdba74",
    marginBottom: 12,
  },
  orangeBtn: {
    width: "100%",
    background: "#f97316",
    color: "white",
    border: "none",
    padding: 15,
    borderRadius: 18,
    fontWeight: "bold",
    marginTop: 8,
  },
  grayBtn: {
    width: "100%",
    background: "#e5e7eb",
    color: "#111827",
    border: "none",
    padding: 14,
    borderRadius: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
  aiBox: {
    background: "#eef2ff",
    color: "#1f2937",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  recovery: {
    background: "#fef3c7",
    color: "#1f2937",
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
  },
  chart: {
    height: 160,
    display: "flex",
    alignItems: "end",
    gap: 10,
    background: "#fff7ed",
    borderRadius: 22,
    padding: 15,
  },
  chartItem: {
    flex: 1,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "end",
    alignItems: "center",
  },
  chartBar: {
    width: "100%",
    background: "#fb923c",
    borderRadius: "14px 14px 4px 4px",
  },
  ekaCard: {
    background: "linear-gradient(135deg,#7c3aed,#c084fc)",
    color: "white",
    borderRadius: 26,
    padding: 20,
    marginBottom: 16,
  },
  focusOn: {
    background: "#dcfce7",
    color: "#1f2937",
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  focusOff: {
    background: "#fee2e2",
    color: "#1f2937",
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  textarea: {
    width: "100%",
    minHeight: 150,
    boxSizing: "border-box",
    borderRadius: 18,
    padding: 14,
    border: "1px solid #ddd",
  },
  whatsappBtn: {
    width: "100%",
    background: "#22c55e",
    color: "white",
    border: "none",
    padding: 16,
    borderRadius: 20,
    fontWeight: "bold",
    marginTop: 14,
  },
  nav: {
    position: "fixed",
    left: "50%",
    bottom: 14,
    transform: "translateX(-50%)",
    width: "min(430px, calc(100% - 24px))",
    background: "#ffffff",
    borderRadius: 24,
    padding: 8,
    display: "grid",
    gridTemplateColumns: "repeat(6,1fr)",
    gap: 4,
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
  },
  navBtn: {
    border: "none",
    background: "transparent",
    padding: 8,
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    color: "#555",
  },
  navActive: {
    border: "none",
    background: "#ffedd5",
    padding: 8,
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    color: "#f97316",
    fontWeight: "bold",
  },
};