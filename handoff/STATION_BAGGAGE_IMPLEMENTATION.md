# Station bag and player sprites

The ground-floor scanner now displays the player's olive-green canvas satchel,
rather than a backpack cropped out of the station passenger atlas.

The player uses bag-free artwork while the saved journey is `bags` or `screened`.
Collection restores her bag. Returning to public space resets entry and restores
the carried bag, as does leaving the station. No additional save field is needed.
Idle, walking and seated poses support both hairstyles and the existing four
clothing colors. Walking uses the corresponding idle head to preserve face and
hair proportions across animation frames.

## Assets

Generated with the built-in image_gen tool from the existing player artwork.
Exact prompts and input references: `art/prompts/station-player-baggage.json`.

- `public/assets/props/player-green-satchel.png`
- `public/assets/characters/player-idle-without-bag.png` — five poses, two hairstyles
- `public/assets/characters/player-walk-without-bag.png` — four frames, two hairstyles
- `public/assets/characters/player-seated-without-bag.png` — player poses in the first two cells

WebP copies are in `public/assets/optimized/`. The satchel was trimmed and scaled
to at most 512 pixels; character sheets preserve generated dimensions and alpha.
Clothing variants use the existing painted-shading palette recoloring.
The station loads these assets before gameplay. Service-worker cache version
`0.9.7-station-luggage-95` includes all four optimized assets for offline use.
Packed travel suitcases render alongside the satchel on the scanner instead of
replacing it. Both disappear from the player during screening and return on collection.

## Validation

- `node scripts/browser-station-baggage.js`: both hairstyles, all four clothing
  colors, idle/four walking/seated poses, deposit/screening/collection sprite
  selection, and exclusive conveyor/player bag ownership.
- `node scripts/browser-station-interior.js`: full security flow, deposited-bag
  reload, phone touch deposit/passage/collection, and offline bag-free reload.
- `node scripts/browser-character-consistency.js`: existing player appearances,
  walking/idle head consistency in both directions, and seated poses.
- `node --test test/station-interior.test.js`: journey ownership transitions,
  save round-trip, exits, and existing station geometry/flow checks.
- `npm run check`: JavaScript syntax.

The full unit suite reported 251 passes and three failures outside this change:
the authored-language audit of the existing `public/app.js` toy text, the
`visitor-3` movement range, and the market cat movement range.
