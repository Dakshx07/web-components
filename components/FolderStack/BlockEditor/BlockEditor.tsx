"use client";

import React, { useState, useRef, useEffect } from "react";
import { EditorBlock, BlockType } from "./types";
import { SlashMenu } from "./SlashMenu";
import styles from "./BlockEditor.module.css";

let globalBlockCounter = 0;
function createNewBlockId(): string {
  globalBlockCounter += 1;
  return `b-${Date.now()}-${globalBlockCounter}`;
}

interface BlockEditorProps {
  blocks: EditorBlock[];
  onChange: (blocks: EditorBlock[]) => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({ blocks, onChange }) => {
  const [slashMenuState, setSlashMenuState] = useState<{
    isOpen: boolean;
    blockId: string;
    filterText: string;
    position: { top: number; left: number };
  }>({
    isOpen: false,
    blockId: "",
    filterText: "",
    position: { top: 0, left: 0 },
  });

  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const focusTargetIdRef = useRef<string | null>(null);

  // Auto-resize textareas to fit content
  const autoResize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    if (focusTargetIdRef.current) {
      const targetId = focusTargetIdRef.current;
      focusTargetIdRef.current = null;
      const el = textareaRefs.current.get(targetId);
      if (el) {
        el.focus();
        el.selectionStart = el.value.length;
        el.selectionEnd = el.value.length;
        autoResize(el);
      }
    }
  }, [blocks]);

  const updateBlock = (id: string, updates: Partial<EditorBlock>) => {
    const updated = blocks.map((b) => (b.id === id ? { ...b, ...updates } : b));
    onChange(updated);
  };

  const deleteBlock = (id: string) => {
    if (blocks.length <= 1) return;
    const idx = blocks.findIndex((b) => b.id === id);
    const prevBlock = idx > 0 ? blocks[idx - 1] : blocks[idx + 1];
    const filtered = blocks.filter((b) => b.id !== id);
    if (prevBlock) {
      focusTargetIdRef.current = prevBlock.id;
    }
    onChange(filtered);
  };

  const addBlockAfter = (id: string, type: BlockType = "paragraph") => {
    const idx = blocks.findIndex((b) => b.id === id);
    const newId = createNewBlockId();
    const newBlock: EditorBlock = {
      id: newId,
      type,
      content: "",
      checked: false,
    };
    const nextBlocks = [...blocks];
    nextBlocks.splice(idx + 1, 0, newBlock);
    focusTargetIdRef.current = newId;
    onChange(nextBlocks);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    block: EditorBlock
  ) => {
    if (slashMenuState.isOpen) {
      // Let SlashMenu handle keys
      if (["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(e.key)) {
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addBlockAfter(block.id, "paragraph");
    } else if (e.key === "Backspace" && block.content === "") {
      e.preventDefault();
      deleteBlock(block.id);
    }
  };

  const handleInput = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    block: EditorBlock
  ) => {
    const val = e.target.value;
    updateBlock(block.id, { content: val });
    autoResize(e.target);

    // Slash menu trigger check
    if (val.startsWith("/")) {
      const rect = e.target.getBoundingClientRect();
      const parentRect = e.target.closest(`.${styles.editorContainer}`)?.getBoundingClientRect();
      const top = rect.top - (parentRect ? parentRect.top : 0);
      const left = rect.left - (parentRect ? parentRect.left : 0);

      setSlashMenuState({
        isOpen: true,
        blockId: block.id,
        filterText: val,
        position: { top, left },
      });
    } else if (slashMenuState.isOpen && slashMenuState.blockId === block.id) {
      setSlashMenuState((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const handleSelectSlashType = (type: BlockType) => {
    if (!slashMenuState.blockId) return;
    const targetBlock = blocks.find((b) => b.id === slashMenuState.blockId);
    if (!targetBlock) return;

    updateBlock(targetBlock.id, {
      type,
      content: targetBlock.content.replace(/^\/[a-zA-Z0-9]*/, "").trim(),
      ...(type === "todo" ? { checked: false } : {}),
      ...(type === "image"
        ? {
            url: "/images/architects/mary-colter-02.avif",
            caption: "New architectural photograph plate",
          }
        : {}),
      ...(type === "video"
        ? { url: "https://www.youtube.com/embed/dQw4w9WgXcQ" }
        : {}),
    });

    setSlashMenuState((prev) => ({ ...prev, isOpen: false }));
    focusTargetIdRef.current = targetBlock.id;
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    blockId: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          updateBlock(blockId, { url: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={styles.editorContainer} onClick={() => setSlashMenuState((prev) => ({ ...prev, isOpen: false }))}>
      <div className={styles.blockList}>
        {blocks.map((block) => (
          <div key={block.id} className={styles.blockRow}>
            {/* Hover Gutter Actions */}
            <div className={styles.blockGutter}>
              <button
                type="button"
                className={styles.gutterBtn}
                title="Add block below"
                onClick={() => addBlockAfter(block.id)}
              >
                +
              </button>
              <button
                type="button"
                className={styles.gutterBtn}
                title="Delete block"
                onClick={() => deleteBlock(block.id)}
              >
                ×
              </button>
            </div>

            {/* Block Body Rendering */}
            <div className={styles.blockContent}>
              {/* Heading 1 */}
              {block.type === "h1" && (
                <textarea
                  ref={(el) => {
                    if (el) {
                      textareaRefs.current.set(block.id, el);
                      autoResize(el);
                    } else {
                      textareaRefs.current.delete(block.id);
                    }
                  }}
                  className={`${styles.blockInput} ${styles.h1Input}`}
                  placeholder="Heading 1"
                  rows={1}
                  value={block.content}
                  onChange={(e) => handleInput(e, block)}
                  onKeyDown={(e) => handleKeyDown(e, block)}
                />
              )}

              {/* Heading 2 */}
              {block.type === "h2" && (
                <textarea
                  ref={(el) => {
                    if (el) {
                      textareaRefs.current.set(block.id, el);
                      autoResize(el);
                    } else {
                      textareaRefs.current.delete(block.id);
                    }
                  }}
                  className={`${styles.blockInput} ${styles.h2Input}`}
                  placeholder="Heading 2"
                  rows={1}
                  value={block.content}
                  onChange={(e) => handleInput(e, block)}
                  onKeyDown={(e) => handleKeyDown(e, block)}
                />
              )}

              {/* Heading 3 */}
              {block.type === "h3" && (
                <textarea
                  ref={(el) => {
                    if (el) {
                      textareaRefs.current.set(block.id, el);
                      autoResize(el);
                    } else {
                      textareaRefs.current.delete(block.id);
                    }
                  }}
                  className={`${styles.blockInput} ${styles.h3Input}`}
                  placeholder="Heading 3"
                  rows={1}
                  value={block.content}
                  onChange={(e) => handleInput(e, block)}
                  onKeyDown={(e) => handleKeyDown(e, block)}
                />
              )}

              {/* Todo / Checkbox */}
              {block.type === "todo" && (
                <div className={styles.todoWrapper}>
                  <input
                    type="checkbox"
                    className={styles.todoCheckbox}
                    checked={!!block.checked}
                    onChange={(e) =>
                      updateBlock(block.id, { checked: e.target.checked })
                    }
                  />
                  <textarea
                    ref={(el) => {
                      if (el) {
                        textareaRefs.current.set(block.id, el);
                        autoResize(el);
                      } else {
                        textareaRefs.current.delete(block.id);
                      }
                    }}
                    className={`${styles.blockInput} ${
                      block.checked ? styles.todoInputCompleted : ""
                    }`}
                    placeholder="To-do item..."
                    rows={1}
                    value={block.content}
                    onChange={(e) => handleInput(e, block)}
                    onKeyDown={(e) => handleKeyDown(e, block)}
                  />
                </div>
              )}

              {/* Bullet Item */}
              {block.type === "bullet" && (
                <div className={styles.bulletWrapper}>
                  <span className={styles.bulletDot}>•</span>
                  <textarea
                    ref={(el) => {
                      if (el) {
                        textareaRefs.current.set(block.id, el);
                        autoResize(el);
                      } else {
                        textareaRefs.current.delete(block.id);
                      }
                    }}
                    className={styles.blockInput}
                    placeholder="List item..."
                    rows={1}
                    value={block.content}
                    onChange={(e) => handleInput(e, block)}
                    onKeyDown={(e) => handleKeyDown(e, block)}
                  />
                </div>
              )}

              {/* Divider */}
              {block.type === "divider" && (
                <div
                  className={styles.dividerWrapper}
                  onClick={() => addBlockAfter(block.id)}
                >
                  <div className={styles.dividerLine} />
                </div>
              )}

              {/* Image Block */}
              {block.type === "image" && (
                <div className={styles.imageWrapper}>
                  {block.url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={block.url}
                        alt={block.content || "Uploaded visual"}
                        className={styles.imagePreview}
                      />
                      <input
                        type="text"
                        className={styles.imageCaptionInput}
                        placeholder="Add a caption..."
                        value={block.caption || ""}
                        onChange={(e) =>
                          updateBlock(block.id, { caption: e.target.value })
                        }
                      />
                    </>
                  ) : (
                    <label className={styles.imagePlaceholder}>
                      <span>Upload image plate or photograph</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, block.id)}
                      />
                      <span className={styles.imageUploadBtn}>Choose file</span>
                    </label>
                  )}
                </div>
              )}

              {/* Video Block */}
              {block.type === "video" && (
                <div className={styles.videoWrapper}>
                  {block.url?.includes("embed") ? (
                    <iframe
                      src={block.url}
                      title="Architectural Video"
                      className={styles.videoIframe}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <input
                      type="text"
                      className={styles.videoUrlInput}
                      placeholder="Paste YouTube or video embed URL..."
                      value={block.url || ""}
                      onChange={(e) =>
                        updateBlock(block.id, { url: e.target.value })
                      }
                    />
                  )}
                </div>
              )}

              {/* Standard Paragraph */}
              {block.type === "paragraph" && (
                <textarea
                  ref={(el) => {
                    if (el) {
                      textareaRefs.current.set(block.id, el);
                      autoResize(el);
                    } else {
                      textareaRefs.current.delete(block.id);
                    }
                  }}
                  className={styles.blockInput}
                  placeholder="Type '/' for commands..."
                  rows={1}
                  value={block.content}
                  onChange={(e) => handleInput(e, block)}
                  onKeyDown={(e) => handleKeyDown(e, block)}
                />
              )}
            </div>
          </div>
        ))}

        {/* Quick Add Block Button */}
        <button
          type="button"
          className={styles.addBlockBtn}
          onClick={() =>
            addBlockAfter(
              blocks[blocks.length - 1]?.id || "b0",
              "paragraph"
            )
          }
        >
          <span>+</span> Add paragraph or type &apos;/&apos;
        </button>
      </div>

      {/* Floating Slash Command Menu */}
      {slashMenuState.isOpen && (
        <SlashMenu
          filterText={slashMenuState.filterText}
          position={slashMenuState.position}
          onSelect={handleSelectSlashType}
          onClose={() =>
            setSlashMenuState((prev) => ({ ...prev, isOpen: false }))
          }
        />
      )}
    </div>
  );
};
