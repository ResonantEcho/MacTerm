# MacTerm

> A MobaXterm-inspired SSH, RDP, and VNC connection manager for macOS — built with Electron and React.

![Version](https://img.shields.io/badge/version-0.5.0--beta.1-orange)
![Platform](https://img.shields.io/badge/platform-macOS-lightgrey)
![Status](https://img.shields.io/badge/status-public%20beta-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Why MacTerm?

MobaXterm is the gold standard for Windows users who need SSH, RDP, and VNC in a single app — but it has no macOS version. Existing Mac alternatives either do one protocol well or feel like ports from another era. MacTerm is built ground-up for macOS with a clean dark UI, tabbed sessions, a live SFTP browser, and a built-in credential vault.

---

## Screenshots

> Beta screenshots — UI is functional and mostly final.

| Session Manager | SSH + SFTP | Settings |
|---|---|---|
| _(sidebar with grouped connections)_ | _(xterm.js terminal with SFTP panel)_ | _(light/dark/system theme picker)_ |

---

## Features

### Protocols
- **SSH** — Full xterm.js terminal, AES-256 encryption, SSH key and password auth, ssh-agent forwarding
- **SFTP** — Side-panel file browser alongside SSH sessions, upload/download via native dialogs, new folder, delete
- **VNC** — Live remote desktop rendered inside the app using noVNC, scale/view-only/Ctrl+Alt+Del controls
- **RDP** — Connects via FreeRDP (Homebrew), opens a native macOS window, full session log

### Session Management
- Tabbed interface — multiple sessions open simultaneously, `Cmd+1–9` to switch
- Sidebar with collapsible groups (Production, Staging, Local VMs, etc.)
- Right-click context menu on any connection
- Split panes — `Cmd+D` to open any connection side-by-side with the current one, draggable divider

### Credential Vault
- Locally encrypted storage for passwords and SSH key paths
- Vault credentials can be linked directly to connection profiles
- Copy password to clipboard with one click

### Import / Export
- Export connections to JSON
- Import from MacTerm JSON, MobaXterm `.mobalink` files, or CSV
- Preview dialog before confirming import

### Settings
- Terminal font family, size, line height, cursor style, scrollback
- **Themes** — Dark, Light, or System (follows macOS appearance automatically)
- Auto-reconnect on dropped SSH sessions with configurable backoff
- Per-profile SSH port tunnels (local and remote forwards)
- Default protocol, keep-alive interval, sidebar width

### Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| `Cmd+T` | New connection |
| `Cmd+W` | Close tab |
| `Cmd+P` | Command palette (fuzzy search connections) |
| `Cmd+K` | Clear terminal |
| `Cmd+B` | Toggle SFTP browser |
| `Cmd+D` | Split pane |
| `Cmd+Shift+D` | Close split |
| `Cmd+,` | Settings |
| `Cmd+1–9` | Switch to tab N |

---

## Installation

### Beta (pre-release)

Download the latest DMG from the [Releases](https://github.com/ResonantEcho/MacTerm/releases) page.

1. Download `MacTerm-0.5.0-beta.1-universal.dmg`
2. Open the DMG and drag **MacTerm** to your Applications folder
3. On first launch, macOS may show an "unverified developer" warning — right-click the app and choose **Open** to proceed

> The beta is unsigned. A notarized release will follow once out of beta.

### RDP prerequisite

RDP sessions require FreeRDP. Install it with Homebrew:

```bash
brew install freerdp
```

MacTerm will detect whether it's installed and show an install guide if not.

---

## Building from source

```bash
git clone https://github.com/ResonantEcho/MacTerm.git
cd MacTerm
npm install
npm start          # development mode
```

To build a DMG:

```bash
npm run build:unsigned    # no Apple signing required
# Output: dist/MacTerm-0.5.0-universal.dmg
```

See [BUILD.md](BUILD.md) for the full guide including signed/notarized builds and GitHub Actions CI.

---

## Project structure

```
MacTerm/
├── src/
│   ├── main/                     Electron main process
│   │   ├── index.js              Window, IPC handlers, app menu
│   │   ├── preload.js            Secure renderer ↔ main bridge
│   │   ├── sshManager.js        SSH + SFTP sessions (ssh2)
│   │   ├── vncManager.js        WebSocket proxy for VNC (noVNC)
│   │   ├── rdpManager.js        FreeRDP subprocess manager
│   │   ├── settingsManager.js   Persistent settings store
│   │   └── importExport.js      JSON / MobaXterm / CSV import-export
│   └── renderer/                 React frontend
│       ├── App.js                Root: tabs, sessions, theme, shortcuts
│       ├── hooks/                useTheme, useSettings, useAutoReconnect
│       ├── styles/               global.css, themes.css (dark/light/system)
│       └── components/
│           ├── Sidebar/          Connection list + groups
│           ├── TabBar/           Session tabs
│           ├── Terminal/         SSH, VNC, RDP, SplitPane
│           ├── FileBrowser/      Live SFTP panel
│           ├── Vault/            Credential manager
│           ├── CommandPalette/   Cmd+P fuzzy search
│           └── Settings/         Settings panel + ThemePicker
├── assets/                       Icons, entitlements
├── scripts/                      notarize.js, create-icns.sh
└── .github/workflows/            CI build + release automation
```

---

## Roadmap

| Phase | Status | Description |
|---|---|---|
| 1 | ✅ Complete | UI scaffold — sidebar, tabs, session manager, vault |
| 2 | ✅ Complete | Real SSH via `ssh2`, live SFTP browser |
| 3 | ✅ Complete | VNC via noVNC/websockify, RDP via FreeRDP |
| 4 | ✅ Complete | Settings, keyboard shortcuts, command palette, import/export, auto-reconnect, SSH tunnels |
| 5 | ✅ Complete | Light/dark/system themes, split panes, DMG build pipeline |
| 6 | 🔜 Planned | Session recording & playback, Telnet, local terminal tab |
| 7 | 🔜 Planned | Plugin system, custom themes, SSH jump hosts |

---

## Contributing

Issues and pull requests are welcome. Please open an issue first for large changes so we can discuss the approach.

```bash
# Fork the repo, then:
git clone https://github.com/YOUR_USERNAME/MacTerm.git
cd MacTerm
npm install
npm start
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron 28 |
| UI framework | React 18 |
| Terminal emulator | xterm.js 5 |
| SSH / SFTP | ssh2 |
| VNC | react-vnc (noVNC) + custom websockify proxy |
| RDP | FreeRDP (xfreerdp subprocess) |
| Data store | electron-store (AES-256 encrypted) |
| Build & packaging | electron-builder, universal binary (arm64 + x64) |

---

## License

MIT — see [LICENSE](LICENSE) for details.
