"use client";

import { useState, useCallback, useMemo, useRef, useEffect, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Settings2,
  Sparkles,
  Copy,
  RefreshCw,
  Wand2,
  BookOpen,
  UserPlus,
  Trash2,
  Eraser,
  Zap,
  Palette,
} from "lucide-react";
import TurnstileInvisible, {
  TurnstileInvisibleHandle,
} from "@/components/TurnstileInvisible";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import type { ComicGenerate as ComicGenerateType } from "@/types/blocks/comic-generate";
import type { ComicCharacter } from "@/types/comic";
import ComicBreadcrumb from "./breadcrumb";

// ========== CONSTANTS ==========

const COMIC_DRAFT_KEY = "comic-generator:prompt-draft";
const COMIC_HISTORY_KEY = "comic-generator:prompt-history";
const MAX_HISTORY = 10;
const MAX_CHARACTERS = 6;

// ========== HELPERS ==========

function calculateWordCount(text: string): number {
  if (!text?.trim()) return 0;
  const cjkRegex =
    /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g;
  const cjkCount = (text.match(cjkRegex) || []).length;
  const withoutCJK = text.replace(cjkRegex, " ").trim();
  const englishCount = withoutCJK ? withoutCJK.split(/\s+/).filter(Boolean).length : 0;
  return cjkCount + englishCount;
}

function RequiredLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      <span className="text-red-500 ml-1">*</span>
    </Label>
  );
}

// ========== TYPES ==========

interface ComicGenerateProps {
  section?: ComicGenerateType;
}

// ========== COMPONENT ==========

