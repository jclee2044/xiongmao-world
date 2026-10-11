# Station ground floor implementation

Built October 10–11, 2026 in `/home/jlrj/Documents/lotus`.

The second floor is now implemented; see [the upper waiting hall notes](STATION_WAITING_IMPLEMENTATION.md). Descriptions below of its earlier closed connection are historical. The right escalator and lift now connect to the waiting hall after baggage collection.

## Implemented scope

The user's current request is **one floor at a time**. This delivers the public ticket hall, identity check, baggage screening, detector lane, screened lobby, and the ground-floor approaches to stairs/lift. The upper waiting hall, boarding gates, platform, train and new Shanghai destination remain future work.

The user's corrections supersede the overview's cutaway presentation: the platform/train must be hidden from the entry hall; ground-floor walls represent one storey beneath 2F; the gameplay camera must stay inside the actual room without displaying the tan slab outside the room. The final opaque wall art and the authored camera region implement these corrections. Camera zoom increases where the hall tapers, with desktop and phone framing checked.

## Playing this floor

Enter through the existing station entrance in `shantang`. Speak to the ticket clerk, request a Shanghai ticket, show a passport, then visit the entry-check staff member. Deposit the bag at the scanner, physically walk through the detector, and collect it on the screened side. Stairs and lift explain that the waiting hall is not open yet. Return through the checkpoint and south entrance to the original forecourt.

The booking survives leaving. Security clearance lasts while inside the station, including returns to the ticket hall. Leaving the station requires a fresh identity/baggage check on re-entry. Neither player nor Panda can bypass the security boundary. Ordinary conversations cannot book a journey. There is no new fare or XP gate. Existing boat travel, starting-town scene ID `shanghai`, traveler identity/history and saves are preserved.

## Files and integration

- `public/data/station-interior.js`: `station-ticketing` scene, production coordinates (1024×1536 source, scale 1.5), collision polygons, security variants, interaction points and seat manifest.
- `public/data/station-journey.js`: validated booking/security state and revision-aware save merges; later exits supersede stale screened saves.
- `public/game/station-interactions.js`: guided clerk/security conversations using existing pinyin, translation and audio panels. Future `station-waiting` transition only runs when registered.
- `public/game/room-camera.js`: constrains the complete viewport to the room polygon, increasing zoom when necessary. No changes to other rooms' camera bounds.
- `public/game/station-interior-art.js`: controlled readable signage, dynamic detector leaves and baggage. The bag reuses the painted atlas backpack silhouette.
- `public/game/station-layers.js`: reused transparent environment masks now support either landscape or portrait source plates. Bench/map use directional actor masking.
- `public/game/engine.js`, `world.js`, `render.js`, `public/app.js`: scene registration, guarded transitions, checkpoint progression, save repair, traveler visibility and rendering.
- `public/sw.js`: offline cache `xiongmao-shell-0.9.6-station-ground-92`, including all new modules and optimized images.

Xiaocheng keeps ID `station-traveler`. His outdoor departure continues while the player is in the ticket hall; he appears indoors only after entering. His indoor opening and directions acknowledge the completed meeting.

## Artwork and seats

Generated with the **built-in image_gen tool**, then copied into the project:

| Asset | Source | Optimized runtime file |
| --- | --- | --- |
| Enclosed, single-storey ground hall | `public/assets/world/station-ground-v3.png` | `public/assets/optimized/station-ground-v3.webp` |
| Ticket clerk, security assistant and seated reader | `public/assets/characters/station-interior-people-v1.png` | `public/assets/optimized/station-interior-people-v1.webp` |

The exact generation/edit prompt set is saved in [ground-floor-image-prompts.json](references/station/ground-floor-image-prompts.json). The final plate is the single-storey edit, and the transparent character atlas is the second prompt. The initial platform-visible draft is archived as `references/station/ground-v1-platform-draft.png` and is never loaded by the game. Final tool outputs originated at `exec-da2cd7d0-dce0-4c12-bb38-6fd444f8c940.png` and `exec-bf8c9ed1-d7d2-46df-9f5f-5140455ace59.png` in this chat's generated-image directory.

The public bench has one painted seated man with a suitcase, one live seated reader (林阿姨) with a backpack, and an empty far seat. This is a 50/50 seated-passenger split. The reader uses a seated pose and never duplicates a painted person. Occupied seats/luggage have collision footprints. The sleeper across multiple seats belongs to the future 2F build.

## Validation

Node 26.8.2; isolated in-memory browser-test saves, never the user's live save.

- `npm run check` and `git diff --check`: passed.
- `test/station-interior.test.js`: camera corners on desktop/portrait phone/landscape phone, entry/return routes, blocked and open security, furniture, progression, reload/save merges, traveler identity and future-scene guards passed.
- `scripts/browser-station-interior.js`: actual exterior entry → ticket dialogue → verification → bag deposit → physical detector passage → collection → stairs boundary → reload → return/re-screening → exterior passed. Includes phone touch, seated conversation, indoor Xiaocheng, offline reload and player/Panda floor samples.
- `scripts/browser-station-ground-layers.js`: eight reachable player/Panda views, map front/behind compositing, bench side, ticket counter, both baggage positions and detector passed; screenshots visually inspected.
- Existing `scripts/browser-boat.js`, `scripts/browser-station-exterior.js` and `scripts/browser-station-layers.js`: passed.
- Full `npm test`: **249 passed, 3 failed, 252 total**. All three failures reproduced in an untouched `git archive HEAD` copy: existing authored-text scanner in `test/language.test.js:67`, visitor-3 movement range in `test/life.test.js:122`, market-cat range in `test/life.test.js:209`. No additional full-suite failures remain.

Playable screenshots: `test-results/station-interior/entrance-desktop.png`, `ticket-windows-desktop.png`, `screened-lobby-desktop.png`, `ticket-hall-phone.png`, `bench-phone.png`. Layer close-ups: `test-results/station-ground-layers/`. Test output folders are ignored by Git.

## Camera and counter follow-up

The room camera now solves its fitting zoom continuously, replacing the visible 1.5% zoom steps near security. Frame-rate-independent easing interpolates the viewport rectangle inside the convex room boundary and continues until settled after walking stops. Camera continuity survives security scene-variant changes; resizing or entering another scene resets the framing. The detector sweep regression covers desktop and both phone orientations.

Counter staff have larger, lower-aligned portraits clipped to their service openings. Foreground masks trace only the intercoms and desk equipment; empty glass and the chair back no longer erase torsos. The officer is fully behind the desk's actual rear edge (source y489–490), with a pixel comparison confirming that adding him changes no pixels on the exposed desktop. New counter close-ups are included in `scripts/browser-station-ground-layers.js`.

## Next floor

Build `station-waiting` separately, retaining the current stair/lift orientation and the approved broad 2F waiting hall. Add the upper amenities, four massage chairs, mixed painted/live seating and sleeper; then implement boarding gates, checked landing, and the separate descent to the ground-level platform. Do not open a direct ticket-hall/platform shortcut. The stairs/lift currently carry `integrationTarget: "station-waiting"`; a missing scene never falls back to town.
