"use client";

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
import { ChevronDown, Settings } from "lucide-react";
import TurnstileInvisible, { TurnstileInvisibleHandle } from "@/components/TurnstileInvisible";
import CompletionGuide from "@/components/story/completion-guide";
import StorySaveDialog from "@/components/story/story-save-dialog";
import type { StoryStatus } from "@/models/story";
import { useAppContext } from "@/contexts/app";

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
      icon: '⚡',
      speed: '~20s',
      description: t('ai_models.fast_description')
    },
    {
      id: 'standard',
      name: t('ai_models.standard'),
      badge: 'RECOMMENDED',
      badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      icon: '✨',
      speed: '~40s',
      description: t('ai_models.standard_description')
    },
    {
      id: 'creative',
      name: t('ai_models.creative'),
      badge: 'BEST',
      badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      icon: '🎨',
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
  const [selectedModel, setSelectedModel] = useState<string | null>('fast');
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
          fast: "gemini-2.5-flash-lite",
          standard: "gemini-2.5-flash",
          creative: "gemini-2.5-flash-think",
        };
        const actualModel = modelMap[modelKey] || "gemini-2.5-flash";

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
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground selection:bg-blue-500/30">
      {/* Premium Background Layer - Deep Space Variant */}
      <div className="fixed inset-0 -z-20 bg-noise opacity-[0.15] pointer-events-none mix-blend-overlay" />
      
      <div className="fixed inset-0 -z-30 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] right-[20%] w-[700px] h-[700px] bg-indigo-500/20 rounded-full blur-[120px] animate-blob mix-blend-multiply dark:mix-blend-screen" />
         <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-screen" />
         <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-background rounded-full blur-[150px] opacity-80" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 pt-16 pb-24 sm:pt-24 sm:pb-32 relative">
        {/* Breadcrumb Navigation */}
        <div className="mb-10 flex justify-start animate-fade-in-up">
          <div className="glass-premium px-6 py-2 rounded-full">
            <PlotBreadcrumb
              homeText={t('ui.breadcrumb_home')}
              currentText={t('ui.breadcrumb_current')}
            />
          </div>
        </div>

        {/* Header */}
        <div className="space-y-8 mb-24 text-center animate-fade-in-up animation-delay-1000">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="p-px bg-gradient-to-br from-blue-500/20 to-transparent rounded-2xl">
              <div className="glass-premium rounded-2xl p-4 bg-background/50">
                <Icon name="book-open" className="size-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <h1 className="text-6xl sm:text-8xl font-black tracking-tighter leading-[0.9]">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 dark:from-blue-200 dark:via-cyan-200 dark:to-blue-400 animate-shimmer">
              {t('ui.title')}
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground/80 max-w-2xl mx-auto font-light tracking-wide leading-relaxed">
            {t('ui.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-16">

          {/* LEFT COLUMN: Parameters */}
          <div className="space-y-12 animate-fade-in-up animation-delay-2000">

            {/* Main Config Monolith */}
            <div className="glass-premium rounded-[3rem] p-1 overflow-hidden shadow-2xl shadow-blue-500/10 dark:shadow-black/20 ring-1 ring-black/5 dark:ring-white/10">
              <div className="bg-background/40 backdrop-blur-xl rounded-[calc(3rem-4px)] p-8 sm:p-10">
                {/* Story Concept */}
                <div className="space-y-6 mb-12">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prompt" className="text-xl font-medium tracking-tight flex items-center gap-3 text-foreground">
                      <span className="flex items-center justify-center size-8 rounded-full border border-black/10 dark:border-white/10 text-xs font-serif italic text-muted-foreground">01</span>
                      {t('ui.story_concept')}
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRandomPrompt}
                      className="h-8 gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-500/10 rounded-full px-3"
                      type="button"
                    >
                      <Icon name="sparkles" className="size-3" />
                      <span className="text-xs font-bold uppercase tracking-widest">{t('ui.random_button')}</span>
                    </Button>
                  </div>
                  
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
                    <Textarea
                      id="prompt"
                      placeholder={t('placeholders.story_concept')}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="relative min-h-[200px] text-lg sm:text-xl font-light p-0 bg-transparent border-0 border-b border-black/10 dark:border-white/10 focus:border-blue-500/50 focus:ring-0 resize-y leading-relaxed placeholder:text-muted-foreground/30 text-foreground transition-all duration-300 rounded-none"
                      style={{ boxShadow: 'none' }}
                    />
                    <div className="absolute bottom-0 right-0 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                      <span className={cn(
                        "tabular-nums transition-colors",
                        promptCharCount < 10 && prompt.length > 0 && "text-red-500"
                      )}>
                        {promptCharCount}
                      </span>
                      <span className="mx-1 opacity-50">/</span>
                      <span>RECOMMENDED 50+</span>
                    </div>
                  </div>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-black/5 dark:border-white/5 pt-10">
                  {/* AI Model */}
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">{t('ui.ai_model')}</Label>
                    <Select value={selectedModel || ""} onValueChange={setSelectedModel}>
                      <SelectTrigger className="h-12 rounded-xl bg-white/40 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-colors focus:ring-0 text-foreground">
                        <SelectValue placeholder={t('placeholders.select_ai_model')} />
                      </SelectTrigger>
                      <SelectContent className="glass-premium rounded-xl bg-background/95 border-black/5 dark:border-white/10">
                        {AI_MODELS.map((model) => (
                          <SelectItem key={model.id} value={model.id} className="rounded-lg cursor-pointer focus:bg-black/5 dark:focus:bg-white/10">
                            <div className="flex items-center gap-3 py-1">
                              <span className="text-xl opacity-80">{model.icon}</span>
                              <div className="flex flex-col items-start text-left">
                                <span className="font-medium tracking-wide">{model.name}</span>
                                <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border mt-0.5 opacity-60 ${model.badgeColor}`}>
                                  {model.badge}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Output Language */}
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">{t('ui.output_language')}</Label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="h-12 rounded-xl bg-white/40 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-colors focus:ring-0 text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-premium rounded-xl bg-background/95 border-black/5 dark:border-white/10">
                        {LANGUAGE_OPTIONS.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code} className="rounded-lg cursor-pointer focus:bg-black/5 dark:focus:bg-white/10">
                            <span className="mr-3 text-lg opacity-80">{lang.flag}</span> {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Complexity Level */}
                <div className="mt-10 space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">{t('ui.complexity_level')}</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['simple', 'medium', 'complex'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => handleComplexityChange(level)}
                        className={cn(
                          "relative py-4 px-2 rounded-2xl border transition-all duration-300 overflow-hidden group",
                          complexity === level
                            ? 'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-lg'
                            : 'border-black/5 dark:border-white/5 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 text-muted-foreground'
                        )}
                      >
                        <div className="relative z-10 text-center">
                          <div className="font-bold text-xs uppercase tracking-wider mb-1">{t(`complexity.${level}`)}</div>
                          <div className="text-[9px] opacity-50 line-clamp-1 px-1 font-light tracking-wide">
                            {level === 'simple' && t('complexity.simple_description')}
                            {level === 'medium' && t('complexity.medium_description')}
                            {level === 'complex' && t('complexity.complex_description')}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur opacity-50" />
              <Collapsible
                open={showAdvancedOptions}
                onOpenChange={setShowAdvancedOptions}
                className="relative bg-background/60 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-lg"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-16 px-8 hover:bg-white/40 dark:hover:bg-white/5 group/trigger text-foreground"
                  >
                    <span className="flex items-center gap-4 font-semibold tracking-wide">
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 group-hover/trigger:text-purple-600 dark:group-hover/trigger:text-purple-400 transition-colors">
                        <Settings className="h-4 w-4" />
                      </div>
                      {t('ui.advanced_options')}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 text-muted-foreground transition-transform duration-300",
                        showAdvancedOptions && "rotate-180"
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up overflow-hidden">
                  <div className="p-8 pt-2 space-y-10 border-t border-black/5 dark:border-white/5">
                    {/* Character Counts */}
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{t('characters.main')}</Label>
                          <span className="text-xs font-bold tabular-nums text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full bg-blue-500/10">
                            {mainCharacterCount}
                          </span>
                        </div>
                        <Slider
                          value={[mainCharacterCount]}
                          onValueChange={([value]) => setMainCharacterCount(value)}
                          min={1}
                          max={3}
                          step={1}
                          className="py-2"
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{t('characters.supporting')}</Label>
                          <span className="text-xs font-bold tabular-nums text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full bg-blue-500/10">
                            {supportingCharacterCount}
                          </span>
                        </div>
                        <Slider
                          value={[supportingCharacterCount]}
                          onValueChange={([value]) => setSupportingCharacterCount(value)}
                          min={0}
                          max={5}
                          step={1}
                          className="py-2"
                        />
                      </div>
                    </div>

                    {/* Plot Config */}
                    <div className="space-y-8 pt-6 border-t border-black/5 dark:border-white/5">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{t('plot_structure.plot_points')}</Label>
                          <span className="text-xs font-bold tabular-nums text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full bg-purple-500/10">
                            {plotPointCount}
                          </span>
                        </div>
                        <Slider
                          value={[plotPointCount]}
                          onValueChange={([value]) => setPlotPointCount(value)}
                          min={3}
                          max={9}
                          step={1}
                          className="py-2"
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{t('plot_structure.subplots')}</Label>
                          <span className="text-xs font-bold tabular-nums text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full bg-purple-500/10">
                            {subPlotCount}
                          </span>
                        </div>
                        <Slider
                          value={[subPlotCount]}
                          onValueChange={([value]) => setSubPlotCount(value)}
                          min={0}
                          max={3}
                          step={1}
                          className="py-2"
                        />
                      </div>
                    </div>

                    {/* Conflict Types */}
                    <div className="space-y-4 pt-6 border-t border-black/5 dark:border-white/5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{t('plot_structure.conflict_types')}</Label>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { value: 'internal', label: t('conflict_types.internal') },
                          { value: 'external', label: t('conflict_types.external') },
                          { value: 'both', label: t('conflict_types.both') }
                        ].map((type) => (
                          <div
                            key={type.value}
                            onClick={() => handleConflictTypeToggle(type.value)}
                            className={cn(
                              "cursor-pointer px-5 py-2 rounded-full border transition-all text-xs font-bold uppercase tracking-wide select-none",
                              conflictTypes.includes(type.value)
                                ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                                : "bg-white/40 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 text-muted-foreground"
                            )}
                          >
                            {type.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Selectors */}
                    <div className="space-y-6 pt-6 border-t border-black/5 dark:border-white/5">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{t('narrative.emotional_arc')}</Label>
                            <Select value={emotionalArc} onValueChange={setEmotionalArc}>
                              <SelectTrigger className="h-10 rounded-lg bg-white/40 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 focus:ring-0 text-foreground"><SelectValue /></SelectTrigger>
                              <SelectContent className="glass-premium rounded-xl bg-background/95 border-black/5 dark:border-white/10">
                                <SelectItem value="growth">{t('emotional_arc.growth')}</SelectItem>
                                <SelectItem value="fall">{t('emotional_arc.fall')}</SelectItem>
                                <SelectItem value="awakening">{t('emotional_arc.awakening')}</SelectItem>
                                <SelectItem value="redemption">{t('emotional_arc.redemption')}</SelectItem>
                                <SelectItem value="exploration">{t('emotional_arc.exploration')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{t('narrative.suspense_style')}</Label>
                            <Select value={suspenseStyle} onValueChange={setSuspenseStyle}>
                              <SelectTrigger className="h-10 rounded-lg bg-white/40 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 focus:ring-0 text-foreground"><SelectValue /></SelectTrigger>
                              <SelectContent className="glass-premium rounded-xl bg-background/95 border-black/5 dark:border-white/10">
                                <SelectItem value="opening">{t('suspense_style.opening')}</SelectItem>
                                <SelectItem value="middle">{t('suspense_style.middle')}</SelectItem>
                                <SelectItem value="multiple">{t('suspense_style.multiple')}</SelectItem>
                                <SelectItem value="none">{t('suspense_style.none')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{t('genre.genre')} ({t('ui.optional')})</Label>
                          <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                            <SelectTrigger className="h-10 rounded-lg bg-white/40 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 focus:ring-0 text-foreground"><SelectValue /></SelectTrigger>
                            <SelectContent className="glass-premium rounded-xl bg-background/95 border-black/5 dark:border-white/10">
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
            </div>

            {/* Plot History Dropdown */}
            <div className="flex justify-center">
               <PlotHistoryDropdown onLoadPlot={handleLoadPlot} locale={locale} />
            </div>

            {/* Generate Button */}
            <div className="pt-4">
              <div className="relative group w-full">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-500 animate-pulse-glow" />
                <Button
                  onClick={handleGenerateClick}
                  disabled={isGenerating || !prompt.trim() || !selectedModel}
                  className="relative w-full h-16 rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:from-blue-500 hover:via-cyan-400 hover:to-teal-300 text-white text-xl font-bold shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-none"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-3">
                      <div className="size-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="animate-pulse">{t('ui.generating')}...</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-3">
                      <Icon name="sparkles" className="size-6 animate-pulse" />
                      {t('ui.generate_plot')}
                    </span>
                  )}
                </Button>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Preview */}
          <div className="space-y-6 animate-fade-in-up animation-delay-2000">
            <div className="relative h-[800px] flex flex-col">
               <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-[3rem] blur-xl opacity-50" />
               <div className="relative flex-1 flex flex-col p-0 glass-premium rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                {generatedPlot ? (
                  <>
                    {/* Toolbar */}
                    <div className="flex justify-between items-center p-8 border-b border-black/5 dark:border-white/5 bg-white/40 dark:bg-white/5">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                          <Icon name="check-circle" className="size-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold tracking-tight text-foreground">{t('preview.generated_plot')}</h3>
                          <div className="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest">
                            {wordCount.toLocaleString()} {t('ui.words')}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="hover:bg-white/60 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground rounded-full"
                      >
                        <Icon name="copy" className="size-4 mr-2" />
                        {t('preview.button_copy')}
                      </Button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 sm:p-12 custom-scrollbar bg-white/20 dark:bg-background/30">
                      <div className="prose prose-lg dark:prose-invert max-w-none font-serif leading-loose tracking-wide text-foreground">
                        <ReactMarkdown>{generatedPlot}</ReactMarkdown>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <div className="size-32 rounded-full bg-blue-500/10 flex items-center justify-center mb-8 ring-1 ring-blue-500/20 animate-pulse-glow">
                      <Icon name="book-open" className="size-12 text-blue-500/50" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 tracking-tight text-foreground">{t('preview.no_plot_generated')}</h3>
                    <p className="text-muted-foreground/60 max-w-xs font-light leading-relaxed">
                      {t('preview.no_plot_description')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions: Generate Story from Plot */}
            {generatedPlot && currentPlotId && (
              <div className="relative group animate-slide-up">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-[2rem] blur opacity-50 group-hover:opacity-75 transition duration-500" />
                <div className="relative p-8 flex flex-col sm:flex-row items-center justify-between gap-8 glass-premium rounded-[2rem] bg-background/80">
                  <div className="flex items-start gap-5">
                    <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 border border-purple-500/20">
                      <Icon name="pen-tool" className="size-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg tracking-tight text-foreground">{t('plot_to_story.ready_to_write')}</h4>
                      <p className="text-sm text-muted-foreground/80 mt-1 font-light">
                        {t('plot_to_story.use_plot_description')}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowPlotToStoryDialog(true)}
                    size="lg"
                    className="rounded-full px-10 h-14 font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shrink-0 w-full sm:w-auto text-base"
                  >
                    📖 {t('plot_to_story.generate_story')}
                  </Button>
                </div>
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
