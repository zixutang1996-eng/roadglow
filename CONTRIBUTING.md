# Contributing

## Workflow
1. Branch from `main`: `git checkout -b <area>/<short-topic>` (e.g. `ios/capacitor-shell`, `ios/carplay-scene`).
2. Commit in small, focused commits with clear messages.
3. Push your branch and open a Pull Request into `main`. Don't push directly to `main`.
4. The repo owner reviews and merges. Files under `ios/` and `web/ios/` are owned by @95chang (see `.github/CODEOWNERS`).
5. Note in the PR what you tested and on which device/simulator — and what you didn't.

## Where things go
- `web/` — the shared web app (used by Android and iOS). Keep platform checks inside `web/src/native.js`.
- `web/android/` — Android Capacitor shell.
- `web/ios/` — iOS Capacitor shell (create with `npx cap add ios`), plus any native Swift plugins and the CarPlay scene.
- `ios/` (root) — legacy Flutter iOS folder; native iOS experiments may also live here. Coordinate before changing it.

Start with [docs/IOS_CARPLAY.md](docs/IOS_CARPLAY.md).

## Rules
- Never commit signing keys, certificates, provisioning profiles, passwords or tokens.
- Homage skins: no game assets, names, logos, trademarks or proprietary fonts. OFL/open fonts and original art only.
- Keep third-party attributions in `NOTICE.md` up to date when adding data sources.
- By contributing you agree your code is released under the MIT License (`LICENSE`).
