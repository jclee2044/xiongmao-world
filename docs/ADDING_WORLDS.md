# Adding a world

Use the existing modules and explicit registries. Scene definitions are data; `World` owns live movement, input, routes and timing. Keep one owner for each position, clock and controller. There is no character inheritance hierarchy or plugin framework to extend.

## Where things belong

| Responsibility | Owner |
| --- | --- |
| World registration | `public/worlds/catalog.js` |
| Suzhou scene assembly and ordered transforms | `public/worlds/suzhou/manifest.js` |
| Existing rooms, quay and station definitions | `public/worlds/suzhou/scenes/` |
| Character registration | `public/content/characters/catalog.js` |
| Existing ordered NPC definitions and overrides | `public/content/characters/suzhou.js` |
| Topics, lexicon and starter phrases | `public/content/language/basics.js` |
| Art descriptors by role | `public/content/art/`: NPCs, player, companions, animals, items, icons, environment and welcome |
| Existing renderer asset names/URLs | `public/content/art/render-assets.js` |
| Shared collision primitives | `public/shared/geometry/collision.js` |
| Scene collision, movement and interaction queries | `public/engine/navigation.js` |
| Initial save defaults and historical upgrades | `public/state/defaults.js`, `public/state/migrations/world.js` |
| Existing input, painting, audio and runtime controllers | Their current modules in `public/game/`; intentionally retained |

The old `public/game/world.js`, `public/data/content.js` and moved scene paths remain compatibility facades. They expose the same objects and APIs. Prefer the owner directly in new code when that avoids importing unrelated responsibilities. Never create a scene object on every lookup: simulation and rendering caches depend on stable scene identity.

## Add a world in small increments

1. Create `public/worlds/<world-id>/manifest.js` and cohesive scene modules below it. Export a world with `{ id, scenes }`. Use globally unique saved scene IDs and unique placement IDs within each scene. A character may appear in several scenes. Preserve existing IDs, especially `shanghai`, which is the historical saved ID for Suzhou.
2. Register the manifest explicitly in `public/worlds/catalog.js`. Each scene needs finite positive dimensions, a walkable spawn, and the fields consumed by the existing renderer. Keep geometry, collision and art coordinates in the same scale. Construct gated variants once and reuse them. Do not change old transforms while adding new ones.
3. Add character definitions to a cast module and register it in `public/content/characters/catalog.js`. Reuse an existing character ID for the same person; use a new ID for a different person even when sharing a sprite. Use `dialogueId` when a placement ID differs from its character. Keep voice assignment, appearance, greeting and fixed identity explicit. The Suzhou cast still uses its existing station/household helper modules; move those only when a real feature requires it.
4. Add art to its role descriptor in `public/content/art/`. Put new sprite files under `public/assets/sprites/<role>/` and new environment art under a world-specific folder. Existing source images and URLs remain at their original locations for compatibility. An `output` is an explicit destination, so two worlds can use the same basename without colliding. Run `node scripts/optimize-art.js --list` to review conversion jobs without writing images. Run optimization only when intentionally producing new art; it is not a refactor verification step.
5. Connect doors with existing `target`, approach and return-point conventions. Reference registered activities and characters. The manifest's `scriptedCharacters` identifies NPCs handled by existing bespoke interactions instead of free dialogue; adding an ID here does not implement an interaction. New progression, scene-specific painting, audio or interaction mechanics require their own feature implementation and tests in the existing owners. Registration alone does not create those behaviors.
6. Add every new browser module and required offline image to `public/sw.js` and use a new cache version. Retain old URLs while installed clients can request them. Keep the train and other moving actors separate from painted backgrounds.
7. Run `npm run check`, `npm run check:worlds`, the unit suite and the affected isolated browser checks. Add meaningful coverage for the new scene, routes, save/reload and offline installation. The validator rejects duplicate scene/character IDs, duplicate placements, missing door/dialogue/activity references and conflicting art outputs. Inspect the new world at desktop and phone sizes.

World registration does not require changing map version 14. Change save versions or migration policy only when an intentional feature needs it, with explicit tests for old saves. Do not remove apparently obsolete branches from the existing migration during unrelated work.

## Behavior-preserving refactor gate

For structural work, make a checkpoint and retain the original reference. From the candidate checkout, run:

```sh
node scripts/verify/gate.js \
  --original /path/to/original-checkout \
  --previous /path/to/previous-accepted-checkout \
  --out test-results/refactor/my-batch
```

The gate compares exact authored/state/movement data, geometry boundaries, unit outcomes, rendered frames, offline updates and the complete isolated browser inventory. It exits on a changed result; it does not reset files automatically. Immediately restore the unaccepted batch on a gameplay difference, record the evidence and defer that aspect. Do not alter goldens to accept a refactor change. The recorded baseline has four unit failures and 28 browser failures; they remain failures with exact comparison, not passes.

Intentional new-world features will change the old scene catalog and frame inventory. Preserve the old-world comparisons, test the added behavior explicitly, and establish a reviewed feature baseline. Do not use a refactor golden to prohibit an authorized feature or silently overwrite it to hide an accidental change. Physical-device and subjective audio evidence remain separate from headless tests.

See [the reduced scope](REFACTOR_PLAN.md), [execution evidence](refactor/EXECUTION.md) and [frame/state ownership](refactor/FRAME_ORDER.md).
