# huasMD

**Markdown as Database. The Agent Native editor and template rendering platform.**

Real-time collaboration between humans and AI agents — see your agent's changes as they happen. Turn any Markdown file into a slide deck, blog post, resume, or product page.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[中文](README.md) | [Download](#download) | [Features](#features) | [Slides](#slides--markdown-as-database) | [Development](#development)

---

## Why huasMD?

AI agents are rewriting how we work. They edit files, generate docs, and produce reports — all in Markdown.

But how do you **watch** an agent work? You close the file. You reopen it. You wait.

**huasMD changes this.** Open a `.md` file in huasMD, let your agent edit it, and watch the content update in real-time — like pair programming with an AI. No refresh, no reload, no friction.

This is what **Agent Native** means: built from the ground up for a world where humans and agents collaborate on the same files.

## Features

### Agent Native

- **Live Agent Sync** — When an AI agent (Claude Code, Cursor, Copilot, etc.) modifies your `.md` file, huasMD detects the change and refreshes instantly. This is the core feature.
- **Agent Activity Indicator** — A subtle dot in the titlebar shows you when an agent is writing: orange breathing pulse while active, green flash when done.
- **Cmd+Click Links** — Click any link in the editor to open it in your browser.

### Editor

- **True WYSIWYG** — Type Markdown, see rich text. No split-pane preview.
- **Smart Line Breaks** — Single newlines render as line breaks, matching how AI agents write Markdown.
- **Rich Text Copy** — Copy content and paste into rich text editors with formatting preserved.
- **Full-Width Mode** — Click the ↔️ icon in the status bar to expand from 780px to 1400px for wide tables.
- **Minimal by Design** — No toolbar, no sidebar, no distractions. Just your content.

### Interface & Productivity

- **Bottom Status Bar** — Menu actions moved to a sleek icon bar at the bottom: New, Open, Save — one click away.
- **i18n (Chinese/English)** — Click 🌐 to switch between Chinese and English UI instantly.
- **Table of Contents** — Click ☰ in the top-right for a floating outline (H1-H6); click any heading to jump, auto-refreshes on content change.

### Themes & Export

- **9 Built-in Themes** — Light, Dark, Elegant, Newsprint, Sepia, Solarized Light, GitHub Light, Material Light, Material Ocean. Each theme has unique accent colors for bold text and inline code.
- **Custom Themes** — Import `.css` files as themes, persisted in `~/.huasMD/themes/`.
- **Export** — PDF, self-contained HTML, and slides (single-file HTML or folder with videos).
- **Cross-platform** — macOS, Windows, Linux.

## Slides — Markdown as Database

HTML is hard to edit. Markdown is easy.

huasMD introduces a new idea: **Markdown as Database**. Your `.md` file is the content layer. HTML templates are the view layer. Change the content by editing Markdown — never touch the HTML.

### How to use

**File → New Slides** — Creates a slides template and opens it in the editor.

**File → Open as Slides** — Spins up a local server and opens your file as a slide deck in the browser.

**File → Export Slides** — Export a shareable version. Without video: a single `.html` file with inlined base64 images. With video: a folder with `index.html` plus video files.

### Slide format

```markdown
---
kicker: YOUR BRAND
chip: Event · 2026
page: YOUR NAME
---

<!-- type: cover -->
# Title
Subtitle here

---

<!-- type: statement -->
## Key Message
One powerful sentence.

---

## Section
Content goes here.

---

<!-- type: thankyou -->
## Thank You
Closing message
```

Supported layouts: `cover` · `statement` · `section` · `video` · `thankyou`

## Download

> Check [Releases](https://github.com/ikevssy/huasMD/releases) for the latest builds.

| Platform | Format |
|----------|--------|
| macOS    | `.dmg` |
| Windows  | `.exe` |
| Linux    | `.AppImage` / `.deb` |

## How It Works

```
┌─────────────┐     writes     ┌──────────────┐
│  AI Agent   │ ──────────────▶│  .md file    │
│ (Claude,    │                │              │
│  Cursor...) │                └──────┬───────┘
└─────────────┘                       │
                              fs.watch detects
                                      │
                              ┌───────▼───────┐
                              │    huasMD     │
                              │  auto-refresh │
                              │   ✨ live!    │
                              └───────────────┘
```

1. Open any `.md` file in huasMD
2. Let your AI agent edit that file
3. Watch the content update in real-time — the indicator dot pulses orange while the agent writes

No configuration needed. It just works.

## What huasMD Does NOT Do

huasMD is intentionally simple:

- No file manager or workspace
- No cloud sync or collaboration
- No AI features built in — it's a **viewer/editor** for AI-generated content
- No plugin system

One thing, done well.

## Development

```bash
git clone https://github.com/ikevssy/huasMD.git
cd huasMD
npm install
npm run dev
```

### Build

```bash
npm run dist:mac
npm run dist:win
npm run dist:linux
```

### Tech Stack

- **Electron** — Cross-platform desktop
- **Milkdown** — WYSIWYG Markdown (ProseMirror-based)
- **TypeScript** — Strict mode
- **electron-vite** — Fast builds

## License

[MIT](LICENSE) — Free forever.

---

Forked from [marswave.ai/ColaMD](https://github.com/marswaveai/colamd).
