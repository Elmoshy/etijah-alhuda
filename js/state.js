// ════════════════════════════════════════════════════
//  APP STATE
// ════════════════════════════════════════════════════
const APP = {
  theme: localStorage.getItem("theme") || "dark",
  country: localStorage.getItem("country") || "",
  city: localStorage.getItem("city") || "",
  lat: parseFloat(localStorage.getItem("lat")) || null,
  lng: parseFloat(localStorage.getItem("lng")) || null,
  dst: localStorage.getItem("dst") === "1",
  dhikrIdx: 0,
  currentPrayers: null,
  alarmMinutes: parseInt(localStorage.getItem("alarmMinutes") || "10"),
  alarmPrayers: JSON.parse(localStorage.getItem("alarmPrayers") || '{"fajr":true,"dhuhr":true,"asr":true,"maghrib":true,"isha":true}'),
  alarmTimer: null,
  hijriOffset: parseInt(localStorage.getItem("hijriOffset") || "0"),
};

const AUDIO = { reciter: null, surah: null, playing: false, audio: null };
const RADIO = { playing: false, audio: document.getElementById("radioAudio") };

// ════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════
window.onload = () => {
  document.body.className = APP.theme;
  updateDateTime();
  setInterval(updateDateTime, 1000);
  fillCountries();
  renderDhikrCard();
  if (APP.country) restoreSelects();
  restoreDSTUI();
  restoreAlarmUI();
  scheduleAlarms();
  renderTasbihPresets();
};

// ════════════════════════════════════════════════════
//  DATE & TIME
// ════════════════════════════════════════════════════
function getHijriDate(baseDate) {
  const d = new Date(baseDate.getTime() + APP.hijriOffset * 86400000);
  return d;
}

function updateDateTime() {
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes();
  const ampm = h >= 12 ? "م" : "ص";
  const hh = h % 12 || 12;
  document.getElementById("heroTime").textContent = hh + ":" + String(m).padStart(2, "0") + " " + ampm;

  const gregStr = now.toLocaleDateString("ar-EG", { weekday: "short", month: "short", day: "numeric" });
  document.getElementById("gregDisplay").textContent = gregStr;
  document.getElementById("heroGreg").textContent = gregStr;

  try {
    const hijriDate = getHijriDate(now);
    const weekday = new Intl.DateTimeFormat("ar-SA", { weekday: "long" }).format(now);
    const hijri = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", { year: "numeric", month: "long", day: "numeric" }).format(hijriDate);
    const fullHijri = weekday + "، " + hijri;
    document.getElementById("hijriDisplay").textContent = fullHijri;
    document.getElementById("heroHijri").textContent = fullHijri;
  } catch (e) { }

  updateCountdown();
}

function updateCountdown() {
  if (!APP.currentPrayers) return;
  const wrap = document.getElementById("countdownWrap");
  const timerEl = document.getElementById("countdownTimer");
  const nameEl = document.getElementById("countdownName");
  if (!wrap) return;

  const now = new Date();
  const nowS = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const prayersOnly = APP.currentPrayers.filter(p => p.key !== "sunrise");
  let nextP = null, minDiff = Infinity;
  for (const p of prayersOnly) {
    const [ph, pm] = p.time.split(":").map(Number);
    let diff = ph * 3600 + pm * 60 - nowS;
    if (diff < 0) diff += 86400;
    if (diff < minDiff) { minDiff = diff; nextP = p; }
  }
  if (!nextP) { wrap.style.display = "none"; return; }
  wrap.style.display = "block";
  const hh = Math.floor(minDiff / 3600), mm = Math.floor((minDiff % 3600) / 60), ss = minDiff % 60;
  timerEl.textContent = String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0");
  nameEl.textContent = nextP.name;
  timerEl.classList.toggle("urgent", minDiff < 600);
}
