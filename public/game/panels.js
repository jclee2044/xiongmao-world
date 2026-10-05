import { api } from "./persistence.js";
import { npcs } from "../data/content.js";
import { validatePatch, parseCustomization } from "../data/settings.js";
import { backgroundTrack } from "./music.js";
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
    const stops = scene.interactables.filter(
      (o) =>
        !(o.id === "momo" && persistence.state.found.includes("momo")) &&
        !(o.id === "momo-home" && !persistence.state.found.includes("momo")),
    );
    openPanel(
      "Map",
      `<svg class="district-map" viewBox="0 0 ${scene.width} ${scene.height}" role="img" aria-label="District map and your current position"><rect width="100%" height="100%" fill="#eee1c4"/>${(scene.districts || []).map((d) => `<rect x="${d.x + 8}" y="${d.y + 8}" width="${d.w - 16}" height="${d.h - 16}" rx="70" fill="#ded2b3"/><text x="${d.x + d.w / 2}" y="${d.y + d.h / 2}" text-anchor="middle" fill="#64543b" font-size="110">${d.zh}</text>`).join("")}${scene.landmark ? `<image href="/assets/world/canal-lane.webp" x="${scene.landmark.x}" y="${scene.landmark.y}" width="${scene.landmark.w}" height="${scene.landmark.h}"/>` : ""}<circle cx="${world.player.x}" cy="${world.player.y}" r="70" fill="#986748" stroke="#fff8eb" stroke-width="24"/></svg><p>Choose a place to walk there.</p><div class="map-stops">${stops.map((o) => `<button data-map-stop="${o.id}">${escape(o.name)}</button>`).join("")}</div>`,
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
          .map((h) => `<li>${escape(h.label)}</li>`)
          .join("") || "<li>No changes yet.</li>";
    if ($("pending-feedback"))
      $("pending-feedback").innerHTML =
        persistence.state.feedback
          .slice(-5)
          .reverse()
          .map((f) => `<li>${escape(f.text)} · pending</li>`)
          .join("") || "<li>No requests yet.</li>";
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
    toast(`Changed: ${Object.keys(clean).join(", ")}`);
  }
  function journal() {
    const s = persistence.state;
    const memories = Object.entries(s.memories)
      .flatMap(([id, items]) =>
        items.map(
          (x) => `<li>${escape(npcs[id].name)} remembers: ${escape(x)}</li>`,
        ),
      )
      .join("");
    openPanel(
      "A page for today",
      `<div class="panel-section"><h3>Memories</h3>${s.journal.length ? "<ul>" + s.journal.map((x) => `<li>${escape(x)}</li>`).join("") + "</ul>" : "<p>No memories yet. Meet Mei and explore the canal lane.</p>"}${memories ? `<ul>${memories}</ul>` : ""}</div><div class="panel-section"><h3>Chinese phrases</h3><p lang="zh-CN">你今天忙吗？ · 我们一起喝茶吧。</p><p>Ask someone how their day is going, or invite them for tea.</p><p>Panda remembers where you meet familiar words. These visits are practice, not a score. Choose the Chinese challenge in Settings; help requests never count against you.</p></div><div class="panel-section"><h3>Your progress</h3><p>${escape($("save-status").textContent)}</p><div class="small-actions"><button id="retry-save">Retry sync</button><button id="export-save">Download this device’s save</button></div>${persistence.conflict ? '<p class="notice">Another device or session has newer progress. Your local copy is preserved. Choose explicitly; keeping this device also preserves discoveries from the server.</p><div class="small-actions"><button id="use-server">Use server progress</button><button id="use-local">Keep this device’s progress</button></div>' : ""}</div><div class="panel-section"><h3>Connect another device</h3><p>Open the same private HTTPS game URL on your phone. Pairing shares this world and its journal. Codes last five minutes and work once.</p><button id="pair-code">Create pairing code</button><p id="code-output"></p><label for="pair-input">Or enter a code from your other device</label><div class="reply-row"><input id="pair-input" maxlength="10" autocomplete="off"><button id="pair-submit">Pair</button></div></div>`,
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
          throw new Error("Resolve the save conflict before pairing.");
        const result = await api("/api/pair-code", {});
        $("code-output").textContent =
          `${result.code} · expires in five minutes`;
      } catch (e) {
        toast(e.message);
      }
    };
    $("pair-submit").onclick = async () => {
      try {
        if (persistence.generation !== persistence.persisted)
          throw new Error(
            "Sync or export this device’s progress before pairing.",
          );
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
      `<div class="settings-grid">${select("outfit", "Outfit", [
        ["#b4a6c3", "Lavender"],
        ["#899b7c", "Sage"],
        ["#d3a890", "Peach"],
        ["#8ca6a2", "Teal"],
      ])}${select("hair", "Hair", [
        ["bun", "Soft bun"],
        ["short", "Short hair"],
      ])}${select("pace", "Walking pace", [
        ["normal", "Easy stroll"],
        ["slow", "Slower stroll"],
      ])}${select("challenge", "Chinese challenge", [
        ["gentler", "Gentler"],
        ["standard", "Comfortable"],
        ["challenging", "More challenging"],
      ])}${select("help", "Panda’s support", [
        ["more", "More help"],
        ["standard", "A little help"],
        ["less", "Less help"],
      ])}${select("pinyin", "Pinyin", [
        [true, "Shown"],
        [false, "Hidden"],
      ])}${select("translation", "English meaning", [
        [true, "Shown"],
        [false, "Hidden"],
      ])}${select("motion", "Environment motion", [
        [true, "On"],
        [false, "Reduced motion"],
      ])}${select("textSize", "Text size", [
        ["normal", "Normal"],
        ["large", "Larger"],
      ])}${select("voice", "Mandarin voice", [
        [true, "On"],
        [false, "Off"],
      ])}</div><label for="voice-volume">Voice volume</label><input id="voice-volume" type="range" min="0" max="1" step="0.05" value="${s.voiceVolume}"><label for="music-toggle">Background music</label><select id="music-toggle"><option value="on" ${s.music > 0 ? "selected" : ""}>On</option><option value="off" ${s.music === 0 ? "selected" : ""}>Off</option></select><label for="music-volume">Music volume</label><input id="music-volume" type="range" min="0.05" max="1" step="0.05" value="${s.music || musicVolume}" ${s.music === 0 ? "disabled" : ""}><p class="notice">Music becomes quieter while Mandarin plays. Microphone input is not enabled yet.</p><div class="panel-section"><h3>Describe a small change</h3><p>Supported now: lavender/sage/peach/teal outfit, short hair or bun, slower walking, help and challenge. This changes a simple avatar; unrestricted prompt-to-art is a later feature.</p><form id="custom-form"><label for="custom-prompt">Appearance or game feedback</label><textarea id="custom-prompt" rows="2" maxlength="500" placeholder="Sage outfit and short hair"></textarea><div class="small-actions"><button class="primary">Apply supported change</button><button type="button" id="undo-settings" ${!persistence.state.settingsHistory.length ? "disabled" : ""}>Undo last change</button></div></form><p id="custom-result" role="status"></p></div><div class="panel-section"><h3>Change history</h3><ul id="settings-history">${
        persistence.state.settingsHistory
          .slice(-5)
          .reverse()
          .map((h) => `<li>${escape(h.label)}</li>`)
          .join("") || "<li>No changes yet.</li>"
      }</ul><h3>Pending development feedback</h3><ul id="pending-feedback">${
        persistence.state.feedback
          .slice(-5)
          .reverse()
          .map((f) => `<li>${escape(f.text)} · pending</li>`)
          .join("") || "<li>No requests yet.</li>"
      }</ul><p>New maps, art and mechanics are stored as pending. A source-editing agent is not connected.</p></div>`,
    );
    const credit = document.createElement("p");
    credit.className = "muted";
    credit.innerHTML = `Music: <a href="${backgroundTrack.source}" target="_blank" rel="noopener">${backgroundTrack.title} — ${backgroundTrack.artist}</a>. <a href="https://www.free-stock-music.com" target="_blank" rel="noopener">Music by https://www.free-stock-music.com</a> · <a href="${backgroundTrack.license}" target="_blank" rel="noopener">CC BY 4.0</a>. Local copy compressed for this game.`;
    $("music-volume").after(credit);
    for (const select of document.querySelectorAll("[data-setting]"))
      select.onchange = () => {
        let value = select.value;
        if (value === "true" || value === "false") value = value === "true";
        applyPatch(
          { [select.dataset.setting]: value },
          `${select.dataset.setting}: ${select.selectedOptions[0].textContent}`,
        );
      };
    refreshMusicControls();
    $("music-toggle").onchange = (e) =>
      applyPatch(
        { music: e.target.value === "on" ? musicVolume : 0 },
        `Background music: ${e.target.value}`,
      );
    $("music-volume").onchange = (e) =>
      applyPatch(
        { music: Number(e.target.value) },
        `Music volume: ${e.target.value}`,
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
          "Saved as pending development feedback. No game changes were applied.";
        refreshHistory();
      } else {
        applyPatch(parsed.patch, text);
        $("custom-result").textContent = `Applied: ${Object.entries(
          parsed.patch,
        )
          .map(([k, v]) => `${k} = ${v}`)
          .join(", ")}. You can undo this.`;
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
      toast("Restored the previous settings.");
    };
  }
  return { journal, settings, map, setSettings: applyPatch };
}
