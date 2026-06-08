// ════════════════════════════════════════════════════
//  QIBLA TABS
// ════════════════════════════════════════════════════
function switchQiblaTab(tab) {
  document.getElementById("qt-qibla-btn").classList.toggle("active", tab==="qibla");
  document.getElementById("qt-tasbih-btn").classList.toggle("active", tab==="tasbih");
  document.getElementById("qibla-content").style.display = tab==="qibla" ? "block" : "none";
  document.getElementById("qibla-tasbih-content").style.display = tab==="tasbih" ? "block" : "none";
  if (tab==="tasbih") renderTasbihPresets2();
}

// ════════════════════════════════════════════════════
//  TASBIH 2 (inside qibla page)
// ════════════════════════════════════════════════════
const TS2 = {count:0, presetIdx:0, total:33};

function renderTasbihPresets2() {
  const el = document.getElementById("tasbihPresets2");
  if (!el) return;
  el.innerHTML = TASBIH_PRESETS.map((p,i)=>`
    <div class="tasbih-preset-item ${i===TS2.presetIdx?'active':''}" onclick="selectTasbihPreset2(${i})">
      <div class="tp-name">${p.ar}</div>
      <div class="tp-count">${p.n}</div>
    </div>`).join("");
}

function selectTasbihPreset2(idx) {
  TS2.presetIdx = idx;
  TS2.count = 0;
  TS2.total = TASBIH_PRESETS[idx].n;
  updateTasbihUI2();
  renderTasbihPresets2();
}

function updateTasbihUI2() {
  const p = TASBIH_PRESETS[TS2.presetIdx];
  const circle = document.getElementById("tasbihCircle2");
  if (!circle) return;
  document.getElementById("tasbihCount2").textContent = TS2.count;
  document.getElementById("tasbihTotalShow2").textContent = "من "+TS2.total;
  document.getElementById("tasbihCurrentName2").textContent = p.ar;
  const pct = TS2.total > 0 ? TS2.count/TS2.total : 0;
  circle.style.background = `conic-gradient(var(--ac) ${pct*360}deg, var(--sf2) 0deg)`;
  circle.classList.toggle("complete", TS2.count >= TS2.total);
}

function tapTasbih2() {
  TS2.count++;
  const circle = document.getElementById("tasbihCircle2");
  if (circle) { circle.classList.add("tapped"); setTimeout(()=>circle.classList.remove("tapped"),120); }
  if (TS2.count >= TS2.total) {
    setTimeout(()=>nextTasbihPreset2(), 500);
  }
  updateTasbihUI2();
}

function resetTasbih2() {
  TS2.count = 0;
  updateTasbihUI2();
}

function undoTasbih2() {
  if (TS2.count > 0) { TS2.count--; updateTasbihUI2(); }
}

function nextTasbihPreset2() {
  TS2.presetIdx = (TS2.presetIdx+1) % TASBIH_PRESETS.length;
  TS2.count = 0;
  TS2.total = TASBIH_PRESETS[TS2.presetIdx].n;
  updateTasbihUI2();
  renderTasbihPresets2();
}
