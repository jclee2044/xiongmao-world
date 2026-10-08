import { voiceForNpc } from "./data/voices.js";
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
import { prepareArt, prepareCommonArt } from "./game/render.js";
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
    toast("Another device has a newer save. Choose a save in your journal."),
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
    ? `Suzhou · ${district.zh}`
    : world.scene.chinese;
  $("place-cn").textContent = district
    ? `Suzhou · ${district.zh}`
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
function openPanel(title, html, language = "zh-CN") {
  $("panel").lang = language;
  $("panel")
    .querySelector(".close")
    .setAttribute("aria-label", language === "en" ? "Close" : "关");
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
    xp >= AREA_XP ? "可以去下一站了" : `${xp} / ${AREA_XP} XP`,
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
    if (!world.walkTo(position)) toast("这里走但是去，换个地方吧。");
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
    $("practice-active").textContent = status ? `正在做：${status}` : "";
}
const pandaBubble = $("panda-toggle").closest(".panda-bubble");
function expandPanda(expanded) {
  pandaBubble.classList.toggle("expanded", expanded);
  $("panda-content").hidden = !expanded;
  $("panda-toggle").setAttribute("aria-expanded", String(expanded));
  $("panda-toggle").setAttribute(
    "aria-label",
    expanded ? "不看熊猫的帮助" : "看熊猫的帮助",
  );
  $("panda-toggle-icon").textContent = expanded ? "⌄" : "⌃";
  $("panda-help").open = expanded;
}
$("panda-toggle").onclick = () =>
  expandPanda(!pandaBubble.classList.contains("expanded"));
