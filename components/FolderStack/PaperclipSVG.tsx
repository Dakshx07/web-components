import React from "react";

interface PaperclipSVGProps {
  className?: string;
}

export const PaperclipSVG: React.FC<PaperclipSVGProps> = ({ className }) => {
  return (
    <svg
      className={className}
      width="28"
      height="56"
      viewBox="0 0 28 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: "rotate(-12deg)" }}
    >
      {/* Outer loop */}
      <path
        d="M8 4 C8 2, 12 1, 14 1 C16 1, 20 2, 20 4 L20 42 C20 46, 16 48, 14 48 C12 48, 8 46, 8 42 L8 12"
        stroke="#2A2A2A"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Inner loop */}
      <path
        d="M12 8 L12 40 C12 42, 14 44, 14 44 C14 44, 16 42, 16 40 L16 8"
        stroke="#2A2A2A"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};
