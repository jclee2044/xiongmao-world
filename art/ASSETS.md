# Painted assets — versions 0.2.0–0.4.0

The enclosed gardens use `public/assets/characters/garden-workers.png`: a bamboo
worker tying harvested canes into a bundle, a rock-garden groundskeeper raking
weeds and leaves, and a Tiger Hill caretaker sweeping leaves. Generated with the
built-in image tool using `neighbors.webp` as the watercolor style reference.
The alpha-preserving browser copy is `public/assets/optimized/garden-workers.webp`;
the exact prompt and provenance are in [prompts/garden-workers.json](prompts/garden-workers.json).
Each keeper has a separate work conversation, with the bamboo worker placed
beside the planting and an approach point on the clear path.

`public/assets/characters/garden-workers-work.png` extends the same workers to
four painted poses each: tightening a bamboo bundle, pulling a rake, and sweeping
with a straw broom. The browser uses `public/assets/optimized/garden-workers-work.webp`.
The two-second work loops pause briefly at each end of the stroke, with separate
phases for each worker. Row-wide crop bounds keep each frame's scale and anchor
fixed; reduced motion and paused scenes use the first pose. The built-in image
generation prompts and layout correction are recorded in
[prompts/garden-workers-work.json](prompts/garden-workers-work.json).
`node scripts/browser-garden-workers.js` checks the four distinct rendered poses,
fixed dimensions, repeating loops, reduced motion, navigation and conversations.

The dedicated clothing storefront is `public/assets/world/clothing-store-exterior.png`,
generated with the built-in image tool using the existing storefront atlas as a
style reference. Its cream fabric sign, garment displays and open doorway are
part of the painting. Exact prompt and provenance are recorded in
[prompts/clothing-store-exterior.json](prompts/clothing-store-exterior.json).
The alpha-preserving WebP encoding is `public/assets/optimized/clothing-store-exterior.webp`.
It renders at the bookstore's height, using the cropped artwork's natural aspect ratio.

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

The service worker caches these assets for offline exploration. The 0.2.0–0.3.0 WebPs total 16,014,508 bytes. Actual phone frame rate and private HTTPS download performance remain unmeasured. Screenshots from isolated Chromium are in ignored `test-results/art-*.png`.

## Version 0.4.0

Six initial built-in generations and six built-in corrections add three atlases and three interior plates. The complete exact prompts, input paths, transparency flags and selected output paths are in [prompts/generation-calls-v0.4.0.json](prompts/generation-calls-v0.4.0.json). The existing house cutout provided the style reference for shops, landmarks and rooms. Corrections added safe atlas gutters or a warm parchment backdrop around the rooms; they did not use an external image API.

| Shipped asset                                | Built-in original filename                      | Purpose                                                                    |
| -------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------- |
| `public/assets/world/storefronts.webp`       | `exec-cb936ec1-0b07-49ac-ae6a-fa539f988cd0.png` | Bakery, dumpling restaurant, bookshop, teahouse, flower stall and pavilion |
| `public/assets/world/landmarks.webp`         | `exec-e331b3c7-9b80-46ca-ad2b-fb8e15343212.png` | Pagoda, moon gate, rockery, museum, bamboo and lotus bank interpretations  |
| `public/assets/characters/animals.webp`      | `exec-2e4d7c0f-4486-4126-b9ac-99edd7f07c78.png` | Three poses each for cat, duck, rabbit and sparrow                         |
| `public/assets/world/bakery-interior.webp`   | `exec-9cc703ad-965d-476b-9fff-af91ed7471e6.png` | Explorable bakery and recipe worktable                                     |
| `public/assets/world/teahouse-interior.webp` | `exec-4cf6a838-a1da-4e25-881c-f98604e884fe.png` | Explorable teahouse and listening-order counter                            |
| `public/assets/world/bookshop-interior.webp` | `exec-2fcffe90-3e3d-453a-aff5-fb95fa797112.png` | Explorable bookshop and language desk                                      |

