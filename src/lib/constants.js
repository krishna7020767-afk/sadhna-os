/* Permanent / fixed sadhna items */
export const FIXED = [
  { id: "mangalAarti", en: "Mangal Aarti", hi: "मंगल आरती", type: "time" },
  { id: "wakeTime", en: "Wake-up / Morning walk", hi: "उठने / मॉर्निंग वॉक", type: "time" },
  { id: "chanting16", en: "Chanting — 16 rounds", hi: "जप — 16 माला", type: "bool" },
  { id: "chantingFinishTime", en: "Chanting finished at", hi: "जप समाप्त समय", type: "time" },
  { id: "reading", en: "Reading (minutes)", hi: "पठन (मिनट)", type: "number" },
  { id: "hearingSB", en: "SB class heard", hi: "भागवतम् क्लास सुनी", type: "bool" },
  { id: "hearingExtra", en: "Extra lecture heard", hi: "अतिरिक्त प्रवचन सुना", type: "bool" },
  { id: "hearingExtraDuration", en: "Extra lecture duration (min)", hi: "अतिरिक्त प्रवचन अवधि (मिनट)", type: "number", show: (log) => log.hearingExtra },
  { id: "exercise", en: "Exercise", hi: "व्यायाम", type: "bool" },
  { id: "exerciseDuration", en: "Exercise duration (min)", hi: "व्यायाम अवधि (मिनट)", type: "number", show: (log) => log.exercise },
];
export const BOOL_IDS = FIXED.filter((f) => f.type === "bool").map((f) => f.id);

/* Goal metrics — derived from the daily log (no schema change) */
export const METRICS = {
  rounds: { en: "Chanting rounds", hi: "जप माला", unit: "", target: 16 },
  reading: { en: "Reading", hi: "पठन", unit: "min", target: 30 },
  hearing: { en: "Hearing", hi: "श्रवण", unit: "min", target: 30 },
  mangala: { en: "Morning program", hi: "मंगल आरती", unit: "", target: 1 },
  sadhna: { en: "Sadhna items done", hi: "साधना कार्य", unit: "", target: BOOL_IDS.length },
};

/* Tiny translation map */
export const T = {
  home: { en: "Home", hi: "होम" },
  timers: { en: "Timers", hi: "टाइमर" },
  goals: { en: "Goals", hi: "लक्ष्य" },
  reports: { en: "Reports", hi: "रिपोर्ट" },
  insights: { en: "Insights", hi: "विश्लेषण" },
  notifications: { en: "Notifications", hi: "सूचनाएं" },
  todaySadhna: { en: "Today's Sadhna", hi: "आज की साधना" },
  progress: { en: "Today's Progress", hi: "आज की प्रगति" },
  done: { en: "Done", hi: "पूर्ण" },
  pending: { en: "Pending", hi: "बाकी" },
  logout: { en: "Logout", hi: "लॉगआउट" },
  customize: { en: "Customize", hi: "अनुकूलित करें" },
  doneEditing: { en: "Done", hi: "पूर्ण" },
  addWidget: { en: "Add widget", hi: "विजेट जोड़ें" },
};
export const tr = (k, lang) => (T[k] ? T[k][lang] : k);

