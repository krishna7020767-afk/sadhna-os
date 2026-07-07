import { useTheme } from "../theme";
import { Button } from "./Button";

export function ConfirmSheet({ open, message, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  const { C, danger } = useTheme();
  if (!open) return null;
  return (
    <div
      onClick={onCancel}
      style={{ position: "fixed", inset: 0, background: "rgba(10,6,2,.6)", backdropFilter: "blur(2px)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "pw-fade .18s ease-out" }}
    >
      <style>{`@keyframes pw-fade{from{opacity:0}to{opacity:1}} @keyframes pw-sheet-up{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: C.cardRaised, borderRadius: "22px 22px 0 0", padding: "22px 20px calc(20px + env(safe-area-inset-bottom))", width: "100%", maxWidth: 480, border: `1px solid ${C.line}`, borderBottom: "none", boxShadow: C.shadowLg, animation: "pw-sheet-up .22s ease-out" }}
      >
        <div style={{ color: C.text, fontSize: 15, marginBottom: 18 }}>{message}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button ghost onClick={onCancel} style={{ flex: 1 }}>{cancelLabel}</Button>
          <Button onClick={onConfirm} style={{ flex: 1, background: danger, boxShadow: "none" }}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
