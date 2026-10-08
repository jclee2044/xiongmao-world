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
  // The approved native female voice must not replace either new character voice.
  for (const voice of ["young-male", "older-female"]) {
    await speech.speak("你好。", false, voice);
    assert.equal(request.voice, voice);
    speech.stop();
  }
  voices = [];
  await speech.speak("你想喝什么？？", false, "female");
  assert.deepEqual(request, {
    text: "你想喝什么。",
    slow: false,
    voice: "young-female",
  });
  assert.equal(speech.active, true);
  speech.audio.onended();
  assert.equal(speech.active, false);
  assert.equal(speech.audio, null);
  assert.equal(speech.url, null);
  assert.equal(stopped, true);
});

test("all NPCs have a cast voice and appearance overrides preserve the visible character", async () => {
  const { npcs } = await import("../public/data/content.js");
  const { npcVoiceProfiles, voiceProfiles, voiceForNpc, normalizeVoice } =
    await import("../public/data/voices.js");
  assert.equal(Object.keys(voiceProfiles).length, 4);
  assert.deepEqual(
    Object.keys(npcVoiceProfiles).sort(),
    Object.keys(npcs).sort(),
  );
  for (const [id, npc] of Object.entries(npcs)) {
    assert.ok(voiceProfiles[npc.voiceProfile], id);
    assert.equal(
      voiceProfiles[npc.voiceProfile].gender,
      npc.voice || "male",
      id,
    );
  }
  for (const id of ["yun", "baker", "silk-host"])
    assert.equal(voiceForNpc(id), "older-female");
  for (const id of ["lin", "hao", "reader", "clothing-customer"])
    assert.equal(voiceForNpc(id), "young-male");
  assert.equal(voiceForNpc("visitor-0"), "older-male");
  assert.equal(voiceForNpc("reader", "bo"), "older-male");
  assert.equal(voiceForNpc("reader", "reader"), "young-male");
  assert.equal(normalizeVoice("female"), "young-female");
  assert.equal(normalizeVoice("male"), "older-male");
  assert.equal(normalizeVoice("__proto__"), "older-male");
  for (const [id, profile] of Object.entries(voiceProfiles)) {
    assert.equal(
      normalizeVoice(id, false),
      profile.gender === "female" ? "young-female" : "older-male",
    );
  }
});

test("approved speaker identities are preserved and new speaker indices match the installed model", async (t) => {
  const { voiceProfiles } = await import("../public/data/voices.js");
  const { existsSync, readFileSync } = await import("node:fs");
  assert.deepEqual(voiceProfiles["young-female"], {
    gender: "female",
    model: "aishell3",
    speaker: "SSB0005",
    sid: 0,
  });
  assert.deepEqual(voiceProfiles["older-male"], {
    gender: "male",
    model: "wnj",
    speaker: "WNJ",
    sid: 0,
  });
  const path = "tools/vits-icefall-zh-aishell3/speakers.txt";
  if (!existsSync(path))
    return t.skip("Optional local speech model not installed");
  const speakers = readFileSync(path, "utf8").trim().split(/\r?\n/);
  for (const p of Object.values(voiceProfiles)) {
    if (p.model === "aishell3") assert.equal(speakers[p.sid], p.speaker);
  }
});
