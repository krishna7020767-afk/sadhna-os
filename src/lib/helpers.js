export function mapUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    displayName: u.user_metadata?.full_name || u.user_metadata?.name || u.email || "",
    photoURL: u.user_metadata?.avatar_url || u.user_metadata?.picture || "",
  };
}
export function dateKey(d = new Date()) {
  return (
    d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0")
  );
}
export function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}
export function prettyDate(key) {
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
export function fmtHMS(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const p = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${p(h)}:${p(m)}:${p(ss)}` : `${p(m)}:${p(ss)}`;
}
