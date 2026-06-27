"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Copy, Dice1, MapPin, Settings2, Sparkles, Trash2 } from "lucide-react";
import TurnstileInvisible, {
  TurnstileInvisibleHandle,
} from "@/components/TurnstileInvisible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { cn } from "@/lib/utils";
import { CityNicknameStorage } from "@/lib/city-nickname-storage";
import { pickRandomCityNicknamePreset } from "./lib";
import CityNicknameBreadcrumb from "./breadcrumb";
import type {
  CityGenre,
  CityNicknameGenerateResponse,
  CityNicknameHistoryItem,
  CityNicknameStyle,
  CityTone,
} from "@/types/city-nickname";
import type { CityNicknameGeneratePage } from "@/types/blocks/city-nickname-generate";

interface Props {
  section: CityNicknameGeneratePage;
}

const STYLE_ORDER: CityNicknameStyle[] = [
  "official",
  "local",
  "legendary",
  "mocking",
];

const GENRES: CityGenre[] = [
  "fantasy",
  "dark-fantasy",
  "noir",
  "cyberpunk",
  "sci-fi",
  "steampunk",
  "modern",
  "post-apocalyptic",
];

const TONES: CityTone[] = [
  "poetic",
  "majestic",
  "gritty",
  "ominous",
  "romantic",
  "cold",
  "street",
];

// Floating "city light" markers scattered across the hero — like glowing pins on a map.
const CITY_LIGHTS = [
  { left: "8%", top: "20%", delay: 0, size: 6, duration: 5, peak: 0.7 },
  { left: "88%", top: "14%", delay: 1.5, size: 5, duration: 6, peak: 0.6 },
  { left: "16%", top: "42%", delay: 2.2, size: 4, duration: 6.5, peak: 0.55 },
  { left: "80%", top: "36%", delay: 0.8, size: 6, duration: 5.5, peak: 0.65 },
  { left: "54%", top: "12%", delay: 3, size: 4, duration: 7, peak: 0.5 },
  { left: "68%", top: "52%", delay: 1.2, size: 5, duration: 6.2, peak: 0.6 },
] as const;

