# Mosby's Files — Architectural Audit & Gap Analysis

**Date:** October 2026  
**Auditor:** Principal Frontend Engineer, Animation Specialist, & Reverse-Engineering Lead  
**Reference Targets:**
- Live Website: [https://www.mosbyfiles.com/](https://www.mosbyfiles.com/)
- Case Example: [https://www.mosbyfiles.com/cases/frank-lloyd-wright](https://www.mosbyfiles.com/cases/frank-lloyd-wright)
- Studio Case Study: [https://tubikstudio.com/works/mosbyfiles](https://tubikstudio.com/works/mosbyfiles)
**Inspection Tooling:** Reverse Engineer Anything (REA MCP), Chrome DevTools, Nuxt 3 Source Bundle Decompilation (`DwAQhwlc.js`, `DhJT0uft.js`, `Dk1ebuKD.js`, `_slug_.DoQEXokL.css`, `entry.DrEWdVXu.css`).

---

## 1. Executive Summary

The project aims to faithfully reproduce the high-end editorial and physical interaction of [Mosby's Files](https://www.mosbyfiles.com/) in a modern Next.js 16 (App Router) + React 19 + GSAP + Lenis architecture.

Our reverse-engineering of the live production site and Nuxt 3 bundles revealed that Mosby's signature dossier interaction relies on an authentic **two-panel physical folder spread**:
1. When closed on the Home Stack, the folder flap (`.case-folder__cover`) faces front with the category label and downward arrow.
2. When opened, the active folder glides up along a 3D flight trajectory while the flap unrolls around its left spine axis (`rotateY: 0deg -> -180deg`, `transform-origin: left`).
3. Swung open to the left, the reverse face (`.case-folder__cover__back`, rotated X 180° with `backface-visibility: hidden`) displays the folder's archival color and texture on the left panel, while the right panel (`.case-folder__inner`) holds the cream paper document sheet (`#fffcf9`), spine tags, and interactive draggable scrapbook items.
4. On closing, scrapbook items drop `y: 50vh`, the cover folds shut (`-180deg -> 0deg`), the folder docks into its stack slot with a counter-rotation flight arc, and only *after* docking do sibling stack groups slide up from `yPercent: 120 -> 0` (`stagger: 0.1, power4.out`).

In the local codebase, recent checkpoint commit `5427c6e` ("checkpoint single-panel reader view and tilt animation") left the two-panel folder spread in an incomplete intermediate state. The following audit details every discrepancy between the live reference and the current implementation across all dimensions.

---

## 2. Comprehensive Gap Analysis Table

| Area | Reference Behavior (Observed Evidence) | Current Implementation (Actual Code/UI) | Exact Discrepancy & Gap | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **Two-Panel Transformation** | Folder flap rotates `rotateY: 0 -> -180deg` with `transform-origin: left`, swinging out to the left of the spine to form the left panel of an authentic two-panel spread (`.case-folder__cover__back` with `transform: rotateX(180deg)`). Left and right panels sit flush along the central spine. | In [ReaderView.tsx](file:///Users/dakshhiran/Desktop/web-components/components/FolderStack/ReaderView.tsx) and [FolderStackAnimation.module.css](file:///Users/dakshhiran/Desktop/web-components/components/FolderStack/FolderStackAnimation.module.css), `.caseFolder` is constrained to single-panel layout; `.caseFolderCoverBack` lacks the exact `rotateX(180deg)` backface alignment and paper texture overlay, causing the left panel to feel disconnected or clipped on certain viewports. | Left panel geometry, backface orientation, and two-panel spread container alignment are not mathematically synchronized to the reference grid. | **High** |
| **Layout & Proportions** | Desktop (`min-width: 1025px`): `--case-content-width: calc((var(--container-size) - 19*1rem)*16/20 + 15rem)`, `--container-offset: 32px` (34px at 1440px, 48px at 1920px). The sheet has aspect ratio `210/297` (standard A4 ISO paper). | CSS in [FolderStackAnimation.module.css](file:///Users/dakshhiran/Desktop/web-components/components/FolderStack/FolderStackAnimation.module.css) defines arbitrary max-widths and approximate paddings without adhering strictly to the extracted breakpoint tokens. | Sheet width and folder container margins deviate by 24–40px from live reference, shifting the visual center of the document sheet. | **High** |
| **Folder Geometry & Depth** | 3D perspective is `3000px` (`--stack-perspective: 3000px`). Cover unrolls with dynamic shadow peaking at 0.25s–0.6s (`box-shadow: 0 0 250px rgba(0,0,0,0.5)`). Spine tags have a depth of `z-index: -1` peeking behind folder edge with rounded tabs. | Perspective and shadow exist, but shadow duration and easing curve are slightly off-peak; spine tags do not have the hover lift of `-10px` with shadow on active hover states. | Subtle micro-depth cues (shadow peak timing, spine tab hover lift) do not match Mosby's tactile feel. | **Medium** |
| **Opening Animation Sequence** | GSAP sequence: 1) Sibling folders drop `yPercent: 120, stagger: 0.08` at t=0. 2) Hero title & desc drop `y: 2rem, opacity: 0` at t=0.05. 3) Active folder lifts with mid-air tilt to `-22.6deg` at t=0, leveling flat at t=0.65. 4) Flap rotates `0 -> -180deg` (t=0 to 1.5s). 5) Case hero title characters reveal from `xPercent: -150` with stagger 0.025s at t=0.65. 6) Tags slide up at t=0.85. 7) Scrapbook drops in at t=1.0. | Implemented in [FolderStackAnimation.tsx](file:///Users/dakshhiran/Desktop/web-components/components/FolderStack/FolderStackAnimation.tsx), but has slight timing discrepancies in character masking, and opening does not smoothly interpolate slot delta when opening from scrolled stack states. | Opening from an arbitrary scroll position can cause a visual jump if `deltaY` is computed before scroll lock is engaged. | **High** |
| **Closing Animation Sequence** | GSAP sequence: 1) Scrapbook items drop `y: 50vh, opacity: 0` in 0.2s. 2) Cover folds `-180 -> 0deg` in 1.5s. 3) Viewport glides to `scrollY: 0` in lockstep. 4) Folder tilts in flight and docks into stack slot. 5) *Only after docking complete*, sibling groups slide up from `yPercent: 120 -> 0` (`stagger: 0.1, power4.out`). | Mostly implemented, but if the user was scrolled deeply down the case page, Lenis smooth scroll and folder reverse flight can desynchronize if `lock: true` is not asserted on Lenis. | Scroll desynchronization on closing from a scrolled dossier position. | **High** |
| **Continuous Next Architect Transition** | On reaching bottom of case page (within 100px threshold), wheel accumulation triggers overscroll up to 2000px, translating `.page-case__content` by `-5 * progress vh`. At 100%, 350ms delay fires route change. Current folder exits `y: -75vh`, next folder enters `y: 45vh -> 0` already unfolded (`rotateY: -180deg`). | Implemented in [ReaderView.tsx](file:///Users/dakshhiran/Desktop/web-components/components/FolderStack/ReaderView.tsx) and [FolderStackAnimation.tsx](file:///Users/dakshhiran/Desktop/web-components/components/FolderStack/FolderStackAnimation.tsx), but ESLint flags a cascading render error (`Calling setState synchronously within an effect` at line 118). | ESLint error and potential React 19 render cascade warning in production builds. | **Medium** |
| **Draggable Scrapbook Mechanics** | Draggable photos, notes, paperclips, postcards across 3 distinct historical clusters per architect with authentic coordinates, rotation, paper rustle sound, and z-index elevation on pointerdown. | Scrapbook items exist for Mary Colter and Louis Sullivan; other architects (Frank Lloyd Wright, Irving Gill, Frank Gehry, Louis Kahn, I. M. Pei, Paul Rudolph) have empty `scrapbookItems` arrays or fallback items. | Need rich, authentic scrapbook items for all 8 architects so every dossier is populated with archival artifacts. | **Medium** |
| **Typography & Visual Assets** | Typefaces: Editorial Serif (`Signifier`), Modernist Grotesk (`Founders Grotesk`), Monospace (`IBM Plex Mono`). Authentic 9 punch holes, wire paperclip, red archival stamp, grain overlays. | Fonts are declared via CSS variables, but fallback font stacks need verification to ensure no layout shift. Paperclip and punch hole SVGs are present but require exact dimension alignment. | Visual polish and font-family fallbacks across diverse platforms. | **Medium** |
| **Scroll Ownership & Lenis Lifecycle** | Single smooth-scroll controller (Lenis 1.3.x). When transitioning between Stack and Dossier, Lenis stops or locks, resizes after DOM shift, and resumes cleanly without competing document listeners. | Global `window.__lenis` exists, but lacks clean resize/destroy cleanup on unmount, leading to potential duplicate event listeners. | Conflicting scroll events between native window scroll and Lenis virtual scroll. | **High** |
| **Responsive & Accessibility** | On screens `<= 1024px`, layout switches to single column, `--case-content-width: calc(var(--container-size) - var(--tag-height))`, sheet inner becomes column. Full keyboard navigation and reduced-motion support. | Mobile styling is partially implemented; `prefers-reduced-motion` media queries are missing for the 3D flap rotation. | Accessibility compliance (WCAG 2.1 AA) and mobile layout fidelity. | **Medium** |

---

## 3. Discrepancy Breakdown by Component

### 3.1 `components/FolderStack/ReaderView.tsx`
- **Discrepancy 1:** ESLint hook warning at line 118: `setOverscrollAmount(0); setIsOverscroll(false);` called synchronously inside `useEffect([currentCase.slug])`. Needs refactoring to avoid cascading re-renders in React 19.
- **Discrepancy 2:** The folder cover container (`styles.caseFolderCover`) and back face (`styles.caseFolderCoverBack`) need exact CSS 3D backface properties to ensure the two-panel physical flap is completely visible and positioned flush with the cream sheet.
- **Discrepancy 3:** All 8 architects should have curated archival scrapbook items (photos, blueprints, index cards, sketches) with authentic coordinates and rotations, matching the rich experience of Mary Colter and Louis Sullivan.

### 3.2 `components/FolderStack/FolderStackAnimation.module.css`
- **Discrepancy 1:** Update CSS custom properties to match live tokens:
  - `--container-offset: 32px` (desktop), `34px` (1440px), `48px` (1920px), `30px` (tablet), `20px` (mobile).
  - `--container-size: calc(100vw - var(--container-offset) * 2)`.
  - `--case-content-width: calc((var(--container-size) - 19*1rem)*16/20 + 15rem)`.
  - `--stack-perspective: 3000px`.
- **Discrepancy 2:** Ensure `.caseFolderCoverBack` has:
  ```css
  background-color: var(--case-color);
  transform: rotateX(180deg);
  backface-visibility: hidden;
  ```
  with overlay `background: linear-gradient(90deg, #fff0, #ffffff0d)`.
- **Discrepancy 3:** Ensure `.caseFolderCoverShadow` has `box-shadow: 0 0 250px rgba(0, 0, 0, 0.5)`.
- **Discrepancy 4:** Ensure `.caseFolderInner` has `border-radius: 0 4px 4px 0` and proper left border/spine seam.

### 3.3 `components/FolderStack/FolderStackAnimation.tsx`
- **Discrepancy 1:** Opening timeline: Ensure scroll is locked (`lenis.stop()`) during the 1.5s flight, and `lenis.start()` is invoked immediately when `case-view` is entered.
- **Discrepancy 2:** Closing timeline: Ensure `lenis.scrollTo(0, { duration: 1.5, lock: true })` glides the page back to top in perfect synchronization with the folder folding shut.
- **Discrepancy 3:** Continuous Next Architect (`folder-next`): Ensure seamless slide-up and entry without any flash or flap re-rotation.

### 3.4 Scripts and Tooling
- ESLint configuration in `eslint.config.mjs` was checking `scripts/*.js` with TypeScript ESLint rules, generating 14 lint errors on NodeJS `require()` scripts. Adding `scripts/**` to ESLint `globalIgnores` will keep development scripts clean and allow `npm run lint` to pass cleanly.

---

## 4. Verification Methodologies

1. **Static Analysis & Build Verification:**
   - `npm run lint` must exit with 0 errors.
   - `npm run build` must compile cleanly in Turbopack without type errors.
2. **Visual & Motion Inspection:**
   - Chrome browser inspection of opening animation, physical two-panel layout, cover backface, cream sheet alignment, scrapbook drag, bottom overscroll next-case transition, and closing back to stack.
3. **Telemetry & Frame Comparison:**
   - Compare local motion trajectory with reference captures in `public/motion_reference/`.
