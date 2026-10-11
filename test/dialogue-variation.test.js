import test from "node:test";
import assert from "node:assert/strict";
import { dialogueOptions } from "../public/data/dialogue-options.js";
import { npcs } from "../public/data/content.js";
import { shops } from "../public/data/shops.js";
import { isChineseDialogue } from "../public/data/language.js";
import { varyDialogue } from "../server/dialogue-variation.js";
import { createDialogueVariations } from "../public/game/dialogue-variation.js";

const base = {
  chinese: "你好！你想吃点什么？",
  pinyin: "nǐ hǎo",
  meaning: "Hello! What would you like to eat?",
  topic: "food",
};
const fresh = {
  chinese: "你好！今天想吃点什么东西？",
  meaning: "Hello! What would you like to eat today?",
  topic: "food",
};
const draws =
  (...values) =>
  () => {
    assert.ok(values.length, "Unexpected random draw");
    return values.shift();
  };
const providerResponse = (provider, line) => ({
  ok: true,
  json: async () =>
    provider === "gemini"
      ? {
          candidates: [
            { content: { parts: [{ text: JSON.stringify(line) }] } },
          ],
        }
      : { message: { content: JSON.stringify(line) } },
});

test("NPC and shop presets stay distinct and beginner-safe without generic filler", () => {
  for (const line of [
    ...Object.values(npcs).map((n) => n.greeting),
    ...Object.values(shops).map((s) => ({
      chinese: s.greeting,
      meaning: s.meaning,
      pinyin: s.pinyin,
    })),
  ]) {
    const options = dialogueOptions(line);
    assert.ok(options.length === 1 || options.length === 3);
    assert.equal(new Set(options.map((o) => o.chinese)).size, options.length);
    for (const option of options) {
      assert.ok(isChineseDialogue(option.chinese), option.chinese);
      assert.ok(option.pinyin, option.chinese);
      assert.ok(option.meaning);
    }
  }
});
test("50 percent boundary selects presets below .5 and fresh generation at .5 for both providers", async () => {
  for (const provider of ["ollama", "gemini"]) {
    const preset = await varyDialogue(base, {
      provider,
      random: draws(0.7, 0.4999),
      fetcher: () => assert.fail("Preset selection must not call the LLM"),
    });
    assert.equal(preset.chinese, dialogueOptions(base)[2].chinese);
    const generated = await varyDialogue(base, {
      provider,
      apiKey: "test",
      random: draws(0, 0.5),
      fetcher: async (_, options) => {
        const body = JSON.parse(options.body);
        const payload =
          provider === "gemini"
            ? body.contents[0].parts[0].text
            : body.messages.at(-1).content;
        assert.deepEqual(
          JSON.parse(payload).presets,
          dialogueOptions(base).map((o) => o.chinese),
        );
        const system = provider === "gemini"
          ? body.systemInstruction.parts[0].text
          : body.messages[0].content;
        assert.match(system, /Use reassurance.*sparingly/);
        assert.match(system, /Do not add reassurance to ordinary greetings, prices, directions/);
        return providerResponse(provider, fresh);
      },
    });
    assert.equal(generated.chinese, fresh.chinese);
    assert.equal(generated.mode, "local");
    assert.match(generated.pinyin, /jīn tiān/);
  }
});
test("invalid, repeated and unavailable model lines fall back to a preset", async () => {
  for (const bad of [
    { ...fresh, chinese: base.chinese },
    { ...fresh, chinese: "这里的技艺精湛。" },
    { ...fresh, chinese: "Try noodles!" },
    null,
  ]) {
    const result = await varyDialogue(base, {
      provider: "ollama",
      generateOnly: true,
      random: () => 0,
      fetcher: async () => providerResponse("ollama", bad),
    });
    assert.equal(result.chinese, base.chinese);
    assert.equal(result.mode, "authored");
  }
  const result = await varyDialogue(base, {
    provider: "ollama",
    generateOnly: true,
    random: () => 0,
    fetcher: async () => {
      throw Error("offline");
    },
  });
  assert.equal(result.chinese, base.chinese);
  await assert.rejects(varyDialogue({ chinese: "<script>" }));
});
test("generation cannot change prices or quantities", async () => {
  for (const [original, changed] of [
    ["面条8元。", "面条9元。"],
    ["面条八元一碗。", "一碗面条九元。"],
  ]) {
    const result = await varyDialogue(
      { chinese: original, meaning: "Noodles cost eight yuan.", topic: "food" },
      {
        provider: "ollama",
        generateOnly: true,
        random: () => 0,
        fetcher: async () =>
          providerResponse("ollama", {
            chinese: changed,
            meaning: "Noodles cost nine yuan.",
            topic: "food",
          }),
      },
    );
    assert.equal(result.chinese, original);
  }
});
test("client rolls once per presentation; generated speech, replay and translation stay together", async () => {
  const shown = [];
  const variations = createDialogueVariations({
    random: draws(0, 0.5),
    request: async () => ({ ...fresh, pinyin: "fresh pinyin" }),
  });
  const entry = variations.present(base, (line) => shown.push(line));
  await entry.promise;
  assert.equal(await variations.spoken(base.chinese), fresh.chinese);
  assert.equal(await variations.spoken(fresh.chinese), fresh.chinese);
  assert.equal(entry.chosen.meaning, fresh.meaning);
  assert.equal(shown.length, 2);
  assert.equal(shown.at(-1).pinyin, "fresh pinyin");
});
test("speech starts while a rewrite is pending and keeps displayed words stable", async () => {
  let release;
  const shown = [];
  const variations = createDialogueVariations({
    random: () => 0.9,
    request: () => new Promise(resolve => { release = resolve; }),
  });
  const entry = variations.present(base, line => shown.push(line));
  const visible = entry.chosen;
  const speech = await Promise.race([
    Promise.resolve(variations.spoken(visible.chinese)),
    new Promise((_, reject) => setTimeout(() => reject(Error("Speech waited for the rewrite")), 100)),
  ]);
  assert.equal(speech, visible.chinese);
  await Promise.resolve();
  release(fresh);
  await entry.promise;
  assert.equal(shown.length, 1);
  assert.equal(entry.chosen, visible);
  assert.equal(variations.spoken(visible.chinese), visible.chinese);
  variations.cancel();
  const next = variations.present(base, line => shown.push(line));
  assert.equal(next.chosen.chinese, fresh.chinese, "completed rewrite is available for a future visit");
  variations.cancel();
  await next.promise;
});
test("speaking an unregistered line never starts an AI rewrite", () => {
  const variations = createDialogueVariations({
    random: () => assert.fail("Speech must not roll for new dialogue"),
    request: () => assert.fail("Speech must not request an AI rewrite"),
  });
  assert.equal(variations.spoken(base.chinese), base.chinese);
});
test("closing or replacing a presentation prevents stale model updates", async () => {
  let release,
    active = true;
  const shown = [];
  const variations = createDialogueVariations({
    random: () => 0.9,
    request: () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  });
  const first = variations.present(
    base,
    (line) => shown.push(line),
    () => active,
  );
  await Promise.resolve();
  active = false;
  release(fresh);
  await first.promise;
  assert.equal(shown.length, 1);
  active = true;
  const second = variations.present(base, (line) => shown.push(line));
  await Promise.resolve();
  variations.cancel();
  release(fresh);
  await second.promise;
  assert.equal(shown.length, 2);
});
test("client preset branch works offline and never generates on replay", async () => {
  const variations = createDialogueVariations({
    random: draws(0.7, 0.4999),
    request: () => assert.fail("No network for preset branch"),
  });
  let selected;
  variations.present(base, (line) => {
    selected = line;
  });
  assert.equal(selected.chinese, dialogueOptions(base)[2].chinese);
  assert.equal(await variations.spoken(base.chinese), selected.chinese);
});

