# Implementation progress — 2026-10-05

## Delivery and environment

Playable slice at **http://127.0.0.1:3210**: one Shanghai neighborhood, two human NPCs, following Panda, open-ended local-AI dialogue, generated Mandarin, phrase help, stuffy discovery/home, journal, saves, offline exploration, pairing and reversible settings. The full handoff is not finished.

Started with an empty folder. Handoff and all five images inspected. Omarchy/i5-8500 (six CPU cores), 31 GiB usable RAM, Intel UHD 630; Node 26.8.2/npm 11.19.1 and Chromium. ES modules/Canvas, local Node/SQLite, one production pinyin dependency. No framework, bundler or container. Local Git repository initialized.

Ollama 0.33.3 and eSpeak NG 1.52.0/dependencies installed project-locally from the configured package repository. Models under `data/models/`. Ollama’s normal identity key is in `~/.ollama/`; cloud inference disabled. Config/runtime/saves ignored by Git.

Sandbox initially blocked sockets, network inventory and user bus; authorized escalated commands validated localhost and actual services. Tailscale is signed in and running; no prior Serve route. No interactive browser or phone connected to the chat. Browser tests use isolated installed Chromium.

## Gates

| Stage              | Outcome                                    | Evidence / remaining gate                                                                                                                                                                                                                                                      |
| ------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Review/plan        | Complete                                   | All five references viewed; PLAN.md records choices and ordered validation gates. Document claims are not evidence.                                                                                                                                                            |
| 0 Base             | Passed locally                             | HTTP health/page/assets, static-root isolation, initial Chromium startup/Panda loading with no console errors.                                                                                                                                                                 |
| 1 Movement         | Isolated-browser checks passed             | Desktop collision/input focus, pointer controls, portrait/landscape with no overflow. Screenshots inspected. Fixed mobile accessible names, idle Panda hopping and dialogue clipping. Real touchscreen review pending.                                                         |
| 2 Conversation     | Real local AI/audio playable               | 4B food/hobby/homework probes: 13.9/7.8/7.1 s. Full slice uses actual model. Chromium decoded/started Mandarin, including slow generation. Phone audio, learner voice-quality assessment and microphone input pending.                                                         |
| 3 Adaptation       | Foundation; gate partial                   | Context exposure and explicit preferences persist, manual help/challenge work. Tested separate skill/topic verified-evidence bands and hysteresis. Automatic ability grading is not enabled for unverified AI turns; reliable evaluation remains to be validated.              |
| 4 Home/save        | Slice check passed                         | Walk → converse → Momo discovery → home → reload with friend and single journal memory. Atomic SQLite/revision saves; no absence penalties.                                                                                                                                    |
| 5 PWA/hosting      | Local checks passed; external gate pending | App cache/offline reload/save → reconnect, pairing in two contexts, stale save visibly rejected, APIs not cached. Both user services enabled/running. Private HTTPS awaiting audience approval. Real phone install/keyboard/microphone, two actual devices and reboot pending. |
| 6 Customization    | Constrained slice passed                   | Supported prompt outfit/hair changes, immediate effect, persistence/history/undo. Unsupported/hostile requests visibly pending; no unrestricted art or source-edit agent.                                                                                                      |
| 7 Expansion/polish | Deferred behind core gates                 | Remaining cities, production watercolor/textile art, richer routines/stories, music/ambience and broader validated transfer not implemented. Initial separate Canvas scenery/humans are placeholders.                                                                          |

## Evidence and fixes

Unit/API checks cover collision/no tunneling, walkable interactions, save validation, revisions, single-use pairing/session sharing, origin/auth, no source-file exposure, help/transcript safety, skill/topic separation, hysteresis, preferences, setting allowlists and provider failure/malformed fallback.

Browser movement: desktop, 390×844 portrait, 844×390 landscape, input focus and pointer controls. Full slice: real model reply, standard speech playback, slower phrase decoded as WAV (~4.88 s), friend/home/reload, settings undo/pending feedback; no page errors. PWA: cached exploration, offline save/reconnect, independent paired contexts and visible conflict; no page errors. Delayed-turn check uses a controlled mock: repeated submits suppressed and late closed-conversation replies ignored; not a live failure test.

Found/fixed static-root 403, missing mobile accessible names, asynchronous/timing assumptions in tests, clipped mobile reply area, and idle companion hopping. Qwen3 1.7B rejected (3.6–6.2 s, echoed input and wrong pinyin); 4B chosen, dictionary pinyin. Standardized eSpeak’s placeholder WAV length. Empty Replay body capture was a test-capture issue: actual decode/playback verified.

Consistent live SQLite backup created. Actual learner-save restoration untested. User service start/status verified: enabled/running. `systemd-analyze --user verify` could not initialize its runtime manager here; actual systemctl startup/status was checked instead. No actual reboot/login performed.

Ignored `test-results/` holds screenshots and `local-ai.json` (rejected small model), `local-ai-4b.json`, `slice.json`, `pwa.json`, plus desktop/mobile/home/settings images. Live provider tests and mocked checks are separate.

## Hosting approval block

Prepared origin: `https://omarchy.tail18f12c.ts.net`. `.env` allows the origin, but **no Serve route activated**. Automatic approval review rejected `tailscale serve --bg --https=443 http://127.0.0.1:3210`: existing tailnet audience/access expansion was not explicitly authorized. No workaround, alternate LAN route, Funnel, public hosting, router or firewall change attempted. Obtain explicit approval for devices permitted by existing tailnet policy before retrying the exact private route.

## Sizes and next gates

Browser files approximately **2.0 MiB** (Panda 1,709,991 bytes; icons 26,252/168,838 bytes, plus client source/styles). Reference concepts outside public root. Models approximately **3.6 GiB** including rejected 1.7B and selected 4B; Ollama ~67 MiB, speech ~20 MiB. Actual-phone frame rate and HTTPS download size unmeasured.

Next: approved HTTPS and real phone installation/audio/virtual keyboard; learner review of eSpeak or a better verified local Mandarin voice; local transcription; reliable independent skill evidence; then production art and city expansion. Pending development feedback is not claimed implemented. No five-city, fully adaptive, microphone or source-agent completion claim.

## Final regression result

All 11 unit/API tests passed. Final desktop/portrait/landscape movement checks, real local-AI/audio/home/reload/customization slice, offline/reconnect/pairing/conflict checks, and mocked delayed-turn checks passed. No page errors in the final slice/PWA checks. Final source syntax checks passed. Live feedback/change lists now refresh immediately. Both localhost services remain enabled/running; Tailscale Serve configuration remains empty.

Measured public root: 18 files, 1,979,389 bytes (uncompressed logical file size).
