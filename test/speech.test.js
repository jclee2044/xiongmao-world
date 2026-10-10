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
  assert.equal(utterance.volume, 1);
  assert.equal(request, undefined);
  const nativeUtterance = utterance;
  const context = { source: "我只有一只羊。", start: 4 };
  await speech.speak("只", false, "female", context);
  assert.equal(utterance, nativeUtterance);
  assert.deepEqual(request, {
    text: "只",
    slow: false,
    voice: "young-female",
    context,
  });
  speech.stop();
  // The approved native female voice must not replace either new character voice.
  for (const voice of [
    "young-male",
    "older-female",
    "older-male-kokoro",
    "female-kokoro-001",
    "female-kokoro-026",
    "male-kokoro-009",
    "panda",
  ]) {
    await speech.speak("你好。", false, voice);
    assert.equal(request.voice, voice);
    speech.stop();
  }
  await speech.speak("嘿嘿！你想喝茶吗？", false, "panda");
  assert.deepEqual(request, {
    text: "嘿嘿！你想喝茶吗？",
    slow: false,
    voice: "panda",
  });
  speech.stop();
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
  assert.equal(Object.keys(voiceProfiles).length, 12);
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
  const additions = {
    lin: "male-kokoro-009",
    hao: "male-kokoro-014",
    diner: "male-kokoro-020",
    reader: "male-kokoro-055",
    "clothing-customer": "male-kokoro-055",
    "bamboo-worker": "male-kokoro-068",
    mei: "female-kokoro-001",
    qiao: "female-kokoro-026",
  };
  for (const [id, voice] of Object.entries(additions))
    assert.equal(voiceForNpc(id), voice);
  assert.equal(voiceForNpc("diner", "hao"), "male-kokoro-020");
  assert.equal(voiceForNpc("kid-one", "hao"), "young-male");
  assert.equal(voiceForNpc("kid-two", "lan"), "young-female");
  assert.equal(voiceForNpc("visitor-0"), "older-male");
  assert.equal(voiceForNpc("reader", "bo"), "older-male");
  assert.equal(voiceForNpc("reader", "reader"), "male-kokoro-055");
  assert.equal(normalizeVoice("female"), "young-female");
  assert.equal(normalizeVoice("male"), "older-male");
  assert.equal(normalizeVoice("__proto__"), "older-male");
  assert.equal(normalizeVoice("panda"), "panda");
  assert.equal(normalizeVoice("panda", false), "panda");
  const older = Object.values(npcVoiceProfiles).filter((v) =>
    v.startsWith("older-male"),
  );
  assert.equal(older.filter((v) => v === "older-male").length, 4);
  assert.equal(older.filter((v) => v === "older-male-kokoro").length, 4);
  for (const id of ["wei", "gardener", "visitor-2", "courtyard-caretaker"])
    assert.equal(voiceForNpc(id), "older-male-kokoro");
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

test("Panda keeps the approved audition A speaker and effect independently of NPC rollback", async () => {
  const { pandaVoiceProfile, normalizeVoice } =
    await import("../public/data/voices.js");
  assert.equal(pandaVoiceProfile.speaker, "zm_009");
  assert.equal(pandaVoiceProfile.sid, 58);
  assert.equal(pandaVoiceProfile.effect, "panda-light-v1");
  assert.equal(normalizeVoice("panda", false), "panda");
});
