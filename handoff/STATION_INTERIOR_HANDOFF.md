# Station interior build handoff

Build the approved playable station interior in the existing Xiongmao World game at `/home/jlrj/Documents/lotus`. Connect the implemented boat-arrival exterior to public ticketing, entry screening, an upstairs waiting hall, boarding gates, and stairs down to the ground-level railway platform. Preserve the warm painted game style and the substantial station scale shown below.

The user approved this full layout on October 10, 2026, then requested that **about half of the seated NPCs be painted into the environment instead of added as character sprites**. This requirement applies to production artwork from the beginning.

## Approved visual reference

![Approved full station layout](/home/jlrj/Documents/lotus/handoff/references/station/interior-two-levels-v5-approved.png)

This image supersedes `interior-context-v1.png`, `interior-two-levels-v2.png`, and `interior-two-levels-v3.png` for layout. Earlier versions incorrectly blocked access to the boarding gates with a continuous black-topped wall. Do not restore that wall. The latest full view also supersedes the earlier boarding close-up's stair orientation: stairs now begin directly beyond the gates and descend away from them.

The two overview panels depict different floors of one building, shown side by side for explanation. They are not adjacent rooms on one floor. The bottom strip is a sectional explanation, not another playable corridor. Diagram arrows, headings, numbers, and illustrative timetable entries are not production assets.

Use the current town, station exterior, and existing painted interiors as the final authority for character proportions, materials, camera compatibility, and color. Keep cream tiles, chestnut accents, blue functional signs, large sunset windows, and watercolor/gouache texture. Avoid photorealism, glossy 3D, or shrinking the station into a tiny room. Building wings and structural bays can continue outside the accessible area to convey scale.

## Scope and existing integration

The exterior is already implemented. Read [its implementation notes](/home/jlrj/Documents/lotus/handoff/STATION_EXTERIOR_IMPLEMENTATION.md) rather than rebuilding from the older exterior proposal. Preserve its bridge, geometry, painted layers, boat travel, characters, save behavior, and entrance preview.

`public/data/station-exterior.js` exports `STATION_TICKETING_SCENE = "station-ticketing"` and `connectStationTicketing(scenes)`. Register that scene before the connection function runs. The existing `station-entrance` inspection then becomes a door. Provide an explicit return from ticketing to a safe position outside that same entrance in `shantang`. The generic room return setup currently looks up doors in `scenes.shanghai`; it does not automatically solve this station return.

Build the navigable interior and the interactions needed to make ticketing, screening, waiting, and boarding understandable. The cozy onboard scene and the new Shanghai destination are downstream work unless separately requested. Preserve an explicit train-boarding integration point; never send an unimplemented destination to the scene loader and accidentally fall back to town.

The legacy scene ID `shanghai` names the existing Suzhou-inspired starting town. Do not use it as the new Shanghai destination or rename it casually. The exterior remains `shantang` for compatibility. Keep existing XP and boat unlocking intact; add no new XP barrier at the station door.

## Floor plan and room connections

| Area | Level | Connections and contents |
| --- | --- | --- |
| Public ticketing | 1F ground | Enter from existing forecourt. Counters on left, wall mural, bench, map stand, plants; broad clear central aisle toward controlled entry. |
| Entry verification and security | 1F ground | Public side connects to ticketing; screened side leads to core A. Identity check, baggage conveyor/scanner, passenger detector and staffed assistance. |
| Core A | 1F to 2F | Stairs/escalator and lift connect screened ground-floor entry to the upper waiting hall. |
| Waiting hall | 2F | One broad continuous floor with shops, services, ordinary seating, massage chairs, departure board and open approach to boarding. |
| Boarding check and landing | 2F | Short ticket/ID gates connect waiting hall to the checked landing. Stairs and lift to platform are beyond the gates. |
| Core B and platform | 2F to 1F | Descend to the above-ground railway platform beside the train. No direct public shortcut from ticketing or outside. |

Use separate scenes where useful for scale, camera framing and loading, while keeping visible connections consistent. A doorway or stair preview must resemble the actual destination, with matching orientation, width, materials and elevation. Avoid a generic fade that conceals contradictory geography. Keep the waiting hall and boarding approach visually connected; they need not become unrelated enclosed rooms. Use the game's fixed elevated camera, scrolling at a readable character scale. Ticket-counter and train-arrival moments can use closer framing.

