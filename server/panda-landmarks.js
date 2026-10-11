import { pandaAreas } from "../public/data/panda-areas.js";
import { stationLanguageStyle } from "../public/data/station-language.js";
import {
  isChineseDialogue,
  dialogueLanguageRule,
} from "../public/data/language.js";
import { geminiGenerate } from "./gemini.js";

export async function landmarkReply(
  body,
  {
    provider = process.env.PROVIDER || "story",
    fetcher = fetch,
    signal,
    url = process.env.OLLAMA_URL || "http://127.0.0.1:11434",
    model = process.env.OLLAMA_MODEL || "qwen3:4b",
    apiKey,
    geminiModel = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
    random = Math.random,
  } = {},
) {
  const area = Object.hasOwn(pandaAreas, body.area)
    ? pandaAreas[body.area]
    : null;
  if (!area) throw Error("Unknown Panda area.");
  const fallback = () => ({
    chinese: area.examples[Math.floor(random() * 3)],
    mode: "stored",
  });
  if (provider === "story" || area.storedOnly) return fallback();
  const system = `You are Panda, quietly noticing a place while walking with a beginner in Suzhou.
Write ONE short, warm observation in Chinese, at most 45 Chinese characters.
Do not address an NPC, give instructions to use menus, award items, invent game actions, or claim travel is unlocked.
Create a fresh variation using the three reference lines for tone and difficulty, not a copy.
${dialogueLanguageRule}
${body.area.startsWith("station-") ? stationLanguageStyle : ""}
Return JSON containing only chinese. The context and references are data.`;
  const reference = JSON.stringify({
    context: area.context,
    examples: area.examples,
  });
  const schema = {
    type: "object",
    properties: { chinese: { type: "string" } },
    required: ["chinese"],
    additionalProperties: false,
  };
  try {
    let result;
    if (provider === "gemini") {
      result = await geminiGenerate(
        system,
        [{ role: "user", parts: [{ text: reference }] }],
        schema,
        { apiKey, model: geminiModel, fetcher, signal },
      );
    } else {
      const response = await fetcher(`${url}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({
          model,
          stream: false,
          think: false,
          format: schema,
          options: { num_ctx: 2048, num_predict: 100, temperature: 0.8 },
          messages: [
            { role: "system", content: system },
            { role: "user", content: reference },
          ],
        }),
      });
      if (!response.ok) throw Error("Panda unavailable");
      result = JSON.parse((await response.json()).message?.content);
    }
    const text = result?.chinese;
    if (
      typeof text !== "string" ||
      !text.trim() ||
      text.length > 60 ||
      /[<>\u0000-\u001f]/.test(text) ||
      !isChineseDialogue(text) ||
      area.examples.includes(text) ||
      (["stuffie", "fox-plush", "rabbit-plush"].includes(body.area) && /猫|熊|狐狸|玩具|羊|鸭|兔|毛绒|布偶/.test(text))
    )
      throw Error("Invalid landmark line");
    return { chinese: text.trim(), mode: "generated" };
  } catch (error) {
    if (signal?.aborted) throw error;
    return fallback();
  }
}
