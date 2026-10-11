import { PLATFORM_LOCAL_XP } from "../data/rewards.js";
// The train is an independent actor. Arrival has no deadline, and it stays at
// the platform until a future journey scene explicitly requests depart().
// Kept as a compatibility export; waiting time never unlocks arrival.
export const TRAIN_WAIT = Infinity;
export const TRAIN_ARRIVAL = 9;
export const TRAIN_DEPARTURE = 7;

export class StationTrain {
  constructor({ arrived = false, earnedPlatformXP = 0 } = {}) {
    this.phase = arrived && earnedPlatformXP >= PLATFORM_LOCAL_XP ? "ready" : "waiting";
    this.elapsed = 0;
  }
  update(dt, motion = true, earnedPlatformXP = 0) {
    if (this.phase === "waiting") {
      if (earnedPlatformXP < PLATFORM_LOCAL_XP) return this.pose();
      this.phase = "arriving"; this.elapsed = 0;
    }
    if (!motion && ["waiting", "arriving"].includes(this.phase)) {
      this.phase = "ready";
      this.elapsed = 0;
    }
    this.elapsed += Math.max(0, dt);
    if (this.phase === "arriving" && this.elapsed >= TRAIN_ARRIVAL) {
      this.elapsed = 0;
      this.phase = "ready";
    }
    if (this.phase === "departing" && (!motion || this.elapsed >= TRAIN_DEPARTURE)) {
      this.elapsed = 0;
      this.phase = "gone";
    }
    return this.pose();
  }
  depart() {
    if (this.phase !== "ready") return false;
    this.phase = "departing";
    this.elapsed = 0;
    return true;
  }
  pose() {
    const t = Math.min(1, this.elapsed / TRAIN_ARRIVAL);
    const departing = Math.min(1, this.elapsed / TRAIN_DEPARTURE);
    return {
      phase: this.phase,
      visible: !["waiting", "gone"].includes(this.phase),
      // Relative travel distance: -1 is fully above the frame, 0 is stopped,
      // +1 is below it. Cubic easing brings the train gently to a halt.
      travel: this.phase === "arriving" ? -Math.pow(1 - t, 3)
        : this.phase === "departing" ? departing * departing : 0,
    };
  }
}
