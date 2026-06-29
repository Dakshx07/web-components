"use client";

import React from "react";
import { FolderConfig } from "./types";
import { FolderTab } from "./FolderTab";
import { FolderBody } from "./FolderBody";

/**
 * Constants shared with FolderStack for layout calculations.
 */
export const TAB_HEIGHT = 40;
export const EXPANDED_BODY_HEIGHT = 320;

interface FolderProps {
  folder: FolderConfig;
  index: number;
  totalFolders: number;
  initialHeaderBgColor: string;
}

/**
 * A single folder in the rolodex stack.
 *
 * Renders with data-* attributes on key sub-elements so the parent
 * FolderStack can target them with GSAP for scroll-driven animation.
 *
 * Initial inline styles prevent FOUC — GSAP takes over once mounted.
 */
export const Folder: React.FC<FolderProps> = ({
  folder,
  index,
  totalFolders,
  initialHeaderBgColor,
}) => {
  const isInitiallyActive = index === totalFolders - 1;

  return (
    <div
      data-folder-idx={index}
      className="absolute w-full flex flex-col will-change-transform"
      style={{
        top: `${index * TAB_HEIGHT}px`,
        zIndex: index + 1,
      }}
    >
      {/* Tab Header — two-layer background for GSAP color animation */}
      <div className="relative w-full h-[40px] select-none">
        {/* Top 28px: predecessor folder's color (animated by GSAP) */}
        <div
          data-header-bg
          className="absolute inset-x-0 top-0 h-[28px]"
          style={{ backgroundColor: initialHeaderBgColor }}
        />
        {/* Bottom 12px: this folder's own color (static) */}
        <div
          className="absolute inset-x-0 bottom-0 h-[12px]"
          style={{ backgroundColor: folder.primaryColor }}
        />
        {/* Tab strip (sits on top of both background layers) */}
        <div
          data-tab-row
          className="relative z-10 flex items-end gap-1.5 pl-0 h-full"
        >
          {folder.tabs.map((tab, tabIdx) => (
            <FolderTab
              key={tabIdx}
              tab={tab}
              isActiveFolder={isInitiallyActive}
            />
          ))}
        </div>
      </div>

      {/* Body — height & opacity controlled by GSAP */}
      <div
        data-folder-body
        className="overflow-hidden -mt-[1px] relative"
        style={{
          height: isInitiallyActive ? `${EXPANDED_BODY_HEIGHT}px` : "0px",
          opacity: isInitiallyActive ? 1 : 0,
        }}
      >
        <FolderBody folder={folder} />
      </div>
    </div>
  );
};
