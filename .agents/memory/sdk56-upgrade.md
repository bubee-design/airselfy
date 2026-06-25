---
name: SDK 56 upgrade decisions
description: Key version pins, breaking changes, and peer dep quirks from the Expo SDK 54→56 migration
---

## Target versions

- `expo: ~56.0.12`, `react-native: 0.86.0`, `expo-router: ~56.2.11`
- `react-native-reanimated: ~4.5.0` — requires RN `0.83-0.86` AND `react-native-worklets: 0.10.x`
- `react-native-worklets: ~0.10.0` — breaking: 0.5.x → 0.10.0 for reanimated compat
- `react: 19.2.7`, `react-dom: 19.2.7` — workspace catalog must be bumped (RN 0.86 requires `^19.2.3`; was 19.1.0 for SDK 54)
- `react-native-maps: 1.27.2` — upgrade from 1.18.0; 1.18.0 incompatible with RN 0.86 native ABI
- `babel-plugin-react-compiler: ^1.0.0` — was `^19.0.0-beta-*` in SDK 54

**Why:** reanimated 4.5.0 is the only stable v4 release supporting RN 0.86; worklets 0.10.0 is its required companion. expo-modules-core@56 peer dep warns about worklets (wants `^0.7.4||^0.8.0`) but this is advisory — install succeeds and runtime works fine.

## Breaking code changes

1. **`StyleSheet.absoluteFillObject` removed in RN 0.86** → renamed to `StyleSheet.absoluteFill`
   - Affects: album.tsx, camera.tsx, compass.tsx, IncomingRequestModal.tsx, NativeMap.native.tsx, NativeMap.tsx
   - Fix: global `sed -i 's/StyleSheet\.absoluteFillObject/StyleSheet.absoluteFill/g'`

2. **`expo-router/unstable-native-tabs` dropped standalone `Icon` and `Label` exports**
   - Old: `import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs"`
   - New: `import { NativeTabs } from "expo-router/unstable-native-tabs"` — use `NativeTabs.Trigger.Icon` and `NativeTabs.Trigger.Label` as sub-components

## Peer dep warnings (safe to ignore)

- `expo-modules-core@56.0.17` wants `react-native-worklets@"^0.7.4 || ^0.8.0"` but 0.10.0 is installed — advisory only
- `@react-native/metro-config@0.86.0` missing peer — metro.config.js works without it

## Unchanged

- `expo-file-system/legacy` export still exists in SDK 56 — album.tsx and camera.tsx imports are safe
- `expo-router` file-based routing API is identical
- `expo-video` `useVideoPlayer` + `VideoView` API unchanged
- `expo-glass-effect` `isLiquidGlassAvailable()` API unchanged
