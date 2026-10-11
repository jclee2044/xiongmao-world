# Task 1 — XP, rewards and progression

Prerequisite: `837fc13` was HEAD and an ancestor before editing. Read `docs/ADDING_WORLDS.md` and `docs/refactor/EXECUTION.md`; no AGENTS.md was found in the repository or its parent. Tasks 2 and 3 confirmed they were waiting; Task 4 was interrupted before implementation. Implementation here was serial. The pre-existing dev-mode work remains uncommitted and is excluded from this task's checkpoint. No deployment or live-save changes.

## Progression contract

- Boat departure: 750 total XP, inclusive.
- After arrival at the quay, HUD/journal: current XP / 1400 (also after returning to town). The upstairs ticket check and subsequent platform entrance require 1400 XP.
- Platform HUD: current XP / 1500. Train panel separately shows platform XP / 100. Boarding requires both counters, plus existing ticket/security clearance and train arrival. An arrival with 2000 XP and zero platform XP cannot board.
- Existing `stationJourney.boarding` still means upstairs clearance. New `trainBoarded` records successful train boarding; the actual train ride remains unimplemented. Leaving the station resets clearance/boarding, but does not reset platform XP.
- Historical saves retain XP, quest flags and positions. A historical save already on the platform stays there; entering it again rechecks the new threshold. Old total XP is never guessed to be platform XP: the new local counter starts at zero.
- Dev-mode bypass behavior remains in the uncommitted integration overlay, including the new train requirement.

## Reward API for subsequent tasks

`public/data/rewards.js` owns the thresholds, `progression`, `trainProgress`, `grantReward`, `completeQuest`, `beginInteraction`, `answerInteraction`, and `completionText`.

Call rewards inside `persistence.change` so progress and reward are one durable local save:

```js
persistence.change(s => {
  result = completeQuest(s.adventure, {
    id: 'quest:station-example', amount: 40,
    scene: s.scene, label: 'Help the traveler',
  }, {
    isComplete: a => a.exampleQuest === 'done',
    complete: a => { a.exampleQuest = 'done'; },
  });
});
// Render completionText(result) through textContent or the existing escaping helper.
```

Use a stable semantic ID for a one-time quest. Never generate a fresh ID in a render or result callback. `grantReward` returns `{id,label,gained,amount,alreadyCompleted}`; duplicates gain zero. `completeQuest` also accepts a historical completion predicate so pre-ledger completed quests cannot be re-awarded. Flowers and tea use this interface. Their result panels show completion and +60 XP received; all 27 practice activities, including bookstore and lantern riddles, show a +20 XP completion result.

The additive default/validation/merge owner is `public/state/rewards.js`, reached through `newAdventure`/`validateAdventure` and the existing defaults/migration pipeline. Persisted fields: claims, encounter rounds, platformXP. `Persistence.change` accounts for existing guarded legacy rewards earned on the platform; explicit events carry their earning scene and are excluded from that fallback. An outside event completed asynchronously while viewing the platform does not become platform XP. Claim dictionaries are replaced on rewards, avoiding per-movement ledger copying.

Existing save-conflict policy remains conservative: total XP and platform XP use the larger counter, while claim IDs and encounter rounds merge. This prevents duplicate awards but does not sum disjoint offline-device counters. Multi-device additive event reconciliation remains a limitation; this task does not replace the existing conflict policy.

## Intentional replay rewards

- Normal conversations: first opening of a saved encounter gives 5 XP; its first successful answer gives 15 more. Repeated callbacks, double taps, closing/reopening, further answers and reload do not award the same encounter again.
- The visible **New conversation** button explicitly starts another rewarded encounter after the previous one has been answered. Pressing it twice before answering does not advance again. Encounters are keyed by scene and NPC, so meeting a traveler in a new setting is a distinct encounter. This is not a permanent one-reward-per-NPC restriction.
- Practice: each fully completed round gives 20 XP. **Try again** or starting a completed activity deliberately begins the next round. Merely opening a result does not increment rounds. Completion and XP are saved atomically, replacing the old UI-observer delta award.
- Hotpot: a newly prepared and eaten meal retains its intentional 25 XP replay reward; the Lian quest bonus is one-time 60 XP. Stale eating callbacks are guarded. Existing guarded purchases, museum exhibits, discoveries and direction quests retain their amounts and one-time rules.

## Budget audit and Task 6 gap

Suzhou has 27 practice activities (540 XP for one round of each), 60 flowers, 60 tea, 85 first hotpot with Lian, three exhibits at 15 each, three direction goals at 40 each, nature/five-friend bonuses at 40 each, purchases, and normal conversations at 20 per answered encounter. There are ample varied sources for 750; completing every activity is unnecessary.

From a minimum 750-XP boat departure:

| Segment | Normal encounter placements | First answered encounters | Budget consequence |
| --- | ---: | ---: | --- |
| Quay | 6 | 120 XP | Includes Xiaocheng |
| Ground floor | 5 | 100 XP | Excludes four scripted ticket/security staff |
| Waiting hall | 19 | 380 XP | Excludes help desk and gate controller |
| Pre-platform total | 30 | 600 XP | 1350 total: **50 XP short** of entry |
| Platform | 14 | 280 XP | Five different answered encounters provide the required 100 local XP |

Counts are placements, not unique people: returning travelers have new scene-specific encounters. Availability can depend on travel progress. A route using all pre-platform conversations plus three different practice rounds earns 660 XP and reaches 1410. If those activities were already completed in town, this uses intentional replay; do not describe it as entirely fresh content. A no-replay route needs at least **50 XP of new pre-platform activities**, and fewer mandatory conversations would improve variety considerably.

