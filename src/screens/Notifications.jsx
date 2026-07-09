import { useState } from "react";
import { useApp } from "../appContext";
import { useTheme, fontDisplay } from "../theme";
import { tr } from "../lib/constants";
import { notify } from "../lib/helpers";
import { subscribeToPush } from "../lib/push";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Toggle } from "../components/Toggle";

export function Notifications() {
  const { S, lang, data, saveSetting, user } = useApp();
  const { C } = useTheme();
  const [perm, setPerm] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
  const req = async () => {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") {
      saveSetting({ notificationsEnabled: true });
      notify("Notifications on 🙏", "You'll get sadhana & timer reminders.");
      subscribeToPush(user); // register this device for background push
    }
  };
  const s = data.settings || {};
  return (
    <div style={{ padding: "6px 0 8px" }}>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: fontDisplay, padding: "8px 14px" }}>{tr("notifications", lang)}</div>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700 }}>{lang === "hi" ? "ब्राउज़र सूचनाएं" : "Browser notifications"}</div>
            <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>{perm === "granted" ? (lang === "hi" ? "सक्षम" : "Enabled") : perm === "denied" ? (lang === "hi" ? "ब्राउज़र में अवरुद्ध" : "Blocked in browser") : (lang === "hi" ? "अनुमति चाहिए" : "Permission needed")}</div>
          </div>
          {perm !== "granted" && <Button onClick={req} style={{ width: "auto", padding: "0 18px" }}>{lang === "hi" ? "चालू करें" : "Enable"}</Button>}
        </div>
        <div style={{ ...S.row, marginTop: 8 }}>
          <span>{lang === "hi" ? "लक्ष्य रिमाइंडर" : "Goal reminders"}</span>
          <Toggle on={!!s.notificationsEnabled} onChange={(v) => saveSetting({ notificationsEnabled: v })} />
        </div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 8 }}>{lang === "hi" ? "टाइमर पूरा होने और लक्ष्य छूटने पर सूचना। सक्षम करने पर ऐप बंद होने पर भी पृष्ठभूमि में काम करता है (Android व iOS 16.4+ में होम-स्क्रीन पर इंस्टॉल किया हो)।" : "Fires on timer completion and missed goals. Once enabled, background push keeps working even when the app is closed (Android, and iOS 16.4+ when installed to your home screen)."}</div>
      </Card>

      <Card>
        <div style={S.sectionTitle}>{lang === "hi" ? "साधना रिपोर्ट रिमाइंडर" : "Send Sadhana Report reminder"}</div>
        <div style={S.row}>
          <span>{lang === "hi" ? "सक्षम करें" : "Enable"}</span>
          <Toggle on={!!s.autoSendEnabled} onChange={(v) => saveSetting({ autoSendEnabled: v })} />
        </div>
        {s.autoSendEnabled && (
          <>
            <div style={S.row}>
              <span>{lang === "hi" ? "समय (रोज़ाना)" : "Time (daily)"}</span>
              <input type="time" value={s.autoSendTime || "20:00"} onChange={(e) => saveSetting({ autoSendTime: e.target.value })} onClick={(e) => e.target.showPicker?.()} style={{ ...S.input, width: "auto" }} />
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, color: C.sub, marginBottom: 6 }}>{lang === "hi" ? "सूचना शीर्षक" : "Notification title"}</div>
              <input value={s.autoSendTitle ?? ""} onChange={(e) => saveSetting({ autoSendTitle: e.target.value })} placeholder={lang === "hi" ? "साधना रिपोर्ट भेजें 🙏" : "Send your Sadhana Report 🙏"} style={S.input} />
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, color: C.sub, marginBottom: 6 }}>{lang === "hi" ? "सूचना संदेश" : "Notification message"}</div>
              <input value={s.autoSendMessage ?? ""} onChange={(e) => saveSetting({ autoSendMessage: e.target.value })} placeholder={lang === "hi" ? "आज की साधना रिपोर्ट भेजने का समय।" : "Time to send your daily Sadhana Report."} style={S.input} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
