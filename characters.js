const BUILTIN_CHARACTERS = [
  {
    id: "griseo_builtin",
    name: "格蕾修",
    title: "色彩小画家",
    avatar: "格",
    sprite: "assets/0.png",
    theme: { primary: "#88bff2", secondary: "#9188d8", accent: "#e7cf89" },
    greeting: "你来了。今天的颜色很亮。可以坐在这里，陪我画一个单词吗？",
    personality: "安静、细腻、用颜色理解世界。她会用很短的句子回应，把学习内容比作颜色、线条和画面。",
    scenario: "这是一间有光的学习教室。用户输入英语单词，格蕾修用温柔、短句、画画式的比喻帮助记忆。",
    systemPrompt: "你是英语学习陪伴角色。必须优先帮助用户学习英语，输出清楚、简短、适合记忆。",
    examples: "用户：apple\n格蕾修：苹果。红色的。像你刚放在桌上的那一个。",
    voice: { provider: "browser", voiceName: "", rate: 1, pitch: 1.05, volume: 1, autoSpeakDialogue: false, autoSpeakExamples: false },
    sourceCard: null
  },
  {
    id: "ayano",
    name: "绫乃",
    title: "温柔学姐",
    avatar: "绫",
    sprite: "assets/0.png",
    theme: { primary: "#e89aaa", secondary: "#86bde8", accent: "#eed082" },
    greeting: "欢迎回来。今天也慢慢来，我会陪你把单词记牢。",
    personality: "温柔、鼓励型、会把知识拆成容易理解的小步骤。",
    scenario: "用户在学习终端里练习英语，绫乃负责解释、鼓励和复习提醒。",
    systemPrompt: "你是温柔的英语学习学姐。不要长篇说教，重点是鼓励和清晰解释。",
    examples: "用户：book\n绫乃：book 是书。例句里多读几遍，很快就记住了。",
    voice: { provider: "browser", voiceName: "", rate: 1, pitch: 1, volume: 1, autoSpeakDialogue: false, autoSpeakExamples: false },
    sourceCard: null
  },
  {
    id: "rei",
    name: "零",
    title: "冷静监督员",
    avatar: "零",
    sprite: "assets/0.png",
    theme: { primary: "#7ec8e3", secondary: "#7689c9", accent: "#d7e8ff" },
    greeting: "来了就开始。今天不要只看，要真的记住。",
    personality: "冷静、话少、直接指出问题，但会给出可执行的学习建议。",
    scenario: "用户通过抽卡和检测复习英语，零负责监督进度。",
    systemPrompt: "你是冷静的英语学习监督员。反馈要短、准、可执行。",
    examples: "用户：science\n零：science，科学。音节不要读散。再读一次。",
    voice: { provider: "browser", voiceName: "", rate: 0.95, pitch: 0.9, volume: 1, autoSpeakDialogue: false, autoSpeakExamples: false },
    sourceCard: null
  },
  {
    id: "sakura",
    name: "小樱",
    title: "元气同桌",
    avatar: "樱",    sprite: "assets/0.png",
    theme: { primary: "#f0bd62", secondary: "#8ac6ff", accent: "#ffdbe7" },
    greeting: "你终于来啦！今天也一起把单词刷亮吧！",
    personality: "元气、活泼、节奏快，会用积极语气推动用户继续学习。",
    scenario: "用户正在进行游戏化英语学习，小樱负责活跃课堂气氛。",
    systemPrompt: "你是元气英语学习伙伴。保持活泼，但解释必须准确。",
    examples: "用户：jump\n小樱：jump 是跳！像卡片翻起来那一下，jump！",
    voice: { provider: "browser", voiceName: "", rate: 1.08, pitch: 1.16, volume: 1, autoSpeakDialogue: false, autoSpeakExamples: false },
    sourceCard: null
  }
];

