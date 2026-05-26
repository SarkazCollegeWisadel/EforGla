const WORD_BANK = {
  easy: [
    { english: "apple", chinese: "苹果", phonetic: "/ˈæpəl/", example: "I eat an apple every morning.", exampleChinese: "我每天早上吃一个苹果。" },
    { english: "book", chinese: "书", phonetic: "/bʊk/", example: "This book is very interesting.", exampleChinese: "这本书很有趣。" },
    { english: "cat", chinese: "猫", phonetic: "/kæt/", example: "The cat is sleeping near the window.", exampleChinese: "猫正在窗边睡觉。" },
    { english: "dog", chinese: "狗", phonetic: "/dɔːɡ/", example: "The dog runs across the garden.", exampleChinese: "狗跑过花园。" },
    { english: "egg", chinese: "鸡蛋", phonetic: "/eɡ/", example: "She had an egg for breakfast.", exampleChinese: "她早餐吃了一个鸡蛋。" },
    { english: "fish", chinese: "鱼", phonetic: "/fɪʃ/", example: "There are many fish in the lake.", exampleChinese: "湖里有很多鱼。" },
    { english: "girl", chinese: "女孩", phonetic: "/ɡɜːrl/", example: "The girl is drawing a flower.", exampleChinese: "女孩正在画一朵花。" },
    { english: "house", chinese: "房子", phonetic: "/haʊs/", example: "The house has a blue door.", exampleChinese: "这栋房子有一扇蓝色的门。" },
    { english: "ice", chinese: "冰", phonetic: "/aɪs/", example: "The ice melts in the sun.", exampleChinese: "冰在阳光下融化。" },
    { english: "jump", chinese: "跳跃", phonetic: "/dʒʌmp/", example: "The rabbit can jump very high.", exampleChinese: "兔子能跳得很高。" }
  ],
  medium: [
    { english: "beautiful", chinese: "美丽的", phonetic: "/ˈbjuːtɪfəl/", example: "The sunset is beautiful tonight.", exampleChinese: "今晚的日落很美。" },
    { english: "mountain", chinese: "山", phonetic: "/ˈmaʊntən/", example: "We climbed the mountain yesterday.", exampleChinese: "我们昨天爬了那座山。" },
    { english: "travel", chinese: "旅行", phonetic: "/ˈtrævəl/", example: "I want to travel around the world.", exampleChinese: "我想环游世界。" },
    { english: "science", chinese: "科学", phonetic: "/ˈsaɪəns/", example: "Science helps us understand the world.", exampleChinese: "科学帮助我们理解世界。" },
    { english: "history", chinese: "历史", phonetic: "/ˈhɪstəri/", example: "History is my favorite subject.", exampleChinese: "历史是我最喜欢的科目。" },
    { english: "weather", chinese: "天气", phonetic: "/ˈweðər/", example: "The weather is nice today.", exampleChinese: "今天天气很好。" },
    { english: "picture", chinese: "图片", phonetic: "/ˈpɪktʃər/", example: "I took a picture of the flowers.", exampleChinese: "我给花拍了一张照片。" },
    { english: "garden", chinese: "花园", phonetic: "/ˈɡɑːrdən/", example: "There are roses in the garden.", exampleChinese: "花园里有玫瑰。" }
  ],
  hard: [
    { english: "adventure", chinese: "冒险", phonetic: "/ədˈventʃər/", example: "Life is an adventure.", exampleChinese: "生活是一场冒险。" },
    { english: "knowledge", chinese: "知识", phonetic: "/ˈnɑːlɪdʒ/", example: "Knowledge is power.", exampleChinese: "知识就是力量。" },
    { english: "experience", chinese: "经验；经历", phonetic: "/ɪkˈspɪriəns/", example: "Travel is a great experience.", exampleChinese: "旅行是一种很棒的经历。" },
    { english: "university", chinese: "大学", phonetic: "/ˌjuːnɪˈvɜːrsəti/", example: "She studies at a famous university.", exampleChinese: "她在一所著名大学学习。" },
    { english: "technology", chinese: "技术", phonetic: "/tekˈnɑːlədʒi/", example: "Technology changes our lives.", exampleChinese: "技术改变我们的生活。" },
    { english: "environment", chinese: "环境", phonetic: "/ɪnˈvaɪrənmənt/", example: "We should protect the environment.", exampleChinese: "我们应该保护环境。" },
    { english: "impossible", chinese: "不可能的", phonetic: "/ɪmˈpɑːsəbəl/", example: "Nothing is impossible if you try.", exampleChinese: "只要尝试，没有什么是不可能的。" },
    { english: "communication", chinese: "交流；沟通", phonetic: "/kəˌmjuːnɪˈkeɪʃən/", example: "Communication is very important.", exampleChinese: "沟通非常重要。" }
  ]
};

const DIFFICULTY_CONFIG = {
  easy: { label: "简单 (初中)", wordCount: 5, expReward: 10, wordBank: "easy" },
  medium: { label: "中等 (CET-4)", wordCount: 5, expReward: 18, wordBank: "medium" },
  hard: { label: "困难 (CET-6)", wordCount: 5, expReward: 26, wordBank: "hard" }
};

const EXP_CONFIG = {
  expPerWord: 15,
  expPerQuizCorrect: 18,
  expPerTestCorrect: 24,
  expToNextLevelBase: 100,
  expToNextLevelMultiplier: 1.45
};

const AFFECTION_CONFIG = {
  perWordLearn: 1,
  perQuizCorrect: 2,
  perTestCorrect: 3,
  perWrong: -1,
  maxAffection: 100
};
