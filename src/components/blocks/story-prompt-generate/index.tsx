"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { useLocale } from "next-intl";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { 
  ChevronDown, 
  Settings2, 
  Sparkles, 
  Copy, 
  RefreshCw, 
  Lightbulb,
  Wand2,
  ArrowRight,
  Check,
  Zap
} from "lucide-react";
import TurnstileInvisible, { TurnstileInvisibleHandle } from "@/components/TurnstileInvisible";
import { GeneratorShortcutHints } from "@/components/generator-shortcut-hints";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { StoryPromptGenerate as StoryPromptGenerateType } from "@/types/blocks/story-prompt-generate";
import Link from "next/link";
import StoryPromptBreadcrumb from "./breadcrumb";

interface StoryPromptGenerateProps {
  section?: StoryPromptGenerateType;
}

type PromptItem = {
  title?: string;
  prompt?: string;
  hook?: string;
  [key: string]: any;
};

type PromptDisplay = {
  title?: string;
  prompt: string;
  hook?: string;
};

// Genre options with icons
const GENRE_OPTIONS = [
  { id: "fantasy", icon: "🏰" },
  { id: "scifi", icon: "🚀" },
  { id: "romance", icon: "💕" },
  { id: "thriller", icon: "🔪" },
  { id: "mystery", icon: "🔍" },
  { id: "horror", icon: "👻" },
  { id: "adventure", icon: "🗺️" },
  { id: "historical", icon: "📜" },
  { id: "urban", icon: "🏙️" },
  { id: "comedy", icon: "😂" },
  { id: "drama", icon: "🎭" },
  { id: "xianxia", icon: "⛩️" },
];

// Length options
const LENGTH_OPTIONS = ["short", "medium", "long"] as const;

// Tone options
const TONE_OPTIONS = [
  { id: "light", icon: "☀️" },
  { id: "healing", icon: "🌸" },
  { id: "dark", icon: "🌑" },
  { id: "passionate", icon: "🔥" },
  { id: "realistic", icon: "📷" },
  { id: "suspenseful", icon: "😰" },
  { id: "romantic", icon: "💖" },
  { id: "epic", icon: "⚔️" },
];

// Worldview options
const WORLDVIEW_OPTIONS = [
  "realistic",
  "near_future",
  "high_fantasy",
  "cultivation",
  "cyberpunk",
  "post_apocalyptic",
  "steampunk",
  "mythology",
];

// Conflict options
const CONFLICT_OPTIONS = [
  "person_vs_person",
  "person_vs_society",
  "person_vs_nature",
  "person_vs_self",
  "person_vs_fate",
  "multi_conflict",
];

// Audience options
const AUDIENCE_OPTIONS = [
  "children",
  "teen",
  "young_adult",
  "adult",
  "mature",
  "all_ages",
];

// Language options
const LANGUAGE_OPTIONS = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
];

