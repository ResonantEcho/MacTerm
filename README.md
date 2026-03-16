# MacTerm

A MobaXterm-inspired SSH/RDP/VNC connection manager for macOS, built with Electron + React.

![Status](https://img.shields.io/badge/status-Phase%201%20(UI%20%2B%20SSH%20shell)-green)

## Features (current)

- **Session sidebar** — grouped connection profiles with SSH / RDP / VNC badges
- **Tabbed sessions** — open multiple connections in parallel tabs
- **SSH terminal** — full xterm.js terminal emulator (real SSH coming in Phase 2)
- **SFTP file browser** — side panel alongside SSH sessions (real SFTP in Phase 2)
- **Credential vault** — locally encrypted password / SSH key storage
- **New connection modal** — with validation, protocol picker, port auto-fill

## Roadmap

| Phase | Goal |
|-------|------|
| ✅ 1 | UI scaffold, session manager, xterm terminal, vault |
| 🔜 2 | Real SSH via `ssh2`, live SFTP browser |
| 🔜 3 | RDP via FreeRDP subprocess, VNC via noVNC |
| 🔜 4 | Settings, themes, keyboard shortcuts, export/import |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 18 or later
- macOS (Windows/Linux work too but macOS styling is optimised for Darwin)

### Install & run

```bash
git clone https://github.com/YOUR_USERNAME/macterm.git
cd macterm
npm install
npm start
```

`npm start` launches both the React dev server (port 3000) and Electron simultaneously.

### Build a distributable `.dmg`

```bash
npm run build
```

Output lands in `dist/`.

## Project structure

```
macterm/
├── src/
│   ├── main/               # Electron main process
│   │   ├── index.js        # App window, IPC handlers, data store
│   │   └── preload.js      # Secure renderer ↔ main bridge
│   └── renderer/           # React frontend
│       ├── App.js           # Root component, tab & session state
│       ├── components/
│       │   ├── Sidebar/     # Connection list + groups
│       │   ├── TabBar/      # Session tabs
│       │   ├── Terminal/    # SSH session, xterm.js, placeholders
│       │   ├── FileBrowser/ # SFTP side panel
│       │   ├── Vault/       # Credential vault UI
│       │   └── Modals/      # New connection dialog
│       └── styles/          # Global CSS variables
├── public/
│   └── index.html
└── package.json
```

## Contributing

Pull requests welcome! Please open an issue first for large changes.

## License

MIT
