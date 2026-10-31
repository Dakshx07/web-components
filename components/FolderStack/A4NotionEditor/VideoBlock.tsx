"use client";

import React, { useState, useRef, useEffect } from "react";

interface VideoBlockProps {
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

export const VideoBlock: React.FC<VideoBlockProps> = ({
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
  const [activeTab, setActiveTab] = useState<"upload" | "embed">("embed");
  const [urlInput, setUrlInput] = useState(content);
  const [isEditing, setIsEditing] = useState(!content);
  const [isHovered, setIsHovered] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(widthPercentage);
  const [isDragging, setIsDragging] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    setCurrentWidth(widthPercentage);
  }, [widthPercentage]);

  // Custom Video Player States (matching Screenshot 1 & 2)
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.25 | 1.5 | 2>(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number>(0);
  const dragStartWidth = useRef<number>(widthPercentage);

  const isEmbedVideo =
    content.includes("youtube.com") ||
    content.includes("youtu.be") ||
    content.includes("vimeo.com");

  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch?v=")) {
      return url.replace("watch?v=", "embed/");
    }
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("vimeo.com/")) {
      const id = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("Please select a valid video file");
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

  // Video playback controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipSeconds = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(duration, videoRef.current.currentTime + seconds)
    );
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
    }
  };

  const toggleSpeed = () => {
    const speeds: (1 | 1.25 | 1.5 | 2)[] = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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

      let newWidth =
        side === "right"
          ? dragStartWidth.current + deltaPercentage
          : dragStartWidth.current - deltaPercentage;

      newWidth = Math.max(30, Math.min(100, Math.round(newWidth)));
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

        {activeTab === "embed" && (
          <form onSubmit={handleEmbedSubmit} style={{ display: "flex", gap: "8px" }}>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste video link (YouTube, Vimeo, MP4)..."
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
              accept="video/*"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
            <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#18181b", marginBottom: "4px" }}>
              Upload a video
            </div>
            <div style={{ fontSize: "0.78rem", color: "#71717a" }}>
              Click to choose a file (MP4, WebM, MOV)
            </div>
          </div>
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
        setShowVolumeSlider(false);
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: `${currentWidth}%`,
          maxWidth: "100%",
          margin: "6px 0",
          borderRadius: "8px",
          overflow: "hidden",
          backgroundColor: "#09090b",
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.18)",
          transition: isDragging ? "none" : "width 0.15s ease",
        }}
      >
        {isEmbedVideo ? (
          <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
            <iframe
              src={getEmbedUrl(content)}
              title="Embedded video"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "none",
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div style={{ position: "relative", width: "100%", backgroundColor: "#000" }}>
            <video
              ref={videoRef}
              src={content}
              onClick={togglePlay}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                cursor: "pointer",
              }}
            />

            {/* ── Top Left Overlay: Fullscreen & PIP (Screenshot 1) ── */}
            {isHovered && (
              <div
                style={{
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 10px",
                  borderRadius: "20px",
                  backgroundColor: "rgba(24, 24, 27, 0.75)",
                  backdropFilter: "blur(12px)",
                  zIndex: 15,
                }}
              >
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  title="Fullscreen"
                  style={{ background: "none", border: "none", color: "#f4f4f5", cursor: "pointer", padding: 0 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                </button>
              </div>
            )}

            {/* ── Top Right Overlay: Volume Slider Popout (Screenshot 1) ── */}
            {isHovered && (
              <div
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  backgroundColor: "rgba(24, 24, 27, 0.75)",
                  backdropFilter: "blur(12px)",
                  zIndex: 15,
                }}
                onMouseEnter={() => setShowVolumeSlider(true)}
              >
                <button
                  type="button"
                  onClick={() => {
                    const newMuted = !isMuted;
                    setIsMuted(newMuted);
                    if (videoRef.current) videoRef.current.muted = newMuted;
                  }}
                  style={{ background: "none", border: "none", color: "#f4f4f5", cursor: "pointer", padding: 0 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    {!isMuted && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
                  </svg>
                </button>

                {showVolumeSlider && (
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    style={{
                      width: "60px",
                      height: "4px",
                      accentColor: "#ffffff",
                      cursor: "pointer",
                    }}
                  />
                )}
              </div>
            )}

            {/* ── Bottom Notion Floating Player Bar (Screenshot 1 & 2) ── */}
            {isHovered && (
              <div
                style={{
                  position: "absolute",
                  bottom: "12px",
                  left: "14px",
                  right: "14px",
                  padding: "8px 14px",
                  borderRadius: "24px",
                  backgroundColor: "rgba(24, 24, 27, 0.88)",
                  backdropFilter: "blur(20px)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: "#f4f4f5",
                  zIndex: 15,
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                }}
              >
                {/* 15s Rewind */}
                <button
                  type="button"
                  onClick={() => skipSeconds(-15)}
                  title="Rewind 15 seconds"
                  style={{ background: "none", border: "none", color: "#e4e4e7", cursor: "pointer", padding: "2px" }}
                >
                  <span style={{ fontSize: "0.7rem", fontWeight: 700 }}>15</span>
                </button>

                {/* Play / Pause Toggle */}
                <button
                  type="button"
                  onClick={togglePlay}
                  title={isPlaying ? "Pause" : "Play"}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {isPlaying ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>

                {/* 15s Forward */}
                <button
                  type="button"
                  onClick={() => skipSeconds(15)}
                  title="Forward 15 seconds"
                  style={{ background: "none", border: "none", color: "#e4e4e7", cursor: "pointer", padding: "2px" }}
                >
                  <span style={{ fontSize: "0.7rem", fontWeight: 700 }}>15</span>
                </button>

                {/* Current Time */}
                <span style={{ color: "#a1a1aa", minWidth: "36px" }}>{formatTime(currentTime)}</span>

                {/* Draggable Scrubber Slider with White Knob */}
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  style={{
                    flex: 1,
                    height: "4px",
                    accentColor: "#ffffff",
                    cursor: "pointer",
                  }}
                />

                {/* Total Time */}
                <span style={{ color: "#a1a1aa", minWidth: "36px" }}>{formatTime(duration)}</span>

                {/* Speed Switcher >> */}
                <button
                  type="button"
                  onClick={toggleSpeed}
                  title="Playback Speed"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "0.7rem",
                  }}
                >
                  {playbackSpeed}x
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Left Draggable Vertical Resize Handle (||) ── */}
        {(isHovered || isDragging) && (
          <div
            onMouseDown={(e) => handleMouseDown(e, "left")}
            title="Drag to resize video width"
            style={{
              position: "absolute",
              left: "-12px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "12px",
              height: "48px",
              cursor: "ew-resize",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 30,
            }}
          >
            <div
              style={{
                width: "6px",
                height: "40px",
                borderRadius: "4px",
                backgroundColor: "#ffffff",
                boxShadow: "0 1px 5px rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(0, 0, 0, 0.12)",
              }}
            />
          </div>
        )}

        {/* ── Right Draggable Vertical Resize Handle (||) ── */}
        {(isHovered || isDragging) && (
          <div
            onMouseDown={(e) => handleMouseDown(e, "right")}
            title="Drag to resize video width"
            style={{
              position: "absolute",
              right: "-12px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "12px",
              height: "48px",
              cursor: "ew-resize",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 30,
            }}
          >
            <div
              style={{
                width: "6px",
                height: "40px",
                borderRadius: "4px",
                backgroundColor: "#ffffff",
                boxShadow: "0 1px 5px rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(0, 0, 0, 0.12)",
              }}
            />
          </div>
        )}

        {/* ── Top Hover Floating Action Toolbar (Screenshot 2) ── */}
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

            {/* Replace */}
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              title="Replace video"
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
