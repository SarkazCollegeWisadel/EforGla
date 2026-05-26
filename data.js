/* ════════════════════════════════════════════════
   EforGla (语之恋) V1.6 — Configuration & Constants
   ════════════════════════════════════════════════ */

/* ── Word bank definitions ── */
const VOCABULARY_BANKS = {
  middle_school: { id: "middle_school", file: "middle_school.json", label: "初中", category: "basic" },
  cet4: { id: "cet4", file: "cet4.json", label: "CET-4", category: "standard" },
  cet6: { id: "cet6", file: "cet6.json", label: "CET-6", category: "advanced" }
};

const DEFAULT_VOCABULARY = "cet4";

/* ── Learning range presets ── */
const RANGE_PRESETS = [
  { id: "1-20", label: "1 ~ 20", start: 0, end: 20 },
  { id: "21-50", label: "21 ~ 50", start: 20, end: 50 },
  { id: "51-100", label: "51 ~ 100", start: 50, end: 100 },
  { id: "101-200", label: "101 ~ 200", start: 100, end: 200 },
  { id: "all", label: "全部", start: 0, end: Infinity },
  { id: "custom", label: "自定义", start: 0, end: 50 }
];

/* ── Learning count presets (per session) ── */
const COUNT_PRESETS = [
  { id: "10", label: "10 词", value: 10 },
  { id: "20", label: "20 词", value: 20 },
  { id: "30", label: "30 词", value: 30 },
  { id: "50", label: "50 词", value: 50 },
  { id: "custom", label: "自定义", value: 20 }
];

const DEFAULT_LEARN_COUNT = 20;

/* ── Word filter presets ── */
const SORT_MODE_PRESETS = [
  { id: "frequency", label: "高频优先" },
  { id: "az", label: "A-Z" },
  { id: "sequential", label: "顺序" }
];

const FILTER_PRESETS = [
  { id: "sequential", label: "顺序学习" },
  { id: "frequency", label: "高频词优先" },
  { id: "az", label: "A-Z" }
];

const DIFFICULTY_RANGE_PRESETS = [
  { id: "1-2", label: "1-2星", min: 1, max: 2 },
  { id: "3", label: "3星", min: 3, max: 3 },
  { id: "4-5", label: "4-5星", min: 4, max: 5 }
];

/* ── AI Provider defaults ── */
const PROVIDER_CONFIG = {
  mock: { label: "本地离线 (Mock)", apiKey: false, endpoint: false, model: false },
  deepseek: { label: "DeepSeek", apiKey: true, endpoint: true, model: true, defaultModel: "deepseek-v4-flash", defaultEndpoint: "https://api.deepseek.com/v1" },
  openai: { label: "OpenAI", apiKey: true, endpoint: true, model: true, defaultModel: "gpt-4o", defaultEndpoint: "https://api.openai.com/v1" },
  claude: { label: "Claude", apiKey: true, endpoint: false, model: true, defaultModel: "claude-sonnet-4-6" },
  gemini: { label: "Gemini", apiKey: true, endpoint: false, model: true, defaultModel: "gemini-2.0-flash" }
};

const DEFAULT_PROVIDER = "deepseek";
const DEFAULT_MODEL = "deepseek-v4-flash";

/* ── Experience & Affection ── */
const EXP_CONFIG = {
  expPerWord: 15,
  expPerQuizCorrect: 18,
  expPerTestCorrect: 24,
  expPerConversation: 12,
  expToNextLevelBase: 100,
  expToNextLevelMultiplier: 1.45
};

const AFFECTION_CONFIG = {
  perWordLearn: 1,
  perQuizCorrect: 2,
  perTestCorrect: 3,
  perConversation: 2,
  perWrong: -1,
  maxAffection: 100
};

/* ── Built-in fallback word bank (minimal, loaded from JSON normally) ── */
const WORD_BANK = {
  easy: [
    { english: "apple", chinese: "苹果", phonetic: "/ˈæpəl/", example: "I eat an apple every morning.", exampleChinese: "我每天早上吃一个苹果。" },
    { english: "book", chinese: "书", phonetic: "/bʊk/", example: "This book is very interesting.", exampleChinese: "这本书很有趣。" },
    { english: "cat", chinese: "猫", phonetic: "/kæt/", example: "The cat is sleeping near the window.", exampleChinese: "猫正在窗边睡觉。" },
    { english: "dog", chinese: "狗", phonetic: "/dɔːɡ/", example: "The dog runs across the garden.", exampleChinese: "狗跑过花园。" },
    { english: "egg", chinese: "鸡蛋", phonetic: "/eɡ/", example: "She had an egg for breakfast.", exampleChinese: "她早餐吃了一个鸡蛋。" }
  ],
  medium: [
    { english: "beautiful", chinese: "美丽的", phonetic: "/ˈbjuːtɪfəl/", example: "The sunset is beautiful tonight.", exampleChinese: "今晚的日落很美。" },
    { english: "mountain", chinese: "山", phonetic: "/ˈmaʊntən/", example: "We climbed the mountain yesterday.", exampleChinese: "我们昨天爬了那座山。" },
    { english: "travel", chinese: "旅行", phonetic: "/ˈtrævəl/", example: "I want to travel around the world.", exampleChinese: "我想环游世界。" },
    { english: "science", chinese: "科学", phonetic: "/ˈsaɪəns/", example: "Science helps us understand the world.", exampleChinese: "科学帮助我们理解世界。" },
    { english: "history", chinese: "历史", phonetic: "/ˈhɪstəri/", example: "History is my favorite subject.", exampleChinese: "历史是我最喜欢的科目。" }
  ],
  hard: [
    { english: "adventure", chinese: "冒险", phonetic: "/ədˈventʃər/", example: "Life is an adventure.", exampleChinese: "生活是一场冒险。" },
    { english: "knowledge", chinese: "知识", phonetic: "/ˈnɑːlɪdʒ/", example: "Knowledge is power.", exampleChinese: "知识就是力量。" },
    { english: "experience", chinese: "经验；经历", phonetic: "/ɪkˈspɪriəns/", example: "Travel is a great experience.", exampleChinese: "旅行是一种很棒的经历。" },
    { english: "university", chinese: "大学", phonetic: "/ˌjuːnɪˈvɜːrsəti/", example: "She studies at a famous university.", exampleChinese: "她在一所著名大学学习。" },
    { english: "technology", chinese: "技术", phonetic: "/tekˈnɑːlədʒi/", example: "Technology changes our lives.", exampleChinese: "技术改变我们的生活。" }
  ]
};

/* ── Difficulty mapping (legacy compat) ── */
const DIFFICULTY_TO_BANK = {
  easy: "middle_school",
  medium: "cet4",
  hard: "cet6"
};

const BANK_TO_DIFFICULTY = {
  middle_school: "easy",
  cet4: "medium",
  cet6: "hard"
};
