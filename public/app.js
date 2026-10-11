import { progression, beginInteraction, answerInteraction, completionText } from "./data/rewards.js";
import { waitingTravelerProfile } from "./data/station-waiting-travelers.js";
import { platformTravelerProfile } from "./data/station-platform-travelers.js";
import { activities } from "./data/activities.js";
import { XIAOCHENG, STATION_DEPARTURE } from "./data/station-departure.js";
import { stationJourneyAction, indoorTravelerGreeting, waitingTravelerGreeting, platformTravelerGreeting } from "./data/station-journey.js";
import { dialogueQuestions } from "./game/coach-questions.js";
import { createDialogueVariations, createAmbientDialogue } from "./game/dialogue-variation.js";
import { passiveLandmarks } from "./game/interactions.js";
import { createLandmarkPanda } from "./game/panda-landmarks.js";
import { activityGuide } from "./game/activity-guide.js";
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
import { scenes, districtAt, interactionPoint } from "./game/world.js";
// Safari can ignore the viewport zoom restriction; cancel its pinch gestures.
for (const type of ["gesturestart", "gesturechange", "gestureend"])
  document.addEventListener(type, (event) => event.preventDefault(), {
    passive: false,
  });
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
  currentNpc = null,
  currentReply = null,
  conversationHistory = [],
  helpLevel = 0,
  requestGeneration = 0,
  controller;
