"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./FolderStackAnimation.module.css";

interface WindRoseProps {
  src: string;
  alt?: string;
  hideOnMobile?: boolean;
}

export const WindRose: React.FC<WindRoseProps> = ({
  src,
  alt = "Wind Rose",
  hideOnMobile = false,
}) => {
  const roseRef = useRef<HTMLDivElement>(null);
  const [angle, setAngle] = useState<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!roseRef.current) return;
      const rect = roseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      // Authentic Mosby Files calculation:
      // Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90 - 45 = + 45
      const deg = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 45;
      setAngle(deg);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={roseRef}
      className={`${styles.windRose} ${
        hideOnMobile ? styles.windRoseHideOnMobile : ""
      }`}
    >
      <img
        src={src}
        alt={alt}
        style={{ transform: `rotate(${angle}deg)` }}
      />
    </div>
  );
};
