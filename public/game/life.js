import { canStand, interactionPoint, move, pointInPolygon } from "./world.js";

const populations = new WeakMap();
function build(scene) {
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
      return {
        ...origin,
        origin,
        id: o.id,
        type: "animal",
        animal: o.animal,
        phase: i * 2.7,
        distance: 0,
        facing: 1,
        speed: o.animal === "rabbit" ? 35 : 23,
      };
    });
  // Passersby use clear lane centerlines; conversation neighbors stay available.
  const walkers = (scene.paths || [])
    .filter((p) => p.points.length > 1)
    .filter((_, i) => [0, 2, 4, 5, 7, 8].includes(i))
    .map((p, i) => {
      const a = p.points[0],
        b = p.points[1],
        length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const start = {
        x: a[0] + (b[0] - a[0]) * 0.15,
        y: a[1] + (b[1] - a[1]) * 0.15,
      };
      const fraction = Math.min(0.8, 0.15 + 290 / length);
      const end = {
        x: a[0] + (b[0] - a[0]) * fraction,
        y: a[1] + (b[1] - a[1]) * fraction,
      };
      return {
        ...start,
        origin: start,
        end,
        target: end,
        type: "passerby",
        id: `visitor-${i}`,
        appearance: ["hao", "lan", "wei", "an", "bo", "qiao"][i],
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
  return { actors: [...animals, ...walkers, ...birds], last: null };
}
export function lifeActors(scene, time, player, motion = true) {
  if (scene.id !== "shanghai") return [];
  if (!populations.has(scene)) populations.set(scene, build(scene));
  const population = populations.get(scene),
    dt = Math.max(0, Math.min(0.15, time - (population.last ?? time)));
  population.last = time;
  return population.actors.map((o) => {
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
    if (motion && dt > 0 && Math.hypot(o.x - player.x, o.y - player.y) > 75) {
      let target;
      if (o.type === "passerby") {
        if (Math.hypot(o.x - o.target.x, o.y - o.target.y) < 5)
          o.target = o.target === o.end ? o.origin : o.end;
        target = o.target;
      } else
        target = {
          x: o.origin.x + Math.sin(time * 0.23 + o.phase) * 48,
          y: o.origin.y + Math.cos(time * 0.23 + o.phase) * 18,
        };
      const dx = target.x - o.x,
        dy = target.y - o.y,
        d = Math.hypot(dx, dy);
      if (d > 0.5) {
        const step = Math.min(d, o.speed * dt),
          previous = { x: o.x, y: o.y };
        const next =
          o.animal === "duck"
            ? { x: o.x + (dx / d) * step, y: o.y + (dy / d) * step }
            : move(scene, o, (dx / d) * step, (dy / d) * step);
        const lake = scene.groundZones?.find((z) => z.type === "lake");
        if (
          o.animal !== "duck" ||
          !lake ||
          pointInPolygon(next.x, next.y, lake.polygon)
        ) {
          o.x = next.x;
          o.y = next.y;
        }
        o.distance += Math.hypot(o.x - previous.x, o.y - previous.y);
        if (Math.abs(dx) > 0.5) o.facing = Math.sign(dx);
      }
    }
    return {
      ...o,
      moving:
        motion && dt > 0 && Math.hypot(o.x - player.x, o.y - player.y) > 75,
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
