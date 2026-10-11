import { createBubbleHelp } from "./bubble-help.js";
import { luggageObjectVisible, carriesTravelSuitcase, needsStationLuggage } from "../data/travel-luggage.js";
import { isCoreInteraction, npcFeet } from "./interactions.js";
import { interactionSurface, hitInteractionSurface } from "./interaction-surfaces.js";
import { collectibleAvailable } from "./collectibles.js";
import { scenes, move, nearest, canStand, interactionPoint } from "./world.js";
import { draw, prepareArt } from "./render.js";
import { hitExitArrow } from "./exit-arrow.js";
import { pathTo } from "./pathfinding.js";
import { actorSizes } from "./appearance.js";
import { lifeActors } from "./life.js";
import { XIAOCHENG } from "../data/station-departure.js";
import { stationTravelerVisible, playerCarriesBag } from "../data/station-journey.js";
import { stationGroundForJourney, groundProgressAction } from "../data/station-interior.js";
import { stationWaitingForJourney } from "../data/station-waiting.js";
import { StationDeparture } from "./station-departure.js";
import { createStationSignHelp } from "./station-sign-help.js";
import artBounds from "../data/art-bounds.js";
const PANDA_FOLLOW_DELAY = 0.5;
const MAX_FRAME_DT = 0.1;
const animalHeights = { cat: 64, duck: 54, rabbit: 58 };
export class World {
  constructor(
    canvas,
    {
      varyBubble = text => text,
      onNear,
      onInteract,
      onMove,
      onStep,
      getSettings = () => ({}),
      getFound = () => false,
      getAdventure = () => ({}),
      getPractice = () => ({ completed: [] }),
      onGuestArrive = () => {},
      onStationTravelerProgress = () => {},
      onStationJourneyAction = () => {},
      onArtStatus = () => {},
      onSignSelect = () => {},
    },
  ) {
    Object.assign(this, {
      canvas,
      varyBubble,
      onNear,
      onInteract,
      onMove,
      onStep,
      getSettings,
      getFound,
      getAdventure,
      getPractice,
      onGuestArrive,
      onStationTravelerProgress,
      onStationJourneyAction,
      onArtStatus,
    });
    this.ctx = canvas.getContext("2d");
    this.signHelp = createStationSignHelp(canvas, phrase => {
      if (this.paused || this.artPending) return;
      this.clear();
      onSignSelect(phrase);
    });
    this.bubbleHelp = createBubbleHelp(canvas, () => this.clear());
    this.keys = new Set();
    this.paused = true;
    this.scene = scenes.shanghai;
    this.player = { ...this.scene.spawn };
    this.panda = { x: this.player.x + 65, y: this.player.y - 15 };
    this.trail = [];
    this.pandaFollowTime = 0;
    this.pandaTrailPoint = { ...this.player, time: 0 };
    this.pandaWalkDistance = 0;
    this.route = [];
    this.facing = 1;
    this.walkDistance = 0;
    this.ambientTime = 0;
    this.animalPoses = [];
    this.last = 0;
    const editable = () =>
      /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
    window.addEventListener("keydown", (e) => {
      if (editable() || this.paused || this.artPending) return;
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
    // Safari can show its selection magnifier despite CSS and pointerdown guards.
    // Movement uses pointer events; cancel the canvas's native touch gestures too.
    for (const type of ["touchstart", "touchmove"])
      canvas.addEventListener(type, (e) => e.preventDefault(), {
        passive: false,
      });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener("pointerdown", (e) => {
      if (this.paused || this.artPending || !this.camera) return;
      if (e.pointerType === "touch" || e.pointerType === "pen") {
        if (this.heldPointer) return;
        e.preventDefault();
        this.clear();
        this.hover = null;
        this.heldPointer = {
          id: e.pointerId,
          pointerType: e.pointerType,
          clientX: e.clientX,
          clientY: e.clientY,
          startX: e.clientX,
          startY: e.clientY,
          started: performance.now(),
          dragged: false,
        };
        const p = this.pointerPoint(e);
        this.touchTarget = this.hitAt(p.x, p.y);
        this.touchTargetUntil = performance.now() + 1000;
        canvas.setPointerCapture(e.pointerId);
        return;
      }
      const { x, y } = this.pointerPoint(e);
      const exit = hitExitArrow(this.scene, this.player, x, y);
      if (exit) {
        this.clear();
        this.onInteract(exit);
        return;
      }
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
      if (this.paused || this.artPending || !this.camera) return;
      const held = this.heldPointer;
      if (held?.id === e.pointerId) {
        held.clientX = e.clientX;
        held.clientY = e.clientY;
        held.dragged ||=
          Math.hypot(e.clientX - held.startX, e.clientY - held.startY) > 8;
        if (held.dragged) this.touchTarget = null;
        return;
      }
      const { x, y } = this.pointerPoint(e);
      this.hover = this.hitAt(x, y);
      canvas.style.cursor = this.hover ? "pointer" : "default";
    });
    canvas.addEventListener("pointerup", (e) => {
      const held = this.heldPointer;
      if (held?.id !== e.pointerId) return;
      const tapped =
        !held.dragged &&
        performance.now() - held.started < 250 &&
        Math.hypot(e.clientX - held.startX, e.clientY - held.startY) <= 8;
      this.clear();
      if (tapped && !this.paused) {
        const { x, y } = this.pointerPoint(e);
        const exit = hitExitArrow(this.scene, this.player, x, y);
        if (exit) {
          this.onInteract(exit);
          return;
        }
        const target = this.hitAt(x, y);
        this.touchTarget = target;
        this.touchTargetUntil = performance.now() + 1000;
        if (
          target &&
          Math.hypot(
            interactionPoint(target).x - this.player.x,
            interactionPoint(target).y - this.player.y,
          ) < 100
        )
          this.onInteract(target);
        else this.walkTo(target || { x, y }, !!target);
      }
    });
    for (const type of ["pointercancel", "lostpointercapture"])
      canvas.addEventListener(type, (e) => {
        if (this.heldPointer?.id === e.pointerId) this.clear();
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
  destinations(includeObjects = false) {
    return [
      ...this.scene.interactables.filter(
        (o) =>
          luggageObjectVisible(o, this.getAdventure()) &&
          collectibleAvailable(this.scene, o, this.getFound(), this.player) &&
          !(o.id === XIAOCHENG && !stationTravelerVisible(this.scene, this.getAdventure())) &&
          !["kid-one", "kid-two", "lin"].includes(o.id) && !o.playRoute &&
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
    ].filter(o => includeObjects || isCoreInteraction(o));
  }
  nearby() {
    const chosen = this.destinations(true).find(
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
    const exit = hitExitArrow(this.scene, this.player, x, y);
    if (exit) return exit;
    // A traveler's generous portrait bounds must not swallow clicks on the
    // painted escalators or elevator behind them.
    const floorLink = this.destinations().find(o => o.floorTransition && o.hitRect &&
      x >= o.hitRect.x && x <= o.hitRect.x + o.hitRect.w &&
      y >= o.hitRect.y && y <= o.hitRect.y + o.hitRect.h);
    if (floorLink) return floorLink;
    const actors = [
      ...this.actors().filter((o) => o.type === "passerby"),
      ...this.scene.interactables.filter(
        (o) =>
          o.type === "npc" &&
          !(o.id === XIAOCHENG && !stationTravelerVisible(this.scene, this.getAdventure())) &&
          !["kid-one", "kid-two", "lin"].includes(o.id) && !o.playRoute &&
          !(o.id === "lian" && this.hungryGuest) &&
          !(
            o.id === "sheep-keepsake" && this.getAdventure().hungry !== "done"
          ) &&
          !(o.id === "qiao" && this.guest),
      ),
      ...(this.guest ? [this.guest] : []),
      ...(this.hungryGuest ? [this.hungryGuest] : []),
    ].sort((a, b) => b.y - a.y);
    const person = actors.find((o) => {
      const feet = npcFeet(o);
      return x > feet.x - 43 && x < feet.x + 43 &&
        y > feet.y - (o.artHeight || 235) && y < feet.y + 8;
    });
    if (person) return person;
    const animal = this.animalPoses.find(
      (o) => Math.abs(x - o.x) < 45 && y > o.y - 70 && y < o.y + 10,
    );
    if (animal) return this.destinations(true).find((o) => o.id === animal.id);
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
    const painted = this.destinations(true).find(o => hitInteractionSurface(this.scene, o, x, y) ||
      (["npc", "door"].includes(o.type) && o.hitRect && x >= o.hitRect.x &&
        x <= o.hitRect.x+o.hitRect.w && y >= o.hitRect.y && y <= o.hitRect.y+o.hitRect.h));
    if (painted) return painted;
    return nearest(
      { ...this.scene, interactables: this.destinations().filter(o =>
        !interactionSurface(this.scene, o) && (!this.scene.characterInteractionsOnly || o.type === "door")) },
      { x, y },
      this.getFound(),
    );
  }
  updateStationTraveler(dt) {
    const adventure = this.getAdventure();
    if (!["shantang", "station-ticketing", "station-waiting"].includes(this.scene.id) || adventure.stationTraveler !== "walking") {
      this.stationDeparture = null;
      this.stationTraveler = null;
      return;
    }
    this.stationDeparture ??= new StationDeparture(scenes.shantang, adventure.stationTravelerDistance || 0);
    // Once the player reaches 2F, the traveler they helped has caught up.
    // This also handles a saved departure whose outdoor animation was unfinished.
    if (this.scene.id === "station-waiting" && this.stationDeparture.route)
      this.stationDeparture.distance = this.stationDeparture.route.length;
    if (this.hover?.id === XIAOCHENG) this.hover = null;
    const pose = this.stationDeparture.update(dt, this.onStationTravelerProgress);
    this.stationTraveler = this.scene.id === "shantang" ? pose : null;
  }
  syncStationInterior() {
    if (!["station-ticketing", "station-waiting"].includes(this.scene.id)) return;
    const next = this.scene.id === "station-waiting"
      ? stationWaitingForJourney(this.getAdventure().stationJourney)
      : stationGroundForJourney(this.getAdventure().stationJourney);
    if (next !== this.scene) {
      this.scene = next;
      this.clear();
    }
  }
  hasScene(id) { return Boolean(scenes[id]); }
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
      // The guest moves away from the shop; talk at her current feet.
      delete this.guest.approachX;
      delete this.guest.approachY;
    }
    if (state === "seated" || state === "done") {
      Object.assign(this.guest, {
        x: teaTable.x - 108,
        y: teaTable.y + 6,
        seated: true,
        moving: false,
      });
      return;
    }
    const goal = { x: teaTable.x - 108, y: teaTable.y + 6 };
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
    // Station forecourt has only its traveler cast; resume the town invitation on return.
    if (this.scene.id === "shantang") {
      this.hungryGuest = null;
      this.friendRoute = [];
      return;
    }
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
        name: "小莲",
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
        ? { kind, x: table.x + 108, y: table.y + 13, flip: true }
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
    this.touchTarget = null;
    const held = this.heldPointer;
    this.heldPointer = null;
    if (held && this.canvas.hasPointerCapture(held.id))
      this.canvas.releasePointerCapture(held.id);
    this.keys.clear();
    this.route = [];
    this.pendingInteraction = null;
    this.navigationFocus = null;
  }
  pointerPoint({ clientX, clientY }) {
    const r = this.canvas.getBoundingClientRect(),
      c = this.camera;
    return {
      x: (clientX - r.left) / c.scale + c.camX - c.ox,
      y: (clientY - r.top) / c.scale + c.camY - c.oy,
    };
  }
  pointerDirection() {
    const held = this.heldPointer;
    if (!held) return { dx: 0, dy: 0 };
    // Reproject the current finger every frame as the player and camera move.
    const point = this.pointerPoint(held);
    const dx = point.x - this.player.x;
    const dy = point.y - this.player.y;
    return Math.hypot(dx, dy) < 4 ? { dx: 0, dy: 0 } : { dx, dy };
  }
  pointerSpeedMultiplier() {
    const held = this.heldPointer;
    if (held?.pointerType !== "touch") return 1;
    const r = this.canvas.getBoundingClientRect(),
      c = this.camera,
      viewport = this.canvas.ownerDocument.defaultView,
      x = r.left + (this.player.x - c.camX + c.ox) * c.scale,
      y = r.top + (this.player.y - c.camY + c.oy) * c.scale,
      dx = held.clientX - x,
      dy = held.clientY - y;
    // Fraction of the distance along the finger's direction to the screen edge.
    // This stays consistent across camera zoom, portrait and landscape layouts.
    const fraction = Math.min(
      1,
      Math.max(
        Math.abs(dx) / Math.max(1, dx < 0 ? x : viewport.innerWidth - x),
        Math.abs(dy) / Math.max(1, dy < 0 ? y : viewport.innerHeight - y),
      ),
    );
    return 0.75 + 0.5 * fraction;
  }
  walkTo(point, interactOnArrival = false) {
    if (point.floorTransition && this.getAdventure().stationJourney?.entry !== "ready") {
      this.clear();
      this.onInteract(point);
      return true;
    }
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
    if (!this.hasScene(id)) return false;
    if (id === "station-waiting" && this.getAdventure().stationJourney?.entry !== "ready") return false;
    if (["station-ticketing", "station-waiting"].includes(this.scene.id) && !["station-ticketing", "station-waiting", "station-platform"].includes(id))
      this.onStationJourneyAction("leave");
    if (this.stationDeparture && this.getAdventure().stationTraveler === "walking")
      this.onStationTravelerProgress("walking", this.stationDeparture.distance);
    this.stationDeparture = null;
    this.stationTraveler = null;
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
    this.scene = id === "station-ticketing" ? stationGroundForJourney(this.getAdventure().stationJourney)
      : id === "station-waiting" ? stationWaitingForJourney(this.getAdventure().stationJourney) : scenes[id];
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
    this.pandaFollowTime = 0;
    this.pandaTrailPoint = { ...this.player, time: 0 };
    this.pandaWalkDistance = 0;
    this.clear();
    this.loadSceneArt();
    this.onMove?.(this.scene.id, this.player);
  }
  loadSceneArt() {
    const generation = (this.artGeneration = (this.artGeneration || 0) + 1);
    this.artPending = true;
    this.canvas.dataset.artReady = "false";
    this.onArtStatus("loading");
    prepareArt(this.scene)
      .then(() => {
        if (generation !== this.artGeneration) return;
        this.artPending = false;
        this.paintKey = null;
        this.onArtStatus("ready");
      })
      .catch(() => {
        if (generation === this.artGeneration) this.onArtStatus("error");
      });
  }
  interact() {
    if (this.paused || this.artPending) return;
    const n = this.nearby();
    if (n) this.onInteract(n);
  }
  enterDoor(door) {
    if (door?.type !== "door" || !scenes[door.target]) return false;
    if (needsStationLuggage(this.scene, door, this.getAdventure())) return false;
    if (door.target === "station-waiting" && this.getAdventure().stationJourney?.entry !== "ready") return false;
    this.changeScene(door.target, door.returnPoint);
    return true;
  }
  updatePanda(dt, playerSpeed) {
    this.pandaFollowTime += dt;
    const followTime = this.pandaFollowTime - PANDA_FOLLOW_DELAY;
    // Spend the full catch-up budget along the player's traversable trail,
    // including multiple short waypoints in one frame.
    let remaining = playerSpeed * 1.6 * dt;
    while (remaining > 0 && this.trail.length) {
      const next = this.trail[0];
      const reachedTime = next.time <= followTime + 1e-9;
      let target = next;
      if (!reachedTime) {
        const previous = this.pandaTrailPoint;
        if (
          !previous ||
          previous.time > followTime ||
          // A gap between samples represents a stop, not a slow walk.
          next.time - previous.time > MAX_FRAME_DT + 1e-9
        )
          break;
        // Follow the delayed position between samples, rather than waiting for
        // whole points and alternating between idle and catch-up on uneven frames.
        const fraction =
          (followTime - previous.time) / (next.time - previous.time);
        target = {
          x: previous.x + (next.x - previous.x) * fraction,
          y: previous.y + (next.y - previous.y) * fraction,
        };
      }
      if (Math.hypot(this.player.x - target.x, this.player.y - target.y) <= 65)
        break;
      const dist = Math.hypot(target.x - this.panda.x, target.y - this.panda.y);
      if (dist < 0.01) {
        if (!reachedTime) break;
        this.pandaTrailPoint = this.trail.shift();
        continue;
      }
      const step = Math.min(dist, remaining);
      const previousPanda = this.panda;
      this.panda = move(
        this.scene,
        this.panda,
        ((target.x - this.panda.x) / dist) * step,
        ((target.y - this.panda.y) / dist) * step,
      );
      this.pandaWalkDistance =
        (this.pandaWalkDistance || 0) +
        Math.hypot(
          this.panda.x - previousPanda.x,
          this.panda.y - previousPanda.y,
        );
      remaining -= step;
      // A blocked waypoint must stay in the trail rather than cutting a corner.
      if (Math.hypot(target.x - this.panda.x, target.y - this.panda.y) >= 0.01)
        break;
      if (!reachedTime) break;
      this.pandaTrailPoint = this.trail.shift();
    }
  }
  frame(t) {
    const dt = Math.min(MAX_FRAME_DT, (t - this.last) / 1000 || 0);
    this.last = t;
    if (this.artPending) {
      this.signHelp.update(this.scene, this.camera, false);
      this.bubbleHelp.update([], false);
      requestAnimationFrame((next) => this.frame(next));
      return;
    }
    if (!this.paused && !this.bubbleHelp.reading && this.getSettings().motion !== false)
      this.ambientTime += dt;
    this.updateStationTraveler(this.paused ? 0 : dt);
    this.syncStationInterior();
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
        if (this.heldPointer) this.clear();
        this.route = [];
        this.pendingInteraction = null;
        this.navigationFocus = null;
      } else ({ dx, dy } = this.pointerDirection());
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
        speed =
          (this.getSettings().pace === "slow" ? 184 : 264) *
          (this.scene.interior || this.scene.id === "home" ? 0.8 : 1) *
          // A lingering, more reluctant walk before leaving the station quay.
          (this.scene.id === "shantang" && !this.scene.interior ? 0.8 : 1);
      if (len) {
        if (Math.abs(dx) > 0.1) this.facing = Math.sign(dx);
        const step = Math.min(
          speed * this.pointerSpeedMultiplier() * dt,
          this.route.length
            ? Math.hypot(
                this.route[0].x - this.player.x,
                this.route[0].y - this.player.y,
              )
            : this.heldPointer
              ? len
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
          this.onStep?.(this.scene.id, this.player);
          this.walkDistance += Math.hypot(
            this.player.x - previous.x,
            this.player.y - previous.y,
          );
          this.trail.push({ ...this.player, time: this.pandaFollowTime + dt });
          if (this.trail.length > 240) this.trail.shift();
          if (t - (this.lastMove || 0) > 500) {
            this.onMove?.(this.scene.id, this.player);
            this.lastMove = t;
          }
        } else this.route = [];
      }
      if (this.pendingInteraction) {
        const target = this.destinations(true).find(
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
      this.updatePanda(dt, speed * this.pointerSpeedMultiplier());
      if (this.scene.id === "station-ticketing") {
        const action = groundProgressAction(this.getAdventure().stationJourney, this.player, this.panda);
        if (action) {
          this.onStationJourneyAction(action);
          this.syncStationInterior();
          this.onMove?.(this.scene.id, this.player);
        }
      }
    }
    if (this.wasMoving && !moving) this.onMove?.(this.scene.id, this.player);
    this.wasMoving = moving;
    const near = this.nearby();
    if (this.nearId !== near?.id) {
      this.nearId = near?.id;
      this.onNear?.(near);
    }
    this.canvas.dataset.x = this.player.x.toFixed(1);
    this.canvas.dataset.y = this.player.y.toFixed(1);
    this.canvas.dataset.scene = this.scene.id;
    this.canvas.dataset.travelSuitcase = carriesTravelSuitcase(this.scene, this.getAdventure()) ? "carried" : this.getAdventure().travelLuggage?.packed ? "on-belt" : "home";
    this.canvas.dataset.stationEntry = this.getAdventure().stationJourney?.entry || "public";
    this.canvas.dataset.stationBooked = String(this.getAdventure().stationJourney?.booked || false);
    this.canvas.dataset.stationBoarding = String(this.getAdventure().stationJourney?.boarding || false);
    this.canvas.dataset.playerBag = playerCarriesBag(this.scene, this.getAdventure().stationJourney) ? "carried" : "on-belt";
    const pandaMoving =
      Math.hypot(
        this.panda.x - previousPanda.x,
        this.panda.y - previousPanda.y,
      ) > 0.05;
    const settings = this.getSettings(),
      found = this.getFound(),
      feedbackTarget = this.hover || (t < this.touchTargetUntil ? this.touchTarget : null),
      paintKey = JSON.stringify([
        this.scene.id,
        this.player,
        this.panda,
        this.facing,
        settings,
        found,
        near?.id,
        feedbackTarget?.id,
        this.pendingInteraction,
        this.guest,
        this.hungryGuest,
        this.stationTraveler,
        this.getAdventure().stationTraveler,
        this.getAdventure().stationJourney,
        this.seat,
        this.getAdventure().hungry,
        this.getPractice().completed,
        this.route.at(-1),
        this.canvas.clientWidth,
        this.canvas.clientHeight,
        window.devicePixelRatio,
      ]);
    const ambientFrame =
      !this.paused &&
      settings.motion !== false &&
      (["station-ticketing", "station-waiting"].includes(this.scene.id) || t - (this.lastPaint || 0) > 90);
    if (
      moving ||
      pandaMoving ||
      this.animatedLastFrame ||
      this.transition ||
      this.camera?.settling ||
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
          varyBubble: this.varyBubble,
          time: this.ambientTime,
          previousCamera: this.camera,
          cameraDelta: dt,
          walkDistance: this.walkDistance,
          pandaWalkDistance: this.pandaWalkDistance,
          animate: !this.paused && settings.motion !== false,
          moving,
          facing: this.facing,
          hover: feedbackTarget,
          guest: this.guest,
          hungryGuest: this.hungryGuest,
          stationTraveler: this.stationTraveler,
          seat: this.seat,
          adventure: this.getAdventure(),
          completedPractice: this.getPractice().completed,
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
    this.bubbleHelp.update(this.camera.bubbles || [], !this.paused && !this.artPending && !this.transition);
    this.animatedLastFrame = moving || pandaMoving;
    this.signHelp.update(this.scene, this.camera, !this.paused && !this.artPending && !this.transition, this.getAdventure().stationJourney);
    Object.assign(this.canvas.dataset, {
      camX: String(this.camera.camX),
      camY: String(this.camera.camY),
      scale: String(this.camera.scale),
      cameraSettling: String(Boolean(this.camera.settling)),
      ox: String(this.camera.ox),
      oy: String(this.camera.oy),
      routeLength: String(this.route.length),
      facing: String(this.facing),
      hover: this.hover?.id || "",
      pandaX: String(this.panda.x),
      pandaY: String(this.panda.y),
      stationTravelerStatus: this.getAdventure().stationTraveler || "new",
      stationTravelerX: this.stationTraveler ? String(this.stationTraveler.x) : "",
      stationTravelerY: this.stationTraveler ? String(this.stationTraveler.y) : "",
      stationTravelerDistance: String(this.stationDeparture?.distance ?? this.getAdventure().stationTravelerDistance ?? 0),
    });
    requestAnimationFrame((t) => this.frame(t));
  }
}
