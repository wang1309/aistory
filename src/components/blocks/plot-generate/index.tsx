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
import { useAppContext } from "@/contexts/app";
import confetti from "canvas-confetti";
import { PlotStorage } from "@/lib/plot-storage";
import { extractPlotTitle, countPlotWords } from "@/lib/plot-prompt";
import type { PlotData } from "@/types/plot";
import type { PlotGenerate as PlotGenerateType } from "@/types/blocks/plot-generate";
import ReactMarkdown from "react-markdown";
import PlotToStoryDialog from "./plot-to-story-dialog";
import PlotHistoryDropdown from "@/components/plot-history-dropdown";
import { cn } from "@/lib/utils";
import { ChevronDown, Settings } from "lucide-react";

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
  const { setShowVerificationModal, setVerificationCallback } = useAppContext();

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

    // Set verification callback and show modal
    setVerificationCallback(() => handleVerificationSuccess);
    setShowVerificationModal(true);
  }, [prompt, selectedModel, setVerificationCallback, setShowVerificationModal, section]);

  const handleVerificationSuccess = useCallback(async (turnstileToken: string) => {
    console.log("=== Starting Plot Generation ===");
    console.log("Prompt:", prompt);
    console.log("Model:", selectedModel);

    // Get latest options from ref
    const options = plotOptionsRef.current;

    setIsGenerating(true);
    setGeneratedPlot("");
    setCurrentPlotId(null);

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

  // Computed values
  const wordCount = useMemo(() => calculateWordCount(generatedPlot), [generatedPlot]);
  const promptCharCount = prompt.length;

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

  // ========== RENDER ==========

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 lg:gap-8">

        {/* LEFT COLUMN: Parameters */}
        <div className="space-y-6">

          {/* Header */}
          <div className="space-y-3 mb-2 text-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center justify-center gap-2">
              <span>📖</span>
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                {t('ui.title')}
              </span>
            </h1>
            <p className="text-base text-muted-foreground mx-auto max-w-2xl">
              {t('ui.subtitle')}
            </p>
          </div>

          {/* Combined Input Card */}
          <Card className="p-6 space-y-4">
            {/* Story Concept */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="prompt" className="text-sm font-semibold">
                  {t('ui.story_concept')}
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRandomPrompt}
                  className="h-8 gap-1.5"
                  type="button"
                >
                  <span className="text-base">🎲</span>
                  <span className="text-xs">{t('ui.random_button')}</span>
                </Button>
              </div>
              <div className="relative">
                <Textarea
                  id="prompt"
                  placeholder={t('placeholders.story_concept')}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className={cn(
                    "min-h-[140px] text-base pr-24",
                    promptCharCount < 10 && prompt.length > 0 && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                <div className="absolute bottom-3 right-3 text-xs text-muted-foreground bg-background/90 backdrop-blur-sm px-2 py-1 rounded border">
                  <span className={cn(
                    "tabular-nums",
                    promptCharCount < 10 && prompt.length > 0 && "text-destructive font-medium"
                  )}>
                    {promptCharCount}
                  </span>
                  <span className="mx-1">/</span>
                  <span>10 min</span>
                </div>
              </div>
            </div>

            {/* AI Model & Output Language Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* AI Model */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t('ui.ai_model')}</Label>
                <Select value={selectedModel || ""} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('placeholders.select_ai_model')} />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                          <span>{model.icon}</span>
                          <span>{model.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${model.badgeColor}`}>
                            {model.badge}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Output Language */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t('ui.output_language')}</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
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
            </div>

            {/* Complexity Level */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t('ui.complexity_level')}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['simple', 'medium', 'complex'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => handleComplexityChange(level)}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all duration-200",
                      "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      complexity === level
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border hover:border-primary/50 hover:bg-accent/5'
                    )}
                  >
                    <div className="text-center">
                      <div className="font-semibold capitalize">{t(`complexity.${level}`)}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {level === 'simple' && t('complexity.simple_description')}
                        {level === 'medium' && t('complexity.medium_description')}
                        {level === 'complex' && t('complexity.complex_description')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Advanced Options with My Plot - Side by Side */}
          <div className="flex gap-3">
            <Collapsible
              open={showAdvancedOptions}
              onOpenChange={setShowAdvancedOptions}
              className="flex-1"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>{t('ui.advanced_options')}</span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      showAdvancedOptions && "rotate-180"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>

            <CollapsibleContent className="pt-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
              <Card className="p-6 space-y-6">

              {/* Character Counts */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-muted-foreground">{t('characters.main')}</Label>
                    <span className="text-sm font-semibold tabular-nums bg-primary/10 text-primary px-2.5 py-1 rounded-md">
                      {mainCharacterCount}
                    </span>
                  </div>
                  <Slider
                    value={[mainCharacterCount]}
                    onValueChange={([value]) => setMainCharacterCount(value)}
                    min={1}
                    max={3}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('ui.min')} (1)</span>
                    <span>{t('ui.max')} (3)</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-muted-foreground">{t('characters.supporting')}</Label>
                    <span className="text-sm font-semibold tabular-nums bg-primary/10 text-primary px-2.5 py-1 rounded-md">
                      {supportingCharacterCount}
                    </span>
                  </div>
                  <Slider
                    value={[supportingCharacterCount]}
                    onValueChange={([value]) => setSupportingCharacterCount(value)}
                    min={0}
                    max={5}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('ui.min')} (0)</span>
                    <span>{t('ui.max')} (5)</span>
                  </div>
                </div>
              </div>

              {/* Plot Configuration */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-muted-foreground">{t('plot_structure.plot_points')}</Label>
                    <span className="text-sm font-semibold tabular-nums bg-primary/10 text-primary px-2.5 py-1 rounded-md">
                      {plotPointCount}
                    </span>
                  </div>
                  <Slider
                    value={[plotPointCount]}
                    onValueChange={([value]) => setPlotPointCount(value)}
                    min={3}
                    max={9}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('ui.min')} (3)</span>
                    <span>{t('ui.max')} (9)</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-muted-foreground">{t('plot_structure.subplots')}</Label>
                    <span className="text-sm font-semibold tabular-nums bg-primary/10 text-primary px-2.5 py-1 rounded-md">
                      {subPlotCount}
                    </span>
                  </div>
                  <Slider
                    value={[subPlotCount]}
                    onValueChange={([value]) => setSubPlotCount(value)}
                    min={0}
                    max={3}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('ui.min')} (0)</span>
                    <span>{t('ui.max')} (3)</span>
                  </div>
                </div>
              </div>

              {/* Conflict Types */}
              <div className="space-y-2">
                <Label>{t('plot_structure.conflict_types')}</Label>
                <div className="space-y-2">
                  {[
                    { value: 'internal', label: t('conflict_types.internal') },
                    { value: 'external', label: t('conflict_types.external') },
                    { value: 'both', label: t('conflict_types.both') }
                  ].map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.value}
                        checked={conflictTypes.includes(type.value)}
                        onCheckedChange={() => handleConflictTypeToggle(type.value)}
                      />
                      <label htmlFor={type.value} className="text-sm cursor-pointer">
                        {type.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emotional Arc */}
              <div className="space-y-2">
                <Label>{t('narrative.emotional_arc')}</Label>
                <Select value={emotionalArc} onValueChange={setEmotionalArc}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="growth">{t('emotional_arc.growth')}</SelectItem>
                    <SelectItem value="fall">{t('emotional_arc.fall')}</SelectItem>
                    <SelectItem value="awakening">{t('emotional_arc.awakening')}</SelectItem>
                    <SelectItem value="redemption">{t('emotional_arc.redemption')}</SelectItem>
                    <SelectItem value="exploration">{t('emotional_arc.exploration')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Suspense Style */}
              <div className="space-y-2">
                <Label>{t('narrative.suspense_style')}</Label>
                <Select value={suspenseStyle} onValueChange={setSuspenseStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opening">{t('suspense_style.opening')}</SelectItem>
                    <SelectItem value="middle">{t('suspense_style.middle')}</SelectItem>
                    <SelectItem value="multiple">{t('suspense_style.multiple')}</SelectItem>
                    <SelectItem value="none">{t('suspense_style.none')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Optional: Genre, Tone, Perspective */}
              <div className="space-y-2">
                <Label>{t('genre.genre')} ({t('ui.optional')})</Label>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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

            </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Plot History Dropdown */}
          <PlotHistoryDropdown onLoadPlot={handleLoadPlot} locale={locale} />
        </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateClick}
            disabled={isGenerating || !prompt.trim() || !selectedModel}
            className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Icon name="loading" className="mr-2 animate-spin" />
                {t('ui.generating')} {t('ui.generate_plot')}...
              </>
            ) : (
              <>
                ✨ {t('ui.generate_plot')}
              </>
            )}
          </Button>

        </div>

        {/* RIGHT COLUMN: Preview */}
        <div className="lg:sticky lg:top-8 h-fit space-y-6">
          <Card className="p-6 min-h-[500px] max-h-[calc(100vh-200px)] flex flex-col">
            {generatedPlot ? (
              <>
                {/* Fixed Header */}
                <div className="flex justify-between items-center mb-4 pb-4 border-b flex-shrink-0">
                  <h3 className="text-lg font-semibold m-0">{t('preview.generated_plot')}</h3>
                  <div className="text-sm text-muted-foreground tabular-nums">
                    {wordCount.toLocaleString()} {t('ui.words')}
                  </div>
                </div>
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-li:my-1">
                  <ReactMarkdown>{generatedPlot}</ReactMarkdown>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4 max-w-sm">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{t('preview.no_plot_generated')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('preview.no_plot_description')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Actions: Generate Story from Plot */}
          {generatedPlot && currentPlotId && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{t('plot_to_story.ready_to_write')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('plot_to_story.use_plot_description')}
                  </p>
                </div>
                <Button
                  onClick={() => setShowPlotToStoryDialog(true)}
                  size="lg"
                >
                  📖 {t('plot_to_story.generate_story')}
                </Button>
              </div>
            </Card>
          )}
        </div>

      </div>

      {/* Plot to Story Dialog */}
      <PlotToStoryDialog
        plotId={currentPlotId}
        open={showPlotToStoryDialog}
        onOpenChange={setShowPlotToStoryDialog}
        translations={section}
      />
    </div>
  );
}
