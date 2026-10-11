import test from "node:test";
import assert from "node:assert/strict";
import { stationJourneyAction, stationBoardingProgress, STATION_BOARDING_XP } from "../public/data/station-journey.js";
import { createStationInteractions } from "../public/game/station-interactions.js";

const ready = { booked: true, entry: "ready", revision: 5 };
test("boarding requires XP and security; the threshold is inclusive and XP is not spent", () => {
  for (const xp of [undefined, 0, 999, NaN, Infinity]) {
    assert.equal(stationBoardingProgress(xp).ready, false);
    assert.deepEqual(stationJourneyAction(ready, "board", xp), ready);
  }
  assert.equal(stationBoardingProgress(999).remaining, 1);
  for (const xp of [STATION_BOARDING_XP, 1200]) {
    const checked = stationJourneyAction(ready, "board", xp);
    assert.equal(checked.boarding, true);
    assert.equal(checked.revision, 6);
    assert.deepEqual(stationJourneyAction(checked, "board", xp), checked);
    assert.equal(stationJourneyAction({booked:false,entry:"public",revision:0}, "board", xp).boarding, undefined);
    assert.equal(stationJourneyAction({...ready,entry:"screened"}, "board", xp).boarding, undefined);
  }
});

test("boarding pass shows progress, rechecks stale confirmation, and cannot bypass via platform", () => {
  const state = { xp: 999, stationJourney: {...ready} };
  let reply, syncs = 0;
  const interact = createStationInteractions({
    state: () => state,
    line: (...args) => { reply = args; },
    change: fn => fn(state),
    world: () => ({ syncStationInterior: () => syncs++, hasScene: () => assert.fail("Unchecked traveler must not reach a platform") }),
  });
  interact({id:"station-boarding-check"});
  assert.equal(reply[5], "male-kokoro-009");
  assert.match(reply[6], /999 \/ 1000 XP/);
  assert.equal(reply[4].some(([id]) => id === "station-boarding-confirm"), false);
  interact({id:"station-platform-stairs",integrationTarget:"station-platform"});
  assert.match(reply[6], /Still need 1 XP/);
  state.xp = 1000;
  interact({id:"station-boarding-check"});
  const confirm = reply[4].find(([id]) => id === "station-boarding-confirm")[2];
  state.xp = 999;
  confirm();
  assert.equal(state.stationJourney.boarding, undefined);
  state.xp = 1000;
  interact({id:"station-boarding-check"});
  reply[4].find(([id]) => id === "station-boarding-confirm")[2]();
  assert.equal(state.stationJourney.boarding, true);
  assert.equal(state.xp, 1000);
  assert.match(reply[6], /已检票 · Checked/);
  assert.equal(reply[4].some(([id]) => id === "station-boarding-confirm"), false);
  assert.equal(syncs, 2);
});
