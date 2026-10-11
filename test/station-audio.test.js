import test from "node:test";
import assert from "node:assert/strict";
import {
  stationSoundscape,
  stationApproach,
  StationAudio,
} from "../public/game/station-audio.js";

const position = (x, y) => ({ x: x * 1.8, y: y * 1.8 });
test("traffic is confined to the forecourt and never enters rooms, bridge or quay", () => {
  const outside = { id: "shantang" };
  assert.ok(stationSoundscape(outside, position(1215, 550)).traffic > 0);
  for (const [x, y] of [
    [355, 813],
    [450, 510],
    [800, 580],
    [470, 340],
  ])
    assert.equal(stationSoundscape(outside, position(x, y)).traffic, 0);
  for (const id of ["station-ticketing", "station-waiting", "home", "shanghai"])
    assert.equal(stationSoundscape({ id }, position(1215, 550)).traffic, 0);
  assert.ok(stationSoundscape({ id: "station-waiting" }, {}).pa > 0);
});

test("entering the hall cancels a pending exterior decode, and mute stops every layer", async (t) => {
  let finish;
  const nodes = [];
  const context = {
    state: "running",
    currentTime: 0,
    createGain: () => ({
      gain: {
        value: 0,
        cancelScheduledValues() {},
        setTargetAtTime(v) {
          this.value = v;
        },
      },
      connect() {},
      disconnect() {},
    }),
    decodeAudioData: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
    createBufferSource: () => {
      const node = {
        playbackRate: {},
        detune: {},
        connect() {},
        disconnect() {},
        start() {},
        stop() {
          this.stopped = true;
        },
      };
      nodes.push(node);
      return node;
    },
  };
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response(new ArrayBuffer(1)),
  );
  const audio = new StationAudio(context, {});
  // Isolate the traffic layer to deliberately hold its network/decode work.
  audio.layers.pa.failed = true;
  audio.layers.hall.failed = true;
  audio.update({ id: "shantang" }, position(1215, 550), true);
  await new Promise((resolve) => setImmediate(resolve));
  const trafficDone = finish;
  context.decodeAudioData = async () => ({ duration: 100 });
  audio.layers.hall.failed = false;
  audio.update({ id: "station-waiting" }, {}, true);
  trafficDone({ duration: 100 });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(audio.layers.traffic.track.paused, true);
  assert.equal(audio.layers.traffic.gain.gain.value, 0);
  assert.equal(audio.layers.hall.track.paused, false);
  audio.update({ id: "station-waiting" }, {}, false);
  assert.ok(Object.values(audio.layers).every((layer) => layer.track.paused));
  audio.dispose();
});


test("plaza sounds rise from the bridge exit toward the station doors", () => {
  const scene = { id: "shantang" };
  const route = [[550, 510], [610, 550], [800, 580], [1050, 550], [1215, 448]];
  let previous = -1;
  let previousTraffic = 0;
  for (const [x, y] of route) {
    const level = stationApproach(scene, position(x, y));
    assert.ok(level > previous);
    previous = level;
    const traffic = stationSoundscape(scene, position(x, y)).traffic;
    assert.ok(traffic >= previousTraffic);
    previousTraffic = traffic;
  }
  assert.equal(stationApproach(scene, position(550, 510)), 0);
  assert.equal(stationApproach(scene, position(470, 340)), 0);
  assert.ok(stationSoundscape(scene, position(610, 550)).hall > 0);
  assert.equal(stationSoundscape(scene, position(800, 580)).traffic, 0);
});
