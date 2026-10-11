import { chineseNumber } from "../data/language-text.js";
import { pandaSpeaker } from "./coach-questions.js";
import { completeQuest } from "../data/rewards.js";
import { luggageReminder, needsStationLuggage, packingOptions, packTravelLuggage } from "../data/travel-luggage.js";
import { voiceForNpc } from "../data/voices.js";
import { createStationInteractions } from "./station-interactions.js";
import {
  AREA_XP,
  award,
  museumObjects,
  hotpotItems,
  parseOrder,
} from "../data/adventure.js";
import { api } from "./persistence.js";
const $ = (id) => document.getElementById(id);
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function createAdventure({
  persistence,
  openPanel,
  speech,
  world,
  panda,
  refresh,
  onRecording = () => {},
}) {
  const state = () => persistence.state.adventure;
  const settings = () => persistence.state.settings;
  const change = (fn) => {
    persistence.change((s) => fn(s.adventure));
    refresh();
  };
  let meal = null,
    recorder = null,
    stream = null,
    recordTimer = null,
    abort = null,
    generation = 0;
  const text = (zh, pinyin, meaning) =>
    `<p class="chinese" data-dialogue lang="zh-CN"${zh === luggageReminder ? ' data-dialogue-variation="fixed"' : ""}>${escape(zh)}</p>${settings().pinyin ? `<p class="pinyin">${escape(pinyin)}</p>` : ""}${settings().translation ? `<p class="meaning">${escape(meaning)}</p>` : ""}`;
  function line(title, zh, pinyin, meaning, buttons = [], voice = "panda", detail = "") {
    openPanel(
      title.replace(/^熊猫/u, "Panda"),
      (voice === "panda" ? pandaSpeaker : "") + text(zh, pinyin, meaning) + detail +
        `<div class="small-actions"><button id="adventure-listen" data-word-leaf>听一听</button>${buttons.map(([id, label, , help]) => `<button id="${id}"${help ? ` data-help="${escape(help)}"` : ""} class="primary"${/^(station|packing|luggage)-/.test(id) ? " data-word-leaf" : ""}>${escape(label)}</button>`).join("")}</div><p id="panel-audio-status" role="status"></p>`,
    );
    $("panel").classList.toggle("seated-panel", Boolean(world()?.seat));
    $("adventure-listen").onclick = () => speech.speak(zh, false, voice);
    speech.speak(zh, false, voice);
    for (const [id, , fn] of buttons) $(id).onclick = fn;
  }
  function flowerQuest() {
    const a = state();
    if (a.flowers === "done")
      return line(
        "小兰",
        "谢谢你！这些花是送给奶奶的。你想给谁送花？",
        "xiè xiè nǐ ！ zhè xiē huā shì sòng gěi nǎi nai de 。 nǐ xiǎng gěi shuí sòng huā ？",
        "Thank you! These flowers are for Grandma. Who would you give flowers to?",
        [],
        "female",
        '<p class="xp-award" role="status">Flowers complete · +60 XP received</p>',
      );
    if (a.flowers === "found")
      return line(
        "小兰",
        "你找到我的花了！谢谢你帮我。",
        "nǐ zhǎo dào wǒ de huā le ！ xiè xiè nǐ bāng wǒ 。",
        "You found my flowers! Thank you for helping.",
        [
          [
            "return-flowers",
            "这是你的花。",
            () => {
              change((a) => {
                if (a.flowers !== "found") return;
                completeQuest(a, { id: "quest:flowers", amount: 60, scene: persistence.state.scene, label: "Flowers" }, {
                  isComplete: a => a.flowers === "done", complete: a => { a.flowers = "done"; },
                });
              });
              panda("帮朋友找回东西，真高兴！");
              flowerQuest();
            },
          ],
        ],
        "female",
      );
    line(
      "小兰",
      "我的花不见了！我刚才去过河那边的石头旁边。你能帮我找找吗？",
      "wǒ de huā bú jiàn le ！ wǒ gāng cái qù guò hé nà biān de shí tou páng biān 。 nǐ néng bāng wǒ zhǎo zhǎo ma ？",
      "My flowers are missing! I was just by the rocks across the canal. Could you help me look for them?",
      [
        [
          a.flowers === "new" ? "accept-flowers" : "continue-flowers",
          a.flowers === "new" ? "我来帮你！" : "我去找找。",
          () => {
            change((a) => {
              if (a.flowers === "new") a.flowers = "accepted";
            });
            $("panel").close();
            line("Panda", "过西边的桥，去大石头旁边找花吧。", "guò xī biān de qiáo ， qù dà shí tou páng biān zhǎo huā ba 。", "Cross the western bridge and look beside the large rock.", [["flowers-guide", "再帮帮我", () => { $("panel").close(); const target = world().destinations().find(o => o.id === "lost-flowers"); if (target) setTimeout(() => world().walkTo(target, true), 0); panda("跟我来，我们一起去找花。"); }]]);
          },
        ],
      ],
      "female",
    );
  }
  function teaQuest(atTable = false) {
    const a = state();
    if (atTable && ["seated", "done"].includes(a.tea)) {
      const table = world().scene.interactables.find(
        (o) => o.id === "tea-table",
      );
      if (table) world().sitAt(table, "tea");
    }
    if (a.tea === "done")
      return line(
        "Tea courtyard",
        "茶真好喝！和你一起喝茶，我很高兴。",
        "chá zhēn hǎo hē ！ hé nǐ yì qǐ hē chá ， wǒ hěn gāo xìng 。",
        "The tea is lovely! I am happy to have tea with you.",
        [],
        voiceForNpc("qiao"),
        '<p class="xp-award" role="status">Tea complete · +60 XP received</p>',
      );
    if (atTable && a.tea === "new")
      return line(
        "茶桌子",
        "桌子上有两只杯子。去找一位想喝茶的朋友吧。小乔就在茶馆门口。",
        "zhuō zi shàng yǒu liǎng zhī bēi zi 。 qù zhǎo yí wèi xiǎng hē chá de péng yǒu ba 。 xiǎo qiáo jiù zài chá guǎn mén kǒu 。",
        "There are two cups on the table. Go and find a friend who would like tea. Qiao is right at the teahouse entrance.",
      );
    if (a.tea === "new")
      return line(
        "小乔",
        "今天不忙，我想和朋友聊聊天。你愿意和我一起喝茶吗？",
        "jīn tiān bù máng ， wǒ xiǎng hé péng yǒu liáo liáo tiān 。 nǐ yuàn yì hé wǒ yì qǐ hē chá ma ？",
        "I am not busy today. I would like to chat with a friend. Would you like to have tea with me?",
        [
          [
            "invite-tea",
            "我们一起喝茶吧。",
            () => {
              change((a) => (a.tea = "invited"));
              $("panel").close();
              panda("小乔同意了！我们一起去茶桌子吧。");
            },
          ],
        ],
        voiceForNpc("qiao"),
      );
    if (a.tea === "invited")
      return line(
        "小乔",
        "我马上过去。我们在花园里的茶桌子旁边见面吧！",
        "wǒ mǎ shàng guò qù 。 wǒ men zài huā yuán lǐ de chá zhuō zi páng biān jiàn miàn ba ！",
        "I will come over right away. Let us meet beside the tea table in the garden!",
        [],
        voiceForNpc("qiao"),
      );
    line(
      "一起喝茶",
      "我来拿杯子。你今天过得怎么样？",
      "wǒ lái ná bēi zi 。 nǐ jīn tiān guò de zěn me yàng ？",
      "I will get the cups. How has your day been?",
      [
        ["tea-happy", "今天很高兴，因为认识了你。", () => finishTea()],
        ["tea-tired", "有一点累，但是喝茶很舒服。", () => finishTea()],
      ],
      voiceForNpc("qiao"),
    );
  }
  function finishTea() {
    change((a) => {
      if (a.tea !== "seated") return;
      completeQuest(a, { id: "quest:tea", amount: 60, scene: persistence.state.scene, label: "Tea" }, {
        isComplete: a => a.tea === "done", complete: a => { a.tea = "done"; },
      });
    });
    panda("一杯茶，让我们更了解朋友。");
    teaQuest(true);
  }
  function hungryQuest() {
    const a = state();
    line(
      "小莲·一起吃火锅",
      a.hungry === "done"
        ? "谢谢你请我吃火锅！你想聊什么？"
        : "我有点饿了。我们一起去吃火锅，好吗？",
      a.hungry === "done"
        ? "xiè xiè nǐ qǐng wǒ chī huǒ guō ！ nǐ xiǎng liáo shén me ？"
        : "Wǒ yǒudiǎn è le. Wǒmen yìqǐ qù chī huǒguō, hǎo ma?",
      a.hungry === "done"
        ? "Thank you for the hotpot! What would you like to talk about?"
        : "I am a little hungry. Shall we go and have hotpot together?",
      a.hungry === "new"
        ? [
            [
              "invite-hotpot",
              "我请你吃火锅吧！",
              () => {
                change((a) => (a.hungry = "invited"));
                $("panel").close();
                panda("小莲同意了！她会跟着我们，去饭店吃火锅吧。");
              },
            ],
          ]
        : [],
      "female",
    );
  }
  function packingList() {
    const options = packingOptions(persistence.state);
    const zh = "你想把什么放进行李箱？";
    openPanel("收拾行李 · Pack your suitcase",
      text(zh, "nǐ xiǎng bǎ shén me fàng jìn xíng li xiāng ？", "What would you like to pack?") +
      `<form id="packing-form"><fieldset><legend>玩具和衣服 · Stuffies and clothes</legend>${options.map(item =>
        `<label class="packing-option" data-word-leaf><input type="checkbox" name="packed-item" value="${escape(item.id)}"> ${escape(item.zh)}${settings().translation ? ` · ${escape(item.en)}` : ""}</label>`).join("")}</fieldset>
      <p class="notice">日用品已经放好了。${settings().translation ? " Your everyday essentials are already inside. Choose any of your collected stuffies and purchased clothes." : ""}</p>
      <div class="small-actions"><button type="submit" class="primary" data-word-leaf>收拾好了，带上行李箱。</button><button type="button" id="packing-cancel" data-word-leaf>等一下</button></div></form>`);
    speech.speak(zh, false, "panda");
    $("packing-cancel").onclick = () => $("panel").close();
    $("packing-form").onsubmit = event => {
      event.preventDefault();
      const items = [...document.querySelectorAll('[name="packed-item"]:checked')].map(input => input.value);
      const luggage = packTravelLuggage(persistence.state, items, world().scene.id);
      change(a => { a.travelLuggage = luggage; });
      line("行李准备好了", "收拾好了！带上行李箱，我们去火车站吧。",
        "shōu shi hǎo le ！ dài shàng xíng li xiāng ， wǒ men qù huǒ chē zhàn ba 。",
        "All packed! Take your suitcase and let's go to the train station.",
        [["packing-done", "走吧！", () => $("panel").close()]]);
    };
  }
  const stationInteract = createStationInteractions({ line, state, change, world, devMode: () => persistence.devMode });
  function interact(o) {
    if (needsStationLuggage(world().scene, o, state())) {
      line("熊猫", luggageReminder, "nǐ hái shi xiān huí jiā ná xíng li ba 。",
        "You'd better go home and get your luggage first.",
        [["luggage-go-home", "好，我先回家。", () => $("panel").close()]]);
      return true;
    }
    if (o.id === "home-suitcase" && world().scene.id === "home" && !state().travelLuggage.packed) {
      line("行李箱", "要收拾行李吗？", "yào shōu shi xíng li ma ？", "Would you like to pack your suitcase?",
        [["packing-start", "好，收拾行李。", packingList], ["packing-later", "等一下。", () => $("panel").close()]]);
      return true;
    }
    if (stationInteract(o)) return true;
    if (o.type === "shop") {
      const a = state(),
        bought = a.purchases.includes(o.id);
      line(
        o.name,
        o.zh,
        o.pinyin,
        o.meaning,
        bought
          ? []
          : [
              [
                "buy-item",
                `买一个 · ¥${o.price}`,
                () => {
                  if (state().coins < o.price) {
                    panda("钱不够，先看看别的吧。");
                    return;
                  }
                  change((a) => {
                    if (a.purchases.includes(o.id)) return;
                    a.coins -= o.price;
                    a.purchases.push(o.id);
                    award(a, 10);
                  });
                  panda(`买好了！${o.item}放进包里了。`);
                  interact(o);
                },
              ],
            ],
        "female",
      );
      const receipt = document.createElement("p");
      receipt.className = "notice";
      receipt.textContent = bought
        ? `✓ ${o.item} · 已经放进包里了。还有 ${a.coins} 元`
        : `还有 ${a.coins} 元`;
      $("panel-content").append(receipt);
      return true;
    }
    if (o.type === "quest") {
      if (o.quest === "tea") {
        teaQuest(true);
        return true;
      }
      if (o.id === "lost-flowers") {
        if (state().flowers === "accepted") {
          change((a) => (a.flowers = "found"));
          panda("找到了！把花还给小兰吧。");
        }
        line(
          "花",
          state().flowers === "found"
            ? "这一定是小兰的花。带回去给她吧。"
            : "石头旁边有几朵花。",
          state().flowers === "found"
            ? "zhè yí dìng shì xiǎo lán de huā 。 dài huí qù gěi tā ba 。"
            : "shí tou páng biān yǒu jǐ duǒ huā 。",
          state().flowers === "found"
            ? "These must be Lan’s flowers. Take them back to her."
            : "A few flowers lie beside the rocks.",
        );
        return true;
      }
    }
    if (o.type === "exhibit") {
      if (!state().exhibits.includes(o.id))
        change((a) => {
          a.exhibits.push(o.id);
          award(a, 15);
        });
      const m = museumObjects[o.id];
      line(m.name, m.zh, m.pinyin, m.meaning, [
        [
          "museum-question",
          "认真看一看",
          () => {
            line(
              m.name,
              "你看到了什么颜色？它像什么？",
              "nǐ kàn dào le shén me yán sè ？ tā xiàng shén me ？",
              "What colors did you notice? What does it look like?",
            );
          },
        ],
      ]);
      $("panel-content").insertAdjacentHTML(
        "beforeend",
        `<p class="notice">Exhibits are illustrated interpretations.<a href="${m.source}" target="_blank" rel="noopener noreferrer">Museum source ↗</a></p>`,
      );
      return true;
    }
    if (o.type === "gate") {
      const board = () => {
        change((a) => { a.boatTaken = true; });
        speech.stop();
        world().changeScene(o.target);
      };
      if (state().boatTaken) {
        board();
        return true;
      }
      const unlocked = persistence.devMode || state().xp >= AREA_XP;
      line(
        "河边的大船",
        persistence.devMode
          ? "上船吧，我们去下一站。"
          : unlocked ? "已经有七百五十分了！上船吧，我们去下一站。"
          : `还差${chineseNumber(AREA_XP - state().xp)}分。先去聊天、帮帮朋友吧。船在这里等你！`,
        persistence.devMode ? "shàng chuán ba ， wǒ men qù xià yí zhàn 。" : unlocked ? "yǐ jīng yǒu qī bǎi wǔ shí fēn le ！ shàng chuán ba ， wǒ men qù xià yí zhàn 。" : "",
        persistence.devMode
          ? "Dev mode: come aboard without the XP requirement."
          : unlocked ? "You have reached 750 XP! Come aboard, and let us go to the next stop."
          : `You need ${AREA_XP - state().xp} more XP. Chat and help your friends first. The boat will wait for you here!`,
        unlocked
          ? [
              [
                "enter-next",
                "上船走",
                () => {
                  // Re-check at boarding, including after a save conflict or state refresh.
                  if (!persistence.devMode && state().xp < AREA_XP) return interact(o);
                  $("panel").close();
                  board();
                },
                "Travel to the next area by boat.",
              ],
            ]
          : [],
      );
      $("panel-content").insertAdjacentHTML(
        "afterbegin",
        `<img class="departure-portrait" src="/assets/optimized/suzhou-passenger-boat.webp" alt="Suzhou boat with red lanterns"/><p class="departure-progress">${Math.min(AREA_XP, state().xp)} / ${AREA_XP} XP · ${persistence.devMode ? "Dev mode · XP requirement bypassed" : unlocked ? "可以走了" : `还差 ${AREA_XP - state().xp} XP`}</p><progress class="departure-meter" max="${AREA_XP}" value="${Math.min(AREA_XP, state().xp)}" aria-label="上船需要的XP"></progress>`,
      );
      return true;
    }
    if (o.type === "hotpot") {
      world().sitAt(o, "hotpot");
      meal = {
        withLian: state().hungry === "dining",
        gift: false,
        phase: "order",
        selected: [],
        cooked: [],
        eaten: [],
        spicy: false,
      };
      hotpot();
      speech.speak($("hotpot-work").querySelector("[data-dialogue]").textContent, false, voiceForNpc("waiter"));
      return true;
    }
    return false;
  }
  function hotpot() {
    close();
    const chosen = hotpotItems.filter((i) => meal.selected.includes(i.id));
    openPanel(
      meal.withLian ? "和小莲一起吃火锅" : "河边火锅",
      `${meal.withLian ? "<div class=\"meal-friend\"><span class=\"seated-lian\" role=\"img\" aria-label=\"Lian 坐在桌子前面\"></span><p class=\"chinese\">我们一起吃吧！</p></div>" : ""}<div class="hotpot-view" data-stage="${meal.phase}"><div class="restaurant-window">Canal restaurant</div>${hotpotItems.map((i) => `<button class="ingredient-hotspot hotspot-${i.id}" data-learn-food="${i.id}" aria-label="听：${i.zh}"><span>${i.zh}</span></button>`).join("")}<div class="hotpot-steam" aria-hidden="true">∿ ∿ ∿</div><div class="hotpot-pot"><div class="broth ${meal.spicy ? "spicy" : ""}">${meal.cooked.map((id) => `<button class="food-piece food-${id}" data-eat="${id}" aria-label="吃${hotpotItems.find((i) => i.id === id).zh}">${hotpotItems.find((i) => i.id === id).zh}</button>`).join("")}</div></div><div class="hotpot-bowl" aria-label="我的碗">${meal.eaten.length ? "吃过" + meal.eaten.length + "口" : "我的碗"}</div></div><output id="food-name" aria-live="polite" hidden></output><div id="hotpot-work"></div><p id="mic-status" role="status"></p><p id="panel-audio-status" role="status"></p>`,
    );
    document.querySelectorAll("[data-learn-food]").forEach(
      (b) =>
        (b.onclick = () => {
          const item = hotpotItems.find((i) => i.id === b.dataset.learnFood);
          $("food-name").hidden = false;
          $("food-name").textContent =
            item.zh + " · " + item.pinyin + " · " + item.en;
          speech.speak(item.zh, false, "panda");
        }),
    );
    const work = $("hotpot-work");
    if (meal.phase === "order") {
      work.innerHTML =
        text(
          "你好！你想吃什么？",
          "nǐ hǎo ！ nǐ xiǎng chī shén me ？",
          "Hello! What would you like to eat?",
        ) +
        `<p class="notice"><strong>Instructions:</strong> Choose ingredients or type your order below.</p><div class="ingredients">${hotpotItems.map((i) => `<button data-ingredient="${i.id}" aria-pressed="${meal.selected.includes(i.id)}">${i.zh}${settings().pinyin ? `<small>${i.pinyin}</small>` : ""}${settings().translation ? `<small>${i.en}</small>` : ""}</button>`).join("")}</div><label for="hotpot-order">我要吃什么</label><textarea id="hotpot-order" rows="2" maxlength="300" placeholder="我要豆腐和菜。">${escape(meal.order || "")}</textarea><div class="small-actions"><button id="hotpot-mic">🎙 说说要吃什么</button><button id="hotpot-read">听一听</button><button id="hotpot-review" class="primary">看看我要吃什么</button></div><p class="notice">Microphone recording lasts up to 15 seconds. Audio is transcribed on your game computer and discarded.${settings().translation ? "Microphone audio is transcribed on your game PC and discarded. Review it before ordering." : ""}</p>`;
      document.querySelectorAll("[data-ingredient]").forEach(
        (b) =>
          (b.onclick = () => {
            const id = b.dataset.ingredient;
            const ingredient = hotpotItems.find((i) => i.id === id);

            meal.selected = meal.selected.includes(id)
              ? meal.selected.filter((x) => x !== id)
              : [...meal.selected, id];
            meal.order =
              "我要" +
              hotpotItems
                .filter((i) => meal.selected.includes(i.id))
                .map((i) => i.zh)
                .join("和") +
              "。";
            hotpot();
            if (ingredient) speech.speak(ingredient.zh, false, "panda");
          }),
      );
      $("hotpot-read").onclick = () =>
        speech.speak("我要豆腐、菜和蘑菇。不要辣。", false, "panda");
      $("hotpot-review").onclick = () => {
        meal.order = $("hotpot-order").value.trim();
        meal.selected = parseOrder(meal.order);
        meal.spicy = !/不.*辣/.test(meal.order) && /辣/.test(meal.order);
        if (!meal.selected.length) {
          $("mic-status").textContent =
            "请说出菜单上的一种吃的，或者点一下，选择你想吃的。";
          return;
        }
        meal.phase = "review";
        hotpot();
      };
      $("hotpot-mic").onclick = record;
    } else if (meal.phase === "review") {
      work.innerHTML =
        text(
          "您要这些，对吗？",
          "nín yào zhè xiē ， duì ma ？",
          "Is this your order?",
        ) +
        `<p class="chinese">${chosen.map((i) => i.zh).join("、")} · ${meal.spicy ? "辣汤底" : "不辣汤底"}</p><div class="small-actions"><button id="hotpot-edit">换一下</button><button class="primary" id="hotpot-confirm">对，谢谢！</button></div>`;
      $("hotpot-edit").onclick = () => {
        meal.phase = "order";
        hotpot();
      };
      $("hotpot-confirm").onclick = () => {
        meal.phase = "serve";
        hotpot();
        speech.speak($("hotpot-work").querySelector("[data-dialogue]").textContent, false, voiceForNpc("waiter"));
      };
    } else if (meal.phase === "serve") {
      work.innerHTML =
        text(
          "菜来了！",
          "cài lái le ！",
          "Your ingredients have arrived!",
        ) +
        `<p class="notice"><strong>Instructions:</strong> Put ingredients in the pot, then tap them to taste.</p><div class="ingredients serving-tray">${chosen
          .filter(
            (i) => !meal.cooked.includes(i.id) && !meal.eaten.includes(i.id),
          )
          .map((i) => `<button data-cook="${i.id}">把${i.zh}放进锅里</button>`)
          .join(
            "",
          )}</div><details class="hotpot-grammar"><summary>把东西放在哪里？</summary><p class="chinese">把豆腐放进锅里。把菜放进碗里。</p><p lang="en">Use 把 + the thing + what you do to it + where it goes. 放进 means “put into”; 了 marks the completed action.</p></details><p class="notice">点一下火锅里的东西，尝一口。${settings().translation ? "Tap an ingredient in the pot to taste it." : ""}</p>`;
      document.querySelectorAll("[data-cook]").forEach(
        (b) =>
          (b.onclick = () => {
            const item = hotpotItems.find((i) => i.id === b.dataset.cook);
            meal.cooked.push(item.id);
            hotpot();
            const sentence = `我把${item.zh}放进锅里了。`;
            $("food-name").hidden = false;
          $("food-name").textContent = sentence;
            speech.speak(sentence, false, "panda");
          }),
      );
      document.querySelectorAll("[data-eat]").forEach(
        (b) =>
          (b.onclick = () => {
            const id = b.dataset.eat;
            if (meal.phase !== "serve" || !meal.cooked.includes(id) || meal.eaten.includes(id)) return;
            meal.cooked = meal.cooked.filter((x) => x !== id);
            meal.eaten.push(id);
            const eatenLine = `我把${hotpotItems.find((i) => i.id === id).zh}放进碗里，尝了一口。`;
            if (meal.eaten.length === meal.selected.length) {
              meal.phase = "done";
              change((a) => {
                a.meals = Math.min(1000000, a.meals + 1);
                award(a, 25);
                if (a.hungry === "dining") {
                  a.hungry = "done";
                  meal.gift = true;
                  award(a, 60);
                }
              });
              if (!meal.gift) panda("你用中文点了吃的东西！");
            }
            hotpot();
            if (meal.phase !== "done") {
              $("food-name").hidden = false;
          $("food-name").textContent = eatenLine;
              speech.speak(eatenLine, false, "panda");
            }
          }),
      );
    } else {
      work.innerHTML = meal.gift
        ? `<div class="gift-reward"><img src="/assets/optimized/sheep-gift.webp" alt="小莲送的羊" />${text("谢谢你请我吃火锅！这只羊送给你。", "xiè xiè nǐ qǐng wǒ chī huǒ guō ！ zhè zhī yáng sòng gěi nǐ 。", "Thank you for treating me to hotpot! This little sheep is for you.")}${pandaSpeaker}<p class="notice">把羊放在家里吧。看到它，就会记得和小莲一起吃东西的这一天。</p><button id="gift-thanks">谢谢你，小莲！</button><p class="xp-award">羊放在家里了 · +85 XP</p></div>`
        : text(
            "吃饱了！真好吃。",
            "chī bǎo le ！ zhēn hǎo chī 。",
            "I am full! That was delicious.",
          ) + "<p class=\"xp-award\">+25 XP</p>";
      if (meal.gift) {
        speech.speak("谢谢你请我吃火锅！这只羊送给你。", false, "female");
        $("gift-thanks").onclick = () => {
          line(
            "熊猫·羊的新家",
            "这只羊真可爱！我们把它放在家里吧。",
            "zhè zhī yáng zhēn kě ài ！ wǒ men bǎ tā fàng zài jiā lǐ ba 。",
            "This sheep is so cute! Let us put it in our home.",
            [["gift-finish", "好！", () => $("panel").close()]],
          );
        };
      }
    }
  }
  async function record() {
    if (recorder?.state === "recording") {
      recorder.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      $("mic-status").textContent =
        "This browser cannot record audio. Open the game over HTTPS, or type your order.";
      return;
    }
    speech.stop();
    const token = ++generation;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (token !== generation) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const chunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        onRecording(false);
        clearTimeout(recordTimer);
        stream?.getTracks().forEach((t) => t.stop());
        stream = null;
        if (token !== generation || !$("hotpot-order")) return;
        $("hotpot-mic").disabled = true;
        $("hotpot-mic").textContent = "Transcribing…";
        try {
          const blob = new Blob(chunks, { type: recorder.mimeType });
          if (blob.size > 2000000)
            throw Error("Recording too large. Try a shorter order.");
          const audio = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          abort = new AbortController();
          const result = await api(
            "/api/transcribe",
            { audio },
            AbortSignal.any([abort.signal, AbortSignal.timeout(60000)]),
          );
          if (token !== generation || !$("hotpot-order")) return;
          $("hotpot-order").value = result.text;
          meal.order = result.text;
          $("mic-status").textContent = result.text
            ? "看看字对不对，可以换一下，再点菜。"
            : "没有听清楚，请再试一次，或者打字。";
        } catch (e) {
          if (token === generation && $("mic-status"))
            $("mic-status").textContent = e.message;
        } finally {
          if (token === generation && $("hotpot-mic")) {
            $("hotpot-mic").disabled = false;
            $("hotpot-mic").textContent = "🎙再说一次";
          }
        }
      };
      onRecording(true);
      recorder.start();
      $("hotpot-mic").textContent = "■说完了";
      $("mic-status").textContent = "正在听…";
      recordTimer = setTimeout(() => {
        if (recorder?.state === "recording") recorder.stop();
      }, 15000);
    } catch (e) {
      stream?.getTracks().forEach((t) => t.stop());
      if ($("mic-status"))
        $("mic-status").textContent =
          "Microphone access is blocked. Type your order, or allow microphone access in your browser settings.";
    }
  }
  function close() {
    onRecording(false);
    generation++;
    abort?.abort();
    clearTimeout(recordTimer);
    if (recorder?.state === "recording") recorder.stop();
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  return {
    interact,
    flowerQuest,
    hungryQuest,
    teaQuest,
    close,
  };
}
