import { useTheme } from "../theme";

export function Toast({ message }) {
  const { C } = useTheme();
  if (!message) return null;
  return (
    <div
      style={{
        position: "fixed", bottom: 84, left: "50%", transform: "translateX(-50%)",
        background: C.cardRaised, color: C.text, padding: "12px 20px", borderRadius: 12,
        border: `1px solid ${C.line}`, fontSize: 14, fontWeight: 600, zIndex: 200,
        boxShadow: "0 4px 20px rgba(0,0,0,.35)", maxWidth: "88%", textAlign: "center",
        pointerEvents: "none",
      }}
    >
      {message}
    </div>
  );
}
