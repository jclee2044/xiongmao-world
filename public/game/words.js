import { api } from "./persistence.js";
import { lexicon } from "../data/content.js";
export function createWordHelp({ discover, speech }) {
  const cache = new Map(),
    pending = new WeakMap();
  let generation = 0;
  const callout = document.createElement("div");
  callout.id = "word-callout";
  callout.setAttribute("popover", "manual");
  callout.setAttribute("role", "dialog");
  callout.setAttribute("aria-label", "词的意思");
  document.body.append(callout);
  async function tokens(text) {
    if (!cache.has(text))
      cache.set(
        text,
        api("/api/define", { text })
          .then((r) => r.tokens)
          .catch(() => {
            cache.delete(text);
            return [
              ...new Intl.Segmenter("zh", { granularity: "word" }).segment(
                text,
              ),
            ].map(
              (s) =>
                lexicon.find((w) => w.zh === s.segment) || {
                  zh: s.segment,
                  pinyin: "",
                  meaning: "Dictionary unavailable offline.",
                  punctuation: !/\p{Script=Han}/u.test(s.segment),
                },
            );
          }),
      );
    return cache.get(text);
  }
  function hide() {
    generation++;
    if (callout.matches(":popover-open")) callout.hidePopover();
  }
  async function show(word, anchor) {
    const token = ++generation;
    const list = word.meaning ? [word] : await tokens(word.zh);
    if (token !== generation || !anchor.isConnected) return;
    callout.replaceChildren();
    for (const w of list.filter((w) => !w.punctuation)) {
      const row = document.createElement("div");
      for (const [tag, value] of [
        ["strong", w.zh],
        ["em", w.pinyin],
        ["span", w.meaning],
      ]) {
        const n = document.createElement(tag);
        n.textContent = value;
        row.append(n);
      }
      callout.append(row);
      if (
        w.meaning &&
        !w.meaning.includes("unavailable") &&
        !w.meaning.startsWith("No dictionary")
      )
        discover(w);
    }
    const actions = document.createElement("div"),
      listen = document.createElement("button"),
      close = document.createElement("button");
    listen.textContent = "听一听";
    listen.onclick = () => speech.speak(word.zh);
    close.textContent = "×";
    close.setAttribute("aria-label", "关");
    close.onclick = hide;
    actions.append(listen, close);
    callout.append(actions);
    // A popover is placed in the browser top layer, above a modal dialog.
    const parent = anchor.closest("dialog") || document.body;
    if (callout.parentNode !== parent) parent.append(callout);
    callout.showPopover();
    const r = anchor.getBoundingClientRect(),
      b = callout.getBoundingClientRect();
    callout.style.left = `${Math.max(10, Math.min(innerWidth - b.width - 10, r.left + r.width / 2 - b.width / 2))}px`;
    callout.style.top = `${Math.max(10, r.top - b.height - 12)}px`;
  }
  async function annotate(el) {
    const text = el.textContent;
    if (
      !text ||
      !/\p{Script=Han}/u.test(text) ||
      pending.get(el) === text ||
      (el.dataset.words === text &&
        (el.querySelector(".help-word") || !/[\p{Letter}]/u.test(text)))
    )
      return;
    pending.set(el, text);
    el.dataset.words = text;
    const list = await tokens(text);
    pending.delete(el);
    if (!el.isConnected || el.textContent !== text) return;
    el.replaceChildren(
      ...list.map((w) => {
        if (w.punctuation) return document.createTextNode(w.zh);
        const b = document.createElement("button");
        b.type = "button";
        b.className = "help-word";
        b.textContent = w.zh;
        b.setAttribute("aria-label", `看看“${w.zh}”的意思`);
        b.onclick = () => show(w, b);
        return b;
      }),
    );
  }
  const observer = new MutationObserver(() =>
    document
      .querySelectorAll(
        "dialog[open] .chinese, #game:not([hidden]) #panda-message",
      )
      .forEach(annotate),
  );
  for (const dialog of document.querySelectorAll("dialog"))
    observer.observe(dialog, { childList: true, subtree: true });
  observer.observe(document.getElementById("panda-message"), {
    childList: true,
    subtree: true,
  });
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && callout.matches(":popover-open")) {
        e.preventDefault();
        e.stopPropagation();
        hide();
      }
    },
    true,
  );
  document.addEventListener("pointerdown", (e) => {
    if (!e.target.closest("#word-callout,.help-word")) hide();
  });
  for (const d of document.querySelectorAll("dialog"))
    d.addEventListener("close", hide);
  return { annotate, hide };
}
