import { useTheme } from "../theme";

export function Section({ title, action, onAction, children }) {
  const { accent } = useTheme();
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
        {action && (
          <button className="pw-tap" onClick={onAction} style={{ background: "none", border: "none", color: accent, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {action}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
