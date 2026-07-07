import { useTheme } from "../theme";

export function Card({ style, children, ...rest }) {
  const { C } = useTheme();
  return (
    <div
      style={{ background: C.card, borderRadius: 14, padding: 16, margin: "12px 14px", border: `1px solid ${C.line}`, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
