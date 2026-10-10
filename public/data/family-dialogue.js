// Family ages and routines belong to the older cast, not the student/child sprites.
export const familyProfiles = {
  yun: {
    age: 72,
    spouse: {
      relation: "husband",
      age: 74,
    },
    child: {
      relation: "daughter",
      age: 46,
    },
    context:
      "Yun is a 72-year-old grandmother. Her husband is 74. Both no longer work. They have one adult daughter, aged 46, who works at a company and lives nearby. Her husband likes newspapers, often makes breakfast and cares for their flowers. Yun buys vegetables and likes cooking. Their daughter often phones in the evening and visits on weekends, sometimes bringing cake. These are fixed fictional cast facts; do not invent other children, names, jobs or ages, or memories shared with the player. Use simple Chinese such as 现在不工作了 instead of specialist retirement terms.",
    lines: [
      {
        chinese: "我丈夫经常做早饭。我去买菜。你家谁做饭？",
        meaning:
          "My husband often makes breakfast. I go to buy vegetables. Who cooks in your family?",
        pinyin:
          "wǒ zhàng fu jīng cháng zuò zǎo fàn 。 wǒ qù mǎi cài 。 nǐ jiā shuí zuò fàn ？",
        topic: "activities",
      },
      {
        chinese: "我丈夫每天早上看报纸，再去公园走走。",
        meaning:
          "My husband reads the newspaper every morning, then takes a walk in the park.",
        pinyin:
          "wǒ zhàng fu měi tiān zǎo shàng kàn bào zhǐ ， zài qù gōng yuán zǒu zǒu 。",
        topic: "activities",
      },
      {
        chinese: "我女儿在公司工作，晚上经常给我们打电话。",
        meaning:
          "My daughter works at a company and often calls us in the evening.",
        pinyin:
          "wǒ nǚ ér zài gōng sī gōng zuò ， wǎn shàng jīng cháng gěi wǒ men dǎ diàn huà 。",
        topic: "activities",
      },
      {
        chinese: "女儿周末来看我们，有时候带一点蛋糕。",
        meaning:
          "Our daughter visits us on weekends and sometimes brings some cake.",
        pinyin:
          "nǚ ér zhōu mò lái kàn wǒ men ， yǒu shí hòu dài yì diǎn dàn gāo 。",
        topic: "activities",
      },
      {
        chinese: "我丈夫在家照顾花，我去买水果。",
        meaning:
          "My husband takes care of the flowers at home, and I go to buy fruit.",
        pinyin: "wǒ zhàng fu zài jiā zhào gù huā ， wǒ qù mǎi shuǐ guǒ 。",
        topic: "activities",
      },
      {
        chinese: "女儿做的饭比我做的好吃。我们经常一起吃饭。",
        meaning:
          "My daughter's cooking tastes better than mine. We often eat together.",
        pinyin:
          "nǚ ér zuò de fàn bǐ wǒ zuò de hǎo chī 。 wǒ men jīng cháng yì qǐ chī fàn 。",
        topic: "activities",
      },
      {
        chinese: "我和丈夫有时候一边喝茶，一边听音乐。",
        meaning:
          "My husband and I sometimes drink tea while listening to music.",
        pinyin:
          "wǒ hé zhàng fu yǒu shí hòu yì biān hē chá ， yì biān tīng yīn yuè 。",
        topic: "activities",
      },
      {
        chinese: "我女儿住在附近。她经常来看看我们。",
        meaning: "My daughter lives nearby. She often comes to visit us.",
        pinyin:
          "wǒ nǚ ér zhù zài fù jìn 。 tā jīng cháng lái kàn kàn wǒ men 。",
        topic: "activities",
      },
    ],
    answers: {
      age: {
        chinese: "我七十二岁，丈夫七十四岁。",
        meaning: "I am seventy-two, and my husband is seventy-four.",
        pinyin: "wǒ qī shí èr suì ， zhàng fu qī shí sì suì 。",
        topic: "activities",
      },
      childAge: {
        chinese: "我女儿四十六岁，在公司工作。",
        meaning: "My daughter is forty-six and works at a company.",
        pinyin: "wǒ nǚ ér sì shí liù suì ， zài gōng sī gōng zuò 。",
        topic: "activities",
      },
      children: {
        chinese: "我只有一个女儿，她已经工作了。",
        meaning: "I have only one daughter, and she is already working.",
        pinyin: "wǒ zhǐ yǒu yí gè nǚ ér ， tā yǐ jīng gōng zuò le 。",
        topic: "activities",
      },
      otherChild: {
        chinese: "我有一个女儿，没有儿子。",
        meaning: "I have one daughter and no sons.",
        pinyin: "wǒ yǒu yí gè nǚ ér ， méi yǒu ér zi 。",
        topic: "activities",
      },
      spouse: {
        chinese: "我丈夫每天早上看报纸，再去公园走走。",
        meaning:
          "My husband reads the newspaper every morning, then takes a walk in the park.",
        pinyin:
          "wǒ zhàng fu měi tiān zǎo shàng kàn bào zhǐ ， zài qù gōng yuán zǒu zǒu 。",
        topic: "activities",
      },
      spouseWork: {
        chinese: "我和丈夫现在不工作了。女儿在公司工作。",
        meaning:
          "My husband and I no longer work. Our daughter works at a company.",
        pinyin:
          "wǒ hé zhàng fu xiàn zài bù gōng zuò le 。 nǚ ér zài gōng sī gōng zuò 。",
        topic: "activities",
      },
      spouseCooking: {
        chinese: "我丈夫经常做早饭。我也喜欢做饭。",
        meaning: "My husband often makes breakfast. I like cooking too.",
        pinyin:
          "wǒ zhàng fu jīng cháng zuò zǎo fàn 。 wǒ yě xǐ huan zuò fàn 。",
        topic: "activities",
      },
      child: {
        chinese: "女儿晚上经常给我们打电话，周末来看我们。",
        meaning:
          "Our daughter often calls us in the evening and visits on weekends.",
        pinyin:
          "nǚ ér wǎn shàng jīng cháng gěi wǒ men dǎ diàn huà ， zhōu mò lái kàn wǒ men 。",
        topic: "activities",
      },
      childCooking: {
        chinese: "女儿做的饭比我做的好吃。我们经常一起吃饭。",
        meaning:
          "My daughter's cooking tastes better than mine. We often eat together.",
        pinyin:
          "nǚ ér zuò de fàn bǐ wǒ zuò de hǎo chī 。 wǒ men jīng cháng yì qǐ chī fàn 。",
        topic: "activities",
      },
      home: {
        chinese: "我和丈夫住在一起，女儿住在附近。",
        meaning:
          "My husband and I live together, and our daughter lives nearby.",
        pinyin: "wǒ hé zhàng fu zhù zài yì qǐ ， nǚ ér zhù zài fù jìn 。",
        topic: "activities",
      },
    },
  },
  "visitor-4": {
    age: 68,
    spouse: {
      relation: "wife",
      age: 67,
    },
    child: {
      relation: "son",
      age: 39,
    },
    context:
      "Zhou is a 68-year-old retired teacher with an older gray-haired design. His wife is 67 and was also a teacher. Both no longer work. They have one adult son, aged 39, who works at a company and lives nearby. His wife likes listening to music while cooking and walks in the park daily. Zhou reads books at home. Their son visits on weekends, sometimes brings fruit and makes good noodles. These are fixed fictional cast facts; do not invent other children, names, jobs or ages, or memories shared with the player. Use simple Chinese such as 现在不工作了 instead of specialist retirement terms.",
    lines: [
      {
        chinese: "我妻子喜欢一边做饭，一边听音乐。你呢？",
        meaning:
          "My wife likes listening to music while cooking. How about you?",
        pinyin:
          "wǒ qī zǐ xǐ huan yì biān zuò fàn ， yì biān tīng yīn yuè 。 nǐ ne ？",
        topic: "activities",
      },
      {
        chinese: "我妻子每天去公园走走。我在家看书。",
        meaning: "My wife takes a walk in the park every day. I read at home.",
        pinyin:
          "wǒ qī zǐ měi tiān qù gōng yuán zǒu zǒu 。 wǒ zài jiā kàn shū 。",
        topic: "activities",
      },
      {
        chinese: "我儿子在公司上班，周末经常来看我们。",
        meaning: "My son works at a company and often visits us on weekends.",
        pinyin:
          "wǒ ér zi zài gōng sī shàng bān ， zhōu mò jīng cháng lái kàn wǒ men 。",
        topic: "activities",
      },
      {
        chinese: "儿子有时候给我们做饭。他做的面条很好吃。",
        meaning: "Our son sometimes cooks for us. His noodles taste very good.",
        pinyin:
          "ér zi yǒu shí hòu gěi wǒ men zuò fàn 。 tā zuò de miàn tiáo hěn hǎo chī 。",
        topic: "activities",
      },
      {
        chinese: "我和妻子年轻的时候，都在学校工作。",
        meaning: "When my wife and I were young, we both worked at a school.",
        pinyin:
          "wǒ hé qī zǐ nián qīng de shí hòu ， dōu zài xué xiào gōng zuò 。",
        topic: "activities",
      },
      {
        chinese: "我妻子以前是老师。现在我们有时间一起看书。",
        meaning:
          "My wife used to be a teacher. Now we have time to read together.",
        pinyin:
          "wǒ qī zǐ yǐ qián shì lǎo shī 。 xiàn zài wǒ men yǒu shí jiān yì qǐ kàn shū 。",
        topic: "activities",
      },
      {
        chinese: "儿子住得不远，经常带水果来看我们。",
        meaning:
          "Our son doesn't live far away and often brings fruit when he visits us.",
        pinyin:
          "ér zi zhù de bù yuǎn ， jīng cháng dài shuǐ guǒ lái kàn wǒ men 。",
        topic: "activities",
      },
      {
        chinese: "我做的饭没有妻子做的好吃。你家谁做饭？",
        meaning:
          "My cooking doesn't taste as good as my wife's. Who cooks in your family?",
        pinyin:
          "wǒ zuò de fàn méi yǒu qī zǐ zuò de hǎo chī 。 nǐ jiā shuí zuò fàn ？",
        topic: "activities",
      },
    ],
    answers: {
      age: {
        chinese: "我六十八岁，妻子六十七岁。",
        meaning: "I am sixty-eight, and my wife is sixty-seven.",
        pinyin: "wǒ liù shí bā suì ， qī zǐ liù shí qī suì 。",
        topic: "activities",
      },
      childAge: {
        chinese: "我儿子三十九岁，在公司上班。",
        meaning: "My son is thirty-nine and works at a company.",
        pinyin: "wǒ ér zi sān shí jiǔ suì ， zài gōng sī shàng bān 。",
        topic: "activities",
      },
      children: {
        chinese: "我只有一个儿子，他已经工作了。",
        meaning: "I have only one son, and he is already working.",
        pinyin: "wǒ zhǐ yǒu yí gè ér zi ， tā yǐ jīng gōng zuò le 。",
        topic: "activities",
      },
      otherChild: {
        chinese: "我有一个儿子，没有女儿。",
        meaning: "I have one son and no daughters.",
        pinyin: "wǒ yǒu yí gè ér zi ， méi yǒu nǚ ér 。",
        topic: "activities",
      },
      spouse: {
        chinese: "我妻子喜欢一边做饭，一边听音乐。",
        meaning: "My wife likes listening to music while cooking.",
        pinyin: "wǒ qī zǐ xǐ huan yì biān zuò fàn ， yì biān tīng yīn yuè 。",
        topic: "activities",
      },
      spouseWork: {
        chinese: "我和妻子以前都是老师，现在不工作了。",
        meaning:
          "My wife and I both used to be teachers, and we no longer work.",
        pinyin:
          "wǒ hé qī zǐ yǐ qián dōu shì lǎo shī ， xiàn zài bù gōng zuò le 。",
        topic: "activities",
      },
      spouseCooking: {
        chinese: "我妻子喜欢做饭。我做的饭没有她做的好吃。",
        meaning:
          "My wife likes cooking. My cooking doesn't taste as good as hers.",
        pinyin:
          "wǒ qī zǐ xǐ huan zuò fàn 。 wǒ zuò de fàn méi yǒu tā zuò de hǎo chī 。",
        topic: "activities",
      },
      child: {
        chinese: "我儿子在公司上班，周末经常来看我们。",
        meaning: "My son works at a company and often visits us on weekends.",
        pinyin:
          "wǒ ér zi zài gōng sī shàng bān ， zhōu mò jīng cháng lái kàn wǒ men 。",
        topic: "activities",
      },
      childCooking: {
        chinese: "儿子有时候给我们做面条，做得很好吃。",
        meaning:
          "Our son sometimes makes noodles for us, and they taste very good.",
        pinyin:
          "ér zi yǒu shí hòu gěi wǒ men zuò miàn tiáo ， zuò de hěn hǎo chī 。",
        topic: "activities",
      },
      home: {
        chinese: "我和妻子住在一起，儿子住在附近。",
        meaning: "My wife and I live together, and our son lives nearby.",
        pinyin: "wǒ hé qī zǐ zhù zài yì qǐ ， ér zi zhù zài fù jìn 。",
        topic: "activities",
      },
    },
  },
};

