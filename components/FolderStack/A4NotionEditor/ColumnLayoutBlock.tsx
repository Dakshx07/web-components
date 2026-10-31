"use client";

import React, { useState } from "react";
import { NotionBlock, ColumnData, BlockType } from "./types";
import { ImageBlock } from "./ImageBlock";
import { VideoBlock } from "./VideoBlock";

interface ColumnLayoutBlockProps {
  columns: ColumnData[];
  layoutCount: 2 | 3;
  themeColor?: string;
  activeBlockId?: string;
  onFocusBlock?: (blockId: string) => void;
  onInputBlock?: (e: React.FormEvent<HTMLElement>, colId: string, block: NotionBlock) => void;
  onUpdateColumnBlock: (colId: string, blockId: string, content: string) => void;
  onUpdateColumnBlockCaption?: (colId: string, blockId: string, caption: string) => void;
  onUpdateColumnBlockWidth?: (colId: string, blockId: string, width: number) => void;
  onUpdateColumnBlockAlignment?: (colId: string, blockId: string, alignment: "left" | "center" | "right") => void;
  onAddBlockInColumn: (colId: string, afterBlockId: string, type?: BlockType) => void;
  onDeleteBlockInColumn: (colId: string, blockId: string) => void;
  onConvertLayout: (newCount: 2 | 3) => void;
  onDeleteLayout: () => void;
}

