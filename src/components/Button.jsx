import { useTheme } from "../theme";

export function Button({ ghost, style, className, children, ...rest }) {
  const { C, accentGradient } = useTheme();
  const base = ghost
    ? { background: C.elev, color: C.text, border: `1px solid ${C.line}`, padding: "13px 18px", borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: "pointer", minHeight: 44 }
    : { background: accentGradient, color: "#1a0e05", border: "none", padding: "14px 20px", borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 48, boxShadow: "0 6px 16px rgba(255,153,51,.28)" };
  return (
    <button className={["pw-tap", className].filter(Boolean).join(" ")} style={{ ...base, ...style }} {...rest}>
      {children}
    </button>
  );
}
