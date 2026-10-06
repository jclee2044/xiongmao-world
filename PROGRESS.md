# Implementation progress — 2026-10-05

## Delivery and environment

Playable version 0.5.0 at **http://127.0.0.1:3210**: a denser painted Suzhou district, nine conversation neighbors, six strolling visitors, moving animals, seventeen optional Chinese activities, four cultural landmark stops, three explorable shops, home, following Panda, private local-AI dialogue, generated Mandarin, phrase help, licensed local lo-fi, journal, saves, offline exploration, pairing and reversible settings. The full handoff is not finished.

Started with an empty folder. Handoff and all five images inspected. Omarchy/i5-8500 (six CPU cores), 31 GiB usable RAM, Intel UHD 630; Node 26.8.2/npm 11.19.1 and Chromium. ES modules/Canvas, local Node/SQLite, one production pinyin dependency. No framework, bundler or container. Local Git repository initialized.

Ollama 0.33.3 and eSpeak NG 1.52.0/dependencies installed project-locally from the configured package repository. Models under `data/models/`. Ollama’s normal identity key is in `~/.ollama/`; cloud inference disabled. Config/runtime/saves ignored by Git.

Sandbox initially blocked sockets, network inventory and user bus; authorized escalated commands validated localhost and actual services. Tailscale is signed in and running; no prior Serve route. No interactive browser or phone connected to the chat. Browser tests use isolated installed Chromium.

## Gates

| Stage              | Outcome                                    | Evidence / remaining gate                                                                                                                                                                                                                                                                                                                                                       |
| ------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Review/plan        | Complete                                   | All five references viewed; PLAN.md records choices and ordered validation gates. Document claims are not evidence.                                                                                                                                                                                                                                                             |
| 0 Base             | Passed locally                             | HTTP health/page/assets, static-root isolation, initial Chromium startup/Panda loading with no console errors.                                                                                                                                                                                                                                                                  |
| 1 Movement         | Isolated-browser checks passed             | Desktop collision/input focus, pointer controls, portrait/landscape with no overflow. Screenshots inspected. Fixed mobile accessible names, idle Panda hopping and dialogue clipping. Real touchscreen review pending.                                                                                                                                                          |
| 2 Conversation     | Real local AI/audio playable               | 4B food/hobby/homework probes: 13.9/7.8/7.1 s. Full slice uses actual model. Chromium decoded/started Mandarin, including slow generation. Phone audio, learner voice-quality assessment and microphone input pending.                                                                                                                                                          |
| 3 Adaptation       | Foundation; gate partial                   | Context exposure and explicit preferences persist, manual help/challenge work. Tested separate skill/topic verified-evidence bands and hysteresis. Automatic ability grading is not enabled for unverified AI turns; reliable evaluation remains to be validated.                                                                                                               |
| 4 Home/save        | Slice check passed                         | Walk → converse → Momo discovery → home → reload with friend and single journal memory. Atomic SQLite/revision saves; no absence penalties.                                                                                                                                                                                                                                     |
| 5 PWA/hosting      | Local checks passed; external gate pending | App cache/offline reload/save → reconnect, pairing in two contexts, stale save visibly rejected, APIs not cached. Both user services enabled/running. Private HTTPS approved; waiting for Tailscale Serve account activation. Real phone install/keyboard/microphone, two actual devices and reboot pending.                                                                    |
| 6 Customization    | Constrained slice passed                   | Supported prompt outfit/hair changes, immediate effect, persistence/history/undo. Unsupported/hostile requests visibly pending; no unrestricted art or source-edit agent.                                                                                                                                                                                                       |
| 7 Expansion/polish | Painted district foundation implemented    | Reference-based Canal Lane, home and three shops; compact 3600 × 3000 district with varied storefronts, Suzhou landmarks, gardens and lake. Nine conversation neighbors, seventeen activities, moving animals/visitors, falling leaves and licensed lo-fi. Richer daily routines, remaining cities, environmental sound effects and validated learning transfer remain pending. |

## Evidence and fixes

Unit/API checks cover collision/no tunneling, walkable interactions, save validation, revisions, single-use pairing/session sharing, origin/auth, no source-file exposure, help/transcript safety, skill/topic separation, hysteresis, preferences, setting allowlists and provider failure/malformed fallback.

Browser movement: desktop, 390×844 portrait, 844×390 landscape, input focus and pointer controls. Full slice: real model reply, standard speech playback, slower phrase decoded as WAV (~4.88 s), friend/home/reload, settings undo/pending feedback; no page errors. PWA: cached exploration, offline save/reconnect, independent paired contexts and visible conflict; no page errors. Delayed-turn check uses a controlled mock: repeated submits suppressed and late closed-conversation replies ignored; not a live failure test.

