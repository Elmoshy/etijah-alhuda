/**
 * Service Worker — اتجاه الهدى PWA
 * الاستراتيجية: Cache-First للملفات الثابتة، Network-First للـ API
 */
const CACHE  = 'etijah-v1.1';
const ASSETS = [
  '.',
  'index.html',
  'manifest.json',
  'js/prayer.js',
  'js/db.js',
];

/* ── تنصيب: حفظ الملفات الأساسية ── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ── تفعيل: حذف الكاش القديم ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── الطلبات ── */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  /* لا تتدخل في طلبات Quran API (للتحميل الأول) ولا الراديو */
  const isExternal = url.origin !== self.location.origin;
  if (isExternal) {
    /* الـ Quran API يحتاج CORS — نمرره مباشرة */
    return;
  }

  /* Cache-First للملفات المحلية */
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request)
        .then(response => {
          if (response && response.status === 200 && response.type !== 'opaque') {
            const clone = response.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return response;
        })
        .catch(() => {
          /* إذا فشل الطلب وكان HTML، أرجع الصفحة الرئيسية */
          if (e.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('index.html');
          }
        });
    })
  );
});

/* ── تحديث الكاش عند توفر نسخة جديدة ── */
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
