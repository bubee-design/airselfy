---
name: Expo react-native-maps web bundling
description: Why react-native-maps must be imported from components/, not app/, in Expo Router projects
---

# react-native-maps + Expo Router web bundling

## The Rule
Never import `react-native-maps` from any file inside `app/` — even `.native.tsx` platform-specific route files. Always put the import in `components/`.

**Why:** Expo Router uses `require.context` to scan the entire `app/` directory for all platform variants including `.native.tsx` files. Metro's web bundler picks up these files and tries to resolve `react-native-maps`, which imports `react-native/Libraries/Utilities/codegenNativeCommands` — a native-only internal that crashes the web bundle.

**How to apply:** 
- Create `components/NativeMap.native.tsx` (with react-native-maps) and `components/NativeMap.tsx` (web fallback grid)
- Have the route file `app/(tabs)/map.tsx` import `@/components/NativeMap` — Metro resolves the correct platform file at import time, and `require.context` never touches `components/`
- Same pattern applies to any library that imports react-native internals (codegenNativeCommands, etc.)