Found/fixed static-root 403, missing mobile accessible names, asynchronous/timing assumptions in tests, clipped mobile reply area, and idle companion hopping. Qwen3 1.7B rejected (3.6–6.2 s, echoed input and wrong pinyin); 4B chosen, dictionary pinyin. Standardized eSpeak’s placeholder WAV length. Empty Replay body capture was a test-capture issue: actual decode/playback verified.

Consistent live SQLite backup created. Actual learner-save restoration untested. User service start/status verified: enabled/running. `systemd-analyze --user verify` could not initialize its runtime manager here; actual systemctl startup/status was checked instead. No actual reboot/login performed.

Ignored `test-results/` holds screenshots and `local-ai.json` (rejected small model), `local-ai-4b.json`, `slice.json`, `pwa.json`, plus desktop/mobile/home/settings images. Live provider tests and mocked checks are separate.

## Hosting activation gate

Prepared origin: `https://omarchy.tail18f12c.ts.net`. The user explicitly approved persistent private HTTPS for the existing Tailscale network after the initial automatic approval rejection. Retrying the exact private route was accepted. Tailscale then reported Serve is disabled for the network and supplied an account activation link. The user action is pending; the last `tailscale serve status --json` is `{}`. **No Serve route is active or verified.** No alternate LAN/public/Funnel route was attempted.

## Sizes and next gates

Current browser files approximately **29.8 MiB**, including 24,900,318 bytes of generated lossless WebP art, 4,230,484 bytes of licensed background music, the original Panda/icons and client source/styles. Original source PNGs remain outside the public root. Models approximately **3.6 GiB** including rejected 1.7B and selected 4B; Ollama ~67 MiB, speech ~20 MiB. Actual-phone frame rate and HTTPS download performance are unmeasured.

Next: user review of the painted layout and expansion density; Tailscale Serve account activation, HTTPS verification and real phone installation/audio/virtual keyboard; learner review of eSpeak or a better verified local Mandarin voice; local transcription; reliable independent skill evidence; richer district content and later cities. Pending development feedback is not claimed implemented. No five-city, fully adaptive, microphone or source-agent completion claim.

## First delivery regression result

All 11 unit/API tests passed. Final desktop/portrait/landscape movement checks, real local-AI/audio/home/reload/customization slice, offline/reconnect/pairing/conflict checks, and mocked delayed-turn checks passed. No page errors in the final slice/PWA checks. Final source syntax checks passed. Live feedback/change lists now refresh immediately. Both localhost services remain enabled/running; Tailscale Serve configuration remains empty.

Measured public root: 18 files, 1,979,389 bytes (uncompressed logical file size).

## Pinyin follow-up

Added an accessible Show/Hide Pinyin button in conversations, using the shared persistent Settings preference and undo history. Phrase explanations respect the same preference. Mobile Chromium checks passed immediate toggling, reload persistence, phrase help, Settings agreement and undo; both visible/hidden layouts inspected. Fixed waiting PWA update notification when `registration.installing` becomes null, with a regression test. Shell cache bumped to `panda-shell-0.1.0-3`. All 12 unit/API tests and source syntax checks passed; updated PWA offline/reconnect/pairing/conflict checks passed. Live local AI/audio already passed the original slice check and were not changed by this follow-up.

## Local preview host fix

The desktop preview forwards an ephemeral localhost port in its Host header. The original server accepted only its own listening port and rejected this request as “Unrecognized host.” The server now accepts literal loopback hosts at valid ports while keeping configured private hosting explicit. Writes must match the current request’s own origin; foreign hosts, origins and spoofed forwarded-host headers are rejected. All 13 unit/API tests passed, including preview page/session/save and configured HTTPS cookie behavior. Isolated Chromium through a real localhost forwarding proxy loaded the game, saved pinyin settings and restored them after reload without page errors. The game service was restarted with the fix. Direct inspection of the actual in-app browser remains unavailable; its equivalent proxy path was verified.

## Painted district revision — 0.2.0

Preserved the initial source checkpoint as annotated tag `v0.1.0` at `ba9fd37`. The revised district's 4000 × 3300 bounding footprint is about 10.15 times the original 1300 × 1000 area; this is not a claim of ten times the authored content or walkable floor area.

Edited the third supplied Suzhou reference into a detailed scenery plate with people, animals and UI removed, then added independently rendered painted actors. Generated a home, eight player appearance variants, Momo, and reusable paving/house/willow assets. [art/ASSETS.md](art/ASSETS.md) records the exact built-in prompt set and selected output paths. Ten lossless WebP conversions passed zero-pixel-error comparisons; alpha was preserved. Decorative English commentary is removed, while functional controls and optional meaning remain.

