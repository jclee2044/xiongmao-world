const CACHE = "xiongmao-shell-0.9.3-mobile-audio-20";
const SHELL = [
  "/assets/world/lotus-fountain.png",
  "/game/fountain.js",
  "/data/ponds.js",
  "/game/bridges.js",
  "/assets/world/stone-bridges.png",
  "/assets/characters/market-npcs.png",
  "/assets/characters/visitors-walk.png",
  "/assets/characters/indoor-npcs.png",
  "/assets/world/suzhou-passenger-boat.png",
  "/assets/world/canal-water-v2.png",
  "/assets/world/shop-breakfast.png",
  "/assets/world/clothing-store-interior.png",
  "/assets/world/clothing-catalog.png",
  "/assets/world/shop-souvenirs.png",
  "/assets/world/shop-produce.png",
  "/assets/world/shop-snacks.png",
  "/assets/world/shop-streetfood.png",
  "/data/shops.js",
  "/data/navigation.js",
  "/game/directions.js",
  "/assets/characters/player-walk-v2.png",
  "/assets/characters/lian-poses.png",
  "/assets/world/fruit-trees-v2.png",
  "/assets/world/sheep-gift.png",
  "/assets/characters/lin-walk.png",
  "/assets/characters/seated-friends.png",
  "/data/market.js",
  "/data/town-layout.js",
  "/data/market-integration.js",
  "/assets/world/market-rows.png",
  "/assets/world/restaurant-interior-v3.png",
  "/assets/characters/neighbors-walk-v2.png",
  "/assets/characters/children-walk.png",
  "/assets/world/hotpot-view.png",
  "/assets/world/hotpot-table.png",
  "/game/ambience.js",
  "/game/goals.js",
  "/game/words.js",
  "/assets/characters/player-idle.png",
  "/assets/characters/qiao-seated.png",
  "/assets/world/earth.png",
  "/data/town.js",
  "/data/town-rooms.js",
  "/data/adventure.js",
  "/game/adventure.js",
  "/assets/characters/panda-v2.png",
  "/assets/characters/neighbors-walk.png",
  "/assets/world/restaurant-interior.png",
  "/assets/world/museum-interior.png",
  "/",
  "/index.html",
  "/styles.css",
  "/styles-v9.css",
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
  "/game/music-ownership.js",
  "/game/fountain.js",
  "/game/practice.js",
  "/game/life.js",
  "/data/culture.js",
  "/data/cultural-activities.js",
  "/data/interiors.js",
  "/assets/world/storefronts.webp",
  "/assets/world/landmarks.webp",
  "/assets/characters/animals.webp",
  "/assets/world/bakery-interior.webp",
  "/assets/world/teahouse-interior.webp",
  "/assets/world/bookshop-interior.webp",
  "/assets/audio/asia-fsm-team.mp3",
  "/assets/audio/sonican-asian-music-magical-dream.mp3",
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
        if (
          (name.startsWith("panda-shell-") ||
            name.startsWith("xiongmao-shell-")) &&
          name !== CACHE
        )
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
  if (["script", "style"].includes(event.request.destination)) {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE);
            await cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then((cached) => cached || caches.match(url.pathname)),
        ),
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
