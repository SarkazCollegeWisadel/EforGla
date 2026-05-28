/* ════════════════════════════════════════════════
   EforGla V1.7 — MCP Client (Model Context Protocol)
   纯前端 JSON-RPC 2.0 over HTTP，零依赖
   ════════════════════════════════════════════════ */

const MCPClient = {
  url: "",
  sessionId: null,
  msgId: 0,
  connected: false,
  tools: [],

  async connect(url) {
    this.url = url;
    this.sessionId = null;
    this.msgId = 0;
    this.connected = false;
    this.tools = [];
    if (!url) return { ok: false, error: "未设置服务器地址" };

    try {
      const initRes = await this._post("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "EforGla", version: "1.7" }
      });
      if (initRes.error) return { ok: false, error: initRes.error.message || "初始化失败" };

      this.sessionId = initRes.headers?.get?.("mcp-session-id") || null;
      this.connected = true;

      // Send initialized notification
      await this._notify("notifications/initialized");

      // Fetch tools
      const toolsRes = await this._call("tools/list");
      this.tools = toolsRes?.result?.tools || [];

      return { ok: true, tools: this.tools };
    } catch (e) {
      console.warn("[MCPClient] 连接失败", e);
      return { ok: false, error: e.message || "连接失败" };
    }
  },

  async callTool(name, args) {
    if (!this.connected) return { ok: false, error: "未连接" };
    try {
      const res = await this._call("tools/call", { name, arguments: args || {} });
      if (res.error) return { ok: false, error: res.error.message };
      return { ok: true, result: res.result };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  disconnect() {
    this.connected = false;
    this.sessionId = null;
    this.tools = [];
  },

  /* ── Internal JSON-RPC helpers ── */

  async _post(method, params) {
    const id = ++this.msgId;
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream"
    };
    if (this.sessionId) headers["Mcp-Session-Id"] = this.sessionId;

    const res = await fetch(this.url, {
      method: "POST",
      headers,
      body: JSON.stringify({ jsonrpc: "2.0", id, method, params })
    });

    // For non-JSON responses (e.g., SSE stream), return early
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/event-stream")) {
      return { headers: res.headers, streaming: true };
    }

    const data = await res.json();
    return { ...data, headers: res.headers };
  },

  async _call(method, params) {
    const result = await this._post(method, params);
    return result;
  },

  async _notify(method, params) {
    const headers = {
      "Content-Type": "application/json"
    };
    if (this.sessionId) headers["Mcp-Session-Id"] = this.sessionId;
    await fetch(this.url, {
      method: "POST",
      headers,
      body: JSON.stringify({ jsonrpc: "2.0", method, params })
    });
  }
};