pandaBubble.addEventListener("click", (event) => {
  if (!event.target.closest("button, summary, a, input")) expandPanda(true);
});
pandaBubble.addEventListener("keydown", (event) => {
  // Space/arrow keys belong to this panel while one of its controls has focus.
  event.stopPropagation();
  if (event.key === "Escape" && pandaBubble.classList.contains("expanded")) {
    expandPanda(false);
    $("panda-toggle").focus();
  }
});
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
neighborPractice.textContent = "中文练习";
neighborPractice.onclick = () => {
  const id = currentNpc;
  $("conversation").close();
  practice.openForNpc(id);
};
$("speech-controls").append(neighborPractice);
const enableOffline = () =>
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
          return toast("Save or export your journal before updating.");
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
    onArtStatus: (status) => {
      $("scene-loading").hidden = status === "ready";
      $("scene-loading").firstChild.textContent =
        status === "error"
          ? "This corner could not load. Check your connection and try again. "
          : "Opening the next little corner… ";
      $("scene-retry").hidden = status !== "error";
    },
    onGuestArrive: () => {
      persistence.change((s) => {
        if (s.adventure.tea === "invited") s.adventure.tea = "seated";
      });
      panda("Qiao 已经坐下了，我们也去喝茶吧。");
    },
    onNear: (n) => {
      if (n && Date.now() - (panda.last || 0) > 6500) {
        panda.last = Date.now();
        const hints = {
          lian: "Lian 饿了。我们请她吃 hot pot 吧！",
          lan: "Lan 可能在找什么。去问问她吧。",
          qiao: "Qiao 今天有时间。想不想请她喝茶？",
          "tea-table": "两只杯子！找个朋友一起喝茶吧。",
          "lost-flowers": "石头旁边是不是有一些花？",
          museum: "里面有 Suzhou 的故事，我们进看看吧。",
          dumplings: "你想吃什么？试着用中文点菜吧。",
        };
        panda(
          hints[n.id] ||
            (n.type === "npc" || n.type === "passerby"
              ? "我们和他说说吧。"
              : n.type === "door"
                ? "我们可以进。"
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
  panda("欢迎！先认识五位邻居吧。左边上面有我们的要做的事情。");
}
function interact(n) {
  goals.nature(n.id);
  directions.visit(n.id);
  if (n.shopId)
    return openConversation(shops[n.shopId].seller, n.shopId, n.appearance);
  if (n.id === "sheep-keepsake") {
    openPanel(
      "Lian 送的 sheep",
      `<img src="/assets/optimized/sheep-gift.webp" alt="你的sheep" width="130" height="145" class="keepsake-portrait"/><p class="chinese" lang="zh-CN">${escape(n.zh)}</p><p class="notice">这是和Lian一起吃hot pot的时候，她送给你的。</p>`,
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
      panda("Lian 跟我们进来了！一起坐下吃 hot pot 吧。");
      updateXP();
    }
    updatePlace();
  } else if (["npc", "passerby", "guest"].includes(n.type))
    openConversation(n.dialogueId || n.id, null, n.appearance);
  else if (n.type === "journal") panels.journal();
  else if (n.type === "stuffy") {
    if (!persistence.state.found.includes("momo"))
      persistence.change((s) => {
        s.found.push("momo");
        s.journal.push("在河边认识了 Momo，带 Momo 回家了。");
        s.journal = s.journal.slice(-50);
      });
    openPanel(
      "Momo",
      `<p class="chinese" lang="zh-CN">我们一起回家吧。</p>${persistence.state.settings.translation ? "<p>Let’s go home together.</p>" : ""}<button class="primary" id="bring-home">带Momo回家 ↗</button>`,
    );
    $("bring-home").onclick = () => {
      $("panel").close();
      world.changeScene("home");
      updatePlace();
      toast("Momo 到家了。");
    };
  } else if (n.type === "friend")
    openPanel(
      "Momo",
      `<p class="chinese" lang="zh-CN">和你在一起，真好。</p>${persistence.state.settings.translation ? "<p>It’s good to be with you.</p>" : ""}`,
    );
  else if (n.type === "animal") {
    const animals = {
      "lake-cat": {
        zh: "你好，小猫！你在湖旁边做什么？",
        pinyin: "nǐ hǎo ， xiǎo māo ！ nǐ zài hú páng biān zuò shén me ？",
        meaning: "Hello, kitty! What are you doing by the lake?",
      },
      "lake-duck": {
        zh: "你好，duck！你喜欢游泳吗？",
        pinyin: "nǐ hǎo ，duck！ nǐ xǐ huan yóu yǒng ma ？",
        meaning: "Hello, little duck! Do you like swimming?",
      },
      "garden-rabbit": {
        zh: "你好，rabbit！你的耳朵真长。",
        pinyin: "nǐ hǎo ，rabbit！ nǐ de ěr duo zhēn cháng 。",
        meaning: "Hello, little rabbit! Your ears are so long.",
      },
    };
    const text = animals[n.id] || n;
    if (!text.zh) return;
    openPanel(
      n.name,
      `<p class="chinese" lang="zh-CN">${text.zh}</p>${persistence.state.settings.pinyin ? `<p class="pinyin">${text.pinyin}</p>` : ""}${persistence.state.settings.translation ? `<p class="meaning">${text.meaning}</p>` : ""}<div class="small-actions"><button id="animal-replay">听一听</button><button id="animal-practice">湖旁边找动物</button></div><p id="panel-audio-status" role="status" class="muted"></p>`,
    );
    $("animal-replay").onclick = () => speech.speak(text.zh);
    $("animal-practice").onclick = () => practice.start("lake-animals");
  } else if (n.type === "inspect") {
    const fact = culture[n.culture];
    const factHtml = fact
      ? `<div class="panel-section"><h3 lang="zh-CN">${escape(fact.title.split(" · ")[0])}</h3><p class="chinese" lang="zh-CN">${escape(fact.zh)}</p>${persistence.state.settings.pinyin ? `<p class="pinyin">${escape(fact.pinyin)}</p>` : ""}${persistence.state.settings.translation ? `<p class="meaning">${escape(fact.meaning)}</p>` : ""}<div class="small-actions"><button id="culture-replay">听Suzhou的故事</button><a href="${escape(fact.source)}" target="_blank" rel="noopener noreferrer">Source ↗</a></div><p class="notice" lang="zh-CN">这是游戏里的Suzhou。真的Suzhou更大，路也不一样。</p>${persistence.state.settings.translation ? '<p class="notice">This is a condensed illustrated interpretation of Suzhou; places and routes have been rearranged.</p>' : ""}</div>`
      : "";
    openPanel(
      n.name,
      `<p class="chinese" lang="zh-CN">${escape(n.zh)}</p>${persistence.state.settings.pinyin ? `<p class="pinyin">${escape(n.pinyin)}</p>` : ""}${persistence.state.settings.translation ? `<p class="meaning">${escape(n.meaning)}</p>` : ""}<button id="place-replay">再听一次</button>${factHtml}<p id="panel-audio-status" role="status" class="muted"></p>`,
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
      button.textContent = "中文练习";
      button.onclick = () => practice.openForNpc(hosts[n.id]);
      $("panel-content").append(button);
    }
  }
}
let currentShop = null;
let clothingItem = null;
let clothingStage = "choose";
let currentVoice = "older-male";
function openConversation(id, shopId = null, appearance = null) {
  currentVoice = voiceForNpc(id, appearance);
  currentShop = shopId;
  clothingItem = null;
  clothingStage = "choose";
  $("reply-form").hidden = shopId === "clothing";
  $("shop-view")?.remove();
  $("shop-purchases")?.remove();
  $("conversation").classList.toggle("shop-conversation", Boolean(shopId));
  $("conversation").classList.toggle(
    "clothing-conversation",
    shopId === "clothing",
  );
  requestGeneration++;
  controller?.abort();
  speech.stop();
  currentNpc = id;
  goals.meet(id);
  speech.voice = currentVoice;
  helpLevel = persistence.state.settings.help === "more" ? 1 : 0;
  $("npc-name").textContent = npcs[id].name;
  $("reply").value = "";
  $("last-user").textContent = "";
  $("reply").placeholder =
    npcs[id].starter?.example || starters[npcs[id].topic].example;
  $("send").disabled = false;
  const last = persistence.state.history.filter((h) => h.npc === id).at(-1);
  displayReply(
    (id === "visitor-4" ? null : last?.reply) || {
      ...npcs[id].greeting,
      mode: "authored",
      notice: "",
    },
  );
  $("dialog-status").textContent = "";
  $("npc-quest")?.remove();
  $("directions-quest")?.remove();
  if (["lin", "hao", "visitor-1"].includes(id) && !shopId) {
    const button = document.createElement("button");
    button.id = "directions-quest";
    button.className = "quest-invitation";
    button.textContent =
      id === "lin"
        ? "饭店怎么走？"
        : id === "visitor-1"
          ? "我来告诉你花店怎么走。"
          : "我来帮你找书店。";
    button.onclick = () => {
      $("conversation").close();
      id === "lin"
        ? directions.find()
        : id === "visitor-1"
          ? directions.flowers()
          : directions.give();
    };
    $("speech-controls").append(button);
  }
  if (id === "lan" || id === "qiao" || id === "lian") {
    const button = document.createElement("button");
    button.id = "npc-quest";
    button.className = "quest-invitation";
    button.textContent =
      id === "lian"
        ? "我请你吃 hot pot 吧！"
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
      meaning:
        shopId === "clothing"
          ? "Welcome! Take a look and see which piece of clothing you like."
          : shop.items.map((i) => `${i.en}: ¥${i.price}`).join(" · "),
      topic: "food",
      mode: "authored",
      notice: "",
    });
    renderShopPurchases();
  }
  $("conversation").showModal();
  animatePanel($("conversation"));
  world.pause(true);
  (shopId === "clothing"
    ? $("shop-purchases").querySelector("button")
    : $("reply")
  ).focus();
  speech.speak(currentReply.chinese, false, currentVoice);
}
function renderShopPurchases() {
  $("shop-purchases")?.remove();
  if (!currentShop) return;
  if (currentShop === "clothing") return renderClothingPurchase();
  const box = document.createElement("section");
  box.id = "shop-purchases";
  const a = persistence.state.adventure;
  const money = document.createElement("p");
  money.textContent = `钱 ${a.coins} 元`;
  box.append(money);
  for (const item of shops[currentShop].items) {
    const b = document.createElement("button");
    b.dataset.buy = item.id;
    const bought = a.purchases.includes(item.id);
    b.textContent = bought
      ? `${item.zh} ✓ 已经买了`
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
          `在${shops[currentShop].name}买了${item.zh}，花了${item.price}元。`,
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
      speech.speak(thanks, false, currentVoice);
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
function renderClothingPurchase() {
  const box = document.createElement("section");
  box.id = "shop-purchases";
  box.className = "clothing-purchase";
  const a = persistence.state.adventure;
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  status.textContent = `钱 ${a.coins} 元 · ${clothingStage === "choose" ? "选择一件衣服" : clothingItem?.zh || ""}`;
  box.append(status);
  const choice = (label, action, className = "") => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.className = className;
    button.onclick = action;
    box.append(button);
    return button;
  };
  const say = (user, chinese, pinyin, meaning) => {
    $("last-user").textContent = user;
    displayReply({
      chinese,
      pinyin,
      meaning,
      topic: "activities",
      mode: "authored",
      notice: "",
    });
    speech.speak(chinese, false, "female");
  };
  const advance = (stage) => {
    clothingStage = stage;
    renderShopPurchases();
    $("shop-purchases").querySelector("button")?.focus();
  };
  const garmentArt = (item) => {
    const art = document.createElement("span");
    art.className = "clothing-art";
    art.style.backgroundPosition = `${shops.clothing.items.indexOf(item) * 50}% center`;
    art.setAttribute("aria-hidden", "true");
    return art;
  };
  const choosing = clothingStage === "choose" || clothingStage === "done";
  if (!choosing && clothingItem) {
    const preview = document.createElement("div");
    preview.className = "clothing-selection";
    preview.dataset.selectedClothing = clothingItem.id;
    const details = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = `${clothingItem.zh} · ${clothingItem.price} 元`;
    const description = document.createElement("p");
    description.textContent = clothingItem.description;
    details.append(title, description);
    preview.append(garmentArt(clothingItem), details);
    box.append(preview);
  }
  if (choosing) {
    const catalog = document.createElement("div");
    catalog.className = "clothing-catalog";
    catalog.setAttribute("aria-label", "选择衣服");
    box.append(catalog);
    for (const item of shops.clothing.items) {
      const owned = a.purchases.includes(item.id);
      const button = choice(
        `${item.zh} · ¥${item.price}${owned ? " ✓ 已经买了" : ""}`,
        () => {
          clothingItem = item;
          if (owned) {
            advance("owned");
            return;
          }
          const unit = item.unit === "条" ? "tiáo" : "jiàn";
          say(
            `我喜欢这${item.unit}${item.zh}。`,
            `你穿着这${item.unit}${item.zh}真漂亮！想知道多少钱吗？`,
            `Nǐ chuānzhe zhè ${unit} ${item.pinyin} zhēn piàoliang! Xiǎng zhīdào duōshao qián ma?`,
            `The ${item.en} suits you! Would you like to ask its price?`,
          );
          advance("price");
        },
      );
      button.className = "clothing-card";
      button.dataset.clothing = item.id;
      const label = document.createElement("strong");
      label.textContent = item.zh;
      const price = document.createElement("span");
      price.textContent = owned ? "✓ 已经买了" : `${item.price} 元`;
      button.replaceChildren(garmentArt(item), label, price);
      catalog.append(button);
    }
  } else if (clothingStage === "owned") {
    const owned = document.createElement("p");
    owned.textContent = "这件衣服已经买好了。再看看别的吧！";
    box.append(owned);
  } else if (clothingStage === "price") {
    choice(`请问，这${clothingItem.unit}多少钱？`, () => {
      const unit = clothingItem.unit === "条" ? "tiáo" : "jiàn";
      say(
        `请问，这${clothingItem.unit}多少钱？`,
        `这${clothingItem.unit}${clothingItem.zh}${clothingItem.price}元。你觉得怎么样？`,
        `Zhè ${unit} ${clothingItem.pinyin} ${clothingItem.pricePinyin} yuán. Nǐ juéde zěnmeyàng?`,
        `This ${clothingItem.en} costs ¥${clothingItem.price}. What do you think?`,
      );
      advance("experience");
    });
  } else if (clothingStage === "experience") {
    choice("我找到喜欢的衣服了！", () => {
      say(
        "我找到喜欢的衣服了！",
        "太好了！你想用手机还是信用卡？",
        "tài hǎo le ！ nǐ xiǎng yòng shǒu jī hái shì xìn yòng kǎ ？",
        "Great! Would you like to use your phone or a credit card?",
      );
      advance("method");
    });
  } else if (clothingStage === "method") {
    choice("可以用手机吗？", () => {
      say(
        "可以用手机吗？",
        "可以！请拿出手机。 Scan the QR code.",
        "kě yǐ ！ qǐng ná chū shǒu jī 。 Scan the QR code.",
        "Yes. Take out your phone and scan the QR code on the counter.",
      );
      advance("qr");
    });
    choice("可以用信用卡吗？", () => {
      say(
        "可以用信用卡吗？",
        "可以！请拿出信用卡。 Tap the card reader.",
        "kě yǐ ！ qǐng ná chū xìn yòng kǎ 。 Tap the card reader.",
        "Yes. Take out your card and tap it on the card reader.",
      );
      advance("card");
    });
  } else if (["qr", "card"].includes(clothingStage)) {
    const prop = document.createElement("div");
    prop.className = `payment-prop ${clothingStage}`;
    prop.setAttribute("aria-hidden", "true");
    prop.textContent = clothingStage === "qr" ? "▣  →  ▦" : "▭  →  ▣";
    box.append(prop);
    const method = clothingStage;
    const pay = choice(
      method === "qr"
        ? "Use your phone to scan the QR code · " + clothingItem.price + " 元"
        : "Tap your card on the reader · " + clothingItem.price + " 元",
      () => {
        if (persistence.state.adventure.coins < clothingItem.price) {
          say(
            "我的钱太少了。",
            "钱太少了。你可以再选择一件。",
            "qián tài shǎo le 。 nǐ kě yǐ zài xuǎn zé yí jiàn 。",
            "You don’t have enough coins. You can choose another item.",
          );
          advance("choose");
          return;
        }
        const item = clothingItem;
        persistence.change((s) => {
          if (
            s.adventure.purchases.includes(item.id) ||
            s.adventure.coins < item.price
          )
            return;
          s.adventure.coins -= item.price;
          s.adventure.purchases.push(item.id);
          award(s.adventure, 10);
          s.journal.push(
            `在衣服店买了${item.zh}，花了${item.price}元。${method === "qr" ? "Paid by phone." : "Paid by card."}`,
          );
          s.journal = s.journal.slice(-50);
        });
        say(
          method === "qr" ? "我用手机。" : "我用信用卡。",
          "买好了！这是你的衣服。谢谢你！",
          "mǎi hǎo le ！ zhè shì nǐ de yī fu 。 xiè xiè nǐ ！",
          `Payment complete. Here is your ${item.en}. Thanks for shopping!`,
        );
        updateXP();
        advance("done");
      },
      "primary",
    );
    pay.disabled = a.coins < clothingItem.price;
    if (pay.disabled) {
      const notice = document.createElement("p");
      notice.textContent = "钱太少了，可以看看别的衣服。";
      box.append(notice);
    }
    choice("Choose another payment method", () => advance("method"));
  }
  if (!choosing)
    choice("再看看别的衣服", () => advance("choose"), "clothing-change");
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
    ? "不看 Pinyin"
    : "看 Pinyin";
  $("toggle-pinyin").setAttribute("aria-pressed", String(settings.pinyin));
  $("npc-meaning").textContent = reply.meaning;
  $("npc-meaning").hidden = !settings.translation;
  $("mode").textContent =
    reply.mode === "local"
      ? "聊天"
      : reply.mode === "story"
        ? "聊天"
        : "Suzhou";
  $("reply-notice").textContent = reply.mode === "story" ? "先聊天吧。" : "";
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
  $("panda-explanation").textContent = persistence.state.settings.translation
    ? `${word.meaning}. ${word.why} 句子：${word.example}`
    : `句子：${word.example}`;
  $("panda-help").open = true;
  $("dialog-status").textContent = persistence.state.settings.translation
    ? `${word.zh}: ${word.meaning}. ${word.why}`
    : `句子：${word.example}`;
}
function updateHelp() {
  const starter =
    (currentReply?.topic === npcs[currentNpc]?.topic &&
      npcs[currentNpc]?.starter) ||
    starters[currentReply?.topic || "greeting"];
  $("panda-message").textContent =
    helpLevel >= 3
      ? `你可以说：${starter.example}`
      : helpLevel >= 2
        ? starter.zh
        : "帮助";
  $("panda-explanation").textContent =
    helpLevel >= 2
      ? starter.tip
      : "可以再听一次，点点下面的词，或者问熊猫怎么说。";
  $("help-inline").textContent =
    helpLevel >= 3
      ? `你可以说：${starter.example} ${starter.tip}`
      : helpLevel >= 2
        ? `可以说：${starter.zh} · ${starter.tip}`
        : helpLevel >= 1
          ? "点点下面的词，或者慢慢听一次。"
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
    helpLevel >= 2 ? starter.tip : `别人说：${currentReply.chinese}`;
  $("coach-next").textContent = helpLevel >= 2 ? "看看句子" : "帮我说一句子";
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
  $("coach-status").textContent = "熊猫想一想…";
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
    $("coach-status").textContent = "熊猫来帮你";
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
        "现在回答不了。再问一次，或者看看先说什么吧。";
  } finally {
    if (token === coachGeneration) $("coach-send").disabled = false;
  }
};
$("welcome-how").onclick = () => $("welcome-guide").showModal();
$("welcome-about").onclick = () => $("welcome-credits").showModal();
$("demo-word").onclick = () => {
  const show = $("demo-definition").hidden;
  $("demo-definition").hidden = !show;
  $("demo-hint").hidden = show;
  $("demo-word").setAttribute("aria-expanded", String(show));
};
$("scene-retry").onclick = () => world?.loadSceneArt();
let offlineScheduled = false;
$("begin").onclick = async () => {
  music.enable().catch(() => {});
  ambience.enable();
  $("begin").disabled = true;
  $("begin").textContent = "Opening your world…";
  $("welcome-loading").hidden = false;
  $("entry-status").textContent = "Opening your journal…";
  $("entry-progress").removeAttribute("value");
  try {
    // Shared character art can load while the server checks the journal.
    await Promise.all([persistence.load(), prepareCommonArt()]);
    await prepareArt(
      scenes[persistence.state.scene] || scenes.shanghai,
      (done, total) => {
        $("entry-status").textContent =
          `Preparing your little world · ${done} of ${total}`;
        $("entry-progress").value = Math.round((done / total) * 100);
      },
    );
  } catch {
    $("begin").disabled = false;
    $("begin").textContent = "Try again →";
    $("entry-status").textContent =
      "Artwork could not load. Check your connection and try again.";
    return;
  }
  $("welcome").hidden = true;
  $("game").hidden = false;
  window.scrollTo(0, 0);
  startWorld();
  world.pause(false);
  $("world").focus();
  // Offline installation must not compete with the first playable scene.
  if (!offlineScheduled) {
    offlineScheduled = true;
    setTimeout(enableOffline, 2000);
  }
};
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
        ? "回家吧！sheep 在家里等我们。"
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
      panda("我们接下来做什么？看看左边上面的要做的事情吧。");
    }
    if (!$("panel").open && !$("conversation").open) world?.pause(false);
  });
$("replay").onclick = () =>
  speech.speak(currentReply.chinese, false, currentVoice);
$("slow-replay").onclick = () =>
  speech.speak(currentReply.chinese, true, currentVoice);
$("stop-speech").onclick = () => speech.stop();
$("toggle-pinyin").onclick = () => {
  const pinyin = !persistence.state.settings.pinyin;
  panels.setSettings({ pinyin }, `Pinyin：${pinyin ? "看" : "不看"}`);
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
  $("dialog-status").textContent = "想一想怎么说…";
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
    speech.speak(result.chinese, false, currentVoice);
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
