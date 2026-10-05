import { scenes, move, nearest, canStand, interactionPoint } from "./world.js";
import { draw } from "./render.js";
import { pathTo } from "./pathfinding.js";
import { actorSizes } from "./appearance.js";
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
    this.panda = { x: this.player.x + 130, y: this.player.y - 15 };
    this.trail = [];
    this.route = [];
    this.facing = 1;
    this.walkDistance = 0;
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
      const target =
        this.scene.interactables.find(
          (o) =>
            o.type === "npc" &&
            x > (o.artX ?? o.x) - 80 &&
            x < (o.artX ?? o.x) + 80 &&
            y > (o.artY ?? o.y) - (o.artHeight || actorSizes[o.id]) &&
            y < (o.artY ?? o.y),
        ) || nearest(this.scene, { x, y }, this.getFound());
      if (
        target &&
        Math.hypot(target.x - this.player.x, target.y - this.player.y) < 100
      )
        this.onInteract(target);
      else this.walkTo(target || { x, y });
    });
    requestAnimationFrame((t) => this.frame(t));
  }
  clear() {
    this.keys.clear();
    this.route = [];
  }
  walkTo(point) {
    this.route = pathTo(this.scene, this.player, interactionPoint(point));
    return this.route.length > 0;
  }
  pause(value) {
    if (value || this.paused !== value) this.clear();
    this.paused = value;
    this.canvas.dataset.paused = String(value);
  }
  changeScene(id, position) {
    if (
      this.camera &&
      this.scene.id !== id &&
      this.getSettings().motion !== false
    ) {
      const image = document.createElement("canvas");
      image.width = this.canvas.width;
      image.height = this.canvas.height;
      image.getContext("2d").drawImage(this.canvas, 0, 0);
      this.transition = { image, start: null };
    } else this.transition = null;
    this.scene = scenes[id] || scenes.shanghai;
    this.player =
      position && canStand(this.scene, position.x, position.y)
        ? { ...position }
        : { ...this.scene.spawn };
    this.panda = [
      { x: this.player.x + 130, y: this.player.y - 15 },
      { x: this.player.x - 100, y: this.player.y + 10 },
      this.player,
    ].find((p) => canStand(this.scene, p.x, p.y));
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
    const dt = Math.min(0.1, (t - this.last) / 1000 || 0);
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
      if (dx || dy) this.route = [];
      while (
        this.route.length &&
        Math.hypot(
          this.route[0].x - this.player.x,
          this.route[0].y - this.player.y,
        ) < 4
      )
        this.route.shift();
      if (this.route.length) {
        const destination = this.route[0];
        const d = Math.hypot(
          destination.x - this.player.x,
          destination.y - this.player.y,
        );
        dx = (destination.x - this.player.x) / d;
        dy = (destination.y - this.player.y) / d;
      }
      const len = Math.hypot(dx, dy),
        speed = this.getSettings().pace === "slow" ? 230 : 330;
      if (len) {
        if (Math.abs(dx) > 0.1) this.facing = Math.sign(dx);
        const step = Math.min(
          speed * dt,
          this.route.length
            ? Math.hypot(
                this.route[0].x - this.player.x,
                this.route[0].y - this.player.y,
              )
            : Infinity,
        );
        const previous = this.player;
        this.player = move(
          this.scene,
          this.player,
          (dx / len) * step,
          (dy / len) * step,
        );
        moving =
          Math.hypot(this.player.x - previous.x, this.player.y - previous.y) >
          0.01;
        if (moving) {
          this.walkDistance += Math.hypot(
            this.player.x - previous.x,
            this.player.y - previous.y,
          );
          this.trail.push({ ...this.player });
          if (this.trail.length > 240) this.trail.shift();
          if (t - (this.lastMove || 0) > 500) {
            this.onMove?.(this.scene.id, this.player);
            this.lastMove = t;
          }
        } else this.route = [];
      }
      // Follow the player's actual traversable route, rather than cutting through buildings.
      while (
        this.trail.length &&
        Math.hypot(
          this.player.x - this.trail[0].x,
          this.player.y - this.trail[0].y,
        ) > 125
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
    const pandaMoving =
      Math.hypot(
        this.panda.x - previousPanda.x,
        this.panda.y - previousPanda.y,
      ) > 0.05;
    const settings = this.getSettings(),
      found = this.getFound(),
      paintKey = JSON.stringify([
        this.scene.id,
        this.player,
        this.panda,
        this.facing,
        settings,
        found,
        near?.id,
        this.route.at(-1),
        this.canvas.clientWidth,
        this.canvas.clientHeight,
        window.devicePixelRatio,
      ]);
    const ambientFrame =
      !this.paused &&
      settings.motion !== false &&
      t - (this.lastPaint || 0) > 90;
    if (
      moving ||
      pandaMoving ||
      this.animatedLastFrame ||
      this.transition ||
      ambientFrame ||
      paintKey !== this.paintKey ||
      this.canvas.dataset.artReady !== "true"
    ) {
      this.camera = draw(
        this.ctx,
        this.canvas,
        this.scene,
        this.player,
        this.panda,
        {
          time: t / 1000,
          walkDistance: this.walkDistance,
          animate: !this.paused && settings.motion !== false,
          moving,
          facing: this.facing,
          route: this.route,
          pandaMoving,
          settings,
          found,
          near,
        },
      );
      this.paintKey = paintKey;
      this.lastPaint = t;
    }
    if (this.transition) {
      this.transition.start ??= t;
      const progress = Math.min(1, (t - this.transition.start) / 220);
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.globalAlpha = 1 - progress;
      this.ctx.drawImage(
        this.transition.image,
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
      this.ctx.restore();
      if (progress === 1) this.transition = null;
    }
    this.animatedLastFrame = moving || pandaMoving;
    Object.assign(this.canvas.dataset, {
      camX: String(this.camera.camX),
      camY: String(this.camera.camY),
      scale: String(this.camera.scale),
      ox: String(this.camera.ox),
      oy: String(this.camera.oy),
      routeLength: String(this.route.length),
    });
    requestAnimationFrame((t) => this.frame(t));
  }
}
