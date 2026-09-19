"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useOpenPanel } from "@openpanel/nextjs";
import { toast } from "sonner";
import { Copy, Heart, Leaf, RefreshCw, Sparkles, Wand2 } from "lucide-react";
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
  ElfHeritage,
  ElfNameCandidate,
  ElfNameForm,
  ElfNameGeneratorResponse,
  ElfNameModelMode,
  ElfNameStyle,
  ElfNameUse,
} from "@/types/elf-name-generator";
import type { ElfNameGeneratorPage } from "@/types/blocks/elf-name-generator";

interface Props {
  section: ElfNameGeneratorPage;
}

const MAX_ROLE_BACKGROUND = 400;
const MAX_CUSTOM_HERITAGE = 160;
const MAX_INSPIRATION_NAME = 100;

// Closed control lists mirror the API contract in src/types/elf-name-generator.
const HERITAGES: ElfHeritage[] = [
  "moonlit_court",
  "ancient_woodland",
  "shadowborne",
  "sunlit_scholar",
  "custom",
];
const STYLES: ElfNameStyle[] = [
  "graceful",
  "ancient",
  "fierce",
  "mysterious",
  "playful",
];
const NAME_USES: ElfNameUse[] = ["character", "family_clan", "npc_set"];
const NAME_FORMS: ElfNameForm[] = [
  "feminine",
  "masculine",
  "neutral",
  "mixed",
];
const MODEL_MODES: ElfNameModelMode[] = ["fast", "standard", "creative"];
// Elven-looking glyph string shown one character at a time while generating.
const LOADING_GLYPHS = ["ᚠ", "ᚱ", "✦", "ᛖ", "ᛚ", "ᚹ", "ᛃ", "✧"];