export const ColumnLayoutBlock: React.FC<ColumnLayoutBlockProps> = ({
  columns,
  layoutCount,
  themeColor = "#194bfd",
  activeBlockId,
  onFocusBlock,
  onInputBlock,
  onUpdateColumnBlock,
  onUpdateColumnBlockCaption,
  onUpdateColumnBlockWidth,
  onUpdateColumnBlockAlignment,
  onAddBlockInColumn,
  onDeleteBlockInColumn,
  onConvertLayout,
  onDeleteLayout,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
    colId: string,
    block: NotionBlock
  ) => {
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
    if (onInputBlock) {
      onInputBlock(e, colId, block);
    } else {
      onUpdateColumnBlock(colId, block.id, e.target.value);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        width: "100%",
        margin: "8px 0",
        borderRadius: "6px",
      }}
    >
      {/* ── Columns Grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            layoutCount === 2 ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))",
          gap: "16px",
          width: "100%",
          alignItems: "start",
        }}
      >
        {columns.slice(0, layoutCount).map((col, colIdx) => (
          <div
            key={col.id || `col-${colIdx}`}
            onClick={(e) => {
              // If clicked on empty space of column, focus last block or add paragraph
              if (e.target === e.currentTarget) {
                const last = col.blocks[col.blocks.length - 1];
                if (last && last.type === "paragraph" && !last.content) {
                  onFocusBlock && onFocusBlock(last.id);
                  const el = document.querySelector(`[data-block-id="${last.id}"]`) as HTMLElement;
                  el?.focus();
                } else if (last) {
                  onAddBlockInColumn(col.id, last.id, "paragraph");
                }
              }
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              minWidth: 0,
              width: "100%",
              minHeight: "44px",
              cursor: "text",
            }}
          >
            {col.blocks.map((block, bIdx) => (
              <div key={block.id} style={{ width: "100%", position: "relative" }}>
                {/* ── Paragraph ── */}
                {block.type === "paragraph" && (
                  <textarea
                    data-block-id={block.id}
                    value={block.content}
                    onFocus={() => onFocusBlock && onFocusBlock(block.id)}
                    onChange={(e) => handleInputChange(e, col.id, block)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onAddBlockInColumn(col.id, block.id, "paragraph");
                      } else if (
                        e.key === "Backspace" &&
                        block.content === "" &&
                        col.blocks.length > 1
                      ) {
                        e.preventDefault();
                        onDeleteBlockInColumn(col.id, block.id);
                      }
                    }}
                    placeholder={activeBlockId === block.id ? "Type '/' for commands..." : ""}
                    rows={1}
                    style={{
                      width: "100%",
                      backgroundColor: "transparent",
                      border: "none",
                      outline: "none",
                      resize: "none",
                      overflow: "hidden",
                      fontSize: "0.95rem",
                      lineHeight: 1.65,
                      color: "#27272a",
                      padding: 0,
                      margin: 0,
                      fontFamily: "inherit",
                      minHeight: "28px",
                    }}
                  />
                )}

                {/* ── Heading 1 ── */}
                {block.type === "h1" && (
                  <input
                    data-block-id={block.id}
                    type="text"
                    value={block.content}
                    onFocus={() => onFocusBlock && onFocusBlock(block.id)}
                    onChange={(e) => handleInputChange(e, col.id, block)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onAddBlockInColumn(col.id, block.id, "paragraph");
                      } else if (
                        e.key === "Backspace" &&
                        block.content === "" &&
                        col.blocks.length > 1
                      ) {
                        e.preventDefault();
                        onDeleteBlockInColumn(col.id, block.id);
                      }
                    }}
                    placeholder="Heading 1"
                    style={{
                      width: "100%",
                      backgroundColor: "transparent",
                      border: "none",
                      outline: "none",
                      fontSize: "1.35rem",
                      fontWeight: 700,
                      color: "#18181b",
                      padding: 0,
                      fontFamily: "inherit",
                    }}
                  />
                )}

                {/* ── Heading 2 ── */}
                {block.type === "h2" && (
                  <input
                    data-block-id={block.id}
                    type="text"
                    value={block.content}
                    onFocus={() => onFocusBlock && onFocusBlock(block.id)}
                    onChange={(e) => handleInputChange(e, col.id, block)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onAddBlockInColumn(col.id, block.id, "paragraph");
                      } else if (
                        e.key === "Backspace" &&
                        block.content === "" &&
                        col.blocks.length > 1
                      ) {
                        e.preventDefault();
                        onDeleteBlockInColumn(col.id, block.id);
                      }
                    }}
                    placeholder="Heading 2"
                    style={{
                      width: "100%",
                      backgroundColor: "transparent",
                      border: "none",
                      outline: "none",
                      fontSize: "1.15rem",
                      fontWeight: 600,
                      color: "#18181b",
                      padding: 0,
                      fontFamily: "inherit",
                    }}
                  />
                )}

                {/* ── Heading 3 ── */}
                {block.type === "h3" && (
                  <input
                    data-block-id={block.id}
                    type="text"
                    value={block.content}
                    onFocus={() => onFocusBlock && onFocusBlock(block.id)}
                    onChange={(e) => handleInputChange(e, col.id, block)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onAddBlockInColumn(col.id, block.id, "paragraph");
                      } else if (
                        e.key === "Backspace" &&
                        block.content === "" &&
                        col.blocks.length > 1
                      ) {
                        e.preventDefault();
                        onDeleteBlockInColumn(col.id, block.id);
                      }
                    }}
                    placeholder="Heading 3"
                    style={{
                      width: "100%",
                      backgroundColor: "transparent",
                      border: "none",
                      outline: "none",
                      fontSize: "1.02rem",
                      fontWeight: 600,
                      color: "#27272a",
                      padding: 0,
                      fontFamily: "inherit",
                    }}
                  />
                )}

                {/* ── To-Do ── */}
                {block.type === "todo" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      width: "100%",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(block.checked)}
                      onChange={(e) =>
                        onUpdateColumnBlock(col.id, block.id, e.target.checked ? "checked" : "")
                      }
                      style={{ marginTop: "4px", accentColor: themeColor, cursor: "pointer" }}
                    />
                    <textarea
                      data-block-id={block.id}
                      value={block.content}
                      onFocus={() => onFocusBlock && onFocusBlock(block.id)}
                      onChange={(e) => handleInputChange(e, col.id, block)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          onAddBlockInColumn(col.id, block.id, "todo");
                        } else if (
                          e.key === "Backspace" &&
                          block.content === "" &&
                          col.blocks.length > 1
                        ) {
                          e.preventDefault();
                          onDeleteBlockInColumn(col.id, block.id);
                        }
                      }}
                      placeholder="To-do item..."
                      rows={1}
                      style={{
                        width: "100%",
                        backgroundColor: "transparent",
                        border: "none",
                        outline: "none",
                        resize: "none",
                        overflow: "hidden",
                        fontSize: "0.95rem",
                        color: block.checked ? "#a1a1aa" : "#27272a",
                        textDecoration: block.checked ? "line-through" : "none",
                        padding: 0,
                        fontFamily: "inherit",
                        minHeight: "26px",
                      }}
                    />
                  </div>
                )}

                {/* ── Bullet ── */}
                {block.type === "bullet" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      width: "100%",
                    }}
                  >
                    <span style={{ fontSize: "1.1rem", lineHeight: 1.5, color: "#71717a" }}>
                      •
                    </span>
                    <textarea
                      data-block-id={block.id}
                      value={block.content}
                      onFocus={() => onFocusBlock && onFocusBlock(block.id)}
                      onChange={(e) => handleInputChange(e, col.id, block)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          onAddBlockInColumn(col.id, block.id, "bullet");
                        } else if (
                          e.key === "Backspace" &&
                          block.content === "" &&
                          col.blocks.length > 1
                        ) {
                          e.preventDefault();
                          onDeleteBlockInColumn(col.id, block.id);
                        }
                      }}
                      placeholder="List item..."
                      rows={1}
                      style={{
                        width: "100%",
                        backgroundColor: "transparent",
                        border: "none",
                        outline: "none",
                        resize: "none",
                        overflow: "hidden",
                        fontSize: "0.95rem",
                        lineHeight: 1.6,
                        color: "#27272a",
                        padding: 0,
                        fontFamily: "inherit",
                        minHeight: "26px",
                      }}
                    />
                  </div>
                )}

                {/* ── Numbered List ── */}
                {block.type === "numbered" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      width: "100%",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.92rem",
                        lineHeight: 1.6,
                        color: "#71717a",
                        minWidth: "16px",
                      }}
                    >
                      {bIdx + 1}.
                    </span>
                    <textarea
                      data-block-id={block.id}
                      value={block.content}
                      onFocus={() => onFocusBlock && onFocusBlock(block.id)}
                      onChange={(e) => handleInputChange(e, col.id, block)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          onAddBlockInColumn(col.id, block.id, "numbered");
                        } else if (
                          e.key === "Backspace" &&
                          block.content === "" &&
                          col.blocks.length > 1
                        ) {
                          e.preventDefault();
                          onDeleteBlockInColumn(col.id, block.id);
                        }
                      }}
                      placeholder="List item..."
                      rows={1}
                      style={{
                        width: "100%",
                        backgroundColor: "transparent",
                        border: "none",
                        outline: "none",
                        resize: "none",
                        overflow: "hidden",
                        fontSize: "0.95rem",
                        lineHeight: 1.6,
                        color: "#27272a",
                        padding: 0,
                        fontFamily: "inherit",
                        minHeight: "26px",
                      }}
                    />
                  </div>
                )}

                {/* ── Quote ── */}
                {block.type === "quote" && (
                  <div
                    style={{
                      borderLeft: "3px solid #d4d4d8",
                      paddingLeft: "12px",
                      margin: "4px 0",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <textarea
                      data-block-id={block.id}
                      value={block.content}
                      onFocus={() => onFocusBlock && onFocusBlock(block.id)}
                      onChange={(e) => handleInputChange(e, col.id, block)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          onAddBlockInColumn(col.id, block.id, "paragraph");
                        } else if (
                          e.key === "Backspace" &&
                          block.content === "" &&
                          col.blocks.length > 1
                        ) {
                          e.preventDefault();
                          onDeleteBlockInColumn(col.id, block.id);
                        }
                      }}
                      placeholder="Quote..."
                      rows={1}
                      style={{
                        width: "100%",
                        backgroundColor: "transparent",
                        border: "none",
                        outline: "none",
                        resize: "none",
                        overflow: "hidden",
                        fontSize: "0.95rem",
                        fontStyle: "italic",
                        color: "#52525b",
                        padding: 0,
                        fontFamily: "inherit",
                        minHeight: "26px",
                      }}
                    />
                  </div>
                )}

                {/* ── Callout ── */}
                {block.type === "callout" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      padding: "10px 12px",
                      backgroundColor: "rgba(0, 0, 0, 0.03)",
                      borderLeft: `3px solid ${themeColor}`,
                      borderRadius: "6px",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <span style={{ fontSize: "1rem", lineHeight: 1 }}>
                      {block.calloutIcon || "💡"}
                    </span>
                    <textarea
                      data-block-id={block.id}
                      value={block.content}
                      onFocus={() => onFocusBlock && onFocusBlock(block.id)}
                      onChange={(e) => handleInputChange(e, col.id, block)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          onAddBlockInColumn(col.id, block.id, "paragraph");
                        } else if (
                          e.key === "Backspace" &&
                          block.content === "" &&
                          col.blocks.length > 1
                        ) {
                          e.preventDefault();
                          onDeleteBlockInColumn(col.id, block.id);
                        }
                      }}
                      placeholder="Callout text..."
                      rows={1}
                      style={{
                        width: "100%",
                        backgroundColor: "transparent",
                        border: "none",
                        outline: "none",
                        resize: "none",
                        overflow: "hidden",
                        fontSize: "0.9rem",
                        lineHeight: 1.5,
                        color: "#27272a",
                        padding: 0,
                        fontFamily: "inherit",
                        minHeight: "26px",
                      }}
                    />
                  </div>
                )}

                {/* ── Code ── */}
                {block.type === "code" && (
                  <div
                    style={{
                      backgroundColor: "#1e1e24",
                      borderRadius: "6px",
                      padding: "10px 12px",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <textarea
                      data-block-id={block.id}
                      value={block.content}
                      onFocus={() => onFocusBlock && onFocusBlock(block.id)}
                      onChange={(e) => handleInputChange(e, col.id, block)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.shiftKey || e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          onAddBlockInColumn(col.id, block.id, "paragraph");
                        } else if (
                          e.key === "Backspace" &&
                          block.content === "" &&
                          col.blocks.length > 1
                        ) {
                          e.preventDefault();
                          onDeleteBlockInColumn(col.id, block.id);
                        }
                      }}
                      placeholder="// Code..."
                      rows={2}
                      style={{
                        width: "100%",
                        backgroundColor: "transparent",
                        border: "none",
                        outline: "none",
                        resize: "none",
                        overflow: "hidden",
                        fontSize: "0.85rem",
                        fontFamily: "monospace",
                        color: "#f4f4f5",
                        padding: 0,
                      }}
                    />
                  </div>
                )}

                {/* ── Divider ── */}
                {block.type === "divider" && (
                  <div style={{ width: "100%", padding: "10px 0" }}>
                    <hr
                      style={{
                        border: "none",
                        borderTop: "1px solid rgba(0, 0, 0, 0.12)",
                        margin: 0,
                      }}
                    />
                  </div>
                )}

                {/* ── Image Block inside column ── */}
                {block.type === "image" && (
                  <ImageBlock
                    content={block.content}
                    caption={block.caption}
                    widthPercentage={block.widthPercentage || 100}
                    alignment={block.alignment || "center"}
                    onChangeContent={(url) => onUpdateColumnBlock(col.id, block.id, url)}
                    onChangeCaption={(cap) =>
                      onUpdateColumnBlockCaption &&
                      onUpdateColumnBlockCaption(col.id, block.id, cap)
                    }
                    onChangeWidth={(w) =>
                      onUpdateColumnBlockWidth &&
                      onUpdateColumnBlockWidth(col.id, block.id, w)
                    }
                    onChangeAlignment={(a) =>
                      onUpdateColumnBlockAlignment &&
                      onUpdateColumnBlockAlignment(col.id, block.id, a)
                    }
                    onDelete={() => onDeleteBlockInColumn(col.id, block.id)}
                  />
                )}

                {/* ── Video Block inside column ── */}
                {block.type === "video" && (
                  <VideoBlock
                    content={block.content}
                    caption={block.caption}
                    widthPercentage={block.widthPercentage || 100}
                    alignment={block.alignment || "center"}
                    onChangeContent={(url) => onUpdateColumnBlock(col.id, block.id, url)}
                    onChangeCaption={(cap) =>
                      onUpdateColumnBlockCaption &&
                      onUpdateColumnBlockCaption(col.id, block.id, cap)
                    }
                    onChangeWidth={(w) =>
                      onUpdateColumnBlockWidth &&
                      onUpdateColumnBlockWidth(col.id, block.id, w)
                    }
                    onChangeAlignment={(a) =>
                      onUpdateColumnBlockAlignment &&
                      onUpdateColumnBlockAlignment(col.id, block.id, a)
                    }
                    onDelete={() => onDeleteBlockInColumn(col.id, block.id)}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Floating column controls pill on hover (Hidden when not hovering) */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "4px",
          marginTop: "4px",
          opacity: isHovered ? 1 : 0,
          pointerEvents: isHovered ? "auto" : "none",
          transition: "opacity 0.15s ease",
        }}
      >
        <button
          type="button"
          onClick={() => onConvertLayout(layoutCount === 2 ? 3 : 2)}
          style={{
            background: "rgba(0, 0, 0, 0.04)",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: "4px",
            fontSize: "0.68rem",
            color: "#71717a",
            padding: "2px 6px",
            cursor: "pointer",
          }}
        >
          {layoutCount === 2 ? "Switch to 3-col" : "Switch to 2-col"}
        </button>
        <button
          type="button"
          onClick={onDeleteLayout}
          style={{
            background: "rgba(0, 0, 0, 0.04)",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: "4px",
            fontSize: "0.68rem",
            color: "#ef4444",
            padding: "2px 6px",
            cursor: "pointer",
          }}
        >
          Remove columns
        </button>
      </div>
    </div>
  );
};
