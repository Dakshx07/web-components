"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { FolderGroupConfig, ArchitectCase } from "./types";
import { FolderTab } from "./FolderTab";
import { TheFooter } from "./TheFooter";
import styles from "./FolderStackAnimation.module.css";
import { soundFx } from "./soundFx";
import { A4NotionEditor } from "./A4NotionEditor/A4NotionEditor";
import { FolderCaseDocument, A4Page } from "./A4NotionEditor/types";
import {
  loadFolderCaseDocument,
  saveFolderCaseDocument,
} from "./A4NotionEditor/documentStore";

interface ReaderViewProps {
  group: FolderGroupConfig;
  allGroups?: FolderGroupConfig[];
  currentCase: ArchitectCase;
  activeCaseIndex: number;
  onSelectCase: (groupIndex: number, caseIndex?: number) => void;
  onClose: () => void;
  coverRef?: React.RefObject<HTMLDivElement | null>;
  folderRef?: React.RefObject<HTMLDivElement | null>;
  tagsRef?: React.RefObject<HTMLDivElement | null>;
  topTabsRef?: React.RefObject<HTMLDivElement | null>;
  scrapbookRef?: React.RefObject<HTMLDivElement | null>;
  heroTitleRef?: React.RefObject<HTMLHeadingElement | null>;
  initialUnfolded?: boolean;
  folderStartDelta?: number;
  folderStartX?: number;
  folderStartWidth?: number;
  isClosingToStack?: boolean;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  group,
  currentCase,
  activeCaseIndex,
  onSelectCase,
  onClose,
  coverRef,
  folderRef,
  tagsRef,
  topTabsRef,
  heroTitleRef,
  initialUnfolded = true,
  folderStartDelta = 420,
  folderStartX = 0,
  folderStartWidth,
  isClosingToStack = false,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const leftSheetRef = useRef<HTMLDivElement>(null);
  const rightSheetRef = useRef<HTMLDivElement>(null);
  const zoomOverlayRef = useRef<HTMLDivElement>(null);
  const zoomHeaderRef = useRef<HTMLDivElement>(null);
  const zoomSheetContainerRef = useRef<HTMLDivElement>(null);
  const isZoomAnimating = useRef(false);

  // Document state (persisted to localStorage)
  const [caseDocState, setCaseDocState] = useState<{
    slug: string;
    doc: FolderCaseDocument;
  }>(() => ({
    slug: currentCase.slug,
    doc: loadFolderCaseDocument(currentCase.slug, currentCase.name),
  }));

  if (caseDocState.slug !== currentCase.slug) {
    setCaseDocState({
      slug: currentCase.slug,
      doc: loadFolderCaseDocument(currentCase.slug, currentCase.name),
    });
  }

  const caseDoc = caseDocState.doc;

  // Zoom and flap focus state
  const [zoomState, setZoomState] = useState<"none" | "left" | "right">("none");
  const [clickedRect, setClickedRect] = useState<DOMRect | null>(null);
  const [hoveredFlap, setHoveredFlap] = useState<"left" | "right" | null>(null);

  const handleZoomIn = useCallback(
    (flap: "left" | "right") => {
      if (isZoomAnimating.current) return;
      isZoomAnimating.current = true;
      soundFx.playPaperRustle();

      // Capture origin bounding box of clicked flap
      const sheetEl = flap === "left" ? leftSheetRef.current : rightSheetRef.current;
      const rect = sheetEl?.getBoundingClientRect() || null;
      setClickedRect(rect);

      // Stop Lenis during editor mode so native editor scrolling works smoothly
      if (typeof window !== "undefined" && window.__lenis) {
        window.__lenis.stop();
      }

      setZoomState(flap);
    },
    []
  );

