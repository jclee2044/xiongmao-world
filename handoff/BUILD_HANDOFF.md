# Panda’s Little World — Codex build handoff

## Task and starting state

Build a cozy, adaptive Chinese-language exploration game **on the user’s Omarchy PC**, self-hosted there and playable on both that PC and a phone as a PWA. Scaffold the base, then implement and validate it piece by piece. Work in the local project directory; do not deploy to ChatGPT Sites or another cloud host.

This is a design-and-asset handoff, not a finished application. No playable game has been installed on Omarchy. Some draft source was started in a separate ChatGPT workspace, but it is deliberately not included: scaffold a clean, maintainable local base rather than treating incomplete code as validated implementation.

The user has approved the concept, hosting arrangement, and incremental implementation. Do not repeat the discovery interview. Inspect the actual machine and make ordinary implementation decisions. Ask only when an essential credential, access decision, or unresolvable constraint blocks dependent work; continue independent work.

## First actions

1. Read this file and inspect the five images in `references/`.
2. Inspect the actual Omarchy environment: project directory, existing repository/instructions, CPU/RAM/GPU, Node/tooling, browser, audio voices, available ports and services. Do not overwrite unrelated work.
3. Create a concise implementation plan and `PROGRESS.md` recording stages, validation evidence and remaining limitations.
4. Scaffold a lightweight project, make it start locally, and complete Stage 0 below before adding gameplay.
5. Continue stage by stage. Prefer an end-to-end playable slice over many disconnected feature stubs.

## Learner and purpose

- Adult learner, currently in Chinese 3 at Penn State. Approximately **HSK 2–3 under the older HSK system**, not newer HSK levels.
- Already comfortable talking about food and hot pot; can handle some basic conversation, ordering and asking directions, but needs practice.
- Wants daily conversation, connections with native speakers, learning about people, travel in China, and understanding Chinese dramas.
- Favorites: **When I Fly Towards You** and **Hidden Love**. These are interest cues; no copyrighted video or scripts are needed.
- Topics must naturally extend into school, homework, work, daily routines, activities, hobbies, friendships and plans.
- Fun, curiosity and recognizing previously learned language in new settings are strong motivators.

## Learning requirements

The experience must be genuinely dynamic, not a fixed sequence of the same questions.

- Meaningful speech and typing; comprehension of spoken and written Chinese.
- NPC replies respond to her intent, choices, history, interests and current abilities.
- Multiple valid responses. She can ask questions, change topics, request clarification, or leave.
- Familiar vocabulary returns in **new contexts**. Track recognition/exposure by context, not just a flashcard counter.
- Build ongoing relationships: NPCs remember explicitly shared preferences and refer to previous encounters naturally.
- Adapt listening, reading, speaking and typing separately. Also track topic familiarity and specific language needs.
- Begin with a relaxed arrival and a familiar food scene, not a placement quiz.
- Help requests, curiosity, slow typing, English input and suspected speech-recognition errors are not evidence of low ability.
- Do not infer mastery of comprehension simply because an NPC displayed a sentence. Distinguish exposure, assisted performance and independent evidence.
- Use repeated evidence before changing difficulty; add hysteresis or similar smoothing to avoid oscillation.
- Increase support before reducing difficulty: replay → useful word/phrase explanation → sentence starter → optional example.
- Explicit controls: more/less help, gentler/more challenging. User control can override adaptation.
- Provide useful ideas for applying today’s language outside the game.
- Where corrected Chinese is appropriate, Panda’s small bubble says **“You can say…”**, followed by a natural sentence; an expandable explanation says why. Do not rewrite every acceptable sentence just to prefer a different style.
- Never make her memorize one expected answer to advance.

### Avoid

Quiz-like button clicking as the main activity; streak pressure; sad sounds; shame; unexplained red marks; forced repetition; other characters speaking for her; punitive failures; city access gated by exam scores.

## Art direction — settled

Blend **A’s watercolor storybook feel with C’s soft textile/felt details**. B is a reference specifically for the small expandable Panda dialogue bubble and arrow, not the primary art style.

- Elevated top-down/three-quarter overhead camera inspired by the camera angle in *The Legend of Zelda: Echoes of Wisdom*. Original assets; do not copy its characters or environments.
- Rounded, soft edges; simple designs; relatively large expressive eyes.
- Muted earthy pastels: sage, oatmeal, warm cream, dusty peach, lavender and restrained teal.
- Cute, fluffy and welcoming. Avoid saturated primary colors, shiny plastic and visual clutter.
- Human NPCs. Small ambient animals are welcome, but townspeople are people.
- Gentle motion and readable paths. A playable camera may be farther out than the close-up concept art.
- Soft music, town ambience and synthesized character speech, independently adjustable. Start sound after an intentional user gesture; provide reduced-motion support.
- Never use a concept image with baked-in people as the entire interactive map and pretend those people are movable NPCs. Separate playable backgrounds, characters, collision geometry and UI.

