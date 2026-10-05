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

## Reference art and larger district follow-up

The user requested a first-version checkpoint, removal of decorative English remarks, reference-quality art and a district about ten times larger. The recommended approach keeps rich canal/shop/bridge landmarks and uses simpler reusable scenery between destinations. Reducing tiny details lowers asset creation, revision and matching work; map dimensions alone do not create worthwhile exploration content.

1. Preserve the first version as `v0.1.0`, then work on a separate revision.
2. Remove decorative English commentary while retaining functional controls and optional Chinese translations.
3. Edit the supplied third reference into an environment plate with no baked-in people or UI. Create separate painted actors, home and reusable scenery in the same style. Save generation prompts and selected assets.
4. Expand the single district to 4000 × 3300, roughly 10.15 times its former bounding area. Keep the saved scene identifier; migrate only old map positions while preserving progress.
5. Define geometry independently of artwork, add safe route navigation and map destinations, and reuse/cull scenery instead of allocating a single giant background.
6. Verify every destination's route, save migration, keyboard/touch-sized controls, dialogue/audio, pinyin, offline caching and delayed replies. Inspect screenshots at desktop and phone sizes.
7. Review art and layout with the user before filling the outer streets with more NPC routines, stories and discoveries. Real-device performance and the external hosting gates remain separate.

## Primary documentation checked (2026-10-05)

- https://nodejs.org/api/sqlite.html — built-in persistence API.
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices — enumerate device voices; language selection alone is insufficient.
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable — manifest and secure-context requirements.
- https://docs.ollama.com/api/chat — server-side local-model adapter.

## Scene continuity, life and practice follow-up

The user prefers modestly simpler art with more movement, variety and Chinese practice. Preserve the large single district and existing saves while improving the actual exploration loop.

1. Trace furniture and walking boundaries independently of the painting; add neighbor body colliders, safe approach points and recovery for saved positions inside new obstacles. Validate every destination at normal and low frame rates.
2. Narrow paved connections and add gardens, a pond, courtyards and reusable activity props. Feather the reference plate into matching path aprons, keep camera motion continuous and soften actual home transitions.
3. Normalize human heights, shrink Panda, increase walking speed and add three simple poses for each existing appearance. Respect reduced motion and skip unchanged paused rendering.
4. Add six distinct neighbors and nine optional Chinese activities: ordering, quantities, gifts, listening, open expression and visits. Preserve hints, replay, optional pinyin/meaning, free conversation and absence of grading gates. Save activity progress independently of learning evidence.
5. Add original local music with a user-gesture start, saved on/off/volume, speech ducking and hidden-page suspension.
6. Validate meaningful collision/routes, old saves and bounded long-use evidence; exercise all activities, reloads, phone-sized panels, actual audio lifecycle and real local dialogue. Inspect art screenshots, review the final changes and document remaining device/learning gates.

## Denser Suzhou, culture and repeatable practice — version 0.4.0

The user approved a roughly 20% smaller area if it creates more variety, and confirmed pinyin should default off. Preserve the previous release as `v0.3.0` before changing the district.

1. Compact outdoor coordinates uniformly to 3600 × 3000, about 18% smaller. Scale version 0.3 positions once, retain journals/settings/activity progress, and repair positions inside new obstacles. Keep actor sizes and indoor worlds unchanged.
2. Replace the flat oval lake with one irregular polygon shared by painting and collision. Add soft banks, ripples and lotus details; validate shore corners and every walking destination at normal and low frame rates.
3. Add distinctly shaped Suzhou landmark interpretations, bamboo/garden areas and six shop/pavilion facades. Trace three shop interiors with safe floors, furniture, doors and exact outdoor return points. Preload room/outdoor assets to avoid popping on saved-scene exits.
4. Add lightweight wandering animals, visitors, sparrows and falling leaves. Advance ambient time only during active play; pause and reduced motion keep it steady. Animate with small atlases and existing visitor art, and hit-test the visible animals.
5. Teach language through recipe sequencing, tea-order listening, matching, sentence building and animal directions. Vary replay rounds, persist partial progress, retain optional hints/meaning/pinyin and free expression, and avoid inventing mastery evidence from activity completion.
6. Add short Mandarin cultural entries for Tiger Hill, classical gardens, Suzhou Museum, Pingjiang lanes and osmanthus sweets. Paraphrase verified primary sources, link them in the game, and identify the map as a condensed interpretation.
7. Find a recording with explicit game redistribution rights. Bundle “Asia” by FSM Team under CC BY 4.0 with attribution/license, preserve saved music controls and speech ducking, and keep the procedural fallback. Default pinyin off only for new worlds.
8. Validate old-save migration, all fourteen activities, varied rounds and partial reloads, shop returns, real local dialogue/audio, looping/mute/offline music, actual ambient pixels, reduced motion, lake collision and phone-sized layouts. Inspect screenshots, record measured limits, commit the finished revision and request the integrated-browser preview.

The lantern, silk-color and budget-shopping candidates are implemented in version 0.5.0 below. A photo journal that asks the learner to describe a discovery remains a future candidate. Check cultural specifics against primary sources before authoring further content.

## Cultural mini-games — version 0.5.0

1. Preserve the fourteen existing activity IDs. Add a small content module for three games and bounded validation for partial riddle steps, cloth colors and shopping quantities. Keep rounds and progress separate from learner ability evidence.
2. Check primary Suzhou sources for Lantern Festival riddles and local embroidery. Write short original cultural notes and beginner riddles; label the cloth as simplified language practice and prices as fictional practice prices.
3. Add native HTML/SVG/CSS interactions: three lantern answers, a 3 × 3 cloth with labeled threads/positions and undo/eraser, and a shopping receipt with integer yuan totals/change. Reuse replay, hints, optional pinyin/meaning and free-conversation follow-up.
4. Put the activities at a lantern rack, the existing cloth shop and the market. Trace the rack posts beside the road, preserve existing map coordinates and validate all approach routes/collisions.
5. Check both new and existing games in isolated Chromium. Exercise wrong attempts, two varied rounds per game, real server partial saves/reloads, keyboard/touch-sized play, per-square Mandarin requests, cultural links and unchanged learner evidence. Verify actual computed colors under the unchanged content-security policy.
6. Cache the new content module for offline exploration, verify reconnect/pairing/conflict behavior, inspect screenshots, document limits, commit and open the finished preview.
