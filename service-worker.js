// ==========================================
// ITIL Foundation Study App
// Service Worker
// STEP 11.5
// ==========================================

const CACHE_NAME = "itil-study-app-v5";

const APP_FILES = [
    "./",
    "./index.html",
    "./css/style.css",
    "./js/app.js",
    "./data/questions.json",
    "./data/glossary.json",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];


// ==========================================
// インストール
// ==========================================

self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(APP_FILES);
            })
    );

    // 新しいService Workerをすぐ待機状態から進める
    self.skipWaiting();
});


// ==========================================
// 有効化
// 古いキャッシュを削除
// ==========================================

self.addEventListener("activate", event => {

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {

                return Promise.all(

                    cacheNames.map(cacheName => {

                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }

                    })

                );
            })
            .then(() => {
                return self.clients.claim();
            })
    );
});


// ==========================================
// 通信処理
//
// オンライン：ネット最新版を優先
// オフライン：キャッシュを使用
// ==========================================

self.addEventListener("fetch", event => {

    // GET以外は処理しない
    if (event.request.method !== "GET") {
        return;
    }


    // http / https 以外は対象外
    const requestURL =
        new URL(event.request.url);

    if (
        requestURL.protocol !== "http:" &&
        requestURL.protocol !== "https:"
    ) {
        return;
    }


    event.respondWith(

        fetch(event.request)

            .then(networkResponse => {

                // 正常なレスポンスなら
                // 新しい内容をキャッシュへ保存
                if (
                    networkResponse &&
                    networkResponse.status === 200
                ) {

                    const responseClone =
                        networkResponse.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {

                            cache.put(
                                event.request,
                                responseClone
                            );

                        });
                }


                // ネットから取得した最新版を表示
                return networkResponse;
            })

            .catch(() => {

                // ネット接続できない場合は
                // 保存済みキャッシュから表示
                return caches.match(
                    event.request
                );

            })
    );
});