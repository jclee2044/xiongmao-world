# Four Mandarin character voices

The approved baseline is commit `9d54479`. The new cast keeps its native female voice selection / AISHELL3 speaker 0 fallback for younger women and its WNJ male voice for older men. No pitch shifting, new model downloads, remote inference, or save-schema changes.

## Research and candidates

The [sherpa model documentation](https://k2-fsa.github.io/sherpa/onnx/tts/pretrained_models/vits.html#aishell3-chinese-multi-speaker-174-speakers) describes 174 selectable AISHELL3 speakers. The [publisher's speaker metadata](https://huggingface.co/datasets/AISHELL/AISHELL-3/blob/main/spk-info.txt) defines group B as 14–25 and D as over 41. These are broad source age groups, not a guarantee of perceived age. Speaker indices come from the installed model's `speakers.txt`, not the publisher's file order.

| Cast | Source | Model index | Selection |
| --- | --- | --- | --- |
| Young woman | Existing native female voice, else SSB0005 (B, female) | 0 | Preserved approved voice |
| Young man | SSB0966 (B, male) | 107 | New distinct speaker |
| Older woman | SSB0354 (D, female) | 38 | New distinct speaker |
| Older man | Existing WNJ male | 0 | Preserved approved voice, user's age casting |

Local Whisper/base transcription screened 14 candidates on the same greeting, two questions and invitation. SSB0966 and SSB0354 retained the question wording better than the alternatives tested. Recognition still confuses 你/您 and some endings; this is only an intelligibility screen, not listening approval or proof of pronunciation accuracy. Perceived age and naturalness need user testing. Normal/slow playback retains the existing punctuation normalization, trailing-silence trim and final fade.

## Appearance assignments

Reviewed the actual character atlases and their art prompts. No character art changes.

- Young woman: Mei, Lan, An, Lian, museum guide, clothing seller, snack seller, visitors 1 and 3, Xiaomi.
- Young man: Lin, Hao, young reader, clothing customer, diner A Le, Xiaodou.
- Older woman: Grandma Yun, baker Gui, embroidery artisan, Qiao, Suyin, diner Xiao Tao, weaving visitor 5.
- Older man: Bo, Wei, gardener, waiter, visitors 0, 2 and 4.

The children share the younger profiles to keep exactly four voice categories. Mature, nongray adults are casting judgments. Visitor 0's gray-haired sprite takes precedence over his student description. The reader uses a young sprite in the museum/bookshop but Bo's older sprite in the silk studio and the painted restaurant: conversation/replay follows the clicked appearance. Practice uses the host's canonical cast.

## Rollback

For an immediate voice-only rollback, set `CHARACTER_VOICES_ENABLED = false` in `public/data/voices.js`, bump `CACHE` in `public/sw.js`, then restart `panda-world.service`. The browser and server collapse all four profile IDs back to the approved female/male voices. Tests exercise this mapping. No saved progress is changed.

The implementation is committed separately so it can also be reverted independently of other game work. Do not reset the whole repository to the baseline: other changes may coexist. A full revert also needs a fresh service-worker cache version and server restart so installed phone clients receive it.
