import { stationErrandNpcs } from "../../data/station-errands.js";
import { npcs as suzhou, visitors, extraNeighbors } from "./suzhou.js";

export const casts = { suzhou: { ...suzhou, ...stationErrandNpcs } };
export const npcs = Object.assign({}, ...Object.values(casts));
export { visitors, extraNeighbors };
