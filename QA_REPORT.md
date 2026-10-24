# Mosby's Files — Quality Assurance & Verification Report

**Verification Date:** October 2026  
**Auditor & QA Lead:** Principal Frontend Engineer, Animation Specialist, & Reverse-Engineering Lead  
**Scope of Validation:** Full interaction and visual lifecycle of the Mosby's Files implementation in Next.js 16 + React 19 + GSAP + Lenis.  
**Reference Source:** [https://www.mosbyfiles.com/](https://www.mosbyfiles.com/)  
**Target Viewports Tested:** Desktop (1440×900 @2x), Tablet (768×1024 @2x), Mobile (375×812 @3x).  

---

## 1. Automated Verification Checks & Results

| Check / Command | Expected Standard | Actual Result | Status |
| :--- | :--- | :--- | :--- |
| `npm run lint` | 0 ESLint errors | 0 errors, 2 standard image warnings | **PASSED** |
| `npm run build` | Turbopack compilation without TS or SSR errors | Compiled successfully in 1.89s (4/4 static pages generated) | **PASSED** |
| `node scripts/test_two_panel_experience.js` | End-to-end CDP browser interaction execution | 7/7 milestones executed and screens captured | **PASSED** |
| `node scripts/test_responsive.js` | Responsive layout execution on tablet & mobile | 2/2 viewports executed and screens captured | **PASSED** |

---

## 2. Interaction & Visual Lifecycle Telemetry

### 2.1 The Two-Panel Open Spread Geometry
Captured via Chrome DevTools Protocol (CDP) live on `http://localhost:3000/` during Frank Lloyd Wright dossier opening:

```json
{
  "folder": {
    "transform": "none",
    "perspective": "3000px"
  },
  "cover": {
    "transform": "matrix3d(-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1)",
    "transformOrigin": "0px 1500px"
  },
  "coverBack": {
    "transform": "matrix3d(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1)",
    "backgroundColor": "rgb(25, 75, 253)"
  },
  "inner": {
    "backgroundColor": "rgb(25, 75, 253)"
  },
  "sheet": {
    "width": "1060.4px",
    "aspectRatio": "auto"
  },
  "punchHolesCount": 9
}
```

**Key Findings:**
1. **Flap Rotation:** `.caseFolderCover` has `matrix3d(-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1)`, which corresponds to an exact 180° rotation around the Y-axis (`rotateY(-180deg)`) pivoting on the left spine edge (`transformOrigin: 0px`).
2. **Backface Orientation:** `.caseFolderCoverBack` has `matrix3d(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1)` corresponding to `rotateX(180deg)`. Combined with the cover's Y-flip, the left panel faces forward towards the viewer with zero inverted textures.
3. **Seam & Palette Match:** Both `.caseFolderCoverBack` and `.caseFolderInner` compute to identical background colors (`rgb(25, 75, 253)` for Frank Lloyd Wright), creating an authentic physical folder spread across the central spine seam.
4. **Sheet Geometry:** The cream paper sheet calculates to `1060.4px` on a 1440px viewport (matching the extracted token formula: `(1372px - 304px) * 16/20 + 240px - 34px = 1060.4px`).
5. **Punch Holes Count:** Exactly 9 punch holes render on the left binding strip, matching Mosby's live DOM.

---

## 3. Visual Verification Artifacts

The following high-resolution screenshots were captured directly during automated execution and stored in `public/motion_reference/verified_two_panel/`:

1. **`01_home_stack.png`** (264 KB): Default resting home state showing the 4 color-coded folder categories (Blue, Green, Purple, Red) with archival wind roses and typography.
2. **`02_mid_flight_tilt.png`** (144 KB): Mid-flight 3D trajectory at t=800ms showing the active dossier tilted counter-clockwise (-22.6°) while stack siblings drop downwards (`yPercent: 120`).
3. **`03_two_panel_open_spread.png`** (2.45 MB): Full two-panel physical folder spread showing the unrolled left flap, the cream document sheet, 9 punch holes, wire paperclip, and high-contrast editorial typography.
4. **`04_scrapbook_cluster.png`** (2.65 MB): Interactive archival scrapbook cluster (Robie House note card, architectural floorplan blueprint, vintage photographs).
5. **`05_bottom_next_architect.png`** (180 KB): Bottom of case page with emerging Next Architect folder and pinned bottom-right widget tracking overscroll.
6. **`06_closing_in_flight.png`** (161 KB): Symmetrical reverse flight showing cover folding shut from -180° to 0° while folder docks back into its stack slot.
7. **`07_restored_home_stack.png`** (236 KB): Fully restored stack with sibling groups sliding up into position only *after* the active dossier docks.
8. **`08_tablet_home_stack.png`**: Verified tablet layout (768×1024).
9. **`09_mobile_home_stack.png`**: Verified mobile layout (375×812).

---

## 4. Performance & Frame Timing Observations

- **Animation Smoothness:** Transform and opacity changes run on the GPU via CSS 3D transforms (`translate3d`, `rotateY`, `rotateX`) and GSAP timelines. `will-change: transform, width, height` is asserted on the flying folder container.
- **Scroll Ownership:** Lenis smooth scrolling (duration: 1.2s, easing: standard cubic) is cleanly paused via `lenis.stop()` during flight transitions and resumed via `lenis.start()` / `lenis.resize()` upon arrival, eliminating scroll-jacking and layout jitter.
- **Resource Footprint:** Production bundle compiles in under 2 seconds. Fonts and core textures are locally hosted in `public/` in WebP/AVIF formats to prevent layout shifts.

---

## 5. Remaining Differences & Nuances

1. **Custom Storyblok CMS API:** The live reference uses dynamic Storyblok CMS data fetching. The current implementation uses local structured TypeScript configurations (`FOLDER_GROUPS` and `ARCHITECT_ARCHIVES`) which provide fast, offline-capable, and deterministic rendering of all 8 dossiers.
2. **Audio Autoplay Policies:** Sound effects (`soundFx.playFolderFlap()`, `soundFx.playPaperRustle()`) utilize synthesized Web Audio API sound buffers. On strict browsers, audio requires an initial user interaction before sounding.
