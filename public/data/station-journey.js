import { PLATFORM_ENTRY_XP, trainProgress } from "./rewards.js";
// Total XP, earned rather than spent. Keep the departure threshold tunable.
export const STATION_BOARDING_XP = PLATFORM_ENTRY_XP;
export const stationBoardingProgress = (xp = 0) => {
  const earned = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
  return { earned, required: STATION_BOARDING_XP,
    remaining: Math.max(0, STATION_BOARDING_XP - earned),
    ready: earned >= STATION_BOARDING_XP };
};

// A booking survives leaving the station; permission to enter does not.
export const entryStages = ["public", "verified", "bags", "screened", "ready"];
export const newStationJourney = () => ({ booked: false, entry: "public", revision: 0 });

export function validateStationJourney(value = newStationJourney()) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      typeof value.booked !== "boolean" || !entryStages.includes(value.entry) ||
      (!value.booked && value.entry !== "public") ||
      (value.trainBoarded !== undefined && typeof value.trainBoarded !== "boolean") ||
      (value.trainBoarded && !value.trainArrived) ||
      (value.boarding !== undefined && typeof value.boarding !== "boolean") ||
      (value.visitedWaiting !== undefined && typeof value.visitedWaiting !== "boolean") ||
      (value.trainArrived !== undefined && typeof value.trainArrived !== "boolean") ||
      (value.trainArrived && !value.boarding) ||
      (value.boarding && value.entry !== "ready") ||
      !Number.isSafeInteger(value.revision) || value.revision < 0 || value.revision > 1000000)
    throw Error("Invalid station journey.");
  return { booked: value.booked, entry: value.entry, revision: value.revision,
    ...(value.trainBoarded ? { trainBoarded: true } : {}),
    ...(value.visitedWaiting ? { visitedWaiting: true } : {}),
    ...(value.trainArrived ? { trainArrived: true } : {}),
    ...(value.boarding ? { boarding: true } : {}) };
}

export function stationJourneyAction(value, action, xp = 0, devMode = false, platformXP = 0) {
  const journey = validateStationJourney(value);
  const next = { ...journey };
  if (action === "book") next.booked = true;
  if (action === "verify" && journey.booked && journey.entry === "public") next.entry = "verified";
  if (action === "deposit" && journey.entry === "verified") next.entry = "bags";
  if (action === "screen" && journey.entry === "bags") next.entry = "screened";
  if (action === "collect" && journey.entry === "screened") next.entry = "ready";
  if (action === "visit-waiting" && journey.entry === "ready") next.visitedWaiting = true;
  if (action === "board" && journey.booked && journey.entry === "ready" && stationBoardingProgress(xp).ready) next.boarding = true;
  if (action === "train-arrived" && journey.boarding) next.trainArrived = true;
  if (action === "board-train" && journey.trainArrived && journey.boarding && trainProgress({ xp, rewards: { platformXP } }, devMode).ready) next.trainBoarded = true;
  if (action === "leave") { next.entry = "public"; delete next.boarding; delete next.trainArrived; delete next.trainBoarded; }
  if (next.trainBoarded !== journey.trainBoarded || next.entry !== journey.entry || next.booked !== journey.booked || next.boarding !== journey.boarding || next.visitedWaiting !== journey.visitedWaiting || next.trainArrived !== journey.trainArrived)
    next.revision = Math.min(1000000, journey.revision + 1);
  return next;
}

export function mergeStationJourney(local, remote) {
  const a = validateStationJourney(local), b = validateStationJourney(remote);
  // A later exit must win over an older screened save. Equal revisions choose
  // the less permissive state, so offline conflicts cannot reopen security.
  const newest = a.revision === b.revision
    ? entryStages.indexOf(a.entry) === entryStages.indexOf(b.entry)
      ? a.boarding && !b.boarding ? b : a
      : entryStages.indexOf(a.entry) < entryStages.indexOf(b.entry) ? a : b
    : a.revision > b.revision ? a : b;
  return { ...newest, booked: a.booked || b.booked,
    ...(a.visitedWaiting || b.visitedWaiting ? { visitedWaiting: true } : {}) };
}

export const stationLaneOpen = (journey) =>
  ["bags", "screened", "ready"].includes(journey?.entry);

// The satchel stays on the belt from deposit until collection. Derive its
// ownership from saved journey progress, including reloads and station exits.
export const stationBagOnBelt = (journey) =>
  ["bags", "screened"].includes(journey?.entry);

export const playerCarriesBag = (scene, journey) =>
  scene.id !== "station-ticketing" || !stationBagOnBelt(journey);

export const indoorTravelerGreeting = {
  chinese: "又见面了！售票处就在这里。你也想坐火车去上海吗？",
  pinyin: "yòu jiàn miàn le ！ shòu piào chù jiù zài zhè lǐ 。 nǐ yě xiǎng zuò huǒ chē qù shàng hǎi ma ？",
  meaning: "Good to see you again! Here is the ticket office. Would you like to take the train to Shanghai too?",
  topic: "travel",
};

export const waitingTravelerGreeting = {
  chinese: "谢谢你告诉我怎么走！我们在二楼等车吧。",
  pinyin: "xiè xie nǐ gào su wǒ zěn me zǒu ！ wǒ men zài èr lóu děng chē ba 。",
  meaning: "Thanks for telling me the way! Let's wait for the train on the second floor.",
  topic: "travel",
};

export const platformTravelerGreeting = {
  chinese: "我们到站台了！先站在黄线里面等车吧。",
  pinyin: "wǒ men dào zhàn tái le ！ xiān zhàn zài huáng xiàn lǐ miàn děng chē ba 。",
  meaning: "We're on the platform! Let's wait behind the yellow line.",
  topic: "travel",
};

export function stationTravelerVisible(scene, adventure) {
  const status = adventure.stationTraveler || "new";
  return ["station-ticketing", "station-waiting", "station-platform"].includes(scene.id) ? status === "entered" : status === "new";
}
