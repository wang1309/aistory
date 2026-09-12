"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useOpenPanel } from "@openpanel/nextjs";
import { toast } from "sonner";
import {
  Copy,
  ExternalLink,
  Heart,
  Music2,
  RefreshCw,
  Wand2,
} from "lucide-react";
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
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useCreativeQuotaPage } from "@/hooks/useCreativeQuotaPage";
import { useAppContext } from "@/contexts/app";
import { CreativeQuotaHint } from "@/components/blocks/creative-quota-hint";
import { CreativeQuotaPaywall } from "@/components/blocks/creative-quota-paywall";
import { getCreativeLimit } from "@/lib/creative-quota-client";
import type {
  BandGenre,
  BandMode,
  BandModelMode,
  BandNameGeneratorResponse,
  BandNameLength,
  BandTemplateIdea,
  BandVibe,
} from "@/types/band-name-generator";
import type { BandNameGeneratorPage } from "@/types/blocks/band-name-generator";

interface Props {
  section: BandNameGeneratorPage;
}

const MAX_CUE = 120;
const MAX_INSPIRATION_NAME = 100;
// Music glyphs cycled one at a time in the output area while generating.
const LOADING_GLYPHS = ["🎸", "🎤", "🥁", "🎵", "🎶", "⚡", "🎧", "🤘"];

// Closed control lists mirror the API contract in src/types/band-name-generator.
const GENRES: BandGenre[] = [
  "rock",
  "metal",
  "indie",
  "emo",
  "pop",
  "electronic",
  "hip_hop",
];
const VIBES: BandVibe[] = [
  "anthemic",
  "gritty",
  "dreamy",
  "playful",
  "dark",
  "nostalgic",
];
const LENGTHS: BandNameLength[] = ["any", "one_word", "short", "phrase"];
const MODES: BandMode[] = ["ai", "template"];
const MODEL_MODES: BandModelMode[] = ["fast", "standard", "creative"];

/**
 * External search surfaces for the per-card availability checks. The tool
 * never claims a name is available — it only links to the places a musician
 * should look before claiming it.
 */
function buildCheckLinks(name: string): Array<{
  key: keyof BandNameGeneratorPage["ui"]["check_links"];
  href: string;
}> {
  const encoded = encodeURIComponent(name);
  const quoted = encodeURIComponent(`"${name}" band`);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "") || "bandname";

  return [
    { key: "search", href: `https://www.google.com/search?q=${quoted}` },
    { key: "spotify", href: `https://open.spotify.com/search/${encoded}` },
    {
      key: "youtube",
      href: `https://www.youtube.com/results?search_query=${encoded}`,
    },
    { key: "instagram", href: `https://www.instagram.com/${slug}/` },
    {
      key: "domain",
      href: `https://www.namecheap.com/domains/registration/results/?domain=${slug}.com`,
    },
    { key: "trademark", href: "https://tmsearch.uspto.gov/" },
  ];
}

