# Modular refactor plan for Xiongmao World

Preserve the current game while making worlds, characters, art, interfaces, and services easier to extend independently. Keep the existing JavaScript modules, Canvas renderer, Node server, and SQLite storage. Make one small structural change at a time, prove that its observable behavior matches the previous verified commit, and only then continue.

**Execution update authorized by the user, October 11:** group about 3–4 related steps into a small batch before the full gameplay gate, to reduce repeated verification overhead. Keep each extraction mechanically separate and reviewable within that batch. This supersedes the one-change-at-a-time verification and commit cadence below; it does not relax any behavior contract or coverage requirement. Verify each completed batch against its previous accepted checkpoint and the original baseline. On a gameplay difference, immediately roll back the entire unaccepted batch, record and freeze the implicated aspect, and skip its dependents. Do not accumulate another batch before the current one is accepted.

**Status:** execution authorized; checkpoints and coverage restrictions are recorded in `docs/refactor/EXECUTION.md`. **Baseline:** commit `b85202c`, inspected on October 11, 2026. The earlier `PLAN.md` and `PROGRESS.md` describe historical work and product context; they do not expand the scope of this refactor.

**Governing rule:** if a step changes gameplay, immediately roll back that step, confirm the previous behavior is restored, mark that aspect frozen, and do not refactor it further. Skip dependent steps. Continue only with independent work. Do not fix forward, revise expectations to accept the difference, or retry the same aspect through a different implementation.

## Current pass: scaling foundations only

**Completed:** all four milestones below are accepted. See `docs/refactor/EXECUTION.md` for exact verification results, concurrent feature integration and limitations. The remaining 59-step roadmap is deferred.

The user's latest scope instruction is: “all the things you would say are necessary at this point to continue scaling the game cleanly. but nothing more.” This replaces execution of all 59 steps below. Those steps remain an optional backlog, not a completion requirement for this pass.

Complete four milestones, keeping related mechanical changes in verified batches:

1. **Shared foundations:** remove the dialogue import cycle; share initial state defaults and geometry primitives (original steps 07–09).
2. **World ownership:** give Suzhou its own scene manifest and an explicit world catalog; separate existing movement/query helpers and save migration from scene assembly. Preserve compatibility exports, scene identity, construction order and saved IDs.
3. **Reusable content:** establish a clear owner for character definitions and an explicit role-based sprite catalog. Keep existing asset URLs and original bytes; avoid moving unrelated fonts, audio, or paintings merely for symmetry.
4. **Repeatable world additions:** validate scene registration, references, character placement and asset descriptors; document the minimal steps for adding a world and the existing behavior gates.

Defer application/controller rewrites, input/audio/rendering internals, CSS splitting, test-folder moves, an inheritance hierarchy, broad dialogue/service decomposition and speculative optimization. Existing `World` and controller objects keep their runtime responsibilities; compose ordinary definitions and helpers where useful. A coherent module need not be split further simply because it is large.

The strict gameplay-preservation and whole-batch rollback rules still apply. Verification findings and limitations belong in `docs/refactor/EXECUTION.md`; completion of this narrowed pass does not mean all 59 backlog steps were executed.

## Findings from the current codebase

The project already has useful boundaries: separate station art modules, room cameras, persistence, speech, music ownership, activity data, and several feature controllers. Extend these patterns. Most of the risk comes from large modules coordinating many concerns and from important behavior encoded in execution order.

| Area | Current evidence | Refactor implication |
| --- | --- | --- |
| Application | `public/app.js`: 1,376 lines and 30 static relative imports. Boot, settings, panels, Panda help, conversation state, shops, speech, recording, interaction routing, and PWA setup share one scope. | Extract controllers around existing state ownership. Keep boot as an explicit composition function. |
| Rendering | `public/game/render.js`: 1,642 lines and 31 static relative imports. Asset loading, atlases, recoloring, camera setup, scene painting, actor painting, labels, and diagnostics coexist. | Extract small contiguous operations while preserving draw order, canvas state, and caches. |
| World construction | `public/game/world.js`: 1,331 lines. Authored scenes, ordered geometry transforms, collision, movement, interaction queries, and save upgrades share one module. | Separate pure geometry, scene compilation, queries, and migrations, with compatibility exports. |
| Runtime | `public/game/engine.js`: 946 lines and 19 static relative imports. Inputs, scene transitions, movement, followers, quests, animation, drawing, and DOM diagnostics share a class. | Preserve the class interface and frame order while extracting subordinate functions. |
| Server dialogue | `server/dialogue.js`: 612 lines. Authored branches, prompts, provider calls, validation, and progression effects are interleaved. It imports `dialogue-variation.js`, which imports schema and validation back from it. | Break this concrete cycle first through a leaf contract module; then separate provider and authored behavior. |
| Shared state | Server `newState()` and browser `initialState()` currently serialize identically but duplicate the same definition. `server/store.js` imports scene geometry and save upgrades from `public/game/world.js`. | Share pure state construction and migration without importing browser controllers or rendering. |
| Dependency direction | `public/data/navigation.js` imports `public/game/world.js`. NPC registrations are assembled across content, traveler, voice, and appearance modules. | Distinguish authored data from scene queries and composition. Give each definition a clear owner. |
| Styles | `public/styles.css`: 2,336 lines; `public/welcome.css`: 518 lines. | Preserve rule order and computed styles. Split late, after UI behavior is protected. |
| Assets | 229 tracked files under `public/assets`, totaling 259,186,797 bytes, about 247.2 MiB. Characters, props, environment paintings, standalone sprites, root icons, and flat optimized outputs are mixed. No byte-identical duplicates were found among these tracked files. | Organize by role and ownership. Do not assume similar images are disposable duplicates or recompress them during moves. |
| Asset production | `scripts/optimize-art.js` scans nine hardcoded source files, extracts literal URLs, and writes outputs by basename into one directory. | Replace implicit discovery with explicit descriptors, preserving existing outputs before changing destinations. Avoid future basename collisions. |
| Offline application | `public/sw.js` lists code and assets manually, translates paths through `optimized-art.js`, installs in batches of three, and activates updates on request. | Every new module path and asset path needs an offline upgrade check. Maintain compatibility with an already installed game. |
| Verification | 58 unit test files. `test:browser` chains 41 scripts; there are 92 `browser-*.js` files, including helpers and historical checks. Some use the live port 3210. | Inventory and classify checks before creating an authoritative runner. Do not mistake every unlisted file for an active missing test. |

