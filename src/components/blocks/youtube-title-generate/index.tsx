"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Award,
  Check,
  ChevronDown,
  Copy,
  Lightbulb,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react";
import GeneratorNavTabs from "@/components/generator-nav-tabs";
import TurnstileInvisible, {
  TurnstileInvisibleHandle,
} from "@/components/TurnstileInvisible";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type {
  GeneratedYoutubeTitle,
  YoutubeTitleAngle,
  YoutubeTitleLengthPreference,
  YoutubeTitleOptimizationPreference,
} from "@/types/youtube-title";
import type { YoutubeTitleGenerateSection } from "@/types/blocks/youtube-title-generate";
import YoutubeTitleBreadcrumb from "./breadcrumb";
import {
  ANGLE_GROUPS,
  clearHistory,
  clearShortlist,
  deleteHistoryEntry,
  getHistory,
  loadShortlist,
  pickRandomYoutubeTitlePreset,
  saveHistoryEntry,
  saveShortlist,
} from "./lib";
import type { PersistedHistoryItem } from "./lib";

interface YoutubeTitleGenerateProps {
  section?: YoutubeTitleGenerateSection;
}

const LENGTH_OPTIONS: YoutubeTitleLengthPreference[] = [
  "short",
  "medium",
  "flexible",
];

const OPTIMIZATION_OPTIONS: YoutubeTitleOptimizationPreference[] = [
  "search",
  "balanced",
  "clicks",
];

const MAX_SHORTLIST = 3;

