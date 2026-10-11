# Mandarin character voices

The user approved the Kokoro male auditions, female auditions zf_001 and zf_026, and Panda audition A on 2026-10-10. Every NPC has a fixed voice. Source speaker gender follows the [official sherpa speaker mapping](https://k2-fsa.github.io/sherpa/onnx/tts/all/Chinese-English/kokoro-multi-lang-v1_1.html); age placement is a casting judgment based on the rendered characters, not a source age guarantee.

| Speaker | Index | NPCs |
| --- | --- | --- |
| Kokoro zf_001 | 3 | Mei, Lan, An, Lian, museum guide, clothing seller, snack seller, visitors 1 and 3 |
| Kokoro zf_026 | 17 | Qiao, Suyin, diner Xiao Tao, rock gardener Shulan |
| Kokoro zm_009 | 58 | Lin, station visitor Xiaocheng |
| Kokoro zm_014 | 63 | Hao |
| Kokoro zm_020 | 66 | Diner A Le |
| Kokoro zm_055 | 81 | Young reader, clothing customer |
| Kokoro zm_068 | 91 | Bamboo worker Zhusheng |
| WNJ | 0 | Bo, waiter, visitors 0 and 4 |
| Kokoro zm_015 | 64 | Wei, gardener, visitor 2, courtyard caretaker |
| AISHELL3 SSB0354 | 38 | Grandma Yun, baker Gui, embroidery artisan, weaving visitor 5 |
| AISHELL3 SSB0966 | 107 | Child Xiaodou |
| Native female / AISHELL3 SSB0005 | 0 | Child Xiaomi |

The eight older male identities stay evenly split, four per voice. The reader uses Bo's older portrait in the restaurant and silk studio and takes the WNJ voice there. Other shared sprites do not overwrite a person's voice: the diner, clothing customer and children retain their own assignments. Normal/slow replay and host-led practice use the same cast; word-help pronunciation can choose from the NPC profiles.

The AISHELL3 SSB0354 older female voice uses gain 3.2 (twice its previous 1.6 gain), including baker Gui at the breakfast shop. Synthesis caps peaks at 0.95 to preserve headroom; both normal and slow playback use the same gain.

Kokoro shares the installed `tools/asr-venv` runtime and `tools/kokoro-multi-lang-v1_1` model. Additional speaker IDs do not install additional models. Preserve the bundled Apache-2.0 license. Contextual pinyin decisions are translated to numeric tone tokens and temporary Hanzi keys; model weights and the original lexicon remain unchanged. A new line still incurs CPU synthesis latency. Browser decoding and ASR checks test playback/intelligibility, not all Mandarin tones or perceived age.

Panda's separate profile uses zm_009 plus the exact audition A effects; see [Panda voice](panda-voice.md).

Xiaocheng uses zm_009 following feedback that zm_014 sounded too old for his portrait. 地图 is explicitly dì tú; speech takes the di phones from 第 because Kokoro's default 地 entry contains de phones. Adverbial 地 still uses neutral de from 的.

For a voice-only rollback, set `CHARACTER_VOICES_ENABLED = false` in `public/data/voices.js`, bump the service-worker cache, then restart `panda-world.service`. All NPC IDs map back to the existing female/male baseline. Panda keeps his selected voice. No save schema changes are needed; do not reset unrelated game work.


2026-10-11 cast audit: all 62 conversational NPCs now have explicit profiles. Duoduo (the seated girl with a stuffed rabbit) uses young-female; Lele uses young-male; their adult traveling companions Xiaojie and Xiaolan use zm_009 and zf_001. Station barista Xiaohe uses zf_001 and shopkeeper Uncle Chen uses zm_015. Initialize NPC voice metadata after adding station shops. The male security/boarding attendant uses zm_009 throughout his guided dialogue; female station staff use zf_026. Duoduo has dedicated rabbit/little-animal opening options with Mandarin, pinyin and translation. Cast coverage and gender consistency are checked in speech tests; seated-child normal and slow replay routing is checked by browser-station-seated-companions.js.
