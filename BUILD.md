# Building MacTerm

## Quick build (local, unsigned)

```bash
npm install
npm run build:unsigned     # builds universal DMG, skips notarization
# Output: dist/MacTerm-0.5.0-universal.dmg
```

This produces a fully working DMG. macOS will show a Gatekeeper warning on first launch — right-click → Open to bypass it.

---

## Signed + notarized build (for distribution)

A notarized build is trusted by Gatekeeper with no warning. It requires an Apple Developer account ($99/year).

### Prerequisites

1. **Apple Developer account** — https://developer.apple.com
2. **Developer ID Application certificate** — download from Certificates in your account, export as `.p12`
3. **App-specific password** — generate at https://appleid.apple.com → Sign-In and Security → App-Specific Passwords

### One-time local setup

```bash
# 1. Install the certificate into your macOS Keychain
#    Double-click the .p12 file, enter your password

# 2. Set environment variables (add to ~/.zshrc or ~/.bash_profile)
export APPLE_ID="you@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"     # 10-char Team ID from developer.apple.com

# 3. Build
npm run build:mac
```

Output: `dist/MacTerm-0.5.0-universal.dmg` — signed and notarized.

---

## Architecture targets

| Command | Output |
|---|---|
| `npm run build:mac` | Universal (arm64 + x64, ~2× size) |
| `npm run build:mac:arm64` | Apple Silicon only |
| `npm run build:mac:x64` | Intel only |
| `npm run build:unsigned` | Universal, no signing/notarization |

---

## Automated CI builds (GitHub Actions)

Builds trigger automatically when you push a version tag:

```bash
git tag v0.5.0
git push origin v0.5.0
```

The workflow will:
1. Build a universal DMG
2. Sign it (if certificate secrets are set)
3. Notarize it (if Apple ID secrets are set)
4. Create a GitHub Release with the DMG attached

### Required GitHub Secrets

Go to: **GitHub repo → Settings → Secrets and variables → Actions**

| Secret | Value |
|---|---|
| `BUILD_CERTIFICATE_BASE64` | `base64 -i YourCert.p12 \| pbcopy` |
| `P12_PASSWORD` | Password for your .p12 file |
| `KEYCHAIN_PASSWORD` | Any random string |
| `APPLE_ID` | Your Apple ID email |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password from appleid.apple.com |
| `APPLE_TEAM_ID` | Your 10-char Team ID |

You can omit all Apple secrets for unsigned builds — the DMG will still be created and attached to the release, just without notarization.

---

## App icon

The build expects `assets/icon.icns`. Generate it from a 1024×1024 PNG:

```bash
# Place your icon at assets/icon-source.png, then:
npm run create-icns
```

This uses macOS built-in `sips` and `iconutil` — no extra tools needed.

For the DMG background image, place a 540×380 PNG at `assets/dmg-background.png`.

---

## DMG layout

The DMG window shows:
- Your app icon on the left (drag to install)
- An Applications folder shortcut on the right
- 540×380 window with optional custom background

All configured in `package.json` under `"build" → "dmg" → "contents"`.
