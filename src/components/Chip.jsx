import { useTheme } from "../theme";

export function Chip({ active, style, children, ...rest }) {
  const { C, accent } = useTheme();
  return (
    <button
      style={{ padding: "9px 14px", borderRadius: 999, border: `1px solid ${active ? accent : C.line}`, background: active ? accent : "transparent", color: active ? "#1a0e05" : C.text, fontWeight: 600, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap", ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}
