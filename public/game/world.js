// Compatibility API for existing game, server, save, and tooling imports.
import { scenes } from "../worlds/catalog.js";
import { OUTDOOR_SCALE, townScale } from "../worlds/suzhou/manifest.js";
import { createStateUpgrader } from "../state/migrations/world.js";

export { scenes };
export { landmark } from "../worlds/suzhou/manifest.js";
export { circleHitsRect, pointInPolygon } from "../shared/geometry/collision.js";
export { canStand, interactionPoint, move, nearest, districtAt } from "../engine/navigation.js";
export const MAP_VERSION = 14;
export const upgradeState = createStateUpgrader({ scenes, MAP_VERSION, OUTDOOR_SCALE, townScale });
