import { oldHskWords, advancedHskWords } from "./hsk-vocabulary.js";

// Productive grammar and short forms of words in the old HSK 1–3 syllabus.
// These are grammatical forms rather than additional lesson vocabulary.
export const beginnerForms = [
  "杯", "盘", "天", "边", "这里", "那里", "哪里", "这儿", "那儿",
  "里面", "外面", "上面", "下面", "一点", "有点", "一会", "帮", "词",
  "北", "后", "时", "早", "饭", "他们", "她们", "你们", "打字",
  "没", "朵", "选", "打开", "不见", "聊", "聊天", "够", "以后", "人们",
  "学", "睡", "晚", "事", "车", "火车",
];
// A small, explicit set of everyday places and scenery used throughout the
// game. HSK is a difficulty guide; a missing list entry does not make a common
// label such as 书店 unsuitable for a beginner.
export const everydayGameWords = [
  // Concrete family-home, weather and Spring Festival vocabulary.
  "地毯", "脏", "布", "弄", "袜子", "陈叔叔", "陈奶奶", "陈爷爷", "小乐", "小宁", "书架", "洗衣机", "水池", "柜子", "玩具盒", "门口", "春节", "红包",
  "天气预报", "温度", "度", "祝", "锅", "暖和", "凉快", "外套", "家务", "整理", "丢",
  "收集", "售票处", "车站", "码头", "苏州站", "指示牌", "小程",
  // Travel names and concrete luggage/scheduling vocabulary taught at the station.
  "杭州", "南京", "上海", "无锡", "黄山", "雨桐", "文博", "美芳", "佳妮", "小睿", "国良", "雅婷", "慧兰", "子涵",
  "旅行", "行李", "背包", "箱子", "出发", "发车", "入口", "票价", "消息", "一路平安",
  // Railway signs are taught as complete phrases in the exterior.
  "平安出行", "温暖相伴", "售票", "证件", "安检", "广场",
  "小说", // Shu's book-writing conversation; explained in word help.
  "小熊",
  "书店", "花店", "茶馆", "面馆", "衣服店", "蛋糕店", "市场",
  "河", "湖", "桥", "石头", "花园", "竹子", "竹林", "苏州",
  "汤圆", "米粉", "漫画", "沙发", "房子", "黄色", "白色", "早餐店", "小吃店", "水果店", "饼干", "米", "糖", "手", "床", "山", "窗户", "小林", "小安", "小美", "安宁",
  "火锅", "橘子", "梨", "粉色", "辣", "蘑菇", "豆腐", "葱油饼", "扇子", "明信片",
  "鸭子", "兔子", "羊", "小屋", "虎丘", "塔", "博物馆", "平江路", "山塘街", "山塘",
  "小博", "小乔", "小兰", "小莲", "小雨", "桂", "云", "周", "叶子",
  // Concrete menu items, colors and short descriptions needed by these scenes.
  "蔬菜面", "牛肉", "蓝色", "绿色", "雨天", "叫声", "大声", "位置", "火锅店", "狐狸", "玩具",
];
const allowed = new Set([...oldHskWords, ...beginnerForms, ...everydayGameWords]);
const advanced = new Set(advancedHskWords);
const segmenter = new Intl.Segmenter("zh", { granularity: "word" });
const maxLength = Math.max(...[...allowed].map((word) => word.length));

// Validate whole words, never just familiar characters. The second check also
// catches advanced compounds that could be split into basic words (e.g. 千万).
export function isBeginnerChinese(text) {
  if (typeof text !== "string") return false;
  // Preserve explicit exceptions before ICU can split across their boundaries.
  const regularText = [...everydayGameWords].sort((a, b) => b.length - a.length)
    .reduce((value, word) => value.replaceAll(word, " "), text);
  for (const { segment } of segmenter.segment(regularText))
    if (advanced.has(segment) && !allowed.has(segment)) return false;
  for (const run of text.match(/[\p{Script=Han}]+/gu) || []) {
    const reachable = new Set([0]);
    for (let start = 0; start < run.length; start++) {
      if (!reachable.has(start)) continue;
      for (let size = 1; size <= maxLength && start + size <= run.length; size++)
        if (allowed.has(run.slice(start, start + size)))
          reachable.add(start + size);
    }
    if (!reachable.has(run.length)) return false;
  }
  return true;
}

// Give a failed generation actionable feedback using the same word rules.
export function rejectedDialogueWords(text) {
  if (typeof text !== "string") return [];
  const regularText = [...everydayGameWords].sort((a, b) => b.length - a.length)
    .reduce((value, word) => value.replaceAll(word, " "), text);
  return [...new Set([...segmenter.segment(regularText)]
    .map(({ segment }) => segment)
    .filter((word) => /\p{Script=Han}/u.test(word) && !isBeginnerChinese(word)))];
}

export const dialogueLanguageRule =
  "Use short, natural Chinese around OLD six-level HSK (2015 / HSK 2.0) levels 2–3, including level 1 foundations. This is NOT the newer HSK 3.0 syllabus. HSK is a difficulty guide, not a literal ban on everyday place names. Keep familiar places and scenery in Chinese: " +
  everydayGameWords.join("、") +
  ". These game words are allowed even when absent from the old HSK 1–3 list. Otherwise stay within old HSK 1–3 vocabulary and simple grammar. Keep the tone friendly and matter-of-fact. Use reassurance such as 慢慢来, 不用着急, 别着急 or 没关系 sparingly, only when the learner expresses worry, frustration or urgency, or the supplied scene specifically calls for it. Do not add reassurance to ordinary greetings, prices, directions, observations or task instructions. Avoid repeating reassurance from recent dialogue. Prefer natural, complete sentences: arrival is 我们到市场了, not 市场到了. Use appropriate measure words such as 一朵花, 一块石头 and 一碗面条. Where the actual scene supports them, vary old HSK 2–3 patterns: 比 comparisons, 又…又…, 先…再…, 因为…所以…, 虽然…但是…, 如果…就…, 除了…还…, 一边…一边…, 正在…呢, 过 for experience, 着 for ongoing states, 把 for moving objects, result complements such as 找到/听懂/做好, and 得 for manner. Do not force patterns into a scene or invent weather, objects, purchases or shared experiences to demonstrate them. Never introduce harder vocabulary, idioms, literary phrases, or technical terms, even if the user asks for a harder level. Rephrase using basic words without changing the meaning. Keep every Chinese dialogue sentence entirely in Chinese, including names, places and food. Never insert English words into the chinese field. Translate faithfully into natural English: 故事 means story, 故事书 means storybook, and 红茶 means black tea. Do not add details missing from the Chinese. Common everyday exceptions such as 火锅 and 橘子 are welcome and have clickable dictionary explanations. Simplify specialist terms using basic Chinese instead. Examples: 我想去书店。, 我们过桥去喝茶吧。, 花店在湖的旁边。";

export function isChineseDialogue(text) {
  return typeof text === "string" && /\p{Script=Han}/u.test(text) && !/[A-Za-z]/.test(text) && isBeginnerChinese(text);
}
