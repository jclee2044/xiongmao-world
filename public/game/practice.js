import { grantReward, completionText } from "../data/rewards.js";
import { activityGuide } from "./activity-guide.js";
import { npcs } from "../data/content.js";
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
  correctRiddle,
  finishedPattern,
  marketResult,
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
const lanternPicture = `<svg class="riddle-lantern" viewBox="0 0 80 100" aria-hidden="true" focusable="false"><path d="M40 4v10M40 85v11M32 87v9M48 87v9" stroke="currentColor" stroke-width="3"/><rect x="27" y="13" width="26" height="7" rx="2" fill="#bd7350"/><ellipse cx="40" cy="49" rx="30" ry="31" fill="#de785d"/><ellipse cx="40" cy="49" rx="18" ry="31" fill="#edb277"/><path d="M11 42h58M11 57h58M40 19v60" fill="none" stroke="#a95943" stroke-width="2" opacity=".55"/><rect x="27" y="78" width="26" height="7" rx="2" fill="#bd7350"/></svg>`;
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
    selectedWord = null,
    selectedThread = 0,
    selectedCell = 0,
    clothCluesOpen = false,
    lastStitch = null;
  const settings = () => persistence.state.settings;
  function line(text, className = "chinese") {
    return `<p class="${className}" lang="zh-CN">${escape(text.zh)}</p>${settings().pinyin ? `<p class="pinyin">${escape(text.pinyin)}</p>` : ""}${settings().translation ? `<p class="meaning">${escape(text.meaning)}</p>` : ""}`;
  }
  function label(zh, english) {
    return english || zh;
  }
  function cardText(text) {
    return `<span lang="zh-CN">${escape(text.zh)}</span>${settings().pinyin ? `<small class="pinyin">${escape(text.pinyin)}</small>` : ""}${settings().translation ? `<small class="meaning">${escape(text.meaning)}</small>` : ""}`;
  }
  function cloth(a, stitches, editable) {
    return `<div class="silk-hoop"><div class="silk-cloth" role="group" aria-label="${escape(label("Nine-square cloth", "Nine-square embroidery cloth"))}">${a.positions
      .map((position, cell) => {
        const thread = a.palette[stitches[cell]],
          colorName = thread?.zh || "Empty",
          accessible = label(
            `${position.zh}：${colorName}`,
            `${position.meaning}: ${thread?.meaning || "empty"}`,
          );
        return `<${editable ? "button" : "div"} class="silk-cell ${thread ? "stitched" : ""}" ${editable ? `type="button" data-practice-stitch="${cell}" data-current-cell="${cell === selectedCell}" aria-label="${escape(accessible)}"` : `aria-label="${escape(accessible)}"`} ${thread ? `data-thread-color="${stitches[cell]}"` : ""}><span class="silk-flower" aria-hidden="true"></span><span class="silk-position" lang="zh-CN">${escape(position.zh)}</span>${settings().pinyin ? `<small class="silk-position-meaning pinyin">${escape(position.pinyin)}</small>` : ""}${settings().translation ? `<small class="silk-position-meaning">${escape(position.meaning)}</small>` : ""}<span class="silk-color" lang="zh-CN">${escape(colorName)}</span>${settings().pinyin && thread ? `<small class="silk-position-meaning pinyin">${escape(thread.pinyin)}</small>` : ""}</${editable ? "button" : "div"}>`;
      })
      .join("")}</div></div>`;
  }
  function update(next, extra) {
    persistence.change((s) => {
      for (const [id, count] of Object.entries(next.rounds || {})) {
        const previous = s.practice.rounds?.[id] || 0;
        for (let round = previous + 1; round <= count; round++)
          grantReward(s.adventure, { id: `practice:${id}:${round}`, amount: 20, scene: s.scene, label: activityById[id].english });
      }
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
      label("中文练习", "Practice activities"),
      `<p>Choose a short practice activity. These exercises do not spend your coins or buy items.</p>${progress.active ? "<p>Starting a different activity replaces your unfinished practice. Continue below to keep working on it.</p>" : ""}${progress.active ? `<p><button id="practice-resume">Continue: ${escape(activityById[progress.active.id].english)}</button></p>` : ""}<div class="activity-catalog">${choices
        .map((a) => {
          const guide = activityGuide(a.id);
          return `<button data-activity="${a.id}"><strong>${progress.completed.includes(a.id) ? "✓ Practiced · " : ""}${escape(a.english)}</strong><span>${escape(guide.how)}</span><small>Start practice →</small></button>`;
        })
        .join(
          "",
        )}</div>${npc ? `<p><button id="practice-all">All activities</button></p>` : ""}`,
      "en",
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
    selectedThread = 0;
    selectedCell = 0;
    clothCluesOpen = false;
    lastStitch = null;
    show(id);
  }
  function controls() {
    return `<div class="small-actions"><button id="practice-replay">${escape(label("听一听", "Listen"))}</button><button id="practice-slow">${escape(label("慢一点", "Listen slowly"))}</button><button id="practice-stop">${escape(label("Stop voice", "Stop voice"))}</button><button id="practice-hint">${escape(label("帮助", "Hint"))}</button></div><p id="practice-audio-status" role="status" class="muted"></p><div id="practice-hint-content" hidden></div>`;
  }
  function show(id, done = false) {
    if (!activityById[id]) return catalog();
    if (showing === id && document.querySelector(".silk-instructions"))
      clothCluesOpen = document.querySelector(".silk-instructions").open;
    showing = id;
    speech.voice = npcs[activityById[id].npc]?.voiceProfile || "older-male";
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
    const stitches =
      active?.id === id
        ? active.stitches || Array(9).fill(-1)
        : Array(9).fill(-1);
    const order =
      active?.id === id ? active.order || a.items?.map(() => 0) : [];
    const riddle = !done && a.type === "riddle" ? a.steps[step] : null;
    const stitchClue =
      !done && a.type === "weaving"
        ? a.instructions.find(
            (instruction) => instruction.cell === selectedCell,
          )
        : null;
    const canUndo =
      lastStitch?.id === id &&
      lastStitch.round === round &&
      stitches.every((color, cell) => color === lastStitch.after[cell]);
    const prompt = a.steps?.[step]?.clue || a.prompt;
    const listenFirst =
      a.listenFirst || a.type === "listening" || a.type === "visit";
    const guide = activityGuide(id, active?.id === id ? active : null);
    let html = done
      ? `<p class="xp-award" role="status">${escape(completionText({ label: a.english, gained: 20 }))}</p>${line(a.response)}${controls()}<p lang="en">${escape(label("练习做好了。也可以再和邻居聊天。", "This practice is recorded. You can keep chatting with your neighbor."))}</p><div class="small-actions"><button id="practice-talk">${escape(label("说说话", "Keep chatting"))}</button><button id="practice-again">${escape(label("再来一次", "Try again"))}</button></div>`
      : `${a.steps ? `<p class="muted">${step + 1} / ${a.steps.length}</p>` : ""}${listenFirst ? `<p lang="en">${escape(label("先听一听，再去回答。也可以看字。", "Listen for the clue. You can reveal the words whenever you like."))}</p><button id="practice-transcript" aria-expanded="${transcript}">${escape(label(transcript ? "Hide 字" : "看字", transcript ? "Hide words" : "Show words"))}</button><div id="practice-transcript-content" ${transcript ? "" : "hidden"}>${line(prompt)}</div>` : a.type === "riddle" ? `<div id="practice-riddle-clue" tabindex="-1">${line(prompt)}</div>` : line(prompt)}${stitchClue ? `<div id="practice-current-clue" class="notice" tabindex="-1">${line(stitchClue.clue)}</div>` : ""}${controls()}${a.question ? line(a.question) : ""}`;
    if (!done && riddle)
      html += `<div class="riddle-cards">${pieceOrder(
        riddle.options.length,
        round + step,
      )
        .map(
          (i) =>
            `<button class="riddle-card" data-practice-riddle="${i}">${lanternPicture}${cardText(riddle.options[i])}</button>`,
        )
        .join("")}</div><p id="practice-feedback" role="status"></p>`;
    if (a.type === "weaving") {
      const finishedStitches = Array(9).fill(-1);
      for (const instruction of a.instructions)
        finishedStitches[instruction.cell] = instruction.color;
      if (done) html += cloth(a, finishedStitches, false);
      else
        html += `${line(a.patternName)}<details class="silk-instructions" ${clothCluesOpen ? "open" : ""}><summary>${escape(label("听每一个要求", "Hear each square’s instruction"))}</summary><ol>${a.instructions.map((instruction) => `<li><button type="button" data-practice-cloth-clue="${instruction.cell}">${cardText(instruction.clue)}</button></li>`).join("")}</ol></details><p lang="en">${escape(label("Choose a color, then a square. You can change colors or remove a stitch.", "Choose a thread, then a square. You can replace a color or remove a stitch."))}</p><div class="thread-palette" role="group" aria-label="${escape(label("Choose thread", "Choose embroidery thread"))}">${a.palette.map((thread, i) => `<button type="button" data-practice-thread="${i}" aria-pressed="${selectedThread === i}"><span class="thread-swatch" data-thread-color="${i}" aria-hidden="true"></span>${cardText(thread)}</button>`).join("")}<button type="button" data-practice-thread="-1" aria-pressed="${selectedThread === -1}">${escape(label("Remove a stitch", "Remove a stitch"))}</button></div>${cloth(a, stitches, true)}<div class="small-actions"><button id="practice-stitch-undo" ${canUndo ? "" : "disabled"}>${escape(label("Undo last stitch", "Undo last stitch"))}</button><button id="practice-check-pattern" class="primary">${escape(label("看看画", "Check the pattern"))}</button></div><p id="practice-feedback" role="status"></p>`;
    }
    if (!done && a.type === "market") {
      const basket = marketResult(a, order);
      html += `<form id="practice-market"><p class="muted" lang="zh-CN">${escape(label("练习多少钱", "Practice prices"))}</p><p class="market-budget"><span lang="zh-CN">${escape(label("带的钱", "Money to spend"))}</span> <strong id="practice-market-budget">${a.budget} 元</strong></p><div class="market-goods">${a.items.map((item, i) => `<label class="market-item"><span class="market-icon" aria-hidden="true">${item.icon}</span><span class="market-name">${cardText(item)}<small class="market-price" lang="zh-CN">${item.price} 元 / ${escape(item.unit.zh)}${settings().pinyin ? `<span class="pinyin">${escape(item.unit.pinyin)}</span>` : ""}${settings().translation ? `<span class="meaning">${escape(item.unit.meaning)}</span>` : ""}</small></span><select name="market-${i}" aria-label="${escape(label(`${item.zh}quantity`, `${item.meaning} quantity`))}">${[0, 1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${order[i] === n ? "selected" : ""}>${n}</option>`).join("")}</select></label>`).join("")}</div><div class="market-receipt" role="status" aria-live="polite" aria-atomic="true"><p><span lang="zh-CN">${escape(label("一共", "Total"))}</span> <strong id="practice-market-total">${basket.total} 元</strong></p><p><span id="practice-market-change-label" lang="zh-CN">${escape(basket.withinBudget ? label("找零", "Change from your budget") : label("还差", "Over budget by"))}</span> <strong id="practice-market-change">${Math.abs(basket.remaining)} 元</strong></p></div><button id="practice-market-check" class="primary">${escape(label("就买这些", "Choose this basket"))}</button></form><p id="practice-feedback" role="status"></p>`;
    }
    if (!done && (a.type === "choice" || a.type === "listening"))
      html += `<div class="map-stops">${a.options.map((o, i) => `<button data-practice-choice="${i}"><span lang="zh-CN">${escape(o.zh)}</span>${settings().pinyin ? `<small class="pinyin"> · ${escape(o.pinyin)}</small>` : ""}${settings().translation ? `<small class="meaning"> · ${escape(o.meaning)}</small>` : ""}</button>`).join("")}</div><p id="practice-feedback" role="status"></p>`;
    if (!done && (a.type === "basket" || a.type === "order"))
      html += `<form id="practice-basket">${a.items.map((o, i) => `<label>${escape(o.zh)}${settings().pinyin ? ` · ${escape(o.pinyin)}` : ""}${settings().translation ? ` · ${escape(o.meaning)}` : ""}<select name="fruit-${i}" aria-label="${escape(o.zh)}">${[0, 1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${active?.order?.[i] === n ? "selected" : ""}>${n}${a.type === "order" ? "杯" : ""}</option>`).join("")}</select></label>`).join("")}<button class="primary">${escape(label(a.type === "order" ? "给大家饮料" : "就买这些", a.type === "order" ? "Serve these drinks" : "Choose this basket"))}</button></form><p id="practice-feedback" role="status"></p>`;
    if (!done && (a.type === "expression" || a.type === "tiles"))
      html += `<div class="map-stops">${(a.starters || []).map((o, i) => `<button data-practice-starter="${i}"><span lang="zh-CN">${escape(o.zh)}</span>${settings().pinyin ? `<small class="pinyin"> · ${escape(o.pinyin)}</small>` : ""}${settings().translation ? `<small class="meaning"> · ${escape(o.meaning)}</small>` : ""}</button>`).join("")}</div><form id="practice-share"><label for="practice-own">${escape(label("你想说什么", "Your idea"))}</label><textarea id="practice-own" maxlength="160" rows="2"></textarea><button class="primary">${escape(label("说说", "Share"))}</button></form><p class="muted">${escape(label("说说你想说的就好。", "Share your own idea. This is not scored or used to assess pronunciation."))}</p>`;
    if (!done && (a.type === "sequence" || a.type === "tiles")) {
      html += `<p lang="en">${escape(label(a.type === "sequence" ? "点一下，先做什么。" : "点词，做一个句子。", "Tap the cards in order. You can remove a card and try again."))}</p><div class="map-stops">${pieceOrder(
        a.pieces.length,
        round,
      )
        .map(
          (i) =>
            `<button data-practice-piece="${i}" ${tiles.includes(i) ? "disabled" : ""}><span lang="zh-CN">${escape(a.pieces[i].zh)}</span>${settings().pinyin ? `<small class="pinyin"> · ${escape(a.pieces[i].pinyin)}</small>` : ""}${settings().translation ? `<small class="meaning"> · ${escape(a.pieces[i].meaning)}</small>` : ""}</button>`,
        )
        .join(
          "",
        )}</div><p lang="en">${escape(label("你选择的东西：", "Your order:"))}</p><div class="small-actions">${tiles.map((i, slot) => `<button data-practice-remove="${slot}">${slot + 1}. ${escape(a.pieces[i].zh)} ×</button>`).join("")}</div><button id="practice-check-pieces" class="primary">${escape(label(a.type === "sequence" ? "做好了" : "说出来", "Try this order"))}</button><p id="practice-feedback" role="status"></p>`;
    }
    if (!done && a.type === "matching") {
      html += `<div class="map-stops" aria-label="${escape(label("中文词", "Chinese word cards"))}">${pieceOrder(
        a.pairs.length,
        round,
      )
        .map(
          (i) =>
            `<button data-practice-word="${i}" aria-pressed="${selectedWord === i}" ${matches.includes(i) ? "disabled" : ""}>${matches.includes(i) ? "✓ " : ""}<span lang="zh-CN">${escape(a.pairs[i].zh)}</span>${settings().pinyin ? `<small class="pinyin"> · ${escape(a.pairs[i].pinyin)}</small>` : ""}${settings().translation ? `<small class="meaning"> · ${escape(a.pairs[i].meaning)}</small>` : ""}</button>`,
        )
        .join(
          "",
        )}</div><p lang="en">${escape(label("再找一样的照片：", "Now find its picture:"))}</p><div class="map-stops">${pieceOrder(
        a.pairs.length,
        round + 1,
      )
        .map(
          (i) =>
            `<button data-practice-picture="${i}" aria-label="${escape(label(`${a.pairs[i].zh}照片`, `${a.pairs[i].meaning} picture`))}" ${matches.includes(i) ? "disabled" : ""}><span class="practice-picture-icon" aria-hidden="true">${a.pairs[i].icon}</span>${matches.includes(i) ? " ✓" : ""}</button>`,
        )
        .join("")}</div><p id="practice-feedback" role="status"></p>`;
    }
    if (!done && a.type === "visit")
      html += `<p lang="en">${escape(label("到了的时候，选择“说你好”或者 E。", "Tap the person, animal or object to interact, or press Space / E nearby."))}</p><button id="practice-map">${escape(label("看地图", "Open map"))}</button>`;
    const fact = culture[a.culture];
    if (fact)
      html += `<details><summary lang="zh-CN">${escape(label("文化小故事", "A cultural story"))}：${escape(settings().translation ? fact.title : fact.title.split(" · ")[0])}</summary>${line(fact)}${fact.note ? `<p class="notice" lang="en">${escape(fact.note)}</p>` : ""}<div class="small-actions"><button id="practice-culture-replay">${escape(label("听一听", "Listen"))}</button><a href="${escape(fact.source)}" target="_blank" rel="noopener noreferrer">${escape(label("Source", "Source"))} ↗</a></div></details>`;
    html += `<p><button id="practice-list">${escape(label("其他练习", "All activities"))}</button>${!done ? ` <button id="practice-pause">${escape(label("先不做了", "Save and return to town"))}</button>` : ""}</p>`;
    html =
      `<section class="activity-guide" lang="en"><strong>${done ? "Practice complete" : escape(guide.purpose)}</strong><p>${done ? "Your practice has been recorded. Keep chatting or try another activity." : escape(guide.how)}</p>${!done ? `${guide.next !== guide.how && a.type !== "visit" ? `<p><strong>Your task:</strong> ${escape(guide.next)}</p>` : ""}<p><strong>Complete when:</strong> ${escape(guide.complete)}</p>${guide.progress ? `<p>${escape(guide.progress)}</p>` : ""}<p class="muted">Practice only — no coins are spent and no items are purchased.</p>` : ""}</section>` +
      html;
    openPanel(label(a.title, a.english), html, "en");
    const spoken = done ? a.response.zh : stitchClue?.clue.zh || prompt.zh;
    $("practice-replay").onclick = () => speech.speak(spoken);
    $("practice-slow").onclick = () => speech.speak(spoken, true);
    $("practice-stop").onclick = () => speech.stop();
    $("practice-hint").onclick = () => {
      const hint = riddle?.hint || a.hint;
      $("practice-hint-content").innerHTML =
        `<p>${escape(hint.meaning)}</p>` + line(hint);
      $("practice-hint-content").hidden = false;
      speech.narrate(`${hint.meaning} ${hint.zh}`, { interrupt: true });
    };
    $("practice-list").onclick = () => catalog();
    if ($("practice-culture-replay"))
      $("practice-culture-replay").onclick = () => speech.speak(fact.zh, false, "panda");
    if ($("practice-pause"))
      $("practice-pause").onclick = () => {
        $("panel").close();
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
      if (state().active?.id !== id || state().active.round !== round) return;
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
    const retry = (message) => {
      $("practice-feedback").innerHTML =
        `<p lang="en">${escape(message?.meaning || "Take another look. You can replay the clue or open a hint.")}</p>${line(message || { zh: "再看看，也可以听一听或者看帮助。", pinyin: "zài kàn kàn ， yě kě yǐ tīng yi tīng huò zhě kàn bāng zhù 。", meaning: "Take another look. You can replay the clue or open a hint." }, "notice")}`;
      speech.narrate($("practice-feedback").textContent, { interrupt: true });
    };
    const changeActive = (patch, focusSelector) => {
      const progress = state();
      if (progress.active?.id !== id) return;
      update({ ...progress, active: { ...progress.active, ...patch } });
      show(id);
      if (focusSelector) document.querySelector(focusSelector)?.focus();
    };
    for (const button of document.querySelectorAll("[data-practice-riddle]"))
      button.onclick = () => {
        if (!correctRiddle(a, step, Number(button.dataset.practiceRiddle)))
          return retry();
        if (step + 1 === a.steps.length) finish();
        else changeActive({ step: step + 1 }, "#practice-riddle-clue");
      };
    for (const button of document.querySelectorAll("[data-practice-thread]"))
      button.onclick = () => {
        selectedThread = Number(button.dataset.practiceThread);
        show(id);
        document
          .querySelector(`[data-practice-thread="${selectedThread}"]`)
          ?.focus();
        if (selectedThread >= 0) speech.speak(a.palette[selectedThread].zh);
      };
    for (const button of document.querySelectorAll(
      "[data-practice-cloth-clue]",
    ))
      button.onclick = () => {
        selectedCell = Number(button.dataset.practiceClothClue);
        show(id);
        document
          .querySelector(`[data-practice-cloth-clue="${selectedCell}"]`)
          ?.focus();
        speech.speak(
          a.instructions.find(
            (instruction) => instruction.cell === selectedCell,
          ).clue.zh,
        );
      };
    for (const button of document.querySelectorAll("[data-practice-stitch]"))
      button.onclick = () => {
        const cell = Number(button.dataset.practiceStitch);
        selectedCell = cell;
        if (stitches[cell] === selectedThread) {
          show(id);
          document.querySelector(`[data-practice-stitch="${cell}"]`)?.focus();
          return;
        }
        const next = [...stitches];
        next[cell] = selectedThread;
        lastStitch = { id, round, stitches: [...stitches], after: next, cell };
        changeActive({ stitches: next }, `[data-practice-stitch="${cell}"]`);
      };
    if ($("practice-stitch-undo"))
      $("practice-stitch-undo").onclick = () => {
        if (!canUndo) return;
        const previous = lastStitch;
        lastStitch = null;
        selectedCell = previous.cell;
        changeActive(
          { stitches: previous.stitches },
          `[data-practice-stitch="${previous.cell}"]`,
        );
      };
    if ($("practice-check-pattern"))
      $("practice-check-pattern").onclick = () => {
        if (finishedPattern(a, stitches)) return finish();
        const incomplete = a.instructions.find(
            (instruction) => stitches[instruction.cell] !== instruction.color,
          ),
          position = a.positions[incomplete.cell],
          empty = stitches[incomplete.cell] === -1;
        selectedCell = incomplete.cell;
        show(id);
        $("practice-current-clue").focus();
        retry({
          zh: empty
            ? `${position.zh}还是没有东西。选择颜色，再点一下。`
            : `${position.zh}的颜色还不一样。听听这个地方的要求，再换颜色。`,
          pinyin: empty
            ? `${position.pinyin} háishi méiyǒu dōngxi. Xuǎnzé yánsè, zài diǎn yíxià.`
            : `${position.pinyin} de yánsè hái bù yíyàng. Tīngting zhè ge dìfang de yāoqiú, zài huàn yánsè.`,
          meaning: empty
            ? `The square at ${position.meaning} is still empty. Choose a thread, then tap the cloth.`
            : `The color at ${position.meaning} differs from the instruction. Listen to that square’s clue, then choose another thread.`,
        });
      };
    if ($("practice-market")) {
      const marketOrder = () => {
        const values = new FormData($("practice-market"));
        return a.items.map((_, i) => Number(values.get(`market-${i}`)));
      };
      for (const select of $("practice-market").querySelectorAll("select"))
        select.onchange = () => {
          const order = marketOrder(),
            progress = state(),
            basket = marketResult(a, order);
          update({ ...progress, active: { ...progress.active, order } });
          $("practice-market-total").textContent = `${basket.total} 元`;
          $("practice-market-change-label").textContent = basket.withinBudget
            ? label("找零", "Change from your budget")
            : label("还差", "Over budget by");
          $("practice-market-change").textContent =
            `${Math.abs(basket.remaining)} 元`;
          $("practice-feedback").textContent = "";
        };
      $("practice-market").onsubmit = (e) => {
        e.preventDefault();
        const order = marketOrder(),
          basket = marketResult(a, order);
        if (basket.complete) return finish();
        if (!basket.withinBudget)
          return retry({
            zh: "钱太少了。可以少买一点，再看看要买什么。",
            pinyin:
              "qián tài shǎo le 。 kě yǐ shǎo mǎi yì diǎn ， zài kàn kàn yào mǎi shén me 。",
            meaning:
              "The basket costs more than you brought. You can buy less and check the shopping list.",
          });
        const index = a.quantities.findIndex(
            (quantity, i) => order[i] !== quantity,
          ),
          item = a.items[index],
          tooMany = order[index] > a.quantities[index];
        retry({
          zh: `${item.zh}${tooMany ? "买多了" : "还没有买完"}。再看看要买什么。`,
          pinyin: `${item.pinyin} ${tooMany ? "mǎi duō le" : "hái méiyǒu mǎi wán"}. Zài kànkan yào mǎi shénme.`,
          meaning: `${item.meaning}: ${tooMany ? "there are more than the list asks for" : "the list asks for more"}. Take another look at the shopping list.`,
        });
      };
    }
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
    status: () =>
      state().active ? activityById[state().active.id].english : "",
    newPractice,
  };
}
