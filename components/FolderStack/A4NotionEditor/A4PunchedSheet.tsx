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
        minHeight: style?.height === "100%" ? "unset" : (style?.minHeight ?? "1000px"),
        height: style?.height ?? "auto",
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
          width: "clamp(3.25rem, 4.5vw, 4.25rem)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          alignItems: "center",
          padding: "clamp(1.5rem, 3.5vh, 3.5rem) 0",
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
              width: "12px",
              height: "12px",
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
            ? "clamp(1.75rem, 2.5vh, 3rem) calc(clamp(3.25rem, 4.5vw, 4.25rem) + clamp(1rem, 1.5vw, 1.75rem)) clamp(1.75rem, 2.5vh, 3rem) clamp(1.75rem, 2vw, 3rem)"
            : "clamp(1.75rem, 2.5vh, 3rem) clamp(1.75rem, 2vw, 3rem) clamp(1.75rem, 2.5vh, 3rem) calc(clamp(3.25rem, 4.5vw, 4.25rem) + clamp(1rem, 1.5vw, 1.75rem))",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </div>
  );
};
