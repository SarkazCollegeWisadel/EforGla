const SAVE_KEY = "galgameEnglish_saveSlots";
const AUTO_SAVE_KEY = "galgameEnglish_autoSave";
const MAX_SLOTS = 6;

const SaveManager = {
  slots: [],
  initialized: false,

  init() {
    this.loadFromDisk();
    this.initialized = true;
    return this;
  },

  /* ── Persistence ── */

  loadFromDisk() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      this.slots = raw ? JSON.parse(raw) : [];
    } catch {
      this.slots = [];
    }
  },

  writeToDisk() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.slots));
    } catch (e) {
      console.warn("[SaveManager] 写入存档失败", e);
    }
  },

  /* ── Slots ── */

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
    const rangeStr = ls ? `${ls.rangeStart + 1}-${ls.rangeEnd}` : "";
    return {
      exists: true,
      label: `存档位 ${index + 1}`,
      character: slot.characterName || "未知角色",
      level: slot.level || 1,
      affection: slot.affection || 0,
      wordCount: slot.wordCount || 0,
      range: rangeStr,
      savedAt: dateStr,
      timestamp: slot.savedAt
    };
  },

  save(index, appState, learningState) {
    const data = this.collectData(appState, learningState);
    if (index >= 0 && index < MAX_SLOTS) {
      this.slots[index] = { ...data, slotIndex: index };
      this.writeToDisk();
    }
    return data;
  },

  load(index) {
    return this.slots[index] || null;
  },

  deleteSlot(index) {
    if (index >= 0 && index < this.slots.length) {
      this.slots.splice(index, 1);
      this.writeToDisk();
    }
  },

  /* ── Auto-save ── */

  autoSave(appState, learningState) {
    const data = this.collectData(appState, learningState);
    try {
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify({ ...data, isAutoSave: true }));
    } catch (e) {
      console.warn("[SaveManager] 自动存档失败", e);
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

  /* ── Data collection ── */

  collectData(appState, learningState) {
    const charName = appState?.character?.name || "";
    const data = {
      version: 2,
      savedAt: new Date().toISOString(),
      characterName: charName,
      characterId: appState?.settings?.characterId || "",
      level: appState?.profile?.level || 1,
      affection: appState?.profile?.affection || 0,
      exp: appState?.profile?.exp || 0,
      wordCount: Object.keys(appState?.wordHistory || {}).length,
      settings: JSON.parse(JSON.stringify(appState?.settings || {})),
      profile: JSON.parse(JSON.stringify(appState?.profile || {})),
      wordHistory: JSON.parse(JSON.stringify(appState?.wordHistory || {}))
    };
    if (learningState && typeof learningState.serialize === "function") {
      data.learningState = learningState.serialize();
    }
    return data;
  },

  restoreToState(data, appState) {
    if (!data) return false;
    try {
      if (data.settings) appState.settings = { ...appState.settings, ...JSON.parse(JSON.stringify(data.settings)) };
      if (data.profile) appState.profile = { ...appState.profile, ...JSON.parse(JSON.stringify(data.profile)) };
      if (data.wordHistory) appState.wordHistory = JSON.parse(JSON.stringify(data.wordHistory));
      // LearningState is restored separately via learningState field
      return true;
    } catch {
      return false;
    }
  },

  /* ── Export / Import ── */

  exportSlot(index) {
    const slot = this.slots[index];
    if (!slot) return null;
    const blob = new Blob([JSON.stringify(slot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `galgame_save_${index + 1}_${slot.characterName || "unknown"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  },

  importSlot(jsonData) {
    try {
      const data = typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;
      if (!data.version || !data.settings) return false;
      const index = this.slots.length < MAX_SLOTS ? this.slots.length : MAX_SLOTS - 1;
      this.slots[index] = { ...data, slotIndex: index };
      this.writeToDisk();
      return { index, data };
    } catch {
      return false;
    }
  }
};
