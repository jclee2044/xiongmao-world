// Ground-floor guidance is authored so the next action cannot be invented.
const guide = (context, examples) => ({ always: true, storedOnly: true, context, examples });
const observation = (context, examples) => ({ context, examples });
export const stationPandaAreas = {
  "station-guide-ticket": guide("Buy a Shanghai ticket at the ticket windows on the left.", [
    "我们先去左边的售票处，买一张去上海的车票吧。",
    "先去左边买票吧。带好护照。",
    "售票处在左边。跟售票员说：我想买一张去上海的车票。",
  ]),
  "station-guide-identity": guide("Booking complete. Show passport to entry-check staff before security.", [
    "票买好了！往前面走，去检查护照吧。",
    "现在去检查护照。护照拿好了吗？",
    "我们有票了。先去前面检查护照吧。",
  ]),
  "station-guide-deposit": guide("Passport verified. Put the bag on the conveyor to the left of the detector.", [
    "护照检查好了。把包放在安检门左边的传送带上吧。",
    "现在检查行李。把包放在左边的传送带上。",
    "先检查包。把包放在左边的传送带上吧。",
  ]),
  "station-guide-detector": guide("Bag deposited. Walk through the passenger detector beside the conveyor.", [
    "包在传送带上了。我们从旁边的安检门走过去吧。",
    "现在我们从旁边的安检门走过去吧。",
    "包走传送带，我们走旁边的安检门。过去后再拿包。",
  ]),
  "station-guide-collect": guide("Player screened. Collect the bag from the far end of the conveyor before going upstairs.", [
    "检查好了！去那边拿包吧。",
    "先别上楼，包还在传送带那边。我们去拿回来吧。",
    "检查结束了。去那边拿好自己的包吧。",
  ]),
  "station-guide-upstairs": guide("Security complete and bag collected. Use the escalator or lift at the back to reach floor two.", [
    "包拿好了！我们坐电梯去二楼等车吧。",
    "我们可以上楼了。里面的扶梯和电梯都到二楼候车室。",
    "我们去二楼等车。带好行李，坐里面的扶梯吧。",
  ]),
  "station-panda-cafe": observation("Near the waiting-hall café and convenience store. Both counters offer conversations and purchases: café tea, coffee and noodles; convenience-store water, bread and cookies.", [
    "这里有咖啡，还有面。等车的时候，看看有什么吃的吧。",
    "这里有咖啡，也有水和吃的东西。",
    "你喜欢茶还是咖啡？我想坐下来休息一会儿。",
  ]),
  "station-panda-water": observation("Beside the hot-water dispenser in the waiting hall. Notice cups and hot water; do not invent a filling interaction.", [
    "这里的水很热。喝水的时候要小心。",
    "带着杯子出门真方便，这里就有热水。",
    "热水在这里。等车的时候，喝点水也很好。",
  ]),
  "station-panda-rest": observation("Near the waiting hall's massage chairs. One traveler rests here; do not claim a playable massage action.", [
    "这里有人在休息。我们安静一点吧。",
    "走了很久，我想坐下来休息。",
    "候车室里有好多椅子。大家一边休息，一边等车。",
  ]),
  "station-panda-seats": observation("Beside the first seating bank, where a traveler is sleeping across seats with luggage nearby. Panda may gently notice that sleeping while nobody watches the luggage does not seem very safe. Do not claim a theft has happened.", [
    "那边有人在睡觉。我们安静一点吧。",
    "有人在睡觉，有人在等车。行李都放在旁边。",
    "睡着了，没人看着行李，好像不太安全。",
  ]),
  "station-panda-board": observation("By the departure-information board. Shanghai is the destination and boarding is on the right. Do not invent a departure time, train number, announcement, or open platform.", [
    "去上海的检票口在右边。我们去看看吧。",
    "这里可以看出发信息。等车的时候，也要看看。",
    "这里有出发信息。我们看看火车几点走。",
  ]),
  "station-panda-help": observation("Near the waiting-hall information desk, with toilets to its left.", [
    "这里是问询处。找不到地方，可以来这里问问。",
    "问询处旁边就是洗手间，这个位置真方便。",
    "车站很大。有问题，可以来问询处问问。",
  ]),
};

export function stationLandmarkAreas(scene, journey = {}) {
  if (scene.id === "station-ticketing") {
    const step = !journey.booked ? "ticket" : ({
      public: "identity", verified: "deposit", bags: "detector",
      screened: "collect", ready: "upstairs",
    }[journey.entry] || "identity");
    if (step === "upstairs" && (journey.visitedWaiting || journey.boarding)) return [];
    return [{ id: `station-guide-${step}`, x: 0, y: 0, w: scene.width, h: scene.height }];
  }
  if (scene.id !== "station-waiting") return [];
  const scale = scene.stationScale;
  return [
    ["cafe", 280, 365, 125], ["water", 411, 576, 65],
    ["rest", 227, 752, 110], ["seats", 565, 390, 75],
    ["board", 953, 366, 110], ["help", 250, 565, 85],
  ].map(([id, x, y, r]) => ({ id: `station-panda-${id}`, x: x * scale, y: y * scale, r: r * scale }));
}
