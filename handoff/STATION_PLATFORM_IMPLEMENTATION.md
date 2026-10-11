# Station platform implementation — October 11, 2026

The platform is now playable after the upstairs boarding check. Initial workspace changes were committed first as `fafbf9e`.

## Final direction

The user's sketch and later corrections supersede the initial side-view concept: use a high overhead view, stairs at upper left, and a straight vertical track on the right. The platform was extended north alongside the stairs, then the top was cropped to the former balcony ledge. The final revision narrows the open floor by about 250 logical pixels and removes the bottom 20%, producing a compact 1206 × 864 logical composition and roughly 25% closer desktop framing. The stair flight continues off the top edge; its upper landing is never visible. Grey treads, pale nosings, bronze posts and slim glass-sided handrails follow the floor-two staircase. Both scenes declare a 288-world-unit clear stair opening; the platform scale accounts for the different source image dimensions.

The complete small scene stays in frame, with no camera tracking. Portrait phones use a centered overview with matte space around the painting; landscape provides a larger view. This intentionally preserves both rail ends and the stairs rather than zooming in on the player.

## Assets

Built with the built-in imagegen tool; complete prompts and edit history: [station-platform.json](../art/prompts/station-platform.json).

- Final plate: `public/assets/world/station-platform-v3.png` (1482 × 1061, rendered at 1206 × 864 logical pixels). It contains no train or live characters. The larger v2 draft is retained but no longer used at runtime.
- Train: `public/assets/world/station-train-overhead-v1.png` (1024 × 1536, true alpha), cropped by the renderer to the painted silhouette.
- Runtime WebP copies retain dimensions and alpha in `public/assets/optimized/`.
- The first, user-loved painting remains in `public/assets/world/station-platform-v1.png` and `handoff/references/station/train-ride-scenery-concept.png`. It appears in the README as future train-ride inspiration. A separate side-view train concept is preserved beside it.
- Playable captures: [empty platform](../docs/screenshots/station-platform-overview.png), [arrived train](../docs/screenshots/station-platform-train.png). Desktop, portrait/landscape phone, arrival, north walkway and offline captures are in `test-results/station-platform/`.

## Connections and behavior

`public/data/station-platform.js` owns geometry, stair/lift endpoints and independent train placement. Both upstairs connections lead to their matching lower landings, and both return to the checked upper landing. Boarding authorization and screening are retained. Direct engine entry and saves reject unchecked platform access; stale platform saves return to the appropriate waiting/public floor. Rails, the yellow edge, walls, stairs, lift and furniture are outside walkable space.

`public/game/station-train.js` owns the train independently of the painting. It waits three seconds, arrives over nine seconds, then remains indefinitely. It pauses with gameplay; reduced motion shows it stationary immediately. `trainArrived` persists in the existing journey save and resets on leaving screened space. The controller exposes explicit departure animation for later ride integration; it never automatically leaves the player behind. Arrival triggers an immediate save so continued walking cannot postpone the train state used by server conversations.

Fourteen traveler placements now populate the platform, with clear stair/lift landings and a central walking aisle. Nine reuse the established station cast; five named passengers reuse distinct casual sprites from the existing `roamers-idle.png` atlas. There are no duplicate appearances within the area, no new bitmap assets, and only one conversation bubble at a time. Xiaocheng retains his encounter visibility rule (thirteen travelers if he has not been helped yet), identity and history. Zihan remains outside waiting for his fiancée; Meifang is an arriving passenger heading toward her daughter outside.

`station-platform-travelers.js` supplies individual openings, voice registrations, travel subjects and scene-specific facts for both authored and AI conversations. Departing passengers have already completed ticket/security/boarding checks. Replies use saved train arrival state, give the upper-left return route, and preserve earlier outdoor and upstairs conversations. Panda, the player's satchel and suitcase remain live actors. Existing station music and subdued ambience continue here. The inspection explains arrival state and the current ride boundary.

**The train interior, actual boarding into the carriage, travel sequence and new Shanghai destination are not implemented in this compact-platform pass.** There is no fake destination transition or departure countdown.

New modules and images are in the offline cache. The image optimizer discovers the platform assets and avoids recompressing files that already point to their optimized destination.

## Validation

Node 26.8.2; browser checks use ephemeral local servers and isolated in-memory saves, not the user's personal save.

- `scripts/browser-station-platform.js`: stairs/lift both ways, animated arrival, fixed framing while walking, all fourteen clickable conversations, a saved-arrival dialogue reply, north walkway, train inspection, persistent arrival, phone touch, reduced motion, player/Panda floor samples and offline reload.
- `test/station-platform-travelers.test.js`: fourteen distinct registered travelers and appearances, cast voices, routes from both landings, scene-specific Chinese greetings/replies, no conversation side effects, and both AI prompt formats using checked platform facts.
- `test/station-platform.test.js` and `test/station-train.test.js`: navigation and edge collisions, paired floor endpoints, matching stair scale, save/entry guards, dialogue continuity, camera bounds, arrival/departure, reduced motion and persistence.
- Existing station-waiting browser fixture now visits the real platform and returns through the center of the open lane. Its offline expectation uses the current v2 seated-passenger atlas.
- Syntax and whitespace checks pass. Full-suite baseline comparison uses an untouched archive of `fafbf9e` under `/tmp/lotus-platform-baseline`.
- After the traveler additions, full suite: **324 passed, 4 failed, 328 total**. Focused platform/train/traveler checks: **9 passed**; shared dialogue/voice and traveler checks: **26 passed**. Existing waiting-hall, ground-floor and boat browser regressions pass.

The four unrelated baseline failures are the authored-language scanner (`更新游戏`), visitor movement range, market-cat movement range and the existing `station-help.js` pinyin alignment. They reproduce in the checkpoint archive.

The existing exterior browser script times out at its banner inspection (`#panel`, line 184). The same timeout reproduces in the untouched checkpoint; the ground-floor browser regression independently passes actual exterior entry and return.
