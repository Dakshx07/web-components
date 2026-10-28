"use client";

import React, { useState, useRef, useCallback } from "react";
import { BlockType, NotionBlock, CommandPalettePosition, A4Page } from "./types";
import { CommandPalette } from "./CommandPalette";
import { A4PunchedSheet } from "./A4PunchedSheet";
import { ImageBlock } from "./ImageBlock";
import { VideoBlock } from "./VideoBlock";

export interface A4NotionEditorProps {
  initialTitle?: string;
  initialBlocks?: NotionBlock[];
  folderCategory?: string;
  onSave?: (markdown: string, title: string) => void;
  className?: string;
  punchEdge?: "left" | "right";
  isZoomedOutPreview?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  pages?: A4Page[];
  onUpdatePages?: (pages: A4Page[]) => void;
}

const DEFAULT_BLOCKS: NotionBlock[] = [
  {
    id: "block-1",
    type: "paragraph",
    content: "",
  },
];

let globalIdCounter = 0;
function nextId(prefix: string = "b"): string {
  globalIdCounter += 1;
  return `${prefix}-${globalIdCounter}`;
}

export const A4NotionEditor: React.FC<A4NotionEditorProps> = ({
  initialTitle = "Project Documentation",
  initialBlocks = DEFAULT_BLOCKS,
  folderCategory = "ARCHIVE",
  className,
  punchEdge = "left",
  isZoomedOutPreview = false,
  isHovered = false,
  onClick,
  pages,
  onUpdatePages,
}) => {
  // If controlled pages are provided, use them; otherwise use local single-page state
  const isMultiPageControlled = Boolean(pages && onUpdatePages);

  const [localPages, setLocalPages] = useState<A4Page[]>(() => {
    if (pages && pages.length > 0) return pages;
    return [
      {
        id: "page-default-1",
        pageNumber: 1,
        title: initialTitle,
        blocks: initialBlocks,
      },
    ];
  });

  const activePages = isMultiPageControlled && pages ? pages : localPages;

  const handlePagesChange = useCallback(
    (newPages: A4Page[]) => {
      if (!isMultiPageControlled) {
        setLocalPages(newPages);
      }
      if (onUpdatePages) {
        onUpdatePages(newPages);
      }
    },
    [isMultiPageControlled, onUpdatePages]
  );

  const [activeBlockId, setActiveBlockId] = useState<string>("block-1");
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [palettePos, setPalettePos] = useState<CommandPalettePosition | null>(null);
  const [slashSearchQuery, setSlashSearchQuery] = useState("");

  const blockRefs = useRef<Map<string, HTMLElement>>(new Map());
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Update a block on a specific page
  const updateBlockContent = (pageIdx: number, blockId: string, content: string) => {
    const updated = activePages.map((p, idx) => {
      if (idx !== pageIdx) return p;
      return {
        ...p,
        blocks: p.blocks.map((b) => (b.id === blockId ? { ...b, content } : b)),
      };
    });
    handlePagesChange(updated);
  };

  const updateBlockCaption = (pageIdx: number, blockId: string, caption: string) => {
    const updated = activePages.map((p, idx) => {
      if (idx !== pageIdx) return p;
      return {
        ...p,
        blocks: p.blocks.map((b) => (b.id === blockId ? { ...b, caption } : b)),
      };
    });
    handlePagesChange(updated);
  };

  const updatePageTitle = (pageIdx: number, title: string) => {
    const updated = activePages.map((p, idx) => {
      if (idx !== pageIdx) return p;
      return { ...p, title };
    });
    handlePagesChange(updated);
  };

  const changeBlockType = (pageIdx: number, blockId: string, type: BlockType) => {
    const updated = activePages.map((p, idx) => {
      if (idx !== pageIdx) return p;

      if (type === "divider") {
        const dividerNextId = nextId("div");
        const bIdx = p.blocks.findIndex((b) => b.id === blockId);
        if (bIdx === -1) return p;
        const next = [...p.blocks];
        next[bIdx] = { ...next[bIdx], type: "divider", content: "" };
        if (bIdx === next.length - 1 || next[bIdx + 1].type === "divider") {
          next.splice(bIdx + 1, 0, { id: dividerNextId, type: "paragraph", content: "" });
        }
        setTimeout(() => blockRefs.current.get(dividerNextId)?.focus(), 30);
        return { ...p, blocks: next };
      }

      if (type === "image" || type === "video") {
        return {
          ...p,
          blocks: p.blocks.map((b) =>
            b.id === blockId ? { ...b, type, content: "", caption: "" } : b
          ),
        };
      }

      return {
        ...p,
        blocks: p.blocks.map((b) => {
          if (b.id !== blockId) return b;
          const cleanContent = b.content.replace(/^\/.*$/, "").trim();
          return { ...b, type, content: cleanContent };
        }),
      };
    });

    handlePagesChange(updated);
    setPaletteOpen(false);
    setSlashSearchQuery("");
    setTimeout(() => blockRefs.current.get(blockId)?.focus(), 40);
  };

  const addBlockBelow = (pageIdx: number, afterId: string, type: BlockType = "paragraph") => {
    const newId = nextId("block");
    const newBlock: NotionBlock = { id: newId, type, content: "" };

    const updated = activePages.map((p, idx) => {
      if (idx !== pageIdx) return p;
      const bIndex = p.blocks.findIndex((b) => b.id === afterId);
      const nextBlocks = [...p.blocks];
      if (bIndex === -1) {
        nextBlocks.push(newBlock);
      } else {
        nextBlocks.splice(bIndex + 1, 0, newBlock);
      }
      return { ...p, blocks: nextBlocks };
    });

    handlePagesChange(updated);
    setActiveBlockId(newId);
    setActivePageIndex(pageIdx);
    setTimeout(() => blockRefs.current.get(newId)?.focus(), 40);
  };

  const deleteBlock = (pageIdx: number, blockId: string) => {
    const targetPage = activePages[pageIdx];
    if (!targetPage || targetPage.blocks.length <= 1) return;

    const bIdx = targetPage.blocks.findIndex((b) => b.id === blockId);
    const prevBlock = targetPage.blocks[Math.max(0, bIdx - 1)];

    const updated = activePages.map((p, idx) => {
      if (idx !== pageIdx) return p;
      return {
        ...p,
        blocks: p.blocks.filter((b) => b.id !== blockId),
      };
    });

    handlePagesChange(updated);
    if (prevBlock) {
      setTimeout(() => blockRefs.current.get(prevBlock.id)?.focus(), 30);
    }
  };

  const handleAddNewPage = () => {
    const newPageNum = activePages.length + 1;
    const newPage: A4Page = {
      id: nextId("page"),
      pageNumber: newPageNum,
      title: "",
      blocks: [
        {
          id: nextId("block"),
          type: "paragraph",
          content: "",
        },
      ],
    };
    handlePagesChange([...activePages, newPage]);
  };

  const handleBlockKeyDown = (
    e: React.KeyboardEvent<HTMLElement>,
    pageIdx: number,
    block: NotionBlock,
    index: number
  ) => {
    if (paletteOpen) {
      if (["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(e.key)) {
        return;
      }
    }

    if (block.type === "code") {
      if (e.key === "Enter" && (e.shiftKey || e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        addBlockBelow(pageIdx, block.id, "paragraph");
        return;
      }
      if (e.key === "Enter") return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addBlockBelow(
        pageIdx,
        block.id,
        block.type === "bullet" || block.type === "numbered" ? block.type : "paragraph"
      );
      return;
    }

    if (e.key === "Backspace" && block.content === "") {
      e.preventDefault();
      if (block.type !== "paragraph") {
        changeBlockType(pageIdx, block.id, "paragraph");
      } else if (activePages[pageIdx].blocks.length > 1) {
        deleteBlock(pageIdx, block.id);
      }
      return;
    }

    const curBlocks = activePages[pageIdx].blocks;
    if (e.key === "ArrowUp" && index > 0) {
      const prev = curBlocks[index - 1];
      blockRefs.current.get(prev.id)?.focus();
    }
    if (e.key === "ArrowDown" && index < curBlocks.length - 1) {
      const next = curBlocks[index + 1];
      blockRefs.current.get(next.id)?.focus();
    }
  };

  const handleBlockInput = (
    e: React.FormEvent<HTMLElement>,
    pageIdx: number,
    block: NotionBlock
  ) => {
    const target = e.currentTarget;
    const value = "value" in target ? (target as HTMLInputElement).value : target.innerText;
    updateBlockContent(pageIdx, block.id, value);

    if (value.startsWith("/")) {
      setActiveBlockId(block.id);
      setActivePageIndex(pageIdx);
      setSlashSearchQuery(value.slice(1));

      if (editorContainerRef.current) {
        const containerRect = editorContainerRef.current.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const viewportBottom = typeof window !== "undefined" ? window.innerHeight : 800;
        const shouldFlipUp = targetRect.bottom + 320 > viewportBottom && targetRect.top > 340;

        const relTop = shouldFlipUp
          ? targetRect.top - containerRect.top - 326
          : targetRect.bottom - containerRect.top + 6;

        const relLeft = Math.max(
          16,
          Math.min(targetRect.left - containerRect.left, containerRect.width - 340)
        );

        setPalettePos({ top: relTop, left: relLeft });
      }
      setPaletteOpen(true);
    } else if (paletteOpen) {
      setPaletteOpen(false);
    }
  };

  // ── PREVIEW MODE (Zoomed Out Spread) ──
  if (isZoomedOutPreview) {
    const firstPage = activePages[0] || {
      id: "preview-1",
      pageNumber: 1,
      title: initialTitle,
      blocks: initialBlocks,
    };

    const previewWords = firstPage.blocks.reduce(
      (sum, b) => sum + (b.content ? b.content.trim().split(/\s+/).filter(Boolean).length : 0),
      0
    );
    const estRead = Math.max(1, Math.ceil(previewWords / 200));

    return (
      <div
        className={className}
        onClick={onClick}
        style={{
          width: "100%",
          position: "relative",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <A4PunchedSheet
          punchEdge={punchEdge}
          isHovered={isHovered}
          style={{
            minHeight: "880px",
            height: "100%",
            boxShadow:
              activePages.length > 1
                ? isHovered
                  ? "0 0 0 2.5px #2e66f6, 0 4px 0 -1px #f4f4f5, 0 5px 0 1px rgba(0,0,0,0.12), 0 9px 0 -1px #e4e4e7, 0 10px 0 1px rgba(0,0,0,0.14), 0 20px 48px rgba(46, 102, 246, 0.25)"
                  : "0 4px 0 -1px #f4f4f5, 0 5px 0 1px rgba(0,0,0,0.08), 0 9px 0 -1px #e4e4e7, 0 10px 0 1px rgba(0,0,0,0.09), 0 16px 36px rgba(0, 0, 0, 0.12)"
                : undefined,
          }}
        >
          {/* Header Bar matching Figma */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
              paddingBottom: "12px",
              borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
              fontSize: "0.75rem",
              color: "#71717a",
            }}
          >
            <div>
              {previewWords} words • {estRead} min read
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  textTransform: "uppercase",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "#18181b",
                }}
              >
                {folderCategory}
              </span>
              <span>•</span>
              <span>Live Document</span>
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: "20px" }}>
            <h2
              style={{
                fontSize: "1.9rem",
                fontWeight: 800,
                color: "#18181b",
                margin: 0,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              {firstPage.title || "Untitled Document"}
            </h2>
          </div>

          {/* Preview Blocks */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", opacity: 0.9 }}>
            {firstPage.blocks.slice(0, 8).map((block) => (
              <div
                key={block.id}
                style={{
                  fontSize:
                    block.type === "h1"
                      ? "1.4rem"
                      : block.type === "h2"
                      ? "1.2rem"
                      : "0.95rem",
                  fontWeight: block.type.startsWith("h") ? 700 : 400,
                  color: block.content ? "#27272a" : "#a1a1aa",
                  lineHeight: 1.6,
                }}
              >
                {block.content || "Type '/' for commands..."}
              </div>
            ))}
          </div>

          {/* Stack indicator pill when multiple pages exist */}
          {activePages.length > 1 && (
            <div
              style={{
                position: "absolute",
                bottom: "20px",
                right: punchEdge === "right" ? "calc(4.25rem + 16px)" : "24px",
                backgroundColor: "#18181b",
                color: "#ffffff",
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
              }}
            >
              <span>📄</span>
              <span>{activePages.length} Pages</span>
            </div>
          )}
        </A4PunchedSheet>
      </div>
    );
  }

  // ── ACTIVE EDITOR MODE (Zoomed In Center View) ──
  const totalWordsAll = activePages.reduce(
    (sum, p) =>
      sum +
      p.blocks.reduce(
        (bSum, b) => bSum + (b.content ? b.content.trim().split(/\s+/).filter(Boolean).length : 0),
        0
      ),
    0
  );
  const totalEstRead = Math.max(1, Math.ceil(totalWordsAll / 200));

  return (
    <div
      ref={editorContainerRef}
      className={className}
      style={{
        width: "100%",
        maxWidth: "840px",
        margin: "0 auto",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: "40px",
      }}
    >
      {activePages.map((page, pageIdx) => {
        return (
          <A4PunchedSheet
            key={page.id}
            punchEdge={punchEdge}
            style={{
              minHeight: "1160px",
              boxShadow: "0 18px 50px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
          >
            {/* Document Header Metadata Bar matching Figma */}
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
              <div>
                {totalWordsAll} words • {totalEstRead} min read
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    textTransform: "uppercase",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "#18181b",
                  }}
                >
                  {folderCategory}
                </span>
                <span>•</span>
                <span>Live Document</span>
              </div>
            </div>

            {/* Document Title (Editable on Page 1 or individual page title) */}
            <div style={{ marginBottom: "28px" }}>
              <input
                type="text"
                value={page.title}
                onChange={(e) => updatePageTitle(pageIdx, e.target.value)}
                placeholder={pageIdx === 0 ? "Untitled Document..." : `Section / Page ${page.pageNumber}`}
                style={{
                  width: "100%",
                  backgroundColor: "transparent",
                  border: "none",
                  outline: "none",
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

            {/* Blocks Flow for this page */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {page.blocks.map((block, index) => (
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
                        handleBlockInput(e, pageIdx, block);
                      }}
                      onKeyDown={(e) => handleBlockKeyDown(e, pageIdx, block, index)}
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
                      onChange={(e) => handleBlockInput(e, pageIdx, block)}
                      onKeyDown={(e) => handleBlockKeyDown(e, pageIdx, block, index)}
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
                      onChange={(e) => handleBlockInput(e, pageIdx, block)}
                      onKeyDown={(e) => handleBlockKeyDown(e, pageIdx, block, index)}
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
                      onChange={(e) => handleBlockInput(e, pageIdx, block)}
                      onKeyDown={(e) => handleBlockKeyDown(e, pageIdx, block, index)}
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

                  {/* Bullet Block */}
                  {block.type === "bullet" && (
                    <div style={{ display: "flex", alignItems: "flex-start", width: "100%", gap: "10px" }}>
                      <span style={{ fontSize: "1.2rem", lineHeight: 1.6, color: "#71717a" }}>•</span>
                      <textarea
                        ref={(el) => {
                          if (el) blockRefs.current.set(block.id, el);
                          else blockRefs.current.delete(block.id);
                        }}
                        value={block.content}
                        onChange={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                          handleBlockInput(e, pageIdx, block);
                        }}
                        onKeyDown={(e) => handleBlockKeyDown(e, pageIdx, block, index)}
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

                  {/* Numbered Block */}
                  {block.type === "numbered" && (
                    <div style={{ display: "flex", alignItems: "flex-start", width: "100%", gap: "8px" }}>
                      <span style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "#71717a", minWidth: "18px" }}>
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
                          handleBlockInput(e, pageIdx, block);
                        }}
                        onKeyDown={(e) => handleBlockKeyDown(e, pageIdx, block, index)}
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
                    <div style={{ borderLeft: "3px solid #18181b", paddingLeft: "16px", margin: "6px 0", width: "100%" }}>
                      <textarea
                        ref={(el) => {
                          if (el) blockRefs.current.set(block.id, el);
                          else blockRefs.current.delete(block.id);
                        }}
                        value={block.content}
                        onChange={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                          handleBlockInput(e, pageIdx, block);
                        }}
                        onKeyDown={(e) => handleBlockKeyDown(e, pageIdx, block, index)}
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
                          handleBlockInput(e, pageIdx, block);
                        }}
                        onKeyDown={(e) => handleBlockKeyDown(e, pageIdx, block, index)}
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
                      onClick={() => addBlockBelow(pageIdx, block.id, "paragraph")}
                      style={{ width: "100%", padding: "16px 0", cursor: "pointer" }}
                    >
                      <hr style={{ border: "none", borderTop: "1px solid rgba(0, 0, 0, 0.12)", margin: 0 }} />
                    </div>
                  )}

                  {/* Image Block */}
                  {block.type === "image" && (
                    <ImageBlock
                      content={block.content}
                      caption={block.caption}
                      onChangeContent={(url) => updateBlockContent(pageIdx, block.id, url)}
                      onChangeCaption={(caption) => updateBlockCaption(pageIdx, block.id, caption)}
                      onDelete={() => deleteBlock(pageIdx, block.id)}
                    />
                  )}

                  {/* Video Block */}
                  {block.type === "video" && (
                    <VideoBlock
                      content={block.content}
                      caption={block.caption}
                      onChangeContent={(url) => updateBlockContent(pageIdx, block.id, url)}
                      onChangeCaption={(caption) => updateBlockCaption(pageIdx, block.id, caption)}
                      onDelete={() => deleteBlock(pageIdx, block.id)}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Blank Click Zone within sheet */}
            <div
              onClick={() => {
                const last = page.blocks[page.blocks.length - 1];
                if (!last || last.content.trim() !== "") {
                  addBlockBelow(pageIdx, last?.id || "b0", "paragraph");
                } else {
                  blockRefs.current.get(last.id)?.focus();
                }
              }}
              style={{ minHeight: "180px", cursor: "text", marginTop: "24px" }}
            />

            {/* Page Footer inside Sheet */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "16px",
                borderTop: "1px dashed rgba(0, 0, 0, 0.1)",
                fontSize: "0.8rem",
                color: "#a1a1aa",
                marginTop: "auto",
              }}
            >
              <span>Page {page.pageNumber}</span>
              <span>{folderCategory}</span>
            </div>
          </A4PunchedSheet>
        );
      })}

      {/* Floating / Sticky "+ Add Page" Bottom Action Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: "80px",
        }}
      >
        <button
          type="button"
          onClick={handleAddNewPage}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "#ffffff",
            color: "#18181b",
            border: "1px solid rgba(0, 0, 0, 0.12)",
            borderRadius: "32px",
            padding: "12px 28px",
            fontSize: "0.92rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.08)",
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 10px 28px rgba(0, 0, 0, 0.14)";
            e.currentTarget.style.borderColor = "#2e66f6";
            e.currentTarget.style.color = "#2e66f6";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.08)";
            e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.12)";
            e.currentTarget.style.color = "#18181b";
          }}
        >
          <span style={{ fontSize: "1.2rem", fontWeight: 700 }}>+</span>
          <span>Add Next A4 Page</span>
        </button>
      </div>

      {/* Floating Slash Command Palette */}
      <CommandPalette
        isOpen={paletteOpen}
        onSelectCommand={(cmd) => changeBlockType(activePageIndex, activeBlockId, cmd)}
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
