"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";

interface HeroCopy {
  eyebrow: string;
  heading: string;
  highlight: string;
  description: string;
  inputPlaceholder: string;
  inputButton: string;
  inputButtonSending: string;
  inkMarks: string[];
}

function getHeroCopy(locale: string): HeroCopy {
  if (locale.startsWith("zh")) {
    return {
      eyebrow: "创意写作工作台",
      heading: "你的风格，",
      highlight: "你的故事",
      description:
        "不是另一个千篇一律的 AI 写作工具。它记住你的角色，学习你的笔触，在你停顿的地方接续 — 像一个真正读过你作品的搭档。",
      inputPlaceholder: "写下你故事的开头…",
      inputButton: "开始写作",
      inputButtonSending: "正在打开…",
      inkMarks: ["奇幻", "言情", "悬疑", "同人", "诗歌", "科幻"],
    };
  }
  if (locale.startsWith("de")) {
    return {
      eyebrow: "Kreatives Schreibatelier",
      heading: "Dein Stil,",
      highlight: "deine Geschichte",
      description:
        "Nicht noch ein generisches AI-Tool. Es merkt sich deine Charaktere, lernt deinen Stil und schreibt weiter, wo du pausierst — wie ein Partner, der dein Werk wirklich gelesen hat.",
      inputPlaceholder: "Schreibe den Anfang deiner Geschichte…",
      inputButton: "Loslegen",
      inputButtonSending: "Öffne…",
      inkMarks: ["Fantasy", "Romanze", "Mystery", "Fanfic", "Poesie", "Sci-Fi"],
    };
  }
  return {
    eyebrow: "Creative Writing Workbench",
    heading: "Your voice,",
    highlight: "your story",
    description:
      "Not another generic AI writing tool. It remembers your characters, learns your style, and picks up where you pause — like a partner who has actually read your work.",
    inputPlaceholder: "Write the opening of your story…",
    inputButton: "Start Writing",
    inputButtonSending: "Opening…",
    inkMarks: ["Fantasy", "Romance", "Mystery", "Fanfic", "Poetry", "Sci-Fi"],
  };
}

