# Station exterior implementation

The legacy `shantang` destination now represents **苏州站 · 河边码头**. The original town (`shanghai`) and its 500 XP departure gate remain intact. The lower-left boat landing leads along the quay, across the broad diagonal bridge, and into the station forecourt. The forecourt tapers into a planted northern point, closing exploration naturally while the facade continues into the distance. The reference layout is preserved; the fixed elevated camera and live characters use the town renderer.

## Exterior boundary

`station-entrance` currently opens an authored inspection. Its painting previews a public ticketing vestibule, with counters on the left and a separate entry-check partition beyond. It does not transition to town, an unrelated room, or a platform. Full ticketing gameplay, security, waiting, boarding, the train and Shanghai remain future work.

`STATION_TICKETING_SCENE` and `connectStationTicketing(scenes)` in `public/data/station-exterior.js` are the explicit integration point. When a real `station-ticketing` scene is registered, the entrance becomes a door. That future room must provide its own return door to this forecourt. The outdoor doorway remains accessible without another XP gate.

## Geometry, characters and saves

- The production plate is 1536 × 1024, scaled by `STATION_SCALE` (1.8). `walkableFloor` traces a connected quay, gangplank, angled bridge deck and forecourt. Planter footprints are additional solids; water, parapets, facade and road remain outside the floor.
- `public/data/station-props.js` traces 40 ground footprints and 42 individually sorted prop layers, including curb bollards, bridge posts, the quay lamp, rope posts and both banks’ planters. `public/game/station-layers.js` builds cached transparent canvas layers from the decoded production plate: traced wood/stone silhouettes plus color-matted foliage. Paving and branch gaps stay transparent. Live player, Panda, boat, Suyin and fellow traveler remain separate from the painting.
- `public/game/station-signs.js` draws controlled Hanzi aligned to the painted boards. The station name, ticket sign and canal poster have interaction context. Ticketing is distinct from controlled passenger entry.
- Existing `back-town`, `shantang-host`, `shantang-story` and `shantang-riddles` IDs are retained. Suyin visits the forecourt; riddles remain near the canal. Xiaocheng asks for ticket-office directions and accepts English, help and departures through the existing conversation UI.
- Map version 14 moves older station saves to dry arrival ground while preserving progress and history. Version 13 town/interior positions stay unchanged. Return coordinates are still assigned from the actual town dock.
- The new background has an optimized WebP mapping and service-worker shell entry. Optimizer discovery includes the station module. The existing journal-icon changes are retained.

## Artwork provenance

Built-in imagegen was used with the handoff exterior as the edit reference. The first front-on draft was rejected and is not shipped. The final production asset is `public/assets/world/station-exterior-v2.png`, with runtime copy `public/assets/optimized/station-exterior-v2.webp`. The user confirmed that the layout matters, some flattening is fine to match town, and the broad bridge should remain.

Final layout prompt:

```text
Use case: precise-object-edit. Asset type: production background for existing 2D watercolor game. EDIT this reference preserving its EXACT camera angle, diagonal layout, architectural orientation, canal shape, bridge position, large station scale, landscape 1536x1024 composition and warm painted style. The user specifically rejected a flattened front-on layout: preserve this image's angled receding perspective unchanged.
Remove ALL people and ALL pandas including people inside the entrance and boat. Remove ONLY the boat at bottom-left so the existing game vessel can be placed there later, but KEEP its wooden gangplank meeting the quay in the same position. Remove ALL letters, numbers, words, arrows and icons from every sign, leaving the decorative boards and canal illustration intact with blank cream text areas. Keep blank station-name board and blank blue ticket-office board at the exact original facade positions. Remove the large taxi canopy at right foreground (it obscures pedestrians), fill its place with continuous open forecourt paving. Keep two parked cars on road at bottom right, no moving traffic or buses. Keep the station long and tall, running diagonally away to upper-left and beyond right frame. Keep the boat landing bottom-left, quay, diagonal low arched bridge, teal water and lush plants in exactly the reference composition. Slightly widen the clear bridge deck between parapets for navigable player characters but preserve its angle. Through the existing doorway, show ONLY a shallow public ticketing vestibule with cream floor, ticket counters on LEFT, clear central aisle and closed glass entry-check partition far behind. NO platform or train. No new objects or text. This is a clean production background, no HUD or annotations. Preserve painterly gouache warmth and details; do not simplify into rigid straight vertical canal or horizontal facade.
```

Bridge clearance correction applied to that result:

```text
Edit only bridge exit clearance in this image. Preserve camera, orientation, architecture, boat landing, diagonal canal, bridge, road, colors and all remaining scenery exactly. Move the large wood-framed canal-poster board currently just right of bridge about 100 pixels to the RIGHT and 50 pixels UP. Move its base flowers with it. Remove the large flower planter directly below the bridge's right end (around x690,y580). Fill these vacated places with continuous cream forecourt paving, giving the bridge deck a generous unobstructed connection into the forecourt to the right. Keep the low front parapet and arch, but no upright stone post or wall across its east/right walking opening. Keep all signs blank, no text, no people, no boat. This is a small navigation clearance correction, not a new composition.
```

## Validation

Use Node 26.8.2, `npm run check`, `node --test test/boat-dock.test.js test/station-exterior.test.js`, `node scripts/browser-boat.js`, and `node scripts/browser-station-exterior.js`. Both browser scripts start isolated in-memory servers and use `/usr/bin/chromium`; they do not touch the live save. Screenshots are written under `test-results/station-*.png`.

