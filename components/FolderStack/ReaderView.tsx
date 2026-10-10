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
  folderRef?: React.RefObject<HTMLDivElement | null>;
  tagsRef?: React.RefObject<HTMLDivElement | null>;
  scrapbookRef?: React.RefObject<HTMLDivElement | null>;
  heroTitleRef?: React.RefObject<HTMLHeadingElement | null>;
  initialUnfolded?: boolean;
  folderStartDelta?: number;
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
  folderRef,
  tagsRef,
  scrapbookRef,
  heroTitleRef,
  initialUnfolded = true,
  folderStartDelta = 420,
}) => {
  // Sticky sub-header when scrolled down past hero
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      setIsScrolled(y > 180);
      const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
      setIsNearBottom(y > 600 || (scrollMax > 0 && y >= scrollMax - 250));
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
        <div
          className={styles.subHeaderLogo}
          onClick={onClose}
          style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          title="Return to Archive Stack"
        >
          <svg
            viewBox="0 0 967 145"
            fill="currentColor"
            height="18"
            style={{ display: "block" }}
          >
            <path d="M59.4692 72.6855H60.3248L73.1599 4.23176H112.735V139H83.6419V62.2035H82.7862L68.0259 139H48.3454L33.1573 62.2035H32.3016V139H4.70619V4.23176H45.1367L59.4692 72.6855ZM207.25 79.9587C207.25 99.3539 203.898 114.328 197.195 124.881C190.493 135.435 179.298 140.711 163.61 140.711C147.923 140.711 136.728 135.435 130.025 124.881C123.323 114.328 119.971 99.3539 119.971 79.9587V63.2731C119.971 43.8779 123.323 28.9036 130.025 18.3503C136.728 7.79707 147.923 2.52043 163.61 2.52043C179.298 2.52043 190.493 7.79707 197.195 18.3503C203.898 28.9036 207.25 43.8779 207.25 63.2731V79.9587ZM152.487 95.1468C152.487 101.137 153.2 105.985 154.626 109.693C156.052 113.401 159.047 115.255 163.61 115.255C168.174 115.255 171.169 113.401 172.595 109.693C174.021 105.985 174.734 101.137 174.734 95.1468V48.0849C174.734 42.0952 174.021 37.2464 172.595 33.5385C171.169 29.8306 168.174 27.9766 163.61 27.9766C159.047 27.9766 156.052 29.8306 154.626 33.5385C153.2 37.2464 152.487 42.0952 152.487 48.0849V95.1468ZM239.046 93.4355V98.7834C239.046 103.775 240.116 107.839 242.255 110.977C244.394 113.972 247.532 115.469 251.668 115.469C259.083 115.469 262.791 111.619 262.791 103.917C262.791 100.067 261.65 97.1434 259.369 95.1468C257.087 93.1503 253.878 91.0111 249.742 88.7293L238.405 82.5257C234.839 80.5291 231.417 78.3899 228.137 76.1082C224.999 73.8264 222.147 71.1167 219.58 67.9793C217.156 64.8418 215.23 61.2052 213.804 57.0695C212.378 52.7911 211.665 47.7284 211.665 41.8813C211.665 35.8916 212.592 30.4724 214.446 25.6236C216.3 20.7747 218.938 16.639 222.361 13.2163C225.784 9.79363 229.848 7.15531 234.554 5.30136C239.26 3.44741 244.537 2.52043 250.384 2.52043C262.791 2.52043 272.346 6.01442 279.049 13.0024C285.752 19.9904 289.103 30.4011 289.103 44.2344V49.5824H261.508V44.0205C261.508 33.182 257.8 27.7627 250.384 27.7627C247.104 27.7627 244.608 28.8323 242.897 30.9715C241.186 33.1107 240.33 36.0342 240.33 39.7421C240.33 43.1648 241.186 46.0171 242.897 48.2988C244.751 50.5806 247.318 52.5772 250.598 54.2885L263.219 61.1339C267.64 63.5583 271.562 66.054 274.985 68.621C278.55 71.0454 281.545 73.8264 283.969 76.9638C286.536 79.9587 288.461 83.4527 289.745 87.4458C291.029 91.2963 291.67 95.8599 291.67 101.137C291.67 114.257 287.962 124.168 280.547 130.871C273.273 137.431 263.647 140.711 251.668 140.711C239.688 140.711 229.991 137.289 222.575 130.443C215.159 123.598 211.451 112.973 211.451 98.5695V93.4355H239.046ZM380.998 101.778C380.998 113.615 377.718 122.814 371.157 129.374C364.74 135.791 354.472 139 340.353 139H298.425V4.23176H340.139C346.985 4.23176 352.832 5.08744 357.681 6.79878C362.529 8.51013 366.451 10.9345 369.446 14.072C372.584 17.2094 374.865 20.9887 376.291 25.4096C377.718 29.8306 378.431 34.6794 378.431 39.956C378.431 48.3701 376.22 55.2155 371.799 60.4922C367.521 65.6262 362.03 68.7636 355.328 69.9045C363.456 71.4733 369.731 74.9673 374.152 80.3865C378.716 85.6632 380.998 92.7937 380.998 101.778ZM329.016 82.7396V113.758H336.931C342.35 113.758 345.986 112.474 347.84 109.907C349.837 107.198 350.835 103.347 350.835 98.3556C350.835 93.6494 349.837 89.8702 347.84 87.018C345.986 84.1657 342.35 82.7396 336.931 82.7396H329.016ZM329.016 58.9947H336.075C341.494 58.9947 345.059 57.6399 346.771 54.9303C348.482 52.0781 349.338 48.5841 349.338 44.4483C349.338 40.17 348.482 36.6047 346.771 33.7524C345.059 30.7576 341.494 29.2602 336.075 29.2602H329.016V58.9947ZM439.327 4.23176H470.345L438.899 91.7242V139H408.309V91.7242L376.863 4.23176H409.379L424.995 53.8607L439.327 4.23176ZM474.094 4.23176H504.684V30.1158C504.684 39.3856 502.188 46.1597 497.197 50.438C492.348 54.7164 484.647 56.9982 474.094 57.2834V42.9509C478.657 42.8083 482.08 41.9526 484.362 40.3839C486.644 38.6725 487.856 35.749 487.998 31.6132H474.094V4.23176ZM536.735 93.4355V98.7834C536.735 103.775 537.804 107.839 539.944 110.977C542.083 113.972 545.22 115.469 549.356 115.469C556.772 115.469 560.48 111.619 560.48 103.917C560.48 100.067 559.339 97.1434 557.057 95.1468C554.775 93.1503 551.566 91.0111 547.431 88.7293L536.093 82.5257C532.528 80.5291 529.105 78.3899 525.825 76.1082C522.688 73.8264 519.835 71.1167 517.268 67.9793C514.844 64.8418 512.919 61.2052 511.493 57.0695C510.066 52.7911 509.353 47.7284 509.353 41.8813C509.353 35.8916 510.28 30.4724 512.134 25.6236C513.988 20.7747 516.627 16.639 520.049 13.2163C523.472 9.79363 527.536 7.15531 532.243 5.30136C536.949 3.44741 542.225 2.52043 548.072 2.52043C560.48 2.52043 570.035 6.01442 576.737 13.0024C583.44 19.9904 586.792 30.4011 586.792 44.2344V49.5824H559.196V44.0205C559.196 33.182 555.488 27.7627 548.072 27.7627C544.792 27.7627 542.297 28.8323 540.585 30.9715C538.874 33.1107 538.018 36.0342 538.018 39.7421C538.018 43.1648 538.874 46.0171 540.585 48.2988C542.439 50.5806 545.006 52.5772 548.286 54.2885L560.908 61.1339C565.329 63.5583 569.25 66.054 572.673 68.621C576.238 71.0454 579.233 73.8264 581.658 76.9638C584.225 79.9587 586.15 83.4527 587.433 87.4458C588.717 91.2963 589.359 95.8599 589.359 101.137C589.359 114.257 585.651 124.168 578.235 130.871C570.962 137.431 561.335 140.711 549.356 140.711C537.377 140.711 527.679 137.289 520.263 130.443C512.847 123.598 509.139 112.973 509.139 98.5695V93.4355H536.735ZM621.809 139V4.23176H687.482V30.1158H653.255V61.3478H678.283V86.804H653.255V139H621.809ZM726.162 4.23176V139H694.717V4.23176H726.162ZM767.108 4.23176V113.116H803.474V139H735.662V4.23176H767.108ZM878.898 139H810.658V4.23176H878.898V30.1158H841.462V57.7112H869.272V83.3814H841.462V113.116H878.898V139ZM911.718 93.4355V98.7834C911.718 103.775 912.787 107.839 914.927 110.977C917.066 113.972 920.203 115.469 924.339 115.469C931.755 115.469 935.463 111.619 935.463 103.917C935.463 100.067 934.322 97.1434 932.04 95.1468C929.758 93.1503 926.549 91.0111 922.414 88.7293L911.076 82.5257C907.511 80.5291 904.088 78.3899 900.808 76.1082C897.67 73.8264 894.818 71.1167 892.251 67.9793C889.827 64.8418 887.902 61.2052 886.475 57.0695C885.049 52.7911 884.336 47.7284 884.336 41.8813C884.336 35.8916 885.263 30.4724 887.117 25.6236C888.971 20.7747 891.609 16.639 895.032 13.2163C898.455 9.79363 902.519 7.15531 907.225 5.30136C911.932 3.44741 917.208 2.52043 923.055 2.52043C935.463 2.52043 945.018 6.01442 951.72 13.0024C958.423 19.9904 961.775 30.4011 961.775 44.2344V49.5824H934.179V44.0205C934.179 33.182 930.471 27.7627 923.055 27.7627C919.775 27.7627 917.28 28.8323 915.568 30.9715C913.857 33.1107 913.001 36.0342 913.001 39.7421C913.001 43.1648 913.857 46.0171 915.568 48.2988C917.422 50.5806 919.989 52.5772 923.269 54.2885L935.89 61.1339C940.311 63.5583 944.233 66.054 947.656 68.621C951.221 71.0454 954.216 73.8264 956.64 76.9638C959.208 79.9587 961.133 83.4527 962.416 87.4458C963.7 91.2963 964.342 95.8599 964.342 101.137C964.342 114.257 960.634 124.168 953.218 130.871C945.945 137.431 936.318 140.711 924.339 140.711C912.36 140.711 902.662 137.289 895.246 130.443C887.83 123.598 884.122 112.973 884.122 98.5695V93.4355H911.718Z" />
          </svg>
        </div>
      </div>

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
        <div className={styles.caseContentInner}>
          {/* 3D Case Folder */}
          <div
            ref={folderRef}
            className={styles.caseFolder}
            style={
              !initialUnfolded
                ? {
                    transform: `translate3d(-20px, ${folderStartDelta}px, 0) rotate(0deg)`,
                    transformOrigin: "right bottom",
                  }
                : undefined
            }
          >
            {/* 3D Flap Cover */}
            <div
              ref={coverRef}
              className={styles.caseFolderCover}
              style={{
                transform: !initialUnfolded ? "rotateY(0deg)" : "rotateY(-180deg)",
              }}
            >
              <div className={styles.caseFolderCoverFront} />
              <div className={styles.caseFolderCoverBack} />
              <div className={styles.caseFolderCoverShadow} />
            </div>

            {/* Inner Folder with Archival Cream Sheet */}
            <div className={styles.caseFolderInner}>
              {/* Vertical Tabs on Right Spine (placed inside with z-index: -1 to peek behind folder edge) */}
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
                        <div className={styles.contentPaperclip}>
                          <svg
                            width="20"
                            height="89"
                            viewBox="0 0 24 107"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M2.05513 5.28193C4.21232 2.09502 7.8614 0.000174314 11.9995 3.55316e-05C18.6269 3.55316e-05 23.9995 5.37279 23.9996 12.0001L24.0003 95.0002C24.0003 101.628 18.6275 107 12.0002 107C5.37279 107 0.00010339 101.628 0.00010339 95.0002L0.00010339 42.905H1.99989L1.99989 95.0002C1.99989 100.523 6.47735 105.001 12.0002 105.001C17.5229 105 22.0005 100.523 22.0005 95.0002L21.9998 12.0001C21.9997 6.47745 17.5229 2.00066 12.0002 2.00051C8.34976 2.00051 5.15651 3.95666 3.41065 6.87775L2.05513 5.28193Z"
                              fill="#191919"
                            />
                          </svg>
                        </div>
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
              <div
                ref={scrapbookRef}
                className={styles.caseFolderScrapbook}
                style={{ opacity: !initialUnfolded ? 0 : 1 }}
              >
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
      <div className={`${styles.caseNextWidget} ${isNearBottom ? styles.caseNextWidgetVisible : ""}`}>
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
