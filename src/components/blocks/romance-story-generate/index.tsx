"use client";

import GeneratorNavTabs from "@/components/generator-nav-tabs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  ChevronDown,
  Copy,
  Eraser,
  Flame,
  Heart,
  Palette,
  RefreshCw,
  Settings2,
  Sparkles,
  Stars,
  Wand2,
  Zap,
  PenLine,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import ShareResultButton from "@/components/story/share-result-button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import TurnstileInvisible, { TurnstileInvisibleHandle } from "@/components/TurnstileInvisible";
import { GeneratorShortcutHints } from "@/components/generator-shortcut-hints";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
import { useGeneratorShortcuts } from "@/hooks/useGeneratorShortcuts";
import { StoryStorage } from "@/lib/story-storage";
import { LANGUAGE_OPTIONS } from "@/lib/language-options";
import { cn } from "@/lib/utils";
import type { RomanceStoryGenerate as RomanceStoryGenerateType } from "@/types/blocks/romance-story-generate";
import RomanceStoryBreadcrumb from "./breadcrumb";
import { useRouter } from "@/i18n/navigation";
import { buildContinueRoute } from "@/components/ai-write/workbench/_lib";

const DRAFT_KEY = "romance-story-generator:prompt";

function calculateWordCount(text: string): number {
  if (!text?.trim()) return 0;
  const cjkRegex = /[一-鿿㐀-䶿豈-﫿぀-ゟ゠-ヿ가-힯]/g;
  const cjkCount = (text.match(cjkRegex) || []).length;
  const withoutCJK = text.replace(cjkRegex, " ").trim();
  const englishCount = withoutCJK ? withoutCJK.split(/\s+/).filter(Boolean).length : 0;
  return cjkCount + englishCount;
}

interface RomanceStoryGenerateProps {
  section?: RomanceStoryGenerateType;
}

type GeneratorOptions = {
  prompt: string;
  model: string;
  locale: string;
  subGenre: string;
  trope: string;
  heatLevel: string;
  setting: string;
  pov: string;
  storyLength: string;
};

