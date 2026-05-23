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
import { ChevronDown, Settings, Zap, Sparkles, Palette, BookOpen } from "lucide-react";
import TurnstileInvisible, { TurnstileInvisibleHandle } from "@/components/TurnstileInvisible";
import CompletionGuide from "@/components/story/completion-guide";
import StorySaveDialog from "@/components/story/story-save-dialog";
import { GeneratorShortcutHints } from "@/components/generator-shortcut-hints";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
import type { StoryStatus } from "@/models/story";
import { useAppContext } from "@/contexts/app";
import { useGeneratorShortcuts } from "@/hooks/useGeneratorShortcuts";

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
      badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      icon: <Sparkles className="h-4 w-4" />,
      speed: '~40s',
      description: t('ai_models.standard_description')
    },
    {
      id: 'creative',
      name: t('ai_models.creative'),
      badge: 'BEST',
      badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      icon: <Palette className="h-4 w-4" />,
      speed: '~60s',
      description: t('ai_models.creative_description')
    }
  ], [section]);

  // ========== LANGUAGE OPTIONS ==========
  const LANGUAGE_OPTIONS = useMemo(() => [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' }
  ], []);

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

      <div className="relative mx-auto w-full max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-8">
          <PlotBreadcrumb
            homeText={t('ui.breadcrumb_home')}
            currentText={t('ui.breadcrumb_current')}
          />
        </div>

        {/* Header */}
        <div className="mt-8 mx-auto max-w-3xl text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
            {t('ui.title')}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {t('ui.subtitle')}
          </p>
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
                className="w-full h-14 rounded-xl text-base font-semibold bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-500 dark:hover:bg-orange-600 disabled:opacity-60 transition-colors"
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
            <div className="relative h-[700px] flex flex-col">
               <div className="relative flex-1 flex flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
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
