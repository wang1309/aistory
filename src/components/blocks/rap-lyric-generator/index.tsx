"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Mic,
  PenLine,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import TurnstileInvisible, {
  TurnstileInvisibleHandle,
} from "@/components/TurnstileInvisible";
import { Link } from "@/i18n/navigation";
import { LANGUAGE_OPTIONS } from "@/lib/language-options";
import { useCreativeQuotaPage } from "@/hooks/useCreativeQuotaPage";
import { CreativeQuotaHint } from "@/components/blocks/creative-quota-hint";
import { CreativeQuotaPaywall } from "@/components/blocks/creative-quota-paywall";
import {
  RAP_LYRIC_TOPIC_LIMIT,
  type RapLyricContentRating,
  type RapLyricFormat,
  type RapLyricModel,
  type RapLyricRhymeDensity,
  type RapLyricStyle,
} from "@/app/api/rap-lyric-generator/_lib";
import type { RapLyricGeneratorPage, RapLyricOption } from "@/types/blocks/rap-lyric-generator";

// Fixed UI defaults. Reset always returns to exactly this state.
const DEFAULT_FORMAT: RapLyricFormat = "verse_16";
const DEFAULT_STYLE: RapLyricStyle = "trap";
const DEFAULT_CONTENT_RATING: RapLyricContentRating = "clean";
const DEFAULT_RHYME_DENSITY: RapLyricRhymeDensity = "balanced";
const DEFAULT_MODEL: RapLyricModel = "standard";

interface RapLyricGeneratorProps {
  section: RapLyricGeneratorPage;
}

function countBars(text: string): number {
  if (!text.trim()) return 0;
  return text.split("\n").filter((line) => line.trim()).length;
}

