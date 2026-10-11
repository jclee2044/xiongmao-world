import test from "node:test";
import assert from "node:assert/strict";
import { scenes } from "../public/game/world.js";
import { pandaAreas, landmarkAreas } from "../public/data/panda-areas.js";
import { createLandmarkPanda } from "../public/game/panda-landmarks.js";
import { stationJourneyAction, newStationJourney, validateStationJourney, mergeStationJourney } from "../public/data/station-journey.js";
import { landmarkReply } from "../server/panda-landmarks.js";

test("floor one gives the next step after each action, defers during panels, and resets on exit", () => {
  let journey = newStationJourney();
  const shown = [];
  const panda = createLandmarkPanda({
    getStationJourney: () => journey, random: () => 0.99,
    generate: () => assert.fail("Guidance must remain authored and immediate"),
    show: text => shown.push(text), hide() {},
  });
  const scene = scenes["station-ticketing"];
  for (const [action, step] of [[null, "ticket"], ["book", "identity"],
    ["verify", "deposit"], ["deposit", "detector"], ["screen", "collect"], ["collect", "upstairs"]]) {
    if (action) journey = stationJourneyAction(journey, action);
    const count = shown.length;
    panda.update(scene, scene.spawn, false);
    assert.equal(shown.length, count);
    panda.update(scene, scene.spawn);
    assert.equal(shown.at(-1), pandaAreas[`station-guide-${step}`].examples[2]);
    panda.update(scene, scene.spawn);
    assert.equal(shown.length, count + 1);
  }
  journey = stationJourneyAction(journey, "leave");
  panda.update(scenes.shantang, scenes.shantang.spawn, false);
  panda.update(scene, scene.spawn);
  assert.equal(shown.at(-1), pandaAreas["station-guide-identity"].examples[2]);
});

test("upstairs guidance stops after visiting, including saved and merged progress", () => {
  let journey = { booked: true, entry: "ready", revision: 5 };
  const beforeVisit = { ...journey };
  const shown = [];
  const panda = createLandmarkPanda({
    getStationJourney: () => journey, random: () => 0,
    show: text => shown.push(text), hide() {}, generate: () => assert.fail(),
  });
  const downstairs = scenes["station-ticketing"];
  panda.update(downstairs, downstairs.spawn);
  assert.equal(shown.length, 1);
  journey = stationJourneyAction(journey, "visit-waiting");
  panda.update(scenes["station-waiting"], { x: 0, y: 0 });
  journey = validateStationJourney(JSON.parse(JSON.stringify(journey)));
  panda.update(downstairs, downstairs.spawn);
  assert.equal(shown.length, 1);
  journey = mergeStationJourney(journey, { ...beforeVisit, revision: 20 });
  assert.equal(journey.visitedWaiting, true);
  journey = stationJourneyAction(journey, "leave");
  for (const action of ["verify", "deposit", "screen", "collect"])
    journey = stationJourneyAction(journey, action);
  assert.equal(landmarkAreas(downstairs, [], journey).length, 0);
});

test("floor two reacts at six distinct environmental spots without repeating while lingering", () => {
  const scene = scenes["station-waiting"];
  const areas = landmarkAreas(scene).filter(area => area.id.startsWith("station-panda-"));
  assert.equal(areas.length, 6);
  const shown = [];
  const panda = createLandmarkPanda({ random: () => 0,
    show: text => shown.push(text), hide() {}, generate: () => assert.fail() });
  for (const area of areas) {
    const count = shown.length;
    panda.update(scene, area);
    assert.equal(shown.at(-1), pandaAreas[area.id].examples[0]);
    panda.update(scene, area);
    assert.equal(shown.length, count + 1);
  }
});

test("station guidance never uses generated text even when an AI provider is enabled", async () => {
  const result = await landmarkReply({ area: "station-guide-collect" }, {
    provider: "local", random: () => 0, fetcher: () => assert.fail(),
  });
  assert.deepEqual(result, { mode: "stored", chinese: pandaAreas["station-guide-collect"].examples[0] });
});


test("station observations can stay quiet on a pass, just like market landmarks", () => {
  const scene = scenes["station-waiting"];
  const shown = [];
  const panda = createLandmarkPanda({ random: () => 0.99,
    show: text => shown.push(text), hide() {}, generate: () => assert.fail() });
  for (const area of landmarkAreas(scene).filter(a => a.id.startsWith("station-panda-"))) panda.update(scene, area);
  assert.deepEqual(shown, []);
  for (const [id, area] of Object.entries(pandaAreas).filter(([id]) => id.startsWith("station-panda-"))) {
    assert.notEqual(area.always, true, id);
    assert.notEqual(area.storedOnly, true, id);
    assert.ok(new Set(area.examples).size >= 3, id);
  }
});

test("station observations support generated variations", async () => {
  const scene = scenes["station-waiting"];
  const rolls = [0, 0, 0.9];
  const shown = [];
  const panda = createLandmarkPanda({ random: () => rolls.shift(),
    show: text => shown.push(text), hide() {},
    generate: async id => { assert.equal(id, "station-panda-cafe"); return {chinese:"我们去喝杯茶吧。"}; } });
  panda.update(scene, landmarkAreas(scene).find(a => a.id === "station-panda-cafe"));
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(shown, ["我们去喝杯茶吧。"]);
});
