import { optimizedArt } from "./data/optimized-art.js";
const CACHE = "xiongmao-shell-0.9.8-platform-travelers-149-refactor-worlds-rewards-1";
// The user's personal recording is kept outside source control. A checkout
// without that file must still install the rest of the offline game.
const OPTIONAL_SHELL = ["/assets/audio/hana-daria-semikina.mp3"];
const SHELL = [
  "/data/rewards.js",
  "/state/rewards.js",
  ...new Set(
    [
      "/welcome.css",
      "/content/art/render-assets.js",
      "/engine/navigation.js",
      "/state/migrations/world.js",
      "/worlds/catalog.js",
      "/worlds/suzhou/manifest.js",
      "/worlds/suzhou/scenes/interiors.js",
      "/worlds/suzhou/scenes/town-rooms.js",
      "/worlds/suzhou/scenes/station-exterior.js",
      "/worlds/suzhou/scenes/station-interior.js",
      "/worlds/suzhou/scenes/station-waiting.js",
      "/worlds/suzhou/scenes/station-platform.js",
      "/content/language/basics.js",
      "/content/characters/suzhou.js",
      "/content/characters/catalog.js",
      "/state/defaults.js",
      "/shared/geometry/collision.js",
      "/data/station-exterior.js",
      "/data/station-interior.js",
      "/data/station-waiting.js",
      "/data/station-platform.js",
      "/data/station-platform-travelers.js",
      "/game/station-train.js",
      "/game/station-platform-art.js",
      "/assets/world/station-platform-v3.png",
      "/assets/world/station-train-overhead-v1.png",
      "/data/station-shops.js",
      "/assets/world/shop-station-cafe.png",
      "/assets/world/shop-station-snacks.png",
      "/data/station-help.js",
      "/data/wenbo-conversation-art.js",
      "/assets/characters/wenbo-conversation-away-v1.png",
      "/assets/optimized/rabbit-plush.webp",
      "/assets/optimized/suzhou-model-table-rotated.webp",
      "/assets/optimized/suzhou-model-closeup.webp",
      "/data/station-waiting-travelers.js",
      "/data/station-waiting-signs.js",
      "/data/station-waiting-characters.js",
      "/game/station-waiting-art.js",
      "/assets/world/station-sign-readability-v1.png",
      "/assets/fonts/station-hand.woff2",
      "/assets/fonts/station-brush.woff2",
      "/assets/world/station-waiting-v5.png",
      "/assets/characters/station-waiting-people-v2.png",
      "/assets/characters/station-seated-companions-v3.png",
      "/data/station-interior-characters.js",
      "/data/station-employee-art.js",
      "/game/station-employee-animation.js",
      "/assets/characters/station-employee-poses-v2.png",
      "/assets/characters/station-employee-guide-v1.png",
      "/assets/characters/station-employee-exit-v1.png",
      "/assets/characters/station-employee-desk-v1.png",
      "/data/station-journey.js",
      "/data/travel-luggage.js",
      "/assets/props/travel-suitcase.png",
      "/game/station-interactions.js",
      "/game/station-interior-art.js",
      "/game/interaction-surfaces.js",
      "/game/station-escalators.js",
      "/game/room-camera.js",
      "/assets/world/station-ground-v3.png",
      "/assets/world/station-ground-v4.png",
      "/assets/characters/station-interior-people-v1.png",
      "/assets/characters/station-clerk-v2.png",
      "/assets/characters/station-reader-seated-v3.png",
      "/assets/props/player-green-satchel.png",
      "/assets/characters/player-idle-without-bag.png",
      "/assets/characters/player-walk-without-bag.png",
      "/assets/characters/player-seated-without-bag.png",
      "/data/station-travelers.js",
      "/data/station-departure.js",
      "/data/xiaocheng-walk-art.js",
      "/game/station-departure.js",
      "/assets/characters/xiaocheng-walk.png",
      "/data/station-traveler-art.js",
      "/data/station-traveler-walk-art.js",
      "/data/station-traveler-walk-a-art.js",
      "/assets/characters/station-travelers-walk-a-v1.png",
      "/assets/characters/station-travelers-walk-v1.png",
      "/assets/characters/station-travelers-a.png",
      "/assets/characters/station-travelers-b.png",
      "/data/suzhou-life.js",
      "/assets/world/family-home.webp",
      "/assets/world/family-furniture.webp",
      "/assets/world/family-clutter.webp",
      "/assets/world/family-fallen-chair.webp",
      "/data/station-props.js",
      "/game/station-layers.js",
      "/game/station-environment.js",
      "/game/water-motion.js",
      "/game/station-signs.js",
      "/game/station-sign-help.js",
      "/assets/world/station-exterior-v2.png",
      "/assets/map-icon.svg",
      "/assets/journal-icon.svg",
      "/data/optimized-art.js",
      "/data/language.js",
      "/data/hsk-vocabulary.js",
      "/game/map.js",
      "/game/dialogue-variation.js",
      "/game/coach-questions.js",
      "/data/dialogue-options.js",
      "/data/conversation-subjects.js",
      "/data/family-dialogue.js",
      "/data/book-dialogue.js",
      "/game/panda-landmarks.js",
      "/game/collectibles.js",
      "/data/panda-areas.js",
      "/data/station-panda.js",
      "/game/interactions.js",
      "/game/activity-guide.js",
      "/game/language-signs.js",
      "/assets/welcome/panda-240.webp",
      "/assets/welcome/town-480.webp",
      "/assets/welcome/town-960.webp",
      "/assets/welcome/tea-480.webp",
      "/assets/welcome/tea-960.webp",
      "/game/language-signs.js",
      "/data/language.js",
      "/data/hsk-vocabulary.js",
      "/data/voices.js",
      "/data/pronunciation.js",
      "/game/exit-arrow.js",
      "/assets/world/lotus-fountain.png",
      "/game/fountain.js",
      "/data/ponds.js",
      "/game/bridges.js",
      "/assets/world/stone-bridges.png",
      "/assets/characters/market-npcs.png",
      "/assets/characters/visitors-walk.png",
      "/assets/characters/indoor-npcs.png",
      "/assets/characters/garden-workers.png",
      "/assets/characters/garden-workers-work.png",
      "/assets/world/suzhou-passenger-boat.png",
      "/assets/world/canal-water-v2.png",
      "/assets/world/shop-breakfast.png",
      "/assets/world/clothing-store-interior.png",
      "/assets/world/clothing-store-exterior.png",
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
      "/data/market-foreground.js",
      "/data/market-colliders.js",
      "/data/town-layout.js",
      "/data/market-integration.js",
      "/assets/world/market-rows.png",
      "/assets/world/restaurant-interior-v3.png",
      "/assets/characters/neighbors-walk-v2.png",
      "/assets/characters/children-walk.png",
      "/assets/characters/roamers-idle.png",
      "/assets/characters/market-cat-poses.png",
      "/data/roaming-zones.js",
      "/assets/world/hotpot-view.png",
      "/assets/world/hotpot-table.png",
      "/game/ambience.js",
      "/game/station-audio.js",
      "/assets/audio/station-hall.mp3",
      "/assets/audio/station-pa.mp3",
      "/assets/audio/station-forecourt.mp3",
      "/assets/audio/station-piano.mp3",
      "/game/goals.js",
      "/game/words.js",
      "/game/bubble-help.js",
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
      "/game/music-track.js",
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
      "/assets/characters/fox-plush.png",
      "/data/content.js",
      "/data/learner.js",
      "/data/settings.js",
      "/data/activities.js",
    ].map((path) => optimizedArt[path] || path),
  ),
];
self.addEventListener("install", (event) =>
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Small batches keep background offline installation from flooding the network.
      for (let i = 0; i < SHELL.length; i += 3) {
        await cache.addAll(SHELL.slice(i, i + 3));
      }
      for (const path of OPTIONAL_SHELL) await cache.add(path).catch(() => {});
    })(),
  ),
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
  if (SHELL.includes(url.pathname) || OPTIONAL_SHELL.includes(url.pathname))
    event.respondWith(
      caches
        .open(CACHE)
        .then(
          async (cache) =>
            (await cache.match(url.pathname)) || fetch(event.request),
        ),
    );
});
