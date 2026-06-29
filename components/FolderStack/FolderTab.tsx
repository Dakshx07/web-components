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
      className={`flex items-end select-none cursor-pointer transition-transform duration-200 ease-out active:scale-95 ${
        isActiveFolder ? "z-10" : "hover:-translate-y-[2px]"
      }`}
      style={{ color: tab.color }}
    >
      {/* Left Cap (Sweeping 35px curve for natural flare) */}
      <svg
        className="w-[35px] h-[40px] block shrink-0"
        viewBox="0 0 35 40"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 0 40 C 10 40, 15 36, 15 26 L 20 10 C 20 4, 25 0, 35 0 L 35 40 Z" />
      </svg>

      {/* Center Section containing Label */}
      <div
        className="h-[40px] flex items-center justify-center font-serif text-[15px] font-normal tracking-wide px-1.5 select-none whitespace-nowrap"
        style={{
          backgroundColor: tab.color,
          color: tab.textColor,
        }}
      >
        {tab.label}
      </div>

      {/* Right Cap (Sweeping 35px curve for natural flare) */}
      <svg
        className="w-[35px] h-[40px] block shrink-0"
        viewBox="0 0 35 40"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 0 0 C 10 0, 15 4, 15 10 L 20 26 C 20 36, 25 40, 35 40 L 0 40 Z" />
      </svg>
    </div>
  );
};