const persistence = new Persistence(
  (text) => ($("save-status").textContent = text),
  () =>
    toast("Another device has a newer save. Open Settings → Save and devices."),
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
const dialogueVariations = createDialogueVariations();
speech.resolveText = (text) => {
  dialogueVariations.prepare($("panel-content"));
  return dialogueVariations.spoken(text);
};
new MutationObserver(() =>
  dialogueVariations.prepare($("panel-content")),
).observe($("panel-content"), { childList: true, subtree: true });
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
  if (!persistence.state.settings.voice) speech.stop();
  music.applySettings(persistence.state.settings);
  ambience.applySettings();
  document.documentElement.dataset.motion = String(
    persistence.state.settings.motion,
  );
  document.documentElement.dataset.textSize =
    persistence.state.settings.textSize;
  if (currentReply) renderReply(currentReply);
  practice.refresh();
}
function restoreWorld() {
  world.changeScene(persistence.state.scene, persistence.state.position);
  updatePlace();
  applySettings();
}
function openPanel(title, html, language = "zh-CN") {
  dialogueVariations.cancel();
  landmarkPanda.cancel();
  hidePandaSpeech();
  wordHelp.hide();
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
  dialogueVariations.prepare($("panel-content"));
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
let pandaTimer;
function hidePandaSpeech() {
  panda.generation++;
  panda.presentation++;
  clearTimeout(pandaTimer);
  $("panda-speech").hidden = true;
}
function panda(text, vary = true) {
  if (vary) {
    const token = ++panda.generation;
    dialogueVariations.present(
      { chinese: text, topic: "activities" },
      (line) => panda(line.chinese, false),
      () => token === panda.generation && !$("panda-speech").hidden,
    );
    return;
  }
  if (!$("panda-speech").hidden && $("panda-message").textContent === text)
    return;
  clearTimeout(pandaTimer);
  $("panda-message").textContent = text;
  $("panda-speech").hidden = false;
  const token = ++panda.presentation;
  // Freeze the visible variation before speech starts, including while queued.
  dialogueVariations.spoken(text);
  if (persistence.state.settings.voice) {
    speech.narrate(text, {
      valid: () => token === panda.presentation && !$("panda-speech").hidden,
    }).finally(() => {
      if (token === panda.presentation)
        pandaTimer = setTimeout(hidePandaSpeech, 1500);
    });
  } else pandaTimer = setTimeout(hidePandaSpeech, 7500);
}
panda.generation = 0;
panda.presentation = 0;
const landmarkPanda = createLandmarkPanda({
  getBoatVisited: () => persistence.state.adventure.boatVisited || persistence.state.adventure.boatTaken,
  onBoatVisit: () => persistence.change((s) => { s.adventure.boatVisited = true; }),
  getPandaMoments: () => persistence.state.adventure.pandaMoments,
  onPandaMoment: (id) => persistence.change((s) => { s.adventure.pandaMoments.push(id); }),
  getStationJourney: () => persistence.state.adventure.stationJourney,
  getCompletedPractice: () => persistence.state.practice.completed,
  getFound: (id) => persistence.state.found.includes(id),
  generate: (area, signal) =>
    api("/api/coach", { kind: "landmark", area }, signal),
  show: (text) => panda(text, false),
  hide: hidePandaSpeech,
});
function updateXP() {
  goals.refresh();
  if (!$("xp-progress")) return;
  const { earned: xp, required } = progression(persistence.state.adventure, persistence.state.scene);
  $("xp-progress").max = required;
  $("xp-progress").value = Math.min(required, xp);
  $("xp-text").textContent = `${xp} / ${required} XP`;
  $("xp-progress").setAttribute(
    "aria-label",
    xp >= required ? "可以去下一站了" : `${xp} / ${required} XP`,
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
  openPractice: (id) => practice.start(id),
  browsePractice: () => practice.catalog(),
  guideTo,
  annotateWords: (element) => wordHelp.annotate(element),
  showMapWord: (text, anchor) => wordHelp.showText(text, anchor),
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
function guideTo(id) {
  const target = world.destinations().find((stop) => stop.id === id);
  if (target) {
    $("panel").close();
    world.pause(false);
    $("world").focus();
    if (!world.walkTo(target, true))
      toast("No route found. Try using the map.");
    return;
  }
  const exit = world.scene.interactables.find(
    (stop) => stop.type === "door" && stop.target === "shanghai",
  );
  if (exit) {
    $("panel").close();
    world.pause(false);
    world.walkTo(exit, true);
    toast("Return outside, then choose Show me where again.");
  } else {
    panels.map();
    toast(
      "Choose the destination on the map. Indoor activities may require entering the building first.",
    );
  }
}
function updatePracticeStatus() {
  updateXP();
  const status = practice.status();
  let tracker = $("activity-tracker");
  if (!tracker) {
    tracker = document.createElement("div");
    tracker.id = "activity-tracker";
    tracker.lang = "en";
    $("panda-hints").append(tracker);
  }
  tracker.replaceChildren();
  const active = persistence.state.practice.active;
  const heading = document.createElement("strong"),
    detail = document.createElement("p"),
    action = document.createElement("button");
  if (active) {
    const guide = activityGuide(active.id, active);
    heading.textContent = guide.english;
    detail.textContent = `Next: ${guide.next}`;
    action.textContent = guide.target ? "Show me where" : "Continue activity";
    action.onclick = () =>
      guide.target ? guideTo(guide.target) : practice.start(active.id);
  } else {
    heading.textContent = "Choose an activity";
    detail.textContent = "Open your journal to choose an activity.";
    action.textContent = "Open journal";
    action.onclick = () => panels.journal();
  }
  tracker.append(heading, detail, action);
  if ($("practice-active"))
    $("practice-active").textContent = status ? `Continue: ${status}` : "";
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
  speech.speak($("panda-message").textContent, false, "panda");
$("panda-help").parentElement.append(pandaListen);
const practiceStatus = document.createElement("p");
practiceStatus.id = "practice-active";
practiceStatus.lang = "en";
practiceStatus.setAttribute("role", "status");
$("panda-help").append(practiceStatus);
const enableOffline = () => registerPwa({
  onStatus: toast,
  onUpdate: activate => {
    let button = $("game-update");
    if (!button) {
      button = document.createElement("button");
      button.id = "game-update";
      button.dataset.wordLeaf = "";
      button.textContent = "更新游戏 · Update game";
      $("settings").parentElement.append(button);
    }
    button.onclick = () => { persistence.cache(); activate(); };
    toast("Game update ready. Use Update game to load the latest version.");
  },
});
function startWorld() {
  hidePandaSpeech();
  const state = persistence.state;
  world = new World($("world"), {
    varyBubble: createAmbientDialogue(),
    getSettings: () => ({
      ...persistence.state.settings,
      motion:
        persistence.state.settings.motion &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches,
    }),
    getFound: () => persistence.state.found,
    getAdventure: () => persistence.state.adventure,
    getPractice: () => persistence.state.practice,
    onStationTravelerProgress: (status, distance) => {
      persistence.change((s) => {
        s.adventure.stationTraveler = status;
        s.adventure.stationTravelerDistance = distance;
        if (status === "entered") {
          const entry = "Xiaocheng followed your directions across the bridge and entered Suzhou Station.";
          if (!s.journal.includes(entry)) s.journal = [...s.journal, entry].slice(-50);
        }
      });
    },
    onStationJourneyAction: (action) => {
      persistence.change((s) => {
        s.adventure.stationJourney = stationJourneyAction(s.adventure.stationJourney, action);
      });
      // Continuous walking postpones the ordinary save debounce. Dialogue on
      // the server must see the train that has just arrived on this screen.
      if (action === "train-arrived") void persistence.flush();
    },
    onArtStatus: (status) => {
      $("scene-loading").hidden = status !== "error";
      $("scene-loading").firstChild.textContent =
        "This corner could not load. Check your connection and try again. ";
      if (status === "ready" && world?.scene.id === "shantang")
        landmarkPanda.update(world.scene, world.player, !document.querySelector("dialog[open]"));
      $("scene-retry").hidden = status !== "error";
    },
    onGuestArrive: () => {
      persistence.change((s) => {
        if (s.adventure.tea === "invited") s.adventure.tea = "seated";
      });
      panda("小乔已经坐下了，我们也去喝茶吧。");
    },
    onStep: (scene, position) => {
      music.setScene(scenes[scene], position);
      ambience.station?.update(scenes[scene], position,
        ambience.ready && !document.hidden && (persistence.state.settings.ambience ?? 0.25) > 0);
      landmarkPanda.update(
        scenes[scene],
        position,
        !document.querySelector("dialog[open]") && (scene !== "shantang" || !world?.artPending),
      );
    },
    onMove: (scene, position) => {
      const changedScene = persistence.state.scene !== scene;
      music.setScene(scenes[scene], position);
      ambience.station?.update(scenes[scene], position,
        ambience.ready && !document.hidden && (persistence.state.settings.ambience ?? 0.25) > 0);
      persistence.change((s) => {
        if (scene === "station-waiting" || s.scene === "station-waiting")
          s.adventure.stationJourney = stationJourneyAction(s.adventure.stationJourney, "visit-waiting");
        s.scene = scene;
        if (scene === "shantang") s.adventure.boatTaken = true;
        s.position = { ...position };
      });
      if (changedScene) updateXP();
      landmarkPanda.update(
        scenes[scene],
        position,
        !document.querySelector("dialog[open]") && (scene !== "shantang" || !world?.artPending),
      );
      if (!document.querySelector("dialog[open]")) {
        for (const target of scenes[scene].interactables.filter((o) =>
          passiveLandmarks.has(o.id),
        )) {
          const point = interactionPoint(target);
          if (Math.hypot(position.x - point.x, position.y - point.y) > 110)
            continue;
          if (!persistence.state.adventure.nature.includes(target.id))
            goals.nature(target.id);
          if (practice.visit(target.id)) break;
        }
      }
      updatePlace();
    },
    onInteract: interact,
    onSignSelect: phrase => {
      openPanel(
        "Panda explains the sign",
        `<img class="keepsake-portrait" src="/assets/panda.png" alt="Panda" width="100" height="100"/><p class="chinese" lang="zh-CN">${escape(phrase.zh)}</p><p class="pinyin">${escape(phrase.pinyin)}</p><p class="meaning">${escape(phrase.meaning)}</p><p>${escape(phrase.explanation)}</p><p class="chinese" lang="zh-CN">${escape(phrase.spoken)}</p><button id="sign-replay">Listen to Panda</button><p id="panel-audio-status" role="status" class="muted"></p>`,
        "en",
      );
      $("sign-replay").onclick = () => {
        speech.speak(phrase.spoken, false, "panda");
        speech.narrate(phrase.explanation);
      };
      speech.speak(phrase.spoken, false, "panda");
      speech.narrate(phrase.explanation);
    },
  });
  landmarkPanda.update(
    scenes[state.scene] || scenes.shanghai,
    state.position,
    false,
  );
  world.changeScene(state.scene, state.position);
  updatePlace();
  applySettings();
  updatePracticeStatus();
  updateXP();
}
function interact(n) {
  landmarkPanda.cancel();
  hidePandaSpeech();
  goals.nature(n.id);
  directions.visit(n.id);
  if (n.shopId)
    return openConversation(shops[n.shopId].seller, n.shopId, n.appearance);
  if (n.id === "sheep-keepsake") {
    openPanel(
      "小莲送的羊",
      `<img src="/assets/optimized/sheep-gift.webp" alt="你的羊" width="130" height="145" class="keepsake-portrait"/><p class="chinese" lang="zh-CN">${escape(n.zh)}</p><p class="notice">这是和小莲一起吃火锅的时候，她送给你的。</p>`,
    );
    speech.speak(n.zh, false, "panda");
    return;
  }
  if (adventure.interact(n)) return;
  if (practice.visit(n.id)) return;
  if (passiveLandmarks.has(n.id)) return;
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
      panda("小莲跟我们进来了！一起坐下吃火锅吧。");
      updateXP();
    }
    updatePlace();
  } else if (["npc", "passerby", "guest"].includes(n.type))
    openConversation(n.dialogueId || n.id, null, n.appearance);
  else if (n.type === "journal") panels.journal();
  else if (n.type === "stuffy") {
    const id = n.collectible || "momo";
    const fox = id === "fox-plush";
    const rabbit = id === "rabbit-plush";
    const name = rabbit ? "小兔子" : fox ? "小狐狸" : "小熊";
    const plushImage = rabbit ? "/assets/optimized/rabbit-plush.webp" : fox
      ? "/assets/characters/fox-plush.png"
      : "/assets/characters/momo.webp";
    openPanel(
      name,
      `<div class="collectible-discovery"><img class="collectible-reveal" src="${plushImage}" alt="${name}玩具"><p class="chinese" lang="zh-CN">哇！你找到了一个${name}玩具！</p>${persistence.state.settings.translation ? `<p>Wow! You found a little ${rabbit ? "rabbit" : fox ? "fox" : "bear"} plush!</p>` : ""}<button class="primary" id="bring-home" data-word-leaf>收集 <span lang="en">Collect</span></button></div>`,
    );
    speech.speak(`哇！你找到了一个${name}玩具！`, false, "panda");
    $("bring-home").onclick = () => {
      if (!persistence.state.found.includes(id))
        persistence.change((s) => {
          s.found.push(id);
          s.journal.push(
            rabbit ? "在车站的壁画后面找到了一只长耳朵玩具小兔子，带它回家了。" : fox
              ? "在竹子后面找到了一只玩具小狐狸，带它回家了。"
              : "在树旁边找到了一个小熊玩具，带它回家了。",
          );
          s.journal = s.journal.slice(-50);
        });
      $("panel").close();
      world.changeScene("home");
      updatePlace();
      toast(`${name}到家了。`);
    };
  } else if (n.type === "friend")
    openPanel(
      n.name,
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
        zh: "你好，鸭子！你喜欢游泳吗？",
        pinyin: "nǐ hǎo ， yā zi ！ nǐ xǐ huan yóu yǒng ma ？",
        meaning: "Hello, little duck! Do you like swimming?",
      },
      "garden-rabbit": {
        zh: "你好，兔子！你的耳朵真长。",
        pinyin: "nǐ hǎo ， tù zi ！ nǐ de ěr duo zhēn cháng 。",
        meaning: "Hello, little rabbit! Your ears are so long.",
      },
    };
    const text = animals[n.id] || n;
    if (!text.zh) return;
    openPanel(
      n.name,
      `<p class="chinese" lang="zh-CN">${text.zh}</p>${persistence.state.settings.pinyin ? `<p class="pinyin">${text.pinyin}</p>` : ""}${persistence.state.settings.translation ? `<p class="meaning">${text.meaning}</p>` : ""}<div class="small-actions"><button id="animal-replay">听一听</button><button id="animal-practice">湖旁边找动物</button></div><p id="panel-audio-status" role="status" class="muted"></p>`,
    );
    $("animal-replay").onclick = () => speech.speak(text.zh, false, "panda");
    speech.speak(text.zh, false, "panda");
    $("animal-practice").onclick = () => practice.start("lake-animals");
  } else if (n.type === "inspect") {
    const fact = culture[n.culture];
    const factHtml = fact
      ? `<div class="panel-section"><h3 lang="zh-CN">${escape(fact.title.split(" · ")[0])}</h3><p class="chinese" lang="zh-CN">${escape(fact.zh)}</p>${persistence.state.settings.pinyin ? `<p class="pinyin">${escape(fact.pinyin)}</p>` : ""}${persistence.state.settings.translation ? `<p class="meaning">${escape(fact.meaning)}</p>` : ""}${fact.note ? `<p class="notice" lang="en">${escape(fact.note)}</p>` : ""}<div class="small-actions"><button id="culture-replay">听苏州的故事</button><a href="${escape(fact.source)}" target="_blank" rel="noopener noreferrer">Source ↗</a></div><p class="notice" lang="zh-CN">这是游戏里的苏州。真的苏州更大，路也不一样。</p>${persistence.state.settings.translation ? '<p class="notice">This is a condensed illustrated interpretation of Suzhou; places and routes have been rearranged.</p>' : ""}</div>`
      : "";
    openPanel(
      n.name,
      `${n.detailImage ? `<img class="place-closeup" src="${escape(n.detailImage)}" alt="${escape(n.detailAlt || n.name)}">` : ""}<p class="chinese" lang="zh-CN">${escape(n.zh)}</p>${persistence.state.settings.pinyin ? `<p class="pinyin">${escape(n.pinyin)}</p>` : ""}${persistence.state.settings.translation ? `<p class="meaning">${escape(n.meaning)}</p>` : ""}<button id="place-replay">再听一次</button>${factHtml}<p id="panel-audio-status" role="status" class="muted"></p>`,
    );
    if (fact) $("culture-replay").onclick = () => speech.speak(fact.zh, false, "panda");
    $("place-replay").onclick = () => speech.speak(n.zh, false, "panda");
    speech.speak(n.zh, false, "panda");
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
let currentEncounter = null;
function openConversation(id, shopId = null, appearance = null, replay = false) {
  if ($("conversation").open && currentNpc === id && !replay) return;
  let initiation;
  persistence.change((s) => { initiation = beginInteraction(s.adventure, id, s.scene, replay); });
  currentEncounter = initiation;
  updateXP();
  dialogueVariations.cancel();
  currentVoice = voiceForNpc(id, appearance);
  currentShop = shopId;
  clothingItem = null;
  clothingStage = "choose";
  $("reply-form").hidden = shopId === "clothing";
  $("station-departure-close")?.remove();
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
  conversationHistory = persistence.state.history.filter((turn) => turn.npc === id).slice(-6);
  dismissedFeedback = null;
  goals.meet(id);
  speech.voice = currentVoice;
  helpLevel = persistence.state.settings.help === "more" ? 1 : 0;
  $("npc-name").textContent = npcs[id].name;
  $("reply").value = "";
  $("last-user").textContent = "";
  const waitingProfile = platformTravelerProfile(id, world.scene.id) || waitingTravelerProfile(id, world.scene.id);
  $("reply").placeholder = waitingProfile?.starter || (
    id === XIAOCHENG && world.scene.id === "station-ticketing"
      ? "我想坐火车去上海。"
      : npcs[id].starter?.example || starters[npcs[id].topic].example);
  $("send").disabled = false;
  if (!shopId) displayReply({
    ...(waitingProfile?.greeting || (id === XIAOCHENG && world.scene.id === "station-platform" ? platformTravelerGreeting : id === XIAOCHENG && world.scene.id === "station-waiting" ? waitingTravelerGreeting : id === XIAOCHENG && world.scene.id === "station-ticketing" ? indoorTravelerGreeting : npcs[id].greeting)),
    purpose: "opening", npcId: id,
    mode: "authored",
    notice: "",
  }, id !== "station-help" && !waitingProfile && !(id === XIAOCHENG && ["station-ticketing", "station-waiting"].includes(world.scene.id)));
  $("dialog-status").textContent = "";
  $("npc-quest")?.remove();
  $("directions-quest")?.remove();
  for (const button of document.querySelectorAll("[data-npc-activity]")) button.remove();
  for (const activity of activities.filter(a => a.npc === id)) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.npcActivity = activity.id;
    button.textContent = activity.english;
    button.title = `Practice activity: ${activity.english}`;
    button.onclick = () => {
      $("conversation").close();
      practice.start(activity.id);
    };
    $("speech-controls").append(button);
  }
  if (["lin", "hao", "visitor-1"].includes(id) && !shopId) {
    const button = document.createElement("button");
    button.id = "directions-quest";
    button.className = "quest-invitation";
    button.textContent =
      id === "lin"
        ? "Ask for directions to the restaurant"
        : id === "visitor-1"
          ? "Give directions to the flower shop"
          : "Help find the bookshop";
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
        ? "Invite Lian for hotpot"
        : id === "lan"
          ? persistence.state.adventure.flowers === "found"
            ? "Return the flowers"
            : "Help find the flowers"
          : "Share some tea";
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
      ...(shop.openings?.[Math.floor(Math.random() * shop.openings.length)] || {
        chinese: shop.greeting, pinyin: shop.pinyin, meaning: shop.meaning,
      }),
      topic: "food",
      mode: "authored",
      notice: "",
    });
    renderShopPurchases();
  }
  $("conversation-restart")?.remove();
  const restart = document.createElement("button");
  restart.id = "conversation-restart";
  restart.textContent = "New conversation · +5 XP, then +15 XP for answering";
  restart.onclick = () => openConversation(id, shopId, appearance, true);
  $("speech-controls").append(restart);
  $("dialog-status").textContent = completionText(initiation);
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
        `${item.zh} · ¥${item.price}${owned ? " ✓已经买了" : ""}`,
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
            `You look lovely in this ${item.en}! Would you like to know how much it costs?`,
          );
          advance("price");
        },
      );
      button.className = "clothing-card";
      button.dataset.clothing = item.id;
      const label = document.createElement("strong");
      label.textContent = item.zh;
      const price = document.createElement("span");
      price.textContent = owned ? "✓已经买了" : `${item.price} 元`;
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
        "可以！请拿出手机。",
        "kě yǐ ！ qǐng ná chū shǒu jī 。",
        "Yes! Please take out your phone.",
      );
      advance("qr");
    });
    choice("可以用信用卡吗？", () => {
      say(
        "可以用信用卡吗？",
        "可以！请拿出信用卡。",
        "kě yǐ ！ qǐng ná chū xìn yòng kǎ 。",
        "Yes! Please take out your credit card.",
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
        ? "Use your phone to scan the QR code · " + clothingItem.price + "元"
        : "Tap your card on the reader · " + clothingItem.price + "元",
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
          "The purchase is complete! Here are your clothes. Thank you!",
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
let dialoguePresentation = 0;
function displayReply(reply, vary = reply.mode === "authored") {
  const presentation = ++dialoguePresentation;
  dialogueVariations.cancel();
  if (vary) {
    const token = requestGeneration;
    dialogueVariations.present(
      reply,
      (line) => renderReply(line),
      () => token === requestGeneration && presentation === dialoguePresentation && $("conversation").open,
    );
    return;
  }
  dialogueVariations.retain(reply);
  renderReply(reply);
}
function renderReply(reply) {
  currentReply = reply;
  const settings = persistence.state.settings;
  $("npc-zh").replaceChildren();
  animatePanel($("npc-zh"));
  $("npc-zh").dataset.pinyin = String(settings.pinyin);
  $("npc-zh").textContent = reply.chinese;
  wordHelp.annotate($("npc-zh"));
  $("toggle-pinyin").textContent = settings.pinyin
    ? "Hide pinyin"
    : "Show pinyin";
  $("toggle-pinyin").setAttribute("aria-pressed", String(settings.pinyin));
  $("npc-meaning").textContent = reply.meaning;
  $("npc-meaning").hidden = !settings.translation;
  $("mode").textContent =
    reply.mode === "local" ? "聊天" : reply.mode === "story" ? "聊天" : "苏州";
  $("reply-notice").textContent = reply.mode === "story" ? reply.notice : "";
  updateHelp();
  renderConversationFeedback(reply.pandaFeedback);
}
let dismissedFeedback = null;
function renderConversationFeedback(feedback) {
  $("conversation-feedback").hidden = !feedback || feedback === dismissedFeedback;
  if (!feedback || feedback === dismissedFeedback) return;
  $("feedback-title").textContent = feedback.kind === "correction"
    ? "Panda · A small correction"
    : feedback.kind === "phrasing" ? "Panda · A natural way to say it" : "Panda · Grammar tip";
  $("feedback-explanation").textContent = feedback.explanation;
  $("feedback-zh").textContent = feedback.chinese;
  wordHelp.annotate($("feedback-zh"));
  $("feedback-pinyin").textContent = feedback.pinyin;
  $("feedback-pinyin").hidden = !persistence.state.settings.pinyin;
  $("feedback-listen").onclick = () =>
    speech.narrate(`${feedback.explanation} ${feedback.chinese}`, { interrupt: true });
  $("feedback-use").onclick = () => {
    $("reply").value = feedback.chinese;
    $("reply").focus();
  };
  $("feedback-dismiss").onclick = () => {
    dismissedFeedback = feedback;
    $("conversation-feedback").hidden = true;
    $("reply").focus();
  };
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
  $("panda-message").textContent = "帮助";
  $("panda-explanation").textContent = "可以再听一次，点点下面的词，或者问熊猫怎么说。";
  $("help-inline").textContent = helpLevel > 0
    ? "Tap a word for its meaning, listen slowly, or ask Panda for help."
    : "";
}

function speakConversationReply(reply) {
  speech.speak(reply.chinese, false, currentVoice);
  const feedback = reply.pandaFeedback;
  if (feedback && feedback !== dismissedFeedback) {
    speech.narrate(`${feedback.explanation} ${feedback.chinese}`, {
      valid: () => $("conversation").open && currentReply === reply &&
        feedback !== dismissedFeedback && !$("conversation-feedback").hidden,
    });
  }
}

let coachController,
  coachGeneration = 0;
function showPandaCoach() {
  coachController?.abort();
  coachGeneration++;
  $("coach-send").disabled = false;
  $("coach-status").textContent = "";
  $("coach-pinyin").hidden = true;
  speech.stop();
  $("coach-question").value = "";
  $("coach-zh").textContent = "";
  $("coach-tip").textContent = "";
  $("coach-listen").hidden = true;
  $("coach-use").hidden = true;
  $("coach-presets").replaceChildren(...dialogueQuestions(currentReply).map(question => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.coachPrompt = "";
    button.textContent = question;
    button.onclick = () => {
      $("coach-question").value = question;
      askPanda(question);
    };
    return button;
  }));
  if (!$("panda-coach").open) $("panda-coach").showModal();
}
$("foreground-panda").onclick = () => {
  helpLevel = Math.max(1, helpLevel);
  updateHelp();
  showPandaCoach();
};
async function askPanda(question) {
  if (!question || $("coach-send").disabled) return;
  coachController?.abort();
  coachController = new AbortController();
  const token = ++coachGeneration;
  const reply = currentReply;
  $("coach-send").disabled = true;
  for (const button of $("coach-presets").children) button.disabled = true;
  $("coach-status").textContent = "Panda is thinking…";
  $("coach-listen").hidden = true;
  $("coach-use").hidden = true;
  $("coach-zh").textContent = "";
  $("coach-tip").textContent = "";
  $("coach-pinyin").hidden = true;
  speech.stop();
  try {
    const answer = await api(
      "/api/coach",
      {
        question,
        context: `Learner: ${$("last-user").textContent.slice(0, 250)}\nNPC: ${reply?.chinese || ""} (${reply?.meaning || ""})\nPanda tip: ${reply?.pandaFeedback?.chinese || ""}`.slice(0, 700),
        explanationLanguage: "en",
      },
      AbortSignal.any([coachController.signal, AbortSignal.timeout(65000)]),
    );
    if (token !== coachGeneration || !$("panda-coach").open) return;
    $("coach-zh").textContent = answer.chinese;
    $("coach-tip").textContent = answer.explanation;
    $("coach-pinyin").textContent = answer.pinyin;
    $("coach-pinyin").hidden = !persistence.state.settings.pinyin;
    $("coach-status").textContent = "";
    $("coach-listen").hidden = false;
    const narration = `${answer.explanation} ${answer.chinese}`;
    $("coach-listen").onclick = () => speech.narrate(narration, { interrupt: true });
    $("coach-use").hidden = false;
    $("coach-use").onclick = () => {
      $("reply").value = answer.chinese;
      $("panda-coach").close();
      $("reply").focus();
    };
    wordHelp.annotate($("coach-zh"));
    dialogueVariations.retain(answer);
    speech.narrate(narration, { interrupt: true });
  } catch (error) {
    if (token === coachGeneration && $("panda-coach").open)
      $("coach-status").textContent = "Panda couldn’t answer right now. Please try again.";
  } finally {
    if (token === coachGeneration) {
      $("coach-send").disabled = false;
      for (const button of $("coach-presets").children) button.disabled = false;
    }
  }
}
$("coach-form").onsubmit = event => {
  event.preventDefault();
  askPanda($("coach-question").value.trim());
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
$("journal").onclick = panels.journal;
$("settings").onclick = panels.settings;
$("map").onclick = panels.map;
for (const button of document.querySelectorAll("[data-close]"))
  button.onclick = () => $(button.dataset.close).close();
for (const dialog of document.querySelectorAll("dialog"))
  dialog.addEventListener("close", () => {
    if (["panel", "conversation"].includes(dialog.id) && !dialog.open)
      dialogueVariations.cancel();
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
      hidePandaSpeech();
    }
    if (!$("panel").open && !$("conversation").open) world?.pause(false);
  });
$("replay").onclick = () =>
  speech.speak(currentReply.chinese, false, currentVoice);
$("slow-replay").onclick = () =>
  speech.speak(currentReply.chinese, true, currentVoice);
$("toggle-pinyin").onclick = () => {
  const pinyin = !persistence.state.settings.pinyin;
  panels.setSettings({ pinyin }, `Pinyin ${pinyin ? "shown" : "hidden"}`);
};
$("reply-form").onsubmit = async (e) => {
  e.preventDefault();
  const text = $("reply").value.trim();
  if (!text || $("send").disabled || !currentNpc) return;
  dialogueVariations.cancel();
  const id = currentNpc,
    generation = ++requestGeneration,
    encounter = currentEncounter;
  controller = new AbortController();
  $("send").disabled = true;
  $("dialog-status").textContent = "Waiting for a reply…";
  $("conversation-feedback").hidden = true;
  speech.stop();
  try {
    const result = await api(
      "/api/dialogue",
      {
        npcId: id,
        text,
        history: conversationHistory,
        shopId: currentShop,
        currentLine: currentReply,
      },
      AbortSignal.any([controller.signal, AbortSignal.timeout(65000)]),
    );
    if (
      generation !== requestGeneration ||
      currentNpc !== id ||
      !$("conversation").open
    )
      return;
    conversationHistory = [...conversationHistory, { npc: id, user: text, reply: result }].slice(-6);
    const departing = id === XIAOCHENG && world.scene.id === "shantang" &&
      result.action === STATION_DEPARTURE && persistence.state.adventure.stationTraveler === "new";
    persistence.change((s) => {
      if (departing) {
        s.adventure.stationTraveler = "walking";
        s.adventure.stationTravelerDistance = 0;
      }
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
    let reward;
    persistence.change((s) => { reward = answerInteraction(s.adventure, encounter); });
    updateXP();
    $("last-user").textContent = text;
    $("reply").value = "";
    dialogueVariations.retain(result);
    displayReply(result, false);
    speakConversationReply(result);
    $("dialog-status").textContent = reward ? completionText(reward) : "";
    if (departing) {
      $("reply-form").hidden = true;
      const goodbye = document.createElement("button");
      goodbye.id = "station-departure-close";
      goodbye.type = "button";
      goodbye.textContent = "再见 · Watch Xiaocheng go";
      goodbye.onclick = () => $("conversation").close();
      $("conversation").querySelector(".conversation-body").append(goodbye);
      $("dialog-status").textContent = "+25 XP · Xiaocheng knows the way. Close the chat to watch him go.";
    }
  } catch (error) {
    if (generation === requestGeneration && error.name !== "AbortError")
      $("dialog-status").textContent = error.message;
  } finally {
    if (generation === requestGeneration) {
      $("send").disabled = false;
      if (!$("reply-form").hidden) $("reply").focus();
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