  // GSAP Smooth FLIP Animation: Scale and fly sheet from flap into center editor
  useEffect(() => {
    if (zoomState === "none" || !clickedRect || !zoomSheetContainerRef.current) return;

    const toRect = zoomSheetContainerRef.current.getBoundingClientRect();
    const deltaX = clickedRect.left - toRect.left;
    const deltaY = clickedRect.top - toRect.top;
    const scaleX = clickedRect.width / toRect.width;
    const scaleY = clickedRect.height / toRect.height;

    gsap.fromTo(
      zoomSheetContainerRef.current,
      {
        x: deltaX,
        y: deltaY,
        scaleX: scaleX,
        scaleY: scaleY,
        transformOrigin: "top left",
      },
      {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        duration: 0.75,
        ease: "power3.inOut",
        onComplete: () => {
          isZoomAnimating.current = false;
        },
      }
    );

    if (zoomOverlayRef.current) {
      gsap.fromTo(
        zoomOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.45, ease: "power2.out" }
      );
    }

    if (zoomHeaderRef.current) {
      gsap.fromTo(
        zoomHeaderRef.current,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, delay: 0.15, ease: "power2.out" }
      );
    }
  }, [zoomState, clickedRect]);

  const handleZoomOut = useCallback(() => {
    if (isZoomAnimating.current || zoomState === "none") return;
    isZoomAnimating.current = true;
    soundFx.playPaperRustle();

    const sheetEl = zoomState === "left" ? leftSheetRef.current : rightSheetRef.current;
    const toRect = sheetEl?.getBoundingClientRect();
    const fromRect = zoomSheetContainerRef.current?.getBoundingClientRect();

    if (toRect && fromRect && zoomSheetContainerRef.current) {
      const deltaX = toRect.left - fromRect.left;
      const deltaY = toRect.top - fromRect.top;
      const scaleX = toRect.width / fromRect.width;
      const scaleY = toRect.height / fromRect.height;

      const tl = gsap.timeline({
        onComplete: () => {
          setZoomState("none");
          setClickedRect(null);
          isZoomAnimating.current = false;
          if (typeof window !== "undefined" && window.__lenis) {
            window.__lenis.start();
          }
        },
      });

      if (zoomHeaderRef.current) {
        tl.to(zoomHeaderRef.current, { y: -30, opacity: 0, duration: 0.2, ease: "power2.in" }, 0);
      }
      if (zoomOverlayRef.current) {
        tl.to(zoomOverlayRef.current, { opacity: 0, duration: 0.65, ease: "power2.inOut" }, 0.05);
      }
      tl.to(
        zoomSheetContainerRef.current,
        {
          x: deltaX,
          y: deltaY,
          scaleX: scaleX,
          scaleY: scaleY,
          transformOrigin: "top left",
          duration: 0.7,
          ease: "power3.inOut",
        },
        0
      );
    } else {
      setZoomState("none");
      setClickedRect(null);
      isZoomAnimating.current = false;
      if (typeof window !== "undefined" && window.__lenis) {
        window.__lenis.start();
      }
    }
  }, [zoomState]);

  const handleUpdatePages = useCallback(
    (flap: "left" | "right", newPages: A4Page[]) => {
      setCaseDocState((prev) => {
        const updated: FolderCaseDocument = {
          ...prev.doc,
          [flap === "left" ? "leftDocument" : "rightDocument"]: {
            flap,
            pages: newPages,
          },
        };
        saveFolderCaseDocument(updated);
        return { slug: prev.slug, doc: updated };
      });
    },
    []
  );

  // Keyboard navigation & Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (zoomState !== "none") {
          e.preventDefault();
          e.stopPropagation();
          handleZoomOut();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomState, handleZoomOut, onClose]);

  // Main Page Case Dossier View (Overscroll navigation disabled per design spec)
  return (
    <div
      className={styles.pageCase}
      style={
        {
          "--case-color": currentCase.color,
        } as React.CSSProperties
      }
    >
      {/* Archival Corner Close Button (visible when not zoomed into editor) */}
      {zoomState === "none" && (
        <button
          type="button"
          className={styles.caseCloseBtn}
          onClick={onClose}
          title="Close Folder (Return to Stack)"
          aria-label="Close Folder"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {/* Main Page Case Content Wrapper */}
      <div className={styles.pageCaseContent} ref={contentRef}>
        {/* Case Hero Title */}
        <div className={styles.caseHero}>
          <h1 ref={heroTitleRef} className={styles.caseHeroTitle}>
            {currentCase.name.split("").map((char, cIdx) => (
              <span
                key={cIdx}
                className="case-char"
                style={{
                  display: "inline-block",
                  whiteSpace: "pre",
                  opacity: !initialUnfolded ? 0 : 1,
                }}
              >
                {char}
              </span>
            ))}
          </h1>
        </div>

        {/* Main Dossier Content */}
        <div className={styles.caseContent}>
          {/* Centered Two-Flap Folder Spread */}
          <div className={styles.caseSpread}>
            {/* 3D Case Folder (Right Flap Container) */}
            <div
              ref={folderRef}
              className={styles.caseFolder}
              style={
                !initialUnfolded
                  ? {
                      transform: `translate3d(${folderStartX}px, ${folderStartDelta}px, 0) rotate(0deg)`,
                      transformOrigin: "right bottom",
                      ...(folderStartWidth ? { width: `${folderStartWidth}px` } : {}),
                    }
                  : undefined
              }
            >
              {/* 3D Flap Cover (Left Flap when unfolded -180deg) */}
              <div
                ref={coverRef}
                className={styles.caseFolderCover}
                style={{
                  transform: !initialUnfolded ? "rotateY(0deg)" : "rotateY(-180deg)",
                }}
              >
                <div
                  className={`${styles.caseFolderCoverFront} ${styles.stackCover} ${styles.isUnfolded}`}
                  style={
                    {
                      "--first-case-color": group.primaryColor,
                      "--cover-bg-color": group.primaryColor,
                      "--cover-color": "#FFFFFF",
                    } as React.CSSProperties
                  }
                >
                  <div className={styles.caseFolderCoverFrontOverlay} />
                  <div className={styles.caseFolderCoverFrontShadow} />
                  {/* Category Label and Arrow on top-right */}
                  <div className={styles.stackCoverCategory}>
                    <span>{group.category}</span>
                    <svg
                      className={styles.arrowIcon}
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6 9.5L1.5 5L2.55 3.95L6 7.4L9.45 3.95L10.5 5L6 9.5Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>

                  {/* Description on active folder (matching the unfolded stack) */}
                  {group.description && (
                    <div className={styles.stackCoverDesc}>
                      {group.description}
                    </div>
                  )}

                  {/* Archival Footer on Group 3 (Red) */}
                  {group.groupId === 3 && <TheFooter />}
                </div>

                {/* Left Flap Back Facing Forward in Two-Flap Spread */}
                <div
                  ref={leftSheetRef}
                  className={styles.caseFolderCoverBack}
                  style={{
                    backgroundColor: currentCase.color,
                  }}
                  onMouseEnter={() => setHoveredFlap("left")}
                  onMouseLeave={() => setHoveredFlap(null)}
                >
                  <div className={styles.caseFolderCoverBackOverlay} />
                  <div className={styles.flapSheetWrapper}>
                    <A4NotionEditor
                      key={`${currentCase.slug}-left-preview`}
                      folderCategory={group.category}
                      punchEdge="right"
                      isZoomedOutPreview={true}
                      isHovered={hoveredFlap === "left"}
                      onClick={() => handleZoomIn("left")}
                      pages={caseDoc.leftDocument.pages}
                      onUpdatePages={(pages) => handleUpdatePages("left", pages)}
                    />
                  </div>
                </div>
                <div className={styles.caseFolderCoverShadow} />
              </div>

              {/* Top Horizontal Tabs on the folder container (matching the home stack during closing) */}
              <div
                ref={topTabsRef}
                className={styles.stackPage}
                style={{
                  zIndex: 1,
                  opacity: isClosingToStack ? 1 : 0,
                  transform: isClosingToStack ? "translateY(0)" : "translateY(20px)",
                  pointerEvents: isClosingToStack ? "auto" : "none",
                }}
              >
                <div className={styles.stackPageHeader}>
                  {group.cases.map((c, cIdx) => (
                    <FolderTab
                      key={c.slug}
                      label={c.name}
                      color={c.color}
                      textColor={c.textColor}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCase(cIdx);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Inner Folder (Right Flap) */}
              <div
                className={styles.caseFolderInner}
                onMouseEnter={() => setHoveredFlap("right")}
                onMouseLeave={() => setHoveredFlap(null)}
              >
                {/* Spine Center Crease between Two Flaps */}
                <div className={styles.caseFolderCenterCrease} />

                {/* Vertical Tabs on Right Spine */}
                <div ref={tagsRef} className={styles.caseFolderTags}>
                  {group.cases.map((c, idx) => {
                    const isActive = idx === activeCaseIndex;
                    return (
                      <div
                        key={c.slug}
                        onClick={() => onSelectCase(idx)}
                        className={`${styles.caseFolderTagsPage} ${isActive ? styles.caseFolderTagsPageActive : ""}`}
                        style={
                          {
                            zIndex: isActive ? 10 : 5 - idx,
                            "--bg-color": c.color,
                            transform:
                              !initialUnfolded && !isActive
                                ? "translateY(110%)"
                                : undefined,
                          } as React.CSSProperties
                        }
                      >
                        <FolderTab
                          label={c.name}
                          color={c.color}
                          textColor={c.textColor}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Right Flap A4 Preview */}
                <div
                  ref={rightSheetRef}
                  className={styles.caseFolderA4Container}
                >
                  <div className={styles.flapSheetWrapper}>
                    <A4NotionEditor
                      key={`${currentCase.slug}-right-preview`}
                      folderCategory={group.category}
                      punchEdge="left"
                      isZoomedOutPreview={true}
                      isHovered={hoveredFlap === "right"}
                      onClick={() => handleZoomIn("right")}
                      pages={caseDoc.rightDocument.pages}
                      onUpdatePages={(pages) => handleUpdatePages("right", pages)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Zoomed-In Dedicated Editor Overlay (Full Notion Experience) ── */}
      {zoomState !== "none" && (
        <div
          ref={zoomOverlayRef}
          className={styles.zoomEditorOverlay}
          data-lenis-prevent="true"
          role="dialog"
          aria-label="A4 Document Editor"
        >
          {/* Header Bar */}
          <div ref={zoomHeaderRef} className={styles.zoomEditorHeader}>
            <button
              type="button"
              className={styles.zoomBackBtn}
              onClick={handleZoomOut}
              title="Return to Folder Spread (Esc)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back to Folder Spread</span>
              <kbd className={styles.zoomEscKbd}>ESC</kbd>
            </button>

            <div className={styles.zoomFlapIndicator}>
              <div
                className={styles.zoomFlapDot}
                style={{ backgroundColor: currentCase.color }}
              />
              <span>
                {currentCase.name} • {zoomState === "left" ? "Left Flap" : "Right Flap"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span className={styles.zoomSaveStatus}>✓ Saved locally</span>
              <button
                type="button"
                onClick={handleZoomOut}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  color: "#71717a",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Close Editor (Esc)"
                aria-label="Close Editor"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Centered A4 Notion Multi-Page Editor (FLIP animated by GSAP) */}
          <div ref={zoomSheetContainerRef} className={styles.zoomEditorBody}>
            <A4NotionEditor
              key={`${currentCase.slug}-${zoomState}-zoomed`}
              folderCategory={group.category}
              punchEdge={zoomState === "left" ? "right" : "left"}
              isZoomedOutPreview={false}
              pages={
                zoomState === "left"
                  ? caseDoc.leftDocument.pages
                  : caseDoc.rightDocument.pages
              }
              onUpdatePages={(pages) => handleUpdatePages(zoomState, pages)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
