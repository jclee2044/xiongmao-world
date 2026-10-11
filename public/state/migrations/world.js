import { validateAdventure } from "../../data/adventure.js";
import { stationGround, stationGroundForJourney, groundCheckpoint, GROUND_SCALE } from "../../data/station-interior.js";
import { stationWaiting, stationWaitingForJourney, waitingPoint, boardingBoundary } from "../../data/station-waiting.js";
import { stationPlatform } from "../../data/station-platform.js";
import { westBankX } from "../../data/town-layout.js";
import { canStand, interactionPoint } from "../../engine/navigation.js";

// Capture the stable catalog once; retain all historical branches and recursion.
export function createStateUpgrader({ scenes, MAP_VERSION, OUTDOOR_SCALE, townScale }) {
return function upgradeState(state) {
  // Only the station changed in v14. Keep town/interior positions and history;
  // old station coordinates belong to the replaced layout and arrive at the quay.
  if (state.mapVersion === 13)
    state = {
      ...state, mapVersion: MAP_VERSION,
      position: state.scene === "shantang" ? { ...scenes.shantang.spawn } : state.position,
    };
  // A save made inside the removed courtyard returns to its new open square.
  if (state.scene === "pingtan-room")
    state = {
      ...state,
      scene: "shanghai",
      mapVersion: MAP_VERSION,
      position: interactionPoint(
        scenes.shanghai.interactables.find((o) => o.id === "neighbors-south"),
      ),
    };
  if (state.mapVersion === 12)
    state = {
      ...state,
      mapVersion: MAP_VERSION,
      position:
        state.scene === "shanghai"
          ? {
              ...state.position,
              x: westBankX(state.position.x / townScale) * townScale,
            }
          : state.scene === "shantang" ? { ...scenes.shantang.spawn } : { ...state.position },
    };
  state = { ...state, adventure: validateAdventure(state.adventure) };
  if (state.mapVersion < 5)
    state = {
      ...state,
      settings:
        state.settings.pinyin || state.settings.translation
          ? { ...state.settings, pinyin: false, translation: false }
          : state.settings,
      ...(state.mapVersion === 4 && state.scene === "shanghai"
        ? {
            position: {
              x: state.position.x * 0.85,
              y: state.position.y * 0.85,
            },
          }
        : {}),
    };
  if (state.scene === stationPlatform.id && !state.adventure.stationJourney.boarding)
    state = { ...state, scene: stationWaiting.id, position: waitingPoint(1160, 370) };
  if (state.scene === stationWaiting.id && state.adventure.stationJourney.entry !== "ready")
    state = { ...state, scene: stationGround.id, position: { ...stationGround.spawn } };
  const scene = state.scene === stationGround.id
    ? stationGroundForJourney(state.adventure.stationJourney)
    : state.scene === stationWaiting.id ? stationWaitingForJourney(state.adventure.stationJourney)
    : scenes[state.scene] || scenes.shanghai;
  if (state.scene === stationWaiting.id && !state.adventure.stationJourney.boarding &&
      state.position?.x > boardingBoundary.west && state.position?.y > boardingBoundary.north)
    state = { ...state, position: waitingPoint(1160, 370) };
  if (state.scene === stationGround.id &&
      !["bags", "screened", "ready"].includes(state.adventure.stationJourney.entry) &&
      state.position?.y < groundCheckpoint.lane.y * GROUND_SCALE)
    state = { ...state, position: { ...scene.spawn } };
  if (state.mapVersion === 2 && MAP_VERSION === 3) {
    return upgradeState({
      ...state,
      mapVersion: MAP_VERSION,
      position:
        state.scene === "shanghai"
          ? {
              x: state.position?.x * OUTDOOR_SCALE,
              y: state.position?.y * OUTDOOR_SCALE,
            }
          : { ...state.position },
    });
  }
  if (state.mapVersion === MAP_VERSION) {
    if (canStand(scene, state.position?.x, state.position?.y)) return state;
    // A furniture correction should move an existing learner onto nearby floor,
    // without discarding where they were exploring or any progress.
    if (
      Number.isFinite(state.position?.x) &&
      Number.isFinite(state.position?.y)
    ) {
      for (let distance = 24; distance <= 512; distance += 16) {
        for (let i = 0; i < 32; i++) {
          const x = state.position.x + Math.cos((i * Math.PI) / 16) * distance,
            y = state.position.y + Math.sin((i * Math.PI) / 16) * distance;
          if (canStand(scene, x, y)) return { ...state, position: { x, y } };
        }
      }
    }
  }
  return {
    ...state,
    mapVersion: MAP_VERSION,
    position: { ...scene.spawn },
  };
};
}