export default function YoutubeTitleGenerate({
  section,
}: YoutubeTitleGenerateProps) {
  const locale = useLocale();
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);

  const [videoTopic, setVideoTopic] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [summary, setSummary] = useState("");
  const [transcript, setTranscript] = useState("");
  const [titleLengthPreference, setTitleLengthPreference] =
    useState<YoutubeTitleLengthPreference>("medium");
  const [optimizationPreference, setOptimizationPreference] =
    useState<YoutubeTitleOptimizationPreference>("balanced");
  const [avoidWordsRaw, setAvoidWordsRaw] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [titles, setTitles] = useState<GeneratedYoutubeTitle[]>([]);
  const [recommendedTitle, setRecommendedTitle] = useState("");
  const [recommendedReason, setRecommendedReason] = useState("");
  const [backupTitle, setBackupTitle] = useState("");
  const [shortlist, setShortlist] = useState<GeneratedYoutubeTitle[]>([]);
  const [history, setHistory] = useState<PersistedHistoryItem[]>([]);

  useEffect(() => {
    setShortlist(loadShortlist());
    setHistory(getHistory());
  }, []);

  useEffect(() => {
    saveShortlist(shortlist);
  }, [shortlist]);

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

  const grouped = useMemo(() => {
    const map: Record<YoutubeTitleAngle, GeneratedYoutubeTitle[]> = {
      "search-first": [],
      "curiosity-first": [],
      "outcome-first": [],
      "contrarian-first": [],
    };
    for (const item of titles) {
      if (map[item.angle]) map[item.angle].push(item);
    }
    return map;
  }, [titles]);

  const recommendedItem = useMemo(() => {
    if (!recommendedTitle) return null;
    return (
      titles.find(
        (item) => item.title.toLowerCase() === recommendedTitle.toLowerCase()
      ) ?? null
    );
  }, [recommendedTitle, titles]);

  const backupItem = useMemo(() => {
    if (!backupTitle) return null;
    return (
      titles.find(
        (item) => item.title.toLowerCase() === backupTitle.toLowerCase()
      ) ?? null
    );
  }, [backupTitle, titles]);

  const inShortlist = useCallback(
    (title: string) =>
      shortlist.some(
        (item) => item.title.toLowerCase() === title.toLowerCase()
      ),
    [shortlist]
  );

  const toggleShortlist = useCallback(
    (item: GeneratedYoutubeTitle) => {
      setShortlist((prev) => {
        const existingIdx = prev.findIndex(
          (n) => n.title.toLowerCase() === item.title.toLowerCase()
        );
        if (existingIdx >= 0) {
          const next = [...prev];
          next.splice(existingIdx, 1);
          return next;
        }
        if (prev.length >= MAX_SHORTLIST) {
          toast.error(
            t("ui.shortlist_full", `Shortlist is full (max ${MAX_SHORTLIST}).`)
          );
          return prev;
        }
        return [...prev, item];
      });
    },
    [t]
  );

  const handleCopy = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      try {
        await navigator.clipboard.writeText(text);
        toast.success(t("success.copied", "Copied."));
      } catch (error) {
        console.error("Copy failed:", error);
      }
    },
    [t]
  );

  const runGeneration = useCallback(
    async (turnstileToken: string) => {
      try {
        const avoidWords = avoidWordsRaw
          .split(/[,\n]/)
          .map((v) => v.trim())
          .filter(Boolean);

        const response = await fetch("/api/youtube-title-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            turnstileToken,
            videoTopic,
            targetAudience,
            summary,
            transcript,
            titleLengthPreference,
            optimizationPreference,
            avoidWords,
            locale,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          console.error("YouTube title API error", response.status, errorText);
          throw new Error("request failed");
        }

        const data = (await response.json()) as {
          code?: number;
          message?: string;
          titles?: GeneratedYoutubeTitle[];
          recommendedTitle?: string;
          recommendedReason?: string;
          backupTitle?: string;
        };

        if (data?.code === -1) {
          throw new Error(data.message || "request failed");
        }

        if (!data?.titles?.length) {
          throw new Error("empty result");
        }

        setTitles(data.titles);
        setRecommendedTitle(data.recommendedTitle ?? "");
        setRecommendedReason(data.recommendedReason ?? "");
        setBackupTitle(data.backupTitle ?? "");

        saveHistoryEntry({
          id: `${Date.now()}`,
          createdAt: new Date().toISOString(),
          videoTopic,
          targetAudience,
          summary,
          titleLengthPreference,
          optimizationPreference,
          avoidWords,
          output: data.titles,
          recommendedTitle: data.recommendedTitle ?? "",
          recommendedReason: data.recommendedReason ?? "",
          backupTitle: data.backupTitle ?? "",
        });
        setHistory(getHistory());

        toast.success(t("success.generated", "YouTube titles generated."));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "request failed";
        console.error("YouTube title generation failed:", error);
        toast.error(
          t("errors.generate_failed", `Failed to generate titles (${message}).`)
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [
      avoidWordsRaw,
      locale,
      optimizationPreference,
      summary,
      targetAudience,
      titleLengthPreference,
      transcript,
      videoTopic,
      t,
    ]
  );

  const handleGenerate = useCallback(() => {
    if (!videoTopic.trim()) {
      toast.error(t("validation.topic_required", "Tell us what the video is about."));
      return;
    }
    if (!targetAudience.trim()) {
      toast.error(t("validation.audience_required", "Tell us who the video is for."));
      return;
    }
    if (!summary.trim()) {
      toast.error(t("validation.summary_required", "Add a short summary."));
      return;
    }

    setIsGenerating(true);
    turnstileRef.current?.execute();
  }, [videoTopic, targetAudience, summary, t]);

  const handleRandomPrompt = useCallback(() => {
    const preset = pickRandomYoutubeTitlePreset({
      presets: section?.random_prompts ?? [],
    });
    setVideoTopic(preset.videoTopic);
    setTargetAudience(preset.targetAudience);
    setSummary(preset.summary);
    setTitleLengthPreference(preset.titleLengthPreference);
    setOptimizationPreference(preset.optimizationPreference);
    setAvoidWordsRaw(preset.avoidWords.join(", "));
    setTitles([]);
    setRecommendedTitle("");
    setRecommendedReason("");
    setBackupTitle("");
    toast.success(t("success.random_prompt_selected", "Random example loaded."));
  }, [section, t]);

  const applyHistory = useCallback((item: PersistedHistoryItem) => {
    setVideoTopic(item.videoTopic);
    setTargetAudience(item.targetAudience);
    setSummary(item.summary);
    setTitleLengthPreference(
      item.titleLengthPreference as YoutubeTitleLengthPreference
    );
    setOptimizationPreference(
      item.optimizationPreference as YoutubeTitleOptimizationPreference
    );
    setAvoidWordsRaw(item.avoidWords.join(", "));
    setTitles(item.output);
    setRecommendedTitle(item.recommendedTitle);
    setRecommendedReason(item.recommendedReason);
    setBackupTitle(item.backupTitle);
  }, []);

  const handleDeleteHistory = useCallback(
    (id: string) => {
      deleteHistoryEntry(id);
      setHistory(getHistory());
      toast.success(t("success.history_deleted", "History removed."));
    },
    [t]
  );

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
    toast.success(t("success.history_cleared", "History cleared."));
  }, [t]);

  const handleClearShortlist = useCallback(() => {
    setShortlist([]);
    clearShortlist();
  }, []);

  const renderDiagnostics = (item: GeneratedYoutubeTitle) => {
    const riskColor =
      item.authenticityRisk === "high"
        ? "text-rose-600 dark:text-rose-400"
        : item.authenticityRisk === "medium"
          ? "text-amber-600 dark:text-amber-400"
          : "text-emerald-600 dark:text-emerald-400";

    const truncColor =
      item.truncationRisk === "high"
        ? "text-rose-600 dark:text-rose-400"
        : item.truncationRisk === "medium"
          ? "text-amber-600 dark:text-amber-400"
          : "text-emerald-600 dark:text-emerald-400";

    return (
      <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground sm:text-[11px]">
        <div>
          <span className="text-foreground/60">
            {t("ui.diag_chars", "Chars")}:
          </span>{" "}
          <span className="font-mono text-foreground">{item.characterCount}</span>
        </div>
        <div>
          <span className="text-foreground/60">
            {t("ui.diag_truncation", "Truncation")}:
          </span>{" "}
          <span className={truncColor}>
            {t(
              `risk.${item.truncationRisk}`,
              item.truncationRisk
            )}
          </span>
        </div>
        <div>
          <span className="text-foreground/60">
            {t("ui.diag_keyword", "Keyword")}:
          </span>{" "}
          <span className="text-foreground">
            {t(`placement.${item.keywordPlacement}`, item.keywordPlacement)}
          </span>
        </div>
        <div>
          <span className="text-foreground/60">
            {t("ui.diag_authenticity", "Authenticity")}:
          </span>{" "}
          <span className={riskColor}>
            {t(`risk.${item.authenticityRisk}`, item.authenticityRisk)}
          </span>
        </div>
      </div>
    );
  };

  const renderTitleCard = (item: GeneratedYoutubeTitle, index: number) => {
    const saved = inShortlist(item.title);
    return (
      <motion.div
        key={`${item.title}-${index}`}
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
            <p className="text-base font-semibold leading-snug text-foreground">
              {item.title}
            </p>
            <Badge variant="secondary" className="text-[11px] uppercase tracking-wide">
              {t(`ui.angle_${item.angle.split("-")[0]}`, item.angle)}
            </Badge>
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
                <Sparkles className="mr-1 h-3 w-3" />
                {t("ui.save_button", "Save")}
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">
            {t("ui.reason_label", "Why")}:
          </span>{" "}
          {item.oneLineReason}
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">
            {t("ui.best_use_label", "Best for")}:
          </span>{" "}
          {item.bestUseCase}
        </p>

        <div className="rounded-md border border-border/30 bg-muted/20 p-2.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
            {t("ui.diagnostics_label", "Diagnostics")}
          </p>
          {renderDiagnostics(item)}
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleCopy(item.title)}
            className="h-11 px-2 text-xs sm:h-8 active:scale-[0.98]"
          >
            <Copy className="mr-1 h-3 w-3" />
            {t("ui.copy_title_button", "Copy title")}
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <section
      id="youtube_title_generator"
      className="overflow-hidden py-16 text-foreground selection:bg-orange-500/20 lg:py-24"
    >
      <div className="container relative mx-auto px-4 md:px-6">
        <div className="mb-10">
          <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
            <YoutubeTitleBreadcrumb
              homeText={t("ui.breadcrumb_home", "Home")}
              currentText={t("ui.breadcrumb_current", "YouTube Title Generator")}
            />
          </div>
        </div>

        <div className="relative mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <span className="relative z-10 mb-5 inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-orange-500 opacity-60" />
            {t("ui.eyebrow", "AI Title Tool")}
          </span>

          <h1 className="relative z-10 mt-4 font-display text-4xl font-bold tracking-tight leading-[1.08] text-foreground sm:text-5xl lg:text-[3.25rem]">
            {(() => {
              const titleText = t("ui.title", "YouTube Title Generator");
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

          <p className="relative z-10 mx-auto mt-5 max-w-xl text-base font-light leading-relaxed text-muted-foreground/65 sm:text-lg">
            {t(
              "ui.subtitle",
              "Generate grouped title angles from your summary, compare shortlisted options, and pick a stronger title before you publish."
            )}
          </p>

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

        <div className="mx-auto mt-8 grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <Card>
            <CardHeader>
              <CardTitle>{t("ui.options_title", "Video brief")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Label htmlFor="yt-topic">
                    {t("ui.topic_label", "What is the video about?")}
                  </Label>
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
                  id="yt-topic"
                  value={videoTopic}
                  onChange={(e) => setVideoTopic(e.target.value)}
                  placeholder={t(
                    "ui.topic_placeholder",
                    "e.g. how I edit long-form YouTube videos faster"
                  )}
                  className="min-h-20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yt-audience">
                  {t("ui.audience_label", "Who is it for?")}
                </Label>
                <Input
                  id="yt-audience"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder={t(
                    "ui.audience_placeholder",
                    "e.g. solo creators editing their own videos"
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yt-summary">
                  {t("ui.summary_label", "Short summary")}
                </Label>
                <Textarea
                  id="yt-summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder={t(
                    "ui.summary_placeholder",
                    "One or two sentences on what viewers will learn or feel"
                  )}
                  className="min-h-24"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("ui.length_label", "Title length")}</Label>
                  <Select
                    value={titleLengthPreference}
                    onValueChange={(v) =>
                      setTitleLengthPreference(v as YoutubeTitleLengthPreference)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LENGTH_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {t(`length.${opt}`, opt)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("ui.optimization_label", "Optimize for")}</Label>
                  <Select
                    value={optimizationPreference}
                    onValueChange={(v) =>
                      setOptimizationPreference(
                        v as YoutubeTitleOptimizationPreference
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPTIMIZATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {t(`optimization.${opt}`, opt)}
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
                      {t("ui.advanced_title", "Advanced options")}
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
                      <Label htmlFor="yt-transcript">
                        {t("ui.transcript_label", "Transcript (optional)")}
                      </Label>
                      <Textarea
                        id="yt-transcript"
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder={t(
                          "ui.transcript_placeholder",
                          "Paste a transcript or key points to anchor titles in real content"
                        )}
                        className="min-h-28"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yt-avoid">
                        {t("ui.avoid_words_label", "Avoid words (optional)")}
                      </Label>
                      <Input
                        id="yt-avoid"
                        value={avoidWordsRaw}
                        onChange={(e) => setAvoidWordsRaw(e.target.value)}
                        placeholder={t(
                          "ui.avoid_words_placeholder",
                          "comma-separated words to never use"
                        )}
                      />
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
                    : t("ui.generate_button", "Generate Titles")}
                </Button>
                {titles.length > 0 && (
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
              <CardTitle>{t("ui.output_title", "Title angles")}</CardTitle>
              {titles.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {t("ui.results_count", "{count} titles").replace(
                    "{count}",
                    String(titles.length)
                  )}
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {titles.length === 0 ? (
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
                      {t("ui.generating_output", "Generating your titles...")}
                    </p>
                  </div>
                ) : (
                  <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/40 bg-muted/20 p-4 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-orange-500/5">
                      <Lightbulb
                        className="size-5 text-orange-500/60 dark:text-orange-400/60 animate-pulse"
                        strokeWidth={1.5}
                      />
                    </div>
                    <p className="max-w-xs text-sm text-muted-foreground">
                      {t(
                        "ui.empty_output",
                        "Describe your video and audience, then generate to see grouped title angles here."
                      )}
                    </p>
                  </div>
                )
              ) : (
                <div className="space-y-5 md:max-h-[640px] md:overflow-y-auto md:pr-1">
                  {ANGLE_GROUPS.map(({ key, labelKey }) => {
                    const groupItems = grouped[key];
                    if (!groupItems || groupItems.length === 0) return null;
                    return (
                      <div key={key} className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-foreground">
                            {t(labelKey, key)}
                          </h3>
                          <span className="text-[11px] text-muted-foreground">
                            {groupItems.length}
                          </span>
                        </div>
                        <div className="grid gap-3">
                          {groupItems.map((item, idx) =>
                            renderTitleCard(item, idx)
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {titles.length > 0 && (
          <div className="mx-auto mt-12 w-full max-w-6xl space-y-6">
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.02] p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-lg font-semibold">
                  {t("ui.recommendation_title", "Recommended final title")}
                </h3>
              </div>
              {recommendedItem ? (
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                  <div className="space-y-2">
                    <p className="font-display text-lg font-bold leading-snug text-foreground sm:text-xl md:text-2xl">
                      {recommendedItem.title}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary">
                        {t(
                          `ui.angle_${recommendedItem.angle.split("-")[0]}`,
                          recommendedItem.angle
                        )}
                      </Badge>
                      <Badge variant="outline">
                        {t("ui.best_use_label", "Best for")}:{" "}
                        {recommendedItem.bestUseCase}
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
                        onClick={() => handleCopy(recommendedItem.title)}
                        className="h-11 bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 sm:h-9 active:scale-[0.98]"
                      >
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        {t("ui.copy_title_button", "Copy title")}
                      </Button>
                    </div>
                    {backupItem && (
                      <p className="mt-3 border-t border-border/30 pt-3 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/70">
                          {t("ui.recommendation_backup_label", "Backup option")}:
                        </span>{" "}
                        <button
                          type="button"
                          onClick={() => handleCopy(backupItem.title)}
                          className="font-medium text-orange-600 hover:underline dark:text-orange-400"
                        >
                          {backupItem.title}
                        </button>
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-border/40 bg-background/60 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("ui.diagnostics_label", "Diagnostics")}
                    </p>
                    {renderDiagnostics(recommendedItem)}
                    <p className="mt-3 border-t border-border/30 pt-3 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/70">
                        {t("ui.reason_label", "Why")}:
                      </span>{" "}
                      {recommendedItem.oneLineReason}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {recommendedTitle ||
                    t("ui.empty_output", "No recommendation yet.")}
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
                    {t(
                      "ui.shortlist_hint",
                      `Save up to ${MAX_SHORTLIST} titles to compare.`
                    )}
                  </p>
                </div>
                {shortlist.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearShortlist}
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
                    "Save titles from the results above to compare them side by side."
                  )}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {shortlist.map((item, i) => (
                    <motion.div
                      key={`shortlist-${item.title}`}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="relative flex flex-col gap-3 rounded-lg border border-orange-500/30 bg-orange-500/[0.02] p-4"
                    >
                      <button
                        type="button"
                        onClick={() => toggleShortlist(item)}
                        className="absolute right-1 top-1 inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label="remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <div className="space-y-1 pr-6">
                        <p className="font-display text-sm font-semibold leading-snug">
                          {item.title}
                        </p>
                        <Badge variant="secondary" className="text-[11px]">
                          {t(
                            `ui.angle_${item.angle.split("-")[0]}`,
                            item.angle
                          )}
                        </Badge>
                      </div>
                      {renderDiagnostics(item)}
                      <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(item.title)}
                          className="h-9 px-2 text-xs"
                        >
                          <Copy className="mr-1 h-3 w-3" />
                          {t("ui.copy_title_button", "Copy")}
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
                onClick={handleClearHistory}
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
                    <p className="font-medium">{item.videoTopic}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()} ·{" "}
                      {item.output.length} titles · picked:{" "}
                      {item.recommendedTitle || "—"}
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
                      onClick={() => handleDeleteHistory(item.id)}
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
