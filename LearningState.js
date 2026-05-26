const DEFAULT_RANGE_SIZE = 50;

const LearningState = {
  /* ── Session config ── */
  difficulty: "medium",
  rangeStart: 0,
  rangeEnd: DEFAULT_RANGE_SIZE,

  /* ── Learn position ── */
  currentIndex: 0,
  rangeWords: [],
  inSession: false,

  /* ── Card queue (regenerated on enter) ── */
  cardQueue: [],
  cardIndex: 0,
  cardDone: false,

  /* ── Init ── */

  init(difficulty) {
    this.difficulty = difficulty || "medium";
    this.loadRange();
  },

  loadRange() {
    this.rangeWords = WordManager.getWordsInRange(this.difficulty, this.rangeStart, this.rangeEnd);
    if (this.currentIndex >= this.rangeWords.length) this.currentIndex = 0;
  },

  setRange(start, end) {
    this.rangeStart = start;
    this.rangeEnd = end;
    this.loadRange();
  },

  /* ── Learn session ── */

  enterLearn() {
    this.inSession = true;
    return this.getCurrentWord();
  },

  isInSession() {
    return this.inSession && this.rangeWords.length > 0;
  },

  getCurrentWord() {
    return this.rangeWords[this.currentIndex] || null;
  },

  goNext() {
    if (this.currentIndex < this.rangeWords.length - 1) this.currentIndex++;
    return this.getCurrentWord();
  },

  goPrev() {
    if (this.currentIndex > 0) this.currentIndex--;
    return this.getCurrentWord();
  },

  getLearnProgress() {
    return { current: this.currentIndex + 1, total: this.rangeWords.length };
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

  /* ── Dynamic card generation ── */

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
    this.cardQueue = pool.slice(0, count).map((w) => ({ ...w, flipped: false, remembered: null }));
    this.cardIndex = 0;
    this.cardDone = false;
    return this.cardQueue;
  },

  getCurrentCard() {
    return this.cardQueue[this.cardIndex] || null;
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

  /* ── Serialization (for save/load) ── */

  serialize() {
    return {
      difficulty: this.difficulty,
      rangeStart: this.rangeStart,
      rangeEnd: this.rangeEnd,
      currentIndex: this.currentIndex,
      inSession: this.inSession
    };
  },

  deserialize(data) {
    if (!data) return;
    this.difficulty = data.difficulty || "medium";
    this.rangeStart = data.rangeStart ?? 0;
    this.rangeEnd = data.rangeEnd ?? DEFAULT_RANGE_SIZE;
    this.currentIndex = data.currentIndex ?? 0;
    this.inSession = data.inSession ?? false;
    this.loadRange();
  }
};
