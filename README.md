# AI Galgame English Classroom

一个 Galgame × AI 的英语学习终端。

> 像走进一间放学后的教室。角色在旁边，黑板上只写今天需要记住的东西。

## 项目简介

本项目的目标是将 Galgame 的沉浸式体验与英语学习结合，创造一个安静、低压的学习环境。

- **左侧**：角色立绘 + ADV 对话区，提供陪伴感
- **右侧**：黑板式学习区，展示单词、例句、记忆提示
- **核心体验**：安静、温柔、低压学习，有陪伴感的日系视觉小说氛围

## 功能特色

- **分级词库**：初中 / CET-4 / CET-6 三级词库，支持扩展
- **艾宾浩斯复习**：基于间隔重复理论的自动复习系统
- **课堂教学模式**：自动从词库抽词，角色讲解，例句展示
- **Flash Card**：翻转卡片记忆，艾宾浩斯优先抽取待复习单词
- **多角色陪伴**：格蕾修、绫乃、零、小樱等角色，各有不同性格和讲解风格
- **多档存档**：6 槽位存档 + 自动存档，支持覆盖与删除
- **分级设置**：难度、立绘大小、语音、AI Provider 均可自定义
- **角色化讲解**：每个角色结合人设解释单词，让记忆更有温度

## 当前 VV1 功能

- Learn 模式：自动教学展示（英文 + 音标 + 中文 + 例句 + 记忆法 + 角色讲解）
- Cards 模式：翻转卡片，艾宾浩斯间隔复习
- Review 模式：到期单词自动检测，拼写检测 + 间隔记录
- 艾宾浩斯系统：1 / 2 / 4 / 7 / 15 / 30 天复习周期
- 多档存档系统：6 槽位，覆盖 / 删除 / 自动保存
- 词库系统：初中 / CET-4 / CET-6 JSON 词库
- AI 架构预留：Mock / OpenAI / DeepSeek / Claude / Gemini 统一接口
- 角色系统：内置角色 + 酒馆角色卡兼容
- TTS 扩展架构：浏览器原生 / Azure / OpenAI / Fish Audio / CosyVoice 预留

## 技术栈

- **语言**：纯 JavaScript (ES6+)
- **样式**：CSS3 (Flexbox / Grid / CSS Variables / Backdrop Filter)
- **构建**：无构建工具，零依赖，直接运行
- **存储**：localStorage（存档 / 设置 / 学习记录）
- **词库**：JSON 格式，按难度分级
- **AI**：模块化 Provider 架构，当前为离线 Mock 模式
- **TTS**：浏览器原生 Speech Synthesis，支持扩展

## 本地运行方法

### 方式一：直接打开

```bash
# 克隆仓库
git clone https://github.com/your-username/ai-galgame-english-classroom.git

# 直接用浏览器打开 index.html
open index.html
```

### 方式二：本地服务器（推荐）

```bash
# 使用 Python
python -m http.server 8080

# 或使用 Node.js
npx serve .

# 访问 http://localhost:8080
```

> 注意：部分浏览器可能需要通过 HTTP 服务器访问才能加载本地 JSON 词库文件。

## 项目结构

```
ai-galgame-english-classroom/
├── index.html                  # 主页面
├── styles.css                  # 样式表
├── app.js                      # 主应用逻辑
├── WordManager.js              # 词库管理 + 艾宾浩斯系统
├── AIManager.js                # AI Provider 统一接口
├── SaveManager.js              # 多档存档系统
├── TTSManager.js               # TTS 扩展架构
├── CharacterManager.js         # 角色管理
├── data.js                     # 配置与常量
├── learning.js                 # 学习工具函数
├── aiService.js                # AI 讲解服务
├── characters.js               # 内置角色数据
├── tts.js                      # 浏览器 TTS 服务
├── wordBankLoader.js           # 词库加载器（旧版）
├── aiProvider.js               # AI Provider 实现
├── assets/
│   ├── data/character/words/   # 分级词库 JSON
│   │   ├── middle_school.json
│   │   ├── cet4.json
│   │   └── cet6.json
│   └── sprites/                # 角色立绘
└── README.md
```

## 未来开发路线

### AI 集成

- [ ] 接入 DeepSeek / OpenAI / Claude API
- [ ] AI 单词讲解与联想记忆
- [ ] AI 错误分析与学习建议
- [ ] AI 角色互动与学习陪伴

### TTS

- [ ] Azure TTS 多语言支持
- [ ] GPT-4o mini TTS 朗读
- [ ] Fish Audio / CosyVoice 语音克隆

### 角色系统

- [ ] 完整酒馆角色卡 V2/V3 兼容
- [ ] 角色卡导入 / 导出
- [ ] 角色立绘位置 / 缩放自定义

### 社区

- [ ] 词库贡献指南
- [ ] 角色卡市场
- [ ] 学习数据导出 / 统计

## GitHub Pages 预留

本仓库完全兼容 GitHub Pages 部署。

### 部署步骤

1. 将仓库推送到 GitHub
2. 进入 Settings → Pages
3. 选择 `main` 分支，根目录（`/`）
4. 访问 `https://<你的用户名>.github.io/ai-galgame-english-classroom/`

> 注意：由于项目纯前端无构建步骤，GitHub Pages 可直接运行。词库 JSON 通过 `fetch` 加载，确保部署路径与文件路径一致即可。

---

**License**: MIT

Made with ❤️ for quiet English learning.