The imported runtime currently contains **17 scenes, 67 NPC definitions, 27 activities, and map version 14**. A character can appear in multiple scenes, so NPC definition counts and placement counts are different measurements. The platform has 14 traveler placements. These counts are useful checks for accidental omissions, alongside exact data comparisons.

The 17 scene IDs are `shanghai`, `home`, `clothing-store`, `bakery`, `teahouse`, `bookshop`, `family-home`, `restaurant`, `museum`, `shantang`, `lion-grove`, `humble-garden`, `tiger-court`, `silk-room`, `station-ticketing`, `station-waiting`, and `station-platform`. The legacy `shanghai` ID currently identifies the Suzhou town. Preserve it in saves, routes, and tests; use a separate package name for organization.

## Baseline verification and gaps

Fresh checks for this planning pass:

| Check | Result | Consequence |
| --- | --- | --- |
| `npm run check` | Passed. | JavaScript syntax baseline is usable. |
| `npm test` | 328 tests; 324 passed, 4 failed, none skipped. | The project does not have a fully green unit baseline. Keep the four failures explicit. |
| `node scripts/browser-station-platform.js` | Passed against an isolated in-memory server: both floor links, arrival, fixed camera, all 14 conversations, north walkway, inspection, reload, phone touch, reduced motion and offline. | Protects the recently completed platform flow; does not replace an end-to-end journey from town. |

The four unit failures are:

1. `test/language.test.js:67`: the authored-text scanner rejects `更新游戏 · Update game` in `public/app.js`.
2. `test/life.test.js:122`: the visitor range assertion reports `visitor-3: 130.0333333333385`.
3. `test/life.test.js:209`: the market cat does not satisfy `maxX - minX > 500`.
4. `test/pronunciation.test.js:191`: `station-help.js` pinyin for `处` compares `one0` with expected `chu4`.

These failures predate this planning pass. Preserve their names, assertions, and failure details in the baseline record; a matching failure count alone is insufficient. A source location may change through an audited file move, but the violated rule, offending content/actor and values must still match. They are not permission to ignore other failures or to repair content and movement during a structural refactor. Any step touching the behavior those assertions cover needs an additional passing comparison against the unchanged game. If that comparison cannot establish equivalence, leave the aspect untouched.

Earlier platform handoff evidence also records a station-exterior browser timeout inspecting `#panel`, reproduced against its unchanged baseline. Re-establish that result when classifying the station suite. Treat it as a specific coverage gap, not a waiver for all station checks.

The full browser command was not rerun for this plan. Its current membership needs review first: some historical scripts expect earlier layouts, while some scripts connect to the running game. Unit and browser coverage also have structural gaps:

- `npm test` uses the flat `test/*.test.js` glob. Moving tests into subdirectories would silently reduce discovery without a runner change.
- The authored-language scanner uses flat directory reads, and the pronunciation scanner reads the current flat data directory. Moving content first could make those tests falsely pass by skipping it.
- `scripts/browser-helpers.js` finds a scene by the first matching interactable ID. Reused traveler IDs require explicit scene selection in new checks.
- Important station, layering, luggage, and platform checks are outside `test:browser`.
- Browser screenshots exist, but comprehensive baseline-versus-candidate image and simulation comparisons still need to be established.

Tests cannot prove the absence of every conceivable gameplay difference. The execution rule is therefore conservative: every affected observable must have adequate evidence; uncertainty blocks that extraction. A clean syntax check, unchanged test count, or plausible screenshot is not sufficient by itself.

## Behavior that must remain unchanged

| Contract | Preserve exactly |
| --- | --- |
| Saved games | Schema, map version 14, serialized IDs and keys, migration branch order, initial defaults, merge precedence, pairing identities, revision handling, validation errors, local storage key, and existing exports/imports. No database migration is needed for folder organization. |
| Progression | XP thresholds, quest transitions, purchases, coins, discoveries, inventory and luggage, station security and boarding eligibility, train arrival state, and all save points. Preserve the immediate flush when the train arrives. |
| Scene geometry | Coordinates without rounding, dimensions, scale factors, spawn/return points, ordered interactables, solid shapes, walkable floors, visible/hidden variants, and stable scene object identity. |
| Player input | Keyboard response, pointer coordinate conversion, touch thresholds, tap versus hold, release/cancel behavior, click priorities, collision sliding, speed, route selection, seating, and exit behavior. |
| Simulation | Frame delta clamping, update order, random-number consumption, pause semantics, following delay, NPC stops and ranges, train timing, and animation phases. |
| Presentation | Camera framing, zoom, device pixel ratio handling, atlas crops, feet anchors, sprite sizes, layering, occlusion, colors, lighting, line breaks, Chinese text, pinyin, DOM IDs, and interactive focus behavior. |
| Audio and speech | Gesture-based audio activation, voice selection, volume including Panda gain, ducking, ownership across tabs/previews, cancellation, queue order, timeouts, fallbacks, pronunciation, and scene ambience. |
| Network and offline | URLs and methods, status codes and response bodies, cookie attributes, origin rules, CSP, payload limits, cache coverage, optional audio handling, update prompt, and recovery from interrupted save/update operations. |
| Operations | Existing launch, backup, and service entry points; data/model directories; environment variable meanings; startup and shutdown behavior. |

The saved original station illustration, platform drafts, source art, prompts, and README illustrations remain preserved. The train remains a separate movable asset. The approved platform framing, stair continuity, fixed camera, and traveler cast are presentation contracts, not opportunities for redesign.

## Proposed module structure

