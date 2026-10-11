import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { encode } from "./encoding.js";

const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const root = resolve(option("--root", "."));
const load = (file) => import(pathToFileURL(resolve(root, file)));
const world = await load("public/game/world.js");
const { scenes, MAP_VERSION, canStand, move, nearest, districtAt, interactionPoint, upgradeState } = world;
const { npcs } = await load("public/data/content.js");
const { activities } = await load("public/data/activities.js");
const { newState, validateState } = await load("server/store.js");
const { initialState } = await load("public/game/persistence.js");
const { stationGroundForJourney } = await load("public/data/station-interior.js");
const { stationWaitingForJourney } = await load("public/data/station-waiting.js");
const journeyRules = await load("public/data/station-journey.js");
const { storyReply, replySchema, validateReply, reply } = await load("server/dialogue.js");
const { pathTo } = await load("public/game/pathfinding.js");
const { lifeActors } = await load("public/game/life.js");
const { StationTrain } = await load("public/game/station-train.js");

const outcome = (fn) => {
  try { return { value: fn() }; } catch (error) { return { error: { name: error.name, message: error.message, code: error.code } }; }
};
const sections = {};
const record = (name, value) => { sections[name] = encode(value); };
assert.deepEqual(newState(), initialState());
const fresh = newState(), independent = newState();
fresh.position.x++; fresh.found.push("momo"); fresh.adventure.coins++;
assert.deepEqual(independent, initialState());
record("initialState", { server: newState(), client: initialState(), mapVersion: MAP_VERSION });
record("catalog", scenes);
record("characters", npcs);
record("activities", activities);

const journeys = [journeyRules.newStationJourney(), ...journeyRules.entryStages.map((entry, i) => ({ booked: true, entry, revision: i + 1 })),
  { booked: true, entry: "ready", boarding: true, revision: 6 },
  { booked: true, entry: "ready", boarding: true, trainArrived: true, revision: 7 }];
const variants = journeys.map((journey) => {
  const ground = stationGroundForJourney(journey), waiting = stationWaitingForJourney(journey);
  assert.equal(ground, stationGroundForJourney(journey));
  assert.equal(waiting, stationWaitingForJourney(journey));
  return { journey, ground, waiting };
});
record("stationVariants", variants);
const sceneCases = [...Object.entries(scenes), ...variants.flatMap(({ ground, waiting }, i) => [[`ground-${i}`, ground], [`waiting-${i}`, waiting]])];
for (const [id, scene] of sceneCases) {
  const grid = [];
  for (let y = 0; y <= 24; y++) for (let x = 0; x <= 24; x++) {
    const point = { x: scene.width * x / 24, y: scene.height * y / 24 };
    grid.push([point, canStand(scene, point.x, point.y), canStand(scene, point.x, point.y, 19)]);
  }
  const paths = scene.interactables.map((stop) => [stop.id, interactionPoint(stop), pathTo(scene, scene.spawn, interactionPoint(stop))]);
  let point = { ...scene.spawn };
  const movement = [];
  for (let step = 0; step < 160; step++) {
    const dt = [1 / 60, 1 / 30, 0.1, 0][step % 4];
    const direction = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, -1]][Math.floor(step / 8) % 6];
    point = move(scene, point, direction[0] * 180 * dt, direction[1] * 180 * dt);
    movement.push({ dt, direction, point, near: nearest(scene, point)?.id, district: districtAt(scene, point)?.id });
  }
  record(`geometry:${id}`, { grid, paths, movement });
}

const migrations = [];
for (const version of [0, 1, 2, 3, 4, 5, 11, 12, 13, 14]) {
  for (const [id, scene] of Object.entries(scenes)) {
    for (const position of [scene.spawn, { x: -20, y: -20 }, { x: scene.width / 2, y: scene.height / 2 }]) {
      const state = { ...newState(), scene: id, position: { ...position }, mapVersion: version };
      for (const journey of id.startsWith("station-") ? journeys : [journeys[0]]) {
        state.adventure.stationJourney = journey;
        const upgraded = outcome(() => upgradeState(state));
        migrations.push({ version, id, position, journey, upgraded,
          validated: upgraded.value ? outcome(() => validateState(upgraded.value)) : null });
      }
    }
  }
}
for (const id of ["pingtan-room", "unknown-scene"]) migrations.push(outcome(() => upgradeState({ ...newState(), scene: id })));
record("migrations", migrations);
const progression = [];
for (const journey of journeys) for (const xp of [0, 499, 500, 999, 1000, 1500])
  for (const action of ["book", "verify", "deposit", "screen", "collect", "visit-waiting", "board", "train-arrived", "leave"])
    progression.push({ journey, xp, action, result: journeyRules.stationJourneyAction(journey, action, xp) });
