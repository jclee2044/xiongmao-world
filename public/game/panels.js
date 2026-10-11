import { progression } from "../data/rewards.js";
import { mapDestinations } from "./interactions.js";
import { activities } from "../data/activities.js";
import { activityGuide } from "./activity-guide.js";
import { goalCards } from "./goals.js";
import { mountMap, mapMarkup } from "./map.js";
import { isBeginnerChinese } from "../data/language.js";
import { api } from "./persistence.js";
import { shops } from "../data/shops.js";
import { npcs } from "../data/content.js";
import { validatePatch, parseCustomization } from "../data/settings.js";
import { backgroundTrack, indoorTrack, homeTrack, stationTrack } from "./music.js";
const $ = (id) => document.getElementById(id);
const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function createPanels({
  persistence,
  openPanel,
  toast,
  applySettings,
  restoreWorld,
  getWorld,
  showMapWord,
  openPractice,
  browsePractice,
  guideTo,
  annotateWords,
}) {
  let musicVolume = 0.15;
  function refreshMusicControls() {
    const volume = persistence.state.settings.music;
    if (volume > 0) musicVolume = volume;
    if ($("music-toggle")) $("music-toggle").value = volume > 0 ? "on" : "off";
    if ($("music-volume")) {
      $("music-volume").value = musicVolume;
      $("music-volume").disabled = volume === 0;
    }
  }
  function map() {
    const world = getWorld(),
      scene = world.scene;
    const stops = mapDestinations(scene, world.destinations()).filter(
      (o) =>
        !(o.id === "momo" && persistence.state.found.includes("momo")) &&
        !(o.id === "momo-home" && !persistence.state.found.includes("momo")),
    );
    openPanel("地图", mapMarkup(scene, stops));
    mountMap(world, persistence.state, stops, showMapWord);
  }
  function refreshHistory() {
    if ($("settings-history"))
      $("settings-history").innerHTML =
        persistence.state.settingsHistory
          .slice(-5)
          .reverse()
          .map(
            (h) =>
              `<li>${escape(/\p{Script=Han}/u.test(h.label) ? "Earlier settings change" : h.label)}</li>`,
          )
          .join("") || "<li>No changes yet.</li>";
    if ($("pending-feedback"))
      $("pending-feedback").innerHTML =
        persistence.state.feedback
          .slice(-5)
          .reverse()
          .map((f) => `<li>${escape(f.text)} · Pending</li>`)
          .join("") || "<li>No saved ideas yet.</li>";
  }
  function applyPatch(patch, label) {
    const clean = validatePatch(patch);
    persistence.change((s) => {
      s.settingsHistory.push({
        before: { ...s.settings },
        label,
        date: new Date().toISOString(),
      });
      s.settingsHistory = s.settingsHistory.slice(-20);
      Object.assign(s.settings, clean);
    });
    applySettings();
    refreshHistory();
    for (const select of document.querySelectorAll("[data-setting]"))
      select.value = String(persistence.state.settings[select.dataset.setting]);
    refreshMusicControls();
    toast("Settings updated.");
  }
  function journalText(entry) {
    if (
      entry === "在河边认识了猫猫，带猫猫回家了。" ||
      entry === "Met Momo beside the canal and brought Momo home."
    )
      return "Momo came home with you. You met Momo beside the canal.";
    const purchase = /^在(.+)买了(.+)，花了(\d+)元。(.*)$/.exec(entry);
    if (purchase) {
      const item = Object.values(shops)
        .flatMap((shop) => shop.items)
        .find((item) => item.zh === purchase[2]);
      if (item)
        return `Bought ${item.en} for ¥${purchase[3]}. ${purchase[4]}`.trim();
    }
    return /\p{Script=Han}/u.test(entry) ? null : entry;
  }
  function journal(tab = "next") {
    if (typeof tab !== "string") tab = "next";
    const s = persistence.state;
    const active = s.practice.active;
    const recommended =
      active?.id ||
      activities.find((a) => !s.practice.completed.includes(a.id))?.id ||
      "mei-order";
    const guide = activityGuide(recommended, active);
    const card = `<section class="journal-next"><small>${active ? "CONTINUE YOUR ACTIVITY" : "START HERE"}</small><h3>${escape(guide.english)}</h3><p>${escape(guide.next)}</p>${guide.next !== guide.how ? `<p>${escape(guide.how)}</p>` : ""}${guide.progress ? `<p>${escape(guide.progress)}</p>` : ""}<p><strong>Complete when:</strong> ${escape(guide.complete)}</p><button id="journal-start" class="primary">${active ? "Continue activity" : "Start practice"}</button><p class="muted">Practice does not spend coins or buy items.</p></section>`;
    const goals = goalCards(s.adventure).filter((g) => g.target);
    const words = s.adventure.vocabulary.filter(isBeginnerChinese);
    const readable = s.journal.map(journalText).filter(Boolean).reverse();
    const older = s.journal.filter((entry) => journalText(entry) === null);
    const completed = activities.filter((a) =>
      s.practice.completed.includes(a.id),
    );
    const items = s.adventure.purchases
      .map((id) =>
        Object.values(shops)
          .flatMap((shop) => shop.items)
          .find((item) => item.id === id),
      )
      .filter(Boolean);
    const list = (rows) =>
      `<ul>${rows.map((x) => `<li>${escape(x)}</li>`).join("")}</ul>`;
    const content =
      tab === "next"
        ? `${card}<p><button id="journal-browse">Browse all activities</button></p><details><summary>Explore town and help neighbors</summary><div class="activity-catalog">${goals.map((g) => `<button data-journal-goal="${escape(g.target)}"><strong>${escape(g.title)}</strong><span>${escape(g.detail)}</span><small>Show me where →</small></button>`).join("")}</div></details><p class="muted">${s.adventure.boatTaken ? "Next travel stage" : "Boat travel"} · ${s.adventure.xp} / ${progression(s.adventure, s.scene).required} XP</p>`
        : tab === "words"
          ? `<h3>My words</h3><p>Tap a word to hear it and see its meaning and pinyin.</p>${words.length ? `<div class="journal-words">${words.map((word) => `<p class="journal-word" lang="zh-CN">${escape(word)}</p>`).join("")}</div>` : `<p>No words yet. Talk to someone and tap a Chinese word to discover it.</p><button id="journal-browse">Find an activity</button>`}`
          : `<h3>Memories</h3><p>Your adventures are recorded here automatically. You do not need to write an entry.</p>${readable.length ? list(readable) : ""}${completed.length ? `<h3>Activities practiced</h3>${list(completed.map((a) => a.english))}` : ""}${s.adventure.met.length ? `<h3>People you have met</h3>${list(s.adventure.met.map((id) => npcs[id]?.identity?.split(",")[0] || npcs[id]?.name || id))}` : ""}${items.length ? `<h3>My belongings</h3>${list(items.map((item) => item.en))}` : ""}<p>Coins: ¥${s.adventure.coins}</p>${s.adventure.hungry === "done" ? "<p>You shared hotpot with Lian. Your sheep keepsake is waiting at home.</p>" : ""}${s.adventure.flowers === "done" ? "<p>You returned Lan’s missing flowers.</p>" : ""}${s.adventure.tea === "done" ? "<p>You shared tea with Qiao.</p>" : ""}${!readable.length && !completed.length && !s.adventure.met.length ? '<p>Your story starts with a conversation or activity.</p><button id="journal-browse">Choose an activity</button>' : ""}${older.length ? `<details><summary>Older memories · ${older.length}</summary><p>Original entries from your saved journal.</p>${list(older)}</details>` : ""}${
              Object.keys(s.memories).length
                ? `<details><summary>Conversation memories</summary>${Object.entries(
                    s.memories,
                  )
                    .map(
                      ([id, entries]) =>
                        `<h4>${escape(npcs[id]?.name || id)}</h4>${list(entries)}`,
                    )
                    .join("")}</details>`
                : ""
            }`;
    openPanel(
      "Journal",
      `<p>Choose something to do. Your progress is saved automatically.</p><nav class="journal-tabs" aria-label="Journal sections">${[
        ["next", "What to do"],
        ["words", "My words"],
        ["memories", "Memories"],
      ]
        .map(
          ([id, label]) =>
            `<button data-journal-tab="${id}" aria-pressed="${tab === id}">${label}</button>`,
        )
        .join(
          "",
        )}</nav><div id="journal-section">${content}</div><p class="journal-save" role="status">${escape($("save-status").textContent)}${persistence.conflict ? " · A newer save needs your attention." : ""} <button id="journal-settings">${persistence.conflict ? "Resolve save conflict" : "Save and device settings"}</button></p>`,
      "en",
    );
    for (const button of document.querySelectorAll("[data-journal-tab]"))
      button.onclick = () => {
        journal(button.dataset.journalTab);
        document
          .querySelector(`[data-journal-tab="${button.dataset.journalTab}"]`)
          .focus();
      };
    if ($("journal-start"))
      $("journal-start").onclick = () => openPractice(recommended);
    if ($("journal-browse")) $("journal-browse").onclick = browsePractice;
    for (const button of document.querySelectorAll("[data-journal-goal]"))
      button.onclick = () => guideTo(button.dataset.journalGoal);
    $("journal-settings").onclick = () => {
      settings();
      $("save-tools").open = true;
      $("save-tools").scrollIntoView({ block: "start" });
    };
    for (const word of document.querySelectorAll(".journal-word"))
      annotateWords(word);
  }
  function saveTools() {
    const s = persistence.state;
    $("panel-content").insertAdjacentHTML(
      "beforeend",
      `<details id="save-tools"><summary>Save and devices</summary><div class="panel-section"><h3>Save and devices</h3><p>${escape($("save-status").textContent)}</p><div class="small-actions"><button id="retry-save">Retry save</button><button id="export-save">Export save</button></div>${persistence.conflict ? '<p class="notice">Another device has a newer save. Choose which save to use. New words and discoveries from both saves will be kept.</p><div class="small-actions"><button id="use-server">Use server save</button><button id="use-local">Use this device’s save</button></div>' : ""}</div><div class="panel-section"><h3>Play on another device</h3><p>Open this game’s HTTPS address on your phone. Enter the code to share your progress. Codes expire after five minutes and can be used once.</p><button id="pair-code">Get a pairing code</button><p id="code-output"></p><label for="pair-input">Or enter a code from another device</label><div class="reply-row"><input id="pair-input" maxlength="10" autocomplete="off"><button id="pair-submit">Connect</button></div></div></details>`,
    );
    $("retry-save").onclick = () => persistence.flush();
    $("export-save").onclick = () => {
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(s, null, 2)], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "panda-world-save.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    for (const [source, id] of [
      ["server", "use-server"],
      ["local", "use-local"],
    ])
      if ($(id))
        $(id).onclick = async () => {
          try {
            await persistence.choose(source);
            restoreWorld();
            settings();
            $("save-tools").open = true;
          } catch (e) {
            toast(e.message);
          }
        };
    $("pair-code").onclick = async () => {
      try {
        await persistence.flush();
        if (persistence.conflict)
          throw new Error(
            "Choose which save to use before connecting another device.",
          );
        const result = await api("/api/pair-code", {});
        $("code-output").textContent =
          `${result.code} · Valid for five minutes`;
      } catch (e) {
        toast(e.message);
      }
    };
    $("pair-submit").onclick = async () => {
      try {
        if (persistence.generation !== persistence.persisted)
          throw new Error("Save or export this journal before connecting.");
        await api("/api/pair", {
          code: $("pair-input").value.trim().toUpperCase(),
        });
        localStorage.removeItem("panda-world-v1");
        location.reload();
      } catch (e) {
        toast(e.message);
      }
    };
  }
  function settings() {
    const s = persistence.state.settings;
    const select = (key, label, values) =>
      `<label>${label}<select data-setting="${key}">${values.map(([v, name]) => `<option value="${v}" ${String(s[key]) === String(v) ? "selected" : ""}>${name}</option>`).join("")}</select></label>`;
    openPanel(
      "Settings",
      `<div class="settings-grid">${select("outfit", "Clothes", [
        ["#b4a6c3", "Lavender"],
        ["#899b7c", "Sage"],
        ["#d3a890", "Peach"],
        ["#8ca6a2", "Teal"],
      ])}${select("hair", "Hair", [
        ["bun", "Bun"],
        ["short", "Short"],
      ])}${select("pace", "Walking speed", [
        ["normal", "Normal"],
        ["slow", "Slower"],
      ])}${select("challenge", "Old HSK level", [
        ["gentler", "HSK 1–2"],
        ["standard", "HSK 2–3"],
        ["challenging", "HSK 3 (max)"],
      ])}${select("help", "Panda help", [
        ["more", "More"],
        ["standard", "Standard"],
        ["less", "Less"],
      ])}${select("pinyin", "Pinyin", [
        [true, "Shown"],
        [false, "Hidden"],
      ])}${select("translation", "English translations", [
        [true, "Shown"],
        [false, "Hidden"],
      ])}${select("motion", "Animation", [
        [true, "On"],
        [false, "Reduced"],
      ])}${select("textSize", "Text size", [
        ["normal", "Normal"],
        ["large", "Large"],
      ])}${select("voice", "Chinese voice", [
        [true, "On"],
        [false, "Off"],
      ])}</div><label for="voice-volume">Voice volume</label><input id="voice-volume" type="range" min="0" max="1" step="0.05" value="${s.voiceVolume}"><label for="music-toggle">Music</label><select id="music-toggle"><option value="on" ${s.music > 0 ? "selected" : ""}>On</option><option value="off" ${s.music === 0 ? "selected" : ""}>Off</option></select><label for="music-volume">Music volume</label><input id="music-volume" type="range" min="0.05" max="1" step="0.05" value="${s.music || musicVolume}" ${s.music === 0 ? "disabled" : ""}><label for="ambience-volume">Environment sounds</label><input id="ambience-volume" type="range" min="0" max="1" step="0.05" value="${s.ambience}"><p class="notice">Music quiets during speech. You can use the microphone to order at the restaurant.</p><div class="panel-section"><h3>Customize your world</h3><p>Change your outfit color, hairstyle, walking speed, Chinese practice level, or Panda help. Practice uses everyday Chinese around old HSK 2–3.</p><form id="custom-form"><label for="custom-prompt">Describe a change</label><textarea id="custom-prompt" rows="2" maxlength="500" placeholder="sage clothes, short hair"></textarea><div class="small-actions"><button class="primary">Apply change</button><button type="button" id="undo-settings" ${!persistence.state.settingsHistory.length ? "disabled" : ""}>Undo</button></div></form><p id="custom-result" role="status"></p></div><div class="panel-section"><h3>Recent changes</h3><ul id="settings-history">${
        persistence.state.settingsHistory
          .slice(-5)
          .reverse()
          .map(
            (h) =>
              `<li>${escape(/\p{Script=Han}/u.test(h.label) ? "Earlier settings change" : h.label)}</li>`,
          )
          .join("") || "<li>No changes yet.</li>"
      }</ul><h3>Saved ideas</h3><ul id="pending-feedback">${
        persistence.state.feedback
          .slice(-5)
          .reverse()
          .map((f) => `<li>${escape(f.text)} · Pending</li>`)
          .join("") || "<li>No saved ideas yet.</li>"
      }</ul><p>New maps, artwork, and game features cannot be changed here yet. Your ideas will be saved.</p></div>`,
      "en",
    );
    saveTools();
    const credit = document.createElement("details");
    credit.className = "muted";
    credit.innerHTML = `<summary>Music credits</summary><p>Station: <a href="${stationTrack.source}" target="_blank" rel="noopener">${stationTrack.title}</a> — ${stationTrack.artist} (incompetech.com), <a href="${stationTrack.license}" target="_blank" rel="noopener">CC BY 4.0</a>. Filtered for distant station speakers. <a href="/assets/audio/ATTRIBUTION.md" target="_blank" rel="noopener">Station recording sources and credits</a>.</p><p>Home： <a href="${homeTrack.source}" target="_blank" rel="noopener">${homeTrack.title}</a> — composed by ${homeTrack.composer}, guitar by ${homeTrack.artist}. Outdoors： <a href="${backgroundTrack.source}" target="_blank" rel="noopener">${backgroundTrack.title} — ${backgroundTrack.artist}</a> · <a href="${backgroundTrack.license}" target="_blank" rel="noopener">CC BY 4.0</a>. Other indoor rooms： <a href="${indoorTrack.source}" target="_blank" rel="noopener">${indoorTrack.title} — ${indoorTrack.artist}</a> · <a href="${indoorTrack.license}" target="_blank" rel="noopener">Pixabay Content License</a>. <a href="https://www.free-stock-music.com" target="_blank" rel="noopener">Music by https://www.free-stock-music.com</a> (outdoor music)。</p>`;
    $("music-volume").after(credit);
    for (const select of document.querySelectorAll("[data-setting]"))
      select.onchange = () => {
        let value = select.value;
        if (value === "true" || value === "false") value = value === "true";
        applyPatch(
          { [select.dataset.setting]: value },
          `${select.closest("label").firstChild.textContent}：${select.selectedOptions[0].textContent}`,
        );
      };
    refreshMusicControls();
    $("music-toggle").onchange = (e) =>
      applyPatch(
        { music: e.target.value === "on" ? musicVolume : 0 },
        `Music：${e.target.value === "on" ? "On" : "Off"}`,
      );
    $("music-volume").onchange = (e) =>
      applyPatch(
        { music: Number(e.target.value) },
        `Music volume: ${e.target.value}`,
      );
    $("ambience-volume").onchange = (e) =>
      applyPatch(
        { ambience: Number(e.target.value) },
        `Environment sounds: ${e.target.value}`,
      );
    $("voice-volume").onchange = (e) =>
      applyPatch(
        { voiceVolume: Number(e.target.value) },
        `Voice volume: ${e.target.value}`,
      );
    $("custom-form").onsubmit = (e) => {
      e.preventDefault();
      const text = $("custom-prompt").value.trim();
      if (!text) return;
      const parsed = parseCustomization(text);
      if (parsed.pending) {
        persistence.change((state) => {
          state.feedback.push({
            text,
            status: "pending",
            date: new Date().toISOString(),
          });
          state.feedback = state.feedback.slice(-40);
        });
        $("custom-result").textContent =
          "Idea saved. The game has not changed yet.";
        refreshHistory();
      } else {
        applyPatch(parsed.patch, text);
        $("custom-result").textContent = "Updated. You can undo this change.";
        $("undo-settings").disabled = false;
      }
    };
    $("undo-settings").onclick = () => {
      const previous = persistence.state.settingsHistory.at(-1);
      if (!previous) return;
      persistence.change((state) => {
        state.settings = { ...previous.before };
        state.settingsHistory.pop();
      });
      applySettings();
      settings();
      toast("Change undone.");
    };
  }
  return { journal, settings, map, setSettings: applyPatch };
}
