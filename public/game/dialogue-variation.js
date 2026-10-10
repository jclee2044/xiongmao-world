import { dialogueOptions } from "../data/dialogue-options.js";
import { api } from "./persistence.js";

// One choice per presentation. Replays and translations reuse that choice.
export function createDialogueVariations({
  request = api,
  random = Math.random,
} = {}) {
  const entries = new Map();
  const ready = new Map();
  const controllers = new Set();
  let queue = Promise.resolve();
  function cancel() {
    for (const controller of controllers) controller.abort();
    controllers.clear();
    entries.clear();
    queue = Promise.resolve();
  }
  function present(base, render, active = () => true) {
    const options = dialogueOptions(base);
    let chosen = {
      ...options[Math.floor(random() * options.length)],
      mode: "authored",
      notice: "",
    };
    const generate = random() >= 0.5;
    const cacheKey = JSON.stringify([
      base.chinese,
      base.meaning,
      base.npcId,
      base.purpose,
    ]);
    if (generate && ready.has(cacheKey)) chosen = ready.get(cacheKey);
    const entry = { chosen, promise: null, spoken: false };
    entries.set(base.chinese, entry);
    entries.set(chosen.chinese, entry);
    render(chosen);
    if (!generate) return entry;
    const controller = new AbortController();
    controllers.add(controller);
    entry.promise = queue
      .then(() => {
        if (controller.signal.aborted || !active()) return null;
        return request(
          "/api/dialogue-variation",
          { line: { ...chosen, npcId: base.npcId || chosen.npcId } },
          AbortSignal.any([controller.signal, AbortSignal.timeout(60000)]),
        );
      })
      .then((result) => {
        if (
          result &&
          !controller.signal.aborted &&
          active() &&
          entries.get(base.chinese) === entry
        ) {
          // A late rewrite is useful for a future visit, never during this voice.
          ready.delete(cacheKey);
          ready.set(cacheKey, result);
          if (ready.size > 64) ready.delete(ready.keys().next().value);
          if (!entry.spoken) {
            entry.chosen = result;
            entries.set(result.chinese, entry);
            render(result);
          }
        }
      })
      .catch(() => {})
      .finally(() => controllers.delete(controller));
    queue = entry.promise;
    return entry;
  }
  function retain(line) {
    entries.set(line.chinese, { chosen: line, promise: null });
  }
  function spoken(text) {
    const entry = entries.get(text);
    if (!entry) return text;
    // Synthesis must start with the visible words, without waiting for the LLM.
    entry.spoken = true;
    return entry.chosen.chinese;
  }
  function prepare(container) {
    for (const node of container.querySelectorAll("p.chinese")) {
      if (
        node.dataset.dialogueVariation ||
        !/\p{Script=Han}/u.test(node.textContent)
      )
        continue;
      const original = node.textContent;
      // Vocabulary labels and selected basket contents are not dialogue.
      if (!/[。！？]/.test(original)) continue;
      node.dataset.dialogueVariation = "true";
      let sibling = node.nextElementSibling,
        py = null,
        meaning = null;
      if (sibling?.classList.contains("pinyin")) {
        py = sibling;
        sibling = sibling.nextElementSibling;
      }
      if (sibling?.classList.contains("meaning")) meaning = sibling;
      present(
        {
          chinese: original,
          pinyin: py?.textContent || "",
          meaning: meaning?.textContent || "",
          topic: "activities",
        },
        (line) => {
          node.textContent = line.chinese;
          if (py) {
            py.textContent = line.pinyin;
            py.hidden = !line.pinyin;
          }
          if (meaning) meaning.textContent = line.meaning;
        },
        () => node.isConnected && container.closest("dialog")?.open,
      );
    }
  }
  return { cancel, present, spoken, prepare, retain };
}

export function createAmbientDialogue(options = {}) {
  const variations = createDialogueVariations(options);
  const bubbles = new Map();
  let currentScene;
  return (text, id, scene) => {
    if (currentScene !== scene) {
      currentScene = scene;
      variations.cancel();
      bubbles.clear();
    }
    const key = `${id}:${text}`;
    const previous = bubbles.get(key);
    if (previous) return previous.text;
    const bubble = { text };
    bubbles.set(key, bubble);
    variations.present(
      { chinese: text, topic: "activities" },
      (line) => {
        bubble.text = line.chinese;
      },
      () => currentScene === scene && bubbles.get(key) === bubble,
    );
    return bubble.text;
  };
}