export default function RomanceStoryGenerate({ section }: RomanceStoryGenerateProps) {
  const locale = useLocale();
  const router = useRouter();
  const reduceMotion = useReducedMotion();

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

  const AI_MODELS = useMemo(
    () => [
      {
        id: "fast",
        name: t("ai_models.fast"),
        badge: "FAST",
        badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        icon: <Zap className="h-4 w-4" />,
        description: t("ai_models.fast_description"),
      },
      {
        id: "standard",
        name: t("ai_models.standard"),
        badge: "RECOMMENDED",
        badgeColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
        icon: <Sparkles className="h-4 w-4" />,
        description: t("ai_models.standard_description"),
      },
      {
        id: "creative",
        name: t("ai_models.creative"),
        badge: "PRO",
        badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        icon: <Palette className="h-4 w-4" />,
        description: t("ai_models.creative_description"),
      },
    ],
    [t]
  );


  const subGenres = useMemo(() => Object.entries(section?.sub_genres || {}), [section]);
  const tropes = useMemo(() => Object.entries(section?.tropes || {}), [section]);
  const heatLevels = useMemo(() => Object.entries(section?.heat_levels || {}), [section]);
  const settings = useMemo(() => Object.entries(section?.settings || {}), [section]);
  const povs = useMemo(() => Object.entries(section?.povs || {}), [section]);
  const storyLengths = useMemo(() => Object.entries(section?.story_lengths || {}), [section]);
  const randomPrompts = useMemo(() => section?.random_prompts || [], [section]);

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("standard");
  const [selectedLanguage, setSelectedLanguage] = useState(locale);
  const [subGenre, setSubGenre] = useState("modern");
  const [trope, setTrope] = useState("enemies_to_lovers");
  const [heatLevel, setHeatLevel] = useState("mild");
  const [setting, setSetting] = useState("contemporary_city");
  const [pov, setPov] = useState("third_person");
  const [storyLength, setStoryLength] = useState("medium");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState("");

  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const outputScrollRef = useRef<HTMLDivElement | null>(null);

  const latestOptionsRef = useRef<GeneratorOptions>({
    prompt: "",
    model: "standard",
    locale,
    subGenre: "modern",
    trope: "enemies_to_lovers",
    heatLevel: "mild",
    setting: "contemporary_city",
    pov: "third_person",
    storyLength: "medium",
  });

  useEffect(() => {
    latestOptionsRef.current = {
      prompt,
      model: selectedModel,
      locale: selectedLanguage,
      subGenre,
      trope,
      heatLevel,
      setting,
      pov,
      storyLength,
    };
  }, [prompt, selectedModel, selectedLanguage, subGenre, trope, heatLevel, setting, pov, storyLength]);

  useDraftAutoSave({
    key: `${DRAFT_KEY}:${locale}`,
    value: prompt,
    onRestore: (draft) => setPrompt(draft),
  });

  useEffect(() => {
    if (!isGenerating || !generatedStory) return;
    const container = outputScrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [generatedStory, isGenerating]);

  const handleRandomPrompt = useCallback(() => {
    if (!randomPrompts.length) return;
    const randomIndex = Math.floor(Math.random() * randomPrompts.length);
    setPrompt(randomPrompts[randomIndex]);
    toast.success(t("success.random_prompt_selected"));
    setTimeout(() => promptRef.current?.focus(), 50);
  }, [randomPrompts, t]);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) {
      toast.error(t("validation.enter_story_idea"));
      promptRef.current?.focus();
      return;
    }
    if (!selectedModel) {
      toast.error(t("validation.select_model"));
      return;
    }
    setGeneratedStory("");
    setIsGenerating(true);
    turnstileRef.current?.execute();
  }, [prompt, selectedModel, t]);

  const handleTurnstileSuccess = useCallback(
    async (turnstileToken: string) => {
      const opts = latestOptionsRef.current;

      try {
        const response = await fetch("/api/romance-story/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: opts.prompt.trim(),
            model: opts.model,
            locale: opts.locale,
            subGenre: opts.subGenre,
            trope: opts.trope,
            heatLevel: opts.heatLevel,
            setting: opts.setting,
            pov: opts.pov,
            storyLength: opts.storyLength,
            turnstileToken,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let accumulatedContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.trim().startsWith('0:"')) continue;
            try {
              const content = line
                .slice(3, -1)
                .replace(/\\n/g, "\n")
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, "\\");
              accumulatedContent += content;
              setGeneratedStory(accumulatedContent);
            } catch (error) {
              console.error("Parse error:", error);
            }
          }
        }

        if (accumulatedContent.trim()) {
          StoryStorage.saveStory({
            title: (opts.prompt.trim() || "Romance Story").slice(0, 30),
            prompt: opts.prompt.trim(),
            content: accumulatedContent.trim(),
            wordCount: calculateWordCount(accumulatedContent),
            model: AI_MODELS.find((item) => item.id === opts.model)?.name || "AI",
            genre: "Romance",
          });
          toast.success(t("success.story_generated"));
          if (window.innerWidth < 1024) {
            setTimeout(() => {
              resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 250);
          }
        }
      } catch (error) {
        console.error("Romance story generation error:", error);
        toast.error(t("errors.generation_failed"));
      } finally {
        setIsGenerating(false);
      }
    },
    [AI_MODELS, t]
  );

  const handleTurnstileError = useCallback(() => {
    setIsGenerating(false);
    toast.error(t("errors.generation_failed"));
  }, [t]);

  const handleCopy = useCallback(() => {
    if (!generatedStory) return;
    navigator.clipboard.writeText(generatedStory);
    toast.success(t("success.story_copied"));
  }, [generatedStory, t]);

  useGeneratorShortcuts({
    onGenerate: handleGenerate,
    onFocusInput: () => promptRef.current?.focus(),
  });

  const wordCount = useMemo(() => calculateWordCount(generatedStory), [generatedStory]);

  return (
    <div id="romance_story_generator" className="min-h-screen bg-background text-foreground selection:bg-orange-500/20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.05_65),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.18_0.04_65),transparent)]" />
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-orange-500/[0.04] via-orange-500/[0.02] to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]"
          style={{ backgroundImage: "var(--bg-grid)", backgroundSize: "40px 40px" }}
        />
      </div>

      {/* Floating romance petals (ambient atmosphere). Honors prefers-reduced-motion. */}
      {!reduceMotion && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-[1]" aria-hidden="true">
          {[
            { left: "6%", delay: 0, duration: 16, size: 26, rotate: -12, opacity: 0.55 },
            { left: "84%", delay: 3, duration: 19, size: 22, rotate: 18, opacity: 0.5 },
            { left: "22%", delay: 7, duration: 22, size: 18, rotate: -22, opacity: 0.45 },
            { left: "70%", delay: 11, duration: 17, size: 24, rotate: 8, opacity: 0.5 },
            { left: "46%", delay: 14, duration: 24, size: 20, rotate: -15, opacity: 0.4 },
          ].map((p, i) => (
            <motion.svg
              key={i}
              className="absolute top-[-60px] text-orange-500 dark:text-orange-400"
              style={{ left: p.left, width: p.size, height: p.size }}
              viewBox="0 0 24 24"
              fill="currentColor"
              initial={{ y: -60, opacity: 0, rotate: p.rotate }}
              animate={{ y: 1400, opacity: [0, p.opacity, p.opacity, 0], rotate: p.rotate + 120 }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <path d="M12 2c-2.5 4-5 7-5 11 0 4 2.2 7 5 7s5-3 5-7c0-4-2.5-7-5-11z" />
            </motion.svg>
          ))}
        </div>
      )}

      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={handleTurnstileSuccess}
        onError={handleTurnstileError}
      />

      <main className="relative z-10 container max-w-7xl mx-auto px-4 py-16 sm:py-20 lg:py-24">
        <div className="mb-10 flex justify-start">
          <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
            <RomanceStoryBreadcrumb
              homeText={t("ui.breadcrumb_home")}
              currentText={t("ui.breadcrumb_current")}
            />
          </div>
        </div>

        <div className="mx-auto max-w-2xl text-center mb-14 sm:mb-18">
          {/* Double-bezel icon container with Cupid's arrow */}
          <div className="flex justify-center mb-6">
            <div className="relative rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 dark:bg-white/[0.015]">
              <div className="flex size-12 items-center justify-center rounded-xl bg-orange-500/10">
                <Heart className="size-6 text-orange-600 dark:text-orange-400" />
              </div>
              {/* Cupid's arrow piercing the heart container */}
              <svg
                className="pointer-events-none absolute -right-3 -top-2 size-6 text-orange-500/45 rotate-[20deg]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 21 L21 3" />
                <path d="M21 3 L15 3 M21 3 L21 9" />
                <path d="M3 21 L9 21 M3 21 L3 15" opacity="0.6" />
              </svg>
            </div>
          </div>

          {/* Eyebrow badge (status dot removed per design-taste-frontend §9.F) */}
          <span className="inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-5">
            AI Romance Writer
          </span>

          {/* Title: Romance in italic serif, Story Generator in roman */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.08] mt-4">
            <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 dark:from-orange-400 dark:via-orange-300 dark:to-amber-300">
              Romance
            </span>{" "}
            <span>Story Generator</span>
          </h1>

          {/* Heart-with-arrow decorative SVG (Cupid motif, replaces brush stroke) */}
          <div className="flex justify-center" aria-hidden="true">
            <svg
              className="mt-4 mb-5 h-3 w-32 text-orange-500/40"
              viewBox="0 0 160 16"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M14 9.5c-1.2 1.8-3 3-4.5 3.5-1.5-.5-3.3-1.7-4.5-3.5-1-1.5-1-3.2 0-4.3 1-1 2.5-1 3.5 0l1 .8 1-.8c1-1 2.5-1 3.5 0 1 1.1 1 2.8 0 4.3z"
                fill="currentColor"
                opacity="0.85"
                transform="rotate(-8 9.5 8.5)"
              />
              <path
                d="M22 8.5 L132 8.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M126 4.5 L134 8.5 L126 12.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M28 5 L22 8.5 L28 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.6"
              />
            </svg>
          </div>

          <p className="text-base sm:text-lg text-muted-foreground/65 leading-relaxed font-light max-w-xl mx-auto">
            {t("ui.subtitle")}
          </p>

          {/* Trope pills (romance signature element) */}
          {section?.ui?.trope_pills?.length ? (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              {section.ui.trope_pills.map((pill: string, i: number) => (
                <span
                  key={i}
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

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] xl:grid-cols-[480px_1fr] gap-8 lg:gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-1"
          >
            <div className="bg-card/60 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-xl shadow-black/5 dark:shadow-black/20 ring-1 ring-black/5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    {t("ui.story_idea")}
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRandomPrompt}
                    className="h-7 text-xs gap-1.5 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 px-2.5 rounded-full"
                  >
                    <Wand2 className="w-3 h-3" />
                    {t("ui.random_button")}
                  </Button>
                </div>
                <div className="relative group">
                  <Textarea
                    ref={promptRef}
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder={t("placeholders.story_idea")}
                    className="min-h-[120px] resize-none bg-muted/50 border-border/50 focus:border-orange-500/50 focus:ring-orange-500/20 rounded-xl p-4 text-base leading-relaxed transition-all shadow-sm"
                  />
                  {prompt && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setPrompt("")}
                      className="absolute bottom-2 right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <Eraser className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="h-px bg-border/50 my-6" />

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                      {t("ui.ai_model")}
                    </Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_MODELS.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                      {t("ui.output_language")}
                    </Label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((item) => (
                          <SelectItem key={item.code} value={item.code}>
                            <span className="mr-2">{item.flag}</span>{item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                      {t("ui.sub_genre")}
                    </Label>
                    <Select value={subGenre} onValueChange={setSubGenre}>
                      <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {subGenres.map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                      {t("ui.trope")}
                    </Label>
                    <Select value={trope} onValueChange={setTrope}>
                      <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tropes.map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Heat Level: promoted to main form (romance core control, flame icon as romance motif) */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <Flame
                      className={cn(
                        "size-4 text-orange-500",
                        heatLevel === "steamy" && !reduceMotion && "animate-pulse"
                      )}
                    />
                    {t("ui.heat_level")}
                  </Label>
                  <Select value={heatLevel} onValueChange={setHeatLevel}>
                    <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {heatLevels.map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full flex justify-between items-center p-0 h-auto hover:bg-transparent text-xs font-medium text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Settings2 className="w-3.5 h-3.5" />
                        {t("ui.advanced_options")}
                      </span>
                      <ChevronDown
                        className={cn("w-3.5 h-3.5 transition-transform", showAdvanced && "rotate-180")}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 space-y-3 data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up overflow-hidden">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                        {t("ui.setting")}
                      </Label>
                      <Select value={setting} onValueChange={setSetting}>
                        <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {settings.map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                        {t("ui.pov")}
                      </Label>
                      <Select value={pov} onValueChange={setPov}>
                        <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {povs.map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                        {t("ui.story_length")}
                      </Label>
                      <Select value={storyLength} onValueChange={setStoryLength}>
                        <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {storyLengths.map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              <div className="pt-6">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="group w-full h-12 text-base bg-orange-600 font-semibold text-white shadow-md shadow-orange-600/20 hover:bg-orange-700 active:scale-[0.97] disabled:opacity-60 dark:bg-orange-500 dark:shadow-orange-500/20 dark:hover:bg-orange-600"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      {t("ui.generating")}
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5 mr-2 group-hover:animate-heartbeat" />
                      {t("ui.generate_button")}
                    </>
                  )}
                </Button>
                <GeneratorShortcutHints className="mt-3" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            ref={resultRef}
            className="relative h-[520px] sm:h-[720px] max-h-[75vh] min-h-[400px] sm:min-h-[520px] lg:sticky lg:top-24"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-orange-500/5 rounded-[2rem] blur-2xl -z-10" />

            <div
              className={cn(
                "h-full rounded-[2rem] border border-border backdrop-blur-xl overflow-hidden transition-all duration-500 flex flex-col card-hover-lift",
                generatedStory
                  ? "bg-card/80 shadow-2xl shadow-orange-500/10"
                  : "bg-card/40 shadow-xl border-dashed"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-4 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{t("output.title")}</span>
                    {generatedStory && (
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                        {wordCount} {t("output.words")}
                      </span>
                    )}
                  </div>
                </div>
                {generatedStory && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {t("output.copy")}
                    </Button>
                    <ShareResultButton
                      content={generatedStory}
                      prompt={prompt}
                      sourceCategory="romance"
                      title={prompt.substring(0, 30) + (prompt.length > 30 ? "..." : "")}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        try {
                          window.localStorage.setItem("ai-write:generator-prefill", JSON.stringify({ title: prompt.substring(0, 30), content: generatedStory }));
                        } catch {}
                        router.push(buildContinueRoute({ source: "romance-story-generator" }) as any);
                      }}
                      className="h-8 text-xs gap-1.5 rounded-full bg-orange-600 px-3 text-white hover:bg-orange-500"
                    >
                      <PenLine className="w-3.5 h-3.5" />
                      {locale === "zh" ? "续写" : "Continue"}
                    </Button>
                  </div>
                )}
              </div>

              <div
                ref={outputScrollRef}
                className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar"
              >
                {generatedStory ? (
                  <div className="animate-fade-in">
                    <article className="prose prose-slate dark:prose-invert prose-lg max-w-none leading-relaxed prose-headings:font-semibold prose-p:text-slate-700 dark:prose-p:text-slate-300">
                      <ReactMarkdown>{generatedStory}</ReactMarkdown>
                    </article>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-60">
                    {isGenerating ? (
                      <div className="space-y-6">
                        <div className="relative mx-auto w-16 h-16">
                          <div className="absolute inset-0 rounded-full border-4 border-orange-500/20" />
                          <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin" />
                          <Heart className="absolute inset-0 m-auto w-6 h-6 text-orange-500 animate-pulse" />
                        </div>
                        <p className="text-sm font-medium animate-pulse">{t("output.generating_message")}</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-w-xs mx-auto">
                        <div className="w-16 h-16 mx-auto bg-orange-500/5 rounded-2xl flex items-center justify-center rotate-3">
                          <Stars className="w-8 h-8 text-orange-400/50" />
                        </div>
                        <p className="text-muted-foreground text-sm">{t("output.empty_message")}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
