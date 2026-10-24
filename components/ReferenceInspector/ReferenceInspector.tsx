"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./ReferenceInspector.module.css";

type MotionMode = "open" | "close";
type ViewMode = "split" | "onion" | "difference" | "mosby-only" | "local-only";

interface FrameMetadata {
  frameIndex: number;
  timestampMs: number;
  file: string;
  url: string;
}

interface TelemetryPoint {
  frameIndex: number;
  timestampMs: number;
  file: string;
  caseFolder?: {
    rect?: { top: number; left: number; width: number; height: number };
    transform?: string;
    opacity?: string;
  } | null;
  cover?: {
    transform?: string;
  } | null;
  activeGroupInStack?: {
    rect?: { top: number; left: number; width: number; height: number };
    opacity?: string;
  } | null;
  heroTitle?: {
    opacity?: string;
    transform?: string;
  } | null;
  scrapbook?: {
    opacity?: string;
  } | null;
}

export const ReferenceInspector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [motionMode, setMotionMode] = useState<MotionMode>("open");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(0.5);
  const [onionOpacity, setOnionOpacity] = useState<number>(0.5);
  const [showPageGhost, setShowPageGhost] = useState<boolean>(false);

  // Manifests & Telemetry
  const [mosbyFrames, setMosbyFrames] = useState<FrameMetadata[]>([]);
  const [localFrames, setLocalFrames] = useState<FrameMetadata[]>([]);
  const [mosbyTelemetry, setMosbyTelemetry] = useState<TelemetryPoint[]>([]);
  const [localTelemetry, setLocalTelemetry] = useState<TelemetryPoint[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load manifest & telemetry for current motionMode
  useEffect(() => {
    const mosbyFolder = motionMode === "open" ? "mosby_open" : "mosby_close";
    const localFolder = motionMode === "open" ? "local_open" : "local_close";

    Promise.all([
      fetch(`/motion_reference/${mosbyFolder}/manifest.json`).then((r) => r.json()).catch(() => []),
      fetch(`/motion_reference/${localFolder}/manifest.json`).then((r) => r.json()).catch(() => []),
      fetch(`/motion_reference/${mosbyFolder}/telemetry.json`).then((r) => r.json()).catch(() => []),
      fetch(`/motion_reference/${localFolder}/telemetry.json`).then((r) => r.json()).catch(() => []),
    ]).then(([mFrames, lFrames, mTelem, lTelem]) => {
      setMosbyFrames(mFrames);
      setLocalFrames(lFrames);
      setMosbyTelemetry(mTelem);
      setLocalTelemetry(lTelem);
    });
  }, [motionMode]);

  const totalFrames = Math.max(mosbyFrames.length, localFrames.length, 45);

  // Playback Loop
  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const msPerFrame = (1000 / 20) / speed; // 50ms intervals = 20fps baseline
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalFrames);
    }, msPerFrame);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, totalFrames]);

  const handleStep = useCallback((dir: -1 | 1) => {
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev + dir + totalFrames) % totalFrames);
  }, [totalFrames]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handleStep(-1);
      if (e.key === "ArrowRight") handleStep(1);
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleStep]);

  const currentMosby = mosbyFrames[currentIndex];
  const currentLocal = localFrames[currentIndex];
  const currentMosbyTelem = mosbyTelemetry[currentIndex];
  const currentLocalTelem = localTelemetry[currentIndex];

  const currentMs = currentIndex * 50;

  return (
    <>
      {/* Floating Launcher Button */}
      <div className={styles.launcher}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={styles.launcherBtn}
          title="Toggle Motion Studio & Ground-Truth Frame Inspector"
        >
          <span className={styles.pulseDot} />
          <span>🎬 Motion Studio ({motionMode.toUpperCase()}: {currentMs}ms)</span>
        </button>
      </div>

      {/* Full-Screen Page Ghost Overlay (optional projection onto live DOM) */}
      {showPageGhost && currentMosby && (
        <div className={styles.fullPageGhost} style={{ opacity: onionOpacity }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentMosby.url}
            alt="Ground Truth Ghost Overlay"
            className={styles.ghostImg}
          />
        </div>
      )}

      {/* Main Studio Modal */}
      {isOpen && (
        <aside className={styles.studioPanel}>
          {/* Header & Tabs */}
          <div className={styles.studioHeader}>
            <div className={styles.headerTitleGroup}>
              <h2 className={styles.studioTitle}>Mosby Motion Studio</h2>
              <span className={styles.timestampBadge}>{currentMs}ms / 2200ms</span>
            </div>

            {/* Mode Switch: Open vs Close */}
            <div className={styles.modeTabs}>
              <button
                className={`${styles.modeTab} ${motionMode === "open" ? styles.modeTabActive : ""}`}
                onClick={() => {
                  setMotionMode("open");
                  setCurrentIndex(0);
                }}
              >
                📂 Open Motion
              </button>
              <button
                className={`${styles.modeTab} ${motionMode === "close" ? styles.modeTabActive : ""}`}
                onClick={() => {
                  setMotionMode("close");
                  setCurrentIndex(0);
                }}
              >
                📁 Close Motion
              </button>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className={styles.closeBtn}
              aria-label="Close Studio"
            >
              ✕
            </button>
          </div>

          {/* View Mode Toolbar */}
          <div className={styles.viewToolbar}>
            <span className={styles.toolLabel}>View Mode:</span>
            <div className={styles.toolButtonGroup}>
              <button
                className={`${styles.toolBtn} ${viewMode === "split" ? styles.toolBtnActive : ""}`}
                onClick={() => setViewMode("split")}
              >
                🔲 Split Side-by-Side
              </button>
              <button
                className={`${styles.toolBtn} ${viewMode === "onion" ? styles.toolBtnActive : ""}`}
                onClick={() => setViewMode("onion")}
              >
                🧅 Onion-Skin
              </button>
              <button
                className={`${styles.toolBtn} ${viewMode === "difference" ? styles.toolBtnActive : ""}`}
                onClick={() => setViewMode("difference")}
              >
                ⚡ Difference Mode
              </button>
              <button
                className={`${styles.toolBtn} ${viewMode === "mosby-only" ? styles.toolBtnActive : ""}`}
                onClick={() => setViewMode("mosby-only")}
              >
                Mosby Only
              </button>
              <button
                className={`${styles.toolBtn} ${viewMode === "local-only" ? styles.toolBtnActive : ""}`}
                onClick={() => setViewMode("local-only")}
              >
                Local Only
              </button>
            </div>

            {/* Ghost to Page Toggle */}
            <label className={styles.ghostCheckbox}>
              <input
                type="checkbox"
                checked={showPageGhost}
                onChange={(e) => setShowPageGhost(e.target.checked)}
              />
              <span>Ghost to Live Page</span>
            </label>
          </div>

          {/* Frame Display Canvas */}
          <div className={styles.canvasContainer}>
            {viewMode === "split" && (
              <div className={styles.splitGrid}>
                {/* Left: Mosby Ground Truth */}
                <div className={styles.pane}>
                  <div className={styles.paneBadge}>MOSBY (GROUND TRUTH)</div>
                  {currentMosby ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentMosby.url} alt="Mosby Frame" className={styles.paneImg} />
                  ) : (
                    <div className={styles.paneEmpty}>No frame</div>
                  )}
                </div>

                {/* Right: Local Implementation */}
                <div className={styles.pane}>
                  <div className={`${styles.paneBadge} ${styles.paneBadgeLocal}`}>LOCAL IMPLEMENTATION</div>
                  {currentLocal ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentLocal.url} alt="Local Frame" className={styles.paneImg} />
                  ) : (
                    <div className={styles.paneEmpty}>No frame</div>
                  )}
                </div>
              </div>
            )}

            {(viewMode === "onion" || viewMode === "difference") && (
              <div className={styles.onionContainer}>
                {/* Background: Local */}
                {currentLocal && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentLocal.url} alt="Local Frame" className={styles.onionBase} />
                )}
                {/* Foreground: Mosby with adjustable opacity or difference */}
                {currentMosby && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentMosby.url}
                    alt="Mosby Overlay"
                    className={`${styles.onionTop} ${viewMode === "difference" ? styles.onionDiff : ""}`}
                    style={{ opacity: viewMode === "difference" ? 1 : onionOpacity }}
                  />
                )}
                <div className={styles.onionLegend}>
                  <span>Base: Local</span> • <span>Overlay: Mosby ({Math.round(onionOpacity * 100)}%)</span>
                </div>
              </div>
            )}

            {viewMode === "mosby-only" && currentMosby && (
              <div className={styles.singleContainer}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentMosby.url} alt="Mosby Only" className={styles.paneImg} />
                <div className={styles.paneBadge}>MOSBY GROUND TRUTH ({currentMs}ms)</div>
              </div>
            )}

            {viewMode === "local-only" && currentLocal && (
              <div className={styles.singleContainer}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentLocal.url} alt="Local Only" className={styles.paneImg} />
                <div className={`${styles.paneBadge} ${styles.paneBadgeLocal}`}>LOCAL IMPLEMENTATION ({currentMs}ms)</div>
              </div>
            )}
          </div>

          {/* Telemetry Comparison HUD */}
          <div className={styles.telemetryHud}>
            <div className={styles.telemetryCol}>
              <div className={styles.telemHeader}>MOSBY TELEMETRY</div>
              <div className={styles.telemRow}>
                <span className={styles.telemKey}>Folder Transform:</span>
                <span className={styles.telemVal}>{currentMosbyTelem?.caseFolder?.transform || "none"}</span>
              </div>
              <div className={styles.telemRow}>
                <span className={styles.telemKey}>Flap Cover:</span>
                <span className={styles.telemVal}>{currentMosbyTelem?.cover?.transform || "none"}</span>
              </div>
              <div className={styles.telemRow}>
                <span className={styles.telemKey}>Hero Opacity:</span>
                <span className={styles.telemVal}>{currentMosbyTelem?.heroTitle?.opacity || "0"}</span>
              </div>
            </div>

            <div className={styles.telemetryCol}>
              <div className={`${styles.telemHeader} ${styles.telemHeaderLocal}`}>LOCAL TELEMETRY</div>
              <div className={styles.telemRow}>
                <span className={styles.telemKey}>Folder Transform:</span>
                <span className={styles.telemVal}>{currentLocalTelem?.caseFolder?.transform || "none"}</span>
              </div>
              <div className={styles.telemRow}>
                <span className={styles.telemKey}>Flap Cover:</span>
                <span className={styles.telemVal}>{currentLocalTelem?.cover?.transform || "none"}</span>
              </div>
              <div className={styles.telemRow}>
                <span className={styles.telemKey}>Hero Opacity:</span>
                <span className={styles.telemVal}>{currentLocalTelem?.heroTitle?.opacity || "0"}</span>
              </div>
            </div>
          </div>

          {/* Time Scrubber Bar */}
          <div className={styles.scrubberSection}>
            <div className={styles.scrubberHeader}>
              <span className={styles.scrubberTime}>Frame {currentIndex + 1} of {totalFrames}</span>
              <span className={styles.scrubberMs}>{currentMs}ms</span>
            </div>
            <input
              type="range"
              min={0}
              max={totalFrames - 1}
              value={currentIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentIndex(parseInt(e.target.value, 10));
              }}
              className={styles.scrubberSlider}
            />
          </div>

          {/* Controls Bar */}
          <div className={styles.controlsBar}>
            <div className={styles.playbackGroup}>
              <button onClick={() => handleStep(-1)} className={styles.ctrlBtn} title="Step -50ms (Left Arrow)">
                ⏮ -50ms
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`${styles.ctrlBtn} ${isPlaying ? styles.activeCtrlBtn : ""}`}
              >
                {isPlaying ? "⏸ Pause" : "▶ Play Loop"}
              </button>
              <button onClick={() => handleStep(1)} className={styles.ctrlBtn} title="Step +50ms (Right Arrow)">
                +50ms ⏭
              </button>
            </div>

            {/* Onion Skin Opacity Slider */}
            {(viewMode === "onion" || showPageGhost) && (
              <div className={styles.sliderControl}>
                <span className={styles.ctrlLabel}>Overlay Opacity:</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={onionOpacity}
                  onChange={(e) => setOnionOpacity(parseFloat(e.target.value))}
                  className={styles.opacitySlider}
                />
                <span className={styles.sliderVal}>{Math.round(onionOpacity * 100)}%</span>
              </div>
            )}

            {/* Playback Speed */}
            <div className={styles.speedGroup}>
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
        </aside>
      )}
    </>
  );
};
