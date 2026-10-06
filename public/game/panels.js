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
      `<svg class="district-map" viewBox="0 0 ${scene.width} ${scene.height}" role="img" aria-label="地图和你现在的位置"><rect width="100%" height="100%" fill="#eee1c4"/>${(scene.districts || []).map((d) => `<rect x="${d.x + 8}" y="${d.y + 8}" width="${d.w - 16}" height="${d.h - 16}" rx="70" fill="#ded2b3"/><text x="${d.x + d.w / 2}" y="${d.y + d.h / 2}" text-anchor="middle" fill="#64543b" font-size="110">${d.zh}</text>`).join("")}${(scene.canals || []).map((z) => `<polygon points="${z.polygon.map((p) => p.join(",")).join(" ")}" fill="#659b96"/>`).join("")}${(scene.bridges || []).map((b) => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="#ead9b6"/>`).join("")}${scene.landmark ? `<image href="/assets/world/canal-lane.webp" x="${scene.landmark.x}" y="${scene.landmark.y}" width="${scene.landmark.w}" height="${scene.landmark.h}"/>` : ""}<circle cx="${world.player.x}" cy="${world.player.y}" r="70" fill="#986748" stroke="#fff8eb" stroke-width="24"/></svg><p lang="zh-CN">想去哪里？</p><div class="map-stops">${stops.map((o) => `<button data-map-stop="${o.id}">${escape(o.name)}</button>`).join("")}</div>`,
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
          .join("") || "<li>还没有改过。</li>";
    if ($("pending-feedback"))
      $("pending-feedback").innerHTML =
        persistence.state.feedback
          .slice(-5)
          .reverse()
          .map((f) => `<li>${escape(f.text)} · 等一等</li>`)
          .join("") || "<li>还没有新的想法。</li>";
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
    toast(`设置改好了。`);
  }
  function journalText(entry) {
    if (entry === "Met Momo beside the canal and brought Momo home.")
      return "在河边认识了桃桃，带桃桃回家了。";
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
      "今天的日记",
      `<div class="panel-section"><h3>河巷日记</h3><p>${s.adventure.xp} / 500 经验</p><p lang="zh-CN">兰的花：${{ new: "还没问过兰", accepted: "去河对岸的假山找花", found: "把花还给兰", done: "已经还给兰了" }[s.adventure.flowers]}<br>和乔喝茶：${{ new: "邀请乔喝茶", invited: "乔正在去茶桌的路上", seated: "乔在茶桌等你", done: "一起喝过茶了" }[s.adventure.tea]}</p></div><div class="panel-section"><h3>今天的事</h3>${s.journal.length ? "<ul>" + s.journal.map((x) => `<li>${escape(journalText(x))}</li>`).join("") + "</ul>" : "<p>日记还是空的。去认识梅，再去河边走走吧。</p>"}${memories ? `<ul>${memories}</ul>` : ""}</div><div class="panel-section"><h3>说说中文</h3><p lang="zh-CN">你今天忙吗？ · 我们一起喝茶吧。</p><p>问问邻居今天怎么样，或请他们一起喝茶。</p><p>熊猫记得你在哪里见过这些词。多说几次就好。可以在设置里选难一点或简单一点，也可以随时问熊猫。</p></div><div class="panel-section"><h3>我的日记</h3><p>${escape($("save-status").textContent)}</p><div class="small-actions"><button id="retry-save">再存一次</button><button id="export-save">下载这本日记</button></div>${persistence.conflict ? '<p class="notice">另一台设备有新的日记。这本日记也还在。请选择要用哪一本。选这一本时，也会留下另一本里认识的新词和找到的东西。</p><div class="small-actions"><button id="use-server">用电脑上的日记</button><button id="use-local">用这台设备的日记</button></div>' : ""}</div><div class="panel-section"><h3>在另一台设备上玩</h3><p>在手机上打开同一个 HTTPS 游戏地址。输入号码，就能用同一本日记。号码五分钟后不能用，只能用一次。</p><button id="pair-code">给我一个号码</button><p id="code-output"></p><label for="pair-input">或输入另一台设备上的号码</label><div class="reply-row"><input id="pair-input" maxlength="10" autocomplete="off"><button id="pair-submit">连接</button></div></div>`,
    );
    $("panel-content").insertAdjacentHTML(
      "afterbegin",
      `<div class="panel-section"><h3>新词</h3><p class="chinese">${s.adventure.vocabulary.map(escape).join(" · ") || "还没有新词"}</p><h3>我的包</h3><p>${
        s.adventure.purchases
          .map(
            (id) =>
              Object.values(shops)
                .flatMap((shop) => shop.items)
                .find((item) => item.id === id)?.zh || "小礼物",
          )
          .join(" · ") || "包里还没有东西。"
      } · ¥${s.adventure.coins}</p><p>和莲吃火锅： ${s.adventure.hungry === "done" ? "✓ 一起吃过饭了" : s.adventure.hungry === "new" ? "去集市找莲" : "带莲去面馆，一起吃火锅。"}</p></div>`,
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
          throw new Error("请先选好要用哪本日记，再连接。");
        const result = await api("/api/pair-code", {});
        $("code-output").textContent = `${result.code} · 五分钟内可以用`;
      } catch (e) {
        toast(e.message);
      }
    };
    $("pair-submit").onclick = async () => {
      try {
        if (persistence.generation !== persistence.persisted)
          throw new Error("连接前，请先保存或下载这本日记。");
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
      "设置",
      `<div class="settings-grid">${select("outfit", "衣服", [
        ["#b4a6c3", "紫色"],
        ["#899b7c", "绿色"],
        ["#d3a890", "粉色"],
        ["#8ca6a2", "青色"],
      ])}${select("hair", "头发", [
        ["bun", "盘起来"],
        ["short", "短发"],
      ])}${select("pace", "走路快慢", [
        ["normal", "慢慢走"],
        ["slow", "再慢一点"],
      ])}${select("challenge", "中文难不难", [
        ["gentler", "简单一点"],
        ["standard", "刚刚好"],
        ["challenging", "难一点"],
      ])}${select("help", "熊猫的帮助", [
        ["more", "多帮一点"],
        ["standard", "帮一点"],
        ["less", "少帮一点"],
      ])}${select("pinyin", "拼音", [
        [true, "看"],
        [false, "不看"],
      ])}${select("translation", "英文意思", [
        [true, "看"],
        [false, "不看"],
      ])}${select("motion", "画面动不动", [
        [true, "开"],
        [false, "少动一点"],
      ])}${select("textSize", "字的大小", [
        ["normal", "平常"],
        ["large", "大一点"],
      ])}${select("voice", "中文声音", [
        [true, "开"],
        [false, "关"],
      ])}</div><label for="voice-volume">说话声音大小</label><input id="voice-volume" type="range" min="0" max="1" step="0.05" value="${s.voiceVolume}"><label for="music-toggle">音乐</label><select id="music-toggle"><option value="on" ${s.music > 0 ? "selected" : ""}>开</option><option value="off" ${s.music === 0 ? "selected" : ""}>关</option></select><label for="music-volume">音乐声音大小</label><input id="music-volume" type="range" min="0.05" max="1" step="0.05" value="${s.music || musicVolume}" ${s.music === 0 ? "disabled" : ""}><label for="ambience-volume">风声和水声</label><input id="ambience-volume" type="range" min="0" max="1" step="0.05" value="${s.ambience}"><p class="notice">说话时，音乐会小一点。在面馆可以用麦克风说话点菜。</p><div class="panel-section"><h3>想改什么？</h3><p>可以换衣服颜色、短发或把头发盘起来，也可以走慢一点，改中文难度和熊猫的帮助。</p><form id="custom-form"><label for="custom-prompt">说说你的想法</label><textarea id="custom-prompt" rows="2" maxlength="500" placeholder="绿色衣服，短发"></textarea><div class="small-actions"><button class="primary">改一下</button><button type="button" id="undo-settings" ${!persistence.state.settingsHistory.length ? "disabled" : ""}>改回去</button></div></form><p id="custom-result" role="status"></p></div><div class="panel-section"><h3>改过什么</h3><ul id="settings-history">${
        persistence.state.settingsHistory
          .slice(-5)
          .reverse()
          .map((h) => `<li>${escape(h.label)}</li>`)
          .join("") || "<li>还没有改过。</li>"
      }</ul><h3>留下的想法</h3><ul id="pending-feedback">${
        persistence.state.feedback
          .slice(-5)
          .reverse()
          .map((f) => `<li>${escape(f.text)} · 等一等</li>`)
          .join("") || "<li>还没有新的想法。</li>"
      }</ul><p>新的地图、图片和玩法还不能在这里改。你的想法会先记下来。</p></div>`,
    );
    const credit = document.createElement("details");
    credit.className = "muted";
    credit.innerHTML = `<summary>音乐来源</summary><p>室外： <a href="${backgroundTrack.source}" target="_blank" rel="noopener">${backgroundTrack.title} — ${backgroundTrack.artist}</a> · <a href="${backgroundTrack.license}" target="_blank" rel="noopener">CC BY 4.0</a>. 室内： <a href="${indoorTrack.source}" target="_blank" rel="noopener">${indoorTrack.title} — ${indoorTrack.artist}</a> · <a href="${indoorTrack.license}" target="_blank" rel="noopener">Pixabay Content License</a>. <a href="https://www.free-stock-music.com" target="_blank" rel="noopener">Music by https://www.free-stock-music.com</a> （室外音乐）。</p>`;
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
        `音乐：${e.target.value === "on" ? "开" : "关"}`,
      );
    $("music-volume").onchange = (e) =>
      applyPatch(
        { music: Number(e.target.value) },
        `音乐声音大小: ${e.target.value}`,
      );
    $("ambience-volume").onchange = (e) =>
      applyPatch(
        { ambience: Number(e.target.value) },
        `风声和水声: ${e.target.value}`,
      );
    $("voice-volume").onchange = (e) =>
      applyPatch(
        { voiceVolume: Number(e.target.value) },
        `说话声音大小: ${e.target.value}`,
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
        $("custom-result").textContent = "想法记下来了。游戏还没有改。";
        refreshHistory();
      } else {
        applyPatch(parsed.patch, text);
        $("custom-result").textContent = "改好了。不喜欢的话，可以改回去。";
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
      toast("已经改回去了。");
    };
  }
  return { journal, settings, map, setSettings: applyPatch };
}
