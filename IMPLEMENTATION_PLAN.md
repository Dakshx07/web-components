# Mosby's Files — Implementation Plan

**Objective:** Complete the faithful, production-grade realization of the Mosby's Files interaction and visual experience, bringing the two-panel folder spread, dimensional interpolation, GSAP animation lifecycles, and Lenis scroll integration to parity with [mosbyfiles.com](https://www.mosbyfiles.com/).

---

## 1. Technical Architecture & Component Responsibilities

The existing Next.js App Router architecture is preserved:
- **`FolderStackAnimation.tsx` (State Machine & Animation Controller):**
  - Manages primary states: `"stack"` ➔ `"unfolding"` ➔ `"case-view"` ➔ `"closing-to-stack"`.
  - Coordinates GSAP timelines for:
    - `tlEnter` (symmetrical folder open: stack siblings drop, active folder glides with tilt arc, cover rotates `0 -> -180deg`, chars reveal, tags rise, scrapbook items drop).
    - `tlClose` (symmetrical folder close: scrapbook drops, cover folds `-180 -> 0deg`, viewport glides to top, folder docks into slot, stack siblings rise).
    - `tlNext` (continuous architect transition: current dossier exits `y: -75vh`, next dossier enters `y: 45vh -> 0` in open state).
- **`ReaderView.tsx` (Two-Panel Dossier Spread & Scrapbook Engine):**
  - Displays the opened dossier:
    - Left Panel: Unrolled folder cover backface (`.caseFolderCoverBack` with `rotateX(180deg)` and gradient texture).
    - Central Spine & Seam: Realistic folder spine fold and punch hole alignment.
    - Right Panel: `.caseFolderInner` containing `.caseFolderSheetWrapper`, cream paper sheet (`#fffcf9`), portrait, wire paperclip, and typography.
    - Top Spine Tabs: `.caseFolderTags` with vertical case tabs protruding along the folder top.
    - Interactive Scrapbook: `.caseFolderScrapbook` with interactive pointer-driven draggable historical artifacts (photos, postcards, notes) with paper rustle audio.
    - Next Architect Widget: Fixed widget appearing when `scrollY > 300px`, tracking overscroll accumulation up to 2000px with `-5 * progress vh` resistance.
- **`FolderStackAnimation.module.css` (Design Tokens & 3D Geometry):**
  - Houses the extracted mathematical tokens (`--container-offset`, `--container-size`, `--case-content-width`, `--stack-perspective: 3000px`).
  - Sets up CSS 3D transforms (`preserve-3d`, `transform-origin: left`, `backface-visibility: hidden`).
- **`caseSequence.ts` & `types.ts`:**
  - Manages the continuous 8-architect sequence across the 4 thematic categories.

---

## 2. Phased Implementation Roadmap

### Phase 4.1: Clean Tooling & ESLint Configuration
- **Task 4.1.1:** Update `eslint.config.mjs` to ignore `scripts/**` from TypeScript ESLint checks so utility automation scripts do not trigger false positive lint failures.
- **Task 4.1.2:** Resolve the React 19 hook warning in `ReaderView.tsx` regarding synchronous `setState` inside `useEffect([currentCase.slug])`.
- **Verification:** Run `npm run lint` and verify 0 errors.

### Phase 4.2: Two-Panel Geometry, Tokens & Styling
- **Task 4.2.1:** Standardize CSS design tokens in `FolderStackAnimation.module.css` according to extracted live tokens:
  - `--container-offset` across breakpoints (32px / 34px / 48px desktop; 30px tablet; 20px / 18px mobile).
  - `--container-size: calc(100vw - var(--container-offset) * 2)`.
  - `--case-content-width: calc((var(--container-size) - 19*1rem)*16/20 + 15rem)` on desktop (`min-width: 1025px`), and `calc(var(--container-size) - var(--tag-height))` on tablet/mobile.
