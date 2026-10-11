# Station exterior build handoff

Build the playable boat-arrival and station-forecourt area in the existing Xiongmao World game at `/home/jlrj/Documents/lotus`. The user has completed several visual-design iterations and now wants a new thread to implement the exterior. Preserve the existing boat departure, create a clear walk from the landing across a bridge to the station, and prepare the entrance for the future ticketing interior.

This handoff and its reference images are the deliverables of the research thread. No station gameplay has been implemented. Read [the research findings](/home/jlrj/Documents/lotus/handoff/STATION_RESEARCH.md) before building. They distinguish verified railway practice from the game's spatial simplifications.

## Scope and settled direction

- Continue the existing local JavaScript/canvas game. Do not scaffold another app or publish to a hosting service.
- Build the outside area, boat arrival/return, navigable bridge and forecourt, station facade and entrance interaction. Add a small amount of relevant conversation and sign discovery using existing systems.
- Preserve the future sequence: ticketing, entry verification/security, waiting hall, boarding gate/platform, cozy train conversation, Shanghai. The full interior, train ride and Shanghai are later work.
- The current town boat trip remains the way to reach the smaller area. Upgrade that destination rather than inserting another compulsory travel hub or a second boat journey.
- The user explicitly likes the latest waiting-hall/platform connection and substantial station scale. The latest exterior is a proposed composition, not a demand to reproduce every generated pixel.
- Work autonomously on normal implementation choices; do not repeat the visual-discovery interview. Check current repository instructions and changes before editing.

## Visual references to inspect

![Proposed boat landing and station forecourt](/home/jlrj/Documents/lotus/handoff/references/station/exterior-concept-v1.png)

![Station interior context with restored decorative signs](/home/jlrj/Documents/lotus/handoff/references/station/interior-context-v1.png)

Both images were created with the built-in image-generation tool during this design thread and copied into the repository for continuity. They are concept references, not production backgrounds. The four `sign-*.png` files in the same directory are user-supplied crops. Use the exterior for composition and the interior for the doorway's destination, materials and larger building scale.

Inspect these existing game assets as the final style authority:

- `/home/jlrj/Documents/lotus/public/assets/welcome/town-960.webp`
- `/home/jlrj/Documents/lotus/public/assets/optimized/restaurant-interior-v3.webp`
- `/home/jlrj/Documents/lotus/public/assets/optimized/neighbors.webp`
- `/home/jlrj/Documents/lotus/public/assets/optimized/player-idle.webp`
- `/home/jlrj/Documents/lotus/public/assets/optimized/panda-v2.webp`
- `/home/jlrj/Documents/lotus/public/assets/optimized/suzhou-passenger-boat.webp`
- `/home/jlrj/Documents/lotus/docs/screenshots/canal-walk.jpg`

The look is tactile painted gouache/watercolor, warm cream stone, muted teal water, slate tiles, restrained wood and sunset light. People remain friendly cartoon adults. Avoid drifting into photorealism, glossy 3D, tiny chibi people or an ornate palace. Panda is the existing oval cream-and-black companion with a broad black belly band and very small limbs; reuse the current sprites and follower behavior.

## Exterior layout

Use a fixed elevated camera consistent with the game, with readable walking surfaces and no camera rotation. The overview may be broad, but gameplay should keep characters legible and scroll as needed.

1. Put the boat and arrival landing at the left/lower-left. Show a gangplank physically meeting the quay. Spawn the player and Panda on valid dry ground, with space to turn and return to the boat.
2. A short quay walk leads to the stone pedestrian bridge. The bridge crosses visible water, joins both banks and has a generous clear deck. Parapets and decorative posts must not block the walkable opening.
3. The bridge opens into a modest forecourt with the station entrance visible ahead/right. Give the player one obvious main route plus small places to pause, read a sign or talk. Do not make another market district.
4. The station occupies the upper/right part of the scene and extends past the visible boundary. Tall windows, repeated columns and a long facade convey the larger station. The playable entrance is one bay within it.
5. Put a short access road with a few vehicles along the far right/lower edge. Separate it from the pedestrian area with a curb and bollards. The main route need not cross traffic. This is a fictional road arrangement, not the real station's taxi rank.
6. Through the entrance show a shallow preview of the future public ticketing vestibule: cream floor, ticketing to the left and a clear forward aisle. The preview must agree with the later room. Do not show an immediate opening straight onto secure platforms.

