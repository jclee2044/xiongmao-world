# Suzhou landscape and collection research

Research completed 5 October 2026. The game compresses several real Suzhou districts and attractions into a fictional walkable neighborhood; distances and landmark placement are illustrative.

## Family home — 10 October 2026

- [Suzhou municipal description of Zhouzhuang housing](https://english.suzhou.gov.cn/szsenglish/jnsxgzlm/201611/8aeb80281dd94d83ae02914ededadc0c.shtml) distinguishes large courtyard residences, merchant homes with living quarters behind or above shops, and modest waterside houses. The new southern home is an illustrative modern family living in a traditional building: plaster walls, wooden framing, courtyard views and practical appliances. It is not a reconstruction or a claim that all present-day Suzhou homes have this form.
- [Suzhou municipal description of Su-style furniture](https://english.suzhou.gov.cn/szsenglish/sgy/201611/60a60728517d43639dd06320685da35d.shtml) informed restrained wooden furniture with clear structural lines. Separate transparent sprites supply a table, chair, low storage cabinet, bamboo laundry basket, toy/book box and enamel washing basin. Household appliances are painted into the room; furniture sprites have their own depth order and collision footprints.
- [Suzhou Civil Affairs Bureau's 2020 elderly-care consultation](https://minzhengju.suzhou.gov.cn/mzj/zxft/202011/22dd21dc52ce4108be46d4c66ddfa90e.shtml) reports 34 of 98 elderly questionnaire respondents living with children. This small opt-in sample supports the plausibility of a multigenerational household, not a citywide prevalence estimate. Mr Chen lives with his two children and his own parents; chores and conversations are shared across the family.
- Spring Festival dialogue describes this fictional family's preparations, shared food, good wishes and red envelopes. It explicitly allows different family traditions, and replaying a preparation task does not imply today is the festival. Weather forecasts are labeled practice examples rather than live weather.

Room and furniture art were generated with the built-in image generation tool. Reproducible prompt records are in `art/prompts/family-home.json` and `art/prompts/family-furniture.json`; source PNGs and runtime WebP assets are in `public/assets/world/`.

## Landscape decisions

- **Pingjiang Historic Quarter:** the Suzhou municipal history describes the paired street-and-river pattern that informed the parallel lanes and the connected canal branches. [Suzhou municipal source](https://english.suzhou.gov.cn/szsenglish/lsjz/202106/87af552d082446d99f2e23a22c800fab.shtml)
- **Classical gardens:** UNESCO describes garden compositions shaped by water, rockeries, plants, walls and architecture. The map uses planted gardens, a pond edge and rockery beside the lane rather than one uninterrupted paved surface. [UNESCO World Heritage entry](https://whc.unesco.org/en/list/813/)
- **Shantang Street:** municipal visitor information describes its canal-side historic street. It inspired the separate, smaller second neighborhood. [Suzhou municipal guide](https://english.suzhou.gov.cn/szsenglish/szlsjq/201611/def07526776940858fd13f2f66553c95.shtml)
- **Stone bridges:** the municipal district history and local bridge study informed the repeated crossings. Actual spans vary; the reviewed photograph shows a low flat granite bridge with squared parapet posts. [Suzhou district-history source](https://dfzb.suzhou.gov.cn/dfzb/szdq/201811/93f014f81a794a7292a8b29a427149d0.shtml)

Real photographs were opened and visually reviewed for a stone bridge and a garden courtyard: [granite canal bridge](https://dfzb.suzhou.gov.cn/szdoc/szsdfz/resource/attached/20181128091201_6552.jpg) and [garden courtyard](https://news.2500sz.com/uploadfiles/202011/30/2020113008031689513612.jpg). The bridge reference shows dark canal water, straight granite banks, a low bridge, white walls, grey roofs and willow. The courtyard image shows shady planting, a tree bed, stone table, stools and small-scale paving. They are references only; the project does not redistribute those photographs. The game uses painted and code-drawn interpretations.

## Museum subjects

- **Five Dynasties celadon lotus bowl:** the short exhibit points to the Suzhou Museum academic paper about the lotus-pattern celadon bowl found at Tiger Hill Pagoda. [Suzhou Museum paper (PDF)](https://file.szmuseum.com/WaterMark/%E9%97%A8%E6%88%B7%E7%BD%91%E7%AB%99%E5%A4%9A%E5%AA%92%E4%BD%93%E6%96%87%E4%BB%B6/academic/2019/201911_msclhwdqsjs_cheny.pdf)
- **Northern Song Pearl Pillar:** Suzhou municipal reporting identifies the reliquary pillar found in Ruiguang Pagoda. [Suzhou municipal source](https://english.suzhou.gov.cn/szsenglish/News/202609/db4e25059d964d5b824d7b1199698424.shtml)
- **Parallel streets and waterways:** the third display teaches the Pingjiang street-and-canal layout from the municipal history source above.

These are beginner-language summaries rather than catalogue entries. The museum labels the paintings as illustrative examples, not exact reproductions of museum objects.

## October 5 update: a social neighborhood

The user's supplied dossier (`handoff/references/suzhou-worldbuilding-dossier.md`) and three reference images informed connected shopfronts, white walls/dark tiles, framed garden views and market activities. Its numbered citations do not include a bibliography, so precise historical claims were not copied into the game unverified.

- Shushan's pear orchards, red bayberries and tea are documented in [Suzhou's Cuiguan pear harvest report](https://english.suzhou.gov.cn/szsenglish/News/202407/0fb886e678394f1b8a77b5a30dfdbab8.shtml). The northeast grove combines bamboo with illustrative pear/bayberry trees. The market's tangerine trees teach 橘子; they are not presented as one of Shushan's three specialties.
- [UNESCO's Suzhou garden description](https://whc.unesco.org/document/154344) supports composing water, rock, plants and architecture. The game distinguishes an illustrative Lion Grove rock court and a Humble Administrator's Garden pond visit. These are compressed interpretations, not reconstructions or geographic models.
- Quest design references: [Roblox's quest structure documentation](https://create.roblox.com/docs/production/game-design/introduction-to-quest-design) and [Joel Burgess's GDC talk on open-world motivation](https://blog.joelburgess.com/2011/03/gdc-2011-transcript-motivating-players.html). Applied design decisions: visible objectives, measurable progress, one concrete next action, an actionable destination, optional social tasks, and persistent completion. No time limits or penalties for asking for language help.

## Speech and dictionary research

- [Sherpa's documented neural Mandarin models](https://k2-fsa.github.io/sherpa/onnx/tts/pretrained_models/vits.html) lists the single-male WNJ voice at 16 kHz. It replaces the basic male fallback locally. AISHELL3 at 8 kHz was evaluated first; local ASR recovered the test sentence inaccurately, so it was not selected. WNJ produced a transcript matching “你好，你想吃什么” in the same check. This verifies intelligibility for one fixture, not subjective naturalness across all dialogue.
- [CC-CEDICT/MDBG](https://www.mdbg.net/chinese/dictionary?page=cc-cedict) supplies Chinese definitions. Pronunciation comes from the installed pinyin-pro dictionary; context-sensitive heteronyms may still need learner feedback. Unknown names are labeled honestly. Runtime definitions use only the local game server.
