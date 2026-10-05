import {
  activities,
  activityById,
  newPractice,
  validatePractice,
  beginPractice,
  completePractice,
  visitPractice,
} from "../data/activities.js";

const $ = (id) => document.getElementById(id);
const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function createPractice({
  persistence,
  openPanel,
  speech,
  openMap,
  openConversation,
  onChange = () => {},
}) {
  const state = () => validatePractice(persistence.state.practice);
  let showing = null,
    transcript = false;
  const settings = () => persistence.state.settings;
  function line(text, className = "chinese") {
    return `<p class="${className}" lang="zh-CN">${escape(text.zh)}</p>${settings().pinyin ? `<p class="pinyin">${escape(text.pinyin)}</p>` : ""}${settings().translation ? `<p class="meaning">${escape(text.meaning)}</p>` : ""}`;
  }
  function label(zh, en) {
    return settings().translation ? `${zh} · ${en}` : zh;
  }
  function update(next, extra) {
    persistence.change((s) => {
      s.practice = next;
      extra?.(s);
    });
    onChange(next);
  }
  function catalog(npc) {
    showing = null;
    const progress = state(),
      choices = npc ? activities.filter((a) => a.npc === npc) : activities;
    openPanel(
      label("中文小任务", "Chinese errands"),
      `<p lang="zh-CN">听一听，说一说，去找邻居。随时可以停下来。</p>${settings().translation ? '<p class="muted">Listen, share an idea, and meet your neighbors. Replay and hints are always welcome.</p>' : ""}${progress.active ? `<p><button id="practice-resume">${escape(label("继续", "Continue"))}：${escape(activityById[progress.active.id].title)}</button></p>` : ""}<div class="map-stops">${choices.map((a) => `<button data-activity="${a.id}">${progress.completed.includes(a.id) ? "✓ " : ""}${escape(a.title)}${settings().translation ? `<small> · ${escape(a.english)}</small>` : ""}</button>`).join("")}</div>${npc ? `<p><button id="practice-all">${escape(label("所有小任务", "All errands"))}</button></p>` : ""}`,
    );
    for (const button of document.querySelectorAll("[data-activity]"))
      button.onclick = () => start(button.dataset.activity);
    if ($("practice-resume"))
      $("practice-resume").onclick = () => show(progress.active.id);
    if ($("practice-all")) $("practice-all").onclick = () => catalog();
  }
  function start(id) {
    update(beginPractice(state(), id));
    transcript = false;
    show(id);
  }
  function controls() {
    return `<div class="small-actions"><button id="practice-replay">${escape(label("听一听", "Listen"))}</button><button id="practice-slow">${escape(label("慢一点", "Listen slowly"))}</button><button id="practice-stop">${escape(label("停止声音", "Stop voice"))}</button><button id="practice-hint">${escape(label("提示", "Hint"))}</button></div><p id="practice-audio-status" role="status" class="muted"></p><div id="practice-hint-content" hidden></div>`;
  }
  function show(id, done = false) {
    const a = activityById[id];
    if (!a) return catalog();
    showing = id;
    const active = state().active,
      step = active?.id === id ? active.step : 0;
    const prompt = a.steps?.[step]?.clue || a.prompt;
    const listenFirst = a.type === "listening" || a.type === "visit";
    let html = done
      ? `${line(a.response)}${controls()}<p lang="zh-CN">${escape(label("这次练习已记录。也可以继续和邻居聊天。", "This practice is recorded. You can keep chatting with your neighbor."))}</p><div class="small-actions"><button id="practice-talk">${escape(label("聊一聊", "Keep chatting"))}</button><button id="practice-again">${escape(label("再来一次", "Try again"))}</button></div>`
      : `${a.steps ? `<p class="muted">${step + 1} / ${a.steps.length}</p>` : ""}${listenFirst ? `<p lang="zh-CN">${escape(label("先听一听，再去找答案。也可以查看文字。", "Listen for the clue. You can reveal the words whenever you like."))}</p><button id="practice-transcript" aria-expanded="${transcript}">${escape(label(transcript ? "隐藏文字" : "查看文字", transcript ? "Hide words" : "Show words"))}</button><div id="practice-transcript-content" ${transcript ? "" : "hidden"}>${line(prompt)}</div>` : line(prompt)}${controls()}${a.question ? line(a.question) : ""}`;
    if (!done && (a.type === "choice" || a.type === "listening"))
      html += `<div class="map-stops">${a.options.map((o, i) => `<button data-practice-choice="${i}"><span lang="zh-CN">${escape(o.zh)}</span>${settings().pinyin ? `<small class="pinyin"> · ${escape(o.pinyin)}</small>` : ""}${settings().translation ? `<small class="meaning"> · ${escape(o.meaning)}</small>` : ""}</button>`).join("")}</div><p id="practice-feedback" role="status"></p>`;
    if (!done && a.type === "basket")
      html += `<form id="practice-basket">${a.items.map((o, i) => `<label>${escape(o.zh)}${settings().pinyin ? ` · ${escape(o.pinyin)}` : ""}${settings().translation ? ` · ${escape(o.meaning)}` : ""}<select name="fruit-${i}" aria-label="${escape(o.zh)}">${[0, 1, 2, 3, 4, 5].map((n) => `<option value="${n}">${n}</option>`).join("")}</select></label>`).join("")}<button class="primary">${escape(label("就买这些", "Choose this basket"))}</button></form><p id="practice-feedback" role="status"></p>`;
    if (!done && a.type === "expression")
      html += `<div class="map-stops">${a.starters.map((o, i) => `<button data-practice-starter="${i}"><span lang="zh-CN">${escape(o.zh)}</span>${settings().pinyin ? `<small class="pinyin"> · ${escape(o.pinyin)}</small>` : ""}${settings().translation ? `<small class="meaning"> · ${escape(o.meaning)}</small>` : ""}</button>`).join("")}</div><form id="practice-share"><label for="practice-own">${escape(label("你的想法", "Your idea"))}</label><textarea id="practice-own" maxlength="160" rows="2"></textarea><button class="primary">${escape(label("分享", "Share"))}</button></form><p class="muted">${escape(label("说出自己的想法就好。这里不评分。", "Share your own idea. This is not scored or used to assess pronunciation."))}</p>`;
    if (!done && a.type === "visit")
      html += `<p lang="zh-CN">${escape(label("到了以后，按“打招呼”或 E。", "When you arrive, use Say hello or E."))}</p><button id="practice-map">${escape(label("看地图", "Open map"))}</button>`;
    html += `<p><button id="practice-list">${escape(label("所有小任务", "All errands"))}</button>${!done ? ` <button id="practice-pause">${escape(label("暂时放下", "Put this errand aside"))}</button>` : ""}</p>`;
    openPanel(label(a.title, a.english), html);
    const spoken = done ? a.response.zh : prompt.zh;
    $("practice-replay").onclick = () => speech.speak(spoken);
    $("practice-slow").onclick = () => speech.speak(spoken, true);
    $("practice-stop").onclick = () => speech.stop();
    $("practice-hint").onclick = () => {
      $("practice-hint-content").innerHTML = line(a.hint);
      $("practice-hint-content").hidden = false;
    };
    $("practice-list").onclick = () => catalog();
    if ($("practice-pause"))
      $("practice-pause").onclick = () => {
        update({ ...state(), active: null });
        catalog();
      };
    if ($("practice-transcript"))
      $("practice-transcript").onclick = () => {
        transcript = !transcript;
        show(id);
      };
    if ($("practice-map")) $("practice-map").onclick = openMap;
    if ($("practice-talk"))
      $("practice-talk").onclick = () => {
        $("panel").close();
        openConversation(a.type === "visit" ? a.steps.at(-1).target : a.npc);
      };
    if ($("practice-again")) $("practice-again").onclick = () => start(id);
    const finish = (shared) => {
      update(completePractice(state(), id), (s) => {
        if (typeof shared === "string") {
          s.history.push({
            npc: a.npc,
            user: shared,
            reply: {
              chinese: a.response.zh,
              pinyin: a.response.pinyin,
              meaning: a.response.meaning,
              topic: a.topic,
              mode: "authored",
            },
          });
          s.history = s.history.slice(-24);
        }
      });
      show(id, true);
    };
    const retry = () => {
      $("practice-feedback").innerHTML =
        `${line({ zh: "再看看，也可以听一听或查看提示。", pinyin: "Zài kànkan, yě kěyǐ tīng yì tīng huò chákàn tíshì.", meaning: "Take another look. You can replay the clue or open a hint." }, "notice")}`;
    };
    for (const button of document.querySelectorAll("[data-practice-choice]"))
      button.onclick = () =>
        Number(button.dataset.practiceChoice) === a.answer ? finish() : retry();
    if ($("practice-basket"))
      $("practice-basket").onsubmit = (e) => {
        e.preventDefault();
        const values = new FormData(e.currentTarget);
        a.quantities.every((n, i) => Number(values.get(`fruit-${i}`)) === n)
          ? finish()
          : retry();
      };
    for (const button of document.querySelectorAll("[data-practice-starter]"))
      button.onclick = () => {
        $("practice-own").value =
          a.starters[Number(button.dataset.practiceStarter)].zh;
        $("practice-own").focus();
      };
    if ($("practice-share"))
      $("practice-share").onsubmit = (e) => {
        e.preventDefault();
        if ($("practice-own").value.trim())
          finish($("practice-own").value.trim().slice(0, 160));
        else $("practice-own").focus();
      };
  }
  function visit(stop) {
    const next = visitPractice(state(), stop);
    if (!next.advanced) return false;
    update(next.practice);
    transcript = false;
    show(next.id, next.completed);
    return true;
  }
  function refresh() {
    if (showing && $("panel").open && $("practice-replay"))
      show(showing, !state().active && state().completed.includes(showing));
  }
  return {
    catalog,
    openForNpc: (id) => catalog(id),
    visit,
    refresh,
    status: () => (state().active ? activityById[state().active.id].title : ""),
    newPractice,
  };
}
