"use client";

import React, { useState, useRef, useCallback } from "react";
import { BlockType, NotionBlock, CommandPalettePosition, A4Page, ColumnData } from "./types";
import { CommandPalette, CommandSelectOptions } from "./CommandPalette";
import { A4PunchedSheet } from "./A4PunchedSheet";
import { ImageBlock } from "./ImageBlock";
import { VideoBlock } from "./VideoBlock";
import { ColumnLayoutBlock } from "./ColumnLayoutBlock";
import { compressImageDataUrl } from "./documentStore";

export interface A4NotionEditorProps {
  initialTitle?: string;
  initialBlocks?: NotionBlock[];
  folderCategory?: string;
  themeColor?: string;
  onSave?: (markdown: string, title: string) => void;
  className?: string;
  punchEdge?: "left" | "right";
  isZoomedOutPreview?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  pages?: A4Page[];
  onUpdatePages?: (pages: A4Page[]) => void;
}

function generateUniqueId(prefix: string = "blk"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_BLOCKS: NotionBlock[] = [
  {
    id: generateUniqueId("blk"),
    type: "paragraph",
    content: "",
  },
];

// ── Google Docs Height-Budget Engine for A4 Continuous Flow ──
const A4_PAGE_1_BUDGET = 960; // usable content height on Page 1 (with title)
const A4_SUBSEQUENT_PAGE_BUDGET = 1020; // usable content height on Page 2+

function getBlockEstimatedHeight(block: NotionBlock): number {
  switch (block.type) {
    case "h1":
      return 58;
    case "h2":
      return 48;
    case "h3":
      return 40;
    case "divider":
      return 28;
    case "code":
      return 130;
    case "callout":
      return 68;
    case "quote":
      return 54;
    case "image":
      return block.content ? Math.round(260 * ((block.widthPercentage || 100) / 100)) + 36 : 140;
    case "video":
      return block.content ? Math.round(280 * ((block.widthPercentage || 100) / 100)) + 40 : 160;
    case "columns":
      return 280;
    case "bullet":
    case "numbered":
    case "todo":
    case "paragraph":
    default: {
      const lineBreaks = (block.content || "").split("\n").length;
      const wrapLines = Math.max(1, Math.ceil((block.content || "").length / 68));
      const totalLines = Math.max(lineBreaks, wrapLines);
      return 38 + (totalLines - 1) * 28;
    }
  }
}

export const A4NotionEditor: React.FC<A4NotionEditorProps> = ({
  initialTitle = "Project Documentation",
  initialBlocks = DEFAULT_BLOCKS,
  folderCategory: _folderCategory = "ARCHIVE",
  themeColor = "#194bfd",
  className,
  punchEdge = "left",
  isZoomedOutPreview = false,
  isHovered = false,
  onClick,
  pages,
  onUpdatePages,
}) => {
  const isMultiPageControlled = Boolean(pages && onUpdatePages);

  const [localPages, setLocalPages] = useState<A4Page[]>(() => {
    if (pages && pages.length > 0) return pages;
    return [
      {
        id: generateUniqueId("page"),
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

  const [activeBlockId, setActiveBlockId] = useState<string>("");
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [palettePos, setPalettePos] = useState<CommandPalettePosition | null>(null);
  const [slashSearchQuery, setSlashSearchQuery] = useState("");
  const [blockOptionsMenuId, setBlockOptionsMenuId] = useState<string | null>(null);

  // Column slash command tracking
  const [activeColumnInfo, setActiveColumnInfo] = useState<{
    pageIdx: number;
    parentBlockId: string;
    colId: string;
    blockId: string;
  } | null>(null);

  // Drag-and-drop auto-layouting state
  const [draggedBlockInfo, setDraggedBlockInfo] = useState<{
    pageIdx: number;
    blockId: string;
    parentBlockId?: string;
    colId?: string;
  } | null>(null);

  const [dropTarget, setDropTarget] = useState<{
    pageIdx: number;
    blockId: string;
    position: "top" | "bottom" | "left" | "right";
    parentBlockId?: string;
    colId?: string;
    indicatorRect?: { left: number; right: number; width: number };
  } | null>(null);

  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
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

  const updateBlockWidth = (pageIdx: number, blockId: string, widthPercentage: number) => {
    const updated = activePages.map((p, idx) => {
      if (idx !== pageIdx) return p;
      return {
        ...p,
        blocks: p.blocks.map((b) => (b.id === blockId ? { ...b, widthPercentage } : b)),
      };
    });
    handlePagesChange(updated);
  };

  const updateBlockAlignment = (pageIdx: number, blockId: string, alignment: "left" | "center" | "right") => {
    const updated = activePages.map((p, idx) => {
      if (idx !== pageIdx) return p;
      return {
        ...p,
        blocks: p.blocks.map((b) => (b.id === blockId ? { ...b, alignment } : b)),
      };
    });
    handlePagesChange(updated);
  };

  const toggleTodoCheck = (pageIdx: number, blockId: string) => {
    const updated = activePages.map((p, idx) => {
      if (idx !== pageIdx) return p;
      return {
        ...p,
        blocks: p.blocks.map((b) => (b.id === blockId ? { ...b, checked: !b.checked } : b)),
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

  // Convert block inside a column layout
  const changeColumnBlockType = (
    info: { pageIdx: number; parentBlockId: string; colId: string; blockId: string },
    command: BlockType
  ) => {
    const { pageIdx, parentBlockId, colId, blockId } = info;
    const updated = activePages.map((p, pIdx) => {
      if (pIdx !== pageIdx) return p;
      return {
        ...p,
        blocks: p.blocks.map((b) => {
          if (b.id !== parentBlockId || !b.columns) return b;
          return {
            ...b,
            columns: b.columns.map((c) => {
              if (c.id !== colId) return c;
              return {
                ...c,
                blocks: c.blocks.map((cb) => {
                  if (cb.id !== blockId) return cb;
                  const cleanContent = cb.content.replace(/^\/.*$/, "").trim();
                  return {
                    ...cb,
                    type: command,
                    content: cleanContent,
                    widthPercentage: 100,
                    alignment: "center" as const,
                  };
                }),
              };
            }),
          };
        }),
      };
    });
    handlePagesChange(updated);
    setPaletteOpen(false);
    setActiveColumnInfo(null);
    setTimeout(() => {
      const el = document.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement;
      el?.focus();
    }, 40);
  };

  // Convert or change block type
  const changeBlockType = (pageIdx: number, blockId: string, options: CommandSelectOptions) => {
    if (activeColumnInfo) {
      changeColumnBlockType(activeColumnInfo, options.command);
      return;
    }

    const { command, defaultColumns, initialType, columnLayoutPreset } = options;
    const maxBudget = pageIdx === 0 ? A4_PAGE_1_BUDGET : A4_SUBSEQUENT_PAGE_BUDGET;
    const isAtomicMedia = command === "image" || command === "video" || command === "columns";
    const mediaHeight = command === "columns" ? 280 : 300;

    const currentPage = activePages[pageIdx];
    const bIndex = currentPage ? currentPage.blocks.findIndex((b) => b.id === blockId) : -1;
    const heightBefore = currentPage && bIndex > 0
      ? currentPage.blocks.slice(0, bIndex).reduce((sum, b) => sum + getBlockEstimatedHeight(b), 0)
      : 0;

    // Google Docs atomic page break: if atomic block cannot fit in remaining page space:
    if (isAtomicMedia && bIndex > 0 && heightBefore + mediaHeight > maxBudget) {
      let newAtomicBlock: NotionBlock;
      if (command === "columns") {
        const count = defaultColumns || 2;
        const cols: ColumnData[] = Array.from({ length: count }, (_, colIdx) => {
          let colType: BlockType = "paragraph";
          if (columnLayoutPreset === "sidebyside") colType = colIdx === 0 ? "image" : "paragraph";
          else if (columnLayoutPreset === "3images") colType = "image";
          else if (columnLayoutPreset === "3text") colType = "paragraph";
          else if (initialType) colType = initialType;

          return {
            id: generateUniqueId("col"),
            blocks: [
              {
                id: generateUniqueId("blk"),
                type: colType,
                content: "",
                widthPercentage: 100,
                alignment: "center" as const,
              },
            ],
          };
        });
        newAtomicBlock = {
          id: blockId,
          type: "columns",
          layoutColumns: count,
          columns: cols,
          content: "",
        };
      } else {
        newAtomicBlock = {
          id: blockId,
          type: command,
          content: "",
          caption: "",
          widthPercentage: 100,
          alignment: "center" as const,
        };
      }

      const nextPageIndex = pageIdx + 1;
      let updated: A4Page[];
      if (nextPageIndex < activePages.length) {
        updated = activePages.map((p, idx) => {
          if (idx === pageIdx) {
            return { ...p, blocks: p.blocks.filter((b) => b.id !== blockId) };
          }
          if (idx === nextPageIndex) {
            return { ...p, blocks: [newAtomicBlock, ...p.blocks] };
          }
          return p;
        });
      } else {
        const newPage: A4Page = {
          id: generateUniqueId("page"),
          pageNumber: activePages.length + 1,
          title: "",
          blocks: [newAtomicBlock],
        };
        updated = [
          ...activePages.map((p, idx) =>
            idx === pageIdx ? { ...p, blocks: p.blocks.filter((b) => b.id !== blockId) } : p
          ),
          newPage,
        ];
      }

      handlePagesChange(updated);
      setPaletteOpen(false);
      setSlashSearchQuery("");
      setActiveBlockId(blockId);
      setActivePageIndex(nextPageIndex);
      setTimeout(() => blockRefs.current.get(blockId)?.focus(), 40);
      return;
    }

    const updated = activePages.map((p, idx) => {
      if (idx !== pageIdx) return p;

      if (command === "divider") {
        const divNextId = generateUniqueId("blk");
        const bIdx = p.blocks.findIndex((b) => b.id === blockId);
        if (bIdx === -1) return p;
        const next = [...p.blocks];
        next[bIdx] = { ...next[bIdx], type: "divider", content: "" };
        if (bIdx === next.length - 1 || next[bIdx + 1].type === "divider") {
          next.splice(bIdx + 1, 0, { id: divNextId, type: "paragraph", content: "" });
        }
        setTimeout(() => blockRefs.current.get(divNextId)?.focus(), 30);
        return { ...p, blocks: next };
      }

      if (command === "columns") {
        const count = defaultColumns || 2;
        const cols: ColumnData[] = Array.from({ length: count }, (_, colIdx) => {
          let colType: BlockType = "paragraph";
          if (columnLayoutPreset === "sidebyside") {
            colType = colIdx === 0 ? "image" : "paragraph";
          } else if (columnLayoutPreset === "3images") {
            colType = "image";
          } else if (columnLayoutPreset === "3text") {
            colType = "paragraph";
          } else if (initialType) {
            colType = initialType;
          }

          return {
            id: generateUniqueId("col"),
            blocks: [
              {
                id: generateUniqueId("blk"),
                type: colType,
                content: "",
                widthPercentage: 100,
                alignment: "center" as const,
              },
            ],
          };
        });

        return {
          ...p,
          blocks: p.blocks.map((b): NotionBlock =>
            b.id === blockId
              ? {
                  ...b,
                  type: "columns",
                  layoutColumns: count,
                  columns: cols,
                  content: "",
                }
              : b
          ),
        };
      }

      if (command === "image" || command === "video") {
        return {
          ...p,
          blocks: p.blocks.map((b): NotionBlock =>
            b.id === blockId
              ? { ...b, type: command, content: "", caption: "", widthPercentage: 100, alignment: "center" as const }
              : b
          ),
        };
      }

      return {
        ...p,
        blocks: p.blocks.map((b): NotionBlock => {
          if (b.id !== blockId) return b;
          const cleanContent = b.content.replace(/^\/.*$/, "").trim();
          return {
            ...b,
            type: command,
            content: cleanContent,
            checked: command === "todo" ? false : undefined,
            calloutIcon: command === "callout" ? "💡" : undefined,
          };
        }),
      };
    });

    handlePagesChange(updated);
    setPaletteOpen(false);
    setSlashSearchQuery("");
    setTimeout(() => blockRefs.current.get(blockId)?.focus(), 40);
  };

  // Add block below with height-budget continuous A4 pagination (Google Docs model)
  const addBlockBelow = (pageIdx: number, afterId: string, type: BlockType = "paragraph") => {
    const newId = generateUniqueId("blk");
    const newBlock: NotionBlock = { id: newId, type, content: "" };
    const currentPage = activePages[pageIdx];
    if (!currentPage) return;

    const bIndex = currentPage.blocks.findIndex((b) => b.id === afterId);
    const targetIdx = bIndex === -1 ? currentPage.blocks.length - 1 : bIndex;
    const maxBudget = pageIdx === 0 ? A4_PAGE_1_BUDGET : A4_SUBSEQUENT_PAGE_BUDGET;

    // Calculate cumulative height up to and including the current block
    const heightBefore = currentPage.blocks
      .slice(0, targetIdx + 1)
      .reduce((sum, b) => sum + getBlockEstimatedHeight(b), 0);

    const isAtBottom = targetIdx >= currentPage.blocks.length - 1;

    // If at the bottom and adding a new line exceeds the usable page budget:
    if (isAtBottom && heightBefore + 38 > maxBudget) {
      const nextPageIndex = pageIdx + 1;
      if (nextPageIndex < activePages.length) {
        // Next sheet already exists: insert at the top of next sheet
        const updated = activePages.map((p, idx) => {
          if (idx !== nextPageIndex) return p;
          return {
            ...p,
            blocks: [newBlock, ...p.blocks],
          };
        });
        handlePagesChange(updated);
        setActiveBlockId(newId);
        setActivePageIndex(nextPageIndex);
        setTimeout(() => blockRefs.current.get(newId)?.focus(), 40);
        return;
      } else {
        // Create the next A4 sheet cleanly
        const newPage: A4Page = {
          id: generateUniqueId("page"),
          pageNumber: activePages.length + 1,
          title: "",
          blocks: [newBlock],
        };
        handlePagesChange([...activePages, newPage]);
        setActiveBlockId(newId);
        setActivePageIndex(nextPageIndex);
        setTimeout(() => blockRefs.current.get(newId)?.focus(), 40);
        return;
      }
    }

    // Normal insertion within the page
    const nextBlocks = [...currentPage.blocks];
    nextBlocks.splice(targetIdx + 1, 0, newBlock);

    // Continuous Google Docs reflow: check if total page height exceeds budget
    let runningHeight = 0;
    const fittingBlocks: NotionBlock[] = [];
    const overflowBlocks: NotionBlock[] = [];

    for (const b of nextBlocks) {
      const h = getBlockEstimatedHeight(b);
      if (fittingBlocks.length > 0 && runningHeight + h > maxBudget) {
        overflowBlocks.push(b);
      } else {
        fittingBlocks.push(b);
        runningHeight += h;
      }
    }

    if (overflowBlocks.length > 0) {
      const nextPageIndex = pageIdx + 1;
      const isNewBlockInOverflow = overflowBlocks.some((b) => b.id === newId);
      if (nextPageIndex < activePages.length) {
        const updated = activePages.map((p, idx) => {
          if (idx === pageIdx) return { ...p, blocks: fittingBlocks };
          if (idx === nextPageIndex) return { ...p, blocks: [...overflowBlocks, ...p.blocks] };
          return p;
        });
        handlePagesChange(updated);
      } else {
        const newPage: A4Page = {
          id: generateUniqueId("page"),
          pageNumber: activePages.length + 1,
          title: "",
          blocks: overflowBlocks,
        };
        const updated = activePages.map((p, idx) => (idx === pageIdx ? { ...p, blocks: fittingBlocks } : p));
        handlePagesChange([...updated, newPage]);
      }
      setActiveBlockId(newId);
      setActivePageIndex(isNewBlockInOverflow ? nextPageIndex : pageIdx);
      setTimeout(() => blockRefs.current.get(newId)?.focus(), 40);
      return;
    } else {
      const updated = activePages.map((p, idx) => (idx === pageIdx ? { ...p, blocks: nextBlocks } : p));
      handlePagesChange(updated);
      setActiveBlockId(newId);
      setActivePageIndex(pageIdx);
      setTimeout(() => blockRefs.current.get(newId)?.focus(), 40);
    }
  };

  const deleteBlock = (pageIdx: number, blockId: string) => {
    const targetPage = activePages[pageIdx];
    if (!targetPage) return;

    if (targetPage.blocks.length <= 1) {
      // If deleting the only block on page 2+, remove the empty sheet and return focus to previous page
      if (pageIdx > 0) {
        const prevPage = activePages[pageIdx - 1];
        const lastBlockOfPrev = prevPage?.blocks[prevPage.blocks.length - 1];
        const updated = activePages
          .filter((_, idx) => idx !== pageIdx)
          .map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
        handlePagesChange(updated);
        if (lastBlockOfPrev) {
          setActiveBlockId(lastBlockOfPrev.id);
          setActivePageIndex(pageIdx - 1);
          setTimeout(() => blockRefs.current.get(lastBlockOfPrev.id)?.focus(), 30);
        }
      }
      return;
    }

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

  const moveBlock = (pageIdx: number, blockId: string, direction: "up" | "down") => {
    const targetPage = activePages[pageIdx];
    if (!targetPage) return;

    const bIdx = targetPage.blocks.findIndex((b) => b.id === blockId);
    if (bIdx === -1) return;
    if (direction === "up" && bIdx === 0) return;
    if (direction === "down" && bIdx === targetPage.blocks.length - 1) return;

    const targetIdx = direction === "up" ? bIdx - 1 : bIdx + 1;
    const nextBlocks = [...targetPage.blocks];
    const [moved] = nextBlocks.splice(bIdx, 1);
    nextBlocks.splice(targetIdx, 0, moved);

    const updated = activePages.map((p, idx) => (idx === pageIdx ? { ...p, blocks: nextBlocks } : p));
    handlePagesChange(updated);
    setBlockOptionsMenuId(null);
  };

  const duplicateBlock = (pageIdx: number, blockId: string) => {
    const targetPage = activePages[pageIdx];
    if (!targetPage) return;
    const bIdx = targetPage.blocks.findIndex((b) => b.id === blockId);
    if (bIdx === -1) return;

    const original = targetPage.blocks[bIdx];
    const clone: NotionBlock = {
      ...original,
      id: generateUniqueId("blk"),
    };

    const nextBlocks = [...targetPage.blocks];
    nextBlocks.splice(bIdx + 1, 0, clone);
    const updated = activePages.map((p, idx) => (idx === pageIdx ? { ...p, blocks: nextBlocks } : p));
    handlePagesChange(updated);
    setBlockOptionsMenuId(null);
  };

  const handleInsertPageAfter = (pageIdx: number) => {
    const newBlockId = generateUniqueId("blk");
    const newPage: A4Page = {
      id: generateUniqueId("page"),
      pageNumber: pageIdx + 2,
      title: "",
      blocks: [
        {
          id: newBlockId,
          type: "paragraph",
          content: "",
        },
      ],
    };

    const nextPages = [...activePages];
    nextPages.splice(pageIdx + 1, 0, newPage);
    const renumbered = nextPages.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    handlePagesChange(renumbered);
    setActiveBlockId(newBlockId);
    setActivePageIndex(pageIdx + 1);
    setTimeout(() => blockRefs.current.get(newBlockId)?.focus(), 50);
  };

  // ── Drag & Drop Auto-Layouting Engine ──
  const handleDragStart = (
    e: React.DragEvent,
    pageIdx: number,
    blockId: string,
    parentBlockId?: string,
    colId?: string
  ) => {
    e.stopPropagation();
    e.dataTransfer.setData("text/plain", blockId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedBlockInfo({ pageIdx, blockId, parentBlockId, colId });
  };

  const handleDragOver = (
    e: React.DragEvent,
    pageIdx: number,
    targetBlockId: string,
    parentBlockId?: string,
    colId?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";

    if (!draggedBlockInfo || draggedBlockInfo.blockId === targetBlockId) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const heightRatio = y / rect.height;

    const page = activePages[pageIdx];
    const targetBlock = parentBlockId
      ? page?.blocks.find((b) => b.id === parentBlockId)?.columns?.find((c) => c.id === colId)?.blocks.find((cb) => cb.id === targetBlockId)
      : page?.blocks.find((b) => b.id === targetBlockId);

    let position: "top" | "bottom" | "left" | "right";
    let indicatorRect: { left: number; right: number; width: number } | undefined;

    if (parentBlockId && colId) {
      position = heightRatio < 0.5 ? "top" : "bottom";
    } else if (
      targetBlock &&
      (targetBlock.type === "image" || targetBlock.type === "video") &&
      targetBlock.widthPercentage &&
      targetBlock.widthPercentage < 100
    ) {
      // Content-aware boundary detection for resized images/videos
      const pct = targetBlock.widthPercentage / 100;
      const align = targetBlock.alignment || "center";
      const contentW = rect.width * pct;
      const contentLeft = align === "left" ? 0 : align === "right" ? rect.width - contentW : (rect.width - contentW) / 2;
      const contentRight = contentLeft + contentW;

      indicatorRect = { left: contentLeft, right: contentRight, width: contentW };

      if (x < contentLeft + 48) {
        position = "left";
      } else if (x > contentRight - 48) {
        position = "right";
      } else {
        position = heightRatio < 0.5 ? "top" : "bottom";
      }
    } else {
      // Full width block
      const edgeThreshold = Math.min(rect.width * 0.25, 96);
      if (x < edgeThreshold) {
        position = "left";
      } else if (x > rect.width - edgeThreshold) {
        position = "right";
      } else {
        position = heightRatio < 0.5 ? "top" : "bottom";
      }
    }

    setDropTarget({
      pageIdx,
      blockId: targetBlockId,
      position,
      parentBlockId,
      colId,
      indicatorRect,
    });
  };

  const handleDragLeave = (e: React.DragEvent, blockId: string) => {
    e.stopPropagation();
    if (dropTarget?.blockId === blockId) {
      setDropTarget(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedBlockInfo(null);
    setDropTarget(null);
  };

  const handleDrop = (
    e: React.DragEvent,
    targetPageIdx: number,
    targetBlockId: string,
    targetParentBlockId?: string,
    targetColId?: string,
    overridePosition?: "top" | "bottom" | "left" | "right"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const position = overridePosition || dropTarget?.position;

    if (!draggedBlockInfo || !position || draggedBlockInfo.blockId === targetBlockId) {
      handleDragEnd();
      return;
    }
    let draggedBlock: NotionBlock | null = null;

    // 1. Remove dragged block from its source with Notion-style column auto-dissolution
    const pagesWithoutDragged = activePages.map((page, pIdx) => {
      // Inside a column:
      if (draggedBlockInfo.parentBlockId && draggedBlockInfo.colId) {
        if (pIdx !== draggedBlockInfo.pageIdx) return page;
        const nextBlocks: NotionBlock[] = [];
        page.blocks.forEach((b) => {
          if (b.id !== draggedBlockInfo.parentBlockId || !b.columns) {
            nextBlocks.push(b);
            return;
          }
          const updatedCols = b.columns.map((c) => {
            if (c.id !== draggedBlockInfo.colId) return c;
            const found = c.blocks.find((cb) => cb.id === draggedBlockInfo.blockId);
            if (found) draggedBlock = found;
            const remaining = c.blocks.filter((cb) => cb.id !== draggedBlockInfo.blockId);
            return {
              ...c,
              blocks: remaining,
            };
          });

          // Check if any column is empty
          const nonEmptyCols = updatedCols.filter((c) => c.blocks.length > 0);
          if (nonEmptyCols.length <= 1) {
            // Auto-dissolution: if only 1 column remains, unwrap its blocks into the page flow!
            if (nonEmptyCols.length === 1) {
              nextBlocks.push(...nonEmptyCols[0].blocks);
            }
          } else {
            const updatedColumnBlock: NotionBlock = {
              ...b,
              layoutColumns: nonEmptyCols.length as 2 | 3,
              columns: nonEmptyCols,
            };
            nextBlocks.push(updatedColumnBlock);
          }
        });
        return { ...page, blocks: nextBlocks };
      }

      // At page root:
      if (pIdx === draggedBlockInfo.pageIdx) {
        const found = page.blocks.find((b) => b.id === draggedBlockInfo.blockId);
        if (found) draggedBlock = found;
        return {
          ...page,
          blocks: page.blocks.filter((b) => b.id !== draggedBlockInfo.blockId),
        };
      }
      return page;
    });

    if (!draggedBlock) {
      handleDragEnd();
      return;
    }

    const currentDragged: NotionBlock = draggedBlock;

    // 2. Insert dragged block at target position
    const updatedPages: A4Page[] = pagesWithoutDragged.map((page, pIdx) => {
      if (pIdx !== targetPageIdx) return page;

      // Drop inside a column (vertical stack above or below)
      if (targetParentBlockId && targetColId) {
        return {
          ...page,
          blocks: page.blocks.map((b) => {
            if (b.id !== targetParentBlockId || !b.columns) return b;
            return {
              ...b,
              columns: b.columns.map((c) => {
                if (c.id !== targetColId) return c;
                const nextBlocks = [...c.blocks];
                const targetIdx = targetBlockId ? nextBlocks.findIndex((cb) => cb.id === targetBlockId) : -1;
                const insertIdx = position === "bottom" ? targetIdx + 1 : Math.max(0, targetIdx);
                // Inside column, images adapt to full column width
                const normalized = currentDragged.type === "image"
                  ? { ...currentDragged, widthPercentage: 100 }
                  : currentDragged;
                nextBlocks.splice(insertIdx, 0, normalized);
                return { ...c, blocks: nextBlocks };
              }),
            };
          }),
        };
      }

      // Auto-layout Multi-Column side-by-side split (position === "left" | "right")
      if (position === "left" || position === "right") {
        const targetIdx = page.blocks.findIndex((b) => b.id === targetBlockId);
        if (targetIdx === -1) return page;
        const targetBlock = page.blocks[targetIdx];

        const normalizedDragged: NotionBlock = currentDragged.type === "image"
          ? { ...currentDragged, widthPercentage: 100 }
          : currentDragged;
        const normalizedTarget: NotionBlock = targetBlock.type === "image"
          ? { ...targetBlock, widthPercentage: 100 }
          : targetBlock;

        if (targetBlock.type === "columns" && targetBlock.columns) {
          if (targetBlock.columns.length < 3) {
            const newCol: ColumnData = {
              id: generateUniqueId("col"),
              blocks: [normalizedDragged],
            };
            const nextCols = position === "left"
              ? [newCol, ...targetBlock.columns]
              : [...targetBlock.columns, newCol];
            const updatedBlock: NotionBlock = {
              ...targetBlock,
              layoutColumns: (targetBlock.columns.length + 1) as 2 | 3,
              columns: nextCols,
            };
            const nextBlocks = [...page.blocks];
            nextBlocks[targetIdx] = updatedBlock;
            return { ...page, blocks: nextBlocks };
          }
        }

        // Create new 2-column auto-layout
        const col1: ColumnData = {
          id: generateUniqueId("col"),
          blocks: [position === "left" ? normalizedDragged : normalizedTarget],
        };
        const col2: ColumnData = {
          id: generateUniqueId("col"),
          blocks: [position === "left" ? normalizedTarget : normalizedDragged],
        };

        const newColumnBlock: NotionBlock = {
          id: generateUniqueId("blk"),
          type: "columns",
          content: "",
          layoutColumns: 2,
          columns: [col1, col2],
        };

        const nextBlocks = [...page.blocks];
        nextBlocks[targetIdx] = newColumnBlock;
        return { ...page, blocks: nextBlocks };
      }

      // Standard vertical reordering (top / bottom) at page root
      const targetIdx = page.blocks.findIndex((b) => b.id === targetBlockId);
      const nextBlocks = [...page.blocks];
      const insertIdx = position === "bottom" ? targetIdx + 1 : Math.max(0, targetIdx);
      nextBlocks.splice(insertIdx, 0, currentDragged);
      return { ...page, blocks: nextBlocks };
    });

    handlePagesChange(updatedPages);
    handleDragEnd();
  };

  // ── 3-Column Split Insertion Drop Handler ──
  const handleDropColumnSplit = (pageIdx: number, parentBlockId: string, insertIndex: number) => {
    if (!draggedBlockInfo) return;

    let draggedBlock: NotionBlock | null = null;

    // 1. Remove dragged block from its source
    const pagesWithoutDragged = activePages.map((page, pIdx) => {
      if (draggedBlockInfo.parentBlockId && draggedBlockInfo.colId) {
        if (pIdx !== draggedBlockInfo.pageIdx) return page;
        const nextBlocks: NotionBlock[] = [];
        page.blocks.forEach((b) => {
          if (b.id !== draggedBlockInfo.parentBlockId || !b.columns) {
            nextBlocks.push(b);
            return;
          }
          const updatedCols = b.columns.map((c) => {
            if (c.id !== draggedBlockInfo.colId) return c;
            const found = c.blocks.find((cb) => cb.id === draggedBlockInfo.blockId);
            if (found) draggedBlock = found;
            const remaining = c.blocks.filter((cb) => cb.id !== draggedBlockInfo.blockId);
            return { ...c, blocks: remaining };
          });
          const nonEmptyCols = updatedCols.filter((c) => c.blocks.length > 0);
          if (nonEmptyCols.length <= 1) {
            if (nonEmptyCols.length === 1) nextBlocks.push(...nonEmptyCols[0].blocks);
          } else {
            const updatedColBlock: NotionBlock = {
              ...b,
              layoutColumns: nonEmptyCols.length as 2 | 3,
              columns: nonEmptyCols,
            };
            nextBlocks.push(updatedColBlock);
          }
        });
        return { ...page, blocks: nextBlocks };
      }

      if (pIdx === draggedBlockInfo.pageIdx) {
        const found = page.blocks.find((b) => b.id === draggedBlockInfo.blockId);
        if (found) draggedBlock = found;
        return {
          ...page,
          blocks: page.blocks.filter((b) => b.id !== draggedBlockInfo.blockId),
        };
      }
      return page;
    });

    if (!draggedBlock) {
      handleDragEnd();
      return;
    }

    const currentDragged: NotionBlock = draggedBlock;
    const normalizedDragged: NotionBlock = currentDragged.type === "image"
      ? { ...currentDragged, widthPercentage: 100 }
      : currentDragged;

    // 2. Insert as new column in target parent block
    const updatedPages: A4Page[] = pagesWithoutDragged.map((page, pIdx) => {
      if (pIdx !== pageIdx) return page;
      return {
        ...page,
        blocks: page.blocks.map((b): NotionBlock => {
          if (b.id !== parentBlockId || !b.columns) return b;
          if (b.columns.length >= 3) return b;

          const newCol: ColumnData = {
            id: generateUniqueId("col"),
            blocks: [normalizedDragged],
          };
          const nextCols = [...b.columns];
          nextCols.splice(Math.max(0, Math.min(nextCols.length, insertIndex)), 0, newCol);
          return {
            ...b,
            layoutColumns: 3,
            columns: nextCols,
          };
        }),
      };
    });

    handlePagesChange(updatedPages);
    handleDragEnd();
  };

  // ── Clipboard Image Paste Engine ──
  const handlePaste = async (
    e: React.ClipboardEvent,
    pageIdx: number,
    targetBlockId?: string,
    colInfo?: { parentBlockId: string; colId: string }
  ) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageItem = Array.from(items).find((it) => it.type.startsWith("image/"));
    if (!imageItem) {
      return; // Standard text paste
    }

    e.preventDefault();
    e.stopPropagation();

    const file = imageItem.getAsFile();
    if (!file) return;

    const compressedUrl = await compressImageDataUrl(file);
    const newBlockId = generateUniqueId("blk");
    const newImageBlock: NotionBlock = {
      id: newBlockId,
      type: "image",
      content: compressedUrl,
      widthPercentage: 100,
      alignment: "center",
      caption: "",
    };

    if (colInfo) {
      // Paste inside column
      const updated = activePages.map((p, pIdx) => {
        if (pIdx !== pageIdx) return p;
        return {
          ...p,
          blocks: p.blocks.map((b) => {
            if (b.id !== colInfo.parentBlockId || !b.columns) return b;
            return {
              ...b,
              columns: b.columns.map((c) => {
                if (c.id !== colInfo.colId) return c;
                const nextBlocks = [...c.blocks];
                const bIdx = targetBlockId ? nextBlocks.findIndex((cb) => cb.id === targetBlockId) : -1;
                if (bIdx !== -1 && nextBlocks[bIdx].type === "paragraph" && !nextBlocks[bIdx].content.trim()) {
                  nextBlocks[bIdx] = newImageBlock;
                } else if (bIdx !== -1) {
                  nextBlocks.splice(bIdx + 1, 0, newImageBlock);
                } else {
                  nextBlocks.push(newImageBlock);
                }
                return { ...c, blocks: nextBlocks };
              }),
            };
          }),
        };
      });
      handlePagesChange(updated);
      setActiveBlockId(newBlockId);
    } else {
      // Paste at root level
      const currentPage = activePages[pageIdx];
      if (!currentPage) return;
      const bIdx = targetBlockId ? currentPage.blocks.findIndex((b) => b.id === targetBlockId) : -1;

      const nextBlocks = [...currentPage.blocks];
      if (bIdx !== -1 && nextBlocks[bIdx].type === "paragraph" && !nextBlocks[bIdx].content.trim()) {
        nextBlocks[bIdx] = newImageBlock;
      } else if (bIdx !== -1) {
        nextBlocks.splice(bIdx + 1, 0, newImageBlock);
      } else {
        nextBlocks.push(newImageBlock);
      }

      const updated = activePages.map((p, pIdx) => (pIdx === pageIdx ? { ...p, blocks: nextBlocks } : p));
      handlePagesChange(updated);
      setActiveBlockId(newBlockId);
    }
  };

  const _handleAddNewPage = () => {
    const newPageNum = activePages.length + 1;
    const newPage: A4Page = {
      id: generateUniqueId("page"),
      pageNumber: newPageNum,
      title: "",
      blocks: [
        {
          id: generateUniqueId("blk"),
          type: "paragraph",
          content: "",
        },
      ],
    };
    handlePagesChange([...activePages, newPage]);
  };

  // Keyboard navigation & Enter/Backspace flows
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
        block.type === "bullet" || block.type === "numbered" || block.type === "todo" ? block.type : "paragraph"
      );
      return;
    }

    if (e.key === "Backspace" && block.content === "") {
      e.preventDefault();
      if (block.type !== "paragraph") {
        changeBlockType(pageIdx, block.id, { command: "paragraph" });
        return;
      }

      // Cross-page Backspace (Google Docs behavior):
      // If pressing Backspace on the first line of page 2+, delete it and transition cursor to end of page 1
      if (pageIdx > 0 && index === 0) {
        const prevPage = activePages[pageIdx - 1];
        const lastBlockOfPrev = prevPage?.blocks[prevPage.blocks.length - 1];

        const updated = activePages
          .map((p, idx) => {
            if (idx !== pageIdx) return p;
            return {
              ...p,
              blocks: p.blocks.filter((b) => b.id !== block.id),
            };
          })
          .filter((p, idx) => idx === 0 || p.blocks.length > 0)
          .map((p, idx) => ({ ...p, pageNumber: idx + 1 }));

        handlePagesChange(updated);
        if (lastBlockOfPrev) {
          setActiveBlockId(lastBlockOfPrev.id);
          setActivePageIndex(pageIdx - 1);
          setTimeout(() => blockRefs.current.get(lastBlockOfPrev.id)?.focus(), 30);
        }
        return;
      }

      if (activePages[pageIdx].blocks.length > 1) {
        deleteBlock(pageIdx, block.id);
      }
      return;
    }

    const curBlocks = activePages[pageIdx].blocks;
    if (e.key === "ArrowUp") {
      if (index > 0) {
        const prev = curBlocks[index - 1];
        blockRefs.current.get(prev.id)?.focus();
      } else if (pageIdx > 0) {
        const prevPage = activePages[pageIdx - 1];
        const lastOfPrev = prevPage?.blocks[prevPage.blocks.length - 1];
        if (lastOfPrev) {
          setActivePageIndex(pageIdx - 1);
          blockRefs.current.get(lastOfPrev.id)?.focus();
        }
      }
    }
    if (e.key === "ArrowDown") {
      if (index < curBlocks.length - 1) {
        const next = curBlocks[index + 1];
        blockRefs.current.get(next.id)?.focus();
      } else if (pageIdx < activePages.length - 1) {
        const nextPage = activePages[pageIdx + 1];
        const firstOfNext = nextPage?.blocks[0];
        if (firstOfNext) {
          setActivePageIndex(pageIdx + 1);
          blockRefs.current.get(firstOfNext.id)?.focus();
        }
      }
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
      setActiveColumnInfo(null);
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
        setPaletteOpen(true);
      }
    } else if (paletteOpen) {
      setPaletteOpen(false);
      setSlashSearchQuery("");
      setActiveColumnInfo(null);
    }
  };

  // ── Multi-Column Helpers ──
  const updateColumnBlock = (pageIdx: number, parentBlockId: string, colId: string, blockId: string, content: string) => {
    const updated = activePages.map((p, pIdx) => {
      if (pIdx !== pageIdx) return p;
      return {
        ...p,
        blocks: p.blocks.map((b) => {
          if (b.id !== parentBlockId || !b.columns) return b;
          return {
            ...b,
            columns: b.columns.map((c) => {
              if (c.id !== colId) return c;
              return {
                ...c,
                blocks: c.blocks.map((cb) => (cb.id === blockId ? { ...cb, content } : cb)),
              };
            }),
          };
        }),
      };
    });
    handlePagesChange(updated);
  };

  const updateColumnBlockWidth = (pageIdx: number, parentBlockId: string, colId: string, blockId: string, widthPercentage: number) => {
    const updated = activePages.map((p, pIdx) => {
      if (pIdx !== pageIdx) return p;
      return {
        ...p,
        blocks: p.blocks.map((b) => {
          if (b.id !== parentBlockId || !b.columns) return b;
          return {
            ...b,
            columns: b.columns.map((c) => {
              if (c.id !== colId) return c;
              return {
                ...c,
                blocks: c.blocks.map((cb) => (cb.id === blockId ? { ...cb, widthPercentage } : cb)),
              };
            }),
          };
        }),
      };
    });
    handlePagesChange(updated);
  };

  const updateColumnBlockAlignment = (pageIdx: number, parentBlockId: string, colId: string, blockId: string, alignment: "left" | "center" | "right") => {
    const updated = activePages.map((p, pIdx) => {
      if (pIdx !== pageIdx) return p;
      return {
        ...p,
        blocks: p.blocks.map((b) => {
          if (b.id !== parentBlockId || !b.columns) return b;
          return {
            ...b,
            columns: b.columns.map((c) => {
              if (c.id !== colId) return c;
              return {
                ...c,
                blocks: c.blocks.map((cb) => (cb.id === blockId ? { ...cb, alignment } : cb)),
              };
            }),
          };
        }),
      };
    });
    handlePagesChange(updated);
  };

  const handleColumnBlockInput = (
    e: React.FormEvent<HTMLElement>,
    pageIdx: number,
    parentBlockId: string,
    colId: string,
    block: NotionBlock
  ) => {
    const target = e.currentTarget;
    const value = "value" in target ? (target as HTMLInputElement).value : target.innerText;
    updateColumnBlock(pageIdx, parentBlockId, colId, block.id, value);

    if (value.startsWith("/")) {
      setActiveBlockId(block.id);
      setActivePageIndex(pageIdx);
      setActiveColumnInfo({ pageIdx, parentBlockId, colId, blockId: block.id });
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
        setPaletteOpen(true);
      }
    } else if (paletteOpen) {
      setPaletteOpen(false);
      setSlashSearchQuery("");
      setActiveColumnInfo(null);
    }
  };

  const addBlockInColumn = (pageIdx: number, parentBlockId: string, colId: string, afterBlockId: string, type: BlockType = "paragraph") => {
    const newSubBlock: NotionBlock = {
      id: generateUniqueId("blk"),
      type,
      content: "",
      widthPercentage: 100,
      alignment: "center",
    };
    const updated = activePages.map((p, pIdx) => {
      if (pIdx !== pageIdx) return p;
      return {
        ...p,
        blocks: p.blocks.map((b) => {
          if (b.id !== parentBlockId || !b.columns) return b;
          return {
            ...b,
            columns: b.columns.map((c) => {
              if (c.id !== colId) return c;
              const idx = c.blocks.findIndex((cb) => cb.id === afterBlockId);
              const nextBlocks = [...c.blocks];
              if (idx === -1) nextBlocks.push(newSubBlock);
              else nextBlocks.splice(idx + 1, 0, newSubBlock);
              return { ...c, blocks: nextBlocks };
            }),
          };
        }),
      };
    });
    handlePagesChange(updated);
    setActiveBlockId(newSubBlock.id);
    setActivePageIndex(pageIdx);
    setTimeout(() => {
      const el = document.querySelector(`[data-block-id="${newSubBlock.id}"]`) as HTMLElement;
      el?.focus();
    }, 40);
  };

  const deleteBlockInColumn = (pageIdx: number, parentBlockId: string, colId: string, blockId: string) => {
    const updated = activePages.map((p, pIdx) => {
      if (pIdx !== pageIdx) return p;
      return {
        ...p,
        blocks: p.blocks.map((b) => {
          if (b.id !== parentBlockId || !b.columns) return b;
          return {
            ...b,
            columns: b.columns.map((c) => {
              if (c.id !== colId) return c;
              return {
                ...c,
                blocks: c.blocks.filter((cb) => cb.id !== blockId),
              };
            }),
          };
        }),
      };
    });
    handlePagesChange(updated);
  };

  const convertColumnLayout = (pageIdx: number, parentBlockId: string, newCount: 2 | 3) => {
    const updated = activePages.map((p, pIdx) => {
      if (pIdx !== pageIdx) return p;
      return {
        ...p,
        blocks: p.blocks.map((b) => {
          if (b.id !== parentBlockId || !b.columns) return b;
          let newCols = [...b.columns];
          if (newCount === 3 && newCols.length < 3) {
            newCols.push({
              id: generateUniqueId("col"),
              blocks: [{ id: generateUniqueId("blk"), type: "paragraph", content: "", widthPercentage: 100, alignment: "center" }],
            });
          } else if (newCount === 2 && newCols.length > 2) {
            const thirdCol = newCols[2];
            const secondCol = newCols[1];
            newCols = [
              newCols[0],
              {
                ...secondCol,
                blocks: [...secondCol.blocks, ...thirdCol.blocks],
              },
            ];
          }
          return { ...b, layoutColumns: newCount, columns: newCols };
        }),
      };
    });
    handlePagesChange(updated);
  };

  return (
    <div
      ref={editorContainerRef}
      className={className}
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%",
        height: isZoomedOutPreview ? "100%" : "auto",
        flex: isZoomedOutPreview ? 1 : "unset",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: isZoomedOutPreview ? "0px" : "32px",
        cursor: isZoomedOutPreview ? "pointer" : "default",
        padding: isZoomedOutPreview ? "0px" : "24px 0 64px 0",
      }}
    >
      {/* ── Zoomed-Out Readonly Flap Preview Mode ── */}
      {isZoomedOutPreview ? (
        <A4PunchedSheet
          punchEdge={punchEdge}
          isHovered={isHovered}
          style={{
            height: "100%",
            minHeight: "100%",
            flex: 1,
            boxShadow: isHovered
              ? "0 20px 48px rgba(0, 0, 0, 0.22), 0 4px 12px rgba(0, 0, 0, 0.1)"
              : "0 10px 30px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div
            style={{
              pointerEvents: "none",
              userSelect: "none",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Title */}
            <div
              style={{
                fontSize: "clamp(1.2rem, 1.6vw, 1.85rem)",
                fontWeight: 800,
                color: "#18181b",
                lineHeight: 1.2,
                marginBottom: "16px",
                letterSpacing: "-0.02em",
              }}
            >
              {activePages[0]?.title || "Untitled Document"}
            </div>

            {/* Preview Blocks */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", overflow: "hidden" }}>
              {activePages[0]?.blocks.map((block) => (
                <div key={block.id} style={{ width: "100%" }}>
                  {block.type === "paragraph" && (
                    <div
                      style={{
                        fontSize: "0.82rem",
                        lineHeight: 1.6,
                        color: "#3f3f46",
                        minHeight: block.content ? "unset" : "0.75rem",
                        wordBreak: "break-word",
                      }}
                    >
                      {block.content}
                    </div>
                  )}
                  {block.type === "h1" && (
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#18181b", marginTop: "8px" }}>
                      {block.content}
                    </div>
                  )}
                  {block.type === "h2" && (
                    <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#18181b", marginTop: "6px" }}>
                      {block.content}
                    </div>
                  )}
                  {block.type === "h3" && (
                    <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#18181b", marginTop: "4px" }}>
                      {block.content}
                    </div>
                  )}
                  {block.type === "quote" && (
                    <div
                      style={{
                        borderLeft: "2px solid #a1a1aa",
                        paddingLeft: "8px",
                        fontStyle: "italic",
                        fontSize: "0.82rem",
                        lineHeight: 1.5,
                        color: "#52525b",
                        margin: "4px 0",
                      }}
                    >
                      {block.content || <span style={{ opacity: 0.5 }}>Quote</span>}
                    </div>
                  )}
                  {block.type === "callout" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "6px",
                        padding: "4px 8px",
                        backgroundColor: "#f4f4f5",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        color: "#27272a",
                        margin: "4px 0",
                      }}
                    >
                      <span>{block.calloutIcon || "💡"}</span>
                      <span>{block.content}</span>
                    </div>
                  )}
                  {block.type === "code" && (
                    <div
                      style={{
                        padding: "6px 8px",
                        backgroundColor: "#27272a",
                        color: "#10b981",
                        borderRadius: "4px",
                        fontFamily: "monospace",
                        fontSize: "0.75rem",
                        lineHeight: 1.4,
                        margin: "4px 0",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {block.content || "// Code"}
                    </div>
                  )}
                  {block.type === "bullet" && (
                    <div style={{ fontSize: "0.82rem", color: "#3f3f46", display: "flex", gap: "6px" }}>
                      <span>•</span>
                      <span>{block.content}</span>
                    </div>
                  )}
                  {block.type === "numbered" && (
                    <div style={{ fontSize: "0.82rem", color: "#3f3f46", display: "flex", gap: "6px" }}>
                      <span>1.</span>
                      <span>{block.content}</span>
                    </div>
                  )}
                  {block.type === "divider" && (
                    <hr style={{ border: "none", borderTop: "1px solid #e4e4e7", margin: "6px 0" }} />
                  )}
                  {block.type === "video" && (
                    <div
                      style={{
                        width: `${block.widthPercentage || 100}%`,
                        height: "70px",
                        backgroundColor: "#18181b",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff",
                        fontSize: "0.75rem",
                        margin: "4px 0",
                      }}
                    >
                      ▶ Video
                    </div>
                  )}
                  {block.type === "todo" && (
                    <div style={{ fontSize: "0.82rem", color: "#3f3f46", display: "flex", gap: "6px" }}>
                      <span>☐</span>
                      <span>{block.content}</span>
                    </div>
                  )}
                  {block.type === "image" && block.content && (
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent:
                          block.alignment === "left"
                            ? "flex-start"
                            : block.alignment === "right"
                            ? "flex-end"
                            : "center",
                        margin: "6px 0",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={block.content}
                        alt={block.caption || ""}
                        style={{
                          width: `${block.widthPercentage || 100}%`,
                          maxWidth: "100%",
                          height: "auto",
                          maxHeight: "180px",
                          objectFit: "contain",
                          borderRadius: "4px",
                          display: "block",
                        }}
                      />
                    </div>
                  )}
                  {/* Multi-Column Preview Renderer on Folder Flap */}
                  {block.type === "columns" && block.columns && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          (block.layoutColumns || 2) === 2
                            ? "repeat(2, minmax(0, 1fr))"
                            : "repeat(3, minmax(0, 1fr))",
                        gap: "8px",
                        width: "100%",
                        margin: "4px 0",
                      }}
                    >
                      {block.columns.slice(0, block.layoutColumns || 2).map((c) => (
                        <div key={c.id} style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
                          {c.blocks.slice(0, 2).map((cb) => (
                            <div key={cb.id} style={{ width: "100%" }}>
                              {cb.type === "image" && cb.content ? (
                                <div
                                  style={{
                                    width: "100%",
                                    display: "flex",
                                    justifyContent:
                                      cb.alignment === "left"
                                        ? "flex-start"
                                        : cb.alignment === "right"
                                        ? "flex-end"
                                        : "center",
                                  }}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={cb.content}
                                    alt=""
                                    style={{
                                      width: `${cb.widthPercentage || 100}%`,
                                      maxWidth: "100%",
                                      height: "auto",
                                      maxHeight: "120px",
                                      objectFit: "contain",
                                      borderRadius: "3px",
                                      display: "block",
                                    }}
                                  />
                                </div>
                              ) : (
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    lineHeight: 1.5,
                                    color: "#52525b",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {cb.content}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Discrete Footer Indicator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "14px",
                borderTop: "1px dashed rgba(0, 0, 0, 0.08)",
                fontSize: "0.72rem",
                color: "#a1a1aa",
                marginTop: "auto",
              }}
            >
              <span>Page 1 of {activePages.length}</span>
              <span>Click to open editor ↗</span>
            </div>
          </div>
        </A4PunchedSheet>
      ) : (
        /* ── Full Interactive A4 Notion Multi-Page Continuous Editor ── */
        activePages.map((page, pageIdx) => (
          <React.Fragment key={page.id}>
            <A4PunchedSheet
              punchEdge={punchEdge}
              isHovered={false}
              style={{
                width: "100%",
                maxWidth: "860px",
                height: "1140px",
                minHeight: "1140px",
                maxHeight: "1140px",
                overflow: "visible",
                boxShadow: "0 18px 50px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.08)",
              }}
              onScroll={(e) => {
                (e.currentTarget as HTMLElement).scrollTop = 0;
              }}
            >
            {/* Primary Document Title ONLY on Page 1 */}
            {pageIdx === 0 ? (
              <div style={{ marginBottom: "24px" }}>
                <input
                  type="text"
                  value={page.title}
                  onChange={(e) => updatePageTitle(pageIdx, e.target.value)}
                  placeholder="Untitled Document..."
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
            ) : page.title ? (
              /* Subsequent pages: Only show title if user typed one */
              <div style={{ marginBottom: "16px" }}>
                <input
                  type="text"
                  value={page.title}
                  onChange={(e) => updatePageTitle(pageIdx, e.target.value)}
                  placeholder="Untitled section..."
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: "1.35rem",
                    fontWeight: 700,
                    color: "#27272a",
                    padding: 0,
                  }}
                />
              </div>
            ) : null}

            {/* Blocks Flow for this page */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}
              onPaste={(e) => handlePaste(e, pageIdx)}
            >
              {page.blocks.map((block, index) => {
                const isDropTarget = dropTarget?.blockId === block.id && dropTarget?.pageIdx === pageIdx && !dropTarget?.parentBlockId;
                const isDraggingThis = draggedBlockInfo?.blockId === block.id;
                const hasContent = Boolean(
                  (block.content && block.content.trim().length > 0) ||
                  block.type === "image" ||
                  block.type === "video" ||
                  block.type === "columns" ||
                  block.type === "divider"
                );
                const isBlockHovered = hasContent && (hoveredBlockId === block.id || blockOptionsMenuId === block.id);
                const gutterTop =
                  block.type === "h1"
                    ? "16px"
                    : block.type === "h2"
                    ? "13px"
                    : block.type === "h3"
                    ? "10px"
                    : block.type === "quote"
                    ? "6px"
                    : block.type === "callout"
                    ? "8px"
                    : block.type === "code"
                    ? "10px"
                    : "4px";

                return (
                <div
                  key={block.id}
                  style={{
                    position: "relative",
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-start",
                    opacity: isDraggingThis ? 0.35 : 1,
                    transition: "opacity 0.15s ease",
                  }}
                  className="group/block"
                  onMouseEnter={() => setHoveredBlockId(block.id)}
                  onMouseLeave={() => setHoveredBlockId((prev) => (prev === block.id ? null : prev))}
                  onDragOver={(e) => handleDragOver(e, pageIdx, block.id)}
                  onDragLeave={(e) => handleDragLeave(e, block.id)}
                  onDrop={(e) => handleDrop(e, pageIdx, block.id)}
                >
                  {/* Top Drop Indicator */}
                  {isDropTarget && dropTarget?.position === "top" && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-5px",
                        left: dropTarget?.indicatorRect ? `${dropTarget.indicatorRect.left}px` : 0,
                        width: dropTarget?.indicatorRect ? `${dropTarget.indicatorRect.width}px` : "100%",
                        height: "3px",
                        borderRadius: "2px",
                        backgroundColor: themeColor || "#194bfd",
                        boxShadow: "0 0 8px rgba(25, 75, 253, 0.4)",
                        zIndex: 30,
                        pointerEvents: "none",
                      }}
                    />
                  )}

                  {/* Bottom Drop Indicator */}
                  {isDropTarget && dropTarget?.position === "bottom" && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-5px",
                        left: dropTarget?.indicatorRect ? `${dropTarget.indicatorRect.left}px` : 0,
                        width: dropTarget?.indicatorRect ? `${dropTarget.indicatorRect.width}px` : "100%",
                        height: "3px",
                        borderRadius: "2px",
                        backgroundColor: themeColor || "#194bfd",
                        boxShadow: "0 0 8px rgba(25, 75, 253, 0.4)",
                        zIndex: 30,
                        pointerEvents: "none",
                      }}
                    />
                  )}

                  {/* Left Multi-Column Drop Indicator (Auto-layout Split) */}
                  {isDropTarget && dropTarget?.position === "left" && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: dropTarget?.indicatorRect ? `${dropTarget.indicatorRect.left - 6}px` : "-6px",
                        width: "4px",
                        borderRadius: "2px",
                        backgroundColor: themeColor || "#194bfd",
                        boxShadow: "0 0 10px rgba(25, 75, 253, 0.5)",
                        zIndex: 30,
                        pointerEvents: "none",
                      }}
                    />
                  )}

                  {/* Right Multi-Column Drop Indicator (Auto-layout Split) */}
                  {isDropTarget && dropTarget?.position === "right" && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: dropTarget?.indicatorRect ? `${dropTarget.indicatorRect.right + 2}px` : undefined,
                        right: dropTarget?.indicatorRect ? undefined : "-6px",
                        width: "4px",
                        borderRadius: "2px",
                        backgroundColor: themeColor || "#194bfd",
                        boxShadow: "0 0 10px rgba(25, 75, 253, 0.5)",
                        zIndex: 30,
                        pointerEvents: "none",
                      }}
                    />
                  )}

                  {/* ── Left Hover Gutter: + and ⋮⋮ Drag/Options Handle ── */}
                  <div
                    style={{
                      position: "absolute",
                      left: "-28px",
                      top: gutterTop,
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                      opacity: isBlockHovered ? 1 : 0,
                      pointerEvents: isBlockHovered ? "auto" : "none",
                      transition: "opacity 0.15s ease",
                      zIndex: 25,
                    }}
                  >
                    {/* + Add Block Below */}
                    <button
                      type="button"
                      onClick={() => addBlockBelow(pageIdx, block.id, "paragraph")}
                      title="Add a block below"
                      style={{
                        width: "14px",
                        height: "18px",
                        borderRadius: "3px",
                        border: "none",
                        background: "transparent",
                        color: "#8e8e93",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>

                    {/* ⋮⋮ Six-dot Options & Drag Handle */}
                    <button
                      type="button"
                      draggable
                      onDragStart={(e) => handleDragStart(e, pageIdx, block.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setBlockOptionsMenuId(blockOptionsMenuId === block.id ? null : block.id)}
                      title="Drag to move or split columns • Click for options"
                      style={{
                        width: "12px",
                        height: "18px",
                        borderRadius: "3px",
                        border: "none",
                        background: "transparent",
                        color: "#8e8e93",
                        cursor: "grab",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                      }}
                    >
                      <svg width="8" height="13" viewBox="0 0 10 16" fill="currentColor">
                        <circle cx="2" cy="2" r="1.5" />
                        <circle cx="8" cy="2" r="1.5" />
                        <circle cx="2" cy="8" r="1.5" />
                        <circle cx="8" cy="8" r="1.5" />
                        <circle cx="2" cy="14" r="1.5" />
                        <circle cx="8" cy="14" r="1.5" />
                      </svg>
                    </button>

                    {/* Block Options Popover */}
                    {blockOptionsMenuId === block.id && (
                      <div
                        style={{
                          position: "absolute",
                          left: "22px",
                          top: "0px",
                          width: "160px",
                          borderRadius: "8px",
                          backgroundColor: "#18181b",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          padding: "4px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                          zIndex: 50,
                          color: "#f4f4f5",
                          fontSize: "0.75rem",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => moveBlock(pageIdx, block.id, "up")}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#e4e4e7",
                            padding: "5px 8px",
                            textAlign: "left",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          ↑ Move up
                        </button>
                        <button
                          type="button"
                          onClick={() => moveBlock(pageIdx, block.id, "down")}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#e4e4e7",
                            padding: "5px 8px",
                            textAlign: "left",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          ↓ Move down
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateBlock(pageIdx, block.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#e4e4e7",
                            padding: "5px 8px",
                            textAlign: "left",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            changeBlockType(pageIdx, block.id, { command: "columns", defaultColumns: 2 });
                            setBlockOptionsMenuId(null);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#e4e4e7",
                            padding: "5px 8px",
                            textAlign: "left",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          ◫ 2 Columns
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            changeBlockType(pageIdx, block.id, { command: "columns", defaultColumns: 3 });
                            setBlockOptionsMenuId(null);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#e4e4e7",
                            padding: "5px 8px",
                            textAlign: "left",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          ◫ 3 Columns
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBlock(pageIdx, block.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            padding: "5px 8px",
                            textAlign: "left",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── Paragraph Block ── */}
                  {block.type === "paragraph" && (
                    <textarea
                      ref={(el) => {
                        if (el) blockRefs.current.set(block.id, el);
                        else blockRefs.current.delete(block.id);
                      }}
                      value={block.content}
                      onFocus={() => setActiveBlockId(block.id)}
                      onChange={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                        handleBlockInput(e, pageIdx, block);
                      }}
                      onKeyDown={(e) => handleBlockKeyDown(e, pageIdx, block, index)}
                      onPaste={(e) => handlePaste(e, pageIdx, block.id)}
                      placeholder={activeBlockId === block.id ? "Type '/' for commands..." : ""}
                      rows={1}
                      style={{
                        width: "100%",
                        backgroundColor: "transparent",
                        border: "none",
                        outline: "none",
                        resize: "none",
                        overflow: "hidden",
                        fontSize: "1rem",
                        lineHeight: 1.75,
                        color: "#27272a",
                        padding: 0,
                        margin: 0,
                        fontFamily: "inherit",
                      }}
                    />
                  )}

                  {/* ── Heading 1 ── */}
                  {block.type === "h1" && (
                    <input
                      ref={(el) => {
                        if (el) blockRefs.current.set(block.id, el);
                        else blockRefs.current.delete(block.id);
                      }}
                      type="text"
                      value={block.content}
                      onFocus={() => setActiveBlockId(block.id)}
                      onChange={(e) => handleBlockInput(e, pageIdx, block)}
                      onKeyDown={(e) => handleBlockKeyDown(e, pageIdx, block, index)}
                      onPaste={(e) => handlePaste(e, pageIdx, block.id)}
                      placeholder="Heading 1"
                      style={{
                        width: "100%",
                        backgroundColor: "transparent",
                        border: "none",
                        outline: "none",
                        fontSize: "1.85rem",
                        fontWeight: 700,
                        color: "#18181b",
                        marginTop: "12px",
                        marginBottom: "4px",
                        padding: 0,
                        fontFamily: "inherit",
                      }}
                    />
                  )}

                  {/* ── Heading 2 ── */}
                  {block.type === "h2" && (
                    <input
                      ref={(el) => {
                        if (el) blockRefs.current.set(block.id, el);
                        else blockRefs.current.delete(block.id);
                      }}
                      type="text"
                      value={block.content}
                      onFocus={() => setActiveBlockId(block.id)}
                      onChange={(e) => handleBlockInput(e, pageIdx, block)}
                      onKeyDown={(e) => handleBlockKeyDown(e, pageIdx, block, index)}
                      onPaste={(e) => handlePaste(e, pageIdx, block.id)}
                      placeholder="Heading 2"
                      style={{
                        width: "100%",
                        backgroundColor: "transparent",
                        border: "none",
                        outline: "none",
                        fontSize: "1.45rem",
                        fontWeight: 600,
                        color: "#18181b",
                        marginTop: "10px",
                        marginBottom: "4px",
                        padding: 0,
                        fontFamily: "inherit",
                      }}
                    />
                  )}

                  {/* ── Heading 3 ── */}
                  {block.type === "h3" && (
                    <input
                      ref={(el) => {
                        if (el) blockRefs.current.set(block.id, el);
                        else blockRefs.current.delete(block.id);
                      }}
                      type="text"
                      value={block.content}
                      onFocus={() => setActiveBlockId(block.id)}
                      onChange={(e) => handleBlockInput(e, pageIdx, block)}
                      onKeyDown={(e) => handleBlockKeyDown(e, pageIdx, block, index)}
                      onPaste={(e) => handlePaste(e, pageIdx, block.id)}
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

                  {/* ── To-Do List Block ── */}
                  {block.type === "todo" && (
                    <div style={{ display: "flex", alignItems: "flex-start", width: "100%", gap: "10px" }}>
                      <input
                        type="checkbox"
                        checked={Boolean(block.checked)}
                        onChange={() => toggleTodoCheck(pageIdx, block.id)}
                        style={{ marginTop: "5px", accentColor: themeColor, cursor: "pointer" }}
                      />
                      <textarea
                        ref={(el) => {
                          if (el) blockRefs.current.set(block.id, el);
                          else blockRefs.current.delete(block.id);
                        }}
                        value={block.content}
                        onFocus={() => setActiveBlockId(block.id)}
                        onChange={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                          handleBlockInput(e, pageIdx, block);
                        }}
                        onKeyDown={(e) => handleBlockKeyDown(e, pageIdx, block, index)}
                        onPaste={(e) => handlePaste(e, pageIdx, block.id)}
                        placeholder={activeBlockId === block.id ? "To-do item..." : ""}
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
                          color: block.checked ? "#a1a1aa" : "#27272a",
                          textDecoration: block.checked ? "line-through" : "none",
                          padding: 0,
                          margin: 0,
                          fontFamily: "inherit",
                        }}
                      />
                    </div>
                  )}

                  {/* ── Bullet Block ── */}
                  {block.type === "bullet" && (
                    <div style={{ display: "flex", alignItems: "flex-start", width: "100%", gap: "10px" }}>
                      <span style={{ fontSize: "1.2rem", lineHeight: 1.6, color: "#71717a" }}>•</span>
                      <textarea
                        ref={(el) => {
                          if (el) blockRefs.current.set(block.id, el);
                          else blockRefs.current.delete(block.id);
                        }}
                        value={block.content}
                        onFocus={() => setActiveBlockId(block.id)}
                        onChange={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                          handleBlockInput(e, pageIdx, block);
                        }}
                        onKeyDown={(e) => handleBlockKeyDown(e, pageIdx, block, index)}
                        onPaste={(e) => handlePaste(e, pageIdx, block.id)}
                        placeholder={activeBlockId === block.id ? "List item..." : ""}
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

                  {/* ── Numbered Block ── */}
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
                        onFocus={() => setActiveBlockId(block.id)}
                        onChange={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                          handleBlockInput(e, pageIdx, block);
                        }}
                        onKeyDown={(e) => handleBlockKeyDown(e, pageIdx, block, index)}
                        onPaste={(e) => handlePaste(e, pageIdx, block.id)}
                        placeholder={activeBlockId === block.id ? "List item..." : ""}
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

                  {/* ── Quote Block ── */}
                  {block.type === "quote" && (
                    <div style={{ borderLeft: `3px solid ${themeColor || "#18181b"}`, paddingLeft: "16px", margin: "6px 0", width: "100%" }}>
                      <textarea
                        ref={(el) => {
                          if (el) blockRefs.current.set(block.id, el);
                          else blockRefs.current.delete(block.id);
                        }}
                        value={block.content}
                        onFocus={() => setActiveBlockId(block.id)}
                        onChange={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                          handleBlockInput(e, pageIdx, block);
                        }}
                        onKeyDown={(e) => handleBlockKeyDown(e, pageIdx, block, index)}
                        onPaste={(e) => handlePaste(e, pageIdx, block.id)}
                        placeholder={activeBlockId === block.id ? "Quote..." : ""}
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

                  {/* ── Callout Block ── */}
                  {block.type === "callout" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        padding: "12px 16px",
                        backgroundColor: "rgba(0, 0, 0, 0.03)",
                        borderLeft: `4px solid ${themeColor || "#194bfd"}`,
                        borderRadius: "6px",
                        width: "100%",
                        margin: "6px 0",
                        boxSizing: "border-box",
                      }}
                    >
                      <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>{block.calloutIcon || "💡"}</span>
                      <textarea
                        ref={(el) => {
                          if (el) blockRefs.current.set(block.id, el);
                          else blockRefs.current.delete(block.id);
                        }}
                        value={block.content}
                        onFocus={() => setActiveBlockId(block.id)}
                        onChange={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                          handleBlockInput(e, pageIdx, block);
                        }}
                        onKeyDown={(e) => handleBlockKeyDown(e, pageIdx, block, index)}
                        onPaste={(e) => handlePaste(e, pageIdx, block.id)}
                        placeholder={activeBlockId === block.id ? "Callout text..." : ""}
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
                          margin: 0,
                          fontFamily: "inherit",
                        }}
                      />
                    </div>
                  )}

                  {/* ── Code Snippet Block ── */}
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
                        onFocus={() => setActiveBlockId(block.id)}
                        onChange={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                          handleBlockInput(e, pageIdx, block);
                        }}
                        onKeyDown={(e) => handleBlockKeyDown(e, pageIdx, block, index)}
                        onPaste={(e) => handlePaste(e, pageIdx, block.id)}
                        placeholder={activeBlockId === block.id ? "// Paste or write code..." : ""}
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

                  {/* ── Divider Block ── */}
                  {block.type === "divider" && (
                    <div
                      onClick={() => addBlockBelow(pageIdx, block.id, "paragraph")}
                      style={{ width: "100%", padding: "14px 0", cursor: "pointer" }}
                    >
                      <hr style={{ border: "none", borderTop: "1px solid rgba(0, 0, 0, 0.12)", margin: 0 }} />
                    </div>
                  )}

                  {/* ── Multi-Column Layout Container ── */}
                  {block.type === "columns" && block.columns && (
                    <ColumnLayoutBlock
                      columns={block.columns}
                      layoutCount={block.layoutColumns || 2}
                      themeColor={themeColor}
                      activeBlockId={activeBlockId}
                      draggedBlockId={draggedBlockInfo?.blockId}
                      onFocusBlock={(bId) => setActiveBlockId(bId)}
                      onInputBlock={(e, colId, colBlock) =>
                        handleColumnBlockInput(e, pageIdx, block.id, colId, colBlock)
                      }
                      onUpdateColumnBlock={(colId, bId, content) =>
                        updateColumnBlock(pageIdx, block.id, colId, bId, content)
                      }
                      onUpdateColumnBlockWidth={(colId, bId, width) =>
                        updateColumnBlockWidth(pageIdx, block.id, colId, bId, width)
                      }
                      onUpdateColumnBlockAlignment={(colId, bId, align) =>
                        updateColumnBlockAlignment(pageIdx, block.id, colId, bId, align)
                      }
                      onAddBlockInColumn={(colId, afterId, subType) =>
                        addBlockInColumn(pageIdx, block.id, colId, afterId, subType)
                      }
                      onDeleteBlockInColumn={(colId, bId) =>
                        deleteBlockInColumn(pageIdx, block.id, colId, bId)
                      }
                      onConvertLayout={(newCount) => convertColumnLayout(pageIdx, block.id, newCount)}
                      onDeleteLayout={() => deleteBlock(pageIdx, block.id)}
                      onDragStartBlock={(bId, cId) =>
                        handleDragStart(
                          { stopPropagation: () => {}, dataTransfer: { setData: () => {}, effectAllowed: "" } } as unknown as React.DragEvent,
                          pageIdx,
                          bId,
                          block.id,
                          cId
                        )
                      }
                      onDragEndBlock={handleDragEnd}
                      onDropBlockInColumn={(cId, targetBId, pos) => {
                        handleDrop(
                          { preventDefault: () => {}, stopPropagation: () => {} } as unknown as React.DragEvent,
                          pageIdx,
                          targetBId,
                          block.id,
                          cId,
                          pos
                        );
                      }}
                      onDropColumnSplit={(insertIndex) =>
                        handleDropColumnSplit(pageIdx, block.id, insertIndex)
                      }
                      onPasteInColumn={(e, cId, bId) =>
                        handlePaste(e, pageIdx, bId, { parentBlockId: block.id, colId: cId })
                      }
                    />
                  )}

                  {/* ── Image Block ── */}
                  {block.type === "image" && (
                    <ImageBlock
                      content={block.content}
                      caption={block.caption}
                      widthPercentage={block.widthPercentage || 100}
                      alignment={block.alignment || "center"}
                      onChangeContent={(url) => updateBlockContent(pageIdx, block.id, url)}
                      onChangeCaption={(caption) => updateBlockCaption(pageIdx, block.id, caption)}
                      onChangeWidth={(w) => updateBlockWidth(pageIdx, block.id, w)}
                      onChangeAlignment={(a) => updateBlockAlignment(pageIdx, block.id, a)}
                      onDelete={() => deleteBlock(pageIdx, block.id)}
                      onDragStart={(e) => handleDragStart(e, pageIdx, block.id)}
                      onDragEnd={handleDragEnd}
                    />
                  )}

                  {/* ── Video Block ── */}
                  {block.type === "video" && (
                    <VideoBlock
                      content={block.content}
                      caption={block.caption}
                      widthPercentage={block.widthPercentage || 100}
                      alignment={block.alignment || "center"}
                      onChangeContent={(url) => updateBlockContent(pageIdx, block.id, url)}
                      onChangeCaption={(caption) => updateBlockCaption(pageIdx, block.id, caption)}
                      onChangeWidth={(w) => updateBlockWidth(pageIdx, block.id, w)}
                      onChangeAlignment={(a) => updateBlockAlignment(pageIdx, block.id, a)}
                      onDelete={() => deleteBlock(pageIdx, block.id)}
                      onDragStart={(e) => handleDragStart(e, pageIdx, block.id)}
                      onDragEnd={handleDragEnd}
                    />
                  )}
                </div>
              );
            })}
            </div>

            {/* Click to add paragraph at bottom (Flex 1 fills remaining sheet space) */}
            <div
              onClick={() => {
                const last = page.blocks[page.blocks.length - 1];
                if (!last || last.type !== "paragraph" || last.content.trim() !== "") {
                  addBlockBelow(pageIdx, last?.id || "b0", "paragraph");
                } else {
                  blockRefs.current.get(last.id)?.focus();
                }
              }}
              style={{ flex: 1, minHeight: "24px", cursor: "text" }}
            />

          </A4PunchedSheet>

          {/* Centered Small "+" Icon Button between/after pages */}
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "4px 0 16px 0",
            }}
          >
            <button
              type="button"
              onClick={() => handleInsertPageAfter(pageIdx)}
              title="Add Page"
              aria-label="Add Page"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                backgroundColor: "#ffffff",
                border: "1px solid rgba(0, 0, 0, 0.12)",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#71717a",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.15)";
                e.currentTarget.style.borderColor = themeColor || "#194bfd";
                e.currentTarget.style.color = themeColor || "#194bfd";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.12)";
                e.currentTarget.style.color = "#71717a";
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.06)";
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </React.Fragment>
      ))
      )}

      {/* ── Slash Command Palette Overlay ── */}
      <CommandPalette
        isOpen={paletteOpen}
        position={palettePos}
        searchQuery={slashSearchQuery}
        onSelectCommand={(options) => {
          if (activeColumnInfo) {
            changeColumnBlockType(activeColumnInfo, options.command);
          } else if (activeBlockId) {
            changeBlockType(activePageIndex, activeBlockId, options);
          }
        }}
        onClose={() => {
          setPaletteOpen(false);
          setActiveColumnInfo(null);
        }}
      />
    </div>
  );
};
