"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./ReferenceInspector.module.css";

interface FrameItem {
  index: number;
  file: string;
  url: string;
  category: "idle" | "hover" | "unfold" | "scroll";
}

interface ReferenceInspectorProps {
  onOverlayOpacityChange?: (opacity: number) => void;
  currentOverlayFrameUrl?: string;
}

export const ReferenceInspector: React.FC<ReferenceInspectorProps> = ({
  onOverlayOpacityChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [frames, setFrames] = useState<FrameItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<number>(0.5); // Default to 0.5x for analytical inspection
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0);
  const [rangeMode, setRangeMode] = useState<"all" | "unfold" | "scroll">("unfold");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load manifest
  useEffect(() => {
    fetch("/reference_frames/manifest.json")
      .then((r) => r.json())
      .then((data: FrameItem[]) => {
        setFrames(data);
        // Start on unfold frames if rangeMode is unfold
        const firstUnfold = data.findIndex((f) => f.category === "unfold");
        if (firstUnfold !== -1) setCurrentIndex(firstUnfold);
      })
      .catch((err) => console.error("Failed to load reference frames:", err));
  }, []);

  // Filter indices based on rangeMode
  const getFilteredIndices = useCallback(() => {
    if (!frames.length) return [0];
    if (rangeMode === "unfold") {
      const indices: number[] = [];
      frames.forEach((f, idx) => {
        if (f.category === "unfold" || f.category === "idle" || f.category === "hover") indices.push(idx);
      });
      return indices.length ? indices : frames.map((_, i) => i);
    }
    if (rangeMode === "scroll") {
      const indices: number[] = [];
      frames.forEach((f, idx) => {
        if (f.category === "scroll") indices.push(idx);
      });
      return indices.length ? indices : frames.map((_, i) => i);
    }
    return frames.map((_, i) => i);
  }, [frames, rangeMode]);

  // Frame looping engine
  useEffect(() => {
    if (!isPlaying || !frames.length) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const filtered = getFilteredIndices();
    const msPerFrame = (1000 / 24) / speed; // Base 24fps adjusted by playback speed

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const curFilteredPos = filtered.indexOf(prev);
        if (curFilteredPos === -1 || curFilteredPos >= filtered.length - 1) {
          return filtered[0];
        }
        return filtered[curFilteredPos + 1];
      });
    }, msPerFrame);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, frames, getFilteredIndices]);

  // Sync onion skin opacity outward
  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setOverlayOpacity(val);
    if (onOverlayOpacityChange) {
      onOverlayOpacityChange(val);
    }
  };

  const handleStep = (direction: -1 | 1) => {
    setIsPlaying(false);
    const filtered = getFilteredIndices();
    const curPos = filtered.indexOf(currentIndex);
    if (curPos === -1) {
      setCurrentIndex(filtered[0]);
      return;
    }
    const nextPos = (curPos + direction + filtered.length) % filtered.length;
    setCurrentIndex(filtered[nextPos]);
  };

  const currentFrame = frames[currentIndex];

  // Helper description of current animation phase based on index
  const getPhaseDescription = (idx: number) => {
    if (idx <= 1) return "Initial Idle Stack & 3D Hover Tilt";
    if (idx >= 2 && idx <= 8) return "Cover Flap Lift (rotateY 0° -> -45°), Sibling Folders Drop (yPercent: 120)";
    if (idx >= 9 && idx <= 18) return "3D Flap Inversion (rotateY -45° -> -180°), Front Shadow Ramp & Fade";
    if (idx >= 19 && idx <= 36) return "Flap Fully Open (-180°), Sheet & Punch-Holes Reveal, Right Tags Slide In";
    return "Case Scroll: Dossier Text, Draggable Scrapbook Elements, Next Architect Widget";
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className={styles.launcher}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={styles.launcherBtn}
          title="Toggle Ground-Truth Reference Frame Inspector"
        >
          <span className={styles.pulseDot} />
          <span>🎥 Frame Inspector ({frames.length} Ground-Truth Frames)</span>
        </button>
      </div>

      {/* Full-Screen Onion Skin Overlay when enabled */}
      {overlayOpacity > 0 && currentFrame && (
        <div
          className={styles.onionSkinOverlay}
          style={{ opacity: overlayOpacity }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentFrame.url}
            alt="Reference Frame Overlay"
            className={styles.onionSkinImg}
          />
        </div>
      )}

      {/* Main Inspector Panel Modal */}
      {isOpen && (
        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.titleGroup}>
              <h3 className={styles.panelTitle}>Ground-Truth Mosby Files Inspector</h3>
              <span className={styles.liveBadge}>LIVE CAPTURE 60FPS</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={styles.closeBtn}
              aria-label="Close Inspector"
            >
              ✕
            </button>
          </div>

          {/* Current Frame Preview */}
          <div className={styles.viewerContainer}>
            {currentFrame ? (
              <div className={styles.frameWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentFrame.url}
                  alt={`Frame ${currentIndex + 1}`}
                  className={styles.frameImage}
                />
                <div className={styles.frameBadge}>
                  Frame {currentIndex + 1} / {frames.length} ({currentFrame.category})
                </div>
              </div>
            ) : (
              <div className={styles.loadingBox}>Loading reference frames...</div>
            )}
          </div>

          {/* Phase Telemetry Banner */}
          <div className={styles.phaseBanner}>
            <div className={styles.phaseLabel}>GROUND-TRUTH PHASE:</div>
            <div className={styles.phaseDesc}>{getPhaseDescription(currentIndex)}</div>
          </div>

          {/* Scrubber Bar */}
          <div className={styles.scrubberRow}>
            <input
              type="range"
              min={0}
              max={Math.max(0, frames.length - 1)}
              value={currentIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentIndex(parseInt(e.target.value, 10));
              }}
              className={styles.scrubberSlider}
            />
          </div>

          {/* Player Controls */}
          <div className={styles.controlsRow}>
            <div className={styles.btnGroup}>
              <button
                onClick={() => handleStep(-1)}
                className={styles.ctrlBtn}
                title="Previous Frame (Left Arrow)"
              >
                ⏮ Step
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`${styles.ctrlBtn} ${isPlaying ? styles.activeCtrlBtn : ""}`}
              >
                {isPlaying ? "⏸ Pause Loop" : "▶ Play Loop"}
              </button>
              <button
                onClick={() => handleStep(1)}
                className={styles.ctrlBtn}
                title="Next Frame (Right Arrow)"
              >
                Step ⏭
              </button>
            </div>

            {/* Speed Presets */}
            <div className={styles.speedSelector}>
              <span className={styles.ctrlLabel}>Speed:</span>
              {[0.1, 0.25, 0.5, 1.0].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`${styles.speedBtn} ${speed === s ? styles.activeSpeedBtn : ""}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Sequence Loop Range */}
          <div className={styles.rangeRow}>
            <span className={styles.ctrlLabel}>Loop Sequence:</span>
            <div className={styles.btnGroup}>
              <button
                onClick={() => setRangeMode("unfold")}
                className={`${styles.filterBtn} ${rangeMode === "unfold" ? styles.activeFilter : ""}`}
              >
                3D Unfold (3-37)
              </button>
              <button
                onClick={() => setRangeMode("scroll")}
                className={`${styles.filterBtn} ${rangeMode === "scroll" ? styles.activeFilter : ""}`}
              >
                Dossier Scroll (38-47)
              </button>
              <button
                onClick={() => setRangeMode("all")}
                className={`${styles.filterBtn} ${rangeMode === "all" ? styles.activeFilter : ""}`}
              >
                All 47 Frames
              </button>
            </div>
          </div>

          {/* Onion-Skin Overlay Slider */}
          <div className={styles.onionSkinRow}>
            <div className={styles.onionLabelGroup}>
              <span className={styles.ctrlLabel}>Onion-Skin Compare:</span>
              <span className={styles.opacityValue}>{Math.round(overlayOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={overlayOpacity}
              onChange={handleOpacityChange}
              className={styles.onionSlider}
            />
            <div className={styles.sliderHints}>
              <span>0% (Our Live Code)</span>
              <span>50% (Side-by-Side Blend)</span>
              <span>100% (Real Site Frame)</span>
            </div>
          </div>
        </aside>
      )}
    </>
  );
};