Geometry follows the reference lane and bridge. Added collision-safe route navigation, map destinations, viewport culling, foreground occlusion and one-time save migration that preserves journals/discoveries/settings. Internal `shanghai` scene identifiers remain for compatibility; the visible setting is Suzhou. Ordinary connecting lanes reuse art. Unchanged scenery is no longer repainted every animation frame, including during paused conversations; movement, resize, appearance changes and asset readiness still redraw.

Corrected the ignore rule from `data/` to `/data/`: private runtime data stays excluded, while previously omitted `public/data/` game content is now versioned. The initial checkpoint lacked those content modules; the current revision fixes source-checkout completeness.

All 15 unit/API checks passed, including every expanded-map destination's continuous walkable route and migration of an existing SQLite save without losing learner data. The browser suite passed movement/collision, real local dialogue/audio, home/reload, pinyin, offline/reconnect/pairing/conflicts, forwarded preview hosts, expanded district navigation and delayed-response handling. Desktop and phone-sized art screenshots were inspected. Source syntax checks passed. A browser check measures zero image draws during an unchanged paused conversation.

The first art-regression run hit the browser test's 30-second wait; the application allowed up to 60 seconds. A retry with a matching test budget returned a relevant local model reply in about 32.5 seconds, with decoded Mandarin WAV audio. After avoiding unnecessary repainting, the final browser slice returned a relevant local reply in **7.434 seconds**, and the movement, resize, art, discovery/home/reload and offline checks passed again. Responses varied in length and the model was warm, so these measurements are observations rather than a controlled performance comparison or guarantee. Actual phone performance and complete walking animation remain pending.

## Chinese practice and life revision — 0.3.0

Replaced the broad stone extension with narrow connected paths, courtyards, gardens and a pond. Soft alpha edges and matching paving aprons blend the reference plate into the district; home transitions crossfade briefly. Added market, bench, flower, well, sign and tea-table props at their natural aspect ratios. Foliage fades when it hides the player, with gentle motion when enabled. Unchanged paused conversations still have zero image draws.

Normal walking increased from 230 to 330 world units/second. Three actual painted poses alternate by distance for all eight appearances; reduced motion uses a steady pose. Player height is 235 world units, Lin 260, Yun 230 and Panda 105. Furniture uses image-traced floor footprints, neighbors have body colliders, and existing blocked positions move nearby safely. Collision substeps and routing are checked at 60, 25 and 10 fps.

Added Qiao, Bo, Lan, Wei, An and Hao with distinct identities, greetings and local-AI context. Nine optional authored activities cover ordering noodles/tea, fruit quantities, a flower gift, books, weekend plans, a listening clue, a letter delivery and visiting neighbors. They offer replay, slow speech, optional transcripts/hints and retry without penalty. Open expression enters the neighbor's history; visit steps and idempotent completion persist through reloads and conflict recovery. Completion never creates mastery or pronunciation evidence. Old saves without activity state remain valid.

Long-use exposure retains 192 recent contexts and aggregates older per-word evidence without losing lifetime counts. A regression simulates 3,078 exposures across 19 words, nine neighbors and six topics, then saves and reads the state through SQLite.

Music is an original gentle pentatonic Web Audio score, synthesized on this PC without sampled tracks or remote requests. It starts after a user gesture, pauses on hidden pages and quiets during speech. Settings provides on/off and volume. Speech stop, errors and stale callbacks restore the correct music gain; closing practice stops its voice.

The three additional built-in image-generation atlases passed lossless zero-pixel-error comparisons. Selected output paths and all 16 exact calls are recorded in [art/ASSETS.md](art/ASSETS.md). Unit/API checks, movement/art checks, all nine activities, actual browser music and forwarded preview checks passed. Activity/provider-failure automation uses controlled dialogue/audio mocks; the full slice separately obtained a real relevant Mei reply in **13.093 seconds** and decoded slow Mandarin WAV audio (4.878 seconds). A real Qiao probe answered a hot-tea question with green, black and oolong choices in **14.276 seconds**. These checks do not establish learner outcomes or real-phone performance.

Independent final review also caught walkable home walls and music briefly ignoring a saved mute during loading. Added a traced home floor boundary and regression tests for wall clicks and movement. The cabinet browser check now approaches from actual floor and stops around y=544. Music initializes silently before restoring preferences; a browser regression delays a muted save's load and observes exactly zero master gain and zero scheduled notes throughout. Fresh games still start the default score. All **29 unit/API tests**, source syntax checks and final movement/music regressions passed. The final `panda-shell-0.3.0-2` cache passed offline save/reconnect, pairing and conflict checks.

## Denser Suzhou and repeatable practice — version 0.4.0

Previous version 0.3.0 is committed as `662ebd0` and checkpointed with annotated tag `v0.3.0`. The new outdoor footprint is 3600 × 3000: 18.18% less area. Map version 3 scales version 2 outdoor positions by 0.9 and repairs blocked positions, while preserving progress/settings. Older map versions use a safe spawn. Interiors retain independent 1200 × 800 geometry.

