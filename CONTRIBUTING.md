# Contributing to MacTerm

Thanks for your interest in contributing! Here's everything you need to get started.

## Development setup

```bash
git clone https://github.com/ResonantEcho/MacTerm.git
cd MacTerm
npm install
npm start
```

`npm start` launches the React dev server on port 3000 and Electron simultaneously. Hot reload works for renderer changes. Main process changes require restarting Electron (`Ctrl+C` then `npm start` again).

## Project layout

| Path | What lives here |
|---|---|
| `src/main/` | Electron main process — IPC handlers, SSH/VNC/RDP managers, settings |
| `src/renderer/` | React app — components, hooks, styles |
| `src/renderer/components/Terminal/` | Protocol-specific session components |
| `src/renderer/hooks/` | `useTheme`, `useSettings`, `useAutoReconnect` |
| `assets/` | App icon, entitlements |
| `scripts/` | Build helpers |

## Branching

- `main` — stable, always matches the latest release
- `dev` — integration branch, open PRs against this
- `feature/your-feature-name` — feature branches

## Pull requests

1. Fork the repo and create a branch from `dev`
2. Make your changes with clear, focused commits
3. Run `npm test` if adding logic (tests are sparse right now — adding them is welcome!)
4. Open a PR against `dev` with a clear description of what changed and why

## Reporting bugs

Open an issue with:
- macOS version
- MacTerm version
- Steps to reproduce
- What you expected vs what happened
- Console output if relevant (View → Toggle Developer Tools)

## Feature requests

Open an issue tagged `enhancement`. The roadmap lives in README.md — items already on it are planned; feel free to express interest or offer to implement them.

## Code style

- 2-space indentation
- No semicolons (the codebase uses ASI)
- Prefer named exports for components
- CSS files live alongside their component (co-located)
- New CSS variables go in `themes.css` — never hardcode colors

## Questions

Open a Discussion on GitHub — Issues are for bugs and features.
