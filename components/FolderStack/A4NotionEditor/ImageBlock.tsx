"use client";

import React, { useState, useRef, useEffect } from "react";
import { compressImageDataUrl } from "./documentStore";

interface ImageBlockProps {
  content: string;
  caption?: string;
  widthPercentage?: number;
  alignment?: "left" | "center" | "right";
  onChangeContent: (url: string) => void;
  onChangeCaption: (caption: string) => void;
  onChangeWidth?: (width: number) => void;
  onChangeAlignment?: (alignment: "left" | "center" | "right") => void;
  onDelete: () => void;
}

export const ImageBlock: React.FC<ImageBlockProps> = ({
  content,
  caption = "",
  widthPercentage = 100,
  alignment = "center",
  onChangeContent,
  onChangeCaption,
  onChangeWidth,
  onChangeAlignment,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "embed">("upload");
  const [urlInput, setUrlInput] = useState(content);
  const [isEditing, setIsEditing] = useState(!content);
  const [isHovered, setIsHovered] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(widthPercentage);
  const [isDragging, setIsDragging] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    setCurrentWidth(widthPercentage);
  }, [widthPercentage]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number>(0);
  const dragStartWidth = useRef<number>(widthPercentage);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    compressImageDataUrl(file).then((compressed) => {
      onChangeContent(compressed);
      setUrlInput(compressed);
      setIsEditing(false);
    });
  };

  const handleEmbedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    compressImageDataUrl(urlInput.trim()).then((compressed) => {
      onChangeContent(compressed);
      setIsEditing(false);
    });
  };

  // Draggable vertical sidebar handles (||)
  const handleMouseDown = (e: React.MouseEvent, side: "left" | "right") => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(side);
    dragStartX.current = e.clientX;
    dragStartWidth.current = currentWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current?.parentElement) return;
      const parentWidth = containerRef.current.parentElement.getBoundingClientRect().width;
      const deltaX = moveEvent.clientX - dragStartX.current;
      const deltaPercentage = (deltaX / parentWidth) * 100;

      let newWidth = side === "right"
        ? dragStartWidth.current + deltaPercentage
        : dragStartWidth.current - deltaPercentage;

      newWidth = Math.max(25, Math.min(100, Math.round(newWidth)));
      setCurrentWidth(newWidth);
      if (onChangeWidth) {
        onChangeWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  if (!content || isEditing) {
    return (
      <div
        style={{
          width: "100%",
          padding: "16px 20px",
          backgroundColor: "#f4f4f5",
          borderRadius: "8px",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          boxSizing: "border-box",
          margin: "8px 0",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              style={{
                padding: "5px 12px",
                fontSize: "0.82rem",
                fontWeight: 600,
                borderRadius: "6px",
                border: "none",
                backgroundColor: activeTab === "upload" ? "#ffffff" : "transparent",
                color: activeTab === "upload" ? "#18181b" : "#71717a",
                boxShadow: activeTab === "upload" ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
                cursor: "pointer",
              }}
            >
              Upload
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("embed")}
              style={{
                padding: "5px 12px",
                fontSize: "0.82rem",
                fontWeight: 600,
                borderRadius: "6px",
                border: "none",
                backgroundColor: activeTab === "embed" ? "#ffffff" : "transparent",
                color: activeTab === "embed" ? "#18181b" : "#71717a",
                boxShadow: activeTab === "embed" ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
                cursor: "pointer",
              }}
            >
              Embed link
            </button>
          </div>
          <button
            type="button"
            onClick={onDelete}
            style={{
              padding: "4px 8px",
              fontSize: "0.75rem",
              borderRadius: "4px",
              border: "none",
              backgroundColor: "transparent",
              color: "#a1a1aa",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>

        {activeTab === "upload" && (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed rgba(0, 0, 0, 0.12)",
              borderRadius: "8px",
              padding: "28px 16px",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: "#ffffff",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
            <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#18181b", marginBottom: "4px" }}>
              Upload an image
            </div>
            <div style={{ fontSize: "0.78rem", color: "#71717a" }}>
              Click to choose a file (PNG, JPG, SVG, WebP)
            </div>
          </div>
        )}

        {activeTab === "embed" && (
          <form onSubmit={handleEmbedSubmit} style={{ display: "flex", gap: "8px" }}>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste image link..."
              style={{
                flex: 1,
                padding: "8px 12px",
                fontSize: "0.85rem",
                borderRadius: "6px",
                border: "1px solid rgba(0, 0, 0, 0.15)",
                backgroundColor: "#ffffff",
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "8px 16px",
                fontSize: "0.85rem",
                fontWeight: 600,
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#18181b",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              Embed
            </button>
          </form>
        )}
      </div>
    );
  }

  const alignmentStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    alignItems: alignment === "left" ? "flex-start" : alignment === "right" ? "flex-end" : "center",
  };

  return (
    <div
      style={alignmentStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        if (!isDragging) setIsHovered(false);
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: `${currentWidth}%`,
          maxWidth: "100%",
          margin: "6px 0",
          borderRadius: "6px",
          transition: isDragging ? "none" : "width 0.15s ease",
        }}
      >
        {/* Image Display */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={content}
          alt={caption || "Archival image"}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            borderRadius: "6px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          }}
        />

        {/* ── Left Draggable Vertical Resize Handle (||) ── */}
        {(isHovered || isDragging) && (
          <div
            onMouseDown={(e) => handleMouseDown(e, "left")}
            title="Drag to resize width"
            style={{
              position: "absolute",
              left: "-12px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "12px",
              height: "44px",
              cursor: "ew-resize",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 20,
            }}
          >
            <div
              style={{
                width: "6px",
                height: "36px",
                borderRadius: "4px",
                backgroundColor: "#ffffff",
                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.35)",
                border: "1px solid rgba(0, 0, 0, 0.12)",
              }}
            />
          </div>
        )}

        {/* ── Right Draggable Vertical Resize Handle (||) ── */}
        {(isHovered || isDragging) && (
          <div
            onMouseDown={(e) => handleMouseDown(e, "right")}
            title="Drag to resize width"
            style={{
              position: "absolute",
              right: "-12px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "12px",
              height: "44px",
              cursor: "ew-resize",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 20,
            }}
          >
            <div
              style={{
                width: "6px",
                height: "36px",
                borderRadius: "4px",
                backgroundColor: "#ffffff",
                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.35)",
                border: "1px solid rgba(0, 0, 0, 0.12)",
              }}
            />
          </div>
        )}

        {/* ── Top Hover Floating Action Toolbar (Notion Style) ── */}
        {isHovered && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 6px",
              borderRadius: "6px",
              backgroundColor: "rgba(24, 24, 27, 0.85)",
              backdropFilter: "blur(12px)",
              color: "#f4f4f5",
              zIndex: 25,
            }}
          >
            {/* Alignment Cycle */}
            <button
              type="button"
              onClick={() => {
                const nextAlign = alignment === "center" ? "left" : alignment === "left" ? "right" : "center";
                if (onChangeAlignment) onChangeAlignment(nextAlign);
              }}
              title="Change alignment"
              style={{
                background: "transparent",
                border: "none",
                color: "#e4e4e7",
                padding: "3px 6px",
                borderRadius: "4px",
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              {alignment === "left" ? "Left" : alignment === "right" ? "Right" : "Center"}
            </button>

            {/* Quick Width Presets */}
            <div style={{ display: "flex", gap: "2px", borderLeft: "1px solid rgba(255,255,255,0.2)", paddingLeft: "4px" }}>
              {[25, 50, 75, 100].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => {
                    setCurrentWidth(w);
                    if (onChangeWidth) onChangeWidth(w);
                  }}
                  title={`Resize to ${w}% width`}
                  style={{
                    background: currentWidth === w ? "rgba(255,255,255,0.25)" : "transparent",
                    border: "none",
                    color: "#e4e4e7",
                    padding: "2px 5px",
                    borderRadius: "3px",
                    fontSize: "0.7rem",
                    cursor: "pointer",
                    fontWeight: currentWidth === w ? 700 : 400,
                  }}
                >
                  {w}%
                </button>
              ))}
            </div>

            {/* Replace */}
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              title="Replace image"
              style={{
                background: "transparent",
                border: "none",
                color: "#e4e4e7",
                padding: "3px 6px",
                borderRadius: "4px",
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              Replace
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={onDelete}
              title="Delete block"
              style={{
                background: "transparent",
                border: "none",
                color: "#f87171",
                padding: "3px 6px",
                borderRadius: "4px",
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Caption Input */}
      <input
        type="text"
        value={caption}
        onChange={(e) => onChangeCaption(e.target.value)}
        placeholder="Add a caption..."
        style={{
          width: `${currentWidth}%`,
          maxWidth: "100%",
          backgroundColor: "transparent",
          border: "none",
          outline: "none",
          fontSize: "0.78rem",
          color: "#71717a",
          textAlign: alignment,
          marginTop: "4px",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
};
