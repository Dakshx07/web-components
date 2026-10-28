"use client";

import React, { useState, useRef, useEffect } from "react";
import { BlockType, NotionBlock, CommandPalettePosition } from "./types";
import { CommandPalette } from "./CommandPalette";
import { A4PunchedSheet } from "./A4PunchedSheet";
import { ImageBlock } from "./ImageBlock";
import { VideoBlock } from "./VideoBlock";

interface A4NotionEditorProps {
  initialTitle?: string;
  initialBlocks?: NotionBlock[];
  folderCategory?: string;
  onSave?: (markdown: string, title: string) => void;
  className?: string;
}

const DEFAULT_BLOCKS: NotionBlock[] = [
  {
    id: "block-1",
    type: "paragraph",
    content: "",
  },
];

/**
 * A4NotionEditor — Authentic Notion Block Editor on Archival Punched Paper
 * Ported directly from your Dotplot implementation (notion-style-editor.tsx)
 */
export const A4NotionEditor: React.FC<A4NotionEditorProps> = ({
  initialTitle = "Project Documentation",
  initialBlocks = DEFAULT_BLOCKS,
  folderCategory = "ARCHIVE",
  onSave,
  className,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [blocks, setBlocks] = useState<NotionBlock[]>(initialBlocks);
  const [activeBlockId, setActiveBlockId] = useState<string>(initialBlocks[0]?.id || "block-1");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [palettePos, setPalettePos] = useState<CommandPalettePosition | null>(null);
  const [slashSearchQuery, setSlashSearchQuery] = useState("");

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const blockRefs = useRef<Map<string, HTMLElement>>(new Map());
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Auto-resize title textarea on change
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = "auto";
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [title]);

  const updateBlockContent = (id: string, content: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content } : b)));
  };

  const updateBlockCaption = (id: string, caption: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, caption } : b)));
  };

  const changeBlockType = (id: string, type: BlockType) => {
    if (type === "divider") {
      const nextId = `block-${Date.now()}`;
      setBlocks((prev) => {
        const index = prev.findIndex((b) => b.id === id);
        if (index === -1) return prev;
        const next = [...prev];
        next[index] = { ...next[index], type: "divider", content: "" };
        if (index === next.length - 1 || next[index + 1].type === "divider") {
          next.splice(index + 1, 0, { id: nextId, type: "paragraph", content: "" });
        }
        return next;
      });
      setPaletteOpen(false);
      setSlashSearchQuery("");
      setTimeout(() => {
        blockRefs.current.get(nextId)?.focus();
      }, 30);
      return;
    }

    if (type === "image" || type === "video") {
      setBlocks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, type, content: "", caption: "" } : b))
      );
      setPaletteOpen(false);
      setSlashSearchQuery("");
      return;
    }

    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        // Clean out leading slash trigger text
        const cleanContent = b.content.replace(/^\/.*$/, "").trim();
        return { ...b, type, content: cleanContent };
      })
    );
    setPaletteOpen(false);
    setSlashSearchQuery("");
    setTimeout(() => {
      blockRefs.current.get(id)?.focus();
    }, 40);
  };

  const addBlockBelow = (afterId: string, type: BlockType = "paragraph") => {
    const newId = `block-${Date.now()}`;
    const newBlock: NotionBlock = { id: newId, type, content: "" };

    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === afterId);
      if (index === -1) return [...prev, newBlock];
      const next = [...prev];
      next.splice(index + 1, 0, newBlock);
      return next;
    });

    setActiveBlockId(newId);
    setTimeout(() => {
      const el = blockRefs.current.get(newId);
      if (el) el.focus();
    }, 40);
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => {
      if (prev.length <= 1) return prev;
      const index = prev.findIndex((b) => b.id === id);
      const next = prev.filter((b) => b.id !== id);
      const targetFocusId = next[Math.max(0, index - 1)]?.id;
      if (targetFocusId) {
        setTimeout(() => {
          blockRefs.current.get(targetFocusId)?.focus();
        }, 30);
      }
      return next;
    });
  };

  const handleBlockKeyDown = (
    e: React.KeyboardEvent<HTMLElement>,
    block: NotionBlock,
    index: number
  ) => {
    if (paletteOpen) {
      if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Enter" || e.key === "Escape") {
        return; // Handled by CommandPalette
      }
    }

    // Inside code block: Shift+Enter or Cmd+Enter jumps out
    if (block.type === "code") {
      if (e.key === "Enter" && (e.shiftKey || e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        addBlockBelow(block.id, "paragraph");
        return;
      }
      if (e.key === "Enter") return; // Allow normal newlines inside code
    }

    // Standard Enter adds new block below
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addBlockBelow(
        block.id,
        block.type === "bullet" || block.type === "numbered" ? block.type : "paragraph"
      );
      return;
    }

    // Backspace on empty block
    if (e.key === "Backspace") {
      if (block.content === "") {
        e.preventDefault();
        if (block.type !== "paragraph") {
          changeBlockType(block.id, "paragraph");
        } else if (blocks.length > 1) {
          deleteBlock(block.id);
        }
        return;
      }
    }

    // Arrow Up navigation
    if (e.key === "ArrowUp") {
      if (index > 0) {
        const prevBlock = blocks[index - 1];
        blockRefs.current.get(prevBlock.id)?.focus();
      } else if (index === 0) {
        titleRef.current?.focus();
      }
    }

    // Arrow Down navigation
    if (e.key === "ArrowDown") {
      if (index < blocks.length - 1) {
        const nextBlock = blocks[index + 1];
        blockRefs.current.get(nextBlock.id)?.focus();
      }
    }
  };

  const handleBlockInput = (e: React.FormEvent<HTMLElement>, block: NotionBlock) => {
    const target = e.currentTarget;
    const value = "value" in target ? (target as HTMLInputElement).value : target.innerText;
    updateBlockContent(block.id, value);

    // Detect forward slash trigger
    if (value.startsWith("/")) {
      setActiveBlockId(block.id);
      setSlashSearchQuery(value.slice(1));
      
      if (editorContainerRef.current) {
        const containerRect = editorContainerRef.current.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        
        // Exact pixel coordinates relative to the relative parent container
        const viewportBottom = typeof window !== "undefined" ? window.innerHeight : 800;
        const shouldFlipUp = targetRect.bottom + 320 > viewportBottom && targetRect.top > 340;
        
        const relTop = shouldFlipUp
          ? targetRect.top - containerRect.top - 326
          : targetRect.bottom - containerRect.top + 6;
          
        const relLeft = Math.max(
          16,
          Math.min(targetRect.left - containerRect.left, containerRect.width - 340)
        );

        setPalettePos({
          top: relTop,
          left: relLeft,
        });
      }
      setPaletteOpen(true);
    } else if (paletteOpen) {
      setPaletteOpen(false);
      setSlashSearchQuery("");
    }
  };

  // Word count and estimated read time
  const totalWords = blocks.reduce(
    (sum, b) => sum + (b.content ? b.content.trim().split(/\s+/).filter(Boolean).length : 0),
    0
  );
  const estReadMinutes = Math.max(1, Math.ceil(totalWords / 200));

  return (
    <div ref={editorContainerRef} className={className} style={{ width: "100%", position: "relative" }}>
      <A4PunchedSheet>
        {/* Document Header Metadata Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
            paddingBottom: "14px",
            borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
            fontSize: "0.78rem",
            color: "#71717a",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                textTransform: "uppercase",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#18181b",
              }}
            >
              {folderCategory}
            </span>
            <span>•</span>
            <span>Live Document</span>
          </div>
          <div>
            {totalWords} words • {estReadMinutes} min read
          </div>
        </div>

        {/* Large Document Title (Auto-Growing) */}
        <div style={{ marginBottom: "28px" }}>
          <textarea
            ref={titleRef}
            rows={1}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (blocks[0]) {
                  blockRefs.current.get(blocks[0].id)?.focus();
                }
              }
            }}
            placeholder="Untitled Document..."
            style={{
              width: "100%",
              backgroundColor: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              overflow: "hidden",
              fontSize: "clamp(2rem, 3.2vw, 2.75rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#18181b",
              fontFamily: "var(--font-inter, sans-serif)",
              letterSpacing: "-0.02em",
              padding: 0,
              margin: 0,
            }}
          />
        </div>

        {/* Blocks Flow */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {blocks.map((block, index) => (
            <div
              key={block.id}
              style={{
                position: "relative",
                width: "100%",
                display: "flex",
                alignItems: "flex-start",
              }}
            >
              {/* Paragraph Block */}
              {block.type === "paragraph" && (
                <textarea
                  ref={(el) => {
                    if (el) blockRefs.current.set(block.id, el);
                    else blockRefs.current.delete(block.id);
                  }}
                  value={block.content}
                  onChange={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                    handleBlockInput(e, block);
                  }}
                  onKeyDown={(e) => handleBlockKeyDown(e, block, index)}
                  placeholder="Type '/' for commands..."
                  rows={1}
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    border: "none",
                    outline: "none",
                    resize: "none",
                    overflow: "hidden",
                    fontSize: "1rem",
                    lineHeight: 1.7,
                    color: "#27272a",
                    padding: 0,
                    margin: 0,
                    fontFamily: "inherit",
                  }}
                />
              )}

              {/* Heading 1 */}
              {block.type === "h1" && (
                <input
                  ref={(el) => {
                    if (el) blockRefs.current.set(block.id, el);
                    else blockRefs.current.delete(block.id);
                  }}
                  type="text"
                  value={block.content}
                  onChange={(e) => handleBlockInput(e, block)}
                  onKeyDown={(e) => handleBlockKeyDown(e, block, index)}
                  placeholder="Heading 1"
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: "1.85rem",
                    fontWeight: 700,
                    color: "#18181b",
                    marginTop: "16px",
                    marginBottom: "4px",
                    padding: 0,
                    fontFamily: "inherit",
                  }}
                />
              )}

              {/* Heading 2 */}
              {block.type === "h2" && (
                <input
                  ref={(el) => {
                    if (el) blockRefs.current.set(block.id, el);
                    else blockRefs.current.delete(block.id);
                  }}
                  type="text"
                  value={block.content}
                  onChange={(e) => handleBlockInput(e, block)}
                  onKeyDown={(e) => handleBlockKeyDown(e, block, index)}
                  placeholder="Heading 2"
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: "1.45rem",
                    fontWeight: 600,
                    color: "#18181b",
                    marginTop: "12px",
                    marginBottom: "4px",
                    padding: 0,
                    fontFamily: "inherit",
                  }}
                />
              )}

              {/* Heading 3 */}
              {block.type === "h3" && (
                <input
                  ref={(el) => {
                    if (el) blockRefs.current.set(block.id, el);
                    else blockRefs.current.delete(block.id);
                  }}
                  type="text"
                  value={block.content}
                  onChange={(e) => handleBlockInput(e, block)}
                  onKeyDown={(e) => handleBlockKeyDown(e, block, index)}
                  placeholder="Heading 3"
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: "1.2rem",
                    fontWeight: 600,
                    color: "#27272a",
                    marginTop: "8px",
                    marginBottom: "2px",
                    padding: 0,
                    fontFamily: "inherit",
                  }}
                />
              )}

              {/* Bullet List Item */}
              {block.type === "bullet" && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", width: "100%" }}>
                  <span style={{ fontSize: "1.2rem", lineHeight: "1.6rem", color: "#71717a", userSelect: "none" }}>
                    •
                  </span>
                  <textarea
                    ref={(el) => {
                      if (el) blockRefs.current.set(block.id, el);
                      else blockRefs.current.delete(block.id);
                    }}
                    value={block.content}
                    onChange={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                      handleBlockInput(e, block);
                    }}
                    onKeyDown={(e) => handleBlockKeyDown(e, block, index)}
                    placeholder="List item..."
                    rows={1}
                    style={{
                      width: "100%",
                      backgroundColor: "transparent",
                      border: "none",
                      outline: "none",
                      resize: "none",
                      overflow: "hidden",
                      fontSize: "1rem",
                      lineHeight: 1.7,
                      color: "#27272a",
                      padding: 0,
                      margin: 0,
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              )}

              {/* Numbered List Item */}
              {block.type === "numbered" && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", width: "100%" }}>
                  <span style={{ fontSize: "0.95rem", lineHeight: "1.7rem", color: "#71717a", fontFamily: "monospace", userSelect: "none" }}>
                    {index + 1}.
                  </span>
                  <textarea
                    ref={(el) => {
                      if (el) blockRefs.current.set(block.id, el);
                      else blockRefs.current.delete(block.id);
                    }}
                    value={block.content}
                    onChange={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                      handleBlockInput(e, block);
                    }}
                    onKeyDown={(e) => handleBlockKeyDown(e, block, index)}
                    placeholder="List item..."
                    rows={1}
                    style={{
                      width: "100%",
                      backgroundColor: "transparent",
                      border: "none",
                      outline: "none",
                      resize: "none",
                      overflow: "hidden",
                      fontSize: "1rem",
                      lineHeight: 1.7,
                      color: "#27272a",
                      padding: 0,
                      margin: 0,
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              )}

              {/* Quote Block */}
              {block.type === "quote" && (
                <div
                  style={{
                    borderLeft: "3px solid #18181b",
                    paddingLeft: "16px",
                    margin: "6px 0",
                    width: "100%",
                  }}
                >
                  <textarea
                    ref={(el) => {
                      if (el) blockRefs.current.set(block.id, el);
                      else blockRefs.current.delete(block.id);
                    }}
                    value={block.content}
                    onChange={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                      handleBlockInput(e, block);
                    }}
                    onKeyDown={(e) => handleBlockKeyDown(e, block, index)}
                    placeholder="Quote..."
                    rows={1}
                    style={{
                      width: "100%",
                      backgroundColor: "transparent",
                      border: "none",
                      outline: "none",
                      resize: "none",
                      overflow: "hidden",
                      fontSize: "1.05rem",
                      fontStyle: "italic",
                      lineHeight: 1.65,
                      color: "#3f3f46",
                      padding: 0,
                      margin: 0,
                      fontFamily: "Georgia, serif",
                    }}
                  />
                </div>
              )}

              {/* Code Snippet Block */}
              {block.type === "code" && (
                <div
                  style={{
                    width: "100%",
                    padding: "16px 18px",
                    backgroundColor: "#18181b",
                    borderRadius: "8px",
                    margin: "8px 0",
                    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)",
                  }}
                >
                  <textarea
                    ref={(el) => {
                      if (el) blockRefs.current.set(block.id, el);
                      else blockRefs.current.delete(block.id);
                    }}
                    value={block.content}
                    onChange={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                      handleBlockInput(e, block);
                    }}
                    onKeyDown={(e) => handleBlockKeyDown(e, block, index)}
                    placeholder="// Paste or write code..."
                    rows={3}
                    style={{
                      width: "100%",
                      backgroundColor: "transparent",
                      border: "none",
                      outline: "none",
                      resize: "none",
                      fontFamily: "ui-monospace, SFMono-Regular, monospace",
                      fontSize: "0.88rem",
                      lineHeight: 1.6,
                      color: "#10b981",
                      padding: 0,
                      margin: 0,
                    }}
                  />
                </div>
              )}

              {/* Divider Block */}
              {block.type === "divider" && (
                <div
                  onClick={() => addBlockBelow(block.id, "paragraph")}
                  style={{
                    width: "100%",
                    padding: "16px 0",
                    cursor: "pointer",
                  }}
                >
                  <hr style={{ border: "none", borderTop: "1px solid rgba(0, 0, 0, 0.12)", margin: 0 }} />
                </div>
              )}

              {/* Image Block */}
              {block.type === "image" && (
                <ImageBlock
                  content={block.content}
                  caption={block.caption}
                  onChangeContent={(url) => updateBlockContent(block.id, url)}
                  onChangeCaption={(caption) => updateBlockCaption(block.id, caption)}
                  onDelete={() => deleteBlock(block.id)}
                />
              )}

              {/* Video Block */}
              {block.type === "video" && (
                <VideoBlock
                  content={block.content}
                  caption={block.caption}
                  onChangeContent={(url) => updateBlockContent(block.id, url)}
                  onChangeCaption={(caption) => updateBlockCaption(block.id, caption)}
                  onDelete={() => deleteBlock(block.id)}
                />
              )}
            </div>
          ))}
        </div>

        {/* Blank Bottom Click Zone (Appends new block at end) */}
        <div
          onClick={() => {
            const lastBlock = blocks[blocks.length - 1];
            if (!lastBlock || lastBlock.content.trim() !== "") {
              addBlockBelow(lastBlock?.id || "block-1", "paragraph");
            } else {
              blockRefs.current.get(lastBlock.id)?.focus();
            }
          }}
          style={{
            minHeight: "380px",
            cursor: "text",
            marginTop: "16px",
          }}
        />
      </A4PunchedSheet>

      {/* Floating Slash Command Palette */}
      <CommandPalette
        isOpen={paletteOpen}
        onSelectCommand={(cmd) => changeBlockType(activeBlockId, cmd)}
        onClose={() => {
          setPaletteOpen(false);
          setSlashSearchQuery("");
        }}
        position={palettePos}
        searchQuery={slashSearchQuery}
      />
    </div>
  );
};
