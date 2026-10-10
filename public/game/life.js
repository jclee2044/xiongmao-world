import { roamingZones } from "../data/roaming-zones.js";
import { visitors } from "../data/content.js";
import { canStand, interactionPoint, move, pointInPolygon } from "./world.js";

const populations = new WeakMap();
// Independent pseudo-random schedules keep neighbors from stopping in unison.
// Only simulation time advances them, so redraws and paused play are stable.
function randomPauseValue(actor) {
  actor.pauseSeed ??= [...actor.id].reduce((seed, c) => Math.imul(seed, 31) + c.charCodeAt(0) | 0, 17);
  actor.pauseSeed = (Math.imul(actor.pauseSeed, 1664525) + 1013904223) >>> 0;
  return actor.pauseSeed / 4294967296;
}
function resting(actor, dt, motion) {
  if (!motion || dt === 0) return (actor.pauseRemaining || 0) > 0;
  actor.pauseIn ??= 5 + randomPauseValue(actor) * 6;
  if (actor.pauseRemaining > 0) {
    actor.pauseRemaining = Math.max(0, actor.pauseRemaining - dt);
    return actor.pauseRemaining > 0;
  }
  actor.pauseIn -= dt;
  // A bunny finishes its current hop before settling into its crouched pose.
  if (actor.pauseIn <= 0 && !actor.jump) {
    actor.pauseRemaining = 1.2 + randomPauseValue(actor) * 2.4;
    actor.pauseIn = 5 + randomPauseValue(actor) * 6;
    return true;
  }
  return false;
}
// A small circuit inside the assigned box gives two-dimensional movement.
// Validate entire segments, not just destinations, before choosing a leg.
function walkingZone(start, zone) {
  const inset = 24;
  const x = zone.x + inset, y = zone.y + inset;
  const w = zone.w - inset * 2, h = zone.h - inset * 2;
  return { zone, patrol: [
    { x: x + w, y: y + h * 0.25 },
    { x: x + w * 0.75, y: y + h },
    { x, y: y + h * 0.75 },
    { x: x + w * 0.25, y },
    { x: start.x, y: start.y },
  ], waypoint: 0, target: null };
}
function nextPatrolTarget(scene, actor) {
  for (let attempt = 0; attempt < actor.patrol.length; attempt++) {
    const target = actor.patrol[actor.waypoint++ % actor.patrol.length];
    const z = actor.zone;
    if (target.x < z.x + 22 || target.x > z.x + z.w - 22 ||
      target.y < z.y + 22 || target.y > z.y + z.h - 22) continue;
    const length = Math.hypot(target.x - actor.x, target.y - actor.y);
    if (length < 5) continue;
    const steps = Math.ceil(length / 6);
    let clear = true;
    for (let step = 1; step <= steps; step++) {
      if (!canStand(scene, actor.x + (target.x - actor.x) * step / steps,
        actor.y + (target.y - actor.y) * step / steps, 22)) {
        clear = false;
        break;
      }
    }
    if (clear) return target;
  }
  return { x: actor.x, y: actor.y };
}
function swimmingRange(lake, origin) {
  if (!lake?.polygon) return { center: origin.x, radius: 48 };
  const clear = (x) => [-28, 0, 28].every((dx) =>
    [-28, 0, 28].every((dy) => pointInPolygon(x + dx, origin.y + dy, lake.polygon)));
  const edge = (direction) => {
    let x = origin.x;
    for (let step = 6; step < lake.w; step += 6) {
      const next = origin.x + direction * step;
      if (!clear(next)) break;
      x = next;
    }
    return x;
  };
  const left = edge(-1), right = edge(1);
  return { center: (left + right) / 2, radius: (right - left) / 2 };
}
function build(scene) {
  const zones = roamingZones(scene);
  const lake = scene.groundZones?.find((z) => z.type === "lake");
  const animals = scene.interactables
    .filter((o) => o.type === "animal")
    .map((o, i) => {
      const origin =
        o.animal === "duck" && lake
          ? {
              x: o.x * 0.75 + (lake.x + lake.w / 2) * 0.25,
              y: o.y * 0.75 + (lake.y + lake.h / 2) * 0.25,
            }
          : interactionPoint(o);
      const swim = o.animal === "duck" ? swimmingRange(lake, origin) : null;
      return {
        ...origin,
        ...(swim
          ? { swim, x: swim.center + Math.sin(i * 2.7) * swim.radius }
          : {}),
        origin,
        id: o.id,
        type: "animal",
        animal: o.animal,
        phase: i * 2.7,
        distance: 0,
        facing: 1,
        speed: o.animal === "rabbit" ? 35 : 23,
        swimTime: 0,
        ...(o.id === "courtyard-cat" && zones[o.id]
          ? { ...walkingZone(origin, zones[o.id]), speed: 30 }
          : {}),
        ...(o.animal === "rabbit"
          ? { roam: o.roam || { w: 96, h: 36 }, rest: 0.25, hop: 0, waypoint: 0 }
          : {}),
      };
    });
  // Passersby use clear lane centerlines; conversation neighbors stay available.
  const lanes =
    scene.strolls ||
    (scene.paths || []).filter((_, i) => [0, 2, 4, 5, 7, 8].includes(i));
  const walkers = lanes
    .filter((p) => p.points.length > 1)
    .map((p, i) => {
      const a = p.points[0],
        b = p.points[1];
      const start = {
        x: a[0] + (b[0] - a[0]) * 0.15,
        y: a[1] + (b[1] - a[1]) * 0.15,
      };
      return {
        ...visitors[i],
        name: visitors[i].name,
        dialogueId: visitors[i].id,
        ...start,
        origin: start,
        ...walkingZone(start, zones[`visitor-${i}`] || { x: start.x - 60, y: start.y - 60, w: 120, h: 120 }),
        type: "passerby",
        id: `visitor-${i}`,
        appearance: visitors[i].appearance,
        phase: i,
        distance: 0,
        facing: 1,
        speed: 38 + i * 3,
      };
    })
    .filter((o) => canStand(scene, o.x, o.y));
  const birds = (scene.paths || []).slice(0, 3).map((p, i) => ({
    id: `sparrow-${i}`,
    type: "animal",
    animal: "bird",
    phase: i,
    origin: { x: p.points[0][0] + 120, y: p.points[0][1] - 95 },
    distance: 0,
    facing: 1,
  }));
  return {
    actors: [
      ...animals,
      ...walkers,
      ...birds,
      ...scene.interactables
        .filter((o) => ["kid-one", "kid-two", "lin"].includes(o.id))
        .map((o, i) => ({
          ...o,
          type: "passerby",
          origin: { x: o.x, y: o.y },
          ...walkingZone(o, zones[o.id]),
          distance: 0,
          facing: 1,
          speed: 48,
          phase: i,
          bubble:
            o.id === "lin" ? "去河旁边走走吧。" : i ? "接住！" : "一、二、三！",
        })),
    ],
    last: null,
  };
}
// Each hop has one destination and one clock for travel, height and pose.
// Check the whole segment before takeoff so collisions never cause sliding
// or an abrupt turn in midair.
function hopRabbit(scene, o, dt, player, motion) {
  if (motion && dt > 0) {
    if (!o.jump) {
      o.rest = Math.max(0, o.rest - dt);
      if (o.rest === 0 && Math.hypot(o.x - player.x, o.y - player.y) > 75) {
        const angle = o.waypoint * 0.65 + o.phase;
        const dx = o.origin.x + Math.cos(angle) * o.roam.w / 2 - o.x;
        const dy = o.origin.y + Math.sin(angle) * o.roam.h / 2 - o.y;
        const distance = Math.hypot(dx, dy);
        const ratio = Math.min(1, 42 / Math.max(distance, 0.001));
        const end = { x: o.x + dx * ratio, y: o.y + dy * ratio };
        const clear = Array.from({ length: 12 }, (_, i) => (i + 1) / 12)
          .every((t) => canStand(scene, o.x + (end.x - o.x) * t, o.y + (end.y - o.y) * t));
        if (distance < 43 || !clear) o.waypoint++;
        if (clear && distance > 2) {
          o.jump = { x: o.x, y: o.y, end, elapsed: 0 };
          if (Math.abs(end.x - o.x) > 2) o.facing = Math.sign(end.x - o.x);
        } else o.rest = 0.35;
      }
    }
    if (o.jump) {
      const jump = o.jump;
      jump.elapsed += dt;
      const t = Math.min(1, jump.elapsed / 0.6);
      const ease = t * t * (3 - 2 * t);
      const x = jump.x + (jump.end.x - jump.x) * ease;
      const y = jump.y + (jump.end.y - jump.y) * ease;
      o.distance += Math.hypot(x - o.x, y - o.y);
      Object.assign(o, { x, y, hop: Math.sin(t * Math.PI) ** 2 });
      if (t === 1) {
        o.jump = null;
        o.hop = 0;
        o.rest = 0.35;
      }
    }
  }
  return { ...o, moving: Boolean(motion && o.jump), hop: motion ? o.hop : 0 };
}
export function lifeActors(scene, time, player, motion = true) {
  if (scene.interior || scene.id === "home") return [];
  if (!populations.has(scene)) populations.set(scene, build(scene));
  const population = populations.get(scene),
    dt = Math.max(0, Math.min(0.15, time - (population.last ?? time)));
  population.last = time;
  return population.actors.map((o) => {
    const paused = (o.type === "passerby" || o.id === "courtyard-cat" || ["duck", "rabbit"].includes(o.animal))
      && resting(o, dt, motion);
    if (o.animal === "bird") {
      const phase = motion ? time * 0.45 + o.phase : o.phase;
      return {
        ...o,
        x: o.origin.x + Math.sin(phase) * 100,
        y: o.origin.y + Math.cos(phase) * 25,
        flying: motion,
        distance: time * 45,
      };
    }
    if (o.animal === "duck") {
      if (motion && !paused) o.swimTime += dt;
      const angle = o.swimTime * (23 / Math.max(1, o.swim.radius)) + o.phase;
      const previousX = o.x;
      o.x = o.swim.center + Math.sin(angle) * o.swim.radius;
      o.distance += Math.abs(o.x - previousX);
      o.facing = Math.cos(angle) >= 0 ? 1 : -1;
      if (dt > 0) o.moving = motion && o.x !== previousX;
      return { ...o, moving: Boolean(motion && o.moving) };
    }
    if (o.animal === "rabbit") return hopRabbit(scene, o, dt, player, motion && !paused);
    const before = o.distance;
    if (motion && !paused && dt > 0 && Math.hypot(o.x - player.x, o.y - player.y) > 75) {
      let target;
      if (o.patrol) {
        if (!o.target || Math.hypot(o.x - o.target.x, o.y - o.target.y) < 1)
          o.target = nextPatrolTarget(scene, o);
        target = o.target;
      } else
        target = {
          x: o.origin.x + Math.sin(time * 0.23 + o.phase) * 48,
          y: o.origin.y + Math.cos(time * 0.23 + o.phase) * 18,
        };
      const dx = target.x - o.x,
        dy = target.y - o.y,
        d = Math.hypot(dx, dy);
      if (d > (o.animal === "cat" ? 0.001 : 0.5)) {
        const speed = o.id === "courtyard-cat" ? o.speed * Math.min(1, d / 18) : o.speed;
        const step = Math.min(d, speed * dt),
          previous = { x: o.x, y: o.y };
        const next = move(scene, o, (dx / d) * step, (dy / d) * step);
        o.x = next.x;
        o.y = next.y;
        o.distance += Math.hypot(o.x - previous.x, o.y - previous.y);
        if (o.animal === "cat" && !o.patrol) {
          const heading = Math.cos(time * 0.23 + o.phase);
          if (Math.abs(heading) > 0.15) o.facing = Math.sign(heading);
        } else if (Math.abs(dx) > 0.5) o.facing = Math.sign(dx);
      }
    }
    if (o.animal === "cat" && o.distance > before) o.lastMoved = time;
    if (dt > 0)
      o.moving =
        motion && !paused &&
        (o.distance > before ||
          (o.animal === "cat" && time - (o.lastMoved ?? -Infinity) < 0.3));
    return {
      ...o,
      ...(o.type === "passerby" ? { approachX: o.x, approachY: o.y + 30 } : {}),
      moving: Boolean(motion && o.moving),
    };
  });
}
export function paintLeaves(ctx, scene, view, time, motion) {
  if (!motion || scene.id !== "shanghai") return 0;
  let count = 0;
  for (const tree of scene.scenery.filter(
    (o) => o.type === "tree" || o.nature === "bamboo",
  )) {
    if (
      tree.x < view.x - 100 ||
      tree.x > view.x + view.w + 100 ||
      tree.y < view.y ||
      tree.y - tree.h > view.y + view.h
    )
      continue;
    for (let i = 0; i < 3; i++) {
      const progress = (time * 0.06 + i / 3 + tree.x * 0.001) % 1;
      const x = tree.x + Math.sin(time * 0.4 + i + tree.x) * 32 + (i - 1) * 38;
      const y = tree.y - tree.h * 0.55 + progress * tree.h * 0.5;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(time + i) * 0.8);
      ctx.globalAlpha = Math.sin(progress * Math.PI) * 0.7;
      ctx.fillStyle = i % 2 ? "#b6a45c" : "#d2b886";
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 2.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      count++;
    }
  }
  return count;
}
