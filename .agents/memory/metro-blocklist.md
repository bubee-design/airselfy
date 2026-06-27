---
name: Metro blockList for temp dirs
description: Why .local/skills/.tmp-* must be in Metro's blockList to prevent FallbackWatcher ENOENT crashes
---

# Metro FallbackWatcher ENOENT crashes

## The Rule
Always include `/[/\\]\.local[/\\]skills[/\\]\.tmp-/` in Metro's `resolver.blockList` (in `metro.config.js`).

**Why:** Metro's FallbackWatcher walks `watchFolders` (set to workspace root) and watches every directory it finds. Agent skill tools create short-lived temp directories under `.local/skills/.tmp-<id>/` and delete them after use. If Metro has already registered a watch on one of these dirs when it disappears, Node's `fs.watch` throws `ENOENT` and Metro crashes with `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`. The same issue applies to `stripe` / `stripe-replit-sync` (already blocked).

**How to apply:**
In `artifacts/airselfy/metro.config.js`, keep both patterns in the `blockedPaths` array:
```js
const blockedPaths = [
  /node_modules[/\\](stripe|stripe-replit-sync)[/\\]/,
  /[/\\]\.local[/\\]skills[/\\]\.tmp-/,
];
```
Merge with any existing `config.resolver.blockList` to avoid clobbering Expo's own exclusions.
