const WORD_BANK_INDEX = {
  easy: { file: "middle_school.json", label: "初中", next: "middle_school" },
  medium: { file: "cet4.json", label: "CET-4", next: "cet4" },
  hard: { file: "cet6.json", label: "CET-6", next: "cet6" }
};

const WORD_BANK_BASE = "assets/data/character/words/";

const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

const WordManager = {
  banks: {},
  normalized: {},
  ready: false,

  currentDifficulty: "medium",
  learnQueue: [],
  learnIndex: 0,

  async init() {
    for (const [key, info] of Object.entries(WORD_BANK_INDEX)) {
      await this.loadBank(key, info.file);
    }
    this.ready = true;
    return this;
  },

  async loadBank(difficulty, fileName) {
    try {
      const response = await fetch(WORD_BANK_BASE + fileName, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw = await response.json();
      this.banks[difficulty] = raw;
      this.normalized[difficulty] = raw.map((entry) => this.normalizeEntry(entry, difficulty));
    } catch (error) {
      console.warn(`[WordManager] 词库 ${fileName} 加载失败，使用内置词库。`, error);
      this.normalized[difficulty] = this.getFallbackWords(difficulty);
    }
  },

  normalizeEntry(entry, difficulty) {
    const translations = entry.translations || [];
    const phrases = entry.phrases || [];
    return {
      english: entry.word || "",
      chinese: translations.map((t) => t.translation).filter(Boolean).join("；") || "",
      phonetic: "",
      example: phrases[0]?.phrase || "",
      exampleChinese: phrases[0]?.translation || "",
      difficulty,
      phrases,
      translations
    };
  },

  /* ── Word retrieval ── */

  getWord(difficulty, word) {
    const bank = this.normalized[difficulty || this.currentDifficulty];
    if (!bank) return null;
    const lower = String(word || "").toLowerCase().trim();
    const found = bank.find((entry) => entry.english.toLowerCase() === lower);
    if (found) return { ...found, difficulty: difficulty || this.currentDifficulty };
    return this.findInAllBanks(word);
  },

  findInAllBanks(word) {
    const lower = String(word || "").toLowerCase().trim();
    for (const diff of Object.keys(WORD_BANK_INDEX)) {
      const bank = this.normalized[diff] || [];
      const found = bank.find((entry) => entry.english.toLowerCase() === lower);
      if (found) return { ...found, difficulty: diff };
    }
    return null;
  },

  getRandomWords(difficulty, count = 5) {
    const bank = this.normalized[difficulty || this.currentDifficulty];
    if (!bank || bank.length === 0) return [];
    const shuffled = [...bank].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, bank.length));
  },

  getAllWords(difficulty) {
    return this.normalized[difficulty || this.currentDifficulty] || [];
  },

  /* ── Learn session ── */

  startLearnSession(difficulty, count = 10) {
    const words = this.getRandomWords(difficulty, count);
    this.learnQueue = words;
    this.learnIndex = 0;
    return this.getCurrentLearnWord();
  },

  getCurrentLearnWord() {
    return this.learnQueue[this.learnIndex] || null;
  },

  nextLearnWord() {
    if (this.learnIndex < this.learnQueue.length - 1) {
      this.learnIndex++;
    }
    return this.getCurrentLearnWord();
  },

  prevLearnWord() {
    if (this.learnIndex > 0) {
      this.learnIndex--;
    }
    return this.getCurrentLearnWord();
  },

  getLearnProgress() {
    return {
      current: this.learnIndex + 1,
      total: this.learnQueue.length,
      word: this.getCurrentLearnWord()
    };
  },

  /* ── Spaced repetition (Ebbinghaus) ── */

  getDefaultHistory() {
    return {
      count: 0,
      correct: 0,
      incorrect: 0,
      lastReviewed: null,
      reviewLevel: 0,
      nextReviewAt: null,
      firstLearnTime: null
    };
  },

  getReviewIntervals() {
    return REVIEW_INTERVALS;
  },

  getDueWords(wordHistory, difficulty) {
    const now = Date.now();
    const due = [];
    const bank = this.normalized[difficulty] || [];
    for (const entry of bank) {
      const key = entry.english.toLowerCase();
      const record = wordHistory[key];
      if (!record || !record.nextReviewAt || Date.parse(record.nextReviewAt) <= now) {
        due.push(entry);
      }
    }
    return due;
  },

  getUpcomingWords(wordHistory, difficulty, days = 1) {
    const now = Date.now();
    const upcoming = [];
    const bank = this.normalized[difficulty] || [];
    const limit = now + days * 86400000;
    for (const entry of bank) {
      const key = entry.english.toLowerCase();
      const record = wordHistory[key];
      if (record?.nextReviewAt) {
        const reviewTime = Date.parse(record.nextReviewAt);
        if (reviewTime > now && reviewTime <= limit) {
          upcoming.push(entry);
        }
      }
    }
    return upcoming;
  },

  getReviewStats(wordHistory) {
    const now = Date.now();
    let dueCount = 0;
    let upcomingCount = 0;
    for (const [key, record] of Object.entries(wordHistory)) {
      if (record.nextReviewAt) {
        const t = Date.parse(record.nextReviewAt);
        if (t <= now) dueCount++;
        else if (t <= now + 86400000) upcomingCount++;
      }
    }
    return { dueCount, upcomingCount, total: Object.keys(wordHistory).length };
  },

  recordReview(wordHistory, word, correct) {
    const key = String(word || "").toLowerCase();
    if (!wordHistory[key]) {
      wordHistory[key] = this.getDefaultHistory();
    }
    const record = wordHistory[key];
    record.count = (record.count || 0) + 1;
    if (correct) {
      record.correct = (record.correct || 0) + 1;
      record.reviewLevel = Math.min((record.reviewLevel || 0) + 1, REVIEW_INTERVALS.length - 1);
    } else {
      record.incorrect = (record.incorrect || 0) + 1;
      record.reviewLevel = 0;
    }
    record.lastReviewed = new Date().toISOString();
    if (!record.firstLearnTime) record.firstLearnTime = record.lastReviewed;
    const intervalDays = REVIEW_INTERVALS[record.reviewLevel];
    record.nextReviewAt = new Date(Date.now() + intervalDays * 86400000).toISOString();
    return record;
  },

  getNextReviewText(record) {
    if (!record?.nextReviewAt) return "今天";
    const diff = Date.parse(record.nextReviewAt) - Date.now();
    if (diff <= 0) return "现在";
    const hours = Math.ceil(diff / 3600000);
    if (hours < 24) return `${hours} 小时后`;
    const days = Math.ceil(hours / 24);
    return `${days} 天后`;
  },

  /* ── Difficulty ── */

  setDifficulty(diff) {
    if (WORD_BANK_INDEX[diff]) {
      this.currentDifficulty = diff;
    }
  },

  getDifficulty() {
    return this.currentDifficulty;
  },

  getDifficultyLabel(diff) {
    return WORD_BANK_INDEX[diff]?.label || diff;
  },

  getAvailableDifficulties() {
    return Object.entries(WORD_BANK_INDEX).map(([key, info]) => ({
      id: key,
      label: info.label
    }));
  },

  /* ── Fallback ── */

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
};
