# Suzhou and station follow-up

Implemented on top of `f445d94` (shared Chinese/UI) and `bc6928e` (persistent rewards/progression), preserving the existing refactor and uncommitted dev-mode work. No deployment or save reset was performed.

## Player-facing changes

- Lian follows the player's traveled path with bounded movement and collision recovery, including restaurant entry. Invitations disappear once accepted; completed hotpot opens with thanks and a conversation question.
- Hotpot uses “你好！你想吃什么？”, 辣汤底 / 不辣汤底, a normal food caption outside the scene, and only the later Panda instruction.
- Lan's flower quest offers a location hint and a second hint that guides the player. The bouquet is larger and labeled; pickup tells the player to return it to Xiao Lan.
- Lin's directions quest targets the clothing store. Budget shopping ends without the unsupported follow-up text or Keep chatting/Try again controls. Completed town hints suggest journals and lantern riddles.
- The station entrance board blocks movement from either side. Desk staff and seated travelers have smaller, corrected placement. Café/snack staff reuse the actual popup portraits, cropped behind their counters. The platform uses a following, zoomed camera.
- Train arrival starts at the persisted platform conversation claims totaling at least 100 XP, never elapsed time. Existing total-XP requirements remain: 750 boat, 1400 platform entry, and 1500 total plus 100 platform XP to board. No second XP counter was added. Panda announces entry and suggests conversations after 45 active seconds without talking.

## New errands

| Activity | Completion | Quest XP |
| --- | --- | ---: |
| Meifang is thirsty upstairs | Accept, collect hot water, bring it back | 40 |
| Wenbo is stressed upstairs | Escort him to massage chairs | 50 |
| Jia Ni needs the bathroom | Type directions; she walks there | 80 |
| New traveler downstairs after an upstairs visit | Type an explanation of passport and luggage/security checks | 130 |
| Xiaojie carries trash on the platform | Talk to her, then help at the new bin | 50 |

All errands appear in Panda's hints and use stable, one-time claims through the existing reward system. Normal NPC opening/response rewards remain 5/15 XP with explicit conversation replay. The platform trash activity plus its ordinary conversation earns 70 local XP; four other conversations bring this to 150 total platform XP and 100 conversation XP without replaying an encounter. Upstairs/downstairs errand rewards do not count as platform XP.

`stationErrands` is additive save state with validation and monotonic merge. Existing XP, claims, suitcase, travel, language settings and dev-mode behavior are preserved. New modules are included in the bumped service-worker shell cache.

## Movement and rendering investigation

Player speed was not changed. Dock rendering was spending substantial time on environmental drawing and station actor masking. Changes cache ambient drawing at 20 Hz, cull offscreen actors, use local actor-sized mask layers, and prepare masks before scene interaction resumes.

Repeated headless Chromium measurements with the same moving-player fixture and a proper mobile viewport showed warm phone-emulated dock median frame-processing time falling from about 16 ms to 0.9–1 ms. The latest run's warm p95 was 28.4 ms; cold peaks can still exceed 200 ms. These are local CPU frame measurements, not physical-phone FPS or a claim that all stalls are gone.

The reported home tan screen was not reproduced during ordinary baseline travel. Added safeguards restore rendering contexts in `finally`, clear canvas state on scene transitions, discard stale loading generations, and retry a failed current-scene load once. Desktop/phone regression checks deliberately introduce stale canvas clipping and rapid scene changes, then verify visible home content and working movement. This improves recovery, but does not establish the exact cause of the original incident.

## Verification

- `npm run check`: passed.
- `npm run check:worlds`: passed (17 scenes, 69 characters, 133 assets).
- `git diff --check`: passed.
- `npm test`: **349 passed, 4 failed, 353 total**. Baseline was 338 passed, 4 failed, 342 total; the four failure details match exactly apart from timing. They remain failures:
  - Authored language range: `public/app.js`, “更新游戏 · Update game”.
  - NPC roaming range: visitor-3, 130.0333333333385.
  - Market cat range: `maxX - minX > 500`.
  - Contextual pinyin: station-help 售票处, `one0` versus `chu4`.
- `node scripts/verify/remaining-ui-browser.js`: desktop and touch-phone passed. Covers flowers, second hint, actual restaurant entrance, hotpot completion, shopping cleanup, all five errands, typed rejection/acceptance, escorted/walking completion, one-time rewards, 45-second platform hint, XP-triggered arrival, boarding UI, home and saved reload.
- `node scripts/verify/remaining-runtime-browser.js`: desktop and touch-phone passed. Exercises dock/station/home transitions, rendering, movement, interrupted return-home recovery, and produces visual review screenshots.
- `node scripts/verify/rewards-browser.js`: desktop/phone passed (normal rewards, explicit replay, reload, activity rewards and boarding thresholds).
- `node scripts/verify/language-interaction-browser.js`: desktop/phone passed (segmentation, contextual pinyin/speech requests, focus, Panda attribution, actions, help and boat travel).
- Dev-mode desktop/phone browser verification passed with the checked-in test updated to the established 750/1400 thresholds and current Settings layout. Password rejection, cancel, enable/reload/disable, and zero-XP travel passed.
- Offline upgrade check passed against the pre-change snapshot with `--additive-station-errands`: old controller, waiting update, current graph under old controller, activated update, and fresh phone installation. Verified exact cached module bytes and retained saved state (120 old modules, 123 current).
- Direct navigation assertions confirmed the entrance sign's footprint and blocked traversal from both sides.
- Commit review fixed missing portrait asset descriptors, preserved the original optimizer conversion prefix while appending new artwork, simplified Xiaojie’s opening to beginner vocabulary, and updated browser fixtures for the conversation-only arrival gate and 45-second hint. The maintenance-door route check runs against the checked boarding landing.

Browser artifacts are under `test-results/remaining/`; command logs and the pre-change snapshot are under `/tmp/lotus-remaining/` (temporary, not durable). Browser checks use headless Chromium and emulated touch, not a physical phone. Speech requests were checked; audible output was not listened to. The historical full-browser baseline contained 28 failures; that entire sweep was not rerun, and those failures are not treated as passes. The old platform script's timer/fixed-camera assumptions are superseded by the new XP-arrival and tracking-camera coverage.
