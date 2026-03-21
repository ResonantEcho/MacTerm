# MacTerm

> A MobaXterm-inspired SSH, RDP, and VNC connection manager for macOS — built with Electron and React.

![Version](https://img.shields.io/badge/version-0.5.0--beta.1-orange)
![Platform](https://img.shields.io/badge/platform-macOS-lightgrey)
![Status](https://img.shields.io/badge/status-public%20beta-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Why MacTerm?

MobaXterm is the gold standard for Windows users who need SSH, RDP, and VNC in a single app — but it has no macOS version. MacTerm fills that gap with a clean native-feeling UI, tabbed sessions, a live SFTP browser, and a built-in credential vault.

---

## Features

- **SSH** — Full xterm.js terminal, AES-256, SSH key and password auth, ssh-agent forwarding, auto-reconnect
- **SFTP** — Side-panel file browser alongside SSH, upload/download via native dialogs
- **VNC** — Live remote desktop via noVNC rendered inside the app window
- **RDP** — Via FreeRDP subprocess (install with `brew install freerdp`)
- **Tabbed sessions** — Multiple connections open simultaneously, `Cmd+1–9` to switch
- **Split panes** — `Cmd+D` to open any connection side-by-side, draggable divider
- **Command palette** — `Cmd+P` fuzzy search across all saved connections
- **Credential vault** — Locally encrypted password and SSH key storage
- **Import/Export** — MacTerm JSON, MobaXterm `.mobalink`, CSV
- **Themes** — Dark, Light, System (follows macOS appearance)
- **SSH port tunnels** — Per-profile local and remote port forwards
- **Settings panel** — Font, cursor, reconnect behavior, sidebar width, and more

### Keyboard shortcuts

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

## Quick start

```bash
git clone https://github.com/ResonantEcho/MacTerm.git
cd MacTerm
npm install
npm start
```

### Prerequisites

- **Node.js 18+** — install via [nodejs.org](https://nodejs.org) or `brew install node`
- **RDP only:** `brew install freerdp`

---

## Building a DMG

```bash
npm run build:unsigned    # local DMG, no Apple account needed
# Output: dist/MacTerm-0.5.0-universal.dmg
```

See [BUILD.md](BUILD.md) for signed/notarized builds and GitHub Actions CI setup.

---

## Roadmap

| Phase | Status | Description |
|---|---|---|
| 1 | ✅ | UI scaffold — sidebar, tabs, vault |
| 2 | ✅ | Real SSH + SFTP |
| 3 | ✅ | VNC + RDP |
| 4 | ✅ | Settings, shortcuts, command palette, import/export, auto-reconnect |
| 5 | ✅ | Themes, split panes, DMG pipeline |
| 6 | 🔜 | Session recording, Telnet, local terminal tab |
| 7 | 🔜 | Plugin system, SSH jump hosts |

---

## Tech stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron 28 |
| UI | React 18 |
| Terminal | xterm.js 6 |
| SSH / SFTP | ssh2 |
| VNC | @novnc/novnc + custom websockify proxy |
| RDP | FreeRDP (xfreerdp subprocess) |
| Storage | electron-store (AES-256 encrypted) |
| Build | electron-builder, universal binary (arm64 + x64) |

---

## Debugging notes

This section documents issues encountered during initial setup and their fixes. Useful if you're setting up from scratch or hit the same errors.

### 1. `@xterm/addon-fit` version not found

**Error:** `npm error notarget No matching version found for @xterm/addon-fit@^0.8.0`

**Cause:** The xterm.js packages were bumped to new major versions after the project was initially written.

**Fix:** Updated `package.json` to current versions:
```json
"@xterm/xterm": "^6.0.0",
"@xterm/addon-fit": "^0.11.0",
"@xterm/addon-web-links": "^0.12.0"
```

---

### 2. `react-vnc` peer dependency conflict

**Error:** `peer react@">=19.0.0" from react-vnc@3.2.0`

**Cause:** `react-vnc` v3.2.0 updated its peer dependency to require React 19, but MacTerm uses React 18.

**Fix:** Removed `react-vnc` entirely and replaced it with `@novnc/novnc` directly. `VNCSession.js` now dynamically imports `@novnc/novnc/core/rfb.js` and manages the RFB connection directly — which is exactly what `react-vnc` was doing internally anyway.

---

### 3. `concurrently: command not found`

**Error:** `sh: concurrently: command not found` when running `npm start`

**Cause:** `npm install` was failing before completing (due to the version errors above), so dev dependencies like `concurrently` were never installed.

**Fix:** Fixed the dependency versions first, then `npm install` completed successfully and `concurrently` was available.

---

### 4. `src/index.js` not found

**Error:** `Could not find a required file. Name: index.js. Searched in: /path/to/src`

**Cause:** `react-scripts` always looks for `src/index.js` as the entry point. Our project had the React entry point at `src/renderer/index.js` instead.

**Fix:** Created `src/index.js` at the root of `src/` that bootstraps React and imports from the renderer:
```js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './renderer/styles/global.css';
import App from './renderer/App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
```

---

### 5. `window.macterm.settings.get is not a function`

**Error:** Runtime error in browser — `_window$macterm.settings.get is not a function`

**Cause:** Two separate issues compounded each other:

**5a. Preload API mismatch** — The `preload.js` was exposing `settings.getAll` and `settings.reset` instead of `settings.get` and `settings.save`. So `window.macterm.settings.get` was `undefined`.

**Fix:** Rewrote `preload.js` to expose `settings.get` and `settings.save` matching what the app expected.

**5b. Main process handler mismatch** — The main process had `ipcMain.handle('settings:get-all', ...)` but the preload was invoking `settings:get`. After fixing the preload, the main process had no handler for `settings:get`.

**Fix:** Updated `src/main/index.js` to register `ipcMain.handle('settings:get', ...)` and `ipcMain.handle('settings:save', ...)` with the correct signatures.

---

### 6. Duplicate IPC handler registration

**Error:** `Error: Attempted to register a second handler for 'settings:get'`

**Cause:** During debugging, a `cat >>` command was used to append new handlers to `index.js`. After the main handlers were also fixed in place, both sets were present, causing Electron to throw on the duplicate.

**Fix:** Used Python to find and remove the appended duplicate block:
```bash
python3 -c "
import re
path = 'src/main/index.js'
with open(path) as f: c = f.read()
c = re.sub(r'\n// ── Settings IPC \(added fix\).*', '', c, flags=re.DOTALL)
with open(path, 'w') as f: f.write(c)
"
```

---

### 7. `cross-env` needed for Windows compatibility

**Cause:** `NODE_ENV=development electron .` is Unix-only syntax. On Windows PowerShell it fails silently.

**Fix:** Added `cross-env` as a dev dependency and updated scripts:
```json
"start:electron": "cross-env NODE_ENV=development electron ."
```

---

### 8. PowerShell execution policy

**Error:** `npm.ps1 cannot be loaded because running scripts is disabled on this system`

**Platform:** Windows PowerShell only.

**Fix:**
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Issues and PRs welcome.

## License

MIT — see [LICENSE](LICENSE).
