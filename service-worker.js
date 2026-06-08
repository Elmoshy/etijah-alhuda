const CACHE_NAME = 'etijah-alhuda-v2';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './icon.png',
    './manifest.json',
    './js/adhkar.js',
    './js/adhkar_data.js',
    './js/calendar.js',
    './js/data.js',
    './js/navigation.js',
    './js/prayers.js',
    './js/qibla.js',
    './js/qibla_tabs.js',
    './js/quran.js',
    './js/quran_data.js',
    './js/radio.js',
    './js/settings.js',
    './js/state.js',
    './js/tasbih.js',
    './js/theme.js',
    'https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&family=Amiri:wght@400;700&family=Cairo:wght@300;400;600;700;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install Event
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Service Worker: Caching Files');
            return cache.addAll(ASSETS);
        })
    );
});

// Activate Event
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
});

// Fetch Event
self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(cacheRes => {
            return cacheRes || fetch(e.request).then(fetchRes => {
                // Option: cache new resources on the fly? Skip for now to keep it simple and safe.
                return fetchRes;
            });
        })
    );
});
