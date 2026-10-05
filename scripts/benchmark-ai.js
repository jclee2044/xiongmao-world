import { ollamaReply } from "../server/dialogue.js";
import { newState } from "../server/store.js";
import { writeFile } from "node:fs/promises";
const state = newState(),
  history = [],
  results = [];
state.memories.mei = ["prefers mild food"];
for (const text of [
  "你好！我想吃面，但是我不太能吃辣。",
  "我喜欢看电视剧。你喜欢做什么？",
  "我今天有很多作业，你有什么建议？",
]) {
  const start = performance.now();
  try {
    const result = await ollamaReply("mei", text, history, state);
    results.push({
      text,
      seconds: Math.round((performance.now() - start) / 100) / 10,
      result,
    });
    history.push({ npc: "mei", user: text, reply: result });
  } catch (e) {
    results.push({
      text,
      seconds: Math.round((performance.now() - start) / 100) / 10,
      error: e.message,
    });
  }
  console.log(JSON.stringify(results.at(-1)));
}
await writeFile(
  "test-results/local-ai-4b.json",
  JSON.stringify(results, null, 2),
);
