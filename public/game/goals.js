import { isBeginnerChinese } from "../data/language.js";
import { AREA_XP, award } from "../data/adventure.js";
export function goalCards(a) {
  const cards = [];
  if (a.met.length < 5)
    cards.push({
      title: "认识邻居",
      detail: `和五位邻居说说话 · ${a.met.length}/5`,
      target: ["lin", "lan", "bo", "mei", "wei"].find(
        (id) => !a.met.includes(id),
      ),
      reward: "+40 XP",
      key: "meet",
    });
  if (a.hungry !== "done")
    cards.push({
      title: "和小莲一起吃饭",
      detail: {
        new: "去市场旁边找小莲。",
        invited: "小莲跟着你呢，一起去饭店吧。",
        dining: "去火锅桌子旁边，点菜、做菜、尝一尝。",
      }[a.hungry],
      target:
        a.hungry === "new"
          ? "lian"
          : a.hungry === "invited"
            ? "dumplings"
            : "hotpot",
      reward: "+60 XP",
      key: "hungry",
    });
  if (a.flowers !== "done")
    cards.push({
      title: "帮小兰找花",
      detail: {
        new: "去花店问问小兰，她在找什么。",
        accepted: "过西边的桥，去大石头旁边找花。",
        found: "把花带回花店，还给小兰。",
      }[a.flowers],
      target: a.flowers === "accepted" ? "lost-flowers" : "lan",
      reward: "+60 XP",
      key: "flowers",
    });
  if (a.tea !== "done" && a.met.length >= 2)
    cards.push({
      title: "和小乔喝茶",
      detail: {
        new: "去茶馆门口，请小乔一起喝茶。",
        invited: "跟着小乔去花园里的茶桌子。",
        seated: "去茶桌子旁边和小乔说说今天的事情。",
      }[a.tea],
      target: a.tea === "new" ? "qiao" : "tea-table",
      reward: "+60 XP",
      key: "tea",
    });
  if (a.nature.length < 3 && a.met.length >= 5)
    cards.push({
      title: "和熊猫走走",
      detail: `看看竹子、lotus flowers和Taihu rock · ${a.nature.length}/3`,
      target: ["bamboo-grove", "lake", "rock-study"].find(
        (x) => !a.nature.includes(x),
      ),
      reward: "+40 XP",
      key: "nature",
    });
  if (a.directionsFind !== "done")
    cards.push({
      key: "directionsFind",
      title: "问问路",
      detail:
        a.directionsFind === "accepted"
          ? "听小林说怎么走，去市场东边、湖下面的饭店。"
          : "问小林：饭店怎么走？",
      target: a.directionsFind === "accepted" ? "dumplings" : "lin",
      reward: "+40 XP",
    });
  if (a.directionsGive !== "done")
    cards.push({
      key: "directionsGive",
      title: "帮忙说怎么走",
      detail: "去市场东南边找小好，帮他过南边的河去书店。",
      target: "hao",
      reward: "+40 XP",
    });
  if (a.flowerDirections !== "done")
    cards.push({
      key: "flowerDirections",
      title: "找花店",
      detail: "去北边的小路找小雨，告诉她怎么去湖上面的花店。",
      target: "visitor-1",
      reward: "+40 XP",
    });
  const active = (key) =>
    ["accepted", "invited", "found", "seated", "dining"].includes(a[key]);
  cards.sort(
    (left, right) => Number(active(right.key)) - Number(active(left.key)),
  );
  if (a.xp >= AREA_XP)
    cards.unshift({
      title: "可以上船了",
      detail: "去右边下面的河边上船，去下一站。",
      target: "next-area",
      reward: "500 / 500 XP · Ready to board",
      key: "departure",
    });
  if (!cards.length)
    cards.push({
      title: "苏州的一天",
      detail: "今天帮了邻居，再走走、聊天、认识新词吧。",
      reward: "All town goals complete",
      key: "complete",
    });
  const copy = {
    meet: ["Meet your neighbors", `Talk to five neighbors · ${a.met.length}/5`],
    hungry: [
      "Share hotpot with Lian",
      {
        new: "Find Lian beside the market and invite her to eat.",
        invited: "Take Lian to the hotpot restaurant.",
        dining: "At the hotpot table, order, cook, and taste the food.",
      }[a.hungry],
    ],
    flowers: [
      "Find Lan’s missing flowers",
      {
        new: "Talk to Lan at the flower shop to start.",
        accepted:
          "Cross the western bridge and collect the flowers beside the large rock.",
        found: "Return the flowers to Lan at the flower shop.",
      }[a.flowers],
    ],
    tea: [
      "Share tea with Qiao",
      {
        new: "Invite Qiao outside the teahouse to share tea.",
        invited: "Follow Qiao to the garden tea table.",
        seated: "Join Qiao at the tea table and talk about your day.",
      }[a.tea],
    ],
    nature: [
      "Explore with Panda",
      `Visit the bamboo grove, lake, and Taihu rock · ${a.nature.length}/3`,
    ],
    directionsFind: [
      "Find the hotpot restaurant",
      a.directionsFind === "accepted"
        ? "Follow Lin’s directions to the restaurant east of the market, below the lake."
        : "Ask Lin how to find the hotpot restaurant.",
    ],
    directionsGive: [
      "Help Hao find the bookshop",
      "Talk to Hao southeast of the market and help him with directions.",
    ],
    flowerDirections: [
      "Help Xiaoyu find the flower shop",
      "Find Xiaoyu on the north lane and give her directions.",
    ],
    departure: [
      "Take the boat",
      "Board at the southeast canal dock to visit the Suzhou Station quay.",
    ],
    complete: [
      "Enjoy the town",
      "Explore, chat with neighbors, or practice another activity.",
    ],
  };
  for (const card of cards) [card.title, card.detail] = copy[card.key];
  return cards;
}
export function createGoals({ persistence, world, panda, speech }) {
  const root = document.getElementById("goals-list");
  let last = "";
  function refresh() {
    const cards = goalCards(persistence.state.adventure),
      key = JSON.stringify(cards);
    if (last === key) return;
    last = key;
    root.replaceChildren(
      ...cards.map((g) => {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.className = "goal-card";
        button.innerHTML = `<strong>${g.title}</strong><span>${g.detail}</span><small>${g.reward}${g.target ? " · Show me where ↗" : ""}</small>`;
        button.disabled = !g.target;
        button.onclick = () => {
          const w = world();
          const target = w.destinations().find((o) => o.id === g.target);
          if (target) {
            w.walkTo(target, true);
            panda("跟我来，我们一起去吧。");
          } else {
            const exit = w.scene.interactables.find(
              (o) => o.type === "door" && o.target === "shanghai",
            );
            if (exit) {
              w.walkTo(exit, true);
              panda("先出门，再点一下要做的事情，我们就走。");
            } else panda("先去饭店，我们再去桌子旁边。");
          }
        };
        item.append(button);
        return item;
      }),
    );
  }
  function meet(id) {
    persistence.change((s) => {
      const a = s.adventure;
      if (!a.met.includes(id)) {
        a.met.push(id);
        if (a.met.length === 5) {
          award(a, 40);
          panda("认识五位朋友了！你想去竹林走走吗？");
        }
      }
    });
    refresh();
  }
  const queue = [];
  let showing = false;
  let audio;
  function chime() {
    if (!persistence.state.settings.voice) return;
    try {
      audio ??= new AudioContext();
      audio.resume();
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        const o = audio.createOscillator(),
          g = audio.createGain(),
          t = audio.currentTime + i * 0.13;
        o.type = "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(
          0.07 * persistence.state.settings.voiceVolume,
          t + 0.035,
        );
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        o.connect(g).connect(audio.destination);
        o.start(t);
        o.stop(t + 0.85);
      });
    } catch {}
  }
  function showNext() {
    if (showing || !queue.length) return;
    showing = true;
    const w = queue.shift(),
      el = document.getElementById("discovery");
    el.replaceChildren();
    for (const [tag, text] of [
      ["small", "新词"],
      ["strong", w.zh],
      ...(persistence.state.settings.pinyin ? [["span", w.pinyin]] : []),
      ...(persistence.state.settings.translation ? [["span", w.meaning]] : []),
    ]) {
      const n = document.createElement(tag);
      n.textContent = text;
      el.append(n);
    }
    const parent =
      [...document.querySelectorAll("dialog[open]")].at(-1) || document.body;
    parent.append(el);
    el.hidden = false;
    el.showPopover();
    chime();
    setTimeout(() => {
      if (el.matches(":popover-open")) el.hidePopover();
      el.hidden = true;
      showing = false;
      showNext();
    }, 4300);
  }
  function discover(word) {
    if (!/\p{Script=Han}/u.test(word.zh) || !isBeginnerChinese(word.zh)) return;
    const a = persistence.state.adventure;
    if (a.clickedWords.includes(word.zh)) return;
    persistence.change((s) => {
      s.adventure.clickedWords.push(word.zh);
      if (!s.adventure.vocabulary.includes(word.zh))
        s.adventure.vocabulary.push(word.zh);
      for (const key of ["clickedWords", "vocabulary"])
        if (s.adventure[key].length > 1000) s.adventure[key].shift();
    });
    queue.push(word);
    showNext();
  }
  function nature(id) {
    if (!["bamboo-grove", "lake", "rock-study"].includes(id)) return;
    persistence.change((s) => {
      const a = s.adventure;
      if (!a.nature.includes(id)) {
        a.nature.push(id);
        if (a.nature.length === 3) award(a, 40);
      }
    });
    refresh();
  }
  return { refresh, meet, discover, nature };
}
