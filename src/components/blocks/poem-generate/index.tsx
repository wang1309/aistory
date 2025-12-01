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
import PoemHistoryDropdown from "@/components/poem-history-dropdown";
import PoemBreadcrumb from "./breadcrumb";
import { cn } from "@/lib/utils";
import TurnstileInvisible, { TurnstileInvisibleHandle } from "@/components/TurnstileInvisible";
import CompletionGuide from "@/components/story/completion-guide";
import StorySaveDialog from "@/components/story/story-save-dialog";
import type { StoryStatus } from "@/models/story";

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

  // Save dialog state
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSavingStory, setIsSavingStory] = useState(false);
  const [hasSavedCurrentPoem, setHasSavedCurrentPoem] = useState(false);

  // Output tabs
  const [activeOutputTab, setActiveOutputTab] = useState("poem");

  // Analysis state
  const [poemAnalysis, setPoemAnalysis] = useState<PoemAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Audio/TTS state
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState(1.0);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Turnstile state
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);

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

  // Detect speech synthesis support on client only
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setHasSpeechSupport(true);
    }
  }, []);

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
    toast.success(section.toasts.success_generated);
  }, [locale, section]);

  // Handle Turnstile verification
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

    // Start loading state while Turnstile verification is in progress
    setIsGenerating(true);

    // Trigger invisible Turnstile verification
    // After verification succeeds, handleTurnstileSuccess will be called automatically
    turnstileRef.current?.execute();
  }, [prompt, selectedModel, section]);

  // Perform poem generation
  const performGeneration = useCallback(async (turnstileToken: string) => {
    console.log("=== Starting Poem Generation ===");

    // Get latest options from ref
    const currentOptions = optionsRef.current;

    setIsGenerating(true);
    setGeneratedPoem("");
    setActiveOutputTab("poem");
    setHasSavedCurrentPoem(false);

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

      // Read the entire response as text and extract poem chunks.
      // This is more robust than client-side streaming and ensures we always
      // set generatedPoem when the API returns content.
      const rawText = await response.text();
      console.log("Raw poem response (first 300 chars):", rawText.slice(0, 300));

      let accumulatedPoem = "";
      const lines = rawText.split("\n");

      for (const line of lines) {
        if (line.startsWith('0:"')) {
          const content = line.slice(3, -1)
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\t/g, '\t')
            .replace(/\\r/g, '\r')
            .replace(/\\\\/g, '\\');

          accumulatedPoem += content;
        }
      }

      if (!accumulatedPoem.trim()) {
        toast.error(section.toasts.error_no_content);
        return;
      }

      console.log("=== SETTING GENERATED POEM ===");
      console.log("Accumulated poem length:", accumulatedPoem.length);
      console.log("Accumulated poem content:", accumulatedPoem);
      setGeneratedPoem(accumulatedPoem);
      console.log("=== POEM STATE UPDATED ===");

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
          model: selectedModel || 'standard',
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
  }, [prompt, selectedModel, isFirstGeneration, section]);

  // Handle Turnstile success
  const handleTurnstileSuccess = useCallback((token: string) => {
    console.log("✓ Turnstile verification successful");
    setTurnstileToken(token);
    // Automatically start generation
    performGeneration(token);
  }, [performGeneration]);

  // Handle Turnstile error
  const handleTurnstileError = useCallback(() => {
    console.error("❌ Turnstile verification failed");
    setIsGenerating(false);
    toast.error(section.toasts.error_generate_failed);
  }, [section]);

  // ===== SAVE / COMPLETION LOGIC =====

  const handleCreateAnother = useCallback(() => {
    setGeneratedPoem("");
    setPoemAnalysis(null);
    setActiveOutputTab("poem");
    setHasSavedCurrentPoem(false);
  }, []);

  const handleSaveClick = useCallback(() => {
    if (!generatedPoem.trim()) {
      toast.error(section.toasts.error_generate_poem_first);
      return;
    }

    if (!user) {
      setShowSignModal(true);
      return;
    }

    setIsSaveDialogOpen(true);
  }, [generatedPoem, section, user, setShowSignModal]);

  const handleConfirmSave = useCallback(
    async (status: StoryStatus) => {
      if (!generatedPoem.trim()) {
        toast.error(section.toasts.error_generate_poem_first);
        return;
      }

      try {
        setIsSavingStory(true);

        const opts = optionsRef.current;

        const settings: Record<string, unknown> = {
          locale,
          poemType: opts.poemType,
          length: opts.length,
          rhymeScheme: opts.rhymeScheme,
          theme: opts.theme,
          mood: opts.mood,
          style: opts.style,
          outputLanguage: opts.language,
          strictTone: opts.strictTone,
        };

        if (opts.cipai) {
          settings.cipai = opts.cipai;
        }

        const modelKey = selectedModel || "standard";
        const modelMap: Record<string, string> = {
          fast: "gemini-2.5-flash-lite",
          standard: "gemini-2.5-flash",
          creative: "gemini-2.5-flash-think",
        };
        const actualModel = modelMap[modelKey] || "gemini-2.5-flash";

        const baseTitle =
          generatedPoem
            .split("\n")
            .find((line) => line.trim().length > 0)
            ?.trim() || prompt.trim() || section.header.title;

        const title =
          baseTitle.length > 50 ? baseTitle.substring(0, 50) + "..." : baseTitle;

        const resp = await fetch("/api/stories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            prompt,
            content: generatedPoem,
            wordCount: generatedPoem.length,
            modelUsed: actualModel,
            settings,
            status,
            visibility: status === "published" ? "public" : "private",
            sourceCategory: "poem",
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

        setHasSavedCurrentPoem(true);
        setIsSaveDialogOpen(false);
      } catch (error) {
        console.error("save poem failed", error);
        toast.error(
          locale === "zh"
            ? "保存失败，请稍后再试"
            : "Failed to save story, please try again."
        );
      } finally {
        setIsSavingStory(false);
      }
    }, [generatedPoem, prompt, locale, selectedModel, section, setShowSignModal]
  );

  // ===== RENDER =====

  const characterCount = prompt.length;
  const maxCharacters = 2000;
  const lineCount = calculateLineCount(generatedPoem);

  const completionGuideTranslations = useMemo(() => {
    if (locale === "zh") {
      return {
        title: "喜欢这首诗吗？",
        subtitle: "你可以保存它，或者再写一首新的诗歌。",
        create_another: "再写一首诗",
        share_action: "保存到故事库",
      };
    }

    return {
      title: "Like your poem?",
      subtitle: "You can save it, or create another one to explore new inspiration.",
      create_another: "Create Another Poem",
      share_action: "Save Story",
    };
  }, [locale, section]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-background selection:bg-pink-500/30">
      {/* Premium Background Layer */}
      <div className="fixed inset-0 -z-20 bg-noise opacity-[0.15] pointer-events-none mix-blend-overlay" />

      <div className="fixed inset-0 -z-30 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-900/20 rounded-full blur-[120px] animate-blob mix-blend-screen" />
        <div className="absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-screen" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-background rounded-full blur-[150px] opacity-80" />
      </div>

      <div className="w-full max-w-5xl mx-auto px-6 pt-16 sm:pt-20 pb-24 sm:pb-32 relative">
        {/* Breadcrumb Navigation */}
        <div className="mb-10 flex justify-start animate-fade-in-up">
          <div className="glass-premium px-5 py-2 rounded-full">
            <PoemBreadcrumb
              homeText={t('ui.breadcrumb_home')}
              currentText={t('ui.breadcrumb_current')}
            />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-20 animate-fade-in-up animation-delay-1000">
          <div className="inline-flex items-center justify-center mb-8">
            <div className="p-px bg-gradient-to-br from-white/20 to-transparent rounded-2xl">
              <div className="glass-premium rounded-2xl p-4">
                <Icon name="feather" className="size-8 text-foreground/80" />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-6 mb-8">
            <h1 className="text-6xl sm:text-8xl font-black tracking-tighter leading-[0.9]">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 dark:from-pink-200 dark:via-purple-200 dark:to-pink-400 animate-shimmer">
                {section.header.title}
              </span>
            </h1>
            <div className="glass-premium p-1 rounded-full">
              <ModeToggle
                advancedMode={advancedMode}
                onToggle={setAdvancedMode}
                labels={section.mode}
              />
            </div>
          </div>
          <p className="text-xl sm:text-2xl text-muted-foreground/60 max-w-2xl mx-auto font-light tracking-wide leading-relaxed">
            {section.header.subtitle}
          </p>
        </div>

        {/* Main Content - Crystal Monolith */}
        <div className="space-y-16 animate-fade-in-up animation-delay-2000">

          <div className="glass-premium rounded-[3rem] p-1 overflow-hidden shadow-2xl shadow-black/20">
            <div className="bg-background/40 rounded-[calc(3rem-4px)] p-8 sm:p-16">

              {/* Poem Type Tabs - Segmented Control */}
              <div className="space-y-8 mb-16">
                <Tabs value={selectedPoemType} onValueChange={(v) => setSelectedPoemType(v as any)} className="w-full flex flex-col items-center">
                  <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-white/5 border border-white/5 rounded-2xl w-full max-w-2xl">
                    {['modern', 'classical', 'format', 'lyric'].map((type) => (
                      <TabsTrigger
                        key={type}
                        value={type}
                        className="rounded-xl py-3 text-sm font-medium data-[state=active]:bg-foreground data-[state=active]:text-background transition-all duration-300"
                      >
                        {section.poem_types.tabs[type as keyof typeof section.poem_types.tabs].name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <p className="text-sm text-muted-foreground/60 text-center font-light tracking-wide">
                  {selectedPoemType === 'modern' && section.poem_types.tabs.modern.description}
                  {selectedPoemType === 'classical' && section.poem_types.tabs.classical.description}
                  {selectedPoemType === 'format' && section.poem_types.tabs.format.description}
                  {selectedPoemType === 'lyric' && section.poem_types.tabs.lyric.description}
                </p>
              </div>

              {/* Format Options - Only shown when Format tab is selected */}
              {selectedPoemType === 'format' && (
                <div className="space-y-4 mb-12 animate-slide-down flex flex-col items-center">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{section.options.rhyme_scheme.label}</Label>
                  <div className="flex flex-wrap justify-center gap-2">
                    {Object.entries(section.options.rhyme_scheme.format_options).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedRhymeScheme(key)}
                        className={cn(
                          "px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border",
                          selectedRhymeScheme === key
                            ? "bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-500/20"
                            : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Prompt Input Section */}
              <div className="space-y-6 mb-12 max-w-3xl mx-auto">
                <div className="flex items-center justify-between">
                  <Label htmlFor="poem-prompt" className="text-xl font-medium tracking-tight flex items-center gap-3">
                    <span className="flex items-center justify-center size-8 rounded-full border border-white/10 text-xs font-serif italic text-muted-foreground">01</span>
                    {section.prompt.label}
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRandomPrompt}
                    className="gap-2 text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 rounded-full h-9 px-4"
                  >
                    <Icon name="Sparkles" className="w-4 h-4" />
                    {section.prompt.random_button}
                  </Button>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
                  <Textarea
                    id="poem-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={section.prompt.placeholder}
                    className="relative min-h-[200px] w-full bg-transparent border-0 border-b border-white/10 focus:border-pink-500/50 focus:ring-0 rounded-none px-0 text-2xl sm:text-3xl font-light leading-snug placeholder:text-muted-foreground/20 resize-none transition-all duration-300 text-center"
                    style={{ boxShadow: 'none' }}
                    maxLength={maxCharacters}
                  />
                  <div className="absolute bottom-0 right-0 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                    {characterCount} / {maxCharacters}
                  </div>
                </div>
              </div>

              {/* Quick Add Chips */}
              <div className="space-y-4 mb-16 max-w-3xl mx-auto text-center">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{section.prompt.quick_adds_label}</Label>
                <div className="flex flex-wrap justify-center gap-2">
                  {[...QUICK_ADD_EMOTIONS, ...QUICK_ADD_IMAGERY, ...QUICK_ADD_SCENES].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickAdd(item)}
                      className="px-4 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-muted-foreground hover:text-foreground transition-all duration-300"
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-16" />

              {/* AI Model & Language */}
              <div className="space-y-10 mb-12">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center justify-center size-8 rounded-full border border-white/10 text-xs font-serif italic text-muted-foreground">02</span>
                    <Label className="text-xl font-medium tracking-tight">
                      {section.ai_models.title}
                    </Label>
                  </div>

                  <div className="flex items-center gap-3 glass-premium rounded-full p-1 pr-4">
                    <div className="bg-white/10 rounded-full p-2">
                      <Icon name="globe" className="size-4 text-muted-foreground" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mr-2">
                      {section.prompt.language_label}
                    </span>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger id="output-language" className="h-8 w-auto bg-transparent border-0 focus:ring-0 font-medium gap-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-premium rounded-xl p-2 min-w-[200px]">
                        {Object.entries(LANGUAGE_OPTIONS).map(([code, lang]) => (
                          <SelectItem key={code} value={code} className="rounded-lg cursor-pointer focus:bg-white/10">
                            <span className="flex items-center gap-3">
                              <span className="text-lg opacity-80">{lang.flag}</span>
                              <span className="font-medium tracking-wide">{lang.native}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  {AI_MODELS.map((model) => {
                    const isSelected = selectedModel === model.id;
                    return (
                      <button
                        key={model.id}
                        onClick={() => setSelectedModel(model.id)}
                        className={cn(
                          "relative group p-8 rounded-[2rem] text-left transition-all duration-500",
                          isSelected
                            ? "bg-black/40 ring-1 ring-white/20 shadow-2xl shadow-black/50"
                            : "bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10"
                        )}
                      >
                        <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
                          {isSelected && <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-pink-500/20 blur-[60px]" />}
                        </div>

                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex items-start justify-between mb-6">
                            <div className={cn(
                              "p-3 rounded-2xl transition-colors duration-300",
                              isSelected ? "bg-white/10 text-white" : "bg-white/5 text-muted-foreground group-hover:text-foreground"
                            )}>
                              <span className="text-2xl">{model.icon}</span>
                            </div>
                            {isSelected && (
                              <div className="size-2 rounded-full bg-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.8)] animate-pulse" />
                            )}
                          </div>

                          <div className="font-bold text-lg mb-2 tracking-wide group-hover:text-pink-400 transition-colors">{model.name}</div>
                          <div className="text-xs text-muted-foreground/60 leading-relaxed mb-6 font-light">{model.description}</div>

                          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 pt-4 border-t border-white/5 flex items-center gap-2">
                            <Icon name="clock" className="size-3" /> {model.speed}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Mode Options */}
              <div className={cn(
                "max-w-4xl mx-auto overflow-hidden transition-all duration-700 ease-in-out",
                advancedMode ? "max-h-[800px] opacity-100 pt-8 border-t border-white/5" : "max-h-0 opacity-0"
              )}>
                <div className="flex items-center gap-3 mb-8">
                  <Icon name="sliders" className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">{section.options.title}</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                  {/* Length - Mandatory */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">{section.options.length.label}</Label>
                    <Select value={selectedLength} onValueChange={setSelectedLength}>
                      <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/5 hover:bg-white/10 transition-colors focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-premium rounded-xl">
                        {Object.entries(section.options.length.options).map(([k, v]) => (
                          <SelectItem key={k} value={k} className="cursor-pointer focus:bg-white/10">{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Theme - Optional */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">{section.options.theme.label}</Label>
                    <Select value={selectedTheme || "none"} onValueChange={(v) => setSelectedTheme(v === "none" ? null : v)}>
                      <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/5 hover:bg-white/10 transition-colors focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-premium rounded-xl">
                        <SelectItem value="none" className="text-muted-foreground">{section.options.theme.none_option}</SelectItem>
                        {Object.entries(section.options.theme.options).map(([k, v]) => (
                          <SelectItem key={k} value={k} className="cursor-pointer focus:bg-white/10">{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Mood - Optional */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">{section.options.mood.label}</Label>
                    <Select value={selectedMood || "none"} onValueChange={(v) => setSelectedMood(v === "none" ? null : v)}>
                      <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/5 hover:bg-white/10 transition-colors focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-premium rounded-xl">
                        <SelectItem value="none" className="text-muted-foreground">{section.options.mood.none_option}</SelectItem>
                        {Object.entries(section.options.mood.options).map(([k, v]) => (
                          <SelectItem key={k} value={k} className="cursor-pointer focus:bg-white/10">{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Style - Optional */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">{section.options.style.label}</Label>
                    <Select value={selectedStyle || "none"} onValueChange={(v) => setSelectedStyle(v === "none" ? null : v)}>
                      <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/5 hover:bg-white/10 transition-colors focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-premium rounded-xl">
                        <SelectItem value="none" className="text-muted-foreground">{section.options.style.none_option}</SelectItem>
                        {Object.entries(section.options.style.options).map(([k, v]) => (
                          <SelectItem key={k} value={k} className="cursor-pointer focus:bg-white/10">{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-16 flex flex-col items-center gap-8">
                <div className="relative w-full max-w-md group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-indigo-500/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !selectedModel}
                    className="relative w-full h-20 rounded-full bg-foreground text-background hover:bg-white hover:text-foreground hover:scale-[1.02] transition-all duration-500 text-lg font-bold tracking-wide shadow-2xl border-none"
                  >
                    {isGenerating ? (
                        <div className="flex items-center gap-3">
                        <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span className="animate-pulse">{section.generate_button.generating}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Icon name="Sparkles" className="size-5" />
                        {section.generate_button.text}
                      </div>
                    )}
                  </Button>
                </div>

                {/* History & Tips */}
                <div className="flex flex-col items-center gap-6 w-full">
                  <PoemHistoryDropdown onLoadPoem={handleLoadPoem} locale={locale} />
                  <p className="text-xs font-medium text-muted-foreground/40 flex items-center gap-2">
                    <Icon name="info" className="size-3" />
                    {section.generate_button.tip}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Output Section */}
          {generatedPoem && (
            <div className="mt-16 space-y-8">
              <div className="relative animate-fade-in-up">
                {/* Debug indicator */}
                <div className="text-center mb-4 text-sm text-green-500 font-bold">
                  ✓ Poem Generated ({generatedPoem.length} chars)
                </div>
                <div className="glass-premium rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10">

                  {/* Output Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between p-8 md:p-10 border-b border-black/5 dark:border-white/5 bg-white/40 dark:bg-white/5 gap-6">
                    <div className="flex items-center gap-5">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-black/5 dark:border-white/10">
                      <Icon name="feather" className="size-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-foreground">{section.output.title}</h3>
                      <div className="text-sm text-muted-foreground/60 font-light mt-1">
                        {section.output.line_count.replace('{count}', String(lineCount))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyPoem}
                      className="rounded-full h-10 px-4 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground border border-black/5 dark:border-white/5"
                    >
                      <Icon name="Copy" className="size-4 mr-2" />
                      {section.output.button_copy}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAnalyzePoem}
                      disabled={isAnalyzing}
                      className="rounded-full h-10 px-4 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground border border-black/5 dark:border-white/5"
                    >
                      {isAnalyzing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                      ) : (
                        <Icon name="Search" className="size-4 mr-2" />
                      )}
                      {isAnalyzing ? section.output.button_analyzing : section.output.button_analyze}
                    </Button>
                  </div>
                  </div>

                {/* Output Tabs */}
                <Tabs value={activeOutputTab} onValueChange={setActiveOutputTab} className="w-full">
                  <div className="px-8 pt-8">
                    <TabsList className="bg-transparent p-0 border-b border-black/5 dark:border-white/10 w-full justify-start rounded-none h-auto gap-8">
                      {['poem', 'analysis', 'audio'].map((tab) => (
                        <TabsTrigger
                          key={tab}
                          value={tab}
                          className="rounded-none border-b-2 border-transparent px-0 py-4 data-[state=active]:border-pink-500 data-[state=active]:bg-transparent data-[state=active]:text-pink-600 dark:data-[state=active]:text-pink-400 text-muted-foreground hover:text-foreground transition-all"
                        >
                          {section.output.tabs[tab as keyof typeof section.output.tabs]}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  <div className="p-8 md:p-16 min-h-[400px] bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                    {/* Poem Content */}
                    <TabsContent value="poem" className="mt-0 animate-fade-in">
                      <div className="max-w-3xl mx-auto text-center">
                        <pre className="font-serif text-xl sm:text-2xl leading-loose text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                          {generatedPoem}
                        </pre>
                      </div>
                    </TabsContent>

                    {/* Analysis Content */}
                    <TabsContent value="analysis" className="mt-0 animate-fade-in">
                      {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                          <div className="size-12 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin"></div>
                          <span className="text-sm font-medium tracking-widest uppercase text-muted-foreground/60 animate-pulse">{section.analysis.loading}</span>
                        </div>
                      ) : poemAnalysis ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-10">
                            {/* Imagery */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold uppercase tracking-widest text-pink-400 flex items-center gap-2">
                                <Icon name="Image" className="size-4" />
                                {section.analysis.imagery.title}
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {poemAnalysis.imagery.map((img, idx) => {
                                  const imageText = typeof img === 'string' ? img : img.image;
                                  return (
                                    <span key={idx} className="px-4 py-1.5 bg-pink-500/5 text-pink-300 rounded-full text-sm border border-pink-500/10">
                                      {imageText}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Emotion */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold uppercase tracking-widest text-purple-400 flex items-center gap-2">
                                <Icon name="Heart" className="size-4" />
                                {section.analysis.emotion.title}
                              </h4>
                              <p className="text-base leading-relaxed text-muted-foreground/80 font-light">{poemAnalysis.emotionalTone}</p>
                            </div>
                          </div>

                          <div className="space-y-10">
                            {/* Theme */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                                <Icon name="BookOpen" className="size-4" />
                                {section.analysis.theme.title}
                              </h4>
                              <p className="text-base leading-relaxed text-muted-foreground/80 font-light">{poemAnalysis.themeInterpretation}</p>
                            </div>

                            {/* Rhetoric */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2">
                                <Icon name="Sparkles" className="size-4" />
                                {section.analysis.rhetoric.title}
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {poemAnalysis.rhetoricalDevices.map((device, idx) => (
                                  <span key={idx} className="px-4 py-1.5 bg-blue-500/5 text-blue-300 rounded-full text-sm border border-blue-500/10">
                                    {device}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-20 text-muted-foreground/40">
                          <Icon name="Search" className="size-12 mx-auto mb-4 opacity-20" />
                          <p className="text-lg font-medium">{section.analysis.no_analysis}</p>
                        </div>
                      )}
                    </TabsContent>

                    {/* Audio Content */}
                    <TabsContent value="audio" className="mt-0 animate-fade-in">
                      {hasSpeechSupport ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-12">
                          {/* Visualizer */}
                          <div className="flex items-end justify-center gap-1.5 h-24">
                            {[...Array(16)].map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "w-2 bg-gradient-to-t from-pink-500 to-purple-500 rounded-full transition-all duration-150 ease-in-out",
                                  isReading && !isPaused ? "animate-music-bar" : "h-2 opacity-20"
                                )}
                                style={{ animationDelay: `${i * 0.05}s` }}
                              />
                            ))}
                          </div>

                          <div className="flex items-center gap-8">
                            {!isReading ? (
                              <button
                                onClick={handleStartReading}
                                disabled={!generatedPoem.trim()}
                                className={cn(
                                  "size-20 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 text-white shadow-[0_20px_45px_rgba(170,85,255,0.35)] ring-4 ring-pink-500/20 flex items-center justify-center transition-all",
                                  !generatedPoem.trim()
                                    ? "opacity-40 cursor-not-allowed"
                                    : "hover:scale-110 focus-visible:scale-105 focus-visible:outline-none focus-visible:ring-8 focus-visible:ring-pink-500/40"
                                )}
                                aria-label={section.audio.player.play}
                              >
                                <Icon name="Play" className="size-8 ml-1 text-white" />
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={isPaused ? handleResumeReading : handlePauseReading}
                                  className="size-16 rounded-full border-2 border-white/20 hover:bg-white/10 text-white transition-all flex items-center justify-center"
                                >
                                  <Icon name={isPaused ? "Play" : "Pause"} className="size-6" />
                                </button>
                                <button
                                  onClick={handleStopReading}
                                  className="size-16 rounded-full border-2 border-white/20 hover:bg-white/10 text-white transition-all flex items-center justify-center"
                                >
                                  <Icon name="Square" className="size-6" />
                                </button>
                              </>
                            )}
                          </div>

                          <div className="glass-premium px-6 py-3 rounded-full flex items-center gap-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{section.audio.player.speed_label}</span>
                            <div className="flex gap-2">
                              {[0.75, 1, 1.25, 1.5].map((speed) => (
                                <button
                                  key={speed}
                                  onClick={() => handleSpeedChange(speed)}
                                  className={cn(
                                    "h-10 w-10 rounded-full text-xs font-semibold transition-all border border-white/20 flex items-center justify-center",
                                    readingSpeed === speed
                                      ? "bg-white text-black shadow-[0_10px_25px_rgba(255,255,255,0.35)] ring-2 ring-pink-500/50"
                                      : "text-muted-foreground hover:text-white hover:bg-white/10"
                                  )}
                                  aria-pressed={readingSpeed === speed}
                                >
                                  {speed}x
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-20 text-muted-foreground/40">
                          <Icon name="Volume2" className="size-12 mx-auto mb-4 opacity-20" />
                          <p>{section.audio.browser_not_supported}</p>
                        </div>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
              <CompletionGuide
                onCreateAnother={handleCreateAnother}
                onSave={handleSaveClick}
                isSaveDisabled={hasSavedCurrentPoem}
                translations={completionGuideTranslations}
              />
            </div>
          )}

        </div>

        {/* Invisible Turnstile for non-interactive verification */}
        <TurnstileInvisible
          ref={turnstileRef}
          onSuccess={handleTurnstileSuccess}
          onError={handleTurnstileError}
        />
        <StorySaveDialog
          open={isSaveDialogOpen}
          onOpenChange={setIsSaveDialogOpen}
          onSelect={handleConfirmSave}
          locale={locale}
          isSaving={isSavingStory}
        />
      </div>
    </div>
  );
}