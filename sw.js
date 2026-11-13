const CACHE_NAME = "greenhouse-pwa-v2";

const APP_SHELL = [
    "./",
    "./index.html",
    "./css/style.css",
    "./js/app.js",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

// ================================
// INSTALL
// ================================
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

// ================================
// ACTIVATE
// ================================
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => {
                return Promise.all(
                    keys
                        .filter((key) => key !== CACHE_NAME)
                        .map((key) => caches.delete(key))
                );
            })
            .then(() => self.clients.claim())
    );
});

// ================================
// FETCH
// ================================
self.addEventListener("fetch", (event) => {

    // Hanya proses GET request
    if (event.request.method !== "GET") {
        return;
    }

    // Jangan ganggu request Firebase / external API
    const url = new URL(event.request.url);

    if (url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {

                // Simpan response yang valid ke cache
                if (response && response.status === 200) {
                    const responseClone = response.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                }

                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});