# Refactor execution record

**Status: all four milestones of the reduced scaling-foundation pass are complete and accepted.** The original 59-step plan remains a deferred backlog. No gameplay regression was established.

Execution follows `docs/REFACTOR_PLAN.md`, including composition, single ownership of mutable state, and immediate rollback/freeze on gameplay impact. The original gameplay reference is `b85202c`; the approved plan checkpoint is `bded242`.

The user subsequently authorized small batches of about 3–4 related steps before the full gameplay gate. The first batch is steps 07–09. The user subsequently narrowed the active scope to four scaling-foundation milestones listed at the top of the plan; the remaining original steps are deferred. Each batch retains its own previous accepted checkpoint and is rolled back as a unit on a gameplay difference; no subsequent batch is applied before acceptance.

All checks use isolated worktrees and disposable stores. The live game, user saves, installed services and model files are outside the change scope. Local dependencies, installed speech tools and the optional personal soundtrack are available through ignored links for testing; they are not added to Git.

## Step 01 Baseline inventory

- Recorded Node/browser versions, exact production file hashes, static literal imports, asset sizes and scene/NPC/activity IDs in `baseline-inventory.json` using `scripts/verify/inventory.js` from the unchanged reference checkout.
- Baseline syntax check passed. The complete unit suite reproduced 328 tests, 324 passing and the same four existing failures recorded in `baseline-failures.json`.
- Baseline browser characterization is in progress. Each check has its own log and disposable server. Live-port scripts and helper modules are excluded from execution until explicitly classified.
- Runtime changes: none.

## Verification limits and frozen aspects

No gameplay regression has been established. Missing or failing coverage is recorded here before choosing any affected step; an existing failure is never treated as a passing check. Attempted runtime changes remain unaccepted until their complete gates finish.

## Step 02 Recursive discovery

- Added recursive, deterministic test discovery and authored-source discovery, including future module destinations before files move.
- Compared complete ordered file lists against the original scanner: language still inspects 102 files and pronunciation 55; unit discovery still finds all 58 original test files.
- A temporary nested fixture was found and an unrelated text file excluded; the fixture was removed after verification.
- Syntax passed. The complete suite again ran 328 tests with 324 passes and the same four failure names and details. No production files changed.
- User reported a concurrent dev-mode feature in another thread. Integration must preserve that feature and establish its completed version as the comparison baseline for toggle-specific behavior.

## Step 03 Browser inventory and runner

- Classified all 92 existing browser-prefixed files: 83 isolated active checks (41 maintained, 42 supplemental), 7 environment-specific/live-port scripts, and 2 helpers. Baseline failures remain active checks; they are not dropped to obtain a green suite.
- `node scripts/verify/browser.js --list` preserves the existing 41-check ordering. `--group active --keep-going` runs all 83 isolated checks and records individual logs/results. The original `test:browser` command remains available.
- Manifest validation rejects unclassified, duplicate or stale paths. Live-port checks cannot be selected by this runner. Each run uses the existing isolated script unchanged.
- Baseline characterization continues serially against unchanged production code. Runtime changes remain gated on the resulting coverage.
- Runner smoke test passed; syntax passed; complete unit suite retained 328 tests, 324 passes and the same four failures.

## Step 04 Exact gameplay contracts

- Added ordered object-graph encoding that preserves undefined values, non-finite numbers, negative zero, property order and object aliases.
- Captured 62 sections: all 17 compiled scenes plus 16 gated station cases, characters, activities, initial saves, geometry samples/routes, 1,142 save-upgrade cases, 637 authored dialogue replies, mocked provider request bodies, progression/merge outcomes, NPC simulation and train timing.
- Two fresh reference processes produced byte-equivalent contract data. The candidate worktree matched every section. Full raw snapshots remain in ignored test output; committed section SHA-256 digests permit exact verification without adding a 28 MiB generated file.
- `node scripts/verify/contracts.js --compare docs/refactor/baseline-contracts.json` checks every section. Use `--root PATH --write OUTPUT` to reproduce full data from a chosen checkout when diagnosing a mismatch.
- `node scripts/verify/structure.js` verifies 119 modules, 229 unchanged original assets and 194 literal asset references. The only permitted existing import cycle is dialogue/variation; new cycles fail verification.
- Syntax passed. The complete unit suite retained 328 tests, 324 passes and all four existing failure details. These contracts complement browser/device checks; they do not waive uncovered visual, interaction or audio behavior.