Use ordinary folders, named exports, and explicit composition. Create a module when it owns a coherent responsibility; do not split each function into its own file. Keep existing entry files as compatibility facades during migration. The following is a destination map, not an instruction to move everything at once.

```text
public/
  app.js                         existing boot URL, retained
  app/
    bootstrap.js                 constructs services and controllers
    controllers/                 settings, conversation, Panda, shops, recording
    ui/                          DOM rendering and shared small UI helpers
    features/                    practice, journal, map, adventure UI
    services/                    persistence, HTTP, speech, music, PWA
  engine/
    input/                       keyboard and pointer handling
    navigation/                  pathfinding, movement, interaction selection
    simulation/                  frame coordination, followers, ambient actors
    rendering/                   camera, canvas setup, actors, layers, labels
    assets/                      image loading, decode and recolor caches
  shared/
    geometry/                    pure geometry functions
    dialogue/                    pure reply contracts
  state/
    defaults.js                  shared initial state composition
    validation.js                pure validation using content and scene catalog
    merge.js                     current conflict merge policy
    migrations/                  existing save upgrades, including world adapters
  content/
    characters/                  identities, voices, appearances; grouped by cast
    activities/                  reusable activity definitions and learning data
    language/                    lexicon, pinyin, topics, authored language helpers
    art/                         descriptors, atlas bounds, generated metadata
    settings.js
    learner.js
  worlds/
    catalog.js                   pure registry of current scene definitions
    suzhou/
      manifest.js                pure composition and existing scene IDs
      scenes/                    town, rooms, quay, station ground/waiting/platform
      quests/                    pure Suzhou progression and transition rules
      dialogue/                  world-specific authored lines and subjects
      rendering/                 scene paintings, signs, masks and foregrounds
      audio/                     scene soundtrack and ambience descriptors
      presentation.js            browser-only composition of world painters/hooks
  styles/                        ordered, cohesive style sections
  assets/                        organized separately below
  sw.js                          existing service-worker URL, retained
server/
  index.js                       existing start/import entry, retained
  http/                          request policy, static files, route handlers
  storage/                       SQLite, identities, revisions, pairing
  dialogue/                      orchestration, authored replies, prompt assembly
  providers/                     Gemini and local model adapters
  audio/                         speech and transcription processes/queues
scripts/
  verify/                        dependency, content and asset checks
  art/                           explicit preparation and encoding recipes
  browser/                       active browser checks and fixtures
  ops/                           backup and service tooling
test/
  unit/
  integration/
  contracts/                     scene, save, render and replay comparisons
  fixtures/
```

Dependencies should point toward pure data and small capabilities:

- `shared` must not import application controllers, the engine, Node-only services, or world registries.
- Pure content and world definitions may use shared utilities. They must not load images, read the DOM, call APIs, or mutate browser state at import time.
- `state` may compose pure content and the pure scene catalog. World-specific save repair remains explicit there. Neither content definitions nor scene definitions import this aggregate state layer back.
- The reusable engine accepts the selected scene and specific callbacks. It does not import every world's manifest or application UI.
- Browser bootstrap selects a world, constructs services, and connects its optional presentation hooks to the engine. The server imports only pure content/state contracts and server services.
- Keep pure world exports and browser presentation exports separate. A convenient barrel that re-exports both would reintroduce browser dependencies on the server.

Do not add a framework, generic event bus, dependency-injection container, ECS, plugin loader, bundler, or TypeScript conversion as part of this refactor. The existing feature factories are an adequate composition pattern. Add only the interface needed by a concrete extraction; document it with short JSDoc and focused contract checks.

### Composition and state ownership

Use composition as the architectural rule for this pass. Keep character identities, dialogue profiles, voice assignments and appearance references as data definitions. Keep scene placements separate. Connect reusable movement, animation and interaction capabilities through explicit function calls and small controllers, so another world can reuse a character or behavior without copying it.

Use a small class or factory-created controller when a responsibility owns ongoing runtime state, such as a train arrival sequence, a conversation request or a character's existing movement state. Each mutable state value has one owner; other modules receive the capabilities or observations they need. A character definition must not become a second owner of position, route, animation timing or quest progress. Preserve existing state lifetimes and scene-keyed caches during extraction.

For example, a traveler definition supplies identity, voice and art; its scene placement supplies starting coordinates and scene-specific presentation; the existing runtime owner maintains its movement state and invokes extracted movement and animation capabilities at the same points in the frame. Rendering reads that state through the established interface, subject to the existing renderer-to-simulation exception described in phase 6.

This pass does not convert every character into a class or introduce a `Character → NPC → Traveler` inheritance hierarchy. Preserve existing useful classes and feature factories. Extract one capability or state owner at a time only where it clarifies a concrete responsibility. Apply the same behavioral comparisons and immediate rollback/freeze rule to every extraction; defer any ownership change that requires different update order, initialization, reset behavior or serialization.

## Asset organization

Keep all independently drawn sprites together, separated by role. Put world-specific collections underneath their role, allowing a new world to reuse the same NPC, item, or vehicle without copying its pixels.

```text
public/assets/
  sprites/
    player/
    companions/                  Panda and other companion art
    npcs/
      shared/
      suzhou/
        residents/
        travelers/
        station-staff/
    animals/
    items/                       suitcase, satchel, collectibles, inventory items
    icons/                       UI and map icons
    props/                       furniture, trees, bridges, fountains, signs
    vehicles/                    train and passenger boat
    effects/
  environments/
    suzhou/
      town/
      interiors/
      station/
  audio/
  fonts/
  previews/                      welcome/README-sized derivatives
  optimized/                     eventually mirrors the semantic source path
```

Classify an image by how it is rendered: a freestanding tree is a prop; a tree painted into a station background stays part of that environment. Do not cut up paintings or repack existing atlases to fit the directory tree. Classify character art as sprites while keeping identity/dialogue definitions in `content/characters` and scene placements in the owning world.

