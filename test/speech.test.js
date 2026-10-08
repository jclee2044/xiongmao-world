import test from "node:test";
import assert from "node:assert/strict";
import { Speech } from "../public/game/speech.js";

test("late mobile female voices are refreshed; missing voices request neural server speech", async (t) => {
  const keys = [
    "window",
    "speechSynthesis",
    "SpeechSynthesisUtterance",
    "fetch",
    "Audio",
  ];
  const originals = keys.map((key) => [
    key,
    Object.getOwnPropertyDescriptor(globalThis, key),
  ]);
  t.after(() => {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  let voices = [],
    utterance,
    request,
    stopped = false;
  globalThis.speechSynthesis = {
    getVoices: () => voices,
    addEventListener() {},
    cancel() {},
    speak(value) {
      utterance = value;
    },
  };
  globalThis.window = { speechSynthesis };
  globalThis.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
    }
  };
  globalThis.fetch = async (_url, options) => {
    request = JSON.parse(options.body);
    return new Response(new Blob(["fixture"]));
  };
  globalThis.Audio = class {
    async play() {}
    pause() {
      stopped = true;
    }
    removeAttribute() {}
    load() {}
  };
  const speech = new Speech(
    () => {},
    () => ({ voice: true, voiceVolume: 0.7 }),
  );
  voices = [{ lang: "zh_CN", name: "Tian-Tian", localService: true }];
  await speech.speak("你喝茶吗？！", true, "female");
  assert.equal(utterance.voice, voices[0]);
  assert.equal(utterance.text, "你喝茶吗。");
  assert.equal(utterance.rate, 0.65);
  assert.equal(request, undefined);
  voices = [];
  await speech.speak("你想喝什么？？", false, "female");
  assert.deepEqual(request, {
    text: "你想喝什么。",
    slow: false,
    voice: "female",
  });
  assert.equal(speech.active, true);
  speech.audio.onended();
  assert.equal(speech.active, false);
  assert.equal(speech.audio, null);
  assert.equal(speech.url, null);
  assert.equal(stopped, true);
});
