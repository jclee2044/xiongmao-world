# Task 2 — Chinese and Panda interaction UI

Prerequisite: Task 1 checkpoint `bc6928e` and `docs/XP_REWARDS_HANDOFF.md` were read and verified before implementation. Refactor `837fc13` is an ancestor. Other implementation chats were idle. Repository guidance and the world/refactor docs were read; no AGENTS.md was found. Work was serial in this checkout. No deployment, live-save edits, new quests, XP policy changes, NPC movement changes or art generation.

## Behavior and ownership

- `public/data/language-text.js` owns `segmentChinese(text)` and `chineseNumber(value)`. Contextual ICU boundaries precede dictionary lookup. Reviewed compound labels and Latin names stay intact; experiential verb + 过 is a help unit. `server/dictionary.js` searches within these boundaries, preserving sentence offsets in every Chinese token's `context: {source,start}`. The example is `你 / 看过 / 关于 / 旅游 / 的 / 故事 / 吗`, without stealing 关于's first character into 过关. Tests also cover 听过关于, 研究生命, legitimate 研究生 and legitimate 过关.
- `public/game/words.js` uses the same segmentation fallback offline. Dictionary-help speech passes the token context. `Speech.play` bypasses dialogue variation for contextual word requests, so a word cannot be replaced by an unrelated dialogue variation. Existing vocabulary help outside activity action buttons remains available.
- `public/data/pronunciation.js` retains contextual polyphones and adds the ordinary neutral-tone 故事 reading. The boat's displayed/spoken Chinese uses 七百五十分 and le, with no Latin XP in the utterance. The English progress UI still uses 750 XP. 了解 retains liao3; a following completion 了 remains le0.
- `public/game/dialogue-variation.js` now varies only explicitly marked `p.chinese[data-dialogue]` inside activity panels. Unmarked instructions, vocabulary and practice prompts are stable. The adventure text helper marks actual dialogue. Hotpot ordering and serving use the displayed line as the speech source; separate **Instructions** explain player actions. NPC speech punctuation may be normalized to Chinese full stops by the existing voice engine.
- Mobile/coarse-pointer conversation opening focuses the close control rather than the response field. Tapping the field and explicit **Use this reply** actions still focus it. Desktop typing behavior is retained. Task 1's **New conversation**, response rewards and completion controls remain intact.
- `pandaSpeaker`, exported from `public/game/coach-questions.js`, is shared attribution markup using existing Panda art and the centered English name **Panda**. Adventure Panda lines and practice hints/retry comments use it. Ordinary practice hint/retry narration speaks only the displayed Chinese; explicit tutor explanations can still be English.

## Shared help APIs for Task 3

`openPanel(title, html, language)` adds a separate **Ask Panda about this screen** control. Do not put vocabulary-help controls inside activity action buttons. `words.js` excludes buttons, links and role=button targets inside `#panel`; body vocabulary and deliberate map/food-learning controls retain their own handlers.

`screenContext(root)` captures the currently visible underlying dialog's title, instructional/activity text and controls. Controls include `label`, optional `meaning`, `disabled` and rendered `bottom` position. Input values, hidden controls, nested word-help buttons and the tutor's own controls are excluded. Limits: 3,500 text characters, 60 controls, 180 characters per label and 250 per meaning. Add `data-help="Plain description of this action"` to a control when its label alone is insufficient. The adventure `line` helper also accepts action tuples `[id, label, callback, help]`; the optional fourth entry becomes `data-help`. This is description only and never invokes an action.

`/api/coach` accepts the optional bounded `screen` object alongside the existing dialogue context. `server/coach-screen.js` resolves named controls, visible quoted Chinese words and bottom-position references before model inference. Multiple bottom controls trigger a clarification listing their labels. Missing controls/words are not invented. Other tutoring requests pass the validated screen to the existing provider as data. Screen answers cannot populate the NPC response input. The client recaptures context per question and rejects late answers after the underlying screen changes.

Retain these APIs when changing follow-up quest panels. Separate NPC dialogue from instructions and use the actual visible dialogue as the playback source. Keep Task 1's reward calls and replay semantics unchanged. Task 3 may start only after this task's distinct checkpoint has been recorded and the integrated verification below is complete.

## Verification

Evidence: `/tmp/lotus-task2/`; screenshots and offline report: `test-results/language-interaction/` (ignored outputs).

