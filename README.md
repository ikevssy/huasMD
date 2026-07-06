# huasMD

**Markdown as Database。Agent Native 的编辑器与模板渲染平台。**

人类与 AI Agent 的实时协作 — Agent 的每一次修改，你都能即时看到。把任意 Markdown 文件渲染成幻灯片、博客、简历或产品页。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](README_EN.md) | [下载](#下载) | [功能](#功能) | [幻灯片](#幻灯片--markdown-as-database) | [开发](#开发)

---

## 为什么做 huasMD？

AI Agent 正在改变我们的工作方式。它们编辑文件、生成文档、产出报告 — 全是 Markdown。

但你怎么**看到** Agent 的工作？关掉文件？再打开？等着？

**huasMD 改变了这一切。** 用 huasMD 打开 `.md` 文件，让 Agent 去编辑它，内容会实时更新 — 就像和 AI 结对编程。不需要刷新，不需要重新加载，零摩擦。

这就是 **Agent Native** 的含义：从底层为人类和 Agent 协作而生。

## 功能

### Agent Native

- **实时 Agent 同步** — AI Agent（Claude Code、Cursor、Copilot 等）修改 `.md` 文件时，huasMD 自动检测并即时刷新。这是核心功能。
- **Agent 活动指示器** — 标题栏的小圆点告诉你 Agent 的状态：橙色呼吸闪烁表示正在写入，绿色闪现表示写入完成。
- **Cmd+点击链接** — 点击编辑器中的链接直接在浏览器打开。

### 编辑器

- **真正的所见即所得** — 输入 Markdown，直接看到富文本，无需分屏预览。
- **智能换行** — 单个换行即渲染为换行，匹配 AI Agent 写 Markdown 的习惯。
- **富文本复制** — 复制内容后可直接粘贴到公众号、邮件等富文本编辑器，格式完整保留。
- **全宽模式** — 点击底部状态栏 ↔️ 图标，编辑区从 780px 扩展到 1400px，宽表格阅读无压力。
- **极简设计** — 没有工具栏，没有侧边栏，没有干扰。只有你的内容。

### 界面与效率

- **底部状态栏** — 菜单栏移到底部，图标式操作更简洁：新建、打开、保存，一键直达。
- **中英文切换** — 点击 🌐 一键切换界面语言，支持中文和 English。
- **目录导航** — 点击右上角 ☰ 图标，浮层展示文档大纲（H1-H6），点击跳转，内容变化实时刷新。

### 主题与导出

- **9 个内置主题** — 明亮、暗黑、典雅、报纸、羊皮纸、太阳光、GitHub 明亮、Material 明亮、Material 海洋。每种主题的粗体和代码有独特的强调色。
- **自定义主题** — 支持导入 `.css` 文件作为主题，保存到 `~/.huasMD/themes/`。
- **导出** — PDF、HTML 单文件、幻灯片（单文件 HTML 或文件夹）。
- **跨平台** — macOS、Windows、Linux。

## 幻灯片 — Markdown as Database

HTML 难改。Markdown 好改。

huasMD 提出一个新理念：**Markdown as Database**。`.md` 文件是内容层，HTML 模板是视图层。改内容只改 Markdown，完全不碰 HTML。

一份 Markdown，多种渲染形态：幻灯片、博客、简历、产品页……未来各种模板都可以消费同一份文件。

### 使用方式

**文件 → 新建幻灯片** — 创建幻灯片模板，在编辑器里直接编辑内容。

**文件 → 作为幻灯片打开** — 启动本地服务，在浏览器打开当前文件的幻灯片。

**文件 → 导出幻灯片** — 导出可分享版本。不含视频：单个 `.html` 文件，图片 base64 内嵌。含视频：导出文件夹，整体打包发送。

### Slide 格式

```markdown
---
kicker: YOUR BRAND
chip: 活动名称 · 2026
page: YOUR NAME
---

<!-- type: cover -->
# 标题
副标题

---

<!-- type: statement -->
## 核心观点
一句有力量的话。

---

## 章节
第一个要点。

---

<!-- type: thankyou -->
## 谢谢
结束语
```

支持版式：`cover` · `statement` · `section` · `video` · `thankyou`

## 下载

> 查看 [Releases](https://github.com/huasMD/huasMD/releases) 获取最新构建。

| 平台 | 格式 |
|------|------|
| macOS | `.dmg` |
| Windows | `.exe` |
| Linux | `.AppImage` / `.deb` |

## 工作原理

```
┌─────────────┐     写入      ┌──────────────┐
│  AI Agent   │ ──────────────▶│  .md 文件    │
│ (Claude,    │                │              │
│  Cursor...) │                └──────┬───────┘
└─────────────┘                       │
                              fs.watch 检测变化
                                      │
                              ┌───────▼───────┐
                              │    huasMD     │
                              │   自动刷新    │
                              │   ✨ 实时！   │
                              └───────────────┘
```

1. 用 huasMD 打开任意 `.md` 文件
2. 让 AI Agent 编辑这个文件
3. 看着内容实时更新 — 标题栏的指示器会在 Agent 写入时亮起橙色脉冲

不需要任何配置，开箱即用。

## huasMD 不做的事

huasMD 有意保持简单：

- 没有文件管理器或工作区
- 没有云同步或协作编辑
- 没有内置 AI 功能 — 它是 AI 生成内容的**查看器/编辑器**
- 没有插件系统

一件事，做到极致。

## 开发

```bash
git clone https://github.com/huasMD/huasMD.git
cd huasMD
npm install
npm run dev
```

### 构建

```bash
npm run dist:mac
npm run dist:win
npm run dist:linux
```

### 技术栈

- **Electron** — 跨平台桌面
- **Milkdown** — 所见即所得 Markdown（基于 ProseMirror）
- **TypeScript** — 严格模式
- **electron-vite** — 快速构建

## 开源协议

[MIT](LICENSE) — 永久免费。

---

基于 [marswave.ai/ColaMD](https://github.com/marswaveai/colamd) 二次开发。