test("characters have distinct, scene-appropriate discussion subjects in old HSK 2–3", async () => {
  const { conversationSubjects, npcSubjects, conversationOpeningOptions } =
    await import("../public/data/conversation-subjects.js");
  const { waitingOpeningOptions } = await import("../public/data/station-waiting-characters.js");
  const { travelerById, stationSubjects } = await import("../public/data/station-travelers.js");
  assert.ok(Object.keys(conversationSubjects).length >= 16 + Object.keys(stationSubjects).length);
  for (const [id, npc] of Object.entries(npcs)) {
    assert.equal(new Set(npcSubjects[id]).size, travelerById[id] ? 3 : 4, id);
    const options = dialogueOptions({
      ...npc.greeting,
      purpose: "opening",
      npcId: id,
    });
    const expected = (waitingOpeningOptions[id] ? waitingOpeningOptions[id].length + 1 : 0) || Object.values(shops).find(shop => shop.seller === id)?.openings?.length || travelerById[id]?.openings.length || (["yun", "visitor-4"].includes(id) ? 7 : 5);
    assert.equal(options.length, expected);
    assert.equal(new Set(options.map((o) => o.chinese)).size, expected, id);
    assert.equal(conversationOpeningOptions(id).length, expected - 1);
    for (const option of options)
      assert.ok(isChineseDialogue(option.chinese), `${id}: ${option.chinese}`);
  }
  for (const subject of Object.values(conversationSubjects)) {
    assert.ok(subject.patterns.length >= 2);
    for (const [chinese, meaning, pinyin] of [
      ...subject.lines,
      subject.response,
    ]) {
      assert.ok(isChineseDialogue(chinese), chinese);
      assert.ok(meaning && pinyin);
    }
  }
});
test("story conversations recognize new subjects and avoid recent authored follow-ups", async () => {
  const { storyReply } = await import("../server/dialogue.js");
  const { newState } = await import("../server/store.js");
  const { conversationSubjects } =
    await import("../public/data/conversation-subjects.js");
  for (const [key, question] of [
    ["weather", "天气"],
    ["family", "说说你的家人"],
    ["sports", "运动"],
    ["routines", "每天"],
    ["music", "音乐"],
    ["plans", "周末计划"],
  ]) {
    const first = storyReply("lin", question, newState(), null, {
      random: () => 0,
    });
    assert.equal(first.chinese, conversationSubjects[key].response[0]);
    const next = storyReply("lin", question, newState(), null, {
      random: () => 0,
      history: [{ npc: "lin", reply: first }],
    });
    assert.notEqual(next.chinese, first.chinese);
  }
});
test("both live providers receive subject variety and the actual displayed opening", async () => {
  const { reply } = await import("../server/dialogue.js");
  const { newState } = await import("../server/store.js");
  for (const provider of ["ollama", "gemini"]) {
    const line = {
      chinese: "你每天几点起床？",
      meaning: "What time do you get up every day?",
      topic: "activities",
    };
    const result = await reply("lin", "七点。", [], newState(), {
      provider,
      apiKey: "test",
      currentLine: line,
      fetcher: async (_, options) => {
        const request = JSON.parse(options.body);
        const system =
          provider === "gemini"
            ? request.systemInstruction.parts[0].text
            : request.messages[0].content;
        assert.match(system, /Study and learning Chinese/);
        assert.match(system, /avoid repeating|Avoid repeating/);
        assert.ok(system.includes(line.chinese));
        assert.match(system, /OLD HSK 2–3 pattern/);
        assert.match(system, /Use reassurance.*sparingly/);
        return providerResponse(provider, {
          chinese: "七点不太晚。你起床以后做什么？",
          meaning: "Seven isn't too late. What do you do after getting up?",
          topic: "activities",
        });
      },
    });
    assert.equal(result.mode, "local");
  }
});
test("ambient dialogue rolls once during a visit, never once per frame", async () => {
  const { createAmbientDialogue } =
    await import("../public/game/dialogue-variation.js");
  let rolls = 0;
  const bubble = createAmbientDialogue({
    random: () => {
      rolls++;
      return 0;
    },
    request: () => assert.fail("Preset branch"),
  });
  const first = bubble("慢慢走吧。", "yun", "shanghai", 0);
  for (let t = 0; t < 50; t++)
    assert.equal(bubble("慢慢走吧。", "yun", "shanghai", t), first);
  assert.equal(rolls, 2);
});
test("generated discovery hints remain spoiler-free", async () => {
  const { landmarkReply } = await import("../server/panda-landmarks.js");
  for (const area of ["stuffie", "fox-plush"]) {
    const good = await landmarkReply(
      { area },
      {
        provider: "ollama",
        fetcher: async () =>
          providerResponse("ollama", {
            chinese: "那边有什么东西？我们一起看看吧。",
          }),
      },
    );
    assert.equal(good.mode, "generated");
    const bad = await landmarkReply(
      { area },
      {
        provider: "ollama",
        random: () => 0,
        fetcher: async () =>
          providerResponse("ollama", { chinese: "竹子后面有一个狐狸玩具。" }),
      },
    );
    assert.equal(bad.mode, "stored");
  }
});

