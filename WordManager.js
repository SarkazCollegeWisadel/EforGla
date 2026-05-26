/* ════════════════════════════════════════════════
   EforGla V1.6 — Word Manager
   JSON bank loading + Ebbinghaus spaced repetition
   ════════════════════════════════════════════════ */

const WORD_BANK_BASE = "assets/data/character/words/";

const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

const WordManager = {
  banks: {},
  normalized: {},
  ready: false,

  currentVocabulary: "cet4",

  async init() {
    for (const [key, info] of Object.entries(VOCABULARY_BANKS)) {
      await this.loadBank(key, info.file);
    }
    this.ready = true;
    return this;
  },

  async loadBank(vocabularyId, fileName) {
    try {
      const response = await fetch(WORD_BANK_BASE + fileName, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw = await response.json();
      this.banks[vocabularyId] = raw;
      this.normalized[vocabularyId] = raw.map((entry) => this.normalizeEntry(entry, vocabularyId));
    } catch (error) {
      console.warn(`[WordManager] 词库 ${fileName} 加载失败，使用内置词库。`, error);
      const legacyDiff = BANK_TO_DIFFICULTY[vocabularyId] || "medium";
      this.normalized[vocabularyId] = this.getFallbackWords(legacyDiff);
    }
  },

  normalizeEntry(entry, vocabularyId) {
    const translations = entry.translations || [];
    const phrases = entry.phrases || [];
    return {
      english: entry.word || "",
      chinese: translations.map((t) => t.translation).filter(Boolean).join("；") || "",
      phonetic: "",
      pos: entry.pos || "",
      synonyms: entry.synonyms || [],
      antonyms: entry.antonyms || [],
      root: entry.root || "",
      example: phrases[0]?.phrase || "",
      exampleChinese: phrases[0]?.translation || "",
      vocabularyId,
      phrases,
      translations
    };
  },

  /* ── Vocabulary management ── */

  setVocabulary(vocabularyId) {
    if (VOCABULARY_BANKS[vocabularyId]) {
      this.currentVocabulary = vocabularyId;
    }
  },

  getVocabulary() {
    return this.currentVocabulary;
  },

  getVocabularyLabel(vocabularyId) {
    const id = vocabularyId || this.currentVocabulary;
    return VOCABULARY_BANKS[id]?.label || id;
  },

  getAvailableVocabularies() {
    return Object.entries(VOCABULARY_BANKS).map(([key, info]) => ({
      id: key,
      label: info.label,
      category: info.category
    }));
  },

  /* ── Word retrieval ── */

  getWord(vocabularyId, word) {
    const bank = this.normalized[vocabularyId || this.currentVocabulary];
    if (!bank) return null;
    const lower = String(word || "").toLowerCase().trim();
    const found = bank.find((entry) => entry.english.toLowerCase() === lower);
    if (found) return { ...found, vocabularyId: vocabularyId || this.currentVocabulary };
    return this.findInAllBanks(word);
  },

  findInAllBanks(word) {
    const lower = String(word || "").toLowerCase().trim();
    for (const diff of Object.keys(VOCABULARY_BANKS)) {
      const bank = this.normalized[diff] || [];
      const found = bank.find((entry) => entry.english.toLowerCase() === lower);
      if (found) return { ...found, vocabularyId: diff };
    }
    return null;
  },

  getAllWords(vocabularyId) {
    return this.normalized[vocabularyId || this.currentVocabulary] || [];
  },

  /* ── Range ── */

  getWordCount(vocabularyId) {
    const bank = this.normalized[vocabularyId || this.currentVocabulary];
    return bank ? bank.length : 0;
  },

  getWordsInRange(vocabularyId, start, end) {
    const bank = this.normalized[vocabularyId || this.currentVocabulary] || [];
    const s = Math.max(0, start);
    const e = Math.min(bank.length, end);
    return bank.slice(s, e);
  },

  getWordsByIds(vocabularyId, wordList) {
    const bank = this.normalized[vocabularyId || this.currentVocabulary] || [];
    const set = new Set(wordList.map((w) => w.toLowerCase()));
    return bank.filter((e) => set.has(e.english.toLowerCase()));
  },

  getDifficultyScore(word, vocabularyId) {
    const text = String(word?.english || word || "");
    const meaning = String(word?.chinese || "");
    const phraseCount = Array.isArray(word?.phrases) ? word.phrases.length : 0;
    const translationCount = Array.isArray(word?.translations) ? word.translations.length : 0;
    const bankBase = { middle_school: 1, cet4: 2, cet6: 3 }[vocabularyId || word?.vocabularyId || this.currentVocabulary] || 2;
    let score = bankBase;

    if (text.length >= 7) score += 1;
    if (text.length >= 11) score += 1;
    if (meaning.length >= 18 || translationCount >= 3) score += 1;
    if (phraseCount >= 8) score += 1;
    if (word?.root || (word?.synonyms?.length || 0) + (word?.antonyms?.length || 0) > 2) score += 1;

    return Math.max(1, Math.min(5, score));
  },

  getWordsForLearnPlan({ vocabularyId, sortMode = "frequency", difficultyRange = { min: 1, max: 5 }, count = 20 } = {}) {
    const id = vocabularyId || this.currentVocabulary;
    const min = difficultyRange?.min ?? 1;
    const max = difficultyRange?.max ?? 5;
    let words = this.getAllWords(id)
      .map((word, index) => ({ ...word, bankIndex: index, difficultyScore: this.getDifficultyScore(word, id) }))
      .filter((word) => word.difficultyScore >= min && word.difficultyScore <= max);

    if (sortMode === "az") {
      words.sort((a, b) => a.english.localeCompare(b.english, "en", { sensitivity: "base" }));
    } else if (sortMode === "sequential") {
      words.sort((a, b) => a.bankIndex - b.bankIndex);
    } else {
      words.sort((a, b) => a.bankIndex - b.bankIndex);
    }

    return words.slice(0, Math.max(1, Number(count) || 20)).map(({ bankIndex, difficultyScore, ...word }) => word);
  },

  /* ── Spaced repetition ── */

  getDefaultHistory() {
    return {
      learned: false,
      familiarity: 0,
      wrongCount: 0,
      count: 0,
      correct: 0,
      incorrect: 0,
      lastReviewed: null,
      reviewLevel: 0,
      nextReviewAt: null,
      firstLearnTime: null
    };
  },

  getDueWords(wordHistory, vocabularyId) {
    const now = Date.now();
    const due = [];
    const bank = this.normalized[vocabularyId || this.currentVocabulary] || [];
    for (const entry of bank) {
      const key = entry.english.toLowerCase();
      const record = wordHistory[key];
      if (!record || !record.nextReviewAt || Date.parse(record.nextReviewAt) <= now) {
        due.push(entry);
      }
    }
    return due;
  },

  getReviewStats(wordHistory) {
    const now = Date.now();
    let dueCount = 0;
    for (const record of Object.values(wordHistory)) {
      if (record.nextReviewAt && Date.parse(record.nextReviewAt) <= now) {
        dueCount++;
      }
    }
    return { dueCount, total: Object.keys(wordHistory).length };
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

  /* ── Legacy compat ── */

  setDifficulty(diff) {
    const vocabId = DIFFICULTY_TO_BANK[diff];
    if (vocabId) this.currentVocabulary = vocabId;
  },

  getDifficulty() {
    return BANK_TO_DIFFICULTY[this.currentVocabulary] || "medium";
  },

  getDifficultyLabel(diff) {
    const vocabId = DIFFICULTY_TO_BANK[diff] || this.currentVocabulary;
    return VOCABULARY_BANKS[vocabId]?.label || diff;
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
    return (fallback[difficulty] || fallback.easy).map((w) => ({
      ...w, vocabularyId: DIFFICULTY_TO_BANK[difficulty] || "cet4", phrases: [], translations: []
    }));
  }
};
