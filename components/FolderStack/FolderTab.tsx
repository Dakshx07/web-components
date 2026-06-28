"use client";

import React from "react";
import { TabConfig } from "./types";

interface FolderTabProps {
  tab: TabConfig;
  isActiveFolder: boolean;
  onClick?: () => void;
}

export const FolderTab: React.FC<FolderTabProps> = ({
  tab,
  isActiveFolder,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-end select-none cursor-pointer transition-transform duration-200 ease-out active:scale-95 ${
        isActiveFolder ? "z-10" : "hover:-translate-y-[2px]"
      }`}
      style={{ color: tab.color }}
    >
      {/* Left Cap */}
      <svg
        className="w-[24px] h-[40px] block shrink-0"
        viewBox="0 0 24 40"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 0 40 C 8 40, 12 34, 12 26 L 18 6 C 18 2, 20 0, 24 0 L 24 40 Z" />
      </svg>

      {/* Center Section containing Label */}
      <div
        className="h-[40px] flex items-center justify-center font-sans text-[13px] font-medium tracking-wide px-1 select-none whitespace-nowrap"
        style={{
          backgroundColor: tab.color,
          color: tab.textColor,
        }}
      >
        {tab.label}
      </div>

      {/* Right Cap */}
      <svg
        className="w-[24px] h-[40px] block shrink-0"
        viewBox="0 0 24 40"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 0 0 C 4 0, 6 2, 6 6 L 12 26 C 12 34, 16 40, 24 40 L 0 40 Z" />
      </svg>
    </div>
  );
};
