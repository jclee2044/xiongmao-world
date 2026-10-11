import { trainProgress } from "../data/rewards.js";
import { stationJourneyAction, stationBoardingProgress, STATION_BOARDING_XP } from "../data/station-journey.js";

// Uses the same speech, pinyin, translation and word-help panel as other quests.
// Guided counter dialogue makes the booking explicit and never invents a fare.
export function createStationInteractions({ line, state, change, world }) {
  const journey = () => state().stationJourney;
  const act = (action) => {
    change((a) => { a.stationJourney = stationJourneyAction(a.stationJourney, action, a.xp, false, a.rewards?.platformXP || 0); });
    world()?.syncStationInterior();
  };
  let upstairsRequest = null;
  const close = () => document.getElementById("panel").close();
  const walk = (id) => {
    const target = world().scene.interactables.find(o => o.id === id);
    close();
    // Dialog closing unpauses the world and clears its old route first.
    setTimeout(() => { if (target && world().scene.id === "station-ticketing") world().walkTo(target, true); }, 0);
  };
  const say = (title, zh, py, en, actions = [], voice = "female-kokoro-026") => line(title, zh, py, en, actions, voice);
  const booked = () => say("去上海 · Shanghai",
    "买好了！请带好护照，去安检入口。",
    "mǎi hǎo le ！ qǐng dài hǎo hù zhào ， qù ān jiǎn rù kǒu 。",
    `Your Shanghai journey is booked on G728 at 18:20. Take your passport to the entry check. Platform entry upstairs requires ${STATION_BOARDING_XP} total XP; you can explore and earn more before departure.`,
    [["station-ticket-done", "谢谢！", close]]);
  function tickets() {
    if (journey().booked) return booked();
    say("售票 · Tickets", "你好！你想去哪里？",
      "nǐ hǎo ！ nǐ xiǎng qù nǎ lǐ ？", "Hello! Where would you like to go?",
      [["station-ticket-request", "我想买一张去上海的车票。", () => {
        say("售票 · Tickets", "去上海，一张。请给我看一下护照。",
          "qù shàng hǎi ， yì zhāng 。 qǐng gěi wǒ kàn yí xià hù zhào 。",
          "One journey to Shanghai. Please show me your passport.",
          [["station-ticket-confirm", "这是我的护照。谢谢！", () => { act("book"); booked(); }]]);
      }]]);
  }
  const cleared = () => say("安检 · Security",
    "你已经过了安检，不用再检查。",
    "nǐ yǐ jīng guò le ān jiǎn ， bú yòng zài jiǎn chá 。",
    "You have already cleared security. You only need another check if you leave the station and come back.");
  function check() {
    if (journey().entry === "ready") return cleared();
    if (!journey().booked) return say("进站检查 · Entry check",
      "请先去左边的售票处买票。", "qǐng xiān qù zuǒ biān de shòu piào chù mǎi piào 。",
      "First buy your ticket at the windows on the left.");
    if (journey().entry === "public") return say("进站检查 · Entry check",
      "请给我看一下护照。",
      "qǐng gěi wǒ kàn yí xià hù zhào 。",
      "Please show me your passport.",
      [["station-verify", "这是我的护照。", () => { act("verify"); check(); }]]);
    securityGuide({ id: "station-entry-check" });
  }
  function bag() {
    if (journey().entry === "ready") return cleared();
    if (journey().entry === "verified") return say("行李安检 · Bag screening",
      "把包和行李箱放在这里。人从旁边的门走过去。",
      "bǎ bāo hé xíng li xiāng fàng zài zhè lǐ 。 rén cóng páng biān de mén zǒu guò qù 。",
      "Put your bag and suitcase here. Walk through the detector beside the conveyor.",
      [["station-deposit", "把包和行李箱放上去。", () => { act("deposit"); close(); }]]);
    say("安检 · Security", "正在检查你的包和行李箱。请从旁边的门走过去。",
      "zhèng zài jiǎn chá nǐ de bāo hé xíng li xiāng 。 qǐng cóng páng biān de mén zǒu guò qù 。",
      "Your bag and suitcase are being checked. Please walk through the gate beside it.");
  }
  function collect() {
    if (journey().entry === "screened") return say("取行李 · Collect your luggage",
      "检查好了，请拿好你的包和行李箱。", "jiǎn chá hǎo le ， qǐng ná hǎo nǐ de bāo hé xíng li xiāng 。",
      "Screening is complete. Collect your bag and suitcase and take them with you.",
      [["station-collect", "拿好包和行李箱。", () => {
        act("collect");
        if (upstairsRequest) {
          const request = upstairsRequest; upstairsRequest = null; walk(request.id);
        } else close();
      }]]);
    say("取行李 · Collect your luggage", "拿好东西，再去楼梯那边。",
      "ná hǎo dōng xi ， zài qù lóu tī nà biān 。",
      "Take your belongings, then continue toward the stairs.");
  }
  function securityGuide(o) {
    const entry = journey().entry;
    const step = !journey().booked
      ? ["station-ticket-counter", "去买票", "请先去左边买票，再给右边的工作人员看护照。", "qǐng xiān qù zuǒ biān mǎi piào ， zài gěi yòu biān de gōng zuò rén yuán kàn hù zhào 。", "First buy a ticket on the left, then show your passport to the employee at the desk on the right."]
      : entry === "public"
      ? ["station-entry-check", "去检查护照", "票买好了。请先给右边的工作人员看护照，再放行李。", "piào mǎi hǎo le 。 qǐng xiān gěi yòu biān de gōng zuò rén yuán kàn hù zhào ， zài fàng xíng li 。", "Your ticket is booked. First show your passport to the employee at the desk on the right, then put your luggage on the conveyor."]
      : entry === "verified"
      ? ["station-bag-drop", "去放行李", "护照检查好了。请把包和行李箱放在左边的传送带上，再走安检门。", "hù zhào jiǎn chá hǎo le 。 qǐng bǎ bāo hé xíng li xiāng fàng zài zuǒ biān de chuán sòng dài shàng ， zài zǒu ān jiǎn mén 。", "Your passport has been checked. Put your bag and suitcase on the conveyor on the left, then walk through the metal detector."]
      : entry === "bags"
      ? ["station-security-exit", "走过安检门", "行李已经放好了。请从安检门走过去，那边的安检员会告诉你怎么做。", "xíng li yǐ jīng fàng hǎo le 。 qǐng cóng ān jiǎn mén zǒu guò qù ， nà biān de ān jiǎn yuán huì gào su nǐ zěn me zuò 。", "Your luggage is on the belt. Walk through the metal detector; the employee on the other side will help you next."]
      : entry === "screened"
      ? ["station-bag-collect", "去取行李", "检查好了。请先拿好包和行李箱，再上楼。", "jiǎn chá hǎo le 。 qǐng xiān ná hǎo bāo hé xíng li xiāng ， zài shàng lóu 。", "Screening is complete. Collect your bag and suitcase before going upstairs."]
      : ["station-stairs-up", "去候车室", "行李拿好了。请坐扶梯去二楼候车室，也可以坐电梯。", "xíng li ná hǎo le 。 qǐng zuò fú tī qù èr lóu hòu chē shì ， yě kě yǐ zuò diàn tī 。", "You have your luggage. Take the escalator or lift to the waiting hall on the second floor."];
    say("安检员 · Security employee", step[2], step[3], step[4],
      [["station-security-next", step[1], () => walk(step[0])]], o.id === "station-security-exit" ? "male-kokoro-009" : "female-kokoro-026");
  }
  function upstairs(o) {
    const entry = journey().entry;
    if (entry !== "ready") {
      upstairsRequest = o;
      const step = !journey().booked ? ["station-ticket-counter", "先买票", "请先买票，再去安检。", "qǐng xiān mǎi piào ， zài qù ān jiǎn 。", "First buy your ticket, then complete security."]
        : entry === "public" ? ["station-entry-check", "去进站口", "请先给工作人员看护照。", "qǐng xiān gěi gōng zuò rén yuán kàn hù zhào 。", "First show your passport at the entry check."]
        : entry === "verified" ? ["station-bag-drop", "去放行李", "请先把行李放在传送带上。", "qǐng xiān bǎ xíng li fàng zài chuán sòng dài shàng 。", "First place your luggage on the conveyor."]
        : entry === "bags" ? ["station-bag-collect", "过安检，取行李", "行李还在安检。先从安检门走过去，再取行李。", "xíng li hái zài ān jiǎn 。 xiān cóng ān jiǎn mén zǒu guò qù ， zài qǔ xíng li 。", "Your luggage is still being screened. Walk through the detector, then collect it. I'll take you to the collection point."]
        : ["station-bag-collect", "去取行李", "请先拿好安检后的行李，再上楼。", "qǐng xiān ná hǎo ān jiǎn hòu de xíng li ， zài shàng lóu 。", "Collect your screened luggage, then go upstairs. I'll take you to it."];
      return say("候车室 · Waiting hall", step[2], step[3], step[4],
        [["station-upstairs-next", step[1], () => walk(step[0])]]);
    }
    upstairsRequest = null;
    close();
    world().enterDoor(o);
  }

  function boarding() {
    if (!journey().booked || journey().entry !== "ready") return say("检票口 · Boarding",
      "请先买票，再去安检。", "qǐng xiān mǎi piào ， zài qù ān jiǎn 。",
      "Buy your ticket and complete security downstairs first.", [], "male-kokoro-009");
    const progress = stationBoardingProgress(state().xp, false);
    const checked = journey().boarding && progress.ready;
    const pass = `<section class="station-boarding-pass" aria-label="Shanghai boarding pass">
      <p>车票 · Journey ticket</p><h3>苏州 → 上海 · Shanghai</h3>
      <p>G728 · 18:20 · 二楼检票口 / 2F boarding gate</p>
      <p role="status">${checked ? "已检票 · Checked" : progress.ready ? "可以检票 · Ready for check" : "继续探索 · Keep exploring"}</p>
      <p>${progress.earned} / ${progress.required} XP${progress.remaining ? ` · 还差 / Still need ${progress.remaining} XP` : ""}</p>
      <progress max="${progress.required}" value="${Math.min(progress.earned, progress.required)}" aria-label="Boarding XP"></progress>
      <p>XP 不会扣除 · XP is not spent.</p></section>`;
    line("检票口 · Boarding",
      checked ? "检票好了！请带好行李，从这里走。"
        : progress.ready ? "请出示车票和护照。你准备好了吗？"
        : "还没到出发的时候。先在候车室聊聊天，也可以回城里帮帮朋友。",
      checked ? "jiǎn piào hǎo le ！ qǐng dài hǎo xíng li ， cóng zhè lǐ zǒu 。"
        : progress.ready ? "qǐng chū shì chē piào hé hù zhào 。 nǐ zhǔn bèi hǎo le ma ？"
        : "hái méi dào chū fā de shí hou 。 xiān zài hòu chē shì liáo liao tiān ， yě kě yǐ huí chéng lǐ bāng bang péng you 。",
      checked ? "Your booking has been checked. Take your luggage through the open lane to the landing."
        : progress.ready ? "Your Shanghai ticket is ready. Present it with your passport to open the gates, or keep exploring."
        : `Earn ${progress.remaining} more XP before departure. Talk with travelers, practice words, or return to town to help friends. Your booking will wait for you.`,
      [
        ...(!checked && progress.ready ? [["station-boarding-confirm", "出示车票和护照 · Present ticket & passport", () => {
          // A save refresh can change XP or clearance while this panel is open.
          act("board");
          boarding();
        }]] : []),
        ["station-boarding-done", checked ? "去站台 · Continue to landing" : "再逛逛 · Keep exploring", close],
      ], "male-kokoro-009", pass);
  }
  function platform(o) {
    if (!journey().boarding || !stationBoardingProgress(state().xp, false).ready) return boarding();
    if (world().hasScene(o.integrationTarget)) {
      close(); world().enterDoor({ ...o, type: "door", target: o.integrationTarget }); return;
    }
    say("站台 · Platform", "站台在楼下。我们在这里等一下吧。",
      "zhàn tái zài lóu xià 。 wǒ men zài zhè lǐ děng yí xià ba 。",
      "These stairs and the lift lead down to the ground-level platform. The platform and train journey are not open yet. You can return to the waiting hall.");
  }
  function platformTrain() {
    const arrived = journey().trainArrived;
    const progress = trainProgress(state(), false);
    const boarded = journey().trainBoarded;
    line("站台 · Platform",
      arrived ? "火车到了！我们不着急。" : "火车快来了。请站在黄线里面等车。",
      arrived ? "huǒ chē dào le ！ wǒ men bù zháo jí 。" : "huǒ chē kuài lái le 。 qǐng zhàn zài huáng xiàn lǐ miàn děng chē 。",
      boarded ? "Boarding complete. Your progress is saved. The train ride is still being built."
        : `${arrived ? "The train has arrived." : "The train will arrive shortly."} Boarding requires 1500 total XP and 100 XP earned here on the platform. The train will wait for you.`,
      [
        ...(arrived && progress.ready && !boarded ? [["station-train-board", "Board train", () => { act("board-train"); platformTrain(); }]] : []),
        ["station-platform-done", "好 · Continue", close],
      ], "panda",
      `<section class="station-boarding-pass" role="status"><p>${progress.earned} / ${progress.required} XP</p><p>Platform: ${progress.local} / ${progress.localRequired} XP</p><p>${progress.ready ? "XP requirements met" : `Still need ${progress.remaining} total XP and ${progress.localRemaining} platform XP`}</p>${boarded ? "<p>Boarding complete ✓</p>" : ""}</section>`);
  }
  return (o) => {
    // Ignore stale belt interactions if clearance was reset while navigating.
    if (["station-bag-drop", "station-bag-collect"].includes(o.id) && journey().entry === "public") return false;
    if (o.id === "station-ticket-counter") tickets();
    else if (o.id === "station-entry-check") check();
    else if (o.id === "station-bag-drop") bag();
    else if (o.id === "station-bag-collect") collect();
    else if (["station-security-guide", "station-security-exit"].includes(o.id)) securityGuide(o);
    else if (["station-stairs-up", "station-lift-up"].includes(o.id)) upstairs(o);
    else if (o.id === "station-boarding-check") boarding();
    else if (["station-platform-stairs", "station-platform-lift"].includes(o.id)) platform(o);
    else if (o.id === "station-platform-train") platformTrain();
    else return false;
    return true;
  };
}
