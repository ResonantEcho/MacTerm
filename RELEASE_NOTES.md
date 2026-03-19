# MacTerm 0.5.0-beta.1 🎉

First public beta release of MacTerm — a MobaXterm-inspired SSH, RDP, and VNC connection manager built for macOS.

---

## Download

| File | Description |
|---|---|
| `MacTerm-0.5.0-beta.1-universal.dmg` | **← Start here.** Universal installer (Apple Silicon + Intel) |
| `MacTerm-0.5.0-beta.1-universal.zip` | Zip archive (no installer) |

### Installation
1. Download the `.dmg` above
2. Open it and drag **MacTerm** to your Applications folder
3. On first launch macOS may show an "unverified developer" warning — **right-click the app → Open** to proceed

> This beta is unsigned. A notarized build will follow in a stable release.

---

## What's in this beta

Five development phases completed:

**Phase 1 — UI foundation**
Sidebar with grouped connections, tabbed sessions, xterm.js terminal, credential vault, new connection modal

**Phase 2 — Real SSH + SFTP**
Live SSH sessions via `ssh2`, interactive terminal I/O, SFTP file browser with upload/download/delete

**Phase 3 — VNC + RDP**
VNC rendered live inside the app via noVNC; RDP via FreeRDP subprocess with session log and install guide

**Phase 4 — Settings + Polish**
Settings panel, command palette (`Cmd+P`), import/export (JSON, MobaXterm, CSV), auto-reconnect with backoff, SSH port tunnels, full macOS menu bar

**Phase 5 — Themes + Split panes + DMG**
Light, dark, and system themes; split-pane sessions (`Cmd+D`); universal DMG build pipeline with GitHub Actions

---

## Known limitations (beta)

- **RDP requires FreeRDP** — install with `brew install freerdp`. The app guides you if it's not found.
- **Not notarized** — Gatekeeper will warn on first open. Right-click → Open to bypass.
- **No session recording yet** — planned for Phase 6.
- **Light theme** — functional but some edge cases in deeply nested components may still show dark colors. Please report any you find.
- **VNC performance** — depends heavily on network quality and server framerate; no adaptive quality yet.

---

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+T` | New connection |
| `Cmd+W` | Close tab |
| `Cmd+P` | Command palette |
| `Cmd+K` | Clear terminal |
| `Cmd+B` | Toggle SFTP browser |
| `Cmd+D` | Split pane |
| `Cmd+Shift+D` | Close split |
| `Cmd+,` | Settings |
| `Cmd+1–9` | Switch to tab N |

---

## Feedback

This is a beta — bugs are expected. Please open an issue with:
- macOS version + chip (Apple Silicon or Intel)
- Steps to reproduce
- Console output if relevant (View → Toggle Developer Tools → Console)

→ [Open an issue](https://github.com/ResonantEcho/MacTerm/issues/new/choose)

---

## Building from source

```bash
git clone https://github.com/ResonantEcho/MacTerm.git
cd MacTerm
npm install
npm start                  # development
npm run build:unsigned     # build DMG locally
```

See [BUILD.md](https://github.com/ResonantEcho/MacTerm/blob/main/BUILD.md) for the full build guide.