- Integrated before: `npm test` — 339 tests, 335 pass, four existing failures. The initial sandbox-only attempt could not use local sockets and is not the baseline. The subsequent socket-enabled run is the baseline.
- Integrated candidate: `npm test` — 342 tests, 338 pass, the same four failures, no skipped/cancelled tests. Compared failure names, assertion messages, actual/expected values and operators exactly. Failures remain authored text range, duck/person ranges, market-cat range and station-help 处 pinyin. No baseline files or unrelated failing tests were changed.
- `node --test --test-isolation=none test/language-interaction.test.js`: three passing tests covering segmentation, token offsets/speech readings, numbers/polyphones and changing/ambiguous screen context.
- `npm run check`, `npm run check:worlds`, `git diff --check`: pass.
- `node scripts/verify/language-interaction-browser.js`: pass at 1440×1000 desktop and 390×844 touch/mobile emulation. Covers sentence/pinyin/word replay, no mobile response autofocus, deliberate typing, Chinese Panda hints, centered attribution, plain action buttons, boat speech/travel, hotpot display/speech consistency with separate instructions, changing screens and rejection of stale help replies. An initial extended test aimed the keyboard at a neighboring NPC; the corrected test clicks the actual hotpot table hit target. It changes no game geometry.
- `node scripts/verify/rewards-browser.js`: pass on desktop and touch-phone for 5/15 rewards, reopen/reload, explicit conversation replay, bookstore/lantern completion, platform thresholds and persistent train boarding.
- Existing `scripts/browser-pronunciation.js`, `browser-word-help.js`, `browser-panda-narration.js`, `browser-touch-controls.js`: pass.
- Existing `scripts/browser-dialogue-help.js`: fails the same obsolete subject-button assertion (`[]` versus 吃什么/朋友/明天做什么) in both preserved pre-task and candidate trees. The new browser check provides passing coverage of the changed flow; the legacy failure is not counted as a pass.
- `node scripts/verify/offline-upgrade.js --previous /tmp/lotus-task2/baseline --candidate . --out test-results/language-interaction/offline.json`: pass for old installed, waiting update, new code under old controller, activated update and fresh phone installation. All 120 current browser modules are cached with exact bytes; saved state is preserved.

The four unit and 28 historical browser failures remain unresolved baseline issues. No full browser sweep was run. Speech evidence is automated pronunciation/request and mocked playback verification, not subjective listening. No physical phone or on-screen keyboard was tested; browser focus was tested under touch emulation. ICU segmentation is contextual but not a universal Chinese linguistic parser; offline help has no full dictionary/pinyin service. Live model output quality was not established by the deterministic story-provider tests.

## Changed files and checkpoint isolation

Production: `public/app.js`, `public/data/language-text.js`, `public/data/pronunciation.js`, `public/game/adventure.js`, `public/game/coach-questions.js`, `public/game/dialogue-variation.js`, `public/game/practice.js`, `public/game/speech.js`, `public/game/words.js`, `public/index.html`, `public/styles.css`, `public/sw.js`, `server/coach.js`, `server/coach-screen.js`, `server/dictionary.js`.

Validation: `test/language-interaction.test.js`, `scripts/verify/language-interaction-browser.js`. Handoff: this file. `interaction-surfaces.js` owns world hit geometry, not popup controls, and was not changed. `panels.js`, other progression files and dev-mode files retain their pre-existing uncommitted changes.

The task-only checkpoint is reconstructed against `bc6928e` in `/tmp/lotus-task2/task-only`. The original working files retain the dev-mode overlay. Only Task 2 file content is staged; the dev-mode configuration, implementation, discovery/baseline overlays and its tests are excluded. The checkpoint's service-worker version retains the committed prefix; the integrated working version retains the dev-mode prefix. Both include the new language cache suffix and module.

Final isolated checkpoint verification: `npm test` reports **339 tests, 335 passed, the same four failures, no skipped/cancelled tests** (the integrated tree has three additional passing dev-mode tests). `npm run check` and the complete Task 2 desktop/touch-phone browser check pass against that isolated tree. All tracked pre-existing files outside Task 2 match the starting snapshot byte-for-byte. The new Task 2 checkpoint follows this handoff's creation; Task 3 can use the committed handoff and integrated tree after recording it.
