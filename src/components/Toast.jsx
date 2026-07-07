import { useTheme } from "../theme";

export function Toast({ message }) {
  const { C } = useTheme();
  if (!message) return null;
  return (
    <div
      style={{
        position: "fixed", bottom: 84, left: "50%", transform: "translateX(-50%)",
        background: C.cardRaised, color: C.text, padding: "12px 20px", borderRadius: 14,
        border: `1px solid ${C.line}`, fontSize: 14, fontWeight: 600, zIndex: 200,
        boxShadow: C.shadowLg, maxWidth: "88%", textAlign: "center",
        pointerEvents: "none", animation: "pw-toast-in .25s ease-out",
      }}
    >
      <style>{`@keyframes pw-toast-in{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
      {message}
    </div>
  );
}
