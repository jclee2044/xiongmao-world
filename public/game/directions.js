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
        ? "你找到饭店了！下次你可以帮别人说怎么走。"
        : "饭店在湖的下面。跟着市场右边的石头路走。不要走进水里，要走桥啊。";
    openPanel(
      "问路",
      `<p class="chinese" lang="zh-CN">${zh}</p><p>听小林说怎么走，再去找饭店。可以看看地图，或者跟着石头路走。</p><div class="small-actions"><button id="directions-listen">再听一次</button><button id="directions-go" class="primary">我去找找！</button></div>`,
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
      hint: "书店在市场南边。要过南边的桥。",
    },
    {
      zh: "从这里到书店，怎么走？",
      options: [
        "往左边走，过南边的桥，再往左边走。",
        "往北走，去竹林。",
        "穿过河水就到了。",
      ],
      correct: 0,
      hint: "我们在市场东南边。先往左边找桥，过桥，然后再往左边。",
    },
  ];
  function give() {
    const a = persistence.state.adventure;
    if (a.directionsGive === "done") {
      const zh = "谢谢你！我知道怎么去书店了。";
      openPanel(
        "帮小好说怎么走",
        `<p class="chinese">${zh}</p><p>✓ 小好知道怎么去书店了。</p>`,
      );
      say(zh);
      return;
    }
    if (a.directionsGive === "new")
      change((a) => (a.directionsGive = "accepted"));
    const step = steps[Math.min(1, a.directionsStep)],
      order = a.directionsStep ? [1, 0, 2] : [0, 2, 1];
    openPanel(
      "帮小好找书店",
      `<p class="chinese">我想去书店。你能告诉我怎么走吗？</p><p>${a.directionsStep + 1} / 2 · 看看地图，帮小好找路。</p><p class="chinese">${step.zh}</p><div id="direction-choices" class="direction-choices">${order.map((i) => `<button data-direction="${i}">${step.options[i]}</button>`).join("")}</div><p id="directions-feedback" role="status"></p><button id="directions-hint">问熊猫</button>`,
    );
    $("directions-hint").onclick = () => {
      $("directions-feedback").textContent = step.hint;
      speech.speak(step.hint, false, "panda");
    };
    $("direction-choices")
      .querySelectorAll("button")
      .forEach(
        (b) =>
          (b.onclick = () => {
            if (Number(b.dataset.direction) !== step.correct) {
              $("directions-feedback").textContent = step.hint;
              speech.speak(step.hint, false, "panda");
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
  function flowers() {
    const a = persistence.state.adventure;
    const sayFlower = (zh) => speech.speak(zh, false, "female");
    if (a.flowerDirections === "done") {
      const zh = "谢谢你！先往右边走，过桥，再往右边走。花店在湖的上面。我知道了！";
      openPanel(
        "帮小雨说怎么走",
        `<p class="chinese" lang="zh-CN">${zh}</p><p>✓ 小雨知道怎么去花店了。+40 XP</p>`,
      );
      sayFlower(zh);
      return;
    }
    if (a.flowerDirections === "new")
      change((a) => (a.flowerDirections = "accepted"));
    const steps = [
      {
        zh: "花店在哪里？",
        options: [
          "在市场东北边，湖的上面。",
          "在书店里面。",
          "在西边的竹林里。",
        ],
        correct: 0,
        hint: "看地图：花店在市场的右边上面，湖的上面。",
      },
      {
        zh: "从这里怎么去花店？",
        options: [
          "往左边走，去竹林。",
          "先往右边走，过桥，再往右边走。",
          "走进河里。",
        ],
        correct: 1,
        hint: "跟着市场北边的路往右边走，过东边的桥。花店就在前面。",
      },
    ];
    const step = steps[Math.min(1, a.flowerDirectionsStep)];
    openPanel(
      "帮小雨找花店",
      `<p class="chinese" lang="zh-CN">我在找花店。你能告诉我怎么走吗？</p><p>${a.flowerDirectionsStep + 1} / 2</p><p class="chinese" lang="zh-CN">${step.zh}</p><div id="flower-direction-choices" class="direction-choices">${step.options.map((text, i) => `<button data-direction="${i}">${text}</button>`).join("")}</div><p id="flower-directions-feedback" role="status"></p><button id="flower-directions-hint">问熊猫</button>`,
    );
    const hint = () => {
      $("flower-directions-feedback").textContent = step.hint;
      speech.speak(step.hint, false, "panda");
    };
    $("flower-directions-hint").onclick = hint;
    $("flower-direction-choices")
      .querySelectorAll("button")
      .forEach(
        (b) =>
          (b.onclick = () => {
            if (Number(b.dataset.direction) !== step.correct) {
              hint();
              return;
            }
            change((a) => {
              if (a.flowerDirections === "done") return;
              a.flowerDirectionsStep++;
              if (a.flowerDirectionsStep === 2) {
                a.flowerDirections = "done";
                award(a, 40);
              }
            });
            flowers();
          }),
      );
    sayFlower(step.zh);
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
    panda("找到了！这就是饭店。你会问路了！");
  }
  return { find, give, flowers, visit };
}