### Panda’s identity

Inspect `references/panda-original.jpeg` before producing any assets.

- Squat, rounded egg-shaped off-white plush body.
- Two black rounded ears.
- Large black oval eye patches with thin white stitched eye rings.
- Tiny black embroidered nose and curved double smile.
- Broad black horizontal band around the middle; cream lower body.
- No visible arms/legs in the reference. Do not invent a humanoid panda body.
- Stylize to fit the watercolor/textile theme while preserving the beloved toy’s distinctive shape and face. User’s later clarification permits stylization; the identity must remain recognizable.
- Walks alongside the player with a gentle **squash → hop → settle** motion reminiscent of a hopping VeggieTales character. Ground shadow anchors position. Follow movement without blocking the player or teleporting constantly. Stops calmly beside her.
- Quiet, cute, reassuring; available without excessive interruptions.
- `panda-stylized-concept.png` is a candidate sprite direction, not a finalized multi-directional animated asset.

## World and game structure

Core loop: **explore → connect → use Chinese → discover with Panda → carry learning into a new context**.

Five simplified miniature cities: **Shanghai, Beijing, Chongqing, Chengdu and Suzhou**. Cities should be visually distinct and culturally grounded, without pretending miniature maps provide real navigation.

| City | Initial opportunities, subject to content validation |
| --- | --- |
| Shanghai | Airport arrival, neighborhood accommodation, cafés, meeting people |
| Beijing | Hutong-style lanes, shops, parks, daily routines |
| Chongqing | Hillside paths, directions, transit, hot pot, making plans |
| Chengdu | Tea houses, food, relaxed neighborhood visits |
| Suzhou | Canals, gardens, small shops, visits with familiar people |

These are contextual starting points, not stereotypes or rigid topic restrictions. Any city can contain school, work, hobbies and friendships. Start with one neighborhood as a vertical slice; grow toward all five cities after that slice passes its checks.

### Progression

Two layers: the journey expands and conversations deepen. No fixed equation of “city = HSK level.” A familiar topic can support more complex language while an unfamiliar topic stays gently scaffolded.

NPCs have lightweight routines, personalities and developing stories. Some encounters are only a greeting, sign or overheard snippet; not every interaction becomes a full conversation. Stories can include meeting for tea, choosing food, studying together, asking about someone’s day, planning an activity or helping find something.

### Cozy home base — essential

The user is especially enthusiastic about this feature.

- Warm room, window seat, travel journal, souvenirs and places for Panda’s stuffy friends.
- Discover stuffy friends over the journey. Each has a distinct personality and small story.
- Found friends settle at home; decorations and keepsakes reflect experiences.
- No upkeep chores, decay, penalties for absence, collectible pressure or forced completion.
- Returning after a break is welcoming, with an optional gentle reminder of the last story.

## Interaction and accessibility

PC: WASD/arrows plus optional click-to-walk, interaction key, keyboard-accessible menus. Do not hijack movement keys when a text field has focus.

Phone: reliable touch joystick or tap-to-walk, large controls, responsive dialogue, portrait and landscape layouts. No accidental page scrolling while moving. Test virtual keyboard behavior.

Dialogue: keep the world visible, use expressive portraits where helpful, readable Chinese, optional pinyin/translation, replay and slow speech. Tap a word/phrase for help. Panda’s compact bubble expands via the arrow seen in B.

Prevent repeated input submissions, stale responses after switching NPCs, overlapping audio and accidental actions behind dialogs. Let the player pause or close a conversation.

## Settings and requested agent customization

- Avatar appearance through a natural-language prompt.
- Text size, music, ambience, voice, pinyin, translation, challenge and assistance preferences.
- Feedback about the game that can trigger real-time changes.
- Changes should be visible and reversible, with a history and undo.

Implement a safe, useful distinction:

1. **Runtime customization:** validated structured patches to supported fields such as colors, outfit, hairstyle, pace, dialogue support and selected topic preferences. Apply immediately and show exactly what changed. Do not execute model-generated JavaScript.
2. **Development feedback:** requests requiring new maps, mechanics, assets or source changes are stored clearly as pending, rather than falsely claiming completion. As a later stage, a development agent may work in an isolated branch/worktree, build/test changes, then activate a validated version with rollback. Keep it away from arbitrary system access.

The user’s intended destination is an agent that edits the game in real time. A constrained settings parser is only a first step; do not present it as full implementation of that ambition. Likewise, a recolored avatar is not unrestricted prompt-to-art generation. Explain supported controls clearly and expand deliberately.

## Hosting and hardware

