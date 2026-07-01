import React, { useState, useRef } from "react";
import { ReceiptCard } from "./ReceiptCard";
import { FilesStamp } from "./FilesStamp";
import styles from "./FolderStackAnimation.module.css";

interface ReaderViewProps {
  className?: string;
}

const VerticalTabSVG: React.FC<{ color: string; label: string }> = ({ color, label }) => {
  return (
    <div
      style={{
        position: "relative",
        width: "28px",
        height: "160px",
        display: "block",
      }}
    >
      <svg
        width="28"
        height="160"
        viewBox="0 0 28 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color }}
      >
        <path
          d="M 0 0 C 0 14, 28 14, 28 28 L 28 132 C 28 146, 0 146, 0 160 Z"
          fill="currentColor"
        />
      </svg>
      {/* Label text rotated 90 deg inside the tab */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            fontFamily: "var(--font-body-serif), Georgia, serif",
            fontStyle: "italic",
            fontSize: "10px",
            color: "#F0ECE4",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
};

export const ReaderView: React.FC<ReaderViewProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinkRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const [pinkPos, setPinkPos] = useState({ x: 0, y: 0 });
  const [receiptPos, setReceiptPos] = useState({ x: 0, y: 0 });
  const [draggingTarget, setDraggingTarget] = useState<"pink" | "receipt" | null>(null);

  const handleDragStart = (
    e: React.MouseEvent | React.TouchEvent,
    target: "pink" | "receipt"
  ) => {
    // Check if clicking interactive elements to allow regular interactions
    const targetTagName = (e.target as HTMLElement).tagName.toLowerCase();
    if (targetTagName === "button" || targetTagName === "a" || targetTagName === "input") {
      return;
    }

    e.preventDefault();
    setDraggingTarget(target);

    const isTouch = "touches" in e;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    const startX = clientX;
    const startY = clientY;

    const initialX = target === "pink" ? pinkPos.x : receiptPos.x;
    const initialY = target === "pink" ? pinkPos.y : receiptPos.y;

    if (!containerRef.current) return;
    const parentRect = containerRef.current.getBoundingClientRect();

    const targetEl = target === "pink" ? pinkRef.current : receiptRef.current;
    if (!targetEl) return;
    const elRect = targetEl.getBoundingClientRect();

    // Calculate original position of the element relative to parent
    const origLeft = elRect.left - parentRect.left - initialX;
    const origTop = elRect.top - parentRect.top - initialY;

    const handleDragMove = (moveEvent: MouseEvent | TouchEvent) => {
      const moveTouch = "touches" in moveEvent;
      const moveX = moveTouch ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const moveY = moveTouch ? moveEvent.touches[0].clientY : moveEvent.clientY;

      let targetX = initialX + (moveX - startX);
      let targetY = initialY + (moveY - startY);

      // Boundaries inside container
      const minX = -origLeft;
      const maxX = parentRect.width - elRect.width - origLeft;
      const minY = -origTop;
      const maxY = parentRect.height - elRect.height - origTop;

      targetX = Math.max(minX, Math.min(maxX, targetX));
      targetY = Math.max(minY, Math.min(maxY, targetY));

      if (target === "pink") {
        setPinkPos({ x: targetX, y: targetY });
      } else {
        setReceiptPos({ x: targetX, y: targetY });
      }
    };

    const handleDragEnd = () => {
      setDraggingTarget(null);
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };

    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchmove", handleDragMove);
    window.addEventListener("touchend", handleDragEnd);
  };

  return (
    <div 
      className={`${styles.readerContainer} ${className || ""}`}
      style={{ userSelect: draggingTarget ? "none" : "auto" }}
    >
      {/* ── Two-page spread (solid blue folder backboard) ── */}
      <div className={styles.spreadContainer} ref={containerRef}>
        {/* ═══ LEFT PAGE — Excerpt A (pink) — Draggable ═══ */}
        <div
          ref={pinkRef}
          className={styles.leftPage}
          style={{
            transform: `translate3d(${pinkPos.x}px, ${pinkPos.y}px, 0)`,
            cursor: draggingTarget === "pink" ? "grabbing" : "grab",
            zIndex: draggingTarget === "pink" ? 40 : 10,
            transition: draggingTarget === "pink" ? "none" : "transform 150ms ease-out",
          }}
          onMouseDown={(e) => handleDragStart(e, "pink")}
          onTouchStart={(e) => handleDragStart(e, "pink")}
        >
          {/* File chip */}
          <div className={styles.fileChip}>File #03</div>

          {/* Heading */}
          <h2 className={styles.pageHeading}>Excerpt A</h2>

          {/* Two-column body copy */}
          <div className={styles.twoColumnBody}>
            <p>
              The material arrives already altered — a trace shaped more by its
              journey than its point of departure. Interpretation loops back on
              itself, forming layers of intent and silence. Margins offer no
              certainty, only suggestion. The sequence, if it ever was one,
              appears broken, but each break insists on continuity. There are
              signs of use: annotations, omissions, the pressure of someone
              else&apos;s urgency. No conclusion is evident, but the document
              resists being closed. It remains — held in transit, not as an
              answer but as evidence of asking.
            </p>
          </div>

          {/* Bottom section: printer marks + stamp */}
          <div className={styles.leftPageBottom}>
            <div className={styles.printerMarks}>
              <span>A_1</span>
              <span>12938</span>
              <span>03</span>
            </div>

            <div className={styles.stampWrapperLeft}>
              <FilesStamp />
              <span className={styles.stampCaption}>Last known revision</span>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT PAGE — Unverified (cream) — Fixed ═══ */}
        <div className={styles.rightPage} style={{ zIndex: 5 }}>
          {/* Margin column with binder dots and annotation */}
          <div className={styles.marginColumn}>
            <div className={styles.binderDots}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={styles.binderDot} />
              ))}
            </div>
            <div className={styles.marginAnnotation}>
              Not dated. Referent unknown. Possible correlation to Entry 90,
              though this remains speculative.
            </div>
            <div className={styles.tickRuler}>
              {[...Array(12)].map((_, i) => (
                <div key={i} className={styles.tickMark} />
              ))}
            </div>
          </div>

          {/* Main content area */}
          <div className={styles.rightPageContent}>
            {/* File chip */}
            <div className={styles.fileChip}>File #02</div>

            {/* Heading */}
            <h2 className={styles.pageHeading}>Unverified</h2>

            {/* Body copy — four distinct paragraphs */}
            <div className={styles.singleColumnBody}>
              <p>
                There are signs of use: annotations, omissions, the pressure of
                someone else&apos;s urgency. No conclusion is evident, but the
                document resists being closed. It remains — held in transit, not
                as an answer but as evidence of asking.
              </p>
              <p>
                Margin marks suggest a secondary hand. Ink inconsistent. Faint
                fold lines imply prior concealment or repeated handling.
              </p>
              <p>
                There is no confirmation that Varnell ever received the original.
                What remains suggests partial transmission — either interrupted
                or deliberately obscured. The phrasing is elliptical, folding
                back on itself, with repetitions that seem less redundant than
                ritualistic.
              </p>
              <p>
                Several attempts have been made to reconstruct the intended
                order, though none are considered definitive. One sequence,
                favored in the Cartesia revisions, places the closing fragment at
                the beginning, where it casts a retrospective shadow on
                everything that follows.
              </p>
            </div>

            {/* Bottom: stamp in center + page numbers on right */}
            <div className={styles.rightPageBottom}>
              <div className={styles.stampWrapperRight}>
                <FilesStamp />
                <span className={styles.stampCaption}>Last known revision</span>
              </div>
              
              <div className={styles.printerMarksRight}>
                <span>4.2</span>
                <span>01</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ YELLOW RECEIPT — Draggable (floats on the blue folder background) ═══ */}
        <div
          ref={receiptRef}
          className={styles.receiptWrapper}
          style={{
            transform: `translate3d(${receiptPos.x}px, ${receiptPos.y}px, 0) rotate(-5deg)`,
            cursor: draggingTarget === "receipt" ? "grabbing" : "grab",
            zIndex: draggingTarget === "receipt" ? 50 : 30,
            transition: draggingTarget === "receipt" ? "none" : "transform 150ms ease-out",
          }}
          onMouseDown={(e) => handleDragStart(e, "receipt")}
          onTouchStart={(e) => handleDragStart(e, "receipt")}
        >
          <ReceiptCard />
        </div>
      </div>

      {/* ── Right-edge folder tabs ── */}
      <div className={styles.rightEdgeTabs}>
        <VerticalTabSVG color="#D6231B" label="Varnell Collection" />
        <VerticalTabSVG color="#2255CC" label="Peripheral Entry" />
      </div>
    </div>
  );
};
