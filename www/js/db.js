/**
 * QuranDB — تخزين القرآن الكريم في IndexedDB للعمل بدون إنترنت
 * أول تشغيل: يحمّل القرآن من api.alquran.cloud ويخزّنه
 * بعد كده: يخدم كل شيء من القاعدة المحلية
 */
const QuranDB = (() => {
  const DB_NAME    = 'EtijahQuran';
  const DB_VERSION = 1;
  const STORE      = 'ayahs';
  const STORE_META = 'meta';

  let _db = null;

  /* ── فتح / إنشاء القاعدة ── */
  function open() {
    if (_db) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const s = db.createObjectStore(STORE, { keyPath: 'number' });
          s.createIndex('byPage',  'page',         { unique: false });
          s.createIndex('bySurah', 'surahNumber',  { unique: false });
          s.createIndex('byJuz',   'juz',          { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'key' });
        }
      };
      req.onsuccess = e => { _db = e.target.result; resolve(_db); };
      req.onerror   = e => reject(e.target.error);
    });
  }

  /* ── هل القرآن محفوظ بالفعل؟ ── */
  async function isReady() {
    try {
      const db = await open();
      return new Promise(resolve => {
        const tx  = db.transaction(STORE_META, 'readonly');
        const req = tx.objectStore(STORE_META).get('ready');
        req.onsuccess = () => resolve(req.result?.value === true);
        req.onerror   = () => resolve(false);
      });
    } catch { return false; }
  }

  /* ── حفظ الآيات في القاعدة ── */
  async function _store(ayahs) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx   = db.transaction([STORE, STORE_META], 'readwrite');
      const stor = tx.objectStore(STORE);
      ayahs.forEach(a => stor.put(a));
      tx.objectStore(STORE_META).put({ key: 'ready', value: true });
      tx.oncomplete = () => resolve();
      tx.onerror    = e => reject(e.target.error);
    });
  }

  /* ── تحميل القرآن كاملاً من الإنترنت (مرة واحدة) ── */
  async function download(onProgress) {
    const url = 'https://api.alquran.cloud/v1/quran/quran-simple';
    onProgress && onProgress(0, 100, 'جارٍ الاتصال...');

    const resp = await fetch(url);
    if (!resp.ok) throw new Error('فشل التحميل: ' + resp.status);

    onProgress && onProgress(30, 100, 'جارٍ المعالجة...');
    const data = await resp.json();
    if (data.code !== 200) throw new Error('خطأ في API القرآن');

    const ayahs = [];
    for (const surah of data.data.surahs) {
      for (const a of surah.ayahs) {
        ayahs.push({
          number:        a.number,           // رقم الآية العالمي 1-6236
          numberInSurah: a.numberInSurah,
          text:          a.text,
          surahNumber:   surah.number,
          surahName:     surah.name,         // الاسم العربي
          juz:           a.juz,
          page:          a.page,
        });
      }
      const pct = 30 + Math.round((surah.number / 114) * 60);
      onProgress && onProgress(pct, 100, `سورة ${surah.name}...`);
    }

    onProgress && onProgress(95, 100, 'جارٍ الحفظ...');
    await _store(ayahs);
    onProgress && onProgress(100, 100, 'اكتمل التحميل ✓');
    return ayahs.length;
  }

  /* ── جلب آيات صفحة ── */
  async function getPage(pageNum) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE,'readonly')
                    .objectStore(STORE)
                    .index('byPage')
                    .getAll(pageNum);
      req.onsuccess = () => {
        // ترتيب حسب الرقم العالمي
        resolve(req.result.sort((a,b) => a.number - b.number));
      };
      req.onerror = e => reject(e.target.error);
    });
  }

  /* ── جلب آيات سورة ── */
  async function getSurah(surahNum) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE,'readonly')
                    .objectStore(STORE)
                    .index('bySurah')
                    .getAll(surahNum);
      req.onsuccess = () => resolve(req.result.sort((a,b) => a.numberInSurah - b.numberInSurah));
      req.onerror   = e => reject(e.target.error);
    });
  }

  /* ── جلب آيات جزء ── */
  async function getJuz(juzNum) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE,'readonly')
                    .objectStore(STORE)
                    .index('byJuz')
                    .getAll(juzNum);
      req.onsuccess = () => resolve(req.result.sort((a,b) => a.number - b.number));
      req.onerror   = e => reject(e.target.error);
    });
  }

  /* ── تحويل البيانات لصيغة مشابهة لـ API (للتوافق مع renderAyahsHTML) ── */
  function normalizeAyahs(ayahs) {
    return ayahs.map(a => ({
      number:        a.number,
      numberInSurah: a.numberInSurah,
      text:          a.text,
      surah: {
        number: a.surahNumber,
        name:   a.surahName,
      },
      juz:  a.juz,
      page: a.page,
    }));
  }

  /* ── حذف كل البيانات (إعادة التحميل) ── */
  async function clear() {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE, STORE_META], 'readwrite');
      tx.objectStore(STORE).clear();
      tx.objectStore(STORE_META).clear();
      tx.oncomplete = () => resolve();
      tx.onerror    = e => reject(e.target.error);
    });
  }

  return { isReady, download, getPage, getSurah, getJuz, normalizeAyahs, clear };
})();
