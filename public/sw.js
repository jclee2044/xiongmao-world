const CACHE = "panda-shell-0.2.0-3";
const SHELL = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/manifest.webmanifest",
  "/assets/panda.png",
  "/assets/icon-192.png",
  "/assets/icon-512.png",
  "/game/engine.js",
  "/game/world.js",
  "/game/render.js",
  "/game/persistence.js",
  "/game/speech.js",
  "/game/panels.js",
  "/game/pwa.js",
  "/game/pathfinding.js",
  "/data/art-bounds.js",
  "/assets/world/canal-lane.webp",
  "/assets/world/home.webp",
  "/assets/world/paving.webp",
  "/assets/world/house.webp",
  "/assets/world/willow.webp",
  "/assets/characters/player-atlas.webp",
  "/assets/characters/mei.webp",
  "/assets/characters/lin.webp",
  "/assets/characters/yun.webp",
  "/assets/characters/momo.webp",
  "/data/content.js",
  "/data/learner.js",
  "/data/settings.js",
];
self.addEventListener("install", (event) =>
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL))),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys())
        if (name.startsWith("panda-shell-") && name !== CACHE)
          await caches.delete(name);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE_UPDATE") self.skipWaiting();
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Never cache identities, saves, model conversations or generated speech.
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  )
    return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/index.html")),
    );
    return;
  }
  if (SHELL.includes(url.pathname))
    event.respondWith(
      caches
        .open(CACHE)
        .then(
          async (cache) =>
            (await cache.match(url.pathname)) || fetch(event.request),
        ),
    );
});