Each art descriptor should identify a stable asset key, existing source and runtime URLs, dimensions, atlas/crop metadata where applicable, role, consuming scenes, provenance/prompt, and preparation recipe. Start by recording existing facts and using existing URLs. Keep generated metadata distinct from manually authored data. Preserve original images and current optimized byte streams, including alpha and dimensions.

For eventual physical moves, copy one asset family unchanged, verify hashes, add compatibility aliases, migrate one consumer family, verify online/offline behavior, and only then consider removing old copies. Old URLs may need to remain available indefinitely for installed clients. A single server redirect is insufficient evidence that an old offline cache can still work. No runtime-loaded original or older art is deleted merely because it is absent from one static import scan.

## The gate for every small change

These steps apply to every execution item below, including every repetition of a row that says “one at a time.” A phase is not a batch to merge before testing.

1. **Choose one boundary.** Record exactly which responsibility will move, its callers, affected behavior, necessary checks, and known gaps. If a prerequisite is frozen, skip the dependent extraction.
2. **Checkpoint.** Start from a clean, verified commit on an isolated refactor branch/worktree. Preserve unrelated user changes. Keep the unchanged baseline in a separate checkout and use fresh processes/browser contexts for comparisons, so module globals and caches do not leak between versions.
3. **Capture expectations before editing.** Save deterministic data, representative input traces, visual frames, API/audio events, and save fixtures for the affected feature. Require the unchanged baseline to reproduce its own expected results first.
4. **Make one small change.** Extract or move one cohesive module/asset family. Preserve old exports and URLs. Do not combine movement with renaming public IDs, formatting entire files, editing content, changing algorithms, or updating dependencies. Split a step again if its diff is hard to review.
5. **Verify before proceeding.** Run syntax, the complete unit suite, dependency/content/asset checks, the affected deterministic comparisons, and the relevant browser flows. Run the full classified active browser suite before accepting each runtime/content/asset microstep; complete any additional device/manual checks required by the changed area. Use isolated stores, never the user's save database.
6. **Accept only an unchanged result.** Existing passing assertions must pass; existing failure signatures must remain unchanged; all new comparisons for the touched area must pass. No omitted coverage, new console errors, missing requests, save differences, frame differences, or changed interactions. Commit the verified change and its evidence before the next item.
7. **Rollback immediately on impact.** Stop testing new variations. Revert the isolated candidate commit, or restore only its owned patch if uncommitted. Never use a broad reset/clean that could discard unrelated work. Re-run the decisive comparison to prove restoration. Record the feature, evidence, reverted commit/patch, and blocked dependents in a frozen-aspects ledger. Leave that behavior's implementation untouched thereafter unless the user separately changes this requirement.

A failing test caused solely by a stale source-path assertion may be repaired as test infrastructure only after reproducing its unchanged baseline and proving that behavior and coverage are identical. Ambiguous failures require rollback. A confirmed gameplay change always invokes step 7, regardless of whether its cause seems easy to fix.

Until the generated offline inventory exists, each new browser module must be added to the current manual service-worker shell list in the same atomic extraction. Advance the shell cache identifier when needed to install the new files, without changing activation policy or map/save versions. Preserve old module URLs with facades. Verify the old-worker/new-code combination as well as a fresh install; updating offline coverage cannot wait until the asset phase. New module requests and deliberately migrated art URLs are expected structural differences, but API payloads, asset pixels, availability and user-visible behavior must remain equivalent.

## Required comparison coverage

| Area | Evidence needed before changing it |
| --- | --- |
| Pure scene data | Compare all 17 fully compiled scenes, not just source files: exact numbers, property presence, array order, doors, interactions, floor regions, solids, camera fields, and gated variants. Check that variant calls return the same stable objects. Do not sort arrays or round coordinates in the snapshot. |
| Movement and paths | Replay fixed starting states, timestamps, input sequences, and random streams. Compare position each simulation step, routes, collision response, nearest target, follower trail, and final state. Include doorway edges, bridges, queues, touch cancel, blocked diagonals, and pause/resume. |
| Rendering | Compare decoded assets and raw canvas pixels at identical world state, time, viewport, browser version, fonts, and DPR. Cover foreground occlusion, seated/walking poses, luggage, signs, dialogue bubbles, overlays, and reduced motion. Use deterministic harness clocks; do not alter production time/random behavior to make tests easier. |
| Station journey | Exercise boat/quay, ticketing, luggage screening, collection, stairs and lift, waiting hall, boarding checks, platform descent, all 14 traveler conversations, train arrival/save, return upstairs, reload, touch and offline continuation. A platform-only seed does not establish the whole journey. |
| Other worlds and rooms | Traverse every current scene and both directions of its links. Exercise shops, household activities, meals, tea guests, guides, collectibles, mini-games, map routes, XP gates, companion discovery/following and seating. |
| Dialogue and learning | Exact authored text, pinyin, options, topics, feedback, voice assignments, displayed word help, saved history, and effects. Compare model request bodies/options and use recorded responses for deterministic provider tests; stochastic live output is not an equality oracle. |
| Saves and networking | Initial state, every currently supported migration branch, removed-room repair, blocked/invalid coordinates, every station security/boarding state, purchases/inventory, merges, revision conflicts, pairing, offline writes and interrupted responses. Compare serialization and status/error behavior. Use synthetic or anonymized fixtures only. |
| Audio | Gesture activation, event ordering, cancellation, selected voice/track, gain, ducking, ownership, ambience and fallback. Use recorded/mock provider outputs for automation and listening on affected real audio paths. A muted browser cannot prove audible equivalence. |
| Offline installation | Fresh install, warm cache, old worker with new files available, old cached HTML/modules, requested worker activation, failed/partial installation, offline reload and backtracking across scenes, and save reconciliation. Verify optional personal audio is still optional. |
| Performance | On the same machine/browser, record repeated cold/warm startup, asset request bytes/counts, art-ready time, frame-time distributions, long frames, pathfinding duration and memory after repeated scene transitions. Set noise bands from baseline variability before editing; unexplained regression blocks acceptance. |

