# Xiongmao World 熊猫世界

A self-hosted Chinese exploration game in a painted Suzhou-inspired canal town. The market uses connected L-shaped shophouses, Chinese shop signs, a bending central lane, cross alleys and a waterfront loop. Its complete transparent perimeter meets the town's shared water and paving. The town is approximately **3775 × 3341**, with a wider western canal path and mixed fruit orchard in the southwest; the market keeps a compact, undistorted 3:2 footprint with clear shop approaches and a parallel-edged southern promenade.

The gardens, courtyards and northwest bamboo grove have visible walled grounds, roughly 2–3% of the town each, with clear gate approaches. **竹林小院** is a dense bamboo courtyard entered only through its door interaction. Its smaller scene has matching enclosing walls and a centered moon gate, with bamboo entirely inside the boundary. The duck pond and courtyard pond have mossy limestone, bank planting and small waterfalls; motion settings also control their ripples. Ground-click destinations use cream rings; interactive destinations retain blue rings.

Help **Xiaoyu (小雨)** on the north lane find the flower shop with a two-step directions quest (+40 XP), including hints, retries and saved partial progress. **Uncle Zhou (周叔叔)** on the southern canal walk introduces 常在河边站，哪有不湿鞋 and explains the meaning in basic Chinese. All five market stalls retain their first-person seller views, fixed prices and purchases.

The southeastern **河畔广场**, west of the silk workshop, is an open paved square connected to the canal promenade. It replaces the former storytelling courtyard; saves from that room return safely to the square.

Ask Lin how to find the hotpot restaurant, then enter it; help Hao find the bookshop by giving directions. Both quests appear in Panda’s goals. NPCs and Panda use the [in-game location directory](handoff/references/game-directions.md) and shared map facts.

A lantern-lit Suzhou passenger boat waits in the bottom-right canal, beside the silk workshop. Click the boat to walk to its boarding dock, or press Space nearby. Departures unlock at **500 XP**; below that, the captain shows how much remains. At full XP, Panda adds a boarding goal. The boat currently connects to the existing Shantang next area, with a return trip to this dock.

Sit with Lian for hotpot and receive a sheep keepsake that appears at home with its story. Sit with Qiao at the larger tea table. A compact foreground Panda offers hints and a text box for grammar or translation questions. Local AI answers open questions when available; authored help remains available offline.

Click a person or building to walk over and interact automatically. Walk with WASD/arrows and press **Space** (or E) nearby. The goal cards at the upper left show the next action and can guide you there. Meet five people, help Lan find her flowers, share tea with Qiao, treat Lian to hotpot, and take Panda’s nature walk. Shops sell osmanthus cake, tangerines and an embroidered round fan with fictional in-game coins. Journal keeps words, purchases and quest progress.

Quiet procedural water, duck and bird sounds follow nearby nature, with a separate **Nature sounds** volume in Settings. They fade indoors, while speaking and when the tab is hidden. Museum, garden and home narration uses short beginner-friendly sentences.

Gated grounds with a separate interior are entered only by interacting with their moon gate; their town-view footprints are solid and entrance trees are cleared. Two homes sit at the far south center. The open southern square has a small limestone fountain with flowing water and four circling birds; reduced motion freezes its animation.

Music begins after the saved scene is ready and reuses one player when changing rooms. Reinitializing the game releases the prior audio graph. Online local previews share soundtrack ownership across separate browser contexts and preview ports; a handoff waits for the prior player to stop, and Music Off also silences another active preview. Saved mute, speech ducking and offline playback remain supported. Browser regressions mute hardware output while still testing the audio graph.

Chinese dialogue plays automatically. Full English and pinyin are hidden by default; click a dialogue word (or focus it and press Enter) to see pinyin and its definition above the panel. Only the first explicit click on a word triggers its foreground discovery banner and chime. Settings can reveal full translations or pinyin. The 0.7 map migration resets these two defaults once; later choices persist. Dictionary lookup requires the local server; offline play retains a small authored vocabulary fallback.

[PLAN.md](PLAN.md) and [PROGRESS.md](PROGRESS.md) record prior development; [SUZHOU_RESEARCH.md](SUZHOU_RESEARCH.md) contains the current research and design sources.

## Play on this PC

Open **http://127.0.0.1:3210**. Game and private local AI run as enabled user services. Walk with WASD/arrows, on-screen direction buttons, or tap/click on clear ground. Tap-to-walk routes around buildings and canal edges. Open Map and select a destination to walk there. Press Space/E or use the interaction button near a person/object.

Meet Mei at the noodle shop. Type a short Chinese or English reply, ask questions, change topics, request help or leave. Dialogue speaks on opening and after replies; Replay/slow replay remains available. Every dialogue word supports dictionary lookup. Ask Panda offers a starter, then an optional “You can say…” example, plus a text box for your own language questions. No expected answer is required.