export default function BandNameGenerator({ section }: Props) {
  const locale = useLocale();
  const tAiTools = useTranslations("ai_tools");
  const { track } = useOpenPanel();
  const creativeQuota = useCreativeQuotaPage("band-name-generator");
  const { user } = useAppContext();
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  // Carries a one-shot inspiration override from Similar/Reroll into the
  // Turnstile success handler (state updates alone would arrive too late).
  const pendingInspirationRef = useRef<string | null>(null);
  const ui = section.ui;

  const [genre, setGenre] = useState<BandGenre>("rock");
  const [vibe, setVibe] = useState<BandVibe>("anthemic");
  const [length, setLength] = useState<BandNameLength>("any");
  const [mode, setMode] = useState<BandMode>("ai");
  const [modelMode, setModelMode] = useState<BandModelMode>("standard");
  const [cue, setCue] = useState("");
  const [inspirationName, setInspirationName] = useState("");
  const [results, setResults] = useState<BandNameGeneratorResponse | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [checkOpenName, setCheckOpenName] = useState<string | null>(null);
  // Bumped on every successful generation so the result grid remounts and
  // replays its entrance animation, even when reroll yields identical names.
  const [generationId, setGenerationId] = useState(0);

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
        const response = await fetch("/api/band-name", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            genre,
            vibe,
            length,
            mode,
            modelMode: mode === "ai" ? modelMode : "standard",
            cue,
            inspirationName: activeInspiration,
            locale,
            turnstileToken,
          }),
        });
        const json = await response.json();
        if (!response.ok || json.code === -1) {
          if (creativeQuota.handleQuotaError(response.status, json)) return;
          toast.error(json.message ?? section.errors.generate_failed);
          return;
        }
        setResults(json as BandNameGeneratorResponse);
        setGenerationId((n) => n + 1);
        setCheckOpenName(null);
        if (mode === "ai" && modelMode === "creative") {
          creativeQuota.increment();
        }
        toast.success(section.success.generated);
        track("band_name_generated", {
          locale,
          genre,
          vibe,
          length,
          mode,
          model_mode: modelMode,
          has_cue: Boolean(cue.trim()),
        });
      } catch (error) {
        console.error("band name generation failed", error);
        toast.error(section.validation.generic_error);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      genre,
      vibe,
      length,
      mode,
      modelMode,
      cue,
      inspirationName,
      locale,
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
      // Template mode never calls the model, so quota guards only apply to
      // the AI path — passing null skips optimistic gating.
      const effectiveModel = mode === "ai" ? modelMode : null;
      if (
        creativeQuota.guardAnonymousCreativeQuota({
          selectedModel: effectiveModel,
          message: section.validation.creative_limit_reached,
        }) ||
        creativeQuota.guardCreativeCreditQuota({ selectedModel: effectiveModel })
      ) {
        return;
      }
      pendingInspirationRef.current = inspirationOverride ?? null;
      setIsGenerating(true);
      turnstileRef.current?.execute();
    },
    [cue, inspirationName, mode, modelMode, section.validation, creativeQuota]
  );

  const onCopy = useCallback(
    async (name: string) => {
      try {
        await navigator.clipboard.writeText(name);
        toast.success(section.success.copied);
        track("band_name_copied", { locale, genre, mode });
      } catch (error) {
        console.error("band name copy failed", error);
        toast.error(section.validation.generic_error);
      }
    },
    [locale, genre, mode, section, track]
  );

  const onToggleFavorite = useCallback(
    (name: string) => {
      const isFavorited = favorites.includes(name);
      setFavorites((prev) =>
        isFavorited ? prev.filter((item) => item !== name) : [...prev, name]
      );
      toast.success(
        isFavorited ? section.success.unfavorited : section.success.favorited
      );
      track("band_name_favorite_toggled", { locale, genre, mode });
    },
    [favorites, locale, genre, mode, section.success, track]
  );

  const onSimilar = useCallback(
    (name: string) => {
      setInspirationName(name);
      track("band_name_similar_generated", { locale, genre, mode });
      onGenerate(name);
    },
    [locale, genre, mode, onGenerate, track]
  );

  const onReroll = useCallback(() => {
    setInspirationName("");
    track("band_name_rerolled", { locale, genre, mode });
    onGenerate("");
  }, [locale, genre, mode, onGenerate, track]);

  const onToggleCheck = useCallback(
    (name: string) => {
      const willOpen = checkOpenName !== name;
      setCheckOpenName(willOpen ? name : null);
      if (willOpen) {
        track("band_name_check_opened", { locale, genre, mode });
      }
    },
    [checkOpenName, locale, genre, mode, track]
  );

  const onCheckLink = useCallback(
    (service: string) => {
      track("band_name_check_opened", { locale, genre, mode, service });
    },
    [locale, genre, mode, track]
  );

  const renderSelect = useCallback(
    (
      id: string,
      label: string,
      value: string,
      values: string[],
      optionList: BandNameGeneratorPage["ui"]["genre_options"],
      onValueChange: (value: string) => void
    ) => {
      return (
        <div>
          <Label htmlFor={id}>{label}</Label>
          <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger id={id} className="mt-1.5">
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

  const renderResultCard = useCallback(
    (name: string, index: number, body: ReactNode) => {
      const isFavorited = favorites.includes(name);
      const checkLinks = buildCheckLinks(name);
      const checkOpen = checkOpenName === name;

      return (
        <Card
          key={name + index}
          className="animate-card-rise"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                {ui.result_label} {index + 1}
              </span>
              <CardTitle className="mt-1 break-words text-lg leading-snug">
                {name}
              </CardTitle>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 pointer-coarse:size-11"
                onClick={() => onToggleFavorite(name)}
                aria-label={
                  isFavorited ? ui.favorited_button : ui.favorite_button
                }
              >
                <Heart
                  className={cn(
                    "h-3.5 w-3.5",
                    isFavorited &&
                      "fill-amber-600 text-amber-600 dark:fill-amber-400 dark:text-amber-400"
                  )}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 pointer-coarse:size-11"
                onClick={() => onCopy(name)}
                aria-label={ui.copy_button}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {body}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs text-muted-foreground pointer-coarse:h-11"
                onClick={() => onToggleCheck(name)}
                aria-expanded={checkOpen}
              >
                <ExternalLink className="mr-1.5 h-3 w-3" />
                {checkOpen ? ui.check_close_button : ui.check_button}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs text-muted-foreground pointer-coarse:h-11"
                onClick={() => onSimilar(name)}
                disabled={isGenerating}
              >
                <Wand2 className="mr-1.5 h-3 w-3" />
                {ui.similar_button}
              </Button>
            </div>
            {checkOpen && (
              <div className="space-y-2 rounded-lg border border-border/40 bg-background/60 p-3">
                <div className="flex flex-wrap gap-2">
                  {checkLinks.map((link) => (
                    <a
                      key={link.key}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onCheckLink(link.key)}
                      className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/[0.04] px-3 py-1 text-xs font-medium text-foreground transition-colors pointer-coarse:py-2.5 hover:border-amber-500/40"
                    >
                      <ExternalLink className="size-3 text-amber-600 dark:text-amber-400" />
                      {ui.check_links[link.key]}
                    </a>
                  ))}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground/80">
                  {ui.check_disclaimer}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      );
    },
    [
      favorites,
      isGenerating,
      ui,
      checkOpenName,
      onToggleFavorite,
      onCopy,
      onToggleCheck,
      onSimilar,
      onCheckLink,
    ]
  );

  return (
    <section
      id="band_name_generator"
      className="min-h-[100dvh] bg-background text-foreground selection:bg-amber-500/20"
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.03_75),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.17_0.03_75),transparent)]" />
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-amber-500/[0.04] via-amber-500/[0.02] to-transparent" />
      </div>

      <main className="container relative z-10 mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-24">
        {/* Breadcrumb pill */}
        <div className="mb-10 flex justify-start">
          <nav
            aria-label={ui.breadcrumb_current}
            className="inline-flex max-w-full items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground"
          >
            <Link
              href="/"
              className="shrink-0 transition-colors hover:text-foreground/80"
            >
              {ui.breadcrumb_home}
            </Link>
            <span className="mx-2 shrink-0 text-muted-foreground/40">/</span>
            <Link
              href="/ai-tools"
              className="min-w-0 truncate transition-colors hover:text-foreground/80"
            >
              {tAiTools("tools_hub_nav")}
            </Link>
            <span className="mx-2 shrink-0 text-muted-foreground/40">/</span>
            <span className="min-w-0 truncate text-foreground/80">
              {ui.breadcrumb_current}
            </span>
          </nav>
        </div>

        {/* Hero copy */}
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <div className="group mb-6 flex justify-center">
            <div className="relative rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 dark:bg-white/[0.015]">
              <div className="relative flex size-12 items-center justify-center rounded-xl bg-amber-500/10">
                <Music2 className="relative size-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>

          <span className="mb-5 inline-flex items-center rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {ui.eyebrow}
          </span>

          <h1 className="mt-4 break-words pb-1 font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
            {titleParts.before}
            {titleParts.highlight && (
              <span className="text-gradient-ember italic">
                {titleParts.highlight}
              </span>
            )}
            {titleParts.after}
          </h1>

          <p className="mx-auto mt-5 max-w-xl font-light text-base leading-relaxed text-muted-foreground/65 sm:text-lg">
            {ui.subtitle}
          </p>

          {themePills.length > 0 && (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              {themePills.map((pill, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/[0.04] px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300"
                >
                  <span className="inline-block size-1 rounded-full bg-amber-500/60" />
                  {pill}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[2fr_3fr]">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>{ui.form_title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-x-4 gap-y-6 sm:grid-cols-2">
              {renderSelect(
                "band-name-genre",
                ui.genre_label,
                genre,
                GENRES,
                ui.genre_options,
                (v) => setGenre(v as BandGenre)
              )}

              {renderSelect(
                "band-name-vibe",
                ui.vibe_label,
                vibe,
                VIBES,
                ui.vibe_options,
                (v) => setVibe(v as BandVibe)
              )}

              {renderSelect(
                "band-name-length",
                ui.length_label,
                length,
                LENGTHS,
                ui.length_options,
                (v) => setLength(v as BandNameLength)
              )}

              {renderSelect(
                "band-name-mode",
                ui.mode_label,
                mode,
                MODES,
                ui.mode_options,
                (v) => setMode(v as BandMode)
              )}

              {mode === "template" && (
                <p className="rounded-md border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2 text-xs text-amber-700 dark:text-amber-300 sm:col-span-2">
                  {ui.template_note}
                </p>
              )}

              <div className="sm:col-span-2">
                <Label htmlFor="band-name-cue">{ui.cue_label}</Label>
                <Textarea
                  id="band-name-cue"
                  placeholder={ui.cue_placeholder}
                  value={cue}
                  onChange={(e) => setCue(e.target.value)}
                  rows={2}
                  className="mt-1.5 resize-none"
                  maxLength={MAX_CUE}
                />
                <p className="mt-1 text-right text-[11px] text-muted-foreground/50">
                  {cue.length}/{MAX_CUE}
                </p>
              </div>

              {inspirationName && (
                <p className="rounded-md border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2 text-xs text-amber-700 dark:text-amber-300 sm:col-span-2">
                  {ui.inspiration_hint} {inspirationName}
                </p>
              )}

              {/* Terminal · model + action: the cost decision sits right above the button it controls. */}
              <div className="sm:col-span-2">
                <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-foreground/[0.015] p-4 dark:bg-white/[0.02]">
                  <div>
                    <Label>{ui.model_label}</Label>
                    <ToggleGroup
                      type="single"
                      value={modelMode}
                      onValueChange={(value) => {
                        if (value) setModelMode(value as BandModelMode);
                      }}
                      variant="outline"
                      className="mt-1.5 w-full"
                    >
                      {MODEL_MODES.map((value) => {
                        const isCreativeUsedUp =
                          value === "creative" &&
                          mode === "ai" &&
                          creativeQuota.used >= getCreativeLimit();
                        return (
                          <ToggleGroupItem
                            key={value}
                            value={value}
                            className={cn(
                              "h-12 sm:h-11 flex-1 whitespace-normal text-sm sm:text-xs",
                              "data-[state=on]:border-amber-500/40 data-[state=on]:bg-amber-500/10 data-[state=on]:text-amber-700",
                              "dark:data-[state=on]:border-amber-400/40 dark:data-[state=on]:bg-amber-400/10 dark:data-[state=on]:text-amber-300",
                              isCreativeUsedUp && "opacity-60"
                            )}
                          >
                            {ui.model_options.find((opt) => opt.value === value)
                              ?.label ?? value}
                            {isCreativeUsedUp && (
                              <span
                                className="ml-1.5 inline-block size-1.5 rounded-full bg-amber-500 ring-2 ring-background"
                                title={
                                  section.validation.creative_limit_reached
                                }
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
                      : mode === "ai" &&
                          modelMode === "creative" &&
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
                    pageKey="band-name-generator"
                    selectedModel={mode === "ai" ? modelMode : null}
                    used={creativeQuota.used}
                  />

                  {mode === "ai" &&
                    modelMode === "creative" &&
                    creativeQuota.used >= getCreativeLimit() && (
                      <p className="text-center text-[10px] text-amber-600 dark:text-amber-500">
                        {user
                          ? `Credits cost: ${creativeQuota.creditCost ?? 5}`
                          : section.validation.creative_limit_reached}
                      </p>
                    )}
                </div>
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
              {isGenerating
                ? ui.loading_status
                : results?.mode === "template"
                  ? ui.output_title_template
                  : ui.output_title}
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
                      className="band-loading-glyph absolute text-4xl text-amber-600 dark:text-amber-400"
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
                <div key={generationId} className="grid gap-4 sm:grid-cols-2">
                  {results.mode === "ai"
                    ? results.ideas.map((idea, i) =>
                        renderResultCard(
                          idea.name,
                          i,
                          <>
                            <p>
                              <span className="font-medium text-foreground">
                                {ui.pronunciation_label}:
                              </span>{" "}
                              {idea.pronunciation}
                            </p>
                            <p>
                              <span className="font-medium text-foreground">
                                {ui.rationale_label}:
                              </span>{" "}
                              {idea.rationale}
                            </p>
                            <p>
                              <span className="font-medium text-foreground">
                                {ui.genre_fit_label}:
                              </span>{" "}
                              {idea.genreFit}
                            </p>
                            <p>
                              <span className="font-medium text-foreground">
                                {ui.bio_label}:
                              </span>{" "}
                              {idea.bio}
                            </p>
                            <p>
                              <span className="font-medium text-foreground">
                                {ui.visual_label}:
                              </span>{" "}
                              {idea.visualDirection}
                            </p>
                          </>
                        )
                      )
                    : results.ideas.map((idea, i) =>
                        renderResultCard(
                          idea.name,
                          i,
                          <p>
                            <span className="font-medium text-foreground">
                              {ui.pattern_label}:
                            </span>{" "}
                            {ui.pattern_labels[idea.pattern]} —{" "}
                            {idea.parts.join(" + ")}
                          </p>
                        )
                      )}
                </div>

                {favorites.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        {ui.favorites_title} ({favorites.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {favorites.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/[0.04] px-3 py-1 text-sm font-medium text-foreground"
                        >
                          <Heart className="size-3 fill-amber-600 text-amber-600 dark:fill-amber-400 dark:text-amber-400" />
                          {name}
                        </span>
                      ))}
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
        sourcePage="band-name-generator"
      />
    </section>
  );
}
