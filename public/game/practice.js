import {
  activities,
  activityRound,
  pieceOrder,
  orderedPieces,
  activityById,
  newPractice,
  validatePractice,
  beginPractice,
  completePractice,
  visitPractice,
} from "../data/activities.js";
import { culture } from "../data/culture.js";

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
    transcript = false,
    selectedWord = null;
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
    selectedWord = null;
    show(id);
  }
  function controls() {
    return `<div class="small-actions"><button id="practice-replay">${escape(label("听一听", "Listen"))}</button><button id="practice-slow">${escape(label("慢一点", "Listen slowly"))}</button><button id="practice-stop">${escape(label("停止声音", "Stop voice"))}</button><button id="practice-hint">${escape(label("提示", "Hint"))}</button></div><p id="practice-audio-status" role="status" class="muted"></p><div id="practice-hint-content" hidden></div>`;
  }
  function show(id, done = false) {
    if (!activityById[id]) return catalog();
    showing = id;
    const progress = state(),
      active = progress.active;
    const round =
      active?.id === id
        ? active.round
        : Math.max(0, (progress.rounds[id] || 1) - 1);
    const a = activityRound(id, round),
      step = active?.id === id ? active.step : 0;
    const tiles = active?.id === id ? active.tiles || [] : [],
      matches = active?.id === id ? active.matches || [] : [];
    const prompt = a.steps?.[step]?.clue || a.prompt;
    const listenFirst =
      a.listenFirst || a.type === "listening" || a.type === "visit";
    let html = done
      ? `${line(a.response)}${controls()}<p lang="zh-CN">${escape(label("这次练习已记录。也可以继续和邻居聊天。", "This practice is recorded. You can keep chatting with your neighbor."))}</p><div class="small-actions"><button id="practice-talk">${escape(label("聊一聊", "Keep chatting"))}</button><button id="practice-again">${escape(label("再来一次", "Try again"))}</button></div>`
      : `${a.steps ? `<p class="muted">${step + 1} / ${a.steps.length}</p>` : ""}${listenFirst ? `<p lang="zh-CN">${escape(label("先听一听，再去找答案。也可以查看文字。", "Listen for the clue. You can reveal the words whenever you like."))}</p><button id="practice-transcript" aria-expanded="${transcript}">${escape(label(transcript ? "隐藏文字" : "查看文字", transcript ? "Hide words" : "Show words"))}</button><div id="practice-transcript-content" ${transcript ? "" : "hidden"}>${line(prompt)}</div>` : line(prompt)}${controls()}${a.question ? line(a.question) : ""}`;
    if (!done && (a.type === "choice" || a.type === "listening"))
      html += `<div class="map-stops">${a.options.map((o, i) => `<button data-practice-choice="${i}"><span lang="zh-CN">${escape(o.zh)}</span>${settings().pinyin ? `<small class="pinyin"> · ${escape(o.pinyin)}</small>` : ""}${settings().translation ? `<small class="meaning"> · ${escape(o.meaning)}</small>` : ""}</button>`).join("")}</div><p id="practice-feedback" role="status"></p>`;
    if (!done && (a.type === "basket" || a.type === "order"))
      html += `<form id="practice-basket">${a.items.map((o, i) => `<label>${escape(o.zh)}${settings().pinyin ? ` · ${escape(o.pinyin)}` : ""}${settings().translation ? ` · ${escape(o.meaning)}` : ""}<select name="fruit-${i}" aria-label="${escape(o.zh)}">${[0, 1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${active?.order?.[i] === n ? "selected" : ""}>${n}${a.type === "order" ? " 杯" : ""}</option>`).join("")}</select></label>`).join("")}<button class="primary">${escape(label(a.type === "order" ? "端上饮料" : "就买这些", a.type === "order" ? "Serve these drinks" : "Choose this basket"))}</button></form><p id="practice-feedback" role="status"></p>`;
    if (!done && (a.type === "expression" || a.type === "tiles"))
      html += `<div class="map-stops">${(a.starters || []).map((o, i) => `<button data-practice-starter="${i}"><span lang="zh-CN">${escape(o.zh)}</span>${settings().pinyin ? `<small class="pinyin"> · ${escape(o.pinyin)}</small>` : ""}${settings().translation ? `<small class="meaning"> · ${escape(o.meaning)}</small>` : ""}</button>`).join("")}</div><form id="practice-share"><label for="practice-own">${escape(label("你的想法", "Your idea"))}</label><textarea id="practice-own" maxlength="160" rows="2"></textarea><button class="primary">${escape(label("分享", "Share"))}</button></form><p class="muted">${escape(label("说出自己的想法就好。这里不评分。", "Share your own idea. This is not scored or used to assess pronunciation."))}</p>`;
    if (!done && (a.type === "sequence" || a.type === "tiles")) {
      html += `<p lang="zh-CN">${escape(label(a.type === "sequence" ? "点卡片，排出步骤。" : "点词语，拼成一句话。", "Tap the cards in order. You can remove a card and try again."))}</p><div class="map-stops">${pieceOrder(
        a.pieces.length,
        round,
      )
        .map(
          (i) =>
            `<button data-practice-piece="${i}" ${tiles.includes(i) ? "disabled" : ""}><span lang="zh-CN">${escape(a.pieces[i].zh)}</span>${settings().pinyin ? `<small class="pinyin"> · ${escape(a.pieces[i].pinyin)}</small>` : ""}${settings().translation ? `<small class="meaning"> · ${escape(a.pieces[i].meaning)}</small>` : ""}</button>`,
        )
        .join(
          "",
        )}</div><p lang="zh-CN">${escape(label("你排的顺序：", "Your order:"))}</p><div class="small-actions">${tiles.map((i, slot) => `<button data-practice-remove="${slot}">${slot + 1}. ${escape(a.pieces[i].zh)} ×</button>`).join("")}</div><button id="practice-check-pieces" class="primary">${escape(label(a.type === "sequence" ? "做好了" : "说出来", "Try this order"))}</button><p id="practice-feedback" role="status"></p>`;
    }
    if (!done && a.type === "matching") {
      html += `<div class="map-stops" aria-label="${escape(label("中文词卡", "Chinese word cards"))}">${pieceOrder(
        a.pairs.length,
        round,
      )
        .map(
          (i) =>
            `<button data-practice-word="${i}" aria-pressed="${selectedWord === i}" ${matches.includes(i) ? "disabled" : ""}>${matches.includes(i) ? "✓ " : ""}<span lang="zh-CN">${escape(a.pairs[i].zh)}</span>${settings().pinyin ? `<small class="pinyin"> · ${escape(a.pairs[i].pinyin)}</small>` : ""}${settings().translation ? `<small class="meaning"> · ${escape(a.pairs[i].meaning)}</small>` : ""}</button>`,
        )
        .join(
          "",
        )}</div><p lang="zh-CN">${escape(label("再找对应的图片：", "Now find its picture:"))}</p><div class="map-stops">${pieceOrder(
        a.pairs.length,
        round + 1,
      )
        .map(
          (i) =>
            `<button data-practice-picture="${i}" aria-label="${escape(label(`${a.pairs[i].zh}图片`, `${a.pairs[i].meaning} picture`))}" ${matches.includes(i) ? "disabled" : ""}><span style="font-size:2rem" aria-hidden="true">${a.pairs[i].icon}</span>${matches.includes(i) ? " ✓" : ""}</button>`,
        )
        .join("")}</div><p id="practice-feedback" role="status"></p>`;
    }
    if (!done && a.type === "visit")
      html += `<p lang="zh-CN">${escape(label("到了以后，按“打招呼”或 E。", "When you arrive, use Say hello or E."))}</p><button id="practice-map">${escape(label("看地图", "Open map"))}</button>`;
    const fact = culture[a.culture];
    if (fact)
      html += `<details><summary lang="zh-CN">${escape(label("苏州小故事：桂花", "A Suzhou story: osmanthus"))}</summary>${line(fact)}<div class="small-actions"><button id="practice-culture-replay">听一听</button><a href="${escape(fact.source)}" target="_blank" rel="noopener noreferrer">资料来源 ↗</a></div></details>`;
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
    if ($("practice-culture-replay"))
      $("practice-culture-replay").onclick = () => speech.speak(fact.zh);
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
        openConversation(
          a.type === "visit" && id !== "lake-animals"
            ? a.steps.at(-1).target
            : a.npc,
        );
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
    const changeActive = (patch) => {
      const progress = state();
      if (progress.active?.id !== id) return;
      update({ ...progress, active: { ...progress.active, ...patch } });
      show(id);
    };
    for (const button of document.querySelectorAll("[data-practice-piece]"))
      button.onclick = () => {
        const index = Number(button.dataset.practicePiece);
        changeActive({ tiles: [...tiles, index] });
        speech.speak(a.pieces[index].zh);
      };
    for (const button of document.querySelectorAll("[data-practice-remove]"))
      button.onclick = () =>
        changeActive({
          tiles: tiles.filter(
            (_, i) => i !== Number(button.dataset.practiceRemove),
          ),
        });
    if ($("practice-check-pieces"))
      $("practice-check-pieces").onclick = () =>
        orderedPieces(a, tiles) ? finish() : retry();
    for (const button of document.querySelectorAll("[data-practice-word]"))
      button.onclick = () => {
        selectedWord = Number(button.dataset.practiceWord);
        show(id);
        speech.speak(a.pairs[selectedWord].zh);
      };
    for (const button of document.querySelectorAll("[data-practice-picture]"))
      button.onclick = () => {
        const picture = Number(button.dataset.practicePicture);
        if (picture !== selectedWord) return retry();
        const next = [...new Set([...matches, picture])];
        selectedWord = null;
        if (next.length === a.pairs.length) finish();
        else changeActive({ matches: next });
      };
    for (const button of document.querySelectorAll("[data-practice-choice]"))
      button.onclick = () =>
        Number(button.dataset.practiceChoice) === a.answer ? finish() : retry();
    if ($("practice-basket") && a.type === "order")
      for (const select of $("practice-basket").querySelectorAll("select"))
        select.onchange = () => {
          const values = new FormData($("practice-basket"));
          const order = a.items.map((_, i) => Number(values.get(`fruit-${i}`)));
          const progress = state();
          update({ ...progress, active: { ...progress.active, order } });
        };
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
    start,
    openForNpc: (id) => catalog(id),
    visit,
    refresh,
    status: () => (state().active ? activityById[state().active.id].title : ""),
    newPractice,
  };
}
