/* خدمة بسيطة: تجعل الأداة قابلة للتثبيت، ولا تخزّن شيئاً (كل شيء من الشبكة دائماً) */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  /* لا نتدخل إلا في طلبات موقعنا نفسه، وكل ما عداه يتولاه المتصفح مباشرة */
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(fetch(e.request));
});
