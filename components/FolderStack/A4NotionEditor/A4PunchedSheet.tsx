"use client";

import React from "react";

interface A4PunchedSheetProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  punchEdge?: "left" | "right";
  isHovered?: boolean;
  onClick?: () => void;
  pageNumber?: number;
  onScroll?: React.UIEventHandler<HTMLDivElement>;
}

/**
 * Archival A4 Document Sheet with Slim Balanced Punched Holes along spine margin
 * - punchEdge="right" for Left Flap pages (facing center spine)
 * - punchEdge="left" for Right Flap pages (facing center spine)
 * - Slimmed punch strip gives ~40px extra width for Notion-style editing canvas
 */
export const A4PunchedSheet: React.FC<A4PunchedSheetProps> = ({
  children,
  className,
  style,
  punchEdge = "left",
  isHovered = false,
  onClick,
  onScroll,
}) => {
  const isRightPunch = punchEdge === "right";

  return (
    <div
      className={className}
      onClick={onClick}
      onScroll={onScroll}
      style={{
        position: "relative",
        width: "100%",
        minHeight: style?.height === "100%" ? "100%" : (style?.minHeight ?? "1140px"),
        height: style?.height ?? (style?.minHeight ? "auto" : "100%"),
        flex: style?.flex ?? 1,
        backgroundColor: "#FFFFFF",
        borderRadius: "4px",
        boxShadow: isHovered
          ? "0 16px 44px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08)"
          : "0 12px 36px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)",
        border: isHovered ? "1px solid rgba(0, 0, 0, 0.16)" : "1px solid rgba(0, 0, 0, 0.08)",
        boxSizing: "border-box",
        color: "#18181b",
        fontFamily: "var(--font-inter, sans-serif)",
        display: "flex",
        overflow: style?.overflow || "clip",
        transition: "box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease",
        ...style,
      }}
    >
      {/* ── Slim Spine Binder Strip with Balanced Punched Holes ── */}
      <div
        style={{
          position: "absolute",
          ...(isRightPunch ? { right: 0 } : { left: 0 }),
          top: 0,
          bottom: 0,
          height: "100%",
          width: "2.35rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          alignItems: "center",
          padding: "clamp(1.5rem, 3vh, 2.75rem) 0",
          ...(isRightPunch
            ? { borderLeft: "1px solid rgba(0, 0, 0, 0.07)" }
            : { borderRight: "1px solid rgba(0, 0, 0, 0.07)" }),
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <div
            key={n}
            style={{
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              backgroundColor: "var(--case-color, #194bfd)",
              boxShadow:
                "inset 0 1.5px 3px rgba(0, 0, 0, 0.65), inset 0 0.5px 0.5px rgba(0, 0, 0, 0.8), 0 1px 0 rgba(255, 255, 255, 0.8)",
              border: "1px solid rgba(0, 0, 0, 0.25)",
            }}
          />
        ))}
      </div>

      {/* ── Sheet Content Canvas (optimized padding maximizing reading/writing space) ── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          padding: isRightPunch
            ? "clamp(1.75rem, 2.5vh, 2.75rem) calc(2.35rem + clamp(0.75rem, 1.2vw, 1.25rem)) clamp(1.75rem, 2.5vh, 2.75rem) clamp(1.5rem, 2vw, 2.5rem)"
            : "clamp(1.75rem, 2.5vh, 2.75rem) clamp(1.5rem, 2vw, 2.5rem) clamp(1.75rem, 2.5vh, 2.75rem) calc(2.35rem + clamp(0.75rem, 1.2vw, 1.25rem))",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </div>
  );
};
