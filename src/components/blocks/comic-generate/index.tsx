"use client";

import GeneratorNavTabs from "@/components/generator-nav-tabs";
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
import { LANGUAGE_OPTIONS } from "@/lib/language-options";
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
  PenLine,
} from "lucide-react";
import Icon from "@/components/icon";
import TurnstileInvisible, {
  TurnstileInvisibleHandle,
} from "@/components/TurnstileInvisible";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
import ReactMarkdown from "react-markdown";
import { motion, useReducedMotion } from "framer-motion";
import type { ComicGenerate as ComicGenerateType } from "@/types/blocks/comic-generate";
import type { ComicCharacter } from "@/types/comic";
import ComicBreadcrumb from "./breadcrumb";
import { useRouter } from "@/i18n/navigation";
import { buildContinueRoute } from "@/components/ai-write/workbench/_lib";

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
  const router = useRouter();
  const reduceMotion = useReducedMotion();

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
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        icon: <Palette className="h-4 w-4" />,
        description: t("ai_models.creative_description"),
      },
    ],
    [section]
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

      <div className="relative mx-auto w-full max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-10">
          <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5">
            <ComicBreadcrumb
              homeText={t("ui.breadcrumb_home")}
              currentText={t("ui.breadcrumb_current")}
            />
          </div>
        </div>

        {/* Header */}
        <div className="relative mx-auto max-w-2xl text-center mb-14">
          {/* Halftone dot breathing layer (ambient comic print texture) */}
          {!reduceMotion && (
            <div className="pointer-events-none absolute inset-0 overflow-visible z-0" aria-hidden="true">
              {[
                { left: "5%", top: "15%", size: 6, delay: 0, dur: 9, peak: 0.18 },
                { left: "92%", top: "10%", size: 9, delay: 1.5, dur: 11, peak: 0.22 },
                { left: "12%", top: "75%", size: 5, delay: 3, dur: 10, peak: 0.16 },
                { left: "85%", top: "70%", size: 7, delay: 2, dur: 12, peak: 0.2 },
                { left: "30%", top: "20%", size: 4, delay: 4, dur: 8, peak: 0.14 },
                { left: "70%", top: "85%", size: 6, delay: 5, dur: 11, peak: 0.18 },
                { left: "20%", top: "50%", size: 8, delay: 6, dur: 13, peak: 0.2 },
                { left: "78%", top: "35%", size: 5, delay: 1, dur: 9, peak: 0.16 },
              ].map((d, i) => (
                <motion.span
                  key={i}
                  className="absolute rounded-full bg-orange-500 dark:bg-orange-400"
                  style={{ left: d.left, top: d.top, width: d.size, height: d.size }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, d.peak, d.peak * 0.5, 0] }}
                  transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: "easeInOut" }}
                />
              ))}
            </div>
          )}

          {/* Speech bubble floating accents */}
          {!reduceMotion && (
            <>
              <motion.div
                className="pointer-events-none absolute z-[1]"
                style={{ left: "2%", top: "55%" }}
                initial={{ opacity: 0, y: 0, rotate: -4 }}
                animate={{ opacity: [0, 0.5, 0.5, 0], y: [0, -6, 0], rotate: [-4, -1, -4] }}
                transition={{ duration: 6, delay: 1, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              >
                <svg width="38" height="34" viewBox="0 0 38 34" fill="none">
                  <path d="M6 4h26a4 4 0 014 4v12a4 4 0 01-4 4H16l-7 6v-6H6a4 4 0 01-4-4V8a4 4 0 014-4z" fill="rgb(251 146 60 / 0.55)" stroke="rgb(251 146 60 / 0.8)" strokeWidth="1.5" />
                  <text x="19" y="19" fontSize="14" fontWeight="700" fill="white" textAnchor="middle" fontStyle="italic">?</text>
                </svg>
              </motion.div>
              <motion.div
                className="pointer-events-none absolute z-[1]"
                style={{ right: "4%", top: "48%" }}
                initial={{ opacity: 0, y: 0, rotate: 4 }}
                animate={{ opacity: [0, 0.5, 0.5, 0], y: [0, -6, 0], rotate: [4, 1, 4] }}
                transition={{ duration: 7, delay: 2.5, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              >
                <svg width="34" height="30" viewBox="0 0 34 30" fill="none">
                  <path d="M5 3h24a4 4 0 014 4v10a4 4 0 01-4 4h-7l-6 5v-5H5a4 4 0 01-4-4V7a4 4 0 014-4z" fill="rgb(251 191 36 / 0.55)" stroke="rgb(251 191 36 / 0.8)" strokeWidth="1.5" />
                  <text x="17" y="17" fontSize="13" fontWeight="700" fill="white" textAnchor="middle" fontStyle="italic">!</text>
                </svg>
              </motion.div>
            </>
          )}

          {/* POW burst star pulse */}
          {!reduceMotion && (
            <motion.div
              className="pointer-events-none absolute z-[1]"
              style={{ right: "8%", top: "5%" }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.45, 0], scale: [0.8, 1.15, 0.8] }}
              transition={{ duration: 4, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            >
              <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                <path d="M21 1l3 9 8-5-2 9 9 1-7 6 4 9-9-2-3 9-3-9-9 2 4-9-7-6 9-1-2-9 8 5z" fill="rgb(251 146 60 / 0.75)" />
              </svg>
            </motion.div>
          )}

          {/* Double-bezel icon container with hover speech bubble pop */}
          <div className="group relative z-10 flex justify-center mb-6">
            <span className="pointer-events-none absolute left-[calc(50%-2.75rem)] top-1 font-display italic font-bold text-2xl text-orange-500/0 transition-all duration-500 group-hover:text-orange-500/80 dark:group-hover:text-orange-400/80 group-hover:scale-110">
              ?
            </span>
            <span className="pointer-events-none absolute right-[calc(50%-2.75rem)] top-1 font-display italic font-bold text-2xl text-amber-500/0 transition-all duration-500 group-hover:text-amber-500/80 dark:group-hover:text-amber-400/80 group-hover:scale-110">
              !
            </span>
            <div className="rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 dark:bg-white/[0.015]">
              <div className="flex size-12 items-center justify-center rounded-xl bg-orange-500/10">
                <Wand2 className="size-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          {/* Eyebrow badge */}
          <span className="relative z-10 inline-flex items-center rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-5">
            AI Creative Tool
          </span>

          {/* Title with italic gradient emphasis on "Comic" */}
          <h1 className="relative z-10 font-display text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-foreground leading-[1.08] mt-4">
            AI{" "}
            <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 dark:from-orange-400 dark:via-orange-300 dark:to-amber-300">
              Comic
            </span>
            {" "}Generator
          </h1>

          {/* Halftone dot cluster + POW burst decorative anchor */}
          <div className="relative z-10 mt-3 mb-5 flex justify-center items-center gap-2">
            {[3, 5, 7, 5, 3].map((s, i) => (
              <span key={i} className="inline-block rounded-full bg-orange-500/30 dark:bg-orange-400/35" style={{ width: s, height: s }} />
            ))}
            <svg className="size-3 text-orange-500/55 dark:text-orange-400/55" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 1l2 7 7-3-3 7 7 2-7 2 3 7-7-3-2 7-2-7-7 3 3-7-7-2 7-2-3-7 7 3z" />
            </svg>
            {[3, 5, 7, 5, 3].map((s, i) => (
              <span key={i} className="inline-block rounded-full bg-orange-500/30 dark:bg-orange-400/35" style={{ width: s, height: s }} />
            ))}
          </div>

          <p className="relative z-10 text-base sm:text-lg text-muted-foreground/65 leading-relaxed font-light max-w-xl mx-auto">
            {t("ui.subtitle")}
          </p>

          {/* Theme pills */}
          {section?.ui?.theme_pills?.length ? (
            <div className="relative z-10 mt-7 flex flex-wrap items-center justify-center gap-2">
              {section.ui.theme_pills.map((pill: string, i: number) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/[0.04] px-3 py-1 text-xs font-medium text-orange-700 dark:text-orange-300">
                  <span className="inline-block size-1 rounded-full bg-orange-500/60" />
                  {pill}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Hero → Tool transition */}
        <div className="mb-8 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <GeneratorNavTabs />

        {/* Main layout: sidebar + content */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(360px,2fr)_3fr] xl:grid-cols-[440px_1fr]">
          {/* ===== LEFT: Control panel ===== */}
          <motion.div
            ref={leftPanelRef}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
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
                        <div className="absolute right-0 top-8 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-background shadow-xl">
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
                          <span className="mr-2">{lang.flag}</span>{lang.name}
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
                          "flex flex-col items-center rounded-xl border p-2 sm:p-2.5 text-center text-xs transition-all min-w-0",
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
                className="group mt-5 w-full gap-2 bg-orange-600 font-semibold text-white shadow-md shadow-orange-600/20 hover:bg-orange-700 active:scale-[0.97] disabled:opacity-60 dark:bg-orange-500 dark:shadow-orange-500/20 dark:hover:bg-orange-600 transition-all"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {t("ui.generating")}
                  </>
                ) : (
                  <>
                    <span className="relative inline-flex items-center justify-center">
                      <Wand2 className="h-4 w-4 relative z-10" />
                      {!reduceMotion && (
                        <svg
                          className="pointer-events-none absolute -inset-1.5 size-7 text-white/0 group-hover:animate-comic-burst"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M12 1l2 7 7-3-3 7 7 2-7 2 3 7-7-3-2 7-2-7-7 3 3-7-7-2 7-2-3-7 7 3z" />
                        </svg>
                      )}
                    </span>
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
            <div className="h-full rounded-2xl border border-border bg-card shadow-sm card-hover-lift flex flex-col">
              {/* Output header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-orange-500/[0.03] px-4 py-3 sm:px-5 dark:bg-orange-500/[0.05]">
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={handleCopy}
                    >
                      <Copy className="h-3 w-3" />
                      <span className="hidden sm:inline">{t("ui.copy_button")}</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        try {
                          window.localStorage.setItem("ai-write:generator-prefill", JSON.stringify({ title: prompt.substring(0, 30), content: generatedScript }));
                        } catch {}
                        router.push(buildContinueRoute({ source: "comic-generator" }) as any);
                      }}
                      className="gap-1.5 text-xs rounded-full bg-orange-600 px-3 text-white hover:bg-orange-500"
                    >
                      <PenLine className="h-3 w-3" />
                      <span className="hidden sm:inline">{t("ui.continue_button")}</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Output content */}
              <div className="relative min-h-[480px] flex-1 p-5 overflow-hidden">
                {generatedScript ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{generatedScript}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="relative flex h-full flex-col items-center justify-center gap-4 text-center">
                    {/* Halftone overlay (subtle comic print texture) */}
                    {!reduceMotion && (
                      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
                        {[
                          { left: "8%", top: "20%", size: 5, delay: 0, dur: 7, peak: 0.14 },
                          { left: "82%", top: "15%", size: 7, delay: 1.5, dur: 9, peak: 0.18 },
                          { left: "15%", top: "75%", size: 4, delay: 3, dur: 8, peak: 0.12 },
                          { left: "88%", top: "70%", size: 6, delay: 2, dur: 10, peak: 0.16 },
                          { left: "50%", top: "10%", size: 4, delay: 4, dur: 8, peak: 0.12 },
                          { left: "45%", top: "85%", size: 5, delay: 5, dur: 9, peak: 0.14 },
                        ].map((d, i) => (
                          <motion.span
                            key={i}
                            className="absolute rounded-full bg-orange-500 dark:bg-orange-400"
                            style={{ left: d.left, top: d.top, width: d.size, height: d.size }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, d.peak, 0] }}
                            transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: "easeInOut" }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Comic panel grid decoration (preserved) */}
                    <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 gap-2 p-4 opacity-[0.05]">
                      <div className="col-span-2 rounded border border-current" />
                      <div className="row-span-2 rounded border border-current" />
                      <div className="rounded border border-current" />
                      <div className="col-span-2 rounded border border-current" />
                      <div className="col-span-2 rounded border border-current" />
                      <div className="rounded border border-current" />
                    </div>

                    {/* POW burst accent */}
                    {!reduceMotion && (
                      <motion.div
                        className="pointer-events-none absolute z-[1] top-[12%] right-[10%]"
                        initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
                        animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.1, 0.8], rotate: [-8, -4, -8] }}
                        transition={{ duration: 5, delay: 1, repeat: Infinity, ease: "easeInOut" }}
                        aria-hidden="true"
                      >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                          <path d="M12 1l2 7 7-3-3 7 7 2-7 2 3 7-7-3-2 7-2-7-7 3 3-7-7-2 7-2-3-7 7 3z" fill="rgb(251 146 60 / 0.7)" />
                        </svg>
                      </motion.div>
                    )}

                    {isGenerating ? (
                      <div className="relative z-10 flex flex-col items-center gap-4">
                        {/* Typing dots (3 halftone dots pulse sequentially) */}
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="size-2.5 rounded-full bg-orange-500 dark:bg-orange-400"
                              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.15, 0.8] }}
                              transition={{ duration: 1.4, delay: i * 0.2, repeat: Infinity, ease: "easeInOut" }}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t("output.generating_message")}
                        </p>
                      </div>
                    ) : (
                      <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10">
                          <BookOpen className="h-7 w-7 text-orange-500" />
                          {/* Speech bubble accent */}
                          <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold italic text-white shadow-sm">
                            ?
                          </span>
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
