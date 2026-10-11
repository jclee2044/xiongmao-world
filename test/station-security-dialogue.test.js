import test from "node:test";
import assert from "node:assert/strict";
import { createStationInteractions } from "../public/game/station-interactions.js";
import { newStationJourney } from "../public/data/station-journey.js";

test("both security employees explain the next step without advancing the journey", () => {
  for (const [booked, entry, instruction] of [
    [false, "public", /buy a ticket/i],
    [true, "public", /show your passport/i],
    [true, "verified", /bag and suitcase on the conveyor/i],
    [true, "bags", /walk through the metal detector/i],
    [true, "screened", /collect your bag and suitcase/i],
    [true, "ready", /waiting hall on the second floor/i],
  ]) {
    let reply;
    const interact = createStationInteractions({
      state: () => ({ stationJourney: { booked, entry } }),
      line: (...args) => { reply = args; },
      change: () => assert.fail("Instructions must not skip a security step"),
      world: () => assert.fail("Walking starts only after choosing the next step"),
    });
    for (const id of ["station-security-guide", "station-security-exit"]) {
      assert.equal(interact({ id }), true);
      assert.match(reply[3], instruction);
      assert.ok(reply[1] && reply[2], "Chinese and pinyin accompany the instruction");
      assert.equal(reply[4][0][0], "station-security-next");
      assert.equal(reply[5], id === "station-security-guide" ? "female-kokoro-026" : "male-kokoro-009");
    }
  }
});

test("passport verification is available only at the right-hand desk before conveyor deposit", () => {
  let reply;
  const adventure = { stationJourney: newStationJourney() };
  const interact = createStationInteractions({
    state: () => adventure,
    line: (...args) => { reply = args; },
    change: (update) => update(adventure),
    world: () => ({ syncStationInterior() {} }),
  });
  const actionIds = () => reply[4].map(([id]) => id);
  for (const booked of [false, true]) {
    adventure.stationJourney.booked = booked;
    reply = undefined;
    for (const id of ["station-bag-drop", "station-bag-collect"]) {
      assert.equal(interact({ id }), false, "the belt is inactive before passport verification");
      assert.equal(reply, undefined);
      assert.equal(adventure.stationJourney.entry, "public");
    }
    for (const id of ["station-security-guide", "station-security-exit"]) {
      const before = { ...adventure.stationJourney };
      interact({ id });
      assert.deepEqual(adventure.stationJourney, before);
      assert.deepEqual(actionIds(), ["station-security-next"]);
      assert.match(reply[3], booked ? /passport.*desk on the right.*then.*conveyor/i : /buy a ticket/i);
    }
    interact({ id: "station-entry-check" });
    assert.deepEqual(actionIds(), booked ? ["station-verify"] : []);
  }
  reply[4][0][2]();
  assert.equal(adventure.stationJourney.entry, "verified");
  assert.match(reply[3], /passport has been checked/i);
  assert.deepEqual(actionIds(), ["station-security-next"]);
  interact({ id: "station-bag-drop" });
  assert.deepEqual(actionIds(), ["station-deposit"]);
  assert.equal(adventure.stationJourney.entry, "verified", "deposit still requires an explicit choice");
});

test("the middle attendant routes passengers to the next unfinished step", async (t) => {
  let closed = 0;
  const previousDocument = globalThis.document;
  globalThis.document = { getElementById: () => ({ close: () => { closed++; } }) };
  t.after(() => {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  });
  for (const [booked, entry, destination] of [
    [false, "public", "station-ticket-counter"],
    [true, "public", "station-entry-check"],
    [true, "verified", "station-bag-drop"],
    [true, "bags", "station-security-exit"],
    [true, "screened", "station-bag-collect"],
    [true, "ready", "station-stairs-up"],
  ]) {
    let reply, walked;
    const target = { id: destination };
    const interact = createStationInteractions({
      state: () => ({ stationJourney: { booked, entry } }),
      line: (...args) => { reply = args; },
      change: () => assert.fail("Directions must not advance progress"),
      world: () => ({
        scene: { id: "station-ticketing", interactables: [target] },
        walkTo: (object, interactOnArrival) => { walked = object; assert.equal(interactOnArrival, true); },
      }),
    });
    interact({ id: "station-security-guide" });
    assert.equal(walked, undefined);
    reply[4][0][2]();
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(walked, target, entry);
  }
  assert.equal(closed, 6);
});

test("cleared passengers are not asked to repeat identity or bag screening", () => {
  let reply;
  const interact = createStationInteractions({
    state: () => ({ stationJourney: { booked: true, entry: "ready", revision: 5 } }),
    line: (...args) => { reply = args; },
    change: () => assert.fail("Clearance should not change"),
    world: () => assert.fail("No world update is needed"),
  });
  for (const id of ["station-entry-check", "station-bag-drop"]) {
    assert.equal(interact({ id }), true);
    assert.match(reply[3], /already cleared security/);
    assert.match(reply[3], /leave the station and come back/);
    assert.deepEqual(reply[4], []);
  }
});
