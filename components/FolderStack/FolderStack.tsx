"use client";

import React, { useState, useEffect, useRef } from "react";
import { FolderConfig } from "./types";
import { Folder } from "./Folder";

export const FolderStack: React.FC = () => {
  const [activeFolderId, setActiveFolderId] = useState<number>(6);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const folders: FolderConfig[] = [
    {
      id: 1,
      primaryColor: "#7E1E5D", // Purple/Magenta
      tabs: [
        { label: "Lexical Interruptions", color: "#7E1E5D", textColor: "#FFFFFF" }
      ],
      contentId: "18A",
      contentDate: "Oct 04, 1952",
      contentText: "Transcripts incomplete.\nAlternate readings suggested.\nMetadata lost during compilation.",
    },
    {
      id: 2,
      primaryColor: "#D95B24", // Orange
      tabs: [
        { label: "Concord Variants", color: "#D95B24", textColor: "#FFFFFF" },
        { label: "Ink Displacement", color: "#2337B5", textColor: "#FFFFFF" },
        { label: "Referent Ghosts", color: "#111111", textColor: "#FFFFFF" }
      ],
      contentId: "18B",
      contentDate: "Nov 12, 1954",
      contentText: "Variant readings confirmed in\nthree separate manuscripts.\nInk chemical analysis pending.",
    },
    {
      id: 3,
      primaryColor: "#0A8068", // Teal/Green
      tabs: [
        { label: "Unanchored Statements", color: "#0A8068", textColor: "#FFFFFF" }
      ],
      contentId: "17A",
      contentDate: "Jan 29, 1955",
      contentText: "Isolated declarations found\nin margins. Syntactic connection\nto main text unresolved.",
    },
    {
      id: 4,
      primaryColor: "#D12A2A", // Red
      tabs: [
        { label: "Varnell Collection", color: "#D12A2A", textColor: "#FFFFFF" },
        { label: "Peripheral Entry", color: "#1D65D5", textColor: "#FFFFFF" }
      ],
      contentId: "17B",
      contentDate: "Mar 18, 1966",
      contentText: "Filed without origin.\nReferenced frequently,\nyet seldom cited in full.",
    },
    {
      id: 5,
      primaryColor: "#6F26A1", // Purple/Violet
      tabs: [
        { label: "Subject Drift", color: "#6F26A1", textColor: "#FFFFFF" },
        { label: "Duplicated Silence", color: "#D12A2A", textColor: "#FFFFFF" },
        { label: "Margin Events", color: "#ECE01B", textColor: "#111111" }
      ],
      contentId: "16A",
      contentDate: "Dec 13, 1956",
      contentText: "Provenance unclear.\nPart of unidentified collection.\nFurther context unavailable.",
    },
    {
      id: 6,
      primaryColor: "#1D65D5", // Blue
      tabs: [
        { label: "Reverse Index", color: "#1D65D5", textColor: "#FFFFFF" }
      ],
      contentId: "16B",
      contentDate: "Dec 13, 1956",
      contentText: "Context unknown.\nConnection to other\nrecords not confirmed.\nProcessing ongoing.",
    },
    {
      id: 7,
      primaryColor: "#BE185D", // Pink
      tabs: [
        { label: "Obscured Provenance", color: "#BE185D", textColor: "#FFFFFF" },
        { label: "Undated Persuasions", color: "#ECE01B", textColor: "#111111" }
      ],
      contentId: "15B",
      contentDate: "May 02, 1961",
      contentText: "Origin details redacted\nby authority. Material evidence\nsuggests external source.",
    },
    {
      id: 8,
      primaryColor: "#1D65D5", // Blue
      tabs: [
        { label: "No Verified", color: "#1D65D5", textColor: "#FFFFFF" }
      ],
      contentId: "15C",
      contentDate: "Mar 18, 1966",
      contentText: "Believed to be part of a\nlarger set. No other\nparts located.\n\nReferent unknown.\nSource pending.",
    },
  ];

  // Auto-play interval handling
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setActiveFolderId((prev) => (prev === folders.length ? 1 : prev + 1));
      }, 3000);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, folders.length]);

  return (
    <div className="w-full max-w-[850px] flex flex-col gap-8 px-4">
      {/* Folder Stack Wrapper (Sharp corners, flat edges, shadow) */}
      <div className="flex flex-col select-none w-full shadow-2xl overflow-hidden rounded-none border-none">
        <div className="flex flex-col gap-0 relative">
          {folders.map((folder, index) => {
            const headerBgColor = index === 0 ? "transparent" : folders[index - 1].primaryColor;
            const isLast = index === folders.length - 1;

            return (
              <Folder
                key={folder.id}
                folder={folder}
                isActive={activeFolderId === folder.id}
                onActiveToggle={() => {
                  setIsPlaying(false); // Stop playing if user interacts
                  setActiveFolderId(folder.id);
                }}
                headerBgColor={headerBgColor}
                isLast={isLast}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
