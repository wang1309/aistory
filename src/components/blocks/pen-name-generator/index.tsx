"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useOpenPanel } from "@openpanel/nextjs";
import { toast } from "sonner";
import {
  Copy,
  Feather,
  Heart,
  RefreshCw,
  ShieldCheck,
  Wand2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import TurnstileInvisible, {
  TurnstileInvisibleHandle,
} from "@/components/TurnstileInvisible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useCreativeQuotaPage } from "@/hooks/useCreativeQuotaPage";
import { useAppContext } from "@/contexts/app";
import { CreativeQuotaHint } from "@/components/blocks/creative-quota-hint";
import { CreativeQuotaPaywall } from "@/components/blocks/creative-quota-paywall";
import { getCreativeLimit } from "@/lib/creative-quota-client";
import type {
  PenNameBrandGoal,
  PenNameCandidate,
  PenNameForm,
  PenNameGenre,
  PenNameGeneratorResponse,
  PenNameMarket,
  PenNameModelMode,
  PenNameTone,
} from "@/types/pen-name-generator";
import type { PenNameGeneratorPage } from "@/types/blocks/pen-name-generator";

interface Props {
  section: PenNameGeneratorPage;
}

const MAX_CUE = 120;
const MAX_INSPIRATION_NAME = 100;

// Writing glyphs cycling in the loading state; keep in sync with the
// pen-glyph-swap keyframe timing in globals.css (1.25s per glyph).
const LOADING_GLYPHS = ["✒", "✎", "❦", "¶", "❧", "✍", "§", "✜"];

// Closed control lists mirror the API contract in src/types/pen-name-generator.
const GENRES: PenNameGenre[] = [
  "romance",
  "thriller_mystery",
  "fantasy",
  "science_fiction",
  "literary",
  "non_fiction",
  "general",
];
const BRAND_GOALS: PenNameBrandGoal[] = [
  "single_brand",
  "separate_genres",
  "privacy_first",
  "initials_led",
];
const TONES: PenNameTone[] = [
  "classic",
  "warm",
  "bold",
  "mysterious",
  "modern",
  "scholarly",
];
const NAME_FORMS: PenNameForm[] = [
  "full_name",
  "first_initial",
  "initials_surname",
  "single_name",
];
const TARGET_MARKETS: PenNameMarket[] = ["en", "zh", "de", "ko", "ja", "ru"];
const MODEL_MODES: PenNameModelMode[] = ["fast", "standard", "creative"];

export default function PenNameGenerator({ section }: Props) {
  const locale = useLocale();
  const tAiTools = useTranslations("ai_tools");
  const { track } = useOpenPanel();
  const creativeQuota = useCreativeQuotaPage("pen-name-generator");
  const { user } = useAppContext();
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  // Carries a one-shot inspiration override from Similar/Reroll into the
  // Turnstile success handler (state updates alone would arrive too late).
  const pendingInspirationRef = useRef<string | null>(null);
  // The screening checklist analytics event fires once per session at most.
  const screeningTrackedRef = useRef(false);
  const ui = section.ui;

  const initialMarket = TARGET_MARKETS.includes(locale as PenNameMarket)
    ? (locale as PenNameMarket)
    : "en";

  const [genre, setGenre] = useState<PenNameGenre>("general");
  const [brandGoal, setBrandGoal] = useState<PenNameBrandGoal>("single_brand");
  const [tone, setTone] = useState<PenNameTone>("classic");
  const [nameForm, setNameForm] = useState<PenNameForm>("full_name");
  const [targetMarket, setTargetMarket] = useState<PenNameMarket>(initialMarket);
  const [cue, setCue] = useState("");
  const [inspirationName, setInspirationName] = useState("");
  const [mode, setMode] = useState<PenNameModelMode>("standard");
  const [results, setResults] = useState<PenNameGeneratorResponse | null>(null);
  const [favorites, setFavorites] = useState<PenNameCandidate[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [screeningOpen, setScreeningOpen] = useState(false);

  const titleHighlight = ui.title_highlight ?? "";
  const fullTitle = ui.title ?? "";
  const themePills = ui.theme_pills ?? [];

  const titleParts = useMemo(() => {
    if (titleHighlight && fullTitle.includes(titleHighlight)) {
      const idx = fullTitle.indexOf(titleHighlight);
      return {
        before: fullTitle.slice(0, idx),
        after: fullTitle.slice(idx + titleHighlight.length),
        highlight: titleHighlight,
      };
    }
    return { before: fullTitle, after: "", highlight: "" };
  }, [fullTitle, titleHighlight]);

  const runGeneration = useCallback(
    async (turnstileToken: string) => {
      const inspirationOverride = pendingInspirationRef.current;
      pendingInspirationRef.current = null;
      const activeInspiration = inspirationOverride ?? inspirationName;
      try {
        const response = await fetch("/api/pen-name", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            genre,
            brandGoal,
            tone,
            nameForm,
            targetMarket,
            cue,
            inspirationName: activeInspiration,
            locale,
            mode,
            turnstileToken,
          }),
        });
        const json = await response.json();
        if (!response.ok || json.code === -1) {
          if (creativeQuota.handleQuotaError(response.status, json)) return;
          toast.error(json.message ?? section.errors.generate_failed);
          return;
        }
        setResults(json as PenNameGeneratorResponse);
        if (mode === "creative") {
          creativeQuota.increment();
        }
        toast.success(section.success.generated);
        track("pen_name_generated", {
          locale,
          genre,
          brand_goal: brandGoal,
          tone,
          name_form: nameForm,
          target_market: targetMarket,
          mode,
          has_cue: Boolean(cue.trim()),
        });
      } catch (error) {
        console.error("pen name generation failed", error);
        toast.error(section.validation.generic_error);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      genre,
      brandGoal,
      tone,
      nameForm,
      targetMarket,
      cue,
      inspirationName,
      locale,
      mode,
      section,
      track,
      creativeQuota,
    ]
  );

  const onGenerate = useCallback(
    (inspirationOverride?: string) => {
      if (cue.length > MAX_CUE) {
        toast.error(section.validation.cue_too_long);
        return;
      }
      if (
        (inspirationOverride ?? inspirationName).length > MAX_INSPIRATION_NAME
      ) {
        toast.error(section.validation.inspiration_too_long);
        return;
      }
      if (
        creativeQuota.guardAnonymousCreativeQuota({
          selectedModel: mode,
          message: section.validation.creative_limit_reached,
        }) ||
        creativeQuota.guardCreativeCreditQuota({ selectedModel: mode })
      ) {
        return;
      }
      pendingInspirationRef.current = inspirationOverride ?? null;
      setIsGenerating(true);
      turnstileRef.current?.execute();
    },
    [cue, inspirationName, mode, section.validation, creativeQuota]
  );

  const onCopy = useCallback(
    async (candidate: PenNameCandidate) => {
      try {
        await navigator.clipboard.writeText(candidate.name);
        toast.success(section.success.copied);
        track("pen_name_copied", {
          locale,
          genre,
          brand_goal: brandGoal,
        });
      } catch (error) {
        console.error("pen name copy failed", error);
        toast.error(section.validation.generic_error);
      }
    },
    [locale, genre, brandGoal, section, track]
  );

  const onToggleFavorite = useCallback(
    (candidate: PenNameCandidate) => {
      const isFavorited = favorites.some((item) => item.name === candidate.name);
      setFavorites((prev) =>
        isFavorited
          ? prev.filter((item) => item.name !== candidate.name)
          : [...prev, candidate]
      );
      toast.success(
        isFavorited ? section.success.unfavorited : section.success.favorited
      );
      track("pen_name_favorite_toggled", {
        locale,
        genre,
        brand_goal: brandGoal,
      });
    },
    [favorites, locale, genre, brandGoal, section.success, track]
  );

  const onSimilar = useCallback(
    (candidate: PenNameCandidate) => {
      setInspirationName(candidate.name);
      track("pen_name_similar_generated", {
        locale,
        genre,
        brand_goal: brandGoal,
      });
      onGenerate(candidate.name);
    },
    [locale, genre, brandGoal, onGenerate, track]
  );

  const onReroll = useCallback(() => {
    setInspirationName("");
    track("pen_name_rerolled", {
      locale,
      genre,
      brand_goal: brandGoal,
    });
    onGenerate("");
  }, [locale, genre, brandGoal, onGenerate, track]);

  const onToggleScreening = useCallback(() => {
    setScreeningOpen((prev) => !prev);
    if (!screeningTrackedRef.current) {
      screeningTrackedRef.current = true;
      track("pen_name_screening_opened", {
        locale,
        genre,
        brand_goal: brandGoal,
      });
    }
  }, [locale, genre, brandGoal, track]);

  const screeningTitle = section.screening?.title ?? "Screen before publishing";

  const renderSelect = useCallback(
    (
      id: string,
      label: string,
      value: string,
      values: string[],
      options: PenNameGeneratorPage["ui"],
      optionKey: "genre_options" | "brand_goal_options" | "tone_options" | "name_form_options" | "target_market_options",
      onValueChange: (value: string) => void
    ) => {
      const optionList =
        options[optionKey as keyof typeof options] as PenNameGeneratorPage["ui"]["genre_options"];
      return (
        <div>
          <Label htmlFor={id}>{label}</Label>
          <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger id={id} className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {values.map((item) => (
                <SelectItem key={item} value={item}>
                  {optionList.find((opt) => opt.value === item)?.label ?? item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    },
    []
  );

  return (
    <section
      id="pen_name_generator"
      className="min-h-[100dvh] bg-background text-foreground selection:bg-primary/20"
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.97_0_0),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.17_0_0),transparent)]" />
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-primary/[0.04] via-primary/[0.02] to-transparent" />
      </div>

      <main className="container relative z-10 mx-auto max-w-7xl px-3 sm:px-4 py-12 sm:py-16 lg:py-20">
        {/* Breadcrumb pill */}
        <div className="mb-10 flex justify-start">
          <div className="inline-flex items-center min-w-0 max-w-full rounded-full border border-border/20 bg-background/80 px-3 sm:px-4 py-1.5 text-xs text-muted-foreground">
            <Link
              href="/"
              className="transition-colors hover:text-foreground/80 truncate max-w-[80px] sm:max-w-[120px]"
            >
              {ui.breadcrumb_home}
            </Link>
            <span className="mx-1.5 sm:mx-2 text-muted-foreground/40 shrink-0">/</span>
            <Link
              href="/ai-tools"
              className="transition-colors hover:text-foreground/80 truncate max-w-[100px] sm:max-w-[140px]"
            >
              {tAiTools("tools_hub_nav")}
            </Link>
            <span className="mx-1.5 sm:mx-2 text-muted-foreground/40 shrink-0">/</span>
            <span className="text-foreground/80 truncate max-w-[120px] sm:max-w-[160px]">{ui.breadcrumb_current}</span>
          </div>
        </div>

        {/* Hero copy */}
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <div className="group mb-6 flex justify-center">
            <div className="relative rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 dark:bg-white/[0.015]">
              <div className="relative flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <Feather className="relative size-6 text-primary" />
              </div>
            </div>
          </div>

          <span className="mb-5 inline-flex items-center rounded-full border border-border/25 bg-background/80 px-3 sm:px-4 py-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {ui.eyebrow}
          </span>

          <h1 className="mt-4 pb-1 font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.08] tracking-tight text-foreground">
            {titleParts.before}
            {titleParts.highlight && (
              <span className="text-gradient-ember italic">
                {titleParts.highlight}
              </span>
            )}
            {titleParts.after}
          </h1>

          <p className="mx-auto mt-5 max-w-xl font-light text-sm sm:text-base leading-relaxed text-muted-foreground/65">
            {ui.subtitle}
          </p>

          {themePills.length > 0 && (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              {themePills.map((pill, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.04] px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-medium text-primary"
                >
                  <span className="inline-block size-1 rounded-full bg-primary/60" />
                  {pill}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-6 md:gap-8 md:grid-cols-[1fr_1fr] lg:grid-cols-[2fr_3fr]">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>{ui.form_title}</CardTitle>
            </CardHeader>
            {/* Strategic picks lead full-width; short voice controls pair
                into two columns. Triggers need explicit w-full inside the
                grid (they are w-fit by default). */}
            <CardContent className="space-y-7">
              <div className="space-y-4">
                {renderSelect(
                  "pen-name-genre",
                  ui.genre_label,
                  genre,
                  GENRES,
                  ui,
                  "genre_options",
                  (v) => setGenre(v as PenNameGenre)
                )}

                {renderSelect(
                  "pen-name-brand-goal",
                  ui.brand_goal_label,
                  brandGoal,
                  BRAND_GOALS,
                  ui,
                  "brand_goal_options",
                  (v) => setBrandGoal(v as PenNameBrandGoal)
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {renderSelect(
                  "pen-name-tone",
                  ui.tone_label,
                  tone,
                  TONES,
                  ui,
                  "tone_options",
                  (v) => setTone(v as PenNameTone)
                )}

                {renderSelect(
                  "pen-name-form",
                  ui.name_form_label,
                  nameForm,
                  NAME_FORMS,
                  ui,
                  "name_form_options",
                  (v) => setNameForm(v as PenNameForm)
                )}
              </div>

              <div className="space-y-4">
                {renderSelect(
                  "pen-name-market",
                  ui.target_market_label,
                  targetMarket,
                  TARGET_MARKETS,
                  ui,
                  "target_market_options",
                  (v) => setTargetMarket(v as PenNameMarket)
                )}

                <div>
                  <Label htmlFor="pen-name-cue">{ui.cue_label}</Label>
                  <Textarea
                    id="pen-name-cue"
                    placeholder={ui.cue_placeholder}
                    value={cue}
                    onChange={(e) => setCue(e.target.value)}
                    rows={2}
                    className="mt-1.5 resize-none min-h-[60px] sm:min-h-[80px]"
                    maxLength={MAX_CUE}
                  />
                  <p className="mt-1 text-right text-[10px] sm:text-[11px] text-muted-foreground/50">
                    {cue.length}/{MAX_CUE}
                  </p>
                </div>
              </div>

              {inspirationName && (
                <p className="rounded-md border border-primary/20 bg-primary/[0.04] px-3 py-2 text-[11px] sm:text-xs text-primary">
                  {ui.inspiration_hint} {inspirationName}
                </p>
              )}

              {/* Terminal · model + action: the cost decision sits right above the button it controls. */}
              <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-foreground/[0.015] p-4 dark:bg-white/[0.02]">
                <div>
                  <Label>{ui.mode_label}</Label>
                  <ToggleGroup
                    type="single"
                    value={mode}
                    onValueChange={(value) => {
                      if (value) setMode(value as PenNameModelMode);
                    }}
                    variant="outline"
                    className="mt-1.5 w-full"
                  >
                    {MODEL_MODES.map((value) => {
                      const isCreativeUsedUp =
                        value === "creative" &&
                        creativeQuota.used >= getCreativeLimit();
                      return (
                        <ToggleGroupItem
                          key={value}
                          value={value}
                          className={cn(
                            "h-12 sm:h-11 flex-1 whitespace-normal text-sm sm:text-xs",
                            "data-[state=on]:border-primary/40 data-[state=on]:bg-primary/10 data-[state=on]:text-primary",
                            "dark:data-[state=on]:border-primary/40 dark:data-[state=on]:bg-primary/10 dark:data-[state=on]:text-primary/25",
                            isCreativeUsedUp && "opacity-60"
                          )}
                        >
                          {ui.mode_options.find((opt) => opt.value === value)
                            ?.label ?? value}
                          {isCreativeUsedUp && (
                            <span
                              className="ml-1.5 inline-block size-1.5 rounded-full bg-amber-500 ring-2 ring-background"
                              title={section.validation.creative_limit_reached}
                            />
                          )}
                        </ToggleGroupItem>
                      );
                    })}
                  </ToggleGroup>
                </div>

                <Button
                  onClick={() => onGenerate()}
                  disabled={isGenerating}
                  className="h-12 sm:h-11 w-full text-[15px] sm:text-[14px]"
                >
                  <Wand2 className="mr-2 h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  {isGenerating
                    ? ui.generating_button
                    : mode === "creative" &&
                        creativeQuota.anonymousCreativeExhausted
                      ? ui.sign_in_button
                      : ui.generate_button}
                </Button>

                {results && (
                  <Button
                    variant="outline"
                    onClick={onReroll}
                    disabled={isGenerating}
                    className="h-10 sm:h-9 w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    {ui.reroll_button}
                  </Button>
                )}

                <CreativeQuotaHint
                  pageKey="pen-name-generator"
                  selectedModel={mode}
                  used={creativeQuota.used} limit={creativeQuota.limit}
                />

                {mode === "creative" && creativeQuota.used >= getCreativeLimit() && (
                  <p className="text-center text-[10px] text-amber-600 dark:text-amber-500">
                    {user
                      ? `Credits cost: ${creativeQuota.creditCost ?? 5}`
                      : section.validation.creative_limit_reached}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div
            className={cn(
              "space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1 lg:pb-2",
              results && !isGenerating ? "lg:self-start" : "lg:self-stretch"
            )}
            aria-live="polite"
          >
            <p className="sr-only" role="status">
              {isGenerating ? ui.loading_status : ui.output_title}
            </p>

            {isGenerating ? (
              <div
                aria-hidden="true"
                className="flex h-full min-h-48 flex-col items-center justify-center gap-5 rounded-lg border border-dashed"
              >
                <div className="relative flex h-16 w-16 items-center justify-center">
                  {LOADING_GLYPHS.map((glyph, i) => (
                    <span
                      key={glyph}
                      className="pen-loading-glyph absolute font-display text-4xl text-primary"
                      style={
                        {
                          "--glyph-index": i,
                        } as React.CSSProperties
                      }
                    >
                      {glyph}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {ui.generating_button}
                </p>
              </div>
            ) : results ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {results.candidates.map((candidate, i) => {
                    const isFavorited = favorites.some(
                      (item) => item.name === candidate.name
                    );
                    return (
                      <Card key={candidate.name + i}>
                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                          <div className="min-w-0">
                            <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                              {ui.result_label} {i + 1}
                            </span>
                            <CardTitle className="mt-1 break-words text-base sm:text-lg leading-snug">
                              {candidate.name}
                            </CardTitle>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-11 w-11 sm:h-9 sm:w-9"
                              onClick={() => onToggleFavorite(candidate)}
                              aria-label={
                                isFavorited ? ui.favorited_button : ui.favorite_button
                              }
                            >
                              <Heart
                                className={cn(
                                  "h-4 w-4 sm:h-3.5 sm:w-3.5",
                                  isFavorited &&
                                    "fill-amber-600 text-amber-600 dark:fill-amber-400 dark:text-amber-400"
                                )}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-11 w-11 sm:h-9 sm:w-9"
                              onClick={() => onCopy(candidate)}
                              aria-label={ui.copy_button}
                            >
                              <Copy className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                          <p>
                            <span className="font-medium text-foreground">
                              {ui.pronunciation_label}:
                            </span>{" "}
                            {candidate.pronunciation}
                          </p>
                          <p>
                            <span className="font-medium text-foreground">
                              {ui.reason_label}:
                            </span>{" "}
                            {candidate.reason}
                          </p>
                          {candidate.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {candidate.tags.map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="rounded-full border border-primary/20 bg-primary/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-primary"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 sm:h-8 px-3 text-xs text-muted-foreground"
                            onClick={() => onSimilar(candidate)}
                            disabled={isGenerating}
                          >
                            <Wand2 className="mr-1.5 h-3.5 w-3.5 sm:h-3 sm:w-3" />
                            {ui.similar_button}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {favorites.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        {ui.favorites_title} ({favorites.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {favorites.map((candidate) => (
                        <span
                          key={candidate.name}
                          className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.04] px-3 py-1 text-sm font-medium text-foreground"
                        >
                          <Heart className="size-3 fill-amber-600 text-amber-600 dark:fill-amber-400 dark:text-amber-400" />
                          {candidate.name}
                        </span>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {section.screening && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldCheck className="size-4 text-primary" />
                        {screeningTitle}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {section.screening.disclaimer}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onToggleScreening}
                        aria-expanded={screeningOpen}
                      >
                        {screeningOpen
                          ? section.screening.close_button
                          : section.screening.open_button}
                      </Button>
                      {screeningOpen && (
                        <ol className="space-y-3">
                          {section.screening.items.map((item, i) => (
                            <li
                              key={i}
                              className="flex gap-3 rounded-lg border border-border/40 bg-background/60 p-3"
                            >
                              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                {i + 1}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {item.title}
                                </p>
                                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                                  {item.description}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="flex h-full min-h-48 items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground">
                {ui.empty_output}
              </div>
            )}
          </div>
        </div>
      </main>

      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={runGeneration}
        onError={() => {
          setIsGenerating(false);
          toast.error(
            section.errors?.verification_failed ?? section.validation.generic_error
          );
        }}
      />
      <CreativeQuotaPaywall
        open={creativeQuota.paywallOpen}
        onClose={() => creativeQuota.setPaywallOpen(false)}
        sourcePage="pen-name-generator"
      />
    </section>
  );
}