Static canvas comparisons should require exact pixels in a controlled environment. If a browser/font/codec path cannot reproduce itself exactly, isolate and explain that variability before accepting a refactor; do not introduce a generous screenshot tolerance that can conceal a changed pose, line wrap, or camera position. Input-to-action timing remains a gameplay contract even if a performance metric improves.

## Ordered implementation steps

Numbered items express dependencies and review order. Actual completion and deferrals are recorded in `docs/refactor/EXECUTION.md`. Each independently verifiable extraction receives its own commit. A row covering several files must be repeated for one cohesive group at a time, with the full gate between repetitions.

### Phase 1 Establish verification before moving code

| Step | Small change | Verification and exit condition |
| --- | --- | --- |
| 01 | Record baseline revision, runtime/browser/tool versions, file and import inventory, all scene/character/activity IDs, asset hashes, and the four existing failure signatures. Start an execution/frozen-aspects ledger. | A fresh isolated checkout reproduces the baseline. Do not include secrets, saves, models, or ignored personal media in artifacts. |
| 02 | Make unit-test and authored-content discovery support nested directories, without moving files yet. Keep an explicit inventory of files actually inspected. | The same 328 tests and current text corpus are covered, with the same existing failures. A temporary nested fixture proves future discovery; remove that fixture after its harness assertion is established. |
| 03 | Classify every browser script as active, historical, helper, or environment-specific. Add a manifest runner initially preserving the current 41-script ordering. Add independently verified station and newer content checks individually. | Every active test has a known invocation, isolated store/server, result, and scope. Port-3210 scripts are excluded until safely isolated and validated. Identify outdated assertions from unchanged behavior, not assumptions. |
| 04 | Add exact compiled-scene, content, initial-state, migration and request/response fixtures; add static import-boundary and asset-reference checks. | All fixtures are recorded from the unchanged game. Include property/array order and absent values, not a lossy JSON-only approximation where that would hide differences. |
| 05 | Add deterministic movement/frame replay and canvas comparison coverage to the test harness, one flow at a time. Add scene-qualified helpers while retaining old helper behavior for existing callers. | Baseline replay matches itself repeatedly. Cover the platform and full boarding flow, then town, interiors and remaining scenes. No production simulation changes to accommodate tests. |
| 06 | Record real desktop/touch/audio and offline-upgrade baselines, plus repeatable performance measurements. | Any feature whose necessary evidence is unavailable is excluded from later changes until that evidence exists. Do not label an entire subsystem verified by a single screenshot. |

Start with the existing commands `npm run check`, `npm test`, and the individually reviewed browser scripts. Useful station checks include `browser-station-platform.js`, `browser-station-floor-links.js`, `browser-station-departure.js`, `browser-station-ground-layers.js`, and `browser-station-waiting-layers.js` under `scripts`. `browser-pwa.js`, touch, dialogue and audio checks cover complementary contracts. The manifest created in step 03 must document the exact command set for each gate; no proposed runner command should be treated as already available.

### Phase 2 Extract low risk contracts and geometry

| Step | Small change | Verification and exit condition |
| --- | --- | --- |
| 07 | Move reply schema, validation and their necessary error helper from `server/dialogue.js` into a leaf contract module; re-export the old API. Point variation at the leaf. | The dialogue/variation import cycle disappears. Exact validation results, errors, schemas, authored replies, feedback and provider request fixtures match. Keep pronunciation/language limits intact. |
| 08 | Consolidate the identical initial-state definitions in `public/state/defaults.js`, retaining `newState` and `initialState` exports. Keep existing content factories and scene spawn composition. | Deep and serialized equality for new server/client saves; each call creates fresh mutable nested state as before. No browser globals in the server import graph. |
| 09 | Extract rectangle and polygon geometry helpers from `world.js` into `shared/geometry`, retaining existing exports. | Boundary and degenerate-shape results match, including comparison operators and iteration order. Full scene snapshots and movement traces unchanged. |
| 10 | Extract `canStand`, `move`, `interactionPoint`, `nearest` and district lookup separately, in that order, with compatibility re-exports. Do not combine them into one rewrite. | Preserve movement substeps, diagonal/x/y fallback, radius defaults, nearest-distance threshold and ties. Path, interaction and station collision traces match after each extraction. |
| 11 | Extract save-upgrade logic without rewriting its branches, then pure state validation in a separate step. Keep scene lookup explicit and server storage imports compatible. | Every migration/validation fixture matches, including currently unreachable legacy branches, removed rooms, checkpoint repairs and unauthorized platform states. Keep `MAP_VERSION` at 14. |

### Phase 3 Give worlds and content clear ownership

| Step | Small change | Verification and exit condition |
| --- | --- | --- |
| 12 | Extract the current town construction pipeline as one ordered function, without reworking its transforms. Keep its result and export identity unchanged. | Exact compiled town comparison. Preserve `compactOutdoor`, then `buildTown`, `refineMarket`, `expandTown`, `integrateMarket`, `widenWestBank`, scale, and bridge adjustments in the present order. |
| 13 | Move one already separate interior definition at a time into Suzhou scene ownership, starting with the smallest scene that has complete green coverage. Keep import facades. | Exact geometry/placements and both directions of entrance/exit travel match. Preserve room scale, art URLs and return points. |
| 14 | Move station ground, waiting and platform definitions one at a time into the same world package. Keep stable prebuilt gated scene variants. | Station checks plus whole boarding replay pass. Preserve latest ground v4, waiting v5 and platform v3 art, entrance wiring and train separation. |
| 15 | Assemble a pure Suzhou manifest and scene catalog from the existing definitions. Retain `world.js` registry exports; move home compilation and remaining scenes one at a time. | All 17 scene snapshots, catalog ordering, entrance links, legacy IDs and scene identities match. Home's 0.75 transform remains distinct from town's 0.9 transform. |
| 16 | Move world-query behavior out of authored `navigation.js` into a query module that consumes the pure catalog and interaction helpers. Leave authored destination phrases with content. | Same directions, target choices and fallback replies for every known destination, including reused NPC IDs. No data-to-engine cycle remains. |
| 17 | Extract NPC definitions by cast into `content/characters`, preserving the current registration/override order. Move one cast at a time; keep placements in scenes and mutable runtime state with its existing owner. | All 67 final definitions, greetings, pinyin, facts, starter options, voice overrides and art bindings match. Every platform traveler remains present and conversational. Definitions remain data; no character-class conversion is bundled into the move. |
| 18 | Separate reusable activities, learning/lexicon data and Suzhou authored dialogue by responsibility, one module at a time. Keep existing data exports. | All 27 activities, vocabulary coverage, authored text and dialogue branch fixtures match. Discovery checks prove moved text is still scanned. |
| 19 | Place station journey, luggage, departure, household and other world-specific pure progression modules with Suzhou, one existing module at a time. | Save/merge outcomes and all affected quests match. Do not redesign the serialized adventure object or replace existing state machines. |
| 20 | Add lightweight world/content validation at verification time: unique global IDs, valid scene links, resolvable character/art/activity references and explicit package exports. | It describes all existing heterogeneous scenes without normalizing their data or inventing new required fields. Invalid test fixtures fail; the current catalog behaves identically. |

