"use client";

import React, { useState, useEffect, useRef } from "react";
import { BlockType, CommandPalettePosition, SlashCommandItem } from "./types";

export interface CommandSelectOptions {
  command: BlockType;
  defaultColumns?: 2 | 3;
  initialType?: BlockType;
  columnLayoutPreset?: "sidebyside" | "3images" | "3text" | "columns";
}

const COMMAND_ITEMS: SlashCommandItem[] = [
  // ── Suggested & Layout ──
  {
    label: "2 Columns",
    description: "Split page into 2 columns side-by-side.",
    command: "columns",
    defaultColumns: 2,
    columnLayoutPreset: "columns",
    shortcut: "col2",
    category: "suggested",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="8" height="18" rx="2" />
        <rect x="13" y="3" width="8" height="18" rx="2" />
      </svg>
    ),
  },
  {
    label: "3 Columns",
    description: "Split page into 3 columns in a row.",
    command: "columns",
    defaultColumns: 3,
    columnLayoutPreset: "columns",
    shortcut: "col3",
    category: "suggested",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="5.5" height="18" rx="1.5" />
        <rect x="9.25" y="3" width="5.5" height="18" rx="1.5" />
        <rect x="16.5" y="3" width="5.5" height="18" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Side by Side (Image + Text)",
    description: "Image on left, formatted text on right.",
    command: "columns",
    defaultColumns: 2,
    initialType: "image",
    columnLayoutPreset: "sidebyside",
    shortcut: "side",
    category: "suggested",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="8" height="18" rx="2" />
        <line x1="14" y1="7" x2="21" y2="7" />
        <line x1="14" y1="12" x2="21" y2="12" />
        <line x1="14" y1="17" x2="19" y2="17" />
      </svg>
    ),
  },
  {
    label: "3 Images in a Row",
    description: "Three image blocks side-by-side.",
    command: "columns",
    defaultColumns: 3,
    initialType: "image",
    columnLayoutPreset: "3images",
    shortcut: "3img",
    category: "suggested",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="5.5" height="16" rx="1.5" />
        <rect x="9.25" y="4" width="5.5" height="16" rx="1.5" />
        <rect x="16.5" y="4" width="5.5" height="16" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "3 Text Paras in a Row",
    description: "Three parallel columns of writing.",
    command: "columns",
    defaultColumns: 3,
    initialType: "paragraph",
    columnLayoutPreset: "3text",
    shortcut: "3text",
    category: "suggested",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="7" y2="6" />
        <line x1="3" y1="12" x2="7" y2="12" />
        <line x1="10" y1="6" x2="14" y2="6" />
        <line x1="10" y1="12" x2="14" y2="12" />
        <line x1="17" y1="6" x2="21" y2="6" />
        <line x1="17" y1="12" x2="21" y2="12" />
      </svg>
    ),
  },

  // ── Basic blocks ──
  {
    label: "Text",
    description: "Just start writing with plain text.",
    command: "paragraph",
    shortcut: "text",
    category: "basic",
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
    description: "Large section title.",
    command: "h1",
    shortcut: "#",
    category: "basic",
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
    description: "Medium section title.",
    command: "h2",
    shortcut: "##",
    category: "basic",
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
    category: "basic",
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
    label: "To-do list",
    description: "Track tasks with an interactive checklist.",
    command: "todo",
    shortcut: "[]",
    category: "basic",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    label: "Bullet list",
    description: "Create a simple bulleted list.",
    command: "bullet",
    shortcut: "•",
    category: "basic",
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
    label: "Numbered list",
    description: "Create a list with numbering.",
    command: "numbered",
    shortcut: "1.",
    category: "basic",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="10" y1="6" x2="21" y2="6" />
        <line x1="10" y1="12" x2="21" y2="12" />
        <line x1="10" y1="18" x2="21" y2="18" />
        <path d="M4 6h1v4" />
        <path d="M4 10h2" />
      </svg>
    ),
  },
  {
    label: "Quote",
    description: "Capture a quote or prominent excerpt.",
    command: "quote",
    shortcut: ">",
    category: "basic",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
      </svg>
    ),
  },
  {
    label: "Callout",
    description: "Make text stand out with icon and tint.",
    command: "callout",
    shortcut: "box",
    category: "basic",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "Divider",
    description: "Visually divide blocks with a clean line.",
    command: "divider",
    shortcut: "---",
    category: "basic",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="12" x2="20" y2="12" />
      </svg>
    ),
  },
  {
    label: "Code",
    description: "Capture code with monospace formatting.",
    command: "code",
    shortcut: "```",
    category: "basic",
    renderIcon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },

  // ── Media ──
  {
    label: "Image",
    description: "Upload an image or embed with link.",
    command: "image",
    shortcut: "img",
    category: "media",
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
    description: "Embed from YouTube, Vimeo, or upload video.",
    command: "video",
    shortcut: "video",
    category: "media",
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
  onSelectCommand: (options: CommandSelectOptions) => void;
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
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery);
    setSearch(searchQuery || "");
    setSelectedIndex(0);
  }

  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setSearch("");
      setSelectedIndex(0);
    }
  }

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const filtered = COMMAND_ITEMS.filter(
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
          const item = filtered[selectedIndex];
          onSelectCommand({
            command: item.command,
            defaultColumns: item.defaultColumns,
            initialType: item.initialType,
            columnLayoutPreset: item.columnLayoutPreset,
          });
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

  // Viewport collision detection
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

  // Group by category
  const suggestedItems = filtered.filter((i) => i.category === "suggested");
  const basicItems = filtered.filter((i) => i.category === "basic");
  const mediaItems = filtered.filter((i) => i.category === "media");

  let globalIdx = 0;

  return (
    <div
      style={{
        ...style,
        zIndex: 1000,
        width: "320px",
        borderRadius: "10px",
        backgroundColor: "rgba(28, 28, 30, 0.98)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255, 255, 255, 0.09)",
        boxShadow: "0 18px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        overflow: "hidden",
        color: "#f4f4f5",
        fontFamily: "var(--font-inter, sans-serif)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 12px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
          backgroundColor: "rgba(40, 40, 44, 0.5)",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2">
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
          placeholder="Type to filter..."
          style={{
            width: "100%",
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
            color: "#f4f4f5",
            fontSize: "0.8rem",
            padding: 0,
          }}
        />
        <span
          style={{
            fontSize: "0.65rem",
            color: "#a1a1aa",
            fontFamily: "monospace",
            backgroundColor: "rgba(60, 60, 65, 0.7)",
            padding: "2px 5px",
            borderRadius: "3px",
          }}
        >
          ESC
        </span>
      </div>

      {/* Commands List */}
      <div
        ref={listRef}
        style={{
          maxHeight: "280px",
          overflowY: "auto",
          padding: "4px",
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: "20px 12px", textAlign: "center", fontSize: "0.8rem", color: "#71717a" }}>
            No matching blocks
          </div>
        ) : (
          <>
            {/* Suggested / Layout Section */}
            {suggestedItems.length > 0 && (
              <div>
                <div style={{ padding: "6px 8px 3px 8px", fontSize: "0.68rem", fontWeight: 600, color: "#8e8e93" }}>
                  Suggested
                </div>
                {suggestedItems.map((cmd) => {
                  const currentIdx = globalIdx++;
                  const isSelected = currentIdx === selectedIndex;
                  return (
                    <button
                      key={cmd.label}
                      ref={(el) => {
                        itemRefs.current[currentIdx] = el;
                      }}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(currentIdx)}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectCommand({
                          command: cmd.command,
                          defaultColumns: cmd.defaultColumns,
                          initialType: cmd.initialType,
                          columnLayoutPreset: cmd.columnLayoutPreset,
                        });
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "6px 8px",
                        borderRadius: "6px",
                        textAlign: "left",
                        border: "none",
                        backgroundColor: isSelected ? "rgba(255, 255, 255, 0.08)" : "transparent",
                        color: isSelected ? "#ffffff" : "#d4d4d8",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isSelected ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.05)",
                          color: isSelected ? "#ffffff" : "#a1a1aa",
                          flexShrink: 0,
                        }}
                      >
                        {cmd.renderIcon()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 500 }}>{cmd.label}</div>
                      </div>
                      <div style={{ fontSize: "0.68rem", fontFamily: "monospace", color: "#71717a" }}>
                        {cmd.shortcut}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Basic Blocks Section */}
            {basicItems.length > 0 && (
              <div style={{ marginTop: suggestedItems.length > 0 ? "6px" : 0 }}>
                <div style={{ padding: "6px 8px 3px 8px", fontSize: "0.68rem", fontWeight: 600, color: "#8e8e93" }}>
                  Basic blocks
                </div>
                {basicItems.map((cmd) => {
                  const currentIdx = globalIdx++;
                  const isSelected = currentIdx === selectedIndex;
                  return (
                    <button
                      key={cmd.label}
                      ref={(el) => {
                        itemRefs.current[currentIdx] = el;
                      }}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(currentIdx)}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectCommand({
                          command: cmd.command,
                          defaultColumns: cmd.defaultColumns,
                          initialType: cmd.initialType,
                          columnLayoutPreset: cmd.columnLayoutPreset,
                        });
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "6px 8px",
                        borderRadius: "6px",
                        textAlign: "left",
                        border: "none",
                        backgroundColor: isSelected ? "rgba(255, 255, 255, 0.08)" : "transparent",
                        color: isSelected ? "#ffffff" : "#d4d4d8",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isSelected ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.05)",
                          color: isSelected ? "#ffffff" : "#a1a1aa",
                          flexShrink: 0,
                        }}
                      >
                        {cmd.renderIcon()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 500 }}>{cmd.label}</div>
                      </div>
                      <div style={{ fontSize: "0.68rem", fontFamily: "monospace", color: "#71717a" }}>
                        {cmd.shortcut}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Media Section */}
            {mediaItems.length > 0 && (
              <div style={{ marginTop: "6px" }}>
                <div style={{ padding: "6px 8px 3px 8px", fontSize: "0.68rem", fontWeight: 600, color: "#8e8e93" }}>
                  Media
                </div>
                {mediaItems.map((cmd) => {
                  const currentIdx = globalIdx++;
                  const isSelected = currentIdx === selectedIndex;
                  return (
                    <button
                      key={cmd.label}
                      ref={(el) => {
                        itemRefs.current[currentIdx] = el;
                      }}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(currentIdx)}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectCommand({
                          command: cmd.command,
                          defaultColumns: cmd.defaultColumns,
                          initialType: cmd.initialType,
                          columnLayoutPreset: cmd.columnLayoutPreset,
                        });
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "6px 8px",
                        borderRadius: "6px",
                        textAlign: "left",
                        border: "none",
                        backgroundColor: isSelected ? "rgba(255, 255, 255, 0.08)" : "transparent",
                        color: isSelected ? "#ffffff" : "#d4d4d8",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isSelected ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.05)",
                          color: isSelected ? "#ffffff" : "#a1a1aa",
                          flexShrink: 0,
                        }}
                      >
                        {cmd.renderIcon()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 500 }}>{cmd.label}</div>
                      </div>
                      <div style={{ fontSize: "0.68rem", fontFamily: "monospace", color: "#71717a" }}>
                        {cmd.shortcut}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Notion Pinned Footer */}
      <div
        style={{
          padding: "6px 12px",
          borderTop: "1px solid rgba(255, 255, 255, 0.07)",
          backgroundColor: "rgba(22, 22, 24, 0.7)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.68rem",
          color: "#8e8e93",
        }}
      >
        <span>Close menu</span>
        <span style={{ fontFamily: "monospace", fontSize: "0.62rem" }}>esc</span>
      </div>
    </div>
  );
};
