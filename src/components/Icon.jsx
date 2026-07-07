/* SVG icon set (structural nav — no emoji) */
const ICONS = {
  home: "M3 11l9-8 9 8M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10",
  timer: "M12 22a9 9 0 100-18 9 9 0 000 18M12 8v5l3 2M9 2h6",
  goal: "M12 22a10 10 0 100-20 10 10 0 000 20M12 17a5 5 0 100-10 5 5 0 000 10M12 12h.01",
  report: "M4 4h16v12H5.2L4 17.2zM8 9h8M8 12.5h5",
  menu: "M4 6h16M4 12h16M4 18h16",
  plus: "M12 5v14M5 12h14",
  x: "M6 6l12 12M18 6L6 18",
  bell: "M6 8a6 6 0 1112 0c0 7 3 7 3 7H3s3 0 3-7M9.5 21a2.5 2.5 0 005 0",
  share: "M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13",
  up: "M6 15l6-6 6 6",
  down: "M6 9l6 6 6-6",
  chart: "M4 20V4M4 20h16M8 16v-5M13 16V8M18 16v-9",
  moon: "M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z",
  sun: "M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4M12 8a4 4 0 100 8 4 4 0 000-8z",
  note: "M5 3h11l3 3v15H5zM9 8h6M9 12h6M9 16h4",
  ai: "M12 3a4 4 0 014 4v1a4 4 0 010 8v1a4 4 0 01-8 0v-1a4 4 0 010-8V7a4 4 0 014-4zM9 9h.01M15 9h.01",
  logout: "M9 21H5a1 1 0 01-1-1V4a1 1 0 011-1h4M16 17l5-5-5-5M21 12H9",
  play: "M7 4l13 8-13 8z",
  pause: "M7 5h4v14H7zM13 5h4v14h-4z",
  reset: "M3 12a9 9 0 109-9 9 9 0 00-7 3.5M3 3v4h4",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14",
  check: "M4 12l5 5L20 6",
};

export function Icon({ name, size = 22, color = "currentColor", w = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={ICONS[name] || ""} />
    </svg>
  );
}

export function Ring({ pct, size = 68, stroke = 7, color, track, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(1, Math.max(0, pct / 100)));
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: "stroke-dashoffset .5s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
        {children}
      </div>
    </div>
  );
}
