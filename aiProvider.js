const AI_PROVIDER_CONFIG = {
  mock: { label: "本地离线 (Mock)", apiKey: false, endpoint: false, model: false },
  openai: { label: "OpenAI", apiKey: true, endpoint: true, model: true, defaultModel: "gpt-4o" },
  deepseek: { label: "DeepSeek", apiKey: true, endpoint: true, model: true, defaultModel: "deepseek-chat" },
  claude: { label: "Claude", apiKey: true, endpoint: false, model: true, defaultModel: "claude-sonnet-4-6" },
  gemini: { label: "Gemini", apiKey: true, endpoint: false, model: true, defaultModel: "gemini-2.0-flash" }
};

class AIProviderBase {
  async explainWord({ word, meaning, phonetic, example, exampleChinese, character, difficulty }) {
    throw new Error("explainWord must be implemented by subclass");
  }

  async chat(messages) {
    throw new Error("chat must be implemented by subclass");
  }
}

class MockAIProvider extends AIProviderBase {
  async explainWord({ word, character, difficulty, wordData }) {
    const resolved = wordData || { english: word, chinese: "待查词", phonetic: "", example: "", exampleChinese: "" };
    const name = character?.name || "角色";
    let comment;
    if (character?.id?.includes("griseo")) {
      comment = `${resolved.english} 是 ${resolved.chinese}。我会把它涂成很浅的蓝色，再在旁边画一句例句。`;
    } else if (character?.id === "rei") {
      comment = `${resolved.english}，${resolved.chinese}。先读音标，再背例句。不要跳步骤。`;
    } else if (character?.id === "sakura") {
      comment = `${resolved.english} 是 ${resolved.chinese}！把例句一起读出来，会更容易记住！`;
    } else if (character?.id === "ayano") {
      comment = `${resolved.english} 是 ${resolved.chinese}。慢慢来，先记住意思。`;
    } else {
      comment = `“${resolved.english}” 的意思是“${resolved.chinese}”。先记住含义，再读例句。`;
    }
    return {
      word: resolved.english,
      meaning: resolved.chinese,
      phonetic: resolved.phonetic,
      example: resolved.example,
      exampleChinese: resolved.exampleChinese,
      characterComment: comment,
      memoryTip: this.buildMemoryTip(resolved),
      followUpQuestion: `你能用 ${resolved.english} 造一个自己的句子吗？`,
      provider: "mock"
    };
  }

  async chat(_messages) {
    return { role: "assistant", content: "当前为离线模式。配置 AI Provider 后可获得角色对话和智能讲解。", provider: "mock" };
  }

  buildMemoryTip(wordData) {
    const first = (wordData.english || "W").slice(0, 1).toUpperCase();
    return `记忆提示：先记首字母 ${first}，再把“${wordData.chinese}”和例句画面连在一起。`;
  }
}

class OpenAIProvider extends AIProviderBase {
  constructor(config) {
    super();
    this.apiKey = config?.apiKey || "";
    this.endpoint = config?.endpoint || "https://api.openai.com/v1";
    this.model = config?.model || "gpt-4o";
  }

  async explainWord({ word, meaning, phonetic, example, exampleChinese, character, difficulty }) {
    return this._callExplain({ word, meaning, phonetic, example, exampleChinese, character, difficulty });
  }

  async chat(messages) {
    return this._callChat(messages);
  }

  async _callExplain(params) {
    const messages = this._buildExplainMessages(params);
    const result = await this._post(messages);
    return { ...this._parseExplain(result), provider: "openai" };
  }

  _buildExplainMessages({ word, meaning, phonetic, example, exampleChinese, character, difficulty }) {
    return [
      { role: "system", content: `You are ${character?.name || "a tutor"} in an English learning app. Explain the word "${word}" briefly in Chinese.` },
      { role: "user", content: `Explain "${word}" (${meaning}) at ${difficulty} level. Include: meaning in Chinese, example sentence, memory tip.` }
    ];
  }

  async _post(messages) {
    console.warn("[OpenAIProvider] API not yet connected — returning mock response.");
    return new MockAIProvider().explainWord({ word: "openai", character: null, difficulty: "medium" });
  }

  _parseExplain(raw) {
    return typeof raw === "object" && raw.word ? raw : { word: "openai", meaning: "暂未连接", characterComment: "API 尚未配置。请在设置中填入 API Key。" };
  }

  async _callChat(messages) {
    console.warn("[OpenAIProvider] Chat API not yet connected.");
    return new MockAIProvider().chat(messages);
  }
}

class DeepSeekProvider extends OpenAIProvider {
  constructor(config) {
    super(config);
    this.endpoint = config?.endpoint || "https://api.deepseek.com/v1";
    this.model = config?.model || "deepseek-chat";
  }
}

class ClaudeProvider extends OpenAIProvider {
  constructor(config) {
    super(config);
    this.endpoint = config?.endpoint || "https://api.anthropic.com/v1";
    this.model = config?.model || "claude-sonnet-4-6";
  }
}

class GeminiProvider extends OpenAIProvider {
  constructor(config) {
    super(config);
    this.endpoint = config?.endpoint || "https://generativelanguage.googleapis.com/v1";
    this.model = config?.model || "gemini-2.0-flash";
  }
}

class AIProviderManager {
  constructor() {
    this.registry = {
      mock: MockAIProvider,
      openai: OpenAIProvider,
      deepseek: DeepSeekProvider,
      claude: ClaudeProvider,
      gemini: GeminiProvider
    };
    this.currentProvider = null;
    this.currentName = "mock";
    this.config = {
      provider: "mock",
      apiKey: "",
      endpoint: "",
      model: ""
    };
  }

  setConfig(config = {}) {
    this.config = { ...this.config, ...config };
    this.currentName = this.config.provider || "mock";
    this._createProvider();
  }

  _createProvider() {
    const ProviderClass = this.registry[this.currentName] || MockAIProvider;
    this.currentProvider = new ProviderClass({
      apiKey: this.config.apiKey,
      endpoint: this.config.endpoint,
      model: this.config.model
    });
  }

  getProvider() {
    if (!this.currentProvider) this._createProvider();
    return this.currentProvider;
  }

  async explainWord(params = {}) {
    return this.getProvider().explainWord(params);
  }

  async chat(messages) {
    return this.getProvider().chat(messages || []);
  }

  getAvailableProviders() {
    return Object.entries(AI_PROVIDER_CONFIG).map(([key, cfg]) => ({
      id: key,
      label: cfg.label,
      needsApiKey: cfg.apiKey,
      needsEndpoint: cfg.endpoint,
      needsModel: cfg.model,
      defaultModel: cfg.defaultModel
    }));
  }

  getProviderConfig(providerName) {
    return AI_PROVIDER_CONFIG[providerName] || AI_PROVIDER_CONFIG.mock;
  }

  setProvider(providerName) {
    if (this.registry[providerName]) {
      this.currentName = providerName;
      this.config.provider = providerName;
      this._createProvider();
    }
  }
}

const AIProvider = new AIProviderManager();
