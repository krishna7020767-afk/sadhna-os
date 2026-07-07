import { useTheme } from "../theme";

export function StatTile({ label, value, unit }) {
  const { C } = useTheme();
  return (
    <div style={{ flex: 1, background: C.bg, borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ fontSize: 11, color: C.sub }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 17, fontVariantNumeric: "tabular-nums" }}>
        {value}
        {unit && <span style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}> {unit}</span>}
      </div>
    </div>
  );
}
