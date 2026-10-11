import { newRewards } from "../state/rewards.js";
export const SUZHOU_XP = 750;
export const PLATFORM_ENTRY_XP = 1400;
export const TRAIN_XP = 1500;
export const PLATFORM_LOCAL_XP = 100;
export function progression(adventure, scene) {
  const required = scene === "station-platform" ? TRAIN_XP
    : adventure.boatTaken || scene === "shantang" || scene?.startsWith("station-") ? PLATFORM_ENTRY_XP : SUZHOU_XP;
  return { earned: adventure.xp, required, remaining: Math.max(0, required - adventure.xp) };
}
export function trainProgress(adventure, devMode = false) {
  const local = adventure.rewards?.platformXP || 0;
  return { earned: adventure.xp, required: TRAIN_XP, local, localRequired: PLATFORM_LOCAL_XP,
    remaining: Math.max(0, TRAIN_XP - adventure.xp), localRemaining: Math.max(0, PLATFORM_LOCAL_XP - local),
    ready: devMode === true || (adventure.xp >= TRAIN_XP && local >= PLATFORM_LOCAL_XP) };
}
// Stable IDs identify completions, not rendering callbacks. Call inside persistence.change.
export function grantReward(adventure, { id, amount, scene, label = "Activity complete" }) {
  if (!/^[a-zA-Z0-9:_-]{1,180}$/.test(id) || ["__proto__", "constructor", "prototype"].includes(id) ||
      !Number.isSafeInteger(amount) || amount <= 0 || amount > 1000000) throw Error("Invalid reward.");
  const rewards = adventure.rewards ||= newRewards();
  if (Object.hasOwn(rewards.claims, id)) return { id, label, gained: 0, amount, alreadyCompleted: true };
  rewards.claims = { ...rewards.claims, [id]: amount };
  const gained = Math.min(amount, 1000000 - adventure.xp);
  adventure.xp += gained;
  if (scene === "station-platform") rewards.platformXP = Math.min(1000000, rewards.platformXP + amount);
  return { id, label, gained, amount, alreadyCompleted: false };
}
export const completionText = ({ label, gained, amount, alreadyCompleted }) =>
  `${label} · ${alreadyCompleted ? `Completed · ${amount} XP already received` : `Complete! +${gained} XP`}`;
// Reopening resumes the saved encounter. Only the explicit replay action advances it.
export function beginInteraction(a, npc, scene, replay = false) {
  const rewards = a.rewards ||= newRewards(), key = `${scene}:${npc}`;
  let round = rewards.encounters[key] || 0;
  const previous = `talk:${key}:${round}`;
  if (replay && Object.hasOwn(rewards.claims, `${previous}:answer`)) round++;
  rewards.encounters[key] = round;
  const id = `talk:${key}:${round}`;
  return { id, scene, ...grantReward(a, { id: `${id}:start`, amount: 5, scene, label: "Conversation started" }), encounterId: id };
}
export function answerInteraction(a, encounter) {
  if (!encounter || !Object.hasOwn(a.rewards?.claims || {}, `${encounter.encounterId}:start`)) return null;
  const result = grantReward(a, { id: `${encounter.encounterId}:answer`, amount: 15, scene: encounter.scene, label: "Conversation answered" });
  if (!result.alreadyCompleted) a.conversations = Math.min(1000000, a.conversations + 1);
  return result;
}

// Legacy completion predicates prevent re-awarding quests completed before the ledger existed.
export function completeQuest(a, event, { isComplete, complete }) {
  if (isComplete(a)) return { ...event, gained: 0, alreadyCompleted: true };
  const reward = grantReward(a, event);
  complete(a);
  return reward;
}
