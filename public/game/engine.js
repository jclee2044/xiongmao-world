import { scenes, move, nearest, canStand, interactionPoint } from "./world.js";
import { draw } from "./render.js";
import { pathTo } from "./pathfinding.js";
import { actorSizes } from "./appearance.js";
import { lifeActors } from "./life.js";
import artBounds from "../data/art-bounds.js";
const animalHeights = { cat: 64, duck: 54, rabbit: 58 };
export class World {
  constructor(
    canvas,
    {
      onNear,
      onInteract,
      onMove,
      getSettings = () => ({}),
      getFound = () => false,
      getAdventure = () => ({}),
      onGuestArrive = () => {},
    },
  ) {
    Object.assign(this, {
      canvas,
      onNear,
      onInteract,
      onMove,
      getSettings,
      getFound,
      getAdventure,
      onGuestArrive,
    });
    this.ctx = canvas.getContext("2d");
    this.keys = new Set();
    this.paused = true;
    this.scene = scenes.shanghai;
    this.player = { ...this.scene.spawn };
    this.panda = { x: this.player.x + 65, y: this.player.y - 15 };
    this.trail = [];
    this.route = [];
    this.facing = 1;
    this.walkDistance = 0;
    this.ambientTime = 0;
    this.animalPoses = [];
    this.last = 0;
    const editable = () =>
      /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
    window.addEventListener("keydown", (e) => {
      if (editable() || this.paused) return;
      const k = e.key.toLowerCase();
      if (
        k === " " &&
        /^(BUTTON|SUMMARY|A)$/.test(document.activeElement?.tagName)
      )
        return;
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
          " ",
        ].includes(k)
      ) {
        e.preventDefault();
        this.keys.add(k);
        if ((k === "e" || k === " ") && !e.repeat) this.interact();
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
      const target = this.hitAt(x, y);
      if (
        target &&
        Math.hypot(
          interactionPoint(target).x - this.player.x,
          interactionPoint(target).y - this.player.y,
        ) < 100
      )
        this.onInteract(target);
      else this.walkTo(target || { x, y }, !!target);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (this.paused || !this.camera) return;
      const r = canvas.getBoundingClientRect(),
        c = this.camera;
      this.hover = this.hitAt(
        (e.clientX - r.left) / c.scale + c.camX - c.ox,
        (e.clientY - r.top) / c.scale + c.camY - c.oy,
      );
      canvas.style.cursor = this.hover ? "pointer" : "default";
    });
    canvas.addEventListener("pointerleave", () => {
      this.hover = null;
    });
    requestAnimationFrame((t) => this.frame(t));
  }
  actors() {
    return lifeActors(
      this.scene,
      this.ambientTime,
      this.player,
      this.getSettings().motion !== false,
    );
  }
  destinations() {
    return [
      ...this.scene.interactables.filter(
        (o) =>
          !["kid-one", "kid-two", "lin"].includes(o.id) &&
          !(o.id === "lian" && this.hungryGuest) &&
          !(
            o.id === "sheep-keepsake" && this.getAdventure().hungry !== "done"
          ) &&
          !(o.id === "qiao" && this.guest) &&
          !(
            o.id === "lost-flowers" &&
            this.getAdventure().flowers !== "accepted"
          ),
      ),
      ...this.actors().filter((o) => o.type === "passerby"),
      ...(this.guest ? [this.guest] : []),
      ...(this.hungryGuest ? [this.hungryGuest] : []),
    ];
  }
  nearby() {
    const chosen = this.destinations().find(
      (o) => o.id === this.navigationFocus,
    );
    if (chosen) {
      const p = interactionPoint(chosen);
      if (Math.hypot(p.x - this.player.x, p.y - this.player.y) < 100)
        return chosen;
    }
    return nearest(
      { ...this.scene, interactables: this.destinations() },
      this.player,
      this.getFound(),
    );
  }
  hitAt(x, y) {
    const actors = [
      ...this.actors().filter((o) => o.type === "passerby"),
      ...this.scene.interactables.filter(
        (o) =>
          o.type === "npc" &&
          !["kid-one", "kid-two", "lin"].includes(o.id) &&
          !(o.id === "lian" && this.hungryGuest) &&
          !(
            o.id === "sheep-keepsake" && this.getAdventure().hungry !== "done"
          ) &&
          !(o.id === "qiao" && this.guest),
      ),
      ...(this.guest ? [this.guest] : []),
      ...(this.hungryGuest ? [this.hungryGuest] : []),
    ].sort((a, b) => b.y - a.y);
    const person = actors.find(
      (o) =>
        x > o.x - 43 &&
        x < o.x + 43 &&
        y > o.y - (o.artHeight || 235) &&
        y < o.y + 8,
    );
    if (person) return person;
    const animal = this.animalPoses.find(
      (o) => Math.abs(x - o.x) < 45 && y > o.y - 70 && y < o.y + 10,
    );
    if (animal) return this.scene.interactables.find((o) => o.id === animal.id);
    const b = [...this.scene.scenery]
      .reverse()
      .find(
        (o) =>
          o.doorId &&
          x > o.x - o.w * 0.45 &&
          x < o.x + o.w * 0.45 &&
          y > o.y - o.h &&
          y < o.y,
      );
    if (b) return this.scene.interactables.find((o) => o.id === b.doorId);
    const painted = this.destinations().find(
      (o) =>
        o.hitRect &&
        x >= o.hitRect.x &&
        x <= o.hitRect.x + o.hitRect.w &&
        y >= o.hitRect.y &&
        y <= o.hitRect.y + o.hitRect.h,
    );
    if (painted) return painted;
    return nearest(
      { ...this.scene, interactables: this.destinations() },
      { x, y },
      this.getFound(),
    );
  }
  updateGuest(dt) {
    const state = this.getAdventure().tea;
    const teaTable = this.scene.interactables.find((o) => o.id === "tea-table");
    if (this.scene.id !== "shanghai" || state === "new") {
      this.guest = null;
      return;
    }
    if (!this.guest) {
      const q = this.scene.interactables.find((o) => o.id === "qiao");
      this.guest = {
        ...q,
        type: "guest",
        dialogueId: "qiao",
        appearance: "qiao",
        distance: 0,
        facing: 1,
      };
    }
    if (state === "seated" || state === "done") {
      Object.assign(this.guest, {
        x: teaTable.x - 80,
        y: teaTable.y - 7,
        seated: true,
        moving: false,
      });
      return;
    }
    const goal = { x: teaTable.x - 85, y: teaTable.y + 5 };
    if (!this.guestRoute?.length)
      this.guestRoute = pathTo(this.scene, this.guest, goal);
    const target = this.guestRoute[0];
    if (!target) return;
    const d = Math.hypot(target.x - this.guest.x, target.y - this.guest.y);
    if (d < 3) {
      this.guestRoute.shift();
      if (!this.guestRoute.length) this.onGuestArrive();
      return;
    }
    const step = Math.min(d, 150 * dt),
      dx = (target.x - this.guest.x) / d,
      dy = (target.y - this.guest.y) / d;
    const next = move(this.scene, this.guest, dx * step, dy * step);
    this.guest.distance += Math.hypot(
      next.x - this.guest.x,
      next.y - this.guest.y,
    );
    Object.assign(this.guest, { x: next.x, y: next.y, moving: true });
    if (Math.abs(dx) > 0.1) this.guest.facing = Math.sign(dx);
  }
  updateHungryGuest(dt) {
    const state = this.getAdventure().hungry;
    if (
      state === "new" ||
      (state === "done" && this.scene.id !== "restaurant")
    ) {
      this.hungryGuest = null;
      return;
    }
    if (!this.hungryGuest)
      this.hungryGuest = {
        id: "lian",
        dialogueId: "lian",
        type: "guest",
        name: "莲 · Lian",
        appearance: "lian",
        x: this.player.x - 50,
        y: this.player.y,
        distance: 0,
        facing: this.facing,
        artHeight: 171,
      };
    const g = this.hungryGuest;
    if (
      this.scene.id === "restaurant" &&
      (state === "dining" || state === "done")
    ) {
      Object.assign(g, { x: 1045, y: 375, artHeight: 165, moving: false });
      return;
    }
    g.moving = false;
    if (Math.hypot(g.x - this.player.x, g.y - this.player.y) < 115) return;
    if (!this.friendRoute?.length)
      this.friendRoute = pathTo(this.scene, g, this.player);
    const p = this.friendRoute?.[0];
    if (!p) return;
    const d = Math.hypot(p.x - g.x, p.y - g.y);
    if (d < 5) {
      this.friendRoute.shift();
      return;
    }
    const step = Math.min(d, 315 * dt),
      next = move(
        this.scene,
        g,
        ((p.x - g.x) / d) * step,
        ((p.y - g.y) / d) * step,
      );
    g.distance += Math.hypot(next.x - g.x, next.y - g.y);
    g.moving = true;
    if (Math.abs(next.x - g.x) > 0.1) g.facing = Math.sign(next.x - g.x);
    Object.assign(g, { x: next.x, y: next.y });
  }
  sitAt(table, kind) {
    this.seat =
      kind === "tea"
        ? { kind, x: table.x + 80, y: table.y - 2, flip: true }
        : { kind, x: table.x - 128, y: table.y + 52, flip: false };
    if (kind === "hotpot" && this.hungryGuest)
      Object.assign(this.hungryGuest, {
        seated: true,
        moving: false,
        x: table.x + 126,
        y: table.y + 50,
      });
    this.canvas.dataset.seated = kind;
    this.paintKey = null;
  }
  standUp() {
    this.seat = null;
    if (this.hungryGuest) this.hungryGuest.seated = false;
    delete this.canvas.dataset.seated;
    this.paintKey = null;
  }
  clear() {
    this.keys.clear();
    this.route = [];
    this.pendingInteraction = null;
    this.navigationFocus = null;
  }
  walkTo(point, interactOnArrival = false) {
    this.pendingInteraction = interactOnArrival ? point.id : null;
    this.navigationFocus = point.id || null;
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
    this.standUp();
    this.scene = scenes[id] || scenes.shanghai;
    this.animalPoses = [];
    this.guest = null;
    this.hungryGuest = null;
    this.friendRoute = [];
    this.guestRoute = [];
    this.hover = null;
    this.player =
      position && canStand(this.scene, position.x, position.y)
        ? { ...position }
        : { ...this.scene.spawn };
    this.panda = [
      { x: this.player.x + 65, y: this.player.y - 15 },
      { x: this.player.x - 65, y: this.player.y + 10 },
      this.player,
    ].find((p) => canStand(this.scene, p.x, p.y));
    this.trail = [];
    this.clear();
    this.onMove?.(this.scene.id, this.player);
  }
  interact() {
    if (this.paused) return;
    const n = this.nearby();
    if (n) this.onInteract(n);
  }
  enterDoor(door) {
    if (door?.type !== "door" || !scenes[door.target]) return false;
    this.changeScene(door.target, door.returnPoint);
    return true;
  }
  frame(t) {
    const dt = Math.min(0.1, (t - this.last) / 1000 || 0);
    this.last = t;
    if (!this.paused && this.getSettings().motion !== false)
      this.ambientTime += dt;
    let moving = false;
    const previousPanda = this.panda;
    if (!this.paused) {
      this.updateGuest(dt);
      this.updateHungryGuest(dt);
      let dx =
        Number(this.keys.has("d") || this.keys.has("arrowright")) -
        Number(this.keys.has("a") || this.keys.has("arrowleft"));
      let dy =
        Number(this.keys.has("s") || this.keys.has("arrowdown")) -
        Number(this.keys.has("w") || this.keys.has("arrowup"));
      if (dx || dy) {
        this.route = [];
        this.pendingInteraction = null;
        this.navigationFocus = null;
      }
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
        speed = this.getSettings().pace === "slow" ? 184 : 264;
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
      if (this.pendingInteraction) {
        const target = this.destinations().find(
          (o) => o.id === this.pendingInteraction,
        );
        if (!target) this.pendingInteraction = null;
        else {
          const p = interactionPoint(target);
          if (Math.hypot(p.x - this.player.x, p.y - this.player.y) < 72) {
            this.pendingInteraction = null;
            this.route = [];
            this.onInteract(target);
          } else if (!this.route.length) {
            this.route = pathTo(this.scene, this.player, p);
            if (!this.route.length) this.pendingInteraction = null;
          }
        }
      }
      // Follow the player's actual traversable route, rather than cutting through buildings.
      while (
        this.trail.length &&
        Math.hypot(
          this.player.x - this.trail[0].x,
          this.player.y - this.trail[0].y,
        ) > 65
      ) {
        const target = this.trail[0],
          dist = Math.hypot(target.x - this.panda.x, target.y - this.panda.y),
          step = Math.min(dist, speed * 1.6 * dt);
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
    const near = this.nearby();
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
        this.hover?.id,
        this.guest,
        this.hungryGuest,
        this.seat,
        this.getAdventure().hungry,
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
          time: this.ambientTime,
          walkDistance: this.walkDistance,
          animate: !this.paused && settings.motion !== false,
          moving,
          facing: this.facing,
          hover: this.hover,
          guest: this.guest,
          hungryGuest: this.hungryGuest,
          seat: this.seat,
          adventure: this.getAdventure(),
          route: this.route,
          interactionTarget: this.pendingInteraction,
          pandaMoving,
          settings,
          found,
          near,
        },
      );
      // draw() already advanced life at this exact time; this second call
      // reads those positions with zero additional elapsed simulation time.
      this.animalPoses = lifeActors(
        this.scene,
        this.ambientTime,
        this.player,
        settings.motion !== false,
      ).filter((o) => o.type === "animal" && animalHeights[o.animal]);
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
      facing: String(this.facing),
      hover: this.hover?.id || "",
      pandaX: String(this.panda.x),
      pandaY: String(this.panda.y),
    });
    requestAnimationFrame((t) => this.frame(t));
  }
}
