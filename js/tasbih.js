// ════════════════════════════════════════════════════
//  TASBIH — السبحة المستقلة
// ════════════════════════════════════════════════════
const TS = {count:0, presetIdx:0, total:33};

function renderTasbihPresets() {
  const el = document.getElementById("tasbihPresets");
  if (!el) return;
  el.innerHTML = TASBIH_PRESETS.map((p,i) => `
    <div class="tasbih-preset ${i===TS.presetIdx?'selected':''}" onclick="selectTasbihPreset(${i})">
      <div class="tasbih-preset-ar">${p.ar}</div>
      <div class="tasbih-preset-n">${p.n} مرة</div>
    </div>`).join("");
  updateTasbihUI();
}

function selectTasbihPreset(i) {
  TS.presetIdx=i; TS.count=0; TS.total=TASBIH_PRESETS[i].n;
  renderTasbihPresets();
}

function tapTasbih() {
  TS.count++;
  const circle=document.getElementById("tasbihCircle");
  if (circle) {
    const pct = TS.total > 0 ? TS.count/TS.total : 0;
    circle.style.background = `conic-gradient(var(--ac) ${pct*360}deg, var(--sf2) 0deg)`;
    circle.classList.add("peak");
    setTimeout(()=>circle.classList.remove("peak"),120);
  }
  if(TS.count>=TS.total){
    TS.count=TS.total;
    setTimeout(()=>{
      TS.count=0;
      selectTasbihPreset((TS.presetIdx+1)%TASBIH_PRESETS.length);
    }, 600);
  }
  updateTasbihUI();
}

function resetTasbih() {
  TS.count=0;
  const circle=document.getElementById("tasbihCircle");
  if (circle) circle.style.background="";
  updateTasbihUI();
}

function undoTasbih() {
  if(TS.count>0){ TS.count--; updateTasbihUI(); }
  const circle=document.getElementById("tasbihCircle");
  if (circle) {
    const pct = TS.total > 0 ? TS.count/TS.total : 0;
    circle.style.background = TS.count > 0 ? `conic-gradient(var(--ac) ${pct*360}deg, var(--sf2) 0deg)` : "";
  }
}

function nextTasbihPreset() { selectTasbihPreset((TS.presetIdx+1)%TASBIH_PRESETS.length); }

function updateTasbihUI() {
  const c=document.getElementById("tasbihCount");
  const t=document.getElementById("tasbihTotalShow");
  const n=document.getElementById("tasbihCurrentName");
  if(c) c.textContent = TS.count;
  if(t) t.textContent = "من "+TS.total;
  if(n) n.textContent = TASBIH_PRESETS[TS.presetIdx].ar;
}