export function familyContext(npcId) {
  return Object.hasOwn(familyProfiles, npcId)
    ? familyProfiles[npcId].context
    : "";
}
export function familyOpeningLines(npcId) {
  return Object.hasOwn(familyProfiles, npcId)
    ? familyProfiles[npcId].lines.slice(0, 3)
    : [];
}
export function familyStoryReply(
  npcId,
  text,
  shown = "",
  { history = [], random = Math.random } = {},
) {
  if (!Object.hasOwn(familyProfiles, npcId)) return null;
  const profile = familyProfiles[npcId];
  const family =
    /家人|你家|我家|家里|丈夫|妻子|儿子|女儿|孩子|\b(?:family|husband|wife|spouse|son|daughter|children)\b/i;
  const age = /几岁|多大|年龄|\b(?:age|how old)\b/i.test(text);
  const continuation =
    family.test(shown) &&
    /^(?:你呢|还有呢|继续|接着说|还有什么|再说说)[？?。.!！\s]*$/i.test(text);
  const personalAge =
    age && /你(?:今年)?(?:几岁|多大)|你.*年龄|\bhow old are you\b/i.test(text);
  if (!family.test(text) && !personalAge && !continuation) return null;
  const child = /儿子|女儿|孩子|\b(?:son|daughter|child|children)\b/i.test(
    text,
  );
  const spouse = /丈夫|妻子|\b(?:husband|wife|spouse)\b/i.test(text);
  const cooking =
    /做饭|做早饭|吃|面条|\b(?:cook|cooking|breakfast|food|noodles)\b/i.test(
      text,
    );
  const work = /工作|上班|老师|\b(?:work|job|teacher)\b/i.test(text);
  const otherChild =
    profile.child.relation === "daughter"
      ? /儿子|\bson\b/i.test(text)
      : /女儿|\bdaughter\b/i.test(text);
  let answer;
  if (otherChild) answer = profile.answers.otherChild;
  else if (age) answer = child ? profile.answers.childAge : profile.answers.age;
  else if (child)
    answer = /几个|多少|有.*(?:孩子|儿子|女儿)|have.*children/i.test(text)
      ? profile.answers.children
      : work
        ? profile.answers.childAge
        : cooking
          ? profile.answers.childCooking
          : profile.answers.child;
  else if (spouse)
    answer = work
      ? profile.answers.spouseWork
      : cooking
        ? profile.answers.spouseCooking
        : profile.answers.spouse;
  else if (/住|家里.*(?:几|多少)|\b(?:household|live)\b/i.test(text))
    answer = profile.answers.home;
  else {
    const recent = history
      .filter((h) => h.npc === npcId)
      .slice(-4)
      .map((h) => h.reply.chinese);
    const choices = profile.lines.filter(
      (line) =>
        line.chinese !== shown &&
        !recent.some((zh) => zh.startsWith(line.chinese)),
    );
    const pool = choices.length ? choices : profile.lines;
    answer = pool[Math.floor(random() * pool.length)];
  }
  return { ...answer, npcId };
}

