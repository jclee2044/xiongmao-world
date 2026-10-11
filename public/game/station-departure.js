import { XIAOCHENG } from "../data/station-departure.js";
import { STATION_SCALE } from "../data/station-exterior.js";
import { pathTo } from "./pathfinding.js";
import { canStand } from "./world.js";

const routes = new WeakMap();
export const XIAOCHENG_SPEED = 145;
export function stationDepartureRoute(scene) {
  if (routes.has(scene)) return routes.get(scene);
  const start = scene.interactables.find((o) => o.id === XIAOCHENG);
  const entrance = scene.interactables.find((o) => o.id === "station-entrance");
  if (!start || !entrance) return null;
  const outdoor = pathTo(scene, start, entrance);
  if (
    !outdoor.length ||
    Math.hypot(outdoor.at(-1).x - entrance.x, outdoor.at(-1).y - entrance.y) > 1
  )
    return null;
  // The final, NPC-only leg enters the painted public vestibule. It does not
  // open the unfinished interior or change the player's collision boundary.
  const inside = {
    x: entrance.x + 26 * STATION_SCALE,
    y: entrance.y - 64 * STATION_SCALE,
  };
  const trail = [start, ...outdoor];
  const smooth = [start];
  const clear = (a, b) => {
    const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2);
    for (let step = 1; step <= steps; step++)
      if (
        !canStand(
          scene,
          a.x + ((b.x - a.x) * step) / steps,
          a.y + ((b.y - a.y) * step) / steps,
        )
      )
        return false;
    return true;
  };
  for (let index = 0; index < trail.length - 1;) {
    let next = trail.length - 1;
    while (next > index + 1 && !clear(trail[index], trail[next])) next--;
    smooth.push(trail[next]);
    index = next;
  }
  const points = [...smooth, inside].map(({ x, y }) => ({ x, y }));
  const distances = [0];
  for (let i = 1; i < points.length; i++)
    distances.push(
      distances[i - 1] +
        Math.hypot(
          points[i].x - points[i - 1].x,
          points[i].y - points[i - 1].y,
        ),
    );
  const route = {
    points,
    distances,
    entryDistance: distances.at(-2),
    length: distances.at(-1),
  };
  routes.set(scene, route);
  return route;
}

export function stationDeparturePose(scene, distance) {
  const route = stationDepartureRoute(scene);
  if (!route || distance >= route.length) return null;
  distance = Math.max(0, distance);
  const index = route.distances.findIndex((d, i) => i > 0 && d > distance);
  const from = route.points[index - 1],
    to = route.points[index];
  const progress =
    (distance - route.distances[index - 1]) /
    (route.distances[index] - route.distances[index - 1]);
  const entering = distance > route.entryDistance;
  const entryProgress = entering
    ? (distance - route.entryDistance) / (route.length - route.entryDistance)
    : 0;
  const dx = to.x - from.x,
    dy = to.y - from.y;
  return {
    ...scene.interactables.find((o) => o.id === XIAOCHENG),
    x: from.x + dx * progress,
    y: from.y + dy * progress,
    bubbles: null,
    departing: true,
    moving: true,
    distance,
    facing: dx < 0 ? -1 : 1,
    walkDirection: entering || dy < -Math.abs(dx) * 0.45 ? "away" : "right",
    // Fade only once he is well through the doorway, not out on the forecourt.
    opacity: 1 - Math.max(0, (entryProgress - 0.5) / 0.5),
  };
}

export class StationDeparture {
  constructor(scene, distance = 0) {
    this.scene = scene;
    this.route = stationDepartureRoute(scene);
    this.distance = distance;
    this.savedDistance = distance;
  }
  update(dt, save) {
    if (!this.route) return null;
    this.distance = Math.min(
      this.route.length,
      this.distance + Math.max(0, dt) * XIAOCHENG_SPEED,
    );
    const entered = this.distance >= this.route.length;
    if (entered || this.distance - this.savedDistance >= XIAOCHENG_SPEED) {
      save(entered ? "entered" : "walking", this.distance);
      this.savedDistance = this.distance;
    }
    return stationDeparturePose(this.scene, this.distance);
  }
}
