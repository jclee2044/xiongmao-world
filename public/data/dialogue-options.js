import { conversationOpeningOptions } from "./conversation-subjects.js";
// Presets are translations of complete lines. The original stays in each pool.
const alternatives = new Map([
  [
    "你好！你想吃点什么？",
    [
      [
        "你好！今天想吃什么？",
        "Hello! What would you like to eat today?",
        "nǐ hǎo ！ jīn tiān xiǎng chī shén me ？",
      ],
      [
        "欢迎！你想吃面条吗？",
        "Welcome! Would you like noodles?",
        "huān yíng ！ nǐ xiǎng chī miàn tiáo ma ？",
      ],
    ],
  ],
  [
    "你好！想喝热茶还是冷茶？",
    [
      [
        "欢迎！你想喝冷茶，还是热茶？",
        "Welcome! Would you like cold tea or hot tea?",
        "huān yíng ！ nǐ xiǎng hē lěng chá ， hái shì rè chá ？",
      ],
      [
        "你好！热茶和冷茶都有。你想喝哪一种？",
        "Hello! We have hot and cold tea. Which would you like?",
        "nǐ hǎo ！ rè chá hé lěng chá dōu yǒu 。 nǐ xiǎng hē nǎ yì zhǒng ？",
      ],
    ],
  ],
  [
    "欢迎！看看喜欢哪件衣服。",
    [
      [
        "欢迎！你喜欢哪件衣服？",
        "Welcome! Which piece of clothing do you like?",
        "huān yíng ！ nǐ xǐ huan nǎ jiàn yī fu ？",
      ],
      [
        "你好！先看看衣服吧。喜欢哪件？",
        "Hello! Take a look at the clothes first. Which piece do you like?",
        "nǐ hǎo ！ xiān kàn kàn yī fu ba 。 xǐ huan nǎ jiàn ？",
      ],
    ],
  ],
  [
    "你好！你喜欢什么颜色的花？",
    [
      [
        "你好！你喜欢粉色的花，还是黄色的花？",
        "Hello! Do you like pink flowers or yellow flowers?",
        "nǐ hǎo ！ nǐ xǐ huan fěn sè de huā ， hái shì huáng sè de huā ？",
      ],
      [
        "欢迎！想买什么颜色的花？",
        "Welcome! What color flowers would you like to buy?",
        "huān yíng ！ xiǎng mǎi shén me yán sè de huā ？",
      ],
    ],
  ],
  [
    "你好！你喜欢看故事书还是漫画？",
    [
      [
        "欢迎！故事书和漫画，你喜欢哪一种？",
        "Welcome! Which do you like: storybooks or comics?",
        "huān yíng ！ gù shì shū hé màn huà ， nǐ xǐ huan nǎ yì zhǒng ？",
      ],
      [
        "你好！想看看漫画，还是故事书？",
        "Hello! Would you like to look at comics or storybooks?",
        "nǐ hǎo ！ xiǎng kàn kàn màn huà ， hái shì gù shì shū ？",
      ],
    ],
  ],
  [
    "你好！我在画画。你想画什么？",
    [
      [
        "你好！我们一起画画吧。你想画什么？",
        "Hello! Let's draw together. What would you like to draw?",
        "nǐ hǎo ！ wǒ men yì qǐ huà huà ba 。 nǐ xiǎng huà shén me ？",
      ],
      [
        "我正在画画呢。你也想画吗？",
        "I'm drawing right now. Would you like to draw too?",
        "wǒ zhèng zài huà huà ne 。 nǐ yě xiǎng huà ma ？",
      ],
    ],
  ],
  [
    "你好！今天想去哪里走走？",
    [
      [
        "你好！你今天想去哪儿走走？",
        "Hello! Where would you like to walk today?",
        "nǐ hǎo ！ nǐ jīn tiān xiǎng qù nǎ ér zǒu zǒu ？",
      ],
      [
        "今天想去哪里？我们一起走走吧。",
        "Where would you like to go today? Let's take a walk together.",
        "jīn tiān xiǎng qù nǎ lǐ ？ wǒ men yì qǐ zǒu zǒu ba 。",
      ],
    ],
  ],
  [
    "谢谢！给你。下次再来！",
    [
      [
        "给你！谢谢你，下次再来吧。",
        "Here you are! Thank you. Come again next time.",
        "gěi nǐ ！ xiè xiè nǐ ， xià cì zài lái ba 。",
      ],
      [
        "谢谢你！这是你的东西。下次再来！",
        "Thank you! Here are your things. See you next time!",
        "xiè xiè nǐ ！ zhè shì nǐ de dōng xī 。 xià cì zài lái ！",
      ],
    ],
  ],
  [
    "茶真好喝！和你一起喝茶，我很高兴。",
    [
      [
        "和你一起喝茶真高兴！这茶很好喝。",
        "I'm so happy to have tea with you! This tea tastes good.",
        "hé nǐ yì qǐ hē chá zhēn gāo xìng ！ zhè chá hěn hǎo hē 。",
      ],
      [
        "这茶真好喝！我很高兴能和你一起喝茶。",
        "This tea tastes so good! I'm happy to be able to have tea with you.",
        "zhè chá zhēn hǎo hē ！ wǒ hěn gāo xìng néng hé nǐ yì qǐ hē chá 。",
      ],
    ],
  ],
  [
    "我有点饿了。我们一起去吃火锅，好吗？",
    [
      [
        "我有一点饿。你愿意和我一起去吃火锅吗？",
        "I'm a little hungry. Would you like to go for hotpot with me?",
        "wǒ yǒu yì diǎn è 。 nǐ yuàn yì hé wǒ yì qǐ qù chī huǒ guō ma ？",
      ],
      [
        "有点饿了！我们去吃火锅吧，好吗？",
        "I'm a little hungry! Let's go for hotpot, shall we?",
        "yǒu diǎn è le ！ wǒ men qù chī huǒ guō ba ， hǎo ma ？",
      ],
    ],
  ],
  [
    "你找到我的花了！谢谢你帮我。",
    [
      [
        "谢谢你帮我找到了花！",
        "Thank you for helping me find the flowers!",
        "xiè xiè nǐ bāng wǒ zhǎo dào le huā ！",
      ],
      [
        "我的花找到了！谢谢你的帮助。",
        "My flowers have been found! Thank you for your help.",
        "wǒ de huā zhǎo dào le ！ xiè xiè nǐ de bāng zhù 。",
      ],
    ],
  ],
  [
    "我来拿杯子。你今天过得怎么样？",
    [
      [
        "我去拿杯子。今天过得好吗？",
        "I'll go get the cups. Has your day been good?",
        "wǒ qù ná bēi zi 。 jīn tiān guò de hǎo ma ？",
      ],
      [
        "杯子我来拿吧。你今天怎么样？",
        "Let me get the cups. How are you today?",
        "bēi zi wǒ lái ná ba 。 nǐ jīn tiān zěn me yàng ？",
      ],
    ],
  ],
  [
    "再见！下次再聊天。",
    [
      [
        "下次再聊吧！再见。",
        "Let's chat again next time! Goodbye.",
        "xià cì zài liáo ba ！ zài jiàn 。",
      ],
      [
        "再见！下次我们再聊天。",
        "Goodbye! Let's continue chatting next time.",
        "zài jiàn ！ xià cì wǒ men zài liáo tiān 。",
      ],
    ],
  ],
  [
    "你好！我叫小林。一样的故事，看书和看电影有什么不一样？",
    [
      [
        "你好，我是小林。一样的故事，看书和看电影哪里不一样？",
        "Hi, I'm Lin. For the same story, how are the book and film different?",
        "nǐ hǎo ， wǒ shì xiǎo lín 。 yí yàng de gù shi ， kàn shū hé kàn diàn yǐng nǎ lǐ bù yí yàng ？",
      ],
      [
        "我叫小林。你好！看书和看电影有什么不一样？",
        "I'm Lin. Hello! What's different about reading a book and watching a film?",
        "wǒ jiào xiǎo lín 。 nǐ hǎo ！ kàn shū hé kàn diàn yǐng yǒu shén me bù yí yàng ？",
      ],
    ],
  ],
  [
    "你好！苹果和橘子都很新鲜。想买几个？",
    [
      [
        "你好！这些苹果和橘子很新鲜。你要几个？",
        "Hello! These apples and tangerines are fresh. How many would you like?",
        "nǐ hǎo ！ zhè xiē píng guǒ hé jú zǐ hěn xīn xiān 。 nǐ yào jǐ gè ？",
      ],
      [
        "苹果和橘子都很新鲜！你好，想要几个？",
        "The apples and tangerines are fresh! Hello, how many would you like?",
        "píng guǒ hé jú zǐ dōu hěn xīn xiān ！ nǐ hǎo ， xiǎng yào jǐ gè ？",
      ],
    ],
  ],
  [
    "你好！我要去书店。你想去哪里？",
    [
      [
        "你好！我要去书店。你要去哪儿？",
        "Hello! I'm just about to go to the bookshop. Where are you going?",
        "nǐ hǎo ！ wǒ yào qù shū diàn 。 nǐ yào qù nǎ ér ？",
      ],
      [
        "我要去书店。你好，你今天想去哪里？",
        "I'm going to the bookshop. Hello, where would you like to go today?",
        "wǒ yào qù shū diàn 。 nǐ hǎo ， nǐ jīn tiān xiǎng qù nǎ lǐ ？",
      ],
    ],
  ],
  [
    "这件衣服虽然简单，但是很好看。你喜欢什么颜色？",
    [
      [
        "这件衣服很简单，也很好看。你喜欢什么颜色？",
        "This piece of clothing is simple and looks nice. What color do you like?",
        "zhè jiàn yī fu hěn jiǎn dān ， yě hěn hǎo kàn 。 nǐ xǐ huan shén me yán sè ？",
      ],
      [
        "这件衣服又简单又好看。什么颜色是你喜欢的？",
        "This piece of clothing is both simple and nice looking. What color do you like?",
        "zhè jiàn yī fu yòu jiǎn dān yòu hǎo kàn 。 shén me yán sè shì nǐ xǐ huan de ？",
      ],
    ],
  ],
  [
    "今天天气真好！你喜欢晴天还是雨天？",
    [
      [
        "今天是个好天气！晴天和雨天，你喜欢哪一种？",
        "The weather is good today! Which do you like: sunny days or rainy days?",
        "jīn tiān shì gè hǎo tiān qì ！ qíng tiān hé yǔ tiān ， nǐ xǐ huan nǎ yì zhǒng ？",
      ],
      [
        "今天天气很好。你更喜欢晴天，还是雨天？",
        "The weather is very good today. Do you prefer sunny days or rainy days?",
        "jīn tiān tiān qì hěn hǎo 。 nǐ gèng xǐ huan qíng tiān ， hái shì yǔ tiān ？",
      ],
    ],
  ],
  [
    "我在找花店。你能告诉我怎么走吗？",
    [
      [
        "我想找花店。你知道怎么走吗？",
        "I'm looking for the flower shop. Do you know how to get there?",
        "wǒ xiǎng zhǎo huā diàn 。 nǐ zhī dào zěn me zǒu ma ？",
      ],
      [
        "请问，花店怎么走？我正在找呢。",
        "Excuse me, how do I get to the flower shop? I'm looking for it.",
        "qǐng wèn ， huā diàn zěn me zǒu ？ wǒ zhèng zài zhǎo ne 。",
      ],
    ],
  ],
  [
    "我刚才买了橘子。你喜欢甜的水果吗？",
    [
      [
        "我刚才买了橘子。甜的水果，你喜欢吗？",
        "I just bought tangerines. Do you like sweet fruit?",
        "wǒ gāng cái mǎi le jú zǐ 。 tián de shuǐ guǒ ， nǐ xǐ huan ma ？",
      ],
      [
        "刚才我买了橘子。你爱吃甜的水果吗？",
        "I bought tangerines just now. Do you enjoy sweet fruit?",
        "gāng cái wǒ mǎi le jú zǐ 。 nǐ ài chī tián de shuǐ guǒ ma ？",
      ],
    ],
  ],
  [
    "我想画这里。你觉得怎么样？",
    [
      [
        "我想把这里画下来。你觉得好吗？",
        "I want to draw this place. Do you think that's a good idea?",
        "wǒ xiǎng bǎ zhè lǐ huà xià lái 。 nǐ jué de hǎo ma ？",
      ],
      [
        "这里我想画一画。你觉得怎么样呢？",
        "I'd like to draw this place. What do you think?",
        "zhè lǐ wǒ xiǎng huà yi huà 。 nǐ jué de zěn me yàng ne ？",
      ],
    ],
  ],
  [
    "走路要小心。我们慢慢走吧！",
    [
      [
        "我们走慢一点吧。走路要小心！",
        "Let's walk a little more slowly. Be careful when walking!",
        "wǒ men zǒu màn yì diǎn ba 。 zǒu lù yào xiǎo xīn ！",
      ],
      [
        "走路小心一点。我们不着急，慢慢走。",
        "Be a little careful when walking. We're not in a hurry; let's walk slowly.",
        "zǒu lù xiǎo xīn yì diǎn 。 wǒ men bù zháo jí ， màn màn zǒu 。",
      ],
    ],
  ],
  [
    "我想喝一杯热茶。你想喝什么？",
    [
      [
        "我想要一杯热茶。你呢，想喝什么？",
        "I'd like a cup of hot tea. What about you: what would you like to drink?",
        "wǒ xiǎng yào yì bēi rè chá 。 nǐ ne ， xiǎng hē shén me ？",
      ],
      [
        "一杯热茶是我想喝的。你想喝什么呢？",
        "A cup of hot tea is what I'd like to drink. What would you like?",
        "yì bēi rè chá shì wǒ xiǎng hē de 。 nǐ xiǎng hē shén me ne ？",
      ],
    ],
  ],
  [
    "欢迎！这里的东西都有很长的历史。你想先看什么？",
    [
      [
        "欢迎！这些东西都有很长的历史。你先想看哪一个？",
        "Welcome! These objects all have a long history. Which would you like to see first?",
        "huān yíng ！ zhè xiē dōng xī dōu yǒu hěn cháng de lì shǐ 。 nǐ xiān xiǎng kàn nǎ yí gè ？",
      ],
      [
        "欢迎你来！这里的东西历史都很长。想先看什么？",
        "Welcome! All the objects here have a long history. What would you like to see first?",
        "huān yíng nǐ lái ！ zhè lǐ de dōng xī lì shǐ dōu hěn cháng 。 xiǎng xiān kàn shén me ？",
      ],
    ],
  ],
  [
    "欢迎！想吃面条，还是一起吃火锅？",
    [
      [
        "欢迎！你想吃面条，还是和朋友吃火锅？",
        "Welcome! Would you like noodles or hotpot with friends?",
        "huān yíng ！ nǐ xiǎng chī miàn tiáo ， hái shì hé péng yǒu chī huǒ guō ？",
      ],
      [
        "欢迎你来！一起吃火锅，还是吃面条？",
        "Welcome! Shall we have hotpot together or eat noodles?",
        "huān yíng nǐ lái ！ yì qǐ chī huǒ guō ， hái shì chī miàn tiáo ？",
      ],
    ],
  ],
  [
    "欢迎来到山塘！你喜欢听故事，还是听音乐？",
    [
      [
        "欢迎来山塘！故事和音乐，你喜欢听哪一种？",
        "Welcome to Shantang! Which do you like listening to: stories or music?",
        "huān yíng lái shān táng ！ gù shì hé yīn yuè ， nǐ xǐ huan tīng nǎ yì zhǒng ？",
      ],
      [
        "山塘欢迎你！你爱听故事，还是音乐？",
        "Shantang welcomes you! Do you enjoy listening to stories or music?",
        "shān táng huān yíng nǐ ！ nǐ ài tīng gù shì ， hái shì yīn yuè ？",
      ],
    ],
  ],
  [
    "我有点饿了。你愿意和我一起吃东西吗？",
    [
      [
        "我有一点饿。我们一起吃点东西，好吗？",
        "I'm a little hungry. Shall we eat something together?",
        "wǒ yǒu yì diǎn è 。 wǒ men yì qǐ chī diǎn dōng xī ， hǎo ma ？",
      ],
      [
        "有点饿了。你想和我一起吃东西吗？",
        "I'm a little hungry. Would you like to eat something with me?",
        "yǒu diǎn è le 。 nǐ xiǎng hé wǒ yì qǐ chī dōng xī ma ？",
      ],
    ],
  ],
  [
    "真好吃！你喜欢吃什么？",
    [
      [
        "这真好吃！你最喜欢吃什么？",
        "This tastes so good! What do you like eating best?",
        "zhè zhēn hǎo chī ！ nǐ zuì xǐ huan chī shén me ？",
      ],
      [
        "真好吃啊！什么东西是你喜欢吃的？",
        "So delicious! What things do you like eating?",
        "zhēn hǎo chī a ！ shén me dōng xī shì nǐ xǐ huan chī de ？",
      ],
    ],
  ],
  [
    "我喜欢蘑菇。我们再点一盘吧！",
    [
      [
        "蘑菇我很喜欢。再点一盘，好吗？",
        "I really like mushrooms. Shall we order another plate?",
        "mó gu wǒ hěn xǐ huan 。 zài diǎn yì pán ， hǎo ma ？",
      ],
      [
        "我爱吃蘑菇。我们再要一盘吧！",
        "I love eating mushrooms. Let's have another plate!",
        "wǒ ài chī mó gu 。 wǒ men zài yào yì pán ba ！",
      ],
    ],
  ],
  [
    "蛋糕做好了。你想吃吗？",
    [
      [
        "蛋糕已经做好了。想吃一点吗？",
        "The cakes are ready. Would you like some?",
        "dàn gāo yǐ jīng zuò hǎo le 。 xiǎng chī yì diǎn ma ？",
      ],
      [
        "蛋糕做好了！你要尝尝吗？",
        "The cakes are ready! Would you like a taste?",
        "dàn gāo zuò hǎo le ！ nǐ yào cháng cháng ma ？",
      ],
    ],
  ],
  [
    "我正在写一本小说。故事里有一个苏州的花园。",
    [
      [
        "我在写一本小说。故事里有苏州的一个花园。",
        "I'm writing a novel. There is a garden in Suzhou in the story.",
        "wǒ zhèng zài dú sū zhōu de gù shì 。 zhè lǐ de huā yuán ， nǐ qù guò ma ？",
      ],
      [
        "我正在写一本小说。一个苏州的花园在故事里。",
        "I'm writing a novel. There is a garden in Suzhou in the story.",
        "wǒ zài kàn guān yú sū zhōu de gù shì 。 nǐ qù guò zhè ér de huā yuán ma ？",
      ],
    ],
  ],
  [
    "你看这块石头像什么？",
    [
      [
        "看看这块石头。你觉得像什么？",
        "Look at this rock. What do you think it looks like?",
        "kàn kàn zhè kuài shí tou 。 nǐ jué de xiàng shén me ？",
      ],
      [
        "这块石头，你看像什么呢？",
        "What does this rock look like to you?",
        "zhè kuài shí tou ， nǐ kàn xiàng shén me ne ？",
      ],
    ],
  ],
  [
    "这个礼物上有花。你喜欢吗？",
    [
      [
        "你看，礼物上有花。你喜欢这个礼物吗？",
        "Look, there are flowers on the gift. Do you like a gift like this?",
        "nǐ kàn ， lǐ wù shàng yǒu huā 。 nǐ xǐ huan zhè ge lǐ wù ma ？",
      ],
      [
        "这个礼物上有花呢。你觉得喜欢吗？",
        "This gift has flowers on it. Do you think you like it?",
        "zhè ge lǐ wù shàng yǒu huā ní 。 nǐ jué de xǐ huan ma ？",
      ],
    ],
  ],
  [
    "我们一起玩！一、二、三！",
    [
      [
        "来，一起玩吧！一、二、三！",
        "Come, let's play together! One, two, three!",
        "lái ， yì qǐ wán ba ！ yī 、 èr 、 sān ！",
      ],
      [
        "一、二、三！我们一起玩吧！",
        "One, two, three! Let's play together!",
        "yī 、 èr 、 sān ！ wǒ men yì qǐ wán ba ！",
      ],
    ],
  ],
  [
    "一、二、三！到你了！",
    [
      [
        "一、二、三！现在到你了！",
        "One, two, three! Now it's your turn!",
        "yī 、 èr 、 sān ！ xiàn zài dào nǐ le ！",
      ],
      [
        "一、二、三！你来吧！",
        "One, two, three! You have a go!",
        "yī 、 èr 、 sān ！ nǐ lái ba ！",
      ],
    ],
  ],
  [
    "来一块蛋糕吧，甜甜的！",
    [
      [
        "蛋糕甜甜的！来一块吧。",
        "The cake is sweet! Have a piece.",
        "dàn gāo tián tián de ！ lái yí kuài ba 。",
      ],
      [
        "想吃一块蛋糕吗？甜甜的呢！",
        "Would you like a piece of cake? It's sweet!",
        "xiǎng chī yí kuài dàn gāo ma ？ tián tián de ne ！",
      ],
    ],
  ],
  [
    "谢谢你！这些花是送给奶奶的。你想给谁送花？",
    [
      [
        "这些花要送给奶奶。谢谢你！你想送花给谁？",
        "These flowers are for Grandma. Thank you! Who would you like to give flowers to?",
        "zhè xiē huā yào sòng gěi nǎi nai 。 xiè xiè nǐ ！ nǐ xiǎng sòng huā gěi shuí ？",
      ],
      [
        "谢谢你的帮助！我要把这些花送给奶奶。你想给谁送花？",
        "Thank you for your help! I'll give these flowers to Grandma. Who would you like to give flowers to?",
        "xiè xiè nǐ de bāng zhù ！ wǒ yào bǎ zhè xiē huā sòng gěi nǎi nai 。 nǐ xiǎng gěi shuí sòng huā ？",
      ],
    ],
  ],
  [
    "我的花不见了！我刚才去过河那边的石头旁边。你能帮我找找吗？",
    [
      [
        "我的花找不到了！刚才我在河那边的石头旁边。能帮我找找吗？",
        "I can't find my flowers! I was beside the rocks across the canal just now. Could you help me look?",
        "wǒ de huā zhǎo bú dào le ！ gāng cái wǒ zài hé nà biān de shí tou páng biān 。 néng bāng wǒ zhǎo zhǎo ma ？",
      ],
      [
        "你能帮我找花吗？我的花不见了！我刚才去过河那边的石头旁边。",
        "Could you help me look for my flowers? They're missing! I was just beside the rocks across the canal.",
        "nǐ néng bāng wǒ zhǎo huā ma ？ wǒ de huā bú jiàn le ！ wǒ gāng cái qù guò hé nà biān de shí tou páng biān 。",
      ],
    ],
  ],
  [
    "今天不忙，我想和朋友聊聊天。你愿意和我一起喝茶吗？",
    [
      [
        "今天我不忙。想和朋友聊天，你愿意一起喝茶吗？",
        "I'm not busy today. I'd like to chat with a friend; would you like to have tea together?",
        "jīn tiān wǒ bù máng 。 xiǎng hé péng yǒu liáo tiān ， nǐ yuàn yì yì qǐ hē chá ma ？",
      ],
      [
        "你愿意和我一起喝茶吗？今天不忙，我想和朋友聊聊天。",
        "Would you like to have tea with me? I'm not busy today and would like to chat with a friend.",
        "nǐ yuàn yì hé wǒ yì qǐ hē chá ma ？ jīn tiān bù máng ， wǒ xiǎng hé péng yǒu liáo liáo tiān 。",
      ],
    ],
  ],
  [
    "我马上过去。我们在花园里的茶桌子旁边见面吧！",
    [
      [
        "我马上就来！在花园里的茶桌子旁边见面吧。",
        "I'll come right away! Let's meet beside the tea table in the garden.",
        "wǒ mǎ shàng jiù lái ！ zài huā yuán lǐ de chá zhuō zi páng biān jiàn miàn ba 。",
      ],
      [
        "在花园里的茶桌子旁边见面吧！我马上过去。",
        "Let's meet beside the tea table in the garden! I'll come right away.",
        "zài huā yuán lǐ de chá zhuō zi páng biān jiàn miàn ba ！ wǒ mǎ shàng guò qù 。",
      ],
    ],
  ],
  [
    "谢谢你请我吃火锅！羊在你家里。",
    [
      [
        "谢谢你请我吃火锅！那只羊已经在你家里了。",
        "Thank you for treating me to hotpot! That sheep is already in your home.",
        "xiè xiè nǐ qǐng wǒ chī huǒ guō ！ nà zhī yáng yǐ jīng zài nǐ jiā lǐ le 。",
      ],
      [
        "羊在你家里了。谢谢你请我吃火锅！",
        "The sheep is in your home now. Thank you for treating me to hotpot!",
        "yáng zài nǐ jiā lǐ le 。 xiè xiè nǐ qǐng wǒ chī huǒ guō ！",
      ],
    ],
  ],
  [
    "谢谢你请我吃火锅！这只羊送给你。",
    [
      [
        "这只羊送给你！谢谢你请我吃火锅。",
        "This sheep is for you! Thank you for treating me to hotpot.",
        "zhè zhī yáng sòng gěi nǐ ！ xiè xiè nǐ qǐng wǒ chī huǒ guō 。",
      ],
      [
        "谢谢你请我吃火锅。这只羊是给你的礼物！",
        "Thank you for treating me to hotpot. This sheep is a gift for you!",
        "xiè xiè nǐ qǐng wǒ chī huǒ guō 。 zhè zhī yáng shì gěi nǐ de lǐ wù ！",
      ],
    ],
  ],
  [
    "您要这些，对吗？",
    [
      [
        "请问，您要的是这些吗？",
        "Excuse me, are these what you'd like?",
        "qǐng wèn ， nín yào de shì zhè xiē ma ？",
      ],
      [
        "这些是您想要的，对吧？",
        "These are what you'd like, right?",
        "zhè xiē shì nín xiǎng yào de ， duì ba ？",
      ],
    ],
  ],
  [
    "菜来了！把东西放进火锅里吧。",
    [
      [
        "吃的东西来了！放进火锅里吧。",
        "The ingredients are here! Put them in the hotpot.",
        "chī de dōng xī lái le ！ fàng jìn huǒ guō lǐ ba 。",
      ],
      [
        "菜来了！我们把东西放进火锅里吧。",
        "The ingredients are here! Let's put them in the hotpot.",
        "cài lái le ！ wǒ men bǎ dōng xī fàng jìn huǒ guō lǐ ba 。",
      ],
    ],
  ],
  [
    "吃饱了！真好吃。",
    [
      [
        "真好吃！我吃饱了。",
        "That was delicious! I'm full.",
        "zhēn hǎo chī ！ wǒ chī bǎo le 。",
      ],
      [
        "吃得很饱！真好吃啊。",
        "I'm very full! That was so delicious.",
        "chī de hěn bǎo ！ zhēn hǎo chī a 。",
      ],
    ],
  ],
  [
    "太好了！你想用手机还是信用卡？",
    [
      [
        "好！你想用信用卡，还是手机？",
        "Great! Would you like to use a credit card or your phone?",
        "hǎo ！ nǐ xiǎng yòng xìn yòng kǎ ， hái shì shǒu jī ？",
      ],
      [
        "太好了！用手机还是用信用卡呢？",
        "Great! Will you use your phone or a credit card?",
        "tài hǎo le ！ yòng shǒu jī hái shì yòng xìn yòng kǎ ne ？",
      ],
    ],
  ],
  [
    "可以！请拿出手机。",
    [
      [
        "可以的。请把手机拿出来。",
        "Yes, you can. Please take out your phone.",
        "kě yǐ de 。 qǐng bǎ shǒu jī ná chū lái 。",
      ],
      [
        "可以用手机！请拿出来吧。",
        "You can use your phone! Please take it out.",
        "kě yǐ yòng shǒu jī ！ qǐng ná chū lái ba 。",
      ],
    ],
  ],
  [
    "可以！请拿出信用卡。",
    [
      [
        "可以的。请把信用卡拿出来。",
        "Yes, you can. Please take out your credit card.",
        "kě yǐ de 。 qǐng bǎ xìn yòng kǎ ná chū lái 。",
      ],
      [
        "可以用信用卡！请拿出来吧。",
        "You can use a credit card! Please take it out.",
        "kě yǐ yòng xìn yòng kǎ ！ qǐng ná chū lái ba 。",
      ],
    ],
  ],
  [
    "买好了！这是你的衣服。谢谢你！",
    [
      [
        "谢谢你！衣服买好了，给你。",
        "Thank you! Your clothes have been purchased; here you are.",
        "xiè xiè nǐ ！ yī fu mǎi hǎo le ， gěi nǐ 。",
      ],
      [
        "你的衣服买好了！给你，谢谢！",
        "Your clothes have been purchased! Here you are, thank you!",
        "nǐ de yī fu mǎi hǎo le ！ gěi nǐ ， xiè xiè ！",
      ],
    ],
  ],
  [
    "别着急，我们一起想。",
    [
      [
        "不用着急。我们一起想想吧。",
        "There's no need to hurry. Let's think together.",
        "bú yòng zháo jí 。 wǒ men yì qǐ xiǎng xiǎng ba 。",
      ],
      [
        "我们一起想想。慢慢来，别着急。",
        "Let's think together. Take your time; don't hurry.",
        "wǒ men yì qǐ xiǎng xiǎng 。 màn màn lái ， bié zháo jí 。",
      ],
    ],
  ],
]);
export function dialogueOptions(base) {
  const original = {
    ...base,
    chinese: base.chinese ?? base.zh,
    topic: base.topic || "activities",
  };
  if (base.purpose === "opening" && base.npcId)
    return [
      original,
      ...conversationOpeningOptions(base.npcId).map((line) => ({
        ...original,
        ...line,
      })),
    ];
  const custom = alternatives.get(original.chinese);
  if (custom)
    return [
      original,
      ...custom.map(([chinese, meaning, pinyin]) => ({
        ...original,
        chinese,
        meaning,
        pinyin,
      })),
    ];
  // Without scene-specific alternatives, keep the authored line. Generic
  // reassurance made unrelated prices, routes and clues sound repetitive.
  return [original];
}
