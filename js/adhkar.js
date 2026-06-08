// ════════════════════════════════════════════════════
//  ADHKAR
// ════════════════════════════════════════════════════
const ADHKAR_FA_ICONS = {
  morning: "fa-solid fa-sun",
  evening: "fa-solid fa-moon",
  sleep: "fa-solid fa-bed",
  prayer: "fa-solid fa-person-praying",
  dua: "fa-solid fa-hands-praying",
};

function renderAdhkar() {
  const wrap = document.getElementById("adhkarContent");
  if (wrap.dataset.loaded) return;
  wrap.dataset.loaded = "1";
  wrap.innerHTML = `<div class="section-title"><i class="fa-solid fa-hands-praying"></i> الأذكار والأدعية</div>` +
    ADHKAR_CATS.map((cat, ci) => `
      <div class="adhkar-cat anim-item" style="animation-delay:${(ci % 10) * 0.05}s">
        <div class="adhkar-cat-hdr" onclick="toggleCat(${ci})">
          <div class="adhkar-cat-left">
            <div class="adhkar-cat-icon"><i class="${ADHKAR_FA_ICONS[cat.icon] || ADHKAR_FA_ICONS.dua}"></i></div>
            <div>
              <div class="adhkar-cat-title">${cat.title}</div>
              <div class="adhkar-cat-count">${cat.items.length} أذكار</div>
            </div>
          </div>
          <div class="toggle-arrow" id="ta-${ci}"><i class="fa-solid fa-chevron-down"></i></div>
        </div>
        <div class="adhkar-list" id="al-${ci}" style="display:none">
          ${cat.items.map((item, ii) => `
            <div class="adhkar-item" id="adi-${ci}-${ii}">
              <div class="adhkar-text">${item.text}</div>
              <div class="adhkar-footer">
                <div class="adhkar-src"><i class="fa-solid fa-book-open-reader"></i> ${item.src}</div>
                ${item.count > 1 ? `<div class="counter-wrap"><button class="counter-btn" id="cnt-${ci}-${ii}" onclick="tapCount(${ci},${ii},${item.count})">0 / ${item.count}</button><button class="reset-btn" onclick="resetCount(${ci},${ii})"><i class="fa-solid fa-rotate-right"></i></button></div>` : ""}
              </div>
            </div>`).join("")}
        </div>
      </div>`).join("");
}
const _cntMap = {};
function toggleCat(i) {
  const list = document.getElementById("al-" + i), arrow = document.getElementById("ta-" + i);
  const open = list.style.display !== "none";
  list.style.display = open ? "none" : "block";
  arrow.classList.toggle("open", !open);
}
function tapCount(ci, ii, max) {
  const key = `${ci}-${ii}`;
  _cntMap[key] = (_cntMap[key] || 0) + 1;
  const btn = document.getElementById(`cnt-${ci}-${ii}`);
  if (_cntMap[key] >= max) {
    _cntMap[key] = max;
    btn.textContent = `${max} / ${max}`;
    btn.classList.add("done-btn");
    document.getElementById(`adi-${ci}-${ii}`).classList.add("done");
  } else { btn.textContent = `${_cntMap[key]} / ${max}`; }
}
function resetCount(ci, ii) {
  const key = `${ci}-${ii}`;
  _cntMap[key] = 0;
  document.getElementById(`cnt-${ci}-${ii}`).textContent = `0 / ${document.getElementById(`cnt-${ci}-${ii}`).textContent.split("/")[1]}`;
  document.getElementById(`cnt-${ci}-${ii}`).classList.remove("done-btn");
  document.getElementById(`adi-${ci}-${ii}`).classList.remove("done");
}
