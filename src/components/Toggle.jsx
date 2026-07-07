import { useTheme } from "../theme";

export function Toggle({ on, onChange }) {
  const { C, accentGradient } = useTheme();
  return (
    <div
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{ width: 46, height: 28, borderRadius: 999, background: on ? accentGradient : C.line, position: "relative", cursor: "pointer", transition: "background .2s ease", flexShrink: 0 }}
    >
      <div style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "left .2s ease", boxShadow: "0 1px 3px rgba(0,0,0,.3)" }} />
    </div>
  );
}
