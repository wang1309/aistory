"use client";

import { useEffect, useState } from "react";
import type { AccentColor } from "@/components/sections/accent";
import {
  AnimatedToolsGrid,
  type ToolCardData,
} from "@/components/blocks/module-tools/animated-tools-grid";

function shuffle<T>(list: T[]): T[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Picks a random subset of the pool on every visit. The initial state mirrors
 * the SSR head of the pool so hydration stays clean; the random selection
 * lands right after mount.
 */
export function RandomToolsGrid({
  tools,
  limit,
  accent = "orange",
  className,
}: {
  tools: ToolCardData[];
  limit: number;
  accent?: AccentColor;
  className?: string;
}) {
  const [picked, setPicked] = useState<ToolCardData[]>(
    () => tools.slice(0, limit)
  );

  useEffect(() => {
    setPicked(
      tools.length > limit ? shuffle(tools).slice(0, limit) : tools
    );
  }, [tools, limit]);

  return (
    <AnimatedToolsGrid
      tools={picked}
      accent={accent}
      className={className}
    />
  );
}
