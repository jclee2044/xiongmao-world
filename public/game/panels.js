import { api } from "./persistence.js";
import { npcs } from "../data/content.js";
import { validatePatch, parseCustomization } from "../data/settings.js";
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
}) {
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
      `<div class="panel-section"><h3>Little memories</h3>${s.journal.length ? "<ul>" + s.journal.map((x) => `<li>${escape(x)}</li>`).join("") + "</ul>" : "<p>Your first page is waiting. Try saying hello to Mei, then wander toward the tree beyond the bookshop.</p>"}${memories ? `<ul>${memories}</ul>` : ""}</div><div class="panel-section"><h3>Carry a little Chinese with you</h3><p lang="zh-CN">你今天忙吗？ · 我们一起喝茶吧。</p><p>Ask someone how their day is going, or invite them for tea.</p><p>Panda remembers where you meet familiar words. These visits are practice, not a score. Choose the Chinese challenge in Settings; help requests never count against you.</p></div><div class="panel-section"><h3>Your progress</h3><p>${escape($("save-status").textContent)}</p><div class="small-actions"><button id="retry-save">Retry sync</button><button id="export-save">Download this device’s save</button></div>${persistence.conflict ? '<p class="notice">Another device or session has newer progress. Your local copy is preserved. Choose explicitly; keeping this device also preserves discoveries from the server.</p><div class="small-actions"><button id="use-server">Use server progress</button><button id="use-local">Keep this device’s progress</button></div>' : ""}</div><div class="panel-section"><h3>Connect another device</h3><p>Open the same private HTTPS game URL on your phone. Pairing shares this world and its journal. Codes last five minutes and work once.</p><button id="pair-code">Create pairing code</button><p id="code-output"></p><label for="pair-input">Or enter a code from your other device</label><div class="reply-row"><input id="pair-input" maxlength="10" autocomplete="off"><button id="pair-submit">Pair</button></div></div>`,
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
      "Make yourself at home",
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
      ])}${select("motion", "Gentle hopping", [
        [true, "On"],
        [false, "Reduced motion"],
      ])}${select("textSize", "Text size", [
        ["normal", "Normal"],
        ["large", "Larger"],
      ])}${select("voice", "Mandarin voice", [
        [true, "On"],
        [false, "Off"],
      ])}</div><label>Voice volume<input id="voice-volume" type="range" min="0" max="1" step="0.05" value="${s.voiceVolume}"></label><p class="notice">Mandarin uses an available local device voice or the PC’s basic eSpeak voice. Music and ambience are planned. Microphone input is not enabled yet.</p><div class="panel-section"><h3>Describe a small change</h3><p>Supported now: lavender/sage/peach/teal outfit, short hair or bun, slower walking, help and challenge. This changes a simple avatar; unrestricted prompt-to-art is a later feature.</p><form id="custom-form"><label for="custom-prompt">Appearance or game feedback</label><textarea id="custom-prompt" rows="2" maxlength="500" placeholder="Sage outfit and short hair"></textarea><div class="small-actions"><button class="primary">Apply supported change</button><button type="button" id="undo-settings" ${!persistence.state.settingsHistory.length ? "disabled" : ""}>Undo last change</button></div></form><p id="custom-result" role="status"></p></div><div class="panel-section"><h3>Change history</h3><ul id="settings-history">${
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
    for (const select of document.querySelectorAll("[data-setting]"))
      select.onchange = () => {
        let value = select.value;
        if (value === "true" || value === "false") value = value === "true";
        applyPatch(
          { [select.dataset.setting]: value },
          `${select.dataset.setting}: ${select.selectedOptions[0].textContent}`,
        );
      };
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
  return { journal, settings };
}
