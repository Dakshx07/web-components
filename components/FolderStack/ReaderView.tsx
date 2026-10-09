"use client";

import React, { useState, useEffect } from "react";
import { FolderGroupConfig, ArchitectCase } from "./types";
import { FolderTab } from "./FolderTab";
import styles from "./FolderStackAnimation.module.css";
import { soundFx } from "./soundFx";

interface ReaderViewProps {
  group: FolderGroupConfig;
  currentCase: ArchitectCase;
  activeCaseIndex: number;
  onSelectCase: (index: number) => void;
  onClose: () => void;
  coverRef?: React.RefObject<HTMLDivElement | null>;
  tagsRef?: React.RefObject<HTMLDivElement | null>;
  scrapbookRef?: React.RefObject<HTMLDivElement | null>;
  heroTitleRef?: React.RefObject<HTMLHeadingElement | null>;
}

interface DraggableItem {
  id: string;
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
}

// Mary Colter telemetry coordinates from live Mosby inspect
const MARY_COLTER_POSITIONS: Record<string, DraggableItem> = {
  // Cluster 1: Hopi House (1905) [Cluster top: 818px, left: 63px]
  hopiPhoto: { id: "hopiPhoto", x: 90, y: -193, rotation: -2.75, zIndex: 11 },
  hopiNote: { id: "hopiNote", x: 0, y: 0, rotation: 0, zIndex: 14 },
  hopiPhoto2: { id: "hopiPhoto2", x: 256, y: -41, rotation: 1.5, zIndex: 12 },
  hopiPostcard: { id: "hopiPostcard", x: 105, y: 225, rotation: 0, zIndex: 15 },
  hopiPaperclip: { id: "hopiPaperclip", x: 420, y: 23, rotation: 180, zIndex: 16 },

  // Cluster 2: Desert View Watchtower (1932) [Cluster top: 1695px, left: 372px]
  watchtowerPanorama: { id: "watchtowerPanorama", x: -322, y: -80, rotation: 0, zIndex: 9 },
  watchtowerPostcard: { id: "watchtowerPostcard", x: -327, y: 460, rotation: 0, zIndex: 13 },
  watchtowerPhoto1: { id: "watchtowerPhoto1", x: -120, y: -209, rotation: 2.5, zIndex: 11 },
  watchtowerPhoto2: { id: "watchtowerPhoto2", x: 205, y: -168, rotation: 0, zIndex: 12 },
  watchtowerNote: { id: "watchtowerNote", x: 0, y: 0, rotation: 0, zIndex: 14 },

  // Cluster 3: Bright Angel Lodge (1935) [Cluster top: 2479px, left: 596px]
  brightAngelBlueprint: { id: "brightAngelBlueprint", x: -470, y: -178, rotation: 0, zIndex: 8 },
  brightAngelColor: { id: "brightAngelColor", x: -346, y: 144, rotation: 0, zIndex: 12 },
  brightAngelLodge: { id: "brightAngelLodge", x: -328, y: -60, rotation: 0, zIndex: 10 },
  brightAngelNote: { id: "brightAngelNote", x: 0, y: 0, rotation: 1.5, zIndex: 15 },
  brightAngelPhoto: { id: "brightAngelPhoto", x: -286, y: -209, rotation: -1.75, zIndex: 11 },
};

// Louis Sullivan telemetry coordinates from live Mosby inspect
const LOUIS_SULLIVAN_POSITIONS: Record<string, DraggableItem> = {
  // Cluster 1: Wainwright Building (1890–1891) [Cluster top: 615px, left: 386px]
  wainwrightPhoto1: { id: "wainwrightPhoto1", x: -336, y: -92, rotation: 0, zIndex: 10 },
  wainwrightPdf: { id: "wainwrightPdf", x: -300, y: 120, rotation: 0, zIndex: 12 },
  wainwrightNote: { id: "wainwrightNote", x: 0, y: 0, rotation: 0, zIndex: 14 },
  wainwrightPhoto2: { id: "wainwrightPhoto2", x: 258, y: 156, rotation: 2.5, zIndex: 11 },

  // Cluster 2: Guaranty Building (1894–1896) [Cluster top: 1742px, left: 64px]
  guarantyPhoto1: { id: "guarantyPhoto1", x: 185, y: -75, rotation: 0, zIndex: 10 },
  guarantyPhoto2: { id: "guarantyPhoto2", x: 297, y: -433, rotation: 0, zIndex: 9 },
  guarantyNote: { id: "guarantyNote", x: 0, y: 0, rotation: 0, zIndex: 14 },
  guarantyPhoto3: { id: "guarantyPhoto3", x: 336, y: 71, rotation: 0, zIndex: 11 },

  // Cluster 3: National Farmers Bank (1908) [Cluster top: 2746px, left: 193px]
  bankPhoto1: { id: "bankPhoto1", x: -146, y: -92, rotation: 0, zIndex: 10 },
  bankPhoto2: { id: "bankPhoto2", x: -84, y: -359, rotation: 0, zIndex: 9 },
  bankNote: { id: "bankNote", x: 0, y: 0, rotation: 0, zIndex: 14 },
  bankPhoto3: { id: "bankPhoto3", x: 168, y: 191, rotation: 0, zIndex: 11 },
};

