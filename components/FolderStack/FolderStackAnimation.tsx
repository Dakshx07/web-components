"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import gsap from "gsap";
import { FolderConfig, AnimationPhase } from "./types";
import { StackRow } from "./StackRow";
import { ReaderView } from "./ReaderView";
import { FolderTab } from "./FolderTab";
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

// Programmatic Web Audio API synthesis for a realistic page-turning/folding sound
const playPaperRustle = (isOpening: boolean) => {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Create buffer for white noise (friction)
    const duration = 0.65;
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate organic noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    // Create source
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    
    // BiquadFilter to filter noise into a paper friction/whoosh sound
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    
    // Sweet frequency sweep: opening has a higher sweep pitch than closing
    filter.frequency.setValueAtTime(isOpening ? 180 : 350, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(isOpening ? 420 : 150, ctx.currentTime + 0.55);
    filter.Q.setValueAtTime(2.0, ctx.currentTime);
    
    // Gain Node for envelope shaping
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    
    // Fast ramp up for paper movement friction, followed by a smooth ramp down
    gainNode.gain.linearRampToValueAtTime(isOpening ? 0.08 : 0.05, ctx.currentTime + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    
    // Connect audio graph
    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Play
    noiseSource.start();
    noiseSource.stop(ctx.currentTime + duration);
  } catch (err) {
    console.warn("Web Audio API warning:", err);
  }
};

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

    // Trigger the opening sound effect immediately upon click
    playPaperRustle(true);

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

    const targetRow = rowRefs.current.get(TARGET_FOLDER_ID);
    const containerRect = containerRef.current?.getBoundingClientRect();
    const targetRect = targetRow?.getBoundingClientRect();
    const containerWidth = containerRect ? containerRect.width : 1150;
    const targetTop = targetRect && containerRect ? targetRect.top - containerRect.top : 120;

    // Force display style on readerRef immediately to allow measuring its layout
    if (readerRef.current) {
      readerRef.current.style.display = "block";
      readerRef.current.style.position = "absolute";
      readerRef.current.style.top = "24px";
      readerRef.current.style.left = "16px";
      readerRef.current.style.width = "calc(100% - 32px)";
      readerRef.current.style.zIndex = "1";
    }

    // ── Stage 1 (0–0.25s): Fade/slide non-target rows ──
    const nonTargetRows: HTMLDivElement[] = [];
    rowRefs.current.forEach((el, id) => {
      if (id !== TARGET_FOLDER_ID && el) {
        nonTargetRows.push(el);
      }
    });

    nonTargetRows.forEach((row) => {
      const rowId = parseInt(row.dataset.rowId || "0");
      if (rowId < TARGET_FOLDER_ID) {
        tl.to(
          row,
          {
            opacity: 0,
            y: -50,
            duration: 0.25,
            ease: "power2.out",
          },
          0
        );
      } else {
        tl.to(
          row,
          {
            opacity: 0,
            y: 50,
            duration: 0.25,
            ease: "power2.out",
          },
          0
        );
      }
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

    // ── Stage 2: Direct 3D Folder Transition ──
    let initialY = 0;
    let rowHeight = 40; // Height of the stack tab header
    if (targetRow && readerRef.current) {
      const targetRect = targetRow.getBoundingClientRect();
      const readerRect = readerRef.current.getBoundingClientRect();
      
      const targetCenterY = targetRect.top + rowHeight / 2;
      const finalCenterY = readerRect.top + 580 / 2;
      
      initialY = targetCenterY - finalCenterY;
    }

    // Query ReaderView components directly inside the readerLayer
    const spread = readerRef.current?.querySelector(`.${styles.spreadContainer}`);
    const leftPage = readerRef.current?.querySelector(`.${styles.leftPage}`);
    const rightPage = readerRef.current?.querySelector(`.${styles.rightPage}`);
    const receipt = readerRef.current?.querySelector(`.${styles.receiptWrapper}`);
    const tabs = readerRef.current?.querySelector(`.${styles.rightEdgeTabs}`);
    const coverOverlay = readerRef.current?.querySelector(`.${styles.spreadCoverOverlay}`);

    if (readerRef.current) {
      tl.set(readerRef.current, { opacity: 1 }, 0.2);
    }

    if (targetRow) {
      // Hide stack row exactly when pulling animation starts
      tl.to(targetRow, { opacity: 0, duration: 0.05 }, 0.2);
    }

    if (spread) {
      tl.set(spread, {
        transformOrigin: "center center",
        transformPerspective: 1200,
        rotateX: -20,
        rotateY: 10,
        rotateZ: 0,
        x: 0,
        y: initialY,
        scaleX: 0.48,
        scaleY: 400 / 580,
        opacity: 1,
      }, 0.2);
    }

    if (coverOverlay) {
      tl.set(coverOverlay, { opacity: 1 }, 0.2);
    }

    if (leftPage) {
      tl.set(leftPage, {
        rotateY: 105, // Fully folded inward (backface hidden)
        opacity: 0,   // Hide initially to let red cover show
      }, 0.2);
    }

    if (rightPage) {
      tl.set(rightPage, {
        rotateY: -105, // Fully folded inward
        opacity: 0,
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

    // ── ANIMATION STEP 1: Move Closed Folder directly to Center ──
    if (spread) {
      tl.to(spread, {
        x: 0,
        y: 0,
        rotateZ: 0,
        rotateX: 0,
        rotateY: 0,
        scaleX: 0.65,
        scaleY: 0.65,
        duration: 0.45,
        ease: "power2.out",
      }, 0.25);
    }

    // ── ANIMATION STEP 2: Settle flat and swing pages open like a book ──
    const openStart = 0.7;
    const openDuration = 0.9;
    const openEase = "power3.inOut";

    if (spread) {
      tl.to(spread, {
        scaleX: 1,
        scaleY: 1,
        x: 0,
        y: 0,
        rotateZ: 0,
        rotateX: 0,
        rotateY: 0,
        duration: openDuration,
        ease: openEase,
      }, openStart);
    }

    // Fade out cover overlay to reveal pages inside
    if (coverOverlay) {
      tl.to(coverOverlay, {
        opacity: 0,
        duration: openDuration * 0.8,
        ease: "power2.inOut",
      }, openStart);
    }

    if (leftPage) {
      tl.to(leftPage, {
        rotateY: 0,
        opacity: 1,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
        duration: openDuration,
        ease: openEase,
      }, openStart);
    }

    if (rightPage) {
      tl.to(rightPage, {
        rotateY: 0,
        opacity: 1,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
        duration: openDuration,
        ease: openEase,
      }, openStart);
    }

    // Receipt card slides and drops in tactilely
    if (receipt) {
      tl.to(receipt, {
        opacity: 1,
        y: 0,
        rotate: -5,
        duration: 0.65,
        ease: "power2.out",
      }, openStart + 0.35);
    }

    // Side tabs slide out from the folder edge
    if (tabs) {
      tl.to(tabs, {
        opacity: 1,
        x: 0,
        duration: 0.55,
        ease: "back.out(1.3)",
      }, openStart + 0.5);
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
    // Trigger the closing sound effect immediately upon click
    playPaperRustle(false);

    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    setPhase("collapsing");

    const targetRow = rowRefs.current.get(TARGET_FOLDER_ID);
    const containerRect = containerRef.current?.getBoundingClientRect();
    const targetRect = targetRow?.getBoundingClientRect();
    const containerWidth = containerRect ? containerRect.width : 1150;
    
    let initialY = 0;
    let rowHeight = 40;
    if (targetRow && readerRef.current) {
      const targetRect = targetRow.getBoundingClientRect();
      const readerRect = readerRef.current.getBoundingClientRect();
      const targetCenterY = targetRect.top + rowHeight / 2;
      const finalCenterY = readerRect.top + 580 / 2;
      initialY = targetCenterY - finalCenterY;
    }

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
          const coverOverlay = readerRef.current.querySelector(`.${styles.spreadCoverOverlay}`);

          if (spread) gsap.set(spread, { clearProps: "all" });
          if (leftPage) gsap.set(leftPage, { clearProps: "all" });
          if (rightPage) gsap.set(rightPage, { clearProps: "all" });
          if (receipt) gsap.set(receipt, { clearProps: "all" });
          if (tabs) gsap.set(tabs, { clearProps: "all" });
          if (coverOverlay) gsap.set(coverOverlay, { clearProps: "all" });
        }
      },
    });
    timelineRef.current = tl;

    const spread = readerRef.current?.querySelector(`.${styles.spreadContainer}`);
    const leftPage = readerRef.current?.querySelector(`.${styles.leftPage}`);
    const rightPage = readerRef.current?.querySelector(`.${styles.rightPage}`);
    const receipt = readerRef.current?.querySelector(`.${styles.receiptWrapper}`);
    const tabs = readerRef.current?.querySelector(`.${styles.rightEdgeTabs}`);
    const coverOverlay = readerRef.current?.querySelector(`.${styles.spreadCoverOverlay}`);

    // Step 1: Fold spread and pages closed in the center, while bringing coverOverlay back to full opacity
    if (spread) {
      tl.to(spread, {
        scaleX: 0.65,
        scaleY: 0.65,
        x: 0,
        y: 0,
        rotateZ: 0,
        rotateX: 0,
        rotateY: 0,
        duration: 0.55,
        ease: "power3.inOut",
      }, 0);
    }

    if (coverOverlay) {
      tl.to(coverOverlay, {
        opacity: 1,
        duration: 0.45,
        ease: "power3.inOut",
      }, 0);
    }

    if (leftPage) {
      tl.to(leftPage, {
        rotateY: 105,
        opacity: 0,
        duration: 0.55,
        ease: "power3.inOut",
      }, 0);
    }

    if (rightPage) {
      tl.to(rightPage, {
        rotateY: -105,
        opacity: 0,
        duration: 0.55,
        ease: "power3.inOut",
      }, 0);
    }

    if (receipt) {
      tl.to(receipt, {
        opacity: 0,
        y: 80,
        rotate: 15,
        duration: 0.45,
      }, 0);
    }

    if (tabs) {
      tl.to(tabs, {
        opacity: 0,
        x: -30,
        duration: 0.4,
      }, 0);
    }

    // Step 2: Move the closed folder back down/up to the target row position
    if (spread) {
      tl.to(spread, {
        x: 0,
        y: initialY,
        rotateZ: 0,
        rotateX: -20,
        rotateY: 10,
        scaleX: 0.48,
        scaleY: 400 / 580,
        duration: 0.45,
        ease: "power2.inOut",
      }, 0.55);
    }

    // Fade/scale out reader layer completely at the end
    if (readerRef.current) {
      tl.to(readerRef.current, {
        opacity: 0,
        duration: 0.45,
        ease: "power2.inOut",
      }, 0.55);
    }

    // Fade and bring back non-target rows and title info
    const nonTargetRows: HTMLDivElement[] = [];
    rowRefs.current.forEach((el, id) => {
      if (id !== TARGET_FOLDER_ID && el) {
        nonTargetRows.push(el);
      }
    });

    nonTargetRows.forEach((row) => {
      tl.to(
        row,
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          ease: "power2.inOut",
        },
        0.55
      );
    });

    // Bring back target row at the end of the animation
    if (targetRow) {
      tl.to(targetRow, { opacity: 1, duration: 0.05 }, 0.95);
    }

    if (breadcrumbRef.current) {
      tl.to(
        breadcrumbRef.current,
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
        0.55
      );
    }

    if (titleRef.current) {
      tl.call(
        () => {
          scramble("Fragment 17B", "Fragments 15–20");
        },
        [],
        0.55
      );
      tl.to(
        titleRef.current,
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
        0.55
      );
    }

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
      if (folderId === TARGET_FOLDER_ID) {
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
          position: phase === "collapsing" ? "relative" : "static",
          zIndex: phase === "collapsing" ? 2 : "auto",
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
          position: phase === "collapsing" ? "absolute" : "relative",
          top: phase === "collapsing" ? "24px" : "auto",
          left: phase === "collapsing" ? "16px" : "auto",
          width: phase === "collapsing" ? "calc(100% - 32px)" : "100%",
          zIndex: phase === "collapsing" ? 1 : "auto",
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
