"use client";

import React, { useState, useEffect, useRef } from "react";
import { BlockType, CommandPalettePosition } from "./types";

interface CommandItem {
  label: string;
  description: string;
  command: BlockType;
  shortcut: string;
  renderIcon: () => React.ReactNode;
}

const SLASH_COMMANDS: CommandItem[] = [
  {
    label: "Text",
    description: "Start writing with plain text.",
    command: "paragraph",
    shortcut: "text",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="9" y1="20" x2="15" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    ),
  },
  {
    label: "Heading 1",
    description: "Big section heading.",
    command: "h1",
    shortcut: "#",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h8" />
        <path d="M4 18V6" />
        <path d="M12 18V6" />
        <path d="m17 12 3-2v8" />
      </svg>
    ),
  },
  {
    label: "Heading 2",
    description: "Medium section heading.",
    command: "h2",
    shortcut: "##",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h8" />
        <path d="M4 18V6" />
        <path d="M12 18V6" />
        <path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" />
      </svg>
    ),
  },
  {
    label: "Heading 3",
    description: "Small section heading.",
    command: "h3",
    shortcut: "###",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h8" />
        <path d="M4 18V6" />
        <path d="M12 18V6" />
        <path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2" />
        <path d="M17 17.5c2 1.5 4 0 4-1.5a2 2 0 0 0-2-2" />
      </svg>
    ),
  },
  {
    label: "Bullet List",
    description: "Create a simple bulleted list.",
    command: "bullet",
    shortcut: "•",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    label: "Numbered List",
    description: "Create a list with numbering.",
    command: "numbered",
    shortcut: "1.",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="10" y1="6" x2="21" y2="6" />
        <line x1="10" y1="12" x2="21" y2="12" />
        <line x1="10" y1="18" x2="21" y2="18" />
        <path d="M4 6h1v4" />
        <path d="M4 10h2" />
        <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
      </svg>
    ),
  },
  {
    label: "Quote",
    description: "Capture a quote or callout.",
    command: "quote",
    shortcut: ">",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
      </svg>
    ),
  },
  {
    label: "Code",
    description: "Capture a code snippet.",
    command: "code",
    shortcut: "```",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    label: "Divider",
    description: "Visually divide blocks with a line.",
    command: "divider",
    shortcut: "---",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  {
    label: "Image",
    description: "Upload an image or embed with a link.",
    command: "image",
    shortcut: "img",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    label: "Video",
    description: "Embed from YouTube, Vimeo, or upload a video.",
    command: "video",
    shortcut: "video",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onSelectCommand: (command: BlockType) => void;
  onClose: () => void;
  position?: CommandPalettePosition | null;
  searchQuery?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onSelectCommand,
  onClose,
  position,
  searchQuery = "",
}) => {
  const [search, setSearch] = useState(searchQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSearch(searchQuery || "");
      setSelectedIndex(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(timer);
    } else {
      setSearch("");
      setSelectedIndex(0);
    }
  }, [isOpen, searchQuery]);

  const filtered = SLASH_COMMANDS.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description.toLowerCase().includes(search.toLowerCase()) ||
      cmd.shortcut.toLowerCase().includes(search.toLowerCase()) ||
      cmd.command.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) =>
          filtered.length > 0 ? Math.min(filtered.length - 1, prev + 1) : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) =>
          filtered.length > 0 ? Math.max(0, prev - 1) : 0
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (filtered.length > 0 && filtered[selectedIndex]) {
          onSelectCommand(filtered[selectedIndex].command);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, filtered, selectedIndex, onSelectCommand, onClose]);

  useEffect(() => {
    const selectedElement = itemRefs.current[selectedIndex];
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const style: React.CSSProperties = position
    ? {
        position: "absolute",
        top: `${position.top}px`,
        left: `${position.left}px`,
      }
    : {
        position: "fixed",
        top: "25%",
        left: "50%",
        transform: "translateX(-50%)",
      };

  return (
    <div
      style={{
        ...style,
        zIndex: 100,
        width: "320px",
        borderRadius: "12px",
        backgroundColor: "rgba(24, 24, 27, 0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(63, 63, 70, 0.8)",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        overflow: "hidden",
        color: "#f4f4f5",
        fontFamily: "var(--font-inter, sans-serif)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header Search Input */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 14px",
          borderBottom: "1px solid rgba(63, 63, 70, 0.6)",
          backgroundColor: "rgba(39, 39, 42, 0.4)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedIndex(0);
          }}
          placeholder="Filter commands or type..."
          style={{
            width: "100%",
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
            color: "#f4f4f5",
            fontSize: "0.82rem",
            padding: 0,
          }}
        />
        <span
          style={{
            fontSize: "0.68rem",
            color: "#a1a1aa",
            fontFamily: "monospace",
            backgroundColor: "rgba(63, 63, 70, 0.8)",
            padding: "2px 6px",
            borderRadius: "4px",
          }}
        >
          ESC
        </span>
      </div>

      {/* Commands List */}
      <div
        ref={listRef}
        style={{
          maxHeight: "260px",
          overflowY: "auto",
          padding: "4px",
        }}
      >
        <div
          style={{
            padding: "6px 10px",
            fontSize: "0.68rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#71717a",
          }}
        >
          Basic Blocks
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "24px 12px", textAlign: "center", fontSize: "0.82rem", color: "#71717a" }}>
            No matching commands found
          </div>
        ) : (
          filtered.map((cmd, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={cmd.command}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                type="button"
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectCommand(cmd.command);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  textAlign: "left",
                  border: "none",
                  backgroundColor: isSelected ? "rgba(63, 63, 70, 0.8)" : "transparent",
                  color: isSelected ? "#ffffff" : "#d4d4d8",
                  cursor: "pointer",
                  transition: "background-color 0.1s ease",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isSelected ? "rgba(82, 82, 91, 0.9)" : "rgba(39, 39, 42, 0.7)",
                    border: "1px solid rgba(63, 63, 70, 0.6)",
                    color: isSelected ? "#ffffff" : "#a1a1aa",
                    flexShrink: 0,
                  }}
                >
                  {cmd.renderIcon()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>{cmd.label}</div>
                  <div style={{ fontSize: "0.72rem", color: "#a1a1aa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {cmd.description}
                  </div>
                </div>
                <div style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "#71717a", flexShrink: 0 }}>
                  {cmd.shortcut}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer Navigation Hints */}
      <div
        style={{
          padding: "6px 12px",
          borderTop: "1px solid rgba(63, 63, 70, 0.6)",
          backgroundColor: "rgba(24, 24, 27, 0.6)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.68rem",
          color: "#71717a",
        }}
      >
        <span>Use ↑↓ to navigate</span>
        <span>↵ to select</span>
      </div>
    </div>
  );
};