/* Quote + Photo pairs */
export const QUOTES = [
  { text: "So far as controlling 'kama' or lust, best thing is don't eat any highly spiced food stuffs and always think of Krishna. Chant regularly.", ref: "Letter to Niranjana - Calcutta 27 May, 1971", img: "/p1.jpg" },
  { text: "If you think of Krishna twenty-four hours, Krishna will think of you twenty-six hours. (laughter) Krishna is so kind. If you do some service for Krishna, Krishna will reward you hundred times.", ref: "Srila Prabhupada Lecture SB 01.14.44 - New York", img: "/p2.jpg" },
  { text: "The disciple's duty is to be ready always to serve the spiritual master, at any cost.", ref: "Los Angeles, June 23, 1972", img: "/p3.jpg" },
  { text: "Hold my hand and I promise to take you back to Krishna!", ref: "Srila Prabhupada", img: "/p4.jpg" },
  { text: "Even after trying our best, if we fail, Krishna will help us. Just like a child tries his best, but he falls down. The mother takes up and 'All right, come on. Walk' Like that!", ref: "Morning Walk March 23, 1968", img: "/p5.jpg" },
  { text: "Without attentive hearing our Japa will become mechanical and tasteless. Chant your Japa with utmost attention.", ref: "Srila Prabhupada", img: "/p6.jpg" },
  { text: "But work hard here. Not that eating, sleeping. No. That cannot be done. They must be engaged twenty-four hours. That is wanted. It is not a lazy free hotel. Anyone who lives here, must be engaged twenty-four hours.", ref: "REF: Room Conversation - September 5, 1976, Vrindavana", img: "/p7.jpg" },
  { text: "Obedience is the first discipline. If you do not obey the representative, authority, then there cannot be any discipline. Then everything will be topsy-turvy.", ref: "REF: Room Conversation - Vrindavana, March 16, 1974", img: "/p8.jpg" },
  { text: "The best devotee sees, 'Everyone is better than me'. Just like Caitanya-caritamrta's author, Krsnadasa Kaviraja says: jagāi mādhāi haite muñi se pāpistha purisera kita haite muni se laghista", ref: "Srila Prabhupada", img: "/p9.jpg" },
  { text: "Let us all obey the Supreme Lord, whose hand is in everything, without exception.", ref: "Ref: Srimad Bhagavatam 2.10.51 Purport", img: "/p10.jpg" },
  { text: "The argument that 'We do not see Krsna personally. How we can satisfy Him?'... You satisfy your spiritual master, then Krsna is pleased. Yasya prasādād bhagavat-prasādo yasyāprasādāt...", ref: "REF: SB.1.5.23 — Vrindavana, August 4, 1974", img: "/p11.jpg" },
  { text: "Chanting Hare Krishna is our life and soul. Without chanting, we cannot live. Just like a fish cannot live without water.", ref: "Srila Prabhupada", img: "/p12.jpg" },
  { text: "The spiritual master is the transparent via medium to Krishna. If you keep the via medium transparent, then you'll be able to see Krishna.", ref: "Srila Prabhupada", img: "/p13.jpg" },
];

export const EMPTY = { log: {}, custom: {}, notes: [], settings: {}, timers: [], goals: [], widgets: [], templates: [], runs: {} };
export const DEFAULT_TIMERS = [
  { id: "japa", name: "Japa", mode: "stopwatch", duration: 0 },
  { id: "reading", name: "Reading", mode: "stopwatch", duration: 0 },
  { id: "hearing", name: "Hearing", mode: "stopwatch", duration: 0 },
  { id: "kirtan", name: "Kirtan", mode: "stopwatch", duration: 0 },
];
export const WIDGET_META = {
  progress: { en: "Progress", hi: "प्रगति" },
  japa: { en: "Today's Japa", hi: "आज का जप" },
  reading: { en: "Reading", hi: "पठन" },
  goals: { en: "Goals", hi: "लक्ष्य" },
  quicktimer: { en: "Quick Timer", hi: "त्वरित टाइमर" },
  activity: { en: "Recent Activity", hi: "हाल की गतिविधि" },
  calendar: { en: "Calendar", hi: "कैलेंडर" },
};
export const DEFAULT_WIDGETS = ["progress", "japa", "reading", "goals", "quicktimer"];
export const DEFAULT_TEMPLATE = {
  id: "std",
  name: "Standard",
  text: "Hare Krishna Prabhu 🙏\nDandwat Pranam\n\nSadhna Report — {date}\n\n{tasks}\n\nAll glories to Srila Prabhupada 🙏",
};
