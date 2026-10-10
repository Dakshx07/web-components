"use client";

import React from "react";
import { WindRose } from "./WindRose";
import styles from "./FolderStackAnimation.module.css";

const WIND_ROSE_IMAGES = [
  { src: "/images/wind-roses/rose-0.png", hideOnMobile: false },
  { src: "/images/wind-roses/rose-1.png", hideOnMobile: false },
  { src: "/images/wind-roses/rose-2.avif", hideOnMobile: true },
  { src: "/images/wind-roses/rose-3.png", hideOnMobile: false },
  { src: "/images/wind-roses/rose-4.png", hideOnMobile: true },
  { src: "/images/wind-roses/rose-5.png", hideOnMobile: false },
  { src: "/images/wind-roses/rose-6.avif", hideOnMobile: false },
];

export const TheFooter: React.FC = () => {
  return (
    <div className={styles.theFooter}>
      {/* 7 Interactive Wind-Rose / Compass Symbols */}
      <div className={styles.theFooterWindRoses}>
        {WIND_ROSE_IMAGES.map((item, idx) => (
          <WindRose
            key={idx}
            src={item.src}
            alt={`Wind Rose ${idx + 1}`}
            hideOnMobile={item.hideOnMobile}
          />
        ))}
      </div>

      {/* Archival Scale Bar, Year, and Tubik Studio Signature */}
      <div className={styles.theFooterBottom}>
        <img
          className={styles.theFooterScale}
          src="/images/scale.svg"
          alt="Architectural Scale 0 4 8 16 32"
        />
        <span className={styles.theFooterYear}>
          © {new Date().getFullYear()}
        </span>
        <a
          className={styles.theFooterSignature}
          href="https://tubikstudio.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>
            CRAFTED WITH ♥ BY <u>DAKSH</u>
          </span>
        </a>
      </div>
    </div>
  );
};