export default function StoryPromptGenerate({ section }: StoryPromptGenerateProps) {
  const locale = useLocale();

  // Helper function to get nested translations
  const t = (path: string) => {
    const keys = path.split(".");
    let value = section as any;
    for (const key of keys) {
      value = value?.[key];
    }
    return value || path;
  };

  // State
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["fantasy"]);
  const [selectedLength, setSelectedLength] = useState<string>("medium");
  const [selectedTone, setSelectedTone] = useState<string>("light");
  const [selectedLanguage, setSelectedLanguage] = useState(locale);
  const [selectedModel, setSelectedModel] = useState<string>("fast");
  
  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [worldview, setWorldview] = useState<string>("");
  const [protagonist, setProtagonist] = useState("");
  const [goal, setGoal] = useState("");
  const [conflict, setConflict] = useState<string>("");
  const [constraints, setConstraints] = useState("");
  const [audience, setAudience] = useState<string>("");

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [promptList, setPromptList] = useState<PromptItem[]>([]);

  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const outputScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!generatedContent || !isGenerating) return;
    const container = outputScrollRef.current;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
  }, [generatedContent, isGenerating]);

  useEffect(() => {
    if (!generatedContent) return;
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 1024) return;
    if (!resultRef.current) return;

    resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [generatedContent]);

  // Toggle genre selection
  const toggleGenre = useCallback((genreId: string) => {
    setSelectedGenres(prev => {
      if (prev.includes(genreId)) {
        // Don't allow deselecting if it's the last one
        if (prev.length === 1) return prev;
        return prev.filter(g => g !== genreId);
      }
      // Max 3 genres
      if (prev.length >= 3) {
        return [...prev.slice(1), genreId];
      }
      return [...prev, genreId];
    });
  }, []);

  // Handle generate click
  const handleGenerateClick = useCallback(() => {
    if (selectedGenres.length === 0) {
      toast.error(t("toasts.no_genre"));
      return;
    }
    setIsGenerating(true);
    turnstileRef.current?.execute();
  }, [selectedGenres, section]);

  // Handle verification success
  const handleVerificationSuccess = useCallback(async (turnstileToken: string) => {
    const tryParsePromptArray = (raw: string): PromptItem[] => {
      const trimmed = raw.trim();
      if (!trimmed) return [];
      // 抽取首尾中括号之间的 JSON 片段，容错模型额外输出
      const jsonMatch = trimmed.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? jsonMatch[0] : trimmed;
      try {
        const parsed = JSON.parse(jsonText);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    setIsGenerating(true);
    setGeneratedContent("");
    setPromptList([]);

    try {
      const requestBody = {
        genres: selectedGenres,
        length: selectedLength,
        tone: selectedTone,
        locale: selectedLanguage,
        model: selectedModel,
        worldview: worldview || undefined,
        protagonist: protagonist || undefined,
        goal: goal || undefined,
        conflict: conflict || undefined,
        constraints: constraints || undefined,
        audience: audience || undefined,
        count: 5,
        turnstileToken,
      };

      const response = await fetch("/api/story-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
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
          if (line.trim().startsWith('0:"')) {
            try {
              const content = line
                .slice(3, -1)
                .replace(/\\n/g, "\n")
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, "\\");

              accumulatedContent += content;
              setGeneratedContent(accumulatedContent);
            } catch (e) {
              console.error("Parse error:", e);
            }
          }
        }
      }

      if (accumulatedContent.trim()) {
        // Try parsing JSON array result（容错提取）
        const parsedList = tryParsePromptArray(accumulatedContent);
        setPromptList(parsedList);

        confetti({
          particleCount: 60,
          spread: 50,
          origin: { y: 0.6 },
          colors: ["#6366f1", "#8b5cf6", "#a855f7"],
        });
        toast.success(t("toasts.prompt_generated"));
        
        // Scroll to results on mobile
        if (window.innerWidth < 1024 && resultRef.current) {
          setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 300);
        }
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(t("toasts.generation_failed"));
    } finally {
      setIsGenerating(false);
    }
  }, [selectedGenres, selectedLength, selectedTone, selectedLanguage, selectedModel, worldview, protagonist, goal, conflict, constraints, audience]);

  const handleTurnstileSuccess = useCallback((token: string) => {
    handleVerificationSuccess(token);
  }, [handleVerificationSuccess]);

  const handleTurnstileError = useCallback(() => {
    setIsGenerating(false);
    toast.error(t("toasts.generation_failed"));
  }, [section]);

  // Copy single prompt
  const handleCopyPrompt = useCallback((text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success(t("toasts.copied"));
    setTimeout(() => setCopiedIndex(null), 2000);
  }, [section]);

  // Copy all content
  const handleCopyAll = useCallback(() => {
    const text =
      promptList.length > 0
        ? promptList
            .map((item) => item.prompt || item.title || "")
            .filter(Boolean)
            .join("\n\n")
        : generatedContent;
    navigator.clipboard.writeText(text);
    toast.success(t("toasts.copied"));
  }, [generatedContent, promptList]);

  // Clear results
  const handleClear = useCallback(() => {
    setGeneratedContent("");
    setPromptList([]);
  }, []);

  // Refresh (regenerate)
  const handleRefresh = useCallback(() => {
    handleGenerateClick();
  }, [handleGenerateClick]);

  const handleUsePromptClick = useCallback((promptText: string) => {
    if (!promptText.trim()) return;
    if (typeof window === "undefined") return;

    try {
      const payload = {
        prompt: promptText.trim(),
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem("story-generator:prefill-prompt", JSON.stringify(payload));
    } catch {
    }
  }, []);

  const promptItems: PromptDisplay[] = useMemo(() => {
    // 优先使用已解析好的 JSON 数组
    if (promptList.length > 0) {
      return promptList
        .map((item) => ({
          title: item.title,
          prompt: (item.prompt || "").trim(),
          hook: item.hook,
        }))
        .filter((p) => p.prompt);
    }

    // 没有结构化结果时，按段落拆分文本作为兜底
    if (!generatedContent.trim()) return [];

    return generatedContent
      .split(/\n{2,}/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((text) => ({ prompt: text }));
  }, [generatedContent, promptList]);

  return (
    <div id="story_prompt_generator" className="min-h-screen bg-background text-foreground selection:bg-indigo-500/20">
      {/* Ambient Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-indigo-500/5 via-purple-500/5 to-transparent" />
        <div className="absolute -top-[30%] right-[5%] w-[900px] h-[900px] bg-indigo-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob" />
        <div className="absolute top-[10%] left-[5%] w-[700px] h-[700px] bg-purple-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
        <div className="absolute bottom-[10%] right-[20%] w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000" />
      </div>

      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={handleTurnstileSuccess}
        onError={handleTurnstileError}
      />

      <main className="container max-w-7xl mx-auto px-4 py-12 sm:py-16 lg:py-20">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex justify-start">
          <div className="inline-flex items-center rounded-full border border-border/60 bg-white/80 dark:bg-slate-900/80 px-4 py-1.5 text-xs text-muted-foreground shadow-sm">
            <StoryPromptBreadcrumb
              homeText={t("ui.breadcrumb_home")}
              currentText={t("ui.breadcrumb_current")}
            />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-500/10 mb-4">
              <Lightbulb className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
              {t("header.title")}
            </h1>
            <p className="text-lg text-muted-foreground/80 leading-relaxed">
              {t("header.subtitle")}
            </p>
          </motion.div>
        </div>

        <div className="space-y-10">
          {/* Generator Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6 max-w-3xl mx-auto"
          >
            <div className="bg-white dark:bg-slate-950 border border-border rounded-2xl p-5 md:p-6 shadow-sm">
              
              {/* Genre Selection */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <span className="inline-flex h-6 px-2 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200 border border-indigo-100/80 dark:border-indigo-500/40">
                    GENRE
                  </span>
                  <span>{t("ui.genre_label")}</span>
                  <span className="text-xs text-muted-foreground font-normal ml-auto">
                    {selectedGenres.length}/3
                  </span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {GENRE_OPTIONS.map((genre) => (
                    <motion.button
                      key={genre.id}
                      onClick={() => toggleGenre(genre.id)}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 300, damping: 22, mass: 0.4 }}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs md:text-sm font-medium border transition-colors flex items-center",
                        selectedGenres.includes(genre.id)
                          ? "bg-gradient-to-r from-indigo-100 to-slate-50 dark:from-slate-900 dark:to-slate-950 border-indigo-400/90 dark:border-indigo-500 text-indigo-900 dark:text-indigo-50 shadow-sm"
                          : "bg-transparent border-border/60 text-muted-foreground hover:border-indigo-400/60 hover:text-foreground hover:bg-indigo-50/40 dark:hover:bg-slate-900/60"
                      )}
                    >
                      {t(`genres.${genre.id}`)}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border/50 my-6" />

              {/* Length & Tone */}
              <div className="space-y-5">
                {/* Length */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("ui.length_label")}
                  </Label>
                  <div className="flex bg-muted/40 p-1 rounded-xl border border-border/60">
                    {LENGTH_OPTIONS.map((len) => (
                      <motion.button
                        key={len}
                        onClick={() => setSelectedLength(len)}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20, mass: 0.4 }}
                        className={cn(
                          "flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex flex-col items-center gap-0.5",
                          selectedLength === len
                            ? "bg-background text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span>{t(`lengths.${len}`)}</span>
                        <span className="text-[10px] opacity-60">{t(`lengths.${len}_desc`)}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Tone */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("ui.tone_label")}
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {TONE_OPTIONS.map((tone) => (
                      <motion.button
                        key={tone.id}
                        onClick={() => setSelectedTone(tone.id)}
                        whileHover={{ y: -0.5 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20, mass: 0.4 }}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                          selectedTone === tone.id
                            ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                            : "bg-transparent border-border/50 text-muted-foreground hover:border-indigo-500/20 hover:text-foreground"
                        )}
                      >
                        {t(`tones.${tone.id}`)}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Language & Model */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t("ui.language_label")}
                    </Label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="h-9 bg-white/70 dark:bg-black/30 border-border/60 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <span className="mr-2">{lang.flag}</span>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      AI Model
                    </Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="h-9 bg-white/70 dark:bg-black/30 border-border/60 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fast">
                          <span className="flex items-center gap-2">
                            <Zap className="w-3 h-3 text-emerald-500" />
                            {t("ai_models.fast")}
                          </span>
                        </SelectItem>
                        <SelectItem value="standard">
                          <span className="flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-blue-500" />
                            {t("ai_models.standard")}
                          </span>
                        </SelectItem>
                        <SelectItem value="creative">
                          <span className="flex items-center gap-2">
                            <Wand2 className="w-3 h-3 text-purple-500" />
                            {t("ai_models.creative")}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Advanced Options */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full flex justify-between items-center px-0 pt-1 h-auto hover:bg-transparent text-xs font-medium text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Settings2 className="w-3.5 h-3.5" />
                        {t("ui.advanced_options")}
                      </span>
                      <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showAdvanced && "rotate-180")} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 space-y-4 data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up overflow-hidden">
                    {/* Worldview */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("ui.worldview_label")}</Label>
                      <Select value={worldview} onValueChange={setWorldview}>
                        <SelectTrigger className="h-8 text-xs bg-white/50 dark:bg-black/20 border-border/50">
                          <SelectValue placeholder={t("ui.genre_placeholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {WORLDVIEW_OPTIONS.map((w) => (
                            <SelectItem key={w} value={w} className="text-xs">
                              {t(`worldviews.${w}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Protagonist */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("ui.protagonist_label")}</Label>
                      <Input
                        value={protagonist}
                        onChange={(e) => setProtagonist(e.target.value)}
                        placeholder={t("ui.protagonist_placeholder")}
                        className="h-8 text-xs bg-white/50 dark:bg-black/20 border-border/50"
                      />
                    </div>

                    {/* Goal */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("ui.goal_label")}</Label>
                      <Input
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder={t("ui.goal_placeholder")}
                        className="h-8 text-xs bg-white/50 dark:bg-black/20 border-border/50"
                      />
                    </div>

                    {/* Conflict */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("ui.conflict_label")}</Label>
                      <Select value={conflict} onValueChange={setConflict}>
                        <SelectTrigger className="h-8 text-xs bg-white/50 dark:bg-black/20 border-border/50">
                          <SelectValue placeholder={t("ui.conflict_placeholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {CONFLICT_OPTIONS.map((c) => (
                            <SelectItem key={c} value={c} className="text-xs">
                              {t(`conflicts.${c}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Constraints */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("ui.constraints_label")}</Label>
                      <Input
                        value={constraints}
                        onChange={(e) => setConstraints(e.target.value)}
                        placeholder={t("ui.constraints_placeholder")}
                        className="h-8 text-xs bg-white/50 dark:bg-black/20 border-border/50"
                      />
                    </div>

                    {/* Audience */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("ui.audience_label")}</Label>
                      <Select value={audience} onValueChange={setAudience}>
                        <SelectTrigger className="h-8 text-xs bg-white/50 dark:bg-black/20 border-border/50">
                          <SelectValue placeholder={t("ui.audience_placeholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {AUDIENCE_OPTIONS.map((a) => (
                            <SelectItem key={a} value={a} className="text-xs">
                              {t(`audiences.${a}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Generate Button */}
              <div className="pt-4">
                <Button
                  onClick={handleGenerateClick}
                  disabled={isGenerating}
                  className="w-full h-11 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      {t("ui.generating")}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 fill-white/20" />
                      {t("ui.generate_button")}
                    </>
                  )}
                </Button>
                <GeneratorShortcutHints />
              </div>
            </div>
          </motion.div>

          {/* Output List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            ref={resultRef}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-purple-500/5 rounded-[2rem] blur-2xl -z-10" />

            <div className={cn(
              "rounded-[2rem] border border-border/60 backdrop-blur-xl overflow-hidden transition-all duration-500",
              generatedContent
                ? "bg-white/80 dark:bg-slate-950/80 shadow-2xl shadow-indigo-500/10"
                : "bg-white/40 dark:bg-slate-900/40 shadow-xl border-dashed"
            )}>
              {/* Toolbar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-white/20 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {t("ui.output_title")}
                    {promptItems.length > 0 && <span className="ml-2 text-xs text-muted-foreground">({promptItems.length})</span>}
                  </span>
                </div>
                {generatedContent && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isGenerating}
                      className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
                      {t("ui.refresh_button")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyAll}
                      className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {t("ui.copy_button")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClear}
                      className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      {t("ui.clear_button")}
                    </Button>
                  </div>
                )}
              </div>

              {/* Content Area */}
              <div ref={outputScrollRef} className="p-6 sm:p-8 max-h-[720px] overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                  {promptItems.length > 0 ? (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      {promptItems.map((item, index) => (
                        <div
                          key={index}
                          className="rounded-2xl border border-border/60 bg-white/70 dark:bg-slate-900/70 p-5 shadow-sm hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/10 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                {index + 1}
                              </span>
                              <span className="text-sm font-semibold text-foreground">
                                {item.title || t("ui.output_title")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant={copiedIndex === index ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleCopyPrompt(item.prompt || "", index)}
                                className={cn(
                                  "h-8 text-xs gap-1.5",
                                  copiedIndex === index
                                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                                    : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                <Copy className="w-3.5 h-3.5" />
                                {copiedIndex === index ? t("toasts.copied") : t("ui.copy_button")}
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 text-xs gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                                asChild
                              >
                                <Link
                                  href="/"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleUsePromptClick(item.prompt || "");
                                    // Navigate after storing
                                    window.location.href = "/";
                                  }}
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                  {t("ui.use_prompt_button")}
                                </Link>
                              </Button>
                            </div>
                          </div>
                          <article className="prose prose-slate dark:prose-invert prose-sm sm:prose-base max-w-none leading-relaxed">
                            {item.prompt ? <ReactMarkdown>{item.prompt}</ReactMarkdown> : null}
                            {item.hook ? (
                              <p className="text-sm text-muted-foreground mt-3">
                                <strong className="text-foreground mr-1">Hook:</strong>
                                {item.hook}
                              </p>
                            ) : null}
                          </article>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center py-20"
                    >
                      {isGenerating ? (
                        <div className="space-y-6">
                          <div className="relative mx-auto w-16 h-16">
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
                            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
                            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-indigo-500 animate-pulse" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground animate-pulse">
                            {t("ui.generating")}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-w-sm mx-auto opacity-60">
                          <div className="w-20 h-20 mx-auto bg-indigo-500/5 rounded-3xl flex items-center justify-center rotate-3">
                            <Lightbulb className="w-10 h-10 text-indigo-400/50" />
                          </div>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {t("ui.output_empty")}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