export const ReaderView: React.FC<ReaderViewProps> = ({
  group,
  currentCase,
  activeCaseIndex,
  onSelectCase,
  onClose,
  coverRef,
  tagsRef,
  scrapbookRef,
  heroTitleRef,
}) => {
  // Sticky sub-header when scrolled down past hero
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      setIsScrolled(y > 180);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Draggable scrapbook states initialized per case
  const [positions, setPositions] = useState<Record<string, DraggableItem>>(() =>
    currentCase.slug === "louis-sullivan" ? LOUIS_SULLIVAN_POSITIONS : MARY_COLTER_POSITIONS
  );

  const [activeDrag, setActiveDrag] = useState<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    e.preventDefault();
    const item = positions[id] || { id, x: 0, y: 0, rotation: 0, zIndex: 10 };

    soundFx.playPaperRustle();

    // Bring clicked element to top z-index
    const maxZ = Math.max(...Object.values(positions).map((p) => p.zIndex), 20);
    setPositions((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || item), zIndex: maxZ + 1 },
    }));

    setActiveDrag({
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: item.x,
      origY: item.y,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag) return;
    const dx = e.clientX - activeDrag.startX;
    const dy = e.clientY - activeDrag.startY;

    setPositions((prev) => ({
      ...prev,
      [activeDrag.id]: {
        ...(prev[activeDrag.id] || { id: activeDrag.id, rotation: 0, zIndex: 10 }),
        x: activeDrag.origX + dx,
        y: activeDrag.origY + dy,
      },
    }));
  };

  const handlePointerUp = () => {
    setActiveDrag(null);
  };

  const nextCaseIndex = (activeCaseIndex + 1) % group.cases.length;
  const nextCase = group.cases[nextCaseIndex];

  return (
    <div
      className={styles.pageCase}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={
        {
          "--case-color": currentCase.color,
        } as React.CSSProperties
      }
    >
      {/* Sticky top subheader when scrolled down */}
      <div
        className={`${styles.theSubHeader} ${isScrolled ? styles.theSubHeaderVisible : ""}`}
        style={{ pointerEvents: isScrolled ? "auto" : "none" }}
      >
        <div className={styles.subHeaderTitle} onClick={onClose} style={{ cursor: "pointer" }}>
          {currentCase.name}
        </div>
        <div className={styles.subHeaderLogo} onClick={onClose} style={{ cursor: "pointer" }}>
          MOSBY’S FILES
        </div>
      </div>

      {/* Case Hero Title */}
      <div className={styles.caseHero}>
        <h1 ref={heroTitleRef} className={styles.caseHeroTitle}>
          {currentCase.name.split("").map((char, cIdx) => (
            <span
              key={cIdx}
              className="case-char"
              style={{ display: "inline-block", whiteSpace: "pre" }}
            >
              {char}
            </span>
          ))}
        </h1>
      </div>

      {/* Main Dossier Content */}
      <div className={styles.caseContent}>
        <div className={styles.caseContentInner}>
          {/* 3D Case Folder */}
          <div className={styles.caseFolder}>
            {/* 3D Flap Cover */}
            <div
              ref={coverRef}
              className={styles.caseFolderCover}
              style={{ transform: "rotateY(-180deg)" }}
            >
              <div className={styles.caseFolderCoverFront} />
              <div className={styles.caseFolderCoverBack} />
              <div className={styles.caseFolderCoverShadow} />
            </div>

            {/* Vertical Tabs on Right Spine */}
            <div ref={tagsRef} className={styles.caseFolderTags}>
              {group.cases.map((c, idx) => {
                const isActive = idx === activeCaseIndex;
                return (
                  <div
                    key={c.slug}
                    onClick={() => onSelectCase(idx)}
                    className={`${styles.caseFolderTagsPage} ${isActive ? styles.caseFolderTagsPageActive : ""}`}
                    style={{ zIndex: isActive ? 10 : 5 - idx }}
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

            {/* Inner Folder with Archival Cream Sheet */}
            <div className={styles.caseFolderInner}>
              <div className={styles.caseFolderSheetWrapper}>
                <div className={styles.caseFolderSheet}>
                  {/* Texture Overlays */}
                  <div className={styles.caseFolderSheetOverlay} />
                  <div className={styles.caseFolderSheetMarks} />

                  {/* Left Spine Punch Holes */}
                  <div className={styles.caseFolderSheetClip}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} />
                    ))}
                  </div>

                  {/* Sheet Editorial Content */}
                  <div className={styles.caseFolderSheetInner}>
                    {/* Left Column: Clipped Photo & Bio */}
                    <div className={styles.sheetLeftCol}>
                      <div className={styles.sheetPhoto}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={currentCase.portrait}
                          alt={currentCase.name}
                        />
                        {/* Authentic Wire Paperclip */}
                        <svg
                          className={styles.contentPaperclip}
                          width="24"
                          height="64"
                          viewBox="0 0 24 64"
                          fill="none"
                        >
                          <path
                            d="M12 4C7.5 4 4 7.5 4 12V48C4 53.5 8.5 58 14 58C19.5 58 24 53.5 24 48V16C24 12.7 21.3 10 18 10C14.7 10 12 12.7 12 16V44C12 46.2 13.8 48 16 48C18.2 48 20 46.2 20 44V18"
                            stroke="#1E1E20"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            fill="none"
                          />
                        </svg>
                      </div>

                      <div className={styles.sheetInfoWrapper}>
                        <div className={styles.sheetInfo}>
                          <p>Born:</p>
                          <p>{currentCase.born}</p>
                        </div>
                        <div className={styles.sheetInfo}>
                          <p>Died:</p>
                          <p>{currentCase.died}</p>
                        </div>
                        <div className={styles.sheetInfo}>
                          <p>Location:</p>
                          <p>{currentCase.location}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Editorial Lead & Body Paragraphs */}
                    <div className={styles.sheetRightCol}>
                      <div className={styles.sheetDesc}>
                        <p>
                          <span className={styles.sheetDropCap}>
                            {currentCase.dropCap}
                          </span>
                          {currentCase.leadParagraph}
                        </p>
                        {currentCase.bodyParagraphs.map((para, pIdx) => (
                          <p key={pIdx}>{para}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Authentic Scrapbook Archive (Inside the Dossier Folder) */}
              <div ref={scrapbookRef} className={styles.caseFolderScrapbook}>
                {currentCase.slug === "louis-sullivan" ? (
                  <>
                    {/* Cluster 1: Wainwright Building (1890–1891) [top 615px, left 386px] */}
                    <div
                      className={styles.scrapbookCluster}
                      style={{ top: "615px", left: "386px", width: "560px", height: "400px" }}
                    >
                      {/* Photo louis-sullivan-08.avif */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.vintagePhotoBorder}`}
                        onPointerDown={(e) => handlePointerDown("wainwrightPhoto1", e)}
                        style={{
                          transform: `translate(${positions.wainwrightPhoto1?.x ?? -336}px, ${positions.wainwrightPhoto1?.y ?? -92}px) rotate(${positions.wainwrightPhoto1?.rotation ?? 0}deg)`,
                          width: "504px",
                          zIndex: positions.wainwrightPhoto1?.zIndex ?? 10,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/architects/louis-sullivan-08.avif"
                          alt="Wainwright Building Exterior"
                        />
                      </div>

                      {/* Blueprint Drawing pdf2.avif */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.blueprintBorder}`}
                        onPointerDown={(e) => handlePointerDown("wainwrightPdf", e)}
                        style={{
                          transform: `translate(${positions.wainwrightPdf?.x ?? -300}px, ${positions.wainwrightPdf?.y ?? 120}px) rotate(${positions.wainwrightPdf?.rotation ?? 0}deg)`,
                          width: "280px",
                          zIndex: positions.wainwrightPdf?.zIndex ?? 12,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/architects/pdf2.avif"
                          alt="Wainwright Building Floorplan"
                        />
                      </div>

                      {/* Teal Note Card */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.scrapbookCardTeal}`}
                        onPointerDown={(e) => handlePointerDown("wainwrightNote", e)}
                        style={{
                          transform: `translate(${positions.wainwrightNote?.x ?? 0}px, ${positions.wainwrightNote?.y ?? 0}px) rotate(${positions.wainwrightNote?.rotation ?? 0}deg)`,
                          width: "560px",
                          minHeight: "400px",
                          zIndex: positions.wainwrightNote?.zIndex ?? 14,
                        }}
                      >
                        <h3 className={styles.scrapbookCardTitle}>
                          WAINWRIGHT BUILDING (1890–1891)
                        </h3>
                        <p className={styles.scrapbookCardText}>
                          One of the first true skyscrapers. Vertical piers pull the eye upward, turning height into architectural argument rather than mere accumulation of floors.
                        </p>
                      </div>

                      {/* Photo louis-sullivan-07.avif */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.vintagePhotoBorder}`}
                        onPointerDown={(e) => handlePointerDown("wainwrightPhoto2", e)}
                        style={{
                          transform: `translate(${positions.wainwrightPhoto2?.x ?? 258}px, ${positions.wainwrightPhoto2?.y ?? 156}px) rotate(${positions.wainwrightPhoto2?.rotation ?? 2.5}deg)`,
                          width: "336px",
                          zIndex: positions.wainwrightPhoto2?.zIndex ?? 11,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/architects/louis-sullivan-07.avif"
                          alt="Wainwright Building Detail"
                        />
                      </div>
                    </div>

                    {/* Cluster 2: Guaranty Building (1894–1896) [top 1742px, left 64px] */}
                    <div
                      className={styles.scrapbookCluster}
                      style={{ top: "1742px", left: "64px", width: "560px", height: "375px" }}
                    >
                      {/* Photo louis-sullivan-06.avif */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.vintagePhotoBorder}`}
                        onPointerDown={(e) => handlePointerDown("guarantyPhoto1", e)}
                        style={{
                          transform: `translate(${positions.guarantyPhoto1?.x ?? 185}px, ${positions.guarantyPhoto1?.y ?? -75}px) rotate(${positions.guarantyPhoto1?.rotation ?? 0}deg)`,
                          width: "448px",
                          zIndex: positions.guarantyPhoto1?.zIndex ?? 10,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/architects/louis-sullivan-06.avif"
                          alt="Guaranty Building Elevation"
                        />
                      </div>

                      {/* Tall Photo louis-sullivan-05.avif */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.vintagePhotoBorder}`}
                        onPointerDown={(e) => handlePointerDown("guarantyPhoto2", e)}
                        style={{
                          transform: `translate(${positions.guarantyPhoto2?.x ?? 297}px, ${positions.guarantyPhoto2?.y ?? -433}px) rotate(${positions.guarantyPhoto2?.rotation ?? 0}deg)`,
                          width: "504px",
                          zIndex: positions.guarantyPhoto2?.zIndex ?? 9,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/architects/louis-sullivan-05.avif"
                          alt="Guaranty Building Column Detail"
                        />
                      </div>

                      {/* Pink Note Card with Paperclip */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.scrapbookCardRose}`}
                        onPointerDown={(e) => handlePointerDown("guarantyNote", e)}
                        style={{
                          transform: `translate(${positions.guarantyNote?.x ?? 0}px, ${positions.guarantyNote?.y ?? 0}px) rotate(${positions.guarantyNote?.rotation ?? 0}deg)`,
                          width: "560px",
                          minHeight: "375px",
                          zIndex: positions.guarantyNote?.zIndex ?? 14,
                        }}
                      >
                        {/* Attached Wire Paperclip */}
                        <svg
                          style={{
                            position: "absolute",
                            top: "-24px",
                            left: "64px",
                            transform: "rotate(150deg)",
                            pointerEvents: "none",
                          }}
                          width="24"
                          height="64"
                          viewBox="0 0 24 64"
                          fill="none"
                        >
                          <path
                            d="M12 4C7.5 4 4 7.5 4 12V48C4 53.5 8.5 58 14 58C19.5 58 24 53.5 24 48V16C24 12.7 21.3 10 18 10C14.7 10 12 12.7 12 16V44C12 46.2 13.8 48 16 48C18.2 48 20 46.2 20 44V18"
                            stroke="#1E1E20"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            fill="none"
                          />
                        </svg>

                        <h3 className={styles.scrapbookCardTitle}>
                          GUARANTY BUILDING (1894–1896)
                        </h3>
                        <p className={styles.scrapbookCardText}>
                          Steel skeleton, terracotta skin. Structure speaks through ornament-dense vegetal patterns disciplined by a clear tripartite façade.
                        </p>
                      </div>

                      {/* Wide Photo louis-sullivan-01.avif */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.vintagePhotoBorder}`}
                        onPointerDown={(e) => handlePointerDown("guarantyPhoto3", e)}
                        style={{
                          transform: `translate(${positions.guarantyPhoto3?.x ?? 336}px, ${positions.guarantyPhoto3?.y ?? 71}px) rotate(${positions.guarantyPhoto3?.rotation ?? 0}deg)`,
                          width: "532px",
                          zIndex: positions.guarantyPhoto3?.zIndex ?? 11,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/architects/louis-sullivan-01.avif"
                          alt="Guaranty Building Terra Cotta Relief"
                        />
                      </div>
                    </div>

                    {/* Cluster 3: National Farmers Bank (1908) [top 2746px, left 193px] */}
                    <div
                      className={styles.scrapbookCluster}
                      style={{ top: "2746px", left: "193px", width: "560px", height: "407px" }}
                    >
                      {/* Small Photo louis-sullivan-04.avif */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.vintagePhotoBorder}`}
                        onPointerDown={(e) => handlePointerDown("bankPhoto1", e)}
                        style={{
                          transform: `translate(${positions.bankPhoto1?.x ?? -146}px, ${positions.bankPhoto1?.y ?? -92}px) rotate(${positions.bankPhoto1?.rotation ?? 0}deg)`,
                          width: "364px",
                          zIndex: positions.bankPhoto1?.zIndex ?? 10,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/architects/louis-sullivan-04.avif"
                          alt="National Farmers Bank Jewel Box"
                        />
                      </div>

                      {/* Large Vertical Photo louis-sullivan-03.avif */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.vintagePhotoBorder}`}
                        onPointerDown={(e) => handlePointerDown("bankPhoto2", e)}
                        style={{
                          transform: `translate(${positions.bankPhoto2?.x ?? -84}px, ${positions.bankPhoto2?.y ?? -359}px) rotate(${positions.bankPhoto2?.rotation ?? 0}deg)`,
                          width: "560px",
                          zIndex: positions.bankPhoto2?.zIndex ?? 9,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/architects/louis-sullivan-03.avif"
                          alt="National Farmers Bank Arch Window"
                        />
                      </div>

                      {/* Yellow Note Card */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.scrapbookCardYellow}`}
                        onPointerDown={(e) => handlePointerDown("bankNote", e)}
                        style={{
                          transform: `translate(${positions.bankNote?.x ?? 0}px, ${positions.bankNote?.y ?? 0}px) rotate(${positions.bankNote?.rotation ?? 0}deg)`,
                          width: "560px",
                          minHeight: "407px",
                          zIndex: positions.bankNote?.zIndex ?? 14,
                        }}
                      >
                        <h3 className={styles.scrapbookCardTitle}>
                          NATIONAL FARMERS’ BANK OF OWATONNA (1908)
                        </h3>
                        <p className={styles.scrapbookCardText}>
                          A small-town bank turned luminous. Compact scale, jewel-like ornament, modern structure wrapped in warmth rather than grandeur.
                        </p>
                      </div>

                      {/* Photo louis-sullivan-02.avif */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.vintagePhotoBorder}`}
                        onPointerDown={(e) => handlePointerDown("bankPhoto3", e)}
                        style={{
                          transform: `translate(${positions.bankPhoto3?.x ?? 168}px, ${positions.bankPhoto3?.y ?? 191}px) rotate(${positions.bankPhoto3?.rotation ?? 0}deg)`,
                          width: "420px",
                          zIndex: positions.bankPhoto3?.zIndex ?? 11,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/architects/louis-sullivan-02.avif"
                          alt="National Farmers Bank Interior Glass"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Cluster 1: Hopi House (1905) [top 818px, left 63px] */}
                    <div
                      className={styles.scrapbookCluster}
                      style={{ top: "818px", left: "63px", width: "420px", height: "450px" }}
                    >
                      {/* Photo mary-colter-05.avif */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.vintagePhotoBorder}`}
                        onPointerDown={(e) => handlePointerDown("hopiPhoto", e)}
                        style={{
                          transform: `translate(${positions.hopiPhoto?.x ?? 90}px, ${positions.hopiPhoto?.y ?? -193}px) rotate(${positions.hopiPhoto?.rotation ?? -2.75}deg)`,
                          width: "504px",
                          zIndex: positions.hopiPhoto?.zIndex ?? 11,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/architects/mary-colter-05.avif"
                          alt="Hopi House Architecture"
                        />
                      </div>

                      {/* Rose Archival Note Card */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.scrapbookCardRose}`}
                        onPointerDown={(e) => handlePointerDown("hopiNote", e)}
                        style={{
                          transform: `translate(${positions.hopiNote?.x ?? 0}px, ${positions.hopiNote?.y ?? 0}px) rotate(${positions.hopiNote?.rotation ?? 0}deg)`,
                          width: "420px",
                          minHeight: "450px",
                          zIndex: positions.hopiNote?.zIndex ?? 14,
                        }}
                      >
                        <h3 className={styles.scrapbookCardTitle}>
                          HOPI HOUSE (1905)
                        </h3>
                        <p className={styles.scrapbookCardText}>
                          A marketplace shaped like a terraced Pueblo dwelling, built with local Kaibab limestone to honor indigenous craftsmen. Commercial staging framed as ethnographic encounter—authentic, but not innocent.
                        </p>
                      </div>

                      {/* Photo mary-colter-04.avif */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.vintagePhotoBorder}`}
                        onPointerDown={(e) => handlePointerDown("hopiPhoto2", e)}
                        style={{
                          transform: `translate(${positions.hopiPhoto2?.x ?? 256}px, ${positions.hopiPhoto2?.y ?? -41}px) rotate(${positions.hopiPhoto2?.rotation ?? 1.5}deg)`,
                          width: "609px",
                          zIndex: positions.hopiPhoto2?.zIndex ?? 12,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/architects/mary-colter-04.avif"
                          alt="Hopi House Terraces"
                        />
                      </div>

                      {/* Postcard mary-colter-03.avif */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.postcardBorder}`}
                        onPointerDown={(e) => handlePointerDown("hopiPostcard", e)}
                        style={{
                          transform: `translate(${positions.hopiPostcard?.x ?? 105}px, ${positions.hopiPostcard?.y ?? 225}px) rotate(${positions.hopiPostcard?.rotation ?? 0}deg)`,
                          width: "483px",
                          zIndex: positions.hopiPostcard?.zIndex ?? 15,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/architects/mary-colter-03.avif"
                          alt="Hopi House Vintage Postcard"
                        />
                      </div>

                      {/* Attached Wire Paperclip on Hopi Card */}
                      <svg
                        style={{
                          position: "absolute",
                          top: "23px",
                          left: "420px",
                          transform: "rotate(180deg)",
                          pointerEvents: "none",
                          zIndex: 16,
                        }}
                        width="24"
                        height="64"
                        viewBox="0 0 24 64"
                        fill="none"
                      >
                        <path
                          d="M12 4C7.5 4 4 7.5 4 12V48C4 53.5 8.5 58 14 58C19.5 58 24 53.5 24 48V16C24 12.7 21.3 10 18 10C14.7 10 12 12.7 12 16V44C12 46.2 13.8 48 16 48C18.2 48 20 46.2 20 44V18"
                          stroke="#1E1E20"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                    </div>

                    {/* Cluster 2: Desert View Watchtower (1932) [top 1695px, left 372px] */}
                    <div
                      className={styles.scrapbookCluster}
                      style={{ top: "1695px", left: "372px", width: "460px", height: "400px" }}
                    >
                      {/* Panorama Photo mary-colter-12.avif */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.vintagePhotoBorder}`}
                        onPointerDown={(e) => handlePointerDown("watchtowerPanorama", e)}
                        style={{
                          transform: `translate(${positions.watchtowerPanorama?.x ?? -322}px, ${positions.watchtowerPanorama?.y ?? -80}px) rotate(${positions.watchtowerPanorama?.rotation ?? 0}deg)`,
                          width: "690px",
                          zIndex: positions.watchtowerPanorama?.zIndex ?? 9,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/architects/mary-colter-12.avif"
                          alt="Grand Canyon Rim Watchtower Panorama"
                        />
                      </div>

                      {/* Postcard Back postcard.avif */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.postcardBorder}`}
                        onPointerDown={(e) => handlePointerDown("watchtowerPostcard", e)}
                        style={{
                          transform: `translate(${positions.watchtowerPostcard?.x ?? -327}px, ${positions.watchtowerPostcard?.y ?? 460}px) rotate(${positions.watchtowerPostcard?.rotation ?? 0}deg)`,
                          width: "368px",
                          zIndex: positions.watchtowerPostcard?.zIndex ?? 13,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/architects/postcard.avif"
                          alt="Watchtower Postcard Stamp"
                        />
                      </div>

                      {/* Photo mary-colter-10.avif */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.vintagePhotoBorder}`}
                        onPointerDown={(e) => handlePointerDown("watchtowerPhoto1", e)}
                        style={{
                          transform: `translate(${positions.watchtowerPhoto1?.x ?? -120}px, ${positions.watchtowerPhoto1?.y ?? -209}px) rotate(${positions.watchtowerPhoto1?.rotation ?? 2.5}deg)`,
                          width: "299px",
                          zIndex: positions.watchtowerPhoto1?.zIndex ?? 11,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/architects/mary-colter-10.avif"
                          alt="Watchtower Stone Masonry"
                        />
                      </div>

                      {/* Photo mary-colter-11.avif */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.vintagePhotoBorder}`}
                        onPointerDown={(e) => handlePointerDown("watchtowerPhoto2", e)}
                        style={{
                          transform: `translate(${positions.watchtowerPhoto2?.x ?? 205}px, ${positions.watchtowerPhoto2?.y ?? -168}px) rotate(${positions.watchtowerPhoto2?.rotation ?? 0}deg)`,
                          width: "368px",
                          zIndex: positions.watchtowerPhoto2?.zIndex ?? 12,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/architects/mary-colter-11.avif"
                          alt="Watchtower Interior Hopi Murals"
                        />
                      </div>

                      {/* Purple Archival Note Card */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.scrapbookCardPurple}`}
                        onPointerDown={(e) => handlePointerDown("watchtowerNote", e)}
                        style={{
                          transform: `translate(${positions.watchtowerNote?.x ?? 0}px, ${positions.watchtowerNote?.y ?? 0}px) rotate(${positions.watchtowerNote?.rotation ?? 0}deg)`,
                          width: "460px",
                          minHeight: "400px",
                          zIndex: positions.watchtowerNote?.zIndex ?? 14,
                        }}
                      >
                        <h3 className={styles.scrapbookCardTitle}>
                          DESERT VIEW WATCHTOWER (1932)
                        </h3>
                        <p className={styles.scrapbookCardText}>
                          A seventy-foot stone cylinder rising from the canyon rim, modeled on Ancestral Puebloan towers. Inside: internal steel framework concealed by intentional weathered masonry and Hopi artist Fred Kabotie’s ceremonial murals.
                        </p>
                      </div>
                    </div>

                    {/* Cluster 3: Bright Angel Lodge (1935) [top 2479px, left 596px] */}
                    <div
                      className={styles.scrapbookCluster}
                      style={{ top: "2479px", left: "596px", width: "420px", height: "425px" }}
                    >
                      {/* Blueprint Elevation hopi-house-drawing.avif */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.blueprintBorder}`}
                        onPointerDown={(e) => handlePointerDown("brightAngelBlueprint", e)}
                        style={{
                          transform: `translate(${positions.brightAngelBlueprint?.x ?? -470}px, ${positions.brightAngelBlueprint?.y ?? -178}px) rotate(${positions.brightAngelBlueprint?.rotation ?? 0}deg)`,
                          width: "820px",
                          zIndex: positions.brightAngelBlueprint?.zIndex ?? 8,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/architects/hopi-house-drawing.avif"
                          alt="Bright Angel Architectural Drawing"
                        />
                      </div>

                      {/* Color Card mary-colter-08.avif */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.vintagePhotoBorder}`}
                        onPointerDown={(e) => handlePointerDown("brightAngelColor", e)}
                        style={{
                          transform: `translate(${positions.brightAngelColor?.x ?? -346}px, ${positions.brightAngelColor?.y ?? 144}px) rotate(${positions.brightAngelColor?.rotation ?? 0}deg)`,
                          width: "273px",
                          zIndex: positions.brightAngelColor?.zIndex ?? 12,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/architects/mary-colter-08.avif"
                          alt="Grand Canyon Color Card"
                        />
                      </div>

                      {/* Panoramic Photo mary-colter-07.avif */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.vintagePhotoBorder}`}
                        onPointerDown={(e) => handlePointerDown("brightAngelLodge", e)}
                        style={{
                          transform: `translate(${positions.brightAngelLodge?.x ?? -328}px, ${positions.brightAngelLodge?.y ?? -60}px) rotate(${positions.brightAngelLodge?.rotation ?? 0}deg)`,
                          width: "735px",
                          zIndex: positions.brightAngelLodge?.zIndex ?? 10,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/architects/mary-colter-07.avif"
                          alt="Canyon Vista and Lodge"
                        />
                      </div>

                      {/* Photo mary-colter-06.avif */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.vintagePhotoBorder}`}
                        onPointerDown={(e) => handlePointerDown("brightAngelPhoto", e)}
                        style={{
                          transform: `translate(${positions.brightAngelPhoto?.x ?? -286}px, ${positions.brightAngelPhoto?.y ?? -209}px) rotate(${positions.brightAngelPhoto?.rotation ?? -1.75}deg)`,
                          width: "420px",
                          zIndex: positions.brightAngelPhoto?.zIndex ?? 11,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/architects/mary-colter-06.avif"
                          alt="Bright Angel Lodge Historical View"
                        />
                      </div>

                      {/* Yellow Note Card with Paperclip */}
                      <div
                        className={`${styles.scrapbookItemDraggable} ${styles.scrapbookCardYellow}`}
                        onPointerDown={(e) => handlePointerDown("brightAngelNote", e)}
                        style={{
                          transform: `translate(${positions.brightAngelNote?.x ?? 0}px, ${positions.brightAngelNote?.y ?? 0}px) rotate(${positions.brightAngelNote?.rotation ?? 0}deg)`,
                          width: "420px",
                          minHeight: "425px",
                          zIndex: positions.brightAngelNote?.zIndex ?? 14,
                        }}
                      >
                        {/* Attached Wire Paperclip */}
                        <svg
                          style={{
                            position: "absolute",
                            top: "28px",
                            right: "-12px",
                            transform: "rotate(90deg)",
                            pointerEvents: "none",
                          }}
                          width="20"
                          height="50"
                          viewBox="0 0 24 64"
                          fill="none"
                        >
                          <path
                            d="M12 4C7.5 4 4 7.5 4 12V48C4 53.5 8.5 58 14 58C19.5 58 24 53.5 24 48V16C24 12.7 21.3 10 18 10C14.7 10 12 12.7 12 16V44C12 46.2 13.8 48 16 48C18.2 48 20 46.2 20 44V18"
                            stroke="#1E1E20"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            fill="none"
                          />
                        </svg>

                        <h3 className={styles.scrapbookCardTitle}>
                          BRIGHT ANGEL LODGE (1935)
                        </h3>
                        <p className={styles.scrapbookCardText}>
                          A cluster of timber, stone, and adobe structures. Modest,
                          tactile, human-scaled — hospitality without grandeur, tourism
                          without theatrical excess.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Bottom-Right Next Architect Widget */}
      <div className={styles.caseNextWidget}>
        <div
          className={styles.caseNextCard}
          style={{ backgroundColor: nextCase.color, cursor: "pointer" }}
          onClick={() => onSelectCase(nextCaseIndex)}
        >
          <h4 className={styles.caseNextCardTitle}>{nextCase.name}</h4>
          <p className={styles.caseNextCardCategory}>{group.category}</p>
        </div>
        <button
          onClick={() => onSelectCase(nextCaseIndex)}
          className={styles.caseNextBtn}
        >
          Next →
        </button>
      </div>
    </div>
  );
};
