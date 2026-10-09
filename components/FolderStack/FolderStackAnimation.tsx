"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import gsap from "gsap";
import Lenis from "lenis";
import { FolderGroupConfig, AnimationPhase } from "./types";
import { FolderTab } from "./FolderTab";
import { ReaderView } from "./ReaderView";
import styles from "./FolderStackAnimation.module.css";
import { soundFx } from "./soundFx";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

// Authentic Mosby Files Architecture Archive Data
export const FOLDER_GROUPS: FolderGroupConfig[] = [
  {
    groupId: 0,
    category: "Organic & Early Modernism",
    primaryColor: "#194BFD",
    description:
      "The movement that broke from European convention before Europe finished writing its manifesto. Buildings designed around human life, natural landscape, and open space — where structure followed environment, not the other way around. The root system beneath everything American Modernism would later become.",
    cases: [
      {
        slug: "frank-lloyd-wright",
        name: "Frank Lloyd Wright",
        color: "#194BFD",
        textColor: "#FFFFFF",
        theme: "dark",
        born: "June 8, 1867, Richland Center, Wisconsin, US",
        died: "April 9, 1959 (age 91), Phoenix, Arizona, US",
        location: "Oak Park, Illinois & Spring Green, Wisconsin",
        portrait: "/images/architects/frank-lloyd-wright.avif",
        dropCap: "H",
        leadParagraph:
          "e broke the tyranny of the box: dissolving corners, layering sightlines, letting rooms unfold like thought. And he didn’t stop at walls—light fixtures, furniture, vents, even screws were part of the same vision. Architecture, for Wright, was total.",
        bodyParagraphs: [
          "Prairie School wasn’t a style; it was a philosophy of the horizontal plain, anchored to the midwestern earth with heavy masonry chimneys and sweeping overhangs.",
          "Decades before organic architecture became a catchphrase, Wright treated reinforced concrete, glass, and local stone as living organisms whose purpose was to elevate human consciousness.",
        ],
        scrapbookItems: [],
      },
      {
        slug: "irving-gill",
        name: "Irving Gill",
        color: "#D7281D",
        textColor: "#FFFFFF",
        theme: "dark",
        born: "April 22, 1870, Tully, New York, US",
        died: "October 7, 1936 (age 66), Carlsbad, California, US",
        location: "San Diego & Los Angeles, California",
        portrait: "/images/architects/irving-gill.avif",
        dropCap: "P",
        leadParagraph:
          "ioneer of tilt-up concrete slabs and unadorned cubist geometry. Gill stripped architecture down to pure sunlight and silent plane decades before the European avant-garde.",
        bodyParagraphs: [
          "In the dry glare of Southern California, Gill eliminated mouldings, baseboards, and decorative clutter, creating sanitarily pure interiors lit by arched arcades.",
        ],
        scrapbookItems: [],
      },
    ],
  },
  {
    groupId: 1,
    category: "Expressive",
    primaryColor: "#0F7E53",
    description:
      "A radical departure from rectilinear rigidity into sculptural dynamism. Architecture that bends, folds, and collides with convention, questioning the boundary between structural enclosure and expressive monumental sculpture.",
    cases: [
      {
        slug: "frank-gehry",
        name: "Frank Gehry",
        color: "#0F7E53",
        textColor: "#FFFFFF",
        theme: "dark",
        born: "February 28, 1929, Toronto, Ontario, Canada",
        died: "Active",
        location: "Los Angeles, California",
        portrait: "/images/architects/frank-gehry.avif",
        dropCap: "W",
        leadParagraph:
          "hat if a building could capture the fluid gesture of an artist’s sketch? Gehry collided industrial chain-link, titanium curves, and fractured plywood into breathtaking spatial poetry.",
        bodyParagraphs: [
          "Rejecting the sterile corporate curtain-wall, his work reimagined the city as a landscape of dynamic, dancing sculptural forms.",
        ],
        scrapbookItems: [],
      },
    ],
  },
  {
    groupId: 2,
    category: "Monumental Modernism",
    primaryColor: "#7E1A7A",
    description:
      "Architecture at the scale of civilization — civic, institutional, and built to outlast the moment. These buildings draw on mass, geometry, and the precise control of light to create spaces that feel both inevitable and timeless. Modernism stripped of sentimentality, left with only what matters.",
    cases: [
      {
        slug: "louis-kahn",
        name: "Louis Kahn",
        color: "#7E1A7A",
        textColor: "#FFFFFF",
        theme: "dark",
        born: "March 5, 1901, Kuressaare, Estonia",
        died: "March 17, 1974 (age 73), New York City, US",
        location: "Philadelphia, Pennsylvania",
        portrait: "/images/architects/louis-kahn.avif",
        dropCap: "T",
        leadParagraph:
          "he sun never knew how great it was until it struck the side of a building. Kahn gave monolithic poured concrete the spiritual gravity of ancient Roman ruins.",
        bodyParagraphs: [
          "From the Salk Institute overlooking the Pacific to the National Parliament of Bangladesh, Kahn organized served and servant spaces with geometric purity.",
        ],
        scrapbookItems: [],
      },
      {
        slug: "i-m-pei",
        name: "I. M. Pei",
        color: "#F3CA28",
        textColor: "#000000",
        theme: "light",
        born: "April 26, 1917, Guangzhou, China",
        died: "May 16, 2019 (age 102), New York City, US",
        location: "New York City, US",
        portrait: "/images/architects/i-m-pei.avif",
        dropCap: "M",
        leadParagraph:
          "aster of crystalline geometry and razor-sharp poured concrete. Pei fused Eastern restraint with monumental Western civic ambitions.",
        bodyParagraphs: [
          "His trapezoids and glass pyramids redefined the National Gallery East Building and the Grand Louvre with breathtaking precision.",
        ],
        scrapbookItems: [],
      },
      {
        slug: "paul-rudolph",
        name: "Paul Rudolph",
        color: "#111111",
        textColor: "#FFFFFF",
        theme: "dark",
        born: "October 23, 1918, Elkton, Kentucky, US",
        died: "August 8, 1997 (age 78), New York City, US",
        location: "Sarasota, Florida & New Haven, Connecticut",
        portrait: "/images/architects/paul-rudolph.avif",
        dropCap: "C",
        leadParagraph:
          "hiseled corduroy ribbed concrete and dizzying multi-level interlocking planes. Rudolph pushed American Brutalism to its most dramatic spatial extremes.",
        bodyParagraphs: [
          "The Yale Art & Architecture Building remains a towering manifesto of 37 interlocking levels compressed into seven floors of intense heroic light.",
        ],
        scrapbookItems: [],
      },
    ],
  },
  {
    groupId: 3,
    category: "Contextual & Transitional Architecture",
    primaryColor: "#D6231B",
    description:
      "Architecture shaped by place, culture, and continuity rather than formal invention alone. Mix of tradition and modernity through local materials, historical reference, and environmental logic that resist the impulse to impose and choose instead to belong. A quiet but foundational thread in the fabric of American architectural identity.",
    cases: [
      {
        slug: "mary-colter",
        name: "Mary Colter",
        color: "#D6231B",
        textColor: "#FFFFFF",
        theme: "dark",
        born: "April 4, 1869, Pittsburgh, Pennsylvania, US",
        died: "January 8, 1958 (age 88), Santa Fe, New Mexico, US",
        location: "Grand Canyon National Park, Arizona",
        portrait: "/images/architects/mary-colter.avif",
        dropCap: "W",
        leadParagraph:
          "hile others designed buildings, Mary Colter designed encounters. Long before “experience design” became a discipline, she was choreographing how a visitor approaches the rim, where they pause, what they see framed against the horizon. Architecture, for Colter, was staging—but never stage set.",
        bodyParagraphs: [
          "Her structures at the Grand Canyon don’t compete with the landscape; they disguise themselves within it. Stone bleeds into cliff. Rooflines echo ridges. She blended Pueblo, tribal, and Spanish Colonial references into a language that felt native rather than imposed—often hiring indigenous artists and craftspeople to execute murals and stonework.",
          "As primary architect for the Fred Harvey Company and the Santa Fe Railway, she invented an American vernacular out of raw desert rock and ancient timber.",
        ],
        scrapbookItems: [
          {
            id: "hopi-house-note",
            type: "note",
            title: "HOPI HOUSE (1905)",
            desc: "A marketplace shaped like a terraced Pueblo dwelling, built with local Kaibab limestone to honor indigenous craftsmen.",
            width: 260,
            initialX: 40,
            initialY: 420,
            rotation: -2,
            zIndex: 10,
          },
          {
            id: "postcard-1",
            type: "postcard",
            src: "/images/architects/postcard.avif",
            width: 240,
            initialX: 180,
            initialY: 280,
            rotation: 3,
            zIndex: 12,
          },
          {
            id: "hopi-drawing",
            type: "drawing",
            src: "/images/architects/hopi-house-drawing.avif",
            width: 320,
            initialX: 260,
            initialY: 410,
            rotation: -1,
            zIndex: 15,
          },
        ],
      },
      {
        slug: "louis-sullivan",
        name: "Louis Sullivan",
        color: "#1B49DC",
        textColor: "#FFFFFF",
        theme: "dark",
        born: "September 3, 1856, Boston, Massachusetts, US",
        died: "April 14, 1924 (age 67), Chicago, Illinois, US",
        location: "Chicago, Illinois & St. Louis, Missouri",
        portrait: "/images/architects/louis-sullivan.avif",
        dropCap: "L",
        leadParagraph:
          "ouis Sullivan gave the skyscraper its grammar. While steel frames were already rising in Chicago, he made height legible. Not a stack of floors—a vertical organism with base, shaft, and crown. Structure became sentence.",
        bodyParagraphs: [
          "In 1896, he wrote the line that would echo across continents: form ever follows function. For Sullivan, this wasn't austerity. Function generated expression. Offices demanded vertical rhythm; retail demanded openness at the corner. Even his ornament—lush, botanical, tightly disciplined—grew from structure rather than masking it. Controlled organicism, never chaos.",
          "In the Wainwright Building and the Guaranty Building, he translated iron engineering into architectural dignity.",
        ],
        scrapbookItems: [],
      },
    ],
  },
];