The station unit checks cover continuous routes, blocked water/rail/road/building/planter shortcuts, old-save migration, actual dock return, guarded future-room integration and flexible traveler dialogue. The browser check exercises keyboard, mouse and touch navigation, Panda, inspection, reload, history and offline caching. Final results and selected screenshots are recorded alongside the delivery.



Validated October 10, 2026:

- `npm run check` and `git diff --check`: passed.
- `node --test test/boat-dock.test.js`: passed. Focused station, navigation, map-interaction, dialogue-variation, pronunciation and speech tests passed.
- `node scripts/browser-boat.js`: passed, including 0/499 XP refusal, 500 XP boarding, exact dock return, and conversation-history preservation.
- `node scripts/browser-station-exterior.js`: passed on desktop and 390 × 844 phone, including continuous player/Panda dry-floor samples, keyboard/click/tap interactions, blocked bridge rail, old-save/reload safety, entrance boundary and offline artwork/module cache. No page errors.
- Full `npm test`: **213 passed, 3 failed (216 tests)**. The same three failures reproduce in an isolated untouched HEAD archive: the language scanner rejects an existing `public/app.js` toy-discovery string; `life.test.js` expects a wider visitor-3 range and a wider market-cat range. These unrelated failures were not modified. Subsequent small station-only boundary refinement also passed the focused six-test station suite.
- Initial screenshots missed several collision/layering defects subsequently reported by the user. The correction pass below supersedes that initial visual assessment.

Representative screenshots:

- [Whole exterior](../docs/screenshots/station-overview.jpg)
- [Bridge with player and Panda](../docs/screenshots/station-bridge.jpg)
- [Phone entrance view](../docs/screenshots/station-phone.jpg)
- [Tapered northern promenade](../docs/screenshots/station-plaza-point.jpg)

The original uncommitted changes in `public/index.html`, `public/styles.css`, the journal icon and its service-worker inclusion were preserved.

## Collision and layering correction — October 10, 2026

All nine user screenshots were reviewed: roadside bollards, three views of the large foreground tree, the bridge-side tree/post, two north-bank planter/banner positions, the facade-side canopy, and the quay lamp. The broad opaque painting clips have been replaced with the individual transparent prop layers above. Each collider follows the ground footprint, not the projected crown or top of a tall prop; standing behind an object remains possible where the paving allows it, with the object drawn in front at its own depth. The large bridge, tapered plaza, camera, production painting and boat progression are preserved.

The station uses a 12-world-pixel navigation grid with the actual 15-pixel movement radius to resolve the narrow diagonal gaps. Other scenes retain their existing 24-pixel grid and 19-pixel clearance. Every path edge still passes the normal collision checks; diagonal corner cutting remains prohibited. Static polygon bounding boxes reject distant props before expensive edge tests. Current-version saves already repair positions newly covered by colliders without changing XP or history.

Validation after the corrections:

- `npm run check`, `git diff --check`, and the station, world, shop rear-path and boat unit checks pass.
- `scripts/browser-station-layers.js` renders 12 player/Panda regression views from valid paving and checks alpha values: known open paving is transparent; sampled leaves, masonry, lamp and post surfaces are opaque. It also draws all collider footprints over the production painting for visual inspection. This script uses an isolated in-memory server and writes captures under `test-results/station-layers/`.
- Station unit checks exercise contact with 18 reported/related props from many accessible angles, plus complete paths to 12 regression positions. The regular browser test covers keyboard travel into the narrow northern tip, mouse/touch routes, Panda, entrance inspection, save/history preservation and offline loading of the new modules.
- Boat browser checks pass at 0/499/500 XP and verify the existing return dock.
- Full suite: **214 passed, 3 failed (217 tests)**. The failures remain the previously established unrelated language-scanner, visitor-3-range and market-cat-range expectations. Localhost-dependent tests were run with network permission; an initial sandbox-only run could not start those servers.
- The service-worker shell includes both new geometry/layer modules (introduced with cache 75; the concurrent household/traveler work has since advanced the shared cache). No production artwork was regenerated for this correction.
- Concurrent household/traveler changes in the shared workspace were preserved; the station route/footprint tests and layer captures were checked again with the new exterior traveler cast.

Corrected examples: [tree and curb post](../docs/screenshots/station-layer-tree.png), [quay lamp](../docs/screenshots/station-layer-lamp.png), [north-bank planter](../docs/screenshots/station-layer-planter.png).

### Quay front-side depth and full lamp support

A subsequent user screenshot showed the player on the public path in front of the diagonal flower row, incorrectly covered by its near boxes. That row now has an authored angled front edge. The renderer classifies each actor's feet against that edge and applies the foliage alpha only to an actor behind it. A transparent actor buffer preserves other characters already drawn in front. The planter footprints remain solid; the player can stand beside them but cannot enter their bases.

The southwest lamp mask now includes its full support from the top cap to its base below the quay wall, plus separate lantern and bracket silhouettes. Its depth and footprint use the actual support base rather than the previous truncated mask.

The regression harness now covers 16 views and compares actual rendered pixels for front-side versus rear-side flower occlusion. It checks the lamp cap, upper pole and lower pole alpha separately. All eight station unit tests pass, including approaches into the planter bases. Corrected views: [front of the flower row](../docs/screenshots/station-quay-flowers-front.png) and [behind the complete lamp](../docs/screenshots/station-quay-lamp-pole.png).
