// Keshning nomi — fayllarni o'zgartirganingdan keyin versiyani oshirsang,
// eski kesh avtomatik tozalanadi va foydalanuvchi yangi fayllarni oladi.
const KESH_NOMI = "koptoki-v11";

// Offline ishlashi uchun saqlanadigan fayllar
const KESHLANADIGAN_FAYLLAR = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// O'rnatish: fayllarni keshga oldindan yuklab olamiz
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(KESH_NOMI).then((kesh) => kesh.addAll(KESHLANADIGAN_FAYLLAR))
  );
  self.skipWaiting();
});

// Faollashtirish: eski versiyadagi keshlarni tozalaymiz
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nomlar) =>
      Promise.all(
        nomlar
          .filter((nom) => nom !== KESH_NOMI)
          .map((nom) => caches.delete(nom))
      )
    )
  );
  self.clients.claim();
});

// So'rovlarni ushlab olish: avval keshdan, bo'lmasa tarmoqdan
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((keshlangan) => {
      if (keshlangan) return keshlangan;

      return fetch(event.request)
        .then((javob) => {
          // Yangi olingan faylni ham keshga qo'shib qo'yamiz
          const nusxa = javob.clone();
          caches.open(KESH_NOMI).then((kesh) => kesh.put(event.request, nusxa));
          return javob;
        })
        .catch(() => {
          // Internet yo'q va keshda ham topilmadi — asosiy sahifani qaytaramiz
          return caches.match("./index.html");
        });
    })
  );
});
