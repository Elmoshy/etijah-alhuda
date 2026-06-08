// ════════════════════════════════════════════════════
//  CALENDAR
// ════════════════════════════════════════════════════
const CAL={mode:"gregorian",gregYear:new Date().getFullYear(),gregMonth:new Date().getMonth(),hijriYear:0,hijriMonth:0};

function toHijri(date) {
  try{const p=new Intl.DateTimeFormat("en-u-ca-islamic-umalqura",{year:"numeric",month:"numeric",day:"numeric"}).formatToParts(date);const g=t=>parseInt(p.find(x=>x.type===t)?.value||"0");return{y:g("year"),m:g("month"),d:g("day")};}catch(e){return{y:0,m:0,d:0};}
}

function renderCalendar() {
  const wrap = document.getElementById("calendarContent");
  if (wrap.dataset.init) return;
  wrap.dataset.init = "1";
  const today = new Date(); const todayH = toHijri(today);
  CAL.hijriYear = todayH.y; CAL.hijriMonth = todayH.m - 1;
  wrap.innerHTML = `
    <div class="cal-tabs">
      <div class="cal-tab active" id="ct-greg" onclick="switchCal('gregorian')">ميلادي</div>
      <div class="cal-tab" id="ct-hijri" onclick="switchCal('hijri')">هجري</div>
    </div>
    <div class="cal-wrap"><div id="calInner"></div></div>`;
}

function switchCal(m) {
  CAL.mode=m;
  document.getElementById("ct-greg").classList.toggle("active",m==="gregorian");
  document.getElementById("ct-hijri").classList.toggle("active",m==="hijri");
  renderCalInner();
}

function renderCalInner() {
  const wrap = document.getElementById("calInner");
  if (!wrap) return;
  if (CAL.mode==="gregorian") renderGregCal(wrap);
  else renderHijriCal(wrap);
}

function renderGregCal(wrap) {
  const today=new Date(), y=CAL.gregYear, m=CAL.gregMonth;
  const firstDay=new Date(y,m,1).getDay();
  const daysInMonth=new Date(y,m+1,0).getDate();
  const dayNames=["أحد","اثنين","ثلاثاء","أربعاء","خميس","جمعة","سبت"];
  let html=`<div class="cal-nav">
    <button class="cal-nav-btn" onclick="prevCalMonth()"><svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg></button>
    <div><div class="cal-month-title">${GREG_MONTHS[m]} ${y}</div></div>
    <button class="cal-nav-btn" onclick="nextCalMonth()"><svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg></button>
  </div>
  <div class="cal-grid">${dayNames.map(d=>`<div class="cal-day-name">${d}</div>`).join("")}`;
  for(let i=0;i<firstDay;i++) html+=`<div class="cal-cell empty"></div>`;
  for(let d=1;d<=daysInMonth;d++){
    const date=new Date(y,m,d); const h=toHijri(date);
    const isToday=d===today.getDate()&&m===today.getMonth()&&y===today.getFullYear();
    const isFri=date.getDay()===5;
    const isEvent=ISLAMIC_EVENTS.some(e=>e.m===h.m&&e.d===h.d);
    html+=`<div class="cal-cell${isToday?" today":""}${isFri?" friday":""}${isEvent?" islamic-event":""}">
      <div class="cal-greg">${d}</div>
      <div class="cal-hijri">${h.d}</div>
    </div>`;
  }
  html+=`</div>`;
  // مناسبات
  const eventsThisMonth=[];
  for(let d=1;d<=daysInMonth;d++){const h=toHijri(new Date(y,m,d));ISLAMIC_EVENTS.forEach(e=>{if(e.m===h.m&&e.d===h.d)eventsThisMonth.push({name:e.name,day:d});});}
  if(eventsThisMonth.length){html+=`<div class="occasions-section"><div class="occasion-title">⭐ مناسبات الشهر</div>${eventsThisMonth.map(e=>`<div class="occasion-item"><div class="occasion-name">${e.name}</div><div class="occasion-date">${e.day} ${GREG_MONTHS[m]}</div></div>`).join("")}</div>`;}
  wrap.innerHTML=html;
}

function renderHijriCal(wrap) {
  const today=new Date(); const todayH=toHijri(today);
  const y=CAL.hijriYear, m=CAL.hijriMonth+1;
  // حساب عدد أيام الشهر الهجري
  const firstGreg=hijriToGreg(y,m,1);
  let days=29;
  while(true){const t=toHijri(new Date(firstGreg.getTime()+days*86400000));if(t.m!==m||t.y!==y)break;days++;}
  const firstDayOfWeek=firstGreg.getDay();
  const dayNames=["أحد","اثنين","ثلاثاء","أربعاء","خميس","جمعة","سبت"];
  let html=`<div class="cal-nav">
    <button class="cal-nav-btn" onclick="prevHijriMonth()"><svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg></button>
    <div><div class="cal-month-title">${HIJRI_MONTHS[m-1]} ${y}</div></div>
    <button class="cal-nav-btn" onclick="nextHijriMonth()"><svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg></button>
  </div>
  <div class="cal-grid">${dayNames.map(d=>`<div class="cal-day-name">${d}</div>`).join("")}`;
  for(let i=0;i<firstDayOfWeek;i++) html+=`<div class="cal-cell empty"></div>`;
  for(let d=1;d<=days;d++){
    const gDate=new Date(firstGreg.getTime()+(d-1)*86400000);
    const isToday=todayH.y===y&&todayH.m===m&&todayH.d===d;
    const isFri=gDate.getDay()===5;
    const isEvent=ISLAMIC_EVENTS.some(e=>e.m===m&&e.d===d);
    html+=`<div class="cal-cell${isToday?" today":""}${isFri?" friday":""}${isEvent?" islamic-event":""}">
      <div class="cal-greg">${d}</div>
      <div class="cal-hijri">${gDate.getDate()}</div>
    </div>`;
  }
  html+=`</div>`;
  const events=ISLAMIC_EVENTS.filter(e=>e.m===m);
  if(events.length)html+=`<div class="occasions-section"><div class="occasion-title">🌟 مناسبات ${HIJRI_MONTHS[m-1]}</div>${events.map(e=>`<div class="occasion-item"><div class="occasion-name">${e.name}</div><div class="occasion-date">${e.d} ${HIJRI_MONTHS[m-1]}</div></div>`).join("")}</div>`;
  wrap.innerHTML=html;
}

function hijriToGreg(hy,hm,hd) {
  // تقريب: نبحث عن التاريخ الميلادي المقابل
  const approx = new Date((hy-1)*365.25+hm*29.5+hd-622*365.25, 0, 1);
  for(let i=-30;i<30;i++){const d=new Date(approx.getTime()+i*86400000);const h=toHijri(d);if(h.y===hy&&h.m===hm&&h.d===hd)return d;}
  return approx;
}

function prevCalMonth(){if(CAL.gregMonth===0){CAL.gregMonth=11;CAL.gregYear--;}else CAL.gregMonth--;renderCalInner();}
function nextCalMonth(){if(CAL.gregMonth===11){CAL.gregMonth=0;CAL.gregYear++;}else CAL.gregMonth++;renderCalInner();}
function prevHijriMonth(){if(CAL.hijriMonth===0){CAL.hijriMonth=11;CAL.hijriYear--;}else CAL.hijriMonth--;renderCalInner();}
function nextHijriMonth(){if(CAL.hijriMonth===11){CAL.hijriMonth=0;CAL.hijriYear++;}else CAL.hijriMonth++;renderCalInner();}
