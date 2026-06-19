"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useRef, useEffect, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getCenteredTabScrollLeft } from "./lib";

interface NavTab {
  href: string;
  labelKey: string;
}

const TABS: NavTab[] = [
  { href: "/", labelKey: "ai_tools.tools.story_generator.name" },
  { href: "/story-prompt-generator", labelKey: "ai_tools.tools.story_prompt_generator.name" },
  { href: "/fanfic-generator", labelKey: "ai_tools.tools.fanfic_generator.name" },
  { href: "/fantasy-generator", labelKey: "ai_tools.tools.fantasy_generator.name" },
  { href: "/plot-generator", labelKey: "ai_tools.tools.plot_generator.name" },
  { href: "/poem-generator", labelKey: "ai_tools.tools.poem_generator.name" },
  { href: "/comic-generator", labelKey: "ai_tools.tools.comic_generator.name" },
  { href: "/backstory-generator", labelKey: "ai_tools.tools.backstory_generator.name" },
  { href: "/dnd-backstory-generator", labelKey: "ai_tools.tools.dnd_backstory_generator.name" },
  { href: "/book-title-generator", labelKey: "ai_tools.tools.book_title_generator.name" },
  { href: "/poem-title-generator", labelKey: "ai_tools.tools.poem_title_generator.name" },
  { href: "/dialogue-generator", labelKey: "ai_tools.tools.dialogue_generator.name" },
  { href: "/incorrect-quote-generator", labelKey: "ai_tools.tools.incorrect_quote_generator.name" },
];

export default function GeneratorNavTabs() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const scrollPosRef = useRef(0);
  const pausedRef = useRef(false);

  // Strip locale prefix to get bare path
  const barePath = pathname.replace(new RegExp(`^/${locale}`), "") || "/";

  // Check overflow
  const checkOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setIsOverflowing(el.scrollWidth > el.clientWidth + 2);
  }, []);

  useEffect(() => {
    checkOverflow();
    const ro = new ResizeObserver(checkOverflow);
    if (scrollRef.current) ro.observe(scrollRef.current);
    return () => ro.disconnect();
  }, [checkOverflow]);

  // Keep the active tab centered horizontally without moving the page itself.
  useEffect(() => {
    const container = scrollRef.current;
    const active = activeRef.current;
    if (!isOverflowing || !container || !active) {
      return;
    }

    container.scrollTo({
      left: getCenteredTabScrollLeft({
        containerWidth: container.clientWidth,
        contentWidth: container.scrollWidth,
        tabOffsetLeft: active.offsetLeft,
        tabWidth: active.offsetWidth,
      }),
      behavior: "smooth",
    });
  }, [isOverflowing, barePath]);

  // Marquee animation
  useEffect(() => {
    if (!isOverflowing) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const el = scrollRef.current;
    if (!el) return;

    const SPEED = 0.5; // px per frame
    let pos = scrollPosRef.current;

    const tick = () => {
      if (!el || pausedRef.current) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }
      pos += SPEED;
      // Reset when we've scrolled half the duplicated content
      const half = el.scrollWidth / 2;
      if (pos >= half) pos = 0;
      el.scrollLeft = pos;
      scrollPosRef.current = pos;
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    setIsScrolling(true);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setIsScrolling(false);
    };
  }, [isOverflowing]);

  const handleMouseEnter = () => { pausedRef.current = true; };
  const handleMouseLeave = () => { pausedRef.current = false; };

  const renderTabs = (keySuffix = "") =>
    TABS.map((tab) => {
      const isActive = tab.href === "/" ? barePath === "/" : barePath === tab.href;
      return (
        <Link
          key={tab.href + keySuffix}
          href={`/${locale}${tab.href === "/" ? "" : tab.href}`}
          ref={isActive && !keySuffix ? activeRef : undefined}
          className={[
            "inline-flex items-center shrink-0 rounded-full px-3.5 py-1 text-xs font-medium transition-all duration-200",
            "whitespace-nowrap select-none",
            isActive
              ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/30"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
          ].join(" ")}
          aria-current={isActive ? "page" : undefined}
        >
          {t(tab.labelKey)}
        </Link>
      );
    });

  return (
    <div className="w-full max-w-6xl mx-auto px-6 pt-6 pb-6">
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Fade edges when overflowing */}
        {isOverflowing && (
          <>
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-background to-transparent" />
          </>
        )}

        <div
          ref={scrollRef}
          className={[
            "flex items-center gap-1.5 overflow-x-hidden",
            isScrolling ? "cursor-default" : "overflow-x-auto scrollbar-none",
          ].join(" ")}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* Render tabs twice for seamless marquee loop */}
          {renderTabs()}
          {isOverflowing && renderTabs("-clone")}
        </div>
      </div>
    </div>
  );
}
