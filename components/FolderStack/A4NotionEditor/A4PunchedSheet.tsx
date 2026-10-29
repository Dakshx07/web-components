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
          width: "56px",
          pointerEvents: "none",
          zIndex: 5,
          ...(isRightPunch
            ? { borderLeft: "1px solid rgba(0, 0, 0, 0.04)" }
            : { borderRight: "1px solid rgba(0, 0, 0, 0.04)" }),
        }}
      >
        {/* Upper Arch Ring Hole - Transparent cut-out revealing the 3D metal plate & top ring prong */}
        <div
          style={{
            position: "absolute",
            top: "41.07%",
            ...(isRightPunch ? { right: "45px", transform: "translate(50%, -50%)" } : { left: "30px", transform: "translate(-50%, -50%)" }),
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            backgroundColor: "transparent",
            boxShadow:
              "inset 0 1px 4px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.12)",
          }}
        />

        {/* Center / Bottom Arch Ring Hole - Transparent cut-out revealing the 3D metal plate & bottom ring prong */}
        <div
          style={{
            position: "absolute",
            top: "50.18%",
            ...(isRightPunch ? { right: "45px", transform: "translate(50%, -50%)" } : { left: "30px", transform: "translate(-50%, -50%)" }),
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            backgroundColor: "transparent",
            boxShadow:
              "inset 0 1px 4px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.12)",
          }}
        />
      </div>

      {/* ── Sheet Content Canvas (natural padding clearing the slim 56px punch strip) ── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: isRightPunch
            ? "clamp(1.75rem, 2.5vh, 2.5rem) clamp(3.75rem, 4.5vw, 4.25rem) clamp(1.75rem, 2.5vh, 2.5rem) clamp(1.5rem, 2vw, 2.25rem)"
            : "clamp(1.75rem, 2.5vh, 2.5rem) clamp(1.5rem, 2vw, 2.25rem) clamp(1.75rem, 2.5vh, 2.5rem) clamp(3.75rem, 4.5vw, 4.25rem)",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </div>
  );
};
