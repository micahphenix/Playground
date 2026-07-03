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
  new EAS build + install on device. If a task requires this, say so explicitly in the
  PR description ("⚠️ requires new build") rather than silently merging.
- `runtimeVersion` policy is `appVersion`: bump `expo.version` only when shipping a new
  native build, never for OTA-only changes.

## Conventions

- State/business logic lives in `src/`; keep components lean.
- Keep the app fully functional offline-first; degrade gracefully when APIs are absent.
