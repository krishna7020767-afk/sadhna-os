import { createContext, useContext } from "react";

export const accent = "#ff9933"; // saffron
export const accentDeep = "#e0672b"; // saffron, pressed/hover
export const accentGradient = "linear-gradient(135deg, #ffb057 0%, #ff9933 55%, #e0672b 100%)";
export const green = "#6fbf73"; // success
export const warn = "#e0a458"; // gentle "not done" — never red
export const danger = "#c8553d"; // destructive actions only

export const space = [4, 8, 12, 16, 24, 32];
export const radius = { card: 18, button: 14, pill: 999, input: 12 };
export const fontDisplay = "'Fraunces', ui-serif, Georgia, serif";
export const fontBody = "'Manrope', system-ui, -apple-system, 'Segoe UI', sans-serif";

export function getPalette(dark) {
  return dark
    ? {
        bg: "#100a05", card: "#1c140b", cardRaised: "#251a0e", text: "#f7f1e3", sub: "#b5a181", line: "#302511", elev: "#271c10",
        shadowSm: "0 1px 3px rgba(0,0,0,.35)", shadowMd: "0 8px 24px rgba(0,0,0,.4)", shadowLg: "0 16px 40px rgba(0,0,0,.5)",
      }
    : {
        bg: "#fdf8f0", card: "#ffffff", cardRaised: "#fbf3e6", text: "#241b10", sub: "#7a6c56", line: "#ece1cd", elev: "#f8efdd",
        shadowSm: "0 1px 3px rgba(120,72,20,.07)", shadowMd: "0 8px 24px rgba(120,72,20,.1)", shadowLg: "0 20px 48px rgba(120,72,20,.16)",
      };
}

export const ThemeContext = createContext({
  C: getPalette(true), accent, accentDeep, accentGradient, green, warn, danger,
});
export const useTheme = () => useContext(ThemeContext);
