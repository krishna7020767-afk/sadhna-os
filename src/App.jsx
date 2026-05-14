import { useState } from "react";

export default function App() {
  const [tasks, setTasks] = useState([
    { time: "4:00 AM", title: "Wake Up", done: false },
    { time: "4:00 - 4:30 AM", title: "Stomach Cleaning + Bath + Ready", done: false },
    { time: "4:30 - 5:00 AM", title: "Chanting - 4 Rounds", done: false },
    { time: "5:00 AM", title: "Mangala Arati", done: false },
    { time: "5:45 - 7:00 AM", title: "Japa - 9 Rounds", done: false },
    { time: "7:00 - 7:30 AM", title: "Reading", done: false },
    { time: "7:30 - 7:55 AM", title: "Chanting - 3 Rounds", done: false },
    { time: "7:55 - 8:15 AM", title: "Exercise", done: false },
    { time: "8:20 - 9:10 AM", title: "Bhagavatam Class", done: false },
    { time: "Before 9:30 AM", title: "Prasadam + Lecture Hearing", done: false },
    { time: "10:00 AM - 1:00 PM", title: "Job / Service Work", done: false },
    { time: "1:00 - 2:00 PM", title: "Lunch + 30 Min Reading", done: false },
    { time: "2:00 - 7:00 PM", title: "Job / Service Work", done: false },
    { time: "7:00 - 7:30 PM", title: "Dinner Prasadam", done: false },
    { time: "7:30 - 8:30 PM", title: "Evening Reading", done: false },
    { time: "8:30 - 9:00 PM", title: "Service / Seva", done: false },
  ]);

  const [newTime, setNewTime] = useState("");
  const [newTask, setNewTask] = useState("");
  const [notes, setNotes] = useState("");

  const completed = tasks.filter((t) => t.done).length;
  const progress = Math.round((completed / tasks.length) * 100);
  const score = Math.min(100, Math.round(progress * 1.1));
  const missed = tasks.filter((t) => !t.done);

  const toggleTask = (index) => {
    const updated = [...tasks];
    updated[index].done = !updated[index].done;
    setTasks(updated);
  };

  const addTask = () => {
    if (!newTime || !newTask) return;
    setTasks([...tasks, { time: newTime, title: newTask, done: false }]);
    setNewTime("");
    setNewTask("");
  };

  const reportText = `Hare Krishna Prabhuji 🙏
Today's Sadhana Report:
Progress: ${progress}%
Daily Score: ${score}/100
Completed: ${completed}/${tasks.length}

Notes:
${notes || "No notes added."}`;

  const sendWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(reportText)}`;
    window.open(url, "_blank");
  };

  return (
    <div style={styles.page}>
      <div style={styles.app}>
        <h1 style={styles.title}>Sadhana OS</h1>
        <p style={styles.subtitle}>Daily Krishna Conscious Engagement</p>

        <div style={styles.progressBox}>
          <div style={styles.row}>
            <strong>Daily Progress</strong>
            <strong>{progress}%</strong>
          </div>
          <div style={styles.bar}>
            <div style={{ ...styles.fill, width: `${progress}%` }} />
          </div>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <p>Daily Score</p>
            <h2>{score}</h2>
          </div>
          <div style={styles.card}>
            <p>24H Engagement</p>
            <h2>18h</h2>
          </div>
        </div>

        <h3 style={styles.sectionTitle}>Today’s Sadhana</h3>

        {tasks.map((task, index) => (
          <div key={index} style={task.done ? styles.taskDone : styles.task}>
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggleTask(index)}
            />
            <div>
              <small style={styles.time}>{task.time}</small>
              <p style={styles.taskTitle}>{task.title}</p>
            </div>
          </div>
        ))}

        <div style={styles.addBox}>
          <h3>Add New Sadhana</h3>
          <input
            style={styles.input}
            placeholder="Time e.g. 9:30 PM"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
          />
          <input
            style={styles.input}
            placeholder="Activity e.g. Extra Japa"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <button style={styles.orangeButton} onClick={addTask}>
            Add Activity
          </button>
        </div>

        <div style={styles.recoveryBox}>
          <h3>Missed Sadhana Recovery</h3>
          <p>{missed.length} activities pending today.</p>
          <small>
            Suggestion: Complete one missed activity before dinner or before sleep.
          </small>
        </div>

        <div style={styles.aiBox}>
          <h3>AI Discipline Suggestion</h3>
          <p>
            Protect your morning first. Avoid phone usage before Japa and keep
            lecture hearing active during bath, cleaning, and prasadam.
          </p>
        </div>

        <textarea
          style={styles.textarea}
          placeholder="Daily notes / realization / struggle..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button style={styles.whatsappButton} onClick={sendWhatsApp}>
          Send WhatsApp Report
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#fff7ed",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  app: {
    maxWidth: "430px",
    margin: "0 auto",
    background: "#ffffff",
    borderRadius: "28px",
    padding: "20px",
    boxShadow: "0 10px 35px rgba(0,0,0,0.12)",
  },
  title: {
    textAlign: "center",
    marginBottom: "4px",
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    fontSize: "14px",
    marginBottom: "20px",
  },
  progressBox: {
    background: "#fed7aa",
    padding: "16px",
    borderRadius: "20px",
    marginBottom: "16px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  bar: {
    height: "12px",
    background: "#fff",
    borderRadius: "20px",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    background: "#f97316",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "20px",
  },
  card: {
    background: "#ffedd5",
    padding: "15px",
    borderRadius: "18px",
    textAlign: "center",
  },
  sectionTitle: {
    marginTop: "10px",
  },
  task: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    background: "#fff",
    border: "1px solid #fed7aa",
    borderRadius: "16px",
    padding: "12px",
    marginBottom: "10px",
  },
  taskDone: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    background: "#dcfce7",
    border: "1px solid #86efac",
    borderRadius: "16px",
    padding: "12px",
    marginBottom: "10px",
  },
  time: {
    color: "#777",
  },
  taskTitle: {
    margin: "4px 0 0",
    fontWeight: "600",
  },
  addBox: {
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: "20px",
    padding: "15px",
    marginTop: "20px",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #fdba74",
    marginBottom: "10px",
    boxSizing: "border-box",
  },
  orangeButton: {
    width: "100%",
    background: "#f97316",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "14px",
    fontWeight: "bold",
  },
  recoveryBox: {
    background: "#fef3c7",
    padding: "15px",
    borderRadius: "18px",
    marginTop: "16px",
  },
  aiBox: {
    background: "#eef2ff",
    padding: "15px",
    borderRadius: "18px",
    marginTop: "16px",
  },
  textarea: {
    width: "100%",
    minHeight: "90px",
    padding: "12px",
    borderRadius: "16px",
    border: "1px solid #ddd",
    marginTop: "16px",
    boxSizing: "border-box",
  },
  whatsappButton: {
    width: "100%",
    background: "#22c55e",
    color: "#fff",
    border: "none",
    padding: "15px",
    borderRadius: "18px",
    fontSize: "16px",
    fontWeight: "bold",
    marginTop: "16px",
  },
};