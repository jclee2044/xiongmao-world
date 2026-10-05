import { World } from "./game/engine.js";
import { Persistence, api } from "./game/persistence.js";
import { Speech } from "./game/speech.js";
import { Music } from "./game/music.js";
import { npcs, lexicon, starters } from "./data/content.js";
import { expose, explicitPreference } from "./data/learner.js";
import { createPanels } from "./game/panels.js";
import { createPractice } from "./game/practice.js";
import { registerPwa } from "./game/pwa.js";
import { prepareArt } from "./game/render.js";
import { scenes, districtAt } from "./game/world.js";
const $ = (id) => document.getElementById(id);
let world,
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
const speech = new Speech(
  (text) => {
    $("dialog-status").textContent = text;
    if ($("practice-audio-status"))
      $("practice-audio-status").textContent = text;
  },
  () => persistence.state.settings,
  (active) => music.duck(active),
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
  if (!$("panel").open) $("panel").showModal();
  world?.pause(true);
}
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
  openMap: panels.map,
  openConversation,
  onChange: () => updatePracticeStatus(),
});
function updatePracticeStatus() {
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
    onNear: (n) => {
      $("interact").disabled = !n;
      $("interact").textContent = n
        ? n.type === "npc"
          ? `Say hello to ${n.name}`
          : n.name
        : "Walk closer to say hello";
    },
    onMove: (scene, position) => {
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
}
function interact(n) {
  if (practice.visit(n.id)) return;
  if (n.type === "door") {
    speech.stop();
    world.changeScene(n.target);
    updatePlace();
  } else if (n.type === "npc") openConversation(n.id);
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
      '<p class="chinese" lang="zh-CN">我们一起回家吧。</p><p>Let’s go home together.</p><button class="primary" id="bring-home">Take Momo home ↗</button>',
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
      '<p class="chinese" lang="zh-CN">和你在一起，真好。</p><p>It’s good to be with you.</p>',
    );
  else if (n.type === "inspect") {
    openPanel(
      n.name,
      `<p class="chinese" lang="zh-CN">${n.zh}</p>${persistence.state.settings.pinyin ? `<p class="pinyin">${n.pinyin}</p>` : ""}${persistence.state.settings.translation ? `<p class="meaning">${n.meaning}</p>` : ""}<button id="place-replay">Replay</button>`,
    );
    $("place-replay").onclick = () => speech.speak(n.zh);
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
function openConversation(id) {
  requestGeneration++;
  controller?.abort();
  speech.stop();
  currentNpc = id;
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
  $("dialog-status").textContent = last
    ? "Welcome back. Your conversation is remembered."
    : "Say hello, ask a question, or choose a new topic.";
  $("conversation").showModal();
  world.pause(true);
  $("reply").focus();
}
function displayReply(reply) {
  currentReply = reply;
  const settings = persistence.state.settings;
  $("npc-zh").replaceChildren();
  const words = [...lexicon].sort((a, b) => b.zh.length - a.zh.length);
  let remaining = reply.chinese;
  while (remaining) {
    const match = words.find((w) => remaining.startsWith(w.zh));
    if (match) {
      const b = document.createElement("button");
      b.className = "help-word";
      b.textContent = match.zh;
      b.type = "button";
      b.setAttribute("aria-label", `Explain ${match.zh}`);
      b.onclick = () => explain(match);
      $("npc-zh").append(b);
      remaining = remaining.slice(match.zh.length);
    } else {
      $("npc-zh").append(document.createTextNode(remaining[0]));
      remaining = remaining.slice(1);
    }
  }
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
$("begin").onclick = async () => {
  music.enable().catch(() => {});
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
  world.changeScene(world.scene.id === "home" ? "shanghai" : "home");
  updatePlace();
};
$("journal").onclick = panels.journal;
$("settings").onclick = panels.settings;
$("map").onclick = panels.map;
for (const button of document.querySelectorAll("[data-close]"))
  button.onclick = () => $(button.dataset.close).close();
for (const dialog of document.querySelectorAll("dialog"))
  dialog.addEventListener("close", () => {
    if (dialog.id === "panel" && !dialog.open) speech.stop();
    if (dialog.id === "conversation" && !dialog.open) {
      requestGeneration++;
      controller?.abort();
      speech.stop();
      currentNpc = null;
      $("panda-help").open = false;
      $("panda-message").textContent = "帮助";
    }
    if (!$("panel").open && !$("conversation").open) world?.pause(false);
  });
$("replay").onclick = () => speech.speak(currentReply.chinese);
$("slow-replay").onclick = () => speech.speak(currentReply.chinese, true);
$("stop-speech").onclick = () => speech.stop();
$("toggle-pinyin").onclick = () => {
  const pinyin = !persistence.state.settings.pinyin;
  panels.setSettings({ pinyin }, `Pinyin: ${pinyin ? "shown" : "hidden"}`);
};
$("more-help").onclick = () => {
  helpLevel = Math.min(3, helpLevel + 1);
  updateHelp();
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
      { npcId: id, text, history: persistence.state.history },
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
    $("last-user").textContent = `You: ${text}`;
    $("reply").value = "";
    displayReply(result);
    $("dialog-status").textContent =
      "Ask something else, change topics, or pause whenever you like.";
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
    speech.stop();
    persistence.flush();
  }
});