### Phase 4 Separate application controllers

| Step | Small change | Verification and exit condition |
| --- | --- | --- |
| 21 | Extract settings and save/device panel orchestration from `app.js`, preserving existing selectors and persistence calls. Leave shared state ownership explicit. | Settings, undo, import/export, pairing, conflict handling, restart and offline behavior match. Persisted defaults and control labels remain identical. |
| 22 | Extract Panda panel/narration coordination as a controller using existing service references and callbacks. | Same tokens, timers, coaching behavior, collapsed/expanded state, ducking, speech interruption, narration delay and gains. Audio enable still occurs synchronously in the user gesture. |
| 23 | Extract conversation DOM rendering, retaining HTML, escaping, event delegation and focus behavior. Leave request/conversation state in its current owner for this step. | Exact visible lines/options, bubble help, history, shop appearances, keyboard handling and screenshots match. No duplicate listeners after repeated open/close cycles. |
| 24 | Extract conversation request coordination and its state into a controller. Move the relevant state and cancellation together, not a second copy. | Same request generation, abort, stale-reply rejection, pending states, feedback, speech and history saves. Rapidly switch NPCs, close/reopen and interrupt speech. |
| 25 | Extract purchase flows one shop type at a time, then recording/transcription orchestration in its own step. Keep pure definitions separate from UI. | Same item availability, coin changes, wardrobe appearance, repeat-purchase handling, microphone lifecycle and interruption behavior. |
| 26 | Relocate existing practice, adventure, goals, journal/panel and map UI factories into application ownership, one existing module at a time. Consolidate tiny helpers only when their semantics are already identical. | Each feature's progression, visibility and save effects match. Preserve interaction dispatch precedence; adventure handling currently precedes several other paths. |
| 27 | Extract browser boot/service composition into `app/bootstrap.js`; retain the original `/app.js` entry. | Welcome/start/resume/update flows, first-click audio, settings application, service order and one-time event binding match online and offline. `app.js` becomes wiring without changing when wiring happens. |

### Phase 5 Separate engine responsibilities without rescheduling the game

| Step | Small change | Verification and exit condition |
| --- | --- | --- |
| 28 | Document and characterize the existing `frame` sequence, then extract the sequence as an opaque coordinator if this improves ownership. Preserve method signatures and exports used by tests. | Same timestamps, clamping, early returns, pause behavior, callbacks, drawing and `requestAnimationFrame` scheduling. No reordered lines of simulation. |
| 29 | Extract keyboard handling, then pointer/touch handling as separate changes. Keep listeners attached at the same lifecycle point. | Key state, focus, touch coordinate conversion, 250 ms tap threshold, movement threshold, release/cancel and pointer speed behavior match in traces and devices. |
| 30 | Extract route/interaction selection from the engine, leaving pathfinding's algorithm untouched. | Same exit/floor-transition/NPC priority, hit targets, tie order, interaction approach, route completion and collision response. Preserve heap and neighbor ordering in pathfinding. |
| 31 | Extract scene transition and art-readiness coordination, retaining `World` methods as delegators. | Same route cancellation, arrival point, NPC reset, luggage/security guards, save timing, loading behavior, camera transition and resume state. |
| 32 | Extract station traveler, tea/hungry guest and other world-specific updates one at a time. Compose reusable movement, animation and interaction capabilities through explicit calls; use a small controller only where it clarifies existing state ownership. Connect callbacks at their current points in the frame. | World quest traces match at every frame; no duplicate state or updates. Preserve initialization, reset behavior and state lifetime. The train arrival callback still flushes immediately. No world-specific module imported back by generic engine utilities. |
| 33 | Extract Panda following and ambient-actor ownership separately, preserving current caches and call sites. | Same delayed trail, scene reset, idle behavior and NPC routes. The two existing range failures require passing differential traces before any affected extraction can proceed. |

Keep the existing pathfinding implementation and life simulation intact internally during these steps. Their `WeakMap` caches are keyed by scene objects. Creating fresh scene objects on access would change cache behavior and can reset populations or navigation work. This is why scene catalog steps must preserve identity, not merely deep equality.

### Phase 6 Separate rendering while preserving every draw pass