New painted atlases add distinct bakery, dumpling, bookshop, teahouse, flower stall and pavilion facades, plus pagoda/moon-gate/rockery/museum/bamboo/lotus interpretations. Bakery, teahouse and bookshop doors open explorable rooms with traced floors/furniture and deterministic return doorsteps after reload. All room/outdoor images preload even when starting from a saved home. Source paintings remain out of the public root.

The old flat oval pond became an irregular lake with soft banks, clipped ripple details and lotus leaves. Rendering and collision share the same polygon; paths do not cross the water. A cat, duck, rabbit, three sparrows and six visitors move during active play. Falling leaves appear around trees. Ambient time freezes while paused or reduced motion is on. The duck stays inside water; land walkers use ordinary collision. Visible animal clicks route to their stable Chinese interaction points.

Five new authored mini-games join the existing nine activities: recipe sequencing, tea-order listening, Chinese/object matching, sentence building and animal clue walks. Rounds vary; partial selected cards, quantities, matches and visit steps survive reload. Completion counters merge conservatively across device conflicts. Activities do not generate independent skill/ability evidence, and typed expression does not assess pronunciation. New worlds default pinyin off; an existing saved opt-in survives reload.

Cultural entries cover Tiger Hill, Suzhou classical gardens, Suzhou Museum, Pingjiang lanes and osmanthus sweets. Short Chinese paraphrases include optional meaning/pinyin, Mandarin replay and primary-source links. The game labels this district as a condensed illustration, not a geographical reconstruction. Sources were checked on 2026-10-05; see `public/data/culture.js`.

“Asia” by FSM Team is bundled locally under CC BY 4.0 with Settings credit, attribution, license text and compression notice. Actual Chromium audio decoding/playback, nonzero signal, loop boundary, buffered offline resume, procedural offline fallback, saved mute, voice ducking and hidden-page suspension passed. These tools verified playback behavior; they did not provide a listening assessment of musical fit. The recording is Asian-inspired lo-fi/chill-hop.

Browser checks passed all nine conversations and fourteen activities with controlled dialogue/audio mocks, two varied rounds per new game, wrong choices/undo, partial-progress reloads, animal directions from rooms/home, cultural source links/replay, and 390 px phone layout. Real local-AI slice also passed: Mei replied appropriately in **14.203 seconds**; slow Mandarin decoded as a 4.878-second WAV, with friend/home/reload and customization checks passing. Forwarded-host preview and delayed-turn regressions passed.

Movement/art measured 333 units/second, safe canal/NPC/home-cabinet boundaries, actual walking frames, soft reference seams and continuous camera motion. Ambient checks verified actual moving visitor pixels, falling leaves, animated water, pause/reduced-motion stability, 180 seconds without stranded walkers or ducks outside water, cold-home exit with zero new image requests, all three shop exits, and no browser errors. Screenshots were inspected. Independent review found and corrected generous bakery/teahouse front-floor boundaries before final release verification.

Version 0.4.0 adds six lossless WebPs (8,885,810 bytes), each with zero absolute pixel error against its built-in PNG. All generated WebPs total 24,900,318 bytes. Public assets/source are approximately 29.8 MiB, including the 4.23 MB MP3. Exact new image prompts and selected paths are recorded in `art/prompts/generation-calls-v0.4.0.json`. Actual learner feedback, phone frame rate/audio, private HTTPS activation and microphone practice remain pending; this release does not claim those gates passed.

Final release verification: **40 unit/API tests** passed, including 18 world-geometry checks, nine practice checks and two living-environment checks. JavaScript syntax, Prettier and diff checks passed. The finalized `panda-shell-0.4.0-2` cache contains all three shop plates, new atlases/content and the licensed background recording, with no API data cached. Offline exploration/save, normal reconnect/reload, independent-device pairing and stale-writer rejection passed. An explicit held-response regression confirms that reloading after a server commit but before its acknowledgment preserves dirty local progress and offers the existing Journal conflict choice. The reconnect happy-path test now waits for completed synchronization before reloading, rather than assuming that an in-flight request has finished. Production persistence behavior did not need changing for this case.

## Cultural mini-games — version 0.5.0

Added three optional activities, bringing the total to seventeen while retaining all fourteen earlier IDs and saves. Lantern riddles have two rounds of three original descriptive clues. The silk workshop has two 3 × 3 color designs with Chinese positions, per-square listening, labeled thread colors, an eraser and one-step undo. Market shopping has three lists with quantities, measure words, integer yuan prices, live totals and change. Prices are fictional practice values, and the cloth is a simplified language activity inspired by embroidery.

