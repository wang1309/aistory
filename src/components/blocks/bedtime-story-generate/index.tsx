"use client";

import GeneratorNavTabs from "@/components/generator-nav-tabs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  BookOpen,
  ChevronDown,
  Copy,
  Eraser,
  Moon,
  RefreshCw,
  Settings2,
  Sparkles,
  Wand2,
  Zap,
  Palette,
  PenLine,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { BedtimeStoryGenerate as BedtimeStoryGenerateType } from "@/types/blocks/bedtime-story-generate";
import BedtimeStoryBreadcrumb from "./breadcrumb";
import { useRouter } from "@/i18n/navigation";
import { buildContinueRoute } from "@/components/ai-write/workbench/_lib";

const DRAFT_KEY = "bedtime-story-generator:prompt";

function calculateWordCount(text: string): number {
  if (!text?.trim()) return 0;
  const cjkRegex =
    /[一-鿿㐀-䶿豈-﫿぀-ゟ゠-ヿ가-힯]/g;
  const cjkCount = (text.match(cjkRegex) || []).length;
  const withoutCJK = text.replace(cjkRegex, " ").trim();
  const englishCount = withoutCJK ? withoutCJK.split(/\s+/).filter(Boolean).length : 0;
  return cjkCount + englishCount;
}

interface BedtimeStoryGenerateProps {
  section?: BedtimeStoryGenerateType;
}

type GeneratorOptions = {
  prompt: string;
  model: string;
  locale: string;
  ageGroup: string;
  storyTheme: string;
  storyLength: string;
  endingMood: string;
  moralLesson: string;
  childName: string;
};

