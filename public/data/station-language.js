// Early HSK 4 is a ceiling, not a target for every station exchange.
export const stationLanguageStyle = "Station difficulty: mostly old HSK 2–3, with only occasional concrete early HSK 4 travel words. Prefer the easier wording whenever possible. Use one idea per short sentence and ask only one simple question at a time. Avoid long lists, nested clauses, idioms and abstract explanations. Introduce at most one unfamiliar station term at a time, explaining it in basic Chinese when needed. Give directions one step at a time using 左边, 右边, 旁边 and 先…再…. Do not turn a simple conversation into a multi-step language exercise.";

export function isStationConversation(scene, npcId = "") {
  return ["station-ticketing", "station-waiting"].includes(scene) ||
    /^(?:station-|traveler-|waiting-)/.test(npcId) ||
    (scene === "shantang" && npcId === "suyin");
}