The river/bridge placement is intentional geographic compression. The real boat-to-south-square connection is supported by sources, but this particular bridge is invented. Preserve the user's requested route without claiming a literal Suzhou street map.

## Signs and interaction

Use a few signs, not every reference in every view. The exterior canal poster and station name are the priority; the other reference signs establish the later indoor continuity.

| Location | Text | Purpose |
| --- | --- | --- |
| Main facade | 苏州站 | Station identity |
| Public ticketing entrance or side panel | 售票 / TICKETS | Shows where the learner buys a ticket before controlled entry |
| Controlled entrance beyond ticketing | 进站口 / ENTRANCE | Passenger-entry direction; keep distinct from ticketing |
| Near bridge or forecourt bench | 平安出行 温暖相伴 | Warm decorative travel poster |
| Optional route sign | 售票处 → | Direction practice aligned to actual geometry |
| Future waiting-hall hot water | 一杯热水 温暖旅途 | User-selected tea sign |
| Future ticketing mural | 铁路连通美好生活 | User-selected canal mural |
| Future platform | 向更好的远方出发 | User-selected mountain poster |

The concept calls the outer portal 进站口, but if it opens into the pre-security ticketing vestibule, make the ticket-office route explicit with 售票 signage. Preserve the design while avoiding a lesson that buying a ticket requires bypassing passenger-entry checks.

Render clear functional Hanzi using the existing controlled-sign pattern where practical. Do not trust generated glyphs. Optional pinyin/English belongs in existing interaction UI rather than cluttering the painting.

The fellow traveler needing directions is a user-approved narrative idea. One short encounter near the bridge or plaza is enough for this exterior slice. Example language: “请问，售票处在哪儿？” with a spatially true response such as “过桥以后，往右走。” Adjust wording to the final layout. Let the player ask for help, use English or leave; avoid making one exact sentence mandatory. Do not add another XP gate at the station.

## Current repository integration

The game is already implemented and playable. The older `/home/jlrj/Documents/lotus/handoff/BUILD_HANDOFF.md` contains useful style history but its initial scaffold instructions and old city order are stale; this task does not restart the project.

**Critical naming fact:** `scenes.shanghai` is the legacy ID of the existing Suzhou-inspired starting town. It is not the new Shanghai destination. Do not rename it casually or reuse it for the future city.

The boat currently unlocks at 500 XP and transitions from `shanghai` to `shantang`. Prefer developing the existing `shantang` scene into the station approach while preserving its ID, return journey and saved progress. Its current text calls it Shantang Street; update location descriptions to the station-side quay so the player is not taught that Suzhou Station is on Shantang Street. Preserve or thoughtfully relocate its existing host, discovery and practice interactions. If a different scene split is technically necessary, preserve old-save compatibility and avoid inserting an extra required level.

| Files | Relevant behavior |
| --- | --- |
| `public/data/town-rooms.js` | Defines `shantang`: currently 1800 × 1200, spawn (450, 780), central canal/bridge, `back-town`, `shantang-story`, `shantang-host`, `shantang-riddles`. Use these facts as the starting state, not fixed final coordinates. |
| `public/data/town.js`, `public/data/market.js`, `public/data/town-layout.js` | Starting-town `next-area` gate, boat artwork, dock geometry and later transforms. Preserve departure behavior. |
| `public/game/world.js` | Scene registry, `MAP_VERSION` (13 at research time), geometry and save migration. Assigns the return point of `shantang` from the actual departure dock. |
| `public/game/adventure.js`, `public/data/adventure.js`, `public/game/goals.js` | Boat panel and 500 XP unlock. `enter-next` calls `changeScene(o.target)` and rechecks XP. |
| `public/game/engine.js` | Movement, pathfinding, Panda following, scene loading, `enterDoor`. Missing scene IDs fall back to town in `changeScene`; never use a nonexistent target as a placeholder. |
| `public/game/terrain.js`, `public/game/render.js`, `public/game/bridges.js` | Ground/water/bridge drawing, asset loading and depth. Align art and collision. |
| `public/game/language-signs.js` | Example of replacing painted glyphs with controlled text. |
| `public/data/navigation.js`, `public/game/map.js`, `public/game/directions.js`, `public/game/interactions.js` | Destination lists and guidance. Some logic recognizes `shanghai`/`shantang` as outdoors; inspect before adding IDs. |
| `public/data/art-bounds.js`, `public/data/optimized-art.js`, `scripts/optimize-art.js`, `public/sw.js` | Art bounds, optimized variants and offline loading. Optimizer scans a fixed list of source files; extend discovery if assets move to a new module. |

