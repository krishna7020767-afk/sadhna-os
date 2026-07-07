import { useTheme } from "../theme";
import { Button } from "./Button";

export function EmptyState({ text, actionLabel, onAction }) {
  const { C } = useTheme();
  return (
    <div style={{ textAlign: "center", color: C.sub, padding: "40px 20px" }}>
      <div style={{ fontSize: 15, marginBottom: actionLabel ? 16 : 0 }}>{text}</div>
      {actionLabel && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button onClick={onAction} style={{ width: "auto", padding: "0 20px" }}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
}
