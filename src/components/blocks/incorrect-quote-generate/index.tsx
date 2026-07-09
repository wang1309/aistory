"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Settings2 } from "lucide-react";
import GeneratorNavTabs from "@/components/generator-nav-tabs";
import TurnstileInvisible, {
  TurnstileInvisibleHandle,
} from "@/components/TurnstileInvisible";
import { buildContinueRoute } from "@/components/ai-write/workbench/_lib";
import { useRouter } from "@/i18n/navigation";
import Icon from "@/components/icon";
import { Button } from "@/components/ui/button";
import ShareResultButton from "@/components/story/share-result-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  IncorrectQuoteGenerate as IncorrectQuoteGenerateType,
} from "@/types/blocks/incorrect-quote-generate";
import type {
  IncorrectQuoteLength,
  IncorrectQuoteMode,
  IncorrectQuoteRelationshipMode,
  IncorrectQuoteSafetyOptions,
  IncorrectQuoteTone,
} from "@/types/incorrect-quote";
import { LANGUAGE_OPTIONS } from "@/lib/language-options";
import { IncorrectQuoteStorage } from "@/lib/incorrect-quote-storage";
import { cn } from "@/lib/utils";
import IncorrectQuoteBreadcrumb from "./breadcrumb";
import { pickRandomIncorrectQuotePreset } from "./lib";

interface IncorrectQuoteGenerateProps {
  section?: IncorrectQuoteGenerateType;
}

const MIN_CHARACTER_FIELDS = 1;
const MAX_CHARACTERS = 6;
const DEFAULT_CHARACTERS = [""];
const RELATIONSHIP_OPTIONS: IncorrectQuoteRelationshipMode[] = [
  "platonic",
  "rivals",
  "found_family",
  "chaotic_team",
];
const TONE_OPTIONS: IncorrectQuoteTone[] = [
  "absurd",
  "dry",
  "sarcastic",
  "wholesome",
  "dramatic",
];
const LENGTH_OPTIONS: IncorrectQuoteLength[] = [
  "one_liner",
  "mini_exchange",
  "extended_exchange",
];
const MODE_OPTIONS: IncorrectQuoteMode[] = ["fast", "standard", "creative"];

function parseStreamLine(line: string): string | null {
  if (!line.startsWith("0:")) {
    return null;
  }

  try {
    return JSON.parse(line.slice(2)) as string;
  } catch {
    return null;
  }
}

const FLUID_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

/** Animated ellipsis — three dots that pulse in sequence. */
function GeneratingDots({ reduceMotion }: { reduceMotion: boolean | null }) {
  if (reduceMotion) {
    return <span className="text-orange-500">...</span>;
  }

  return (
    <span className="inline-flex items-center gap-[2px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block size-1 rounded-full bg-orange-500 dark:bg-orange-400"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

/** A single skeleton bar with a warm shimmer sweep crossing left → right. */
function ShimmerBar({
  className,
  delay = 0,
  reduceMotion,
}: {
  className?: string;
  delay?: number;
  reduceMotion: boolean | null;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full bg-orange-500/[0.08] dark:bg-orange-400/[0.08]",
        className
      )}
    >
      {!reduceMotion && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/25 to-transparent dark:via-orange-400/25"
          animate={{ x: ["-100%", "300%"] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            delay,
            ease: FLUID_EASE,
          }}
        />
      )}
    </div>
  );
}

/**
 * "Composing" state shown in the output panel while the stream has not yet
 * produced its first token. Once `generatedQuote` receives content, this is
 * replaced by the live streamed text.
 */
