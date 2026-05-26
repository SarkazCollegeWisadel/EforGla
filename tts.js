class BrowserSpeechProvider {
  constructor() {
    this.id = "browser";
    this.supported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  }

  async speak(text, options = {}) {
    if (!this.supported || !text) return false;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Number(options.rate || 1);
    utterance.pitch = Number(options.pitch || 1);
    utterance.volume = Number(options.volume ?? 1);
    const voiceName = options.voiceName || "";
    const voice = this.getVoices().find((item) => item.name === voiceName);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
    return true;
  }

  stop() {
    if (this.supported) window.speechSynthesis.cancel();
  }

  pause() {
    if (this.supported) window.speechSynthesis.pause();
  }

  resume() {
    if (this.supported) window.speechSynthesis.resume();
  }

  getVoices() {
    if (!this.supported) return [];
    return window.speechSynthesis.getVoices();
  }
}

class PlaceholderTTSProvider {
  constructor(id) {
    this.id = id;
    this.supported = false;
  }

  async speak() {
    console.warn(`[TTS] ${this.id} provider is reserved but not implemented.`);
    return false;
  }

  stop() {}
  pause() {}
  resume() {}
  getVoices() { return []; }
}

const TTSService = {
  providers: {
    browser: new BrowserSpeechProvider(),
    edge: new PlaceholderTTSProvider("edge"),
    openai: new PlaceholderTTSProvider("openai"),
    local: new PlaceholderTTSProvider("local")
  },
  currentProviderId: "browser",

  setProvider(providerId = "browser") {
    this.currentProviderId = this.providers[providerId] ? providerId : "browser";
  },

  get provider() {
    return this.providers[this.currentProviderId] || this.providers.browser;
  },

  speak(text, options = {}) {
    this.setProvider(options.provider || this.currentProviderId);
    return this.provider.speak(text, options);
  },

  stop() {
    this.provider.stop();
  },

  pause() {
    this.provider.pause();
  },

  resume() {
    this.provider.resume();
  },

  getVoices() {
    return this.provider.getVoices();
  }
};