test("runtime dialogue keeps its words, pronunciation and meaning without reassurance suffixes", () => {
  for (const line of [
    {
      chinese: "我们先过桥，再去书店。",
      pinyin: "wǒ men xiān guò qiáo, zài qù shū diàn",
      meaning: "Let's cross the bridge first, then go to the bookshop.",
      topic: "travel",
    },
    { chinese: "面条8元。", meaning: "Noodles cost eight yuan.", topic: "food" },
    { chinese: "已经找到两朵花了。", meaning: "Two flowers have been found.", topic: "activities" },
    { chinese: "请说：我想买衣服。", meaning: "Please say: I want to buy clothes.", topic: "activities" },
  ]) assert.deepEqual(dialogueOptions(line), [line]);
});
test("client and server keep runtime dialogue free of generic filler offline", async () => {
  const line = {
    chinese: "面条8元。",
    pinyin: "miàn tiáo bā yuán 。",
    meaning: "Noodles cost eight yuan.",
    topic: "food",
  };
  for (const roll of [0, 0.4, 0.9]) {
    const result = await varyDialogue(line, { provider: "story", random: () => roll });
    assert.equal(result.chinese, line.chinese);
    assert.equal(result.meaning, line.meaning);
    const variations = createDialogueVariations({
      random: () => roll,
      request: async () => { throw Error("offline"); },
    });
    const shown = [];
    const entry = variations.present(line, value => shown.push(value));
    await entry.promise;
    assert.equal(shown.length, 1);
    assert.equal(entry.chosen.chinese, line.chinese);
    assert.equal(entry.chosen.meaning, line.meaning);
  }
});


test("Duoduo can open with her stuffed rabbit and a little-animal question", () => {
  const options = dialogueOptions({ ...npcs["waiting-granddaughter"].greeting, purpose: "opening", npcId: "waiting-granddaughter" });
  const animal = options.find(option => option.chinese.includes("你也喜欢小动物吗"));
  assert.ok(animal);
  assert.match(animal.chinese, /兔子玩偶/);
  assert.match(animal.meaning, /stuffed rabbit/);
  assert.ok(animal.pinyin);
  assert.ok(isChineseDialogue(animal.chinese));
  assert.equal(options.length, 3);
});
