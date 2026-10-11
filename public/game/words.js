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
    const voice = "panda";
    speech.speak(word.zh, false, voice, word.context);
    const list = word.meaning && word.pinyin && !word.meaning.includes("unavailable")
      ? [word] : await tokens(word.zh);
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
    listen.onclick = () => speech.speak(word.zh, false, voice, word.context);
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
    const above = r.top - b.height - 12;
    const top = anchor.matches(".map-pin") && above < 10
      ? Math.min(innerHeight - b.height - 10, r.bottom + 12)
      : Math.max(10, above);
    callout.style.top = `${top}px`;
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
        const interactive = el.closest("button,a");
        const b = document.createElement(interactive ? "span" : "button");
        if (interactive) {
          b.setAttribute("role", "button");
          b.tabIndex = 0;
        } else b.type = "button";
        b.className = "help-word";
        b.textContent = w.zh;
        // Keep the spoken word and dictionary anchor together when the line wraps.
        if (el.id === "npc-zh" && w.pinyin) b.dataset.pinyin = w.pinyin;
        if (!interactive) b.setAttribute("aria-label", `看看“${w.zh}”的意思`);
        b.onclick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          show(w, b);
        };
        b.onkeydown = (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            show(w, b);
          }
        };
        return b;
      }),
    );
  }
  // Annotate text leaves, preserving surrounding controls and their handlers.
  function scan() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const leaves = [];
    while (walker.nextNode()) {
      const node = walker.currentNode, parent = node.parentElement;
      if (!parent || !/\p{Script=Han}/u.test(node.textContent) ||
          parent.closest("script,style,textarea,select,option,svg,canvas,#word-callout,.help-word,[data-world-sign],[data-map-stop],[data-coach-prompt],[data-conversation-subject],[data-word-leaf],.pinyin,[hidden],dialog:not([open])")) continue;
      leaves.push(node);
    }
    for (const node of leaves) {
      const wrapper = document.createElement("span");
      wrapper.dataset.wordLeaf = "";
      node.replaceWith(wrapper);
      wrapper.append(node);
      annotate(wrapper);
    }
  }
  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["open", "hidden"] });
  scan();
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
  async function showText(text, anchor) {
    const words = (await tokens(text)).filter((w) => !w.punctuation);
    if (words.length === 1) return show(words[0], anchor);
    return show({ zh: text }, anchor);
  }
  return { annotate, hide, showText };
}
