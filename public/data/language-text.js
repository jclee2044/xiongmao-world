// Use contextual word boundaries before dictionary lookup. A longest-prefix
// dictionary search alone steals characters from the following word (过 + 关于).
const segmenter = new Intl.Segmenter("zh", { granularity: "word" });
const experientialVerbs = new Set([..."看听读说吃喝去来买住坐做学玩用见写走问找"]);
export function segmentChinese(text) {
  const parts = [];
  let offset = 0;
  // Reviewed compound labels and Latin names remain one help unit. They never
  // compete with arbitrary dictionary prefixes at a grammatical boundary.
  const protectedWords = /[看听读说吃喝去来买住坐做学玩用见写走问找]过(?=关于)|关于|苏州博物馆|故事书|[A-Za-z]+(?:[ '-][A-Za-z]+)*/gu;
  const append = (end) => {
    for (const { segment, index } of segmenter.segment(text.slice(offset, end)))
      parts.push({ zh: segment, start: offset + index });
  };
  for (const match of text.matchAll(protectedWords)) {
    append(match.index);
    parts.push({ zh: match[0], start: match.index });
    offset = match.index + match[0].length;
  }
  append(text.length);
  return parts.reduce((result, part) => {
    const previous = result.at(-1);
    if (part.zh === "过" && previous && experientialVerbs.has(previous.zh)) previous.zh += part.zh;
    else result.push(part);
    return result;
  }, []);
}
export function chineseNumber(value) {
  if (!Number.isInteger(value) || value < 0 || value > 9999) throw Error("Number outside the activity range");
  if (!value) return "零";
  const digits = "零一二三四五六七八九", units = ["", "十", "百", "千"];
  let result = "", zero = false;
  for (let place = 3; place >= 0; place--) {
    const digit = Math.floor(value / 10 ** place) % 10;
    if (digit) {
      if (zero) result += "零";
      result += (digit === 1 && place === 1 && !result ? "" : digits[digit]) + units[place];
      zero = false;
    } else if (result && value % 10 ** place) zero = true;
  }
  return result;
}