## Step 05 Deterministic rendering and input replay

- Added a harness that drives the unchanged `World` with explicit frame times and real keyboard events. It records raw canvas-pixel SHA-256, camera/actor datasets, positions, routes, callback events and progression state.
- Recorded 123 frames across 24 scene/viewport cases: all 17 scenes on desktop, six scenes in phone portrait and the platform in landscape. Traces cover movement, low-frame-rate movement, pause/resume, route returns and train arrival.
- Repeated baseline images matched. The first comparison exposed a recorder-only JSON issue (`undefined` becoming `null` in event arrays); the shared lossless encoder corrected the recorder without changing production code. A fresh reference capture and candidate capture then matched byte for byte, including event values.
- `node scripts/verify/frames.js --compare docs/refactor/baseline-frames.json` is the visual/runtime gate. It requires the recorded Chromium/font environment; it does not use image tolerances.
- Added optional `{ sceneId }` to `walkToStop` for reused character IDs. Verified legacy lookup still resolves Xiaocheng to the quay and explicit lookup resolves him to the platform; invalid scene/stop pairs fail clearly.
- Syntax, pure contracts and the complete unit suite passed their baseline-equivalence gates (324 passing, same 4 failing). Production code and asset bytes remain untouched.
- This harness does not establish the correctness of every application dialog, physical-device behavior, or old-worker update sequence; those remaining gaps stay explicit.

## Step 06 Baseline coverage and performance

- Completed all 83 isolated browser checks against unchanged `b85202c`: **55 passed and 28 failed**. No runner-level timeouts occurred. `baseline-browsers.json` retains every result and complete normalized failure details. Failures include older conversation/practice selectors, current welcome behavior, and several station inspections; none are silently excluded.
- Added strict comparison mode: `node scripts/verify/browser.js --group active --baseline docs/refactor/baseline-browsers.json --report test-results/refactor/candidate/results.json`. It stops on the first changed outcome or failure detail. Line numbers, checkout paths, ephemeral ports and process IDs are normalized; assertion values and messages remain exact.
- Recorded three cold/warm headless desktop startup pairs in `baseline-performance.json`. Art-ready time was 2.125–2.568 seconds cold and 1.881–2.080 seconds warm; median frame interval was about 16.7 ms and p95 about 33.4 ms. These are environment-specific observations, not a promised optimization or physical-device benchmark.
- Existing automated checks passed for real speech decoding/voice selection, music, music ownership, station audio, touch controls, station departure, baggage, floor links, platform, layers and waiting signs. Muted playback checks do not establish subjective sound quality.
- Syntax, complete unit baseline equivalence, and strict-runner smoke verification passed. No production source or asset changed during phase 1.

### Coverage restrictions before runtime changes

- UI/controller changes need replacement passing coverage for the affected failed legacy checks before acceptance. The exact world-frame harness does not substitute for dialogue, settings, purchases, practice or journal flows.
- Public module/asset URL changes require the old-worker/new-code upgrade comparison below for the actual candidate. Existing platform offline coverage passed, but the broader PWA check still stops at an outdated activity assertion before completing its remaining save/reconnect cases; those persistence flows remain separate coverage requirements.
- Audio controller/process changes and physical-device-sensitive input/CSS changes require the additional device/listening evidence specified by the plan. Those changes are deferred while that evidence is unavailable.
- Performance optimizations are deferred until the affected scenario has sufficient uncontended repeated measurements. No timing, speed, delay or algorithm changes are permitted in structural extractions.
- A server-only leaf extraction may proceed using exact schema, validation, authored-dialogue and provider-request comparisons plus the complete browser baseline gate. It introduces no browser module/asset URL, audio-process, input or presentation change.

### Verification correction before accepting step 07

- The first dialogue-contract extraction was immediately reverted when browser check 32 reported a different fingerprint. The assertion was still `小莲 !== 莲`, with the same actual/expected values; only Node's asynchronous stack gained two internal scheduling frames. The unchanged reference reproduced the same assertion. The candidate patch and logs remain in ignored `test-results/refactor/schema-reverted`.
- The comparator now omits stack frames while preserving error messages, call logs and assertion properties. The original baseline file remains unchanged. Added verifier checks prove normalization is repeatable, internal stack scheduling does not change an outcome, and changed assertion values/messages are rejected.
- All 32 completed candidate outcomes match the original assertions after this correction. This was a verification-tool mismatch, not evidence of a gameplay change; no gameplay aspect is frozen on that basis. The runtime extraction still requires a new complete browser gate before acceptance.
- Syntax and all 328 unit tests retained the original 324 passes and four exact failure details. No runtime code is changed in this correction checkpoint.

