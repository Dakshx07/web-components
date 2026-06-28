"use client";

import React from "react";
import { TabConfig } from "./types";

interface FolderTabProps {
  tab: tab; // Wait, type is TabConfig
  isActiveFolder: boolean;
  onClick?: () => void;
}

// Wait, let's make sure the import/prop type uses TabConfig correctly
export const FolderTab: React.FC<{
  tab: TabConfig;
  isActiveFolder: boolean;
  onClick?: () => void;
}> = ({ tab, isActiveFolder, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-end select-none cursor-pointer transition-transform duration-200 ease-out active:scale-95 ${
        isActiveFolder ? "z-10" : "hover:-translate-y-[2px]"
      }`}
      style={{ color: tab.color }}
    >
      {/* Left Cap (Steeper 20px width curve) */}
      <svg
        className="w-[20px] h-[40px] block shrink-0"
        viewBox="0 0 20 40"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 0 40 C 6 40, 10 34, 10 26 L 14 6 C 14 2, 16 0, 20 0 L 20 40 Z" />
      </svg>

      {/* Center Section with Serif Typography */}
      <div
        className="h-[40px] flex items-center justify-center font-serif text-[15px] font-normal tracking-wide px-1.5 select-none whitespace-nowrap"
        style={{
          backgroundColor: tab.color,
          color: tab.textColor,
        }}
      >
        {tab.label}
      </div>

      {/* Right Cap (Steeper 20px width curve) */}
      <svg
        className="w-[20px] h-[40px] block shrink-0"
        viewBox="0 0 20 40"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 0 0 C 4 0, 6 2, 6 6 L 10 26 C 10 34, 14 40, 20 40 L 0 40 Z" />
      </svg>
    </div>
  );
};
