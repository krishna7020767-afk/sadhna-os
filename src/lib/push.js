import { supabase } from "../supabaseClient";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

// Subscribe this device to Web Push and store the subscription for the user.
// Safe to call repeatedly — upserts on the unique endpoint, so it also refreshes tz_offset.
export async function subscribeToPush(user) {
  try {
    if (!user || !VAPID_PUBLIC_KEY) return false;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    const j = sub.toJSON();
    const { error } = await supabase.from("push_subscriptions").upsert({
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: j.keys.p256dh,
      auth: j.keys.auth,
      tz_offset: -new Date().getTimezoneOffset(), // minutes to ADD to UTC to reach local time
    }, { onConflict: "endpoint" });
    if (error) { console.error("push subscribe save failed:", error.message); localStorage.removeItem("pushSubscribed"); return false; }
    // flag so the client-side reminder loops stand down — the server now owns these,
    // preventing a foreground device from double-firing alongside the push
    localStorage.setItem("pushSubscribed", "1");
    return true;
  } catch (e) {
    console.error("push subscribe failed:", e);
    localStorage.removeItem("pushSubscribed");
    return false;
  }
}
