"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from "framer-motion";
import {
  Award,
  Check,
  ChevronDown,
  Copy,
  Play,
  Settings2,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import GeneratorNavTabs from "@/components/generator-nav-tabs";
import TurnstileInvisible, {
  TurnstileInvisibleHandle,
} from "@/components/TurnstileInvisible";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { LANGUAGE_OPTIONS } from "@/lib/language-options";
import { YoutubeNameStorage } from "@/lib/youtube-name-storage";
import YoutubeNameBreadcrumb from "./breadcrumb";
import {
  pickRandomYoutubeNamePreset,
  sortNamesByScore,
} from "./lib";
import type {
  SavedYoutubeName,
  YoutubeNameGenerate as YoutubeNameGenerateType,
} from "@/types/blocks/youtube-name-generate";
import type {
  GeneratedYoutubeName,
  YoutubeNameCategory,
  YoutubeNameLengthPreference,
  YoutubeNamePivotFlexibility,
  YoutubeNameStyle,
} from "@/types/youtube-name";

interface YoutubeNameGenerateProps {
  section?: YoutubeNameGenerateType;
}

const STYLE_OPTIONS: YoutubeNameStyle[] = [
  "brandable",
  "searchable",
  "hybrid",
  "funny",
  "personal",
  "expert",
  "cinematic",
];

const LENGTH_OPTIONS: YoutubeNameLengthPreference[] = ["short", "medium", "flexible"];
const PIVOT_OPTIONS: YoutubeNamePivotFlexibility[] = ["low", "medium", "high"];
const CATEGORY_TABS: YoutubeNameCategory[] = ["brandable", "searchable", "hybrid"];
const MAX_SHORTLIST = 3;

const SCORE_KEYS = [
  "memorability",
  "pronounceability",
  "uniqueness",
  "pivotFlexibility",
] as const;

type ScoreKey = (typeof SCORE_KEYS)[number];

export default function YoutubeNameGenerate({
  section,
}: YoutubeNameGenerateProps) {
  const locale = useLocale();
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const reduceMotion = useReducedMotion();
  const [sectionVisible, setSectionVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const tkEnter = (delayMs: number) =>
    `transition-all duration-[800ms] ease-[cubic-bezier(0.32,0.72,0,1)] [transition-delay:${delayMs}ms] ${
      sectionVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
    }`;

  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [style, setStyle] = useState<YoutubeNameStyle>("hybrid");
  const [lengthPreference, setLengthPreference] =
    useState<YoutubeNameLengthPreference>("short");
  const [pivotFlexibility, setPivotFlexibility] =
    useState<YoutubeNamePivotFlexibility>("medium");
  const [keywordsRaw, setKeywordsRaw] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [outputLanguage, setOutputLanguage] = useState(locale);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isIconPlaying, setIsIconPlaying] = useState(true);
  const iconParticleRotation = useMotionValue(0);

  useAnimationFrame((_, delta) => {
    if (isIconPlaying && !reduceMotion) {
      iconParticleRotation.set(
        (iconParticleRotation.get() + (delta / 5500) * 360) % 360
      );
    }
  });
  const [results, setResults] = useState<GeneratedYoutubeName[]>([]);
  const [recommendedName, setRecommendedName] = useState("");
  const [recommendedReason, setRecommendedReason] = useState("");
  const [activeCategory, setActiveCategory] = useState<YoutubeNameCategory | "all">("all");
  const [shortlist, setShortlist] = useState<GeneratedYoutubeName[]>([]);
  const [history, setHistory] = useState<SavedYoutubeName[]>([]);

  useEffect(() => {
    setHistory(YoutubeNameStorage.getHistory());
  }, []);

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

  const styleOptions = useMemo(
    () =>
      STYLE_OPTIONS.map((value) => ({
        value,
        label: t(`style.${value}`, value),
      })),
    [t]
  );

  const lengthOptions = useMemo(
    () =>
      LENGTH_OPTIONS.map((value) => ({
        value,
        label: t(`length.${value}`, value),
      })),
    [t]
  );

  const pivotOptions = useMemo(
    () =>
      PIVOT_OPTIONS.map((value) => ({
        value,
        label: t(`pivot.${value}`, value),
      })),
    [t]
  );

  const categoryLabel = useCallback(
    (cat: YoutubeNameCategory) => t(`category.${cat}`, cat),
    [t]
  );

  const sortedResults = useMemo(
    () => sortNamesByScore(results),
    [results]
  );

  const visibleResults = useMemo(() => {
    if (activeCategory === "all") return sortedResults;
    return sortedResults.filter((n) => n.category === activeCategory);
  }, [sortedResults, activeCategory]);

  const categoryCounts = useMemo(() => {
    const map: Record<YoutubeNameCategory, number> = {
      brandable: 0,
      searchable: 0,
      hybrid: 0,
    };
    for (const n of sortedResults) {
      map[n.category] += 1;
    }
    return map;
  }, [sortedResults]);

  const inShortlist = useCallback(
    (name: string) =>
      shortlist.some((n) => n.name.toLowerCase() === name.toLowerCase()),
    [shortlist]
  );

  const toggleShortlist = useCallback(
    (item: GeneratedYoutubeName) => {
      setShortlist((prev) => {
        const existingIdx = prev.findIndex(
          (n) => n.name.toLowerCase() === item.name.toLowerCase()
        );
        if (existingIdx >= 0) {
          const next = [...prev];
          next.splice(existingIdx, 1);
          return next;
        }
        if (prev.length >= MAX_SHORTLIST) {
          toast.error(t("ui.shortlist_full", `Shortlist is full (max ${MAX_SHORTLIST}).`));
          return prev;
        }
        return [...prev, item];
      });
    },
    [t]
  );

  const runGeneration = useCallback(
    async (turnstileToken: string) => {
      try {
        const keywords = keywordsRaw
          .split(/[,\n]/)
          .map((v) => v.trim())
          .filter(Boolean)
          .slice(0, 8);

        const response = await fetch("/api/youtube-name-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            turnstileToken,
            niche,
            audience,
            style,
            lengthPreference,
            pivotFlexibility,
            keywords,
            creatorName,
            outputLanguage,
            locale,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          console.error("YouTube name API error", response.status, errorText);
          throw new Error("request failed");
        }

        const data = (await response.json()) as {
          names?: GeneratedYoutubeName[];
          recommendedName?: string;
          recommendedReason?: string;
        };

        if (!data?.names?.length) {
          throw new Error("empty result");
        }

        setResults(data.names);
        setRecommendedName(data.recommendedName ?? "");
        setRecommendedReason(data.recommendedReason ?? "");
        setActiveCategory("all");
        setShortlist([]);

        YoutubeNameStorage.saveHistory({
          niche,
          audience,
          style,
          lengthPreference,
          pivotFlexibility,
          keywords,
          creatorName,
          outputLanguage,
          output: data.names,
          recommendedName: data.recommendedName ?? "",
          recommendedReason: data.recommendedReason ?? "",
        });
        setHistory(YoutubeNameStorage.getHistory());

        toast.success(t("success.generated", "YouTube names generated."));
      } catch (error) {
        console.error("YouTube name generation failed:", error);
        toast.error(
          t("errors.generate_failed", "Failed to generate YouTube names.")
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [
      audience,
      creatorName,
      keywordsRaw,
      lengthPreference,
      locale,
      niche,
      outputLanguage,
      pivotFlexibility,
      style,
      t,
    ]
  );

  const handleGenerate = useCallback(() => {
    if (!niche.trim()) {
      toast.error(t("validation.niche_required", "Describe your niche first."));
      return;
    }
    if (!audience.trim()) {
      toast.error(t("validation.audience_required", "Describe your audience."));
      return;
    }

    setIsGenerating(true);
    turnstileRef.current?.execute();
  }, [audience, niche, t]);

  const handleRandomPrompt = useCallback(() => {
    const preset = pickRandomYoutubeNamePreset({
      presets: section?.random_prompts ?? [],
    });
    setNiche(preset.niche);
    setAudience(preset.audience);
    setStyle(preset.style);
    setLengthPreference(preset.lengthPreference);
    setPivotFlexibility(preset.pivotFlexibility);
    setKeywordsRaw(preset.keywords.join(", "));
    setCreatorName(preset.creatorName);
    setResults([]);
    setRecommendedName("");
    setRecommendedReason("");
    setShortlist([]);
    toast.success(t("success.random_prompt_selected", "Random example loaded."));
  }, [section, t]);

  const handleCopy = useCallback(
    async (text: string, successKey = "success.copied_name") => {
      if (!text.trim()) return;
      try {
        await navigator.clipboard.writeText(text);
        toast.success(t(successKey, "Copied."));
      } catch (error) {
        console.error("Copy failed:", error);
      }
    },
    [t]
  );

  const applyHistory = useCallback((item: SavedYoutubeName) => {
    setNiche(item.niche);
    setAudience(item.audience);
    setStyle(item.style);
    setLengthPreference(item.lengthPreference);
    setPivotFlexibility(item.pivotFlexibility);
    setKeywordsRaw(item.keywords.join(", "));
    setCreatorName(item.creatorName);
    setOutputLanguage(item.outputLanguage);
    setResults(item.output);
    setRecommendedName(item.recommendedName);
    setRecommendedReason(item.recommendedReason);
    setShortlist([]);
  }, []);

  const deleteHistory = useCallback(
    (id: string) => {
      YoutubeNameStorage.deleteById(id);
      setHistory(YoutubeNameStorage.getHistory());
      toast.success(t("success.history_deleted", "History removed."));
    },
    [t]
  );

  const clearHistory = useCallback(() => {
    YoutubeNameStorage.clearHistory();
    setHistory([]);
    toast.success(t("success.history_cleared", "History cleared."));
  }, [t]);

  const recommendedItem = useMemo(() => {
    if (!recommendedName) return null;
    return (
      sortedResults.find(
        (n) => n.name.toLowerCase() === recommendedName.toLowerCase()
      ) ?? null
    );
  }, [recommendedName, sortedResults]);

  const backupItem = useMemo(() => {
    if (sortedResults.length < 2) return null;
    const candidates = recommendedItem
      ? sortedResults.filter(
          (n) => n.name.toLowerCase() !== recommendedItem.name.toLowerCase()
        )
      : sortedResults;
    return candidates[0] ?? null;
  }, [recommendedItem, sortedResults]);

  const scoreBarColor = (value: number) => {
    if (value >= 8) return "bg-orange-600 dark:bg-orange-500";
    if (value >= 6) return "bg-orange-500 dark:bg-orange-400";
    return "bg-muted-foreground/40";
  };

  const renderScores = (scores: GeneratedYoutubeName["scores"]) => (
    <div className="space-y-1.5">
      {SCORE_KEYS.map((key) => {
        const value = scores[key];
        return (
          <div key={key} className="flex items-center gap-2 text-xs">
            <span className="w-24 shrink-0 text-muted-foreground">
              {t(`ui.score_${key}`, key)}
            </span>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "absolute left-0 top-0 h-full rounded-full transition-all",
                  scoreBarColor(value)
                )}
                style={{ width: `${value * 10}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right font-mono text-foreground">
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );

  const renderNameCard = (item: GeneratedYoutubeName, index: number) => {
    const saved = inShortlist(item.name);
    return (
      <motion.div
        key={`${item.name}-${index}`}
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.4) }}
        className={cn(
          "group flex flex-col gap-3 rounded-lg border bg-card p-4 text-sm transition-all duration-300",
          saved
            ? "border-orange-500/40 bg-orange-500/[0.03]"
            : "border-border/50 hover:border-orange-500/30 hover:bg-orange-500/[0.02]"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-base font-semibold text-foreground">
                {item.name}
              </span>
              <Badge variant="secondary" className="text-[11px] uppercase tracking-wide">
                {categoryLabel(item.category)}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="text-orange-500">@</span>
              <span className="font-mono">{item.suggestedHandle}</span>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant={saved ? "default" : "outline"}
            onClick={() => toggleShortlist(item)}
            disabled={!saved && shortlist.length >= MAX_SHORTLIST}
            className={cn(
              "h-11 shrink-0 px-3 text-xs sm:h-8 active:scale-[0.98]",
              saved &&
                "bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
            )}
          >
            {saved ? (
              <>
                <Check className="mr-1 h-3 w-3" />
                {t("ui.saved_button", "Saved")}
              </>
            ) : (
              <>
                <Star className="mr-1 h-3 w-3" />
                {t("ui.save_button", "Save")}
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">
            {t("ui.rationale_label", "Why")}:
          </span>{" "}
          {item.oneLineRationale}
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">
            {t("ui.best_for_label", "Best for")}:
          </span>{" "}
          {item.bestFor}
        </p>

        {renderScores(item.scores)}

        <div className="space-y-1.5 border-t border-border/30 pt-2.5">
          <div className="flex items-center gap-1.5 text-xs">
            {item.handleValidation.formatValid ? (
              <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <span className="text-amber-600 dark:text-amber-400">!</span>
            )}
            <span className="text-muted-foreground">
              {item.handleValidation.formatValid
                ? t("ui.handle_valid", "Handle-friendly format")
                : t("ui.handle_invalid", "Handle format needs work")}
            </span>
          </div>
          {item.handleValidation.warnings.length > 0 && (
            <ul className="space-y-0.5 text-xs text-amber-700 dark:text-amber-300">
              {item.handleValidation.warnings.map((w, i) => (
                <li key={i}>· {w}</li>
              ))}
            </ul>
          )}
          {item.handleValidation.fallbackHandles.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-muted-foreground">
                {t("ui.handle_fallbacks", "Fallbacks")}:
              </span>
              {item.handleValidation.fallbackHandles.map((h, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleCopy(h, "success.copied_handle")}
                  className="rounded border border-border/40 bg-muted/40 px-1.5 py-0.5 font-mono text-[11px] text-foreground transition-colors hover:border-orange-500/30 hover:text-orange-600 dark:hover:text-orange-400"
                >
                  @{h}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleCopy(item.name)}
            className="h-11 px-2 text-xs sm:h-8 active:scale-[0.98]"
          >
            <Copy className="mr-1 h-3 w-3" />
            {t("ui.copy_name_button", "Copy name")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleCopy(item.suggestedHandle, "success.copied_handle")}
            className="h-11 px-2 text-xs sm:h-8 active:scale-[0.98]"
          >
            <Copy className="mr-1 h-3 w-3" />
            {t("ui.copy_handle_button", "Copy handle")}
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <section
      ref={sectionRef}
      id="youtube_name_generator"
      className="overflow-hidden py-16 text-foreground selection:bg-orange-500/20 lg:py-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.05_65),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.18_0.04_65),transparent)]" />
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-orange-500/[0.04] via-orange-500/[0.02] to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]"
          style={{ backgroundImage: "var(--bg-grid)", backgroundSize: "40px 40px" }}
        />
        {!reduceMotion && [
          { pos: "left-[6%] top-[8%]", size: "size-12", opacity: 0.5, dur: 11, delay: 0 },
          { pos: "right-[8%] top-[14%]", size: "size-10", opacity: 0.45, dur: 13, delay: 1.5 },
          { pos: "left-[12%] top-[44%]", size: "size-9", opacity: 0.4, dur: 12, delay: 2.8 },
          { pos: "right-[14%] top-[48%]", size: "size-11", opacity: 0.45, dur: 14, delay: 0.8 },
          { pos: "left-[24%] top-[4%]", size: "size-8", opacity: 0.35, dur: 10, delay: 3.5 },
        ].map((b, i) => (
          <motion.div
            key={`play-${i}`}
            aria-hidden
            className={cn(
              "pointer-events-none absolute z-[1] hidden rounded-full bg-orange-500/15 dark:bg-orange-400/15 md:block",
              b.pos,
              b.size
            )}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{
              opacity: [0, b.opacity, b.opacity, 0],
              y: [0, -10, 0],
              scale: [0.8, 1, 0.8],
            }}
            transition={{ duration: b.dur, delay: b.delay, repeat: Infinity, ease: "easeInOut" }}
          >
            <Play
              className="size-full text-orange-500/70 dark:text-orange-400/70"
              strokeWidth={1.5}
              fill="currentColor"
            />
          </motion.div>
        ))}
      </div>

      <div className="container relative mx-auto px-4 md:px-6">
        <div className="mb-10">
          <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
            <YoutubeNameBreadcrumb
              homeText={t("ui.breadcrumb_home", "Home")}
              currentText={t("ui.breadcrumb_current", "YouTube Name Generator")}
            />
          </div>
        </div>

        <div className="relative mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <div className={cn("relative z-10 mb-6 flex justify-center", tkEnter(0))}>
            <motion.button
              type="button"
              onClick={() => setIsIconPlaying((p) => !p)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              aria-label={isIconPlaying ? "Pause ambient animation" : "Play ambient animation"}
              aria-pressed={!isIconPlaying}
              className="group relative cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
            >
              <div className="relative rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] transition-colors duration-300 group-hover:border-orange-500/30 dark:bg-white/[0.015]">
                <div className="relative flex size-12 items-center justify-center overflow-hidden rounded-xl bg-orange-500/10">
                  {!reduceMotion && (
                    <motion.div
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background:
                          "radial-gradient(circle at center, rgba(249,115,22,0.38), transparent 65%)",
                      }}
                      animate={{ opacity: [0.45, 0.9, 0.45], scale: [0.9, 1.06, 0.9] }}
                      transition={{
                        duration: 3.2,
                        repeat: Infinity,
                        ease: [0.32, 0.72, 0, 1],
                      }}
                    />
                  )}

                  <motion.div
                    className="relative"
                    animate={
                      reduceMotion
                        ? undefined
                        : { scale: [1, 1.07, 1], y: [0, -1.5, 0] }
                    }
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      ease: [0.32, 0.72, 0, 1],
                    }}
                  >
                    <Icon
                      name={isIconPlaying ? "RiPlayCircleLine" : "RiPauseCircleLine"}
                      className="size-6 text-orange-600 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)] transition-[filter] duration-300 dark:text-orange-400"
                    />
                  </motion.div>

                  {!reduceMotion && (
                    <motion.div
                      aria-hidden
                      className="pointer-events-none absolute inset-0"
                      style={{ rotate: iconParticleRotation }}
                    >
                      <span className="absolute left-1/2 top-0 size-1 -translate-x-1/2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.85)]" />
                      <span className="absolute bottom-1 right-1.5 size-1 rounded-full bg-orange-400 shadow-[0_0_8px_2px_rgba(251,146,60,0.7)]" />
                      <span className="absolute bottom-2 left-1.5 size-1 rounded-full bg-amber-400 shadow-[0_0_8px_2px_rgba(252,211,77,0.7)]" />
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.button>
          </div>

          <span
            className={cn(
              "relative z-10 mb-5 inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground",
              tkEnter(80)
            )}
          >
            <span className="inline-block size-1.5 rounded-full bg-orange-500 opacity-60" />
            {t("ui.eyebrow", "AI Naming Tool")}
          </span>

          <h1
            className={cn(
              "relative z-10 mt-4 font-display text-4xl font-bold tracking-tight leading-[1.08] text-foreground sm:text-5xl lg:text-[3.25rem]",
              tkEnter(160)
            )}
          >
            {(() => {
              const titleText = t("ui.title", "YouTube Name Generator");
              const highlight = section?.ui?.title_highlight;
              if (!highlight || !titleText.includes(highlight)) {
                return titleText;
              }
              const idx = titleText.indexOf(highlight);
              return (
                <>
                  {titleText.slice(0, idx)}
                  <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent dark:from-orange-400 dark:via-orange-500 dark:to-orange-300">
                    {highlight}
                  </span>
                  {titleText.slice(idx + highlight.length)}
                </>
              );
            })()}
          </h1>

          <p
            className={cn(
              "relative z-10 mx-auto mt-5 max-w-xl text-base font-light leading-relaxed text-muted-foreground/65 sm:text-lg",
              tkEnter(240)
            )}
          >
            {t(
              "ui.subtitle",
              "Find a YouTube channel name you can actually launch with. Generate, compare, and choose a handle-friendly option with confidence."
            )}
          </p>

          {section?.ui?.theme_pills?.length ? (
            <div
              className={cn(
                "relative z-10 mt-7 flex flex-wrap items-center justify-center gap-2",
                tkEnter(320)
              )}
            >
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

        <div className="mx-auto mt-8 grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <Card>
            <CardHeader>
              <CardTitle>{t("ui.options_title", "Channel brief")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Label htmlFor="yt-niche">{t("ui.niche_label", "What is your channel about?")}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleRandomPrompt}
                    className="h-11 justify-start px-3 text-sm text-orange-600 hover:bg-orange-500/10 dark:text-orange-400 sm:h-8 active:scale-[0.98] sm:justify-end sm:px-2.5 sm:text-xs"
                  >
                    {t("ui.random_button", "Random example")}
                  </Button>
                </div>
                <Textarea
                  id="yt-niche"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder={t(
                    "ui.niche_placeholder",
                    "e.g. slow-living vlogs, beginner chess puzzles, indoor plant care"
                  )}
                  className="min-h-20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yt-audience">{t("ui.audience_label", "Who is it for?")}</Label>
                <Input
                  id="yt-audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder={t(
                    "ui.audience_placeholder",
                    "e.g. busy young professionals, teens learning art"
                  )}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t("ui.style_label", "Naming style")}</Label>
                  <Select value={style} onValueChange={(v) => setStyle(v as YoutubeNameStyle)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {styleOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("ui.length_label", "Length")}</Label>
                  <Select
                    value={lengthPreference}
                    onValueChange={(v) => setLengthPreference(v as YoutubeNameLengthPreference)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {lengthOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("ui.pivot_label", "Pivot room")}</Label>
                  <Select
                    value={pivotFlexibility}
                    onValueChange={(v) => setPivotFlexibility(v as YoutubeNamePivotFlexibility)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pivotOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      {t("ui.options_title", "Advanced options")}
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
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="yt-keywords">
                        {t("ui.keywords_label", "Keywords (optional)")}
                      </Label>
                      <Input
                        id="yt-keywords"
                        value={keywordsRaw}
                        onChange={(e) => setKeywordsRaw(e.target.value)}
                        placeholder={t(
                          "ui.keywords_placeholder",
                          "comma-separated words to lean into"
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yt-creator">
                        {t("ui.creator_label", "Creator name (optional)")}
                      </Label>
                      <Input
                        id="yt-creator"
                        value={creatorName}
                        onChange={(e) => setCreatorName(e.target.value)}
                        placeholder={t(
                          "ui.creator_placeholder",
                          "nickname or real name to weave in"
                        )}
                      />
                    </div>
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
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="bg-orange-600 text-white shadow-md shadow-orange-600/20 hover:bg-orange-700 active:scale-[0.98] active:bg-orange-800 dark:bg-orange-500 dark:hover:bg-orange-600"
                >
                  {isGenerating
                    ? t("ui.generating_button", "Generating...")
                    : t("ui.generate_button", "Generate my names")}
                </Button>
                {sortedResults.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="h-11 px-4 sm:h-10 active:scale-[0.98]"
                  >
                    {t("ui.regenerate_button", "Regenerate")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>{t("ui.output_title", "Name ideas")}</CardTitle>
              {sortedResults.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {t("ui.results_count", "{count} names").replace(
                    "{count}",
                    String(sortedResults.length)
                  )}
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {sortedResults.length === 0 ? (
                isGenerating ? (
                  <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-lg border border-orange-500/20 bg-orange-500/[0.03] p-4 text-center">
                    <div className="flex items-end gap-1 h-8" aria-hidden>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <span
                          key={i}
                          className="w-1 rounded-full bg-orange-500 dark:bg-orange-400 animate-music-bar"
                          style={{
                            animationDelay: `${i * 0.15}s`,
                            animationDuration: `${0.8 + (i % 3) * 0.2}s`,
                            height: "100%",
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-orange-700/80 dark:text-orange-300/80">
                      {t("ui.generating_output", "Generating your names...")}
                    </p>
                  </div>
                ) : (
                  <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/40 bg-muted/20 p-4 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-orange-500/5">
                      <Play
                        className="size-5 text-orange-500/60 dark:text-orange-400/60 animate-pulse"
                        strokeWidth={1.5}
                        fill="currentColor"
                      />
                    </div>
                    <p className="max-w-xs text-sm text-muted-foreground">
                      {t(
                        "ui.empty_output",
                        "Describe your niche and audience, then generate to see structured name ideas here."
                      )}
                    </p>
                  </div>
                )
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <CategoryTabButton
                      active={activeCategory === "all"}
                      onClick={() => setActiveCategory("all")}
                      label={t("ui.category_all", "All")}
                      count={sortedResults.length}
                    />
                    {CATEGORY_TABS.map((cat) => (
                      <CategoryTabButton
                        key={cat}
                        active={activeCategory === cat}
                        onClick={() => setActiveCategory(cat)}
                        label={categoryLabel(cat)}
                        count={categoryCounts[cat]}
                      />
                    ))}
                  </div>

                  <div className="grid max-h-[60vh] gap-3 overflow-y-auto pr-1 md:max-h-[640px]">
                    {visibleResults.map((item, idx) => renderNameCard(item, idx))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {sortedResults.length > 0 && (
          <div className="mx-auto mt-12 w-full max-w-6xl space-y-6">
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.02] p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-lg font-semibold">
                  {t("ui.recommendation_title", "Recommended launch name")}
                </h3>
              </div>
              {recommendedItem ? (
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-2xl font-bold text-foreground">
                        {recommendedItem.name}
                      </span>
                      <span className="font-mono text-sm text-orange-600 dark:text-orange-400">
                        @{recommendedItem.suggestedHandle}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary">
                        {categoryLabel(recommendedItem.category)}
                      </Badge>
                      <Badge variant="outline">
                        {t("ui.best_for_label", "Best for")}: {recommendedItem.bestFor}
                      </Badge>
                    </div>
                    {recommendedReason && (
                      <p className="pt-1 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground/70">
                          {t("ui.recommendation_reason", "Why")}:
                        </span>{" "}
                        {recommendedReason}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleCopy(recommendedItem.name)}
                        className="h-11 bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 sm:h-9 active:scale-[0.98]"
                      >
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        {t("ui.copy_name_button", "Copy name")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(recommendedItem.suggestedHandle, "success.copied_handle")}
                        className="h-11 sm:h-9 active:scale-[0.98]"
                      >
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        {t("ui.copy_handle_button", "Copy handle")}
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-background/60 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("ui.scores_label", "Scores")}
                    </p>
                    {renderScores(recommendedItem.scores)}
                    {backupItem && (
                      <p className="mt-4 border-t border-border/30 pt-3 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/70">
                          {t("ui.recommendation_backup_label", "Backup option")}:
                        </span>{" "}
                        <button
                          type="button"
                          onClick={() => handleCopy(backupItem.name)}
                          className="font-medium text-orange-600 hover:underline dark:text-orange-400"
                        >
                          {backupItem.name}
                        </button>{" "}
                        <span className="text-muted-foreground/70">
                          @{backupItem.suggestedHandle}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {recommendedName || t("ui.empty_output", "No recommendation yet.")}
                </p>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Sparkles className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    {t("ui.shortlist_title", "Your shortlist")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t("ui.shortlist_hint", `Save up to ${MAX_SHORTLIST} names to compare.`)}
                  </p>
                </div>
                {shortlist.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShortlist([])}
                    className="h-9 text-xs text-muted-foreground"
                  >
                    {t("ui.history_clear", "Clear")}
                  </Button>
                )}
              </div>
              {shortlist.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/40 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  {t(
                    "ui.shortlist_empty",
                    "Save names from the results above to compare them side by side."
                  )}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {shortlist.map((item, i) => (
                    <motion.div
                      key={`shortlist-${item.name}`}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="relative flex flex-col gap-3 rounded-lg border border-orange-500/30 bg-orange-500/[0.02] p-4"
                    >
                      <button
                        type="button"
                        onClick={() => toggleShortlist(item)}
                        className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
                        aria-label="remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <div className="space-y-1 pr-6">
                        <div className="font-display text-base font-semibold">
                          {item.name}
                        </div>
                        <div className="font-mono text-xs text-orange-600 dark:text-orange-400">
                          @{item.suggestedHandle}
                        </div>
                        <Badge variant="secondary" className="text-[11px]">
                          {categoryLabel(item.category)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/70">
                          {t("ui.best_for_label", "Best for")}:
                        </span>{" "}
                        {item.bestFor}
                      </p>
                      {renderScores(item.scores)}
                      <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(item.name)}
                          className="h-9 px-2 text-xs"
                        >
                          <Copy className="mr-1 h-3 w-3" />
                          {t("ui.copy_name_button", "Copy")}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="mx-auto mt-12 w-full max-w-6xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {t("ui.history_title", "Recent generations")}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-xs text-muted-foreground"
              >
                {t("ui.history_clear", "Clear")}
              </Button>
            </div>
            <ul className="space-y-2">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{item.niche}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()} ·{" "}
                      {item.output.length} names · picked: {item.recommendedName || "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyHistory(item)}
                      className="h-11 px-3 text-xs sm:h-8 active:scale-[0.98]"
                    >
                      {t("ui.history_apply", "Apply")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteHistory(item.id)}
                      className="h-11 px-3 text-xs text-muted-foreground hover:text-destructive sm:h-8 active:scale-[0.98]"
                    >
                      {t("ui.history_delete", "Delete")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
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

interface CategoryTabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}

function CategoryTabButton({ active, onClick, label, count }: CategoryTabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-orange-500/40 bg-orange-500/15 text-orange-700 dark:text-orange-300"
          : "border-border/40 text-muted-foreground hover:border-orange-500/30 hover:text-foreground"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 text-[11px]",
          active ? "bg-orange-500/20" : "bg-muted"
        )}
      >
        {count}
      </span>
    </button>
  );
}
