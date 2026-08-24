"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useOpenPanel } from "@openpanel/nextjs";
import { toast } from "sonner";
import {
  BookOpen,
  Copy,
  Fingerprint,
  Heart,
  Lightbulb,
  RefreshCw,
  Sparkles,
  MessagesSquare,
  Wand2,
} from "lucide-react";
import TurnstileInvisible, {
  TurnstileInvisibleHandle,
} from "@/components/TurnstileInvisible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  MiddleNameCadence,
  MiddleNameDirection,
  MiddleNameEra,
  MiddleNameGeneratorResponse,
  MiddleNameModelMode,
  MiddleNameOutputLocale,
  MiddleNameSetting,
  MiddleNameTone,
  MiddleNameUseCase,
} from "@/types/middle-name-generator";
import type { MiddleNameGeneratorPage } from "@/types/blocks/middle-name-generator";

interface Props {
  section: MiddleNameGeneratorPage;
}

const MAX_NAME = 60;
const MAX_AVOID_INITIALS = 12;
const MAX_NOTE = 160;

// Serif initials cycling in the loading state; keep in sync with the
// middle-initial-swap keyframe timing in globals.css (10s cycle, 1.25s each).
const LOADING_GLYPHS = ["E", "V", "H", "A", "R", "M", "L", "J"];

// Closed control lists mirror the API contract in src/types/middle-name-generator.
const USE_CASES: MiddleNameUseCase[] = ["fictional_character", "pen_name"];
const MODEL_MODES: MiddleNameModelMode[] = ["fast", "standard", "creative"];
const SETTINGS: MiddleNameSetting[] = [
  "contemporary",
  "mystery_thriller",
  "romance",
  "fantasy",
  "historical",
  "science_fiction",
  "literary",
];
const ERAS: MiddleNameEra[] = [
  "any",
  "contemporary",
  "mid_20th",
  "early_20th",
  "victorian",
  "timeless",
];
const TONES: MiddleNameTone[] = [
  "restrained",
  "formal",
  "old_money",
  "rebellious",
  "inherited",
  "warm",
  "mysterious",
];
const CADENCES: MiddleNameCadence[] = ["any", "short", "long"];
const OUTPUT_LOCALES: MiddleNameOutputLocale[] = ["en", "zh", "de", "ko", "ja", "ru"];

/** Deterministic, client-side initials preview: "Elena V. Hart" -> "E.V.H." */
function computeInitials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join(".")
    .concat(".")
    .toUpperCase();
}

function parseAvoidedLetters(raw: string): Set<string> {
  return new Set(
    raw
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .split("")
      .filter(Boolean)
  );
}

