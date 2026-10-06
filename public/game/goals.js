import { AREA_XP, award } from "../data/adventure.js";
export function goalCards(a) {
  const cards = [];
  if (a.met.length < 5)
    cards.push({
      title: "Meet the neighborhood",
      detail: `Talk to five different people · ${a.met.length}/5`,
      target: ["lin", "lan", "bo", "mei", "wei"].find(
        (id) => !a.met.includes(id),
      ),
      reward: "+40 XP",
      key: "meet",
    });
  if (a.hungry !== "done")
    cards.push({
      title: "A meal with Lian",
      detail: {
        new: "Meet Lian beside the central market.",
        invited: "Lian is following. Enter the hotpot restaurant together.",
        dining: "Sit at a hotpot table. Order, cook and taste your meal.",
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
      title: "Lan’s missing flowers",
      detail: {
        new: "Ask Lan at the flower stall what she lost.",
        accepted:
          "Cross the west bridge. Collect the bouquet beside the rockery.",
        found: "Return the bouquet to Lan at the flower stall.",
      }[a.flowers],
      target: a.flowers === "accepted" ? "lost-flowers" : "lan",
      reward: "+60 XP",
      key: "flowers",
    });
  if (a.tea !== "done" && a.met.length >= 2)
    cards.push({
      title: "Tea with Qiao",
      detail: {
        new: "Invite Qiao outside the teahouse.",
        invited: "Follow Qiao to the courtyard tea table.",
        seated: "Join Qiao at the tea table and share your day.",
      }[a.tea],
      target: a.tea === "new" ? "qiao" : "tea-table",
      reward: "+60 XP",
      key: "tea",
    });
  if (a.nature.length < 3 && a.met.length >= 5)
    cards.push({
      title: "Panda’s nature walk",
      detail: `Discover bamboo, lotus and Taihu rocks · ${a.nature.length}/3`,
      target: ["bamboo-grove", "lake", "rock-study"].find(
        (x) => !a.nature.includes(x),
      ),
      reward: "+40 XP",
      key: "nature",
    });
  if (a.directionsFind !== "done")
    cards.push({
      key: "directionsFind",
      title: "Ask the way",
      detail:
        a.directionsFind === "accepted"
          ? "Follow Lin’s directions and enter 火锅店 east of the market, below the lake."
          : "Ask Lin how to get to 火锅店.",
      target: a.directionsFind === "accepted" ? "dumplings" : "lin",
      reward: "+40 XP",
    });
  if (a.directionsGive !== "done")
    cards.push({
      key: "directionsGive",
      title: "Give directions",
      detail:
        "Help Hao at the southeast market find the bookshop across the southern canal.",
      target: "hao",
      reward: "+40 XP",
    });
  const active = (key) =>
    ["accepted", "invited", "found", "seated", "dining"].includes(a[key]);
  cards.sort(
    (left, right) => Number(active(right.key)) - Number(active(left.key)),
  );
  if (a.xp >= AREA_XP)
    cards.unshift({
      title: "Your boat is ready",
      detail:
        "Board the lantern boat on the bottom-right canal for the next stop.",
      target: "next-area",
      reward: "500 / 500 XP · Ready to sail",
      key: "departure",
    });
  if (!cards.length)
    cards.push({
      title: "A lovely day in Suzhou",
      detail:
        "You helped your neighbors. Explore, chat and discover new words.",
      reward: "✓ All neighborhood goals complete",
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
        button.innerHTML = `<strong>${g.title}</strong><span>${g.detail}</span><small>${g.reward}${g.target ? " · Show me ↗" : ""}</small>`;
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
      ["small", "NEW WORD · 新词"],
      ["strong", w.zh],
      ["span", w.pinyin],
      ["span", w.meaning],
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
