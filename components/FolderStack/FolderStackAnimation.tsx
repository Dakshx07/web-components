"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import gsap from "gsap";
import { FolderConfig, AnimationPhase } from "./types";
import { StackRow } from "./StackRow";
import { ReaderView } from "./ReaderView";
import { useTextScramble } from "./TextScramble";
import styles from "./FolderStackAnimation.module.css";

const FOLDERS: FolderConfig[] = [
  {
    id: 1,
    primaryColor: "#8E1A5A",
    tabs: [{ label: "Lexical Interruptions", color: "#8E1A5A", textColor: "#FFFFFF" }],
    contentId: "18A",
    contentDate: "Oct 04, 1952",
    contentText: "Transcripts incomplete.\nAlternate readings suggested.\nMetadata lost during compilation.",
  },
  {
    id: 2,
    primaryColor: "#D9622B",
    tabs: [
      { label: "Concord Variants", color: "#D9622B", textColor: "#FFFFFF" },
      { label: "Ink Displacement", color: "#2337B5", textColor: "#FFFFFF" },
      { label: "Referent Ghosts", color: "#111111", textColor: "#FFFFFF" },
    ],
    contentId: "18B",
    contentDate: "Nov 12, 1954",
    contentText: "Variant readings confirmed in\nthree separate manuscripts.\nInk chemical analysis pending.",
  },
  {
    id: 3,
    primaryColor: "#12876B",
    tabs: [{ label: "Unanchored Statements", color: "#12876B", textColor: "#FFFFFF" }],
    contentId: "17A",
    contentDate: "Jan 29, 1955",
    contentText: "Isolated declarations found\nin margins. Syntactic connection\nto main text unresolved.",
  },
  {
    id: 4,
    primaryColor: "#D6231B",
    tabs: [
      { label: "Varnell Collection", color: "#D6231B", textColor: "#FFFFFF" },
      { label: "Peripheral Entry", color: "#2255CC", textColor: "#FFFFFF" },
    ],
    contentId: "17B",
    contentDate: "Mar 18, 1966",
    contentText: "Filed without origin.\nReferenced frequently,\nyet seldom cited in full.",
  },
  {
    id: 5,
    primaryColor: "#5B2A86",
    tabs: [
      { label: "Subject Drift", color: "#5B2A86", textColor: "#FFFFFF" },
      { label: "Duplicated Silence", color: "#D6231B", textColor: "#FFFFFF" },
      { label: "Margin Events", color: "#ECE01B", textColor: "#111111" },
    ],
    contentId: "16A",
    contentDate: "Dec 13, 1956",
    contentText: "Provenance unclear.\nPart of unidentified collection.\nFurther context unavailable.",
  },
  {
    id: 6,
    primaryColor: "#2255CC",
    tabs: [{ label: "Reverse Index", color: "#2255CC", textColor: "#FFFFFF" }],
    contentId: "16B",
    contentDate: "Dec 13, 1956",
    contentText: "Context unknown.\nConnection to other\nrecords not confirmed.\nProcessing ongoing.",
  },
  {
    id: 7,
    primaryColor: "#D6437A",
    tabs: [
      { label: "Obscured Provenance", color: "#D6437A", textColor: "#FFFFFF" },
      { label: "Undated Persuasions", color: "#ECE01B", textColor: "#111111" },
    ],
    contentId: "15B",
    contentDate: "May 02, 1961",
    contentText: "Origin details redacted\nby authority. Material evidence\nsuggests external source.",
  },
  {
    id: 8,
    primaryColor: "#2255CC",
    tabs: [{ label: "No Verified", color: "#2255CC", textColor: "#FFFFFF" }],
    contentId: "15C",
    contentDate: "Mar 18, 1966",
    contentText: "Believed to be part of a\nlarger set. No other\nparts located.\n\nReferent unknown.\nSource pending.",
  },
];

const TARGET_FOLDER_ID = 4; // Varnell Collection