export default function MiddleNameGenerator({ section }: Props) {
  const locale = useLocale();
  const tAiTools = useTranslations("ai_tools");
  const { track } = useOpenPanel();
  const creativeQuota = useCreativeQuotaPage("middle-name-generator");
  const { user } = useAppContext();
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const ui = section.ui;

  const outputLocale = OUTPUT_LOCALES.includes(locale as MiddleNameOutputLocale)
    ? (locale as MiddleNameOutputLocale)
    : "en";

  const [useCase, setUseCase] = useState<MiddleNameUseCase>("fictional_character");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [setting, setSetting] = useState<MiddleNameSetting>("contemporary");
  const [era, setEra] = useState<MiddleNameEra>("any");
  const [tone, setTone] = useState<MiddleNameTone>("restrained");
  const [cadence, setCadence] = useState<MiddleNameCadence>("any");
  const [avoidInitials, setAvoidInitials] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<MiddleNameModelMode>("standard");
  const [results, setResults] = useState<MiddleNameGeneratorResponse | null>(null);
  const [favorites, setFavorites] = useState<MiddleNameDirection[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const avoidedLetters = useMemo(
    () => parseAvoidedLetters(avoidInitials),
    [avoidInitials]
  );

  const runGeneration = useCallback(
    async (turnstileToken: string) => {
      try {
        const response = await fetch("/api/middle-name", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            useCase,
            firstName,
            lastName,
            setting,
            era,
            tone,
            cadence,
            avoidInitials,
            note,
            locale: outputLocale,
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
        setResults(json as MiddleNameGeneratorResponse);
        if (mode === "creative") {
          creativeQuota.increment();
        }
        toast.success(section.success.generated);
        // Privacy: never include entered names in analytics payloads.
        track("middle_name_generated", {
          locale,
          use_case: useCase,
          setting,
          era,
          tone,
          cadence,
          mode,
          has_first_name: Boolean(firstName.trim()),
          has_last_name: Boolean(lastName.trim()),
          has_avoid_initials: avoidedLetters.size > 0,
          has_note: Boolean(note.trim()),
        });
      } catch (error) {
        console.error("middle name generation failed", error);
        toast.error(section.validation.generic_error);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      useCase,
      firstName,
      lastName,
      setting,
      era,
      tone,
      cadence,
      avoidInitials,
      note,
      outputLocale,
      locale,
      mode,
      avoidedLetters.size,
      section,
      track,
      creativeQuota,
    ]
  );

  const onGenerate = useCallback(() => {
    if (firstName.trim().length > MAX_NAME) {
      toast.error(section.validation.name_too_long);
      return;
    }
    if (lastName.trim().length > MAX_NAME) {
      toast.error(section.validation.name_too_long);
      return;
    }
    if (avoidInitials.length > MAX_AVOID_INITIALS) {
      toast.error(section.validation.avoid_initials_too_long);
      return;
    }
    if (note.length > MAX_NOTE) {
      toast.error(section.validation.note_too_long);
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
    setIsGenerating(true);
    turnstileRef.current?.execute();
  }, [firstName, lastName, avoidInitials, note, mode, section.validation, creativeQuota]);

  const onReroll = useCallback(() => {
    track("middle_name_rerolled", { locale, use_case: useCase });
    setIsGenerating(true);
    turnstileRef.current?.execute();
  }, [locale, useCase, track]);

  const onCopy = useCallback(
    async (direction: MiddleNameDirection) => {
      try {
        await navigator.clipboard.writeText(direction.fullName);
        toast.success(section.success.copied);
        track("middle_name_copied", { locale, use_case: useCase });
      } catch (error) {
        console.error("middle name copy failed", error);
        toast.error(section.validation.generic_error);
      }
    },
    [locale, useCase, section, track]
  );

  const onToggleFavorite = useCallback(
    (direction: MiddleNameDirection) => {
      const isFavorited = favorites.some(
        (item) => item.fullName === direction.fullName
      );
      setFavorites((prev) =>
        isFavorited
          ? prev.filter((item) => item.fullName !== direction.fullName)
          : [...prev, direction]
      );
      toast.success(
        isFavorited ? section.success.unfavorited : section.success.favorited
      );
      track("middle_name_favorite_toggled", { locale, use_case: useCase });
    },
    [favorites, locale, useCase, section.success, track]
  );

  const onContinueToDialogue = useCallback(
    async (direction: MiddleNameDirection) => {
      try {
        // The chosen full name travels with the writer via the clipboard —
        // nothing is written to any stored profile here.
        await navigator.clipboard.writeText(direction.fullName);
        toast.success(section.success.continue_copied);
        track("middle_name_continue_dialogue", { locale, use_case: useCase });
      } catch (error) {
        console.error("middle name continue copy failed", error);
      }
    },
    [locale, useCase, section.success, track]
  );

  const onContinuation = useCallback(
    (target: "dialogue" | "backstory" | "prompt") => {
      track("middle_name_continuation_opened", { locale, use_case: useCase, target });
    },
    [locale, useCase, track]
  );

  const renderSelect = useCallback(
    (
      id: string,
      label: string,
      value: string,
      values: string[],
      optionKey:
        | "use_case_options"
        | "setting_options"
        | "era_options"
        | "tone_options"
        | "cadence_options",
      onValueChange: (value: string) => void
    ) => {
      const optionList = ui[optionKey];
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
    [ui]
  );

  return (
    <section
      id="middle_name_generator"
      className="relative min-h-[100dvh] bg-background text-foreground selection:bg-orange-500/20"
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.05_65),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.18_0.04_65),transparent)]" />
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-orange-500/[0.04] via-orange-500/[0.02] to-transparent" />
      </div>

      <main className="container relative z-10 mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-24">
        {/* Breadcrumb pill */}
        <div className="mb-10 flex justify-start">
          <div className="inline-flex max-w-full flex-wrap items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
            <Link
              href="/"
              className="transition-colors hover:text-foreground/80"
            >
              {ui.breadcrumb_home}
            </Link>
            <span className="mx-2 text-muted-foreground/40">/</span>
            <Link
              href="/ai-tools"
              className="transition-colors hover:text-foreground/80"
            >
              {tAiTools("tools_hub_nav")}
            </Link>
            <span className="mx-2 text-muted-foreground/40">/</span>
            <span className="min-w-0 truncate text-foreground/80">{ui.breadcrumb_current}</span>
          </div>
        </div>

        {/* Hero copy */}
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <div className="group mb-6 flex justify-center">
            <div className="relative rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 dark:bg-white/[0.015]">
              <div className="relative flex size-12 items-center justify-center rounded-xl bg-orange-500/10">
                <Fingerprint className="relative size-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <span className="mb-5 inline-flex items-center rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {ui.eyebrow}
          </span>

          <h1 className="mt-4 pb-1 font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
            {titleParts.before}
            {titleParts.highlight && (
              <span className="italic bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent dark:from-orange-400 dark:via-orange-300 dark:to-amber-300">
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/[0.04] px-3 py-1 text-xs font-medium text-orange-700 dark:text-orange-300"
                >
                  <span className="inline-block size-1 rounded-full bg-orange-500/60" />
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
            <CardContent className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2">
              {renderSelect(
                "middle-name-use-case",
                ui.use_case_label,
                useCase,
                USE_CASES,
                "use_case_options",
                (v) => setUseCase(v as MiddleNameUseCase)
              )}

              {renderSelect(
                "middle-name-setting",
                ui.setting_label,
                setting,
                SETTINGS,
                "setting_options",
                (v) => setSetting(v as MiddleNameSetting)
              )}

              <div className="col-span-full grid grid-cols-1 gap-x-3 gap-y-4 min-[420px]:grid-cols-2">
                <div>
                  <Label htmlFor="middle-name-first">{ui.first_name_label}</Label>
                  <Input
                    id="middle-name-first"
                    placeholder={ui.first_name_placeholder}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1.5 h-11 sm:h-9"
                    maxLength={MAX_NAME}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="middle-name-last">{ui.last_name_label}</Label>
                  <Input
                    id="middle-name-last"
                    placeholder={ui.last_name_placeholder}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1.5 h-11 sm:h-9"
                    maxLength={MAX_NAME}
                    autoComplete="off"
                  />
                </div>
              </div>

              {renderSelect(
                "middle-name-era",
                ui.era_label,
                era,
                ERAS,
                "era_options",
                (v) => setEra(v as MiddleNameEra)
              )}

              {renderSelect(
                "middle-name-tone",
                ui.tone_label,
                tone,
                TONES,
                "tone_options",
                (v) => setTone(v as MiddleNameTone)
              )}

              {renderSelect(
                "middle-name-cadence",
                ui.cadence_label,
                cadence,
                CADENCES,
                "cadence_options",
                (v) => setCadence(v as MiddleNameCadence)
              )}

              <div>
                <Label htmlFor="middle-name-avoid">
                  {ui.avoid_initials_label}
                </Label>
                <Input
                  id="middle-name-avoid"
                  placeholder={ui.avoid_initials_placeholder}
                  value={avoidInitials}
                  onChange={(e) => setAvoidInitials(e.target.value)}
                  className="mt-1.5 h-11 sm:h-9"
                  maxLength={MAX_AVOID_INITIALS}
                  autoComplete="off"
                />
              </div>

              <div className="col-span-full">
                <Label htmlFor="middle-name-note">{ui.note_label}</Label>
                <Textarea
                  id="middle-name-note"
                  placeholder={ui.note_placeholder}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="mt-1.5 resize-none"
                  maxLength={MAX_NOTE}
                />
                <p className="mt-1 text-right text-[11px] text-muted-foreground/50">
                  {note.length}/{MAX_NOTE}
                </p>
              </div>

              <p className="col-span-full text-[11px] leading-relaxed text-muted-foreground/60">
                {ui.privacy_hint}
              </p>

              {/* Terminal · model + action: the cost decision sits right above the button it controls. */}
              <div className="col-span-full flex flex-col gap-3 rounded-xl border border-border/60 bg-foreground/[0.015] p-4 dark:bg-white/[0.02]">
                <div>
                  <Label>{ui.mode_label}</Label>
                  <ToggleGroup
                    type="single"
                    value={mode}
                    onValueChange={(value) => {
                      if (value) setMode(value as MiddleNameModelMode);
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
                            "data-[state=on]:border-orange-500/40 data-[state=on]:bg-orange-500/10 data-[state=on]:text-orange-700",
                            "dark:data-[state=on]:border-orange-400/40 dark:data-[state=on]:bg-orange-400/10 dark:data-[state=on]:text-orange-300",
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
                  onClick={onGenerate}
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
                    className="h-12 sm:h-10 w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    {ui.reroll_button}
                  </Button>
                )}

                <CreativeQuotaHint
                  pageKey="middle-name-generator"
                  selectedModel={mode}
                  used={creativeQuota.used}
                />

                {mode === "creative" &&
                  creativeQuota.used >= getCreativeLimit() && (
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
              "space-y-4",
              results ? "lg:self-start" : "lg:self-stretch"
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
                      className="middle-loading-glyph absolute font-display text-4xl italic text-orange-600 dark:text-orange-400"
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
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {results.directions.map((direction, i) => {
                    const isFavorited = favorites.some(
                      (item) => item.fullName === direction.fullName
                    );
                    const initials = computeInitials(direction.fullName);
                    const initialsBlocked = Array.from(
                      new Set(initials.replace(/[^A-Z]/g, "").split(""))
                    ).some((letter) => avoidedLetters.has(letter));
                    return (
                      <Card key={direction.fullName + i} className="flex flex-col">
                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                              {ui.direction_label} {i + 1}
                            </span>
                            <CardTitle className="mt-1 break-words text-lg leading-snug">
                              {direction.fullName}
                            </CardTitle>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-11 sm:size-9"
                              onClick={() => onToggleFavorite(direction)}
                              aria-label={
                                isFavorited ? ui.favorited_button : ui.favorite_button
                              }
                            >
                              <Heart
                                className={cn(
                                  "h-3.5 w-3.5",
                                  isFavorited &&
                                    "fill-orange-600 text-orange-600 dark:fill-orange-400 dark:text-orange-400"
                                )}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-11 sm:size-9"
                              onClick={() => onCopy(direction)}
                              aria-label={ui.copy_button}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col gap-2 text-sm text-muted-foreground">
                          <p>
                            <span className="font-medium text-foreground">
                              {ui.middle_name_label}:
                            </span>{" "}
                            {direction.middleName}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full border border-border/40 bg-background/60 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-foreground/80">
                              {ui.initials_label}: {initials}
                            </span>
                            {avoidedLetters.size > 0 && initialsBlocked && (
                              <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                                {ui.initials_warning}
                              </span>
                            )}
                          </div>
                          <p>
                            <span className="font-medium text-foreground">
                              {ui.cadence_note_label}:
                            </span>{" "}
                            {direction.cadenceNote}
                          </p>
                          <p>
                            <span className="font-medium text-foreground">
                              {ui.implication_label}:
                            </span>{" "}
                            {direction.implication}
                          </p>
                          {direction.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {direction.tags.map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="rounded-full border border-orange-500/20 bg-orange-500/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-orange-700 dark:text-orange-300"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {useCase === "fictional_character" && (
                            <Link
                              href="/dialogue-generator"
                              onClick={() => onContinueToDialogue(direction)}
                              className="mt-auto inline-flex min-h-11 items-center gap-1.5 text-xs font-medium text-orange-700 underline-offset-4 hover:underline dark:text-orange-300"
                            >
                              <MessagesSquare className="size-3.5" />
                              {ui.continue_button}
                            </Link>
                          )}
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
                      {favorites.map((direction) => (
                        <span
                          key={direction.fullName}
                          className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/[0.04] px-3 py-1 text-sm font-medium text-foreground"
                        >
                          <Heart className="size-3 fill-orange-600 text-orange-600 dark:fill-orange-400 dark:text-orange-400" />
                          {direction.fullName}
                        </span>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {section.continuation && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Sparkles className="size-4 text-orange-600 dark:text-orange-400" />
                        {section.continuation.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {section.continuation.description && (
                        <p className="text-sm text-muted-foreground">
                          {section.continuation.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href="/dialogue-generator"
                          onClick={() => onContinuation("dialogue")}
                          className="group flex min-w-[13rem] flex-1 items-start gap-2.5 rounded-lg border border-border/40 bg-background/60 p-3 transition-colors hover:border-orange-500/40"
                        >
                          <MessagesSquare className="mt-0.5 size-4 shrink-0 text-orange-600 dark:text-orange-400" />
                          <span>
                            <span className="block text-sm font-medium text-foreground">
                              {section.continuation.dialogue_label}
                            </span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                              {section.continuation.dialogue_hint}
                            </span>
                          </span>
                        </Link>
                        <Link
                          href="/backstory-generator"
                          onClick={() => onContinuation("backstory")}
                          className="group flex min-w-[13rem] flex-1 items-start gap-2.5 rounded-lg border border-border/40 bg-background/60 p-3 transition-colors hover:border-orange-500/40"
                        >
                          <BookOpen className="mt-0.5 size-4 shrink-0 text-orange-600 dark:text-orange-400" />
                          <span>
                            <span className="block text-sm font-medium text-foreground">
                              {section.continuation.backstory_label}
                            </span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                              {section.continuation.backstory_hint}
                            </span>
                          </span>
                        </Link>
                        <Link
                          href="/story-prompt-generator"
                          onClick={() => onContinuation("prompt")}
                          className="group flex min-w-[13rem] flex-1 items-start gap-2.5 rounded-lg border border-border/40 bg-background/60 p-3 transition-colors hover:border-orange-500/40"
                        >
                          <Lightbulb className="mt-0.5 size-4 shrink-0 text-orange-600 dark:text-orange-400" />
                          <span>
                            <span className="block text-sm font-medium text-foreground">
                              {section.continuation.prompt_label}
                            </span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                              {section.continuation.prompt_hint}
                            </span>
                          </span>
                        </Link>
                      </div>
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
        sourcePage="middle-name-generator"
      />
    </section>
  );
}
