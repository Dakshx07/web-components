"use client";

import React, { useState, useRef, useCallback } from "react";
import { BlockType, NotionBlock, CommandPalettePosition, A4Page, ColumnData } from "./types";
import { CommandPalette, CommandSelectOptions } from "./CommandPalette";
import { A4PunchedSheet } from "./A4PunchedSheet";
import { ImageBlock } from "./ImageBlock";
import { VideoBlock } from "./VideoBlock";
import { ColumnLayoutBlock } from "./ColumnLayoutBlock";

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
  folderCategory = "ARCHIVE",
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

  const handleAddNewPage = () => {
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
                overflow: "clip",
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
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
              {page.blocks.map((block, index) => (
                <div
                  key={block.id}
                  style={{
                    position: "relative",
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-start",
                  }}
                  className="group/block"
                >
                  {/* ── Left Hover Gutter: + and ⋮⋮ Drag/Options Handle ── */}
                  <div
                    style={{
                      position: "absolute",
                      left: "-36px",
                      top: "2px",
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                      opacity: 0,
                      transition: "opacity 0.15s ease",
                      zIndex: 10,
                    }}
                    className="group-hover/block:opacity-100"
                  >
                    {/* + Add Block Below */}
                    <button
                      type="button"
                      onClick={() => addBlockBelow(pageIdx, block.id, "paragraph")}
                      title="Add a block below"
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "3px",
                        border: "none",
                        background: "transparent",
                        color: "#71717a",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>

                    {/* ⋮⋮ Six-dot Options Handle */}
                    <button
                      type="button"
                      onClick={() => setBlockOptionsMenuId(blockOptionsMenuId === block.id ? null : block.id)}
                      title="Block options (reorder, duplicate, columns)"
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "3px",
                        border: "none",
                        background: "transparent",
                        color: "#71717a",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                      }}
                    >
                      <svg width="10" height="14" viewBox="0 0 10 16" fill="currentColor">
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
                    />
                  )}
                </div>
              ))}
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