Same Omarchy PC hosts the server and runs the desktop browser. Phone accesses that server. Listed hardware: **Dell OptiPlex 3060, Intel i5-8500, 32 GB DDR4, 1 TB SSD, Wi-Fi/Bluetooth**. No dedicated GPU was listed; verify rather than assume one exists.

- All source, assets, learning state, saves and backend logic should live on this PC.
- Browser executes rendering, controls and immediate animation. This is compatible with self-hosting.
- Cross-device saves on the server with an identity/pairing mechanism and conflict handling.
- PWA: manifest, icons, secure-context installation and deliberate service-worker caching/update behavior.
- Cache playable exploration for offline use where practical. Do not claim server AI or cross-device sync works offline.
- PC must remain on and reachable for live server functionality. Document sleep/restart behavior and save backup.
- First validate on localhost. Phone installation and microphone usually require HTTPS; a plain LAN HTTP address is not sufficient.
- Inspect existing networking. Choose a maintainable HTTPS approach: private Tailscale Serve if suitable, or a reverse proxy/domain. Do not enable public exposure or alter router/firewall rules without the appropriate authorization.
- Provide an Omarchy startup/service arrangement once the app works. Prefer user-level systemd with an explicit working directory and environment file.
- Do not publish elsewhere to compensate for missing local access.

## Chinese speech — no prerecorded character voices

Generate Mandarin speech on demand using a free option.

- Browser Web Speech `speechSynthesis` is a useful first option **only if a suitable Chinese/Mandarin voice actually exists on that device**. Check `getVoices()` and `voiceschanged`; do not assume `lang = zh-CN` creates a voice.
- Test real Chinese phrases on the Omarchy browser and phone, with standard and slower rates.
- If Omarchy lacks a Mandarin device voice, use a server-hosted Mandarin TTS engine or a verified free service. eSpeak NG supports `cmn` and can be a no-cost fallback, but its robotic quality may not meet the intended experience; validate with the learner. A better local Chinese model may be worth the extra installation.
- Avoid a supposed “free API” that depends on undocumented endpoints or secretly requires paid billing. Verify licensing, Chinese support, quotas and actual availability.
- UI must say when speech is unavailable and preserve text practice.
- Speech-to-text is separate from TTS. Check browser support; if needed, later add a local transcription service. Recognition mistakes must not count as learner mistakes.
- Never add prerecorded dialogue merely to make a demo appear to have working dynamic speech.

## Dynamic conversation implementation

Use a backend provider interface rather than tying the game to one service.

- Local model via Ollama is an option, but CPU latency on this machine must be measured before selecting a model. Good Mandarin output, JSON reliability and response time matter more than nominal size.
- A verified Gemini free-tier model is an alternative if the user configures a key; verify current models and limits. Free-tier availability and privacy terms may change.
- Secrets remain server-side, outside source control and browser bundles.
- User/character messages, model output and customization feedback are untrusted data.
- Maintain bounded conversation history, NPC memories, learner model and context retrieval. Use a stable content/lexicon layer for grounded explanations and recurring language.
- Validate generated dialogue structure and useful language level. Separate dialogue generation from learning evidence extraction where appropriate.
- Handle timeout, quota failure, malformed output, provider absence, and interrupted turns. Show an honest limited story mode when no model is connected; do not claim fixed templates are fully adaptive AI.
- Do not fabricate successful provider tests without credentials or a local model.

## Technical approach

Choose the smallest maintainable stack after inspecting the machine. A lightweight 2D browser renderer (Canvas or a suitable game engine), typed client code where helpful, a local backend and SQLite or another dependable local store are reasonable. Do not add containers or heavyweight 3D tooling without a clear benefit.

Keep separate modules for rendering/movement, world content, dialogue orchestration, learner state/adaptation, speech, persistence, settings/customization and PWA support. Use stable NPC/topic/word IDs. Make scene content data-driven so cities can expand without duplicating engine code.

## Staged build and validation gates

For each stage: state its concrete outcome, implement it, run meaningful automated checks and browser/manual checks, record the evidence and limitations, fix observed failures, then proceed. Keep a playable version available throughout. Do not run ahead into five-city art production before the core loop works.

### Stage 0 — Scaffold and local startup

Create project structure, startup command, environment example, sensible ignore rules and README. Serve a simple recognizable welcome screen with Panda and the approved palette. Keep secrets and saves out of Git.

**Gate:** clean startup on Omarchy, reachable localhost URL, no browser console errors, asset paths work, documented stop/restart. This stage is a base, not a claim of finished gameplay.

### Stage 1 — Movement and Panda

Build one neighborhood with collision, camera, player, human NPC placeholders and Panda following with hop animation. Add PC and touch controls.

