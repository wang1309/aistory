"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

// Common generator section IDs across the site
const GENERATOR_IDS = [
  "craft_story",           // Story Generator (homepage)
  "backstory_generator",   // Backstory Generator
  "book_title_generator",  // Book Title Generator
  "fanfic_generator",      // Fanfic Generator
  "fantasy_generator",     // Fantasy Generator
  "plot_generator",        // Plot Generator
  "poem_generator",        // Poem Generator
  "poem_title_generator",  // Poem Title Generator
  "story_prompt_generator", // Story Prompt Generator
];

interface ScrollToGeneratorProps {
  /** Optional specific target ID (if not provided, will auto-detect) */
  targetId?: string;
  /** Threshold in pixels - button appears when scrolled past this point from the target */
  threshold?: number;
  /** Custom class name */
  className?: string;
}

export default function ScrollToGenerator({
  targetId,
  threshold = 200,
  className,
}: ScrollToGeneratorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const detectedIdRef = useRef<string | null>(null);

  // Find the first available generator element on the page
  const findGeneratorElement = useCallback(() => {
    if (targetId) {
      return document.getElementById(targetId);
    }
    
    for (const id of GENERATOR_IDS) {
      const element = document.getElementById(id);
      if (element) {
        detectedIdRef.current = id;
        return element;
      }
    }
    return null;
  }, [targetId]);

  const checkVisibility = useCallback(() => {
    const targetElement = findGeneratorElement();
    if (!targetElement) {
      setIsVisible(false);
      return;
    }

    const rect = targetElement.getBoundingClientRect();

    // Show button when the target element is scrolled out of view (above viewport)
    // rect.bottom < threshold means the element is mostly above the viewport
    const isScrolledPast = rect.bottom < threshold;

    setIsVisible(isScrolledPast);
  }, [findGeneratorElement, threshold]);

  useEffect(() => {
    // Check visibility on mount
    checkVisibility();

    // Add scroll listener
    window.addEventListener("scroll", checkVisibility, { passive: true });
    window.addEventListener("resize", checkVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", checkVisibility);
      window.removeEventListener("resize", checkVisibility);
    };
  }, [checkVisibility]);

  const scrollToTarget = useCallback(() => {
    const targetElement = findGeneratorElement();
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [findGeneratorElement]);

  return (
    <div
      className={cn(
        "fixed bottom-[88px] right-8 z-50 transition-all duration-300",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none",
        className
      )}
    >
      <Button
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-background/80 backdrop-blur-md border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:scale-110 group"
        aria-label="Scroll to generator"
        onClick={scrollToTarget}
      >
        <ArrowUp className="h-5 w-5 group-hover:-translate-y-1 transition-transform duration-300" />
      </Button>
    </div>
  );
}
