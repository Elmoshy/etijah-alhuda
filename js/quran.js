let qtMode = "mushaf";

function initQuranPage() {
  if (document.getElementById("mushafUI").dataset.init) return;
  document.getElementById("mushafUI").dataset.init = "1";
  renderPageList(document.getElementById("mushafUI"));
  renderSurahList(document.getElementById("qListArea"), false);
  renderJuzList();
  renderAudioUI();
  updateGlobalBookmarkBtn();
}
function switchQT(mode) {
  qtMode = mode;
  ["mushaf", "juz", "browse", "audio"].forEach(m => {
    document.getElementById("qt-" + m).style.display = m === mode ? "block" : "none";
    document.getElementById("tab-" + m).classList.toggle("active", m === mode);
  });
  updateGlobalBookmarkBtn();
}
function updateGlobalBookmarkBtn() {
  const wrap = document.getElementById("globalBmkWrap");
  if (!wrap) return;

  const marks = JSON.parse(localStorage.getItem('quran_bookmarks') || '{}');
  const firstKey = Object.keys(marks)[0];

  if (firstKey && (qtMode === "mushaf" || qtMode === "juz" || qtMode === "browse")) {
    wrap.style.display = "block";
  } else {
    wrap.style.display = "none";
  }
}
function jumpToLastBookmark() {
  const marks = JSON.parse(localStorage.getItem('quran_bookmarks') || '{}');
  const firstKey = Object.keys(marks)[0];
  if (firstKey) {
    const parts = firstKey.split(':');
    if (parts[0] === 'p') {
      loadPage(parseInt(parts[1]));
    } else {
      loadSurah(parseInt(parts[0]));
    }
  }
}
function renderSurahList(wrap, short) {
  wrap.innerHTML = `<div class="mushaf-info">114 سورة</div>` +
    SURAHS.map((s, i) => `
      <div class="surah-card anim-item" style="animation-delay:${(i % 20) * 0.03}s" onclick="loadSurah(${s.n})">
        <div class="surah-num">${s.n}</div>
        <div class="surah-info">
          <div class="surah-name">${s.ar}</div>
          <div class="surah-meta">${s.type} · ${s.ayahs} آية</div>
        </div>
        <div class="surah-arrow"><svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg></div>
      </div>`).join("");
}
function renderPageList(wrap) {
  let html = `<div class="mushaf-info">604 صفحة</div><div class="page-grid">`;
  for (let i = 1; i <= 604; i++) {
    html += `<div class="page-card anim-item" style="animation-delay:${(i % 20) * 0.02}s" onclick="loadPage(${i})">
        صفحة ${i}
      </div>`;
  }
  html += `</div>`;
  wrap.innerHTML = html;
}
function renderJuzList() {
  document.getElementById("juzListArea").innerHTML = JUZS.map((j, i) => `
    <div class="juz-card anim-item" style="animation-delay:${(i % 20) * 0.03}s" onclick="loadSurah(${j.n})">
      <div class="juz-num">${j.n}</div>
      <div class="juz-info">
        <div class="juz-name">${j.name}</div>
        <div class="juz-surahs">${j.surahs}</div>
      </div>
      <div class="juz-arrow"><svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg></div>
    </div>`).join("");
}

