"use client";

import dynamic from "next/dynamic";

const Agentation = dynamic(
  // @ts-expect-error - optional dev package
  () => import("agentation").then((mod) => mod.Agentation).catch(() => () => null),
  { ssr: false }
);

export function AgentationDev() {
  if (process.env.NODE_ENV !== "development") return null;
  return <Agentation />;
}