**Gate:** movement and interaction work on desktop and mobile viewport; player cannot walk through buildings; Panda follows/stops convincingly; resizing and input focus work; no stuck keys; reduced motion respected.

### Stage 2 — One complete conversation

Interaction opens a conversation. Support typed intent, readable Chinese, optional pinyin/meaning, and Panda help/correction. Wire an actual provider or explicitly identify limited mode. Add Chinese TTS and test real audio.

**Gate:** one end-to-end food conversation; accepted alternative responses; no forced answer; provider failure is graceful; Chinese speech works on the target devices or is explicitly blocked with exact cause. No API key in client/network responses.

### Stage 3 — Adaptive and branching dialogue

Add separate skill/topic evidence, conversation memory, explanation/hints and topic branching into school, work and activities. Add fresh situations that reuse prior language.

**Gate:** controlled learner profiles produce different support and difficulty; food strength does not inflate unrelated skills; help requests do not reduce ability; valid Chinese is not needlessly corrected; no rapid difficulty oscillation; conversations branch and retain relevant memories. Test speech transcript errors and malformed model outputs. Record real provider validation separately from mocks.

### Stage 4 — Home and stuffy friend

Build a cozy home and one short discovery story. Found friend appears at home, with a memory/keepsake. Save progress.

**Gate:** discover → return home → see friend → reload and still see friend. No duplicate discoveries, save corruption or penalties for absence.

### Stage 5 — Cross-device PWA and hosting

Add server-side progress, pairing, version/conflict handling, manifest, cache strategy and update handling. Configure the chosen HTTPS route on Omarchy. Document installation on phone/PC.

**Gate:** desktop save appears on phone; two clients cannot silently overwrite progress; reload preserves state; app installs on the actual phone over HTTPS; microphone permissions behave appropriately; offline exploration has accurate limitations; reconnect restores sync; startup after restart is reliable.

### Stage 6 — Customization and feedback

Implement avatar prompts within declared supported attributes, real-time validated settings patches, feedback capture and undo. Make unsupported development requests visibly pending. Add the broader edit agent only after the rollback/build-validation pathway exists.

**Gate:** requested supported changes actually alter the game and survive reload; undo restores prior settings; unsupported prompts do not falsely succeed; malformed or hostile instructions cannot execute code or alter the server outside the intended scope.

### Stage 7 — Expand and polish

Grow into five distinct miniature cities, additional NPC stories and stuffy friends. Add ambient sounds, gentle music, a journal, recognition moments and practical daily-use suggestions.

**Gate:** every city has working content rather than a label swap; no inaccessible NPCs or broken transitions; retained memories and learning transfer work across scenes; readable Chinese in portrait/landscape; measure startup/download size and frame rate on actual devices. Review new Chinese content for naturalness and pinyin accuracy.

## Definition of completion

Report what works, what was tested on real devices, what depends on unconfigured services, how to launch/install it, and measured asset size. Do not claim an API, phone installation, microphone or local AI was validated merely because code exists.

The first useful milestone is a genuinely playable vertical slice: walking with Panda → meeting a person → having a responsive Chinese exchange → receiving helpful support → finding a stuffy → returning home → reloading with progress intact.

## Reference inventory

- `references/panda-original.jpeg`: authoritative physical toy identity.
- `references/style-A-watercolor.png`: favored painted storybook direction.
- `references/style-C-textile.png`: favored soft textile direction (visually similar to A).
- `references/style-B-dialogue-reference.png`: expandable Panda dialogue bubble/arrow and camera depth reference.
- `references/panda-stylized-concept.png`: generated candidate for theme-matched Panda.

All PNG concepts were AI-generated in this planning conversation. They are references, not proof that a game exists. Final playable assets can be refined from these with consistent style and proper separation of layers.

## Useful official documentation to re-check locally

- Omarchy browsers: https://omarchy.org/manual/browsers/
- Installable PWAs: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- Device speech voices: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices
- eSpeak NG language support: https://github.com/espeak-ng/espeak-ng/blob/master/docs/languages.md
- Ollama chat: https://docs.ollama.com/api/chat
- Gemini pricing: https://ai.google.dev/gemini-api/docs/pricing
- Private HTTPS serving: https://tailscale.com/docs/features/tailscale-serve

## Prompt to begin the local Codex session

> Read BUILD_HANDOFF.md and inspect references/. Build this project here on my Omarchy PC, which will also host it for phone access as a PWA. Start by inspecting my environment and scaffolding the base. Implement and validate each stage before proceeding, keeping a playable version and updating PROGRESS.md. Preserve Panda’s identity and the watercolor/textile art direction. Prioritize an end-to-end vertical slice before expanding to all five cities. Be explicit about anything you cannot actually test or configure. Do not deploy to an external hosting service.
