// ════════════════════════════════════════════════════
//  QURAN DATA LOADER
// ════════════════════════════════════════════════════
// يحمّل القرآن الكريم كاملاً من API موثوق
// ويخزنه في IndexedDB للاستخدام offline

const QURAN_DB_NAME = 'quran_cache';
const QURAN_DB_VER = 2;
let _quranDB = null;

async function openQuranDB() {
  if (_quranDB) return _quranDB;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(QURAN_DB_NAME, QURAN_DB_VER);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('surahs')) {
        db.createObjectStore('surahs', { keyPath: 'n' });
      }
      if (!db.objectStoreNames.contains('pages')) {
        db.createObjectStore('pages', { keyPath: 'n' });
      }
    };
    req.onsuccess = e => { _quranDB = e.target.result; resolve(_quranDB); };
    req.onerror = () => reject(req.error);
  });
}

async function getCachedSurah(n) {
  try {
    const db = await openQuranDB();
    return new Promise((resolve) => {
      const tx = db.transaction('surahs', 'readonly');
      const req = tx.objectStore('surahs').get(n);
      req.onsuccess = () => resolve(req.result?.ayahs || null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

async function cacheSurah(n, ayahs) {
  try {
    const db = await openQuranDB();
    const tx = db.transaction('surahs', 'readwrite');
    tx.objectStore('surahs').put({ n, ayahs });
  } catch { }
}

async function getCachedPage(n) {
  try {
    const db = await openQuranDB();
    return new Promise((resolve) => {
      const tx = db.transaction('pages', 'readonly');
      const req = tx.objectStore('pages').get(n);
      req.onsuccess = () => resolve(req.result?.ayahs || null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

async function cachePage(n, ayahs) {
  try {
    const db = await openQuranDB();
    const tx = db.transaction('pages', 'readwrite');
    tx.objectStore('pages').put({ n, ayahs });
  } catch { }
}

async function fetchSurahAyahs(n) {
  const cached = await getCachedSurah(n);
  if (cached) return cached;
  const res = await fetch(`https://api.alquran.cloud/v1/surah/${n}`);
  const data = await res.json();
  if (data.code !== 200) throw new Error('API error');
  const ayahs = data.data.ayahs.map(a => ({ n: a.numberInSurah, text: a.text }));
  await cacheSurah(n, ayahs);
  return ayahs;
}

async function fetchPageAyahs(n) {
  const cached = await getCachedPage(n);
  if (cached) return cached;
  // Use page endpoint which returns all ayahs in that page
  const res = await fetch(`https://api.alquran.cloud/v1/page/${n}/quran-uthmani`);
  const data = await res.json();
  if (data.code !== 200) throw new Error('API error');
  const ayahs = data.data.ayahs.map(a => ({
    n: a.numberInSurah,
    text: a.text,
    sName: a.surah.name,
    sNum: a.surah.number
  }));
  await cachePage(n, ayahs);
  return ayahs;
}