async function loadPage(pNum) {
  if (pNum < 1 || pNum > 604) return;
  document.getElementById("qp-main").style.display = "none";
  document.getElementById("qp-reader").style.display = "block";
  document.getElementById("rdrTitle").textContent = "صفحة " + pNum;
  const wrap = document.getElementById("ayahWrap");
  wrap.innerHTML = `<div class="loader">جاري تحميل الصفحة...</div>`;

  try {
    const ayahs = await fetchPageAyahs(pNum);
    const bookmarks = JSON.parse(localStorage.getItem('quran_bookmarks') || '{}');
    const fsize = localStorage.getItem('quran_fsize') || 24;

    let html = "";
    let lastSurah = -1;

    ayahs.forEach(a => {
      if (a.sNum !== lastSurah) {
        html += `<div class="surah-header-reader">${a.sName}</div>`;
        if (a.n === 1 && a.sNum !== 1 && a.sNum !== 9) {
          html += `<div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>`;
        }
        lastSurah = a.sNum;
      }
      const isBmk = bookmarks[`p:${pNum}:${a.sNum}:${a.n}`] ? "bookmarked" : "";
      const bmkIcon = isBmk ? "fa-solid fa-bookmark" : "fa-regular fa-bookmark";
      html += `<div class="ayah-row ${isBmk}" id="ayah-p-${pNum}-${a.sNum}-${a.n}">
          <div class="ayah-num">${a.n}</div>
          <div class="ayah-text" style="font-size:${fsize}px">${a.text} ﴿${a.n}﴾</div>
          <div class="ayah-actions">
            <button class="ayah-btn" onclick="toggleBkPage(${pNum}, ${a.sNum}, ${a.n})" title="علامة مرجعية"><i class="${bmkIcon}" id="bki-p-${pNum}-${a.sNum}-${a.n}"></i></button>
          </div>
        </div>`;
    });

    html += `<div class="surah-nav-btns">`;
    if (pNum > 1) html += `<button class="nav-btn-item prev" onclick="loadPage(${pNum - 1})"><i class="fa-solid fa-chevron-right"></i> الصفحة السابقة</button>`;
    if (pNum < 604) html += `<button class="nav-btn-item next" onclick="loadPage(${pNum + 1})">الصفحة التالية <i class="fa-solid fa-chevron-left"></i></button>`;
    html += `</div>`;

    wrap.innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    wrap.innerHTML = `<div class="error-msg">⚠️ تعذّر التحميل</div>`;
  }
}

function toggleBkPage(pNum, sId, aNum) {
  let marks = JSON.parse(localStorage.getItem('quran_bookmarks') || '{}');
  const key = `p:${pNum}:${sId}:${aNum}`;
  const row = document.getElementById(`ayah-p-${pNum}-${sId}-${aNum}`);
  const icon = document.getElementById(`bki-p-${pNum}-${sId}-${aNum}`);

  if (marks[key]) {
    delete marks[key];
    if (row) row.classList.remove('bookmarked');
    if (icon) icon.className = "fa-regular fa-bookmark";
  } else {
    // Clear old
    Object.keys(marks).forEach(k => {
      const parts = k.split(':');
      let oldRow, oldIcon;
      if (parts[0] === 'p') oldRow = document.getElementById(`ayah-p-${parts[1]}-${parts[2]}-${parts[3]}`);
      else oldRow = document.getElementById(`ayah-${parts[0]}-${parts[1]}`);

      if (oldRow) oldRow.classList.remove('bookmarked');
      // For icons, it's harder as we don't have all IDs, but quran.js handles current view.
      // We'll just clear the one in view if it exists
      const allIcons = document.querySelectorAll('.ayah-btn i');
      allIcons.forEach(i => i.className = "fa-regular fa-bookmark");
    });
    marks = {};
    marks[key] = true;
    if (row) row.classList.add('bookmarked');
    if (icon) icon.className = "fa-solid fa-bookmark";
  }
  localStorage.setItem('quran_bookmarks', JSON.stringify(marks));
  updateGlobalBookmarkBtn();
}

