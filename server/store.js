import { newAdventure, validateAdventure } from "../public/data/adventure.js";
import { stationGroundForJourney } from "../public/data/station-interior.js";
import { stationWaitingForJourney } from "../public/data/station-waiting.js";
import { DatabaseSync } from "node:sqlite";
import { randomBytes, createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { defaultSettings, validatePatch } from "../public/data/settings.js";
import { newLearner } from "../public/data/learner.js";
import {
  scenes,
  canStand,
  MAP_VERSION,
  upgradeState,
} from "../public/game/world.js";
import { npcs } from "../public/data/content.js";
import { newPractice, validatePractice } from "../public/data/activities.js";
const hash = (text) => createHash("sha256").update(text).digest("hex");
export const newState = () => ({
  schema: 1,
  mapVersion: MAP_VERSION,
  scene: "shanghai",
  position: { ...scenes.shanghai.spawn },
  found: [],
  settings: { ...defaultSettings },
  settingsHistory: [],
  feedback: [],
  memories: {},
  learner: newLearner(),
  history: [],
  journal: [],
  practice: newPractice(),
  adventure: newAdventure(),
});
export function validateState(s) {
  const scene = s?.scene === "station-ticketing"
    ? stationGroundForJourney(s?.adventure?.stationJourney)
    : s?.scene === "station-waiting" ? stationWaitingForJourney(s?.adventure?.stationJourney) : scenes[s?.scene];
  if (
    !s ||
    s.schema !== 1 ||
    !scenes[s.scene] ||
    (s.scene === "station-platform" && !(s.adventure?.stationJourney?.booked && s.adventure?.stationJourney?.entry === "ready" && s.adventure?.stationJourney?.boarding)) ||
    !s.position ||
    !Number.isFinite(s.position.x) ||
    !Number.isFinite(s.position.y) ||
    !canStand(scene, s.position.x, s.position.y)
  )
    throw new Error("Invalid save position.");
  if (
    !Array.isArray(s.found) ||
    s.found.some((id) => !["momo", "fox-plush", "rabbit-plush"].includes(id)) ||
    new Set(s.found).size !== s.found.length
  )
    throw new Error("Invalid discoveries.");
  const settings = validatePatch(s.settings);
  if (Object.keys(settings).length !== Object.keys(defaultSettings).length)
    throw new Error("Incomplete settings.");
  for (const [key, max] of [
    ["history", 24],
    ["feedback", 40],
    ["journal", 50],
    ["settingsHistory", 20],
  ])
    if (!Array.isArray(s[key]) || s[key].length > max)
      throw new Error("Save history is too long.");
  for (const h of s.history) {
    if (
      !h ||
      !Object.hasOwn(npcs, h.npc) ||
      typeof h.user !== "string" ||
      h.user.length > 500 ||
      !h.reply ||
      !["chinese", "pinyin", "meaning", "topic"].every(
        (k) => typeof h.reply[k] === "string",
      ) ||
      h.reply.chinese.length > 180 ||
      h.reply.pinyin.length > 500 ||
      h.reply.meaning.length > 400
    )
      throw new Error("Invalid conversation save.");
  }
  if (s.journal.some((x) => typeof x !== "string" || x.length > 500))
    throw new Error("Invalid journal.");
  for (const f of s.feedback)
    if (
      !f ||
      typeof f.text !== "string" ||
      f.text.length > 500 ||
      f.status !== "pending" ||
      typeof f.date !== "string"
    )
      throw new Error("Invalid feedback.");
  for (const h of s.settingsHistory) {
    if (
      !h ||
      typeof h.label !== "string" ||
      h.label.length > 500 ||
      typeof h.date !== "string"
    )
      throw new Error("Invalid settings history.");
    if (
      Object.keys(validatePatch(h.before)).length !==
      Object.keys(defaultSettings).length
    )
      throw new Error("Invalid undo settings.");
  }
  if (
    !s.memories ||
    typeof s.memories !== "object" ||
    Array.isArray(s.memories) ||
    Object.keys(s.memories).length > Object.keys(npcs).length
  )
    throw new Error("Invalid memories.");
  for (const [npc, items] of Object.entries(s.memories)) {
    if (
      !Object.hasOwn(npcs, npc) ||
      !Array.isArray(items) ||
      items.length > 8 ||
      items.some((x) => typeof x !== "string" || x.length > 80)
    )
      throw new Error("Invalid memory.");
  }
  if (
    !s.learner ||
    !s.learner.exposures ||
    !s.learner.evidence ||
    typeof s.learner.exposures !== "object" ||
    typeof s.learner.evidence !== "object" ||
    Array.isArray(s.learner.exposures) ||
    Array.isArray(s.learner.evidence) ||
    Object.keys(s.learner.exposures).length > 500 ||
    Object.keys(s.learner.evidence).length > 24
  )
    throw new Error("Invalid learner state.");
  for (const value of Object.values(s.learner.exposures))
    if (
      !value ||
      !Number.isSafeInteger(value.count) ||
      value.count < 0 ||
      !Number.isSafeInteger(value.assisted) ||
      value.assisted < 0
    )
      throw new Error("Invalid exposure.");
  for (const value of Object.values(s.learner.evidence))
    if (
      !value ||
      ![1, 2, 3].includes(value.band) ||
      !Array.isArray(value.samples) ||
      value.samples.length > 8 ||
      !Number.isSafeInteger(value.count) ||
      !Number.isSafeInteger(value.lastChange)
    )
      throw new Error("Invalid learning evidence.");
  if (JSON.stringify(s).length > 45000) throw new Error("Save is too large.");
  return {
    ...structuredClone(s),
    practice: validatePractice(s.practice),
    adventure: validateAdventure(s.adventure),
  };
}
export class Store {
  constructor(dir) {
    if (dir !== ":memory:") mkdirSync(dir, { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(
      dir === ":memory:" ? dir : resolve(dir, "world.sqlite"),
    );
    this.db.exec(
      `PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS learners(id TEXT PRIMARY KEY, revision INTEGER NOT NULL, state TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, learner TEXT NOT NULL REFERENCES learners(id), expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS pairing(code TEXT PRIMARY KEY, learner TEXT NOT NULL REFERENCES learners(id), expires INTEGER NOT NULL);`,
    );
  }
  close() {
    this.db.close();
  }
  session(token) {
    return typeof token === "string"
      ? this.db
          .prepare("SELECT learner FROM sessions WHERE token=? AND expires>?")
          .get(hash(token), Date.now())?.learner
      : undefined;
  }
  createSession(learner) {
    const token = randomBytes(32).toString("hex");
    this.db
      .prepare("INSERT INTO sessions VALUES(?,?,?)")
      .run(hash(token), learner, Date.now() + 30 * 86400000);
    return token;
  }
  create() {
    const id = randomBytes(16).toString("hex");
    this.db
      .prepare("INSERT INTO learners VALUES(?,?,?)")
      .run(id, 0, JSON.stringify(newState()));
    return { id, token: this.createSession(id) };
  }
  read(id) {
    const row = this.db
      .prepare("SELECT revision,state FROM learners WHERE id=?")
      .get(id);
    return {
      revision: row.revision,
      state: upgradeState(JSON.parse(row.state)),
    };
  }
  save(id, revision, state) {
    const clean = validateState(upgradeState(state));
    const previous = this.read(id);
    if (previous.revision !== revision) return null;
    if (previous.state.found.some((x) => !clean.found.includes(x)))
      throw new Error("Discoveries cannot be lost.");
    if (
      validatePractice(previous.state.practice).completed.some(
        (id) => !clean.practice.completed.includes(id),
      )
    )
      throw new Error("Completed practice cannot be lost.");
    const row = this.db
      .prepare(
        "UPDATE learners SET state=?, revision=revision+1 WHERE id=? AND revision=? RETURNING revision",
      )
      .get(JSON.stringify(clean), id, revision);
    return row ? { revision: row.revision, state: clean } : null;
  }
  pairCode(id) {
    this.db
      .prepare("DELETE FROM pairing WHERE expires<? OR learner=?")
      .run(Date.now(), id);
    const code = randomBytes(5).toString("hex").toUpperCase();
    this.db
      .prepare("INSERT INTO pairing VALUES(?,?,?)")
      .run(hash(code), id, Date.now() + 5 * 60000);
    return code;
  }
  redeem(code) {
    if (typeof code !== "string" || !/^[A-F0-9]{10}$/.test(code)) return null;
    const row = this.db
      .prepare(
        "DELETE FROM pairing WHERE code=? AND expires>? RETURNING learner",
      )
      .get(hash(code), Date.now());
    return row ? this.createSession(row.learner) : null;
  }
}
