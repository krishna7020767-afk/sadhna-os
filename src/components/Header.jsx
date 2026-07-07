import { useApp } from "../appContext";
import { useTheme, fontDisplay } from "../theme";
import { IconButton } from "./IconButton";
import { Icon } from "./Icon";

export function Header({ title }) {
  const { S, setDrawer, lang, user, dark, toggleDark } = useApp();
  const { accent } = useTheme();
  return (
    <div style={S.head}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <IconButton aria-label="Menu" onClick={() => setDrawer(true)}><Icon name="menu" /></IconButton>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, fontFamily: fontDisplay, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title || `${lang === "hi" ? "हरे कृष्ण" : "Hare Krishna"}, ${user.displayName?.split(" ")[0] || ""}`}</div>
          <div style={{ fontSize: 11, color: accent, fontWeight: 600 }}>All Glories to Srila Prabhupada</div>
        </div>
      </div>
      <IconButton aria-label="Theme" onClick={toggleDark}><Icon name={dark ? "sun" : "moon"} /></IconButton>
    </div>
  );
}
