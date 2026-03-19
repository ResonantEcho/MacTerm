# Changelog

All notable changes to MacTerm are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.5.0-beta.1] — 2026-03-19

First public beta release. All five development phases are complete.

### Added
- **Light theme** — full redesign of all UI colors for light mode
- **Dark theme** — refined dark palette (default)
- **System theme** — automatically follows macOS Light/Dark appearance setting, switches live with no restart
- **Theme picker** — visual card UI in Settings → Appearance with mini SVG app previews
- **Split panes** — open any two sessions side by side with `Cmd+D`; drag the divider to resize; `Cmd+Shift+D` or the × button to close the split
- **Split direction** — horizontal (side-by-side) or vertical (top/bottom) layouts
- **Connection picker** for split — fuzzy search your saved connections inline when opening a split
- **Universal DMG build** — single binary for Apple Silicon (arm64) and Intel (x64)
- **`npm run build:unsigned`** — one-command local DMG with no Apple account required
- **`npm run build:mac`** — signed + notarized DMG for Gatekeeper-trusted distribution
- **GitHub Actions workflow** — automatic build and GitHub Release on `git tag v*` push
- **`scripts/notarize.js`** — Apple notarization hook wired into electron-builder `afterSign`
- **`scripts/create-icns.sh`** — converts any 1024×1024 PNG to a proper `.icns` bundle
- **`assets/entitlements.mac.plist`** — hardened runtime entitlements for Electron + network + keychain
- **BUILD.md** — complete guide for local builds, CI setup, and Apple signing

### Changed
- `global.css` now imports `themes.css`; all hardcoded color values replaced with CSS custom properties
- `TerminalPane` now routes SSH/VNC/RDP and manages split state
- `App.js` wired to `useTheme` hook; theme changes propagate instantly across all components
- `package.json` bumped to `0.5.0`, added `@electron/notarize` dev dependency

---

## [0.4.0] — Phase 4

### Added
- **Settings panel** (`Cmd+,`) — terminal font/size/cursor, connection defaults, sidebar width, all persisted via `electron-store`
- **`settingsManager.js`** — main-process settings store with deep-merge defaults
- **Command palette** (`Cmd+P`) — fuzzy search across all saved connections with highlight, keyboard navigation, instant open
- **Import connections** — from MacTerm JSON, MobaXterm `.mobalink` (XML), or CSV; preview dialog before confirming
- **Export connections** — saves profiles to a timestamped JSON file; passwords are never exported
- **`importExport.js`** — full parser for all three import formats
- **Auto-reconnect** — detects dropped SSH sessions and reconnects with exponential backoff (3s → 6s → 12s…); configurable retries
- **`useAutoReconnect` hook** — arms/disarms per session, fires reconnect logic with proper cleanup
- **SSH port tunnels** — per-profile local and remote port forwards, managed in Settings → Tunnels tab
- **macOS application menu** — File / Edit / View / Window with full keyboard shortcuts
- **`Cmd+1–9`** — switch directly to any open tab
- **`Cmd+K`** — clear terminal
- **`Cmd+B`** — toggle SFTP browser
- **`ui:*` IPC events** — main process menu actions bridge to renderer via preload

### Changed
- `SSHSession` respects terminal settings (font, size, cursor style, copy-on-select, scrollback)
- `SSHSession` listens for `macterm:clear-terminal` and `macterm:toggle-sftp` custom DOM events
- `NewConnectionModal` default protocol now comes from settings

---

## [0.3.0] — Phase 3

### Added
- **VNC sessions** — live remote desktop rendered inside the app window using `react-vnc` (noVNC)
- **`vncManager.js`** — pure Node.js WebSocket-to-TCP proxy (websockify); one proxy per VNC session on a free port in the 59000–59099 range
- **VNC toolbar** — scale viewport, view-only toggle, Ctrl+Alt+Del, reconnect button
- **RDP sessions** — spawns `xfreerdp` (FreeRDP) as a native subprocess; opens a macOS window
- **`rdpManager.js`** — detects FreeRDP binary across Homebrew paths, builds `xfreerdp` argument list, streams stdout/stderr back to renderer
- **RDP not-installed screen** — friendly UI with `brew install freerdp` command and a re-check button
- **RDP session log** — live console showing FreeRDP output with colour-coded error/warn/info lines
- **`vnc:start` / `vnc:stop` IPC handlers**
- **`rdp:start` / `rdp:stop` / `rdp:detect` IPC handlers**
- **`ws` dependency** — pure-JS WebSocket server used by vncManager
- **`react-vnc` dependency** — React wrapper around noVNC

### Changed
- `TerminalPane` now routes SSH → `SSHSession`, VNC → `VNCSession`, RDP → `RDPSession`
- `preload.js` exposes `window.macterm.vnc` and `window.macterm.rdp`
- `main/index.js` cleans up all VNC proxies and RDP processes on app quit

---

## [0.2.0] — Phase 2

### Added
- **Real SSH connections** via the `ssh2` npm package running in the Electron main process
- **`sshManager.js`** — manages active SSH shell streams and SFTP sessions by session ID
- **Live terminal I/O** — keystrokes stream from xterm.js → IPC → ssh2 → remote server; output streams back in real time
- **Terminal resize** — `onResize` event syncs the remote PTY dimensions
- **SFTP file browser** — `readdir`, download (native save dialog), upload (native open dialog), `mkdir`, delete
- **Auth methods** — SSH key (reads `~/.ssh/id_rsa` or falls back to ssh-agent), password, vault credential reference
- **`ssh:connect` / `ssh:data` / `ssh:resize` / `ssh:disconnect` IPC handlers**
- **`sftp:readdir` / `sftp:download` / `sftp:upload` / `sftp:mkdir` / `sftp:delete` IPC handlers**
- **`NewConnectionModal`** updated with SSH key path field, password show/hide, vault credential picker

### Changed
- `SSHSession` replaced demo echo mode with real IPC-driven terminal
- `FileBrowser` replaced mock files with live `sftp.readdir` results; navigation, upload/download, delete, inline new-folder input
- `preload.js` exposes `window.macterm.ssh` and `window.macterm.sftp`

---

## [0.1.0] — Phase 1

### Added
- **Electron + React scaffold** — main process, preload bridge, React renderer
- **Sidebar** — grouped connection profiles, collapsible groups, search filter, right-click context menu, add/delete
- **Tab bar** — multi-session tabs with close buttons, `+` for new connection
- **xterm.js terminal** — full terminal emulator with custom dark theme, WebLinks addon, FitAddon for resize
- **Session routing** — `TerminalPane` dispatches SSH / RDP / VNC / SFTP to the correct component
- **`PlaceholderSession`** — friendly "coming soon" pane for RDP and VNC before Phase 3
- **SFTP side panel** — mock file tree alongside SSH sessions (real SFTP wired in Phase 2)
- **Credential vault** — locally encrypted add/edit/delete/copy for passwords and SSH key paths
- **`NewConnectionModal`** — protocol picker (SSH/RDP/VNC/SFTP), form validation, port auto-fill
- **`WelcomePane`** — shown when no sessions are open
- **`electron-store`** — encrypted local persistence for profiles and vault
- **Default connection profiles** — five sample entries across Production and Staging groups
- **`macOS titleBarStyle: hiddenInset`** — native traffic lights with custom sidebar spacer