export default function RapLyricGenerator({ section }: RapLyricGeneratorProps) {
  const locale = useLocale();
  const tAiTools = useTranslations("ai_tools");
  const creativeQuota = useCreativeQuotaPage("rap-lyric-generator");

  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState<RapLyricFormat>(DEFAULT_FORMAT);
  const [style, setStyle] = useState<RapLyricStyle>(DEFAULT_STYLE);
  const [contentRating, setContentRating] = useState<RapLyricContentRating>(DEFAULT_CONTENT_RATING);
  const [rhymeDensity, setRhymeDensity] = useState<RapLyricRhymeDensity>(DEFAULT_RHYME_DENSITY);
  const [selectedLanguage, setSelectedLanguage] = useState(locale);
  const [selectedModel, setSelectedModel] = useState<RapLyricModel>(DEFAULT_MODEL);

  const [lyrics, setLyrics] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const t = useCallback(
    (path: string) => {
      const keys = path.split(".");
      let value = section as unknown as Record<string, unknown>;
      for (const key of keys) {
        value = value?.[key] as Record<string, unknown>;
      }
      return (value as unknown as string) || path;
    },
    [section]
  );

  const titleParts = useMemo(() => {
    const fullTitle = t("ui.title");
    const highlight = t("ui.title_highlight");
    if (highlight && highlight !== "ui.title_highlight" && fullTitle.includes(highlight)) {
      const index = fullTitle.indexOf(highlight);
      return {
        before: fullTitle.slice(0, index),
        highlight,
        after: fullTitle.slice(index + highlight.length),
      };
    }
    return { before: fullTitle, highlight: "", after: "" };
  }, [t]);

  const trimmedTopic = topic.trim();
  const topicLength = trimmedTopic.length;
  const isTopicTooLong = topicLength > RAP_LYRIC_TOPIC_LIMIT;
  const canGenerate = trimmedTopic.length > 0 && !isTopicTooLong && !isGenerating;

  const statusText = isGenerating
    ? t("ui.status_writing")
    : lyrics
      ? t("ui.status_done")
      : t("ui.status_idle");

  const runGeneration = useCallback(
    async (turnstileToken: string) => {
      setLyrics("");
      setCopied(false);
      setIsGenerating(true);
      if (outputRef.current) outputRef.current.scrollTop = 0;

      try {
        const response = await fetch("/api/rap-lyric-generator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: trimmedTopic,
            format,
            style,
            contentRating,
            rhymeDensity,
            locale: selectedLanguage,
            model: selectedModel,
            turnstileToken,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          if (creativeQuota.handleQuotaError(response.status, errorData)) return;
          toast.error(t("errors.generation_failed"));
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          toast.error(t("errors.no_content"));
          return;
        }

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setLyrics(accumulated);
        }
        accumulated += decoder.decode();
        setLyrics(accumulated);

        if (!accumulated.trim()) {
          toast.error(t("errors.no_content"));
          return;
        }

        if (selectedModel === "creative") creativeQuota.increment();
      } catch {
        toast.error(t("errors.generation_failed"));
      } finally {
        setIsGenerating(false);
      }
    },
    [trimmedTopic, format, style, contentRating, rhymeDensity, selectedLanguage, selectedModel, creativeQuota, t]
  );

  const handleGenerate = useCallback(() => {
    if (!canGenerate) {
      if (!trimmedTopic) toast.error(t("validation.enter_topic"));
      else if (isTopicTooLong) toast.error(t("validation.topic_too_long"));
      return;
    }
    if (
      creativeQuota.guardAnonymousCreativeQuota({
        selectedModel,
        message: "Daily free Creative quota reached. Please sign in to continue.",
      }) ||
      creativeQuota.guardCreativeCreditQuota({ selectedModel })
    ) {
      return;
    }
    setIsGenerating(true);
    turnstileRef.current?.execute();
  }, [
    canGenerate,
    trimmedTopic,
    isTopicTooLong,
    creativeQuota,
    selectedModel,
    t,
  ]);

  const handleTurnstileSuccess = useCallback(
    (turnstileToken: string) => {
      void runGeneration(turnstileToken);
    },
    [runGeneration]
  );

  const handleTurnstileError = useCallback(() => {
    setIsGenerating(false);
    toast.error(t("errors.generation_failed"));
  }, [t]);

  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleReset = useCallback(() => {
    setTopic("");
    setFormat(DEFAULT_FORMAT);
    setStyle(DEFAULT_STYLE);
    setContentRating(DEFAULT_CONTENT_RATING);
    setRhymeDensity(DEFAULT_RHYME_DENSITY);
    setSelectedLanguage(locale);
    setSelectedModel(DEFAULT_MODEL);
    setLyrics("");
    setCopied(false);
  }, [locale]);

  const handleCopy = useCallback(async () => {
    if (!lyrics.trim()) return;
    try {
      await navigator.clipboard.writeText(lyrics);
    } catch {
      toast.error(t("errors.copy_failed"));
      return;
    }
    setCopied(true);
    toast.success(t("success.result_copied"));
  }, [lyrics, t]);

  const renderSelect = (
    id: string,
    label: string,
    value: string,
    options: RapLyricOption[],
    onChange: (value: string) => void
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-medium tracking-wide text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={isGenerating}>
        <SelectTrigger
          id={id}
          aria-label={label}
          className="h-11 w-full rounded-lg border-border/50 bg-background"
        >
          <SelectValue>{options.find((option) => option.value === value)?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div id="rap_lyric_generator" className="relative bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 inset-x-0 h-[420px] bg-gradient-to-b from-primary/[0.05] via-primary/[0.02] to-transparent" />
      </div>
      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={handleTurnstileSuccess}
        onError={handleTurnstileError}
      />

      <main className="relative container mx-auto max-w-6xl px-4 py-12 sm:py-16 lg:py-20">
        <div className="mb-8">
          <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
            <Link href="/" className="inline-flex items-center py-2 transition-colors hover:text-foreground/80">
              {t("ui.breadcrumb_home")}
            </Link>
            <span className="mx-2 text-muted-foreground/40">/</span>
            <Link href="/ai-tools" className="inline-flex items-center py-2 transition-colors hover:text-foreground/80">
              {tAiTools("tools_hub_nav")}
            </Link>
            <span className="mx-2 text-muted-foreground/40">/</span>
            <span className="text-foreground/80">{t("ui.breadcrumb_current")}</span>
          </div>
        </div>

        <div className="relative mx-auto mb-8 max-w-2xl text-center">
          <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-primary/50 opacity-60" />
            {t("ui.eyebrow")}
          </span>
          <h1 className="relative z-10 mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
            {titleParts.before}
            {titleParts.highlight && (
              <span className="text-gradient-ember italic">{titleParts.highlight}</span>
            )}
            {titleParts.after}
          </h1>
          <p className="relative z-10 mx-auto mt-4 max-w-xl text-base font-light leading-relaxed text-muted-foreground/80 sm:text-lg">
            {t("ui.subtitle")}
          </p>
        </div>

        <div className="mb-8 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
          <div className="space-y-4 rounded-3xl border border-border/50 bg-card p-6 shadow-sm lg:sticky lg:top-24">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="rap-lyric-topic" className="text-sm font-semibold text-foreground">
                  {t("ui.topic_label")} <span className="text-primary">*</span>
                </Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {topicLength} / {RAP_LYRIC_TOPIC_LIMIT}
                </span>
              </div>
              <Textarea
                id="rap-lyric-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder={t("placeholders.topic")}
                aria-describedby="rap-lyric-topic-hint"
                aria-invalid={isTopicTooLong}
                disabled={isGenerating}
                className="min-h-[140px] resize-y rounded-xl border-border/50 bg-background p-4 text-base leading-relaxed focus-visible:border-primary/50 focus-visible:ring-primary/20"
              />
              <p id="rap-lyric-topic-hint" className="text-xs text-muted-foreground">
                {t("ui.topic_hint")}
              </p>
            </div>

            {section.ui.topic_examples?.length ? (
              <div className="space-y-2">
                <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                  {t("ui.topic_examples_label")}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {section.ui.topic_examples.map((example) => (
                    <Button
                      key={example}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTopic(example)}
                      disabled={isGenerating}
                      className="h-11 max-w-full rounded-full px-3 text-left text-xs"
                    >
                      <span className="line-clamp-1">{example}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            {renderSelect("rap-lyric-format", t("ui.format_label"), format, section.ui.format_options, (value) =>
              setFormat(value as RapLyricFormat)
            )}
            {renderSelect("rap-lyric-style", t("ui.style_label"), style, section.ui.style_options, (value) =>
              setStyle(value as RapLyricStyle)
            )}
            {renderSelect(
              "rap-lyric-rating",
              t("ui.content_rating_label"),
              contentRating,
              section.ui.content_rating_options,
              (value) => setContentRating(value as RapLyricContentRating)
            )}
            {renderSelect(
              "rap-lyric-rhyme",
              t("ui.rhyme_density_label"),
              rhymeDensity,
              section.ui.rhyme_density_options,
              (value) => setRhymeDensity(value as RapLyricRhymeDensity)
            )}
            {renderSelect("rap-lyric-language", t("ui.language_label"), selectedLanguage, LANGUAGE_OPTIONS.map((option) => ({ value: option.code, label: option.name })), setSelectedLanguage)}

            <div className="space-y-2">
              <Label htmlFor="rap-lyric-model" className="text-xs font-medium tracking-wide text-muted-foreground">
                {t("ui.ai_model_label")}
              </Label>
              <Select
                value={selectedModel}
                onValueChange={(value) => setSelectedModel(value as RapLyricModel)}
                disabled={isGenerating}
              >
                <SelectTrigger
                  id="rap-lyric-model"
                  aria-label={t("ui.ai_model_label")}
                  className="h-11 w-full rounded-lg border-border/50 bg-background"
                >
                  <SelectValue>
                    <span className="flex items-center gap-1.5">
                      {selectedModel === "fast" ? (
                        <Zap className="size-3.5" aria-hidden="true" />
                      ) : selectedModel === "creative" ? (
                        <Sparkles className="size-3.5" aria-hidden="true" />
                      ) : (
                        <PenLine className="size-3.5" aria-hidden="true" />
                      )}
                      {t(`ai_models.${selectedModel}`)}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">
                    <span className="flex items-center gap-1.5">
                      <Zap className="size-3.5" aria-hidden="true" />
                      {t("ai_models.fast")}
                    </span>
                  </SelectItem>
                  <SelectItem value="standard">
                    <span className="flex items-center gap-1.5">
                      <PenLine className="size-3.5" aria-hidden="true" />
                      {t("ai_models.standard")}
                    </span>
                  </SelectItem>
                  <SelectItem value="creative">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="size-3.5" aria-hidden="true" />
                      {t("ai_models.creative")}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedModel === "fast"
                  ? t("ai_models.fast_description")
                  : selectedModel === "creative"
                    ? t("ai_models.creative_description")
                    : t("ai_models.standard_description")}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="min-h-12 flex-1 bg-primary text-base font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="mr-2 size-5 shrink-0 animate-pulse" aria-hidden="true" />
                    {t("ui.generating")}
                  </>
                ) : selectedModel === "creative" &&
                  creativeQuota.anonymousCreativeExhausted ? (
                  <>
                    <Sparkles className="mr-2 size-5 shrink-0" aria-hidden="true" />
                    {t("ui.sign_in_to_continue")}
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 size-5 shrink-0" aria-hidden="true" />
                    {t("ui.generate")}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isGenerating}
                aria-label={t("ui.reset")}
                className="min-h-12 sm:w-auto"
              >
                <RotateCcw className="mr-2 size-4" aria-hidden="true" />
                {t("ui.reset")}
              </Button>
            </div>
            <CreativeQuotaHint
              pageKey="rap-lyric-generator"
              selectedModel={selectedModel}
              used={creativeQuota.used}
              limit={creativeQuota.limit}
              className="mt-3"
            />
          </div>

          <div className="flex flex-col overflow-hidden rounded-3xl border border-border/50 bg-card shadow-sm">
            <div className="flex items-center gap-3 border-b border-border/40 px-6 py-4 sm:px-8">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Mic className="size-4" aria-hidden="true" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">{t("ui.result_title")}</h2>
              {lyrics && !isGenerating ? (
                <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                  {t("ui.line_count")}: {countBars(lyrics)}
                </span>
              ) : null}
            </div>

            <p
              role="status"
              aria-live="polite"
              className="border-b border-border/40 px-6 py-2 text-xs text-muted-foreground sm:px-8"
            >
              {statusText}
            </p>

            <div
              ref={outputRef}
              className="custom-scrollbar max-h-[60dvh] min-h-[280px] flex-1 overflow-y-auto px-6 py-6 sm:px-8"
            >
              {isGenerating && !lyrics ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-5 text-center opacity-70">
                  <div className="relative mx-auto size-14">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-t-primary" />
                  </div>
                  <p className="text-sm font-medium">{t("ui.generating")}</p>
                </div>
              ) : lyrics ? (
                <div className="whitespace-pre-wrap break-words text-base leading-loose text-foreground/90">
                  {lyrics}
                </div>
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center opacity-60">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/5">
                    <Mic className="size-7 text-primary/50" aria-hidden="true" />
                  </div>
                  <p className="mx-auto max-w-xs text-sm text-muted-foreground">
                    {t("ui.output_empty")}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 border-t border-border/40 px-6 py-4 sm:px-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopy}
                  disabled={!lyrics || isGenerating}
                  className="min-h-11 w-full sm:w-auto"
                >
                  {copied ? (
                    <Check className="mr-2 size-4 text-primary" aria-hidden="true" />
                  ) : (
                    <Copy className="mr-2 size-4" aria-hidden="true" />
                  )}
                  {t("ui.copy_result")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={!canGenerate}
                  className="min-h-11 w-full sm:w-auto"
                >
                  <RefreshCw className="mr-2 size-4" aria-hidden="true" />
                  {t("ui.regenerate")}
                </Button>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("ui.safety_note")}
              </p>
            </div>
          </div>
        </div>
      </main>

      <CreativeQuotaPaywall
        open={creativeQuota.paywallOpen}
        onClose={() => creativeQuota.setPaywallOpen(false)}
        sourcePage="rap-lyric-generator"
      />
    </div>
  );
}