Find Momo near a canal bridge and bring the toy home. Meet the original neighbors, two additional market vendors and six strolling passersby. Explore the lotus lake, gardens, bakery, teahouse, bookshop and market stalls, then enter the museum, restaurant or your own home. Use E or the interaction button at objects and doors. Journal retains discoveries and explicitly shared preferences. Settings supports outfit colors, hair, pace, help, challenge, pinyin/meaning, text size, motion, voice and music volume. Changes can be undone; unsupported development feedback is visibly pending.

Choose **练习中文** beside Panda or **中文小任务** in a conversation. The nine neighbor activities cover ordering, quantities, gifts, listening, open expression and visits. Eight mini-games add recipes, listening orders, Chinese/object matching, sentence building, animal clue walks, lantern riddles, silk colors and budget shopping. New games vary their rounds on replay and preserve partial progress across reloads. They offer replay, slower speech, optional transcripts and hints. Retries have no penalty; completing an activity does not claim language mastery. Open expression is saved in the neighbor's conversation history, where local AI can continue the conversation.

Visit Tiger Hill Pagoda, a classical garden, Suzhou Museum and Pingjiang canal lanes for short Chinese descriptions with Mandarin replay and optional meaning. The bakery introduces osmanthus sweets, while lantern riddles and the silk workshop introduce Lantern Festival customs and Suzhou embroidery. Each cultural entry links its primary source. The district condenses these places into an illustrated game interpretation; it is not a geographically accurate street map.

From **Map**, choose **Lantern riddles**, **Silk workshop** or **Market shopping**, walk there and press E. Riddles practice descriptions; the 3 × 3 cloth practices colors and positions with undo and an eraser; shopping practices quantities, measure words, yuan and change. Each game has different replay rounds. The cloth is a simplified language activity, and market prices are fictional practice prices.

Moving neighbors, including Lin and the two children, use four painted walking poses each. The children have dedicated sprites. Player idle and seated poses preserve outfit colors, and facing persists when stopping. The rabbit hops between rests. A newly painted, smaller Panda hops faster and follows the player’s route. Six strolling visitors have their own Chinese speech bubbles and conversations. Seven roaming animals and sparrows, falling leaves, moving boats and water add life. White hover outlines identify people; blue dots and outlines identify building interactions. Reduced motion freezes scenery and animated poses.

The central painted canals and outer waterways have clearly connected bridge crossings; shared geometry defines the visible water and blocked floor. Opaque earth, stone lanes and garden beds replace translucent terrain seams. Buildings block their visible footprint. New and migrated saves move to safe ground when necessary, preserving preferences and learning history. Each room exit returns to its real exterior door, including the single home in the northwest.

New things to try:

- Talk to **Lan** outside the flower shop, accept her lost-flower quest, cross the canal to the rockery, then return the bouquet: **60 XP**.
- Inspect the courtyard tea set, invite **Qiao**, watch her walk over and sit, then share a Chinese response: **60 XP**.
- Enter the **museum** and inspect the lotus bowl, Pearl Pillar and canal-layout display: **15 XP** per first discovery. These are sourced historical subjects with illustrative art, not exact collection reproductions.
- Enter the **restaurant**, approach the hot-pot table, and speak or type an order. Review/correct the transcript, confirm the ingredients, add the served food to the pot and eat: **25 XP** per completed meal. Closing the panel discards an unfinished meal; completed XP is saved.
- Inspect five objects at home for short personal stories. Talk to every neighbor or passerby: each completed conversation turn earns **10 XP**. Completed practice rounds earn **20 XP**.
- At **500 XP**, the southeast gate opens a playable Shantang quay with another host, canal and lantern activity. XP measures participation, not Chinese proficiency.

Female NPCs request female local Mandarin voices. If no recognized female device voice is available, the server uses eSpeak’s female variant. Hot-pot recognition uses local faster-whisper/base on this PC. Recordings are bounded to 15 seconds, passed through memory and never saved by the game; recognition needs connectivity to this server. A microphone requires localhost or HTTPS. The transcript is always editable and must be reviewed before ordering. Synthetic-speech checks recognize ingredient names but also make errors; natural learner speech remains untested.