export default function ComicGenerate({ section }: ComicGenerateProps) {
  const locale = useLocale();

  const t = useCallback(
    (path: string) => {
      const keys = path.split(".");
      let value = section as any;
      for (const key of keys) {
        value = value?.[key];
      }
      return value || path;
    },
    [section]
  );

  // ========== STATIC OPTIONS ==========

  const AI_MODELS = useMemo(
    () => [
      {
        id: "fast",
        name: t("ai_models.fast"),
        badge: "FAST",
        badgeColor:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        icon: <Zap className="h-4 w-4" />,
        description: t("ai_models.fast_description"),
      },
      {
        id: "standard",
        name: t("ai_models.standard"),
        badge: "RECOMMENDED",
        badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        icon: <Sparkles className="h-4 w-4" />,
        description: t("ai_models.standard_description"),
      },
      {
        id: "creative",
        name: t("ai_models.creative"),
        badge: "PRO",
        badgeColor:
          "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        icon: <Palette className="h-4 w-4" />,
        description: t("ai_models.creative_description"),
      },
    ],
    [section]
  );

  const LANGUAGE_OPTIONS = useMemo(
    () => [
      { code: "en", name: "English", flag: "🇺🇸" },
      { code: "zh", name: "中文", flag: "🇨🇳" },
      { code: "ja", name: "日本語", flag: "🇯🇵" },
      { code: "ko", name: "한국어", flag: "🇰🇷" },
      { code: "es", name: "Español", flag: "🇪🇸" },
      { code: "fr", name: "Français", flag: "🇫🇷" },
      { code: "de", name: "Deutsch", flag: "🇩🇪" },
      { code: "pt", name: "Português", flag: "🇵🇹" },
      { code: "ru", name: "Русский", flag: "🇷🇺" },
    ],
    []
  );

  const SAMPLE_PROMPTS = useMemo(
    () =>
      section?.random_prompts?.length
        ? section.random_prompts
        : [
            "Two rivals meet unexpectedly on a rooftop during a storm.",
            "A rookie hero confronts a retired villain on a train platform.",
            "A comedic gag strip about an overconfident wizard whose spell goes wrong.",
            "Two siblings argue over a family heirloom while a storm hits outside.",
            "A confession scene where a secret is revealed as elevator doors open.",
          ],
    [section]
  );

  // ========== STATE ==========

  const [prompt, setPrompt] = useState("");
  const [comicStyle, setComicStyle] = useState("manga");
  const [panelCount, setPanelCount] = useState("6");
  const [tone, setTone] = useState("dramatic");
  const [selectedLanguage, setSelectedLanguage] = useState(locale);
  const [selectedModel, setSelectedModel] = useState("standard");
  const [narrationMode, setNarrationMode] = useState("light");
  const [readingFormat, setReadingFormat] = useState("ltr");
  const [setting, setSetting] = useState("");
  const [sceneGoal, setSceneGoal] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [characters, setCharacters] = useState<ComicCharacter[]>([
    { name: "", personality: "", role: "" },
    { name: "", personality: "", role: "" },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  // Store latest options for use in turnstile callback
  const generateOptionsRef = useRef({
    prompt: "",
    model: "standard",
    locale: locale,
    characters: [] as ComicCharacter[],
    comicStyle: "manga",
    panelCount: "6",
    tone: "dramatic",
    setting: "",
    narrationMode: "light",
    sceneGoal: "",
    readingFormat: "ltr",
  });

  useEffect(() => {
    generateOptionsRef.current = {
      prompt,
      model: selectedModel,
      locale: selectedLanguage,
      characters,
      comicStyle,
      panelCount,
      tone,
      setting,
      narrationMode,
      sceneGoal,
      readingFormat,
    };
  }, [prompt, selectedModel, selectedLanguage, characters, comicStyle, panelCount, tone, setting, narrationMode, sceneGoal, readingFormat]);

  // ========== DRAFT SAVE ==========

  useDraftAutoSave({
    key: `${COMIC_DRAFT_KEY}:${locale}`,
    value: prompt,
    onRestore: (draft) => setPrompt(draft),
  });

  // ========== HISTORY ==========

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COMIC_HISTORY_KEY);
      if (raw) setPromptHistory(JSON.parse(raw) || []);
    } catch {
      // ignore
    }
  }, []);

  const saveToHistory = useCallback((p: string) => {
    if (!p.trim()) return;
    setPromptHistory((prev) => {
      const next = [p, ...prev.filter((h) => h !== p)].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(COMIC_HISTORY_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // ========== CHARACTER MANAGEMENT ==========

  const addCharacter = useCallback(() => {
    if (characters.length >= MAX_CHARACTERS) return;
    setCharacters((prev) => [...prev, { name: "", personality: "", role: "" }]);
  }, [characters.length]);

  const removeCharacter = useCallback((index: number) => {
    setCharacters((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateCharacter = useCallback(
    (index: number, field: keyof ComicCharacter, value: string) => {
      setCharacters((prev) =>
        prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
      );
    },
    []
  );

  // ========== RANDOM PROMPT ==========

  const handleRandomPrompt = useCallback(() => {
    const randomIdx = Math.floor(Math.random() * SAMPLE_PROMPTS.length);
    setPrompt(SAMPLE_PROMPTS[randomIdx]);
    toast.success(t("success.random_prompt_selected"));
    setTimeout(() => promptRef.current?.focus(), 50);
  }, [SAMPLE_PROMPTS, t]);

  // ========== GENERATE ==========

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) {
      toast.error(t("validation.enter_prompt"));
      promptRef.current?.focus();
      return;
    }
    if (!selectedModel) {
      toast.error(t("validation.select_model"));
      return;
    }

    setIsGenerating(true);
    setGeneratedScript("");
    saveToHistory(prompt.trim());
    turnstileRef.current?.execute();
  }, [prompt, selectedModel, saveToHistory, t]);

  const handleTurnstileSuccess = useCallback(async (turnstileToken: string) => {
    const opts = generateOptionsRef.current;
    const validChars = opts.characters.filter((c) => c.name?.trim());

    try {
      const response = await fetch("/api/comic-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: opts.prompt.trim(),
          model: opts.model,
          locale: opts.locale,
          characters: validChars,
          comicStyle: opts.comicStyle,
          panelCount: opts.panelCount,
          tone: opts.tone,
          setting: opts.setting.trim() || undefined,
          narrationMode: opts.narrationMode,
          sceneGoal: opts.sceneGoal.trim() || undefined,
          readingFormat: opts.readingFormat,
          turnstileToken,
        }),
      });

      if (!response.ok) {
        throw new Error("Generation failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith('0:"')) {
              try {
                const jsonStr = line.slice(2);
                const content = JSON.parse(jsonStr);
                accumulated += content;
                setGeneratedScript(accumulated);
              } catch {
                // Skip malformed
              }
            }
          }
        }
      }

      toast.success(t("success.script_generated"));

      if (window.innerWidth < 1024) {
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    } catch (error) {
      console.error("Comic generation error:", error);
      toast.error(t("errors.generation_failed"));
    } finally {
      setIsGenerating(false);
    }
  }, [t]);

  const handleTurnstileError = useCallback(() => {
    setIsGenerating(false);
    toast.error(t("errors.generation_failed"));
  }, [t]);

  // ========== COPY ==========

  const handleCopy = useCallback(() => {
    if (!generatedScript) return;
    navigator.clipboard.writeText(generatedScript).then(() => {
      toast.success(t("success.script_copied"));
    });
  }, [generatedScript, t]);

  // ========== RENDER ==========

  const wordCount = useMemo(
    () => calculateWordCount(generatedScript),
    [generatedScript]
  );

  const comicStyles = useMemo(
    () => Object.entries(section?.comic_styles || {}),
    [section]
  );
  const panelCounts = useMemo(
    () => Object.entries(section?.panel_counts || {}),
    [section]
  );
  const tones = useMemo(() => Object.entries(section?.tones || {}), [section]);
  const narrationModes = useMemo(
    () => Object.entries(section?.narration_modes || {}),
    [section]
  );
  const readingFormats = useMemo(
    () => Object.entries(section?.reading_formats || {}),
    [section]
  );

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Subtle warm top glow + dot texture */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.05_65),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.18_0.04_65),transparent)]" />
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-orange-500/[0.04] via-orange-500/[0.02] to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]"
          style={{ backgroundImage: 'var(--bg-grid)', backgroundSize: '40px 40px' }}
        />
      </div>

      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={handleTurnstileSuccess}
        onError={handleTurnstileError}
      />

      <div className="relative mx-auto w-full max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="mb-10"
        >
          <ComicBreadcrumb
            homeText={t("ui.breadcrumb_home")}
            currentText={t("ui.breadcrumb_current")}
          />

          <div className="mt-8 mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
              {t("ui.title")}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {t("ui.subtitle")}
            </p>
            {section?.ui && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/10 text-[10px] font-bold tabular-nums text-orange-600 dark:text-orange-400">1</span>
                  {t("ui.hero_step_1")}
                </span>
                <span className="text-border/60">→</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/10 text-[10px] font-bold tabular-nums text-orange-600 dark:text-orange-400">2</span>
                  {t("ui.hero_step_2")}
                </span>
                <span className="text-border/60">→</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/10 text-[10px] font-bold tabular-nums text-orange-600 dark:text-orange-400">3</span>
                  {t("ui.hero_step_3")}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Hero → Tool transition */}
        <div className="mb-8 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Main layout: sidebar + content */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[400px_1fr] xl:grid-cols-[440px_1fr]">
          {/* ===== LEFT: Control panel ===== */}
          <motion.div
            ref={leftPanelRef}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:sticky lg:top-20 lg:self-start"
          >
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm dark:bg-card">
              {/* Story Prompt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <RequiredLabel htmlFor="comic-prompt">
                    {t("ui.story_prompt_label")}
                  </RequiredLabel>
                  <div className="flex items-center gap-1">
                    {/* History */}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => setShowHistory((v) => !v)}
                      >
                        <BookOpen className="h-3 w-3" />
                        {t("ui.prompt_history")}
                      </Button>
                      {showHistory && promptHistory.length > 0 && (
                        <div className="absolute right-0 top-8 z-50 w-72 rounded-xl border border-border bg-background shadow-xl">
                          <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground">
                            <span>{t("ui.prompt_history_recent")}</span>
                            <button
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setPromptHistory([]);
                                localStorage.removeItem(COMIC_HISTORY_KEY);
                                setShowHistory(false);
                              }}
                            >
                              {t("ui.prompt_history_clear")}
                            </button>
                          </div>
                          {promptHistory.map((h, i) => (
                            <button
                              key={i}
                              className="block w-full truncate px-3 py-2 text-left text-sm hover:bg-muted"
                              onClick={() => {
                                setPrompt(h);
                                setShowHistory(false);
                              }}
                            >
                              {h}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Clear */}
                    {prompt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => setPrompt("")}
                      >
                        <Eraser className="h-3 w-3" />
                        {t("ui.clear_prompt")}
                      </Button>
                    )}
                  </div>
                </div>

                <Textarea
                  id="comic-prompt"
                  ref={promptRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t("ui.story_prompt_placeholder")}
                  className="min-h-[140px] resize-none text-sm focus-visible:ring-orange-500/30"
                />

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs"
                  onClick={handleRandomPrompt}
                >
                  <RefreshCw className="h-3 w-3" />
                  {t("ui.random_button")}
                </Button>
              </div>

              <div className="mt-6 space-y-4 border-t border-border pt-5">
                {/* Comic Style */}
                <div className="space-y-1.5">
                  <Label>{t("ui.comic_style_label")}</Label>
                  <Select value={comicStyle} onValueChange={setComicStyle}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {comicStyles.map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label as string}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Panel Count + Tone */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>{t("ui.panel_count_label")}</Label>
                    <Select value={panelCount} onValueChange={setPanelCount}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {panelCounts.map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label as string}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("ui.tone_label")}</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tones.map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label as string}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Output Language */}
                <div className="space-y-1.5">
                  <Label>{t("ui.language_label")}</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Characters */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t("ui.characters_label")}</Label>
                    {characters.length < MAX_CHARACTERS && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={addCharacter}
                      >
                        <UserPlus className="h-3 w-3" />
                        {t("ui.add_character")}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {characters.map((char, idx) => (
                      <div key={idx}>
                        {idx > 0 && <div className="mb-2.5 h-px bg-border" />}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">
                              {`#${idx + 1}`}
                            </span>
                            {characters.length > 2 && (
                              <button
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => removeCharacter(idx)}
                                aria-label={t("ui.remove_character")}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <Input
                            placeholder={t("ui.character_name")}
                            value={char.name}
                            onChange={(e) => updateCharacter(idx, "name", e.target.value)}
                            className="h-8 text-sm"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder={t("ui.character_personality")}
                              value={char.personality || ""}
                              onChange={(e) =>
                                updateCharacter(idx, "personality", e.target.value)
                              }
                              className="h-8 text-sm"
                            />
                            <Input
                              placeholder={t("ui.character_role")}
                              value={char.role || ""}
                              onChange={(e) =>
                                updateCharacter(idx, "role", e.target.value)
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advanced Options */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between gap-2 text-xs font-medium text-muted-foreground"
                    >
                      <span className="flex items-center gap-1.5">
                        <Settings2 className="h-3.5 w-3.5" />
                        {t("ui.advanced_options")}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform",
                          showAdvanced && "rotate-180"
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-2">
                    {/* Setting */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("ui.setting_label")}</Label>
                      <Input
                        placeholder={t("ui.setting_placeholder")}
                        value={setting}
                        onChange={(e) => setSetting(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    {/* Scene Goal */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("ui.scene_goal_label")}</Label>
                      <Input
                        placeholder={t("ui.scene_goal_placeholder")}
                        value={sceneGoal}
                        onChange={(e) => setSceneGoal(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    {/* Narration Mode */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("ui.narration_mode_label")}</Label>
                      <Select value={narrationMode} onValueChange={setNarrationMode}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {narrationModes.map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label as string}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Reading Format */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("ui.reading_format_label")}</Label>
                      <Select value={readingFormat} onValueChange={setReadingFormat}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {readingFormats.map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label as string}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* AI Model */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t("ui.ai_model")}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {AI_MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedModel(m.id)}
                        className={cn(
                          "flex flex-col items-center rounded-xl border p-2.5 text-center text-xs transition-all",
                          selectedModel === m.id
                            ? "border-orange-500/50 bg-orange-500/10 text-orange-600 dark:border-orange-400/50 dark:text-orange-400"
                            : "border-border hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-950/20"
                        )}
                      >
                        {m.icon}
                        <span className="mt-1 font-medium">{m.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="mt-5 w-full gap-2 bg-orange-600 font-semibold text-white shadow-md shadow-orange-600/20 hover:bg-orange-700 disabled:opacity-60 dark:bg-orange-500 dark:shadow-orange-500/20 dark:hover:bg-orange-600"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {t("ui.generating")}
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    {t("ui.generate_button")}
                  </>
                )}
              </Button>
            </div>
          </motion.div>

          {/* ===== RIGHT: Output area ===== */}
          <motion.div
            ref={resultRef}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-col"
          >
            <div className="h-full rounded-2xl border border-border bg-card shadow-sm dark:bg-card flex flex-col">
              {/* Output header */}
              <div className="flex items-center justify-between border-b border-border bg-orange-500/[0.03] px-5 py-3 dark:bg-orange-500/[0.05]">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-semibold">{t("ui.output_title")}</span>
                  {wordCount > 0 && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {wordCount} {t("output.words")}
                    </span>
                  )}
                </div>
                {generatedScript && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={handleCopy}
                  >
                    <Copy className="h-3 w-3" />
                    {t("ui.copy_button")}
                  </Button>
                )}
              </div>

              {/* Output content */}
              <div className="relative min-h-[480px] flex-1 p-5">
                {generatedScript ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{generatedScript}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="relative flex h-full flex-col items-center justify-center gap-4 text-center">
                    {/* Comic panel grid decoration */}
                    <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 gap-2 p-4 opacity-[0.05]">
                      <div className="col-span-2 rounded border border-current" />
                      <div className="row-span-2 rounded border border-current" />
                      <div className="rounded border border-current" />
                      <div className="col-span-2 rounded border border-current" />
                      <div className="col-span-2 rounded border border-current" />
                      <div className="rounded border border-current" />
                    </div>
                    {isGenerating ? (
                      <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="relative h-14 w-14">
                          <div className="absolute inset-0 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />
                          <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-orange-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t("output.generating_message")}
                        </p>
                      </div>
                    ) : (
                      <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10">
                          <BookOpen className="h-7 w-7 text-orange-500" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground/80">
                            {t("ui.output_title")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t("ui.output_empty")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
