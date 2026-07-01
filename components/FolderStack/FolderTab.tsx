"use client";

import React from "react";
import styles from "./FolderStackAnimation.module.css";

interface FolderTabProps {
  label: string;
  color: string;
  textColor: string;
  onClick?: (e: React.MouseEvent) => void;
  dataTabId?: string;
}

export const FolderTab: React.FC<FolderTabProps> = ({
  label,
  color,
  textColor,
  onClick,
  dataTabId,
}) => {
  return (
    <div
      className={styles.folderTab}
      style={{ color }}
      onClick={onClick}
      data-tab-id={dataTabId}
    >
      {/* Left curved cap */}
      <svg
        className={styles.tabCapSvg}
        viewBox="0 0 35 40"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 0 28 C 17.5 28, 17.5 0, 35 0 L 35 28 Z" />
      </svg>

      {/* Center label */}
      <div
        className={styles.tabLabel}
        style={{
          backgroundColor: color,
          color: textColor,
        }}
      >
        {label}
      </div>

      {/* Right curved cap */}
      <svg
        className={styles.tabCapSvg}
        viewBox="0 0 35 40"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 0 0 C 17.5 0, 17.5 28, 35 28 L 0 28 Z" />
      </svg>
    </div>
  );
};
