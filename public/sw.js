// ============================================================
// SAHKAAR CONNECT - SERVICE WORKER (PHASE 16)
// Progressive Web App (PWA) Offline-First Cache & Sync Engine
// ============================================================

const CACHE_NAME = "sahkaar-connect-v2";

const PRECACHE_ASSETS = [
    "/",
    "/index.html",
    "/manifest.json",
    "/css/style.css",
    "/js/translations.js",
    "/js/voice.js",
    "/js/onboarding.js",
    "/js/auth.js",
    "/js/adminAuth.js",
    "/js/role.js",
    "/js/app.js",
    "/js/chatbot.js",
    "/js/pwa.js",
    "/icons/icon-192.svg",
    "/icons/icon-512.svg"
];

// 1. INSTALL EVENT — Pre-cache critical App Shell
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("[ServiceWorker] Pre-caching offline cooperative app shell...");
            return cache.addAll(PRECACHE_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// 2. ACTIVATE EVENT — Clean up obsolete caches and claim clients immediately
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(name => {
                    if (name !== CACHE_NAME) {
                        console.log("[ServiceWorker] Removing legacy cache:", name);
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. FETCH EVENT — Intelligent Caching Strategies
self.addEventListener("fetch", event => {
    const request = event.request;
    const url = new URL(request.url);

    // Only handle GET requests
    if (request.method !== "GET") {
        return;
    }

    // A. API Requests: Network-First with Cache Fallback & Graceful Offline JSON
    if (url.pathname.startsWith("/api/")) {
        event.respondWith(
            fetch(request).then(networkResponse => {
                // If successful GET, update cache in background
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
                }
                return networkResponse;
            }).catch(async () => {
                // Network failed — try to serve from cache
                const cachedResponse = await caches.match(request);
                if (cachedResponse) {
                    return cachedResponse;
                }
                // Graceful offline fallback JSON
                return new Response(JSON.stringify({
                    offline: true,
                    success: false,
                    message: "Offline Mode Active: Running from local cooperative device vault. Data will sync when reconnected."
                }), {
                    headers: { "Content-Type": "application/json" },
                    status: 503
                });
            })
        );
        return;
    }

    // B. Static Assets (App Shell, Scripts, CSS, Icons): Stale-While-Revalidate
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            const fetchPromise = fetch(request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
                }
                return networkResponse;
            }).catch(() => {
                // If navigation request fails offline, fallback to root page
                if (request.mode === "navigate") {
                    return caches.match("/") || caches.match("/index.html");
                }
            });

            return cachedResponse || fetchPromise;
        })
    );
});