The six additions total **8,885,810 bytes**. All six PNG/WebP pixel comparisons reported absolute error zero; alpha is preserved in the atlases. All shipped generated WebPs now total **24,900,318 bytes**. Local reproduction PNGs remain in ignored `art/source/`; shipped assets and alpha-bound metadata are versioned.

Room plates render in a 1200 × 800 world with traced floor and furniture polygons. Foreground wall clips put nearby actors behind the doorway/walls. The outdoor lake is drawn directly with Canvas gradients, irregular banks, clipped ripples and lily pads; its collision uses the same polygon. No raster art edit creates the water. Animals use three simple poses; visitors reuse existing human art. Pause/reduced motion freeze ambient time and movement. All outdoor and room plates preload before play, including a saved-home first exit. Settled room, lake and mobile screenshots were inspected after automated checks.

## Version 0.6.0

The six selected assets below were generated with the **built-in image-generation tool**. Exact prompts are preserved in [prompts/v0.6.json](prompts/v0.6.json). The supplied Panda and Suzhou scene references guided style and identity. The assets are interpretations tailored to the game's sprite/atlas layout, not exact reproductions of the references.

| Shipped asset                                 | Built-in original                               | Use                                                          |
| --------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| `public/assets/characters/panda-v2.png`       | `exec-5b4f0686-c302-4880-a062-f844373c0e5f.png` | Six-state Panda atlas: idle, hops, direction and expressions |
| `public/assets/characters/neighbors-walk.png` | `exec-ab86b5af-07b4-4279-9ce0-2fae950a4330.png` | Six neighbors, three walk poses each                         |
| `public/assets/characters/qiao-seated.png`    | `exec-5fe8259c-0989-4286-b0b6-f11c01edd23d.png` | Tea guest seated at the courtyard table                      |
| `public/assets/world/earth.png`               | `exec-83c94f90-276e-4383-a5c2-0e1f6f9621a9.png` | Tiled earth/gravel ground material                           |
| `public/assets/world/museum-interior.png`     | `exec-b9185f96-6ad3-4c58-971f-96c0eb55b1ca.png` | Walkable illustrative museum interior                        |
| `public/assets/world/restaurant-interior.png` | `exec-2d10d774-ce9f-4dcd-9ba3-a65531ebbb69.png` | Walkable restaurant and hot-pot interior                     |

The Panda sheet uses six uneven cell boundaries in transparent gaps, with tight artwork crops centered and aligned at the ground. The hop cycle follows Panda’s traveled distance. The neighbor walking atlas has three columns and six rows. Museum and restaurant pictures show simplified exhibits and furnishings. Suzhou collection sources are in [SUZHOU_RESEARCH.md](../SUZHOU_RESEARCH.md). Source PNGs remain outside the public source tree; shipped PNG assets are cached for offline exploration.

## Xiongmao World 0.7

Generated using the built-in `image_gen` tool. Exact prompts and final saved asset paths are in [`art/prompts/v0.7.json`](prompts/v0.7.json).

- `public/assets/characters/player-idle.png`: ten transparent watercolor poses (five bun, five short hair), referenced from the existing player atlas. Runtime crops align the feet, mirror retained facing and recolor the sweatshirt to preserve outfit preferences.
- `public/assets/world/hotpot-table.png`: transparent watercolor shared hotpot table and stools. Used for the extra restaurant tables.
- Existing neighbor walking-sheet row crops were tightened to exclude the preceding row's feet, removing the floating artifact above the florist's head. Three walking poses remain distinct.

- `public/assets/world/hotpot-view.png`: a close first-person tabletop painting with five ingredient plates. Transparent button regions over each plate speak its name and reveal pinyin/meaning. Built-in original: `exec-8439b36d-93f6-48bb-92a9-5ae1b3401dbd.png`.

## Xiongmao World 0.8

All eight final raster assets below were generated or edited with the built-in `image_gen.imagegen` tool. The exact calls are recorded in [v0.8.json](prompts/v0.8.json) and [market refinements](prompts/v0.8-market-refinements.json). The final market retains the rich stalls and lanterns of the earlier design with modestly widened paths, complete roofs and clear perimeter paving. Earlier market iterations remain as source alternatives; runtime uses only v3.