Map destinations start the games at the new lantern rack, existing cloth shop and market. Rack posts remain beside the lane; map dimensions and saved coordinates are unchanged. Lanterns sway gently using existing ambient time. No additional raster art, model, dependency or music download was needed. New cultural facts about lantern celebrations and colored silk thread use live-verified Suzhou government sources, linked in the optional stories.

Partial riddle steps, nine cloth colors and shopping quantities are bounded and persist through real server saves/reloads. Wrong attempts offer explanatory help and retries without penalties. Replay rounds advance only when completed. New activities do not change learner ability evidence; after completion the learner can continue chatting with a neighbor.

All **45 unit/API tests** passed, including nineteen world and thirteen practice checks. The existing fourteen-activity browser flow still passes. New browser checks passed two varied rounds of each new game, partial server checkpoints, wrong/over-budget/right-total-but-wrong-item cases, undo/restored eraser, optional pinyin/meaning, per-square speech requests, cultural links, keyboard focus and 390 × 844 phone-sized panels. Full learner state stayed unchanged and the final run had zero JavaScript or console errors. These dialogue/audio checks use controlled mocks; local AI and speech services remain the previously verified providers.

Visual inspection caught inline cloth-color styles blocked by the existing content-security policy. Fixed them with bounded color data attributes and external CSS, preserving the policy. Browser checks now verify all four actual rendered colors, stitched designs and legible historical memory-picture icons. Screenshots were inspected in `test-results/culture-*.png`.

The `panda-shell-0.5.0-1` release cache passed offline startup with all seventeen activities available, local save/reconnect/reload, independent-device pairing, stale-writer rejection and interrupted-save recovery. Syntax, formatting and diff checks passed. Real-phone performance, learner evaluation, private HTTPS activation and microphone practice retain their earlier pending status.

## Xiongmao World — version 0.7.0

Expanded the central market, reduced the outdoor geometry by 15% in each dimension, opened five additional garden/cultural venues, populated rooms, added playing children and nature details, and added generated idle poses and hotpot art. New Panda goal cards track introductions, flowers, tea, a meal with Lian and a nature walk. Lian follows the player to the restaurant; table interactions use a painted first-person view with five speaking ingredient hotspots. Dialogue lookup uses local CC-CEDICT, displayed above modals; English and full pinyin start hidden. New vocabulary has an original four-note chime.

Click-to-interact now walks to a target, and Space works on the focused canvas. Browser checks caught and fixed a regex that accidentally matched CANVAS as a link, and undefined scenery identifiers comparing equal to an empty hover target. Blue outlines now require a real matching entrance; the render regression observed zero decorative outlines and exactly one hovered door. Two independently recorded facing directions persist after stopping. Moving sprite row crops exclude neighboring-frame artifacts.

The user's live feedback prompted short beginner narration in home, museum and garden scenes, plus original procedural water, duck and bird sounds. Nature volume is independent of music and fades while speaking or indoors; hidden/muted audio suspends. Actual browser analysis measured nonzero lake audio and exactly zero master gain at mute. No external sound-effect recordings were added.

New NPCs previously threw while building the model's example reply. Fixed that lookup and shortened the HSK1–2 prompt; a live Qwen3 4B reply for Lian completed in 26.8 seconds with mode=local. The selected local WNJ male voice replaces the basic male voice when installed. Punctuation normalization and final silence/fade treatment avoid feeding repeated question marks to synthesis; female selection is retained. Subjective voice quality remains for learner feedback.

Validation: all **55 unit/API tests**, JavaScript syntax and diff checks pass. Browser checks passed the new Lian meal journey, both facing directions, modal word callout, keyboard Space, direct click-to-enter, nine venue screenshots, older flower/tea quests, microphone ordering, neighborhood unlock, seventeen learning activities, pinyin, music, and offline/save/pairing/conflict recovery. A separate browser check verified welcome autoplay and five food hotspot speech requests. New assets and exact prompts: art/prompts/v0.7.json. The live user service was restarted and reports version 0.7.0 with vits-wnj-neural-male; preview opening was queued in the Codex panel.

## Market and companion refinements — version 0.8.0

The final market balances the earlier rich watercolor composition with wider lanes, complete roof silhouettes and clear paved boundaries. The spacious intermediate painting was superseded after user feedback. The painting's water, shop footprints and three internal bridges share one traced coordinate transform; outer canals join it without duplicate bridge rails. Existing enterable facades sit around the outskirts. The district is now 3240 × 2700 with safe version-7 position migration; progress and settings are preserved. Southwest sweet-tangerine visitor, orange stall/trees and all six original passersby remain. The northeast grove has eleven additional bamboo clumps.

Reduced player size indoors/outdoors, matching painted restaurant tables (two occupied, two empty), dedicated children, four-frame adult/Lin walking atlases and a hopping rabbit replace the reported visual mismatches. Idle and seated outfits follow the selected color and hairstyle. Painted fruit trees replace flat circles. Water gain and filtering are substantially gentler.

