// ════════════════════════════════════════════════════
//  SETTINGS
// ════════════════════════════════════════════════════
function updateSettingsDate() {
  const now = new Date();
  const hijriDate = getHijriDate(now);
  try {
    const weekday = new Intl.DateTimeFormat("ar-SA", { weekday: "long" }).format(now);
    const hijri = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", { year: "numeric", month: "long", day: "numeric" }).format(hijriDate);
    document.getElementById("settingsHijriDate").textContent = weekday + "، " + hijri;
  } catch (e) { }
  document.getElementById("settingsGregDate").textContent = now.toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  updatePrOffUI();
}

function adjustPrOff(key, delta) {
  const off = JSON.parse(localStorage.getItem("prayer_offsets") || '{"fajr":0,"sunrise":0,"dhuhr":0,"asr":0,"maghrib":0,"isha":0}');
  off[key] = (off[key] || 0) + delta;
  localStorage.setItem("prayer_offsets", JSON.stringify(off));
  updatePrOffUI();
  if (typeof fetchPrayers === 'function') fetchPrayers();
}

function resetPrayerOffsets() {
  const off = { "fajr": 0, "sunrise": 0, "dhuhr": 0, "asr": 0, "maghrib": 0, "isha": 0 };
  localStorage.setItem("prayer_offsets", JSON.stringify(off));
  updatePrOffUI();
  if (typeof fetchPrayers === 'function') fetchPrayers();
}

function updatePrOffUI() {
  const off = JSON.parse(localStorage.getItem("prayer_offsets") || '{"fajr":0,"sunrise":0,"dhuhr":0,"asr":0,"maghrib":0,"isha":0}');
  Object.keys(off).forEach(k => {
    const el = document.getElementById("off-" + k);
    if (el) el.textContent = (off[k] > 0 ? "+" : "") + off[k];
  });
}

function adjustHijri(delta) {
  APP.hijriOffset += delta;
  localStorage.setItem("hijriOffset", APP.hijriOffset);
  updateSettingsDate();
  updateDateTime();
  // Update offset display
  const disp = document.getElementById("hijriOffsetDisplay");
  if (disp) disp.textContent = APP.hijriOffset === 0 ? "تلقائي" : (APP.hijriOffset > 0 ? "+" : "") + APP.hijriOffset + " يوم";
}
function resetHijriOffset() {
  APP.hijriOffset = 0;
  localStorage.setItem("hijriOffset", "0");
  updateSettingsDate();
  updateDateTime();
  const disp = document.getElementById("hijriOffsetDisplay");
  if (disp) disp.textContent = "تلقائي";
}
function toggleDST() {
  APP.dst = !APP.dst; localStorage.setItem("dst", APP.dst ? "1" : "0"); restoreDSTUI();
  if (APP.lat && APP.lng) fetchPrayers();
}
function restoreHijriDisplay() {
  const disp = document.getElementById("hijriOffsetDisplay");
  if (disp) disp.textContent = APP.hijriOffset === 0 ? "تلقائي" : (APP.hijriOffset > 0 ? "+" : "") + APP.hijriOffset + " يوم";
}
function restoreDSTUI() {
  const btn = document.getElementById("dstBtn"), s = document.getElementById("dstStatus");
  if (!btn) return;
  if (APP.dst) { btn.textContent = "إيقاف"; btn.classList.add("dst-active"); s.textContent = "✅ مفعّل (+60 دقيقة)"; s.style.color = "var(--gr)"; }
  else { btn.textContent = "تفعيل"; btn.classList.remove("dst-active"); s.textContent = "معطّل"; s.style.color = "var(--tx3)"; }
}
function saveAlarmSettings() {
  APP.alarmMinutes = parseInt(document.getElementById("alarmMinutes").value);
  APP.alarmPrayers = { fajr: document.getElementById("alarm-fajr").checked, dhuhr: document.getElementById("alarm-dhuhr").checked, asr: document.getElementById("alarm-asr").checked, maghrib: document.getElementById("alarm-maghrib").checked, isha: document.getElementById("alarm-isha").checked };
  localStorage.setItem("alarmMinutes", APP.alarmMinutes);
  localStorage.setItem("alarmPrayers", JSON.stringify(APP.alarmPrayers));
  scheduleAlarms();
}
function restoreAlarmUI() {
  const s = document.getElementById("alarmMinutes"); if (s) s.value = APP.alarmMinutes;
  ["fajr", "dhuhr", "asr", "maghrib", "isha"].forEach(k => { const el = document.getElementById("alarm-" + k); if (el) el.checked = APP.alarmPrayers[k] !== false; });
}
function testAlarm() {
  reqNotif(() => new Notification("🔔 اتجاه الهدى", { body: "هذا اختبار للتنبيه!" }));
}
function reqNotif(cb) {
  if (!("Notification" in window)) { alert("متصفحك لا يدعم الإشعارات"); return; }
  if (Notification.permission === "granted") { cb(); return; }
  Notification.requestPermission().then(p => { if (p === "granted") cb(); });
}
function scheduleAlarms() {
  if (APP.alarmTimer) clearInterval(APP.alarmTimer);
  APP.alarmTimer = setInterval(checkAlarms, 30000);
}
function checkAlarms() {
  if (!APP.currentPrayers || APP.alarmMinutes === 0) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const now = new Date(); const nowMins = now.getHours() * 60 + now.getMinutes();
  const keyMap = { "الفجر": "fajr", "الظهر": "dhuhr", "العصر": "asr", "المغرب": "maghrib", "العشاء": "isha" };
  APP.currentPrayers.forEach(p => {
    const key = keyMap[p.name]; if (!key || !APP.alarmPrayers[key]) return;
    const [ph, pm] = p.time.split(":").map(Number);
    const trigger = ph * 60 + pm - APP.alarmMinutes;
    if (nowMins === trigger) {
      const ak = "notif_" + p.name + "_" + now.toDateString() + "_" + trigger;
      if (!sessionStorage.getItem(ak)) { sessionStorage.setItem(ak, "1"); new Notification("🕌 " + p.name + " بعد " + APP.alarmMinutes + " دقيقة", { body: "موعد صلاة " + p.name + " الساعة " + fmtTime(p.time), tag: ak }); }
    }
  });
}
