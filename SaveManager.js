/* ════════════════════════════════════════════════
   EforGla V1.6 — Save Manager
   Multi-slot save/load with conversation history
   ════════════════════════════════════════════════ */

const SAVE_KEY = "galgameEnglish_saveSlots";
const AUTO_SAVE_KEY = "galgameEnglish_autoSave";
const MAX_SLOTS = 6;
const SAVE_VERSION = 3;

const SaveManager = {
  slots: [],
  initialized: false,

  init() {
    this.loadFromDisk();
    this.initialized = true;
    return this;
  },

  loadFromDisk() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      this.slots = Array.isArray(parsed) ? parsed.slice(0, MAX_SLOTS) : [];
    } catch {
      this.slots = [];
    }
  },

  writeToDisk() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.slots));
      return true;
    } catch (e) {
      console.warn("[SaveManager] 写入存档失败", e);
      return false;
    }
  },

  getSlots() {
    return [...this.slots];
  },

  getSlot(index) {
    return this.slots[index] || null;
  },

  getSlotInfo(index) {
    const slot = this.slots[index];
    if (!slot) return { exists: false, label: `存档位 ${index + 1} — 空` };
    const date = new Date(slot.savedAt);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    const ls = slot.learningState;
    const rangeStr = ls ? `${(ls.rangeStart || 0) + 1}-${ls.rangeEnd || 0}` : "";
    const vocabLabel = ls?.vocabularyId ? (VOCABULARY_BANKS[ls.vocabularyId]?.label || ls.vocabularyId) : "";
    return {
      exists: true,
      label: `存档位 ${index + 1}`,
      character: slot.characterName || "未知角色",
      level: slot.level || 1,
      affection: slot.affection || 0,
      wordCount: slot.wordCount || 0,
      range: rangeStr,
      vocabulary: vocabLabel,
      conversationCount: slot.conversationCount || 0,
      savedAt: dateStr,
      timestamp: slot.savedAt
    };
  },

  save(index, appState, learningState) {
    const data = this.collectData(appState, learningState);
    if (index >= 0 && index < MAX_SLOTS) {
      const previous = [...this.slots];
      this.slots[index] = { ...data, slotIndex: index };
      if (this.writeToDisk()) return data;
      this.slots = previous;
    }
    return null;
  },

  load(index) {
    return this.slots[index] || null;
  },

  deleteSlot(index) {
    if (index >= 0 && index < this.slots.length) {
      const previous = this.slots[index];
      this.slots[index] = null;
      if (this.writeToDisk()) return true;
      this.slots[index] = previous;
    }
    return false;
  },

  autoSave(appState, learningState) {
    const data = this.collectData(appState, learningState);
    try {
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify({ ...data, isAutoSave: true }));
      return true;
    } catch (e) {
      console.warn("[SaveManager] 自动存档失败", e);
      return false;
    }
  },

  loadAutoSave() {
    try {
      const raw = localStorage.getItem(AUTO_SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  hasAutoSave() {
    try {
      return localStorage.getItem(AUTO_SAVE_KEY) !== null;
    } catch {
      return false;
    }
  },

  collectData(appState, learningState) {
    const lsSerialized = (learningState && typeof learningState.serialize === "function")
      ? learningState.serialize() : null;

    return {
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      characterName: appState?.character?.name || "",
      characterId: appState?.settings?.characterId || "",
      level: appState?.profile?.level || 1,
      affection: appState?.profile?.affection || 0,
      exp: appState?.profile?.exp || 0,
      wordCount: Object.keys(appState?.wordHistory || {}).length,
      conversationCount: lsSerialized?.conversationHistory?.length || 0,
      settings: this.portableSettings(appState?.settings),
      profile: JSON.parse(JSON.stringify(appState?.profile || {})),
      wordHistory: JSON.parse(JSON.stringify(appState?.wordHistory || {})),
      learningState: lsSerialized
    };
  },

  portableSettings(settings) {
    const copy = JSON.parse(JSON.stringify(settings || {}));
    if (copy.ai) delete copy.ai.apiKey;
    return copy;
  },

  restoreToState(data, appState) {
    if (!data) return false;
    try {
      if (data.settings) {
        const settings = this.portableSettings(data.settings);
        appState.settings = {
          ...appState.settings, ...settings,
          ai: { ...appState.settings.ai, ...settings.ai },
          voice: { ...appState.settings.voice, ...settings.voice }
        };
      }
      if (data.profile) appState.profile = { ...appState.profile, ...JSON.parse(JSON.stringify(data.profile)) };
      if (data.wordHistory) appState.wordHistory = JSON.parse(JSON.stringify(data.wordHistory));
      return true;
    } catch {
      return false;
    }
  },

  exportSlot(index) {
    const slot = this.slots[index];
    if (!slot) return null;
    const portable = { ...slot, settings: this.portableSettings(slot.settings) };
    const blob = new Blob([JSON.stringify(portable, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eforgla_save_${index + 1}_${slot.characterName || "unknown"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  },

  importSlot(jsonData) {
    try {
      const data = typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;
      if (!data || !Number.isInteger(data.version) || data.version > SAVE_VERSION || data.version < 1 ||
          !data.settings || typeof data.settings !== "object" || Array.isArray(data.settings)) return false;
      let index = Array.from({ length: MAX_SLOTS }, (_, i) => i).find((i) => !this.slots[i]);
      if (index === undefined) return false;
      const previous = [...this.slots];
      this.slots[index] = { ...data, settings: this.portableSettings(data.settings), slotIndex: index };
      if (!this.writeToDisk()) {
        this.slots = previous;
        return false;
      }
      return { index, data };
    } catch {
      return false;
    }
  }
};
