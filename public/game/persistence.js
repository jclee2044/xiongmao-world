import { defaultSettings } from "../data/settings.js";
import { newLearner } from "../data/learner.js";
const cacheKey = "panda-world-v1";
export const initialState = () => ({
  schema: 1,
  scene: "shanghai",
  position: { x: 620, y: 600 },
  found: [],
  settings: { ...defaultSettings },
  settingsHistory: [],
  feedback: [],
  memories: {},
  learner: newLearner(),
  history: [],
  journal: [],
});
export async function api(path, body, signal) {
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: signal || AbortSignal.timeout(12000),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || "Could not connect to your world.");
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
      this.onStatus("Device storage is full; keep this page open until saved.");
      return false;
    }
  }
  async load() {
    let cached;
    try {
      cached = JSON.parse(localStorage.getItem(cacheKey));
    } catch {}
    if (cached?.state?.schema === 1) {
      this.state = cached.state;
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
          this.onStatus("Recovered unsynced progress.");
          this.cache();
          await this.flush();
        } else {
          this.conflict = remote;
          this.onStatus("Unsynced progress needs your choice.");
          this.onConflict(remote);
        }
      } else {
        this.state = remote.state;
        this.revision = remote.revision;
        this.identity = remote.identity;
        this.onStatus("Saved on this PC");
        this.cache();
      }
    } catch {
      this.onStatus(
        "Offline · exploration works; progress stays on this device",
      );
    }
    return this.state;
  }
  change(fn) {
    fn(this.state);
    this.generation++;
    this.cache();
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 900);
    this.onStatus(
      this.conflict ? "Save conflict · choose in Journal" : "Saving…",
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
        this.generation === this.persisted ? "Saved on this PC" : "Saving…",
      );
    } catch (error) {
      if (error.status === 409 || error.status === 401) {
        this.conflict = error.data;
        this.onStatus("Save conflict · choose in Journal");
        this.onConflict(error.data);
      } else
        this.onStatus("Not synced · kept on this device; retry in Journal");
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
      this.state = remote.state;
      this.revision = remote.revision;
      this.identity = remote.identity;
      this.generation = 0;
      this.persisted = 0;
    } else {
      this.state.found = [
        ...new Set([...this.state.found, ...remote.state.found]),
      ];
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
