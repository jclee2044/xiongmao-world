import { canStand, move } from "../engine/navigation.js";
import { pathTo } from "./pathfinding.js";
// Follow the leader's actual trail. A small spatial gap is independent of frame
// rate; pathfinding is used only for initial joining or recovery, never each frame.
export class Escort {
  constructor(scene, actor, leader, gap = 62) {
    this.scene = scene;
    this.actor = actor;
    this.gap = gap;
    this.points = pathTo(scene, actor, leader);
    this.last = { x: leader.x, y: leader.y };
    this.previousLeader = { ...this.last };
    this.retry = 0;
  }
  update(leader, dt) {
    const g = this.actor;
    const speed =
      dt > 0
        ? Math.max(
            315,
            Math.min(
              400,
              (Math.hypot(
                leader.x - this.previousLeader.x,
                leader.y - this.previousLeader.y,
              ) /
                dt) *
                1.1,
            ),
          )
        : 315;
    this.previousLeader = { x: leader.x, y: leader.y };
    if (Math.hypot(leader.x - this.last.x, leader.y - this.last.y) >= 4) {
      this.points.push({ x: leader.x, y: leader.y });
      this.last = { ...leader };
    }
    if (this.points.length > 2000)
      this.points.splice(0, this.points.length - 2000);
    let length = 0,
      prev = g;
    for (const p of this.points) {
      length += Math.hypot(p.x - prev.x, p.y - prev.y);
      prev = p;
    }
    let remaining = Math.min(
      Math.max(0, length - this.gap),
      speed * Math.max(0, dt),
    );
    g.moving = false;
    while (remaining > 0.001 && this.points.length) {
      const p = this.points[0],
        d = Math.hypot(p.x - g.x, p.y - g.y);
      if (d < 0.5) {
        this.points.shift();
        continue;
      }
      const step = Math.min(d, remaining),
        next = move(
          this.scene,
          g,
          ((p.x - g.x) / d) * step,
          ((p.y - g.y) / d) * step,
        );
      const traveled = Math.hypot(next.x - g.x, next.y - g.y);
      if (traveled < 0.01) break;
      g.distance = (g.distance || 0) + traveled;
      g.moving = true;
      if (Math.abs(next.x - g.x) > 0.1) g.facing = Math.sign(next.x - g.x);
      Object.assign(g, next);
      remaining -= step;
    }
    this.retry -= dt;
    if (!g.moving && length > this.gap + 12 && this.retry <= 0) {
      this.points = pathTo(this.scene, g, leader);
      this.retry = 1;
    }
  }
}
export function escortSpawn(scene, leader, facing = 1) {
  return [
    { x: leader.x - facing * 48, y: leader.y },
    { x: leader.x, y: leader.y + 48 },
    { x: leader.x, y: leader.y - 48 },
    leader,
  ].find((p) => canStand(scene, p.x, p.y));
}
