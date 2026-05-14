import { useState } from "react";

export default function App() {
  const [tasks, setTasks] = useState([
    { title: "Wake Up - 4 AM", done: false },
    { title: "4 Rounds Chanting", done: false },
    { title: "Mangala Arati", done: false },
    { title: "9 Rounds Japa", done: false },
    { title: "Morning Reading", done: false },
    { title: "Bhagavatam Class", done: false },
    { title: "Lunch Reading", done: false },
    { title: "Evening Reading", done: false },
    { title: "Service", done: false },
  ]);

  const completed = tasks.filter((t) => t.done).length;
  const progress = Math.round((completed / tasks.length) * 100);

  const toggleTask = (index) => {
    const updated = [...tasks];
    updated[index].done = !updated[index].done;
    setTasks(updated);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff7ed",
        padding: 20,
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          margin: "0 auto",
          background: "white",
          borderRadius: 25,
          padding: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ textAlign: "center" }}>Sadhana OS</h1>

        <div
          style={{
            background: "#fed7aa",
            padding: 15,
            borderRadius: 20,
            marginBottom: 20,
          }}
        >
          <h3>Daily Progress: {progress}%</h3>

          <div
            style={{
              background: "white",
              height: 12,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                background: "#f97316",
                height: "100%",
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              background: "#ffedd5",
              padding: 15,
              borderRadius: 20,
            }}
          >
            <p>Daily Score</p>
            <h2>{progress}</h2>
          </div>

          <div
            style={{
              background: "#ffedd5",
              padding: 15,
              borderRadius: 20,
            }}
          >
            <p>24H Engagement</p>
            <h2>18h</h2>
          </div>
        </div>

        {tasks.map((task, index) => (
          <div
            key={index}
            style={{
              background: task.done ? "#dcfce7" : "#fff",
              border: "1px solid #fed7aa",
              padding: 15,
              borderRadius: 20,
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggleTask(index)}
            />

            <span>{task.title}</span>
          </div>
        ))}

        <button
          style={{
            width: "100%",
            background: "#22c55e",
            color: "white",
            border: "none",
            padding: 15,
            borderRadius: 20,
            marginTop: 20,
            fontSize: 16,
          }}
        >
          Send WhatsApp Report
        </button>
      </div>
    </div>
  );
}