### Additional geometry and offline baseline coverage

- Added explicit boundary and degenerate geometry cases, collision-cache reuse, movement around a fixture wall, nearest-object ties, district edges and null/zero approach coordinates. Two unchanged-reference captures and the restored candidate match `baseline-geometry.json` exactly. Run `node scripts/verify/geometry.js --compare docs/refactor/baseline-geometry.json`.
- Added an isolated same-origin old/new application host with a shared disposable store. `scripts/verify/offline-upgrade.js` follows the actual browser import graph and verifies exact cached module bytes, preserved save data, and absence of cached API requests.
- The unchanged reference passes ordinary offline reloads and a test-only cache-version update: installed old version, fully installed waiting update, new code under the old controller, activation through the existing Update game button, and a fresh phone-sized installation. All 103 browser modules remain available with exact bytes; no page errors occur. Results are in `baseline-offline.json`.
- The first activation probe exposed harness navigation timing: the recorder tried to start before the reload completed. Awaiting the load event resolved this without any production change. A repeated probe also explicitly waits for the waiting worker's `installed` state; it passes.
- Actual module/asset changes must run this harness against the original and immediately previous checkpoint, without `--probe-update`; the probe flag only validates the unchanged baseline's existing update flow. Physical device, subjective audio and additional save-conflict coverage limitations remain in force.

### New module request verification correction

- The unaccepted 07–09 batch passed syntax, all 62 data contracts, geometry cases, the complete unit baseline and all 123 exact rendered frames. Its offline audit then stopped when the recorder used plain `fetch()` for a newly introduced script URL. The batch was immediately restored to its previous runtime state; the patch and all three new modules were saved under ignored `test-results/refactor/batch-07-09/reverted`.
- The recorded game had already booted offline successfully with `artReady=true` and no page errors. Inspection showed that the previous worker handles script requests through a different branch from plain fetch requests with an empty destination. Plain fetch does not exercise the game's module-loading contract for a URL absent from that old worker's shell list.
- An unchanged-reference fixture now adds one test-only module during the probe update. Its actual module import succeeds offline under the previous worker while plain fetch of that same URL fails. All waiting/activation/fresh-install cases pass. The byte checker now inspects the same cache fallback used by script requests; real application boot still runs before each check. No production code was changed to obtain this result.
- This establishes a recorder mismatch rather than a gameplay difference. The identical 07–09 candidate may resume its remaining offline/browser gates; its already completed data, unit and frame evidence remains applicable only if the restored candidate patch and new file bytes are identical.

### Browser polling calibration

- Check 68 stopped the unaccepted 07–09 batch because Playwright reported 61 polling attempts instead of the baseline's 60. The batch was immediately restored; its exact patch and extracted modules are saved under `test-results/refactor/batch-07-09/browser-mismatch-reverted`.
- The unchanged original checkout reproduced the identical 61-attempt failure: same Panda selector, 30-second timeout and hidden element. Normalization now ignores only the polling repetition count, while preserving the timeout, selector, observed element and all assertion values. Mutation checks reject changes to those meaningful details.
- No gameplay difference was established. Completed checks remain applicable to the byte-identical reapplied batch; the remaining browser checks must finish before acceptance.

## Milestone 1 accepted: shared foundations (steps 07–09)

- Extracted the dialogue schema/validation leaf to remove the server import cycle, shared the literal initial state factory, and moved geometry primitives with their existing WeakMap cache. Compatibility exports and all algorithms remain intact.
- Accepted only after the byte-identical candidate matched all 62 data contracts, explicit geometry cases, all 123 rendered frames, and all 83 browser outcomes (55 pass; the same 28 existing failures). The unit suite remains 328 tests, 324 pass and the same four exact failures.
- The corrected offline audit passes all five old/waiting/activated/fresh-install cases, covering 105 current browser modules, preserved saves and no page errors. All 229 original asset hashes remain unchanged.
- Evidence: ignored `test-results/refactor/batch-07-09/`. Scheduling-only recorder corrections and immediate candidate restorations are recorded above. No gameplay regression was established.
- Added `scripts/verify/gate.js` to orchestrate the same complete batch checks and stop on any mismatch. `FRAME_ORDER.md` records current update order for reference; engine extraction is deferred.

