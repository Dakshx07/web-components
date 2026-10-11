"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import gsap from "gsap";
import Lenis from "lenis";
import { FolderGroupConfig, AnimationPhase } from "./types";
import { FolderTab } from "./FolderTab";
import { ReaderView } from "./ReaderView";
import { TheFooter } from "./TheFooter";
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
      "Where function alone was never enough. These architects pushed form, material, and structure into territory that was confrontational, sculptural, and deeply personal. Every surface carried an argument, every material choice a point of view. Buildings that refused to stand quietly in the background and never apologized for it.",
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
  const [unfoldedGroupId, setUnfoldedGroupId] = useState<number>(3); // Group 3 (Contextual Architecture / Red) unfolded by default
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(3); // Default to Group 4 (Contextual: Mary Colter & Louis Sullivan)
  const [activeCaseIndex, setActiveCaseIndex] = useState<number>(0); // Default to Mary Colter
  const [folderStartDelta, setFolderStartDelta] = useState<number>(420);

  // Refs for GSAP choreography
  const stackRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroDescRef = useRef<HTMLParagraphElement>(null);

  // Case view refs for enter animation
  const caseFolderRef = useRef<HTMLDivElement | null>(null);
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

  // Scroll mapping on Home Stack (authentically transitions folder groups as user scrolls)
  useEffect(() => {
    if (phase !== "stack") return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 40) return;
      const progress = scrollY / docHeight;

      if (scrollY < 30) {
        setUnfoldedGroupId(3); // Resting top: Red folder open (default Mosby archival state)
      } else if (progress < 0.28) {
        setUnfoldedGroupId(0); // Blue
      } else if (progress < 0.58) {
        setUnfoldedGroupId(1); // Green
      } else if (progress < 0.85) {
        setUnfoldedGroupId(2); // Purple
      } else {
        setUnfoldedGroupId(3); // Red
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [phase]);

  // Open Folder handler: synchronously measures delta and triggers unfolding phase
  const handleOpenFolder = (groupIndex: number, caseIndex: number) => {
    if (phase === "unfolding" || phase === "case-view" || phase === "closing-to-stack") return;

    soundFx.playFolderFlap();

    // Measure deltaY from clicked folder in stack to reader dock top (216px)
    const clickedEl = groupRefs.current.get(groupIndex);
    let deltaY = 420;
    if (clickedEl) {
      const rect = clickedEl.getBoundingClientRect();
      deltaY = Math.max(80, Math.round(rect.top - 216));
    }

    setFolderStartDelta(deltaY);
    setActiveGroupIndex(groupIndex);
    setActiveCaseIndex(caseIndex);
    setUnfoldedGroupId(groupIndex);
    setPhase("unfolding");
  };

  // GSAP Unified Opening Timeline (DwAQhwlc.js: Dct + kct)
  useEffect(() => {
    if (phase !== "unfolding") return;

    window.scrollTo({ top: 0, behavior: "instant" });

    const tlEnter = gsap.timeline({
      defaults: { ease: "power3.inOut", duration: 1.5 },
      onComplete: () => {
        setPhase("case-view");
      },
    });

    // 1. Stack: Sibling groups drop down
    const allGroups = Array.from(groupRefs.current.entries());
    const siblings = allGroups
      .filter(([id]) => id !== activeGroupIndex)
      .map(([, el]) => el)
      .filter(Boolean);

    tlEnter.to(
      siblings,
      { yPercent: 120, stagger: 0.08, duration: 0.65, ease: "power2.inOut" },
      0
    );

    // 2. Stack: Hero texts slide down and fade out
    if (heroDescRef.current) {
      tlEnter.to(heroDescRef.current, { y: "2rem", opacity: 0, duration: 0.45 }, 0.05);
    }
    if (heroTitleRef.current) {
      tlEnter.to(heroTitleRef.current, { y: "2rem", opacity: 0, duration: 0.45, stagger: -0.05 }, 0.15);
    }

    // 3. Reader: Folder container glides from slot deltaY up to 0
    if (caseFolderRef.current) {
      tlEnter.fromTo(
        caseFolderRef.current,
        { y: folderStartDelta, x: 0, transformOrigin: "right bottom" },
        { y: 0, x: 0, duration: 1.5, ease: "power3.inOut" },
        0
      );

      // Authentic Mosby flight arc (counter-clockwise tilt easing smoothly flat at 0.7s)
      tlEnter.fromTo(
        caseFolderRef.current,
        { rotate: 0 },
        { rotate: -22.6, duration: 0.65, ease: "power2.out" },
        0
      );
      tlEnter.to(
        caseFolderRef.current,
        { rotate: 0, duration: 0.85, ease: "power3.inOut" },
        0.65
      );
    }

    // 4. Reader: 3D Flap Cover unrolls around left spine (0 to -180deg)
    if (caseCoverRef.current) {
      const shadow = caseCoverRef.current.querySelector(`.${styles.caseFolderCoverShadow}`);

      tlEnter.fromTo(
        caseCoverRef.current,
        { rotateY: 0, transformOrigin: "left center" },
        { rotateY: -180, duration: 1.5, ease: "power3.inOut" },
        0
      );

      if (shadow) {
        tlEnter.to(shadow, { opacity: 1, duration: 0.35 }, 0.25);
        tlEnter.to(shadow, { opacity: 0, duration: 0.3 }, 0.6);
      }
    }

    // 5. Reader: Case Hero Title character reveal
    if (caseHeroTitleRef.current) {
      const chars = caseHeroTitleRef.current.querySelectorAll(".case-char");
      if (chars.length > 0) {
        tlEnter.fromTo(
          chars,
          { xPercent: -150, opacity: 0 },
          {
            xPercent: 0,
            opacity: 1,
            duration: 0.65,
            stagger: 0.025,
            ease: "power2.out",
            clearProps: "transform,opacity",
          },
          0.65
        );
      }
    }

    // 6. Reader: Spine tags slide up from below
    if (caseTagsRef.current) {
      const siblingTags = caseTagsRef.current.querySelectorAll(
        `.${styles.caseFolderTagsPage}:not(.${styles.caseFolderTagsPageActive})`
      );
      if (siblingTags.length > 0) {
        tlEnter.fromTo(
          siblingTags,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.75, ease: "power3.out", clearProps: "y" },
          0.85
        );
      }
    }

    // 7. Reader: Scrapbook items drop in
    if (caseScrapbookRef.current) {
      tlEnter.to(caseScrapbookRef.current, { opacity: 1, duration: 0.3 }, 0.95);
      const items = caseScrapbookRef.current.querySelectorAll(`.${styles.scrapbookItemDraggable}`);
      if (items.length > 0) {
        tlEnter.fromTo(
          items,
          { y: "50vh", opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.05, clearProps: "y" },
          1.0
        );
      }
    }

    return () => {
      tlEnter.kill();
    };
  }, [phase, folderStartDelta, activeGroupIndex]);

  // Close Folder handler: drops scrapbook items and enters closing-to-stack phase
  const handleCloseToStack = () => {
    if (phase !== "case-view") return;
    soundFx.playFolderFlap();

    // Smoothly glide viewport back to scrollY = 0 in lockstep with the 1.5s flight (Mosby Rct)
    if (typeof window !== "undefined" && window.__lenis) {
      window.__lenis.scrollTo(0, { duration: 1.5, lock: true, force: true });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    const items = caseScrapbookRef.current
      ? caseScrapbookRef.current.querySelectorAll(`.${styles.scrapbookItemDraggable}`)
      : [];

    if (items.length > 0) {
      gsap.to(items, {
        y: "50vh",
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          setPhase("closing-to-stack");
        },
      });
    } else {
      setPhase("closing-to-stack");
    }
  };

  // GSAP Symmetrical Reverse Closing Timeline (DwAQhwlc.js: Rct + zct)
  useEffect(() => {
    if (phase !== "closing-to-stack") return;

    // Measure live pixel delta between current folder in ReaderView and exact slot in stack
    const targetEl = groupRefs.current.get(activeGroupIndex);
    const targetRect = targetEl ? targetEl.getBoundingClientRect() : null;
    const folderRect = caseFolderRef.current ? caseFolderRef.current.getBoundingClientRect() : null;

    let targetDeltaY = folderStartDelta;
    let targetDeltaX = 0;
    let targetWidth: number | string = "100%";

    if (targetRect && folderRect) {
      targetDeltaY = Math.round(targetRect.top - folderRect.top);
      targetDeltaX = Math.round(targetRect.left - folderRect.left);
      targetWidth = Math.round(targetRect.width);
    }

    const allGroups = Array.from(groupRefs.current.entries());
    const siblings = allGroups
      .filter(([id]) => id !== activeGroupIndex)
      .map(([, el]) => el)
      .filter(Boolean);

    // Initial setup: sibling folders and hero text remain dropped/hidden during flight
    gsap.set(siblings, { yPercent: 120 });
    if (heroTitleRef.current) gsap.set(heroTitleRef.current, { y: "2rem", opacity: 0 });
    if (heroDescRef.current) gsap.set(heroDescRef.current, { y: "2rem", opacity: 0 });

    const tlClose = gsap.timeline({
      defaults: { ease: "power3.inOut", duration: 1.5 },
      onComplete: () => {
        // 1. Active closing folder has docked seamlessly into its slot
        setPhase("stack");
        if (caseFolderRef.current) {
          gsap.set(caseFolderRef.current, { clearProps: "all" });
        }

        // 2. ONLY NOW: The rest of the stack folders slide up from below as desired (Mosby zct)
        const tlRestore = gsap.timeline({
          defaults: { duration: 0.85, ease: "power4.out" },
        });

        tlRestore.fromTo(
          siblings,
          { yPercent: 120 },
          { yPercent: 0, duration: 0.85, stagger: 0.1, ease: "power4.out", clearProps: "yPercent" },
          0
        );

        if (heroTitleRef.current) {
          tlRestore.fromTo(
            heroTitleRef.current,
            { y: "2rem", opacity: 0 },
            { y: 0, opacity: 1, duration: 0.85, stagger: 0.15, ease: "power4.out" },
            0
          );
        }
        if (heroDescRef.current) {
          tlRestore.fromTo(
            heroDescRef.current,
            { y: "2rem", opacity: 0 },
            { y: 0, opacity: 1, duration: 0.65, ease: "power2.out" },
            0.25
          );
        }
      },
    });

    // 1. Case hero title chars exit left
    if (caseHeroTitleRef.current) {
      const chars = caseHeroTitleRef.current.querySelectorAll(".case-char");
      tlClose.to(chars, { xPercent: -150, opacity: 0, duration: 0.8, stagger: 0.02, ease: "power2.in" }, 0);
    }

    // 2. Spine tags slide down
    if (caseTagsRef.current) {
      tlClose.to(caseTagsRef.current.children, { yPercent: 110, duration: 0.65, ease: "power3.in" }, 0);
    }

    // 3. 3D Flap Cover folds shut from -180 back to 0
    if (caseCoverRef.current) {
      const shadow = caseCoverRef.current.querySelector(`.${styles.caseFolderCoverShadow}`);
      tlClose.to(caseCoverRef.current, { rotateY: 0, duration: 1.5, ease: "power3.inOut" }, 0);
      if (shadow) {
        tlClose.to(shadow, { opacity: 1, duration: 0.4 }, 0.5);
        tlClose.to(shadow, { opacity: 0, duration: 0.3 }, 0.9);
      }
    }

    // 4. Folder glides down to its exact slot in stack (targetDeltaX, targetDeltaY, targetWidth)
    if (caseFolderRef.current) {
      tlClose.to(
        caseFolderRef.current,
        {
          y: targetDeltaY,
          x: targetDeltaX,
          width: targetWidth,
          duration: 1.5,
          ease: "power3.inOut",
          transformOrigin: "right bottom",
        },
        0
      );

      // Symmetrical flight arc: tilts smoothly into the air to -22.6deg, then eases smoothly back to 0deg
      // KEEPING transformOrigin: "right bottom" throughout the flight (NO mid-flight clearProps snap!)
      tlClose.to(
        caseFolderRef.current,
        { rotate: -22.6, duration: 0.6, ease: "sine.inOut" },
        0
      );
      tlClose.to(
        caseFolderRef.current,
        { rotate: 0, duration: 0.9, ease: "sine.inOut" },
        0.6
      );
    }

    return () => {
      tlClose.kill();
    };
  }, [phase, folderStartDelta, activeGroupIndex]);

  // Switch between sibling or cross-group cases inside open dossier (Mosby folder-next vs page-turn)
  const handleSelectCase = (groupIndexOrCaseIndex: number, maybeCaseIndex?: number) => {
    let targetGroup = activeGroupIndex;
    let targetCase = groupIndexOrCaseIndex;

    if (maybeCaseIndex !== undefined) {
      targetGroup = groupIndexOrCaseIndex;
      targetCase = maybeCaseIndex;
    }

    soundFx.playPaperRustle();

    const isAtBottom = (typeof window !== "undefined" ? window.scrollY : 0) > 300;
    const isNextTransition = isAtBottom || targetGroup !== activeGroupIndex;

    const items = document.querySelectorAll(`.${styles.scrapbookItemDraggable}`);
    const chars = caseHeroTitleRef.current ? caseHeroTitleRef.current.querySelectorAll(".case-char") : [];
    const cover = caseCoverRef.current;
    const folder = caseFolderRef.current;
    const nextFolder = document.querySelector(`.${styles.caseNextFolder}`);

    if (isNextTransition) {
      // ── folder-next: Continuous Architect Transition (Mosby jct + Sct) ──
      // Pure slide-over transition: current case slides up off-screen,
      // and next open case slides smoothly in from below with NO flap opening re-animation.
      const tlNextLeave = gsap.timeline({
        defaults: { duration: 0.35, ease: "power1.in" },
        onComplete: () => {
          // Instant reset of scroll position to top
          if (typeof window !== "undefined" && window.__lenis) {
            window.__lenis.scrollTo(0, { immediate: true, force: true, lock: true });
          } else {
            window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
          }

          setActiveGroupIndex(targetGroup);
          setActiveCaseIndex(targetCase);
          setUnfoldedGroupId(targetGroup);

          setTimeout(() => {
            const newFolder = caseFolderRef.current;
            const newCover = caseCoverRef.current;
            const newItems = document.querySelectorAll(`.${styles.scrapbookItemDraggable}`);
            const newSheet = document.querySelector(`.${styles.caseFolderSheet}`);
            const newTags = document.querySelectorAll(`.${styles.caseFolderTags} .${styles.tag}`);

            // The dossier is ALREADY OPEN in Reader View - static -180deg, NO flap rotation!
            if (newCover) {
              gsap.set(newCover, { rotateY: -180 });
            }

            const tlNextEnter = gsap.timeline({
              defaults: { duration: 0.65, ease: "power3.out" },
              onStart: () => {
                if (typeof window !== "undefined" && window.__lenis) {
                  window.__lenis.stop();
                }
              },
              onComplete: () => {
                if (typeof window !== "undefined" && window.__lenis) {
                  window.__lenis.start();
                }
              },
            });

            // Smoothly slide the new dossier into Reader View from below
            if (newFolder) {
              tlNextEnter.from(newFolder, { y: "45vh", duration: 0.6, ease: "power3.out", clearProps: "y" }, 0);
            }
            if (newSheet) {
              tlNextEnter.from(newSheet, { y: "50vh", duration: 0.65, ease: "power3.out", clearProps: "y" }, 0);
            }
            if (caseHeroTitleRef.current) {
              tlNextEnter.from(
                caseHeroTitleRef.current,
                { y: "25vh", scale: 0.88, opacity: 0, duration: 0.6, ease: "power2.out", clearProps: "all" },
                0
              );
            }
            if (newTags.length > 0) {
              tlNextEnter.from(
                newTags,
                { y: "100%", duration: 0.65, ease: "power3.out", stagger: -0.04, clearProps: "y" },
                0.05
              );
            }
            if (newItems.length > 0) {
              tlNextEnter.from(
                newItems,
                { y: "30vh", opacity: 0, duration: 0.55, stagger: 0.03, ease: "power3.out", clearProps: "all" },
                0.15
              );
            }
          }, 30);
        },
      });

      if (folder) {
        tlNextLeave.to(folder, { y: "-75vh", duration: 0.35, ease: "power1.in" }, 0);
      }
      if (nextFolder) {
        tlNextLeave.to(nextFolder, { y: "-15vh", duration: 0.35, ease: "power2.in" }, 0);
      }
      if (chars.length > 0) {
        tlNextLeave.to(chars, { xPercent: -100, opacity: 0, duration: 0.3, stagger: 0.015, ease: "power1.in" }, 0);
      }
      if (items.length > 0) {
        tlNextLeave.to(items, { y: "-30vh", opacity: 0, duration: 0.25, ease: "power1.in" }, 0);
      }
    } else {
      // ── page-turn: In-group Sibling Tag Switch (Mosby Pct + Kct) ──
      const tlTurn = gsap.timeline({
        defaults: { duration: 0.55, ease: "power3.out" },
        onStart: () => {
          if (typeof window !== "undefined" && window.__lenis) {
            window.__lenis.scrollTo(0, { duration: 0.55, force: true });
          } else {
            window.scrollTo({ top: 0, behavior: "instant" });
          }
        },
        onComplete: () => {
          setActiveGroupIndex(targetGroup);
          setActiveCaseIndex(targetCase);

          setTimeout(() => {
            const newCover = caseCoverRef.current;
            const newChars = caseHeroTitleRef.current ? caseHeroTitleRef.current.querySelectorAll(".case-char") : [];
            const newItems = document.querySelectorAll(`.${styles.scrapbookItemDraggable}`);

            const tlEnterNew = gsap.timeline({
              defaults: { duration: 0.7, ease: "power3.inOut" },
            });

            if (newCover) {
              tlEnterNew.fromTo(newCover, { rotateY: 0 }, { rotateY: -180, duration: 0.7 }, 0);
            }
            if (newChars.length > 0) {
              tlEnterNew.from(newChars, { xPercent: 150, opacity: 0, duration: 0.5, stagger: -0.025, ease: "power2.out" }, 0.15);
            }
            if (newItems.length > 0) {
              tlEnterNew.from(newItems, { y: "50vh", duration: 0.5, ease: "power3.out", stagger: 0.04, clearProps: "y" }, 0.3);
            }
          }, 40);
        },
      });

      if (items.length > 0) {
        tlTurn.to(items, { y: "50vh", duration: 0.25, ease: "power2.in" }, 0);
      }
      if (chars.length > 0) {
        tlTurn.to(chars, { xPercent: 150, opacity: 0, duration: 0.45, stagger: 0.02, ease: "power2.in" }, 0.1);
      }
      if (cover) {
        tlTurn.fromTo(cover, { rotateY: -180 }, { rotateY: 0, duration: 0.55, ease: "power3.inOut" }, 0.1);
      }
    }
  };

  return (
    <div className={`${styles.pageHome} ${phase === "case-view" ? styles.pageCaseActive : ""}`}>
      {/* Top Header */}
      <header className={styles.theHeader}>
        <div
          className={styles.theLogo}
          onClick={phase !== "stack" ? handleCloseToStack : undefined}
          style={{ cursor: phase !== "stack" ? "pointer" : "default" }}
          title={phase !== "stack" ? "Close dossier and return to archive stack" : "Mosby’s Files"}
        >
          <svg
            viewBox="0 0 967 145"
            fill="currentColor"
            height="22"
            style={{ display: "block" }}
          >
            <path d="M59.4692 72.6855H60.3248L73.1599 4.23176H112.735V139H83.6419V62.2035H82.7862L68.0259 139H48.3454L33.1573 62.2035H32.3016V139H4.70619V4.23176H45.1367L59.4692 72.6855ZM207.25 79.9587C207.25 99.3539 203.898 114.328 197.195 124.881C190.493 135.435 179.298 140.711 163.61 140.711C147.923 140.711 136.728 135.435 130.025 124.881C123.323 114.328 119.971 99.3539 119.971 79.9587V63.2731C119.971 43.8779 123.323 28.9036 130.025 18.3503C136.728 7.79707 147.923 2.52043 163.61 2.52043C179.298 2.52043 190.493 7.79707 197.195 18.3503C203.898 28.9036 207.25 43.8779 207.25 63.2731V79.9587ZM152.487 95.1468C152.487 101.137 153.2 105.985 154.626 109.693C156.052 113.401 159.047 115.255 163.61 115.255C168.174 115.255 171.169 113.401 172.595 109.693C174.021 105.985 174.734 101.137 174.734 95.1468V48.0849C174.734 42.0952 174.021 37.2464 172.595 33.5385C171.169 29.8306 168.174 27.9766 163.61 27.9766C159.047 27.9766 156.052 29.8306 154.626 33.5385C153.2 37.2464 152.487 42.0952 152.487 48.0849V95.1468ZM239.046 93.4355V98.7834C239.046 103.775 240.116 107.839 242.255 110.977C244.394 113.972 247.532 115.469 251.668 115.469C259.083 115.469 262.791 111.619 262.791 103.917C262.791 100.067 261.65 97.1434 259.369 95.1468C257.087 93.1503 253.878 91.0111 249.742 88.7293L238.405 82.5257C234.839 80.5291 231.417 78.3899 228.137 76.1082C224.999 73.8264 222.147 71.1167 219.58 67.9793C217.156 64.8418 215.23 61.2052 213.804 57.0695C212.378 52.7911 211.665 47.7284 211.665 41.8813C211.665 35.8916 212.592 30.4724 214.446 25.6236C216.3 20.7747 218.938 16.639 222.361 13.2163C225.784 9.79363 229.848 7.15531 234.554 5.30136C239.26 3.44741 244.537 2.52043 250.384 2.52043C262.791 2.52043 272.346 6.01442 279.049 13.0024C285.752 19.9904 289.103 30.4011 289.103 44.2344V49.5824H261.508V44.0205C261.508 33.182 257.8 27.7627 250.384 27.7627C247.104 27.7627 244.608 28.8323 242.897 30.9715C241.186 33.1107 240.33 36.0342 240.33 39.7421C240.33 43.1648 241.186 46.0171 242.897 48.2988C244.751 50.5806 247.318 52.5772 250.598 54.2885L263.219 61.1339C267.64 63.5583 271.562 66.054 274.985 68.621C278.55 71.0454 281.545 73.8264 283.969 76.9638C286.536 79.9587 288.461 83.4527 289.745 87.4458C291.029 91.2963 291.67 95.8599 291.67 101.137C291.67 114.257 287.962 124.168 280.547 130.871C273.273 137.431 263.647 140.711 251.668 140.711C239.688 140.711 229.991 137.289 222.575 130.443C215.159 123.598 211.451 112.973 211.451 98.5695V93.4355H239.046ZM380.998 101.778C380.998 113.615 377.718 122.814 371.157 129.374C364.74 135.791 354.472 139 340.353 139H298.425V4.23176H340.139C346.985 4.23176 352.832 5.08744 357.681 6.79878C362.529 8.51013 366.451 10.9345 369.446 14.072C372.584 17.2094 374.865 20.9887 376.291 25.4096C377.718 29.8306 378.431 34.6794 378.431 39.956C378.431 48.3701 376.22 55.2155 371.799 60.4922C367.521 65.6262 362.03 68.7636 355.328 69.9045C363.456 71.4733 369.731 74.9673 374.152 80.3865C378.716 85.6632 380.998 92.7937 380.998 101.778ZM329.016 82.7396V113.758H336.931C342.35 113.758 345.986 112.474 347.84 109.907C349.837 107.198 350.835 103.347 350.835 98.3556C350.835 93.6494 349.837 89.8702 347.84 87.018C345.986 84.1657 342.35 82.7396 336.931 82.7396H329.016ZM329.016 58.9947H336.075C341.494 58.9947 345.059 57.6399 346.771 54.9303C348.482 52.0781 349.338 48.5841 349.338 44.4483C349.338 40.17 348.482 36.6047 346.771 33.7524C345.059 30.7576 341.494 29.2602 336.075 29.2602H329.016V58.9947ZM439.327 4.23176H470.345L438.899 91.7242V139H408.309V91.7242L376.863 4.23176H409.379L424.995 53.8607L439.327 4.23176ZM474.094 4.23176H504.684V30.1158C504.684 39.3856 502.188 46.1597 497.197 50.438C492.348 54.7164 484.647 56.9982 474.094 57.2834V42.9509C478.657 42.8083 482.08 41.9526 484.362 40.3839C486.644 38.6725 487.856 35.749 487.998 31.6132H474.094V4.23176ZM536.735 93.4355V98.7834C536.735 103.775 537.804 107.839 539.944 110.977C542.083 113.972 545.22 115.469 549.356 115.469C556.772 115.469 560.48 111.619 560.48 103.917C560.48 100.067 559.339 97.1434 557.057 95.1468C554.775 93.1503 551.566 91.0111 547.431 88.7293L536.093 82.5257C532.528 80.5291 529.105 78.3899 525.825 76.1082C522.688 73.8264 519.835 71.1167 517.268 67.9793C514.844 64.8418 512.919 61.2052 511.493 57.0695C510.066 52.7911 509.353 47.7284 509.353 41.8813C509.353 35.8916 510.28 30.4724 512.134 25.6236C513.988 20.7747 516.627 16.639 520.049 13.2163C523.472 9.79363 527.536 7.15531 532.243 5.30136C536.949 3.44741 542.225 2.52043 548.072 2.52043C560.48 2.52043 570.035 6.01442 576.737 13.0024C583.44 19.9904 586.792 30.4011 586.792 44.2344V49.5824H559.196V44.0205C559.196 33.182 555.488 27.7627 548.072 27.7627C544.792 27.7627 542.297 28.8323 540.585 30.9715C538.874 33.1107 538.018 36.0342 538.018 39.7421C538.018 43.1648 538.874 46.0171 540.585 48.2988C542.439 50.5806 545.006 52.5772 548.286 54.2885L560.908 61.1339C565.329 63.5583 569.25 66.054 572.673 68.621C576.238 71.0454 579.233 73.8264 581.658 76.9638C584.225 79.9587 586.15 83.4527 587.433 87.4458C588.717 91.2963 589.359 95.8599 589.359 101.137C589.359 114.257 585.651 124.168 578.235 130.871C570.962 137.431 561.335 140.711 549.356 140.711C537.377 140.711 527.679 137.289 520.263 130.443C512.847 123.598 509.139 112.973 509.139 98.5695V93.4355H536.735ZM621.809 139V4.23176H687.482V30.1158H653.255V61.3478H678.283V86.804H653.255V139H621.809ZM726.162 4.23176V139H694.717V4.23176H726.162ZM767.108 4.23176V113.116H803.474V139H735.662V4.23176H767.108ZM878.898 139H810.658V4.23176H878.898V30.1158H841.462V57.7112H869.272V83.3814H841.462V113.116H878.898V139ZM911.718 93.4355V98.7834C911.718 103.775 912.787 107.839 914.927 110.977C917.066 113.972 920.203 115.469 924.339 115.469C931.755 115.469 935.463 111.619 935.463 103.917C935.463 100.067 934.322 97.1434 932.04 95.1468C929.758 93.1503 926.549 91.0111 922.414 88.7293L911.076 82.5257C907.511 80.5291 904.088 78.3899 900.808 76.1082C897.67 73.8264 894.818 71.1167 892.251 67.9793C889.827 64.8418 887.902 61.2052 886.475 57.0695C885.049 52.7911 884.336 47.7284 884.336 41.8813C884.336 35.8916 885.263 30.4724 887.117 25.6236C888.971 20.7747 891.609 16.639 895.032 13.2163C898.455 9.79363 902.519 7.15531 907.225 5.30136C911.932 3.44741 917.208 2.52043 923.055 2.52043C935.463 2.52043 945.018 6.01442 951.72 13.0024C958.423 19.9904 961.775 30.4011 961.775 44.2344V49.5824H934.179V44.0205C934.179 33.182 930.471 27.7627 923.055 27.7627C919.775 27.7627 917.28 28.8323 915.568 30.9715C913.857 33.1107 913.001 36.0342 913.001 39.7421C913.001 43.1648 913.857 46.0171 915.568 48.2988C917.422 50.5806 919.989 52.5772 923.269 54.2885L935.89 61.1339C940.311 63.5583 944.233 66.054 947.656 68.621C951.221 71.0454 954.216 73.8264 956.64 76.9638C959.208 79.9587 961.133 83.4527 962.416 87.4458C963.7 91.2963 964.342 95.8599 964.342 101.137C964.342 114.257 960.634 124.168 953.218 130.871C945.945 137.431 936.318 140.711 924.339 140.711C912.36 140.711 902.662 137.289 895.246 130.443C887.83 123.598 884.122 112.973 884.122 98.5695V93.4355H911.718Z" />
          </svg>
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

      {/* Home Scene Container: Stack + Hero */}
      {(phase === "stack" || phase === "unfolding" || phase === "closing-to-stack") && (
        <div
          className={
            phase !== "stack" ? styles.homeSceneTransitioning : styles.homeScene
          }
          style={phase !== "stack" ? { pointerEvents: "none" } : undefined}
        >
          {/* Hero Section */}
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

          {/* Main Interactive Scene: Stack */}
          <div className={styles.pageHomeStack}>
            <div ref={stackRef} className={styles.stack}>
              {FOLDER_GROUPS.map((group, gIdx) => {
                const currentActiveGroup =
                  hoveredGroupId !== -1 ? hoveredGroupId : unfoldedGroupId;
                const isThisUnfolded = currentActiveGroup === group.groupId;
                // Groups strictly below the active unfolded group drop down (Mosby accordion slide)
                const isDropped = group.groupId > currentActiveGroup;
                const isLast = gIdx === FOLDER_GROUPS.length - 1;
                const isHovered = hoveredGroupId === group.groupId;
                const zIndex = group.groupId + 1;
                const reverseIdx = FOLDER_GROUPS.length - group.groupId - 1;
                const isOpeningGroup =
                  (phase === "unfolding" || phase === "closing-to-stack") &&
                  gIdx === activeGroupIndex;

                return (
                  <div
                    key={group.groupId}
                    ref={setGroupRef(group.groupId)}
                    className={`${styles.stackGroup} ${
                      isDropped ? styles.isUnfolded : ""
                    } ${isHovered ? styles.isRotated : ""}`}
                    style={
                      {
                        "--cover-bg-color": group.primaryColor,
                        "--cover-color": "#FFFFFF",
                        "--group-id": group.groupId + 1,
                        "--reverse-idx": reverseIdx,
                        zIndex: zIndex,
                        opacity: isOpeningGroup ? 0 : 1,
                        pointerEvents: isOpeningGroup ? "none" : undefined,
                      } as React.CSSProperties
                    }
                    onMouseEnter={() => setHoveredGroupId(group.groupId)}
                    onMouseLeave={() => setHoveredGroupId(-1)}
                  >
                    <div className={styles.stackGroupInner}>
                      {/* Folder Cover */}
                      <div
                        className={`${styles.stackCover} ${
                          isHovered ? styles.isHovered : ""
                        } ${isThisUnfolded ? styles.isUnfolded : ""}`}
                        onClick={() => setUnfoldedGroupId(group.groupId)}
                      >
                        {/* Category Label and Arrow on top-right */}
                        <div
                          className={styles.stackCoverCategory}
                          onClick={(e) => {
                            e.stopPropagation();
                            setUnfoldedGroupId(group.groupId);
                          }}
                        >
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
                        {isThisUnfolded && (
                          <div className={styles.stackCoverDesc}>
                            {group.description}
                          </div>
                        )}

                        {/* Archival Footer on Group 3 (Red) */}
                        {isLast && <TheFooter />}
                      </div>

                      {/* Stack Pages & Top Tabs */}
                      <div className={styles.stackPage}>
                        {/* Right Unfold Area (click/hover trigger for category) */}
                        <div
                          className={styles.stackPageUnfoldArea}
                          onClick={(e) => {
                            e.stopPropagation();
                            setUnfoldedGroupId(group.groupId);
                          }}
                          onMouseEnter={() => setHoveredGroupId(group.groupId)}
                        />

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
        </div>
      )}

      {/* Reader View Dossier */}
      {phase !== "stack" && (
        <ReaderView
          key={activeCase.slug}
          group={activeGroup}
          allGroups={FOLDER_GROUPS}
          currentCase={activeCase}
          activeCaseIndex={activeCaseIndex}
          onSelectCase={handleSelectCase}
          onClose={handleCloseToStack}
          folderRef={caseFolderRef}
          coverRef={caseCoverRef}
          tagsRef={caseTagsRef}
          scrapbookRef={caseScrapbookRef}
          heroTitleRef={caseHeroTitleRef}
          initialUnfolded={phase === "case-view" || phase === "closing-to-stack"}
          folderStartDelta={folderStartDelta}
        />
      )}
    </div>
  );
};


