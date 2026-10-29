"use client";

import React, { useState, useRef } from "react";

interface ImageBlockProps {
  content: string;
  caption?: string;
  onChangeContent: (url: string) => void;
  onChangeCaption: (caption: string) => void;
  onDelete: () => void;
}

export const ImageBlock: React.FC<ImageBlockProps> = ({
  content,
  caption = "",
  onChangeContent,
  onChangeCaption,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "embed">("upload");
  const [urlInput, setUrlInput] = useState(content);
  const [isEditing, setIsEditing] = useState(!content);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onChangeContent(dataUrl);
      setUrlInput(dataUrl);
      setIsEditing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleEmbedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onChangeContent(urlInput.trim());
    setIsEditing(false);
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
        {/* Tabs */}
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
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
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
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              Embed Link
            </button>
          </div>

          <button
            type="button"
            onClick={onDelete}
            style={{
              background: "none",
              border: "none",
              color: "#a1a1aa",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
            title="Delete block"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab 1: Upload */}
        {activeTab === "upload" && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%",
                padding: "24px 16px",
                backgroundColor: "#ffffff",
                border: "1px dashed rgba(0, 0, 0, 0.15)",
                borderRadius: "6px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#18181b" }}>
                Choose an image or drop file here
              </span>
              <span style={{ fontSize: "0.74rem", color: "#71717a" }}>Supports JPG, PNG, GIF, WebP</span>
            </button>
          </div>
        )}

        {/* Tab 2: Embed Link */}
        {activeTab === "embed" && (
          <form onSubmit={handleEmbedSubmit} style={{ display: "flex", gap: "8px" }}>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste an image link (e.g. https://...)"
              style={{
                flex: 1,
                padding: "8px 12px",
                fontSize: "0.84rem",
                borderRadius: "6px",
                border: "1px solid rgba(0, 0, 0, 0.15)",
                outline: "none",
                backgroundColor: "#ffffff",
                color: "#18181b",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "8px 16px",
                fontSize: "0.84rem",
                fontWeight: 600,
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#18181b",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              Embed Image
            </button>
          </form>
        )}
      </div>
    );
  }

  // Rendered Image View
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        margin: "12px 0",
      }}
      className="group"
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          backgroundColor: "#f4f4f5",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={content}
          alt={caption || "Document image"}
          style={{
            display: "block",
            width: "100%",
            maxHeight: "560px",
            objectFit: "contain",
            backgroundColor: "#fafafa",
          }}
        />

        {/* Floating Top-Right Action Controls */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            display: "flex",
            gap: "6px",
            backgroundColor: "rgba(24, 24, 27, 0.8)",
            backdropFilter: "blur(8px)",
            padding: "4px 8px",
            borderRadius: "6px",
          }}
        >
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            style={{
              background: "none",
              border: "none",
              color: "#f4f4f5",
              fontSize: "0.72rem",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Replace
          </button>
          <span style={{ color: "#71717a" }}>|</span>
          <button
            type="button"
            onClick={onDelete}
            style={{
              background: "none",
              border: "none",
              color: "#ef4444",
              fontSize: "0.72rem",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* Caption Field */}
      <input
        type="text"
        value={caption}
        onChange={(e) => onChangeCaption(e.target.value)}
        placeholder="Type a caption... (optional)"
        style={{
          width: "100%",
          border: "none",
          outline: "none",
          backgroundColor: "transparent",
          fontSize: "0.8rem",
          color: "#71717a",
          textAlign: "center",
          marginTop: "6px",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
};