export default function ElfNameGenerator({ section }: Props) {
  const locale = useLocale();
  const tAiTools = useTranslations("ai_tools");
  const { track } = useOpenPanel();
  const creativeQuota = useCreativeQuotaPage("elf-name-generator");
  const { user } = useAppContext();
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  // Carries a one-shot inspiration override from Similar/Reroll into the
  // Turnstile success handler (state updates alone would arrive too late).
  const pendingInspirationRef = useRef<string | null>(null);
  const ui = section.ui;

  const [heritage, setHeritage] = useState<ElfHeritage>("moonlit_court");
  const [style, setStyle] = useState<ElfNameStyle>("graceful");
  const [nameUse, setNameUse] = useState<ElfNameUse>("character");
  const [nameForm, setNameForm] = useState<ElfNameForm>("neutral");
  const [customHeritage, setCustomHeritage] = useState("");
  const [roleBackground, setRoleBackground] = useState("");
  const [inspirationName, setInspirationName] = useState("");
  const [mode, setMode] = useState<ElfNameModelMode>("standard");
  const [results, setResults] = useState<ElfNameGeneratorResponse | null>(null);
  const [favorites, setFavorites] = useState<ElfNameCandidate[]>([]);
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

  const showCustomHeritage = heritage === "custom";

  const runGeneration = useCallback(
    async (turnstileToken: string) => {
      const inspirationOverride = pendingInspirationRef.current;
      pendingInspirationRef.current = null;
      const activeInspiration = inspirationOverride ?? inspirationName;
      try {
        const response = await fetch("/api/elf-name", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            heritage,
            style,
            nameUse,
            nameForm,
            roleBackground,
            customHeritage,
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
        setResults(json as ElfNameGeneratorResponse);
        if (mode === "creative") {
          creativeQuota.increment();
        }
        toast.success(section.success.generated);
        track("elf_name_generated", {
          locale,
          heritage,
          style,
          name_use: nameUse,
          name_form: nameForm,
          mode,
          used_background: Boolean(roleBackground.trim()),
          used_inspiration: Boolean(activeInspiration),
        });
      } catch (error) {
        console.error("elf name generation failed", error);
        toast.error(section.validation.generic_error);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      heritage,
      style,
      nameUse,
      nameForm,
      roleBackground,
      customHeritage,
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
      if (showCustomHeritage && !customHeritage.trim()) {
        toast.error(section.validation.custom_heritage_required);
        return;
      }
      if (roleBackground.length > MAX_ROLE_BACKGROUND) {
        toast.error(section.validation.role_too_long);
        return;
      }
      if (customHeritage.length > MAX_CUSTOM_HERITAGE) {
        toast.error(section.validation.custom_heritage_too_long);
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
      showCustomHeritage,
      customHeritage,
      roleBackground,
      inspirationName,
      mode,
      section.validation,
      creativeQuota,
    ]
  );

  const onCopy = useCallback(
    async (candidate: ElfNameCandidate) => {
      try {
        await navigator.clipboard.writeText(candidate.name);
        toast.success(section.success.copied);
        track("elf_name_copied", {
          locale,
          heritage,
          name_use: nameUse,
        });
      } catch (error) {
        console.error("elf name copy failed", error);
        toast.error(section.validation.generic_error);
      }
    },
    [locale, heritage, nameUse, section, track]
  );

  const onToggleFavorite = useCallback(
    (candidate: ElfNameCandidate) => {
      const isFavorited = favorites.some((item) => item.name === candidate.name);
      setFavorites((prev) =>
        isFavorited
          ? prev.filter((item) => item.name !== candidate.name)
          : [...prev, candidate]
      );
      toast.success(
        isFavorited ? section.success.unfavorited : section.success.favorited
      );
    },
    [favorites, section.success]
  );

  const onSimilar = useCallback(
    (candidate: ElfNameCandidate) => {
      setInspirationName(candidate.name);
      track("elf_name_similar_generated", {
        locale,
        heritage,
        style,
        name_use: nameUse,
        name_form: nameForm,
      });
      onGenerate(candidate.name);
    },
    [locale, heritage, style, nameUse, nameForm, onGenerate, track]
  );

  const onReroll = useCallback(() => {
    setInspirationName("");
    track("elf_name_rerolled", {
      locale,
      heritage,
      style,
      name_use: nameUse,
      name_form: nameForm,
    });
    onGenerate("");
  }, [locale, heritage, style, nameUse, nameForm, onGenerate, track]);

  return (
    <section
      id="elf_name_generator"
      className="min-h-[100dvh] bg-background text-foreground selection:bg-primary/20"
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.97_0_0),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.17_0_0),transparent)]" />
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-primary/[0.04] via-primary/[0.02] to-transparent" />
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
              <div className="relative flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <Leaf className="relative size-6 text-primary" />
              </div>
            </div>
          </div>

          <span className="mb-5 inline-flex items-center rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {ui.eyebrow}
          </span>

          <h1 className="mt-4 pb-1 font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
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
            <div className="mt-7 hidden flex-wrap items-center justify-center gap-2 sm:flex">
              {themePills.map((pill, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.04] px-3 py-1 text-xs font-medium text-primary"
                >
                  <span className="inline-block size-1 rounded-full bg-primary/60" />
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
            <CardContent className="space-y-5">
              {/* Selects · All four closed-choice controls in one compact two-column grid;
                  stacks to one column under sm so long German/Russian values never clip. */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>{ui.heritage_label}</Label>
                  <Select
                    value={heritage}
                    onValueChange={(v) => setHeritage(v as ElfHeritage)}
                  >
                    <SelectTrigger className="mt-1.5 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HERITAGES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {ui.heritage_options.find(
                            (opt) => opt.value === value
                          )?.label ?? value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{ui.name_use_label}</Label>
                  <Select
                    value={nameUse}
                    onValueChange={(v) => setNameUse(v as ElfNameUse)}
                  >
                    <SelectTrigger className="mt-1.5 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NAME_USES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {ui.name_use_options.find(
                            (opt) => opt.value === value
                          )
                            ?.label ?? value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{ui.style_label}</Label>
                  <Select
                    value={style}
                    onValueChange={(v) => setStyle(v as ElfNameStyle)}
                  >
                    <SelectTrigger className="mt-1.5 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STYLES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {ui.style_options.find((opt) => opt.value === value)
                            ?.label ?? value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{ui.name_form_label}</Label>
                  <Select
                    value={nameForm}
                    onValueChange={(v) => setNameForm(v as ElfNameForm)}
                  >
                    <SelectTrigger className="mt-1.5 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NAME_FORMS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {ui.name_form_options.find(
                            (opt) => opt.value === value
                          )
                            ?.label ?? value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {showCustomHeritage && (
                <div>
                  <Label htmlFor="elf-custom-heritage">
                    {ui.custom_heritage_label}
                  </Label>
                  <Textarea
                    id="elf-custom-heritage"
                    placeholder={ui.custom_heritage_placeholder}
                    value={customHeritage}
                    onChange={(e) => setCustomHeritage(e.target.value)}
                    rows={2}
                    className="mt-1.5 resize-none"
                    maxLength={MAX_CUSTOM_HERITAGE}
                  />
                  <p className="mt-1 text-right text-[11px] text-muted-foreground/50">
                    {customHeritage.length}/{MAX_CUSTOM_HERITAGE}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/60">
                    {ui.custom_heritage_helper}
                  </p>
                </div>
              )}

              {/* Context · free text breathes at full width. */}
              <div>
                <Label htmlFor="elf-role">{ui.role_label}</Label>
                <Textarea
                  id="elf-role"
                  placeholder={ui.role_placeholder}
                  value={roleBackground}
                  onChange={(e) => setRoleBackground(e.target.value)}
                  rows={3}
                  className="mt-1.5 resize-none"
                  maxLength={MAX_ROLE_BACKGROUND}
                />
                <p className="mt-1 text-right text-[11px] text-muted-foreground/50">
                  {roleBackground.length}/{MAX_ROLE_BACKGROUND}
                </p>
              </div>

              {inspirationName && (
                <p className="flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/[0.04] px-3 py-2 text-xs text-primary">
                  <Sparkles className="size-3.5 shrink-0" />
                  <span>
                    {ui.inspiration_hint} <strong>{inspirationName}</strong>
                  </span>
                </p>
              )}

              {/* Terminal · Model + action: the cost decision sits right above the button it controls. */}
              <div className="space-y-4 rounded-xl border border-border/60 bg-foreground/[0.015] p-4 dark:bg-white/[0.02]">
                <div>
                  <Label>{ui.mode_label}</Label>
                  <ToggleGroup
                    type="single"
                    value={mode}
                    onValueChange={(value) => {
                      if (value) setMode(value as ElfNameModelMode);
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
                    pageKey="elf-name-generator"
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
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div
            className={cn(
              "space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1 lg:pb-2",
              results ? "lg:self-start" : "lg:self-stretch"
            )}
            aria-live="polite"
          >
            <p className="sr-only" role="status">
              {isGenerating ? ui.generating_button : ui.output_title}
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
                      className="elf-loading-glyph absolute font-display text-4xl text-primary"
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
                            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                              {ui.result_label} {i + 1}
                            </span>
                            <CardTitle className="mt-1 break-words text-lg leading-snug">
                              {candidate.name}
                            </CardTitle>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => onToggleFavorite(candidate)}
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
                              className="h-9 w-9"
                              onClick={() => onCopy(candidate)}
                              aria-label={ui.copy_button}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                          <p>
                            <span className="font-medium text-foreground">
                              {ui.pronunciation_label}:
                            </span>{" "}
                            {candidate.pronunciation}
                          </p>
                          <p>
                            <span className="font-medium text-foreground">
                              {ui.meaning_label}:
                            </span>{" "}
                            {candidate.meaning}
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
                            className="h-8 px-3 text-xs text-muted-foreground"
                            onClick={() => onSimilar(candidate)}
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
        sourcePage="elf-name-generator"
      />
    </section>
  );
}
