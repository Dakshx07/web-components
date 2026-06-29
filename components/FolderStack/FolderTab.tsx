"use client";

import React from "react";
import { TabConfig } from "./types";

interface FolderTabProps {
  tab: TabConfig;
  isActiveFolder: boolean;
  onClick?: () => void;
}

export const FolderTab: React.FC<FolderTabProps> = ({ tab, isActiveFolder, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-start select-none cursor-pointer transition-transform duration-200 ease-out h-[40px] ${
        isActiveFolder ? "z-10" : ""
      }`}
      style={{ color: tab.color }}
    >
      {/* Left Cap (Curves within top 28px, transparent bottom 12px) */}
      <svg
        className="w-[35px] h-[40px] block shrink-0"
        viewBox="0 0 35 40"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 0 28 C 17.5 28, 17.5 0, 35 0 L 35 28 Z" />
      </svg>

      {/* Center Section containing Label (Fixed 28px height to align with curves) */}
      <div
        className="h-[28px] flex items-center justify-center font-serif text-[15px] font-normal tracking-wide px-1.5 select-none whitespace-nowrap"
        style={{
          backgroundColor: tab.color,
          color: tab.textColor,
        }}
      >
        {tab.label}
      </div>

      {/* Right Cap (Curves within top 28px, transparent bottom 12px) */}
      <svg
        className="w-[35px] h-[40px] block shrink-0"
        viewBox="0 0 35 40"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 0 0 C 17.5 0, 17.5 28, 35 28 L 0 28 Z" />
      </svg>
    </div>
  );
};