export const FolderStackAnimation: React.FC = () => {
  const [phase, setPhase] = useState<AnimationPhase>("stack");
  const [activeFolderId, setActiveFolderId] = useState<number>(4);
  const [titleText, setTitleText] = useState("Fragments 15–20");

  // Refs for animation targets
  const containerRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const readerRef = useRef<HTMLDivElement>(null);
  const breadcrumbRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const metadataRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const { displayText, scramble } = useTextScramble("Fragments 15–20", {
    speed: 1,
    tickInterval: 30,
  });

  // Update titleText from scramble
  useEffect(() => {
    setTitleText(displayText);
  }, [displayText]);

  const setRowRef = useCallback((id: number) => {
    return (el: HTMLDivElement | null) => {
      rowRefs.current.set(id, el);
    };
  }, []);

  // Create a ref callback that works with forwardRef
  const createRowRef = useCallback((id: number): React.RefObject<HTMLDivElement | null> => {
    return {
      get current() {
        return rowRefs.current.get(id) || null;
      },
      set current(el: HTMLDivElement | null) {
        rowRefs.current.set(id, el);
      },
    };
  }, []);

  const handlePeripheralEntryClick = useCallback(() => {
    if (phase !== "stack") return;

    // Kill any existing timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    const tl = gsap.timeline({
      onComplete: () => {
        setPhase("reader");
      },
    });
    timelineRef.current = tl;

    setPhase("collapsing");

    // ── Stage 1 (0–0.25s): Fade/slide non-target rows ──
    const nonTargetRows: HTMLDivElement[] = [];
    rowRefs.current.forEach((el, id) => {
      if (id !== TARGET_FOLDER_ID && el) {
        nonTargetRows.push(el);
      }
    });

    const targetRow = rowRefs.current.get(TARGET_FOLDER_ID);

    nonTargetRows.forEach((row) => {
      const rowId = parseInt(row.dataset.rowId || "0");
      const direction = rowId < TARGET_FOLDER_ID ? -1 : 1;
      tl.to(
        row,
        {
          opacity: 0,
          y: direction * 30,
          duration: 0.25,
          ease: "power2.out",
        },
        0
      );
    });

    // Fade breadcrumb and title
    if (breadcrumbRef.current) {
      tl.to(
        breadcrumbRef.current,
        { opacity: 0, y: -10, duration: 0.2, ease: "power2.out" },
        0
      );
    }
    if (titleRef.current) {
      tl.to(
        titleRef.current,
        { opacity: 0, y: -10, duration: 0.2, ease: "power2.out" },
        0.05
      );
    }

    // ── Stage 2: Direct 3D Reader Morphing (simultaneous opening) ──
    let initialY = 0;
    let rowHeight = 60;
    if (targetRow && containerRef.current) {
      const targetRect = targetRow.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const targetCenterY = targetRect.top - containerRect.top + targetRect.height / 2;
      const containerCenterY = containerRect.height / 2;
      initialY = targetCenterY - containerCenterY;
      rowHeight = targetRect.height;
    }

    // Query ReaderView components directly inside the readerLayer
    const spread = readerRef.current?.querySelector(`.${styles.spreadContainer}`);
    const leftPage = readerRef.current?.querySelector(`.${styles.leftPage}`);
    const rightPage = readerRef.current?.querySelector(`.${styles.rightPage}`);
    const receipt = readerRef.current?.querySelector(`.${styles.receiptWrapper}`);
    const tabs = readerRef.current?.querySelector(`.${styles.rightEdgeTabs}`);

    if (readerRef.current) {
      // Show reader container immediately so we can animate its children
      tl.set(readerRef.current, { display: "block", opacity: 1 }, 0.2);
    }

    if (targetRow) {
      // Hide stack row exactly when reader animation takes over
      tl.to(targetRow, { opacity: 0, duration: 0.05 }, 0.2);
    }

    // Set initial 3D closed/folded states matching stack row
    if (spread) {
      tl.set(spread, {
        transformOrigin: "center center",
        transformPerspective: 1000,
        rotateX: 0,
        rotateY: 0,
        y: initialY,
        scaleY: rowHeight / 580, // initial squashed height matching the row height
        opacity: 0,
      }, 0.2);
    }

    if (leftPage) {
      tl.set(leftPage, {
        rotateY: 85, // Folded back
        opacity: 0,
        boxShadow: "0 30px 60px rgba(0,0,0,0.4)",
      }, 0.2);
    }

    if (rightPage) {
      tl.set(rightPage, {
        rotateY: -85, // Folded back
        opacity: 0,
        boxShadow: "0 30px 60px rgba(0,0,0,0.4)",
      }, 0.2);
    }

    if (receipt) {
      tl.set(receipt, {
        opacity: 0,
        y: 80,
        rotate: 15,
      }, 0.2);
    }

    if (tabs) {
      tl.set(tabs, {
        opacity: 0,
        x: -30,
      }, 0.2);
    }

    // ── ANIMATION FLUID STEPS (Simultaneous Morph and Open) ──
    if (spread) {
      // Lift folder spread out from stack and scale up to full height
      tl.to(spread, {
        opacity: 1,
        scaleY: 1,
        y: -15, // Lift off slightly
        rotateX: -18,
        rotateY: 30, // 3D tilted
        duration: 0.5,
        ease: "power2.out",
      }, 0.2);
    }

    // Unfold both flaps and settle flat at the same time
    const openDuration = 0.9;
    const openEase = "power3.inOut";

    if (leftPage) {
      tl.to(leftPage, {
        rotateY: 0,
        opacity: 1,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
        duration: openDuration,
        ease: openEase,
      }, 0.45);
    }

    if (rightPage) {
      tl.to(rightPage, {
        rotateY: 0,
        opacity: 1,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
        duration: openDuration,
        ease: openEase,
      }, 0.45);
    }

    if (spread) {
      tl.to(spread, {
        y: 0,
        rotateX: 0,
        rotateY: 0,
        duration: openDuration,
        ease: openEase,
      }, 0.45);
    }

    // Receipt card slides and drops in tactilely
    if (receipt) {
      tl.to(receipt, {
        opacity: 1,
        y: 0,
        rotate: -5,
        duration: 0.65,
        ease: "power2.out",
      }, 0.75);
    }

    // Side tabs slide out from the folder edge
    if (tabs) {
      tl.to(tabs, {
        opacity: 1,
        x: 0,
        duration: 0.55,
        ease: "back.out(1.3)",
      }, 0.9);
    }

    // Title scramble + metadata fade in
    tl.call(
      () => {
        scramble("Fragments 15–20", "Fragment 17B");
      },
      [],
      0.3
    );

    // Show metadata
    if (metadataRef.current) {
      tl.fromTo(
        metadataRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
        0.35
      );
    }

    // Scramble the title ref back to visible
    if (titleRef.current) {
      tl.set(titleRef.current, { opacity: 1, y: 0 }, 0.9);
    }

    tl.play();
  }, [phase, scramble]);

  const handleReset = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    setPhase("collapsing");

    const tl = gsap.timeline({
      onComplete: () => {
        setPhase("stack");
        // Clear props to prevent layout contamination
        rowRefs.current.forEach((el) => {
          if (el) gsap.set(el, { clearProps: "all" });
        });
        if (breadcrumbRef.current) gsap.set(breadcrumbRef.current, { clearProps: "all" });
        if (titleRef.current) gsap.set(titleRef.current, { clearProps: "all" });
        if (metadataRef.current) gsap.set(metadataRef.current, { clearProps: "all" });
        if (readerRef.current) {
          gsap.set(readerRef.current, { clearProps: "all", opacity: 0 });
          
          const spread = readerRef.current.querySelector(`.${styles.spreadContainer}`);
          const leftPage = readerRef.current.querySelector(`.${styles.leftPage}`);
          const rightPage = readerRef.current.querySelector(`.${styles.rightPage}`);
          const receipt = readerRef.current.querySelector(`.${styles.receiptWrapper}`);
          const tabs = readerRef.current.querySelector(`.${styles.rightEdgeTabs}`);
          
          if (spread) gsap.set(spread, { clearProps: "all" });
          if (leftPage) gsap.set(leftPage, { clearProps: "all" });
          if (rightPage) gsap.set(rightPage, { clearProps: "all" });
          if (receipt) gsap.set(receipt, { clearProps: "all" });
          if (tabs) gsap.set(tabs, { clearProps: "all" });
        }
      },
    });
    timelineRef.current = tl;

    // Fade/scale out reader
    if (readerRef.current) {
      tl.to(
        readerRef.current,
        {
          opacity: 0,
          scale: 0.95,
          y: 20,
          duration: 0.4,
          ease: "power2.inOut",
        },
        0
      );
    }

    // Fade/slide in stack layers and title
    const targetRow = rowRefs.current.get(TARGET_FOLDER_ID);
    if (targetRow) {
      tl.fromTo(
        targetRow,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power2.out" },
        0.2
      );
    }

    const nonTargetRows: HTMLDivElement[] = [];
    rowRefs.current.forEach((el, id) => {
      if (id !== TARGET_FOLDER_ID && el) {
        nonTargetRows.push(el);
      }
    });

    nonTargetRows.forEach((row) => {
      const rowId = parseInt(row.dataset.rowId || "0");
      const direction = rowId < TARGET_FOLDER_ID ? -1 : 1;
      tl.fromTo(
        row,
        { opacity: 0, y: direction * 30 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
        0.2
      );
    });

    // Fade in breadcrumb
    if (breadcrumbRef.current) {
      tl.fromTo(
        breadcrumbRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
        0.2
      );
    }

    // Scramble title back
    tl.call(
      () => {
        scramble("Fragment 17B", "Fragments 15–20");
      },
      [],
      0.1
    );

    // Hide metadata
    if (metadataRef.current) {
      tl.to(
        metadataRef.current,
        { opacity: 0, y: 10, duration: 0.3, ease: "power2.in" },
        0
      );
    }

    tl.play();
  }, [scramble]);

  const handleTabClick = useCallback(
    (folderId: number, tabLabel: string) => {
      if (tabLabel === "Peripheral Entry" && folderId === TARGET_FOLDER_ID) {
        handlePeripheralEntryClick();
      } else {
        setActiveFolderId(folderId);
      }
    },
    [handlePeripheralEntryClick]
  );

  return (
    <div className={styles.animationContainer} ref={containerRef}>
      {/* ── Stack layer ── */}
      <div
        className={styles.stackLayer}
        ref={stackRef}
        style={{
          pointerEvents: phase === "stack" ? "auto" : "none",
          display: phase === "reader" ? "none" : "block",
          width: "100%",
        }}
      >
        {FOLDERS.map((folder, index) => {
          const headerBgColor =
            index === 0 ? "transparent" : FOLDERS[index - 1].primaryColor;
          const isLast = index === FOLDERS.length - 1;

          return (
            <StackRow
              key={folder.id}
              folder={folder}
              isExpanded={activeFolderId === folder.id}
              headerBgColor={headerBgColor}
              isLast={isLast}
              rowRef={createRowRef(folder.id)}
              onTabClick={(tabLabel) => handleTabClick(folder.id, tabLabel)}
            />
          );
        })}
      </div>

      {/* ── Reader layer ── */}
      <div
        ref={readerRef}
        className={styles.readerLayer}
        style={{
          display: phase === "reader" || phase === "folder3d" || phase === "collapsing" ? "block" : "none",
          width: "100%",
        }}
      >
        {/* Reader content */}
        <ReaderView />
      </div>

      {/* ── Floating Back Button ── */}
      {phase !== "stack" && (
        <button
          onClick={handleReset}
          style={{
            position: "fixed",
            top: "24px",
            left: "24px",
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#F0ECE4",
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 100,
            transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.18)";
            (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.08)";
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          }}
          title="Go Back"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
      )}
    </div>
  );
};
