/* ════════════════════════════════════════════════
   EforGla V1.6 — AI Provider System
   Real API implementations for DeepSeek, OpenAI, Claude, Gemini
   ════════════════════════════════════════════════ */

class AIProviderBase {
  async explainWord(params) { throw new Error("explainWord must be implemented"); }
  async chat(messages) { throw new Error("chat must be implemented"); }
  async conversation(params) { return this.chat(params.messages); }
}

/* ── Mock Provider ── */

class MockAIProvider extends AIProviderBase {
  async explainWord({ word, meaning, character, wordData }) {
    const resolved = wordData || { english: word, chinese: meaning || "待查词", phonetic: "", example: "", exampleChinese: "" };
    const name = character?.name || "角色";
    let comment;
    const id = character?.id || "";
    if (id.includes("griseo")) {
      comment = `${resolved.english} 是 ${resolved.chinese}。我会把它涂成很浅的蓝色，再在旁边画一句例句。`;
    } else if (id === "rei") {
      comment = `${resolved.english}，${resolved.chinese}。先读音标，再背例句。不要跳步骤。`;
    } else if (id === "sakura") {
      comment = `${resolved.english} 是 ${resolved.chinese}！把例句一起读出来，会更容易记住！`;
    } else if (id === "ayano") {
      comment = `${resolved.english} 是 ${resolved.chinese}。慢慢来，先记住意思。`;
    } else {
      comment = `"${resolved.english}" 的意思是"${resolved.chinese}"。先记住含义，再读例句。`;
    }
    return {
      word: resolved.english, meaning: resolved.chinese, phonetic: resolved.phonetic || "",
      example: resolved.example || "", exampleChinese: resolved.exampleChinese || "",
      characterComment: comment, memoryTip: this.buildMemoryTip(resolved),
      followUpQuestion: `你能用 ${resolved.english} 造一个自己的句子吗？`, provider: "mock"
    };
  }

  async chat(messages) {
    return { role: "assistant", content: "当前为离线模式。配置 AI Provider 后可获得角色对话和智能讲解。", provider: "mock" };
  }

  async conversation({ messages }) {
    return this.chat(messages);
  }

  buildMemoryTip(wordData) {
    const first = (wordData.english || "W").slice(0, 1).toUpperCase();
    return `记忆提示：先记首字母 ${first}，再把"${wordData.chinese}"和例句画面连在一起。`;
  }
}

/* ── Base HTTP Provider ── */