Panda now has a capped 60 px foreground conversation portrait and a separate compact coaching dialog. Learners can ask free-text grammar/translation questions through the local model; authored grammar hints provide an honest fallback. Explicit word clicks alone open definitions and record discovery; first-discovery banners use the modal foreground layer. A new stylesheet URL avoids stale installed-app CSS giving Panda its enormous natural image dimensions.

Player and Lian sit at the restaurant table; after the meal Lian thanks the player and gives a sheep. Panda explains that it can stay at home, where an inspectable keepsake records its origin and survives reload. The larger tea table seats the player beside Qiao. Home navigation exits rooms and walks to the home entrance automatically.

Validation: **59 unit/API tests** pass, including complete character roster, four-frame Lin motion, old-save migration, all destination routes, quest persistence and coach fallback/local response validation. Browser checks pass the seated meal/reward/home journey, seated tea, compact portraits, click-only definitions, foreground discovery, Panda questions, original flower/tea quests, exact room returns and mobile panels. The final release cache passes offline startup, all seventeen activities remaining available, reconnect, pairing, stale-write conflict and interrupted-save recovery. Direct local tutoring returned a relevant Mandarin example in 10.692 seconds. Nature-audio analysis measured quieter nonzero output and zero gain when muted. Dedicated screenshots were inspected for all four market edges, the tangerine corner and bamboo grove. Source syntax and diff checks pass.

Final generated assets and exact built-in-tool prompts are recorded in [art/ASSETS.md](art/ASSETS.md), [v0.8 prompts](art/prompts/v0.8.json), and [market refinement prompts](art/prompts/v0.8-market-refinements.json). The local service has been restarted and the updated preview opening queued for user review. Physical-phone performance and subjective audio/art feedback remain unverified.

## Market shops, connected waterways and directions — 0.9.0

All five market stalls now open first-person seller illustrations, product/price conversations and explicit coin purchases with saved receipts and duplicate/insufficient-funds protection. Fixed catalog prices are shared with the dialogue provider; conversation alone cannot spend coins. Portraits remain visible when conversation content scrolls, including on mobile.

The outer canals use a calm turquoise watercolor tile matched to the market painting. Water continues under the painting’s feathered edge instead of exposing earth. A curved southern bank and paved apron follow the market quay; the southern promenade has curved paths and spurs to shop entrances. Added southern planting, original willows around home and in the far north, and a north–northwest bridge. Removed the duplicate rails at the west painted bridge. Home geometry is 75% of its former dimensions while the character keeps her normal indoor size.

Lin’s Ask the way quest requires finding and entering the restaurant; Hao’s Give directions quest uses two map-grounded choices with Panda hints and retry feedback. Both save partial progress and award 40 XP once. A shared location module grounds both NPC conversation and Panda coaching. `handoff/references/game-directions.md` records every scene interaction, safe approach coordinate, landmark and bridge.

Player idle/walk/seated outfits share one palette across both hairstyles. Lian has matching idle, four walking and seated poses. Painted diners and smaller interior hosts use the correct character identities. Exact built-in image prompts and final paths are recorded in `art/ASSETS.md`.

Validation: 66 unit/API tests pass, including map reachability, normal-speed routes, pricing, directions, save merges and character consistency. Browser checks pass all five shops, purchases and insufficient funds, mobile shop rendering, both directions quests and compact home rendering. Browser regression checks also pass all eight player appearance combinations, all six Lian poses, seated hotpot and tea, the sheep reward at home, click-only vocabulary and foreground Panda coaching. The final 0.9.0-3 offline cache includes all new assets and passes offline exploration, reconnect, pairing, conflict and interrupted-save recovery. Syntax and diff checks pass. The live local service reports 0.9.0; preview opening was attempted but the desktop panel tool did not return, so the existing browser can be refreshed.

## Suzhou departure boat

Added a medium-large lantern-lit wooden passenger boat in the bottom-right canal, with a wooden boarding dock connected to the southern stone path. The existing next-area gate now belongs to this boat: clicking its artwork walks to the shore, and Space works at the dock. The captain shows XP remaining below 500; boarding appears at 500 XP and rechecks the requirement on departure. Panda adds a prominent boarding goal at full XP. The current destination remains the existing Shantang scene, and its return entrance brings the player back to the same dock without spending XP. Boat directions are included in NPC/Panda map facts.

The watercolor sprite was generated with the built-in image tool, referenced from the market painting; its exact prompt and saved path are in `art/prompts/suzhou-passenger-boat.json`. It gently bobs when motion is enabled and is cached offline.

Validation: all 66 unit/API tests passed; navigation tests, syntax and diff checks passed after the direction entry was added. `scripts/browser-boat.js` passed click-to-walk, Space interaction, 0/499 XP locks, exact-500 boarding, the departure goal and a return to the same dock. The final 0.9.0-4 cache passed offline exploration, reconnect, pairing and conflict recovery. The local service was restarted for the updated map guidance.

