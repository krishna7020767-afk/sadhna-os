import { dateKey, addDays } from "./helpers";
import { BOOL_IDS } from "./constants";

export function dayMetric(data, key, k) {
  const lg = data.log?.[k] || {};
  const cu = data.custom?.[k] || [];
  switch (key) {
    case "rounds": return lg.chanting16 ? 16 : 0;
    case "reading": return Number(lg.reading) || 0;
    case "hearing": return Number(lg.hearingExtraDuration) || 0;
    case "mangala": return lg.mangalAarti ? 1 : 0;
    case "sadhna": return BOOL_IDS.filter((id) => lg[id]).length + cu.filter((c) => c.done).length;
    default: return 0;
  }
}
export function rangeMetric(data, key, days) {
  let sum = 0;
  for (let i = 0; i < days; i++) sum += dayMetric(data, key, dateKey(addDays(new Date(), -i)));
  return sum;
}
export function streakMetric(data, key, target) {
  let n = 0;
  for (let i = 0; i < 400; i++) {
    if (dayMetric(data, key, dateKey(addDays(new Date(), -i))) >= target) n++;
    else if (i === 0) continue; // today may not be done yet — don't break the streak on day 0
    else break;
  }
  return n;
}
