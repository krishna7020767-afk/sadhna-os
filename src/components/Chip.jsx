import { useTheme } from "../theme";

export function Chip({ active, style, className, children, ...rest }) {
  const { C, accent, accentGradient } = useTheme();
  return (
    <button
      className={["pw-tap", className].filter(Boolean).join(" ")}
      style={{ padding: "9px 14px", borderRadius: 999, border: `1px solid ${active ? accent : C.line}`, background: active ? accentGradient : "transparent", color: active ? "#1a0e05" : C.text, fontWeight: 600, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap", minHeight: 40, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}