export default function AiWriteHero() {
  const locale = useLocale();
  const router = useRouter();
  const copy = getHeroCopy(locale);
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleStart = useCallback(() => {
    setSending(true);
    if (typeof window !== "undefined" && prompt.trim()) {
      try {
        window.localStorage.setItem(
          "ai-write:generator-prefill",
          JSON.stringify({ title: "", content: prompt.trim() })
        );
      } catch {
        // ignore
      }
    }
    router.push("/ai-write/editor?source=landing");
  }, [prompt, router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleStart();
      }
    },
    [handleStart]
  );

  const cubic = "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]";

  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden py-20 lg:py-28">
      {/* Subtle paper noise overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.018] dark:opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "180px 180px",
        }}
      />

      {/* Warm radial glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_30%_20%,oklch(0.96_0.02_65),transparent)] dark:bg-[radial-gradient(ellipse_70%_50%_at_30%_20%,oklch(0.16_0.02_55),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.03]"
          style={{
            backgroundImage: "var(--bg-grid)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12 lg:gap-12">
          {/* Left column — editorial headline */}
          <div
            className={`lg:col-span-7 ${cubic} ${
              mounted
                ? "translate-y-0 opacity-100"
                : "translate-y-12 opacity-0"
            }`}
          >
            {/* Eyebrow */}
            <div
              className={`mb-6 ${cubic} ${
                mounted
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: "100ms" }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/80 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.18em] font-medium text-muted-foreground backdrop-blur-sm">
                <span className="inline-block size-1.5 rounded-full bg-primary/70" />
                {copy.eyebrow}
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-balance font-display font-bold tracking-tight text-foreground text-[clamp(2.75rem,6vw,5.5rem)] leading-[1.05]">
              <span className="block">{copy.heading}</span>
              <span className="relative block mt-1">
                <span
                  className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent"
                  style={{
                    backgroundSize: "200% 100%",
                  }}
                >
                  {copy.highlight}
                </span>
                {/* Decorative underline */}
                <svg
                  className="mt-2 h-3 w-48 text-primary/20 sm:h-4 sm:w-56"
                  viewBox="0 0 200 12"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M1 8c40-6 80-6 120-2s60 4 78-2"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </span>
            </h1>

            {/* Description */}
            <div
              className={`mt-8 max-w-lg ${cubic} ${
                mounted
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: "200ms" }}
            >
              <p className="text-[1.05rem] text-balance leading-relaxed text-muted-foreground/75 font-light sm:text-lg">
                {copy.description}
              </p>
            </div>

            {/* Ink marks — subtle, editorial */}
            <div
              className={`mt-10 flex flex-wrap gap-2.5 ${cubic} ${
                mounted
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: "300ms" }}
            >
              {copy.inkMarks.map((mark) => (
                <span
                  key={mark}
                  className="rounded-full px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground/50 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-primary/70 hover:bg-primary/[0.06]"
                >
                  {mark}
                </span>
              ))}
            </div>
          </div>

          {/* Right column — manuscript input */}
          <div
            className={`lg:col-span-5 ${cubic} ${
              mounted
                ? "translate-y-0 opacity-100"
                : "translate-y-16 opacity-0"
            }`}
            style={{ transitionDelay: "250ms" }}
          >
            {/* Outer bezel */}
            <div className="rounded-[1.75rem] border border-border/30 bg-foreground/[0.02] p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_-8px_rgba(0,0,0,0.08)] dark:bg-white/[0.03] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_8px_32px_-8px_rgba(0,0,0,0.5)]">
              {/* Inner core */}
              <div className="overflow-hidden rounded-[1.25rem] bg-card">
                {/* Title bar */}
                <div className="flex items-center gap-2 border-b border-border/20 px-5 py-3">
                  <div className="flex gap-1.5">
                    <span className="size-2.5 rounded-full bg-foreground/[0.08] dark:bg-white/[0.08]" />
                    <span className="size-2.5 rounded-full bg-foreground/[0.08] dark:bg-white/[0.08]" />
                    <span className="size-2.5 rounded-full bg-foreground/[0.08] dark:bg-white/[0.08]" />
                  </div>
                  <span className="ml-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40">
                    {locale.startsWith("zh") ? "草稿" : locale.startsWith("de") ? "Entwurf" : "Draft"}
                  </span>
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={copy.inputPlaceholder}
                  rows={6}
                  className="w-full resize-none bg-transparent px-5 pt-4 pb-2 text-[0.95rem] leading-[1.75] tracking-wide text-foreground/90 outline-none placeholder:text-muted-foreground/30 placeholder:font-light"
                />

                {/* Action bar */}
                <div className="flex items-center justify-between border-t border-border/15 px-5 py-3.5">
                  <span className="text-[11px] text-muted-foreground/30 tabular-nums">
                    {prompt.length > 0
                      ? `${prompt.length}`
                      : locale.startsWith("zh")
                        ? "0 字"
                        : "0 chars"}
                  </span>

                  {/* Button with nested icon */}
                  <Button
                    onClick={handleStart}
                    disabled={sending}
                    className="group h-9 rounded-full bg-foreground px-4 text-[13px] font-medium text-background hover:bg-foreground/85 active:scale-[0.97] dark:bg-white dark:text-foreground dark:hover:bg-white/90"
                    style={{
                      transition:
                        "all 400ms cubic-bezier(0.32,0.72,0,1)",
                    }}
                  >
                    {sending ? (
                      copy.inputButtonSending
                    ) : (
                      <span className="flex items-center gap-2">
                        {copy.inputButton}
                        <span className="inline-flex size-5.5 items-center justify-center rounded-full bg-background/15 dark:bg-foreground/15 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[0.5px]">
                          <Icon name="RiArrowRightLine" className="size-3 opacity-70" />
                        </span>
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Subtle caption below card */}
            <p className="mt-4 text-center text-[11px] tracking-wide text-muted-foreground/30">
              {locale.startsWith("zh")
                ? "按 Enter 直接进入编辑器"
                : locale.startsWith("de")
                  ? "Enter drücken, um den Editor zu öffnen"
                  : "Press Enter to open the editor"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
