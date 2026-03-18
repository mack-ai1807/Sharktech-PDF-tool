# SharkView — Free PDF Viewer by SharkTech Global

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)
![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202.0-orange)

> Lightning-fast, zero-watermark PDF viewer. No subscriptions. No bloat. Just pure PDF performance.

---

## Features

- 📄 **Open & view PDFs** — drag-and-drop or `Ctrl+O`
- 🖊️ **Annotations** — highlight, underline, strikethrough, freehand draw, sticky notes
- ✍️ **Digital signatures** — draw or type signatures, place on any page
- 🔍 **Search** — full-text search across all pages
- 📑 **Page management** — merge, split, reorder pages
- 🌙 **Dark mode** — easy on the eyes
- ⌨️ **Keyboard shortcuts** — `?` for cheatsheet
- 💾 **Save & export** — save with annotations, export PDF
- 🔄 **Auto-updater** — stay current automatically

---

## Getting Started

### Prerequisites

| Tool | Version | Required for |
|------|---------|-------------|
| [Node.js](https://nodejs.org) | 20+ | Frontend dev |
| [Rust](https://rustup.rs) | stable | Tauri native build only |
| Xcode CLT | latest | macOS native build only |

### Run in Web Mode (no Rust needed)

```bash
git clone https://github.com/mack-ai1807/Sharktech-PDF-tool
cd Sharktech-PDF-tool
npm install
npm run dev
```

Open → [http://localhost:1420](http://localhost:1420)

### Run as Native Desktop App (requires Rust)

```bash
npm run tauri dev
```

### Build for Production

```bash
# Web bundle (dist/)
npm run build

# Native installer (.dmg / .msi / .AppImage)
npm run tauri build
```

---

## Project Structure

```
src/
  components/       React components (Toolbar, Viewer, annotations, signatures)
  hooks/            Custom hooks (useSaveAnnotations, useKeyboardShortcuts, ...)
  lib/              Core logic (pdf-export, file-validation, tauriBridge)
  store/            Zustand state (viewer, UI, annotations, PDF)
  types/            TypeScript declarations
src-tauri/          Rust backend (Tauri commands, file I/O)
tests/              Playwright E2E tests
```

---

## Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server at :1420 |
| `npm run build` | Build web bundle to `dist/` |
| `npm test` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format |
| `npm run tauri dev` | Start native Tauri app |
| `npm run tauri build` | Build native installer |

---

## Team Testing

| Method | Steps | Best for |
|--------|-------|---------|
| **Web** | Clone → `npm install` → `npm run dev` → open :1420 | Developers |
| **Native** | Clone → install Rust → `npm run tauri dev` | Full native testing |
| **DMG** | Download from Releases → double-click | macOS non-dev testers |

> **Note:** When installing the unsigned DMG, macOS Gatekeeper will warn you. Right-click → Open to bypass.

---

## Contributing

1. Fork the repo
2. Create your branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feat/my-feature`
5. Open a Pull Request

CI runs automatically on all PRs (TypeScript check, lint, unit tests, E2E).

---

## License

MIT © 2026 SharkTech Global
