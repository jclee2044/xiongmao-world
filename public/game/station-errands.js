import {
  acceptsDirections,
  errandActors,
  finishErrand,
} from "../data/station-errands.js";
import {
  completionText,
  beginInteraction,
  answerInteraction,
} from "../data/rewards.js";
import { pandaSpeaker } from "./coach-questions.js";
import { voiceForNpc } from "../data/voices.js";
const $ = (id) => document.getElementById(id);
export function createStationErrands({
  persistence,
  world,
  openPanel,
  speech,
  panda,
  refresh,
}) {
  const state = () => persistence.state.adventure;
  const change = (fn) => {
    persistence.change((s) => fn(s.adventure));
    refresh();
  };
  const close = () => $("panel").close();
  const say = (text, voice = "panda") => speech.speak(text, false, voice);
  function complete(key) {
    let result;
    change((a) => {
      result = finishErrand(a, key, world().scene.id);
    });
    if (result)
      panda(
        `谢谢你！${{ water: "热水送到了", rest: "可以休息了", bathroom: "找到洗手间了", security: "我知道怎么过安检了", trash: "垃圾放好了" }[key]}。`,
      );
    if (result?.gained && ["rest", "bathroom"].includes(key)) {
      const zh =
        key === "rest"
          ? "谢谢！在这里休息一下，舒服多了。"
          : "谢谢你！我找到洗手间了。";
      openPanel(
        "谢谢你！",
        `<p class="chinese">${zh}</p><p class="xp-award" role="status">${completionText(result)}</p>`,
      );
      say(zh, voiceForNpc(errandActors[key]));
    }
    return result;
  }
  function show(key) {
    const scene = world().scene.id,
      status = state().stationErrands[key],
      npc = errandActors[key];
    let encounter;
    change((a) => {
      encounter = beginInteraction(a, npc, scene);
    });
    const lines = {
      water:
        status === "carrying"
          ? "你帮我拿到热水了吗？"
          : "我很渴。你能帮我拿一杯热水吗？",
      rest: "我有点紧张，想休息一下。你能带我去按摩椅吗？",
      bathroom: "我想去洗手间。你能告诉我怎么走吗？",
      security: "护照和行李要怎么检查？请告诉我。",
      trash: "我手里有垃圾。你能带我去垃圾桶吗？",
    };
    const zh = status === "done" ? "谢谢你帮忙！" : lines[key];
    const meanings = {
      water:
        status === "carrying"
          ? "Did you get the hot water?"
          : "I am very thirsty. Could you bring me a cup of hot water?",
      rest: "I feel stressed and want to rest. Could you take me to the massage chairs?",
      bathroom: "I need the bathroom. Could you tell me the way?",
      security: "How do the passport and luggage checks work? Please tell me.",
      trash: "I have some trash. Could you take me to the trash can?",
    };
    const readings = {
      water:
        status === "carrying"
          ? "nǐ bāng wǒ ná dào rè shuǐ le ma ？"
          : "wǒ hěn kě 。 nǐ néng bāng wǒ ná yì bēi rè shuǐ ma ？",
      rest: "wǒ yǒu diǎn jǐn zhāng ， xiǎng xiū xi yí xià 。 nǐ néng dài wǒ qù àn mó yǐ ma ？",
      bathroom:
        "wǒ xiǎng qù xǐ shǒu jiān 。 nǐ néng gào su wǒ zěn me zǒu ma ？",
      security: "hù zhào hé xíng li yào zěn me jiǎn chá ？ qǐng gào su wǒ 。",
      trash: "wǒ shǒu lǐ yǒu lā jī 。 nǐ néng dài wǒ qù lā jī tǒng ma ？",
    };
    const settings = persistence.state.settings;
    const helpText =
      status === "done"
        ? ""
        : `${settings.pinyin ? `<p class="pinyin">${readings[key]}</p>` : ""}${settings.translation ? `<p class="meaning">${meanings[key]}</p>` : ""}`;
    const textOnly = ["bathroom", "security"].includes(key);
    openPanel(
      {
        water: "送热水",
        rest: "休息一下",
        bathroom: "帮佳妮找洗手间",
        security: "进站检查",
        trash: "找垃圾桶",
      }[key],
      `<p class="chinese" data-dialogue data-dialogue-variation="fixed">${zh}</p>${helpText}${status === "done" ? '<p class="xp-award">Completed · reward already received</p>' : textOnly ? '<form id="errand-form"><label for="errand-answer">你的回答 · Your directions</label><textarea id="errand-answer" maxlength="400" rows="3"></textarea><button type="submit" class="primary">说好了 · Send</button></form><p id="errand-feedback" role="status"></p>' : `<button id="errand-action" class="primary">${key === "water" && status === "carrying" ? "给你热水。" : "我来帮你。"}</button>`}<button id="errand-hint">问 Panda</button>`,
    );
    say(zh, voiceForNpc(npc));
    $("errand-hint").onclick = () => {
      const hint = {
        water: "去左边的热水旁边接一杯水，再送回来。",
        rest: "按摩椅在左边。带他一起去吧。",
        bathroom: "看看左边的标志。洗手间在问询处旁边。",
        security: "先出示护照和车票，再把行李放到安检传送带上。",
        trash: "垃圾桶在站台楼梯旁边。",
      }[key];
      $("panel-content").insertAdjacentHTML(
        "beforeend",
        pandaSpeaker + `<p class="chinese">${hint}</p>`,
      );
      say(hint);
    };
    if (status === "done") return;
    const answer = () => change((a) => answerInteraction(a, encounter));
    if (textOnly)
      $("errand-form").onsubmit = (e) => {
        e.preventDefault();
        if (
          world().scene.id !== scene ||
          state().stationErrands[key] === "done"
        )
          return;
        if (!acceptsDirections(key, $("errand-answer").value)) {
          $("errand-feedback").textContent =
            "请再说清楚一点。 · Please give clear directions.";
          return;
        }
        answer();
        if (key === "bathroom") {
          change((a) => {
            a.stationErrands.bathroom = "walking";
          });
          close();
          panda("佳妮知道了！她去洗手间了。");
        } else {
          const result = complete(key);
          openPanel(
            "谢谢你！",
            `<p class="chinese">谢谢！我知道怎么检查护照和行李了。</p><p class="xp-award">${completionText(result)}</p>`,
          );
          say("谢谢！我知道怎么检查护照和行李了。", voiceForNpc(npc));
        }
      };
    if (!textOnly)
      $("errand-action").onclick = () => {
        if (
          world().scene.id !== scene ||
          state().stationErrands[key] === "done"
        )
          return;
        answer();
        if (key === "water" && status === "carrying") {
          const result = complete(key);
          openPanel(
            "谢谢你！",
            `<p class="chinese">谢谢你给我热水！</p><p class="xp-award">${completionText(result)}</p>`,
          );
          say("谢谢你给我热水！", voiceForNpc(npc));
        } else {
          change((a) => {
            a.stationErrands[key] = key === "rest" ? "escort" : "accepted";
          });
          close();
          panda(
            key === "rest"
              ? "他跟着我们了。一起去按摩椅吧。"
              : key === "water"
                ? "去左边接热水，再送回来吧。"
                : "去楼梯旁边的垃圾桶吧。",
          );
        }
      };
  }
  function interact(o) {
    const scene = world().scene.id,
      q = state().stationErrands;
    if (
      scene === "station-waiting" &&
      o.id === "station-hot-water" &&
      q.water === "accepted"
    ) {
      change((a) => {
        a.stationErrands.water = "carrying";
      });
      openPanel(
        "热水",
        `${pandaSpeaker}<p class="chinese">接好热水了，小心烫。送给美芳吧。</p>`,
      );
      say("接好热水了，小心烫。送给美芳吧。");
      return true;
    }
    if (
      scene === "station-platform" &&
      o.id === "platform-trash-bin" &&
      q.trash === "accepted"
    ) {
      const result = complete("trash");
      openPanel(
        "谢谢你！",
        `<p class="chinese">垃圾放好了！谢谢你帮我找到垃圾桶。</p><p class="xp-award">${completionText(result)}</p>`,
      );
      say(
        "垃圾放好了！谢谢你帮我找到垃圾桶。",
        voiceForNpc(errandActors.trash),
      );
      return true;
    }
    return false;
  }
  function offer(id) {
    return Object.keys(errandActors).find(
      (k) =>
        errandActors[k] === id &&
        state().stationErrands[k] !== "done" &&
        world().scene.id ===
          (k === "trash"
            ? "station-platform"
            : k === "security"
              ? "station-ticketing"
              : "station-waiting") &&
        (k !== "security" || state().stationJourney.visitedWaiting),
    );
  }
  return { show, interact, offer, complete };
}