| Step | Small change | Verification and exit condition |
| --- | --- | --- |
| 34 | Extract image loading and decoding caches from `render.js`; extract recoloring separately after that passes. Keep cache keys and shared instances identical. | Same requests, decode readiness, atlas dimensions, alpha, recolored pixels and scene-entry frames. No image decoded or recolored twice because two module instances own separate caches. |
| 35 | Extract sprite/atlas primitives, then player and individual NPC painter groups one at a time. | Exact crops, feet anchors, facing, walking/seated poses, scale and pixels. Keep canvas save/restore boundaries and outfit recolor semantics. |
| 36 | Move already separate station/environment painters into Suzhou rendering ownership. Extract remaining contiguous world-specific draw blocks one at a time. | Exact masks, foreground overlaps, water/bridges, station signs, prop layers and train rendering. Preserve painter order and context transforms. |
| 37 | Separate canvas sizing/camera setup, actor-list construction, stable depth sorting, and overlays in individual steps. | Same DPR cap, camera offsets, fixed platform framing, sort ties, bubble layout and debug datasets. Do not replace branch order with a generic dispatch table in the same step. |
| 38 | Evaluate removing simulation calls from drawing only after a precise call trace exists. First preserve them through an explicit adapter at the same call sites. A later pure-render extraction is optional and independently gated. | Today `draw()` invokes `lifeActors`, and the engine reads it again after drawing. Prove identical population state, RNG consumption and time arguments. If purity requires changed behavior, freeze this aspect and retain the adapter permanently. |

The required result is understandable ownership, not ideological purity. A clearly documented renderer-to-simulation adapter is preferable to violating the unchanged-gameplay requirement.

### Phase 7 Organize assets and make production repeatable

| Step | Small change | Verification and exit condition |
| --- | --- | --- |
| 39 | Introduce art descriptors using current asset IDs/URLs and exact atlas metadata. Migrate the renderer path table and other registries one consumer at a time. | Every previously referenced file resolves, descriptors agree with decoded dimensions, and pixels and requests match. No asset files move yet. |
| 40 | Derive an asset inventory and offline list from explicit descriptors, while keeping code-module cache entries explicit initially. Then derive module entries from an audited entry/import inventory. | Generated lists exactly match the current ordered coverage before switching consumers. Preserve optional assets, batching, activation policy and no-API-cache behavior. Include non-import references in HTML/CSS/manifests. |
| 41 | Move art preparation scripts into named recipes, one script at a time. Add check/dry-run support and collision checks before changing output naming. | Recipes retain original crop parameters, encoder settings and dimensions. Dry-run modifies nothing. Run reproduction into a temporary directory; do not overwrite committed pixels when encoders produce different bytes. |
| 42 | Migrate one sprite family at a time into the role folders: start with an uncomplicated icon family, then items, NPC casts, player/companions, animals, props and vehicles as independently gated changes. | Copy unchanged bytes first, retain old URLs, update one consumer group, and compare hashes, pixels and old/new offline installations. Do not repack atlases or change the separate train asset. |
| 43 | Migrate environment, preview, font and audio families separately. Mirror semantic paths for newly addressed optimized outputs by copying existing encodings. | No recompression or soundtrack changes. Preserve MIME types, font loading, welcome imagery, optional ignored personal audio and retained source/reference art. |
| 44 | Evaluate old-URL cleanup one family at a time only after compatibility is demonstrated for installed clients. Prefer retaining aliases where lifetime is unknown. | No active, offline, saved-document, recipe or README consumer depends on removal candidates. Lack of a grep match is insufficient. Skip cleanup if old installations cannot be protected. |

Do not run the current `art:optimize` command simply to refresh a manifest during organization: it can regenerate many unrelated assets. Descriptor migration should initially preserve the existing `optimized-art.js` mapping and files. Reproducibility means recording and checking recipes; it does not authorize replacing approved artwork with newly encoded or generated output.

### Phase 8 Separate server boundaries

These steps can follow phase 3 independently of application and renderer extraction, provided their own baseline coverage is complete. Keep one active change at a time even when phases are independent.

| Step | Small change | Verification and exit condition |
| --- | --- | --- |
| 45 | Extract static-file serving, then request-policy/body helpers from `server/index.js`, as separate changes. Preserve the public-root resolution relative to the original entry. | Same paths, content types, traversal rejection, headers, origin checks, limits, cookies and error statuses. Test direct start and imported `createApp`. |
| 46 | Extract one API route group at a time into handlers receiving the existing app-scoped context. | Exact success/failure responses and validation order. Model busy state, speech queue, transcription busy state, rates and music ownership remain scoped per `createApp`, not recreated per request or shared across test apps. |
| 47 | Move SQLite operations, identity/pairing and revision handling into storage ownership, preserving SQL, transactions and methods. Separate one responsibility per commit. | Existing API/store tests plus conflict, interrupted write, backup and pairing fixtures match. Use temporary databases; do not touch live data or change schema. |
| 48 | Extract authored dialogue branches and prompt assembly separately from provider orchestration. Keep current branch precedence and world effects explicit. | Same reply and effect for every authored branch, including directions, shops, security and boarding; exact prompt/options for mocked model requests. |
| 49 | Move provider adapters into server/provider ownership. Share transport only where behavior already matches; keep caller-specific options explicit. | Same Gemini/local/story fallback order, request schema, cancellation, timeout and errors. Dialogue and variation have different model options today; preserve them. |
| 50 | Move speech, pronunciation, Panda speech and transcription adapters one module at a time, preserving process/queue ownership. | Same subprocess arguments, executable/model paths, voice output contracts, queue ordering, cleanup and API behavior. Complete listening/device checks for any touched audible path. |

The browser-served shared modules must never gain database handles, environment secrets, provider credentials or Node-only code. The fact that server and browser share pure content is useful; the refactor should make that intentional, not duplicate the content on each side.

### Phase 9 Finish UI and development organization

