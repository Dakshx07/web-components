"use client";

import React from "react";
import styles from "./FolderStackAnimation.module.css";
import { soundFx } from "./soundFx";

interface FolderTabProps {
  label: string;
  color: string;
  textColor?: string;
  onClick?: (e: React.MouseEvent) => void;
  dataTabId?: string;
  isVisible?: boolean;
}

const TAG_PATH =
  "M1.1449 -2.54901e-05L-521.145 -2.66006e-06C-531.065 -2.22644e-06 -540.343 4.90374 -545.932 13.0999L-558.55 31.6066C-563.837 39.3607 -572.615 44 -582 44L62 44C52.6151 44 43.8369 39.3607 38.5499 31.6066L25.9318 13.0999C20.3434 4.90373 11.0649 -2.59237e-05 1.1449 -2.54901e-05Z";

export const FolderTab: React.FC<FolderTabProps> = ({
  label,
  color,
  textColor = "#FFFFFF",
  onClick,
  dataTabId,
  isVisible = true,
}) => {
  return (
    <div
      className={`${styles.tag} ${isVisible ? styles.tagVisible : ""}`}
      style={
        {
          "--bg-color": color,
          "--color": textColor,
        } as React.CSSProperties
      }
      onClick={onClick}
      onMouseEnter={() => soundFx.playPaperRustle()}
      data-tab-id={dataTabId}
    >
      {/* Left shoulder curve (mirrored via scaleX -1) */}
      <svg
        className={styles.tagStart}
        viewBox="0 0 62 44"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={TAG_PATH} fill="currentColor" />
      </svg>

      {/* Middle label area */}
      <div className={styles.tagMiddle}>
        <span>{label}</span>
      </div>

      {/* Right shoulder curve */}
      <svg
        className={styles.tagEnd}
        viewBox="0 0 62 44"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={TAG_PATH} fill="currentColor" />
      </svg>
    </div>
  );
};