- **Task 4.2.2:** Perfect the Two-Panel Folder Spread in `ReaderView.tsx` and `FolderStackAnimation.module.css`:
  - Position `.caseFolder` as the 3D perspective anchor (`perspective: 3000px`).
  - Configure `.caseFolderCover` with `transform-origin: left; transform-style: preserve-3d;`.
  - Configure `.caseFolderCoverBack` with `background-color: var(--case-color); transform: rotateX(180deg); backface-visibility: hidden;` and subtle horizontal light gradient.
  - Position `.caseFolderInner` with `border-radius: 0 4px 4px 0` to form the right half of the folder spread.
  - Ensure the left panel and right panel sit flush without clipping.
- **Task 4.2.3:** Enhance the Cream Paper Sheet (`.caseFolderSheet`):
  - Aspect ratio `210/297` (standard A4).
  - Left spine punch holes (9 holes, matching Mosby).
  - Authentic paper texture overlay and subtle ink bleed styling.

### Phase 4.3: Animation Lifecycles & State Transitions
- **Task 4.3.1:** Unfolding Timeline (`tlEnter`):
  - Lock Lenis scrolling during the 1.5s flight.
  - Smooth 3D tilt arc from stack slot to dock top (`y: folderStartDelta -> 0`, `rotate: 0 -> -22.6deg -> 0deg`).
  - Flap cover unroll (`rotateY: 0 -> -180deg`, `transform-origin: left`) with dynamic shadow peaking at 0.25s–0.6s.
  - Synchronized reveal of case title characters (`xPercent: -150 -> 0`, stagger 0.025s), spine tags (`yPercent: 110 -> 0`), and scrapbook items (`y: 50vh -> 0`).
  - Unlock Lenis and trigger resize once in `"case-view"`.
- **Task 4.3.2:** Symmetrical Reverse Closing Timeline (`tlClose`):
  - Drop scrapbook items (`y: 50vh, opacity: 0` in 0.2s).
  - Smoothly glide Lenis viewport to top (`scrollY: 0`) in lockstep with the 1.5s flight (`lock: true`).
  - Fold cover shut (`rotateY: -180 -> 0deg`).
  - Glide folder container down to its exact measured slot in the stack with reverse tilt arc.
  - *Only after active folder docks*, trigger sibling stack groups to slide up from `yPercent: 120 -> 0` (`stagger: 0.1, power4.out`) and restore hero text.
- **Task 4.3.3:** Continuous Architect Transition (`tlNext` / `folder-next`):
  - When overscroll threshold is reached or Next Architect button is clicked:
  - Current dossier slides up `y: -75vh` (0.35s).
  - Scroll position immediately resets to 0.
  - Next dossier slides in from `y: 45vh -> 0` already in unfolded state (`rotateY: -180deg`).

### Phase 4.4: Complete Archival Content & Interactive Scrapbook
- **Task 4.4.1:** Populate scrapbook coordinates and artifacts for all 8 architect dossiers in `FOLDER_GROUPS`:
  - Group 0: Frank Lloyd Wright (Fallingwater, Robie House), Irving Gill (Dodge House).
  - Group 1: Frank Gehry (Guggenheim Bilbao, Walt Disney Concert Hall).
  - Group 2: Louis Kahn (Salk Institute, Kimbell Art Museum), I. M. Pei (Louvre Pyramid), Paul Rudolph (Yale Art & Architecture).
  - Group 3: Mary Colter (Hopi House, Desert View Watchtower), Louis Sullivan (Wainwright Building, Guaranty Building).
- **Task 4.4.2:** Ensure pointer drag, tactile paper rustle sound, and top z-index elevation work flawlessly across all items.

### Phase 4.5: Verification, Quality Assurance & QA Report
- **Task 4.5.1:** Run `npm run build` and `npm run lint`.
- **Task 4.5.2:** Test responsive breakpoints (desktop 1440px, tablet 768px, mobile 375px).
- **Task 4.5.3:** Produce `QA_REPORT.md` documenting tested scenarios, telemetry, and performance.