| Saved asset                                      | Selected built-in output                        | Use                                                                                   |
| ------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| `public/assets/characters/neighbors-walk-v2.png` | `exec-625decf1-9a1d-4aa4-8ce7-b514f981c1ea.png` | Four distinct poses for each of six adult neighbors; individually bounded atlas cells |
| `public/assets/characters/children-walk.png`     | `exec-3c6acd78-9454-4c74-b3fa-115af7a5f091.png` | Four walking poses each for two children                                              |
| `public/assets/characters/lin-walk.png`          | `exec-48ccbb77-e973-4b2d-bbf5-3d8f5b410ef1.png` | Lin's four actual walking frames                                                      |
| `public/assets/characters/seated-friends.png`    | `exec-19c35a3e-80c1-4104-8aee-a5a9893d3735.png` | Both player hairstyles and Lian seated; player clothes recolored at runtime           |
| `public/assets/world/restaurant-interior-v2.png` | `exec-fec82fa0-1174-44d0-a8b9-1be13a925ea1.png` | Four matching hotpot tables, two occupied and two empty                               |
| `public/assets/world/fruit-trees-v2.png`         | `exec-866aa2f1-5369-4e7e-aa7b-b8baa58ea604.png` | Watercolor pear, bayberry and tangerine trees                                         |
| `public/assets/world/sheep-gift.png`             | `exec-cb4dfead-883c-42ce-a0fa-3f562db5ec77.png` | Lian's persistent hotpot thank-you keepsake                                           |
| `public/assets/world/market-lane-v3.png`         | `exec-b0b99064-d499-4aeb-b372-d22d20bef02d.png` | Final balanced canal market with traced shop, water and bridge geometry               |

Original generation files remain in `/home/jlrj/.codex/generated_images/01a10ec6-5476-7552-8f5a-8bfc761b6f49/`. PNGs are copied losslessly into the game; sprite cropping and clothing colors are runtime canvas operations. The service worker includes all final assets for offline exploration.

## Character consistency and market conversations — 0.9

All assets below were made with the built-in `image_gen.imagegen` tool and copied into the project. The exact prompt sets are [character](prompts/v0.8-character-consistency.json), [player](prompts/v0.8-player-consistency.json), [diners](prompts/v0.8-diner-consistency.json), [shop scenes](prompts/v0.9.json), and [final water refinement](prompts/v0.9-water-refinement.json).

- `public/assets/characters/player-walk-v2.png`: four distinct walking poses per hairstyle, matching the idle sheet. Idle, walking and seated clothing all use the same normalized color palette. The walking heads were reduced with the built-in tool, then the renderer was corrected to reuse the exact idle head and neck at the same scale in every walking frame for both hairstyles. The correction and original prompt are recorded in [player head consistency](prompts/player-head-consistency.json). The optimized WebP was rebuilt and the offline cache version updated.
- `public/assets/characters/lian-poses.png`: one idle, four walking and one seated pose preserving Lian’s bob, sage cardigan and peach skirt.
- `public/assets/world/restaurant-interior-v3.png`: seated diners match the street characters’ clothing and identities.
- `public/assets/world/shop-breakfast.png`, `shop-snacks.png`, `shop-produce.png`, `shop-souvenirs.png`, `shop-streetfood.png`: first-person counters with matching seller identities, merchandise and watercolor canal-town settings.
- `public/assets/world/canal-water-v2.png`: final calm turquoise watercolor water tile, referenced from the market painting. Shared by every surrounding canal and the painted market’s feathered water edges. Earlier `canal-water.png` is an unused, brighter draft.

Runtime preserves the full shop illustration without cropping faces. New assets are included in the versioned offline cache.

## Suzhou departure boat

`public/assets/world/suzhou-passenger-boat.png` is a transparent medium-large passenger boat with an arched wooden cabin, lattice windows, warm curtains and red lanterns. Generated with the built-in `image_gen.imagegen` tool using the market painting as a style reference. Original output: `exec-212ce8ea-8720-48d2-99dd-1952766cdf66.png`. The [exact prompt](prompts/suzhou-passenger-boat.json) records the reference, source and final saved path. Runtime gently bobs the boat when motion is enabled, and uses the same asset in the boarding dialogue.

