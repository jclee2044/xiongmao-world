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
    `<p class="chinese" lang="zh-CN">${escape(zh)}</p>${settings().pinyin ? `<p class="pinyin">${escape(pinyin)}</p>` : ""}${settings().translation ? `<p class="meaning">${escape(meaning)}</p>` : ""}`;
  function line(title, zh, pinyin, meaning, buttons = [], voice = "male") {
    openPanel(
      title,
      text(zh, pinyin, meaning) +
        `<div class="small-actions"><button id="adventure-listen">听一听</button>${buttons.map(([id, label]) => `<button id="${id}" class="primary">${escape(label)}</button>`).join("")}</div><p id="panel-audio-status" role="status"></p>`,
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
        "兰",
        "谢谢你！这些花是送给奶奶的。你想给谁送花？",
        "Xièxie nǐ! Zhèxiē huā shì sòng gěi nǎinai de. Nǐ xiǎng gěi shéi sòng huā?",
        "Thank you! These flowers are for Grandma. Who would you give flowers to?",
        [],
        "female",
      );
    if (a.flowers === "found")
      return line(
        "兰",
        "你找到我的花了！谢谢你帮我。",
        "Nǐ zhǎodào wǒ de huā le! Xièxie nǐ bāng wǒ.",
        "You found my flowers! Thank you for helping.",
        [
          [
            "return-flowers",
            "这是你的花。",
            () => {
              change((a) => {
                if (a.flowers !== "found") return;
                a.flowers = "done";
                award(a, 60);
              });
              panda("帮朋友找回东西，真开心！");
              flowerQuest();
            },
          ],
        ],
        "female",
      );
    line(
      "兰",
      "糟了，我的花掉了！我刚才去过河对岸的假山。你能帮我找找吗？",
      "Zāo le, wǒ de huā diào le! Wǒ gāngcái qùguo hé duìàn de jiǎshān. Nǐ néng bāng wǒ zhǎozhao ma?",
      "I dropped my flowers! I was near the rockery across the canal. Could you look for them?",
      [
        [
          a.flowers === "new" ? "accept-flowers" : "continue-flowers",
          a.flowers === "new" ? "我来帮你！" : "我去找找。",
          () => {
            change((a) => {
              if (a.flowers === "new") a.flowers = "accepted";
            });
            $("panel").close();
            panda("过桥，去假山旁边找一找吧。");
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
        "茶院",
        "茶真好喝！和你一起喝茶，我很开心。",
        "Chá zhēn hǎo hē! Hé nǐ yìqǐ hē chá, wǒ hěn kāixīn.",
        "The tea is lovely! I am happy to have tea with you.",
        [],
        "female",
      );
    if (atTable && a.tea === "new")
      return line(
        "茶桌",
        "桌上有两只杯子。去找一位想喝茶的朋友吧。乔就在茶馆门口。",
        "Zhuō shàng yǒu liǎng zhī bēizi. Qù zhǎo yí wèi xiǎng hē chá de péngyou ba. Qiáo jiù zài cháguǎn ménkǒu.",
        "Two cups are waiting. Find someone who wants tea; Qiao is at the teahouse.",
      );
    if (a.tea === "new")
      return line(
        "乔",
        "今天不忙，有点无聊。你想和我一起喝茶吗？",
        "Jīntiān bù máng, yǒudiǎn wúliáo. Nǐ xiǎng hé wǒ yìqǐ hē chá ma?",
        "It is quiet today. I am a little bored. Would you have tea with me?",
        [
          [
            "invite-tea",
            "我们一起喝茶吧。",
            () => {
              change((a) => (a.tea = "invited"));
              $("panel").close();
              panda("乔答应了！我们一起去茶桌吧。");
            },
          ],
        ],
        "female",
      );
    if (a.tea === "invited")
      return line(
        "乔",
        "我这就过去。我们在院子里的茶桌见！",
        "Wǒ zhè jiù guòqu. Wǒmen zài yuànzi lǐ de cházhuō jiàn!",
        "I am on my way. Meet me at the courtyard tea table!",
        [],
        "female",
      );
    line(
      "一起喝茶",
      "你来倒茶，我来拿杯子。你今天过得怎么样？",
      "Nǐ lái dào chá, wǒ lái ná bēizi. Nǐ jīntiān guò de zěnmeyàng?",
      "You pour; I will take the cups. How was your day?",
      [
        ["tea-happy", "今天很开心，因为认识了你。", () => finishTea()],
        ["tea-tired", "有一点累，不过喝茶很舒服。", () => finishTea()],
      ],
      "female",
    );
  }
  function finishTea() {
    change((a) => {
      if (a.tea !== "seated") return;
      a.tea = "done";
      award(a, 60);
    });
    panda("一杯茶，让我们更了解彼此。");
    teaQuest(true);
  }
  function hungryQuest() {
    const a = state();
    line(
      "莲 · 一起吃火锅",
      a.hungry === "done"
        ? "谢谢你请我吃火锅！小羊在你家里。"
        : "我有点饿了。我们一起去吃火锅，好吗？",
      a.hungry === "done"
        ? "Xièxie nǐ qǐng wǒ chī huǒguō! Xiǎoyáng zài nǐ jiālǐ."
        : "Wǒ yǒudiǎn è le. Wǒmen yìqǐ qù chī huǒguō, hǎo ma?",
      a.hungry === "done"
        ? "Thank you for treating me to hotpot! Your stuffed sheep is at home."
        : "I am hungry. Shall we have hotpot together?",
      a.hungry === "new"
        ? [
            [
              "invite-hotpot",
              "我请你吃火锅吧！",
              () => {
                change((a) => (a.hungry = "invited"));
                $("panel").close();
                panda("莲答应了！她会跟着我们，去面馆吃火锅吧。");
              },
            ],
          ]
        : [],
      "female",
    );
  }
  function interact(o) {
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
                    panda("零钱不够了，先看看别的吧。");
                    return;
                  }
                  change((a) => {
                    if (a.purchases.includes(o.id)) return;
                    a.coins -= o.price;
                    a.purchases.push(o.id);
                    award(a, 10);
                  });
                  panda(`买好了！${o.item}放进旅行袋了。`);
                  interact(o);
                },
              ],
            ],
        "female",
      );
      const receipt = document.createElement("p");
      receipt.className = "notice";
      receipt.textContent = bought
        ? `✓ ${o.item} · In your travel bag. ¥${a.coins} remaining`
        : `¥${a.coins} in your purse`;
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
          panda("找到了！把花还给兰吧。");
        }
        line(
          "花束",
          state().flowers === "found"
            ? "这一定是兰的花。带回去给她吧。"
            : "几朵花藏在石头旁边。",
          state().flowers === "found"
            ? "Zhè yídìng shì Lán de huā. Dài huíqu gěi tā ba."
            : "Jǐ duǒ huā cáng zài shítou pángbiān.",
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
          "仔细看一看",
          () => {
            line(
              m.name,
              "你看到了什么颜色？它的形状像什么？",
              "Nǐ kàndàole shénme yánsè? Tā de xíngzhuàng xiàng shénme?",
              "Which colors do you see? What does its shape remind you of?",
            );
          },
        ],
      ]);
      $("panel-content").insertAdjacentHTML(
        "beforeend",
        `<p class="notice">展品为绘本示意图。<a href="${m.source}" target="_blank" rel="noopener noreferrer">馆藏与历史资料 ↗</a></p>`,
      );
      return true;
    }
    if (o.type === "gate") {
      const unlocked = state().xp >= AREA_XP;
      line(
        "游船码头 · Departure boat",
        unlocked
          ? "经验满了！上船吧，我们去下一站。"
          : `还差${AREA_XP - state().xp}点经验。先去聊聊天、帮帮朋友吧。船在这里等你！`,
        unlocked ? "Jīngyàn mǎn le! Shàng chuán ba, wǒmen qù xià yí zhàn." : "",
        unlocked
          ? "Your XP is full. Board the boat for the next stop. You can return to Suzhou afterward."
          : `The boat leaves once you reach ${AREA_XP} XP. Keep chatting, exploring and helping your neighbors.`,
        unlocked
          ? [
              [
                "enter-next",
                "上船出发 · Board the boat",
                () => {
                  // Re-check at boarding, including after a save conflict or state refresh.
                  if (state().xp < AREA_XP) return interact(o);
                  $("panel").close();
                  speech.stop();
                  world().changeScene(o.target);
                  panda("出发啦！我们一起去看看吧。");
                },
              ],
            ]
          : [],
      );
      $("panel-content").insertAdjacentHTML(
        "afterbegin",
        `<img class="departure-portrait" src="/assets/world/suzhou-passenger-boat.png" alt="A covered wooden Suzhou passenger boat with red lanterns"/><p class="departure-progress">${Math.min(AREA_XP, state().xp)} / ${AREA_XP} XP · ${unlocked ? "Ready to sail" : `${AREA_XP - state().xp} XP to go`}</p><progress class="departure-meter" max="${AREA_XP}" value="${Math.min(AREA_XP, state().xp)}" aria-label="Departure experience"></progress>`,
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
      speech.speak("欢迎！请坐。你想吃什么？", false, "male");
      return true;
    }
    return false;
  }
  function hotpot() {
    close();
    const chosen = hotpotItems.filter((i) => meal.selected.includes(i.id));
    openPanel(
      meal.withLian ? "和莲一起吃火锅 · Seated with Lian" : "河畔火锅",
      `${meal.withLian ? '<div class="meal-friend"><span class="seated-lian" role="img" aria-label="Lian sitting across the table"></span><p class="chinese">我们一起吃吧！</p></div>' : ""}<div class="hotpot-view" data-stage="${meal.phase}"><div class="restaurant-window">河畔面馆</div>${hotpotItems.map((i) => `<button class="ingredient-hotspot hotspot-${i.id}" data-learn-food="${i.id}" aria-label="听：${i.zh}"><span>${i.zh}</span></button>`).join("")}<output id="food-name" aria-live="polite"></output><div class="hotpot-steam" aria-hidden="true">∿ ∿ ∿</div><div class="hotpot-pot"><div class="broth ${meal.spicy ? "spicy" : ""}">${meal.cooked.map((id) => `<button class="food-piece food-${id}" data-eat="${id}" aria-label="吃${hotpotItems.find((i) => i.id === id).zh}">${hotpotItems.find((i) => i.id === id).zh}</button>`).join("")}</div></div><div class="hotpot-bowl" aria-label="Your bowl">${meal.eaten.length ? "吃过 " + meal.eaten.length + " 口" : "我的碗"}</div></div><div id="hotpot-work"></div><p id="mic-status" role="status"></p><p id="panel-audio-status" role="status"></p>`,
    );
    document.querySelectorAll("[data-learn-food]").forEach(
      (b) =>
        (b.onclick = () => {
          const item = hotpotItems.find((i) => i.id === b.dataset.learnFood);
          $("food-name").textContent =
            item.zh + " · " + item.pinyin + " · " + item.en;
          speech.speak(item.zh);
        }),
    );
    const work = $("hotpot-work");
    if (meal.phase === "order") {
      work.innerHTML =
        text(
          "你好！你想吃什么？请说：我要……。",
          "Nǐ hǎo! Nǐ xiǎng chī shénme? Qǐng shuō: wǒ yào…",
          "What would you like? Say: I would like…",
        ) +
        `<div class="ingredients">${hotpotItems.map((i) => `<button data-ingredient="${i.id}" aria-pressed="${meal.selected.includes(i.id)}">${i.zh}${settings().pinyin ? `<small>${i.pinyin}</small>` : ""}${settings().translation ? `<small>${i.en}</small>` : ""}</button>`).join("")}</div><label for="hotpot-order">我的点单</label><textarea id="hotpot-order" rows="2" maxlength="300" placeholder="我要豆腐和青菜。">${escape(meal.order || "")}</textarea><div class="small-actions"><button id="hotpot-mic">🎙 说话点单</button><button id="hotpot-read">听示范</button><button id="hotpot-review" class="primary">看看我的点单</button></div><p class="notice">麦克风录音最多15秒，只发送到你的游戏电脑识别，不保存录音。${settings().translation ? "Microphone audio is transcribed on your game PC and discarded. Review it before ordering." : ""}</p>`;
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
            if (ingredient) speech.speak(ingredient.zh);
          }),
      );
      $("hotpot-read").onclick = () =>
        speech.speak("我要豆腐、青菜和蘑菇。不要辣。");
      $("hotpot-review").onclick = () => {
        meal.order = $("hotpot-order").value.trim();
        meal.selected = parseOrder(meal.order);
        meal.spicy = !/不.*辣/.test(meal.order) && /辣/.test(meal.order);
        if (!meal.selected.length) {
          $("mic-status").textContent =
            "请说出菜单上的一种食材，或者点选食材。";
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
          "Nín yào zhèxiē, duì ma?",
          "Is this your order?",
        ) +
        `<p class="chinese">${chosen.map((i) => i.zh).join("、")} · ${meal.spicy ? "辣汤" : "清汤"}</p><div class="small-actions"><button id="hotpot-edit">改一下</button><button class="primary" id="hotpot-confirm">对，谢谢！</button></div>`;
      $("hotpot-edit").onclick = () => {
        meal.phase = "order";
        hotpot();
      };
      $("hotpot-confirm").onclick = () => {
        meal.phase = "serve";
        hotpot();
        speech.speak("好的，请稍等。菜来了！");
      };
    } else if (meal.phase === "serve") {
      work.innerHTML =
        text(
          "菜来了！把食材放进锅里吧。",
          "Cài lái le! Bǎ shícái fàng jìn guō lǐ ba.",
          "Your ingredients have arrived. Put them in the pot.",
        ) +
        `<div class="ingredients serving-tray">${chosen
          .filter(
            (i) => !meal.cooked.includes(i.id) && !meal.eaten.includes(i.id),
          )
          .map((i) => `<button data-cook="${i.id}">放入${i.zh}</button>`)
          .join(
            "",
          )}</div><p class="notice">点锅里的食材尝一口。${settings().translation ? "Tap an ingredient in the pot to taste it." : ""}</p>`;
      document.querySelectorAll("[data-cook]").forEach(
        (b) =>
          (b.onclick = () => {
            meal.cooked.push(b.dataset.cook);
            hotpot();
          }),
      );
      document.querySelectorAll("[data-eat]").forEach(
        (b) =>
          (b.onclick = () => {
            const id = b.dataset.eat;
            meal.cooked = meal.cooked.filter((x) => x !== id);
            meal.eaten.push(id);
            speech.speak(`${hotpotItems.find((i) => i.id === id).zh}很好吃。`);
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
              panda(
                state().hungry === "done"
                  ? "小羊真可爱！我们把它放在家里吧。"
                  : "你用中文点了一顿饭！",
              );
            }
            hotpot();
          }),
      );
    } else {
      work.innerHTML = meal.gift
        ? `<div class="gift-reward"><img src="/assets/world/sheep-gift.png" alt="A stuffed sheep from Lian" />${text("谢谢你请我吃火锅！这只小羊送给你。", "Xièxie nǐ qǐng wǒ chī huǒguō! Zhè zhī xiǎoyáng sòng gěi nǐ.", "Thank you for treating me to hotpot! This little sheep is for you.")}<p class="notice">Panda: We can keep it at our house. It will remember this meal with Lian.</p><button id="gift-thanks">谢谢你，莲！</button><p class="xp-award">Sheep keepsake · Saved at home · +85 XP</p></div>`
        : text(
            "吃饱了！真好吃。",
            "Chī bǎo le! Zhēn hǎochī.",
            "I am full! That was delicious.",
          ) + '<p class="xp-award">+25 XP</p>';
      if (meal.gift) {
        speech.speak("谢谢你请我吃火锅！这只小羊送给你。", false, "female");
        $("gift-thanks").onclick = () => {
          line(
            "熊猫 · 小羊的新家",
            "小羊真可爱！我们把它放在家里吧。",
            "Xiǎoyáng zhēn kě’ài! Wǒmen bǎ tā fàng zài jiālǐ ba.",
            "What a sweet sheep! We can keep it at our house.",
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
        "此浏览器不能录音。请在HTTPS安装版打开，或直接输入。";
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
        $("hotpot-mic").textContent = "正在识别…";
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
            ? "看看文字对不对，可以修改后再点单。"
            : "没有听清，请再试一次，或者输入。";
        } catch (e) {
          if (token === generation && $("mic-status"))
            $("mic-status").textContent = e.message;
        } finally {
          if (token === generation && $("hotpot-mic")) {
            $("hotpot-mic").disabled = false;
            $("hotpot-mic").textContent = "🎙 再说一次";
          }
        }
      };
      onRecording(true);
      recorder.start();
      $("hotpot-mic").textContent = "■ 说完了";
      $("mic-status").textContent = "正在听…";
      recordTimer = setTimeout(() => {
        if (recorder?.state === "recording") recorder.stop();
      }, 15000);
    } catch (e) {
      stream?.getTracks().forEach((t) => t.stop());
      if ($("mic-status"))
        $("mic-status").textContent =
          "没有获得麦克风权限。可以直接输入，或在浏览器设置中允许录音。";
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
    conversation() {
      change((a) => {
        a.conversations = Math.min(1000000, a.conversations + 1);
        award(a, 10);
      });
    },
  };
}
