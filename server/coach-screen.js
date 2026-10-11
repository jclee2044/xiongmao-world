import { defineText } from "./dictionary.js";
import { pinyin } from "./pronunciation.js";

function cleanScreen(screen) {
  if (
    !screen ||
    typeof screen.title !== "string" ||
    typeof screen.text !== "string" ||
    screen.title.length > 120 ||
    screen.text.length > 3500 ||
    !Array.isArray(screen.controls) ||
    screen.controls.length > 60
  )
    throw Error("Invalid screen context");
  if (
    screen.controls.some(
      (c) =>
        typeof c.label !== "string" ||
        c.label.length > 180 ||
        typeof c.meaning !== "string" ||
        c.meaning.length > 250 ||
        typeof c.disabled !== "boolean" ||
        !Number.isFinite(c.bottom),
    )
  )
    throw Error("Invalid screen control");
  return screen;
}
// Resolve deictic UI questions locally. The model cannot invent a control or
// infer a hidden action from a screen title. Labels and hints are display data.
export function screenHelp(question, input) {
  const screen = cleanScreen(input);
  const namedControl = screen.controls.some((c) =>
    question.toLowerCase().includes(c.label.toLowerCase()),
  );
  const controlQuestion =
    namedControl ||
    /button|control|at the bottom|按钮|下面|底下|控件/i.test(question);
  const quoted =
    question.match(/[“"「]([^”"」]+)[”"」]/u)?.[1] ||
    (/meaning|mean/i.test(question)
      ? question.match(/\p{Script=Han}+/u)?.[0]
      : null);
  const reply = (
    explanation,
    chinese = "你想问哪一个？请说一下上面的字。",
  ) => ({
    explanation,
    chinese,
    pinyin: pinyin(chinese),
    mode: "screen",
  });
  if (/which controls|what controls/i.test(question))
    return reply(
      screen.controls.length
        ? `Visible controls on “${screen.title}”: ${screen.controls.map((c) => `“${c.label}”${c.disabled ? " (unavailable)" : ""}`).join(", ")}. Ask about a label to learn more.`
        : "No controls are visible in the current screen.",
    );
  if (controlQuestion) {
    let candidates = screen.controls.filter((c) =>
      question.toLowerCase().includes(c.label.toLowerCase()),
    );
    if (!candidates.length && /bottom|下面|底下/i.test(question)) {
      const bottom = Math.max(...screen.controls.map((c) => c.bottom));
      candidates = screen.controls.filter((c) => bottom - c.bottom <= 24);
    }
    if (candidates.length !== 1)
      return reply(
        candidates.length
          ? `I can see several possible controls: ${candidates.map((c) => `“${c.label}”`).join(", ")}. Which label do you mean?`
          : "Which control do you mean? Please tell me its label, or scroll it into view and open Panda help again.",
      );
    const c = candidates[0];
    const meanings = /\p{Script=Han}/u.test(c.label)
      ? defineText(c.label.slice(0, 180))
          .tokens.filter((w) => !w.punctuation && w.meaning)
          .map((w) => `${w.zh}: ${w.meaning}`)
          .join("; ")
      : "";
    return reply(
      `On “${screen.title}”, the control says “${c.label}”. ${c.meaning || meanings || "That is the action label shown on this screen."}${c.disabled ? " It is currently unavailable." : ""}`,
      /\p{Script=Han}/u.test(c.label)
        ? `上面写着“${c.label}”。`
        : "看看上面的字。",
    );
  }
  if (quoted) {
    const visibleText =
      screen.text + screen.controls.map((c) => c.label).join("\n");
    if (!visibleText.includes(quoted))
      return reply(
        `I cannot find “${quoted}” on the current screen. Which visible words do you mean?`,
      );
    if (/\p{Script=Han}/u.test(quoted)) {
      const words = defineText(quoted.slice(0, 180)).tokens;
      return reply(
        words
          .filter((w) => !w.punctuation)
          .map((w) => `${w.zh} (${w.pinyin}): ${w.meaning}`)
          .join("; "),
        quoted,
      );
    }
  }
  if (/what does (this|that) mean/i.test(question))
    return reply(
      "Which words do you mean? Please quote the visible label or sentence.",
    );
  return null;
}