## Distinct indoor NPCs

`public/assets/characters/indoor-npcs.png` contains four transparent standing sprites: an older baker with a yellow blouse and cream apron, a young reader in a rust vest, a museum guide in indigo with a gold scarf, and a waiter in a burgundy apron. Generated with the built-in `image_gen.imagegen` tool using the original neighbor atlas as a style reference; the [exact prompt and source](prompts/indoor-npcs.json) are recorded. The PNG is copied losslessly and each character has its own alpha-bound crop in `public/data/art-bounds.js`. Indoor assignments remove repeated appearances in the bakery, bookshop, museum and restaurant, including the diners painted into the restaurant plate. Existing dialogue IDs and positions are retained. The new atlas is cached for offline play.

## Distinct outdoor NPCs

The built-in `image_gen.imagegen` tool generated two more atlases from the original neighbor style reference:

- `public/assets/characters/market-npcs.png`: separate standing snack seller and embroidery artisan. The [exact prompt and source](prompts/market-npcs.json) are recorded. The market breakfast seller and street-food cook use the new baker and waiter from `indoor-npcs.png`.
- `public/assets/characters/visitors-walk.png`: six distinct strolling neighbors with four walking poses each. The [exact prompt and source](prompts/visitors-walk.json) are recorded. Their appearances are reserved for these visitors, so they no longer borrow shopkeeper sprites. Atlas row crops retain complete heads and shoes.

Both PNGs are copied losslessly, retain alpha, and are cached offline. The outdoor cast has unique sprite identities across the whole scene, including animated Lin and the two children; tests verify the cast over three minutes of movement and check actual rendered sprite crops. Dialogue IDs, routes, and all six original visitors remain available.

## Expanded market and walled grounds

`public/assets/world/market-lane-v4.png` was edited with the built-in `image_gen.imagegen` tool from v3. The [exact prompt](prompts/v0.9-market-expansion.json) records a higher orthographic ground view, wider consistent lanes and bridges, and a continuous parallel-edged southern promenade. This expansion study is superseded by the organic market below. The surrounding walls reuse the game's canvas plaster-and-tile rendering and moon-gate artwork.

## Organic market streets and complete bridges

`public/assets/world/market-rows.png` is the final transparent district, generated with the built-in `image_gen.imagegen` tool from the user’s three Suzhou street references. Connected L-shaped shop blocks have readable Chinese signs, a widened west cross alley, a bending central lane and a waterfront loop. Every roof and perimeter wall is complete; the image contains no partial bridge, boat, tree or water backdrop. The [generation and clearance-edit prompts](prompts/organic-market.json) record the exact steps and output. The PNG is copied losslessly and rendered over shared town terrain with newly traced collision.

`public/assets/world/stone-bridges.png` supplies complete arched bridges with masonry parapets for both crossing orientations. The [prompt and source](prompts/stone-bridges.json) record generation from the user’s bridge reference. Their full rendering spans both banks; the northern market bridge ends at the canal with a separate paved approach clear of the roofs. The existing complete passenger-boat sprite and rooted willow replace the old cropped boat and hanging foliage. Both new PNGs are cached offline.


## Welcome screen and optimized browser encodings (2026-10-08)

The welcome screen reuses the existing Panda, Canal Lane, and teahouse artwork. `public/assets/welcome/` contains 480/960-pixel WebP previews and a 240-pixel Panda. No new generated artwork was added. `public/assets/optimized/` contains quality-85 WebP browser copies of 43 game images; originals and atlas dimensions are retained, with alpha quality set to 100. `public/data/optimized-art.js` maps original renderer paths to these copies. Reproduce both sets with `node scripts/optimize-art.js` and ImageMagick. Retain originals as the source for later regeneration.

A cold-entry comparison with service workers disabled, 40 ms latency and 2 MiB/s download throughput measured 36.3 seconds before versus 6.9 seconds after the initial optimization (local Chromium, simulated connection). This is a controlled comparison, not a guarantee for physical phones or every network. Screenshot and browser regression evidence is in `test-results/welcome-*`.
