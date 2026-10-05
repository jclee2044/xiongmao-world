const CACHE = "panda-shell-0.4.0-2";
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
  "/game/appearance.js",
  "/game/terrain.js",
  "/game/music.js",
  "/game/practice.js",
  "/game/life.js",
  "/data/culture.js",
  "/data/interiors.js",
  "/assets/world/storefronts.webp",
  "/assets/world/landmarks.webp",
  "/assets/characters/animals.webp",
  "/assets/world/bakery-interior.webp",
  "/assets/world/teahouse-interior.webp",
  "/assets/world/bookshop-interior.webp",
  "/assets/audio/asia-fsm-team.mp3",
  "/assets/audio/ATTRIBUTION.md",
  "/assets/audio/CC-BY-4.0.txt",
  "/data/art-bounds.js",
  "/assets/world/canal-lane.webp",
  "/assets/world/home.webp",
  "/assets/world/paving.webp",
  "/assets/world/house.webp",
  "/assets/world/willow.webp",
  "/assets/world/props.webp",
  "/assets/characters/neighbors.webp",
  "/assets/characters/player-walk.webp",
  "/assets/characters/player-atlas.webp",
  "/assets/characters/mei.webp",
  "/assets/characters/lin.webp",
  "/assets/characters/yun.webp",
  "/assets/characters/momo.webp",
  "/data/content.js",
  "/data/learner.js",
  "/data/settings.js",
  "/data/activities.js",
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
