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

      // Send initialized notification
      await this._notify("notifications/initialized");

      // Fetch tools
      const toolsRes = await this._call("tools/list");
      if (toolsRes.error) throw new Error(toolsRes.error.message || "获取工具列表失败");
      if (!Array.isArray(toolsRes?.result?.tools)) throw new Error("服务器未返回有效的工具列表");
      this.tools = toolsRes.result.tools;
      this.connected = true;

      return { ok: true, tools: this.tools };
    } catch (e) {
      this.disconnect();
      console.warn("[MCPClient] 连接失败", e);
      return { ok: false, error: e.message || "连接失败" };
    }
  },

  async callTool(name, args) {
    if (!this.connected) return { ok: false, error: "未连接" };
    try {
      const res = await this._call("tools/call", { name, arguments: args || {} });
      if (res.error) return { ok: false, error: res.error.message };
      if (res.result?.isError) return { ok: false, error: "工具执行失败", result: res.result };
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
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // For non-JSON responses (e.g., SSE stream), return early
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/event-stream")) {
      await res.body?.cancel();
      throw new Error("当前客户端仅支持 JSON 响应，暂不支持此服务器的 SSE 响应");
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
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream"
    };
    if (this.sessionId) headers["Mcp-Session-Id"] = this.sessionId;
    const res = await fetch(this.url, {
      method: "POST",
      headers,
      body: JSON.stringify({ jsonrpc: "2.0", method, params })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
};
