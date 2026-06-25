# Airselfy

A social photo/video request mobile app — users see nearby people on a map, tap to request a photo or video, both navigate via compass, and the fulfiller captures media that lands in the requester's album.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## EAS (Expo Application Services)

EAS handles native iOS/Android builds and store submissions. Run all `eas` commands from inside `artifacts/airselfy/`.

### One-time setup (per Expo account)

```bash
npm install -g eas-cli        # install EAS CLI globally
eas login                     # log in to your Expo account
cd artifacts/airselfy
eas init                      # links project → writes projectId into app.json
```

After `eas init`, commit the updated `app.json` (it will contain `extra.eas.projectId`).

### Build profiles (`eas.json`)

| Profile | Use case | Output |
|---|---|---|
| `development` | Dev client for local Expo Go replacement | iOS Simulator `.app` / Android `.apk` |
| `preview` | Internal distribution for testers | iOS `.ipa` (Ad Hoc) / Android `.apk` |
| `production` | App Store / Google Play submission | iOS `.ipa` / Android `.aab` |

### Common commands (run from `artifacts/airselfy/`)

```bash
# Development build — iOS Simulator
pnpm run eas:build:dev:ios

# Development build — Android device/emulator
pnpm run eas:build:dev:android

# Preview build (both platforms)
pnpm run eas:build:preview

# Production build (both platforms)
pnpm run eas:build:prod

# OTA update (JS-only, no store review needed)
pnpm run eas:update

# Submit to App Store / Google Play
pnpm run eas:submit:ios
pnpm run eas:submit:android
```

### App identifiers

- iOS bundle ID: `com.airselfy.app`
- Android package: `com.airselfy.app`

Change these in `app.json` (`ios.bundleIdentifier` / `android.package`) before running `eas init` if you want a different ID — the store registration is based on these values.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo SDK 56 / React Native 0.86.0 (new architecture enabled)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/airselfy/` — Expo mobile app
- `artifacts/airselfy/app/` — Expo Router screens
- `artifacts/airselfy/components/` — shared React Native components
- `artifacts/airselfy/constants/colors.ts` — global color palette (light mode)
- `artifacts/airselfy/eas.json` — EAS build profiles
- `artifacts/api-server/` — Express API server
- `lib/db/` — Drizzle schema (source of truth for DB)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contract)

## Architecture decisions

- Light mode only — `userInterfaceStyle: "light"` in `app.json`; `useColors()` hook always returns `colors.light`
- `expo-file-system/legacy` static imports in `album.tsx` and `camera.tsx` — required to avoid SDK 54 / Metro bundler version mismatch
- `react-native-maps` at `1.27.2` — do NOT add to `plugins` in `app.json`
- New Architecture (`newArchEnabled: true`) — enabled globally; all native modules must support it
- `expo-dev-client` included — required for EAS development builds (custom native dev client)

## Gotchas

- **Never run `pnpm dev` at the workspace root** — use `restart_workflow` or the individual `--filter` command
- **`react-native-maps`** must stay at `1.18.0` and must NOT appear in `app.json` plugins
- **`expo-file-system`** — import from `expo-file-system/legacy` (static), not the default export
- After `eas init`, commit `app.json` — the `projectId` written by EAS is required for subsequent builds

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
