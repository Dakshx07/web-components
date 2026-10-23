"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import gsap from "gsap";
import { FolderGroupConfig, ArchitectCase } from "./types";
import { FolderTab } from "./FolderTab";
import { TheFooter } from "./TheFooter";
import styles from "./FolderStackAnimation.module.css";
import { soundFx } from "./soundFx";
import { getNextCaseTarget } from "./caseSequence";
import { ARCHITECT_ARCHIVES, DraggableItem } from "./architectScrapbookData";

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
  folderStartWidth?: number;
  isClosingToStack?: boolean;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  group,
  allGroups,
  currentCase,
  activeCaseIndex,
  onSelectCase,
  onClose,
  coverRef,
  folderRef,
  tagsRef,
  topTabsRef,
  scrapbookRef,
  heroTitleRef,
  initialUnfolded = true,
  folderStartDelta = 420,
  folderStartWidth,
  isClosingToStack = false,
}) => {
  // Mosby Ground-Truth Overscroll Engine
  const [isScrolled, setIsScrolled] = useState(false);
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);
  const [isOverscroll, setIsOverscroll] = useState(false);
  const [overscrollAmount, setOverscrollAmount] = useState(0);

  const overscrollProgress = Math.min(overscrollAmount / 2000, 1);

  const nextTarget = useMemo(() => {
    return getNextCaseTarget(currentCase.slug, allGroups || [group]);
  }, [currentCase.slug, allGroups, group]);

  const nextCase = nextTarget.case;
  const nextGroup = nextTarget.group;
  const nextGroupIndex = nextTarget.groupIndex;
  const nextCaseIndex = nextTarget.caseIndex;

  const hasNavigatedRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const archive = useMemo(() => {
    return ARCHITECT_ARCHIVES[currentCase.slug] || ARCHITECT_ARCHIVES["mary-colter"];
  }, [currentCase.slug]);

  const [positions, setPositions] = useState<Record<string, DraggableItem>>(
    () => archive.initialPositions
  );

  const [prevSlug, setPrevSlug] = useState(currentCase.slug);
  if (prevSlug !== currentCase.slug) {
    setPrevSlug(currentCase.slug);
    setPositions(archive.initialPositions);
    setOverscrollAmount(0);
    setIsOverscroll(false);
  }

  useEffect(() => {
    hasNavigatedRef.current = false;
  }, [currentCase.slug]);

  const triggerNext = useCallback(() => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    soundFx.playPaperRustle();
    onSelectCase(nextGroupIndex, nextCaseIndex);
  }, [onSelectCase, nextGroupIndex, nextCaseIndex]);

  // Translate page content smoothly upward with physical resistance as overscroll accumulates
  useEffect(() => {
    if (contentRef.current) {
      gsap.to(contentRef.current, {
        duration: 0.3,
        ease: "power1.out",
        y: `${-5 * overscrollProgress}vh`,
      });
    }
  }, [overscrollProgress]);

  // When overscrollProgress hits 100%, trigger navigation with 350ms momentum delay (matching Mosby)
  useEffect(() => {
    if (overscrollProgress >= 1 && !hasNavigatedRef.current) {
      const timer = setTimeout(() => {
        triggerNext();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [overscrollProgress, triggerNext]);

  // Mosby Ground Truth: Scroll listener with 100px bottom threshold
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      const scrollMax = document.documentElement.scrollHeight - window.innerHeight;

      setIsScrolled(y > 180);
      setIsWidgetVisible(y > 300);

      // Mosby 1:1: Activate overscroll state only within bottom 100px threshold
      if (scrollMax > 200 && y >= scrollMax - 100) {
        setIsOverscroll(true);
      } else {
        setIsOverscroll(false);
        setOverscrollAmount(0);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    if (typeof window !== "undefined" && (window as unknown as { __lenis?: { on: (event: string, cb: () => void) => void; off: (event: string, cb: () => void) => void } }).__lenis) {
      (window as unknown as { __lenis: { on: (event: string, cb: () => void) => void; off: (event: string, cb: () => void) => void } }).__lenis.on("scroll", handleScroll);
    }
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (typeof window !== "undefined" && (window as unknown as { __lenis?: { on: (event: string, cb: () => void) => void; off: (event: string, cb: () => void) => void } }).__lenis) {
        (window as unknown as { __lenis: { on: (event: string, cb: () => void) => void; off: (event: string, cb: () => void) => void } }).__lenis.off("scroll", handleScroll);
      }
    };
  }, []);

  // Mosby Ground Truth: Wheel listener accumulating deltaY up to 2,000px resistance
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (hasNavigatedRef.current) return;
      if (!isOverscroll) return;

      if (e.deltaY > 0) {
        const delta = Math.min(e.deltaY, 100);
        setOverscrollAmount((prev) => Math.min(2000, prev + delta));
      } else if (e.deltaY < 0) {
        setOverscrollAmount(0);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [isOverscroll]);

  // Touch listener for touch gestures
  useEffect(() => {
    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!isOverscroll || hasNavigatedRef.current) return;
      const currentY = e.touches[0].clientY;
      const delta = startY - currentY;
      if (delta > 0) {
        setOverscrollAmount((prev) => Math.min(2000, prev + Math.min(delta, 100)));
      } else if (delta < 0) {
        setOverscrollAmount(0);
      }
      startY = currentY;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isOverscroll]);

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

      {/* Main Page Case Content Wrapper (lifts on overscroll matching Mosby 1:1) */}
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
        <div className={styles.caseContentInner}>
          {/* 3D Case Folder */}
          <div
            ref={folderRef}
            className={styles.caseFolder}
            style={
              !initialUnfolded
                ? {
                    transform: `translate3d(0px, ${folderStartDelta}px, 0) rotate(0deg)`,
                    transformOrigin: "right bottom",
                    ...(folderStartWidth ? { width: `${folderStartWidth}px` } : {}),
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
              <div
                className={styles.caseFolderCoverBack}
                style={{
                  backgroundColor: currentCase.color,
                }}
              >
                <div className={styles.caseFolderCoverBackOverlay} />
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

                  {/* Left Spine Punch Holes (9 holes matching Mosby) */}
                  <div className={styles.caseFolderSheetClip}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
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
                {archive.clusters.map((cluster) => (
                  <div
                    key={cluster.card.id}
                    className={styles.scrapbookCluster}
                    style={{
                      top: cluster.top,
                      left: cluster.left,
                      width: cluster.width,
                      height: cluster.height,
                    }}
                  >
                    {/* Draggable Note Card */}
                    <div
                      className={`${styles.scrapbookItemDraggable} ${
                        cluster.card.cardStyle === "teal"
                          ? styles.scrapbookCardTeal
                          : cluster.card.cardStyle === "rose"
                          ? styles.scrapbookCardRose
                          : cluster.card.cardStyle === "purple"
                          ? styles.scrapbookCardPurple
                          : styles.scrapbookCardYellow
                      }`}
                      onPointerDown={(e) => handlePointerDown(cluster.card.id, e)}
                      style={{
                        transform: `translate(${positions[cluster.card.id]?.x ?? 0}px, ${
                          positions[cluster.card.id]?.y ?? 0
                        }px) rotate(${positions[cluster.card.id]?.rotation ?? 0}deg)`,
                        width: cluster.card.width,
                        minHeight: cluster.card.minHeight,
                        zIndex: positions[cluster.card.id]?.zIndex ?? 14,
                      }}
                    >
                      <h3 className={styles.scrapbookCardTitle}>{cluster.card.title}</h3>
                      <p className={styles.scrapbookCardText}>{cluster.card.text}</p>
                    </div>

                    {/* Draggable Photos / Blueprints / Postcards */}
                    {cluster.photos.map((photo) => {
                      const itemPos = positions[photo.id];
                      return (
                        <div
                          key={photo.id}
                          className={`${styles.scrapbookItemDraggable} ${
                            photo.photoStyle === "blueprint"
                              ? styles.blueprintBorder
                              : photo.photoStyle === "postcard"
                              ? styles.postcardBorder
                              : styles.vintagePhotoBorder
                          }`}
                          onPointerDown={(e) => handlePointerDown(photo.id, e)}
                          style={{
                            transform: `translate(${itemPos?.x ?? 0}px, ${itemPos?.y ?? 0}px) rotate(${
                              itemPos?.rotation ?? 0
                            }deg)`,
                            width: photo.width,
                            zIndex: itemPos?.zIndex ?? 10,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.src} alt={photo.alt} />
                        </div>
                      );
                    })}

                    {/* Optional Archival Wire Paperclip */}
                    {cluster.hasPaperclip && (
                      <div
                        className={styles.scrapbookItemDraggable}
                        onPointerDown={(e) => handlePointerDown("hopiPaperclip", e)}
                        style={{
                          transform: `translate(${positions.hopiPaperclip?.x ?? 420}px, ${
                            positions.hopiPaperclip?.y ?? 23
                          }px) rotate(${positions.hopiPaperclip?.rotation ?? 180}deg)`,
                          width: "36px",
                          zIndex: positions.hopiPaperclip?.zIndex ?? 16,
                        }}
                      >
                        <svg
                          width="32"
                          height="100"
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
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Emerging Next Folder at bottom of case scroll (Matching Mosby 1:1) */}
        <div
          className={styles.caseNextFolder}
          style={{
            "--next-folder-bg": nextCase.color,
            "--next-folder-color": nextCase.theme === "dark" ? "#000000" : "#ffffff",
          } as React.CSSProperties}
          onClick={triggerNext}
        >
          <div className={styles.caseNextFolderInner}>
            <h1 className={styles.caseNextFolderTitle}>
              {nextCase.name}
            </h1>
          </div>
        </div>
      </div>

      {/* Pinned Bottom-Right Next Architect Widget (Matching Mosby 1:1) */}
      <div
        className={`${styles.caseNextWidget} ${
          !isWidgetVisible ? styles.caseNextWidgetDisabled : ""
        } ${isOverscroll ? styles.caseNextWidgetOverscroll : ""}`}
        style={{
          "--next-folder-bg": nextCase.color,
          "--next-folder-color": nextCase.theme === "dark" ? "#000000" : "#ffffff",
        } as React.CSSProperties}
      >
        {/* Info Card (Square Block above button) */}
        <div className={styles.caseNextInfo} onClick={triggerNext}>
          <div className={styles.caseNextInfoInner}>
            <div className={styles.caseNextName}>{nextCase.name}</div>
            <div className={styles.caseNextCategory}>{nextGroup.category}</div>
          </div>
        </div>

        {/* Action Button & Fill Progress Pill */}
        <div className={styles.caseNextAction} onClick={triggerNext}>
          <div className={styles.caseNextActionInner}>
            <div className={styles.caseNextProgressText}>
              <span>
                Keep scrolling
                <br />
                for the next page
              </span>
            </div>
            <div className={styles.caseNextBtn}>
              <span>Next</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 11V13H16L10.5 18.5L11.92 19.92L19.84 12L11.92 4.08L10.5 5.5L16 11H4Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>
          <div
            className={styles.caseNextProgress}
            style={{
              transform: `translateX(${(-1 + overscrollProgress) * 100}%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
