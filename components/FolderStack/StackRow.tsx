"use client";

import React, { useRef, useEffect, useState } from "react";
import { FolderConfig } from "./types";
import { FolderTab } from "./FolderTab";
import styles from "./FolderStackAnimation.module.css";

interface StackRowProps {
  folder: FolderConfig;
  isExpanded: boolean;
  headerBgColor: string;
  isLast: boolean;
  onTabClick?: (tabLabel: string) => void;
  rowRef?: React.RefObject<HTMLDivElement | null>;
}

export const StackRow: React.FC<StackRowProps> = ({
  folder,
  isExpanded,
  headerBgColor,
  isLast,
  onTabClick,
  rowRef,
}) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  const showBody = isExpanded || isLast;

  useEffect(() => {
    const updateHeight = () => {
      if (bodyRef.current) {
        setContentHeight(bodyRef.current.scrollHeight);
      }
    };
    updateHeight();

    if (typeof window !== "undefined" && bodyRef.current) {
      const observer = new ResizeObserver(updateHeight);
      observer.observe(bodyRef.current);
      return () => observer.disconnect();
    }
  }, [folder, showBody]);

  return (
    <div
      className={styles.stackRow}
      ref={rowRef}
      data-row-id={folder.id}
    >
      {/* Tab header row */}
      <div
        className={styles.stackRowHeader}
        style={{
          background: `linear-gradient(to top, ${folder.primaryColor} 12px, ${headerBgColor} 12px)`,
        }}
      >
        <div className={styles.stackRowTabs}>
          {folder.tabs.map((tab, index) => (
            <FolderTab
              key={index}
              label={tab.label}
              color={tab.color}
              textColor={tab.textColor}
              dataTabId={`${folder.id}-${tab.label}`}
              onClick={(e) => {
                e.stopPropagation();
                onTabClick?.(tab.label);
              }}
            />
          ))}
        </div>
      </div>

      {/* Expandable body */}
      <div
        ref={bodyRef}
        className={styles.stackRowBody}
        style={{
          height: showBody ? `${contentHeight}px` : "0px",
          opacity: showBody ? 1 : 0,
        }}
      >
        <div
          className={styles.stackRowBodyContent}
          style={{
            backgroundColor: folder.primaryColor,
            minHeight: isLast ? "320px" : "120px",
          }}
        >
          <div className={styles.contentId}>{folder.contentId}</div>
          <div className={styles.contentText}>{folder.contentText}</div>
          <div className={styles.contentDate}>{folder.contentDate}</div>
        </div>
      </div>
    </div>
  );
};
