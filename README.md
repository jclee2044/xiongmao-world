# Panda’s Little World

A self-hosted Chinese exploration game: a painted Suzhou canal district and a cozy home. Version 0.2.0 expands the district footprint from 1300 × 1000 to 4000 × 3300, about 10.15 times the original area. [PLAN.md](PLAN.md) contains the materials review and step-by-step plan. [PROGRESS.md](PROGRESS.md) separates completed checks from remaining gates.

## Play on this PC

Open **http://127.0.0.1:3210**. Game and private local AI run as enabled user services. Walk with WASD/arrows, on-screen direction buttons, or tap/click on clear ground. Tap-to-walk routes around buildings and canal edges. Open Map and select a destination to walk there. Press E or use the interaction button near a person/object.

Meet Mei at the noodle shop. Type a short Chinese or English reply, ask questions, change topics, request help or leave. Replay/slow replay generates Mandarin on demand. Underlined phrases offer grounded explanations. More help offers a starter, then an optional “You can say…” example. No expected answer is required.

Find Momo near the canal bridge and return home. Meet Mei, Lin and Yun around Canal Lane; explore the eight named neighborhoods and simple Chinese phrase interactions in the outer streets. The Home button is always available for a quiet break. Journal retains the discovery and explicitly shared preferences. Settings supports outfit colors, hair, pace, help, challenge, pinyin/meaning, text size, motion and voice volume. Changes can be undone; unsupported development feedback is visibly pending.

Use **Hide pinyin / Show pinyin** inside any conversation to change pronunciation support immediately. This also applies to phrase explanations, shares the Settings preference, persists after reload, and can be reversed with **Settings → Undo last change**.

Canal Lane uses a detailed environment plate edited from the supplied reference, with separate painted people and the supplied Panda. Reusable houses, willows and paving extend the district; scenery outside the camera view is skipped. Decorative English remarks have been removed; functional controls and optional translations remain. [art/ASSETS.md](art/ASSETS.md) records saved assets, exact generation prompts and lossless encoding.

The larger footprint is a foundation, with three conversation NPCs and basic outer-street interactions. It is not ten times the authored story content. Five cities, richer routines, full walking animation, microphone transcription, verified automatic ability assessment, music/ambience and a source-editing agent are future work. Existing saves preserve journals, discoveries and preferences; the map migration moves old positions to a safe spawn once.

## Run, stop and restart

Installed: Node 26.8.2, built-in SQLite, one production dependency (`pinyin-pro`). Playwright and Prettier are pinned development dependencies. Node SQLite is currently a release candidate. See [THIRD_PARTY.md](THIRD_PARTY.md) for runtime sources/licenses.

```sh
cd /home/jlrj/Documents/lotus
systemctl --user status panda-world.service panda-local-ai.service
systemctl --user restart panda-world.service
```

Services start when this user logs in. Actual reboot/login has not been tested. They do not keep the PC awake; phone live features require the PC awake and reachable. No system-wide packages, router rules or firewall changes were installed.

To run in a terminal:

```sh
systemctl --user stop panda-world.service
npm start
# Ctrl+C stops the terminal server.
systemctl --user start panda-world.service
```

To stop or disable startup:

```sh
systemctl --user stop panda-world.service panda-local-ai.service
systemctl --user disable panda-world.service panda-local-ai.service
```

On a fresh source checkout, `npm ci` installs npm dependencies; copy `.env.example` to `.env`. Use `PROVIDER=story` without a configured local model. Current `.env` selects Qwen3 4B through Ollama. Ollama binds loopback with cloud inference disabled. Dialogue, models, generated speech and SQLite data stay on this PC. API failures use explicitly labeled limited story replies.

Service files use absolute project/Node paths. If those move, run `node scripts/install-services.js --install`, then `systemctl --user daemon-reload` and restart. The installer refuses to replace unrelated service files.

## Saves and backup

SQLite stores each world on the PC. Identity uses an HttpOnly cookie; pairing shares a world through a single-use code lasting five minutes. Browser storage preserves offline changes. Save revisions prevent silent overwrites between devices. Journal offers export and an explicit conflict choice. Keeping this device also preserves server discoveries; using server progress replaces the local copy, so export first if you want both.

```sh
npm run backup
```

A consistent live SQLite backup goes under `data/backups/`; this was actually tested. To restore: stop the game service, keep copies of current `world.sqlite` and its WAL/SHM files together if present, replace the database with the backup, and move the old WAL/SHM files out of the way before restarting. Clients with unsynced progress will need the journal conflict choice after a rollback. Restoration on an actual learner save is untested.

For machine backup, preserve the whole project including ignored `data/`, `.env`, and `tools/`, plus Ollama’s normal `~/.ollama/` identity. Git excludes saves, models, config, downloaded runtimes and test output. Source alone does not include downloaded Ollama/eSpeak binaries or model weights.

## Phone/PWA — Tailscale activation pending

Prepared origin: **https://omarchy.tail18f12c.ts.net**. The user explicitly approved persistent private HTTPS for the existing Tailscale network. The retry was accepted, but Tailscale reports that Serve is disabled for this network and requires its account activation page. **The HTTPS route is not yet enabled or verified.** Localhost works.

The approved route uses Tailscale Serve for devices permitted by existing tailnet policy. Those devices can open the game and create a world; accessing an existing world requires its session or pairing code. It does not use public Funnel hosting. After enabling Serve in the Tailscale account, run `tailscale serve --bg --https=443 http://127.0.0.1:3210` and verify `tailscale serve status`.

After activation: use the same HTTPS URL on PC and phone, with the phone connected to the same Tailscale network. Create a Journal pairing code on the device whose progress you want and enter it on the other. Install using the browser menu on Android/desktop or Safari Share → Add to Home Screen on iPhone. These actual-device steps are unverified.

The offline cache contains the exploration shell/assets, never API identities, saves, dialogue responses or audio. Offline exploration/settings use the last device copy. Server AI, speech, pairing and sync need connectivity. Updates wait for the Update button and require synced progress. Bump the cache version in `public/sw.js` for new releases, keeping old/new caches separate until activation.

## Validation

With services running:

```sh
npm test
npm run check
npm run test:browser
node scripts/browser-turns.js
npm run format
```

Behavior tests cover collision, geometry, revisions, pairing, evidence rules, allowlisted settings, provider failure/malformed output waiting PWA updates and forwarded localhost preview hosts. Browser checks use isolated installed Chromium, not a real phone. A localhost forwarding-proxy check verifies preview loading, session creation and saved settings across reload. Pinyin checks cover immediate visibility, reload persistence, phrase help, agreement with Settings and undo. The slice check uses actual local AI/audio; the delayed-turn check explicitly mocks a provider. Screenshots/evidence live in ignored `test-results/`.

Qwen3 4B returned relevant food/hobby/homework replies in **7.1–13.9 seconds**. The smaller model was rejected for echoing input and wrong pinyin; dictionary pinyin now replaces model spelling. Chromium decoded and started generated Mandarin, but eSpeak’s basic robotic voice needs learner feedback. No prerecorded dialogue or remote inference API is used.
