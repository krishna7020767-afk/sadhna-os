import { useTheme } from "../theme";

export function ProgressBar({ pct, color, height = 8 }) {
  const { C, accentGradient } = useTheme();
  const p = Math.min(100, Math.max(0, pct));
  return (
    <div style={{ height, background: C.bg, borderRadius: 5, overflow: "hidden" }}>
      <div style={{ width: p + "%", height: "100%", background: color || accentGradient, transition: "width .4s ease" }} />
    </div>
  );
}