function GeneratingState({
  label,
  reduceMotion,
}: {
  label: string;
  reduceMotion: boolean | null;
}) {
  // Two speaker turns, each with a name stub + two dialogue lines — hints at
  // the speaker-labelled exchange that is about to stream in.
  const turns = [
    { nameWidth: "w-16", lines: ["w-full", "w-[82%]"] },
    { nameWidth: "w-12", lines: ["w-[90%]", "w-[68%]"] },
  ];

  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Status header: bezel quote glyph + pulse dot + label */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-orange-500/15 bg-orange-500/[0.06] p-1 dark:bg-orange-400/[0.06]">
          <div className="flex size-7 items-center justify-center rounded-lg bg-background/70">
            <motion.span
              className="font-display text-sm italic font-bold text-orange-600 dark:text-orange-400"
              animate={
                reduceMotion
                  ? {}
                  : { rotate: [0, -10, 10, -6, 0], scale: [1, 1.12, 1] }
              }
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: FLUID_EASE,
              }}
            >
              &ldquo;
            </motion.span>
          </div>
        </div>

        <span className="relative flex size-2 shrink-0">
          {!reduceMotion && (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-orange-500/50 dark:bg-orange-400/50" />
          )}
          <span className="relative inline-flex size-2 rounded-full bg-orange-500 dark:bg-orange-400" />
        </span>

        <span className="text-sm font-medium text-foreground/80">
          {label}
        </span>
        <GeneratingDots reduceMotion={reduceMotion} />
      </div>

      {/* Skeleton dialogue preview */}
      <div className="space-y-5">
        {turns.map((turn, turnIndex) => (
          <div key={turnIndex} className="space-y-2.5">
            <ShimmerBar
              className={cn("h-2.5", turn.nameWidth)}
              delay={turnIndex * 0.2}
              reduceMotion={reduceMotion}
            />
            {turn.lines.map((lineWidth, lineIndex) => (
              <ShimmerBar
                key={lineIndex}
                className={cn("h-2.5", lineWidth)}
                delay={turnIndex * 0.2 + (lineIndex + 1) * 0.12}
                reduceMotion={reduceMotion}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Progress sweep bar */}
      <div className="relative h-1 overflow-hidden rounded-full bg-orange-500/10 dark:bg-orange-400/10">
        {!reduceMotion && (
          <motion.div
            className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-orange-500 to-transparent dark:via-orange-400"
            animate={{ x: ["-100%", "300%"] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: FLUID_EASE,
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function IncorrectQuoteGenerate({
  section,
}: IncorrectQuoteGenerateProps) {
  const locale = useLocale();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);

  const [prompt, setPrompt] = useState("");
  const [characters, setCharacters] = useState<string[]>(DEFAULT_CHARACTERS);
  const [relationshipMode, setRelationshipMode] =
    useState<IncorrectQuoteRelationshipMode>("platonic");
  const [tone, setTone] = useState<IncorrectQuoteTone>("absurd");
  const [length, setLength] = useState<IncorrectQuoteLength>("mini_exchange");
  const [mode, setMode] = useState<IncorrectQuoteMode>("standard");
  const [outputLanguage, setOutputLanguage] = useState(locale);
  const [safety, setSafety] = useState<IncorrectQuoteSafetyOptions>({
    noRomance: false,
    avoidShipping: false,
    keepItClean: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatedQuote, setGeneratedQuote] = useState("");
  const [lastCompletedQuote, setLastCompletedQuote] = useState("");

  const t = useCallback(
    (path: string, fallback: string) => {
      const keys = path.split(".");
      let value: unknown = section;

      for (const key of keys) {
        value = (value as Record<string, unknown> | undefined)?.[key];
      }

      return typeof value === "string" && value.trim() ? value : fallback;
    },
    [section]
  );

  const validCharacters = useMemo(
    () => characters.map((name) => name.trim()).filter(Boolean),
    [characters]
  );
  const randomPrompts = useMemo(() => section?.random_prompts || [], [section]);

  const relationshipOptions = useMemo(
    () =>
      RELATIONSHIP_OPTIONS.map((value) => ({
        value,
        label: t(`relationship_mode.${value}`, "Platonic"),
      })),
    [t]
  );
  const toneOptions = useMemo(
    () =>
      TONE_OPTIONS.map((value) => ({
        value,
        label: t(`tone.${value}`, "Absurd"),
      })),
    [t]
  );
  const lengthOptions = useMemo(
    () =>
      LENGTH_OPTIONS.map((value) => ({
        value,
        label: t(`length.${value}`, "Mini exchange"),
      })),
    [t]
  );
  const modeOptions = useMemo(
    () =>
      MODE_OPTIONS.map((value) => ({
        value,
        label:
          t(`ai_models.${value}`, "") ||
          t(`mode.${value}`, "") ||
          (value === "fast"
            ? "Fast"
            : value === "creative"
              ? "Creative"
              : "Standard"),
        description:
          t(`ai_models.${value}_description`, "") ||
          (value === "fast"
            ? "Quickest quote iteration"
            : value === "creative"
              ? "Looser and punchier output"
              : "Balanced quality and speed"),
      })),
    [t]
  );

  const updateCharacter = useCallback((index: number, value: string) => {
    setCharacters((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item))
    );
  }, []);

  const addCharacter = useCallback(() => {
    setCharacters((current) =>
      current.length >= MAX_CHARACTERS ? current : [...current, ""]
    );
  }, []);

  const removeCharacter = useCallback((index: number) => {
    setCharacters((current) => {
      if (current.length <= MIN_CHARACTER_FIELDS) {
        return [""];
      }

      const next = current.filter((_, itemIndex) => itemIndex !== index);
      return next.length > 0 ? next : [""];
    });
  }, []);

  const handleRandomPrompt = useCallback(() => {
    const preset = pickRandomIncorrectQuotePreset({
      presets: randomPrompts,
    });

    setPrompt(preset.prompt);
    setCharacters(preset.characters);
    setGeneratedQuote("");
    setLastCompletedQuote("");
    toast.success(
      t("success.random_prompt_selected", "Random preset selected.")
    );
  }, [randomPrompts, t]);

  const toggleSafety = useCallback(
    (key: keyof IncorrectQuoteSafetyOptions, checked: boolean) => {
      setSafety((current) => ({ ...current, [key]: checked }));
    },
    []
  );

  const saveCompletedQuote = useCallback(
    (output: string) => {
      IncorrectQuoteStorage.saveHistory({
        prompt: prompt.trim(),
        characters: validCharacters,
        relationshipMode,
        tone,
        length,
        mode,
        safety,
        output,
      });
    },
    [length, mode, prompt, relationshipMode, safety, tone, validCharacters]
  );

  const runGeneration = useCallback(
    async (turnstileToken: string) => {

      try {
        const response = await fetch("/api/incorrect-quote-generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            turnstileToken,
            prompt,
            locale,
            characters: validCharacters,
            relationshipMode,
            tone,
            length,
            mode,
            outputLanguage,
            safety,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error("request failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const text = parseStreamLine(line);
            if (text) {
              accumulated += text;
              setGeneratedQuote(accumulated);
            }
          }
        }

        buffer += decoder.decode();

        const trailingText = parseStreamLine(buffer);
        if (trailingText) {
          accumulated += trailingText;
          setGeneratedQuote(accumulated);
        }

        if (!accumulated.trim()) {
          throw new Error("empty result");
        }

        saveCompletedQuote(accumulated);
        setLastCompletedQuote(accumulated);
        toast.success(t("success.generated", "Incorrect quote generated."));
      } catch (error) {
        console.error("Incorrect quote generation failed:", error);
        toast.error(t("errors.generate_failed", "Failed to generate incorrect quote."));
      } finally {
        setIsGenerating(false);
      }
    },
    [
      length,
      locale,
      mode,
      outputLanguage,
      prompt,
      relationshipMode,
      safety,
      saveCompletedQuote,
      t,
      tone,
      validCharacters,
    ]
  );

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) {
      toast.error(t("validation.prompt_required", "Enter a prompt first."));
      return;
    }

    setIsGenerating(true);
    setGeneratedQuote("");
    turnstileRef.current?.execute();
  }, [prompt, t]);

  const handleCopy = useCallback(async () => {
    if (!generatedQuote.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedQuote);
      toast.success(t("success.copied", "Copied to clipboard."));
    } catch (error) {
      console.error("Failed to copy incorrect quote:", error);
    }
  }, [generatedQuote, t]);

  const handleContinue = useCallback(() => {
    const content = generatedQuote.trim();
    if (!content) {
      return;
    }

    try {
      window.localStorage.setItem(
        "ai-write:generator-prefill",
        JSON.stringify({
          title: prompt.trim().slice(0, 30) || "Incorrect quote",
          content,
        })
      );
    } catch {
      // ignore prefill cache failures
    }

    toast.success(t("success.continued", "Draft sent to AI Write."));
    router.push(
      buildContinueRoute({ source: "incorrect-quote-generator" }) as any
    );
  }, [generatedQuote, prompt, router, t]);

  return (
    <section
      id="incorrect_quote_generator"
      className="overflow-hidden py-16 text-foreground selection:bg-orange-500/20 lg:py-24"
    >
      {/* Subtle warm top glow + dot texture */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.05_65),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.18_0.04_65),transparent)]" />
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-orange-500/[0.04] via-orange-500/[0.02] to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]"
          style={{ backgroundImage: "var(--bg-grid)", backgroundSize: "40px 40px" }}
        />
      </div>

      <div className="container relative mx-auto px-4 md:px-6">
        {/* Breadcrumb */}
        <div className="mb-10">
          <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
            <IncorrectQuoteBreadcrumb
              homeText={t("ui.breadcrumb_home", "Home")}
              currentText={t("ui.breadcrumb_current", "Incorrect Quote Generator")}
            />
          </div>
        </div>

        {/* Header */}
        <div className="relative mx-auto mb-14 max-w-2xl text-center">
          {/* Ambient: floating quote glyphs */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-visible" aria-hidden>
            {/* Floating opening quote — left */}
            {!reduceMotion && (
              <motion.div
                className="pointer-events-none absolute z-[1] hidden text-orange-500/40 dark:text-orange-400/40 sm:block"
                style={{ left: "8%", top: "26%" }}
                initial={{ opacity: 0, y: 0, rotate: -8 }}
                animate={{ opacity: [0, 0.55, 0.55, 0], y: [0, -10, 0], rotate: [-8, -3, -8] }}
                transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              >
                <span className="block font-display text-5xl italic font-bold">&ldquo;</span>
              </motion.div>
            )}

            {/* Floating ellipsis — right */}
            {!reduceMotion && (
              <motion.div
                className="pointer-events-none absolute z-[1] hidden text-orange-500/35 dark:text-orange-400/35 sm:block"
                style={{ right: "10%", top: "36%" }}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 0.5, 0.5, 0], y: [0, 8, 0] }}
                transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              >
                <span className="block font-display text-4xl font-bold tracking-[0.1em]">&hellip;</span>
              </motion.div>
            )}

            {/* Floating guillemet — right bottom */}
            {!reduceMotion && (
              <motion.div
                className="pointer-events-none absolute z-[1] hidden text-orange-500/30 dark:text-orange-400/30 sm:block"
                style={{ right: "20%", bottom: "18%" }}
                initial={{ opacity: 0, y: 0, rotate: 6 }}
                animate={{ opacity: [0, 0.45, 0.45, 0], y: [0, -7, 0], rotate: [6, 10, 6] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              >
                <span className="block font-display text-3xl italic font-bold">&laquo;</span>
              </motion.div>
            )}

            {/* Floating closing quote — left bottom */}
            {!reduceMotion && (
              <motion.div
                className="pointer-events-none absolute z-[1] hidden text-orange-500/30 dark:text-orange-400/30 sm:block"
                style={{ left: "14%", bottom: "22%" }}
                initial={{ opacity: 0, y: 0, rotate: 0 }}
                animate={{ opacity: [0, 0.4, 0.4, 0], y: [0, 6, 0], rotate: [0, -8, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              >
                <span className="block font-display text-3xl italic font-bold">&rdquo;</span>
              </motion.div>
            )}

            {/* Warm dust motes */}
            {!reduceMotion &&
              [
                { left: "12%", top: "16%", size: 4, delay: 0, dur: 10, peak: 0.22 },
                { left: "84%", top: "20%", size: 5, delay: 1.4, dur: 12, peak: 0.2 },
                { left: "22%", top: "72%", size: 4, delay: 2.8, dur: 9, peak: 0.18 },
                { left: "78%", top: "68%", size: 5, delay: 1.8, dur: 11, peak: 0.2 },
                { left: "32%", top: "10%", size: 4, delay: 3.5, dur: 8, peak: 0.16 },
                { left: "68%", top: "82%", size: 5, delay: 4.2, dur: 13, peak: 0.2 },
                { left: "8%", top: "52%", size: 4, delay: 2.2, dur: 9, peak: 0.18 },
                { left: "90%", top: "48%", size: 5, delay: 5, dur: 11, peak: 0.2 },
              ].map((d, i) => (
                <motion.span
                  key={i}
                  className={cn(
                    "absolute rounded-full bg-orange-500 dark:bg-orange-400",
                    i >= 4 && "hidden sm:block"
                  )}
                  style={{ left: d.left, top: d.top, width: d.size, height: d.size }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, d.peak, d.peak * 0.5, 0] }}
                  transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: "easeInOut" }}
                />
              ))}

            {/* Editorial watermark: scattered quote glyphs */}
            <div className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden select-none sm:block" aria-hidden="true">
              <span className="absolute left-[6%] top-[20%] font-display text-2xl italic font-bold text-orange-500/[0.08] dark:text-orange-400/[0.08]">&ldquo;</span>
              <span className="absolute right-[7%] top-[14%] font-display text-xl font-bold text-orange-500/[0.08] dark:text-orange-400/[0.08]">&hellip;</span>
              <span className="absolute left-[10%] bottom-[16%] font-display text-lg italic font-bold text-orange-500/[0.07] dark:text-orange-400/[0.07]">&laquo;</span>
              <span className="absolute right-[9%] bottom-[18%] font-display text-2xl italic font-bold text-orange-500/[0.08] dark:text-orange-400/[0.08]">&rdquo;</span>
              <span className="absolute left-[28%] top-[8%] font-display text-base font-bold text-orange-500/[0.06] dark:text-orange-400/[0.06]">&hellip;</span>
              <span className="absolute right-[26%] bottom-[6%] font-display text-xl italic font-bold text-orange-500/[0.07] dark:text-orange-400/[0.07]">&raquo;</span>
            </div>
          </div>

          {/* Double-bezel icon container with quote hover flare */}
          <div className="group relative z-10 mb-6 flex justify-center">
            <span
              className="pointer-events-none absolute left-[calc(50%-2.5rem)] top-0 font-display text-2xl italic font-bold text-orange-500/0 transition-all duration-500 group-hover:scale-110 group-hover:text-orange-500/80 dark:group-hover:text-orange-400/80"
              aria-hidden
            >
              &ldquo;
            </span>
            <span
              className="pointer-events-none absolute right-[calc(50%-2.5rem)] top-0 font-display text-2xl italic font-bold text-orange-500/0 transition-all duration-500 group-hover:scale-110 group-hover:text-orange-500/80 dark:group-hover:text-orange-400/80"
              aria-hidden
            >
              &laquo;
            </span>
            <div className="rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 dark:bg-white/[0.015]">
              <div className="flex size-12 items-center justify-center rounded-xl bg-orange-500/10">
                <Icon name="RiDoubleQuotesL" className="size-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          {/* Eyebrow badge */}
          <span className="relative z-10 mb-5 inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-orange-500 opacity-60" />
            {t("ui.eyebrow", "AI Quote Tool")}
          </span>

          {/* Title */}
          <h1 className="relative z-10 mt-4 font-display text-4xl font-bold tracking-tight leading-[1.08] text-foreground sm:text-5xl lg:text-[3.25rem]">
            <span className="group relative inline-block">
              <span
                className="pointer-events-none absolute -top-5 left-0 hidden font-display text-xl italic font-bold text-orange-500/0 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:text-orange-500/60 dark:group-hover:text-orange-400/60 md:block"
                aria-hidden
              >
                &ldquo;
              </span>
              {(() => {
                const titleText = t("ui.title", "Incorrect Quote Generator");
                const highlight = section?.ui?.title_highlight;
                if (!highlight || !titleText.includes(highlight)) {
                  return titleText;
                }
                const idx = titleText.indexOf(highlight);
                return (
                  <>
                    {titleText.slice(0, idx)}
                    <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text italic text-transparent dark:from-orange-400 dark:via-orange-500 dark:to-orange-300">
                      {highlight}
                    </span>
                    {titleText.slice(idx + highlight.length)}
                  </>
                );
              })()}
              <span
                className="pointer-events-none absolute -top-5 right-0 hidden font-display text-xl italic font-bold text-orange-500/0 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:text-orange-500/60 dark:group-hover:text-orange-400/60 md:block"
                aria-hidden
              >
                &laquo;
              </span>
            </span>
          </h1>

          {/* Editorial decorative anchor: quote + halftone + ellipsis + halftone + guillemet */}
          <div className="relative z-10 mb-5 mt-4 flex items-center justify-center gap-3 text-orange-500/40 dark:text-orange-400/30">
            <span className="font-display text-lg italic font-bold">&ldquo;</span>
            <span className="flex h-3 items-center gap-[2px]" aria-hidden>
              <span className="size-[3px] rounded-full bg-current opacity-90" />
              <span className="size-[3px] rounded-full bg-current opacity-70" />
              <span className="size-[3px] rounded-full bg-current opacity-50" />
              <span className="size-[3px] rounded-full bg-current opacity-30" />
            </span>
            <span className="text-base font-bold leading-none tracking-[0.1em]">&hellip;</span>
            <span className="flex h-3 items-center gap-[2px]" aria-hidden>
              <span className="size-[3px] rounded-full bg-current opacity-30" />
              <span className="size-[3px] rounded-full bg-current opacity-50" />
              <span className="size-[3px] rounded-full bg-current opacity-70" />
              <span className="size-[3px] rounded-full bg-current opacity-90" />
            </span>
            <span className="font-display text-base italic font-bold">&laquo;</span>
          </div>

          <p className="relative z-10 mx-auto max-w-xl text-base font-light leading-relaxed text-muted-foreground/65 sm:text-lg">
            {t(
              "ui.subtitle",
              "Generate short, intentionally wrong quote exchanges for two to six characters."
            )}
          </p>

          {/* Theme pills */}
          {section?.ui?.theme_pills?.length ? (
            <div className="relative z-10 mt-7 flex flex-wrap items-center justify-center gap-2">
              {section.ui.theme_pills.map((pill: string, i: number) => (
                <span
                  key={`${pill}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/[0.04] px-3 py-1 text-xs font-medium text-orange-700 dark:text-orange-300"
                >
                  <span className="inline-block size-1 rounded-full bg-orange-500/60" />
                  {pill}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <GeneratorNavTabs />

        <div className="mx-auto mt-8 grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <Card>
            <CardHeader>
              <CardTitle>{t("ui.options_title", "Generator settings")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Label htmlFor="incorrect-quote-prompt">
                    {t("ui.prompt_label", "Prompt")}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleRandomPrompt}
                    className="h-11 justify-start px-3 text-sm text-orange-600 hover:bg-orange-500/10 dark:text-orange-400 sm:h-8 sm:justify-end sm:px-2.5 sm:text-xs"
                  >
                    {t("ui.random_button", "Random")}
                  </Button>
                </div>
                <Textarea
                  id="incorrect-quote-prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder={t(
                    "ui.prompt_placeholder",
                    "Describe the setup or joke you want the quote to misinterpret."
                  )}
                  className="min-h-28"
                />
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Label>{t("ui.characters_label", "Characters (optional)")}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCharacter}
                    disabled={characters.length >= MAX_CHARACTERS}
                    className="h-11 w-full px-3 sm:h-9 sm:w-auto"
                  >
                    {t("ui.add_character", "Add character")}
                  </Button>
                </div>
                <div className="space-y-3">
                  {characters.map((character, index) => (
                    <div key={`character-${index}`} className="flex gap-2">
                      <Input
                        value={character}
                        onChange={(event) =>
                          updateCharacter(index, event.target.value)
                        }
                        placeholder={`${t("ui.character_placeholder", "Character")} ${index + 1}`}
                        className="min-w-0 flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCharacter(index)}
                        disabled={characters.length <= MIN_CHARACTER_FIELDS}
                        aria-label={t("ui.remove_character", "Remove")}
                        className="h-11 w-11 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:h-9 sm:w-9"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("ui.output_language", "Output language")}</Label>
                  <Select value={outputLanguage} onValueChange={setOutputLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((option) => (
                        <SelectItem key={option.code} value={option.code}>
                          {option.flag} {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("ui.mode_label", "AI model")}</Label>
                  <Select
                    value={mode}
                    onValueChange={(value) =>
                      setMode(value as IncorrectQuoteMode)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {modeOptions.find((option) => option.value === mode)?.description}
                  </p>
                </div>
              </div>

              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex min-h-11 w-full items-center justify-between px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-transparent hover:text-orange-600 dark:hover:text-orange-400 sm:min-h-0 sm:px-0"
                  >
                    <span className="flex items-center gap-1.5">
                      <Settings2 className="h-3.5 w-3.5" />
                      {t("ui.advanced_options", "Advanced options")}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        showAdvanced && "rotate-180"
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-slide-up data-[state=open]:animate-slide-down">
                  <div className="mt-4 space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("ui.relationship_label", "Relationship")}</Label>
                  <Select
                    value={relationshipMode}
                    onValueChange={(value) =>
                      setRelationshipMode(value as IncorrectQuoteRelationshipMode)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {relationshipOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("ui.tone_label", "Tone")}</Label>
                  <Select
                    value={tone}
                    onValueChange={(value) =>
                      setTone(value as IncorrectQuoteTone)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {toneOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("ui.length_label", "Length")}</Label>
                  <Select
                    value={length}
                    onValueChange={(value) =>
                      setLength(value as IncorrectQuoteLength)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {lengthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">
                  {t("ui.safety_title", "Safety options")}
                </p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={safety.noRomance}
                      onCheckedChange={(checked) =>
                        toggleSafety("noRomance", checked === true)
                      }
                    />
                    <span>{t("ui.no_romance", "No romance")}</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={safety.avoidShipping}
                      onCheckedChange={(checked) =>
                        toggleSafety("avoidShipping", checked === true)
                      }
                    />
                    <span>{t("ui.avoid_shipping", "Avoid shipping")}</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={safety.keepItClean}
                      onCheckedChange={(checked) =>
                        toggleSafety("keepItClean", checked === true)
                      }
                    />
                    <span>{t("ui.keep_it_clean", "Keep it clean")}</span>
                  </label>
                </div>
              </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="flex flex-wrap gap-3">
                <Button onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating
                    ? t("ui.generating_button", "Generating...")
                    : t("ui.generate_button", "Generate incorrect quote")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("ui.output_title", "Output")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="min-h-72 rounded-lg border bg-muted/30 p-4 text-sm">
                {isGenerating && !generatedQuote ? (
                  <GeneratingState
                    label={t(
                      "ui.generating_output",
                      "Generating your incorrect quote..."
                    )}
                    reduceMotion={reduceMotion}
                  />
                ) : generatedQuote ? (
                  <span className="block whitespace-pre-wrap leading-relaxed">
                    {generatedQuote}
                  </span>
                ) : (
                  <span className="text-muted-foreground/70">
                    {t(
                      "ui.empty_output",
                      "Your generated quote will appear here."
                    )}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopy}
                  disabled={!generatedQuote || isGenerating}
                  className="min-h-11 w-full px-3 text-xs sm:h-10 sm:w-auto sm:min-h-0 sm:px-4 sm:text-sm"
                >
                  {t("ui.copy_button", "Copy")}
                </Button>
                <ShareResultButton
                  content={generatedQuote}
                  prompt={prompt}
                  sourceCategory="quote"
                  title={prompt.substring(0, 30) + (prompt.length > 30 ? "..." : "")}
                  className="min-h-11 w-full gap-1.5 px-3 text-xs sm:h-10 sm:w-auto sm:min-h-0 sm:px-4 sm:text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={isGenerating || !lastCompletedQuote}
                  className="min-h-11 w-full px-3 text-xs sm:h-10 sm:w-auto sm:min-h-0 sm:px-4 sm:text-sm"
                >
                  {t("ui.regenerate_button", "Regenerate")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleContinue}
                  disabled={!generatedQuote || isGenerating}
                  className="min-h-11 w-full px-3 text-xs sm:h-10 sm:w-auto sm:min-h-0 sm:px-4 sm:text-sm"
                >
                  {t("ui.continue_button", "Continue in AI Write")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={runGeneration}
        onError={() => {
          setIsGenerating(false);
          toast.error(
            t("errors.verification_failed", "Verification failed. Try again.")
          );
        }}
      />
    </section>
  );
}
