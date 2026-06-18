"use client";

import GeneratorNavTabs from "@/components/generator-nav-tabs";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Icon from "@/components/icon";
import { toast } from "sonner";
import { useLocale } from "next-intl";
import confetti from "canvas-confetti";
import { PlotStorage } from "@/lib/plot-storage";
import { extractPlotTitle, countPlotWords } from "@/lib/plot-prompt";
import type { PlotData } from "@/types/plot";
import type { PlotGenerate as PlotGenerateType } from "@/types/blocks/plot-generate";
import ReactMarkdown from "react-markdown";
import PlotToStoryDialog from "./plot-to-story-dialog";
import PlotHistoryDropdown from "@/components/plot-history-dropdown";
import PlotBreadcrumb from "./breadcrumb";
import { cn } from "@/lib/utils";
import { LANGUAGE_OPTIONS } from "@/lib/language-options";
import { ChevronDown, Settings, Zap, Sparkles, Palette, BookOpen } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import TurnstileInvisible, { TurnstileInvisibleHandle } from "@/components/TurnstileInvisible";
import CompletionGuide from "@/components/story/completion-guide";
import StorySaveDialog from "@/components/story/story-save-dialog";
import { GeneratorShortcutHints } from "@/components/generator-shortcut-hints";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
import type { StoryStatus } from "@/models/story";
import { useAppContext } from "@/contexts/app";
import { useGeneratorShortcuts } from "@/hooks/useGeneratorShortcuts";
import { useRouter } from "@/i18n/navigation";
import { buildContinueRoute } from "@/components/ai-write/workbench/_lib";

// ========== HELPER FUNCTIONS ==========

/**
 * Calculate word count for both English and Chinese text
 */
function calculateWordCount(text: string): number {
  if (!text || !text.trim()) return 0;
  const trimmed = text.trim();

  // Count CJK characters
  const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/gu;
  const cjkChars = trimmed.match(cjkRegex);
  const cjkCount = cjkChars ? cjkChars.length : 0;

  // Count English words
  const withoutCJK = trimmed.replace(cjkRegex, ' ').trim();
  const englishWords = withoutCJK.split(/\s+/).filter(word => word.length > 0);
  const englishCount = withoutCJK ? englishWords.length : 0;

  return cjkCount + englishCount;
}

// ========== COMPONENT ==========

interface PlotGenerateProps {
  section?: PlotGenerateType;
}

