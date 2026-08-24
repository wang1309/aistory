"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useOpenPanel } from "@openpanel/nextjs";
import { toast } from "sonner";
import {
  Copy,
  Heart,
  RefreshCw,
  Swords,
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
import { getCreativeLimit, getCreativeUsed } from "@/lib/creative-quota-client";
import type {
  GangFlavor,
  GangGroupType,
  GangNameGeneratorResponse,
  GangNameModelMode,
  GangOutputLocale,
  GangProfile,
  GangTone,
  GangWorld,
} from "@/types/gang-name-generator";
import type { GangNameGeneratorPage } from "@/types/blocks/gang-name-generator";

interface Props {
  section: GangNameGeneratorPage;
}

const MAX_CUE = 120;
const MAX_INSPIRATION_NAME = 100;

// Closed control lists mirror the API contract in src/types/gang-name-generator.
const WORLDS: GangWorld[] = [
  "street_crime",
  "mafia",
  "fantasy",
  "cyberpunk",
  "post_apocalyptic",
  "biker",
  "game_world",
];
const GROUP_TYPES: GangGroupType[] = [
  "crew",
  "crime_family",
  "syndicate",
  "brotherhood",
  "clan",
  "biker_club",
];
const TONES: GangTone[] = [
  "menacing",
  "gritty",
  "cunning",
  "flashy",
  "funny",
  "honorable",
];
const FLAVORS: GangFlavor[] = [
  "none",
  "italian",
  "japanese",
  "chinese",
  "western",
  "nordic",
];
const OUTPUT_LOCALES: GangOutputLocale[] = ["en", "zh", "de", "ko", "ja", "ru"];
const MODEL_MODES: GangNameModelMode[] = ["fast", "standard", "creative"];
// Faction emblems shown one at a time while generating.
const LOADING_GLYPHS = ["⚔", "🗡", "☠", "💀", "🔥", "⛓", "🖤", "👑"];

export default function GangNameGenerator({ section }: Props) {
  const locale = useLocale();
  const tAiTools = useTranslations("ai_tools");
  const { track } = useOpenPanel();
  const creativeQuota = useCreativeQuotaPage("gang-name-generator");
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  // Carries a one-shot inspiration override from Similar/Reroll into the
  // Turnstile success handler (state updates alone would arrive too late).
  const pendingInspirationRef = useRef<string | null>(null);
  const ui = section.ui;
  const { user } = useAppContext();

  const initialOutputLocale = OUTPUT_LOCALES.includes(locale as GangOutputLocale)
    ? (locale as GangOutputLocale)
    : "en";

  const [world, setWorld] = useState<GangWorld>("street_crime");
  const [groupType, setGroupType] = useState<GangGroupType>("crew");
  const [tone, setTone] = useState<GangTone>("menacing");
  const [flavor, setFlavor] = useState<GangFlavor>("none");
  const [mode, setMode] = useState<GangNameModelMode>("standard");
  const [cue, setCue] = useState("");
  const [inspirationName, setInspirationName] = useState("");
  const [results, setResults] = useState<GangNameGeneratorResponse | null>(null);
  const [favorites, setFavorites] = useState<GangProfile[]>([]);
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

  const runGeneration = useCallback(
    async (turnstileToken: string) => {
      const inspirationOverride = pendingInspirationRef.current;
      pendingInspirationRef.current = null;
      const activeInspiration = inspirationOverride ?? inspirationName;
      try {
        const response = await fetch("/api/gang-name", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            world,
            groupType,
            tone,
            flavor,
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
        setResults(json as GangNameGeneratorResponse);
        if (mode === "creative") {
          creativeQuota.increment();
        }
        toast.success(section.success.generated);
        track("gang_name_generated", {
          locale,
          world,
          group_type: groupType,
          tone,
          flavor,
          mode,
          has_cue: Boolean(cue.trim()),
        });
      } catch (error) {
        console.error("gang name generation failed", error);
        toast.error(section.validation.generic_error);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      world,
      groupType,
      tone,
      flavor,
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
    [
      cue,
      inspirationName,
      mode,
      section.validation,
      creativeQuota,
    ]
  );

  const onCopy = useCallback(
    async (profile: GangProfile) => {
      try {
        await navigator.clipboard.writeText(profile.name);
        toast.success(section.success.copied);
        track("gang_name_copied", {
          locale,
          world,
          group_type: groupType,
        });
      } catch (error) {
        console.error("gang name copy failed", error);
        toast.error(section.validation.generic_error);
      }
    },
    [locale, world, groupType, section, track]
  );

  const onToggleFavorite = useCallback(
    (profile: GangProfile) => {
      const isFavorited = favorites.some((item) => item.name === profile.name);
      setFavorites((prev) =>
        isFavorited
          ? prev.filter((item) => item.name !== profile.name)
          : [...prev, profile]
      );
      toast.success(
        isFavorited ? section.success.unfavorited : section.success.favorited
      );
      track("gang_name_favorite_toggled", {
        locale,
        world,
        group_type: groupType,
      });
    },
    [favorites, locale, world, groupType, section.success, track]
  );

  const onSimilar = useCallback(
    (profile: GangProfile) => {
      setInspirationName(profile.name);
      track("gang_name_similar_generated", {
        locale,
        world,
        group_type: groupType,
      });
      onGenerate(profile.name);
    },
    [locale, world, groupType, onGenerate, track]
  );

  const onReroll = useCallback(() => {
    setInspirationName("");
    track("gang_name_rerolled", {
      locale,
      world,
      group_type: groupType,
    });
    onGenerate("");
  }, [locale, world, groupType, onGenerate, track]);

  const renderSelect = useCallback(
    (
      id: string,
      label: string,
      value: string,
      values: string[],
      options: GangNameGeneratorPage["ui"],
      optionKey:
        | "world_options"
        | "group_type_options"
        | "tone_options"
        | "flavor_options",
      onValueChange: (value: string) => void
    ) => {
      const optionList =
        options[optionKey as keyof typeof options] as GangNameGeneratorPage["ui"]["world_options"];
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

  const creativeQuotaExhausted =
    creativeQuota.anonymousCreativeExhausted;

  return (
    <section
      id="gang_name_generator"
      className="min-h-[100dvh] bg-background text-foreground selection:bg-orange-500/20"
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.05_65),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.18_0.04_65),transparent)]" />
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-orange-500/[0.04] via-orange-500/[0.02] to-transparent" />
      </div>

      <main className="container relative z-10 mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-24">
        {/* Breadcrumb pill */}
        <div className="mb-10 flex justify-start">
          <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
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
            <span className="text-foreground/80">{ui.breadcrumb_current}</span>
          </div>
        </div>

        {/* Hero copy */}
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <div className="group mb-6 flex justify-center">
            <div className="relative rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 dark:bg-white/[0.015]">
              <div className="relative flex size-12 items-center justify-center rounded-xl bg-orange-500/10">
                <Swords className="relative size-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <span className="mb-5 inline-flex items-center rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {ui.eyebrow}
          </span>

          <h1 className="mt-4 pb-1 font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
            {titleParts.before}
            {titleParts.highlight && (
              <span className="italic bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent dark:from-orange-400 dark:via-orange-300 dark:to-orange-200">
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
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {renderSelect(
                "gang-name-world",
                ui.world_label,
                world,
                WORLDS,
                ui,
                "world_options",
                (v) => setWorld(v as GangWorld)
              )}

              {renderSelect(
                "gang-name-group-type",
                ui.group_type_label,
                groupType,
                GROUP_TYPES,
                ui,
                "group_type_options",
                (v) => setGroupType(v as GangGroupType)
              )}

              {renderSelect(
                "gang-name-tone",
                ui.tone_label,
                tone,
                TONES,
                ui,
                "tone_options",
                (v) => setTone(v as GangTone)
              )}

              {renderSelect(
                "gang-name-flavor",
                ui.flavor_label,
                flavor,
                FLAVORS,
                ui,
                "flavor_options",
                (v) => setFlavor(v as GangFlavor)
              )}

              <div className="sm:col-span-2">
                <Label htmlFor="gang-name-cue">{ui.cue_label}</Label>
                <Textarea
                  id="gang-name-cue"
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
                <p className="rounded-md border border-orange-500/20 bg-orange-500/[0.04] px-3 py-2 text-xs text-orange-700 dark:text-orange-300 sm:col-span-2">
                  {ui.inspiration_hint} {inspirationName}
                </p>
              )}

              {/* Terminal · Model + action: the cost decision sits right above the button it controls. */}
              <div className="space-y-4 rounded-xl border border-border/60 bg-foreground/[0.015] p-4 dark:bg-white/[0.02] sm:col-span-2">
                  <div>
                  <Label>{ui.mode_label}</Label>
                  <ToggleGroup
                    type="single"
                    value={mode}
                    onValueChange={(value) => {
                      if (value) setMode(value as GangNameModelMode);
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
                            "h-11 flex-1 whitespace-normal sm:h-9",
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

                <div className="flex flex-col items-center gap-3">
                  <Button
                    onClick={() => onGenerate()}
                    disabled={isGenerating}
                    className="h-11 w-full text-[15px]"
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
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
                      className="h-9 w-full"
                    >
                      <RefreshCw className="mr-2 h-3.5 w-3.5" />
                      {ui.reroll_button}
                    </Button>
                  )}

                  <CreativeQuotaHint
                    pageKey="gang-name-generator"
                    selectedModel={mode}
                    used={creativeQuota.used}
                  />

                  {mode === "creative" && creativeQuota.used >= getCreativeLimit() && (
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
                      className="gang-loading-glyph absolute font-display text-4xl text-orange-600 dark:text-orange-400"
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
                  {results.profiles.map((profile, i) => {
                    const isFavorited = favorites.some(
                      (item) => item.name === profile.name
                    );
                    return (
                      <Card key={profile.name + i}>
                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                              {ui.result_label} {i + 1}
                            </span>
                            <CardTitle className="mt-1 break-words text-lg leading-snug">
                              {profile.name}
                            </CardTitle>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => onToggleFavorite(profile)}
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
                              className="h-9 w-9"
                              onClick={() => onCopy(profile)}
                              aria-label={ui.copy_button}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                          <p>
                            <span className="font-medium text-foreground">
                              {ui.meaning_label}:
                            </span>{" "}
                            {profile.meaning}
                          </p>
                          <p>
                            <span className="font-medium text-foreground">
                              {ui.reputation_label}:
                            </span>{" "}
                            {profile.reputation}
                          </p>
                          <p>
                            <span className="font-medium text-foreground">
                              {ui.territory_label}:
                            </span>{" "}
                            {profile.territory}
                          </p>
                          <p>
                            <span className="font-medium text-foreground">
                              {ui.symbol_label}:
                            </span>{" "}
                            {profile.symbol}
                          </p>
                          <p>
                            <span className="font-medium text-foreground">
                              {ui.core_value_label}:
                            </span>{" "}
                            {profile.coreValue}
                          </p>
                          <p>
                            <span className="font-medium text-foreground">
                              {ui.rival_hook_label}:
                            </span>{" "}
                            {profile.rivalHook}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs text-muted-foreground"
                            onClick={() => onSimilar(profile)}
                            disabled={isGenerating}
                          >
                            <Wand2 className="mr-1.5 h-3 w-3" />
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
                      {favorites.map((profile) => (
                        <span
                          key={profile.name}
                          className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/[0.04] px-3 py-1 text-sm font-medium text-foreground"
                        >
                          <Heart className="size-3 fill-orange-600 text-orange-600 dark:fill-orange-400 dark:text-orange-400" />
                          {profile.name}
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
        sourcePage="gang-name-generator"
      />
    </section>
  );
}