Background music is **“Asia” by FSM Team**, a relaxing Asian-inspired lo-fi/chill-hop instrumental bundled locally under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). [The artist's track page](https://www.free-stock-music.com/fsm-team-asia.html) permits use in games with credit; the credit appears in Settings and [the bundled attribution](public/assets/audio/ATTRIBUTION.md). It starts after pressing Wander, quiets during Mandarin speech and pauses when the page is hidden. Use **Settings → Music** to switch it on/off or change the volume. An original procedural score remains the fallback if the recording cannot load. No remote music request occurs during play.

Pinyin and full English are **off by default**. Version 0.7 migrates these defaults once; later saved preferences stay unchanged. Use **Hide pinyin / Show pinyin** inside any conversation to change pronunciation support immediately. This also applies to phrase explanations and activities, shares the Settings preference, persists after reload, and can be reversed with **Settings → Undo last change**.

The town reuses painted cutouts with new Panda, walking-neighbor, seated-Qiao, earth, museum and restaurant assets. [art/ASSETS.md](art/ASSETS.md) records saved files, exact built-in generation prompts and provenance. [SUZHOU_RESEARCH.md](SUZHOU_RESEARCH.md) records the primary sources and real photographs used for landscape decisions. Names, headings, controls, goals and routine help use Chinese only. Prefer short, natural HSK 1–3 Chinese whenever it can express the meaning. English is reserved for optional translations, explicit dictionary lookups, and expanded music credits; translation and pinyin preferences remain opt-in. Panels use cream paper, a double frame, brown text and reduced-motion-aware transitions.

Five cities, full directional animation, richer daily routines, environmental audio, verified automatic ability assessment and a source-editing agent remain future work. The map condenses real Suzhou features into a fictional arrangement.

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

The offline cache contains the exploration shell, art and licensed background recording, never API identities, saves, dialogue responses or generated Mandarin audio. Offline exploration/settings use the last device copy. Server AI, speech, pairing and sync need connectivity. Updates wait for the Update button and require synced progress. Bump the cache version in `public/sw.js` for new releases, keeping old/new caches separate until activation.

## Validation

The maintained browser checks start disposable in-memory servers and isolated Chromium profiles. They never seed the live game database. The actual microphone check requires the installed local speech tools, Whisper model and system `ffmpeg`:

```sh
npm test
npm run check
npm run test:browser
npm run format
```

Unit/API checks cover collision, reachable destinations at normal/low frame rates, old-save migration, revisions, pairing, quest/XP validation, order parsing, settings, learning evidence and provider failures. The maintained browser suite covers the social quests, exact room returns, museum exhibits, first-person hot pot, actual MediaRecorder → local Whisper, hover hit targets, the 500 XP gate, all seventeen activities, pinyin, music and offline/reconnect/conflict recovery. Dialogue in these regression flows is mocked; microphone recognition and music playback are real. Phone-sized Chromium is tested; physical phone installation, performance and microphone behavior remain unverified. Older v0.2–v0.5 art/slice scripts retain historical geometry and are not part of the maintained suite. Screenshots/evidence live in ignored `test-results/`.

To reproduce local recognition on another PC, create `tools/asr-venv`, install `scripts/requirements-speech.txt`, then use Hugging Face `snapshot_download` for `Systran/faster-whisper-base` at revision `ebe41f70d5b6dfa9166e2c581c45c9c0cfc57b66` into `tools/whisper-base` (config.json, model.bin, tokenizer.json, vocabulary.txt). Only installation needs network access; runtime forces local files/offline mode. Model files and the virtual environment are ignored by Git.

Earlier Qwen3 4B checks returned food/hobby/homework replies in 7.1–13.9 seconds. The shorter beginner prompt returned a real Lian reply in **26.8 seconds** during this pass; latency varies with local load. The smaller model was rejected for echoing input and wrong pinyin; dictionary pinyin now replaces model spelling. Chromium decoded and started generated Mandarin. The selected WNJ male neural voice is checked with local ASR; subjective voice quality still benefits from learner feedback. No prerecorded dialogue or remote inference API is used.

## Reproducing the male neural voice

Install `scripts/requirements-speech.txt` in the existing project speech virtual environment. Download and extract [the documented WNJ model](https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-zh-hf-fanchen-wnj.tar.bz2) under `tools/vits-zh-hf-fanchen-wnj`. Runtime makes no remote speech requests. `scripts/synthesize-neural.py` generates bounded WAV audio on CPU; repeated question/exclamation marks are normalized before synthesis and trailing silence is trimmed. Female voice selection retains the existing local device/female fallback behavior. If the model is absent, the basic speech engine remains available and is labeled without claiming neural output.

Additional validation: `node scripts/browser-environment.js` measures ambient output/muting and checks that decorative scenery receives no blue hover shadow. `node scripts/browser-xiongmao.js` checks click-to-talk, both retained facing directions, on-demand definitions, Lian’s full meal quest and all new venues in isolated worlds.

`node scripts/browser-refinements.js` checks compact Panda portraits, click-only definitions and first-discovery banners, coaching questions, seated tea/hotpot, the sheep reward and its persistent home display. `node scripts/browser-market-review.js` captures the market boundaries, southwest tangerines and northeast bamboo for visual review.