Future rewards are 40 + 50 + 80 + 130 + 50 = 350 XP. If all were pre-platform, 300 of the 650 required XP would still need other sources (15 answered encounters). If 100 of the reward budget is allocated to the platform, the pre-platform remainder is 400 (20 encounters). These are allocation examples, not assumptions about quest locations. Task 6 must assign actual earning locations and re-audit both total XP and the independent 100-local-XP gate. No numerical platform gap remains with five different existing conversations, but varied platform activities are still desirable. No new station quests were built here.

## Verification and handoff

Evidence logs are in `/tmp/lotus-task1/`; screenshots and offline report are in `test-results/rewards/`. Tests use disposable stores and local servers, not the installed service. The sandbox-only unit attempt was invalid because localhost sockets were blocked; runs with local sockets enabled establish the real baseline.

- Before: `npm test` — 331 tests, 327 pass, four existing failures.
- Before: `node scripts/browser-dev-mode.js`, `node scripts/browser-boat.js`, and `node scripts/browser-station-platform.js` passed. `node scripts/browser-journal.js` failed its existing hidden `#activity-tracker` assertion.
- Unit failures preserved: authored text range; duck/person ranges; market-cat range; station-help pinyin for 处 (`one0` versus `chu4`). The reported 28 historical browser failures were not relabeled as passes or removed; a full 84-check sweep was not run for this feature.
- Threshold-dependent fixtures alone were updated in adventure/boarding/waiting/platform unit checks and boat/platform browser checks. The other thread's dev-mode script stays byte-for-byte unchanged; a disposable copy verifies its new expected thresholds.
- `node scripts/verify/rewards-browser.js` covers desktop and touch-phone viewports: 5/15 rewards, reopen/reload, explicit replay, bookstore and lantern results, 1399/1400 entry, 1499/1500 boarding, overqualified arrival, and saved boarding flags. Screenshot inspection found readable results with no horizontal overflow.
- `node scripts/verify/offline-upgrade.js --previous /tmp/lotus-task1/baseline --candidate . --additive-rewards --out test-results/rewards/offline.json` verifies old/waiting/activated/fresh-phone installations, 119 current modules cached, no page errors, and exact preservation of historical fields plus empty reward defaults. The explicit flag allows only this specified additive migration; ordinary refactor comparisons remain exact.

Final verification totals and checkpoint isolation are recorded below. Task 2 must use this verified integrated working tree, preserve the dev-mode overlay, and retain the reward/replay semantics when changing interaction UI. The new replay button and completion status must remain reachable on phones. No physical-device or subjective audio verification is claimed.

### Final integrated results

- `npm test`: **339 tests, 335 passed, the same 4 failed, 0 skipped/cancelled**. All four assertion messages were compared exactly with the pre-task run. Eight new reward tests pass, including the maximum-total-XP save edge case (local credit must still be earnable).
- `npm run check` and `npm run check:worlds`: pass (17 scenes, 67 characters, 129 assets).
- `node scripts/verify/rewards-browser.js`: pass for desktop and touch-phone, including both gates and persistent train boarding.
- `node scripts/browser-boat.js`: pass at 0/749/750, including reload and repeat travel.
- `node scripts/browser-station-platform.js`: pass for both floor links, all 14 conversations, train inspection, reload/re-entry, portrait/landscape phone, reduced motion and offline.
- Dev-mode browser test, disposable threshold-only adaptation: pass for desktop/phone enable/cancel/rejection/reload/disable and zero-XP travel. Its source remains untouched, so running the original script still expects the obsolete 500/1000 labels; its owner must update those expectations when committing dev mode.
- `node scripts/browser-journal.js`: same pre-existing hidden activity-tracker failure. New passing reward UI coverage directly exercises the changed bookstore and lantern flows despite this legacy check failing.
- Offline migration command above: pass, all five installation/update cases, 119 current modules, no page errors.
- `git diff --check`: pass. No baseline golden/failure files were changed by Task 1.

### Changed files

Production: `public/data/rewards.js`, `public/state/rewards.js`, `public/data/adventure.js`, `public/data/station-journey.js`, `public/app.js`, `public/game/adventure.js`, `public/game/engine.js` (platform-door threshold only), `public/game/goals.js`, `public/game/panels.js`, `public/game/persistence.js`, `public/game/practice.js`, `public/game/station-interactions.js`, `public/sw.js`.

Validation: `test/rewards.test.js`, `test/adventure.test.js`, `test/station-boarding.test.js`, `test/station-platform.test.js`, `test/station-waiting.test.js`, `scripts/verify/rewards-browser.js`, `scripts/verify/offline-upgrade.js`, `scripts/browser-boat.js`, `scripts/browser-station-platform.js`. Handoff: this file.


### Task-only checkpoint isolation

The task-only tree was reconstructed against `837fc13` in a disposable checkout, leaving primary working files intact. Its unit suite reports **336 tests, 332 passed, the same four failures, no skips**; syntax and the desktop/phone reward browser check also pass. The integrated tree has three additional passing dev-mode tests. The Git index contains only the 23 files listed above; dev-mode implementation, configuration, discovery/baseline overlays and its two new test files remain outside the checkpoint. Untouched dev-mode files were compared byte-for-byte with the pre-task snapshot. Task 2 may proceed after this checkpoint is recorded; use the integrated working tree and this handoff.
