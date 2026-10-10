import test from "node:test";
import assert from "node:assert/strict";
import { MusicTrack } from "../public/game/music-track.js";

function fixture(t) {
  const nodes = [];
  const context = {
    currentTime: 0,
    state: "running",
    decodeAudioData: async () => ({ duration: 10 }),
    createBufferSource() {
      const node = {
        playbackRate: { value: 0 },
        detune: { value: 100 },
        connect() {},
        disconnect() {},
        start(_, offset) {
          this.offset = offset;
        },
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
  return { context, nodes, track: new MusicTrack(context, "/music.mp3", {}) };
}

test("pause/resume and loop use the audio clock at unchanged pitch", async (t) => {
  const { context, nodes, track } = fixture(t);
  await track.play();
  context.currentTime = 13;
  assert.equal(track.currentTime, 3);
  track.pause();
  context.currentTime = 50;
  assert.equal(track.currentTime, 3);
  await track.play();
  assert.equal(nodes[1].offset, 3);
  assert.equal(nodes[0].stopped, true);
  for (const node of nodes) {
    assert.equal(node.loop, true);
    assert.equal(node.playbackRate.value, 1);
    assert.equal(node.detune.value, 0);
  }
  assert.equal(
    fetch.mock.callCount(),
    1,
    "resuming reuses the decoded recording",
  );
});

test("a mute while decoding prevents late playback", async (t) => {
  const { context, nodes, track } = fixture(t);
  let finish;
  context.decodeAudioData = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const playing = track.play();
  await new Promise((resolve) => setImmediate(resolve));
  track.pause();
  finish({ duration: 10 });
  await playing;
  assert.equal(nodes.length, 0);
  await track.play();
  assert.equal(nodes.length, 1);
});

test("changing scene discards an older in-flight decode", async (t) => {
  const { context, nodes, track } = fixture(t);
  let finish;
  context.decodeAudioData = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const old = track.play();
  await new Promise((resolve) => setImmediate(resolve));
  track.src = "/indoors.mp3";
  track.load();
  context.decodeAudioData = async () => ({ duration: 20 });
  await track.play();
  finish({ duration: 10 });
  await old;
  assert.equal(track.duration, 20);
  assert.equal(nodes.length, 1);
});

test("concurrent starts create only one source; disposal cancels pending starts", async (t) => {
  const { nodes, track } = fixture(t);
  await Promise.all([track.play(), track.play()]);
  assert.equal(nodes.length, 1);
  track.dispose();
  assert.equal(nodes[0].stopped, true);
  assert.equal(track.buffer, null);
  const pending = track.play();
  track.dispose();
  await pending;
  assert.equal(nodes.length, 1);
});

test("decode failures report the error without starting a source", async (t) => {
  const { context, nodes, track } = fixture(t);
  const error = new Error("corrupt recording");
  context.decodeAudioData = async () => {
    throw error;
  };
  let reported;
  track.onerror = () => {
    reported = track.error;
  };
  await assert.rejects(track.play(), /corrupt recording/);
  assert.equal(reported, error);
  assert.equal(nodes.length, 0);
});

test("preparing Home stays silent and reuses its decode across room visits", async (t) => {
  const { context, nodes, track } = fixture(t);
  let decodes = 0;
  context.decodeAudioData = async () => {
    decodes++;
    return { duration: 10 };
  };
  await Promise.all([track.preload("/home.mp3"), track.preload("/home.mp3")]);
  assert.equal(nodes.length, 0, "Preparation must not start playback");
  assert.equal(decodes, 1);
  await track.play();
  for (let visit = 0; visit < 2; visit++) {
    track.load();
    track.src = "/home.mp3";
    await track.play();
    assert.equal(decodes, 2, "Home entry must not decode the recording again");
    track.load();
    track.src = "/music.mp3";
  }
  assert.equal(fetch.mock.callCount(), 2);
  track.dispose();
  assert.equal(track.preloaded.size, 0);
});

test("muting during Home preparation prevents playback, then unmute reuses it", async (t) => {
  const { context, nodes, track } = fixture(t);
  let finish;
  context.decodeAudioData = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  track.src = "/home.mp3";
  const preparation = track.preload(track.src);
  const playing = track.play();
  await new Promise((resolve) => setImmediate(resolve));
  track.pause();
  finish({ duration: 10 });
  await Promise.all([preparation, playing]);
  assert.equal(nodes.length, 0);
  await track.play();
  assert.equal(nodes.length, 1);
  assert.equal(fetch.mock.callCount(), 1);
});

test("disposal cancels pending Home preparation without keeping its buffer", async (t) => {
  const { context, nodes, track } = fixture(t);
  let finish;
  context.decodeAudioData = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const preparation = track.preload("/home.mp3");
  const rejected = assert.rejects(preparation, { name: "AbortError" });
  await new Promise((resolve) => setImmediate(resolve));
  track.dispose();
  finish({ duration: 10 });
  await rejected;
  assert.equal(nodes.length, 0);
  assert.equal(track.preloaded.size, 0);
});
