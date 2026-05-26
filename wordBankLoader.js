const WORD_BANK_INDEX = {
  easy: { file: "middle_school.json", label: "初中", next: "middle_school" },
  medium: { file: "cet4.json", label: "CET-4", next: "cet4" },
  hard: { file: "cet6.json", label: "CET-6", next: "cet6" }
};

const WORD_BANK_BASE = "assets/data/character/words/";

class WordBankManager {
  constructor() {
    this.banks = {};
    this.normalized = {};
    this.ready = false;
  }

  async init() {
    for (const [key, info] of Object.entries(WORD_BANK_INDEX)) {
      await this.loadBank(key, info.file);
    }
    this.ready = true;
    return this;
  }

  async loadBank(difficulty, fileName) {
    try {
      const response = await fetch(WORD_BANK_BASE + fileName, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw = await response.json();
      this.banks[difficulty] = raw;
      this.normalized[difficulty] = raw.map((entry) => this.normalizeEntry(entry, difficulty));
    } catch (error) {
      console.warn(`[WordBank] 词库 ${fileName} 加载失败，使用内置词库。`, error);
      this.normalized[difficulty] = this.getFallbackWords(difficulty);
    }
  }

  normalizeEntry(entry, difficulty) {
    return {
      english: entry.word || "",
      chinese: entry.translations?.[0]?.translation || "",
      phonetic: "",
      example: entry.phrases?.[0]?.phrase || "",
      exampleChinese: entry.phrases?.[0]?.translation || "",
      difficulty,
      phrases: entry.phrases || []
    };
  }

  getWord(difficulty, word) {
    const bank = this.normalized[difficulty];
    if (!bank) return null;
    const lower = String(word || "").toLowerCase().trim();
    return bank.find((entry) => entry.english.toLowerCase() === lower) || null;
  }

  getRandomWords(difficulty, count = 5) {
    const bank = this.normalized[difficulty];
    if (!bank || bank.length === 0) return [];
    const shuffled = [...bank].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, bank.length));
  }

  getAllWords(difficulty) {
    return this.normalized[difficulty] || [];
  }

  getAllDifficulties() {
    return Object.keys(WORD_BANK_INDEX);
  }

  getDifficultyLabel(difficulty) {
    return WORD_BANK_INDEX[difficulty]?.label || difficulty;
  }

  getFallbackWords(difficulty) {
    const fallback = {
      easy: [
        { english: "apple", chinese: "苹果", phonetic: "/ˈæpəl/", example: "I eat an apple every morning.", exampleChinese: "我每天早上吃一个苹果。" },
        { english: "book", chinese: "书", phonetic: "/bʊk/", example: "This book is very interesting.", exampleChinese: "这本书很有趣。" },
        { english: "cat", chinese: "猫", phonetic: "/kæt/", example: "The cat is sleeping near the window.", exampleChinese: "猫正在窗边睡觉。" }
      ],
      medium: [
        { english: "beautiful", chinese: "美丽的", phonetic: "/ˈbjuːtɪfəl/", example: "The sunset is beautiful tonight.", exampleChinese: "今晚的日落很美。" },
        { english: "mountain", chinese: "山", phonetic: "/ˈmaʊntən/", example: "We climbed the mountain yesterday.", exampleChinese: "我们昨天爬了那座山。" }
      ],
      hard: [
        { english: "adventure", chinese: "冒险", phonetic: "/ədˈventʃər/", example: "Life is an adventure.", exampleChinese: "生活是一场冒险。" },
        { english: "knowledge", chinese: "知识", phonetic: "/ˈnɑːlɪdʒ/", example: "Knowledge is power.", exampleChinese: "知识就是力量。" }
      ]
    };
    return fallback[difficulty] || fallback.easy;
  }
}

const WordBankLoader = new WordBankManager();
