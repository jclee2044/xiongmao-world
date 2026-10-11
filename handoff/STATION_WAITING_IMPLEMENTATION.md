# Station second-floor implementation

The later [platform implementation](STATION_PLATFORM_IMPLEMENTATION.md) connects the checked stairs and lift below. The earlier notes below describe the scope when this floor was first built.

Built October 11, 2026 in `/home/jlrj/Documents/lotus`. The playable `station-waiting` scene follows the approved upper-floor reference: sunset windows, twelve blue bench banks in four rows, snack shop, café, toilets, help desk, hot water, four massage chairs, departure board, boarding gates and checked landing.

## Connections and progression

Complete the existing floor-one ticket/identity/baggage sequence and collect the bags. The **right ascending escalator** reaches the north landing of the recessed upstairs well. Both floors use the existing animated-tread renderer, with left down/right up, matching handrails and steel treads. The left upper escalator returns to the left lower landing. The lift has its own matching arrival and return positions. Going between screened floors retains security permission; returning through ground-floor security to the ticket hall retains it. Leaving the station resets it.

The waiting hall approaches the right-hand gate row from the open north aisle. Its western partition extends only south, alongside the checked landing. A guided passport check opens the short gate leaves, with collision changing at the same time. An accessible lane remains available. The booked journey and boarding permission survive reload, merge conservatively, and reset when leaving screened space. Save validation uses the open gate geometry, so stopping inside a cleared lane also persists correctly. Unauthorized upstairs saves return safely to the public hall; stale checked-landing saves return to the waiting side.

Stairs and lift beyond the gates point to the guarded future `station-platform` integration. **The platform, train ride and new Shanghai destination are not implemented in this floor-two request.** Their inspection explains the boundary without invoking an absent scene. No additional XP barrier or train number/timetable was invented.

## Artwork and seating

Produced with the built-in `image_gen` tool. Exact prompts: [station-waiting.json](../art/prompts/station-waiting.json).

- Room: `public/assets/world/station-waiting-v3.png` (1536 × 1024).
- Six live seated poses with integrated luggage and true alpha: `public/assets/characters/station-waiting-people-v1.png`.
- Runtime WebP copies: `public/assets/optimized/station-waiting-v3.webp` and `station-waiting-people-v1.webp` (about 568 KiB combined).
- Full renderer capture: [station-waiting-overview.png](../docs/screenshots/station-waiting-overview.png).
- Earlier room versions are retained as unused source drafts; only v3 loads at runtime.

There are **six environmental seated travelers and six live seated travelers**, all with luggage. The painted sleeper rests across four adjacent seats near the security arrival, with a backpack pillow and rolling suitcase. That whole bench is unavailable to live actors. One painted traveler occupies a massage chair; the other four occupy blue benches. The six live actors use distinct seated poses aligned to reserved empty seats. Many seats remain empty. `waitingSeatManifest` records the split.

The floor data traces bench bases, luggage, plants, well, partition and rail footprints. Directional transparent masks reuse the room's own pixels, preserving paving gaps and handling player/Panda occlusion individually. Controlled game text supplies the Chinese/bilingual signage. Xiaocheng retains his existing ID and conversation history, with an upstairs greeting and directions.

## Implementation

- `public/data/station-waiting.js`: floor geometry, connections, seats, layer masks and gate variants.
- `public/data/station-waiting-characters.js`: six seated conversation profiles; voice casting and discussion subjects use existing systems.
- `public/game/station-waiting-art.js`: signs and dynamic gate leaves.
- Existing station journey, interaction, rendering, world and engine modules integrate both floors and validated saves.
- `scripts/optimize-art.js` discovers the new plate; service-worker cache `xiongmao-shell-0.9.8-station-waiting-99` includes both assets and all new modules.

## Validation

Node 26.8.2, isolated in-memory browser saves; no personal save used.

- `npm run check`, `git diff --check`: passed.
- Full `npm test`: **263 passed, 3 failed, 266 total**. The three failures (authored-text scanner, visitor movement range, market-cat range) reproduce in an untouched `git archive HEAD` checkout.
- Final focused geometry/progression/camera/save checks: **49 passed**. Dialogue/voice and station checks: **36 passed**.
- `scripts/browser-station-interior.js`: actual exterior entrance, purchase, screening, ascent, descent, return/re-screening, phone and offline behavior.
- `scripts/browser-station-waiting.js`: upper arrival, services, boarding passage, checked landing, saved/reloaded gate state, lift both ways, seated conversation, Xiaocheng, phone touch, Panda floor samples, offline assets.
- `scripts/browser-station-waiting-layers.js`: nine reachable player/Panda views, masks for bench/person/luggage/rail pixels and transparent gaps, front/behind rendering, both animated tread lanes with no leakage, full overview.
- Existing boat, exterior and ground-floor escalator browser regressions. The exterior test fixture now packs luggage to satisfy the pre-existing entrance requirement.

Desktop, phone and layer screenshots are under `test-results/station-waiting/` and `test-results/station-waiting-layers/`. The overview above is retained in the repository.

## Clickable reference wording

The café now reads `简餐 / CAFÉ`, and the mural reads `人间天堂 · 苏州`. All 17 upper-floor labels—including restrooms, help desk, hot water, lifts, directions and departure status—use shared canvas/DOM geometry from `public/data/station-waiting-signs.js`. Click, tap, Enter or Space opens Panda’s explanation with pinyin, English meaning and replayable Chinese speech. Offscreen controls leave the keyboard focus order; selecting lettering still allows word selection without walking. The departure status explanation changes with boarding state.

Service-worker cache: `xiongmao-shell-0.9.8-station-waiting-signs-100`, including the new phrase module.

Follow-up validation: `test/station-waiting-signs.test.js` checks explanation language and non-overlapping hit boxes; `scripts/browser-station-waiting-signs.js` checks all 17 labels on desktop and phone, keyboard access, speech/replay, both boarding states and unchanged player position. Existing exterior sign, waiting-hall progression/offline and layer browser checks passed. JavaScript syntax and whitespace checks passed. Overview refreshed above.

## Reference lettering refinement

The upper-floor signs use regular brush lettering for Chinese and narrow hand lettering for English, painted at the illustration’s native resolution. The mural inscription is smaller and softly integrated into the artwork. The departure board has Train, To, Time, and Status columns: Shanghai 18:20, Nanjing 19:05, Hangzhou 19:40, and Wuxi 20:10. These are authored game times; the Shanghai status follows the player’s boarding check. Shared geometry preserves the original sign explanations and adds a selectable 18:20 explanation, for 18 keyboard/touch controls. Bundled Ma Shan Zheng and Patrick Hand subsets load offline. The close-up is `docs/screenshots/station-signage-reference-detail.png`. Sign interaction checks pass on desktop and phone; focused timetable/geometry tests and the scene-layer checks pass.

The massage-chair sign and its selectable sign explanation have been removed; the four chairs remain in the hall.

The follow-up readability artwork uses two localized imagegen-edited faces from `station-sign-readability-v1.png`: an open ivory sky behind the mural inscription and a dark blue departure-board face. The renderer composites only the faces before lettering, leaving the production plate and its masks aligned. `prepareWaitingSignArt` waits for the backing and fonts, and retries failed loads. The backing is cached offline; the existing interactive sign areas track the adjusted mural text position.

Readability validation: the full scene-layer browser check, sign/timetable unit checks, syntax/whitespace checks, and a focused offline reload with the new backing and both font faces all pass. The refreshed close-up and overview are in `docs/screenshots/`.
