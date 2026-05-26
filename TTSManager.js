const TTS_MANAGER_PROVIDERS = {
  browser: { label: "浏览器原生", needsKey: false },
  azure: { label: "Azure TTS", needsKey: true },
  openai: { label: "GPT-4o mini TTS", needsKey: true },
  fish: { label: "Fish Audio", needsKey: true },
  cosy: { label: "CosyVoice", needsKey: true }
};

const TTSManager = {
  provider: "browser",
  config: {
    apiKey: "",
    region: "",
    voiceId: ""
  },

  /* ── Configuration ── */

  setProvider(name) {
    if (TTS_MANAGER_PROVIDERS[name]) {
      this.provider = name;
    }
  },

  setConfig(config = {}) {
    this.config = { ...this.config, ...config };
    if (config.provider) this.setProvider(config.provider);
  },

  getAvailableProviders() {
    return Object.entries(TTS_MANAGER_PROVIDERS).map(([id, info]) => ({
      id, label: info.label, needsKey: info.needsKey
    }));
  },

  /* ── Speaking ── */

  async speak(text, options = {}) {
    if (this.provider === "browser") {
      return this.speakBrowser(text, options);
    }
    // Future: Azure / OpenAI / Fish / CosyVoice
    console.warn(`[TTSManager] Provider "${this.provider}" not yet connected. Falling back to browser TTS.`);
    return this.speakBrowser(text, options);
  },

  speakBrowser(text, options = {}) {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) return resolve(false);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      if (options.voiceName) {
        const voices = window.speechSynthesis.getVoices();
        const found = voices.find((v) => v.name === options.voiceName);
        if (found) utterance.voice = found;
      }
      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);
      window.speechSynthesis.speak(utterance);
    });
  },

  async speakWord(word, options = {}) {
    return this.speak(word, { ...options, rate: options.rate || 0.92 });
  },

  async speakExample(sentence, options = {}) {
    return this.speak(sentence, { ...options, rate: options.rate || 0.85 });
  },

  stop() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  },

  getVoices() {
    if (!window.speechSynthesis) return [];
    return window.speechSynthesis.getVoices();
  },

  isSupported() {
    return "speechSynthesis" in window;
  }
};
