import { useTheme } from "../theme";

export function Button({ ghost, style, children, ...rest }) {
  const { C, accent } = useTheme();
  const base = ghost
    ? { background: C.elev, color: C.text, border: `1px solid ${C.line}`, padding: "13px 18px", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer", minHeight: 44 }
    : { background: accent, color: "#1a0e05", border: "none", padding: "14px 20px", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 48 };
  return (
    <button style={{ ...base, ...style }} {...rest}>
      {children}
    </button>
  );
}