export default function BedtimeStoryGenerate({ section }: BedtimeStoryGenerateProps) {
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


  const ageGroups = useMemo(() => Object.entries(section?.age_groups || {}), [section]);
  const storyThemes = useMemo(() => Object.entries(section?.story_themes || {}), [section]);
  const storyLengths = useMemo(() => Object.entries(section?.story_lengths || {}), [section]);
  const endingMoods = useMemo(() => Object.entries(section?.ending_moods || {}), [section]);
  const moralLessons = useMemo(() => Object.entries(section?.moral_lessons || {}), [section]);
  const randomPrompts = useMemo(() => section?.random_prompts || [], [section]);

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("standard");
  const [selectedLanguage, setSelectedLanguage] = useState(locale);
  const [ageGroup, setAgeGroup] = useState("preschool");
  const [storyTheme, setStoryTheme] = useState("adventure");
  const [storyLength, setStoryLength] = useState("medium");
  const [endingMood, setEndingMood] = useState("happy");
  const [moralLesson, setMoralLesson] = useState("none");
  const [childName, setChildName] = useState("");
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
    ageGroup: "preschool",
    storyTheme: "adventure",
    storyLength: "medium",
    endingMood: "happy",
    moralLesson: "none",
    childName: "",
  });

  useEffect(() => {
    latestOptionsRef.current = {
      prompt,
      model: selectedModel,
      locale: selectedLanguage,
      ageGroup,
      storyTheme,
      storyLength,
      endingMood,
      moralLesson,
      childName,
    };
  }, [prompt, selectedModel, selectedLanguage, ageGroup, storyTheme, storyLength, endingMood, moralLesson, childName]);

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
        const response = await fetch("/api/bedtime-story/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: opts.prompt.trim(),
            model: opts.model,
            locale: opts.locale,
            ageGroup: opts.ageGroup,
            storyTheme: opts.storyTheme,
            length: opts.storyLength,
            endingMood: opts.endingMood,
            moralLesson: opts.moralLesson !== "none" ? opts.moralLesson : undefined,
            childName: opts.childName.trim() || undefined,
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
            title: (opts.prompt.trim() || "Bedtime Story").slice(0, 30),
            prompt: opts.prompt.trim(),
            content: accumulatedContent.trim(),
            wordCount: calculateWordCount(accumulatedContent),
            model: AI_MODELS.find((item) => item.id === opts.model)?.name || "AI",
            genre: "Bedtime",
          });
          toast.success(t("success.story_generated"));
          if (window.innerWidth < 1024) {
            setTimeout(() => {
              resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 250);
          }
        }
      } catch (error) {
        console.error("Bedtime story generation error:", error);
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
    <div id="bedtime_story_generator" className="min-h-screen bg-background text-foreground selection:bg-orange-500/20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.05_65),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.18_0.04_65),transparent)]" />
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-orange-500/[0.04] via-orange-500/[0.02] to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]"
          style={{ backgroundImage: "var(--bg-grid)", backgroundSize: "40px 40px" }}
        />
      </div>

      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={handleTurnstileSuccess}
        onError={handleTurnstileError}
      />

      <main className="container max-w-7xl mx-auto px-4 py-16 sm:py-20 lg:py-24 relative z-10">
        {/* Twinkle starfield */}
        {!reduceMotion && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden z-[1]" aria-hidden="true">
            {[
              { left: "6%", top: "14%", delay: 0, size: 22, duration: 5, peak: 0.85, glow: true },
              { left: "92%", top: "8%", delay: 1.2, size: 18, duration: 6, peak: 0.75, glow: true },
              { left: "24%", top: "28%", delay: 2.8, size: 14, duration: 7, peak: 0.7, glow: false },
              { left: "78%", top: "32%", delay: 0.6, size: 20, duration: 5.5, peak: 0.8, glow: true },
              { left: "42%", top: "6%", delay: 3.5, size: 16, duration: 6.5, peak: 0.7, glow: false },
              { left: "60%", top: "48%", delay: 2.1, size: 18, duration: 5.8, peak: 0.75, glow: true },
              { left: "12%", top: "62%", delay: 4.2, size: 14, duration: 7.2, peak: 0.7, glow: false },
              { left: "88%", top: "58%", delay: 1.8, size: 16, duration: 6.2, peak: 0.75, glow: true },
              { left: "48%", top: "76%", delay: 3.0, size: 12, duration: 7.5, peak: 0.65, glow: false },
            ].map((s, i) => (
              <motion.svg
                key={i}
                className="absolute text-orange-500 dark:text-orange-300"
                style={{
                  left: s.left,
                  top: s.top,
                  width: s.size,
                  height: s.size,
                  filter: s.glow ? "drop-shadow(0 0 6px currentColor)" : "none",
                }}
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: [0, s.peak, s.peak * 0.4, 0], scale: [0.4, 1.1, 0.85, 0.4] }}
                transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
              >
                <path d="M12 2c.4 3.6 1.4 6.4 5 7-3.6.6-4.6 3.4-5 7-.4-3.6-1.4-6.4-5-7 3.6-.6 4.6-3.4 5-7z" />
              </motion.svg>
            ))}

            {/* Shooting star 1: from upper-right to lower-left */}
            <motion.div
              className="absolute"
              style={{ top: "10%", left: "65%" }}
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 0.85, 0.85, 0],
                x: [0, -200, -700],
                y: [0, 100, 350],
              }}
              transition={{
                duration: 1.4,
                delay: 5,
                repeatDelay: 13,
                repeat: Infinity,
                ease: "easeIn",
                times: [0, 0.1, 0.9, 1],
              }}
            >
              <svg width="100" height="50" viewBox="0 0 100 50" aria-hidden="true">
                <defs>
                  <linearGradient id="bedtime-meteor-tail-1" x1="0.95" y1="0.05" x2="0.25" y2="0.75">
                    <stop offset="0%" stopColor="rgb(var(--meteor-color))" stopOpacity="0" />
                    <stop offset="100%" stopColor="rgb(var(--meteor-color))" stopOpacity="0.95" />
                  </linearGradient>
                </defs>
                <line x1="95" y1="5" x2="25" y2="40" stroke="url(#bedtime-meteor-tail-1)" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="25" cy="40" r="2.5" fill="rgb(var(--meteor-color))" style={{ filter: "drop-shadow(0 0 4px var(--meteor-glow))" }} />
              </svg>
            </motion.div>

            {/* Shooting star 2: offset timing, smaller, from upper-right */}
            <motion.div
              className="absolute"
              style={{ top: "22%", left: "88%" }}
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 0.7, 0.7, 0],
                x: [0, -160, -550],
                y: [0, 80, 280],
              }}
              transition={{
                duration: 1.2,
                delay: 12,
                repeatDelay: 15,
                repeat: Infinity,
                ease: "easeIn",
                times: [0, 0.1, 0.9, 1],
              }}
            >
              <svg width="80" height="40" viewBox="0 0 100 50" aria-hidden="true">
                <defs>
                  <linearGradient id="bedtime-meteor-tail-2" x1="0.95" y1="0.05" x2="0.25" y2="0.75">
                    <stop offset="0%" stopColor="rgb(var(--meteor-color))" stopOpacity="0" />
                    <stop offset="100%" stopColor="rgb(var(--meteor-color))" stopOpacity="0.9" />
                  </linearGradient>
                </defs>
                <line x1="95" y1="5" x2="25" y2="40" stroke="url(#bedtime-meteor-tail-2)" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="25" cy="40" r="2" fill="rgb(var(--meteor-color))" style={{ filter: "drop-shadow(0 0 3px var(--meteor-glow))" }} />
              </svg>
            </motion.div>
          </div>
        )}

        <div className="mb-10 flex justify-start">
          <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
            <BedtimeStoryBreadcrumb
              homeText={t("ui.breadcrumb_home")}
              currentText={t("ui.breadcrumb_current")}
            />
          </div>
        </div>

        <div className="mx-auto max-w-2xl text-center mb-10 sm:mb-14 lg:mb-18">
          {/* Double-bezel icon container with breathing glow */}
          <div className="group flex justify-center mb-6">
            <div className="relative rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 dark:bg-white/[0.015]">
              <div className="flex size-12 items-center justify-center rounded-xl bg-orange-500/10 relative">
                {!reduceMotion && (
                  <div className="absolute inset-0 rounded-xl bg-orange-500/20 blur-md group-hover:animate-moon-glow" aria-hidden="true" />
                )}
                <Moon className="size-6 text-orange-600 dark:text-orange-400 relative" />
              </div>
            </div>
          </div>

          {/* Eyebrow badge (no status dot) */}
          <span className="inline-flex items-center rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-5">
            AI Storyteller
          </span>

          {/* Title with italic gradient on "Bedtime Story" */}
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.08] mt-4 pb-1">
            <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 dark:from-orange-400 dark:via-orange-300 dark:to-amber-300">
              Bedtime Story
            </span>
            {" "}Generator
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground/65 leading-relaxed font-light max-w-xl mx-auto mt-5">
            {t("ui.subtitle")}
          </p>

          {/* Theme pills */}
          {section?.ui?.theme_pills?.length ? (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              {section.ui.theme_pills.map((pill: string, i: number) => (
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
                      {t("ui.age_group")}
                    </Label>
                    <Select value={ageGroup} onValueChange={setAgeGroup}>
                      <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ageGroups.map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                      {t("ui.story_theme")}
                    </Label>
                    <Select value={storyTheme} onValueChange={setStoryTheme}>
                      <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {storyThemes.map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
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
                    <div className="space-y-2">
                      <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                        {t("ui.ending_mood")}
                      </Label>
                      <Select value={endingMood} onValueChange={setEndingMood}>
                        <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {endingMoods.map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                        {t("ui.moral_lesson")}
                      </Label>
                      <Select value={moralLesson} onValueChange={setMoralLesson}>
                        <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {moralLessons.map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                        {t("ui.child_name")}
                      </Label>
                      <Input
                        value={childName}
                        onChange={(event) => setChildName(event.target.value)}
                        placeholder={t("placeholders.child_name")}
                        className="h-9 bg-muted/50 border-border/50 rounded-lg"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              <div className="pt-6">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="group w-full h-12 text-base bg-orange-600 font-semibold text-white shadow-md shadow-orange-600/20 hover:bg-orange-700 active:scale-[0.97] disabled:opacity-60 dark:bg-orange-500 dark:shadow-orange-500/20 dark:hover:bg-orange-600 transition-all"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      {t("ui.generating")}
                    </>
                  ) : (
                    <>
                      <Moon className="w-5 h-5 mr-2 group-hover:animate-moon-glow" />
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
            className="relative h-[720px] max-h-[75vh] md:max-h-[60vh] lg:max-h-[75vh] min-h-[380px] sm:min-h-[520px] lg:sticky lg:top-24"
          >
            <div className="absolute inset-0 bg-orange-500/5 rounded-[2rem] blur-2xl -z-10" />

            <div
              className={cn(
                "h-full rounded-[2rem] border border-border backdrop-blur-xl overflow-hidden transition-all duration-500 flex flex-col card-hover-lift",
                generatedStory
                  ? "bg-card/80 shadow-2xl shadow-orange-500/10"
                  : "bg-card/40 shadow-xl border-dashed"
              )}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                    <BookOpen className="w-5 h-5" />
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
                      <span className="hidden sm:inline">{t("output.copy")}</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        try {
                          window.localStorage.setItem("ai-write:generator-prefill", JSON.stringify({ title: prompt.substring(0, 30), content: generatedStory }));
                        } catch {}
                        router.push(buildContinueRoute({ source: "bedtime-story-generator" }) as any);
                      }}
                      className="h-8 text-xs gap-1.5 rounded-full bg-orange-600 px-3 text-white hover:bg-orange-500"
                    >
                      <PenLine className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t("output.continue_button")}</span>
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
                          {!reduceMotion && (
                            <motion.div
                              className="absolute inset-0 rounded-full bg-orange-500/15 blur-md"
                              animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.1, 0.9] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            />
                          )}
                          <Moon className="absolute inset-0 m-auto w-7 h-7 text-orange-500" />
                        </div>
                        <p className="text-sm font-medium">{t("output.generating_message")}</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-w-xs mx-auto">
                        <div className="relative w-20 h-20 mx-auto">
                          {!reduceMotion && (
                            <>
                              <motion.svg
                                className="absolute text-orange-400/40"
                                style={{ left: "8%", top: "5%", width: 14, height: 14 }}
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                                animate={{ opacity: [0.2, 0.7, 0.2], scale: [0.7, 1, 0.7] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                              >
                                <path d="M12 2c.4 3.6 1.4 6.4 5 7-3.6.6-4.6 3.4-5 7-.4-3.6-1.4-6.4-5-7 3.6-.6 4.6-3.4 5-7z" />
                              </motion.svg>
                              <motion.svg
                                className="absolute text-orange-400/40"
                                style={{ right: "10%", top: "20%", width: 10, height: 10 }}
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                                animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.7, 1, 0.7] }}
                                transition={{ duration: 5, delay: 1.2, repeat: Infinity, ease: "easeInOut" }}
                              >
                                <path d="M12 2c.4 3.6 1.4 6.4 5 7-3.6.6-4.6 3.4-5 7-.4-3.6-1.4-6.4-5-7 3.6-.6 4.6-3.4 5-7z" />
                              </motion.svg>
                            </>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 bg-orange-500/5 rounded-2xl flex items-center justify-center rotate-3">
                              <Moon className="w-7 h-7 text-orange-400/70" />
                            </div>
                          </div>
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