Security must span the public-to-screened boundary. Join lane ends to walls or partitions, so neither the player nor Panda can walk around it. Bags pass through the scanner; passengers use the detector lane and recover bags beyond it. Returning to the ticket hall retains clearance; leaving the station requires screening again on re-entry. Provide a usable return route rather than trapping players behind a checkpoint.

## Boarding geometry that must remain clear

The main waiting hall approaches the right-hand boarding bay through a **wide open connection above/north of the gate row**. The gates run across the bay, with travelers moving through them toward the lower part of the drawing. The partition at their western end extends only south, alongside the checked landing. It must end at the gate row and must not continue north across the waiting-hall approach.

After checking, walk across the landing directly onto the top of the descending stairs. Their open mouth faces the gates. Railings run along the stair sides and protect exposed drops; no rail or sign spans the entrance. The lift opens onto the checked side. The platform and train are at 1F, with believable ground-level surroundings; the train is not a metro train underground or suspended beside upper-floor windows.

Boarding gates check the booked journey when boarding opens. They are short gates, not another bank of metal detectors. Include a staffed accessible lane. Keep the gate boundary impassable when closed and permit passage through the lane when open; visual and collision states must agree.

## Waiting hall and seated passengers

Extend the hall generously leftward and through the middle. Put a small convenience/snack shop and compact café/noodle counter at the back left. Toilets, help desk, hot-water dispensers and food all open onto this same upper floor before boarding checks. Keep four massage chairs on the left, with ordinary bench banks in the middle and ample clear aisles. Preserve moderately busy to bustling atmosphere without recreating the town's shopping district.

**Approximately half of the seated passengers must be environmental artwork.** Count seated people, not seats or the whole station population. For example, if 16 seated passengers are visible, roughly 8 can be painted with their benches and roughly 8 can remain live characters. This is a composition target, not an exact runtime quota. Keep some seats empty.

- Paint ambient seated passengers directly into the room/bench environment art, with integrated poses, shadows, belongings and lighting. Do not implement this half as stationary character sprites, or remove everyone from the background as older asset-cleanup guidance suggested.
- Most of these painted seated passengers must have visible luggage with them: vary rolling suitcases, backpacks and travel bags beside their chairs or tucked close to their feet. Paint the luggage into the environment with its owner, keeping circulation aisles clear and including its ground footprint and occlusion where needed.
- Include one painted passenger sleeping stretched across a few adjacent chairs. Choose a bench whose seat shape and armrests physically allow the pose, keep their luggage nearby, and mark all occupied chairs as unavailable to live seated actors. Count the sleeper as one environmental passenger even though they occupy several seats.
- Keep the other seated passengers as separately rendered characters where conversation, animation or state changes are useful. Reserve their seats as empty in the environment art so people are never drawn twice. Use seated poses aligned to seats, not standing sprites over benches.
- Player, Panda, the recurring fellow traveler, mobile passengers, and staff with changing behavior remain separate live actors. Match the existing traveler identity and persistence rather than creating a duplicate named traveler.
- Environmental people can be ambient with no interaction marker. If a painted passenger needs dialogue, attach a hotspot to the artwork without rendering another body; do not imply every painted crowd member is interactive.
- A painted seated person and their bench can still be an environment occlusion layer. Reuse the painted pixels with accurate transparent masks when the player walks behind them. This is environment layering, not a separately animated NPC sprite. Keep the player visible in front and properly covered behind.
- Trace furniture and occupied-seat ground footprints. Do not make rectangular opaque cutouts around painted people, block an entire canopy/head projection, or allow the player/Panda to walk through occupied benches. Preserve generous approach space for live conversations.

Record which seats contain environmental people and which hold live actors in the scene data or asset notes so future art edits retain the split.

## Interaction and language continuity

Use existing dialogue, inspection, help, pinyin and audio systems. The core conversation is buying a ticket to Shanghai, then learning to navigate the station. Entry verification and boarding checks remain distinct interactions. Counter purchase is this learner's scenario, not a claim that every real traveler buys a paper ticket at the station.

The exterior already has Xiaocheng, `XIAOCHENG = "station-traveler"`, plus departure state in `public/data/station-departure.js` and related runtime code. Continue that traveler indoors where appropriate, respecting whether they have already entered the station. Preserve existing exterior traveler conversations and history.

A short wait of a few minutes can provide time for exploration and conversation before train arrival. Treat relaxed boarding as a deliberate game accommodation: avoid a punishing countdown or missing-train failure. Train arrival and boarding authorization are distinct concepts. The eventual train scene should be a cozy seated view with Panda, the fellow traveler, and passing scenery.

