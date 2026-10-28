"use client";

import React from "react";

interface A4PunchedSheetProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Archival A4 Document Sheet with Balanced Punched Holes along the left margin
 * Gives the authentic feel of physical stationery fastened into a binder folder.
 * Takes the full width of the inner folder space with realistic binder hole frequency.
 */
export const A4PunchedSheet: React.FC<A4PunchedSheetProps> = ({
  children,
  className,
  style,
}) => {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        minHeight: "1550px",
        backgroundColor: "#FFFFFF",
        borderRadius: "4px",
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.16), 0 2px 6px rgba(0, 0, 0, 0.08)",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        boxSizing: "border-box",
        color: "#18181b",
        fontFamily: "var(--font-inter, sans-serif)",
        display: "flex",
        ...style,
      }}
    >
      {/* ── Left Spine Binder Strip with Balanced Punched Holes ── */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "4.5rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          alignItems: "center",
          padding: "4rem 0",
          borderRight: "1px solid rgba(0, 0, 0, 0.08)",
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <div
            key={n}
            style={{
              width: "16px",
              height: "16px",
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
          padding: "3.5rem 4rem 8rem calc(4.5rem + 2rem)",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </div>
  );
};
