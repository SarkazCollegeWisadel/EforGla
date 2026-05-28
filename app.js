/* ════════════════════════════════════════════════
   EforGla (语之恋) V1.6 — Application Core
   ════════════════════════════════════════════════ */

const App = {
  state: {
    currentPage: "welcome",
    currentMode: "learn",
    characters: [],
    character: null,
    settings: {
      characterId: "griseo_card",
      vocabularyId: "cet4",
      difficulty: "medium",
      aiMode: true,
      customSprite: "",
      spriteSize: 62,
      spriteTranslateX: 0,
      spriteTranslateY: 0,
      spriteScale: 1,
      customBackground: "",
      customBlackboard: "",
      blackboardColor: "",
      blackboardSizeW: 49.4,
      blackboardSizeH: 50.5,
      blackboardTranslateX: 0,
      blackboardTranslateY: 0,
      blackboardScale: 1,
      ai: { provider: "deepseek", apiKey: "", endpoint: "", model: "deepseek-v4-flash" },
      voice: { provider: "browser", voiceName: "", rate: 1, pitch: 1.08, volume: 1, autoSpeakDialogue: false, autoSpeakExamples: false },
      mcp: { enabled: false, url: "" }
    },
    profile: { affection: 0, level: 1, exp: 0 },
    wordHistory: {},
    dialogueLog: [],
    isTyping: false,
    typewriterTimer: null,
    currentDialogueText: "",
    cards: { items: [], activeIndex: 0, drawn: 0, remembered: 0, wrong: 0 },
    test: { items: [], index: 0, correct: 0, wrong: 0 },
    conversation: { currentWord: null, lastUserMessage: "" },
    saveMode: "save"
  },

  dom: {},

  /* ════════════════════════════════════════════════
     INIT
     ════════════════════════════════════════════════ */

  async init() {
    this.cacheDom();
    this.loadData();
    this.state.characters = await CharacterManager.init();
    await WordManager.init();
    SaveManager.init();
    LearningState.init(this.state.settings.vocabularyId || "cet4");
    if (window.__pendingLearningState) {
      LearningState.deserialize(window.__pendingLearningState);
      delete window.__pendingLearningState;
    }
    this.ensureCharacter();
    this.bindEvents();
    this.renderCharacterSelection(this.dom.characterGrid, this.state.settings.characterId);
    this.renderVocabSelector("settings-vocab-selector", this.state.settings.vocabularyId);
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
      // Welcome
      pageWelcome: byId("page-welcome"), btnStart: byId("btn-start"),
      // Settings page
      pageSettings: byId("page-settings"), characterGrid: byId("character-grid"),
      aiModeToggle: byId("ai-mode-toggle"), ttsAutoToggle: byId("tts-auto-toggle"),
      btnConfirmSettings: byId("btn-confirm-settings"),
      // Main
      pageMain: byId("page-main"),
      // Status
      statusAvatar: byId("status-avatar"), statusCharName: byId("status-char-name"),
      statusCharTitle: byId("status-char-title"), statAffection: byId("stat-affection"),
      statLevel: byId("stat-level"), expBarFill: byId("exp-bar-fill"), expBarText: byId("exp-bar-text"),
      // Character
      characterSprite: byId("character-sprite"),
      // Mode tabs
      modeTabs: byId("mode-tabs"),
      // Learn
      learnContent: byId("learn-content"),
      learnK1: byId("learn-k1"), learnK2: byId("learn-k2"), learnK3: byId("learn-k3"),
      k1Prompt: byId("k1-prompt"), btnK1Next: byId("btn-k1-next"),
      k1CountBtns: byId("k1-count-btns"), k1CountCustomRow: byId("k1-count-custom-row"), k1CountValue: byId("k1-count-value"),
      k1DifficultyBtns: byId("k1-difficulty-btns"),
      k2Categories: byId("k2-categories"), btnK2Back: byId("btn-k2-back"), btnK2Next: byId("btn-k2-next"),
      k3Summary: byId("k3-summary"), btnK3Back: byId("btn-k3-back"), btnK3Collapse: byId("btn-k3-collapse"),
      learnBankLabel: byId("learn-bank-label"), learnRangeLabel: byId("learn-range-label"),
      learnCountLabel: byId("learn-count-label"),
      previewLearned: byId("preview-learned"), previewTotal: byId("preview-total"),
      previewFamiliarity: byId("preview-familiarity"), learnWordList: byId("learn-word-list"),
      btnStartLearning: byId("btn-start-learning"), btnRangeConfig: byId("btn-range-config"),
      rangeConfigPanel: byId("range-config-panel"),
      rangePresetBtns: byId("range-preset-btns"), rangeCustomRow: byId("range-custom-row"),
      rangeCustomStart: byId("range-custom-start"), rangeCustomEnd: byId("range-custom-end"),
      learnSortStep: byId("learn-sort-step"), sortModeBtns: byId("sort-mode-btns"),
      btnConfirmSort: byId("btn-confirm-sort"), learnSortThinking: byId("learn-sort-thinking"),
      learnRangeStep: byId("learn-range-step"), difficultyRangeBtns: byId("difficulty-range-btns"),
      countPresetBtns: byId("count-preset-btns"), countCustomRow: byId("count-custom-row"),
      countCustomValue: byId("count-custom-value"),
      filterPresetBtns: byId("filter-preset-btns"),
      btnApplyRange: byId("btn-apply-range"),
      lessonPlan: byId("lesson-plan"),
      learnBeforeStart: byId("learn-before-start"), learnWordArea: byId("learn-word-area"),
      learnWord: byId("learn-word"), learnPhonetic: byId("learn-phonetic"),
      learnMeaning: byId("learn-meaning"), learnPos: byId("learn-pos"),
      learnSynonyms: byId("learn-synonyms"), learnAntonyms: byId("learn-antonyms"),
      learnRoot: byId("learn-root"), learnExample: byId("learn-example"),
      learnExampleCn: byId("learn-example-cn"), learnCollocations: byId("learn-collocations"),
      learnSessionProgress: byId("learn-session-progress"),
      learnNavBar: byId("learn-nav-bar"), learnProgress: byId("learn-progress"),
      btnLearnPrev: byId("btn-learn-prev"), btnLearnNext: byId("btn-learn-next"),
      btnLearnSound: byId("btn-learn-sound"), btnMarkLearned: byId("btn-mark-learned"),
      learnCharName: byId("learn-char-name"), learnCharDialogue: byId("learn-char-dialogue"),
      learnHintProgress: byId("learn-hint-progress"),
      btnLearnHint: byId("btn-learn-hint"), btnLearnListen: byId("btn-learn-listen"),
      // Cards
      cardsContent: byId("cards-content"),
      flashcard: byId("flashcard"), cardFrontWord: byId("card-front-word"),
      cardFrontPhonetic: byId("card-front-phonetic"), cardBackMeaning: byId("card-back-meaning"),
      cardBackExample: byId("card-back-example"), cardBackExampleCn: byId("card-back-example-cn"),
      cardBackTip: byId("card-back-tip"), cardsProgress: byId("cards-progress"),
      cardActions: byId("card-actions"), btnCardForgot: byId("btn-card-forgot"),
      btnCardRemembered: byId("btn-card-remembered"),
      cardsEmpty: byId("cards-empty"), cardsRememberedTotal: byId("cards-remembered-total"),
      btnCardsRestart: byId("btn-cards-restart"),
      cardHintArea: byId("card-hint-area"), btnCardHint: byId("btn-card-hint"),
      cardHintText: byId("card-hint-text"),
      // Conversation
      conversationContent: byId("conversation-content"),
      convWord: byId("conv-word"), conversationLog: byId("conversation-log"),
      conversationInput: byId("conversation-input"),
      btnConversationSend: byId("btn-conversation-send"),
      btnConvPickWord: byId("btn-conv-pick-word"),
      btnConvSuggest: byId("btn-conv-suggest"), btnConvCorrect: byId("btn-conv-correct"),
      // Review
      reviewContent: byId("review-content"),
      testProgress: byId("test-progress"), testWordDisplay: byId("test-word-display"),
      testPhonetic: byId("test-phonetic"), testInput: byId("test-input"),
      btnTestSubmit: byId("btn-test-submit"),
      testInputContainer: byId("test-input-container"), testResult: byId("test-result"),
      reviewStatsBar: byId("review-stats-bar"),
      // Dialogue
      dialogueName: byId("dialogue-name"), dialogueText: byId("dialogue-text"),
      dialogueContinue: byId("dialogue-continue"), dialogueVoice: byId("dialogue-voice"),
      // Toolbar
      btnCharSwitch: byId("btn-char-switch"), btnSave: byId("btn-save"),
      btnLoad: byId("btn-load"), btnToolbarSettings: byId("btn-toolbar-settings"),
      // Settings modal
      settingsModal: byId("settings-modal"), modalCharacterGrid: byId("modal-character-grid"),
      modalVocabSelector: byId("modal-vocab-selector"),
      modalAiProvider: byId("modal-ai-provider"), modalAiKey: byId("modal-ai-key"),
      modalAiEndpoint: byId("modal-ai-endpoint"), modalAiModel: byId("modal-ai-model"),
      modalVoiceSelect: byId("modal-voice-select"), modalVoiceRate: byId("modal-voice-rate"),
      modalVoicePitch: byId("modal-voice-pitch"), modalAutoSpeak: byId("modal-auto-speak"),
      btnVoiceTest: byId("btn-voice-test"), btnModalSave: byId("btn-modal-save"),
      btnModalClose: byId("btn-modal-close"),
      spriteSizeSlider: byId("modal-sprite-size"), spriteSizeValue: byId("modal-sprite-size-value"),
      spriteSizePresets: byId("modal-sprite-size-presets"),
      modalBgFile: byId("modal-bg-file"), btnBgFile: byId("btn-bg-file"),
      modalBgPreview: byId("modal-bg-preview"), btnBgClear: byId("btn-bg-clear"),
      modalBlackboardFile: byId("modal-blackboard-file"), btnBlackboardFile: byId("btn-blackboard-file"),
      modalBlackboardPreview: byId("modal-blackboard-preview"), btnBlackboardClear: byId("btn-blackboard-clear"),
      modalBlackboardColor: byId("modal-blackboard-color"),
      modalBlackboardScale: byId("modal-blackboard-scale"), modalBlackboardScaleValue: byId("modal-blackboard-scale-value"),
      modalBlackboardX: byId("modal-blackboard-x"), modalBlackboardY: byId("modal-blackboard-y"),
      modalMcpEnabled: byId("modal-mcp-enabled"), modalMcpUrl: byId("modal-mcp-url"),
      btnMcpTest: byId("btn-mcp-test"), mcpToolsList: byId("mcp-tools-list"),
      // Save modal
      saveModal: byId("save-modal"), saveModalTitle: byId("save-modal-title"),
      saveSlotList: byId("save-slot-list"), btnSaveClose: byId("btn-save-close"),
      btnSaveCancel: byId("btn-save-cancel"), btnSaveExport: byId("btn-save-export")
    };
  },

  /* ════════════════════════════════════════════════
     EVENTS
     ════════════════════════════════════════════════ */

  bindEvents() {
    // Welcome
    this.dom.btnStart.addEventListener("click", () => this.showPage("settings"));
    this.dom.btnConfirmSettings.addEventListener("click", () => this.saveSettingsFromPage());
    this.dom.characterGrid.addEventListener("click", (e) => this.handleCharacterGridClick(e, false));
    this.dom.modalCharacterGrid.addEventListener("click", (e) => this.handleCharacterGridClick(e, true));

    // Mode tabs
    this.dom.modeTabs.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-mode]");
      if (btn) this.switchMode(btn.dataset.mode);
    });

    // Learn
    this.dom.btnStartLearning.addEventListener("click", () => this.beginLearnSession());
    this.dom.btnLearnPrev.addEventListener("click", () => this.navigateLearn(-1));
    this.dom.btnLearnNext.addEventListener("click", () => this.navigateLearn(1));
    this.dom.btnLearnSound.addEventListener("click", () => this.speakLearnWord());
    this.dom.btnMarkLearned.addEventListener("click", () => this.markCurrentWord());
    if (this.dom.btnLearnListen) this.dom.btnLearnListen.addEventListener("click", () => this.readLearnDialogue());
    if (this.dom.btnLearnHint) this.dom.btnLearnHint.addEventListener("click", () => this.advanceLearnHint());
    this.dom.btnRangeConfig.addEventListener("click", () => this.toggleRangeConfig());
    if (this.dom.btnConfirmSort) this.dom.btnConfirmSort.addEventListener("click", () => this.confirmLearnSortMode());
    this.dom.btnApplyRange.addEventListener("click", () => this.applyRangeConfig());
    if (this.dom.characterSprite) this.dom.characterSprite.addEventListener("click", () => this.advanceLearnHint());

    // Cards
    this.dom.flashcard.addEventListener("click", () => this.flipCard());
    this.dom.btnCardForgot.addEventListener("click", () => this.answerCard(false));
    this.dom.btnCardRemembered.addEventListener("click", () => this.answerCard(true));
    this.dom.btnCardsRestart.addEventListener("click", () => this.startCards());
    this.dom.btnCardHint.addEventListener("click", () => this.advanceCardHint());

    // Conversation
    this.dom.btnConversationSend.addEventListener("click", () => this.sendConversationMessage());
    this.dom.conversationInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.sendConversationMessage();
    });
    this.dom.btnConvPickWord.addEventListener("click", () => this.pickConversationWord());
    this.dom.btnConvSuggest.addEventListener("click", () => this.requestConversationSuggest());
    this.dom.btnConvCorrect.addEventListener("click", () => this.requestSentenceCheck());

    // Review
    this.dom.btnTestSubmit.addEventListener("click", () => this.checkTestAnswer());
    this.dom.testInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.checkTestAnswer();
    });

    // Dialogue
    this.dom.dialogueText.addEventListener("click", () => this.skipTypewriter());
    this.dom.dialogueVoice.addEventListener("click", () => this.speakCurrentDialogue());

    // Toolbar
    this.dom.btnCharSwitch.addEventListener("click", () => this.openSettingsModal());
    this.dom.btnSave.addEventListener("click", () => this.openSaveModal("save"));
    this.dom.btnLoad.addEventListener("click", () => this.openSaveModal("load"));
    this.dom.btnToolbarSettings.addEventListener("click", () => this.openSettingsModal());

    // Settings modal
    this.dom.btnModalClose.addEventListener("click", () => this.closeSettingsModal());
    this.dom.settingsModal.addEventListener("click", (e) => {
      if (e.target === this.dom.settingsModal) this.closeSettingsModal();
    });
    this.dom.btnVoiceTest.addEventListener("click", () => {
      this.applyModalVoiceToState(false);
      TTSManager.speak("这是当前的语音试听。今天的颜色很亮。", this.state.settings.voice);
    });
    this.dom.btnModalSave.addEventListener("click", () => this.saveModalSettings());
    this.dom.spriteSizeSlider.addEventListener("input", () => this.handleSpriteSizeChange());
    this.dom.spriteSizePresets.addEventListener("click", (e) => this.handleSpritePresetClick(e));
    this.dom.modalBlackboardScale?.addEventListener("input", () => this.handleBlackboardScaleChange());
    this.dom.modalBlackboardX?.addEventListener("input", () => this.handleBlackboardOffsetChange());
    this.dom.modalBlackboardY?.addEventListener("input", () => this.handleBlackboardOffsetChange());
    this.dom.btnBgFile?.addEventListener("click", () => this.dom.modalBgFile?.click());
    this.dom.modalBgFile?.addEventListener("change", (e) => this.handleBgFileSelect(e, "background"));
    this.dom.btnBgClear?.addEventListener("click", () => this.clearBgFile("background"));
    this.dom.btnBlackboardFile?.addEventListener("click", () => this.dom.modalBlackboardFile?.click());
    this.dom.modalBlackboardFile?.addEventListener("change", (e) => this.handleBgFileSelect(e, "blackboard"));
    this.dom.btnBlackboardClear?.addEventListener("click", () => this.clearBgFile("blackboard"));
    this.dom.btnMcpTest?.addEventListener("click", () => this.handleMcpTest());
    this.dom.btnK1Next?.addEventListener("click", () => this.saveK1AndGoToK2());
    this.dom.btnK2Back?.addEventListener("click", () => this.goToLearnPhase("k1"));
    this.dom.btnK2Next?.addEventListener("click", () => this.goToLearnPhase("k3"));
    this.dom.btnK3Back?.addEventListener("click", () => this.goToLearnPhase("k2"));
    this.dom.btnK3Collapse?.addEventListener("click", () => this.collapseLearnSettings());

    // Save modal
    this.dom.btnSaveClose.addEventListener("click", () => this.closeSaveModal());
    this.dom.btnSaveCancel.addEventListener("click", () => this.closeSaveModal());

    // Keyboard
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { this.closeSettingsModal(); this.closeSaveModal(); }
    });
  },

  /* ════════════════════════════════════════════════
     PAGE NAVIGATION
     ════════════════════════════════════════════════ */

  showPage(pageName) {
    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
    const page = {
      welcome: this.dom.pageWelcome,
      settings: this.dom.pageSettings,
      main: this.dom.pageMain
    }[pageName];
    if (!page) return;
    page.classList.add("active");
    this.state.currentPage = pageName;
    if (pageName === "main") this.onEnterMain();
  },

  onEnterMain() {
    this.ensureCharacter();
    this.updateAllCharacterViews();
    LearningState.init(this.state.settings.vocabularyId || "cet4");
    Blackboard.init();
    this.switchMode("learn");
    this.setDialogue(this.state.character.name, this.state.character.greeting);
  },

  /* ════════════════════════════════════════════════
     CHARACTER
     ════════════════════════════════════════════════ */

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

  /* ════════════════════════════════════════════════
     VOCABULARY SELECTOR
     ════════════════════════════════════════════════ */

  renderVocabSelector(containerId, selectedId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    const banks = WordManager.getAvailableVocabularies();
    banks.forEach((bank) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `vocab-option${bank.id === selectedId ? " selected" : ""}`;
      btn.dataset.vocabId = bank.id;
      btn.innerHTML = `<span class="vocab-option-name">${bank.label}</span><span class="vocab-option-category">${bank.category}</span>`;
      btn.addEventListener("click", () => {
        container.querySelectorAll(".vocab-option").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
      container.appendChild(btn);
    });
  },

  getSelectedVocabId(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return "cet4";
    const selected = container.querySelector(".vocab-option.selected");
    return selected?.dataset?.vocabId || "cet4";
  },

  /* ════════════════════════════════════════════════
     SETTINGS PAGE
     ════════════════════════════════════════════════ */

  saveSettingsFromPage() {
    const selected = this.dom.characterGrid.querySelector(".character-card.selected");
    if (selected) this.state.settings.characterId = selected.dataset.id;
    const vocabId = this.getSelectedVocabId("settings-vocab-selector");
    this.state.settings.vocabularyId = vocabId;
    this.state.settings.difficulty = BANK_TO_DIFFICULTY[vocabId] || "medium";
    this.state.settings.aiMode = this.dom.aiModeToggle.checked;
    this.state.settings.voice.autoSpeakDialogue = this.dom.ttsAutoToggle.checked;

    WordManager.setVocabulary(vocabId);
    LearningState.setVocabulary(vocabId);
    this.ensureCharacter();
    this.saveData();
    this.showPage("main");
  },

  syncSettingsControls() {
    this.dom.aiModeToggle.checked = this.state.settings.aiMode;
    this.dom.ttsAutoToggle.checked = this.state.settings.voice.autoSpeakDialogue;
  },

  /* ════════════════════════════════════════════════
     VIEW UPDATES
     ════════════════════════════════════════════════ */

  updateAllCharacterViews() {
    this.updateTheme();
    this.updateStatusBar();
    this.updateSprite();
  },

  updateTheme() {
    const t = this.state.character?.theme || {};
    document.documentElement.style.setProperty("--blue", t.primary || "#88bff2");
    document.documentElement.style.setProperty("--violet", t.secondary || "#9188d8");
    document.documentElement.style.setProperty("--gold", t.accent || "#e7cf89");
  },

  updateStatusBar() {
    const c = this.state.character;
    if (!c) return;
    this.dom.statusAvatar.textContent = c.avatar || c.name.slice(0, 1);
    this.dom.statusCharName.textContent = c.name;
    this.dom.statusCharTitle.textContent = c.title;
    this.dom.statAffection.textContent = this.state.profile.affection;
    this.dom.statLevel.textContent = this.state.profile.level;
    const expToNext = this.getExpToNextLevel();
    this.dom.expBarText.textContent = `${this.state.profile.exp}/${expToNext}`;
    this.dom.expBarFill.style.width = `${Math.min(100, (this.state.profile.exp / expToNext) * 100)}%`;
  },

  updateSprite() {
    const sprite = this.state.settings.customSprite || this.state.character?.sprite || "assets/0.png";
    this.dom.characterSprite.src = sprite;
    const s = this.state.settings;
    this.dom.characterSprite.style.setProperty("--sprite-h", `${s.spriteSize}vh`);
    this.dom.characterSprite.style.transform = `translateX(calc(-50% + ${s.spriteTranslateX || 0}px)) translateY(${s.spriteTranslateY || 0}px) scale(${s.spriteScale || 1})`;
    this.dom.characterSprite.onerror = () => {
      this.dom.characterSprite.src = "assets/0.png";
      this.dom.characterSprite.onerror = null;
    };
  },

  /* ════════════════════════════════════════════════
     MODE SWITCH
     ════════════════════════════════════════════════ */

  switchMode(mode) {
    this.state.currentMode = mode;
    this.dom.modeTabs.querySelectorAll(".mode-tab").forEach((b) => {
      b.classList.toggle("active", b.dataset.mode === mode);
    });
    this.dom.learnContent.classList.toggle("active", mode === "learn");
    this.dom.cardsContent.classList.toggle("active", mode === "cards");
    this.dom.conversationContent.classList.toggle("active", mode === "conversation");
    this.dom.reviewContent.classList.toggle("active", mode === "review");

    if (mode === "learn") this.startLearn();
    if (mode === "cards") this.startCards();
    if (mode === "conversation") this.startConversation();
    if (mode === "review") this.startReview();
  },

  /* ════════════════════════════════════════════════
     LEARN MODE
     ════════════════════════════════════════════════ */

  startLearn() {
    this.renderRangeBar();
    this.renderSortModePresets();
    this.renderCountPresets();
    this.renderDifficultyRangePresets();
    this.renderLearnSetupStage();
    this.renderLearnPreview();
    this.goToLearnPhase(LearningState.learnPhase);
  },

  goToLearnPhase(phase) {
    LearningState.learnPhase = phase;
    // Hide all phases and k0 content
    if (this.dom.learnK1) this.dom.learnK1.style.display = "none";
    if (this.dom.learnK2) this.dom.learnK2.style.display = "none";
    if (this.dom.learnK3) this.dom.learnK3.style.display = "none";
    if (this.dom.learnBeforeStart) this.dom.learnBeforeStart.style.display = "none";
    if (this.dom.learnWordArea) this.dom.learnWordArea.style.display = "none";
    if (this.dom.learnNavBar) this.dom.learnNavBar.style.display = "none";
    if (this.dom.btnStartLearning) this.dom.btnStartLearning.style.display = "none";
    if (this.dom.rangeConfigPanel) this.dom.rangeConfigPanel.style.display = "none";
    if (this.dom.lessonPlan) this.dom.lessonPlan.style.display = "none";

    if (phase === "k0") {
      // Show k0 (original learn UI)
      if (LearningState.inSession) {
        if (this.dom.learnWordArea) this.dom.learnWordArea.style.display = "";
        if (this.dom.learnNavBar) this.dom.learnNavBar.style.display = "";
        this.renderLearnWord();
      } else {
        if (this.dom.learnBeforeStart) this.dom.learnBeforeStart.style.display = "";
        if (this.dom.btnStartLearning) this.dom.btnStartLearning.style.display = "";
      }
      this.renderLearnPreview();
      this.updateLearnCharDialogue("调整好范围，点「开始学习」吧。");
    } else if (phase === "k1") {
      this.renderK1();
    } else if (phase === "k2") {
      this.renderK2();
    } else if (phase === "k3") {
      this.renderK3();
    }
  },

  renderK1() {
    if (this.dom.learnK1) this.dom.learnK1.style.display = "block";
    if (this.dom.k1Prompt) this.dom.k1Prompt.value = LearningState.userCategoryPrompt || "";
    this.renderSortModePresets();
    this._renderK1Counts();
    this._renderK1Difficulties();
    this.updateLearnCharDialogue("先选一种排列方式，也可以写个提示词让 AI 帮你分类。");
  },

  _renderK1Counts() {
    const container = this.dom.k1CountBtns;
    if (!container) return;
    container.innerHTML = "";
    COUNT_PRESETS.forEach((preset) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `range-preset-btn${LearningState.countPreset === preset.id ? " active" : ""}`;
      btn.dataset.preset = preset.id;
      btn.textContent = preset.label;
      btn.addEventListener("click", () => {
        container.querySelectorAll(".range-preset-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        if (this.dom.k1CountCustomRow) this.dom.k1CountCustomRow.style.display = preset.id === "custom" ? "" : "none";
        if (preset.id === "custom" && this.dom.k1CountValue) this.dom.k1CountValue.value = LearningState.learnCount;
      });
      container.appendChild(btn);
    });
    if (this.dom.k1CountCustomRow) this.dom.k1CountCustomRow.style.display = LearningState.countPreset === "custom" ? "" : "none";
  },

  _renderK1Difficulties() {
    const container = this.dom.k1DifficultyBtns;
    if (!container) return;
    container.innerHTML = "";
    DIFFICULTY_RANGE_PRESETS.forEach((preset) => {
      const active = LearningState.difficultyRange?.id === preset.id || (
        LearningState.difficultyRange?.min === preset.min && LearningState.difficultyRange?.max === preset.max
      );
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `range-preset-btn${active ? " active" : ""}`;
      btn.dataset.range = preset.id;
      btn.dataset.min = preset.min;
      btn.dataset.max = preset.max;
      btn.textContent = preset.label;
      btn.addEventListener("click", () => {
        container.querySelectorAll(".range-preset-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
      container.appendChild(btn);
    });
  },

  async renderK2() {
    if (this.dom.learnK2) this.dom.learnK2.style.display = "block";
    if (this.dom.k2Categories) {
      this.dom.k2Categories.innerHTML = "<p style='color:var(--chalk-dim)'>AI 正在分类...</p>";
      const allWords = WordManager.getAllWords?.(LearningState.vocabularyId) || LearningState.rangeWords;
      const categories = await AIManager.generateWordCategories({
        words: allWords,
        vocabularyLabel: LearningState.getVocabularyLabel(),
        userPrompt: LearningState.userCategoryPrompt,
        character: this.state.character
      });
      this.renderK2Categories(categories);
    }
    this.updateLearnCharDialogue("看看这样分类你觉得怎么样？");
  },

  renderK2Categories(categories) {
    const container = this.dom.k2Categories;
    if (!container) return;
    if (!categories || categories.length === 0) {
      container.innerHTML = "<p style='color:var(--chalk-dim)'>暂无分类结果</p>";
      return;
    }
    container.innerHTML = "";
    categories.forEach((cat) => {
      const div = document.createElement("div");
      div.className = "k2-category-card";
      div.innerHTML = `<div class="k2-cat-name">${cat.name}</div><div class="k2-cat-words">${cat.words.slice(0, 8).join("、")}${cat.words.length > 8 ? "..." : ""}</div>`;
      container.appendChild(div);
    });
  },

  saveK1AndGoToK2() {
    // Save sort mode
    const sortActive = this.dom.sortModeBtns?.querySelector(".range-preset-btn.active");
    LearningState.setSortMode(sortActive?.dataset?.sort || "frequency");
    // Save prompt
    LearningState.userCategoryPrompt = this.dom.k1Prompt?.value || "";
    // Save count
    const countActive = this.dom.k1CountBtns?.querySelector(".range-preset-btn.active");
    const countPresetId = countActive?.dataset?.preset || "20";
    const customCount = parseInt(this.dom.k1CountValue?.value) || 20;
    LearningState.setCountPreset(countPresetId, customCount);
    // Save difficulty
    const diffActive = this.dom.k1DifficultyBtns?.querySelector(".range-preset-btn.active");
    LearningState.setDifficultyRange({
      id: diffActive?.dataset?.range || "all",
      min: Number(diffActive?.dataset?.min || 1),
      max: Number(diffActive?.dataset?.max || 5)
    });
    this.goToLearnPhase("k2");
  },

  renderK3() {
    if (this.dom.learnK3) this.dom.learnK3.style.display = "block";
    const summary = this.dom.k3Summary;
    if (summary) {
      summary.innerHTML = `
        <div class="k3-row"><span>词库</span><span>${LearningState.getVocabularyLabel()}</span></div>
        <div class="k3-row"><span>排列方式</span><span>${LearningState.sortMode === "frequency" ? "高频优先" : LearningState.sortMode === "az" ? "A-Z" : "顺序"}</span></div>
        <div class="k3-row"><span>本次词数</span><span>${LearningState.learnCount} 词</span></div>
        <div class="k3-row"><span>难度范围</span><span>${LearningState.difficultyRange.min}-${LearningState.difficultyRange.max} 星</span></div>
      `;
    }
    this.updateLearnCharDialogue("确认好了就点「收起并开始」，我会帮你存档。");
  },

  collapseLearnSettings() {
    // Apply range config first
    this.applyRangeConfig();
    // Auto save
    SaveManager.autoSave(this.state, LearningState);
    // Enter k0 session
    LearningState.learnPhase = "k0";
    this.beginLearnSession();
  },

  /* ── Range config ── */

  renderRangeBar() {
    this.dom.learnBankLabel.textContent = LearningState.getVocabularyLabel();
    this.dom.learnRangeLabel.textContent = LearningState.getRangeLabel();
    this.dom.learnCountLabel.textContent = `${LearningState.learnCount} 词`;
  },

  renderSortModePresets() {
    const container = this.dom.sortModeBtns;
    if (!container) return;
    container.innerHTML = "";
    SORT_MODE_PRESETS.forEach((preset) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `range-preset-btn${LearningState.sortMode === preset.id ? " active" : ""}`;
      btn.dataset.sort = preset.id;
      btn.textContent = preset.label;
      btn.addEventListener("click", () => {
        container.querySelectorAll(".range-preset-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
      container.appendChild(btn);
    });
  },

  renderDifficultyRangePresets() {
    const container = this.dom.difficultyRangeBtns;
    if (!container) return;
    container.innerHTML = "";
    DIFFICULTY_RANGE_PRESETS.forEach((preset) => {
      const active = LearningState.difficultyRange?.id === preset.id || (
        LearningState.difficultyRange?.min === preset.min && LearningState.difficultyRange?.max === preset.max
      );
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `range-preset-btn${active ? " active" : ""}`;
      btn.dataset.range = preset.id;
      btn.dataset.min = preset.min;
      btn.dataset.max = preset.max;
      btn.textContent = preset.label;
      btn.addEventListener("click", () => {
        container.querySelectorAll(".range-preset-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
      container.appendChild(btn);
    });
    if (!container.querySelector(".active")) {
      container.querySelector(".range-preset-btn")?.classList.add("active");
    }
  },

  renderLearnSetupStage() {
    const stage = LearningState.setupStage || "sort";
    if (this.dom.learnSortStep) this.dom.learnSortStep.style.display = stage === "sort" ? "" : "none";
    if (this.dom.learnRangeStep) this.dom.learnRangeStep.style.display = stage === "range" ? "" : "none";
    if (this.dom.learnSortThinking) this.dom.learnSortThinking.style.display = "none";
  },

  renderRangePresets() {
    const container = this.dom.rangePresetBtns;
    if (!container) return;
    container.innerHTML = "";
    RANGE_PRESETS.forEach((preset) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `range-preset-btn${LearningState.rangePreset === preset.id ? " active" : ""}`;
      btn.dataset.preset = preset.id;
      btn.textContent = preset.label;
      btn.addEventListener("click", () => {
        container.querySelectorAll(".range-preset-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.dom.rangeCustomRow.style.display = preset.id === "custom" ? "" : "none";
        if (preset.id === "custom") {
          this.dom.rangeCustomStart.value = LearningState.rangeStart + 1;
          this.dom.rangeCustomEnd.value = LearningState.rangeEnd;
        }
      });
      container.appendChild(btn);
    });
    this.dom.rangeCustomRow.style.display = LearningState.rangePreset === "custom" ? "" : "none";
    if (LearningState.rangePreset === "custom") {
      this.dom.rangeCustomStart.value = LearningState.rangeStart + 1;
      this.dom.rangeCustomEnd.value = LearningState.rangeEnd;
    }
  },

  renderCountPresets() {
    const container = this.dom.countPresetBtns;
    if (!container) return;
    container.innerHTML = "";
    COUNT_PRESETS.forEach((preset) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `range-preset-btn${LearningState.countPreset === preset.id ? " active" : ""}`;
      btn.dataset.preset = preset.id;
      btn.textContent = preset.label;
      btn.addEventListener("click", () => {
        container.querySelectorAll(".range-preset-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.dom.countCustomRow.style.display = preset.id === "custom" ? "" : "none";
        if (preset.id === "custom") {
          this.dom.countCustomValue.value = LearningState.learnCount;
        }
      });
      container.appendChild(btn);
    });
    this.dom.countCustomRow.style.display = LearningState.countPreset === "custom" ? "" : "none";
    if (LearningState.countPreset === "custom") {
      this.dom.countCustomValue.value = LearningState.learnCount;
    }
  },

  renderFilterPresets() {
    const container = this.dom.filterPresetBtns;
    if (!container) return;
    container.innerHTML = "";
    FILTER_PRESETS.forEach((filter) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `range-preset-btn${LearningState.filterMode === filter.id ? " active" : ""}`;
      btn.dataset.filter = filter.id;
      btn.textContent = filter.label;
      btn.addEventListener("click", () => {
        container.querySelectorAll(".range-preset-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
      container.appendChild(btn);
    });
  },

  toggleRangeConfig() {
    if (LearningState.inSession || LearningState.learnPhase === "k0") {
      LearningState.learnPhase = "k1";
      this.goToLearnPhase("k1");
    } else {
      const panel = this.dom.rangeConfigPanel;
      const shown = panel.style.display !== "none";
      panel.style.display = shown ? "none" : "";
      if (!shown) {
        LearningState.setupStage = LearningState.setupStage === "session" ? "range" : (LearningState.setupStage || "sort");
        this.renderSortModePresets();
        this.renderCountPresets();
        this.renderDifficultyRangePresets();
        this.renderLearnSetupStage();
      }
    }
  },

  confirmLearnSortMode() {
    const active = this.dom.sortModeBtns?.querySelector(".range-preset-btn.active");
    LearningState.setSortMode(active?.dataset?.sort || "frequency");
    if (this.dom.learnSortStep) this.dom.learnSortStep.style.display = "none";
    if (this.dom.learnSortThinking) this.dom.learnSortThinking.style.display = "";
    this.updateLearnCharDialogue("我先把词按你选的方式排好。");
    window.setTimeout(() => {
      LearningState.setupStage = "range";
      this.renderLearnSetupStage();
      this.renderRangeBar();
    }, 260);
  },

  applyRangeConfig() {
    // Read count preset
    const countActive = this.dom.countPresetBtns.querySelector(".range-preset-btn.active");
    const countPresetId = countActive?.dataset?.preset || "20";
    const customCount = parseInt(this.dom.countCustomValue.value) || 20;
    LearningState.setCountPreset(countPresetId, customCount);

    const difficultyActive = this.dom.difficultyRangeBtns?.querySelector(".range-preset-btn.active");
    LearningState.setDifficultyRange({
      id: difficultyActive?.dataset?.range || "1-2",
      min: Number(difficultyActive?.dataset?.min || 1),
      max: Number(difficultyActive?.dataset?.max || 2)
    });

    // Generate lesson plan
    this.generateLessonPlan();

    // Update UI
    this.renderRangeBar();
    this.renderLearnPreview();
    this.dom.rangeConfigPanel.style.display = "none";

    this.setDialogue(this.state.character.name, "大纲已更新。看看今天学什么？");
  },

  async generateLessonPlan() {
    const plan = LearningState.generateLessonPlan(this.state.wordHistory);
    const aiPlan = await AIManager.generateLessonPlan({
      words: LearningState.rangeWords,
      vocabularyLabel: LearningState.getVocabularyLabel(),
      character: this.state.character
    });
    this.dom.lessonPlan.style.display = "";
    this.dom.lessonPlan.textContent = aiPlan;
  },

  /* ── Preview ── */

  renderLearnPreview() {
    const stats = LearningState.getSessionStats(this.state.wordHistory);
    this.dom.previewLearned.textContent = stats.learned;
    this.dom.previewTotal.textContent = stats.total;
    this.dom.previewFamiliarity.textContent = stats.avgFamiliarity;

    this.dom.learnWordList.innerHTML = "";
    LearningState.rangeWords.forEach((word, i) => {
      const state = LearningState.getWordState(this.state.wordHistory, word);
      const item = document.createElement("div");
      item.className = `preview-word-item${i === LearningState.currentIndex ? " active" : ""}${state === "mastered" ? " mastered" : state === "learning" || state === "familiar" ? " learning" : ""}`;
      item.dataset.index = i;
      item.innerHTML = `<span class="preview-word-indicator"></span><span class="preview-word-text">${word.english}</span>`;
      item.addEventListener("click", () => {
        if (LearningState.isInSession()) {
          LearningState.currentIndex = i;
          this.renderLearnWord();
        }
      });
      this.dom.learnWordList.appendChild(item);
    });

    this.dom.learnBeforeStart.style.display = LearningState.isInSession() ? "none" : "";
    if (this.dom.learnWordArea) this.dom.learnWordArea.style.display = LearningState.isInSession() ? "" : "none";
    if (this.dom.learnNavBar) this.dom.learnNavBar.style.display = LearningState.isInSession() ? "" : "none";
    if (this.dom.btnLearnHint) this.dom.btnLearnHint.style.display = LearningState.isInSession() ? "" : "none";
    if (this.dom.learnHintProgress) this.dom.learnHintProgress.style.display = LearningState.isInSession() ? "" : "none";

    if (LearningState.isInSession()) this.renderLearnWord();
  },

  /* ── Session ── */

  async beginLearnSession() {
    LearningState.enterLearn();
    this.renderLearnWord();
    this.renderLearnPreview();
    this.updateHintProgress();
    const word = LearningState.getCurrentWord();
    if (word) {
      await this.setLearnCharacterDialogue(word);
    }
  },

  renderLearnWord() {
    const word = LearningState.getCurrentWord();
    if (!word) {
      this.dom.learnWord.textContent = "—";
      this.dom.learnPhonetic.textContent = "";
      this.dom.learnMeaning.textContent = "";
      this.dom.learnPos.textContent = "";
      this.dom.learnSynonyms.textContent = "";
      this.dom.learnAntonyms.textContent = "";
      this.dom.learnRoot.textContent = "";
      this.dom.learnExample.textContent = "";
      this.dom.learnExampleCn.textContent = "";
      this.dom.learnCollocations.textContent = "";
      this.dom.learnProgress.textContent = "—";
      return;
    }

    this.dom.learnWord.textContent = word.english;
    this.dom.learnPhonetic.textContent = word.phonetic || "";
    this.dom.learnMeaning.textContent = word.chinese;

    // Rich details
    this.dom.learnPos.textContent = word.pos || "";
    const syns = word.synonyms || [];
    this.dom.learnSynonyms.textContent = syns.length > 0 ? `近义：${syns.slice(0, 3).join("、")}` : "";
    const ants = word.antonyms || [];
    this.dom.learnAntonyms.textContent = ants.length > 0 ? `反义：${ants.slice(0, 3).join("、")}` : "";
    this.dom.learnRoot.textContent = word.root ? `词根：${word.root}` : "";

    this.dom.learnExample.textContent = word.example || "";
    this.dom.learnExampleCn.textContent = word.exampleChinese || "";

    const collocations = word.collocations || "";
    if (!collocations && word.phrases?.length > 0) {
      this.dom.learnCollocations.textContent = word.phrases.slice(0, 3).map((p) => p.phrase).join(" | ");
    } else {
      this.dom.learnCollocations.textContent = collocations;
    }

    const prog = LearningState.getLearnProgress();
    this.dom.learnProgress.textContent = `${prog.current} / ${prog.total}`;

    const stats = LearningState.getSessionStats(this.state.wordHistory);
    this.dom.learnSessionProgress.textContent = `已学 ${stats.learned} 词 · 熟练 ${stats.avgFamiliarity}%`;

    // Update word list highlight
    this.dom.learnWordList.querySelectorAll(".preview-word-item").forEach((el, i) => {
      el.classList.toggle("active", i === LearningState.currentIndex);
    });

    // Reset hint level for new word
    LearningState.resetHint();
    this.updateHintProgress();
    this.setLearnCharacterDialogue(word);
  },

  navigateLearn(dir) {
    if (dir < 0) LearningState.goPrev();
    else LearningState.goNext();
    this.renderLearnWord();
  },

  speakLearnWord() {
    const word = LearningState.getCurrentWord();
    if (word) TTSManager.speakWord(word.english, this.state.settings.voice);
  },

  markCurrentWord() {
    const word = LearningState.getCurrentWord();
    if (!word) return;
    LearningState.markLearned(this.state.wordHistory, word);
    this.addExp(EXP_CONFIG.expPerWord);
    this.addAffection(AFFECTION_CONFIG.perWordLearn);
    this.renderLearnWord();
    this.renderLearnPreview();
    this.saveData();
    this.setDialogue(this.state.character.name, `「${word.english}」记下了。`);
  },

  /* ── Progressive character hints ── */

  updateLearnCharDialogue(text) {
    if (this.dom.learnCharName) this.dom.learnCharName.textContent = this.state.character?.name || "格蕾修";
    if (this.dom.learnCharDialogue) this.dom.learnCharDialogue.textContent = text || "";
  },

  async setLearnCharacterDialogue(word) {
    if (!word) return;
    const state = LearningState.getWordState(this.state.wordHistory, word);
    const record = this.state.wordHistory[word.english.toLowerCase()];
    const wrongCount = record?.wrongCount || 0;

    let dialogue;
    if (this.state.settings.aiMode && AIManager.isOnline()) {
      dialogue = await AIManager.generateWordAdvice({
        word: word.english, meaning: word.chinese, character: this.state.character,
        example: word.example, wordHistory: this.state.wordHistory
      });
    } else if (state === "new") {
      dialogue = AIManager.makeCharacterComment({
        word: word.english, meaning: word.chinese, character: this.state.character, example: word.example
      });
    } else if (wrongCount > 0) {
      dialogue = `${word.english}。这个词你上次错过 ${wrongCount} 次，现在再看一次——${word.chinese}。${word.example ? `例句：${word.example}` : ""}`;
    } else {
      dialogue = `「${word.english}」还记得吗？是「${word.chinese}」。${word.example ? `像这句：${word.example}` : ""}`;
    }
    this.updateLearnCharDialogue(dialogue);

    if (this.state.settings.voice.autoSpeakDialogue) {
      TTSManager.speak(dialogue, this.state.settings.voice);
    }
  },

  advanceLearnHint() {
    const level = LearningState.advanceHint();
    if (level === null) return;

    const hint = LearningState.getProgressiveHint(this.state.wordHistory);
    this.updateLearnCharDialogue(hint.text);
    this.updateHintProgress();

    if (!hint.hasMore) {
      this.dom.btnLearnHint.textContent = "已展开全部";
      this.dom.btnLearnHint.style.opacity = "0.5";
    } else {
      this.dom.btnLearnHint.textContent = "💡 再问她一点";
    }

    if (this.state.settings.voice.autoSpeakDialogue) {
      TTSManager.speak(hint.text, this.state.settings.voice);
    }
  },

  updateHintProgress() {
    const hint = LearningState.getProgressiveHint(this.state.wordHistory);
    const dots = this.dom.learnHintProgress?.querySelectorAll(".hint-dot");
    if (!dots) return;
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i <= hint.level);
    });
    if (this.dom.btnLearnHint) {
      this.dom.btnLearnHint.textContent = hint.hasMore ? "💡 点我问她" : "已展开全部";
      this.dom.btnLearnHint.style.opacity = hint.hasMore ? "" : "0.5";
    }
  },

  readLearnDialogue() {
    const text = this.dom.learnCharDialogue?.textContent;
    if (text) TTSManager.speak(text, this.state.settings.voice);
  },

  /* ════════════════════════════════════════════════
     CARDS MODE
     ════════════════════════════════════════════════ */

  startCards() {
    LearningState.generateCards(this.state.wordHistory, 10);
    this.renderCards();
    this.dom.cardsEmpty.style.display = "none";
    this.dom.cardActions.style.display = "";
    this.dom.flashcard.style.display = "";
    this.dom.cardHintArea.style.display = "";
    this.dom.cardHintText.textContent = "";
    this.dom.btnCardHint.textContent = "💡 给点提示";

    const dueCount = WordManager.getReviewStats(this.state.wordHistory).dueCount;
    if (dueCount > 0) {
      this.setDialogue(this.state.character.name, `有 ${dueCount} 个单词需要巩固。抽几张卡片过一遍。`);
    } else {
      this.setDialogue(this.state.character.name, "从当前学习范围抽了一些词，翻翻看。");
    }
  },

  renderCards() {
    this.dom.flashcard.style.transition = "none";
    const card = LearningState.getCurrentCard();
    if (!card || LearningState.cardDone) {
      this.dom.flashcard.style.display = "none";
      this.dom.cardActions.style.display = "none";
      this.dom.cardHintArea.style.display = "none";
      this.dom.cardsEmpty.style.display = "";
      const prog = LearningState.getCardProgress();
      this.dom.cardsRememberedTotal.textContent = prog.remembered;
      this.dom.cardsProgress.textContent = `完成 ${prog.remembered}/${prog.total} 张`;
      requestAnimationFrame(() => { this.dom.flashcard.style.transition = ""; });
      return;
    }

    this.dom.cardsEmpty.style.display = "none";
    this.dom.cardActions.style.display = "";
    this.dom.flashcard.style.display = "";
    this.dom.cardHintArea.style.display = "";

    this.dom.flashcard.classList.toggle("flipped", card.flipped);
    this.dom.cardFrontWord.textContent = card.english;
    this.dom.cardFrontPhonetic.textContent = card.phonetic || "";
    this.dom.cardBackMeaning.textContent = card.chinese;
    this.dom.cardBackExample.textContent = card.example || "";
    this.dom.cardBackExampleCn.textContent = card.exampleChinese || "";
    this.dom.cardBackTip.textContent = AIManager.makeMemoryTip({ word: card.english, meaning: card.chinese });

    const prog = LearningState.getCardProgress();
    const nextText = WordManager.getNextReviewText(this.state.wordHistory[card.english?.toLowerCase()]);
    this.dom.cardsProgress.textContent = `${prog.done + 1}/${prog.total} · 下次复习：${nextText}`;

    // Reset card hint
    this.dom.cardHintText.textContent = "";
    this.dom.btnCardHint.textContent = "💡 给点提示";
    this.dom.btnCardHint.style.opacity = "";

    requestAnimationFrame(() => { this.dom.flashcard.style.transition = ""; });
  },

  flipCard() {
    const card = LearningState.getCurrentCard();
    if (!card || card.remembered !== null) return;
    card.flipped = !card.flipped;
    this.renderCards();
    if (card.flipped) {
      this.setDialogue(this.state.character.name, `${card.english}。翻过来了。看中文，再回想去例句。`);
    } else {
      this.setDialogue(this.state.character.name, `${card.english}。回到正面了。`);
    }
  },

  advanceCardHint() {
    const card = LearningState.getCurrentCard();
    if (!card || card.flipped || card.remembered !== null) return;

    const level = LearningState.advanceCardHint();
    const hints = [
      `像"${card.chinese}"的感觉……试着想象一下。`,
      `词性提示：试着猜猜它的词性。`,
      card.example ? `常见搭配：${card.example}` : `再想一想"${card.chinese}"的用法。`,
      `是"${card.chinese}"。记住这个画面了吗？`
    ];
    const hintText = hints[Math.min(level, hints.length - 1)];

    if (level >= 0 && level < hints.length) {
      this.dom.cardHintText.textContent = hintText;
    }

    if (level >= 3) {
      this.dom.cardHintText.textContent = `答案是："${card.chinese}"`;
      this.dom.btnCardHint.textContent = "已提示全部";
      this.dom.btnCardHint.style.opacity = "0.5";
    } else {
      this.dom.btnCardHint.textContent = "💡 再提示一点";
    }
  },

  answerCard(remembered) {
    const card = LearningState.getCurrentCard();
    if (!card || card.remembered !== null) return;
    if (!card.flipped) { this.flipCard(); return; }

    const prevCard = card;
    const next = LearningState.nextCard(remembered, this.state.wordHistory);
    if (remembered) {
      this.addExp(EXP_CONFIG.expPerQuizCorrect);
      this.addAffection(AFFECTION_CONFIG.perQuizCorrect);
    } else {
      this.addAffection(AFFECTION_CONFIG.perWrong);
    }
    this.renderCards();
    this.saveData();

    if (LearningState.cardDone) {
      const prog = LearningState.getCardProgress();
      this.setDialogue(this.state.character.name, `闪卡结束。记住了 ${prog.remembered} 张，再抽一轮或者去 Review 巩固。`);
    } else {
      const nextCard = LearningState.getCurrentCard();
      if (nextCard && remembered) {
        this.setDialogue(this.state.character.name, `「${prevCard.english}」记牢了。下一张——「${nextCard.english}」。`);
      } else if (nextCard) {
        this.setDialogue(this.state.character.name, `「${prevCard.english}」再放一放。先看下一张「${nextCard.english}」。`);
      }
    }
  },

  /* ════════════════════════════════════════════════
     CONVERSATION MODE
     ════════════════════════════════════════════════ */

  async startConversation() {
    if (!this.state.conversation.currentWord) {
      this.pickConversationWord();
    }
    this.renderConversationWord();
    if (LearningState.conversationHistory.length === 0) {
      this.dom.conversationLog.innerHTML = `<div class="conv-empty-msg">用学过的单词和角色对话吧。<br>她会帮你纠正语法，练习造句。</div>`;
    } else {
      this.renderConversationHistory();
    }

    // AI proactively sends first message if online
    const word = this.state.conversation.currentWord;
    if (this.state.settings.aiMode && AIManager.isOnline() && word) {
      this.setDialogue(this.state.character.name, "...");
      const firstMsg = await AIManager.generateConversationFirstMessage({
        character: this.state.character, word
      });
      LearningState.addConversationEntry("character", firstMsg);
      this.renderConversationHistory();
      this.setDialogue(this.state.character.name, firstMsg);
    } else {
      this.setDialogue(this.state.character.name, "来，用今天学的词和我说说话。");
    }
  },

  pickConversationWord() {
    const words = LearningState.rangeWords;
    if (words.length === 0) return;
    // Pick from current session words, prefer unlearned
    const unlearned = words.filter((w) => {
      const r = this.state.wordHistory[w.english.toLowerCase()];
      return !r || !r.learned || r.familiarity < 60;
    });
    const pool = unlearned.length > 0 ? unlearned : words;
    const word = pool[Math.floor(Math.random() * pool.length)];
    this.state.conversation.currentWord = word;
    LearningState.startConversation(word);
    this.renderConversationWord();
  },

  renderConversationWord() {
    const word = this.state.conversation.currentWord;
    if (!word) {
      this.dom.convWord.innerHTML = "—";
    } else {
      this.dom.convWord.innerHTML = `${word.english} <span class="conv-word-meaning">${word.chinese}</span>`;
    }
  },

  renderConversationHistory() {
    const log = this.dom.conversationLog;
    log.innerHTML = "";
    LearningState.conversationHistory.forEach((entry) => {
      const div = document.createElement("div");
      div.className = `conv-message ${entry.role === "character" ? "character" : "user"}`;
      const sender = entry.role === "character" ? this.state.character?.name || "角色" : "你";
      div.innerHTML = `<span class="conv-msg-sender">${sender}</span>${entry.text}`;
      log.appendChild(div);
    });
    log.scrollTop = log.scrollHeight;
  },

  async sendConversationMessage() {
    const input = this.dom.conversationInput.value.trim();
    if (!input) return;

    const word = this.state.conversation.currentWord;
    if (!word) {
      this.setDialogue(this.state.character.name, "先选一个练习词吧。");
      return;
    }

    // Add user message
    LearningState.addConversationEntry("user", input);
    this.dom.conversationInput.value = "";
    this.renderConversationHistory();
    this.state.conversation.lastUserMessage = input;

    // Set typing indicator
    this.setDialogue(this.state.character.name, "...");

    // Get AI reply
    if (this.state.settings.aiMode) {
      const reply = await AIManager.generateConversationReply({
        character: this.state.character,
        word,
        userInput: input,
        history: LearningState.conversationHistory
      });
      LearningState.addConversationEntry("character", reply);
      this.addExp(EXP_CONFIG.expPerConversation);
      this.addAffection(AFFECTION_CONFIG.perConversation);
    } else {
      LearningState.addConversationEntry("character", `嗯，收到了。"${word.english}"——再试一个句子？`);
    }

    this.renderConversationHistory();
    this.saveData();

    // Set dialogue to last character message
    const lastCharMsg = [...LearningState.conversationHistory].reverse().find((e) => e.role === "character");
    if (lastCharMsg) {
      this.setDialogue(this.state.character.name, lastCharMsg.text);
    }
  },

  async requestConversationSuggest() {
    const word = this.state.conversation.currentWord;
    if (!word) return;

    const prompts = [
      `试试用 "${word.english}" 描述你今天做了什么。`,
      `把 "${word.english}" 放在句首，造一个问句。`,
      `"${word.english}" 和什么词搭配起来最自然？试着写一句。`
    ];
    const suggest = prompts[Math.floor(Math.random() * prompts.length)];

    if (this.state.settings.aiMode && AIManager.isOnline()) {
      const reply = await AIManager.generateConversationReply({
        character: this.state.character,
        word,
        userInput: "请给我一个造句提示",
        history: LearningState.conversationHistory
      });
      LearningState.addConversationEntry("character", reply);
    } else {
      LearningState.addConversationEntry("character", suggest);
    }

    this.renderConversationHistory();
    const lastMsg = [...LearningState.conversationHistory].reverse().find((e) => e.role === "character");
    if (lastMsg) this.setDialogue(this.state.character.name, lastMsg.text);
  },

  async requestSentenceCheck() {
    const lastUser = this.state.conversation.lastUserMessage;
    const word = this.state.conversation.currentWord;
    if (!lastUser || !word) {
      this.setDialogue(this.state.character.name, "先造个句子，我再帮你检查。");
      return;
    }

    const check = await AIManager.checkSentence({
      character: this.state.character,
      word,
      sentence: lastUser
    });

    LearningState.addConversationEntry("character", check);
    this.renderConversationHistory();
    this.setDialogue(this.state.character.name, check);
    this.saveData();
  },

  /* ════════════════════════════════════════════════
     REVIEW MODE
     ════════════════════════════════════════════════ */

  startReview() {
    const stats = WordManager.getReviewStats(this.state.wordHistory);
    const due = LearningState.startReview(this.state.wordHistory, this.state.settings.vocabularyId);

    if (due.length === 0) {
      if (stats.total === 0) {
        this.dom.testProgress.textContent = "还没有学习的单词";
        this.dom.testWordDisplay.textContent = "—";
        this.dom.testPhonetic.textContent = "";
        this.dom.testInputContainer.style.display = "none";
        this.dom.testResult.innerHTML = "先学一些单词，再来复习吧。";
        this.setDialogue(this.state.character.name, "还没有学过的单词。先去 Learn 模式看看吧。");
      } else {
        this.dom.testProgress.textContent = "今日复习完成";
        this.dom.testWordDisplay.textContent = "✓";
        this.dom.testPhonetic.textContent = "";
        this.dom.testInputContainer.style.display = "none";
        this.dom.testResult.innerHTML = `今天没有到期的复习。已学 ${stats.total} 个单词。`;
        this.setDialogue(this.state.character.name, "今天没有需要复习的单词。做得好。");
      }
      return;
    }

    this.state.test.items = due;
    this.state.test.index = 0;
    this.state.test.correct = 0;
    this.state.test.wrong = 0;
    if (this.dom.reviewStatsBar) {
      this.dom.reviewStatsBar.textContent = `今日待复习：${stats.dueCount} 个 · 本轮 ${due.length} 题`;
    }
    this.showReviewWord();
  },

  showReviewWord() {
    const word = LearningState.getCurrentReviewWord();
    if (!word) { this.finishReview(); return; }
    this.dom.testWordDisplay.textContent = word.english;
    this.dom.testPhonetic.textContent = word.phonetic || "";
    this.dom.testInput.value = "";
    this.dom.testResult.innerHTML = "";
    this.dom.testInputContainer.style.display = "flex";
    this.dom.testProgress.textContent = `第 ${LearningState.reviewIndex + 1} / ${LearningState.reviewQueue.length} 题`;
    this.setDialogue(this.state.character.name, `${word.english}。写下它的中文意思。`);
    setTimeout(() => this.dom.testInput?.focus(), 50);
  },

  checkTestAnswer() {
    const word = LearningState.getCurrentReviewWord();
    if (!word) return;
    const answer = this.dom.testInput.value.trim();
    if (!answer) return;

    const correct = checkChineseAnswer(answer, word.chinese);
    this.dom.testInputContainer.style.display = "none";

    WordManager.recordReview(this.state.wordHistory, word.english, correct);
    const key = word.english.toLowerCase();
    if (this.state.wordHistory[key]) {
      const r = this.state.wordHistory[key];
      r.learned = true;
      r.familiarity = correct
        ? Math.min(100, (r.familiarity || 0) + 20)
        : Math.max(0, (r.familiarity || 0) - 5);
      r.wrongCount = (r.wrongCount || 0) + (correct ? 0 : 1);
    }

    if (correct) {
      this.state.test.correct++;
      this.addExp(EXP_CONFIG.expPerTestCorrect);
      this.addAffection(AFFECTION_CONFIG.perTestCorrect);
      this.dom.testResult.innerHTML = `
        对了。${word.english} 的颜色已经留下来了。<br>
        <span class="next-review">下次复习：${WordManager.getNextReviewText(this.state.wordHistory[key])}</span><br>
        <button class="chalk-choice next-review" id="btn-next-test">下一题</button>`;
      this.setDialogue(this.state.character.name, "对了。线条很稳。");
    } else {
      this.state.test.wrong++;
      this.addAffection(AFFECTION_CONFIG.perWrong);
      this.dom.testResult.innerHTML = `
        还差一点。你写的是「${answer}」，正确是「${word.chinese}」。<br>
        <span class="next-review">${WordManager.getNextReviewText(this.state.wordHistory[key])} 再复习一次</span><br>
        <button class="chalk-choice next-review" id="btn-next-test">下一题</button>`;
      this.setDialogue(this.state.character.name, `没关系。${word.english} 现在是浅灰色。我们再给它加一层记忆。`);
    }

    document.getElementById("btn-next-test")?.addEventListener("click", () => {
      LearningState.nextReview();
      this.showReviewWord();
    });
    this.saveData();
  },

  finishReview() {
    this.dom.testProgress.textContent = "本轮复习完成";
    this.dom.testWordDisplay.textContent = `${this.state.test.correct}/${this.state.test.items.length}`;
    this.dom.testPhonetic.textContent = "";
    this.dom.testInputContainer.style.display = "none";
    this.dom.testResult.innerHTML = `<button class="chalk-choice" id="btn-restart-test">再来一轮</button>`;
    this.setDialogue(this.state.character.name, `复习结束。正确 ${this.state.test.correct} 个。`);
    document.getElementById("btn-restart-test")?.addEventListener("click", () => this.startReview());
  },

  /* ════════════════════════════════════════════════
     SAVE / LOAD
     ════════════════════════════════════════════════ */

  openSaveModal(mode) {
    this.state.saveMode = mode;
    this.dom.saveModalTitle.textContent = mode === "save" ? "保存进度" : "读取存档";
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
        const parts = [];
        if (info.character) parts.push(info.character);
        if (info.level) parts.push(`Lv.${info.level}`);
        if (info.vocabulary) parts.push(info.vocabulary);
        if (info.range) parts.push(info.range);
        parts.push(`${info.wordCount || 0} 词`);
        parts.push(info.savedAt || "");
        meta.textContent = parts.join(" · ");
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
    SaveManager.save(index, this.state, LearningState);
    this.saveData();
    this.renderSaveSlots();
    this.setDialogue("系统", `存档已保存到位置 ${index + 1}。`);
  },

  doLoad(index) {
    const data = SaveManager.load(index);
    if (!data) return;
    SaveManager.restoreToState(data, this.state);
    if (data.learningState) LearningState.deserialize(data.learningState);
    this.ensureCharacter();
    this.updateAllCharacterViews();
    this.renderCharacterSelection(this.dom.characterGrid, this.state.settings.characterId);
    this.renderVocabSelector("settings-vocab-selector", this.state.settings.vocabularyId);
    this.syncSettingsControls();
    this.saveData(false);
    this.closeSaveModal();
    if (this.state.currentPage === "main") {
      this.switchMode("learn");
    }
    this.setDialogue("系统", "存档已经读取。回到之前的位置了。");
  },

  doDelete(index) {
    SaveManager.deleteSlot(index);
    this.renderSaveSlots();
    this.setDialogue("系统", `存档位 ${index + 1} 已删除。`);
  },

  /* ════════════════════════════════════════════════
     DIALOGUE
     ════════════════════════════════════════════════ */

  setDialogue(name, text) {
    if (this.state.typewriterTimer) clearInterval(this.state.typewriterTimer);
    TTSManager.stop();
    this.state.isTyping = true;
    this.state.currentDialogueText = text || "";
    this.dom.dialogueName.textContent = name || this.state.character?.name || "";
    this.dom.dialogueText.textContent = "";
    this.dom.dialogueContinue.classList.remove("visible");
    this.state.dialogueLog.push({
      name: this.dom.dialogueName.textContent,
      text: this.state.currentDialogueText,
      at: new Date().toISOString()
    });
    const chars = [...this.state.currentDialogueText];
    let idx = 0;
    this.state.typewriterTimer = setInterval(() => {
      if (idx < chars.length) {
        this.dom.dialogueText.textContent += chars[idx];
        idx++;
      } else {
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
    this.renderVocabSelector("modal-vocab-selector", this.state.settings.vocabularyId);
    this.dom.modalAiProvider.value = this.state.settings.ai?.provider || "deepseek";
    this.dom.modalAiKey.value = this.state.settings.ai?.apiKey || "";
    this.dom.modalAiEndpoint.value = this.state.settings.ai?.endpoint || "";
    this.dom.modalAiModel.value = this.state.settings.ai?.model || "";
    this.dom.modalVoiceRate.value = this.state.settings.voice.rate;
    this.dom.modalVoicePitch.value = this.state.settings.voice.pitch;
    this.dom.modalAutoSpeak.checked = this.state.settings.voice.autoSpeakDialogue;
    this.dom.spriteSizeSlider.value = this.state.settings.spriteSize;
    this.dom.spriteSizeValue.textContent = this.state.settings.spriteSize;
    this.updateActiveSpritePreset(this.state.settings.spriteSize);
    this.updateVoiceOptions();
    this._updateFilePreview("background", this.state.settings.customBackground);
    this._updateFilePreview("blackboard", this.state.settings.customBlackboard);
    if (this.dom.modalBlackboardColor) this.dom.modalBlackboardColor.value = this.state.settings.blackboardColor || "#2d4a3e";
    if (this.dom.modalBlackboardScale) {
      this.dom.modalBlackboardScale.value = this.state.settings.blackboardScale || 1;
      this.dom.modalBlackboardScaleValue.textContent = (this.state.settings.blackboardScale || 1).toFixed(1);
    }
    if (this.dom.modalBlackboardX) this.dom.modalBlackboardX.value = this.state.settings.blackboardTranslateX || 0;
    if (this.dom.modalBlackboardY) this.dom.modalBlackboardY.value = this.state.settings.blackboardTranslateY || 0;
    if (this.dom.modalMcpEnabled) this.dom.modalMcpEnabled.checked = this.state.settings.mcp?.enabled || false;
    if (this.dom.modalMcpUrl) this.dom.modalMcpUrl.value = this.state.settings.mcp?.url || "";
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
    this.state.settings.voice = {
      ...this.state.settings.voice, provider: "browser",
      voiceName: this.dom.modalVoiceSelect.value,
      rate: Number(this.dom.modalVoiceRate.value || 1),
      pitch: Number(this.dom.modalVoicePitch.value || 1),
      autoSpeakDialogue: this.dom.modalAutoSpeak.checked
    };
    if (save) this.saveData();
  },

  saveModalSettings() {
    const selected = this.dom.modalCharacterGrid.querySelector(".character-card.selected");
    if (selected) this.state.settings.characterId = selected.dataset.id;

    const vocabId = this.getSelectedVocabId("modal-vocab-selector");
    this.state.settings.vocabularyId = vocabId || "cet4";
    this.state.settings.difficulty = BANK_TO_DIFFICULTY[vocabId] || "medium";

    this.state.settings.ai = {
      provider: this.dom.modalAiProvider.value,
      apiKey: this.dom.modalAiKey.value,
      endpoint: this.dom.modalAiEndpoint.value,
      model: this.dom.modalAiModel.value
    };

    AIManager.setConfig(this.state.settings.ai);
    WordManager.setVocabulary(vocabId);
    LearningState.setVocabulary(vocabId);

    this.applyModalVoiceToState(false);

    // customBackground / customBlackboard already set by file handlers
    this.state.settings.blackboardColor = this.dom.modalBlackboardColor?.value || "";
    this.state.settings.blackboardScale = Number(this.dom.modalBlackboardScale?.value || 1);
    this.state.settings.blackboardTranslateX = Number(this.dom.modalBlackboardX?.value || 0);
    this.state.settings.blackboardTranslateY = Number(this.dom.modalBlackboardY?.value || 0);
    this.state.settings.mcp = {
      enabled: this.dom.modalMcpEnabled?.checked || false,
      url: this.dom.modalMcpUrl?.value || ""
    };
    Blackboard.update(this.state.settings);

    this.ensureCharacter();
    this.updateAllCharacterViews();
    this.renderCharacterSelection(this.dom.characterGrid, this.state.settings.characterId);
    this.renderVocabSelector("settings-vocab-selector", this.state.settings.vocabularyId);
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

  handleBlackboardScaleChange() {
    const scale = Number(this.dom.modalBlackboardScale.value);
    this.state.settings.blackboardScale = scale;
    this.dom.modalBlackboardScaleValue.textContent = scale.toFixed(1);
    Blackboard.update(this.state.settings);
  },

  handleBlackboardOffsetChange() {
    this.state.settings.blackboardTranslateX = Number(this.dom.modalBlackboardX.value || 0);
    this.state.settings.blackboardTranslateY = Number(this.dom.modalBlackboardY.value || 0);
    Blackboard.update(this.state.settings);
  },

  handleBgFileSelect(event, type) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("图片太大，请选择小于 3MB 的图片");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      if (type === "background") {
        this.state.settings.customBackground = dataUrl;
      } else {
        this.state.settings.customBlackboard = dataUrl;
      }
      this._updateFilePreview(type, dataUrl);
      Blackboard.update(this.state.settings);
    };
    reader.readAsDataURL(file);
  },

  clearBgFile(type) {
    if (type === "background") {
      this.state.settings.customBackground = "";
      if (this.dom.modalBgFile) this.dom.modalBgFile.value = "";
    } else {
      this.state.settings.customBlackboard = "";
      if (this.dom.modalBlackboardFile) this.dom.modalBlackboardFile.value = "";
    }
    this._updateFilePreview(type, "");
    Blackboard.update(this.state.settings);
  },

  _updateFilePreview(type, dataUrl) {
    const isBg = type === "background";
    const preview = isBg ? this.dom.modalBgPreview : this.dom.modalBlackboardPreview;
    const clearBtn = isBg ? this.dom.btnBgClear : this.dom.btnBlackboardClear;
    const fileBtn = isBg ? this.dom.btnBgFile : this.dom.btnBlackboardFile;
    if (!preview || !clearBtn || !fileBtn) return;
    if (dataUrl) {
      preview.src = dataUrl;
      preview.style.display = "block";
      clearBtn.style.display = "inline-block";
      fileBtn.textContent = "更换图片";
    } else {
      preview.style.display = "none";
      preview.src = "";
      clearBtn.style.display = "none";
      fileBtn.textContent = "选择图片";
    }
  },

  async handleMcpTest() {
    const url = this.dom.modalMcpUrl?.value;
    if (!url) {
      this.setDialogue("系统", "请先输入 MCP 服务器地址。");
      return;
    }
    this.setDialogue("系统", "正在连接 MCP 服务器...");
    const result = await MCPClient.connect(url);
    if (result.ok) {
      this.dom.mcpToolsList.style.display = "block";
      this.dom.mcpToolsList.innerHTML = `<small>已连接，发现 ${result.tools.length} 个工具</small>`;
      this.setDialogue("系统", `MCP 连接成功。发现 ${result.tools.length} 个可用工具。`);
    } else {
      this.dom.mcpToolsList.style.display = "none";
      this.setDialogue("系统", `MCP 连接失败：${result.error}`);
    }
  },

  /* ════════════════════════════════════════════════
     DATA
     ════════════════════════════════════════════════ */

  loadData() {
    try {
      const settings = localStorage.getItem("galgameEnglish_settings");
      const profile = localStorage.getItem("galgameEnglish_profile");
      const history = localStorage.getItem("galgameEnglish_wordHistory");
      const ls = localStorage.getItem("galgameEnglish_learningState");
      if (settings) this.state.settings = { ...this.state.settings, ...JSON.parse(settings) };
      if (profile) this.state.profile = { ...this.state.profile, ...JSON.parse(profile) };
      if (history) this.state.wordHistory = JSON.parse(history);
      this.state.settings.voice = {
        provider: "browser", voiceName: "", rate: 1, pitch: 1.08, volume: 1,
        autoSpeakDialogue: false, autoSpeakExamples: false,
        ...(this.state.settings.voice || {})
      };
      this.state.settings.ai = {
        provider: "deepseek", apiKey: "", endpoint: "", model: "deepseek-v4-flash",
        ...(this.state.settings.ai || {})
      };
      this.state.settings.spriteTranslateX = this.state.settings.spriteTranslateX || 0;
      this.state.settings.spriteTranslateY = this.state.settings.spriteTranslateY || 0;
      this.state.settings.spriteScale = this.state.settings.spriteScale || 1;
      this.state.settings.mcp = { enabled: false, url: "", ...(this.state.settings.mcp || {}) };
      if (ls) window.__pendingLearningState = JSON.parse(ls);
      AIManager.setConfig(this.state.settings.ai);
      WordManager.setVocabulary(this.state.settings.vocabularyId || "cet4");
    } catch (e) { console.warn("[App] 数据读取失败", e); }
  },

  saveData(showToast) {
    localStorage.setItem("galgameEnglish_settings", JSON.stringify(this.state.settings));
    localStorage.setItem("galgameEnglish_profile", JSON.stringify(this.state.profile));
    localStorage.setItem("galgameEnglish_wordHistory", JSON.stringify(this.state.wordHistory));
    localStorage.setItem("galgameEnglish_learningState", JSON.stringify(LearningState.serialize()));
    SaveManager.autoSave(this.state, LearningState);
    if (showToast) this.setDialogue("系统", "存档已保存。");
  },

  /* ════════════════════════════════════════════════
     EXP / AFFECTION
     ════════════════════════════════════════════════ */

  addExp(amount) {
    this.state.profile.exp += amount;
    let next = this.getExpToNextLevel();
    while (this.state.profile.exp >= next) {
      this.state.profile.exp -= next;
      this.state.profile.level++;
      next = this.getExpToNextLevel();
    }
    this.updateStatusBar();
    this.saveData();
  },

  addAffection(amount) {
    this.state.profile.affection = Math.max(0, Math.min(
      AFFECTION_CONFIG.maxAffection,
      this.state.profile.affection + amount
    ));
    this.updateStatusBar();
    this.saveData();
  },

  getExpToNextLevel() {
    return Math.floor(EXP_CONFIG.expToNextLevelBase *
      Math.pow(EXP_CONFIG.expToNextLevelMultiplier, this.state.profile.level - 1));
  },

  /* ════════════════════════════════════════════════
     UTIL
     ════════════════════════════════════════════════ */

  shortText(text, max) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    return clean.length > max ? `${clean.slice(0, max)}...` : clean;
  }
};

document.addEventListener("DOMContentLoaded", () => { App.init(); });