class HttpAIProvider extends AIProviderBase {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey || "";
    this.endpoint = config.endpoint || "";
    this.model = config.model || "";
  }

  setConfig(config = {}) {
    if (config.apiKey !== undefined) this.apiKey = config.apiKey;
    if (config.endpoint !== undefined) this.endpoint = config.endpoint;
    if (config.model !== undefined) this.model = config.model;
  }

  async _post(messages, options = {}) {
    if (!this.apiKey) {
      console.warn(`[${this.constructor.name}] No API key configured.`);
      return null;
    }
    try {
      const response = await fetch(this._chatUrl(), {
        method: "POST",
        headers: this._headers(),
        body: JSON.stringify(this._buildRequestBody(messages, options))
      });
      if (!response.ok) {
        const text = await response.text();
        console.warn(`[${this.constructor.name}] API error ${response.status}: ${text}`);
        return null;
      }
      return await response.json();
    } catch (e) {
      console.warn(`[${this.constructor.name}] Request failed:`, e.message);
      return null;
    }
  }

  _chatUrl() { return this.endpoint + "/chat/completions"; }
  _headers() {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`
    };
  }
  _buildRequestBody(messages, options = {}) {
    return {
      model: this.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024
    };
  }
  _extractContent(raw) {
    return raw?.choices?.[0]?.message?.content || "";
  }

  async chat(messages) {
    const result = await this._post(messages);
    if (result) return { role: "assistant", content: this._extractContent(result), provider: this.constructor.name };
    return null;
  }

  async conversation({ messages, character, word }) {
    const result = await this._post(messages, { temperature: 0.8, maxTokens: 512 });
    if (result) return { role: "assistant", content: this._extractContent(result), provider: this.constructor.name };
    return null;
  }

  async explainWord({ word, meaning, phonetic, example, exampleChinese, character, difficulty }) {
    const messages = this._buildExplainMessages({ word, meaning, phonetic, example, exampleChinese, character, difficulty });
    const result = await this._post(messages, { temperature: 0.6, maxTokens: 800 });
    if (result) {
      const content = this._extractContent(result);
      return this._parseExplainResponse(content, { word, meaning, phonetic, example, exampleChinese });
    }
    return null;
  }

  _buildExplainMessages({ word, meaning, phonetic, example, exampleChinese, character, difficulty }) {
    const name = character?.name || "角色";
    const personality = character?.personality || "温柔、耐心";
    return [
      {
        role: "system",
        content: `你是一个 Galgame 风格英语学习应用中的陪伴角色「${name}」。性格：${personality}。场景：教室。请用中文+英文混合解释单词，保持角色语气。输出 JSON 格式。`
      },
      {
        role: "user",
        content: `请解释单词 "${word}"（${meaning}）。难度：${difficulty || "medium"}。返回 JSON：
{
  "characterComment": "用角色语气的一句话解释，像在教室里和学生对谈",
  "memoryTip": "一个具体的记忆方法，像画画一样有画面",
  "collocations": "2-3个常见搭配",
  "etymology": "简短词根提示",
  "followUpQuestion": "一个引导造句的问题"
}`
      }
    ];
  }

  _parseExplainResponse(content, fallback) {
    try {
      const json = JSON.parse(content.replace(/```json\n?/g, "").replace(/```/g, "").trim());
      return {
        word: fallback.word, meaning: fallback.meaning,
        phonetic: fallback.phonetic || "", example: fallback.example || "",
        exampleChinese: fallback.exampleChinese || "",
        characterComment: json.characterComment || "",
        memoryTip: json.memoryTip || "",
        collocations: json.collocations || "",
        etymology: json.etymology || "",
        followUpQuestion: json.followUpQuestion || ""
      };
    } catch {
      return {
        word: fallback.word, meaning: fallback.meaning,
        phonetic: fallback.phonetic || "", example: fallback.example || "",
        exampleChinese: fallback.exampleChinese || "",
        characterComment: content.slice(0, 200), memoryTip: "",
        collocations: "", etymology: "", followUpQuestion: ""
      };
    }
  }
}

/* ── OpenAI Provider ── */

class OpenAIProvider extends HttpAIProvider {
  constructor(config = {}) {
    super({
      apiKey: config.apiKey || "",
      endpoint: config.endpoint || "https://api.openai.com/v1",
      model: config.model || "gpt-4o"
    });
  }
}

/* ── DeepSeek Provider ── */

class DeepSeekProvider extends HttpAIProvider {
  constructor(config = {}) {
    super({
      apiKey: config.apiKey || "",
      endpoint: config.endpoint || "https://api.deepseek.com/v1",
      model: config.model || "deepseek-v4-flash"
    });
  }
}

/* ── Claude Provider (Anthropic Messages API) ── */

class ClaudeProvider extends AIProviderBase {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey || "";
    this.endpoint = config.endpoint || "https://api.anthropic.com/v1";
    this.model = config.model || "claude-sonnet-4-6";
  }

  async _post(messages, options = {}) {
    if (!this.apiKey) return null;
    try {
      const systemMsg = messages.find((m) => m.role === "system");
      const chatMessages = messages.filter((m) => m.role !== "system");
      const body = {
        model: this.model,
        max_tokens: options.maxTokens || 1024,
        messages: chatMessages.map((m) => ({ role: m.role, content: m.content }))
      };
      if (systemMsg) body.system = systemMsg.content;

      const response = await fetch(this.endpoint + "/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const text = await response.text();
        console.warn(`[ClaudeProvider] API error ${response.status}: ${text}`);
        return null;
      }
      return await response.json();
    } catch (e) {
      console.warn("[ClaudeProvider] Request failed:", e.message);
      return null;
    }
  }

  _extractContent(raw) {
    return raw?.content?.[0]?.text || "";
  }

  async chat(messages) {
    const result = await this._post(messages);
    if (result) return { role: "assistant", content: this._extractContent(result), provider: "claude" };
    return null;
  }

  async explainWord(params) {
    const messages = this._buildExplainMessages(params);
    const result = await this._post(messages, { maxTokens: 800 });
    if (result) {
      return this._parseExplainResponse(this._extractContent(result), params);
    }
    return null;
  }

  _buildExplainMessages({ word, meaning, character, difficulty }) {
    const name = character?.name || "角色";
    return [
      {
        role: "system",
        content: `你是 Galgame 英语学习应用中的角色「${name}」。用中文+英文解释单词，保持角色语气。返回 JSON。`
      },
      {
        role: "user",
        content: `解释单词 "${word}"（${meaning}）。返回JSON：{"characterComment":"一句话角色讲解","memoryTip":"画面式记忆法","collocations":"2-3个搭配","etymology":"词根提示","followUpQuestion":"引导造句的问题"}`
      }
    ];
  }

  _parseExplainResponse(content, fallback) {
    try {
      const json = JSON.parse(content.replace(/```json\n?/g, "").replace(/```/g, "").trim());
      return {
        word: fallback.word, meaning: fallback.meaning,
        phonetic: fallback.phonetic || "", example: fallback.example || "",
        exampleChinese: fallback.exampleChinese || "",
        characterComment: json.characterComment || "",
        memoryTip: json.memoryTip || "",
        collocations: json.collocations || "",
        etymology: json.etymology || "",
        followUpQuestion: json.followUpQuestion || ""
      };
    } catch {
      return {
        word: fallback.word, meaning: fallback.meaning, phonetic: fallback.phonetic || "",
        example: fallback.example || "", exampleChinese: fallback.exampleChinese || "",
        characterComment: content.slice(0, 200), memoryTip: "",
        collocations: "", etymology: "", followUpQuestion: ""
      };
    }
  }

  async conversation({ messages }) {
    const result = await this._post(messages, { maxTokens: 512 });
    if (result) return { role: "assistant", content: this._extractContent(result), provider: "claude" };
    return null;
  }
}

/* ── Gemini Provider ── */

class GeminiProvider extends AIProviderBase {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey || "";
    this.endpoint = config.endpoint || "https://generativelanguage.googleapis.com/v1";
    this.model = config.model || "gemini-2.0-flash";
  }

  async _post(messages, options = {}) {
    if (!this.apiKey) return null;
    try {
      const contents = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));
      const response = await fetch(
        `${this.endpoint}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: options.maxTokens || 1024 } })
        }
      );
      if (!response.ok) {
        const text = await response.text();
        console.warn(`[GeminiProvider] API error ${response.status}: ${text}`);
        return null;
      }
      return await response.json();
    } catch (e) {
      console.warn("[GeminiProvider] Request failed:", e.message);
      return null;
    }
  }

  _extractContent(raw) {
    return raw?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  async chat(messages) {
    const result = await this._post(messages);
    if (result) return { role: "assistant", content: this._extractContent(result), provider: "gemini" };
    return null;
  }

  async explainWord(params) {
    const messages = this._buildExplainMessages(params);
    const result = await this._post(messages, { maxTokens: 800 });
    if (result) {
      return this._parseExplainResponse(this._extractContent(result), params);
    }
    return null;
  }

  _buildExplainMessages({ word, meaning, character, difficulty }) {
    const name = character?.name || "角色";
    return [
      { role: "user", content: `你是 Galgame 英语学习应用中的角色「${name}」。解释单词 "${word}"（${meaning}）。请只返回如下 JSON（不要 markdown 代码块）：{"characterComment":"用角色语气的一句话解释","memoryTip":"画面式记忆法","collocations":"2-3个常见搭配","etymology":"简短词根提示","followUpQuestion":"引导造句的问题"}` }
    ];
  }

  _parseExplainResponse(content, fallback) {
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```/g, "").trim();
      const json = JSON.parse(cleaned);
      return {
        word: fallback.word, meaning: fallback.meaning,
        phonetic: fallback.phonetic || "", example: fallback.example || "",
        exampleChinese: fallback.exampleChinese || "",
        characterComment: json.characterComment || "",
        memoryTip: json.memoryTip || "",
        collocations: json.collocations || "",
        etymology: json.etymology || "",
        followUpQuestion: json.followUpQuestion || ""
      };
    } catch {
      return {
        word: fallback.word, meaning: fallback.meaning, phonetic: fallback.phonetic || "",
        example: fallback.example || "", exampleChinese: fallback.exampleChinese || "",
        characterComment: content.slice(0, 200), memoryTip: "",
        collocations: "", etymology: "", followUpQuestion: ""
      };
    }
  }

  async conversation({ messages }) {
    const result = await this._post(messages, { maxTokens: 512 });
    if (result) return { role: "assistant", content: this._extractContent(result), provider: "gemini" };
    return null;
  }
}

/* ── Provider Manager ── */

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
    this.currentName = "deepseek";
    this.config = {
      provider: "deepseek",
      apiKey: "",
      endpoint: "",
      model: "deepseek-v4-flash"
    };
  }

  setConfig(config = {}) {
    this.config = { ...this.config, ...config };
    this.currentName = this.config.provider || "deepseek";
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
    const result = await this.getProvider().explainWord(params);
    if (result) return result;
    // Fallback to mock
    return new MockAIProvider().explainWord(params);
  }

  async chat(messages) {
    const result = await this.getProvider().chat(messages || []);
    if (result) return result;
    return new MockAIProvider().chat(messages);
  }

  async conversation(params = {}) {
    if (this.currentName === "mock") {
      return new MockAIProvider().conversation(params);
    }
    const result = await this.getProvider().conversation(params);
    if (result) return result;
    // Fallback to mock response
    return {
      role: "assistant",
      content: "嗯，我听到了。不过现在离线，试试切换 Provider 或检查 API Key？",
      provider: "mock"
    };
  }

  getAvailableProviders() {
    return Object.entries(PROVIDER_CONFIG).map(([key, cfg]) => ({
      id: key,
      label: cfg.label,
      needsApiKey: cfg.apiKey,
      needsEndpoint: cfg.endpoint,
      needsModel: cfg.model,
      defaultModel: cfg.defaultModel,
      defaultEndpoint: cfg.defaultEndpoint
    }));
  }

  isOnline() {
    return this.currentName !== "mock" && !!this.config.apiKey;
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
