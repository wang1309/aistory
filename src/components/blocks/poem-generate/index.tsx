"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Icon from "@/components/icon";
import { toast } from "sonner";
import { PoemGenerate as PoemGenerateType } from "@/types/blocks/poem-generate";
import { useLocale } from "next-intl";
import { useAppContext } from "@/contexts/app";
import confetti from "canvas-confetti";
import { PoemStorage } from "@/lib/poem-storage";
import { getDefaultOptions, getRecommendedModel, getSavedMode, saveMode } from "@/lib/poem-defaults";
import { ModeToggle } from "@/components/blocks/poem-generate/mode-toggle";
import type { PoemData, PoemAnalysis } from "@/types/poem";
import ReactMarkdown from "react-markdown";
import PoemHistoryDropdown from "@/components/poem-history-dropdown";

// ========== HELPER FUNCTIONS ==========

/**
 * Calculate line count for poem
 */
function calculateLineCount(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.split('\n').filter(line => line.trim()).length;
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

// ========== COMPONENT ==========

export default function PoemGenerate({ section }: { section: PoemGenerateType }) {
  const locale = useLocale();
  const { user, setShowVerificationModal, setVerificationCallback } = useAppContext();

  // ===== MEMOIZED CONSTANTS =====
  const RANDOM_PROMPTS = useMemo(() => section.random_prompts, [section]);
  const LANGUAGE_OPTIONS = useMemo(() => section.prompt.language_options, [section]);

  const QUICK_ADD_EMOTIONS = useMemo(() => section.prompt.quick_add_chips.emotions, [section]);
  const QUICK_ADD_IMAGERY = useMemo(() => section.prompt.quick_add_chips.imagery, [section]);
  const QUICK_ADD_SCENES = useMemo(() => section.prompt.quick_add_chips.scenes, [section]);

  const AI_MODELS = useMemo(() => [
    {
      id: 'fast',
      name: section.ai_models.models.fast.name,
      badge: section.ai_models.models.fast.badge,
      badgeColor: 'bg-green-500/10 text-green-600 border-green-500/30',
      icon: '⚡',
      speed: section.ai_models.models.fast.speed,
      description: section.ai_models.models.fast.description
    },
    {
      id: 'standard',
      name: section.ai_models.models.standard.name,
      badge: section.ai_models.models.standard.badge,
      badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      icon: '✒️',
      speed: section.ai_models.models.standard.speed,
      description: section.ai_models.models.standard.description
    },
    {
      id: 'creative',
      name: section.ai_models.models.creative.name,
      badge: section.ai_models.models.creative.badge,
      badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      icon: '🎨',
      speed: section.ai_models.models.creative.speed,
      description: section.ai_models.models.creative.description
    }
  ], [section]);

  // ===== STATE MANAGEMENT =====

  // Mode state (Simple vs Advanced)
  const [advancedMode, setAdvancedMode] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState(locale);
  const [selectedPoemType, setSelectedPoemType] = useState<'modern' | 'classical' | 'format' | 'lyric'>('format');

  // Poem options
  const [selectedLength, setSelectedLength] = useState("medium");
  const [selectedRhymeScheme, setSelectedRhymeScheme] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  // Classical poetry options
  const [selectedCipai, setSelectedCipai] = useState<string | null>(null);
  const [strictTone, setStrictTone] = useState(true);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPoem, setGeneratedPoem] = useState("");
  const [isFirstGeneration, setIsFirstGeneration] = useState(true);

  // Output tabs
  const [activeOutputTab, setActiveOutputTab] = useState("poem");

  // Analysis state
  const [poemAnalysis, setPoemAnalysis] = useState<PoemAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Audio/TTS state
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState(1.0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Use ref to store latest options to avoid stale closure
  const optionsRef = useRef({
    poemType: 'modern' as 'modern' | 'classical' | 'format' | 'lyric',
    length: 'medium',
    rhymeScheme: null as string | null,
    theme: null as string | null,
    mood: null as string | null,
    style: null as string | null,
    language: locale,
    cipai: null as string | null,
    strictTone: true
  });

  // Load saved mode preference on mount
  useEffect(() => {
    const saved = getSavedMode();
    setAdvancedMode(saved);
  }, []);

  // Save mode preference when changed
  useEffect(() => {
    saveMode(advancedMode);
  }, [advancedMode]);

  // Apply smart defaults when poem type changes in Simple Mode
  useEffect(() => {
    if (!advancedMode) {
      const defaults = getDefaultOptions(selectedPoemType);
      setSelectedLength(defaults.length);
      setSelectedRhymeScheme(defaults.rhymeScheme);
      setSelectedTheme(defaults.theme);
      setSelectedMood(defaults.mood);
      setSelectedStyle(defaults.style);
      setSelectedCipai(defaults.cipai);
      setStrictTone(defaults.strictTone);

      // Auto-select recommended model if no model selected
      if (!selectedModel) {
        setSelectedModel(getRecommendedModel(selectedPoemType));
      }
    }
  }, [selectedPoemType, advancedMode]);

  // Update ref whenever options change
  useEffect(() => {
    optionsRef.current = {
      poemType: selectedPoemType,
      length: selectedLength,
      rhymeScheme: selectedRhymeScheme,
      theme: selectedTheme,
      mood: selectedMood,
      style: selectedStyle,
      language: selectedLanguage,
      cipai: selectedCipai,
      strictTone: strictTone
    };
  }, [selectedPoemType, selectedLength, selectedRhymeScheme, selectedTheme, selectedMood, selectedStyle, selectedLanguage, selectedCipai, strictTone]);

  // ===== EVENT HANDLERS =====

  const handleRandomPrompt = useCallback(() => {
    const randomPrompt = RANDOM_PROMPTS[Math.floor(Math.random() * RANDOM_PROMPTS.length)];
    setPrompt(randomPrompt);
  }, [RANDOM_PROMPTS]);

  const handleQuickAdd = useCallback((text: string) => {
    setPrompt(prev => {
      if (!prev.trim()) return text;
      return prev.endsWith('\n') || prev.endsWith(' ') ? `${prev}${text}` : `${prev} ${text}`;
    });
  }, []);

  const handleCopyPoem = useCallback(async () => {
    const success = await copyToClipboard(generatedPoem);
    if (success) {
      toast.success(section.toasts.success_copied);
    }
  }, [generatedPoem, section]);

  const handleAnalyzePoem = useCallback(async () => {
    console.log("=== Analyze Poem Button Clicked ===");

    if (!generatedPoem.trim()) {
      toast.error(section.toasts.error_generate_poem_first);
      return;
    }

    setIsAnalyzing(true);
    setActiveOutputTab("analysis");

    try {
      const requestBody = {
        poemContent: generatedPoem,
        poemType: optionsRef.current.poemType,
        locale: optionsRef.current.language
      };

      console.log("Analysis request:", requestBody);

      const response = await fetch("/api/poem-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Analysis API Error:", errorText);
        toast.error(section.toasts.error_analyze_failed);
        return;
      }

      const result = await response.json();
      console.log("Analysis result:", result);

      if (result.success && result.analysis) {
        setPoemAnalysis(result.analysis);
        toast.success(section.toasts.success_analyzed);
      } else {
        toast.error(section.toasts.error_analyze_failed);
      }

    } catch (error) {
      console.error("Analysis error:", error);
      toast.error(section.toasts.error_analyze_failed);
    } finally {
      setIsAnalyzing(false);
    }
  }, [generatedPoem, section]);

  // ===== AUDIO/TTS FUNCTIONS =====

  const handleStartReading = useCallback(() => {
    if (!generatedPoem.trim()) {
      toast.error(section.toasts.error_generate_poem_first);
      return;
    }

    // Check browser support
    if (!('speechSynthesis' in window)) {
      toast.error(section.audio.browser_not_supported);
      return;
    }

    // Stop any ongoing speech
    speechSynthesis.cancel();

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(generatedPoem);
    utterance.rate = readingSpeed;
    utterance.lang = selectedLanguage === 'zh' ? 'zh-CN' : selectedLanguage === 'ja' ? 'ja-JP' : selectedLanguage === 'ko' ? 'ko-KR' : 'en-US';

    utterance.onend = () => {
      setIsReading(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.error("Speech synthesis error:", e);
      toast.error(section.audio.tts_failed);
      setIsReading(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
    setIsReading(true);
    setIsPaused(false);
    setActiveOutputTab("audio");
  }, [generatedPoem, readingSpeed, selectedLanguage]);

  const handlePauseReading = useCallback(() => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const handleResumeReading = useCallback(() => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const handleStopReading = useCallback(() => {
    speechSynthesis.cancel();
    setIsReading(false);
    setIsPaused(false);
    utteranceRef.current = null;
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    setReadingSpeed(speed);
    // If currently reading, restart with new speed
    if (isReading) {
      handleStopReading();
      // Small delay to ensure stop completes
      setTimeout(() => {
        handleStartReading();
      }, 100);
    }
  }, [isReading, handleStopReading, handleStartReading]);

  // ===== LOAD POEM FROM HISTORY =====

  const handleLoadPoem = useCallback((poem: PoemData) => {
    // Restore form parameters
    setPrompt(poem.prompt);
    setGeneratedPoem(poem.content);
    setSelectedModel(poem.model);
    setSelectedPoemType(poem.poemType);
    setSelectedLength(poem.length);
    setSelectedLanguage(poem.locale || locale);

    // Restore optional parameters
    if (poem.rhymeScheme) setSelectedRhymeScheme(poem.rhymeScheme);
    else setSelectedRhymeScheme(null);

    if (poem.theme) setSelectedTheme(poem.theme);
    else setSelectedTheme(null);

    if (poem.mood) setSelectedMood(poem.mood);
    else setSelectedMood(null);

    if (poem.style) setSelectedStyle(poem.style);
    else setSelectedStyle(null);

    // Restore classical poetry parameters
    if (poem.classicalOptions) {
      setSelectedCipai(poem.classicalOptions.cipaiName || null);
      setStrictTone(poem.classicalOptions.strictTone ?? true);
    } else {
      setSelectedCipai(null);
      setStrictTone(true);
    }

    // Switch to poem tab
    setActiveOutputTab("poem");

    // Reset analysis since it's not saved with the poem
    setPoemAnalysis(null);

    // Success toast
    toast.success(section.toasts.success_loaded);
  }, [locale, section]);

  // ===== POEM GENERATION =====

  const handleGenerate = useCallback(async () => {
    console.log("=== Generate Poem Button Clicked ===");

    // Validation
    if (!prompt.trim()) {
      toast.error(section.toasts.error_no_prompt);
      return;
    }

    if (!selectedModel) {
      toast.error(section.toasts.error_no_model);
      return;
    }

    // Get latest options from ref
    const currentOptions = optionsRef.current;
    console.log("Current options:", currentOptions);

    // Turnstile verification callback
    const performGeneration = async (turnstileToken: string) => {
      console.log("=== Starting Poem Generation ===");
      setIsGenerating(true);
      setGeneratedPoem("");
      setActiveOutputTab("poem");

      try {
        // Build classical options if needed
        const classicalOptions = currentOptions.poemType === 'classical' ? {
          form: currentOptions.rhymeScheme || '七言绝句',
          cipaiName: currentOptions.cipai || undefined,
          strictTone: currentOptions.strictTone
        } : undefined;

        const requestBody = {
          prompt: prompt.trim(),
          model: selectedModel,
          locale: currentOptions.language,
          poemType: currentOptions.poemType,
          length: currentOptions.length,
          rhymeScheme: currentOptions.rhymeScheme,
          theme: currentOptions.theme,
          mood: currentOptions.mood,
          style: currentOptions.style,
          classicalOptions,
          turnstileToken
        };

        console.log("Request body:", JSON.stringify(requestBody, null, 2));

        const response = await fetch("/api/poem-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", errorText);
          toast.error(section.toasts.error_generate_failed);
          return;
        }

        if (!response.body) {
          toast.error(section.toasts.error_no_stream);
          return;
        }

        // Process streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedPoem = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith('0:"')) {
              const content = line.slice(3, -1)
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\t/g, '\t')
                .replace(/\\r/g, '\r')
                .replace(/\\\\/g, '\\');

              accumulatedPoem += content;
              setGeneratedPoem(accumulatedPoem);
            }
          }
        }

        if (!accumulatedPoem.trim()) {
          toast.error(section.toasts.error_no_content);
          return;
        }

        // Success!
        toast.success(section.toasts.success_generated);

        // Confetti on first generation
        if (isFirstGeneration) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
          setIsFirstGeneration(false);
        }

        // Save to localStorage
        try {
          PoemStorage.savePoem({
            prompt: prompt.trim(),
            content: accumulatedPoem,
            model: selectedModel,
            poemType: currentOptions.poemType,
            length: currentOptions.length as 'short' | 'medium' | 'long',
            rhymeScheme: currentOptions.rhymeScheme || undefined,
            theme: currentOptions.theme || undefined,
            mood: currentOptions.mood || undefined,
            style: currentOptions.style || undefined,
            classicalOptions,
            locale: currentOptions.language
          });
        } catch (err) {
          console.error("Failed to save poem:", err);
        }

      } catch (error) {
        console.error("Generation error:", error);
        toast.error(section.toasts.error_generate_failed);
      } finally {
        setIsGenerating(false);
      }
    };

    // Show Turnstile verification modal
    setVerificationCallback(() => performGeneration);
    setShowVerificationModal(true);
  }, [prompt, selectedModel, isFirstGeneration, section, setVerificationCallback, setShowVerificationModal]);

  // ===== RENDER =====

  const characterCount = prompt.length;
  const maxCharacters = 2000;
  const lineCount = calculateLineCount(generatedPoem);

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {section.header.title}
          </h1>
          <ModeToggle
            advancedMode={advancedMode}
            onToggle={setAdvancedMode}
            labels={section.mode}
          />
        </div>
        <p className="text-xl text-muted-foreground">
          {section.header.subtitle}
        </p>
      </div>

      {/* Main Content - Single Column */}
      <div className="space-y-8">

        {/* Poem Type Tabs */}
        <div className="space-y-3">
          <Tabs value={selectedPoemType} onValueChange={(v) => setSelectedPoemType(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-4 gap-2 h-auto p-1 bg-muted">
              <TabsTrigger value="modern" className="text-sm py-3 data-[state=active]:bg-background">
                {section.poem_types.tabs.modern.name}
              </TabsTrigger>
              <TabsTrigger value="classical" className="text-sm py-3 data-[state=active]:bg-background">
                {section.poem_types.tabs.classical.name}
              </TabsTrigger>
              <TabsTrigger value="format" className="text-sm py-3 data-[state=active]:bg-background">
                {section.poem_types.tabs.format.name}
              </TabsTrigger>
              <TabsTrigger value="lyric" className="text-sm py-3 data-[state=active]:bg-background">
                {section.poem_types.tabs.lyric.name}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-sm text-muted-foreground text-center">
            {selectedPoemType === 'modern' && section.poem_types.tabs.modern.description}
            {selectedPoemType === 'classical' && section.poem_types.tabs.classical.description}
            {selectedPoemType === 'format' && section.poem_types.tabs.format.description}
            {selectedPoemType === 'lyric' && section.poem_types.tabs.lyric.description}
          </p>
        </div>

        {/* Format Options - Only shown when Format tab is selected */}
        {selectedPoemType === 'format' && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">{section.options.rhyme_scheme.label}</Label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              {Object.entries(section.options.rhyme_scheme.format_options).map(([key, label]) => (
                <Button
                  key={key}
                  variant={selectedRhymeScheme === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRhymeScheme(key)}
                  className="text-xs h-8 whitespace-nowrap flex-shrink-0"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Prompt Input Section */}
        <div className="space-y-3">
            <Label htmlFor="poem-prompt" className="text-base font-semibold flex items-center gap-2">
              {section.prompt.label}
              <span className="text-xs text-red-500">{section.prompt.required}</span>
            </Label>
            <Textarea
              id="poem-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={section.prompt.placeholder}
              className="min-h-[200px] resize-none text-base"
              maxLength={maxCharacters}
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRandomPrompt}
                className="gap-2"
              >
                <Icon name="Sparkles" className="w-4 h-4" />
                {section.prompt.random_button}
              </Button>
              <span>
                {section.prompt.character_counter
                  .replace('{current}', String(characterCount))
                  .replace('{max}', String(maxCharacters))}
              </span>
            </div>
          </div>

        {/* Quick Add Chips - Horizontal Scroll */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{section.prompt.quick_adds_label}</Label>
          <div className="relative">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              {[...QUICK_ADD_EMOTIONS, ...QUICK_ADD_IMAGERY, ...QUICK_ADD_SCENES].map((item, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdd(item)}
                  className="text-xs h-8 whitespace-nowrap flex-shrink-0"
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Model Selection + Language - Horizontal Layout */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">{section.ai_models.title}</Label>
            <div className="flex items-center gap-2">
              <Label htmlFor="output-language" className="text-sm font-medium">
                {section.prompt.language_label}
              </Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger id="output-language" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGE_OPTIONS).map(([code, lang]) => (
                    <SelectItem key={code} value={code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.native}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* AI Models - 3 Column Grid */}
          <div className="grid grid-cols-3 gap-3">
            {AI_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  selectedModel === model.id
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{model.icon}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${model.badgeColor}`}>
                      {model.badge}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm mb-1">{model.name}</div>
                    <div className="text-xs text-muted-foreground mb-2">{model.description}</div>
                    <div className="text-xs text-muted-foreground">{model.speed}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Mode Options - Collapsible */}
        {advancedMode && (
          <div className="space-y-4 p-6 border rounded-lg bg-muted/30">
            <Label className="text-base font-semibold">{section.options.title}</Label>
            <p className="text-sm text-muted-foreground -mt-2">{section.options.subtitle}</p>

            <div className="grid grid-cols-2 gap-4">
              {/* Length */}
              <div className="space-y-2">
                <Label htmlFor="poem-length" className="text-sm">{section.options.length.label}</Label>
                <Select value={selectedLength} onValueChange={setSelectedLength}>
                  <SelectTrigger id="poem-length">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">{section.options.length.options.short}</SelectItem>
                    <SelectItem value="medium">{section.options.length.options.medium}</SelectItem>
                    <SelectItem value="long">{section.options.length.options.long}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Theme */}
              <div className="space-y-2">
                <Label htmlFor="theme" className="text-sm">{section.options.theme.label}</Label>
                <Select value={selectedTheme || "none"} onValueChange={(v) => setSelectedTheme(v === "none" ? null : v)}>
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{section.options.theme.none_option}</SelectItem>
                    <SelectItem value="love">{section.options.theme.options.love}</SelectItem>
                    <SelectItem value="nature">{section.options.theme.options.nature}</SelectItem>
                    <SelectItem value="philosophy">{section.options.theme.options.philosophy}</SelectItem>
                    <SelectItem value="inspiration">{section.options.theme.options.inspiration}</SelectItem>
                    <SelectItem value="life">{section.options.theme.options.life}</SelectItem>
                    <SelectItem value="nostalgia">{section.options.theme.options.nostalgia}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mood */}
              <div className="space-y-2">
                <Label htmlFor="mood" className="text-sm">{section.options.mood.label}</Label>
                <Select value={selectedMood || "none"} onValueChange={(v) => setSelectedMood(v === "none" ? null : v)}>
                  <SelectTrigger id="mood">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{section.options.mood.none_option}</SelectItem>
                    <SelectItem value="joyful">{section.options.mood.options.joyful}</SelectItem>
                    <SelectItem value="melancholic">{section.options.mood.options.melancholic}</SelectItem>
                    <SelectItem value="passionate">{section.options.mood.options.passionate}</SelectItem>
                    <SelectItem value="peaceful">{section.options.mood.options.peaceful}</SelectItem>
                    <SelectItem value="romantic">{section.options.mood.options.romantic}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Style */}
              <div className="space-y-2">
                <Label htmlFor="style" className="text-sm">{section.options.style.label}</Label>
                <Select value={selectedStyle || "none"} onValueChange={(v) => setSelectedStyle(v === "none" ? null : v)}>
                  <SelectTrigger id="style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{section.options.style.none_option}</SelectItem>
                    <SelectItem value="romantic">{section.options.style.options.romantic}</SelectItem>
                    <SelectItem value="realism">{section.options.style.options.realism}</SelectItem>
                    <SelectItem value="symbolism">{section.options.style.options.symbolism}</SelectItem>
                    <SelectItem value="minimalism">{section.options.style.options.minimalism}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* History Dropdown */}
        <div className="flex justify-end">
          <PoemHistoryDropdown
            onLoadPoem={handleLoadPoem}
            locale={locale}
          />
        </div>

        {/* Generate Button - Large and Prominent */}
        <div className="space-y-4">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedModel}
            className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                {section.generate_button.generating}
              </>
            ) : (
              <>
                <Icon name="Sparkles" className="w-6 h-6 mr-2" />
                {section.generate_button.text}
              </>
            )}
          </Button>
          <p className="text-sm text-center text-muted-foreground">{section.generate_button.tip}</p>
        </div>

      </div>

      {/* Output Section - Separated with visual break */}
      {generatedPoem && (
        <>
          <div className="my-12 border-t-2"></div>
          <div className="border rounded-lg bg-card shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">{section.output.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {section.output.line_count.replace('{count}', String(lineCount))}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPoem}
                    className="gap-2"
                  >
                    <Icon name="Copy" className="w-4 h-4" />
                    {section.output.button_copy}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAnalyzePoem}
                    disabled={isAnalyzing}
                    className="gap-2"
                  >
                    {isAnalyzing ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>{section.output.button_analyzing}</>
                    ) : (
                      <><Icon name="Search" className="w-4 h-4" />{section.output.button_analyze}</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeOutputTab} onValueChange={setActiveOutputTab} className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                  <TabsTrigger
                    value="poem"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    {section.output.tabs.poem}
                  </TabsTrigger>
                  <TabsTrigger
                    value="analysis"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    {section.output.tabs.analysis}
                  </TabsTrigger>
                  <TabsTrigger
                    value="audio"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    {section.output.tabs.audio}
                  </TabsTrigger>
                </TabsList>

                {/* Poem Tab */}
                <TabsContent value="poem" className="p-6 mt-0">
                  <div className="prose prose-sm max-w-none dark:prose-invert font-serif prose-p:leading-relaxed prose-headings:font-serif prose-strong:text-foreground prose-em:text-foreground/90">
                    <ReactMarkdown>{generatedPoem}</ReactMarkdown>
                  </div>
                </TabsContent>

                {/* Analysis Tab */}
                <TabsContent value="analysis" className="p-6 mt-0">
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center gap-3 py-12">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="text-muted-foreground">{section.analysis.loading}</span>
                    </div>
                  ) : poemAnalysis ? (
                    <div className="space-y-6">
                      {/* Imagery Analysis */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Icon name="Image" className="w-4 h-4" />
                          {section.analysis.imagery.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">{section.analysis.imagery.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {poemAnalysis.imagery.map((img, idx) => {
                            // Handle both object and string formats
                            const imageText = typeof img === 'string' ? img : img.image;
                            const significance = typeof img === 'object' && img.significance ? img.significance : null;

                            return (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                                title={significance || undefined}
                              >
                                {imageText}
                                {significance && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({significance})
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Rhyme Analysis */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Icon name="Music" className="w-4 h-4" />
                          {section.analysis.rhyme.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">{section.analysis.rhyme.description}</p>
                        <p className="text-sm leading-relaxed">{poemAnalysis.rhymeAnalysis}</p>
                      </div>

                      {/* Rhetorical Devices */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Icon name="Sparkles" className="w-4 h-4" />
                          {section.analysis.rhetoric.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">{section.analysis.rhetoric.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {poemAnalysis.rhetoricalDevices.map((device, idx) => (
                            <span key={idx} className="px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-sm">
                              {device}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Emotional Tone */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Icon name="Heart" className="w-4 h-4" />
                          {section.analysis.emotion.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">{section.analysis.emotion.description}</p>
                        <p className="text-sm leading-relaxed">{poemAnalysis.emotionalTone}</p>
                      </div>

                      {/* Theme Interpretation */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Icon name="BookOpen" className="w-4 h-4" />
                          {section.analysis.theme.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">{section.analysis.theme.description}</p>
                        <p className="text-sm leading-relaxed">{poemAnalysis.themeInterpretation}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Icon name="Search" className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>{section.analysis.no_analysis}</p>
                    </div>
                  )}
                </TabsContent>

                {/* Audio Tab */}
                <TabsContent value="audio" className="p-6 mt-0">
                  {'speechSynthesis' in window ? (
                    <div className="space-y-6">
                      {/* Controls */}
                      <div className="flex flex-col items-center gap-4">
                        {!isReading ? (
                          <Button
                            onClick={handleStartReading}
                            disabled={!generatedPoem.trim()}
                            className="w-full max-w-xs h-12 text-base font-semibold"
                            size="lg"
                          >
                            <Icon name="Volume2" className="w-5 h-5 mr-2" />
                            {section.audio.player.play}
                          </Button>
                        ) : (
                          <div className="flex gap-3 w-full max-w-xs">
                            {isPaused ? (
                              <Button
                                onClick={handleResumeReading}
                                className="flex-1 h-12"
                                size="lg"
                              >
                                <Icon name="Play" className="w-5 h-5 mr-2" />
                                {section.audio.player.resume}
                              </Button>
                            ) : (
                              <Button
                                onClick={handlePauseReading}
                                className="flex-1 h-12"
                                size="lg"
                                variant="outline"
                              >
                                <Icon name="Pause" className="w-5 h-5 mr-2" />
                                {section.audio.player.pause}
                              </Button>
                            )}
                            <Button
                              onClick={handleStopReading}
                              className="flex-1 h-12"
                              size="lg"
                              variant="outline"
                            >
                              <Icon name="Square" className="w-5 h-5 mr-2" />
                              {section.audio.player.stop}
                            </Button>
                          </div>
                        )}

                        {/* Status indicator */}
                        {isReading && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="animate-pulse w-2 h-2 rounded-full bg-primary"></div>
                            <span>{isPaused ? section.audio.player.status_paused : section.audio.player.status_reading}</span>
                          </div>
                        )}
                      </div>

                      {/* Speed control */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">{section.audio.player.speed_label}</Label>
                        <div className="flex gap-2 flex-wrap">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                            <Button
                              key={speed}
                              variant={readingSpeed === speed ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleSpeedChange(speed)}
                              className="text-xs"
                            >
                              {speed}x
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Icon name="Volume2" className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>{section.audio.browser_not_supported}</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
        </>
      )}

      {/* Generation Status */}
      {isGenerating && (
        <div className="flex items-center justify-center gap-3 py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">{section.output.status_writing}</span>
        </div>
      )}
    </div>
  );
}
