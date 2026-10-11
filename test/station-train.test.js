import test from "node:test";
import assert from "node:assert/strict";
import { StationTrain, TRAIN_ARRIVAL, TRAIN_DEPARTURE } from "../public/game/station-train.js";
import { stationJourneyAction as act, validateStationJourney, mergeStationJourney } from "../public/data/station-journey.js";

test("train waits, arrives smoothly, stays indefinitely, and can explicitly depart", () => {
  const train = new StationTrain();
  assert.equal(train.pose().visible, false);
  train.update(10000, true, 99);
  assert.equal(train.phase, "waiting");
  train.update(0, true, 100);
  assert.equal(train.phase, "arriving");
  assert.equal(train.pose().travel, -1);
  const offsets = Array.from({length:90}, () => train.update(TRAIN_ARRIVAL / 90).travel);
  assert.ok(offsets.every((x,i) => !i || x >= offsets[i-1]));
  train.update(0.001);
  assert.equal(train.phase, "ready");
  assert.equal(train.pose().travel, 0);
  train.update(10000);
  assert.equal(train.phase, "ready", "there is no missed-train countdown");
  assert.ok(train.depart());
  assert.equal(train.depart(), false);
  assert.ok(train.update(TRAIN_DEPARTURE / 2).travel > 0);
  train.update(TRAIN_DEPARTURE / 2);
  assert.equal(train.phase, "gone");
  assert.equal(train.pose().visible, false);
});

test("reduced motion and saved arrivals show the stationary train", () => {
  const train = new StationTrain();
  assert.equal(train.update(0, false, 100).phase, "ready");
  assert.equal(new StationTrain({arrived:true,earnedPlatformXP:100}).pose().phase, "ready");
  const journey = {booked:true,entry:"ready",boarding:true,revision:6};
  const arrived = act(journey, "train-arrived");
  assert.equal(arrived.trainArrived, true);
  assert.deepEqual(validateStationJourney(JSON.parse(JSON.stringify(arrived))), arrived);
  assert.deepEqual(act(arrived,"train-arrived"),arrived);
  assert.equal(act({...journey,boarding:false},"train-arrived").trainArrived,undefined);
  const left = act(arrived,"leave");
  assert.equal(left.trainArrived,undefined);
  assert.equal(mergeStationJourney(arrived,left).trainArrived,undefined);
  assert.throws(()=>validateStationJourney({...journey,boarding:false,trainArrived:true}));
});

 test("saved arrival cannot bypass platform conversation credit", () => {
  for (const motion of [true, false]) {
    const train = new StationTrain({ arrived: true, earnedPlatformXP: 99 });
    assert.equal(train.pose().visible, false);
    assert.equal(train.update(10000, motion, 99).visible, false);
    assert.equal(train.update(0, motion, 100).visible, true);
  }
});
