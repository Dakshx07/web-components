import React from "react";
import { PaperclipSVG } from "./PaperclipSVG";

interface ReceiptCardProps {
  className?: string;
  compact?: boolean;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({
  className,
  compact = false,
}) => {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: compact ? "200px" : "260px",
        background: "#F2C94C",
        padding: compact ? "20px 16px 16px" : "28px 20px 20px",
        /* Jagged torn top edge via clip-path */
        clipPath: `polygon(
          0% 4%, 3% 0%, 6% 3%, 9% 1%, 12% 4%, 15% 0%, 18% 3%,
          21% 1%, 24% 4%, 27% 0%, 30% 3%, 33% 1%, 36% 3%,
          39% 0%, 42% 4%, 45% 1%, 48% 3%, 51% 0%, 54% 4%,
          57% 1%, 60% 3%, 63% 0%, 66% 4%, 69% 1%, 72% 3%,
          75% 0%, 78% 3%, 81% 1%, 84% 4%, 87% 0%, 90% 3%,
          93% 1%, 96% 3%, 100% 0%,
          100% 100%, 0% 100%
        )`,
        fontFamily: "var(--font-mono), monospace",
      }}
    >
      {/* Paperclip */}
      <div
        style={{
          position: "absolute",
          top: "-14px",
          left: "8px",
          zIndex: 10,
        }}
      >
        <PaperclipSVG />
      </div>

      {/* RECEIPT header */}
      <div
        style={{
          fontFamily: "var(--font-display-serif), Georgia, serif",
          fontWeight: 700,
          fontSize: compact ? "12px" : "14px",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "#241416",
          marginBottom: compact ? "10px" : "14px",
          paddingTop: "6px",
        }}
      >
        RECEIPT
      </div>

      {/* Fields */}
      <div
        style={{
          fontSize: compact ? "8px" : "9.5px",
          lineHeight: "1.6",
          color: "#3A2A1A",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span style={{ opacity: 0.6 }}>Name</span>
          <span style={{ fontWeight: 500 }}>Elias Varnell</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ opacity: 0.6 }}>Date</span>
          <span style={{ fontWeight: 500 }}>Apr 11, 1965</span>
        </div>
        <div style={{ marginBottom: "12px", lineHeight: "1.5", opacity: 0.8 }}>
          16 Obscura Lane, Sectas7,
          <br />
          New Cartesia, 0027-A
        </div>

        {/* Signature box */}
        <div
          style={{
            border: "1px solid rgba(58, 42, 26, 0.3)",
            borderRadius: "2px",
            padding: compact ? "6px 8px" : "8px 10px",
            minHeight: compact ? "28px" : "36px",
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* Handwritten-style signature squiggle */}
          <svg
            width="100"
            height="20"
            viewBox="0 0 100 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 14 C8 4, 14 16, 20 8 C26 0, 30 14, 38 10 C44 6, 48 16, 54 8 C60 2, 66 14, 72 10 C78 6, 84 14, 90 8 L96 12"
              stroke="#3A2A1A"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