record("progression", progression);
record("journeyMerges", journeys.flatMap((a) => journeys.map((b) => journeyRules.mergeStationJourney(a, b))));

const authored = [];
for (const [sceneId, scene] of Object.entries(scenes)) {
  for (const stop of scene.interactables) {
    const id = stop.dialogueId || stop.id;
    if (!npcs[id]) continue;
    for (const text of ["你好", "help", "work", "school", "friends", "再见", "火车到了吗？"]) {
      const state = { ...newState(), scene: sceneId };
      state.adventure.stationJourney = journeys.at(-1);
      authored.push({ sceneId, id, text, result: outcome(() => storyReply(id, text, state, stop.shopId, { random: () => 0.25 })) });
    }
  }
}
record("authoredDialogue", authored);
const valid = { chinese: "你好！", pinyin: "nǐ hǎo", meaning: "Hello!", topic: "greeting" };
record("replyValidation", { replySchema, cases: [null, [], {}, valid, { ...valid, extra: true }, { ...valid, topic: "invalid" },
  ...["chinese", "pinyin", "meaning"].flatMap((key) => [undefined, "", "x".repeat(501), "<script>"].map((value) => ({ ...valid, [key]: value })))].map((value) => ({ value, result: outcome(() => validateReply(value)) })) });
const requests = [];
for (const provider of ["gemini", "ollama"]) {
  const state = newState();
  const result = await reply("lin", "你今天喜欢做什么？", [], state, { provider, apiKey: "fixture", random: () => 0.25,
    fetcher: async (url, options) => {
      requests.push({ provider, url, method: options.method, body: JSON.parse(options.body) });
      const answer = { chinese: "我喜欢看书。你呢？", meaning: "I like reading. How about you?", topic: "school", pandaFeedback: null };
      return { ok: true, json: async () => provider === "gemini" ? { candidates: [{ content: { parts: [{ text: JSON.stringify(answer) }] } }] } : { message: { content: JSON.stringify(answer) } } };
    } });
  requests.push({ provider, result });
}
record("providerRequests", requests);

for (const [id, scene] of Object.entries(scenes)) {
  const trace = [];
  for (let frame = 0; frame < 360; frame++) {
    const time = frame / 30, motion = !(frame >= 120 && frame < 150);
    const actors = lifeActors(scene, time, scene.spawn, motion);
    trace.push(structuredClone(actors));
    // Keep the existing second read at the same time in the characterization.
    trace.push(structuredClone(lifeActors(scene, time, scene.spawn, motion)));
  }
  record(`life:${id}`, trace);
}
const train = new StationTrain(), trainTrace = [];
for (let i = 0; i < 1000; i++) trainTrace.push(train.update(1 / 60));
train.depart();
for (let i = 0; i < 500; i++) trainTrace.push(train.update(1 / 60));
record("train", trainTrace);

const serialized = JSON.stringify(sections);
const summary = Object.fromEntries(Object.entries(sections).map(([key, value]) => [key, createHash("sha256").update(JSON.stringify(value)).digest("hex")]));
if (args.includes("--write")) {
  const path = resolve(option("--write")); mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, serialized + "\n");
}
if (args.includes("--compare")) {
  const expected = JSON.parse(readFileSync(option("--compare"), "utf8"));
  const values = expected.summary ? summary : sections;
  const baseline = expected.summary || expected;
  assert.deepEqual(Object.keys(values), Object.keys(baseline), "Contract sections changed");
  for (const key of Object.keys(values)) assert.deepEqual(values[key], baseline[key], `Gameplay contract changed: ${key}`);
}
console.log(JSON.stringify({ sections: Object.keys(sections).length, sceneCases: sceneCases.length, migrations: migrations.length, authoredReplies: authored.length, bytes: Buffer.byteLength(serialized), summary }, null, 2));
