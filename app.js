const App = {
  state: {
    currentPage: "welcome",
    currentMode: "learn",
    characters: [],
    character: null,
    settings: {
      characterId: "griseo_card",
      difficulty: "medium",
      aiMode: true,
      customSprite: "",
      spriteSize: 62,
      spriteTranslateX: 0,
      spriteTranslateY: 0,
      spriteScale: 1,
      ai: { provider: "mock", apiKey: "", endpoint: "", model: "" },
      voice: { provider: "browser", voiceName: "", rate: 1, pitch: 1.08, volume: 1, autoSpeakDialogue: false, autoSpeakExamples: false }
    },
    profile: { affection: 0, level: 1, exp: 0 },
    wordHistory: {},
    dialogueLog: [],
    isTyping: false,
    typewriterTimer: null,
    currentDialogueText: "",
    cards: { items: [], activeIndex: 0, drawn: 0, remembered: 0, wrong: 0 },
    test: { items: [], index: 0, correct: 0, wrong: 0 },
    saveMode: "save"
  },

  dom: {},

  /* ── Init ── */

  async init() {
    this.cacheDom();
    this.loadData();
    this.state.characters = await CharacterManager.init();
    await WordManager.init();
    SaveManager.init();
    this.ensureCharacter();
    this.bindEvents();
    this.renderCharacterSelection(this.dom.characterGrid, this.state.settings.characterId);
    this.syncSettingsControls();
    this.updateVoiceOptions();
    this.showPage("welcome");
    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = () => this.updateVoiceOptions();
    }
  },

  cacheDom() {
    const byId = (id) => document.getElementById(id);
    this.dom = {
      pageWelcome: byId("page-welcome"), pageSettings: byId("page-settings"), pageMain: byId("page-main"),
      btnStart: byId("btn-start"), characterGrid: byId("character-grid"), spriteUrlInput: byId("sprite-url"),
      difficultySelect: byId("difficulty-select"), aiModeToggle: byId("ai-mode-toggle"),
      ttsAutoToggle: byId("tts-auto-toggle"), btnConfirmSettings: byId("btn-confirm-settings"),
      statusAvatar: byId("status-avatar"), statusCharName: byId("status-char-name"),
      statusCharTitle: byId("status-char-title"), statAffection: byId("stat-affection"),
      statLevel: byId("stat-level"), expBarFill: byId("exp-bar-fill"), expBarText: byId("exp-bar-text"),
      characterSprite: byId("character-sprite"), charInfoName: byId("char-info-name"),
      charInfoDetail: byId("char-info-detail"), modeTabs: byId("mode-tabs"),
      learnContent: byId("learn-content"), cardsContent: byId("cards-content"), testContent: byId("test-content"),
      wordInput: byId("word-input"), btnSend: byId("btn-send"),
      learnWord: byId("learn-word"), learnPhonetic: byId("learn-phonetic"), learnMeaning: byId("learn-meaning"),
      learnExample: byId("learn-example"), learnExampleCn: byId("learn-example-cn"),
      learnMemoryTip: byId("learn-memory-tip"), learnProgress: byId("learn-progress"),
      btnLearnPrev: byId("btn-learn-prev"), btnLearnNext: byId("btn-learn-next"), btnLearnSound: byId("btn-learn-sound"),
      flashcard: byId("flashcard"), cardFrontWord: byId("card-front-word"), cardFrontPhonetic: byId("card-front-phonetic"),
      cardBackMeaning: byId("card-back-meaning"), cardBackExample: byId("card-back-example"),
      cardBackExampleCn: byId("card-back-example-cn"), cardBackTip: byId("card-back-tip"),
      cardsProgress: byId("cards-progress"), btnCardForgot: byId("btn-card-forgot"), btnCardRemembered: byId("btn-card-remembered"),
      testProgress: byId("test-progress"), testWordDisplay: byId("test-word-display"), testPhonetic: byId("test-phonetic"),
      testInput: byId("test-input"), btnTestSubmit: byId("btn-test-submit"),
      testInputContainer: byId("test-input-container"), testResult: byId("test-result"),
      dialogueName: byId("dialogue-name"), dialogueText: byId("dialogue-text"),
      dialogueContinue: byId("dialogue-continue"), dialogueVoice: byId("dialogue-voice"),
      btnCharSwitch: byId("btn-char-switch"), btnSave: byId("btn-save"), btnLoad: byId("btn-load"),
      btnToolbarSettings: byId("btn-toolbar-settings"),
      settingsModal: byId("settings-modal"), modalCharacterGrid: byId("modal-character-grid"),
      modalDifficulty: byId("modal-difficulty"), modalSpriteUrl: byId("modal-sprite-url"),
      modalVoiceSelect: byId("modal-voice-select"), modalVoiceRate: byId("modal-voice-rate"),
      modalVoicePitch: byId("modal-voice-pitch"), modalAutoSpeak: byId("modal-auto-speak"),
      btnVoiceTest: byId("btn-voice-test"), btnModalSave: byId("btn-modal-save"), btnModalClose: byId("btn-modal-close"),
      spriteSizeSlider: byId("modal-sprite-size"), spriteSizeValue: byId("modal-sprite-size-value"),
      spriteSizePresets: byId("modal-sprite-size-presets"),
      modalAiProvider: byId("modal-ai-provider"), modalAiKey: byId("modal-ai-key"),
      modalAiEndpoint: byId("modal-ai-endpoint"), modalAiModel: byId("modal-ai-model"),
      saveModal: byId("save-modal"), saveModalTitle: byId("save-modal-title"),
      saveSlotList: byId("save-slot-list"), btnSaveClose: byId("btn-save-close"),
      btnSaveExport: byId("btn-save-export"), btnSaveCancel: byId("btn-save-cancel")
    };
  },

  /* ── Events ── */

  bindEvents() {
    this.dom.btnStart.addEventListener("click", () => this.showPage("settings"));
    this.dom.btnConfirmSettings.addEventListener("click", () => this.saveSettingsFromPage());
    this.dom.characterGrid.addEventListener("click", (e) => this.handleCharacterGridClick(e, false));
    this.dom.modalCharacterGrid.addEventListener("click", (e) => this.handleCharacterGridClick(e, true));
    this.dom.wordInput.addEventListener("keydown", (e) => { if (e.key === "Enter") this.handleInquiry(); });
    this.dom.btnSend.addEventListener("click", () => this.handleInquiry());
    this.dom.modeTabs.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-mode]");
      if (btn) this.switchMode(btn.dataset.mode);
    });
    this.dom.flashcard.addEventListener("click", () => this.flipCard());
    this.dom.btnCardForgot.addEventListener("click", () => this.answerCard(false));
    this.dom.btnCardRemembered.addEventListener("click", () => this.answerCard(true));
    this.dom.btnTestSubmit.addEventListener("click", () => this.checkTestAnswer());
    this.dom.testInput.addEventListener("keydown", (e) => { if (e.key === "Enter") this.checkTestAnswer(); });
    this.dom.dialogueText.addEventListener("click", () => this.skipTypewriter());
    this.dom.dialogueVoice.addEventListener("click", () => this.speakCurrentDialogue());
    this.dom.btnCharSwitch.addEventListener("click", () => this.openSettingsModal());
    this.dom.btnSave.addEventListener("click", () => this.openSaveModal("save"));
    this.dom.btnLoad.addEventListener("click", () => this.openSaveModal("load"));
    this.dom.btnToolbarSettings.addEventListener("click", () => this.openSettingsModal());
    this.dom.btnLearnPrev.addEventListener("click", () => this.navigateLearn(-1));
    this.dom.btnLearnNext.addEventListener("click", () => this.navigateLearn(1));
    this.dom.btnLearnSound.addEventListener("click", () => this.speakLearnWord());
    this.dom.btnModalClose.addEventListener("click", () => this.closeSettingsModal());
    this.dom.settingsModal.addEventListener("click", (e) => { if (e.target === this.dom.settingsModal) this.closeSettingsModal(); });
    this.dom.btnVoiceTest.addEventListener("click", () => {
      this.applyModalVoiceToState(false);
      TTSManager.speak("这是当前的语音试听。今天的颜色很亮。", this.state.settings.voice);
    });
    this.dom.btnModalSave.addEventListener("click", () => this.saveModalSettings());
    this.dom.spriteSizeSlider.addEventListener("input", () => this.handleSpriteSizeChange());
    this.dom.spriteSizePresets.addEventListener("click", (e) => this.handleSpritePresetClick(e));
    this.dom.btnSaveClose.addEventListener("click", () => this.closeSaveModal());
    this.dom.btnSaveCancel.addEventListener("click", () => this.closeSaveModal());
    this.dom.btnSaveExport.addEventListener("click", () => this.exportSaveSlot());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { this.closeSettingsModal(); this.closeSaveModal(); }
    });
  },

  /* ── Page nav ── */

  showPage(pageName) {
    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
    const page = { welcome: this.dom.pageWelcome, settings: this.dom.pageSettings, main: this.dom.pageMain }[pageName];
    if (!page) return;
    page.classList.add("active");
    this.state.currentPage = pageName;
    if (pageName === "main") this.onEnterMain();
  },

  onEnterMain() {
    this.ensureCharacter();
    this.updateAllCharacterViews();
    this.switchMode("learn");
    this.setDialogue(this.state.character.name, this.state.character.greeting);
  },

  /* ── Character ── */

  ensureCharacter() {
    this.state.character = CharacterManager.get(this.state.settings.characterId);
    if (!this.state.character) {
      this.state.character = CharacterManager.list()[0];
      this.state.settings.characterId = this.state.character.id;
    }
    this.state.settings.voice = { ...this.state.character.voice, ...this.state.settings.voice };
  },

  renderCharacterSelection(container, selectedId) {
    container.innerHTML = "";
    CharacterManager.list().forEach((c) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = `character-card${c.id === selectedId ? " selected" : ""}`;
      card.dataset.id = c.id;
      card.style.setProperty("--theme", c.theme?.primary || "#88bff2");
      card.innerHTML = `
        <div class="character-avatar">${c.avatar || c.name.slice(0, 1)}</div>
        <div class="character-name">${c.name}</div>
        <div class="character-title">${c.title}</div>
        <div class="character-desc">${this.shortText(c.personality || c.scenario, 54)}</div>`;
      container.appendChild(card);
    });
  },

  handleCharacterGridClick(event, inModal) {
    const card = event.target.closest(".character-card");
    if (!card) return;
    const grid = inModal ? this.dom.modalCharacterGrid : this.dom.characterGrid;
    grid.querySelectorAll(".character-card").forEach((item) => {
      item.classList.toggle("selected", item.dataset.id === card.dataset.id);
    });
    if (!inModal) this.state.settings.characterId = card.dataset.id;
  },

  /* ── Settings page ── */

  saveSettingsFromPage() {
    const selected = this.dom.characterGrid.querySelector(".character-card.selected");
    if (selected) this.state.settings.characterId = selected.dataset.id;
    this.state.settings.difficulty = this.dom.difficultySelect.value;
    this.state.settings.customSprite = this.dom.spriteUrlInput.value.trim();
    this.state.settings.aiMode = this.dom.aiModeToggle.checked;
    this.state.settings.voice.autoSpeakDialogue = this.dom.ttsAutoToggle.checked;
    WordManager.setDifficulty(this.state.settings.difficulty);
    this.ensureCharacter();
    this.saveData();
    this.showPage("main");
  },

  syncSettingsControls() {
    this.dom.difficultySelect.value = this.state.settings.difficulty;
    this.dom.spriteUrlInput.value = this.state.settings.customSprite;
    this.dom.aiModeToggle.checked = this.state.settings.aiMode;
    this.dom.ttsAutoToggle.checked = this.state.settings.voice.autoSpeakDialogue;
  },

  /* ── Update views ── */

  updateAllCharacterViews() {
    this.updateTheme();
    this.updateStatusBar();
    this.updateSprite();
  },

  updateTheme() {
    const t = this.state.character.theme || {};
    document.documentElement.style.setProperty("--blue", t.primary || "#88bff2");
    document.documentElement.style.setProperty("--violet", t.secondary || "#9188d8");
    document.documentElement.style.setProperty("--gold", t.accent || "#e7cf89");
  },

  updateStatusBar() {
    const c = this.state.character;
    this.dom.statusAvatar.textContent = c.avatar || c.name.slice(0, 1);
    this.dom.statusCharName.textContent = c.name;
    this.dom.statusCharTitle.textContent = c.title;
    this.dom.charInfoName.textContent = c.name;
    this.dom.statAffection.textContent = this.state.profile.affection;
    this.dom.statLevel.textContent = this.state.profile.level;
    const expToNext = this.getExpToNextLevel();
    this.dom.expBarText.textContent = `${this.state.profile.exp}/${expToNext}`;
    this.dom.expBarFill.style.width = `${Math.min(100, (this.state.profile.exp / expToNext) * 100)}%`;
    this.dom.charInfoDetail.textContent = `${c.title} · 好感 ${this.state.profile.affection} · Lv.${this.state.profile.level}`;
  },

  updateSprite() {
    const sprite = this.state.settings.customSprite || this.state.character.sprite || "assets/0.png";
    this.dom.characterSprite.src = sprite;
    const s = this.state.settings;
    this.dom.characterSprite.style.setProperty("--sprite-h", `${s.spriteSize}vh`);
    this.dom.characterSprite.style.transform = `translateX(calc(-50% + ${s.spriteTranslateX || 0}px)) translateY(${s.spriteTranslateY || 0}px) scale(${s.spriteScale || 1})`;
    this.dom.characterSprite.onerror = () => { this.dom.characterSprite.src = "assets/0.png"; this.dom.characterSprite.onerror = null; };
  },

  /* ── Mode switch ── */

  switchMode(mode) {
    this.state.currentMode = mode;
    this.dom.modeTabs.querySelectorAll(".mode-tab").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
    this.dom.learnContent.classList.toggle("active", mode === "learn");
    this.dom.cardsContent.classList.toggle("active", mode === "cards");
    this.dom.testContent.classList.toggle("active", mode === "test");
    if (mode === "learn") this.startLearn();
    if (mode === "cards") this.startCards();
    if (mode === "test") this.startReview();
  },

  /* ════════════════════════════════════════════════
     LEARN MODE — Auto-teaching with word bank
     ════════════════════════════════════════════════ */

  startLearn() {
    const session = WordManager.startLearnSession(this.state.settings.difficulty, 10);
    this.renderLearnWord();
    this.setDialogue(this.state.character.name, "今天的词我已经准备好了。一个一个看过去，不着急。");
  },

  renderLearnWord() {
    const word = WordManager.getCurrentLearnWord();
    if (!word) {
      this.dom.learnWord.textContent = "—";
      this.dom.learnPhonetic.textContent = "";
      this.dom.learnMeaning.textContent = "";
      this.dom.learnExample.textContent = "";
      this.dom.learnExampleCn.textContent = "";
      this.dom.learnMemoryTip.textContent = "";
      this.dom.learnProgress.textContent = "—";
      return;
    }
    this.dom.learnWord.textContent = word.english;
    this.dom.learnPhonetic.textContent = word.phonetic || "";
    this.dom.learnMeaning.textContent = word.chinese;
    this.dom.learnExample.textContent = word.example || "";
    this.dom.learnExampleCn.textContent = word.exampleChinese || "";
    this.dom.learnMemoryTip.textContent = AIManager.makeMemoryTip({ word: word.english, meaning: word.chinese });
    const prog = WordManager.getLearnProgress();
    this.dom.learnProgress.textContent = `${prog.current} / ${prog.total}`;
  },

  navigateLearn(dir) {
    const word = dir < 0 ? WordManager.prevLearnWord() : WordManager.nextLearnWord();
    this.renderLearnWord();
    if (word) {
      this.setDialogue(this.state.character.name, AIManager.makeCharacterComment({
        word: word.english, meaning: word.chinese, character: this.state.character, example: word.example
      }));
    }
  },

  speakLearnWord() {
    const word = WordManager.getCurrentLearnWord();
    if (word) {
      TTSManager.speakWord(word.english, this.state.settings.voice);
    }
  },

  async handleInquiry() {
    const text = this.dom.wordInput.value.trim();
    if (!text) return;
    this.dom.wordInput.value = "";
    // Show the inquired word in learn display
    const wordData = WordManager.findInAllBanks(text);
    if (wordData) {
      this.dom.learnWord.textContent = wordData.english;
      this.dom.learnPhonetic.textContent = wordData.phonetic || "";
      this.dom.learnMeaning.textContent = wordData.chinese;
      this.dom.learnExample.textContent = wordData.example || "";
      this.dom.learnExampleCn.textContent = wordData.exampleChinese || "";
      this.dom.learnMemoryTip.textContent = AIManager.makeMemoryTip({ word: wordData.english, meaning: wordData.chinese });
      this.dom.learnProgress.textContent = "查询";
      this.setDialogue(this.state.character.name, AIManager.makeCharacterComment({
        word: wordData.english, meaning: wordData.chinese, character: this.state.character, example: wordData.example
      }));
    } else {
      this.setDialogue(this.state.character.name, `「${text}」这个词我暂时还不认识。我们之后一起查。`);
    }
  },

  /* ════════════════════════════════════════════════
     CARDS MODE — Flash cards with Ebbinghaus
     ════════════════════════════════════════════════ */

  prepareScheduledCards() {
    const count = DIFFICULTY_CONFIG[this.state.settings.difficulty]?.wordCount || 5;
    const dueWords = WordManager.getDueWords(this.state.wordHistory, this.state.settings.difficulty);
    const freshWords = WordManager.getRandomWords(this.state.settings.difficulty, count);
    const merged = [...dueWords, ...freshWords];
    const unique = [];
    const seen = new Set();
    for (const w of merged) {
      const key = w.english.toLowerCase();
      if (!seen.has(key)) { seen.add(key); unique.push({ ...w, flipped: false, remembered: null }); }
      if (unique.length >= count) break;
    }
    return unique;
  },

  startCards() {
    this.state.cards.items = this.prepareScheduledCards();
    this.state.cards.activeIndex = 0;
    this.state.cards.drawn = 0;
    this.state.cards.remembered = 0;
    this.state.cards.wrong = 0;
    this.renderCards();
    const dueCount = WordManager.getReviewStats(this.state.wordHistory).dueCount;
    if (dueCount > 0) {
      this.setDialogue(this.state.character.name, `今天有 ${dueCount} 个单词需要复习。抽几张卡片过一遍。`);
    } else {
      this.setDialogue(this.state.character.name, "抽一张学习卡。先看英文，再翻过来。不要急。");
    }
  },

  renderCards() {
    this.dom.flashcard.style.transition = "none";
    const card = this.state.cards.items[this.state.cards.activeIndex];
    if (!card) {
      this.dom.cardFrontWord.textContent = "done";
      this.dom.cardFrontPhonetic.textContent = "";
      this.dom.cardBackMeaning.textContent = "今天的卡片已经复习完了";
      this.dom.cardBackExample.textContent = "";
      this.dom.cardBackExampleCn.textContent = "";
      this.dom.cardBackTip.textContent = "";
      this.dom.flashcard.classList.remove("flipped");
      this.dom.cardsProgress.textContent = `完成：${this.state.cards.remembered}/${this.state.cards.items.length}`;
    } else {
      this.dom.flashcard.classList.toggle("flipped", card.flipped);
      this.dom.cardFrontWord.textContent = card.english;
      this.dom.cardFrontPhonetic.textContent = card.phonetic || "";
      this.dom.cardBackMeaning.textContent = card.chinese;
      this.dom.cardBackExample.textContent = card.example || "";
      this.dom.cardBackExampleCn.textContent = card.exampleChinese || "";
      this.dom.cardBackTip.textContent = AIManager.makeMemoryTip({ word: card.english, meaning: card.chinese });
      const dueText = WordManager.getNextReviewText(this.state.wordHistory[card.english?.toLowerCase()]);
      this.dom.cardsProgress.textContent = `${this.state.cards.drawn} / ${this.state.cards.items.length} · 复习：${dueText}`;
    }
    requestAnimationFrame(() => { this.dom.flashcard.style.transition = ""; });
  },

  flipCard() {
    const card = this.state.cards.items[this.state.cards.activeIndex];
    if (!card || card.remembered !== null) return;
    card.flipped = !card.flipped;
    this.renderCards();
    if (card.flipped) {
      this.setDialogue(this.state.character.name, `${card.english}。翻过来了。看中文，再回想去例句。`);
    } else {
      this.setDialogue(this.state.character.name, `${card.english}。回到正面了。`);
    }
  },

  answerCard(remembered) {
    const card = this.state.cards.items[this.state.cards.activeIndex];
    if (!card || card.remembered !== null) return;
    if (!card.flipped) { this.flipCard(); return; }
    card.remembered = remembered;
    this.state.cards.drawn++;
    // Record via Ebbinghaus
    WordManager.recordReview(this.state.wordHistory, card.english, remembered);
    if (remembered) {
      this.state.cards.remembered++;
      this.addExp(EXP_CONFIG.expPerQuizCorrect);
      this.addAffection(AFFECTION_CONFIG.perQuizCorrect);
      this.setDialogue(this.state.character.name, `嗯。${card.english} 留下来了。下次复习在 ${WordManager.getNextReviewText(this.state.wordHistory[card.english.toLowerCase()])}。`);
    } else {
      this.state.cards.wrong++;
      this.addAffection(AFFECTION_CONFIG.perWrong);
      this.setDialogue(this.state.character.name, `没关系。${card.english} 还很淡。过一会儿再看一次。`);
    }
    const next = this.state.cards.items.findIndex((item) => item.remembered === null);
    this.state.cards.activeIndex = next >= 0 ? next : this.state.cards.activeIndex;
    this.renderCards();
    this.saveData();
    if (this.state.cards.drawn >= this.state.cards.items.length) {
      this.setDialogue(this.state.character.name, `今天的闪卡结束。记住了 ${this.state.cards.remembered} 张。`);
    }
  },

  /* ════════════════════════════════════════════════
     REVIEW MODE — Ebbinghaus-based review
     ════════════════════════════════════════════════ */

  startReview() {
    const stats = WordManager.getReviewStats(this.state.wordHistory);
    if (stats.dueCount === 0 && Object.keys(this.state.wordHistory).length === 0) {
      this.dom.testProgress.textContent = "还没有学习的单词";
      this.dom.testWordDisplay.textContent = "—";
      this.dom.testPhonetic.textContent = "";
      this.dom.testInputContainer.style.display = "none";
      this.dom.testResult.innerHTML = "先学一些单词，再来复习吧。";
      this.setDialogue(this.state.character.name, "还没有学过的单词。先去 Learn 模式看看吧。");
      return;
    }
    const due = WordManager.getDueWords(this.state.wordHistory, this.state.settings.difficulty);
    if (due.length === 0) {
      this.dom.testProgress.textContent = "今日复习完成";
      this.dom.testWordDisplay.textContent = "✓";
      this.dom.testPhonetic.textContent = "";
      this.dom.testInputContainer.style.display = "none";
      this.dom.testResult.innerHTML = `今天没有到期的复习。已学 ${stats.total} 个单词。`;
      this.setDialogue(this.state.character.name, `今天没有需要复习的单词。做得好。`);
      return;
    }
    this.state.test.items = due.sort(() => Math.random() - 0.5).slice(0, 10);
    this.state.test.index = 0;
    this.state.test.correct = 0;
    this.state.test.wrong = 0;
    this.dom.testProgress.textContent = `今日待复习：${stats.dueCount} 个`;
    this.showReviewWord();
  },

  showReviewWord() {
    const word = this.state.test.items[this.state.test.index];
    if (!word) { this.finishReview(); return; }
    this.dom.testWordDisplay.textContent = word.english;
    this.dom.testPhonetic.textContent = word.phonetic || "";
    this.dom.testInput.value = "";
    this.dom.testResult.innerHTML = "";
    this.dom.testInputContainer.style.display = "flex";
    this.setDialogue(this.state.character.name, `${word.english}。写下它的中文意思。`);
    setTimeout(() => this.dom.testInput?.focus(), 50);
  },

  checkTestAnswer() {
    const word = this.state.test.items[this.state.test.index];
    if (!word) return;
    const answer = this.dom.testInput.value.trim();
    if (!answer) return;
    const correct = checkChineseAnswer(answer, word.chinese);
    this.dom.testInputContainer.style.display = "none";
    // Record via Ebbinghaus
    WordManager.recordReview(this.state.wordHistory, word.english, correct);
    if (correct) {
      this.state.test.correct++;
      this.addExp(EXP_CONFIG.expPerTestCorrect);
      this.addAffection(AFFECTION_CONFIG.perTestCorrect);
      this.dom.testResult.innerHTML = `
        对了。${word.english} 的颜色已经留下来了。<br>
        <span class="next-review">下次复习：${WordManager.getNextReviewText(this.state.wordHistory[word.english.toLowerCase()])}</span><br>
        <button class="chalk-choice next-review" id="btn-next-test">下一题</button>`;
      this.setDialogue(this.state.character.name, "对了。线条很稳。");
    } else {
      this.state.test.wrong++;
      this.addAffection(AFFECTION_CONFIG.perWrong);
      this.dom.testResult.innerHTML = `
        还差一点。你写的是「${answer}」，正确是「${word.chinese}」。<br>
        <span class="next-review">${WordManager.getNextReviewText(this.state.wordHistory[word.english.toLowerCase()])} 再复习一次</span><br>
        <button class="chalk-choice next-review" id="btn-next-test">下一题</button>`;
      this.setDialogue(this.state.character.name, `没关系。${word.english} 现在是浅灰色。我们再给它加一层记忆。`);
    }
    document.getElementById("btn-next-test")?.addEventListener("click", () => {
      this.state.test.index++;
      this.showReviewWord();
    });
    this.saveData();
  },

  finishReview() {
    const total = this.state.test.items.length;
    this.dom.testProgress.textContent = "今日复习完成";
    this.dom.testWordDisplay.textContent = `${this.state.test.correct}/${total}`;
    this.dom.testPhonetic.textContent = "";
    this.dom.testInputContainer.style.display = "none";
    this.dom.testResult.innerHTML = `<button class="chalk-choice" id="btn-restart-test">再来一轮</button>`;
    this.setDialogue(this.state.character.name, `复习结束。正确 ${this.state.test.correct} 个。`);
    document.getElementById("btn-restart-test")?.addEventListener("click", () => this.startReview());
  },

  /* ════════════════════════════════════════════════
     SAVE / LOAD — Multi-slot
     ════════════════════════════════════════════════ */

  openSaveModal(mode) {
    this.state.saveMode = mode;
    this.dom.saveModalTitle.textContent = mode === "save" ? "保存进度" : "读取存档";
    this.dom.btnSaveExport.style.display = "none";
    this.renderSaveSlots();
    this.dom.saveModal.classList.add("active");
    this.dom.saveModal.setAttribute("aria-hidden", "false");
  },

  closeSaveModal() {
    this.dom.saveModal.classList.remove("active");
    this.dom.saveModal.setAttribute("aria-hidden", "true");
  },

  renderSaveSlots() {
    this.dom.saveSlotList.innerHTML = "";
    const slots = SaveManager.getSlots();
    for (let i = 0; i < 6; i++) {
      const info = SaveManager.getSlotInfo(i);
      const item = document.createElement("div");
      item.className = "save-slot-item";
      if (!info.exists) item.classList.add("save-slot-empty");
      item.dataset.index = i;

      const infoDiv = document.createElement("div");
      infoDiv.className = "save-slot-info";
      const title = document.createElement("div");
      title.className = "save-slot-title";
      title.textContent = info.label;
      infoDiv.appendChild(title);

      if (info.exists) {
        const meta = document.createElement("div");
        meta.className = "save-slot-meta";
        meta.textContent = `${info.character} · Lv.${info.level} · ${info.wordCount} 词 · ${info.savedAt}`;
        infoDiv.appendChild(meta);
      }

      item.appendChild(infoDiv);

      if (info.exists) {
        const actions = document.createElement("div");
        actions.className = "save-slot-actions";
        if (this.state.saveMode === "save") {
          const overwrite = document.createElement("button");
          overwrite.textContent = "覆盖";
          overwrite.addEventListener("click", (e) => { e.stopPropagation(); this.doSave(i); });
          actions.appendChild(overwrite);
        } else {
          const loadBtn = document.createElement("button");
          loadBtn.textContent = "读取";
          loadBtn.addEventListener("click", (e) => { e.stopPropagation(); this.doLoad(i); });
          actions.appendChild(loadBtn);
          const delBtn = document.createElement("button");
          delBtn.textContent = "删除";
          delBtn.addEventListener("click", (e) => { e.stopPropagation(); this.doDelete(i); });
          actions.appendChild(delBtn);
        }
        item.appendChild(actions);
      } else if (this.state.saveMode === "save") {
        item.addEventListener("click", () => this.doSave(i));
      }
      this.dom.saveSlotList.appendChild(item);
    }
  },

  doSave(index) {
    SaveManager.save(index, this.state);
    this.saveData();
    this.renderSaveSlots();
    this.setDialogue("系统", `存档已保存到位置 ${index + 1}。`);
  },

  doLoad(index) {
    const data = SaveManager.load(index);
    if (!data) return;
    SaveManager.restoreToState(data, this.state);
    this.ensureCharacter();
    this.updateAllCharacterViews();
    this.renderCharacterSelection(this.dom.characterGrid, this.state.settings.characterId);
    this.syncSettingsControls();
    this.saveData(false);
    this.closeSaveModal();
    this.setDialogue("系统", "存档已经读取。回到之前的位置了。");
  },

  doDelete(index) {
    SaveManager.deleteSlot(index);
    this.renderSaveSlots();
    this.setDialogue("系统", `存档位 ${index + 1} 已删除。`);
  },

  exportSaveSlot() {
    // Export handled per-slot via action buttons in renderSaveSlots
  },

  /* ════════════════════════════════════════════════
     DIALOGUE
     ════════════════════════════════════════════════ */

  setDialogue(name, text) {
    if (this.state.typewriterTimer) clearInterval(this.state.typewriterTimer);
    TTSManager.stop();
    this.state.isTyping = true;
    this.state.currentDialogueText = text || "";
    this.dom.dialogueName.textContent = name || this.state.character.name;
    this.dom.dialogueText.textContent = "";
    this.dom.dialogueContinue.classList.remove("visible");
    this.state.dialogueLog.push({ name: this.dom.dialogueName.textContent, text: this.state.currentDialogueText, at: new Date().toISOString() });
    const chars = [...this.state.currentDialogueText];
    let idx = 0;
    this.state.typewriterTimer = setInterval(() => {
      if (idx < chars.length) { this.dom.dialogueText.textContent += chars[idx]; idx++; }
      else {
        clearInterval(this.state.typewriterTimer);
        this.state.typewriterTimer = null;
        this.state.isTyping = false;
        this.dom.dialogueContinue.classList.add("visible");
        if (this.state.settings.voice.autoSpeakDialogue) this.speakCurrentDialogue();
      }
    }, 24);
  },

  skipTypewriter() {
    if (!this.state.isTyping) return;
    clearInterval(this.state.typewriterTimer);
    this.state.typewriterTimer = null;
    this.state.isTyping = false;
    this.dom.dialogueText.textContent = this.state.currentDialogueText;
    this.dom.dialogueContinue.classList.add("visible");
  },

  speakCurrentDialogue() {
    this.skipTypewriter();
    TTSManager.speak(this.state.currentDialogueText, this.state.settings.voice);
  },

  /* ════════════════════════════════════════════════
     SETTINGS MODAL
     ════════════════════════════════════════════════ */

  openSettingsModal() {
    this.renderCharacterSelection(this.dom.modalCharacterGrid, this.state.settings.characterId);
    this.dom.modalDifficulty.value = this.state.settings.difficulty;
    this.dom.modalSpriteUrl.value = this.state.settings.customSprite;
    this.dom.modalVoiceRate.value = this.state.settings.voice.rate;
    this.dom.modalVoicePitch.value = this.state.settings.voice.pitch;
    this.dom.modalAutoSpeak.checked = this.state.settings.voice.autoSpeakDialogue;
    this.dom.spriteSizeSlider.value = this.state.settings.spriteSize;
    this.dom.spriteSizeValue.textContent = this.state.settings.spriteSize;
    this.updateActiveSpritePreset(this.state.settings.spriteSize);
    this.dom.modalAiProvider.value = this.state.settings.ai?.provider || "mock";
    this.dom.modalAiKey.value = this.state.settings.ai?.apiKey || "";
    this.dom.modalAiEndpoint.value = this.state.settings.ai?.endpoint || "";
    this.dom.modalAiModel.value = this.state.settings.ai?.model || "";
    this.updateVoiceOptions();
    this.dom.settingsModal.classList.add("active");
    this.dom.settingsModal.setAttribute("aria-hidden", "false");
  },

  closeSettingsModal() {
    this.dom.settingsModal.classList.remove("active");
    this.dom.settingsModal.setAttribute("aria-hidden", "true");
  },

  updateVoiceOptions() {
    if (!this.dom.modalVoiceSelect) return;
    const voices = TTSManager.getVoices();
    const current = this.state.settings.voice.voiceName;
    this.dom.modalVoiceSelect.innerHTML = "";
    const none = document.createElement("option");
    none.value = "";
    none.textContent = voices.length ? "默认音色" : "浏览器暂未提供音色";
    this.dom.modalVoiceSelect.appendChild(none);
    voices.forEach((v) => {
      const o = document.createElement("option");
      o.value = v.name;
      o.textContent = `${v.name} · ${v.lang}`;
      this.dom.modalVoiceSelect.appendChild(o);
    });
    this.dom.modalVoiceSelect.value = current;
  },

  applyModalVoiceToState(save) {
    this.state.settings.voice = { ...this.state.settings.voice, provider: "browser",
      voiceName: this.dom.modalVoiceSelect.value, rate: Number(this.dom.modalVoiceRate.value || 1),
      pitch: Number(this.dom.modalVoicePitch.value || 1), autoSpeakDialogue: this.dom.modalAutoSpeak.checked };
    if (save) this.saveData();
  },

  saveModalSettings() {
    const selected = this.dom.modalCharacterGrid.querySelector(".character-card.selected");
    if (selected) this.state.settings.characterId = selected.dataset.id;
    this.state.settings.difficulty = this.dom.modalDifficulty.value;
    this.state.settings.customSprite = this.dom.modalSpriteUrl.value.trim();
    this.state.settings.ai = { provider: this.dom.modalAiProvider.value, apiKey: this.dom.modalAiKey.value,
      endpoint: this.dom.modalAiEndpoint.value, model: this.dom.modalAiModel.value };
    AIManager.setConfig(this.state.settings.ai);
    WordManager.setDifficulty(this.state.settings.difficulty);
    this.applyModalVoiceToState(false);
    this.ensureCharacter();
    this.updateAllCharacterViews();
    this.renderCharacterSelection(this.dom.characterGrid, this.state.settings.characterId);
    this.syncSettingsControls();
    this.saveData();
    this.closeSettingsModal();
    this.setDialogue(this.state.character.name, this.state.character.greeting);
  },

  handleSpriteSizeChange() {
    const size = Number(this.dom.spriteSizeSlider.value);
    this.state.settings.spriteSize = size;
    this.dom.spriteSizeValue.textContent = size;
    this.updateActiveSpritePreset(size);
    this.updateSprite();
  },

  handleSpritePresetClick(event) {
    const btn = event.target.closest("[data-size]");
    if (!btn) return;
    const size = Number(btn.dataset.size);
    this.state.settings.spriteSize = size;
    this.dom.spriteSizeSlider.value = size;
    this.dom.spriteSizeValue.textContent = size;
    this.updateActiveSpritePreset(size);
    this.updateSprite();
  },

  updateActiveSpritePreset(size) {
    this.dom.spriteSizePresets.querySelectorAll("[data-size]").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.size) === Math.round(size));
    });
  },

  /* ════════════════════════════════════════════════
     DATA
     ════════════════════════════════════════════════ */

  loadData() {
    try {
      const settings = localStorage.getItem("galgameEnglish_settings");
      const profile = localStorage.getItem("galgameEnglish_profile");
      const history = localStorage.getItem("galgameEnglish_wordHistory");
      if (settings) this.state.settings = { ...this.state.settings, ...JSON.parse(settings) };
      if (profile) this.state.profile = { ...this.state.profile, ...JSON.parse(profile) };
      if (history) this.state.wordHistory = JSON.parse(history);
      this.state.settings.voice = { provider: "browser", voiceName: "", rate: 1, pitch: 1.08, volume: 1, autoSpeakDialogue: false, autoSpeakExamples: false, ...(this.state.settings.voice || {}) };
      this.state.settings.ai = { provider: "mock", apiKey: "", endpoint: "", model: "", ...(this.state.settings.ai || {}) };
      this.state.settings.spriteTranslateX = this.state.settings.spriteTranslateX || 0;
      this.state.settings.spriteTranslateY = this.state.settings.spriteTranslateY || 0;
      this.state.settings.spriteScale = this.state.settings.spriteScale || 1;
      AIManager.setConfig(this.state.settings.ai);
      WordManager.setDifficulty(this.state.settings.difficulty);
    } catch (e) { console.warn("[App] 数据读取失败", e); }
  },

  saveData(showToast) {
    localStorage.setItem("galgameEnglish_settings", JSON.stringify(this.state.settings));
    localStorage.setItem("galgameEnglish_profile", JSON.stringify(this.state.profile));
    localStorage.setItem("galgameEnglish_wordHistory", JSON.stringify(this.state.wordHistory));
    SaveManager.autoSave(this.state);
    if (showToast) this.setDialogue("系统", "存档已保存。");
  },

  /* ════════════════════════════════════════════════
     EXP / AFFECTION
     ════════════════════════════════════════════════ */

  addExp(amount) {
    this.state.profile.exp += amount;
    let next = this.getExpToNextLevel();
    while (this.state.profile.exp >= next) { this.state.profile.exp -= next; this.state.profile.level++; next = this.getExpToNextLevel(); }
    this.updateStatusBar(); this.saveData();
  },

  addAffection(amount) {
    this.state.profile.affection = Math.max(0, Math.min(AFFECTION_CONFIG.maxAffection, this.state.profile.affection + amount));
    this.updateStatusBar(); this.saveData();
  },

  getExpToNextLevel() {
    return Math.floor(EXP_CONFIG.expToNextLevelBase * Math.pow(EXP_CONFIG.expToNextLevelMultiplier, this.state.profile.level - 1));
  },

  shortText(text, max) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    return clean.length > max ? `${clean.slice(0, max)}...` : clean;
  }
};

document.addEventListener("DOMContentLoaded", () => { App.init(); });
