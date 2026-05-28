/* ════════════════════════════════════════════════
   EforGla V1.6 — Learning State Manager
   Manages: range, quantity, session, cards, hints, conversation
   ════════════════════════════════════════════════ */

const LearningState = {
  /* ── Vocabulary config ── */
  vocabularyId: "cet4",
  difficulty: "medium",           // legacy compat

  /* ── Range ── */
  rangePreset: "1-20",
  rangeStart: 0,
  rangeEnd: 20,
  setupStage: "sort",
  settingsCollapsed: false,
  learnPhase: "k1",
  userCategoryPrompt: "",

  /* ── Quantity per session ── */
  learnCount: 20,
  countPreset: "20",

  /* ── Filter ── */
  filterMode: "sequential",
  sortMode: "frequency",
  difficultyRange: { min: 1, max: 5, id: "all" },

  /* ── Session ── */
  currentIndex: 0,
  rangeWords: [],
  inSession: false,

  /* ── AI Lesson plan ── */
  lessonPlan: null,

  /* ── Progressive character hints ── */
  currentHintLevel: 0,
  maxHintLevel: 3,

  /* ── Cards ── */
  cardQueue: [],
  cardIndex: 0,
  cardDone: false,

  /* ── Conversation ── */
  conversationHistory: [],
  conversationActive: false,
  conversationWord: null,

  /* ── Review ── */
  reviewQueue: [],
  reviewIndex: 0,

  /* ── Init ── */

  init(vocabularyId) {
    this.vocabularyId = vocabularyId || DEFAULT_VOCABULARY;
    this.difficulty = BANK_TO_DIFFICULTY[this.vocabularyId] || "medium";
    this.loadRange();
  },

  /* ── Vocabulary ── */

  setVocabulary(vocabularyId) {
    if (!VOCABULARY_BANKS[vocabularyId]) return;
    this.vocabularyId = vocabularyId;
    this.difficulty = BANK_TO_DIFFICULTY[vocabularyId] || "medium";
    this.setupStage = "sort";
    this.settingsCollapsed = false;
    this.inSession = false;
    this.learnPhase = "k1";
    this.userCategoryPrompt = "";
    this.loadRange();
  },

  getVocabularyLabel() {
    return VOCABULARY_BANKS[this.vocabularyId]?.label || this.vocabularyId;
  },

  /* ── Range ── */

  loadRange() {
    const total = WordManager.getWordCount(this.vocabularyId);
    const end = Math.min(this.rangeEnd, total);
    this.rangeWords = WordManager.getWordsInRange(this.vocabularyId, this.rangeStart, end);
    if (this.currentIndex >= this.rangeWords.length) this.currentIndex = 0;
  },

  setRangePreset(presetId, customStart, customEnd) {
    const preset = RANGE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    this.rangePreset = presetId;
    const total = WordManager.getWordCount(this.vocabularyId);
    if (presetId === "custom") {
      this.rangeStart = Math.max(0, customStart || 0);
      this.rangeEnd = Math.min(total, customEnd || total);
    } else if (presetId === "all") {
      this.rangeStart = 0;
      this.rangeEnd = total;
    } else {
      this.rangeStart = preset.start;
      this.rangeEnd = Math.min(total, preset.end);
    }
    this.currentIndex = 0;
    this.loadRange();
  },

  setCustomRange(start, end) {
    const total = WordManager.getWordCount(this.vocabularyId);
    this.rangeStart = Math.max(0, Math.min(start, total - 1));
    this.rangeEnd = Math.min(total, Math.max(end, this.rangeStart + 1));
    this.rangePreset = "custom";
    this.currentIndex = 0;
    this.loadRange();
  },

  getRangeLabel() {
    const total = WordManager.getWordCount(this.vocabularyId);
    const end = Math.min(this.rangeEnd, total);
    return `${this.rangeStart + 1} ~ ${end}`;
  },

  /* ── Quantity ── */

  setLearnCount(count) {
    this.learnCount = Math.min(count, this.rangeWords.length);
    const preset = COUNT_PRESETS.find((p) => p.value === count);
    this.countPreset = preset ? preset.id : "custom";
  },

  setCountPreset(presetId, customValue) {
    const preset = COUNT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    this.countPreset = presetId;
    if (presetId === "custom") {
      this.learnCount = Math.min(customValue || 20, this.rangeWords.length);
    } else {
      this.learnCount = Math.min(preset.value, this.rangeWords.length);
    }
  },

  /* ── Filter ── */

  setFilter(mode) {
    if (FILTER_PRESETS.some((f) => f.id === mode)) {
      this.filterMode = mode;
      this.sortMode = mode === "highFreq" ? "frequency" : mode;
    }
  },

  setSortMode(mode) {
    if ((SORT_MODE_PRESETS || []).some((item) => item.id === mode)) {
      this.sortMode = mode;
      this.filterMode = mode;
    }
  },

  setDifficultyRange(range) {
    const min = Math.max(1, Math.min(5, Number(range?.min ?? 1)));
    const max = Math.max(min, Math.min(5, Number(range?.max ?? 5)));
    this.difficultyRange = { min, max, id: range?.id || `${min}-${max}` };
  },

  getDifficultyLabel() {
    const range = this.difficultyRange || { min: 1, max: 5 };
    if (range.min === 1 && range.max === 5) return "1-5星";
    return range.min === range.max ? `${range.min}星` : `${range.min}-${range.max}星`;
  },

  getSortLabel() {
    return (SORT_MODE_PRESETS || []).find((item) => item.id === this.sortMode)?.label || "高频优先";
  },

  getFilteredWords(wordHistory) {
    let pool = [...this.rangeWords];
    const now = Date.now();

    switch (this.filterMode) {
      case "unlearned":
        pool = pool.filter((w) => {
          const r = wordHistory[w.english.toLowerCase()];
          return !r || !r.learned;
        });
        break;
      case "recentErrors":
        pool = pool.filter((w) => {
          const r = wordHistory[w.english.toLowerCase()];
          return r && r.wrongCount > 0;
        });
        pool.sort((a, b) => {
          const ra = wordHistory[a.english.toLowerCase()];
          const rb = wordHistory[b.english.toLowerCase()];
          return (rb?.wrongCount || 0) - (ra?.wrongCount || 0);
        });
        break;
      case "highFreq":
      case "frequency":
        // Keep pool as-is but prioritize words already encountered
        pool.sort((a, b) => {
          const ra = wordHistory[a.english.toLowerCase()];
          const rb = wordHistory[b.english.toLowerCase()];
          return (rb?.count || 0) - (ra?.count || 0);
        });
        break;
      case "az":
        pool.sort((a, b) => a.english.localeCompare(b.english, "en", { sensitivity: "base" }));
        break;
      case "random":
        pool = [...pool].sort(() => Math.random() - 0.5);
        break;
      default: // sequential
        break;
    }
    return pool.slice(0, this.learnCount);
  },

  /* ── Lesson plan ── */

  generateLessonPlan(wordHistory) {
    const words = WordManager.getWordsForLearnPlan({
      vocabularyId: this.vocabularyId,
      sortMode: this.sortMode,
      difficultyRange: this.difficultyRange,
      count: this.learnCount
    });
    this.rangeWords = words;
    this.currentIndex = 0;
    this.lessonPlan = {
      vocabulary: this.vocabularyId,
      vocabularyLabel: this.getVocabularyLabel(),
      range: this.getDifficultyLabel(),
      count: words.length,
      filter: this.sortMode,
      generatedAt: new Date().toISOString(),
      words: words.map((w) => w.english)
    };
    return this.lessonPlan;
  },

  /* ── Learn session ── */

  enterLearn() {
    this.inSession = true;
    this.setupStage = "session";
    this.settingsCollapsed = true;
    this.currentHintLevel = 0;
    return this.getCurrentWord();
  },

  isInSession() {
    return this.inSession && this.rangeWords.length > 0;
  },

  getCurrentWord() {
    return this.rangeWords[this.currentIndex] || null;
  },

  goNext() {
    if (this.currentIndex < this.rangeWords.length - 1) {
      this.currentIndex++;
      this.currentHintLevel = 0;
    }
    return this.getCurrentWord();
  },

  goPrev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.currentHintLevel = 0;
    }
    return this.getCurrentWord();
  },

  getLearnProgress() {
    return {
      current: this.currentIndex + 1,
      total: this.rangeWords.length,
      pct: this.rangeWords.length > 0 ? Math.round(((this.currentIndex + 1) / this.rangeWords.length) * 100) : 0
    };
  },

  /* ── Progressive character hints ── */

  getProgressiveHint(wordHistory) {
    const word = this.getCurrentWord();
    if (!word) return { level: 0, text: "", hasMore: false };

    const key = word.english.toLowerCase();
    const record = wordHistory[key];

    const hints = this.buildHintChain(word, record);
    const level = Math.min(this.currentHintLevel, hints.length - 1);
    const hasMore = level < hints.length - 1;

    return { level, text: hints[level], hasMore, totalLevels: hints.length };
  },

  buildHintChain(word, record) {
    const chain = [];

    // Level 0: Association / imagery hint
    chain.push(AIManager.makeHintLevel0(word));

    // Level 1: Word type, etymology, root
    chain.push(AIManager.makeHintLevel1(word));

    // Level 2: Collocations, common phrases
    chain.push(AIManager.makeHintLevel2(word));

    // Level 3: Full explanation with memory techniques
    chain.push(AIManager.makeHintLevel3(word, record));

    return chain;
  },

  advanceHint() {
    const word = this.getCurrentWord();
    if (!word) return null;
    const hints = this.buildHintChain(word, null);
    if (this.currentHintLevel < hints.length - 1) {
      this.currentHintLevel++;
    }
    return this.currentHintLevel;
  },

  resetHint() {
    this.currentHintLevel = 0;
  },

  /* ── Word history helpers ── */

  markLearned(wordHistory, word) {
    const key = (word.english || word).toLowerCase().trim();
    if (!wordHistory[key]) wordHistory[key] = WordManager.getDefaultHistory();
    const r = wordHistory[key];
    r.learned = true;
    r.familiarity = Math.min(100, (r.familiarity || 0) + 20);
    r.wrongCount = r.wrongCount || 0;
    if (!r.firstLearnTime) r.firstLearnTime = new Date().toISOString();
    return r;
  },

  getFamiliarity(wordHistory, word) {
    const key = (word.english || word).toLowerCase().trim();
    return wordHistory[key]?.familiarity ?? 0;
  },

  getWordState(wordHistory, word) {
    const key = (word.english || word).toLowerCase().trim();
    const r = wordHistory[key];
    if (!r) return "new";
    if (r.learned && r.familiarity >= 80) return "mastered";
    if (r.learned && r.familiarity >= 40) return "learning";
    if (r.learned) return "familiar";
    return "new";
  },

  /* ── Cards ── */

  generateCards(wordHistory, count = 10) {
    const now = Date.now();
    const due = [];
    const lowFam = [];
    const unlearned = [];

    for (const word of this.rangeWords) {
      const key = word.english.toLowerCase();
      const r = wordHistory[key];
      if (r && r.nextReviewAt && Date.parse(r.nextReviewAt) <= now) {
        due.push(word);
      } else if (r && r.familiarity != null && r.familiarity < 60) {
        lowFam.push(word);
      } else if (!r || !r.learned) {
        unlearned.push(word);
      }
    }

    const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);
    const pool = [...shuffle(due), ...shuffle(lowFam), ...shuffle(unlearned)];
    this.cardQueue = pool.slice(0, count).map((w) => ({
      ...w, flipped: false, remembered: null, hintLevel: 0
    }));
    this.cardIndex = 0;
    this.cardDone = false;
    return this.cardQueue;
  },

  getCurrentCard() {
    return this.cardQueue[this.cardIndex] || null;
  },

  getCardHintLevel() {
    const card = this.getCurrentCard();
    return card ? card.hintLevel || 0 : 0;
  },

  advanceCardHint() {
    const card = this.getCurrentCard();
    if (!card) return 0;
    card.hintLevel = Math.min((card.hintLevel || 0) + 1, 3);
    return card.hintLevel;
  },

  nextCard(remembered, wordHistory) {
    const card = this.getCurrentCard();
    if (!card) return null;
    card.remembered = remembered;

    WordManager.recordReview(wordHistory, card.english, remembered);

    const key = card.english.toLowerCase();
    if (wordHistory[key]) {
      const r = wordHistory[key];
      r.learned = true;
      r.familiarity = remembered
        ? Math.min(100, (r.familiarity || 0) + 15)
        : Math.max(0, (r.familiarity || 0) - 10);
      r.wrongCount = (r.wrongCount || 0) + (remembered ? 0 : 1);
    }

    this.cardIndex++;
    if (this.cardIndex >= this.cardQueue.length) this.cardDone = true;
    return this.getCurrentCard();
  },

  getCardProgress() {
    const done = this.cardQueue.filter((c) => c.remembered !== null).length;
    const remembered = this.cardQueue.filter((c) => c.remembered === true).length;
    return {
      done,
      total: this.cardQueue.length,
      remembered,
      forgotten: done - remembered,
      remaining: this.cardQueue.length - done
    };
  },

  /* ── Conversation ── */

  startConversation(word) {
    this.conversationActive = true;
    this.conversationWord = word;
  },

  endConversation() {
    this.conversationActive = false;
    this.conversationWord = null;
  },

  addConversationEntry(role, text) {
    this.conversationHistory.push({
      role,
      text,
      word: this.conversationWord?.english || null,
      at: new Date().toISOString()
    });
  },

  /* ── Review ── */

  startReview(wordHistory, difficulty) {
    const due = WordManager.getDueWords(wordHistory, this.vocabularyId);
    if (due.length === 0) {
      this.reviewQueue = [];
      this.reviewIndex = 0;
      return [];
    }
    // Prioritize words in current range
    const rangeKeys = new Set(this.rangeWords.map((w) => w.english.toLowerCase()));
    const inRange = due.filter((w) => rangeKeys.has(w.english.toLowerCase()));
    const outRange = due.filter((w) => !rangeKeys.has(w.english.toLowerCase()));
    this.reviewQueue = [...inRange.sort(() => Math.random() - 0.5), ...outRange.sort(() => Math.random() - 0.5)].slice(0, 10);
    this.reviewIndex = 0;
    return this.reviewQueue;
  },

  getCurrentReviewWord() {
    return this.reviewQueue[this.reviewIndex] || null;
  },

  nextReview() {
    this.reviewIndex++;
    return this.getCurrentReviewWord();
  },

  isReviewDone() {
    return this.reviewIndex >= this.reviewQueue.length;
  },

  /* ── Stats ── */

  getSessionStats(wordHistory) {
    let learned = 0, famSum = 0, famCount = 0;
    for (const word of this.rangeWords) {
      const r = wordHistory[word.english.toLowerCase()];
      if (r && r.learned) {
        learned++;
        if (r.familiarity != null) { famSum += r.familiarity; famCount++; }
      }
    }
    return {
      total: this.rangeWords.length,
      learned,
      avgFamiliarity: famCount > 0 ? Math.round(famSum / famCount) : 0,
      pct: this.rangeWords.length > 0 ? Math.round((learned / this.rangeWords.length) * 100) : 0
    };
  },

  /* ── Serialization ── */

  serialize() {
    return {
      vocabularyId: this.vocabularyId,
      difficulty: this.difficulty,
      rangePreset: this.rangePreset,
      rangeStart: this.rangeStart,
      rangeEnd: this.rangeEnd,
      learnCount: this.learnCount,
      countPreset: this.countPreset,
      filterMode: this.filterMode,
      sortMode: this.sortMode,
      difficultyRange: this.difficultyRange,
      setupStage: this.setupStage,
      settingsCollapsed: this.settingsCollapsed,
      learnPhase: this.learnPhase,
      userCategoryPrompt: this.userCategoryPrompt,
      currentIndex: this.currentIndex,
      inSession: this.inSession,
      conversationHistory: this.conversationHistory.slice(-200),
      lessonPlan: this.lessonPlan
    };
  },

  deserialize(data) {
    if (!data) return;
    this.vocabularyId = data.vocabularyId || DEFAULT_VOCABULARY;
    this.difficulty = data.difficulty || "medium";
    this.rangePreset = data.rangePreset || "1-20";
    this.rangeStart = data.rangeStart ?? 0;
    this.rangeEnd = data.rangeEnd ?? 20;
    this.learnCount = data.learnCount ?? 20;
    this.countPreset = data.countPreset || "20";
    this.filterMode = data.filterMode || "sequential";
    this.sortMode = data.sortMode || (this.filterMode === "highFreq" ? "frequency" : this.filterMode) || "frequency";
    this.difficultyRange = data.difficultyRange || { min: 1, max: 5, id: "all" };
    this.setupStage = data.setupStage || "sort";
    this.settingsCollapsed = data.settingsCollapsed ?? false;
    this.learnPhase = data.learnPhase || "k1";
    this.userCategoryPrompt = data.userCategoryPrompt || "";
    this.currentIndex = data.currentIndex ?? 0;
    this.inSession = data.inSession ?? false;
    this.conversationHistory = data.conversationHistory || [];
    this.lessonPlan = data.lessonPlan || null;
    this.loadRange();
  }
};
