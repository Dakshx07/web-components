"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FolderConfig } from "./types";
import { Folder, TAB_HEIGHT, EXPANDED_BODY_HEIGHT } from "./Folder";

/* ------------------------------------------------------------------ */
/*  Scroll-distance tuning                                            */
/* ------------------------------------------------------------------ */

/** Viewport-height units of scroll per folder transition. */
const SCROLL_PER_FOLDER_VH = 120;

/* ------------------------------------------------------------------ */
/*  Static folder data                                                */
/* ------------------------------------------------------------------ */

const folders: FolderConfig[] = [
  {
    id: 1,
    primaryColor: "#7E1E5D",
    tabs: [
      { label: "Lexical Interruptions", color: "#7E1E5D", textColor: "#FFFFFF" },
    ],
    contentId: "18A",
    contentDate: "Oct 04, 1952",
    contentText:
      "Transcripts incomplete.\nAlternate readings suggested.\nMetadata lost during compilation.",
  },
  {
    id: 2,
    primaryColor: "#D95B24",
    tabs: [
      { label: "Concord Variants", color: "#D95B24", textColor: "#FFFFFF" },
      { label: "Ink Displacement", color: "#2337B5", textColor: "#FFFFFF" },
      { label: "Referent Ghosts", color: "#111111", textColor: "#FFFFFF" },
    ],
    contentId: "18B",
    contentDate: "Nov 12, 1954",
    contentText:
      "Variant readings confirmed in\nthree separate manuscripts.\nInk chemical analysis pending.",
  },
  {
    id: 3,
    primaryColor: "#0A8068",
    tabs: [
      { label: "Unanchored Statements", color: "#0A8068", textColor: "#FFFFFF" },
    ],
    contentId: "17A",
    contentDate: "Jan 29, 1955",
    contentText:
      "Isolated declarations found\nin margins. Syntactic connection\nto main text unresolved.",
  },
  {
    id: 4,
    primaryColor: "#D12A2A",
    tabs: [
      { label: "Varnell Collection", color: "#D12A2A", textColor: "#FFFFFF" },
      { label: "Peripheral Entry", color: "#1D65D5", textColor: "#FFFFFF" },
    ],
    contentId: "17B",
    contentDate: "Mar 18, 1966",
    contentText:
      "Filed without origin.\nReferenced frequently,\nyet seldom cited in full.",
  },
  {
    id: 5,
    primaryColor: "#6F26A1",
    tabs: [
      { label: "Subject Drift", color: "#6F26A1", textColor: "#FFFFFF" },
      { label: "Duplicated Silence", color: "#D12A2A", textColor: "#FFFFFF" },
      { label: "Margin Events", color: "#ECE01B", textColor: "#111111" },
    ],
    contentId: "16A",
    contentDate: "Dec 13, 1956",
    contentText:
      "Provenance unclear.\nPart of unidentified collection.\nFurther context unavailable.",
  },
  {
    id: 6,
    primaryColor: "#1D65D5",
    tabs: [
      { label: "Reverse Index", color: "#1D65D5", textColor: "#FFFFFF" },
    ],
    contentId: "16B",
    contentDate: "Dec 13, 1956",
    contentText:
      "Context unknown.\nConnection to other\nrecords not confirmed.\nProcessing ongoing.",
  },
  {
    id: 7,
    primaryColor: "#BE185D",
    tabs: [
      { label: "Obscured Provenance", color: "#BE185D", textColor: "#FFFFFF" },
      { label: "Undated Persuasions", color: "#ECE01B", textColor: "#111111" },
    ],
    contentId: "15B",
    contentDate: "May 02, 1961",
    contentText:
      "Origin details redacted\nby authority. Material evidence\nsuggests external source.",
  },
  {
    id: 8,
    primaryColor: "#1D65D5",
    tabs: [
      { label: "No Verified", color: "#1D65D5", textColor: "#FFFFFF" },
    ],
    contentId: "15C",
    contentDate: "Mar 18, 1966",
    contentText:
      "Believed to be part of a\nlarger set. No other\nparts located.\n\nReferent unknown.\nSource pending.",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const N = folders.length;

/**
 * At rotation R, folder `folderIdx` occupies visual slot
 *   slot = (folderIdx + R) % N
 * Slot 0 = top of stack, Slot N-1 = bottom (active).
 *
 * Returns the background colour for the top 28 px of the folder's
 * header — which should match the primaryColor of the folder
 * visually above it.
 */
function getHeaderBgColor(folderIdx: number, rotation: number): string {
  const slot = ((folderIdx + rotation) % N + N) % N;
  if (slot === 0) return "transparent";
  // Folder at the slot directly above (slot - 1)
  const prevFolderIdx = ((slot - 1 - rotation) % N + N) % N;
  return folders[prevFolderIdx].primaryColor;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export const FolderStack: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    /* ---- Collect DOM handles via data attributes ---- */

    const els = Array.from({ length: N }, (_, i) => {
      const root = wrapper.querySelector(
        `[data-folder-idx="${i}"]`
      ) as HTMLElement;
      return {
        root,
        body: root.querySelector("[data-folder-body]") as HTMLElement,
        tabRow: root.querySelector("[data-tab-row]") as HTMLElement,
        headerBg: root.querySelector("[data-header-bg]") as HTMLElement,
      };
    });

    /* ---- Measure tab row widths for per-folder slide distance ---- */
    const stackContainer = wrapper.closest(
      "[data-stack-container]"
    ) as HTMLElement || wrapper;
    const stackWidth = stackContainer.clientWidth || wrapper.clientWidth;
    const slideDistances = els.map(({ tabRow }) => {
      const rowWidth = tabRow.scrollWidth || tabRow.offsetWidth;
      // Max slide = remaining space minus a small margin
      return Math.max(80, Math.min(600, stackWidth - rowWidth - 16));
    });

    /* ---- GSAP context (auto-cleanup) ---- */

    const ctx = gsap.context(() => {
      // ---- Initial positions (match inline styles, ensures GSAP baseline) ----
      els.forEach(({ root, body, headerBg }, i) => {
        gsap.set(root, { top: i * TAB_HEIGHT, zIndex: i + 1 });
        gsap.set(body, {
          height: i === N - 1 ? EXPANDED_BODY_HEIGHT : 0,
          autoAlpha: i === N - 1 ? 1 : 0,
        });
        gsap.set(headerBg, {
          backgroundColor: getHeaderBgColor(i, 0),
        });
      });

      // ---- Build master timeline ----
      const tl = gsap.timeline();

      for (let R = 0; R < N; R++) {
        // Folder closing (currently active, bottom of stack)
        const closingIdx = ((N - 1 - R) % N + N) % N;
        // Folder opening (takes the active spot)
        const openingIdx = ((N - 2 - R) % N + N) % N;

        const s = R; // step start in timeline units

        /* Phase 1 — Active tab slides right (0% – 30%) */
        tl.to(
          els[closingIdx].tabRow,
          { x: slideDistances[closingIdx], duration: 0.3, ease: "power2.out" },
          s
        );

        /* Phase 2 — Active body collapses (10% – 50%) */
        tl.to(
          els[closingIdx].body,
          { height: 0, autoAlpha: 0, duration: 0.4, ease: "power2.inOut" },
          s + 0.1
        );

        /* Phase 3 — Closing folder flies to top of stack (30% – 70%) */
        tl.to(
          els[closingIdx].root,
          { top: 0, zIndex: 1, duration: 0.4, ease: "power2.inOut" },
          s + 0.3
        );

        /* Phase 3b — Every other folder shifts down one slot (30% – 70%) */
        for (let i = 0; i < N; i++) {
          if (i === closingIdx) continue;
          const newSlot = ((i + R + 1) % N + N) % N;
          tl.to(
            els[i].root,
            {
              top: newSlot * TAB_HEIGHT,
              zIndex: newSlot + 1,
              duration: 0.4,
              ease: "power2.inOut",
            },
            s + 0.3
          );
        }

        /* Phase 4 — Update header background colours (instant, at 50%) */
        for (let i = 0; i < N; i++) {
          tl.set(
            els[i].headerBg,
            { backgroundColor: getHeaderBgColor(i, R + 1) },
            s + 0.5
          );
        }

        /* Phase 5 — Relocated tab resets to left (60% – 80%) */
        tl.to(
          els[closingIdx].tabRow,
          { x: 0, duration: 0.2, ease: "power2.in" },
          s + 0.6
        );

        /* Phase 6 — Next folder's body expands (50% – 100%) */
        tl.to(
          els[openingIdx].body,
          {
            height: EXPANDED_BODY_HEIGHT,
            autoAlpha: 1,
            duration: 0.5,
            ease: "power2.out",
          },
          s + 0.5
        );
      }

      // ---- Attach ScrollTrigger ----
      ScrollTrigger.create({
        trigger: wrapper,
        start: "top top",
        end: `+=${N * SCROLL_PER_FOLDER_VH}vh`,
        pin: true,
        anticipatePin: 1,
        scrub: 0.8,
        animation: tl,
      });
    }, wrapper);

    return () => ctx.revert();
  }, []);

  /* ---- Computed layout constants ---- */
  const STACK_HEIGHT =
    (N - 1) * TAB_HEIGHT + TAB_HEIGHT + EXPANDED_BODY_HEIGHT;

  return (
    <div
      ref={wrapperRef}
      className="w-full h-screen flex items-center justify-center px-4"
    >
      <div
        data-stack-container
        className="relative w-full max-w-[1050px] shadow-2xl select-none"
        style={{ height: `${STACK_HEIGHT}px` }}
      >
        {folders.map((folder, index) => (
          <Folder
            key={folder.id}
            folder={folder}
            index={index}
            totalFolders={N}
            initialHeaderBgColor={
              index === 0 ? "transparent" : folders[index - 1].primaryColor
            }
          />
        ))}
      </div>
    </div>
  );
};