## 2026-10-06 — Expanded market and visible grounds

- Market v4 uses a higher orthographic view at its native 3:2 aspect, a 2764.8 × 1843.2 pre-scale footprint, re-traced canals/stalls, generous walking circuits and comparable bridge deck widths. A shared coordinate transform moves exterior streets while preserving actor/building proportions. Southern canal edges are parallel; its apron and promenade are wider.
- Six exterior walled grounds represent the bamboo grove, gardens and courtyards; shifted doors retain their exact room returns. Bamboo is confined to its land enclosure. Map version 9 migrates old positions safely without losing progress.
- Xiaoyu has a persistent two-step flower-shop directions quest with hints and a single 40 XP completion reward. Uncle Zhou opens with 常在河边站，哪有不湿鞋 and a basic-Chinese explanation. Ground route rings are cream; interaction routes remain blue.
- Built-in image generation provenance: `art/prompts/v0.9-market-expansion.json`. Browser evidence: `scripts/browser-market-review.js` and `scripts/browser-town-expansion.js`.

Validation for this pass: all 71 unit/API tests pass, including every destination's routes at three frame rates, the market walking circuit, exterior gate approaches, and quest state merging. Syntax and whitespace checks pass. Chromium checks pass for the new quest (wrong choices, hints, partial reload, completion and no repeat XP), the canal saying, both marker colors, all five shops, the two earlier directions quests, boat boarding/return, and offline/reconnect/pairing/conflict recovery. Layout screenshots are in `test-results/market-*.png` and `test-results/enclosure-*.png`.

## Organic market revision — 2026-10-06

Replaced the oversized open market with a transparent, complete Suzhou district based on the user's street references: connected L-shaped shophouses, Chinese signs, a bending main lane, a wide west cross alley and a waterfront loop. The market retains a compact 2203 × 1469 footprint within the 3607 × 3341 town. The north buildings sit closer to the edge; no additional blank plaza was added. Traced shop/canal collision, vendor approaches, clickable facades, visitor routes and old-save relocation match the final artwork (map version 11).

All town bridges now show whole arches and masonry parapets. The northern market bridge ends at the canal and reaches the lane by paving, clear of the roofs. One continuous native canal supplies shared water outside the market's opaque quay; a complete boat and rooted willow replace the old clipped/faded objects. The original south promenade, enclosed yards, flower-directions quest, beginner idiom explanation and cream/blue destination markers remain. Exact ImageGen prompts are recorded in `art/prompts/organic-market.json` and `art/prompts/stone-bridges.json`; the final assets are included in the offline shell.

Validation: 73 unit/API checks passed; isolated Chromium passed all five shops/purchases/mobile shop UI, flower quest hints/retry/partial reload/single reward, canal idiom, cream ground/blue interaction markers, transparent perimeter inspection, and offline/reconnect/pairing/conflict preservation. Syntax and whitespace checks passed. In-game market north/street/west/south edge screenshots were reviewed in `test-results/`. Physical-phone visual/performance review remains unverified.

West bridge material follow-up: its deck now samples the market lane’s own stone colors, wear and moss joints, with continuous texture boundaries. The complete arch and parapets remain. Verified the isolated west-bridge browser preview and JavaScript syntax; walking geometry is unchanged. Offline shell bumped to organic-market-5.

West crossing geometry follow-up: widened the canal locally by 54 world units with tapered north/south transitions. The adjacent yard wall retreats by the same amount, preserving the bank lane; its strolling neighbor now follows that lane. The bridge’s market end stops at the quay before both stairways, with a narrow coping threshold and paving aligned to the market’s vertical stone courses. Map version 12 preserves learner progress while relocating outdated positions safely. All 73 unit/API checks, the targeted browser preview, syntax and whitespace checks passed; added route assertions cover both stair landings and the west-bank lane. Offline shell: organic-market-6.

## 2026-10-06 — Single music player, western bank and bamboo courtyard

Music now waits for the saved scene to finish opening, reuses one media element across room changes, and disposes the previous audio graph if the app is initialized again in the same page. A focused browser regression counts active players through startup, twelve rapid scene changes, and replacement initialization; playback never exceeds one music element. The existing real-audio suite also passes playback/looping, mute, speech ducking, offline recording and synthesis fallback, pending requests and saved mute restoration.

Expanded the western bank by 168 final world units while preserving the connected market as one undistorted block. The western canal lane is wider, the stationary western boat has been removed, and eight additional pear, bayberry and orange trees fill the southwest orchard. Map version 13 translates existing town positions with the layout while retaining progress.

