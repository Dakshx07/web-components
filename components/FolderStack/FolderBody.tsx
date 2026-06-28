"use client";

import React from "react";
import { FolderConfig } from "./types";

interface FolderBodyProps {
  folder: FolderConfig;
}

export const FolderBody: React.FC<FolderBodyProps> = ({ folder }) => {
  return (
    <div
      className="w-full flex items-start gap-4 px-8 sm:px-14 py-10 font-mono text-[13px] select-text"
      style={{
        backgroundColor: folder.primaryColor,
        color: "rgba(255, 255, 255, 0.9)",
      }}
    >
      {/* Content ID (Left Column) */}
      <div className="w-[60px] sm:w-[100px] shrink-0 opacity-60 font-semibold">
        {folder.contentId}
      </div>

      {/* Main Text Content (Center Column) */}
      <div className="flex-1 whitespace-pre-line leading-relaxed max-w-sm sm:max-w-md">
        {folder.contentText}
      </div>

      {/* Date (Right Column) */}
      <div className="w-[100px] sm:w-[150px] shrink-0 text-right opacity-60">
        {folder.contentDate}
      </div>
    </div>
  );
};
