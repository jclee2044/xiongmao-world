import { topics } from "../../public/data/content.js";
import { isChineseDialogue } from "../../public/data/language.js";

export const replySchema = {
  type: "object",
  properties: {
    chinese: { type: "string" },
    meaning: { type: "string" },
    topic: { type: "string", enum: topics },
  },
  required: ["chinese", "meaning", "topic"],
  additionalProperties: false,
};
export function dialogueError(message, code) {
  return Object.assign(new Error(message), { code });
}
export function validateReply(data) {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    Object.keys(data).some(
      (k) => !["chinese", "pinyin", "meaning", "topic"].includes(k),
    )
  )
    throw dialogueError("Malformed model response.", "invalid-response");
  for (const [key, max] of [
    ["chinese", 180],
    ["pinyin", 500],
    ["meaning", 400],
  ])
    if (
      typeof data[key] !== "string" ||
      !data[key].trim() ||
      data[key].length > max ||
      /[<>\u0000-\u001f]/.test(data[key])
    )
      throw dialogueError("Malformed model response.", "invalid-response");
  if (!/[\p{Script=Han}]/u.test(data.chinese) || !topics.includes(data.topic))
    throw dialogueError("Malformed model response.", "invalid-response");
  if (!isChineseDialogue(data.chinese))
    throw dialogueError(
      "Model reply exceeds the old HSK 3 vocabulary limit.",
      "vocabulary",
    );
  return data;
}
