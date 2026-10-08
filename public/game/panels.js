import { isBeginnerChinese } from "../data/language.js";
import { api } from "./persistence.js";
import { shops } from "../data/shops.js";
import { npcs } from "../data/content.js";
import { validatePatch, parseCustomization } from "../data/settings.js";
import { backgroundTrack, indoorTrack } from "./music.js";
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
  navigate,
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
    const stops = world
      .destinations()
      .filter(
        (o) =>
          !(o.id === "momo" && persistence.state.found.includes("momo")) &&
          !(o.id === "momo-home" && !persistence.state.found.includes("momo")),
      );
    openPanel(
      "地图",
      `<svg class="district-map" viewBox="0 0 ${scene.width} ${scene.height}" role="img" aria-label="地图和你现在的地方"><rect width="100%" height="100%" fill="#eee1c4"/>${(scene.districts || []).map((d) => `<rect x="${d.x + 8}" y="${d.y + 8}" width="${d.w - 16}" height="${d.h - 16}" rx="70" fill="#ded2b3"/><text x="${d.x + d.w / 2}" y="${d.y + d.h / 2}" text-anchor="middle" fill="#64543b" font-size="110">${d.zh}</text>`).join("")}${(scene.canals || []).map((z) => `<polygon points="${z.polygon.map((p) => p.join(",")).join(" ")}" fill="#659b96"/>`).join("")}${(scene.bridges || []).map((b) => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="#ead9b6"/>`).join("")}${scene.landmark ? `<image href="/assets/optimized/canal-lane.webp" x="${scene.landmark.x}" y="${scene.landmark.y}" width="${scene.landmark.w}" height="${scene.landmark.h}"/>` : ""}<circle cx="${world.player.x}" cy="${world.player.y}" r="70" fill="#986748" stroke="#fff8eb" stroke-width="24"/></svg><p lang="zh-CN">想去哪里？</p><div class="map-stops">${stops.map((o) => `<button data-map-stop="${o.id}">${escape(o.name)}</button>`).join("")}</div>`,
    );
    for (const button of document.querySelectorAll("[data-map-stop]"))
      button.onclick = () =>
        navigate(stops.find((o) => o.id === button.dataset.mapStop));
  }
  function refreshHistory() {
    if ($("settings-history"))
      $("settings-history").innerHTML =
        persistence.state.settingsHistory
          .slice(-5)
          .reverse()
          .map((h) => `<li>${escape(/\p{Script=Han}/u.test(h.label) ? "Earlier settings change" : h.label)}</li>`)
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
    if (!isBeginnerChinese(entry)) return "Earlier journal entry.";
    if (entry === "Met Momo beside the canal and brought Momo home.")
      return "在河边认识了Momo，带Momo回家了。";
    const purchase = /^Bought (.+) at (.+) for ¥(\d+)\.$/.exec(entry);
    if (purchase) {
      const [, item, shop, price] = purchase;
      return `在${shop.split(" · ")[0]}买了${item}，花了${price}元。`;
    }
    return entry;
  }
  function journal() {
    const s = persistence.state;
    const memories = Object.entries(s.memories)
      .flatMap(([id, items]) =>
        items.map((x) => `<li>${escape(npcs[id].name)}记得：${escape(x)}</li>`),
      )
      .join("");
    openPanel(
      "今天的Journal",
      `<div class="panel-section"><h3>Canal journal</h3><p>${s.adventure.xp} / 500 XP</p><p lang="zh-CN">Lan的花：${{ new: "还没有问过Lan", accepted: "去河其他一边的石头找花", found: "把花还给Lan", done: "已经还给Lan了" }[s.adventure.flowers]}<br>和Qiao喝茶：${{ new: "请Qiao喝茶", invited: "Qiao正在去茶桌子的路上", seated: "Qiao在茶桌子等你", done: "一起喝过茶了" }[s.adventure.tea]}</p></div><div class="panel-section"><h3>今天的事情</h3>${s.journal.length ? "<ul>" + s.journal.map((x) => `<li>${escape(journalText(x))}</li>`).join("") + "</ul>" : "<p>Journal还是没有东西。去认识Mei，再去河边走走吧。</p>"}${memories ? `<ul>${memories}</ul>` : ""}</div><div class="panel-section"><h3>说说中文</h3><p lang="zh-CN">你今天忙吗？ · 我们一起喝茶吧。</p><p>问问邻居今天怎么样，或者请他们一起喝茶。</p><p>熊猫记得你在哪里看见过这些词。多说几次就好。可以在Settings里选择难一点或者简单一点，也可以现在问熊猫。</p></div><div class="panel-section"><h3>我的Journal</h3><p>${escape($("save-status").textContent)}</p><div class="small-actions"><button id="retry-save">Retry save</button><button id="export-save">Export journal</button></div>${persistence.conflict ? "<p class=\"notice\">Another device has a newer journal. Choose which save to use. New words and discoveries from both saves will be kept.</p><div class=\"small-actions\"><button id=\"use-server\">Use server save</button><button id=\"use-local\">Use this device’s save</button></div>" : ""}</div><div class="panel-section"><h3>Play on another device</h3><p>Open this game’s HTTPS address on your phone. Enter the code to share your journal. Codes expire after five minutes and can be used once.</p><button id="pair-code">Get a pairing code</button><p id="code-output"></p><label for="pair-input">Or enter a code from another device</label><div class="reply-row"><input id="pair-input" maxlength="10" autocomplete="off"><button id="pair-submit">Connect</button></div></div>`,
    );
    $("panel-content").insertAdjacentHTML(
      "afterbegin",
      `<div class="panel-section"><h3>新词</h3><p class="chinese">${s.adventure.vocabulary.filter(isBeginnerChinese).map(escape).join(" · ") || "还没有新词"}</p><h3>我的包</h3><p>${
        s.adventure.purchases
          .map(
            (id) =>
              Object.values(shops)
                .flatMap((shop) => shop.items)
                .find((item) => item.id === id)?.zh || "小礼物",
          )
          .join(" · ") || "包里还没有东西。"
      } · ¥${s.adventure.coins}</p><p>和Lian吃hot pot： ${s.adventure.hungry === "done" ? "✓ 一起吃过饭了" : s.adventure.hungry === "new" ? "去市场找Lian" : "带Lian去饭店，一起吃hot pot。"}</p></div>`,
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
            journal();
          } catch (e) {
            toast(e.message);
          }
        };
    $("pair-code").onclick = async () => {
      try {
        await persistence.flush();
        if (persistence.conflict)
          throw new Error("请先选择好要用哪本Journal，再Connect。");
        const result = await api("/api/pair-code", {});
        $("code-output").textContent = `${result.code} · Valid for five minutes`;
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
      ])}</div><label for="voice-volume">Voice volume</label><input id="voice-volume" type="range" min="0" max="1" step="0.05" value="${s.voiceVolume}"><label for="music-toggle">Music</label><select id="music-toggle"><option value="on" ${s.music > 0 ? "selected" : ""}>On</option><option value="off" ${s.music === 0 ? "selected" : ""}>Off</option></select><label for="music-volume">Music volume</label><input id="music-volume" type="range" min="0.05" max="1" step="0.05" value="${s.music || musicVolume}" ${s.music === 0 ? "disabled" : ""}><label for="ambience-volume">Nature sounds</label><input id="ambience-volume" type="range" min="0" max="1" step="0.05" value="${s.ambience}"><p class="notice">Music quiets during speech. You can use the microphone to order at the restaurant.</p><div class="panel-section"><h3>Customize your world</h3><p>Change your outfit color, hairstyle, walking speed, Chinese practice level, or Panda help. Practice uses everyday Chinese around old HSK 2–3.</p><form id="custom-form"><label for="custom-prompt">Describe a change</label><textarea id="custom-prompt" rows="2" maxlength="500" placeholder="sage clothes, short hair"></textarea><div class="small-actions"><button class="primary">Apply change</button><button type="button" id="undo-settings" ${!persistence.state.settingsHistory.length ? "disabled" : ""}>Undo</button></div></form><p id="custom-result" role="status"></p></div><div class="panel-section"><h3>Recent changes</h3><ul id="settings-history">${
        persistence.state.settingsHistory
          .slice(-5)
          .reverse()
          .map((h) => `<li>${escape(/\p{Script=Han}/u.test(h.label) ? "Earlier settings change" : h.label)}</li>`)
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
    const credit = document.createElement("details");
    credit.className = "muted";
    credit.innerHTML = `<summary>Music credits</summary><p>Outdoors： <a href="${backgroundTrack.source}" target="_blank" rel="noopener">${backgroundTrack.title} — ${backgroundTrack.artist}</a> · <a href="${backgroundTrack.license}" target="_blank" rel="noopener">CC BY 4.0</a>. Indoors： <a href="${indoorTrack.source}" target="_blank" rel="noopener">${indoorTrack.title} — ${indoorTrack.artist}</a> · <a href="${indoorTrack.license}" target="_blank" rel="noopener">Pixabay Content License</a>. <a href="https://www.free-stock-music.com" target="_blank" rel="noopener">Music by https://www.free-stock-music.com</a> (outdoor music)。</p>`;
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
        `Nature sounds: ${e.target.value}`,
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
        $("custom-result").textContent = "Idea saved. The game has not changed yet.";
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
