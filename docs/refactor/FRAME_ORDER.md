# Existing frame and state ownership contract

Recorded from `b85202c` before extracting engine responsibilities. This describes existing behavior; it is not a proposed new schedule. The deterministic frame harness in `scripts/verify/frames.js` protects the recorded frames and callback traces. Device-specific input and subjective audio checks remain separate requirements.

`World` owns the player, Panda trail, routes, input state, scene transitions, camera, ambient clock and current world-specific actor controllers. Character definitions and scene placements do not own a second position or animation clock. `StationTrain` and `StationDeparture` already encapsulate their respective sequences. Rendering and simulation retain their existing scene-keyed caches.

Each `World.frame(t)` performs these operations in order:

1. Compute `dt = Math.min(0.1, (t - last) / 1000 || 0)` and assign `last = t`.
2. If art is pending, disable sign and bubble help, schedule the next animation frame and return. Do not move simulation work before this early return.
3. Advance ambient time only when unpaused, not reading bubble help, and motion is enabled. Update the station traveler using zero elapsed time when paused; synchronize the station scene variant.
4. Update the platform train when unpaused and not reading bubble help. Dispatch `train-arrived` immediately when its pose becomes ready and the journey has not recorded arrival. The application callback retains its immediate save flush.
5. Remember the previous Panda position. When unpaused, update the tea guest and hungry guest before reading keyboard input. Keyboard movement clears the held pointer, route, pending interaction and navigation focus; otherwise read pointer movement.
6. Remove reached route points using the existing distance `< 4`, then derive direction from the next point. Keep speeds, scene multipliers, pointer multipliers and distance caps in their existing order. Call the unchanged collision movement capability.
7. On actual movement, dispatch footsteps, update walking distance, append the Panda trail, retain at most 240 trail entries, and report movement only when the existing 500 ms interval expires. If blocked, clear the route.
8. Resolve a pending interaction at distance `< 72`, or recompute its route when needed. Update Panda following afterward, retaining the 0.5-second delayed trail. Then apply station-ground progress, synchronize its scene and report position.
9. Report a stop after movement ends. Update the nearest-interaction callback only when its ID changes. Write position, journey, luggage and train diagnostics.
10. Derive the existing paint key and redraw conditions. The station's ambient repaint exception and the other scenes' `> 90` ms threshold remain unchanged. Draw with the same camera, settings, actor and progression inputs.
11. `draw()` calls `lifeActors` during its actor pass. Immediately after drawing, the engine calls `lifeActors` again with the same scene, ambient time, player and motion flag to read animal positions. Preserve both calls and their order; this is an intentional compatibility exception to pure rendering.
12. Composite any scene transition using the existing 220 ms fade. Update bubble help, moving-state memory, sign help and camera/actor diagnostics in that order.
13. Schedule exactly one subsequent `requestAnimationFrame((t) => this.frame(t))` at the existing final call site.

`changeScene` preserves the luggage and boarding guards, station departure notification, actor/controller resets, transition snapshot, stand-up operation, scene selection, player/Panda placement, trail reset, input clear, art request and movement callback order. Art completion uses the existing generation check so a stale request cannot mark a newer scene ready.

Any extraction must retain this ownership and sequence. A subordinate function receives the existing owner or specific capabilities; it must not construct duplicate mutable state, advance a second clock, move work between the two animation-frame scheduling sites, or replace scene objects on lookup.
