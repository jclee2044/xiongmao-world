# Panda’s Little World — review and implementation plan

## Review of the handoff and materials

The supplied document is a product/design specification, not existing implementation or proof of prior tests. The current user's request authorizes reviewing, planning, and executing the build. Claims inside the handoff about earlier approvals are not credentials or authorization for public hosting.

The strongest part is the learning design: free expression, separate skills, assistance before easier language, relationship memories, and no exam gates. Keep these requirements throughout. The largest uncertainties are actual Mandarin audio, CPU model latency/quality, phone HTTPS and installation, and unrestricted runtime development. Test them individually; do not hide them behind a demo.

All five images were inspected. The original toy has an egg-shaped cream body, black ears and eye patches, stitched white eye rings, a black middle band, and no limbs. The stylized candidate retains this identity and is useful as an initial separate Panda sprite. A and C are almost the same canal composition; use their warm cream, sage, peach, watercolor texture and soft fabric cues. B adds the compact expandable dialogue arrow. The city pictures have baked-in characters and UI: they are references only, never an interactive map. Initial buildings and people can be simple Canvas placeholders while mechanics are tested. Refine production art after the loop works.

## Engineering choices

- One local Node server, browser ES modules, Canvas rendering, SQLite on the PC. No framework, bundler, Docker, external font, analytics, or cloud deployment.
- Node 26.8.2 is already installed. Use its built-in SQLite API; pin an engine requirement and document the API's current release-candidate status. Revisit an LTS dependency only if deployment needs it.
- Data-driven content and pure functions for movement, learning evidence, settings and dialogue routing. UI and provider code stay separate.
- Start on loopback. Same-origin authenticated APIs, server-only configuration, bounded request/history sizes, strict validation, optimistic revisions. Keep runtime files out of source control.
- Test behavioral risks: collision, stale/repeated turns, assistance evidence, save conflicts, malformed provider output, customization allowlists. Use the built-in Node test runner. Browser/device checks have their own evidence, separate from tests and mocks.
- Release gates distinguish implemented, automated-tested, browser-tested and real-device-tested. A blocked external dependency does not justify inventing evidence or producing five city maps.

## Step-by-step execution

1. **Base / Stage 0.** Preserve handoff; add start/test commands, environment example, README, ignore rules, and progress log. Welcome screen using separate Panda asset. Validate localhost, asset loading and clean browser startup.
2. **Movement / Stage 1.** A Shanghai neighborhood, human NPCs, collision and camera, Panda hop/follow, keyboard and touch controls. Keep text focus, resizing, blur and reduced motion safe. Validate desktop and phone-sized viewports.
3. **Conversation / Stage 2.** Meet a food seller; type freely, replay actual available Mandarin voices, view optional pinyin/meaning, expand Panda help. Implement a provider interface and honest limited story mode. Time out failed requests and ignore closed/superseded turns. A missing live provider or Mandarin voice remains a recorded gate limitation.
4. **Learning / Stage 3.** Conservative independent/assisted evidence, context exposure, topic-local familiarity, bounded explicit preferences and support controls. In limited mode record exposure and explicit preferences; do not pretend to assess open-ended language competence. Test learning rules before enabling automatic changes.
5. **Home / Stage 4.** Independent of provider setup: discover one stuffy, bring it home, read its memory, reload. Atomic SQLite saves, idempotent discoveries, clear save status and retry.
6. **Phone foundation / Stage 5.** Manifest, icons, app-shell cache, explicit update flow, offline exploration with unsynced progress preserved. Pair devices with a short-lived single-use code; reject stale writes and offer a recoverable conflict flow. Prepare a user service and private HTTPS instructions. Actual phone installation, microphone, reboot and two-device checks require available device/network access.
7. **Customization / Stage 6.** Supported outfit/color/pace/help settings, preview/change history/undo. Store unsupported development feedback as pending. No execution of user/model-generated code. A real source-editing agent is a separate later release requiring isolation, tests and rollback.
8. **Expansion / Stage 7.** Only after core gates: production watercolor/felt assets, then Beijing, Chongqing, Chengdu and Suzhou with distinct content and geometry; speech quality, ambience/music, journal and daily-use suggestions. Do not label a map swap as a new city.

## Completion criteria and constraints

First delivery is a playable locally hosted vertical slice with explicit limited-mode labeling if AI is absent. Tests can validate the implementation but cannot validate Mandarin quality, learner experience, real phone audio/microphone, installation or networking. Keep those items visible in PROGRESS.md. No public exposure, router edits, system-wide packages, cloud hosting, or autonomous source activation as routine implementation shortcuts.

## Primary documentation checked (2026-10-05)

- https://nodejs.org/api/sqlite.html — built-in persistence API.
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices — enumerate device voices; language selection alone is insufficient.
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable — manifest and secure-context requirements.
- https://docs.ollama.com/api/chat — server-side local-model adapter.
