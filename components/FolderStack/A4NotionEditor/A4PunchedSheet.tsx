"use client";

import React from "react";

interface A4PunchedSheetProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  punchEdge?: "left" | "right";
  isHovered?: boolean;
  onClick?: () => void;
}

/**
 * Archival A4 Document Sheet with Balanced Punched Holes along spine margin
 * - punchEdge="right" for Left Flap pages (facing center spine)
 * - punchEdge="left" for Right Flap pages (facing center spine)
 */
export const A4PunchedSheet: React.FC<A4PunchedSheetProps> = ({
  children,
  className,
  style,
  punchEdge = "left",
  isHovered = false,
  onClick,
}) => {
  const isRightPunch = punchEdge === "right";

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%",
        minHeight: "1000px",
        backgroundColor: "#FFFFFF",
        borderRadius: "4px",
        boxShadow: isHovered
          ? "0 0 0 2.5px #2e66f6, 0 16px 44px rgba(46, 102, 246, 0.22)"
          : "0 12px 36px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)",
        border: isHovered ? "1px solid #2e66f6" : "1px solid rgba(0, 0, 0, 0.08)",
        boxSizing: "border-box",
        color: "#18181b",
        fontFamily: "var(--font-inter, sans-serif)",
        display: "flex",
        transition: "box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease",
        ...style,
      }}
    >
      {/* ── Spine Binder Strip with Balanced Punched Holes ── */}
      <div
        style={{
          position: "absolute",
          ...(isRightPunch ? { right: 0 } : { left: 0 }),
          top: 0,
          bottom: 0,
          width: "4.25rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          alignItems: "center",
          padding: "3.5rem 0",
          ...(isRightPunch
            ? { borderLeft: "1px solid rgba(0, 0, 0, 0.08)" }
            : { borderRight: "1px solid rgba(0, 0, 0, 0.08)" }),
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <div
            key={n}
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              backgroundColor: "var(--case-color, #194bfd)",
              boxShadow:
                "inset 0 2px 4px rgba(0, 0, 0, 0.65), inset 0 1px 1px rgba(0, 0, 0, 0.8), 0 1px 0 rgba(255, 255, 255, 0.8)",
              border: "1px solid rgba(0, 0, 0, 0.25)",
            }}
          />
        ))}
      </div>

      {/* ── Sheet Content Canvas (generous padding clearing the punch strip) ── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: isRightPunch
            ? "3.5rem calc(4.25rem + 2rem) 6rem 3.5rem"
            : "3.5rem 3.5rem 6rem calc(4.25rem + 2rem)",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </div>
  );
};
