import { createInitialState } from "../state/defaults.js";
import {
  validateAdventure,
  mergeAdventure,
} from "../data/adventure.js";
import { validatePractice } from "../data/activities.js";
import { upgradeState } from "./world.js";
const cacheKey = "panda-world-v1";
export const initialState = () => createInitialState();
export async function api(path, body, signal) {
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: signal || AbortSignal.timeout(12000),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || "现在还不能用。再试一次吧。");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}
export class Persistence {
  constructor(onStatus, onConflict) {
    this.onStatus = onStatus;
    this.onConflict = onConflict;
    this.state = initialState();
    this.revision = 0;
    this.generation = 0;
    this.persisted = 0;
    this.saving = false;
    this.conflict = null;
    this.identity = null;
  }
  cache() {
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          state: this.state,
          revision: this.revision,
          dirty: this.generation > this.persisted,
          identity: this.identity,
        }),
      );
      return true;
    } catch {
      this.onStatus("This device cannot store your save. Keep this page open and export your save in Settings → Save and devices.");
      return false;
    }
  }
  async load() {
    let cached;
    try {
      cached = JSON.parse(localStorage.getItem(cacheKey));
    } catch {}
    if (cached?.state?.schema === 1) {
      this.state = upgradeState(cached.state);
      this.revision = cached.revision;
      this.identity = cached.identity;
      this.generation = cached.dirty ? 1 : 0;
    }
    try {
      const remote = await api("/api/state");
      if (cached?.dirty) {
        if (
          cached.identity === remote.identity &&
          cached.revision === remote.revision
        ) {
          this.identity = remote.identity;
          this.onStatus("Recovered an unsynced journal.");
          this.cache();
          await this.flush();
        } else {
          this.conflict = remote;
          this.onStatus("Choose between the two saves.");
          this.onConflict(remote);
        }
      } else {
        this.state = upgradeState(remote.state);
        this.revision = remote.revision;
        this.identity = remote.identity;
        this.onStatus("Journal saved");
        this.cache();
      }
    } catch {
      this.onStatus("You can play offline. Your journal is saved on this device.");
    }
    return this.state;
  }
  change(fn) {
    const scene = this.state.scene;
    const beforeXP = this.state.adventure.xp;
    const beforeClaims = this.state.adventure.rewards.claims;
    fn(this.state);
    // Legacy guarded awards also contribute locally; explicit reward events already do.
    if (scene === "station-platform" && this.state.adventure.xp > beforeXP) {
      const a = this.state.adventure;
      const explicit = Object.entries(a.rewards.claims).reduce((sum, [id, amount]) =>
        sum + (Object.hasOwn(beforeClaims, id) ? 0 : amount), 0);
      const untracked = Math.max(0, a.xp - beforeXP - explicit);
      a.rewards.platformXP = Math.min(1000000, a.rewards.platformXP + untracked);
    }
    this.generation++;
    this.cache();
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 900);
    this.onStatus(
      this.conflict ? "Choose which save to use in Settings → Save and devices." : "Saving…",
    );
  }
  async flush() {
    if (this.saving || this.conflict || this.generation === this.persisted)
      return;
    this.saving = true;
    const snapshot = structuredClone(this.state),
      generation = this.generation;
    try {
      const saved = await api(
        "/api/state",
        { revision: this.revision, state: snapshot },
        AbortSignal.timeout(12000),
      );
      this.revision = saved.revision;
      this.persisted = generation;
      this.cache();
      this.onStatus(
        this.generation === this.persisted ? "Journal saved" : "Saving…",
      );
    } catch (error) {
      if (error.status === 409 || error.status === 401) {
        this.conflict = error.data;
        this.onStatus("Choose which save to use in Settings → Save and devices.");
        this.onConflict(error.data);
      } else this.onStatus("Saved on this device. Retry syncing in Settings → Save and devices.");
    } finally {
      this.saving = false;
      if (!this.conflict && this.generation !== this.persisted) {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.flush(), 5000);
      }
    }
  }
  async choose(source) {
    const remote = await api("/api/state");
    if (source === "server") {
      this.state = upgradeState(remote.state);
      this.revision = remote.revision;
      this.identity = remote.identity;
      this.generation = 0;
      this.persisted = 0;
    } else {
      this.state.adventure = mergeAdventure(
        this.state.adventure,
        remote.state.adventure,
      );
      this.state.found = [
        ...new Set([...this.state.found, ...remote.state.found]),
      ];
      const localPractice = validatePractice(this.state.practice),
        remotePractice = validatePractice(remote.state.practice);
      const rounds = { ...remotePractice.rounds, ...localPractice.rounds };
      for (const [id, count] of Object.entries(remotePractice.rounds))
        rounds[id] = Math.max(rounds[id] || 0, count);
      this.state.practice = {
        ...localPractice,
        rounds,
        completed: [
          ...new Set([...localPractice.completed, ...remotePractice.completed]),
        ],
      };
      this.revision = remote.revision;
      this.identity = remote.identity;
      this.generation++;
    }
    this.conflict = null;
    this.cache();
    await this.flush();
    return this.state;
  }
}
