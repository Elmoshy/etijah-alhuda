// ════════════════════════════════════════════════════
//  NAVIGATION & ANIMATIONS
// ════════════════════════════════════════════════════
const PAGE_ORDER = ["home", "quran", "adhkar", "tasbih", "qibla", "calendar", "settings"];

function nav(page, animClass = null) {
  const activePg = document.querySelector(".page.active");
  const actId = activePg ? activePg.id.replace('page-', '') : null;
  const oldIdx = PAGE_ORDER.indexOf(actId);
  const newIdx = PAGE_ORDER.indexOf(page);

  if (!animClass && oldIdx !== -1 && newIdx !== -1) {
    animClass = newIdx > oldIdx ? 'slide-left' : 'slide-right';
  } else if (!animClass) {
    animClass = 'fade';
  }

  document.querySelectorAll(".page").forEach(p => {
    p.classList.remove("active", "slide-left", "slide-right", "fade");
  });
  document.querySelectorAll(".ni").forEach(b => b.classList.remove("active"));

  const pg = document.getElementById("page-" + page);
  if (pg) {
    // force reflow for animation restart
    void pg.offsetWidth;
    pg.classList.add("active", animClass);
  }

  const btn = document.getElementById("nav-" + page);
  if (btn) btn.classList.add("active");

  if (page === "quran") { initQuranPage(); }
  if (page === "adhkar") { renderAdhkar(); }
  if (page === "calendar") { renderCalendar(); renderCalInner(); }
  if (page === "tasbih") { renderTasbihPresets(); }
  if (page === "qibla") { renderTasbihPresets2(); }
  if (page === "settings") { updateSettingsDate(); restoreDSTUI(); restoreAlarmUI(); restoreHijriDisplay(); }
}

// ════════════════════════════════════════════════════
//  SWIPE GESTURES
// ════════════════════════════════════════════════════
let touchStartX = 0, touchStartY = 0;
document.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener('touchend', e => {
  const touchEndX = e.changedTouches[0].screenX;
  const touchEndY = e.changedTouches[0].screenY;
  const xDiff = touchEndX - touchStartX;
  const yDiff = touchEndY - touchStartY;

  // Ignore if scrolling vertically more than horizontally
  if (Math.abs(yDiff) > Math.abs(xDiff) * 1.5) return;

  if (Math.abs(xDiff) > 70) {
    const activePg = document.querySelector('.page.active');
    if (!activePg) return;
    const pgId = activePg.id.replace('page-', '');

    // Internal Quran Tabs Swipe
    if (pgId === "quran" && document.getElementById("qp-main").style.display !== "none") {
      const tabs = ["mushaf", "juz", "browse", "audio"];
      const tIdx = tabs.indexOf(qtMode);
      if (xDiff < 0 && tIdx < tabs.length - 1) { switchQT(tabs[tIdx + 1]); return; }
      else if (xDiff > 0 && tIdx > 0) { switchQT(tabs[tIdx - 1]); return; }
    }

    // Quran Reader Swipe (Swipe Right to Go Back)
    if (document.getElementById("qp-reader").style.display === "block") {
      if (xDiff > 100) { closeReader(); return; }
      return; // prevent main nav swipe while in reader
    }

    const idx = PAGE_ORDER.indexOf(pgId);
    if (idx === -1) return;

    if (xDiff < -70 && idx < PAGE_ORDER.length - 1) {
      nav(PAGE_ORDER[idx + 1], 'slide-left');
    } else if (xDiff > 70 && idx > 0) {
      nav(PAGE_ORDER[idx - 1], 'slide-right');
    }
  }
}, { passive: true });

// ════════════════════════════════════════════════════
//  RIPPLE EFFECT
// ════════════════════════════════════════════════════
document.addEventListener('click', function (e) {
  const btn = e.target.closest('button, .qibla-tab, .tab, .surah-card, .juz-card, .adhkar-cat-hdr, .tasbih-preset, .radio-station, .cal-tab, .audio-item');
  if (!btn) return;

  const rect = btn.getBoundingClientRect();
  const circle = document.createElement('span');
  const d = Math.max(btn.clientWidth, btn.clientHeight);

  circle.style.width = circle.style.height = d + 'px';
  circle.style.left = e.clientX - rect.left - d / 2 + 'px';
  circle.style.top = e.clientY - rect.top - d / 2 + 'px';
  circle.classList.add('ripple-span');

  if (!btn.classList.contains('touch-ripple')) {
    btn.classList.add('touch-ripple');
  }

  const existing = btn.querySelector('.ripple-span');
  if (existing) existing.remove();

  btn.appendChild(circle);
  setTimeout(() => { if (circle.parentNode) circle.remove(); }, 600);
});

// ════════════════════════════════════════════════════
//  THEME
// ════════════════════════════════════════════════════
function toggleTheme() {
  APP.theme = APP.theme === "dark" ? "light" : "dark";
  document.body.className = APP.theme;
  localStorage.setItem("theme", APP.theme);
}