export const FolderStackAnimation: React.FC = () => {
  const [phase, setPhase] = useState<AnimationPhase>("stack");
  const [hoveredGroupId, setHoveredGroupId] = useState<number>(-1);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(3); // Default to Group 4 (Contextual: Mary Colter & Louis Sullivan)
  const [activeCaseIndex, setActiveCaseIndex] = useState<number>(0); // Default to Mary Colter

  // Refs for GSAP choreography
  const stackRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroDescRef = useRef<HTMLParagraphElement>(null);

  // Case view refs for enter animation
  const caseCoverRef = useRef<HTMLDivElement | null>(null);
  const caseTagsRef = useRef<HTMLDivElement | null>(null);
  const caseScrapbookRef = useRef<HTMLDivElement | null>(null);
  const caseHeroTitleRef = useRef<HTMLHeadingElement | null>(null);

  const activeGroup = FOLDER_GROUPS[activeGroupIndex];
  const activeCase = activeGroup?.cases[activeCaseIndex] || activeGroup?.cases[0];

  const setGroupRef = useCallback((id: number) => {
    return (el: HTMLDivElement | null) => {
      groupRefs.current.set(id, el);
    };
  }, []);

  // Initialize Lenis for authentic buttery-smooth scrolling
  useEffect(() => {
    if (typeof window === "undefined") return;

    let lenis: Lenis | null = null;
    let animId: number;

    try {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });

      window.__lenis = lenis;

      function raf(time: number) {
        lenis?.raf(time);
        animId = requestAnimationFrame(raf);
      }
      animId = requestAnimationFrame(raf);
    } catch (e) {
      console.warn("Lenis initialization error:", e);
    }

    return () => {
      cancelAnimationFrame(animId);
      lenis?.destroy();
    };
  }, []);

  // Recalculate Lenis scroll dimensions whenever phase or case changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      if (window.__lenis) {
        window.__lenis.resize();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [phase, activeCaseIndex]);

  // Open Folder animation: matches exact Mosby DwAQhwlc.js (Dct + kct)
  const handleOpenFolder = (groupIndex: number, caseIndex: number) => {
    if (phase === "unfolding") return;

    soundFx.playFolderFlap();

    setActiveGroupIndex(groupIndex);
    setActiveCaseIndex(caseIndex);

    // 1. Leave Timeline: Drop sibling folders and hero text
    const tlLeave = gsap.timeline({
      defaults: { ease: "power2.out", duration: 0.75 },
    });

    if (heroDescRef.current) {
      tlLeave.to(heroDescRef.current, { y: "2rem", opacity: 0, duration: 0.45 }, 0.05);
    }
    if (heroTitleRef.current) {
      tlLeave.to(heroTitleRef.current, { y: "2rem", opacity: 0, duration: 0.45, stagger: -0.05 }, 0.15);
    }

    const allGroups = Array.from(groupRefs.current.entries());
    const siblings = allGroups
      .filter(([id]) => id !== groupIndex)
      .map(([, el]) => el)
      .filter(Boolean);

    tlLeave.to(siblings, { yPercent: 120, stagger: 0.1, duration: 0.75 }, 0);

    // Transition into case view after sibling drop
    tlLeave.call(() => {
      setPhase("case-view");

      // Scroll smoothly to top
      window.scrollTo({ top: 0, behavior: "instant" });

      // Run FolderOpenEnter timeline (kct) once mounted
      setTimeout(() => {
        const tlEnter = gsap.timeline({
          defaults: { ease: "power3.inOut", duration: 1.5 },
        });

        // 3D Flap Cover rotation around left spine: 0 to -180deg
        if (caseCoverRef.current) {
          const shadow = caseCoverRef.current.querySelector(`.${styles.caseFolderCoverShadow}`);

          tlEnter.fromTo(
            caseCoverRef.current,
            { rotateY: 0 },
            { rotateY: -180, duration: 1.5, ease: "power3.inOut" },
            0
          );

          if (shadow) {
            tlEnter.to(shadow, { opacity: 1, duration: 0.35 }, 0.25);
            tlEnter.to(shadow, { opacity: 0, duration: 0.3 }, 0.6);
          }
        }

        // Case Hero Title character reveal
        if (caseHeroTitleRef.current) {
          const chars = caseHeroTitleRef.current.querySelectorAll(".case-char");
          if (chars.length > 0) {
            tlEnter.fromTo(
              chars,
              { xPercent: -150, opacity: 0 },
              { xPercent: 0, opacity: 1, duration: 0.65, stagger: 0.025, ease: "power2.out" },
              0.65
            );
          }
        }

        // Vertical tags slide in from below
        if (caseTagsRef.current) {
          tlEnter.from(
            caseTagsRef.current.children,
            { yPercent: 110, duration: 0.75, ease: "power3.out" },
            0.85
          );
        }

        // Scrapbook items drop in
        if (caseScrapbookRef.current) {
          const items = caseScrapbookRef.current.querySelectorAll(`.${styles.scrapbookItemDraggable}`);
          if (items.length > 0) {
            tlEnter.from(
              items,
              { y: "50vh", opacity: 0, duration: 0.5, ease: "power3.out", stagger: 0.05 },
              1.0
            );
          }
        }
      }, 50);
    });
  };

  // Close Folder: Reverses back to accordion stack (Rct + zct)
  const handleCloseToStack = () => {
    soundFx.playFolderFlap();

    // 1. Animate cover back to closed (rotateY: 0)
    const tlClose = gsap.timeline({
      defaults: { ease: "power3.inOut", duration: 1.2 },
      onComplete: () => {
        setPhase("stack");

        // Scroll back to top
        window.scrollTo({ top: 0, behavior: "instant" });

        // Sibling folders slide back up
        setTimeout(() => {
          const allGroups = Array.from(groupRefs.current.entries());
          const siblings = allGroups
            .filter(([id]) => id !== activeGroupIndex)
            .map(([, el]) => el)
            .filter(Boolean);

          const tlRestore = gsap.timeline({
            defaults: { duration: 0.9, ease: "power4.out" },
          });

          tlRestore.fromTo(
            siblings,
            { yPercent: 120 },
            { yPercent: 0, duration: 0.9, stagger: 0.1, clearProps: "yPercent" },
            0
          );

          if (heroTitleRef.current) {
            tlRestore.fromTo(
              heroTitleRef.current,
              { y: "2rem", opacity: 0 },
              { y: 0, opacity: 1, duration: 0.8 },
              0.2
            );
          }
          if (heroDescRef.current) {
            tlRestore.fromTo(
              heroDescRef.current,
              { y: "2rem", opacity: 0 },
              { y: 0, opacity: 1, duration: 0.65 },
              0.4
            );
          }
        }, 50);
      },
    });

    if (caseCoverRef.current) {
      tlClose.to(caseCoverRef.current, { rotateY: 0, duration: 1.2, ease: "power3.inOut" }, 0);
    }
    if (caseScrapbookRef.current) {
      tlClose.to(caseScrapbookRef.current, { opacity: 0, duration: 0.35 }, 0);
    }
  };

  // Switch between sibling cases inside open dossier (e.g. Mary Colter <-> Louis Sullivan)
  const handleSelectCase = (caseIndex: number) => {
    soundFx.playPaperRustle();

    const items = document.querySelectorAll(`.${styles.scrapbookItemDraggable}`);
    const sheet = document.querySelector(`.${styles.caseFolderSheet}`);

    if (items.length > 0) {
      gsap.to(items, {
        y: "+=120",
        opacity: 0,
        duration: 0.22,
        stagger: 0.015,
        ease: "power2.in",
        onComplete: () => {
          setActiveCaseIndex(caseIndex);
          if (typeof window !== "undefined" && window.__lenis) {
            window.__lenis.scrollTo(0, { immediate: true });
          } else {
            window.scrollTo({ top: 0, behavior: "instant" });
          }

          setTimeout(() => {
            if (sheet) {
              gsap.fromTo(
                sheet,
                { y: 50, opacity: 0.7 },
                { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
              );
            }
            const newItems = document.querySelectorAll(`.${styles.scrapbookItemDraggable}`);
            if (newItems.length > 0) {
              gsap.fromTo(
                newItems,
                { y: 70, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.55, stagger: 0.03, ease: "power3.out" }
              );
            }
          }, 50);
        },
      });
    } else {
      setActiveCaseIndex(caseIndex);
      if (typeof window !== "undefined" && window.__lenis) {
        window.__lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    }
  };

  return (
    <div className={`${styles.pageHome} ${phase === "case-view" ? styles.pageCaseActive : ""}`}>
      {/* Top Header */}
      <header className={styles.theHeader}>
        <div
          className={styles.theLogo}
          onClick={phase === "case-view" ? handleCloseToStack : undefined}
          style={{ cursor: phase === "case-view" ? "pointer" : "default" }}
        >
          MOSBY’S FILES
        </div>
        <nav className={styles.theNav}>
          <a
            href="https://www.mosbyfiles.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.theNavItem}
          >
            About
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      {phase !== "case-view" && (
        <section className={styles.sectionHero}>
          <div className={styles.sectionHeroInner}>
            <h1 ref={heroTitleRef} className={styles.sectionHeroTitle}>
              AMERICAN MODERNISM
            </h1>
            <p ref={heroDescRef} className={styles.sectionHeroDesc}>
              A project exploring early 20th-century American architects, contrasting them
              with European Modernism and revealing a distinct American path of functionalism
              that shaped contemporary architecture
            </p>
          </div>
        </section>
      )}

      {/* Main Interactive Scene */}
      {phase !== "case-view" ? (
        <div className={styles.pageHomeStack}>
          <div ref={stackRef} className={styles.stack}>
            {FOLDER_GROUPS.map((group, gIdx) => {
              const isLast = gIdx === FOLDER_GROUPS.length - 1;
              const isHovered = hoveredGroupId === group.groupId;
              const isRotated = isHovered || (hoveredGroupId === -1 && isLast);
              const zIndex = group.groupId + 1;
              const reverseIdx = FOLDER_GROUPS.length - group.groupId - 1;

              return (
                <div
                  key={group.groupId}
                  ref={setGroupRef(group.groupId)}
                  className={`${styles.stackGroup} ${isRotated ? styles.isRotated : ""}`}
                  style={
                    {
                      "--cover-bg-color": group.primaryColor,
                      "--cover-color": "#FFFFFF",
                      "--group-id": group.groupId + 1,
                      "--reverse-idx": reverseIdx,
                      zIndex: zIndex,
                    } as React.CSSProperties
                  }
                  onMouseEnter={() => setHoveredGroupId(group.groupId)}
                  onMouseLeave={() => setHoveredGroupId(-1)}
                >
                  <div className={styles.stackGroupInner}>
                    {/* Folder Cover */}
                    <div
                      className={`${styles.stackCover} ${isHovered ? styles.isHovered : ""} ${
                        isRotated ? styles.isRotated : ""
                      }`}
                    >
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

                      {/* Description on active folder */}
                      {(isHovered || (hoveredGroupId === -1 && isLast)) && (
                        <div className={styles.stackCoverDesc}>
                          {group.description}
                        </div>
                      )}
                    </div>

                    {/* Stack Pages & Top Tabs */}
                    <div className={styles.stackPage}>
                      <div className={styles.stackPageHeader}>
                        {group.cases.map((c, cIdx) => (
                          <FolderTab
                            key={c.slug}
                            label={c.name}
                            color={c.color}
                            textColor={c.textColor}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFolder(gIdx, cIdx);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Full Scrollable Case Dossier View */
        <ReaderView
          key={activeCase.slug}
          group={activeGroup}
          currentCase={activeCase}
          activeCaseIndex={activeCaseIndex}
          onSelectCase={handleSelectCase}
          onClose={handleCloseToStack}
          coverRef={caseCoverRef}
          tagsRef={caseTagsRef}
          scrapbookRef={caseScrapbookRef}
          heroTitleRef={caseHeroTitleRef}
        />
      )}
    </div>
  );
};

