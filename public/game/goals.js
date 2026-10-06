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
      reward: "+40 经验",
      key: "meet",
    });
  if (a.hungry !== "done")
    cards.push({
      title: "和莲一起吃饭",
      detail: {
        new: "去集市旁找莲。",
        invited: "莲跟着你呢，一起去火锅店吧。",
        dining: "去火锅桌旁，点菜、煮菜、尝一尝。",
      }[a.hungry],
      target:
        a.hungry === "new"
          ? "lian"
          : a.hungry === "invited"
            ? "dumplings"
            : "hotpot",
      reward: "+60 经验",
      key: "hungry",
    });
  if (a.flowers !== "done")
    cards.push({
      title: "帮兰找花",
      detail: {
        new: "去花店问问兰，她在找什么。",
        accepted: "过西边的桥，去大石头旁找花。",
        found: "把花带回花店，还给兰。",
      }[a.flowers],
      target: a.flowers === "accepted" ? "lost-flowers" : "lan",
      reward: "+60 经验",
      key: "flowers",
    });
  if (a.tea !== "done" && a.met.length >= 2)
    cards.push({
      title: "和乔喝茶",
      detail: {
        new: "去茶馆门口，请乔一起喝茶。",
        invited: "跟着乔去院子里的茶桌。",
        seated: "去茶桌旁和乔说说今天的事。",
      }[a.tea],
      target: a.tea === "new" ? "qiao" : "tea-table",
      reward: "+60 经验",
      key: "tea",
    });
  if (a.nature.length < 3 && a.met.length >= 5)
    cards.push({
      title: "和熊猫走走",
      detail: `看看竹子、荷花和太湖石 · ${a.nature.length}/3`,
      target: ["bamboo-grove", "lake", "rock-study"].find(
        (x) => !a.nature.includes(x),
      ),
      reward: "+40 经验",
      key: "nature",
    });
  if (a.directionsFind !== "done")
    cards.push({
      key: "directionsFind",
      title: "问问路",
      detail:
        a.directionsFind === "accepted"
          ? "听林说怎么走，去集市东边、湖下方的火锅店。"
          : "问林：火锅店怎么走？",
      target: a.directionsFind === "accepted" ? "dumplings" : "lin",
      reward: "+40 经验",
    });
  if (a.directionsGive !== "done")
    cards.push({
      key: "directionsGive",
      title: "帮忙指路",
      detail: "去集市东南边找浩，帮他过南边的河去书店。",
      target: "hao",
      reward: "+40 经验",
    });
  if (a.flowerDirections !== "done")
    cards.push({
      key: "flowerDirections",
      title: "找花店",
      detail: "去北边的小路找小雨，告诉她怎么去湖上方的花店。",
      target: "visitor-1",
      reward: "+40 经验",
    });
  const active = (key) =>
    ["accepted", "invited", "found", "seated", "dining"].includes(a[key]);
  cards.sort(
    (left, right) => Number(active(right.key)) - Number(active(left.key)),
  );
  if (a.xp >= AREA_XP)
    cards.unshift({
      title: "可以上船了",
      detail: "去右下方的河边上船，去下一站。",
      target: "next-area",
      reward: "500 / 500 经验 · 可以出发了",
      key: "departure",
    });
  if (!cards.length)
    cards.push({
      title: "苏州的一天",
      detail: "今天帮了邻居，继续走走、聊天、认识新词吧。",
      reward: "✓ 小目标都做好了",
      key: "complete",
    });
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
        button.innerHTML = `<strong>${g.title}</strong><span>${g.detail}</span><small>${g.reward}${g.target ? " · 带我去 ↗" : ""}</small>`;
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
              panda("先出门，再点一下目标，我们就出发。");
            } else panda("先进入火锅店，我们再去桌边。");
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
