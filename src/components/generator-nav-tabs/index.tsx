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
  { href: "/story-outline-generator", labelKey: "ai_tools.tools.story_outline_generator.name" },
  { href: "/poem-generator", labelKey: "ai_tools.tools.poem_generator.name" },
  { href: "/comic-generator", labelKey: "ai_tools.tools.comic_generator.name" },
  { href: "/backstory-generator", labelKey: "ai_tools.tools.backstory_generator.name" },
  { href: "/dnd-backstory-generator", labelKey: "ai_tools.tools.dnd_backstory_generator.name" },
  { href: "/book-title-generator", labelKey: "ai_tools.tools.book_title_generator.name" },
  { href: "/poem-title-generator", labelKey: "ai_tools.tools.poem_title_generator.name" },
  { href: "/dialogue-generator", labelKey: "ai_tools.tools.dialogue_generator.name" },
  { href: "/incorrect-quote-generator", labelKey: "ai_tools.tools.incorrect_quote_generator.name" },
  { href: "/tiktok-comment-generator", labelKey: "ai_tools.tools.tiktok_comment_generator.name" },
  { href: "/youtube-name-generator", labelKey: "ai_tools.tools.youtube_name_generator.name" },
  { href: "/youtube-title-generator", labelKey: "ai_tools.tools.youtube_title_generator.name" },
  { href: "/city-nickname-generator", labelKey: "ai_tools.tools.city_nickname_generator.name" },
];

const GAP_PX = 6;

export default function GeneratorNavTabs() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [useMarquee, setUseMarquee] = useState(false);
  const isCenteringRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);
  const scrollPosRef = useRef(0);
  const pausedRef = useRef(false);

  const barePath = pathname.replace(new RegExp(`^/${locale}`), "") || "/";

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setUseMarquee(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const measureOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const realTabs = Array.from(el.querySelectorAll<HTMLElement>(":scope > [data-real]"));
    if (realTabs.length === 0) return;
    const totalWidth = realTabs.reduce((s, c) => s + c.offsetWidth, 0) + (realTabs.length - 1) * GAP_PX;
    setIsOverflowing(totalWidth > el.clientWidth + 2);
  }, []);

  useEffect(() => {
    measureOverflow();
    const ro = new ResizeObserver(measureOverflow);
    if (scrollRef.current) ro.observe(scrollRef.current);
    return () => ro.disconnect();
  }, [measureOverflow, useMarquee]);

  useEffect(() => {
    if (useMarquee || !isOverflowing) return;
    const container = scrollRef.current;
    const active = activeRef.current;
    if (!container || !active) return;

    isCenteringRef.current = true;
    container.scrollTo({
      left: getCenteredTabScrollLeft({
        containerWidth: container.clientWidth,
        contentWidth: container.scrollWidth,
        tabOffsetLeft: active.offsetLeft,
        tabWidth: active.offsetWidth,
      }),
      behavior: "smooth",
    });
    window.setTimeout(() => {
      isCenteringRef.current = false;
    }, 500);
  }, [isOverflowing, barePath, useMarquee]);

  useEffect(() => {
    if (!useMarquee || !isOverflowing) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const el = scrollRef.current;
    if (!el) return;

    const SPEED = 0.5;
    let pos = scrollPosRef.current;

    const tick = () => {
      if (!el || pausedRef.current) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }
      pos += SPEED;
      const half = el.scrollWidth / 2;
      if (pos >= half) pos = 0;
      el.scrollLeft = pos;
      scrollPosRef.current = pos;
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [useMarquee, isOverflowing]);

  const handleMouseEnter = () => { pausedRef.current = true; };
  const handleMouseLeave = () => { pausedRef.current = false; };

  const handleScroll = useCallback(() => {
    if (isCenteringRef.current) return;
    measureOverflow();
  }, [measureOverflow]);

  const renderTab = (tab: NavTab, isClone = false) => {
    const isActive = !isClone && (tab.href === "/" ? barePath === "/" : barePath === tab.href);
    return (
      <Link
        key={tab.href + (isClone ? "-clone" : "")}
        href={`/${locale}${tab.href === "/" ? "" : tab.href}`}
        ref={isActive ? activeRef : undefined}
        data-real={isClone ? undefined : "true"}
        className={[
          "inline-flex items-center shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors duration-200 min-h-[40px]",
          "whitespace-nowrap select-none",
          !useMarquee && "snap-start",
          isActive
            ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/30"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
        ].join(" ")}
        aria-current={isActive ? "page" : undefined}
        aria-hidden={isClone ? "true" : undefined}
        tabIndex={isClone ? -1 : undefined}
      >
        {t(tab.labelKey)}
      </Link>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pt-6 pb-6 md:px-6">
      <div
        className="relative"
        onMouseEnter={useMarquee ? handleMouseEnter : undefined}
        onMouseLeave={useMarquee ? handleMouseLeave : undefined}
      >
        {isOverflowing && (
          <>
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-background to-transparent" />
          </>
        )}

        <div
          ref={scrollRef}
          onScroll={!useMarquee ? handleScroll : undefined}
          className={[
            "flex items-center gap-1.5 scrollbar-none",
            useMarquee ? "overflow-x-hidden" : "overflow-x-auto snap-x snap-mandatory",
          ].join(" ")}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
        >
          {TABS.map(tab => renderTab(tab))}
          {useMarquee && isOverflowing && TABS.map(tab => renderTab(tab, true))}
        </div>
      </div>
    </div>
  );
}
