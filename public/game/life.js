import { visitors } from "../data/content.js";
import { canStand, interactionPoint, move } from "./world.js";

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
        ...(o.animal === "duck"
          ? { x: origin.x + Math.sin(i * 2.7) * 48 }
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
        ...visitors[i],
        name: visitors[i].name,
        dialogueId: visitors[i].id,
        ...start,
        origin: start,
        end,
        target: end,
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
          end: {
            x: o.x + (o.id === "lin" ? 105 : 70),
            y: o.y + (o.id === "lin" ? 0 : 30),
          },
          target: {
            x: o.x + (o.id === "lin" ? 105 : 70),
            y: o.y + (o.id === "lin" ? 0 : 30),
          },
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
export function lifeActors(scene, time, player, motion = true) {
  if (scene.interior || scene.id === "home") return [];
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
    if (o.animal === "duck") {
      if (motion) o.swimTime += dt;
      const angle = o.swimTime * 0.35 + o.phase;
      const previousX = o.x;
      o.x = o.origin.x + Math.sin(angle) * 48;
      o.distance += Math.abs(o.x - previousX);
      o.facing = Math.cos(angle) >= 0 ? 1 : -1;
      if (dt > 0) o.moving = motion && o.x !== previousX;
      return { ...o, moving: Boolean(motion && o.moving) };
    }
    const before = o.distance;
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
      if (d > (o.animal === "cat" ? 0.001 : 0.5)) {
        const hopPhase = (time * 1.4 + o.phase) % 1;
        const hopSpeed =
          o.animal === "rabbit" ? (hopPhase < 0.58 ? 2.1 : 0) : 1;
        const step = Math.min(d, o.speed * hopSpeed * dt),
          previous = { x: o.x, y: o.y };
        const next = move(scene, o, (dx / d) * step, (dy / d) * step);
        o.x = next.x;
        o.y = next.y;
        o.distance += Math.hypot(o.x - previous.x, o.y - previous.y);
        if (o.animal === "cat") {
          const heading = Math.cos(time * 0.23 + o.phase);
          if (Math.abs(heading) > 0.15) o.facing = Math.sign(heading);
        } else if (Math.abs(dx) > 0.5) o.facing = Math.sign(dx);
      }
    }
    if (o.animal === "cat" && o.distance > before) o.lastMoved = time;
    if (dt > 0)
      o.moving =
        motion &&
        (o.distance > before ||
          (o.animal === "cat" && time - (o.lastMoved ?? -Infinity) < 0.3));
    return {
      ...o,
      ...(o.type === "passerby" ? { approachX: o.x, approachY: o.y + 30 } : {}),
      moving: Boolean(motion && o.moving),
      hop:
        o.animal === "rabbit" && motion
          ? Math.max(
              0,
              Math.sin(
                Math.min(1, ((time * 1.4 + o.phase) % 1) / 0.58) * Math.PI,
              ),
            )
          : 0,
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
