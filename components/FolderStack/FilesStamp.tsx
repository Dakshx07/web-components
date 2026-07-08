import React from "react";

interface FilesStampProps {
  className?: string;
}

export const FilesStamp: React.FC<FilesStampProps> = ({ className }) => {
  return (
    <div
      className={className}
      style={{
        transform: "rotate(-8deg)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer ring */}
        <circle
          cx="32"
          cy="32"
          r="28"
          stroke="#241416"
          strokeWidth="1.5"
          fill="none"
          opacity="0.35"
        />
        {/* Inner ring */}
        <circle
          cx="32"
          cy="32"
          r="23"
          stroke="#241416"
          strokeWidth="0.5"
          fill="none"
          opacity="0.2"
        />
        {/* "files" text */}
        <text
          x="32"
          y="35"
          textAnchor="middle"
          fontFamily="var(--font-body-serif), Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="#241416"
          opacity="0.4"
        >
          files
        </text>
      </svg>
    </div>
  );
};
