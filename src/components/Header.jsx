import { useApp } from "../appContext";
import { useTheme } from "../theme";
import { IconButton } from "./IconButton";
import { Icon } from "./Icon";

export function Header({ title }) {
  const { S, setDrawer, lang, user, dark, toggleDark } = useApp();
  const { accent } = useTheme();
  return (
    <div style={S.head}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <IconButton aria-label="Menu" onClick={() => setDrawer(true)}><Icon name="menu" /></IconButton>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{title || `${lang === "hi" ? "हरे कृष्ण" : "Hare Krishna"}, ${user.displayName?.split(" ")[0] || ""}`}</div>
          <div style={{ fontSize: 11, color: accent }}>All Glories to Srila Prabhupada</div>
        </div>
      </div>
      <IconButton aria-label="Theme" onClick={toggleDark}><Icon name={dark ? "sun" : "moon"} /></IconButton>
    </div>
  );
}
