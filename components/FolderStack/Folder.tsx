"use client";

import React, { useState, useRef, useEffect } from "react";
import { FolderConfig } from "./types";
import { FolderTab } from "./FolderTab";
import { FolderBody } from "./FolderBody";

interface FolderProps {
  folder: FolderConfig;
  isActive: boolean;
  onActiveToggle: () => void;
  headerBgColor: string;
  isLast: boolean;
}

export const Folder: React.FC<FolderProps> = ({
  folder,
  isActive,
  onActiveToggle,
  headerBgColor,
  isLast,
}) => {
  const [contentHeight, setContentHeight] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Folder 8 (isLast) always remains expanded
  const isExpanded = isActive || isLast;

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
  }, [folder, isExpanded]);

  return (
    <div className="w-full flex flex-col relative">
      {/* Folder Tab Header Row */}
      <div
        className="flex items-end w-full h-[40px] z-10 relative select-none"
        style={{
          backgroundColor: headerBgColor,
        }}
      >
        <div className="flex items-end gap-1.5 pl-0">
          {folder.tabs.map((tab, index) => (
            <FolderTab
              key={index}
              tab={tab}
              isActiveFolder={isActive}
              onClick={onActiveToggle}
            />
          ))}
        </div>
      </div>

      {/* Folder Body Container (Completely sharp corners / rounded-none) */}
      <div
        ref={bodyRef}
        className="overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] -mt-[1px] relative z-0 rounded-none"
        style={{
          height: isExpanded ? `${contentHeight}px` : "0px",
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <FolderBody folder={folder} />
      </div>
    </div>
  );
};
