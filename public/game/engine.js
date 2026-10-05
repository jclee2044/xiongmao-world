import { scenes, move, nearest } from "./world.js";
import { draw } from "./render.js";
export class World {
  constructor(
    canvas,
    {
      onNear,
      onInteract,
      onMove,
      getSettings = () => ({}),
      getFound = () => false,
    },
  ) {
    Object.assign(this, {
      canvas,
      onNear,
      onInteract,
      onMove,
      getSettings,
      getFound,
    });
    this.ctx = canvas.getContext("2d");
    this.keys = new Set();
    this.paused = true;
    this.scene = scenes.shanghai;
    this.player = { ...this.scene.spawn };
    this.panda = { x: this.player.x - 45, y: this.player.y + 10 };
    this.trail = [];
    this.last = 0;
    const editable = () =>
      /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
    window.addEventListener("keydown", (e) => {
      if (editable() || this.paused) return;
      const k = e.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          "e",
        ].includes(k)
      ) {
        e.preventDefault();
        this.keys.add(k);
        if (k === "e" && !e.repeat) this.interact();
      }
    });
    window.addEventListener("keyup", (e) =>
      this.keys.delete(e.key.toLowerCase()),
    );
    window.addEventListener("blur", () => this.clear());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.clear();
    });
    for (const button of document.querySelectorAll("[data-direction]")) {
      const key = button.dataset.direction;
      button.addEventListener("pointerdown", (e) => {
        if (this.paused) return;
        e.preventDefault();
        button.setPointerCapture(e.pointerId);
        this.keys.add(key);
      });
      for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
        button.addEventListener(type, () => this.keys.delete(key));
    }
    canvas.addEventListener("pointerdown", (e) => {
      if (this.paused || !this.camera) return;
      const r = canvas.getBoundingClientRect(),
        c = this.camera;
      const x = (e.clientX - r.left) / c.scale + c.camX - c.ox,
        y = (e.clientY - r.top) / c.scale + c.camY - c.oy;
      const target = nearest(this.scene, { x, y }, this.getFound());
      if (
        target &&
        Math.hypot(target.x - this.player.x, target.y - this.player.y) < 100
      )
        this.interact();
      else this.destination = { x, y };
    });
    requestAnimationFrame((t) => this.frame(t));
  }
  clear() {
    this.keys.clear();
    this.destination = null;
  }
  pause(value) {
    this.paused = value;
    this.canvas.dataset.paused = String(value);
    this.clear();
  }
  changeScene(id, position) {
    this.scene = scenes[id] || scenes.shanghai;
    this.player =
      position && Number.isFinite(position.x) && Number.isFinite(position.y)
        ? { ...position }
        : { ...this.scene.spawn };
    this.panda = { x: this.player.x - 38, y: this.player.y + 12 };
    this.trail = [];
    this.clear();
    this.onMove?.(this.scene.id, this.player);
  }
  interact() {
    if (this.paused) return;
    const n = nearest(this.scene, this.player, this.getFound());
    if (n) this.onInteract(n);
  }
  frame(t) {
    const dt = Math.min(0.04, (t - this.last) / 1000 || 0);
    this.last = t;
    let moving = false;
    const previousPanda = this.panda;
    if (!this.paused) {
      let dx =
        Number(this.keys.has("d") || this.keys.has("arrowright")) -
        Number(this.keys.has("a") || this.keys.has("arrowleft"));
      let dy =
        Number(this.keys.has("s") || this.keys.has("arrowdown")) -
        Number(this.keys.has("w") || this.keys.has("arrowup"));
      if (dx || dy) this.destination = null;
      if (this.destination) {
        const d = Math.hypot(
          this.destination.x - this.player.x,
          this.destination.y - this.player.y,
        );
        if (d < 8) this.destination = null;
        else {
          dx = (this.destination.x - this.player.x) / d;
          dy = (this.destination.y - this.player.y) / d;
        }
      }
      const len = Math.hypot(dx, dy),
        speed = this.getSettings().pace === "slow" ? 115 : 165;
      if (len) {
        const previous = this.player;
        this.player = move(
          this.scene,
          this.player,
          (dx / len) * speed * dt,
          (dy / len) * speed * dt,
        );
        moving =
          Math.hypot(this.player.x - previous.x, this.player.y - previous.y) >
          0.01;
        if (moving) {
          this.trail.push({ ...this.player });
          if (this.trail.length > 240) this.trail.shift();
          if (t - (this.lastMove || 0) > 500) {
            this.onMove?.(this.scene.id, this.player);
            this.lastMove = t;
          }
        } else this.destination = null;
      }
      // Follow the player's actual traversable route, rather than cutting through buildings.
      while (
        this.trail.length &&
        Math.hypot(
          this.player.x - this.trail[0].x,
          this.player.y - this.trail[0].y,
        ) > 48
      ) {
        const target = this.trail[0],
          dist = Math.hypot(target.x - this.panda.x, target.y - this.panda.y),
          step = Math.min(dist, speed * 1.16 * dt);
        if (dist < 4) {
          this.trail.shift();
          continue;
        }
        this.panda = move(
          this.scene,
          this.panda,
          ((target.x - this.panda.x) / dist) * step,
          ((target.y - this.panda.y) / dist) * step,
        );
        break;
      }
    }
    if (this.wasMoving && !moving) this.onMove?.(this.scene.id, this.player);
    this.wasMoving = moving;
    const near = nearest(this.scene, this.player, this.getFound());
    if (this.nearId !== near?.id) {
      this.nearId = near?.id;
      this.onNear(near);
    }
    this.canvas.dataset.x = this.player.x.toFixed(1);
    this.canvas.dataset.y = this.player.y.toFixed(1);
    this.canvas.dataset.scene = this.scene.id;
    this.camera = draw(
      this.ctx,
      this.canvas,
      this.scene,
      this.player,
      this.panda,
      {
        time: t / 1000,
        moving,
        pandaMoving:
          Math.hypot(
            this.panda.x - previousPanda.x,
            this.panda.y - previousPanda.y,
          ) > 0.05,
        settings: this.getSettings(),
        found: this.getFound(),
        near,
      },
    );
    requestAnimationFrame((t) => this.frame(t));
  }
}
