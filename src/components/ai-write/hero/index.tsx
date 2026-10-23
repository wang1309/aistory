"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";

export interface AiWriteHeroCopy {
  eyebrow: string;
  heading: string;
  highlight: string;
  description: string;
  input_placeholder: string;
  input_button: string;
  input_button_sending: string;
  draft_label?: string;
  char_count_zero?: string;
  enter_hint?: string;
  ink_marks?: string[];
}

export default function AiWriteHero({ hero }: { hero: AiWriteHeroCopy }) {
  const router = useRouter();
  const copy = {
    eyebrow: hero?.eyebrow ?? "",
    heading: hero?.heading ?? "",
    highlight: hero?.highlight ?? "",
    description: hero?.description ?? "",
    inputPlaceholder: hero?.input_placeholder ?? "",
    inputButton: hero?.input_button ?? "",
    inputButtonSending: hero?.input_button_sending ?? "",
    draftLabel: hero?.draft_label || "Draft",
    charCountZero: hero?.char_count_zero || "0 chars",
    enterHint: hero?.enter_hint || "Press Enter to open the editor",
    inkMarks: hero?.ink_marks ?? [],
  };
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [typed, setTyped] = useState({ head: 0, high: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Typewriter: heading first, then highlight, sequential.
  // Runs only after mount so SSR ships the full text (SEO-safe) and there is
  // no hydration mismatch — the fade-in mask hides the "full → empty" swap.
  useEffect(() => {
    if (!mounted) return;
    const headLen = copy.heading.length;
    const highLen = copy.highlight.length;
    const stepMs = 52;
    const pauseMs = 260;
    const startDelay = 500;
    const timers: number[] = [];
    setTyped({ head: 0, high: 0 });
    let delay = startDelay;
    for (let i = 1; i <= headLen; i++) {
      const n = i;
      timers.push(
        window.setTimeout(() => setTyped((t) => ({ ...t, head: n })), delay)
      );
      delay += stepMs;
    }
    delay += pauseMs;
    for (let i = 1; i <= highLen; i++) {
      const n = i;
      timers.push(
        window.setTimeout(() => setTyped((t) => ({ ...t, high: n })), delay)
      );
      delay += stepMs;
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
    // copy.heading/highlight are stable primitives per locale
  }, [mounted, copy.heading, copy.highlight]);

  const headingDone = typed.head >= copy.heading.length;

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
    <section className="relative flex min-h-[92vh] items-center overflow-hidden py-[68px] sm:py-[100px]">
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
              <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.19em] text-accent-copper">
                <span className="inline-block size-1.5 rounded-full bg-accent-copper" />
                {copy.eyebrow}
              </span>
            </div>

            {/* Heading */}
            <h1
              aria-label={`${copy.heading} ${copy.highlight}`}
              className="text-balance font-display font-normal tracking-[-0.07em] text-foreground text-[clamp(3.1rem,6.2vw,4.9rem)] leading-[0.96]"
            >
              <span className="block">
                {mounted ? copy.heading.slice(0, typed.head) : copy.heading}
                {mounted && !headingDone && (
                  <span
                    aria-hidden
                    className="aiwrite-caret ml-[0.08em] inline-block h-[0.82em] w-[0.055em] translate-y-[0.02em] rounded-[1px] bg-primary/70"
                  />
                )}
              </span>
              <span className="relative block mt-1">
                <span className="text-primary">
                  {mounted
                    ? copy.highlight.slice(0, typed.high)
                    : copy.highlight}
                </span>
                {mounted && headingDone && (
                  <span
                    aria-hidden
                    className="aiwrite-caret ml-[0.08em] inline-block h-[0.82em] w-[0.055em] translate-y-[0.02em] rounded-[1px] bg-primary/70"
                  />
                )}
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
              <p className="text-balance font-serif text-[18px] leading-[1.55] text-muted-foreground sm:text-[20px]">
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
                  className="rounded-[2px] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground transition-colors duration-300 hover:bg-accent-sage/50 hover:text-accent-copper"
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
            {/* Outer frame */}
            <div className="rounded-[2px] border border-border bg-card p-[6px] shadow-[8px_9px_0_rgba(36,77,61,0.08)] dark:shadow-[8px_9px_0_rgba(0,0,0,0.45)]">
              {/* Inner core */}
              <div className="overflow-hidden rounded-[1px] bg-card">
                {/* Title bar */}
                <div className="flex items-center gap-2 border-b border-border/20 px-5 py-3">
                  <div className="flex gap-1.5">
                    <span className="size-2.5 rounded-full bg-foreground/[0.08] dark:bg-white/[0.08]" />
                    <span className="size-2.5 rounded-full bg-foreground/[0.08] dark:bg-white/[0.08]" />
                    <span className="size-2.5 rounded-full bg-foreground/[0.08] dark:bg-white/[0.08]" />
                  </div>
                  <span className="ml-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40">
                    {copy.draftLabel}
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
                  className="w-full resize-none bg-transparent px-5 pb-2 pt-4 font-serif text-[16px] leading-[1.7] tracking-normal text-foreground/90 outline-none placeholder:font-light placeholder:text-muted-foreground/50"
                />

                {/* Action bar */}
                <div className="flex items-center justify-between border-t border-border/15 px-5 py-3.5">
                  <span className="text-[11px] text-muted-foreground/30 tabular-nums">
                    {prompt.length > 0 ? `${prompt.length}` : copy.charCountZero}
                  </span>

                  {/* Button with nested icon */}
                  <Button
                    onClick={handleStart}
                    disabled={sending}
                    className="group h-9 rounded-[2px] bg-primary px-4 text-[12px] font-semibold text-primary-foreground shadow-[3px_3px_0_rgba(36,77,61,0.16)] hover:bg-primary/90 active:scale-[0.98]"
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
                        <span className="inline-flex size-5.5 items-center justify-center rounded-full bg-primary-foreground/15 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-[0.5px]">
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
              {copy.enterHint}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
