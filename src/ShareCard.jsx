import { useRef } from "react";

const ORANGE = "#f97316";

export default function ShareCard({ user, progress, score, streak, completedCount, totalCount, date, onClose }) {
  const cardRef = useRef(null);

  const dateStr = new Date(date).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  const shareViaWhatsApp = async () => {
    try {
      // Use html2canvas to capture the card
      const html2canvas = (await import("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      canvas.toBlob((blob) => {
        const file = new File([blob], "sadhana-report.png", { type: "image/png" });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: "Sadhana Report",
            text: "All Glories to Srila Prabhupada! 🙏",
          });
        } else {
          // Fallback — download image
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "sadhana-report.png";
          a.click();
          URL.revokeObjectURL(url);
          alert("Image downloaded! Ab WhatsApp par manually share karo.");
        }
      }, "image/png");
    } catch (err) {
      console.error(err);
      // Simple text fallback
      const text = `🙏 All Glories to Srila Prabhupada!\n\n👤 ${user?.displayName || "Devotee"}\n📅 ${dateStr}\n\n✅ Progress: ${progress}%\n🏆 Score: ${score}/100\n✔️ Done: ${completedCount}/${totalCount}\n🔥 Streak: ${streak} days\n\n_Sadhana OS_`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9998,
      background: "rgba(0,0,0,0.7)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>

      {/* Card */}
      <div ref={cardRef} style={{
        width: "320px",
        background: "linear-gradient(135deg, #1a0a00 0%, #2d1200 50%, #1a0a00 100%)",
        borderRadius: "20px",
        overflow: "hidden",
        position: "relative",
        border: "1px solid rgba(249,115,22,0.4)",
      }}>

        {/* Top image strip */}
        <div style={{
          height: "140px",
          position: "relative",
          overflow: "hidden",
        }}>
          <img
            src="/prabhupada1.jpg"
            alt="Srila Prabhupada"
            crossOrigin="anonymous"
            style={{
              width: "100%", height: "100%",
              objectFit: "cover",
              filter: "brightness(0.6)",
            }}
          />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, transparent 30%, #1a0a00 100%)",
          }} />
          <div style={{
            position: "absolute", bottom: "12px", left: "16px", right: "16px",
          }}>
            <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em" }}>SADHANA OS</p>
            <p style={{ margin: "2px 0 0", fontSize: "15px", fontWeight: "700", color: ORANGE }}>
              All Glories to Srila Prabhupada
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px 20px" }}>

          {/* User + date */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            {user?.photoURL && (
              <img src={user.photoURL} alt="profile" crossOrigin="anonymous"
                style={{ width: "36px", height: "36px", borderRadius: "50%", border: `2px solid ${ORANGE}` }} />
            )}
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#fff" }}>{user?.displayName || "Devotee"}</p>
              <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{dateStr}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>DAILY PROGRESS</p>
              <p style={{ margin: 0, fontSize: "12px", fontWeight: "700", color: ORANGE }}>{progress}%</p>
            </div>
            <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "99px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${ORANGE}, #ea580c)`, borderRadius: "99px" }} />
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
            {[
              { label: "SCORE", value: `${score}/100`, icon: "🏆" },
              { label: "STREAK", value: `${streak} days`, icon: "🔥" },
              { label: "COMPLETED", value: `${completedCount}/${totalCount}`, icon: "✅" },
              { label: "STATUS", value: progress === 100 ? "Perfect!" : progress >= 50 ? "Good 💪" : "Keep going!", icon: "⭐" },
            ].map((stat, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: "10px",
                padding: "10px 12px",
                border: "1px solid rgba(249,115,22,0.2)",
              }}>
                <p style={{ margin: "0 0 2px", fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>{stat.label}</p>
                <p style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#fff" }}>{stat.icon} {stat.value}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
            🙏 Hare Krishna • Sadhana OS
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "12px", marginTop: "16px", width: "320px" }}>
        <button
          onClick={shareViaWhatsApp}
          style={{
            flex: 1, padding: "14px",
            background: "#16a34a", color: "#fff",
            border: "none", borderRadius: "12px",
            fontSize: "15px", fontWeight: "600", cursor: "pointer",
          }}
        >
          📲 Share
        </button>
        <button
          onClick={onClose}
          style={{
            flex: 1, padding: "14px",
            background: "rgba(255,255,255,0.1)", color: "#fff",
            border: "1px solid rgba(255,255,255,0.2)", borderRadius: "12px",
            fontSize: "15px", fontWeight: "600", cursor: "pointer",
          }}
        >
          ✕ Close
        </button>
      </div>
    </div>
  );
}