The former garden is now 竹林小院. Its entire town-view enclosure is solid and the door leads into the smaller courtyard. Both views show bamboo within walls; the interior now has matching side/front walls and a centered moon gate, with planting kept behind the boundary and the entrance clear of strolling visitors. Both the main duck pond and courtyard pond have mossy limestone outcrops, bank planting and small animated cascades. The duck swimming lanes remain open and reduced-motion settings freeze waterfall and ripple animation.

Validation: all 74 unit/API tests pass, including reachable destinations, traversable routes, duck motion, solid courtyard entry and bamboo placement. The dedicated browser lifecycle/entry/return regression passes; screenshots of the widened bank, orchard, both ponds and courtyard boundaries were reviewed. Syntax and diff checks pass. Offline cache version: ponds-grove-audio-9.

The offline browser regression also passes with the new pond module precached: exploration/local saves, reconnect, independent-device pairing, conflict preservation and interrupted-save recovery, with no browser errors.

## 2026-10-06 — Open southeast square

Replaced the southeastern 评弹小院 compound (second from the right) with an open paved 河畔广场. Removed its building, perimeter walls, moon gate and interior planting; the paving joins the northern promenade and southern silk-workshop approach. Updated map directions and removed the former smaller room. Saves made inside that room migrate to the square without losing progress.

Validation: world/navigation/adventure/venue regression files pass, including a sweep across the former wall and building footprints and old-room save migration. Reviewed the targeted in-game square screenshot. Syntax and diff checks pass. Offline shell: southeast-square-10.

## 2026-10-06 — Expandable panda help panel

Clicking the bottom-right panda portrait or message now expands a wider cream panel with larger text, portrait and controls. Its header toggles back to the compact view; Enter/Space and Escape work from the panel without moving the character. Word definitions remain available inside the expanded panel, separately from its toggle. Practice and listening controls do not collapse it. Short screens scroll the panel while keeping it inside the game viewport.

Validation: the focused isolated Chromium regression passes portrait/message clicks, expansion size, word lookup, keyboard toggles, independent practice/listening controls and bounds at desktop, mobile portrait and mobile landscape sizes. Reviewed all three expanded screenshots. JavaScript syntax and diff checks pass. Offline shell: panda-panel-11.

The reported overlapping music remains unresolved: the user confirmed the remaining track ignores both music and ambience settings. The live app preview is unavailable through the browser tool; the close-preview diagnostic is still awaiting a response. No additional music fix is claimed in this change.

## 2026-10-06 — Music ownership across isolated previews

Reproduced the remaining gap with isolated browser storage partitions: the previous page-only/BroadcastChannel protection let two previews play together, even when they used the same server. Local previews now coordinate through the server across origins and session partitions. A new player waits for the previous player to acknowledge silence; Music Off revokes the active soundtrack even when changed in an older preview. Hosted sessions are scoped independently. Cached playback still works offline. Pending media playback also checks ownership and recording failure before starting.

All headless browser regressions now mute hardware output while retaining the audio graph, so testing cannot add audible music to the user's game.

Validation: the same isolated-preview regression fails against the previous code and passes against the change, covering three contexts, different origins, shared mute, no overlap during handoff, indoor/outdoor transitions and offline playback. All 76 then-existing unit/API checks passed; the additional focused API test also passes across forwarded ports, isolated sessions and rejected foreign origins. Existing real-audio, saved-mute, fallback, rapid-transition/reinitialization and offline/PWA regressions pass. Syntax and whitespace checks pass. Offline cache: music-ownership-12. The user also reported that reopening the game restored correct playback; direct audio inspection of the live app preview is unavailable.

## 2026-10-06 — Gated grounds, southern homes and square fountain

All four moon-gate compounds with separate interior scenes now block their full exterior footprints in town mode. Entry and return use the existing door interaction. Cleared complete trees whose canopy overlapped any moon gate or its approach. The inspect-only bamboo grove keeps its existing public walking entrance. Moved the public Taihu-rock stop to a visible rock outside Tiger Hill so Panda's nature objective remains reachable.

Reused the existing painted house asset for two neighboring homes at the far center of the southern map edge, with solid building footprints, small paved forecourts and a shared front path. Added a compact two-tier limestone fountain in the center of 河畔广场, with water arcs, descending highlights, ripples and four birds circling nearby. The basin has collision and the square retains a continuous walking ring. Reduced motion freezes water and bird animation. The square's inspect point sits in front of the fountain.

Validation: all 80 unit/API tests pass, including routes to every destination at three frame rates, gate approaches/blocked footprints, clear entrance foliage, house collision, the fountain walking ring and frozen bird poses. Isolated muted Chromium verified walk blocking plus door entry/return for all four gated scenes; screenshots of every gate, the fountain and both homes were reviewed. Offline/PWA regression, syntax and whitespace checks pass. Cache: square-fountain-13.
