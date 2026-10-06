import { createDirections } from "./game/directions.js";
import { shops } from "./data/shops.js";
import { createGoals } from "./game/goals.js";
import { createWordHelp } from "./game/words.js";
import { createAdventure } from "./game/adventure.js";
import { AREA_XP, award } from "./data/adventure.js";
import { World } from "./game/engine.js";
import { Persistence, api } from "./game/persistence.js";
import { Speech } from "./game/speech.js";
import { Ambience } from "./game/ambience.js";
import { Music } from "./game/music.js";
import { npcs, lexicon, starters } from "./data/content.js";
import { culture } from "./data/culture.js";
import { expose, explicitPreference } from "./data/learner.js";
import { createPanels } from "./game/panels.js";
import { createPractice } from "./game/practice.js";
import { registerPwa } from "./game/pwa.js";
import { prepareArt } from "./game/render.js";
import { scenes, districtAt } from "./game/world.js";
const $ = (id) => document.getElementById(id);
const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let world,
  lastRounds = null,
  currentNpc = null,
  currentReply = null,
  helpLevel = 0,
  requestGeneration = 0,
  controller;
const persistence = new Persistence(
  (text) => ($("save-status").textContent = text),
  () =>
    toast(
      "Another device has newer progress. Choose which to keep in Journal.",
    ),
);
// Unlock audio in the first gesture, but wait for saved preferences before sound.
const music = new Music({ ...persistence.state.settings, music: 0 });
const ambience = new Ambience(
  () => world,
  () => persistence.state.settings,
);
const duckAudio = (active) => {
  music.duck(active);
  ambience.duck(active);
};
const speech = new Speech(
  (text) => {
    $("dialog-status").textContent = text;
    if ($("practice-audio-status"))
      $("practice-audio-status").textContent = text;
    if ($("panel-audio-status")) $("panel-audio-status").textContent = text;
  },
  () => persistence.state.settings,
  duckAudio,
);
function toast(text) {
  $("toast").textContent = text;
  $("toast").hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($("toast").hidden = true), 4500);
}
function updatePlace() {
  const district = districtAt(world.scene, world.player);
  $("place").textContent = district
    ? `Suzhou · ${district.name}`
    : world.scene.title;
  $("place-cn").textContent = district
    ? `苏州 · ${district.zh}`
    : world.scene.chinese;
}
function applySettings() {
  music.applySettings(persistence.state.settings);
  ambience.applySettings();
  document.documentElement.dataset.motion = String(
    persistence.state.settings.motion,
  );
  document.documentElement.dataset.textSize =
    persistence.state.settings.textSize;
  if (currentReply) displayReply(currentReply);
  practice.refresh();
}
function restoreWorld() {
  world.changeScene(persistence.state.scene, persistence.state.position);
  updatePlace();
  applySettings();
}
function openPanel(title, html) {
  speech.stop();
  $("panel-title").textContent = title;
  $("panel-content").innerHTML = html;
  animatePanel($("panel-content"));
  if (!$("panel").open) $("panel").showModal();
  world?.pause(true);
}
function animatePanel(element) {
  if (
    persistence.state.settings.motion &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    element.animate(
      [
        { opacity: 0, transform: "translateY(6px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 180, easing: "ease-out" },
    );
}
function panda(text) {
  $("panda-message").textContent = text;
}
function updateXP() {
  goals.refresh();
  if (!$("xp-progress")) return;
  const xp = persistence.state.adventure.xp;
  $("xp-progress").value = Math.min(AREA_XP, xp);
  $("xp-text").textContent = `${xp} / ${AREA_XP} XP`;
  $("xp-progress").setAttribute(
    "aria-label",
    xp >= AREA_XP
      ? "Next neighborhood unlocked"
      : `${xp} of ${AREA_XP} experience`,
  );
}
const goals = createGoals({ persistence, world: () => world, panda, speech });
const wordHelp = createWordHelp({
  discover: (word) => goals.discover(word),
  speech,
});
const adventure = createAdventure({
  persistence,
  openPanel,
  speech,
  world: () => world,
  panda,
  refresh: updateXP,
  onRecording: duckAudio,
});
const directions = createDirections({
  persistence,
  openPanel,
  speech,
  world: () => world,
  panda,
  refresh: updateXP,
});
const panels = createPanels({
  persistence,
  openPanel,
  toast,
  applySettings,
  restoreWorld,
  getWorld: () => world,
  navigate: (position) => {
    $("panel").close();
    world.pause(false);
    $("world").focus();
    if (!world.walkTo(position)) toast("No walkable route to this point.");
  },
});
const practice = createPractice({
  persistence,
  openPanel,
  speech,
  openMap: () => {
    if (world.scene.interior || world.scene.id === "home") {
      const exit = world.scene.interactables.find(
        (o) => o.type === "door" && o.target === "shanghai",
      );
      if (exit) world.enterDoor(exit);
    }
    panels.map();
  },
  openConversation,
  onChange: () => updatePracticeStatus(),
});
function updatePracticeStatus() {
  const rounds = Object.values(persistence.state.practice.rounds || {}).reduce(
    (a, b) => a + b,
    0,
  );
  if (lastRounds !== null && rounds > lastRounds)
    persistence.change((s) => award(s.adventure, 20 * (rounds - lastRounds)));
  lastRounds = rounds;
  updateXP();
  const status = practice.status();
  if ($("practice-active"))
    $("practice-active").textContent = status ? `进行中：${status}` : "";
}
const practiceButton = document.createElement("button");
practiceButton.id = "practice";
practiceButton.textContent = "练习中文";
practiceButton.setAttribute("aria-label", "Chinese errands");
practiceButton.onclick = () => {
  $("conversation").close();
  practice.catalog();
};
$("panda-help").parentElement.append(practiceButton);
const pandaListen = document.createElement("button");
pandaListen.id = "panda-listen";
pandaListen.textContent = "🔊";
pandaListen.setAttribute("aria-label", "听熊猫说话");
pandaListen.onclick = () =>
  speech.speak($("panda-message").textContent, false, "male");
$("panda-help").parentElement.append(pandaListen);
const practiceStatus = document.createElement("p");
practiceStatus.id = "practice-active";
practiceStatus.lang = "zh-CN";
practiceStatus.setAttribute("role", "status");
$("panda-help").append(practiceStatus);
const neighborPractice = document.createElement("button");
neighborPractice.id = "neighbor-practice";
neighborPractice.textContent = "中文小任务";
neighborPractice.onclick = () => {
  const id = currentNpc;
  $("conversation").close();
  practice.openForNpc(id);
};
$("speech-controls").append(neighborPractice);
registerPwa({
  onStatus: toast,
  onUpdate: (activate) => {
    $("update").hidden = false;
    $("update").onclick = async () => {
      persistence.cache();
      await persistence.flush();
      if (
        persistence.conflict ||
        persistence.generation !== persistence.persisted
      )
        return toast(
          "Sync or export your progress in Journal before updating.",
        );
      activate();
    };
  },
});
function startWorld() {
  const state = persistence.state;
  world = new World($("world"), {
    getSettings: () => ({
      ...persistence.state.settings,
      motion:
        persistence.state.settings.motion &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches,
    }),
    getFound: () => persistence.state.found.includes("momo"),
    getAdventure: () => persistence.state.adventure,
    onGuestArrive: () => {
      persistence.change((s) => {
        if (s.adventure.tea === "invited") s.adventure.tea = "seated";
      });
      panda("乔已经坐下了，我们也去喝茶吧。");
    },
    onNear: (n) => {
      $("interact").disabled = !n;
      $("interact").textContent = n ? n.name : "四处走走";
      if (n && Date.now() - (panda.last || 0) > 6500) {
        panda.last = Date.now();
        const hints = {
          lian: "莲饿了。我们请她吃火锅吧！",
          lan: "兰好像在找什么。去问问她吧。",
          qiao: "乔今天有空。要不要请她喝茶？",
          "tea-table": "两只杯子！找个朋友一起喝茶吧。",
          "lost-flowers": "石头旁边是不是有一束花？",
          museum: "里面有苏州的故事，我们进去看看吧。",
          dumplings: "你想吃什么？试着用中文点菜吧。",
        };
        panda(
          hints[n.id] ||
            (n.type === "npc" || n.type === "passerby"
              ? "我们和他聊聊吧。"
              : n.type === "door"
                ? "我们可以进去。"
                : n.type === "inspect"
                  ? "看看这里吧。"
                  : "我们一起试试吧。"),
        );
      }
    },
    onMove: (scene, position) => {
      music.setScene(scenes[scene]);
      persistence.change((s) => {
        s.scene = scene;
        s.position = { ...position };
      });
      updatePlace();
    },
    onInteract: interact,
  });
  world.changeScene(state.scene, state.position);
  updatePlace();
  applySettings();
  updatePracticeStatus();
  updateXP();
  panda("欢迎！先认识五位邻居吧。左上角有我们的小目标。");
}
function interact(n) {
  goals.nature(n.id);
  directions.visit(n.id);
  if (n.shopId) return openConversation(shops[n.shopId].seller, n.shopId);
  if (n.id === "sheep-keepsake") {
    openPanel(
      "小羊 · A gift from Lian",
      `<img src="/assets/world/sheep-gift.png" alt="Your stuffed sheep" width="130" height="145" class="keepsake-portrait"/><p class="chinese" lang="zh-CN">${escape(n.zh)}</p><p class="notice">Earned by treating Lian to hotpot at the canal restaurant.</p>`,
    );
    speech.speak(n.zh, false, "female");
    return;
  }
  if (adventure.interact(n)) return;
  if (practice.visit(n.id)) return;
  if (n.type === "practice") {
    practice.start(n.activity);
  } else if (n.type === "door") {
    speech.stop();
    world.enterDoor(n);
    if (
      n.target === "restaurant" &&
      persistence.state.adventure.hungry === "invited"
    ) {
      persistence.change((s) => (s.adventure.hungry = "dining"));
      panda("莲跟我们进来了！一起坐下吃火锅吧。");
      updateXP();
    }
    updatePlace();
  } else if (["npc", "passerby", "guest"].includes(n.type))
    openConversation(n.dialogueId || n.id);
  else if (n.type === "journal") panels.journal();
  else if (n.type === "stuffy") {
    if (!persistence.state.found.includes("momo"))
      persistence.change((s) => {
        s.found.push("momo");
        s.journal.push("Met Momo beside the canal and brought Momo home.");
        s.journal = s.journal.slice(-50);
      });
    openPanel(
      "Momo · 桃桃",
      `<p class="chinese" lang="zh-CN">我们一起回家吧。</p>${persistence.state.settings.translation ? "<p>Let’s go home together.</p>" : ""}<button class="primary" id="bring-home">Take Momo home ↗</button>`,
    );
    $("bring-home").onclick = () => {
      $("panel").close();
      world.changeScene("home");
      updatePlace();
      toast("Momo is home.");
    };
  } else if (n.type === "friend")
    openPanel(
      "Momo · 桃桃",
      `<p class="chinese" lang="zh-CN">和你在一起，真好。</p>${persistence.state.settings.translation ? "<p>It’s good to be with you.</p>" : ""}`,
    );
  else if (n.type === "animal") {
    const animals = {
      "lake-cat": {
        zh: "你好，小猫！你在湖边做什么？",
        pinyin: "Nǐ hǎo, xiǎo māo! Nǐ zài hú biān zuò shénme?",
        meaning: "Hello, kitty! What are you doing by the lake?",
      },
      "lake-duck": {
        zh: "你好，小鸭子！你喜欢游泳吗？",
        pinyin: "Nǐ hǎo, xiǎo yāzi! Nǐ xǐhuan yóuyǒng ma?",
        meaning: "Hello, little duck! Do you like swimming?",
      },
      "garden-rabbit": {
        zh: "你好，小兔子！你的耳朵真长。",
        pinyin: "Nǐ hǎo, xiǎo tùzi! Nǐ de ěrduo zhēn cháng.",
        meaning: "Hello, little rabbit! Your ears are so long.",
      },
    };
    const text = animals[n.id] || n;
    if (!text.zh) return;
    openPanel(
      n.name,
      `<p class="chinese" lang="zh-CN">${text.zh}</p>${persistence.state.settings.pinyin ? `<p class="pinyin">${text.pinyin}</p>` : ""}${persistence.state.settings.translation ? `<p class="meaning">${text.meaning}</p>` : ""}<div class="small-actions"><button id="animal-replay">听一听</button><button id="animal-practice">湖边找动物</button></div><p id="panel-audio-status" role="status" class="muted"></p>`,
    );
    $("animal-replay").onclick = () => speech.speak(text.zh);
    $("animal-practice").onclick = () => practice.start("lake-animals");
  } else if (n.type === "inspect") {
    const fact = culture[n.culture];
    const factHtml = fact
      ? `<div class="panel-section"><h3 lang="zh-CN">${escape(fact.title.split(" · ")[0])}</h3><p class="chinese" lang="zh-CN">${escape(fact.zh)}</p>${persistence.state.settings.pinyin ? `<p class="pinyin">${escape(fact.pinyin)}</p>` : ""}${persistence.state.settings.translation ? `<p class="meaning">${escape(fact.meaning)}</p>` : ""}<div class="small-actions"><button id="culture-replay">听苏州的故事</button><a href="${escape(fact.source)}" target="_blank" rel="noopener noreferrer">资料来源 ↗</a></div><p class="notice" lang="zh-CN">这是游戏里的苏州。真的苏州更大，路也不一样。</p>${persistence.state.settings.translation ? '<p class="notice">This is a condensed illustrated interpretation of Suzhou; places and routes have been rearranged.</p>' : ""}</div>`
      : "";
    openPanel(
      n.name,
      `<p class="chinese" lang="zh-CN">${escape(n.zh)}</p>${persistence.state.settings.pinyin ? `<p class="pinyin">${escape(n.pinyin)}</p>` : ""}${persistence.state.settings.translation ? `<p class="meaning">${escape(n.meaning)}</p>` : ""}<button id="place-replay">Replay</button>${factHtml}<p id="panel-audio-status" role="status" class="muted"></p>`,
    );
    if (fact) $("culture-replay").onclick = () => speech.speak(fact.zh);
    $("place-replay").onclick = () => speech.speak(n.zh);
    speech.speak(n.zh);
    const hosts = {
      tea: "qiao",
      books: "bo",
      flowers: "lan",
      market: "wei",
      garden: "an",
      fabric: "an",
      inn: "hao",
    };
    if (hosts[n.id]) {
      const button = document.createElement("button");
      button.textContent = "中文小任务";
      button.onclick = () => practice.openForNpc(hosts[n.id]);
      $("panel-content").append(button);
    }
  }
}
let currentShop = null;
function openConversation(id, shopId = null) {
  currentShop = shopId;
  $("shop-view")?.remove();
  $("shop-purchases")?.remove();
  $("conversation").classList.toggle("shop-conversation", Boolean(shopId));
  requestGeneration++;
  controller?.abort();
  speech.stop();
  currentNpc = id;
  goals.meet(id);
  speech.voice = npcs[id]?.voice || "male";
  helpLevel = persistence.state.settings.help === "more" ? 1 : 0;
  $("npc-name").textContent = npcs[id].name;
  $("reply").value = "";
  $("last-user").textContent = "";
  $("reply").placeholder =
    npcs[id].starter?.example || starters[npcs[id].topic].example;
  $("send").disabled = false;
  const last = persistence.state.history.filter((h) => h.npc === id).at(-1);
  displayReply(
    last?.reply || {
      ...npcs[id].greeting,
      mode: "authored",
      notice: "",
    },
  );
  $("dialog-status").textContent = "";
  $("npc-quest")?.remove();
  $("directions-quest")?.remove();
  if (["lin", "hao"].includes(id) && !shopId) {
    const button = document.createElement("button");
    button.id = "directions-quest";
    button.className = "quest-invitation";
    button.textContent = id === "lin" ? "火锅店怎么走？" : "我来帮你找书店。";
    button.onclick = () => {
      $("conversation").close();
      id === "lin" ? directions.find() : directions.give();
    };
    $("speech-controls").append(button);
  }
  if (id === "lan" || id === "qiao" || id === "lian") {
    const button = document.createElement("button");
    button.id = "npc-quest";
    button.className = "quest-invitation";
    button.textContent =
      id === "lian"
        ? "我请你吃火锅吧！"
        : id === "lan"
          ? persistence.state.adventure.flowers === "found"
            ? "我找到你的花了！"
            : "你在找什么？"
          : "想一起喝茶吗？";
    button.onclick = () => {
      $("conversation").close();
      id === "lian"
        ? adventure.hungryQuest()
        : id === "lan"
          ? adventure.flowerQuest()
          : adventure.teaQuest();
    };
    $("speech-controls").append(button);
  }
  if (shopId) {
    const shop = shops[shopId],
      view = document.createElement("img");
    view.id = "shop-view";
    view.src = shop.image;
    view.alt = shop.name;
    $("conversation").insertBefore(
      view,
      $("conversation").querySelector(".conversation-body"),
    );
    $("npc-name").textContent = shop.name + " · " + npcs[id].name;
    $("reply").placeholder = "这个多少钱？";
    displayReply({
      chinese: shop.greeting,
      pinyin: shop.pinyin,
      meaning: shop.items.map((i) => `${i.en}: ¥${i.price}`).join(" · "),
      topic: "food",
      mode: "authored",
      notice: "",
    });
    renderShopPurchases();
  }
  $("conversation").showModal();
  animatePanel($("conversation"));
  world.pause(true);
  $("reply").focus();
  speech.speak(currentReply.chinese, false, npcs[id]?.voice || "male");
}
function renderShopPurchases() {
  $("shop-purchases")?.remove();
  if (!currentShop) return;
  const box = document.createElement("section");
  box.id = "shop-purchases";
  const a = persistence.state.adventure;
  const money = document.createElement("p");
  money.textContent = `零钱 ¥${a.coins} · Game coins`;
  box.append(money);
  for (const item of shops[currentShop].items) {
    const b = document.createElement("button");
    b.dataset.buy = item.id;
    const bought = a.purchases.includes(item.id);
    b.textContent = bought
      ? `${item.zh} ✓ 已买`
      : `${item.zh} · ¥${item.price}`;
    b.disabled = bought || a.coins < item.price;
    b.onclick = () => {
      persistence.change((s) => {
        const a = s.adventure;
        if (a.purchases.includes(item.id) || a.coins < item.price) return;
        a.coins -= item.price;
        a.purchases.push(item.id);
        award(a, 10);
        s.journal.push(
          `Bought ${item.zh} at ${shops[currentShop].name} for ¥${item.price}.`,
        );
        s.journal = s.journal.slice(-50);
      });
      const thanks = "谢谢！给你。下次再来！";
      displayReply({
        chinese: thanks,
        pinyin: "Xièxie! Gěi nǐ. Xià cì zài lái!",
        meaning: "Thank you! Here you are. Come again!",
        topic: "food",
        mode: "authored",
        notice: "",
      });
      speech.speak(thanks, false, npcs[currentNpc]?.voice || "female");
      updateXP();
      renderShopPurchases();
    };
    box.append(b);
  }
  const ask = document.createElement("button");
  ask.textContent = "多少钱？";
  ask.onclick = () => {
    $("reply").value = "这个多少钱？";
    $("reply-form").requestSubmit();
  };
  box.append(ask);
  $("conversation").querySelector(".conversation-body").append(box);
}
function displayReply(reply) {
  currentReply = reply;
  const settings = persistence.state.settings;
  $("npc-zh").replaceChildren();
  animatePanel($("npc-zh"));
  $("npc-zh").textContent = reply.chinese;
  wordHelp.annotate($("npc-zh"));
  $("npc-pinyin").textContent = reply.pinyin;
  $("npc-pinyin").hidden = !settings.pinyin;
  $("toggle-pinyin").textContent = settings.pinyin
    ? "Hide pinyin"
    : "Show pinyin";
  $("toggle-pinyin").setAttribute("aria-pressed", String(settings.pinyin));
  $("npc-meaning").textContent = reply.meaning;
  $("npc-meaning").hidden = !settings.translation;
  $("mode").textContent =
    reply.mode === "local"
      ? "Local AI · on your PC"
      : reply.mode === "story"
        ? "Limited story mode"
        : "Suzhou";
  $("reply-notice").textContent = reply.notice || "";
  updateHelp();
}
function explain(word) {
  persistence.change((s) => {
    s.learner = expose(
      s.learner,
      word.id,
      `${world.scene.id}:${currentNpc}:${currentReply.topic}`,
      true,
    );
  });
  const pronunciation = persistence.state.settings.pinyin ? word.pinyin : "";
  $("panda-message").textContent = pronunciation
    ? `${word.zh} · ${pronunciation}`
    : word.zh;
  $("panda-explanation").textContent =
    `${word.meaning}. ${word.why} Example: ${word.example}`;
  $("panda-help").open = true;
  $("dialog-status").textContent = `${word.zh}: ${word.meaning}. ${word.why}`;
}
function updateHelp() {
  const starter =
    (currentReply?.topic === npcs[currentNpc]?.topic &&
      npcs[currentNpc]?.starter) ||
    starters[currentReply?.topic || "greeting"];
  $("panda-message").textContent =
    helpLevel >= 3
      ? `You can say… ${starter.example}`
      : helpLevel >= 2
        ? starter.zh
        : "帮助";
  $("panda-explanation").textContent =
    helpLevel >= 2
      ? starter.why
      : "Replay the voice, tap an underlined phrase, or ask for a sentence starter. Help never lowers your ability.";
  $("help-inline").textContent =
    helpLevel >= 3
      ? `You can say… ${starter.example} ${starter.why}`
      : helpLevel >= 2
        ? `A starter: ${starter.zh} · ${starter.why}`
        : helpLevel >= 1
          ? "Tap an underlined word for its meaning, or replay more slowly."
          : "";
  if (helpLevel >= 2) $("panda-help").open = true;
}
let coachController,
  coachGeneration = 0;
function showPandaCoach() {
  coachController?.abort();
  coachGeneration++;
  $("coach-send").disabled = false;
  $("coach-status").textContent = "";
  $("coach-pinyin").hidden = true;
  const starter =
    (currentReply?.topic === npcs[currentNpc]?.topic &&
      npcs[currentNpc]?.starter) ||
    starters[currentReply?.topic || "greeting"];
  const message =
    helpLevel >= 3
      ? starter.example
      : helpLevel >= 2
        ? starter.zh
        : "别着急，我们一起想。";
  $("coach-zh").textContent = message;
  $("coach-tip").textContent =
    helpLevel >= 2 ? starter.why : `They said: ${currentReply.meaning}`;
  $("coach-next").textContent =
    helpLevel >= 2 ? "Show an example" : "Give me a sentence starter";
  $("coach-next").hidden = helpLevel >= 3;
  $("coach-use").hidden = helpLevel < 3;
  $("coach-next").onclick = () => {
    helpLevel = Math.min(3, helpLevel + 1);
    updateHelp();
    showPandaCoach();
  };
  $("coach-use").onclick = () => {
    $("reply").value = starter.example;
    $("panda-coach").close();
    $("reply").focus();
  };
  $("coach-listen").onclick = () => speech.speak(message, false, "male");
  if (!$("panda-coach").open) $("panda-coach").showModal();
  wordHelp.annotate($("coach-zh"));
  speech.speak(message, false, "male");
}
$("foreground-panda").onclick = () => {
  helpLevel = Math.max(1, helpLevel);
  showPandaCoach();
};
$("coach-form").onsubmit = async (event) => {
  event.preventDefault();
  const question = $("coach-question").value.trim();
  if (!question) return;
  coachController?.abort();
  coachController = new AbortController();
  const token = ++coachGeneration;
  $("coach-send").disabled = true;
  $("coach-status").textContent = "Panda is thinking…";
  speech.stop();
  try {
    const answer = await api(
      "/api/coach",
      {
        question,
        context: `${currentReply?.chinese || ""} (${currentReply?.meaning || ""})`,
      },
      AbortSignal.any([coachController.signal, AbortSignal.timeout(65000)]),
    );
    if (token !== coachGeneration || !$("panda-coach").open) return;
    $("coach-zh").textContent = answer.chinese;
    $("coach-tip").textContent = answer.explanation;
    $("coach-pinyin").textContent = answer.pinyin;
    $("coach-pinyin").hidden = !persistence.state.settings.pinyin;
    $("coach-status").textContent =
      answer.mode === "local"
        ? "Panda’s language tutor"
        : "Panda’s offline language guide";
    $("coach-listen").onclick = () =>
      speech.speak(answer.chinese, false, "male");
    $("coach-use").hidden = false;
    $("coach-use").onclick = () => {
      $("reply").value = answer.chinese;
      $("panda-coach").close();
      $("reply").focus();
    };
    wordHelp.annotate($("coach-zh"));
    speech.speak(answer.chinese, false, "male");
  } catch (error) {
    if (token === coachGeneration && $("panda-coach").open)
      $("coach-status").textContent =
        "I couldn’t finish that answer. Try again, or use a sentence starter.";
  } finally {
    if (token === coachGeneration) $("coach-send").disabled = false;
  }
};
$("begin").onclick = async () => {
  music.enable().catch(() => {});
  ambience.enable();
  $("begin").disabled = true;
  $("begin").textContent = "Loading…";
  await persistence.load();
  applySettings();
  try {
    await prepareArt(scenes[persistence.state.scene]);
  } catch {
    $("begin").disabled = false;
    $("begin").textContent = "Retry loading";
    toast("Artwork could not load. Check the connection and retry.");
    return;
  }
  $("welcome").hidden = true;
  $("game").hidden = false;
  startWorld();
  world.pause(false);
  $("world").focus();
  try {
    const health = await api("/api/health");
    $("mode").textContent =
      health.provider === "ollama"
        ? "Local AI · on your PC"
        : "Limited story mode";
  } catch {
    $("mode").textContent = "Offline exploration";
  }
};
$("interact").onclick = () => world.interact();
$("home").onclick = () => {
  speech.stop();
  if (world.scene.id === "home") {
    world.enterDoor(
      world.scene.interactables.find((o) => o.id === "outside-door"),
    );
  } else {
    if (world.scene.id !== "shanghai") {
      const exit = world.scene.interactables.find(
        (o) => o.type === "door" && o.target === "shanghai",
      );
      if (exit) world.enterDoor(exit);
    }
    world.walkTo(
      scenes.shanghai.interactables.find((o) => o.id === "home-north"),
      true,
    );
    panda(
      persistence.state.adventure.hungry === "done"
        ? "回家吧！小羊在家里等我们。"
        : "回家吧！我们一起走。",
    );
  }
  updatePlace();
};
$("journal").onclick = panels.journal;
$("settings").onclick = panels.settings;
$("map").onclick = panels.map;
for (const button of document.querySelectorAll("[data-close]"))
  button.onclick = () => $(button.dataset.close).close();
for (const dialog of document.querySelectorAll("dialog"))
  dialog.addEventListener("close", () => {
    if (dialog.id === "panda-coach" && !dialog.open) {
      speech.stop();
      coachController?.abort();
      coachGeneration++;
    }
    if (dialog.id === "panel" && !dialog.open) {
      speech.stop();
      adventure.close();
      world?.standUp();
      dialog.classList.remove("seated-panel");
    }
    if (dialog.id === "conversation" && !dialog.open) {
      requestGeneration++;
      controller?.abort();
      speech.stop();
      currentNpc = null;
      $("panda-help").open = false;
      panda("我们接下来做什么？看看左上角的目标吧。");
    }
    if (!$("panel").open && !$("conversation").open) world?.pause(false);
  });
$("replay").onclick = () =>
  speech.speak(currentReply.chinese, false, npcs[currentNpc]?.voice || "male");
$("slow-replay").onclick = () =>
  speech.speak(currentReply.chinese, true, npcs[currentNpc]?.voice || "male");
$("stop-speech").onclick = () => speech.stop();
$("toggle-pinyin").onclick = () => {
  const pinyin = !persistence.state.settings.pinyin;
  panels.setSettings({ pinyin }, `Pinyin: ${pinyin ? "shown" : "hidden"}`);
};
$("more-help").onclick = () => {
  helpLevel = Math.min(3, helpLevel + 1);
  updateHelp();
  showPandaCoach();
};
$("less-help").onclick = () => {
  helpLevel = Math.max(0, helpLevel - 1);
  updateHelp();
};
$("reply-form").onsubmit = async (e) => {
  e.preventDefault();
  const text = $("reply").value.trim();
  if (!text || $("send").disabled || !currentNpc) return;
  const id = currentNpc,
    generation = ++requestGeneration;
  controller = new AbortController();
  $("send").disabled = true;
  $("dialog-status").textContent = "Thinking of a reply on your PC…";
  speech.stop();
  try {
    const result = await api(
      "/api/dialogue",
      {
        npcId: id,
        text,
        history: persistence.state.history,
        shopId: currentShop,
      },
      AbortSignal.any([controller.signal, AbortSignal.timeout(65000)]),
    );
    if (
      generation !== requestGeneration ||
      currentNpc !== id ||
      !$("conversation").open
    )
      return;
    persistence.change((s) => {
      s.history.push({ npc: id, user: text, reply: result });
      s.history = s.history.slice(-24);
      const preference = explicitPreference(text);
      if (preference)
        s.memories[id] = [
          ...new Set([...(s.memories[id] || []), preference.value]),
        ].slice(-8);
      for (const word of lexicon.filter((w) => result.chinese.includes(w.zh)))
        s.learner = expose(
          s.learner,
          word.id,
          `${world.scene.id}:${id}:${result.topic}`,
          helpLevel > 0,
        );
    });
    adventure.conversation();
    $("last-user").textContent = text;
    $("reply").value = "";
    displayReply(result);
    speech.speak(result.chinese, false, npcs[id]?.voice || "male");
    $("dialog-status").textContent = "+10 XP";
  } catch (error) {
    if (generation === requestGeneration && error.name !== "AbortError")
      $("dialog-status").textContent = error.message;
  } finally {
    if (generation === requestGeneration) {
      $("send").disabled = false;
      $("reply").focus();
    }
  }
};
window.addEventListener("online", () => persistence.flush());
window.addEventListener("pagehide", () => persistence.cache());
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    adventure.close();
    speech.stop();
    persistence.flush();
  }
});

document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (
    b &&
    persistence.state.settings.motion &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    b.animate([{ transform: "scale(.96)" }, { transform: "scale(1)" }], {
      duration: 160,
    });
});
