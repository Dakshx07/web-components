"use client";

import React, { useEffect, useState } from "react";
import { BlockType } from "./types";
import styles from "./BlockEditor.module.css";

interface SlashOption {
  type: BlockType;
  title: string;
  description: string;
  icon: string;
}

const SLASH_OPTIONS: SlashOption[] = [
  {
    type: "paragraph",
    title: "Text",
    description: "Just start writing with plain text.",
    icon: "¶",
  },
  {
    type: "h1",
    title: "Heading 1",
    description: "Big section heading.",
    icon: "H1",
  },
  {
    type: "h2",
    title: "Heading 2",
    description: "Medium section heading.",
    icon: "H2",
  },
  {
    type: "h3",
    title: "Heading 3",
    description: "Small section subheader.",
    icon: "H3",
  },
  {
    type: "todo",
    title: "To-do list",
    description: "Track tasks with a tactile checkbox.",
    icon: "☑",
  },
  {
    type: "bullet",
    title: "Bulleted list",
    description: "Create a simple bulleted list.",
    icon: "•",
  },
  {
    type: "image",
    title: "Image",
    description: "Embed an architectural photo or drawing.",
    icon: "🖼",
  },
  {
    type: "video",
    title: "Video",
    description: "Embed YouTube or MP4 video player.",
    icon: "▶",
  },
  {
    type: "divider",
    title: "Divider",
    description: "Visually divide blocks with a thin line.",
    icon: "―",
  },
];

interface SlashMenuProps {
  filterText: string;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export const SlashMenu: React.FC<SlashMenuProps> = ({
  filterText,
  onSelect,
  onClose,
  position,
}) => {
  const [prevFilter, setPrevFilter] = useState(filterText);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (prevFilter !== filterText) {
    setPrevFilter(filterText);
    setSelectedIndex(0);
  }

  const query = filterText.toLowerCase().replace(/^\//, "").trim();
  const filteredOptions = SLASH_OPTIONS.filter(
    (opt) =>
      opt.title.toLowerCase().includes(query) ||
      opt.type.toLowerCase().includes(query)
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev + 1 < filteredOptions.length ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev - 1 >= 0 ? prev - 1 : filteredOptions.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredOptions[selectedIndex]) {
          onSelect(filteredOptions[selectedIndex].type);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredOptions, selectedIndex, onSelect, onClose]);

  if (filteredOptions.length === 0) return null;

  return (
    <div
      className={styles.slashMenu}
      style={{
        top: `${position.top + 28}px`,
        left: `${Math.min(position.left, 360)}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.slashMenuHeader}>Basic blocks</div>
      <div className={styles.slashMenuList}>
        {filteredOptions.map((opt, idx) => (
          <button
            key={opt.type}
            type="button"
            className={`${styles.slashMenuItem} ${
              idx === selectedIndex ? styles.slashMenuItemActive : ""
            }`}
            onClick={() => onSelect(opt.type)}
            onMouseEnter={() => setSelectedIndex(idx)}
          >
            <span className={styles.slashMenuIcon}>{opt.icon}</span>
            <div className={styles.slashMenuText}>
              <div className={styles.slashMenuTitle}>{opt.title}</div>
              <div className={styles.slashMenuDesc}>{opt.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
