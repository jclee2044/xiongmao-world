import { world as suzhou } from "./suzhou/manifest.js";

// Explicit registration keeps import and scene order visible. Scene values are
// the original objects: never reconstruct them during lookup or a frame.
export const worlds = { suzhou };
export const scenes = Object.assign({}, ...Object.values(worlds).map(world => world.scenes));
