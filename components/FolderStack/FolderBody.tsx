"use client";

import React from "react";
import { FolderConfig } from "./types";

interface FolderBodyProps {
  folder: FolderConfig;
}

export const FolderBody: React.FC<FolderBodyProps> = ({ folder }) => {
  return (
    <div
      className={`w-full flex items-start gap-6 px-10 sm:px-18 py-12 font-mono text-[7px] sm:text-[8.5px] select-text ${
        folder.id === 8 ? "min-h-[320px]" : "min-h-[120px]"
      }`}
      style={{
        backgroundColor: folder.primaryColor,
        color: "rgba(255, 255, 255, 0.9)",
      }}
    >
      {/* Content ID (Left Column) */}
      <div className="w-[80px] sm:w-[120px] shrink-0 opacity-60 font-semibold select-none">
        {folder.contentId}
      </div>

      {/* Main Text Content (Center Column) */}
      <div className="flex-1 whitespace-pre-line leading-relaxed max-w-md sm:max-w-xl">
        {folder.contentText}
      </div>

      {/* Date (Right Column) */}
      <div className="w-[110px] sm:w-[180px] shrink-0 text-right opacity-60 select-none">
        {folder.contentDate}
      </div>
    </div>
  );
};