const familyRoles = {
  husband: "丈夫",
  wife: "妻子",
  son: "儿子",
  daughter: "女儿",
};
function chineseAge(value) {
  if (/^\d+$/.test(value)) return Number(value);
  const digits = {
    零: 0,
    一: 1,
    二: 2,
    两: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  };
  if (Object.hasOwn(digits, value)) return digits[value];
  const match = value.match(
    /^([一二两三四五六七八九]?)十([一二三四五六七八九]?)$/,
  );
  return match ? (digits[match[1]] ?? 1) * 10 + (digits[match[2]] ?? 0) : null;
}
// Catch contradictory personal ages/relatives while allowing questions about
// the learner's family. Unstated family details remain restricted by the prompt.
export function consistentFamilyReply(npcId, text, context = "") {
  if (!Object.hasOwn(familyProfiles, npcId)) return true;
  const profile = familyProfiles[npcId];
  const ages = {
    我: profile.age,
    [familyRoles[profile.spouse.relation]]: profile.spouse.age,
    [familyRoles[profile.child.relation]]: profile.child.age,
  };
  for (const match of text.matchAll(/我(?:的|和)?(丈夫|妻子|儿子|女儿)/g))
    if (!Object.hasOwn(ages, match[1])) return false;
  const mentioned = Object.keys(ages).filter(
    (role) => role !== "我" && context.includes(role),
  );
  for (const match of text.matchAll(
    /(我(?:的)?(?:丈夫|妻子|儿子|女儿)?|丈夫|妻子|儿子|女儿|他|她)(?:今年|已经)?([零一二两三四五六七八九十\d]+)(多)?岁/g,
  )) {
    if (/(?:你(?:的)?|他(?:的)?|她的)$/.test(text.slice(0, match.index)))
      continue;
    let role = match[1].replace(/^我的?/, "") || "我";
    if (role === "他" || role === "她") {
      if (mentioned.length !== 1) continue;
      role = mentioned[0];
    }
    const age = chineseAge(match[2]);
    const expected = ages[role];
    if (age === null || expected === undefined) continue;
    if (match[3] ? Math.floor(expected / 10) !== age / 10 : age !== expected)
      return false;
  }
  return true;
}
