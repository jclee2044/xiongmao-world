import { award } from "../data/adventure.js";
import { directionsTo } from "../data/navigation.js";
export function createDirections({
  persistence,
  openPanel,
  speech,
  world,
  panda,
  refresh,
}) {
  const $ = (id) => document.getElementById(id);
  const change = (fn) => {
    persistence.change((s) => fn(s.adventure));
    refresh();
  };
  const say = (zh) => speech.speak(zh, false, "male");
  function find() {
    const a = persistence.state.adventure;
    if (a.directionsFind === "new")
      change((a) => (a.directionsFind = "accepted"));
    const d = directionsTo("dumplings", persistence.state);
    const zh =
      a.directionsFind === "done"
        ? "你找到火锅店了！下次你可以帮别人指路。"
        : "火锅店在湖的下面。沿着集市右边的石头路走。不要走进水里，要走桥哦。";
    openPanel(
      "问路 · Find the hotpot restaurant",
      `<p class="chinese" lang="zh-CN">${zh}</p><p>Listen to Lin’s directions, then find and enter 火锅店. You can use the Map or follow the stone paths.</p><div class="small-actions"><button id="directions-listen">再听一遍</button><button id="directions-go" class="primary">我去找找！</button></div>`,
    );
    $("directions-listen").onclick = () => say(zh);
    $("directions-go").onclick = () => {
      $("panel").close();
      panda(d.chinese);
    };
    say(zh);
  }
  const steps = [
    {
      zh: "书店在河的哪边？",
      options: ["南边。", "北边。", "水里面。"],
      correct: 0,
      hint: "书店在集市南边。要过南边的桥。",
    },
    {
      zh: "从这里到书店，怎么走？",
      options: [
        "往左走，过南边的桥，再往左走。",
        "往北走，去竹林。",
        "穿过河水就到了。",
      ],
      correct: 0,
      hint: "我们在集市东南边。先往左找石桥，过桥后再往左。",
    },
  ];
  function give() {
    const a = persistence.state.adventure;
    if (a.directionsGive === "done") {
      const zh = "谢谢你！我知道怎么去书店了。";
      openPanel(
        "指路 · Help Hao",
        `<p class="chinese">${zh}</p><p>✓ You gave Hao directions to the bookshop.</p>`,
      );
      say(zh);
      return;
    }
    if (a.directionsGive === "new")
      change((a) => (a.directionsGive = "accepted"));
    const step = steps[Math.min(1, a.directionsStep)],
      order = a.directionsStep ? [1, 0, 2] : [0, 2, 1];
    openPanel(
      "指路 · Help Hao find the bookshop",
      `<p class="chinese">我想去书店。你能告诉我怎么走吗？</p><p>${a.directionsStep + 1} / 2 · Help Hao using the map’s landmarks.</p><p class="chinese">${step.zh}</p><div id="direction-choices" class="direction-choices">${order.map((i) => `<button data-direction="${i}">${step.options[i]}</button>`).join("")}</div><p id="directions-feedback" role="status"></p><button id="directions-hint">问熊猫 · Ask Panda</button>`,
    );
    $("directions-hint").onclick = () => {
      $("directions-feedback").textContent = step.hint;
      say(step.hint);
    };
    $("direction-choices")
      .querySelectorAll("button")
      .forEach(
        (b) =>
          (b.onclick = () => {
            if (Number(b.dataset.direction) !== step.correct) {
              $("directions-feedback").textContent = step.hint;
              say(step.hint);
              return;
            }
            change((a) => {
              if (a.directionsGive === "done") return;
              a.directionsStep++;
              if (a.directionsStep === 2) {
                a.directionsGive = "done";
                award(a, 40);
              }
            });
            give();
          }),
      );
    say(step.zh);
  }
  function visit(id) {
    if (
      id !== "dumplings" ||
      persistence.state.adventure.directionsFind !== "accepted"
    )
      return;
    change((a) => {
      a.directionsFind = "done";
      award(a, 40);
    });
    panda("找到了！这就是火锅店。你会问路了！");
  }
  return { find, give, visit };
}
