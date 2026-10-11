export const XIAOCHENG = "station-traveler";
export const STATION_DEPARTURE = "xiaocheng-enter-station";

// Accept useful directions, not a question about the route or an unrelated
// mention of left/right. This also keeps AI and offline replies in agreement.
export function givesStationDirections(text) {
  if (typeof text !== "string") return false;
  if (/[?？]|吗|哪里|哪儿|怎么|要不要|是不是|是否|不知道|不清楚|不确定|别|不要|不能|不用|不必|不需要|不想|不对|没过桥|过桥.{0,12}(?:往|向)左|\b(?:where|how|whether|help|unsure)\b|\b(?:don['’]?t|do not|not sure|cannot|can['’]?t|shouldn['’]?t|turn left)\b/i.test(text))
    return false;
  return /(?:过|穿过|走过|走上)\s*(?:这座|那座|这个|那个)?桥|(?:往|向)(?:右|右边)(?:走|转|拐)?|(?:售票处|车站|入口).{0,12}(?:在|就).{0,10}(?:右边|前面|门里|里面|左边)|\b(?:cross|go over|walk over|across)\s+(?:the |this |that )?bridge\b|\b(?:go|walk|turn|head)\s+(?:to the )?right\b|\b(?:ticket office|station|entrance)\s+is\s+(?:just )?(?:on the (?:left|right)|inside|ahead)/i.test(text);
}

export const stationDepartureReply = {
  chinese: "谢谢！我先过桥，再往右边走，去门里左边的售票处。再见！",
  meaning: "Thanks! I'll cross the bridge, then go right to the ticket office on the left inside the doorway. Goodbye!",
  topic: "travel",
};
