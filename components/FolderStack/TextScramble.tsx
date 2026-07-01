"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const CHARS = "!<>-_\\/[]{}—=+*^?#@&%ɹɔɛαβδΔΣ";

interface UseTextScrambleOptions {
  /** Characters per tick to resolve (left-to-right) */
  speed?: number;
  /** Milliseconds between ticks */
  tickInterval?: number;
}

export function useTextScramble(
  targetText: string,
  options: UseTextScrambleOptions = {}
) {
  const { speed = 1, tickInterval = 30 } = options;
  const [displayText, setDisplayText] = useState(targetText);
  const [isScrambling, setIsScrambling] = useState(false);
  const resolvedCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const scramble = useCallback(
    (fromText: string, toText: string) => {
      setIsScrambling(true);
      resolvedCountRef.current = 0;

      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        const resolved = resolvedCountRef.current;

        if (resolved >= toText.length) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setDisplayText(toText);
          setIsScrambling(false);
          return;
        }

        // Build the display string: resolved chars + scrambled remainder
        let result = "";
        for (let i = 0; i < toText.length; i++) {
          if (i < resolved) {
            result += toText[i];
          } else if (toText[i] === " ") {
            result += " ";
          } else {
            result += CHARS[Math.floor(Math.random() * CHARS.length)];
          }
        }

        setDisplayText(result);
        resolvedCountRef.current += speed;
      }, tickInterval);
    },
    [speed, tickInterval]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { displayText, isScrambling, scramble };
}

interface TextScrambleProps {
  text: string;
  className?: string;
  scrambleFrom?: string;
  autoStart?: boolean;
  onComplete?: () => void;
}

export const TextScramble: React.FC<TextScrambleProps> = ({
  text,
  className,
  scrambleFrom,
  autoStart = false,
  onComplete,
}) => {
  const { displayText, isScrambling, scramble } = useTextScramble(text, {
    speed: 1,
    tickInterval: 30,
  });
  const hasStarted = useRef(false);

  useEffect(() => {
    if (autoStart && !hasStarted.current) {
      hasStarted.current = true;
      scramble(scrambleFrom || text, text);
    }
  }, [autoStart, scrambleFrom, text, scramble]);

  useEffect(() => {
    if (!isScrambling && hasStarted.current && onComplete) {
      onComplete();
    }
  }, [isScrambling, onComplete]);

  return <span className={className}>{displayText}</span>;
};
