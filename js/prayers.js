// ════════════════════════════════════════════════════
//  CITY / PRAYER
// ════════════════════════════════════════════════════
function fillCountries() {
  const sel = document.getElementById("countrySelect");
  Object.keys(COUNTRIES).forEach(c => {
    const o = document.createElement("option"); o.value = c; o.textContent = c; sel.appendChild(o);
  });
}
function onCountryChange() {
  const c = document.getElementById("countrySelect").value;
  APP.country = c; localStorage.setItem("country", c);
  const cSel = document.getElementById("citySelect");
  cSel.innerHTML = '<option value="">— المدينة —</option>';
  if (!c) return;
  Object.keys(COUNTRIES[c].cities).forEach(ct => {
    const o = document.createElement("option"); o.value = ct; o.textContent = ct; cSel.appendChild(o);
  });
}
function onCityChange() {
  const city = document.getElementById("citySelect").value;
  if (!city) return;
  APP.city = city;
  const coords = COUNTRIES[APP.country].cities[city];
  APP.lat = coords[0]; APP.lng = coords[1];
  localStorage.setItem("city", city); localStorage.setItem("lat", APP.lat); localStorage.setItem("lng", APP.lng);
  document.getElementById("heroLocation").innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="var(--ac)"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg> ${city}، ${APP.country}`;
  fetchPrayers();
}
function restoreSelects() {
  const cSel = document.getElementById("countrySelect");
  cSel.value = APP.country;
  onCountryChange();
  setTimeout(() => {
    document.getElementById("citySelect").value = APP.city;
    if (APP.lat && APP.lng) fetchPrayers();
  }, 50);
}

// Prayer icons SVG paths
const PRAYER_FA_ICONS = {
  fajr: "fa-solid fa-cloud-sun",
  sunrise: "fa-solid fa-sun",
  dhuhr: "fa-solid fa-sun",
  asr: "fa-solid fa-sun-plant-wilt",
  maghrib: "fa-solid fa-cloud-moon",
  isha: "fa-solid fa-moon",
};

async function fetchPrayers() {
  if (!APP.lat || !APP.lng) return;
  const wrap = document.getElementById("prayerTimes");
  wrap.innerHTML = '<div class="loader">جاري تحميل المواقيت...</div>';
  try {
    const d = new Date(), dd = d.getDate(), mm = d.getMonth() + 1, yy = d.getFullYear();

    // Determine method based on country
    let method = 5; // Default: Egypt
    const c = APP.country;
    if (c === "السعودية") method = 4; // Umm Al-Qura
    else if (c === "الإمارات" || c === "البحرين" || c === "عُمان" || c === "قطر") method = 8; // Gulf
    else if (c === "الكويت") method = 9;
    else if (c === "قطر" && method !== 8) method = 10;
    else if (c && !["مصر", "السعودية", "الإمارات", "البحرين", "عُمان", "قطر", "الكويت"].includes(c)) method = 3; // Muslim World League as fallback

    const url = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yy}?latitude=${APP.lat}&longitude=${APP.lng}&method=${method}`;
    const res = await fetch(url);
    const data = await res.json();
    const t = data.data.timings;
    const offsets = JSON.parse(localStorage.getItem("prayer_offsets") || '{"fajr":0,"sunrise":0,"dhuhr":0,"asr":0,"maghrib":0,"isha":0}');

    // Helper to apply offset
    const applyOff = (timeStr, off) => {
      if (!off) return cleanTime(timeStr);
      const [h, m] = cleanTime(timeStr).split(":").map(Number);
      let total = h * 60 + m + off;
      if (total < 0) total += 1440;
      return String(Math.floor(total / 60) % 24).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
    };

    let prayers = [
      { name: "الفجر", time: applyOff(t.Fajr, offsets.fajr), key: "fajr" },
      { name: "الشروق", time: applyOff(t.Sunrise, offsets.sunrise), key: "sunrise" },
      { name: "الظهر", time: applyOff(t.Dhuhr, offsets.dhuhr), key: "dhuhr" },
      { name: "العصر", time: applyOff(t.Asr, offsets.asr), key: "asr" },
      { name: "المغرب", time: applyOff(t.Maghrib, offsets.maghrib), key: "maghrib" },
      { name: "العشاء", time: applyOff(t.Isha, offsets.isha), key: "isha" },
    ];

    if (APP.dst) prayers = prayers.map(p => {
      const [h, m] = p.time.split(":").map(Number);
      const total = h * 60 + m + 60;
      return { ...p, time: String(Math.floor(total / 60) % 24).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0") };
    });

    APP.currentPrayers = prayers;
    scheduleAlarms();

    const nowM = d.getHours() * 60 + d.getMinutes();
    const nextIdx = prayers.findIndex((p, i) => { const [h, m] = p.time.split(":").map(Number); return h * 60 + m > nowM; });

    wrap.innerHTML = `<div class="prayer-grid">${prayers.map((p, i) => `
      <div class="prayer-card anim-item ${i === nextIdx ? 'next-prayer' : ''}" style="animation-delay:${i * 0.05}s">
        <div class="p-icon"><i class="${PRAYER_FA_ICONS[p.key] || PRAYER_FA_ICONS.dhuhr}"></i></div>
        <div class="prayer-name">${p.name}</div>
        <div class="prayer-time">${fmtTime(p.time)}</div>
        ${i === nextIdx ? '<div class="next-badge">القادمة</div>' : ''}
      </div>`).join("")}</div>`;
  } catch (e) {
    wrap.innerHTML = '<div class="error-msg">⚠️ تعذّر تحميل المواقيت</div>';
  }
}

function cleanTime(tStr) {
  if (!tStr) return "00:00";
  return tStr.split(" ")[0]; // takes "05:14" out of "05:14 (EET)"
}

function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "م" : "ص"}`;
}

// ════════════════════════════════════════════════════
//  DHIKR CARD
// ════════════════════════════════════════════════════
function renderDhikrCard() { showDhikr(APP.dhikrIdx); renderDots(); }
function showDhikr(idx) {
  const d = HOME_ADHKAR[idx];
  document.getElementById("dcLabel").textContent = d.cat;
  document.getElementById("dcText").textContent = d.text;
  document.getElementById("dcSrc").innerHTML = `<svg viewBox="0 0 24 24"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z"/></svg> ${d.src}`;
}
function renderDots() {
  document.getElementById("dcDots").innerHTML = HOME_ADHKAR.map((_, i) =>
    `<span class="dot ${i === APP.dhikrIdx ? 'active' : ''}" onclick="goDhikr(${i})"></span>`
  ).join("");
}
function nextDhikr() { APP.dhikrIdx = (APP.dhikrIdx + 1) % HOME_ADHKAR.length; showDhikr(APP.dhikrIdx); renderDots(); }
function prevDhikr() { APP.dhikrIdx = (APP.dhikrIdx - 1 + HOME_ADHKAR.length) % HOME_ADHKAR.length; showDhikr(APP.dhikrIdx); renderDots(); }
function goDhikr(i) { APP.dhikrIdx = i; showDhikr(i); renderDots(); }
