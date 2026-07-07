import { createContext, useContext } from "react";

export const accent = "#ff9933"; // saffron
export const accentDeep = "#e07b1f"; // saffron, pressed/hover
export const green = "#6fbf73"; // success
export const warn = "#e0a458"; // gentle "not done" — never red
export const danger = "#c8553d"; // destructive actions only

export const space = [4, 8, 12, 16, 24, 32];
export const radius = { card: 14, button: 12, pill: 999, input: 10 };

export function getPalette(dark) {
  return dark
    ? { bg: "#0f0a05", card: "#1a130a", cardRaised: "#241a0e", text: "#f5efe0", sub: "#b9a684", line: "#2e2314", elev: "#241a0e" }
    : { bg: "#fdf8f0", card: "#ffffff", cardRaised: "#fbf3e6", text: "#2a2118", sub: "#7a6f5e", line: "#ece2d0", elev: "#fbf3e6" };
}

export const ThemeContext = createContext({ C: getPalette(true), accent, green });
export const useTheme = () => useContext(ThemeContext);
