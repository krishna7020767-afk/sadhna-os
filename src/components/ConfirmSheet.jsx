import { useTheme } from "../theme";
import { Button } from "./Button";

export function ConfirmSheet({ open, message, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  const { C, danger } = useTheme();
  if (!open) return null;
  return (
    <div
      onClick={onCancel}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: C.cardRaised, borderRadius: "18px 18px 0 0", padding: "20px 20px calc(20px + env(safe-area-inset-bottom))", width: "100%", maxWidth: 480, border: `1px solid ${C.line}`, borderBottom: "none" }}
      >
        <div style={{ color: C.text, fontSize: 15, marginBottom: 18 }}>{message}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button ghost onClick={onCancel} style={{ flex: 1 }}>{cancelLabel}</Button>
          <Button onClick={onConfirm} style={{ flex: 1, background: danger }}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
