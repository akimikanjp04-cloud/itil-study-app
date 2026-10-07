// ==========================================
// ITIL Foundation Study App
// Service Worker
// STEP 10 - PWA v2
// ==========================================

const CACHE_NAME = "itil-study-app-v3";

const APP_FILES = [
    "./",
    "./index.html",
    "./css/style.css",
    "./js/app.js",
    "./data/questions.json",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];


// ==========================================
// インストール
// ==========================================

self.addEventListener("install", event => {

    console.log(
        "[Service Worker] Install"
    );

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {

                console.log(
                    "[Service Worker] App files caching"
                );

                return cache.addAll(
                    APP_FILES
                );
            })
    );

    self.skipWaiting();
});


// ==========================================
// 有効化
// ==========================================

self.addEventListener("activate", event => {

    console.log(
        "[Service Worker] Activate"
    );

    event.waitUntil(

        caches.keys()
            .then(cacheNames => {

                return Promise.all(

                    cacheNames.map(
                        cacheName => {

                            if (
                                cacheName !==
                                CACHE_NAME
                            ) {

                                console.log(
                                    "[Service Worker] Old cache delete:",
                                    cacheName
                                );

                                return caches.delete(
                                    cacheName
                                );
                            }

                        }
                    )
                );

            })
    );

    self.clients.claim();
});


// ==========================================
// Fetch
// ==========================================

self.addEventListener("fetch", event => {

    if (
        event.request.method !== "GET"
    ) {
        return;
    }


    event.respondWith(

        caches.match(
            event.request
        )
        .then(cachedResponse => {

            if (cachedResponse) {

                return cachedResponse;
            }


            return fetch(
                event.request
            )
            .then(networkResponse => {

                if (
                    !networkResponse ||
                    networkResponse.status !== 200
                ) {

                    return networkResponse;
                }


                const responseClone =
                    networkResponse.clone();


                caches.open(
                    CACHE_NAME
                )
                .then(cache => {

                    cache.put(
                        event.request,
                        responseClone
                    );

                });


                return networkResponse;

            });

        })
    );
});