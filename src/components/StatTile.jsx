import { useTheme } from "../theme";

export function StatTile({ label, value, unit }) {
  const { C } = useTheme();
  return (
    <div style={{ flex: 1, background: C.bg, borderRadius: 12, padding: "12px 12px", border: `1px solid ${C.line}` }}>
      <div style={{ fontSize: 11, color: C.sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 18, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
        {value}
        {unit && <span style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}> {unit}</span>}
      </div>
    </div>
  );
}
