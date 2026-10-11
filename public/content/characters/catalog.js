import { npcs as suzhou, visitors, extraNeighbors } from "./suzhou.js";

export const casts = { suzhou };
export const npcs = Object.assign({}, ...Object.values(casts));
export { visitors, extraNeighbors };