| Step | Small change | Verification and exit condition |
| --- | --- | --- |
| 51 | Split CSS by existing contiguous sections, one section at a time. Keep the original stylesheet URLs as ordered entry facades. Choose ordered imports/links only after measuring the resulting load path. | Identical computed styles, focus/hover states, breakpoints, reduced-motion behavior and screenshots; cold/offline load shows no missing or delayed styling. Do not group separated selectors by component if that changes cascade order. |
| 52 | Move browser/art/verification/operations scripts one tool at a time, preserving old command entry points through thin wrappers where needed. | Package commands, relative file resolution, generated service definitions and backup outputs match. Do not install services or relocate local models as part of this step. |
| 53 | Move tests into unit/integration/contracts groups only after recursive discovery is proven. Preserve test names and browser classification. | No lost tests, authored-source coverage, fixture paths or screenshots. Full classified runner still has a result for every active check. |
| 54 | Update developer docs with module ownership, asset recipes, test groups, commands and the world-creation procedure below. Reconcile stale coverage claims with verified inventory. | A reader can locate an NPC, its art, its placements, its dialogue and its checks without searching unrelated modules. Preserve historical product plans and art provenance. |
| 55 | Add a test-only minimal world fixture and verify the world contract using it. Keep it out of the production catalog and UI. | Demonstrates registration, scene links, one reusable character/item, art references and state isolation without adding a playable area or altering current saves. |

### Phase 10 Consider measured optimization and finish

| Step | Small change | Verification and exit condition |
| --- | --- | --- |
| 56 | Repeat phase 1 performance measurements on the structurally refactored game. Attribute any regression to an individual accepted step. | No unexplained startup, interaction, frame, memory or offline-install regression. A later-discovered gameplay difference still triggers rollback of the responsible aspect and its necessary dependents. |
| 57 | Consider one measured optimization at a time, such as avoiding repeated derivation of immutable metadata or narrowing a demonstrably overbroad preload list. Do not promise a speedup before profiling. | Same observable outputs, simulation timing and cache invalidation; measured benefit outside established noise. Loading changes require cold-entry, rapid transition, backtracking and offline tests. Any gameplay impact rolls back and freezes that aspect. |
| 58 | Remove an internal compatibility facade only when no live consumer depends on it. Keep external entry URLs, saved identifiers and required old asset paths. | Import graph, content/asset inventory, all verification, old-worker compatibility and operational entry points pass. If a facade protects compatibility, it is an acceptable final module. |
| 59 | Run final complete verification against both the immediately previous checkpoint and original `b85202c` baseline. Review the execution and frozen-aspects ledgers. | No accumulated behavioral drift. Report passed coverage, remaining known failures, unavailable evidence and preserved exceptions explicitly. Do not claim a fully completed refactor for skipped aspects. |

Do not change movement/pathfinding algorithms, time steps, actor counts, culling thresholds, camera formulas, image compression settings, AI defaults or gameplay balance under the label of optimization. Those changes belong in separately requested behavior/performance work with their own acceptance criteria.

## Dependency and stopping rules

The default sequence is phases 1 through 10. Phase 1 is mandatory before all runtime changes. Asset descriptors require stable content ownership; physical asset moves require offline coverage. Controller extraction does not require a new renderer. Server handler/storage extraction depends on the shared contracts and save baselines, but can proceed if an unrelated rendering step is frozen.

If a scene extraction changes its object identity and resets NPCs, revert it and freeze that extraction and downstream changes relying on the new catalog. Do not “fix” the NPC reset and continue. Independent work such as extracting a server reply schema may still proceed. Similarly, if moving icons breaks an old offline installation, restore their URLs and freeze that asset migration; other verified code extractions remain eligible.

A freeze applies to the implicated behavior and extraction, not automatically the entire repository. Record dependencies precisely. When uncertain whether another step depends on the frozen aspect, skip it until that dependency is established. Completion may legitimately retain a large method, compatibility facade, legacy URL, or rendering adapter.

## Adding another world after the refactor

The repeatable unit is a world package composed of scene definitions and optional presentation behavior. A new world should not require a new conditional in every engine, application, renderer and server file.

1. Create a world directory with a plain manifest and explicit scene exports. Allocate new IDs; never recycle the legacy `shanghai` scene ID for a different city.
2. Define authored geometry, entrances, return points, placements, camera policy and art references. Use existing fields and defaults. Add a shared engine capability only when the new world requires behavior that cannot be expressed by the current contract, as a separate change.
3. Reuse character definitions and sprite keys when appropriate. Add new identities, traveler casts, items and icons in their existing role folders. Scene placements specify where and how a character appears; dialogue and identity stay out of the renderer.
4. Put world-specific authored conversations, activities and quest rules with their owners. Preserve the central language/learning constraints and provider contract. Keep any new save fields and migration policy explicit in separate feature work.
5. Reference existing asset descriptors or add descriptors with provenance, dimensions, crop metadata, runtime URLs and preparation recipes. Generate/check offline coverage through the same tools.
6. Register the pure world manifest at the catalog composition point. Register optional painters/audio/hooks at the browser composition point. Keep server imports on the pure side. Avoid automatic directory discovery with hidden ordering.
7. Supply scene-link, collision, interaction, authored-language, state, screenshot and journey checks using the same fixture format and isolated browser runner. Include touch and offline coverage appropriate to the world.
8. Verify that every existing world remains unchanged before exposing the new one. Adding content is a later feature task; the refactor's test fixture is not a production world.

This permits a future world to remain a small, explicit collection of content and presentation modules. Reuse existing capability functions first; avoid designing a universal world schema around hypothetical future features.

## Execution record and completion criteria

Use this record for each actual microstep. Store evidence under ignored test output or a dedicated baseline artifact directory; commit only intentionally selected fixtures, never live saves or environment data.

```text
Step and repetition:
Previous verified commit:
Responsibility and files changed:
Expected identical behavior:
Baseline fixtures and tool versions:
Commands and device checks:
Data, frame, save, API, audio and performance comparison results:
Existing failure signatures and coverage gaps:
Accepted commit OR reverted patch/commit:
Frozen aspect and blocked dependents, if any:
Next independent eligible step:
```

The refactor is complete only when accepted changes have clear ownership, enforceable dependency boundaries, repeatable tooling and unchanged verified gameplay. All previously passing checks remain passing; no moved content disappears from validation; all current scenes, NPCs, activities and art remain available; old saves and installed offline copies continue to work. Any frozen aspect remains explicitly excluded and intact.

The execution record distinguishes completed verification, accepted refactors, reverted attempts and work blocked by missing evidence. Completion of a checkpoint does not imply completion of all phases.