export default function PlotGenerate({ section }: PlotGenerateProps) {
  const locale = useLocale();
  const { user, setShowSignModal } = useAppContext();
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  // Helper function to get nested translations from section data
  const t = (path: string) => {
    const keys = path.split('.');
    let value = section as any;
    for (const key of keys) {
      value = value?.[key];
    }
    return value || path;
  };

  // ========== AI MODELS ==========
  const AI_MODELS = useMemo(() => [
    {
      id: 'fast',
      name: t('ai_models.fast'),
      badge: 'FAST',
      badgeColor: 'bg-green-500/10 text-green-600 border-green-500/30',
      icon: <Zap className="h-4 w-4" />,
      speed: '~20s',
      description: t('ai_models.fast_description')
    },
    {
      id: 'standard',
      name: t('ai_models.standard'),
      badge: 'RECOMMENDED',
      badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
      icon: <Sparkles className="h-4 w-4" />,
      speed: '~40s',
      description: t('ai_models.standard_description')
    },
    {
      id: 'creative',
      name: t('ai_models.creative'),
      badge: 'BEST',
      badgeColor: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
      icon: <Palette className="h-4 w-4" />,
      speed: '~60s',
      description: t('ai_models.creative_description')
    }
  ], [section]);

  // ========== SAMPLE PROMPTS ==========
  const SAMPLE_PROMPTS = useMemo(() => {
    return section?.random_prompts || [
      "A detective discovers a secret society controlling the city from the shadows",
      "A time traveler accidentally changes history and must fix the timeline before fading from existence",
      "Two rival chefs compete for a Michelin star while falling in love",
      "A hacker uncovers a conspiracy that goes deeper than they ever imagined",
      "An astronaut stranded on Mars must survive until rescue arrives",
      "A magical library where books come to life and their characters escape into reality",
      "A young musician sells their soul for fame, then tries to get it back",
      "Parallel universes collide when a scientist's experiment goes wrong",
      "A cursed painting drives everyone who owns it to madness",
      "An AI becomes self-aware and questions its purpose in serving humanity",
      "A treasure hunter races against rival organizations to find a legendary artifact",
      "In a world where memories can be bought and sold, a memory thief steals the wrong memory",
      "A ghost and a living person must work together to solve the ghost's murder",
      "A world where everyone has a superpower except one person who must save them all",
      "An underground fight club that's actually a front for something much more sinister"
    ];
  }, [section]);

  // ========== STATE MANAGEMENT ==========
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<string | null>('standard');
  const [selectedLanguage, setSelectedLanguage] = useState(locale);

  // Plot-specific parameters
  const [complexity, setComplexity] = useState<'simple' | 'medium' | 'complex'>('medium');
  const [mainCharacterCount, setMainCharacterCount] = useState(1);
  const [supportingCharacterCount, setSupportingCharacterCount] = useState(2);
  const [plotPointCount, setPlotPointCount] = useState(5);
  const [subPlotCount, setSubPlotCount] = useState(1);
  const [conflictTypes, setConflictTypes] = useState<string[]>(['both']);
  const [emotionalArc, setEmotionalArc] = useState('growth');
  const [suspenseStyle, setSuspenseStyle] = useState('middle');

  // Optional story parameters
  const [selectedGenre, setSelectedGenre] = useState("none");
  const [selectedTone, setSelectedTone] = useState("none");
  const [selectedPerspective, setSelectedPerspective] = useState("none");

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlot, setGeneratedPlot] = useState("");
  const [currentPlotId, setCurrentPlotId] = useState<string | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showPlotToStoryDialog, setShowPlotToStoryDialog] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSavingStory, setIsSavingStory] = useState(false);
  const [hasSavedCurrentStory, setHasSavedCurrentStory] = useState(false);

  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);

  // Use ref to store latest values (avoid stale closure)
  const plotOptionsRef = useRef({
    complexity: 'medium' as 'simple' | 'medium' | 'complex',
    mainCharacterCount: 1,
    supportingCharacterCount: 2,
    plotPointCount: 5,
    subPlotCount: 1,
    conflictTypes: ['both'],
    emotionalArc: 'growth',
    suspenseStyle: 'middle',
    genre: 'none',
    tone: 'none',
    perspective: 'none',
    language: locale
  });

  useDraftAutoSave({
    key: `plot-generator:prompt:${locale}`,
    value: prompt,
    onRestore: (draft) => setPrompt(draft),
  });

  // Update ref whenever options change
  useEffect(() => {
    plotOptionsRef.current = {
      complexity,
      mainCharacterCount,
      supportingCharacterCount,
      plotPointCount,
      subPlotCount,
      conflictTypes,
      emotionalArc,
      suspenseStyle,
      genre: selectedGenre,
      tone: selectedTone,
      perspective: selectedPerspective,
      language: selectedLanguage
    };
  }, [complexity, mainCharacterCount, supportingCharacterCount, plotPointCount, subPlotCount, conflictTypes, emotionalArc, suspenseStyle, selectedGenre, selectedTone, selectedPerspective, selectedLanguage]);

  // ========== EVENT HANDLERS ==========

  const handleComplexityChange = useCallback((value: 'simple' | 'medium' | 'complex') => {
    setComplexity(value);
    // Auto-adjust parameters based on complexity
    if (value === 'simple') {
      setPlotPointCount(3);
      setSubPlotCount(0);
    } else if (value === 'medium') {
      setPlotPointCount(5);
      setSubPlotCount(1);
    } else {
      setPlotPointCount(9);
      setSubPlotCount(2);
    }
  }, []);

  const handleConflictTypeToggle = useCallback((type: string) => {
    setConflictTypes(prev => {
      if (prev.includes(type)) {
        const newTypes = prev.filter(t => t !== type);
        return newTypes.length > 0 ? newTypes : ['both']; // At least one must be selected
      }
      return [...prev, type];
    });
  }, []);

  const handleRandomPrompt = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * SAMPLE_PROMPTS.length);
    setPrompt(SAMPLE_PROMPTS[randomIndex]);
    toast.success(t('success.random_prompt_selected'));
  }, [SAMPLE_PROMPTS, section]);

  // ========== GENERATION LOGIC ==========

  const handleGenerateClick = useCallback(() => {
    if (!prompt.trim()) {
      toast.error(t('validation.enter_story_concept'));
      return;
    }

    if (!selectedModel) {
      toast.error(t('validation.select_ai_model'));
      return;
    }

    // Start loading state while Turnstile verification is in progress
    setIsGenerating(true);

    // Trigger invisible Turnstile verification
    // After verification succeeds, handleTurnstileSuccess will be called automatically
    turnstileRef.current?.execute();
  }, [prompt, selectedModel, section]);

  const handleVerificationSuccess = useCallback(async (turnstileToken: string) => {
    console.log("=== Starting Plot Generation ===");
    console.log("Prompt:", prompt);
    console.log("Model:", selectedModel);

    // Get latest options from ref
    const options = plotOptionsRef.current;

    setIsGenerating(true);
    setGeneratedPlot("");
    setCurrentPlotId(null);
    setHasSavedCurrentStory(false);

    try {
      const requestBody = {
        prompt: prompt.trim(),
        model: selectedModel,
        locale: options.language,
        complexity: options.complexity,
        mainCharacterCount: options.mainCharacterCount,
        supportingCharacterCount: options.supportingCharacterCount,
        plotPointCount: options.plotPointCount,
        subPlotCount: options.subPlotCount,
        conflictTypes: options.conflictTypes,
        emotionalArc: options.emotionalArc,
        suspenseStyle: options.suspenseStyle,
        genre: options.genre !== 'none' ? options.genre : undefined,
        tone: options.tone !== 'none' ? options.tone : undefined,
        perspective: options.perspective !== 'none' ? options.perspective : undefined,
        turnstileToken
      };

      console.log("Request body:", JSON.stringify(requestBody, null, 2));

      const response = await fetch("/api/plot-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim().startsWith('0:"')) {
            try {
              const content = line.slice(3, -1)
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');

              accumulatedContent += content;
              setGeneratedPlot(accumulatedContent);
            } catch (e) {
              console.error("Parse error:", e);
            }
          }
        }
      }

      // Save to LocalStorage
      if (accumulatedContent.trim()) {
        const savedPlot = PlotStorage.savePlot({
          title: extractPlotTitle(accumulatedContent),
          prompt: prompt.trim(),
          content: accumulatedContent,
          model: selectedModel || 'standard',
          complexity: options.complexity,
          mainCharacterCount: options.mainCharacterCount,
          supportingCharacterCount: options.supportingCharacterCount,
          plotPointCount: options.plotPointCount,
          subPlotCount: options.subPlotCount,
          conflictTypes: options.conflictTypes,
          emotionalArc: options.emotionalArc,
          suspenseStyle: options.suspenseStyle,
          genre: options.genre !== 'none' ? options.genre : undefined,
          tone: options.tone !== 'none' ? options.tone : undefined,
          perspective: options.perspective !== 'none' ? options.perspective : undefined,
          locale: options.language
        });

        setCurrentPlotId(savedPlot.id);

        // Celebration!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        toast.success(t('success.plot_generated'));
      }

    } catch (error) {
      console.error("Plot generation error:", error);
      toast.error(`${t('errors.generation_failed')} ${error}`);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedModel]);

  const handleTurnstileSuccess = useCallback((turnstileToken: string) => {
    console.log("✓ Turnstile verification successful (Plot)");
    handleVerificationSuccess(turnstileToken);
  }, [handleVerificationSuccess]);

  const handleTurnstileError = useCallback(() => {
    console.error("❌ Turnstile verification failed (Plot)");
    setIsGenerating(false);
    toast.error(t('errors.generation_failed'));
  }, [section]);

  // 保存相关逻辑

  const handleCreateAnother = useCallback(() => {
    setGeneratedPlot("");
    setCurrentPlotId(null);
    setHasSavedCurrentStory(false);
  }, []);

  const handleSaveClick = useCallback(() => {
    if (!generatedPlot.trim()) {
      toast.error(locale === "zh" ? "没有可保存的剧情，请先生成大纲" : "No plot generated to save");
      return;
    }

    if (!user) {
      setShowSignModal(true);
      return;
    }

    setIsSaveDialogOpen(true);
  }, [generatedPlot, locale, user, setShowSignModal]);

  useGeneratorShortcuts({
    onGenerate: handleGenerateClick,
    onFocusInput: () => {
      if (promptRef.current) {
        promptRef.current.focus();
      }
    },
    onQuickSave: () => {
      if (!isGenerating && !isSavingStory && !hasSavedCurrentStory) {
        handleSaveClick();
      }
    },
  });

  const handleConfirmSave = useCallback(
    async (status: StoryStatus) => {
      if (!generatedPlot.trim()) {
        toast.error(locale === "zh" ? "没有可保存的剧情，请先生成大纲" : "No plot generated to save");
        return;
      }

      try {
        setIsSavingStory(true);

        const latestOptions = plotOptionsRef.current;

        const settings: Record<string, unknown> = {
          locale,
          outputLanguage: latestOptions.language,
          complexity: latestOptions.complexity,
          mainCharacterCount: latestOptions.mainCharacterCount,
          supportingCharacterCount: latestOptions.supportingCharacterCount,
          plotPointCount: latestOptions.plotPointCount,
          subPlotCount: latestOptions.subPlotCount,
          conflictTypes: latestOptions.conflictTypes,
          emotionalArc: latestOptions.emotionalArc,
          suspenseStyle: latestOptions.suspenseStyle,
        };

        if (latestOptions.genre !== "none") {
          settings.genre = latestOptions.genre;
        }
        if (latestOptions.tone !== "none") {
          settings.tone = latestOptions.tone;
        }
        if (latestOptions.perspective !== "none") {
          settings.perspective = latestOptions.perspective;
        }

        const modelKey = selectedModel || "standard";
        const modelMap: Record<string, string> = {
          fast: "gemini-2.5-flash",
          standard: "gemini-3.1-flash-lite",
          creative: "gemini-3-flash",
        };
        const actualModel = modelMap[modelKey] || "gemini-3.1-flash-lite";

        const resp = await fetch("/api/stories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: extractPlotTitle(generatedPlot) || (prompt.substring(0, 30) + (prompt.length > 30 ? "..." : "")),
            prompt,
            content: generatedPlot,
            wordCount: calculateWordCount(generatedPlot),
            modelUsed: actualModel,
            settings,
            status,
            visibility: status === "published" ? "public" : "private",
            sourceCategory: "plot",
          }),
        });

        if (!resp.ok) {
          throw new Error("request failed with status: " + resp.status);
        }

        const { code, message } = await resp.json();

        if (code !== 0) {
          if (message === "no auth") {
            setShowSignModal(true);
          }

          toast.error(
            locale === "zh"
              ? message === "no auth"
                ? "请先登录后再保存故事"
                : `保存失败：${message}`
              : message || "Failed to save story"
          );
          return;
        }

        toast.success(
          locale === "zh"
            ? status === "published"
              ? "故事已发布"
              : "故事已保存"
            : status === "published"
            ? "Story published"
            : "Story saved"
        );

        setHasSavedCurrentStory(true);
        setIsSaveDialogOpen(false);
      } catch (error) {
        console.error("save plot story failed", error);
        toast.error(
          locale === "zh"
            ? "保存失败，请稍后再试"
            : "Failed to save story, please try again."
        );
      } finally {
        setIsSavingStory(false);
      }
    }, [generatedPlot, locale, prompt, selectedModel, setShowSignModal])
  ;

  // Computed values
  const wordCount = useMemo(() => calculateWordCount(generatedPlot), [generatedPlot]);
  const promptCharCount = prompt.length;

  const completionGuideTranslations = useMemo(() => {
    if (locale === "zh") {
      return {
        title: "喜欢这个剧情大纲吗？",
        subtitle: "你可以保存它，或者基于它继续创作故事。",
        create_another: "再生成一个大纲",
        share_action: "保存到故事库",
      };
    }

    return {
      title: "Like this plot outline?",
      subtitle: "You can save it, or generate another one to explore new ideas.",
      create_another: "Generate Another Plot",
      share_action: "Save Story",
    };
  }, [locale]);

  // Load plot from history
  const handleLoadPlot = useCallback((plot: PlotData) => {
    setPrompt(plot.prompt);
    setGeneratedPlot(plot.content);
    setCurrentPlotId(plot.id);
    setSelectedModel(plot.model);
    setComplexity(plot.complexity);
    setMainCharacterCount(plot.mainCharacterCount);
    setSupportingCharacterCount(plot.supportingCharacterCount);
    setPlotPointCount(plot.plotPointCount);
    setSubPlotCount(plot.subPlotCount);
    setConflictTypes(plot.conflictTypes);
    setEmotionalArc(plot.emotionalArc);
    setSuspenseStyle(plot.suspenseStyle);
    if (plot.genre) setSelectedGenre(plot.genre);
    if (plot.tone) setSelectedTone(plot.tone);
    if (plot.perspective) setSelectedPerspective(plot.perspective);
    if (plot.locale) setSelectedLanguage(plot.locale);
    toast.success(t('success.plot_generated'));
  }, []);

  // Copy plot to clipboard
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedPlot);
    toast.success(t('success.plot_copied'));
  }, [generatedPlot, section]);

  // ========== RENDER ==========

  return (
    <div id="plot_generator" className="min-h-screen overflow-hidden bg-background text-foreground selection:bg-orange-500/30">
      {/* Subtle warm top glow + dot texture */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.05_65),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.18_0.04_65),transparent)]" />
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-orange-500/[0.04] via-orange-500/[0.02] to-transparent" />
        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]" style={{ backgroundImage: 'var(--bg-grid)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative mx-auto w-full max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-10">
          <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5">
            <PlotBreadcrumb
              homeText={t('ui.breadcrumb_home')}
              currentText={t('ui.breadcrumb_current')}
            />
          </div>
        </div>

        {/* Header */}
        <div className="relative mx-auto max-w-2xl text-center mb-14">
          {/* Ambient: warm constellation motes */}
          {!reduceMotion && (
            <div className="pointer-events-none absolute inset-0 z-0 overflow-visible">
              {[
                { left: "12%", top: "18%", size: 5, delay: 0, dur: 10, peak: 0.22 },
                { left: "88%", top: "22%", size: 6, delay: 1.4, dur: 12, peak: 0.2 },
                { left: "22%", top: "78%", size: 4, delay: 2.8, dur: 9, peak: 0.16 },
                { left: "78%", top: "74%", size: 5, delay: 1.8, dur: 11, peak: 0.18 },
                { left: "32%", top: "12%", size: 4, delay: 3.5, dur: 8, peak: 0.14 },
                { left: "68%", top: "84%", size: 6, delay: 4.2, dur: 13, peak: 0.2 },
                { left: "8%", top: "52%", size: 4, delay: 2.2, dur: 9, peak: 0.16 },
                { left: "92%", top: "48%", size: 5, delay: 5, dur: 11, peak: 0.18 },
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

          {/* Floating map pin & route-dash accents (cartographer motif) */}
          {!reduceMotion && (
            <>
              <motion.div
                className="pointer-events-none absolute z-[1] text-orange-500/50 dark:text-orange-400/50"
                style={{ left: "4%", top: "48%" }}
                initial={{ opacity: 0, y: 0, rotate: -10 }}
                animate={{ opacity: [0, 0.6, 0.6, 0], y: [0, -10, 0], rotate: [-10, -4, -10] }}
                transition={{ duration: 7.5, delay: 1, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22s-7-7.5-7-13a7 7 0 1 1 14 0c0 5.5-7 13-7 13z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.25" strokeLinejoin="round" />
                  <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1" fill="none" />
                </svg>
              </motion.div>
              <motion.div
                className="pointer-events-none absolute z-[1] text-amber-500/50 dark:text-amber-400/50"
                style={{ right: "5%", top: "44%" }}
                initial={{ opacity: 0, y: 0, rotate: 8 }}
                animate={{ opacity: [0, 0.55, 0.55, 0], y: [0, -7, 0], rotate: [8, 3, 8] }}
                transition={{ duration: 8.5, delay: 2.5, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              >
                <svg width="48" height="32" viewBox="0 0 48 32" fill="none">
                  <path d="M3 26 Q14 6 24 16 T44 8" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" fill="none" strokeLinecap="round" />
                  <circle cx="3" cy="26" r="2.4" fill="currentColor" />
                  <circle cx="44" cy="8" r="3" fill="currentColor" />
                  <circle cx="44" cy="8" r="6.5" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.5" />
                </svg>
              </motion.div>
            </>
          )}

          {/* Slowly drifting 6-node constellation network (narrative map) */}
          {!reduceMotion && (
            <motion.div
              className="pointer-events-none absolute z-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500/35 dark:text-orange-400/35"
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{ opacity: [0, 0.6, 0.45], x: [0, 8, 0], y: [0, -6, 0] }}
              transition={{ opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" }, x: { duration: 18, repeat: Infinity, ease: "easeInOut" }, y: { duration: 14, repeat: Infinity, ease: "easeInOut" } }}
              aria-hidden="true"
            >
              <svg width="420" height="280" viewBox="0 0 420 280" fill="none">
                <path d="M40 70 L150 40 L260 90 L370 60" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 5" />
                <path d="M40 70 L80 200 L220 220 L260 90" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 5" />
                <path d="M150 40 L220 220" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 5" />
                <path d="M370 60 L320 180 L220 220" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 5" />
                <circle cx="40" cy="70" r="3" fill="currentColor" />
                <circle cx="150" cy="40" r="4.5" fill="currentColor" />
                <circle cx="260" cy="90" r="3" fill="currentColor" />
                <circle cx="370" cy="60" r="3" fill="currentColor" />
                <circle cx="80" cy="200" r="3" fill="currentColor" />
                <circle cx="220" cy="220" r="4.5" fill="currentColor" />
                <circle cx="320" cy="180" r="2.5" fill="currentColor" />
                <circle cx="150" cy="40" r="10" stroke="currentColor" strokeWidth="0.4" fill="none" />
                <circle cx="220" cy="220" r="11" stroke="currentColor" strokeWidth="0.4" fill="none" />
              </svg>
            </motion.div>
          )}

          {/* Editorial watermark: paragraph & section marks */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none" aria-hidden="true">
            <span className="absolute left-[5%] top-[20%] font-display italic font-bold text-2xl text-orange-500/[0.07] dark:text-orange-400/[0.07]">¶</span>
            <span className="absolute right-[6%] top-[14%] font-display italic font-bold text-xl text-amber-500/[0.07] dark:text-amber-400/[0.07]">§</span>
            <span className="absolute left-[9%] bottom-[16%] font-display italic font-bold text-lg text-orange-500/[0.06] dark:text-orange-400/[0.06]">§</span>
            <span className="absolute right-[8%] bottom-[18%] font-display italic font-bold text-2xl text-amber-500/[0.07] dark:text-amber-400/[0.07]">¶</span>
            <span className="absolute left-[26%] top-[8%] font-display italic font-bold text-base text-orange-500/[0.05] dark:text-orange-400/[0.05]">§</span>
            <span className="absolute right-[24%] bottom-[6%] font-display italic font-bold text-xl text-orange-500/[0.06] dark:text-orange-400/[0.06]">¶</span>
          </div>

          {/* Double-bezel icon container with cartographer hover flare */}
          <div className="group relative z-10 flex justify-center mb-6">
            <span className="pointer-events-none absolute left-[calc(50%-2.75rem)] top-0 font-display italic font-bold text-2xl text-orange-500/0 transition-all duration-500 group-hover:text-orange-500/80 dark:group-hover:text-orange-400/80 group-hover:scale-110">
              ¶
            </span>
            <span className="pointer-events-none absolute right-[calc(50%-2.75rem)] top-0 font-display italic font-bold text-2xl text-amber-500/0 transition-all duration-500 group-hover:text-amber-500/80 dark:group-hover:text-amber-400/80 group-hover:scale-110">
              §
            </span>
            <div className="rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 dark:bg-white/[0.015]">
              <div className="flex size-12 items-center justify-center rounded-xl bg-orange-500/10">
                <Icon name="RiMapLine" className="size-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          {/* Eyebrow badge */}
          <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-5">
            <span className="inline-block size-1.5 rounded-full bg-orange-500 opacity-60" />
            AI Writing Tool
          </span>

          {/* Title with italic gradient emphasis on "Plot" */}
          <h1 className="relative z-10 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.15] mt-4">
            <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 dark:from-orange-400 dark:via-orange-300 dark:to-amber-300">
              Plot
            </span>
            {" "}Generator
          </h1>

          {/* Editorial decorative anchor: ¶ + halftone + ✦ + halftone + § */}
          <div className="relative z-10 mt-3 mb-5 flex justify-center items-center gap-2">
            <span className="text-orange-500/35 dark:text-orange-400/35 text-sm">¶</span>
            {[3, 5, 7, 5, 3].map((s, i) => (
              <span key={i} className="inline-block rounded-full bg-orange-500/25 dark:bg-orange-400/30" style={{ width: s, height: s }} />
            ))}
            <span className="text-amber-500/45 dark:text-amber-400/45 text-base">✦</span>
            {[3, 5, 7, 5, 3].map((s, i) => (
              <span key={i} className="inline-block rounded-full bg-orange-500/25 dark:bg-orange-400/30" style={{ width: s, height: s }} />
            ))}
            <span className="text-orange-500/35 dark:text-orange-400/35 text-sm">§</span>
          </div>

          <p className="relative z-10 text-base sm:text-lg text-muted-foreground/65 leading-relaxed font-light max-w-xl mx-auto">
            {t('ui.subtitle')}
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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-12">

          {/* LEFT COLUMN: Parameters */}
          <div className="space-y-6">

            {/* Main Config Card */}
            <div className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="p-6 sm:p-8">
                {/* Story Concept */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prompt" className="text-sm font-medium text-foreground flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/10 text-[10px] font-bold tabular-nums text-orange-600 dark:text-orange-400">1</span>
                      {t('ui.story_concept')}
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRandomPrompt}
                      className="h-7 gap-1.5 text-xs text-orange-600 dark:text-orange-400 hover:bg-orange-500/10"
                      type="button"
                    >
                      <Icon name="sparkles" className="size-3" />
                      {t('ui.random_button')}
                    </Button>
                  </div>

                  <Textarea
                    id="prompt"
                    ref={promptRef}
                    placeholder={t('placeholders.story_concept')}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[140px] resize-none text-sm focus-visible:ring-orange-500/30"
                  />
                  <div className="text-right text-xs text-muted-foreground/50">
                    <span className={cn("tabular-nums", promptCharCount < 10 && prompt.length > 0 && "text-red-500")}>
                      {promptCharCount}
                    </span>
                    <span className="mx-1 opacity-50">/</span>
                    <span>50+ recommended</span>
                  </div>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-6">
                  {/* AI Model */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">{t('ui.ai_model')}</Label>
                    <Select value={selectedModel || ""} onValueChange={setSelectedModel}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder={t('placeholders.select_ai_model')} />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_MODELS.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center gap-2 py-0.5">
                              <span className="opacity-70">{model.icon}</span>
                              <span className="font-medium">{model.name}</span>
                              <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${model.badgeColor}`}>
                                {model.badge}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Output Language */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">{t('ui.output_language')}</Label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <span className="mr-2">{lang.flag}</span> {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Complexity Level */}
                <div className="mt-6 space-y-3">
                  <Label className="text-xs font-medium text-muted-foreground">{t('ui.complexity_level')}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['simple', 'medium', 'complex'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => handleComplexityChange(level)}
                        className={cn(
                          "py-3 px-2 rounded-xl border text-xs font-medium transition-all duration-200",
                          complexity === level
                            ? 'border-orange-500/40 bg-orange-500/[0.08] text-orange-600 dark:text-orange-400'
                            : 'border-border bg-background hover:bg-muted/50 text-muted-foreground'
                        )}
                      >
                        <div className="font-semibold mb-0.5">{t(`complexity.${level}`)}</div>
                        <div className="text-[9px] opacity-60 line-clamp-1">
                          {level === 'simple' && t('complexity.simple_description')}
                          {level === 'medium' && t('complexity.medium_description')}
                          {level === 'complex' && t('complexity.complex_description')}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <Collapsible
              open={showAdvancedOptions}
              onOpenChange={setShowAdvancedOptions}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-14 px-6 hover:bg-muted/50 text-foreground rounded-none"
                >
                  <span className="flex items-center gap-3 text-sm font-medium">
                    <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                      <Settings className="h-3.5 w-3.5" />
                    </div>
                    {t('ui.advanced_options')}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-300",
                      showAdvancedOptions && "rotate-180"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="overflow-hidden">
                <div className="p-6 pt-2 space-y-6 border-t border-border">
                    {/* Character Counts */}
                    <div className="space-y-5">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-muted-foreground">{t('characters.main')}</Label>
                          <span className="text-xs font-bold tabular-nums text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full bg-orange-500/10">
                            {mainCharacterCount}
                          </span>
                        </div>
                        <Slider
                          value={[mainCharacterCount]}
                          onValueChange={([value]) => setMainCharacterCount(value)}
                          min={1}
                          max={3}
                          step={1}
                          className="py-1"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-muted-foreground">{t('characters.supporting')}</Label>
                          <span className="text-xs font-bold tabular-nums text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full bg-orange-500/10">
                            {supportingCharacterCount}
                          </span>
                        </div>
                        <Slider
                          value={[supportingCharacterCount]}
                          onValueChange={([value]) => setSupportingCharacterCount(value)}
                          min={0}
                          max={5}
                          step={1}
                          className="py-1"
                        />
                      </div>
                    </div>

                    {/* Plot Config */}
                    <div className="space-y-5 pt-4 border-t border-border">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-muted-foreground">{t('plot_structure.plot_points')}</Label>
                          <span className="text-xs font-bold tabular-nums text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full bg-orange-500/10">
                            {plotPointCount}
                          </span>
                        </div>
                        <Slider
                          value={[plotPointCount]}
                          onValueChange={([value]) => setPlotPointCount(value)}
                          min={3}
                          max={9}
                          step={1}
                          className="py-1"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-muted-foreground">{t('plot_structure.subplots')}</Label>
                          <span className="text-xs font-bold tabular-nums text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full bg-orange-500/10">
                            {subPlotCount}
                          </span>
                        </div>
                        <Slider
                          value={[subPlotCount]}
                          onValueChange={([value]) => setSubPlotCount(value)}
                          min={0}
                          max={3}
                          step={1}
                          className="py-1"
                        />
                      </div>
                    </div>

                    {/* Conflict Types */}
                    <div className="space-y-3 pt-4 border-t border-border">
                      <Label className="text-xs font-medium text-muted-foreground">{t('plot_structure.conflict_types')}</Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'internal', label: t('conflict_types.internal') },
                          { value: 'external', label: t('conflict_types.external') },
                          { value: 'both', label: t('conflict_types.both') }
                        ].map((type) => (
                          <div
                            key={type.value}
                            onClick={() => handleConflictTypeToggle(type.value)}
                            className={cn(
                              "cursor-pointer px-4 py-1.5 rounded-full border transition-all text-xs font-medium select-none",
                              conflictTypes.includes(type.value)
                                ? "bg-orange-500 text-white border-orange-500"
                                : "border-border bg-background hover:bg-muted/50 text-muted-foreground"
                            )}
                          >
                            {type.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Selectors */}
                    <div className="space-y-4 pt-4 border-t border-border">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">{t('narrative.emotional_arc')}</Label>
                            <Select value={emotionalArc} onValueChange={setEmotionalArc}>
                              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="growth">{t('emotional_arc.growth')}</SelectItem>
                                <SelectItem value="fall">{t('emotional_arc.fall')}</SelectItem>
                                <SelectItem value="awakening">{t('emotional_arc.awakening')}</SelectItem>
                                <SelectItem value="redemption">{t('emotional_arc.redemption')}</SelectItem>
                                <SelectItem value="exploration">{t('emotional_arc.exploration')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">{t('narrative.suspense_style')}</Label>
                            <Select value={suspenseStyle} onValueChange={setSuspenseStyle}>
                              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="opening">{t('suspense_style.opening')}</SelectItem>
                                <SelectItem value="middle">{t('suspense_style.middle')}</SelectItem>
                                <SelectItem value="multiple">{t('suspense_style.multiple')}</SelectItem>
                                <SelectItem value="none">{t('suspense_style.none')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                       </div>
                       <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground">{t('genre.genre')} ({t('ui.optional')})</Label>
                          <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">{t('ui.none')}</SelectItem>
                              <SelectItem value="fantasy">{t('genre.fantasy')}</SelectItem>
                              <SelectItem value="science-fiction">{t('genre.science_fiction')}</SelectItem>
                              <SelectItem value="romance">{t('genre.romance')}</SelectItem>
                              <SelectItem value="thriller">{t('genre.thriller')}</SelectItem>
                              <SelectItem value="horror">{t('genre.horror')}</SelectItem>
                              <SelectItem value="mystery">{t('genre.mystery')}</SelectItem>
                            </SelectContent>
                          </Select>
                       </div>
                    </div>
                  </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Plot History Dropdown */}
            <div className="flex justify-center">
              <PlotHistoryDropdown onLoadPlot={handleLoadPlot} locale={locale} />
            </div>

            {/* Generate Button */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleGenerateClick}
                disabled={isGenerating || !prompt.trim() || !selectedModel}
                className="w-full h-14 rounded-xl text-base font-semibold bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-500 dark:hover:bg-orange-600 disabled:opacity-60 active:scale-[0.97] transition-all"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('ui.generating')}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Icon name="sparkles" className="size-4" />
                    <span>{t('ui.generate_plot')}</span>
                  </div>
                )}
              </Button>
              <GeneratorShortcutHints showQuickSave />
            </div>
          </div>

          {/* RIGHT COLUMN: Preview */}
          <div className="space-y-4">
            <div className="relative flex lg:sticky lg:top-24 lg:self-start flex-col">
               <div className="relative flex flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden min-h-[400px] lg:min-h-[600px] max-h-[700px]">
                {generatedPlot ? (
                  <>
                    {/* Toolbar */}
                    <div className="flex justify-between items-center px-5 py-4 border-b border-border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                          <Icon name="check-circle" className="size-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{t('preview.generated_plot')}</h3>
                          <div className="text-xs text-muted-foreground/60">
                            {wordCount.toLocaleString()} {t('ui.words')}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Icon name="copy" className="size-3.5" />
                        {t('preview.button_copy')}
                      </Button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                      <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-foreground">
                        <ReactMarkdown>{generatedPlot}</ReactMarkdown>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <div className="size-20 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 border border-orange-500/20">
                      <Icon name="book-open" className="size-8 text-orange-500/50" />
                    </div>
                    <h3 className="text-base font-semibold mb-2 text-foreground">{t('preview.no_plot_generated')}</h3>
                    <p className="text-sm text-muted-foreground/60 max-w-xs leading-relaxed">
                      {t('preview.no_plot_description')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions: Generate Story from Plot */}
            {generatedPlot && currentPlotId && (
              <div className="rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row items-center justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0 border border-orange-500/20">
                      <Icon name="pen-tool" className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{t('plot_to_story.ready_to_write')}</h4>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        {t('plot_to_story.use_plot_description')}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowPlotToStoryDialog(true)}
                    className="h-10 px-6 text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-500 dark:hover:bg-orange-600 shrink-0 w-full sm:w-auto"
                  >
                    <BookOpen className="h-3.5 w-3.5 mr-1.5" /> {t('plot_to_story.generate_story')}
                  </Button>
              </div>
            )}
          </div>

        </div>

        {generatedPlot && (
          <div className="mt-10">
            <CompletionGuide
              onCreateAnother={handleCreateAnother}
              onSave={handleSaveClick}
              onContinue={() => {
                try {
                  window.localStorage.setItem(
                    "ai-write:generator-prefill",
                    JSON.stringify({ title: prompt.substring(0, 30), content: generatedPlot })
                  );
                } catch {}
                router.push(buildContinueRoute({ source: "plot-generator" }) as any);
              }}
              continueLabel={locale === "zh" ? "续写" : "Continue in AI Write"}
              isSaveDisabled={hasSavedCurrentStory}
              translations={completionGuideTranslations}
            />
          </div>
        )}

        {/* Plot to Story Dialog */}
        <PlotToStoryDialog
          plotId={currentPlotId}
          open={showPlotToStoryDialog}
          onOpenChange={setShowPlotToStoryDialog}
          translations={section}
        />
        <StorySaveDialog
          open={isSaveDialogOpen}
          onOpenChange={setIsSaveDialogOpen}
          onSelect={handleConfirmSave}
          locale={locale}
          isSaving={isSavingStory}
        />
        {/* Invisible Turnstile for non-interactive verification */}
        <TurnstileInvisible
          ref={turnstileRef}
          onSuccess={handleTurnstileSuccess}
          onError={handleTurnstileError}
        />
      </div>
    </div>
  );
}
