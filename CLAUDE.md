# Body Steward (repo: Playground)

React Native app built with Expo SDK 52 (TypeScript). "Steward" is a body-stewardship
coach: meal logging, workouts, morning briefings, HealthKit context. iOS-first.

The `ios/` and `android/` directories are gitignored — native projects are generated
by Expo prebuild (CNG). Never commit native project files; configure native behavior
through `app.json` and config plugins only.

## Commands

- `npm install` — install dependencies
- `npx tsc --noEmit` — typecheck (run this after every change)
- `npx jest` — unit tests for pure logic in `src/`
- There is no simulator available in cloud sessions. Verification = typecheck + jest +
  careful reading. Prefer extracting logic into pure, testable functions in `src/` and
  adding Jest coverage for anything non-trivial you change.

## Delivery pipeline (important)

Merging to `main` triggers a GitHub Action that publishes an OTA update via
`eas update --channel production`. Micah's phone runs a build on the `production`
channel and picks the change up on next app launch.

Consequences:

- JS/TS-only changes ship automatically on merge. This is the normal path.
- **Native-affecting changes do NOT ship OTA.** Adding/upgrading packages with native
  code, editing `app.json` plugins/permissions, or changing `runtimeVersion` requires a
  new device build (see Device deployment below). If a task requires this, say so
  explicitly in the PR description ("⚠️ requires new build") rather than silently merging.
- `runtimeVersion` policy is `appVersion`: bump `expo.version` only when shipping a new
  native build, never for OTA-only changes.
- `metro.config.js` stubs `node:*` imports to empty modules — required because
  `@anthropic-ai/sdk` ≥0.60 references `node:fs`/`node:path`/`node:buffer` in credential
  code that never runs here. Removing it breaks both the OTA publish and device builds.

## Device deployment (free-signing path, as of July 6, 2026)

There is deliberately **no paid Apple Developer account** (cost-cutting). The phone
build is a cable install signed with Micah's free personal team:

- On the Mac mini: repo lives at `/Users/micahphenix/Playground`. Rebuild =
  `git pull && npx expo run:ios --configuration Release --device` (phone plugged in,
  unlocked, Developer Mode on).
- Free signing expires after **7 days** — the app shows "Steward Not Available" and
  needs the cable rebuild. OTA covers all JS changes in between, so this is the only
  reason to touch the cable.
- **Installing over the existing app preserves all data** (AsyncStorage + Documents).
  Never advise deleting the app — that wipes everything Steward knows.
- `updates.requestHeaders["expo-channel-name"]` in app.json pins local builds to the
  production channel; without it cable builds never receive OTA updates.
- "Steward Not Available" causes, in order of likelihood: 7-day signing expiry (rebuild),
  untrusted developer cert (Settings → General → VPN & Device Management → Trust),
  Developer Mode off (Settings → Privacy & Security).
- CI has a dormant `EAS Build (iOS)` workflow_dispatch workflow — it needs a paid Apple
  account to produce builds. Micah is non-technical at the terminal: give one command at
  a time, no placeholder paths, no inline `#` comments containing quotes (zsh eats them).

## Status (July 6, 2026)

v0.1 is installed and live on Micah's iPhone; the **14-day real-data validation window
started July 6**. Friction reports from daily use are the product backlog. Next queued:
pin the 50-mile ride date in-app, then WP17 real HealthKit (⚠️ native build), WP20
Notion memory exporter. Models: `claude-sonnet-5` (thinking disabled) for extraction
paths, `claude-opus-4-8` for synthesis — see `src/ai/coach.ts`.

## Conventions

- State/business logic lives in `src/`; keep components lean.
- Keep the app fully functional offline-first; degrade gracefully when APIs are absent.
