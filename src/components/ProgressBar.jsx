import { useTheme } from "../theme";

export function ProgressBar({ pct, color, height = 8 }) {
  const { C, accent } = useTheme();
  const p = Math.min(100, Math.max(0, pct));
  return (
    <div style={{ height, background: C.bg, borderRadius: 5, overflow: "hidden" }}>
      <div style={{ width: p + "%", height: "100%", background: color || accent, transition: "width .4s" }} />
    </div>
  );
}