Use controlled readable text for functional signs: 售票, 安检, 候车室, 检票口, 站台, 洗手间 and appropriate bilingual help. Keep a few user-selected decorative signs from `handoff/references/station/sign-*.png`, such as 平安出行 温暖相伴 and 一杯热水 温暖旅途. Murals belong flat against walls, not across routes. Do not ship generated gibberish, duplicated train numbers, or an invented timetable presented as real information.

For railway facts and the distinction between verified practice and this compressed game layout, read [station research](/home/jlrj/Documents/lotus/handoff/STATION_RESEARCH.md). The accepted two-floor plan is a Suzhou-inspired design, not a surveyed reproduction of Suzhou Station.

## Implementation references

| Files | Relevant existing behavior |
| --- | --- |
| `public/data/station-exterior.js`, `public/data/town-rooms.js`, `public/game/world.js` | Entrance connection, scene registration, geometry, returns and saves. Map version is 14 at handoff creation; inspect current state before changing it. |
| `public/data/interiors.js`, `public/game/render.js` | Painted room backgrounds, furniture polygons, live actors and foreground layers. |
| `public/data/station-props.js`, `public/game/station-layers.js` | Accurate transparent prop masks and actor depth handling from the existing exterior. Avoid repeating its earlier opaque-rectangle layering bugs. |
| `public/data/station-departure.js`, `public/data/station-travelers.js`, `public/data/station-traveler-art.js` | Existing traveler IDs, cast and artwork; inspect current runtime consumers before extending. |
| `public/game/adventure.js`, `public/game/engine.js` | Interactions and scene changes. Check missing-target behavior explicitly. |
| `public/game/station-signs.js` | Controlled station text and sign placement. |
| `scripts/optimize-art.js`, `public/data/optimized-art.js`, `public/sw.js` | Discover new source artwork, generate runtime mappings and include required files in offline caching. |

Generate room-scale production plates from the approved concept rather than putting this whole labeled overview behind the player. Keep necessary environmental seated people in those plates; exclude live actors, Panda, UI and diagram annotations. Preserve the current source art when producing versioned new assets. Inspect repository instructions and concurrent edits first; do not overwrite unrelated work.

## Acceptance and validation

1. Travel from the existing boat exterior through its actual entrance, buy a ticket, pass screening, ascend, cross the waiting hall, pass boarding and descend to the platform. All transitions land on valid floor, and the return to the exterior is correct.
2. The approved scale, warm style, upstairs amenities, expanded seating and four massage chairs are visible at playable zoom. The large station remains legible on desktop and phone.
3. About half the seated crowd is environmental art; most of those painted passengers have visible luggage, and one is sleeping across several adjacent chairs with luggage nearby. There are no duplicate sprite bodies, visible seams, misplaced seated poses or missing front/behind occlusion. Verify representative bench and luggage approaches with player and Panda, and ensure the sleeper's occupied chairs cannot also seat live actors.
4. Security and boarding have no bypass at either end. Open gate lanes really allow passage. Stairs, lifts, walls, bench bases and platform edges have matching art and navigation; route arrows used during testing never cross barriers.
5. NPC conversations, sign interactions and return travel work with keyboard, click and touch. Panda follows through narrow lanes and transitions without clipping, becoming stranded or bypassing checks.
6. Reload preserves progress, traveler state, history and a valid location. Existing town/boat/exterior saves still work. New artwork and modules load offline through the established asset system.
7. Use Node 26 as specified in `package.json`. Run `npm run check`, `git diff --check`, meaningful focused navigation/progression/save tests, and isolated browser checks for the full route and visual layering. Reuse boat and station exterior regression checks. Capture actual playable views, including phone, and inspect them; a successful route assertion alone does not validate the artwork.

The exterior implementation notes record historical unrelated full-suite failures. Recheck current failures before attributing them to that baseline. Use isolated test state rather than the user's live save. Report implemented scope, validation, and any remaining train/Shanghai integration clearly.

## Reference provenance

The approved reference was produced with the built-in imagegen tool and saved as `handoff/references/station/interior-two-levels-v5-approved.png`. It is concept artwork, not a production background. Its final edit preserved the full two-floor overview, removed the wall across the gate approach, and reversed the boarding stairs so their open top faces the checked landing and their flight descends toward the foreground. The user's environmental seated-passenger requirement was added after this illustration was approved and must be applied when producing the room artwork.