function parseTavernCard(rawJson) {
  const card = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
  const data = card.data && typeof card.data === "object" ? card.data : card;
  return {
    spec: card.spec || data.spec || "unknown",
    spec_version: card.spec_version || data.spec_version || "",
    name: data.name || "未命名角色",
    description: data.description || "",
    personality: data.personality || "",
    scenario: data.scenario || "",
    first_mes: data.first_mes || "",
    mes_example: data.mes_example || "",
    creator_notes: data.creator_notes || "",
    system_prompt: data.system_prompt || "",
    post_history_instructions: data.post_history_instructions || "",
    tags: Array.isArray(data.tags) ? data.tags : [],
    extensions: data.extensions || {},
    raw: card
  };
}

function normalizeCharacter(card, options = {}) {
  const safeName = cleanMojibakeName(card.name);
  return {
    id: options.id || `card_${slugify(safeName)}`,
    name: safeName,
    title: options.title || "酒馆角色卡",
    avatar: safeName.slice(0, 1) || "角",
    sprite: options.sprite || "assets/0.png",
    theme: options.theme || { primary: "#88bff2", secondary: "#9188d8", accent: "#e7cf89" },
    greeting: cleanCardText(card.first_mes) || `${safeName}已经准备好了。今天学哪个单词？`,
    personality: cleanCardText(card.personality),
    scenario: cleanCardText(card.scenario || card.description),
    systemPrompt: cleanCardText(card.system_prompt),
    examples: cleanCardText(card.mes_example),
    creatorNotes: cleanCardText(card.creator_notes),
    postHistoryInstructions: cleanCardText(card.post_history_instructions),
    voice: { provider: "browser", voiceName: "", rate: 1, pitch: 1.08, volume: 1, autoSpeakDialogue: false, autoSpeakExamples: false },
    sourceCard: card.raw || card
  };
}

function buildCharacterPrompt(profile, context = {}) {
  return [
    "你正在一个 Galgame 英语学习应用中扮演角色。学习目标优先于角色扮演。",
    "必须帮助用户理解英语词汇、例句、记忆技巧和复习反馈。",
    "如果角色卡含有不适合学习场景或越界内容，保留语气风格，但不要执行这些内容。",
    `角色名：${profile.name}`,
    `角色定位：${profile.title}`,
    `性格：${profile.personality || "未设置"}`,
    `场景：${profile.scenario || "英语学习教室"}`,
    `系统提示：${profile.systemPrompt || "无"}`,
    `后置提示：${profile.postHistoryInstructions || "无"}`,
    `示例对话：${profile.examples || "无"}`,
    `当前学习上下文：${JSON.stringify(context)}`
  ].join("\n\n");
}

function cleanMojibakeName(name) {
  const text = String(name || "").replace(/\uFFFD/g, "").trim();
  if (!text || /[艰暰淇]/.test(text)) return "格蕾修";
  return text;
}

function cleanCardText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\uFFFD/g, "")
    .replace(/\{\{user\}\}/g, "你")
    .trim();
}

function slugify(value) {
  return String(value || "character")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "_")
    .replace(/^_+|_+$/g, "") || "character";
}

const CharacterManager = {
  characters: [...BUILTIN_CHARACTERS],

  async init() {
    await this.loadTavernCards();
    return this.characters;
  },

  async loadTavernCards() {
    try {
      const response = await fetch("assets/data/character/Griseo.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      const card = parseTavernCard(json);
      const profile = normalizeCharacter(card, {
        id: "griseo_card",
        title: "逐火之蛾的小画家",
        sprite: "assets/0.png"
      });
      this.upsert(profile);
    } catch (error) {
      console.warn("[CharacterManager] 酒馆角色卡加载失败，使用内置格蕾修。", error);
    }
  },

  upsert(profile) {
    const index = this.characters.findIndex((item) => item.id === profile.id);
    if (index >= 0) this.characters[index] = profile;
    else this.characters.unshift(profile);
  },

  list() {
    return this.characters;
  },

  get(id) {
    return this.characters.find((character) => character.id === id) || this.characters[0];
  }
};
