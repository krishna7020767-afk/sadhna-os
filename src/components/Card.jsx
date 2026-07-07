import { useTheme } from "../theme";

export function Card({ style, children, ...rest }) {
  const { C } = useTheme();
  return (
    <div
      style={{ background: C.card, borderRadius: 18, padding: 16, margin: "12px 14px", border: `1px solid ${C.line}`, boxShadow: C.shadowSm, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