## Remaining scaling batch (milestones 2–4)

Four related structural pieces form the next batch: (1) world manifest/catalog with existing navigation and migration separated; (2) character catalog and language definitions separated; (3) role-based asset descriptors and explicit optimizer inputs; (4) world validation and new-world instructions. Existing scene providers move intact behind compatibility paths. No input, audio, paint, animation or controller algorithm is rewritten.

Legacy image files and URLs stay in place; their role-based descriptors provide the organization and explicit build inputs needed now. Physical migration of old image files is deferred with the broader backlog. New images should use `assets/sprites/<role>/` and world-owned environment folders. No image optimization is run during this pass.

## Milestones 2–4 accepted: scaling foundations

- Suzhou construction and six cohesive scene providers now have world ownership, with original module paths retained as re-export facades. The explicit catalog preserves scene object identity. Movement/query function bodies and historical migration branches were extracted literally.
- Character registration retains all 67 definitions and the original ordered overrides; topics, lexicon and starters have a separate owner. Runtime classes retain their existing mutable state.
- Added eight role-based art descriptor groups covering 129 source/direct-reference assets, and moved the literal renderer URL table without changing any loading or painting logic. The optimizer uses the same 81 ordered source/output jobs, now explicit. An extra archived-draft conversion found during build-plan comparison was excluded before any image processing; no image processing was run.
- Added world validation for IDs, references, coordinates and asset output collisions, including malformed-fixture checks. Added the new-world guide and README entry. The build-only descriptor correction does not affect imported browser modules; its validation and exact 81-job comparison were rerun.
- Syntax, structure, world validation, all 62 contracts, geometry, original unit outcomes, all 123 frames and both original/previous offline upgrade comparisons have passed. Current browser graph: 117 modules. The complete browser comparison finished with all 83 outcomes equivalent: 55 pass and the same 28 failures. This batch is accepted.

### Concurrent dev-mode integration evidence

- Captured the other thread's 13 tracked edits and two new tests in an isolated checkout without changing the primary workspace. The snapshot excludes real `.env` values and live saves.
- Feature-only and combined unit runs both report 331 tests, 327 passes, zero skipped/cancelled and the same four original assertion details. All three new dev-mode tests pass.
- The feature-only and combined desktop/phone browser test passes password cancellation, rejection, enabling, reload, disabling and XP gating. Combined default-mode contracts and all 123 frames match the original baseline. Installed feature-only to combined offline updates also pass.
- Integration retains the recursive unit runner and adds the dev-mode browser check to discovery. Its primary-workspace baseline overlay adds only the three unit passes and one observed browser pass; the original 83 outcomes and four unit failure details stay intact. These feature-specific discovery/baseline additions remain with the uncommitted dev-mode work.
- The 83-check full browser refactor sweep runs on the isolated refactor candidate. The combined candidate receives the separate feature checks, unit/data comparisons, exact frames and offline upgrade check described above; a second full 84-check combined sweep is not claimed.

### Final acceptance and retained limits

- The complete reusable gate passed for the scaling batch: syntax, structure, world validation, 62 exact contracts, geometry, unit baseline equivalence, 123 exact frames, offline updates from both original and previous checkpoints, all 83 browser outcomes, and diff checks. Evidence is under ignored `test-results/refactor/scaling-foundations/`.
- The art build preflight rejects conflicting output producers before writing. Its read-only `--list` output matches all 81 original ordered jobs. No images were regenerated, relocated or recompressed; all 229 original asset hashes remain protected.
- Physical-device behavior and subjective audio quality were not newly verified. Existing four unit failures and 28 browser failures remain explicit coverage limitations, with their original assertions preserved. No input, painting, audio, controller, CSS, delay or progression algorithm was rewritten.
- The primary workspace receives only the accepted refactor in its commit. The independently verified dev-mode working changes and their discovery/baseline additions remain unstaged. No live service, saved game, real environment secret or model file was changed by the refactor.
