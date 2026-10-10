// Fixed interests keep people with shared book sprites distinct.
const line = (chinese, meaning, pinyin, topic = "school") => ({ chinese, meaning, pinyin, topic });
export const bookProfiles = {
  reader: {
    context: "Shu is writing a novel about a friend who lives in Suzhou. He has visited this garden before and likes its flowers, trees and quiet paths. He writes a little every day, first thinking about the people and then writing their story. These are fixed fictional facts. Discuss his writing and ideas rather than repeatedly asking what books the learner likes.",
    openings: {
      reading: line("我正在写一本小说。你觉得故事里应该有谁？", "I'm writing a novel. Who do you think should be in the story?", "wǒ zhèng zài xiě yì běn xiǎo shuō 。 nǐ jué de gù shi lǐ yīng gāi yǒu shéi ？"),
      gardens: line("我想把花园写进故事里。你觉得这里像谁的家？", "I want to put a garden in the story. Whose home do you think this place looks like?", "wǒ xiǎng bǎ huā yuán xiě jìn gù shi lǐ 。 nǐ jué de zhè lǐ xiàng shéi de jiā ？", "activities"),
    },
    starters: { reading: "你在写什么小说？", gardens: "你以前来过这个花园吗？喜欢这里的什么？" },
    writing: [
      line("我在写一个朋友住在苏州的故事。你觉得他每天做什么？", "I'm writing a story about a friend living in Suzhou. What do you think he does every day?", "wǒ zài xiě yí gè péng yǒu zhù zài sū zhōu de gù shi 。 nǐ jué de tā měi tiān zuò shén me ？"),
      line("我先想想故事里的人，再写他们每天做的事。", "I first think about the people in the story, then write about their lives.", "wǒ xiān xiǎng xiǎng gù shi lǐ de rén ， zài xiě tā men měi tiān zuò de shì 。"),
      line("我每天写一点。今天想写花园里的朋友。", "I write a little every day. Today I want to write about friends in a garden.", "wǒ měi tiān xiě yì diǎn 。 jīn tiān xiǎng xiě huā yuán lǐ de péng yǒu 。"),
    ],
    garden: line("来过。我喜欢这里的花和树，也喜欢这里很安静。", "Yes, I've been here. I like the flowers and trees here, and I also like how quiet it is.", "lái guò 。 wǒ xǐ huan zhè lǐ de huā hé shù ， yě xǐ huan zhè lǐ hěn ān jìng 。", "activities"),
  },
  lin: {
    context: "Lin is a university student who enjoys comparing books with films of the same story. He likes reading to understand what people think, and films for their music and pictures. Discuss differences, endings and whether to read or watch first; do not name real titles or invent shared viewing memories.",
    openings: {
      reading: line("一样的故事，你想先看书，还是先看电影？", "For the same story, would you like to read the book first or watch the film first?", "yí yàng de gù shi ， nǐ xiǎng xiān kàn shū ， hái shì xiān kàn diàn yǐng ？"),
      music: line("电影里的音乐会让故事更有意思吗？", "Does the music in a film make the story more interesting?", "diàn yǐng lǐ de yīn yuè huì ràng gù shi gèng yǒu yì si ma ？", "activities"),
    },
    starters: { reading: "书和电影有什么不一样？", music: "你为什么喜欢电影里的音乐？" },
    comparison: [
      line("看书的时候，我可以慢慢想。看电影的时候，我可以听音乐。", "When reading, I can think at my own pace. When watching a film, I can listen to music.", "kàn shū de shí hòu ， wǒ kě yǐ màn màn xiǎng 。 kàn diàn yǐng de shí hòu ， wǒ kě yǐ tīng yīn yuè 。"),
      line("书可以写出一个人在想什么。电影可以让我们看见他在做什么。", "A book can describe what someone is thinking. A film can show us what they are doing.", "shū kě yǐ xiě chū yí gè rén zài xiǎng shén me 。 diàn yǐng kě yǐ ràng wǒ men kàn jiàn tā zài zuò shén me 。"),
    ],
  },
};
export const bookOpeningLine = (npcId, subject) => bookProfiles[npcId]?.openings[subject];
export const bookStarter = (npcId, subject) => bookProfiles[npcId]?.starters[subject];

export function bookStoryReply(npcId, text, shown, choose) {
  const profile = bookProfiles[npcId];
  if (!profile) return null;
  if (/^(你好[！!。，\s]*|hello|hi|hey)$/i.test(text)) return null;
  if (npcId === "reader") {
    if (/花园|garden/i.test(text) && /来过|去过|以前|喜欢|什么|为什么|been|visited|like|why/i.test(text)) return profile.garden;
    if (/写|小说|\b(?:writ\w*|novel|author)\b/i.test(text)) return choose(profile.writing);
    if (/故事|小说/.test(shown) && /朋友|老师|学生|孩子|熊猫|猫|狗|一个人|他|她|\b(?:friend|teacher|student|child|panda|cat|dog)\b/i.test(text) && !/[?？]|你.*(?:吗|什么|怎么|几|哪)/.test(text) && !/茶|吃|去哪|再见/.test(text))
      return line("你说的很有意思。我想想怎么把它写进故事里。", "That idea is interesting. I'll think about how to put it in the story.", "nǐ shuō de hěn yǒu yì si 。 wǒ xiǎng xiǎng zěn me bǎ tā xiě jìn gù shi lǐ 。");
  }
  if (npcId === "lin" && /电影|\b(?:movie|film)\b/i.test(text)) {
    if (/音乐|music/i.test(text)) return line("音乐可以让人高兴，也可以让人难过。", "Music can make people happy, and it can also make people sad.", "yīn yuè kě yǐ ràng rén gāo xìng ， yě kě yǐ ràng rén nán guò 。", "activities");
    return choose(profile.comparison);
  }
  return null;
}