async function loadSurah(id) {
  const s = SURAHS.find(x => x.n === id);
  if (!s) return;
  document.getElementById("qp-main").style.display = "none";
  document.getElementById("qp-reader").style.display = "block";
  document.getElementById("rdrTitle").textContent = s.ar;
  const wrap = document.getElementById("ayahWrap");
  wrap.innerHTML = `<div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
    <div class="loader">جاري تحميل السورة... <br><small style="color:var(--tx3)">تحتاج اتصال بالإنترنت أول مرة</small></div>`;

  try {
    const ayahs = await fetchSurahAyahs(id);
    if (!ayahs || Object.keys(ayahs).length === 0) throw new Error("No ayahs fetched");

    const bookmarks = JSON.parse(localStorage.getItem('quran_bookmarks') || '{}');
    const fsize = localStorage.getItem('quran_fsize') || 24;

    let html = `<div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>`;
    html += ayahs.map(a => {
      const isBmk = bookmarks[`${id}:${a.n}`] ? "bookmarked" : "";
      const bmkIcon = isBmk ? "fa-solid fa-bookmark" : "fa-regular fa-bookmark";
      return `<div class="ayah-row ${isBmk}" id="ayah-${id}-${a.n}">
          <div class="ayah-num">${a.n}</div>
          <div class="ayah-text" style="font-size:${fsize}px">${a.text} ﴿${a.n}﴾</div>
          <div class="ayah-actions">
            <button class="ayah-btn" onclick="toggleBk(${id}, ${a.n})" title="علامة مرجعية"><i class="${bmkIcon}" id="bki-${id}-${a.n}"></i></button>
          </div>
        </div>`;
    }).join("");

    // Surah Navigation
    html += `<div class="surah-nav-btns">`;
    if (id > 1) html += `<button class="nav-btn-item prev" onclick="loadSurah(${id - 1})"><i class="fa-solid fa-chevron-right"></i> السورة السابقة</button>`;
    if (id < 114) html += `<button class="nav-btn-item next" onclick="loadSurah(${id + 1})">السورة التالية <i class="fa-solid fa-chevron-left"></i></button>`;
    html += `</div>`;

    wrap.innerHTML = html;

    setTimeout(() => {
      const firstBmk = Object.keys(bookmarks).find(k => k.startsWith(id + ":"));
      if (firstBmk) {
        const el = document.getElementById(`ayah-${firstBmk.replace(':', '-')}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 300);

  } catch (err) {
    wrap.innerHTML = `<div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div><div class="error-msg">⚠️ تعذّر التحميل — تحقق من الاتصال</div>`;
  }
}

function toggleBk(sId, aNum) {
  let marks = JSON.parse(localStorage.getItem('quran_bookmarks') || '{}');
  const key = `${sId}:${aNum}`;
  const row = document.getElementById(`ayah-${sId}-${aNum}`);
  const icon = document.getElementById(`bki-${sId}-${aNum}`);

  if (marks[key]) {
    delete marks[key];
    if (row) row.classList.remove('bookmarked');
    if (icon) icon.className = "fa-regular fa-bookmark";
  } else {
    // Clear old bookmarks (Single Global Bookmark)
    Object.keys(marks).forEach(m => {
      const [oldSid, oldEnum] = m.split(':');
      const oldRow = document.getElementById(`ayah-${oldSid}-${oldEnum}`);
      const oldIcon = document.getElementById(`bki-${oldSid}-${oldEnum}`);
      if (oldRow) oldRow.classList.remove('bookmarked');
      if (oldIcon) oldIcon.className = "fa-regular fa-bookmark";
    });
    marks = {};
    marks[key] = true;
    if (row) row.classList.add('bookmarked');
    if (icon) icon.className = "fa-solid fa-bookmark";
  }
  localStorage.setItem('quran_bookmarks', JSON.stringify(marks));
  updateGlobalBookmarkBtn();
}

function closeReader() {
  document.getElementById("qp-main").style.display = "block";
  document.getElementById("qp-reader").style.display = "none";
}

function changeFontSize(delta) {
  let fsize = parseInt(localStorage.getItem('quran_fsize') || 24);
  fsize += delta;
  if (fsize < 16) fsize = 16;
  if (fsize > 48) fsize = 48;
  localStorage.setItem('quran_fsize', fsize);
  document.querySelectorAll(".ayah-text").forEach(el => el.style.fontSize = fsize + "px");
}

function renderAudioUI() {
  const wrap = document.getElementById("audioQuranUI");
  const selR = AUDIO.reciter || RECITERS[0].id;
  wrap.innerHTML = `
    <div class="audio-player" id="audioPlayerCard">
      <div class="player-info">
        <div class="player-reciter" id="pReciter">${RECITERS.find(r => r.id === selR)?.name || ""}</div>
        <div class="player-surah" id="pSurah">اختر سورة</div>
      </div>
      <div class="player-controls">
        <button class="player-btn" onclick="toggleAutoplay()" title="التشغيل التلقائي"><i class="${AUDIO.autoplay ? 'fa-solid fa-rotate' : 'fa-solid fa-arrow-right-long'}" id="pAutoIcon" style="color:${AUDIO.autoplay ? 'var(--ac)' : 'var(--tx3)'}"></i></button>
        <button class="player-btn" onclick="audioPrev()" title="السابق"><i class="fa-solid fa-backward-step"></i></button>
        <button class="player-btn player-main" id="pPlayBtn" onclick="toggleAudioPlay()"><i class="fa-solid fa-play" id="pPlayIcon"></i></button>
        <button class="player-btn" onclick="audioNext()" title="التالي"><i class="fa-solid fa-forward-step"></i></button>
        <button class="player-btn" onclick="downloadCurrentStur()" title="تحميل السورة"><i class="fa-solid fa-download"></i></button>
      </div>
      <div class="player-progress">
        <span id="pCurTime">0:00</span>
        <input type="range" id="pSeek" value="0" min="0" max="100" oninput="seekAudio(this.value)">
        <span id="pDurTime">0:00</span>
      </div>
    </div>
    <div class="reciters-section">
      <div class="audio-section-title" style="font-size:12px;font-weight:800;color:var(--ac);margin-bottom:8px;padding:0">القرّاء</div>
      <div class="reciters-grid">${RECITERS.map((r, i) => `<div class="reciter-card anim-item ${r.id === selR ? 'selected' : ''}" style="animation-delay:${(i % 10) * 0.03}s" onclick="selectReciter('${r.id}')"><div class="reciter-name">${r.name}</div></div>`).join("")}</div>
    </div>
    <div class="audio-section-title" style="font-size:12px;font-weight:800;color:var(--ac);padding:8px 14px 6px">السور</div>
    <div class="audio-list">${SURAHS.map((s, i) => `
      <div class="audio-item anim-item ${AUDIO.surah === s.n ? 'now-playing' : ''}" style="animation-delay:${(i % 20) * 0.03}s" id="as-${s.n}" onclick="playAudioSurah(${s.n})">
        <div class="audio-n">${s.n}</div>
        <div class="audio-name">${s.ar}</div>
        <div class="audio-play-icon"><i class="fa-solid fa-play"></i></div>
      </div>`).join("")}</div>`;
}

function selectReciter(id) {
  AUDIO.reciter = id;
  document.querySelectorAll(".reciter-card").forEach(c => c.classList.toggle("selected", c.onclick?.toString().includes(`'${id}'`)));
  renderAudioUI();
  if (AUDIO.surah) playAudioSurah(AUDIO.surah);
}

function playAudioSurah(n) {
  const reciter = RECITERS.find(r => r.id === (AUDIO.reciter || RECITERS[0].id));
  if (!reciter) return;
  AUDIO.surah = n;
  let filename;
  if (reciter.fmt === 0) {
    filename = n + ".mp3";
  } else {
    filename = String(n).padStart(reciter.fmt, "0") + ".mp3";
  }
  const url = reciter.server + filename;
  if (!AUDIO.audio) {
    AUDIO.audio = new Audio();
  } else {
    AUDIO.audio.pause();
    AUDIO.audio.onended = null;
    AUDIO.audio.ontimeupdate = null;
  }
  AUDIO.audio.src = url;
  AUDIO.audio.load();
  AUDIO.audio.play().catch(e => console.warn("Audio play failed:", e));
  AUDIO.playing = true;
  const surahName = SURAHS.find(s => s.n === n)?.ar || "";
  const pSurah = document.getElementById("pSurah");
  const pReciter = document.getElementById("pReciter");
  const pPlayIcon = document.getElementById("pPlayIcon");
  if (pSurah) pSurah.textContent = surahName;
  if (pReciter) pReciter.textContent = reciter.name;
  if (pPlayIcon) pPlayIcon.className = 'fa-solid fa-pause';
  // highlight in list
  document.querySelectorAll(".audio-item").forEach(el => el.classList.remove("now-playing"));
  const el = document.getElementById("as-" + n);
  if (el) { el.classList.add("now-playing"); el.scrollIntoView({ block: "nearest" }); }
  AUDIO.audio.ontimeupdate = () => {
    const d = AUDIO.audio.duration || 0, c = AUDIO.audio.currentTime;
    const pCur = document.getElementById("pCurTime");
    const pDur = document.getElementById("pDurTime");
    const pSeek = document.getElementById("pSeek");
    if (pCur) pCur.textContent = fmtDur(c);
    if (pDur) pDur.textContent = fmtDur(d);
    if (d && pSeek) pSeek.value = (c / d) * 100;
  };
  AUDIO.audio.onended = () => {
    if (AUDIO.autoplay) {
      if (AUDIO.surah < 114) playAudioSurah(AUDIO.surah + 1);
    } else {
      AUDIO.playing = false;
      if (pPlayIcon) pPlayIcon.className = "fa-solid fa-play";
    }
  };
  AUDIO.audio.onerror = (e) => {
    console.warn("Audio error for surah", n, e);
    // Try next surah if current fails
    if (AUDIO.autoplay && AUDIO.surah < 114) setTimeout(() => playAudioSurah(AUDIO.surah + 1), 1000);
  };
}
function toggleAudioPlay() {
  if (!AUDIO.audio) return;
  if (AUDIO.playing) { AUDIO.audio.pause(); AUDIO.playing = false; const i = document.getElementById("pPlayIcon"); if (i) i.className = "fa-solid fa-play"; }
  else { AUDIO.audio.play(); AUDIO.playing = true; const i = document.getElementById("pPlayIcon"); if (i) i.className = "fa-solid fa-pause"; }
}
function audioNext() { if (AUDIO.surah && AUDIO.surah < 114) playAudioSurah(AUDIO.surah + 1); }
function audioPrev() { if (AUDIO.surah > 1) playAudioSurah(AUDIO.surah - 1); }
function seekAudio(v) { if (AUDIO.audio && AUDIO.audio.duration) AUDIO.audio.currentTime = (v / 100) * AUDIO.audio.duration; }
function fmtDur(s) { return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`; }

function toggleAutoplay() {
  AUDIO.autoplay = !AUDIO.autoplay;
  const icon = document.getElementById("pAutoIcon");
  if (icon) {
    icon.className = AUDIO.autoplay ? 'fa-solid fa-rotate' : 'fa-solid fa-arrow-right-long';
    icon.style.color = AUDIO.autoplay ? 'var(--ac)' : 'var(--tx3)';
  }
}

async function downloadCurrentStur() {
  if (!AUDIO.surah) return alert("الرجاء اختيار سورة أولاً");
  const reciter = RECITERS.find(r => r.id === (AUDIO.reciter || RECITERS[0].id));
  if (!reciter) return;

  let filename = reciter.fmt === 0 ? AUDIO.surah + ".mp3" : String(AUDIO.surah).padStart(reciter.fmt, "0") + ".mp3";
  const url = reciter.server + filename;

  const surahName = SURAHS.find(s => s.n === AUDIO.surah)?.ar || "";
  const saveName = `سورة ${surahName} - ${reciter.name}.mp3`;

  try {
    const icon = document.querySelector('.fa-download');
    if (icon) icon.className = "fa-solid fa-spinner fa-spin";

    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = saveName;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    }, 100);

    if (icon) icon.className = "fa-solid fa-download";

  } catch (err) {
    console.error("Download failed, relying on fallback: ", err);
    alert('عذراً، حدث خطأ أثناء التحميل. قد يكون بسبب قيود الخادم.');
    const icon = document.querySelector('.fa-spinner');
    if (icon) icon.className = "fa-solid fa-download";

    const a = document.createElement("a");
    a.href = url;
    a.download = saveName;
    a.target = "_blank";
    a.click();
  }
}
