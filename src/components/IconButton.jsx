import { useTheme } from "../theme";

export function IconButton({ style, children, ...rest }) {
  const { C } = useTheme();
  return (
    <button
      style={{ background: C.elev, border: `1px solid ${C.line}`, color: C.text, borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}
