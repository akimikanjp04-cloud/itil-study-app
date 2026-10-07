// ==========================================
// ITIL Foundation Study App
// Service Worker
// STEP 10
// ==========================================

const CACHE_NAME = "itil-study-app-v1";


// オフラインでも使用したいファイル
const APP_FILES = [
    "./",
    "./index.html",
    "./css/style.css",
    "./js/app.js",
    "./data/questions.json",
    "./manifest.json"
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
// 古いキャッシュを削除
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
// 通信処理
// ==========================================

self.addEventListener("fetch", event => {

    // GET以外は処理しない
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

            // キャッシュがあれば
            // オフラインでも返す
            if (cachedResponse) {

                return cachedResponse;
            }


            // キャッシュにない場合は
            // ネットワークへ
            return fetch(
                event.request
            )
            .then(networkResponse => {

                // 正常なレスポンスだけ
                // キャッシュへ追加
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