All table paths are relative to `/home/jlrj/Documents/lotus`. Inspect current versions; line numbers and file state may change between threads.

At handoff creation, unrelated work already modified `public/index.html`, `public/styles.css`, `public/sw.js`, and added `public/assets/journal-icon.svg`. Preserve it. No AGENTS.md was found in the project or its checked parent directories; recheck on arrival.

## Production approach and boundary

First establish traversable geometry and valid entrance/return points. Then produce clean background art using the imagegen skill and the saved references, with separate live characters and any animated vehicles. Never use the concept's baked-in people as substitutes for real NPCs. Separate foreground bridge rails, plants and facade pieces where necessary for proper occlusion. Avoid baked-in navigation arrows or numbered room labels.

Keep water blocked except on the actual deck and gangplank. The same geometry should drive visual banks and collisions. Make the bridge shallow and continuously walkable; any visible steps must have a matching traversable route. Keep road traffic decorative for this slice, with no driving mechanic or collision hazard minigame.

The exterior ends at the real station doorway. Wire it to an existing ticketing room if one has been added by the time work starts. Otherwise provide a useful authored entrance inspection using the existing UI, keep the return route working, and expose a clearly named integration point for the later room. Report interior entry as pending; do not silently send the player to town or an unrelated interior. Do not expand into building the entire railway sequence merely to fill that boundary.

The train should eventually be above ground. The approved flat waiting-hall/platform connection remains a proposed gameplay simplification; final vertical circulation is not settled and is outside this exterior task. Preserve space for either interior solution without adding arbitrary exterior stairs.

## Validation and completion

Use existing tooling: Node version specified in `package.json`, `npm run check`, appropriate unit tests, and Playwright with `/usr/bin/chromium`. `scripts/browser-boat.js` starts an isolated in-memory server, seeds state and mutes audio; reuse that pattern instead of changing the user's live save.

Validate the meaningful behaviors:

- Existing boat still refuses departure at 0/499 XP and allows it at 500 XP; XP and history survive the trip.
- Arrival and return work; the return reaches the actual starting-town dock.
- WASD/arrows, tap/click navigation and Space/E interactions can reach the bridge, signs, traveler and station doorway.
- Water, bridge rails, facade, planters and road boundaries match visible obstacles. No shortcut through water or scenery; no invisible obstruction on paving.
- Panda follows across the bridge without trapping or cutting across water. NPCs remain inside their reachable areas.
- Door preview and approach match the intended interior entrance. Scene reload and old `shantang` saves land on valid ground after any geometry change.
- Desktop and phone screenshots show legible people, correctly layered bridge rails/trees, usable controls and no clipping. Inspect screenshots visually.
- New art loads successfully online and through the project's offline behavior; no console errors. Keep reduced-motion and audio preferences.

Run `node --test test/boat-dock.test.js` and `node scripts/browser-boat.js` for the existing departure/return regression, plus a focused browser check of the new exterior. Run `npm run check` and the relevant broader tests for changed systems; do not treat syntax-only checks as gameplay validation. Do not claim the full test suite passed unless actually run.

Deliver the implemented exterior, representative screenshots, test results and a short explanation of the entrance boundary. Update relevant project documentation. Keep the game's art style and continuous spatial route as the primary acceptance criteria.
