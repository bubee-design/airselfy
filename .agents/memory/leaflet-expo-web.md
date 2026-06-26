---
name: Leaflet on Expo web
description: How to add a real interactive map to Expo web (Metro bundler) using Leaflet without ESM issues
---

# Leaflet on Expo Web

## The Rule
Use `leaflet` (CJS) directly via a `View` ref. Do **not** use `react-leaflet` v5 — it is pure ESM (`"type":"module"`) and Metro may fail to transform it.

**Why:** `react-leaflet` v5 sets `"type":"module"` in its package.json and its lib files use bare `export` syntax. Metro's handling of pure-ESM packages is inconsistent. `leaflet` itself ships CJS (`dist/leaflet-src.js` as `main`, no `exports` field) and works fine.

**How to apply:**
1. Install `leaflet` + `@types/leaflet` only (no react-leaflet).
2. Inject Leaflet CSS from CDN at runtime — Metro can't bundle CSS, so use `document.createElement('link')` with `href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'` in a `useEffect`.
3. Attach the map to a React Native `View` ref: `const el = containerRef.current as unknown as HTMLElement`. In `react-native-web`, a `View` ref gives the underlying DOM `div` directly.
4. Call `L.map(el, { zoomControl: false })` inside a `setInterval` poll that waits for `el.offsetHeight > 0` (ensures the View has been laid out before Leaflet measures it).
5. Use `L.divIcon({ html: '...' })` for custom balloon markers — avoids the default icon path issue with bundlers.
6. Use `useNativeDriver: false` for all `Animated` values on web (native driver is unavailable).
