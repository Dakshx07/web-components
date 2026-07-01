import React from "react";
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
  return (
    <div className={`${styles.readerContainer} ${className || ""}`}>
      {/* ── Two-page spread (solid blue folder backboard) ── */}
      <div className={styles.spreadContainer}>
        {/* ═══ LEFT PAGE — Excerpt A (pink) ═══ */}
        <div className={styles.leftPage}>
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

        {/* ═══ RIGHT PAGE — Unverified (cream) ═══ */}
        <div className={styles.rightPage}>
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

        {/* ═══ YELLOW RECEIPT (floats on the blue folder background in the bottom-left corner) ═══ */}
        <div className={styles.receiptWrapper}>
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