export default function CityNicknameGenerate({ section }: Props) {
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);

  const [cityName, setCityName] = useState("");
  const [cityType, setCityType] = useState("");
  const [genre, setGenre] = useState<CityGenre>("fantasy");
  const [reputation, setReputation] = useState("");
  const [tone, setTone] = useState<CityTone>("majestic");
  const [knownFor, setKnownFor] = useState("");
  const [geography, setGeography] = useState("");
  const [powerOrCulture, setPowerOrCulture] = useState("");
  const [styles, setStyles] = useState<CityNicknameStyle[]>(["official"]);
  const [count, setCount] = useState<6 | 12 | 20>(12);

  const [results, setResults] = useState<CityNicknameGenerateResponse | null>(null);
  const [history, setHistory] = useState<CityNicknameHistoryItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const ui = section.ui as Record<string, string>;
  const themePills = ((section.ui as any).theme_pills ?? []) as string[];
  const titleHighlight = String((section.ui as any).title_highlight ?? "");
  const fullTitle = String(ui.title ?? "");

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

  const genreLabels = (section as any).genre as Record<string, string> | undefined;
  const toneLabels = (section as any).tone as Record<string, string> | undefined;
  const styleLabels = (section as any).style as Record<string, string> | undefined;
  const countLabels = (section as any).count as Record<string, string> | undefined;

  useEffect(() => {
    setHistory(CityNicknameStorage.getHistory(locale));
  }, [locale]);

  const groupedEntries = useMemo(
    () =>
      STYLE_ORDER.map(
        (style) => [style, results?.grouped?.[style] ?? []] as const
      ),
    [results]
  );

  const toggleStyle = (style: CityNicknameStyle) => {
    setStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const onRandom = () => {
    const presets = (section.random_prompts ?? []) as Array<Record<string, unknown>>;
    const preset = pickRandomCityNicknamePreset(presets);
    if (!preset) return;
    setCityName(String(preset.cityName ?? ""));
    setCityType(String(preset.cityType ?? ""));
    setGenre((preset.genre as CityGenre) ?? "fantasy");
    setReputation(String(preset.reputation ?? ""));
    setTone((preset.tone as CityTone) ?? "majestic");
    setKnownFor(String(preset.knownFor ?? ""));
    setGeography(String(preset.geography ?? ""));
    setPowerOrCulture(String(preset.powerOrCulture ?? ""));
    if (Array.isArray(preset.nicknameStyles)) {
      setStyles(preset.nicknameStyles as CityNicknameStyle[]);
    }
    if (preset.count) setCount(Number(preset.count) as 6 | 12 | 20);
  };

  const runGeneration = useCallback(
    async (turnstileToken: string) => {
      try {
        const response = await fetch("/api/city-nickname-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cityName,
            cityType,
            genre,
            reputation,
            tone,
            knownFor,
            geography,
            powerOrCulture,
            nicknameStyles: styles,
            count,
            turnstileToken,
            locale,
          }),
        });
        const json = await response.json();
        if (json.code === -1) {
          toast.error(json.message);
          return;
        }
        setResults(json);
        toast.success(section.success.generated);

        const historyItem: CityNicknameHistoryItem = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: Date.now(),
          input: {
            cityName,
            cityType,
            genre,
            reputation,
            tone,
            knownFor,
            geography,
            powerOrCulture,
            nicknameStyles: styles,
            count,
            locale,
          },
          results: json.results,
        };
        const newHistory = [historyItem, ...history];
        setHistory(newHistory);
        CityNicknameStorage.saveHistory(locale, newHistory);
      } catch (error) {
        console.error("city nickname generation failed", error);
        toast.error(section.validation.generic_error);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      cityName,
      cityType,
      genre,
      reputation,
      tone,
      knownFor,
      geography,
      powerOrCulture,
      styles,
      count,
      locale,
      history,
      section,
    ]
  );

  const onGenerate = useCallback(() => {
    if (!cityType.trim()) {
      toast.error(section.validation.city_type_required);
      return;
    }
    if (!knownFor.trim()) {
      toast.error(section.validation.known_for_required);
      return;
    }
    if (!styles.length) {
      toast.error(section.validation.style_required);
      return;
    }
    setIsGenerating(true);
    turnstileRef.current?.execute();
  }, [cityType, knownFor, styles, section.validation]);

  const applyHistoryItem = (item: CityNicknameHistoryItem) => {
    const input = item.input;
    setCityName(input.cityName ?? "");
    setCityType(input.cityType ?? "");
    setGenre(input.genre ?? "fantasy");
    setReputation(input.reputation ?? "");
    setTone(input.tone ?? "majestic");
    setKnownFor(input.knownFor ?? "");
    setGeography(input.geography ?? "");
    setPowerOrCulture(input.powerOrCulture ?? "");
    setStyles(input.nicknameStyles ?? ["official"]);
    setCount(input.count ?? 12);
    toast.success(section.success.history_loaded);
  };

  const deleteHistoryItem = (id: string) => {
    const next = history.filter((item) => item.id !== id);
    setHistory(next);
    CityNicknameStorage.saveHistory(locale, next);
  };

  return (
    <section
      id="city_nickname_generator"
      className="min-h-[100dvh] bg-background text-foreground selection:bg-orange-500/20"
    >
      {/* Ambient background: warm radial halo + map grid */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.05_65),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.18_0.04_65),transparent)]" />
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-orange-500/[0.04] via-orange-500/[0.02] to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]"
          style={{ backgroundImage: "var(--bg-grid)", backgroundSize: "40px 40px" }}
        />
      </div>

      {/* Floating city-light markers */}
      {!reduceMotion && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
          aria-hidden="true"
        >
          {CITY_LIGHTS.map((light, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-orange-500 text-orange-500 dark:bg-orange-400 dark:text-orange-400"
              style={{
                left: light.left,
                top: light.top,
                width: light.size,
                height: light.size,
                filter: "drop-shadow(0 0 8px currentColor)",
              }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{
                opacity: [0, light.peak, light.peak * 0.4, 0],
                scale: [0.4, 1.2, 0.9, 0.4],
              }}
              transition={{
                duration: light.duration,
                delay: light.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      <main className="container relative z-10 mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-24">
        {/* Breadcrumb pill */}
        <div className="mb-10 flex justify-start">
          <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
            <CityNicknameBreadcrumb
              homeText={ui.breadcrumb_home}
              currentText={ui.breadcrumb_current}
            />
          </div>
        </div>

        {/* Hero copy */}
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          {/* Double-bezel icon container with breathing glow */}
          <div className="group mb-6 flex justify-center">
            <div className="relative rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 dark:bg-white/[0.015]">
              <div className="relative flex size-12 items-center justify-center rounded-xl bg-orange-500/10">
                {!reduceMotion && (
                  <div
                    className="absolute inset-0 rounded-xl bg-orange-500/20 blur-md group-hover:animate-moon-glow"
                    aria-hidden="true"
                  />
                )}
                <MapPin className="relative size-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          {/* Eyebrow badge */}
          <span className="mb-5 inline-flex items-center rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {ui.eyebrow}
          </span>

          {/* Title with italic gradient on the highlight term */}
          <h1 className="mt-4 pb-1 font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
            {titleParts.before}
            {titleParts.highlight && (
              <span className="italic bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent dark:from-orange-400 dark:via-orange-300 dark:to-amber-300">
                {titleParts.highlight}
              </span>
            )}
            {titleParts.after}
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-5 max-w-xl font-light text-base leading-relaxed text-muted-foreground/65 sm:text-lg">
            {ui.subtitle}
          </p>

          {/* Theme pills */}
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

        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          {/* Form */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{ui.form_title}</CardTitle>
              <Button variant="ghost" size="sm" onClick={onRandom}>
                <Dice1 className="mr-1.5 h-4 w-4" />
                {ui.random_button}
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4">
              {/* City type — required */}
              <div>
                <Label htmlFor="cityType">{ui.city_type_label}</Label>
                <Input
                  id="cityType"
                  placeholder={ui.city_type_placeholder}
                  value={cityType}
                  onChange={(e) => setCityType(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              {/* Genre — core dimension */}
              <div>
                <Label>{ui.genre_label}</Label>
                <Select
                  value={genre}
                  onValueChange={(v) => setGenre(v as CityGenre)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {genreLabels?.[g] ?? g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Known for — required */}
              <div>
                <Label htmlFor="knownFor">{ui.known_for_label}</Label>
                <Textarea
                  id="knownFor"
                  placeholder={ui.known_for_placeholder}
                  value={knownFor}
                  onChange={(e) => setKnownFor(e.target.value)}
                  rows={2}
                  className="mt-1.5 resize-none"
                />
              </div>

              {/* Nickname styles — core product feature */}
              <div>
                <Label className="mb-2 block">{ui.styles_label}</Label>
                <div className="flex flex-wrap gap-2">
                  {STYLE_ORDER.map((style) => (
                    <Badge
                      key={style}
                      variant={styles.includes(style) ? "default" : "outline"}
                      className="min-h-[40px] cursor-pointer select-none px-3.5 leading-none"
                      onClick={() => toggleStyle(style)}
                    >
                      {styleLabels?.[style] ?? style}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Count — basic control */}
              <div>
                <Label>{ui.count_label}</Label>
                <Select
                  value={String(count)}
                  onValueChange={(v) => setCount(Number(v) as 6 | 12 | 20)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {([6, 12, 20] as const).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {countLabels?.[String(n)] ?? `${n}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced options — collapsed by default */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex h-auto w-full items-center justify-between p-0 text-xs font-medium text-muted-foreground transition-colors hover:bg-transparent hover:text-orange-600 dark:hover:text-orange-400"
                  >
                    <span className="flex items-center gap-1.5">
                      <Settings2 className="h-3.5 w-3.5" />
                      {ui.advanced_options}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                        showAdvanced && "rotate-180"
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="grid gap-4 overflow-hidden pt-4 data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up">
                  <div>
                    <Label htmlFor="cityName">{ui.city_name_label}</Label>
                    <Input
                      id="cityName"
                      placeholder={ui.city_name_placeholder}
                      value={cityName}
                      onChange={(e) => setCityName(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reputation">{ui.reputation_label}</Label>
                    <Input
                      id="reputation"
                      placeholder={ui.reputation_placeholder}
                      value={reputation}
                      onChange={(e) => setReputation(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>{ui.tone_label}</Label>
                    <Select
                      value={tone}
                      onValueChange={(v) => setTone(v as CityTone)}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TONES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {toneLabels?.[t] ?? t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="geography">{ui.geography_label}</Label>
                    <Input
                      id="geography"
                      placeholder={ui.geography_placeholder}
                      value={geography}
                      onChange={(e) => setGeography(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="powerOrCulture">
                      {ui.power_culture_label}
                    </Label>
                    <Input
                      id="powerOrCulture"
                      placeholder={ui.power_culture_placeholder}
                      value={powerOrCulture}
                      onChange={(e) => setPowerOrCulture(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Button
                onClick={onGenerate}
                disabled={isGenerating}
                className="w-full"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? ui.generating_button : ui.generate_button}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div
            className={cn(
              "space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1 lg:pb-2",
              results ? "lg:self-start" : "lg:self-stretch"
            )}
          >
            {results ? (
              groupedEntries.map(([style, items]) =>
                items.length ? (
                  <div key={style}>
                    <h2 className="mb-3 text-lg font-semibold">
                      {ui[`group_${style}`] ?? style}
                    </h2>
                    <div className="grid gap-3">
                      {items.map((item) => (
                        <Card key={`${style}-${item.nickname}`}>
                          <CardHeader className="flex flex-row items-start justify-between pb-2">
                            <CardTitle className="text-base">
                              {item.nickname}
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 shrink-0"
                              onClick={() => {
                                navigator.clipboard.writeText(item.nickname);
                                toast.success(section.success.copied);
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </CardHeader>
                          <CardContent className="space-y-1.5 text-sm text-muted-foreground">
                            <p>
                              <span className="font-medium text-foreground">
                                {ui.why_it_fits}:
                              </span>{" "}
                              {item.whyItFits}
                            </p>
                            <p>
                              <span className="font-medium text-foreground">
                                {ui.best_for}:
                              </span>{" "}
                              {item.bestFor}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : null
              )
            ) : (
              <div className="flex h-full min-h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                {ui.empty_output}
              </div>
            )}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-lg font-semibold">{ui.history_title}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {history.slice(0, 6).map((item) => (
                <Card
                  key={item.id}
                  className="group relative cursor-pointer transition-colors hover:bg-muted/40"
                  onClick={() => applyHistoryItem(item)}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={ui.history_delete}
                    className="absolute right-1.5 top-1.5 h-9 w-9 text-muted-foreground opacity-0 transition-opacity duration-200 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteHistoryItem(item.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <CardContent className="p-3 pr-12 text-sm">
                    <p className="font-medium line-clamp-1">{item.input.cityType}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {item.input.knownFor}
                    </p>
                    <p className="mt-1 text-xs text-orange-500">
                      {item.results.length} nicknames
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={runGeneration}
        onError={() => {
          setIsGenerating(false);
          toast.error(section.errors?.verification_failed ?? section.validation.generic_error);
        }}
      />
    </section>
  );
}
