# Painted assets — versions 0.2.0 and 0.3.0

Created with the **built-in image-generation tool**, using the supplied third Suzhou illustration as the composition target for Canal Lane and as a style/identity reference for the other assets. The selected environment retains the reference's framing and detail; separately generated characters and the outer streets are adaptations, not pixel-identical copies of the whole reference.

The complete exact prompt set, input paths, transparency flags and 16 generation calls are saved in [prompts/generation-calls.json](prompts/generation-calls.json). Calls are recorded chronologically, including player spacing and vendor transparency corrections. The standalone environment specification is [prompts/canal-lane.txt](prompts/canal-lane.txt). These are provenance records, not scripts to execute automatically.

Primary input: `/home/jlrj/.codex/attachments/4b603cfc-86d7-4d6d-876b-3f2f301b37c3/codex-clipboard-ad73bbb9-25e4-4f76-8051-1994bc7932ef.png`.

## Selected outputs

All shipped outputs are in this workspace. Paths below are relative to `/home/jlrj/Documents/lotus`; the corresponding source PNGs remain in ignored `art/source/` for local reproduction. Built-in originals are under `/home/jlrj/.codex/generated_images/01a10c66-6299-74a0-9005-e0f8306850ff/`.

| Shipped asset                                | Built-in original filename                      | Purpose                                              |
| -------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| `public/assets/world/canal-lane.webp`        | `exec-2b0a46d4-07fa-4320-b561-c04ad80f7068.png` | Detailed reference scene without actors, cat or UI   |
| `public/assets/world/home.webp`              | `exec-39fe039e-aa5b-44b2-8be3-247fca1b2f8b.png` | Detailed home interior                               |
| `public/assets/world/paving.webp`            | `exec-b6aa2f6f-ecc9-4c64-b835-9f56cb19ecb3.png` | Repeated connecting-lane ground                      |
| `public/assets/world/house.webp`             | `exec-b69511d3-3e84-4cd4-a108-1123660516f4.png` | Reusable Jiangnan house cutout                       |
| `public/assets/world/willow.webp`            | `exec-64c92bf1-c5d4-4845-819a-5fa2b148d384.png` | Reusable willow cutout                               |
| `public/assets/characters/player-atlas.webp` | `exec-266baa42-42e4-45c7-9a05-0e735136c226.png` | Eight outfit/hair variants with crop gutters         |
| `public/assets/characters/mei.webp`          | `exec-5c617c4e-4597-49ab-ac8c-ce6ba6dd227c.png` | Noodle vendor, cropped behind her counter at runtime |
| `public/assets/characters/lin.webp`          | `exec-2d4f276e-0068-423e-bfce-354f5fd80ad8.png` | Backpack-wearing neighbor                            |
| `public/assets/characters/yun.webp`          | `exec-d8dd9c02-7d13-498b-af8f-3b11817d6ead.png` | Elderly neighbor with vegetable basket               |
| `public/assets/characters/momo.webp`         | `exec-55e1ce22-37ec-4225-8347-81c33234d0ae.png` | Discoverable plush teddy                             |

Version 0.3.0 adds these selected built-in outputs:

| Shipped asset                               | Built-in original filename                      | Purpose                                                                |
| ------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| `public/assets/characters/neighbors.webp`   | `exec-e09b26fd-56fe-47cb-9497-33d639d1912d.png` | Six additional painted neighbors in a 3 × 2 atlas                      |
| `public/assets/characters/player-walk.webp` | `exec-e748874d-6230-4b23-a38e-75e8015e3f42.png` | Three walking poses for eight appearances, with corrected shoe gutters |
| `public/assets/world/props.webp`            | `exec-07abdd29-233b-4d36-8318-7e55292fa408.png` | Market, bench, planter, sign, well and tea-table cutouts               |

The corresponding local sources are `art/source/neighbors.png`, `art/source/player-walk.png` and `art/source/props.png`. `public/assets/panda.png` is the original supplied candidate, retained unchanged and drawn smaller in version 0.3.0.

## Encoding and integration

ImageMagick converted the ten selected PNGs to lossless WebP with alpha preserved. Total size fell from 19,228,335 to 13,153,528 bytes. Pixel comparisons reported absolute error **zero for all ten**. This is encoding, not a visual art edit. Original PNGs are excluded from Git; shipped WebPs and metadata are versioned.

The three version 0.3.0 additions total 2,860,980 bytes in lossless WebP. All three pixel comparisons reported absolute error zero, with alpha preserved. Their original PNGs also remain outside the public root.

`scripts/inspect-art.js` reads alpha bounds through Chromium and writes `public/data/art-bounds.js`. The renderer crops transparent sprite gutters, sorts actors by foot depth, and redraws reference counter/bridge foreground patches for occlusion. It reuses houses, trees and props at their natural aspect ratios; scenery outside the viewport is culled. Player walking alternates three poses with a steady idle pose and direction mirroring. This is a simple animation, not a full directional animation set.

`public/game/terrain.js` draws narrow lanes, soft courtyard borders, gardens and ponds. A cached alpha mask and matching paving aprons blend the original environment plate into connecting paths. Foliage fades when it hides the player; reduced motion stops swaying and animated poses. Home changes use a short Canvas crossfade. These runtime Canvas treatments preserve the shipped source art.

The service worker caches these assets for offline exploration. All generated WebP art totals about 16.0 MB, plus the supplied Panda/icons and client source. Actual phone frame rate and private HTTPS download performance remain unmeasured. Screenshots from isolated Chromium are in ignored `test-results/art-*.png`.
