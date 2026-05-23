"use client";

import GeneratorNavTabs from "@/components/generator-nav-tabs";
import { Zap, Sparkles, Palette, PenTool } from "lucide-react";

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
import { GeneratorShortcutHints } from "@/components/generator-shortcut-hints";
import type { StoryStatus } from "@/models/story";
import { useGeneratorShortcuts } from "@/hooks/useGeneratorShortcuts";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";

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
      icon: <Zap className="h-4 w-4" />,
      speed: section.ai_models.models.fast.speed,
      description: section.ai_models.models.fast.description
    },
    {
      id: 'standard',
      name: section.ai_models.models.standard.name,
      badge: section.ai_models.models.standard.badge,
      badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      icon: <PenTool className="h-4 w-4" />,
      speed: section.ai_models.models.standard.speed,
      description: section.ai_models.models.standard.description
    },
    {
      id: 'creative',
      name: section.ai_models.models.creative.name,
      badge: section.ai_models.models.creative.badge,
      badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      icon: <Palette className="h-4 w-4" />,
      speed: section.ai_models.models.creative.speed,
      description: section.ai_models.models.creative.description
    }
  ], [section]);

  // ===== STATE MANAGEMENT =====

  // Mode state (Simple vs Advanced)
  const [advancedMode, setAdvancedMode] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<string | null>("standard");
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

  useDraftAutoSave({
    key: `poem-generator:prompt:${locale}`,
    value: prompt,
    onRestore: (draft) => setPrompt(draft),
  });

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
  const promptRef = useRef<HTMLTextAreaElement | null>(null);

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

  useGeneratorShortcuts({
    onGenerate: handleGenerate,
    onFocusInput: () => {
      if (promptRef.current) {
        promptRef.current.focus();
      }
    },
    onQuickSave: () => {
      if (!isGenerating && !isSavingStory && !hasSavedCurrentPoem) {
        handleSaveClick();
      }
    },
  });

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
          fast: "gemini-2.5-flash",
          standard: "gemini-3.1-flash-lite",
          creative: "gemini-3-flash",
        };
        const actualModel = modelMap[modelKey] || "gemini-3.1-flash-lite";

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
    <div id="poem_generator" className="bg-background">
      <div className="relative mx-auto w-full max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-8">
          <PoemBreadcrumb
            homeText={t('ui.breadcrumb_home')}
            currentText={t('ui.breadcrumb_current')}
          />
        </div>

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-orange-500/10">
              <Icon name="feather" className="size-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
              {section.header.title}
            </h1>
          </div>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-6">
            {section.header.subtitle}
          </p>
          <div className="mb-8 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="flex items-center gap-3">
            <ModeToggle
              advancedMode={advancedMode}
              onToggle={setAdvancedMode}
              labels={section.mode}
            />
          </div>
        </div>

        <GeneratorNavTabs />

        {/* Main Content */}
        <div className="space-y-6">

          <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="p-6 sm:p-10">

              {/* Poem Type Tabs - Segmented Control */}
              <div className="space-y-4 mb-8">
                <Tabs value={selectedPoemType} onValueChange={(v) => setSelectedPoemType(v as any)} className="w-full">
                  <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-muted rounded-xl w-full">
                    {['modern', 'classical', 'format', 'lyric'].map((type) => (
                      <TabsTrigger
                        key={type}
                        value={type}
                        className="rounded-lg py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                      >
                        {section.poem_types.tabs[type as keyof typeof section.poem_types.tabs].name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <p className="text-sm text-muted-foreground">
                  {selectedPoemType === 'modern' && section.poem_types.tabs.modern.description}
                  {selectedPoemType === 'classical' && section.poem_types.tabs.classical.description}
                  {selectedPoemType === 'format' && section.poem_types.tabs.format.description}
                  {selectedPoemType === 'lyric' && section.poem_types.tabs.lyric.description}
                </p>
              </div>

              {/* Format Options - Only shown when Format tab is selected */}
              {selectedPoemType === 'format' && (
                <div className="space-y-3 mb-8">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{section.options.rhyme_scheme.label}</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(section.options.rhyme_scheme.format_options).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedRhymeScheme(key)}
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                          selectedRhymeScheme === key
                            ? "border-orange-500/40 bg-orange-500/[0.08] text-orange-600 dark:text-orange-400"
                            : "border-border bg-background hover:bg-muted/50 text-muted-foreground"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Prompt Input Section */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between">
                  <Label htmlFor="poem-prompt" className="text-sm font-semibold flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/10 text-[10px] font-bold tabular-nums text-orange-600 dark:text-orange-400">1</span>
                    {section.prompt.label}
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRandomPrompt}
                    className="gap-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-500/10 dark:text-orange-400 dark:hover:text-orange-300 h-8 px-3 text-xs"
                  >
                    <Icon name="Sparkles" className="w-3.5 h-3.5" />
                    {section.prompt.random_button}
                  </Button>
                </div>

                <div className="relative">
                  <Textarea
                    id="poem-prompt"
                    ref={promptRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={section.prompt.placeholder}
                    className="min-h-[140px] resize-none text-sm focus-visible:ring-orange-500/30"
                    maxLength={maxCharacters}
                  />
                  <div className="absolute bottom-2 right-3 text-xs text-muted-foreground/50">
                    {characterCount} / {maxCharacters}
                  </div>
                </div>
              </div>

              {/* Quick Add Chips */}
              <div className="space-y-2 mb-8">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{section.prompt.quick_adds_label}</Label>
                <div className="flex flex-wrap gap-2">
                  {[...QUICK_ADD_EMOTIONS, ...QUICK_ADD_IMAGERY, ...QUICK_ADD_SCENES].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickAdd(item)}
                      className="px-3 py-1 rounded-md text-xs font-medium bg-muted hover:bg-muted/80 border border-border text-muted-foreground hover:text-foreground transition-colors"
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border my-8" />

              {/* AI Model & Language */}
              <div className="space-y-4 mb-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/10 text-[10px] font-bold tabular-nums text-orange-600 dark:text-orange-400">2</span>
                    {section.ai_models.title}
                  </Label>

                  <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-1.5 bg-background">
                    <Icon name="globe" className="size-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {section.prompt.language_label}
                    </span>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger id="output-language" className="h-7 w-auto border-0 bg-transparent focus:ring-0 text-sm font-medium p-0 gap-1">
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {AI_MODELS.map((model) => {
                    const isSelected = selectedModel === model.id;
                    return (
                      <button
                        key={model.id}
                        onClick={() => setSelectedModel(model.id)}
                        className={cn(
                          "group p-4 rounded-xl text-left transition-colors border",
                          isSelected
                            ? "border-orange-500/40 bg-orange-500/[0.08]"
                            : "border-border bg-background hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={cn(
                            "p-2 rounded-lg transition-colors",
                            isSelected ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" : "bg-muted text-muted-foreground"
                          )}>
                            {model.icon}
                          </div>
                          {isSelected && (
                            <div className="size-2 rounded-full bg-orange-500 animate-pulse" />
                          )}
                        </div>

                        <div className={cn(
                          "font-semibold text-sm mb-1",
                          isSelected ? "text-orange-600 dark:text-orange-400" : "text-foreground"
                        )}>{model.name}</div>
                        <div className="text-xs text-muted-foreground leading-relaxed mb-3">{model.description}</div>

                        <div className="text-xs text-muted-foreground/60 pt-3 border-t border-border flex items-center gap-1.5">
                          <Icon name="clock" className="size-3" /> {model.speed}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Mode Options */}
              <div className={cn(
                "overflow-hidden transition-all duration-500 ease-in-out",
                advancedMode ? "max-h-[600px] opacity-100 mb-8" : "max-h-0 opacity-0"
              )}>
                <div className="pt-6 border-t border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon name="sliders" className="size-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-muted-foreground">{section.options.title}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Length - Mandatory */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">{section.options.length.label}</Label>
                      <Select value={selectedLength} onValueChange={setSelectedLength}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(section.options.length.options).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Theme - Optional */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">{section.options.theme.label}</Label>
                      <Select value={selectedTheme || "none"} onValueChange={(v) => setSelectedTheme(v === "none" ? null : v)}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{section.options.theme.none_option}</SelectItem>
                          {Object.entries(section.options.theme.options).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Mood - Optional */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">{section.options.mood.label}</Label>
                      <Select value={selectedMood || "none"} onValueChange={(v) => setSelectedMood(v === "none" ? null : v)}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{section.options.mood.none_option}</SelectItem>
                          {Object.entries(section.options.mood.options).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Style - Optional */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">{section.options.style.label}</Label>
                      <Select value={selectedStyle || "none"} onValueChange={(v) => setSelectedStyle(v === "none" ? null : v)}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{section.options.style.none_option}</SelectItem>
                          {Object.entries(section.options.style.options).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-6 space-y-4">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedModel}
                  className="w-full h-14 rounded-xl text-base font-semibold bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-500 dark:hover:bg-orange-600 disabled:opacity-60 transition-colors"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>{section.generate_button.generating}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Icon name="Sparkles" className="size-4" />
                      <span>{section.generate_button.text}</span>
                    </div>
                  )}
                </Button>

                <GeneratorShortcutHints showQuickSave />

                <div className="flex flex-col items-center gap-3">
                  <PoemHistoryDropdown onLoadPoem={handleLoadPoem} locale={locale} />
                  <p className="text-xs text-muted-foreground/50 flex items-center gap-1.5">
                    <Icon name="info" className="size-3" />
                    {section.generate_button.tip}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Output Section */}
          {generatedPoem && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">

                {/* Output Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-border gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <Icon name="feather" className="size-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{section.output.title}</h3>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {section.output.line_count.replace('{count}', String(lineCount))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPoem}
                      className="h-8 px-3 text-xs"
                    >
                      <Icon name="Copy" className="size-3.5 mr-1.5" />
                      {section.output.button_copy}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAnalyzePoem}
                      disabled={isAnalyzing}
                      className="h-8 px-3 text-xs"
                    >
                      {isAnalyzing ? (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent mr-1.5" />
                      ) : (
                        <Icon name="Search" className="size-3.5 mr-1.5" />
                      )}
                      {isAnalyzing ? section.output.button_analyzing : section.output.button_analyze}
                    </Button>
                  </div>
                </div>

                {/* Output Tabs */}
                <Tabs value={activeOutputTab} onValueChange={setActiveOutputTab} className="w-full">
                  <div className="px-6 pt-4">
                    <TabsList className="bg-transparent p-0 border-b border-border w-full justify-start rounded-none h-auto gap-6">
                      {['poem', 'analysis', 'audio'].map((tab) => (
                        <TabsTrigger
                          key={tab}
                          value={tab}
                          className="rounded-none border-b-2 border-transparent px-0 pb-3 pt-0 text-sm data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {section.output.tabs[tab as keyof typeof section.output.tabs]}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  <div className="p-6 min-h-[300px]">
                    {/* Poem Content */}
                    <TabsContent value="poem" className="mt-0">
                      <div className="max-w-2xl mx-auto text-center">
                        <pre className="font-serif text-lg leading-loose text-foreground whitespace-pre-wrap">
                          {generatedPoem}
                        </pre>
                      </div>
                    </TabsContent>

                    {/* Analysis Content */}
                    <TabsContent value="analysis" className="mt-0">
                      {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                          <div className="size-10 rounded-full border-2 border-orange-500/20 border-t-orange-500 animate-spin" />
                          <span className="text-sm text-muted-foreground">{section.analysis.loading}</span>
                        </div>
                      ) : poemAnalysis ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                                <Icon name="Image" className="size-3.5" />
                                {section.analysis.imagery.title}
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {poemAnalysis.imagery.map((img, idx) => {
                                  const imageText = typeof img === 'string' ? img : img.image;
                                  return (
                                    <span key={idx} className="px-3 py-1 bg-orange-500/5 text-orange-600 dark:text-orange-400 rounded-md text-xs border border-orange-500/20">
                                      {imageText}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                                <Icon name="Heart" className="size-3.5" />
                                {section.analysis.emotion.title}
                              </h4>
                              <p className="text-sm leading-relaxed text-muted-foreground">{poemAnalysis.emotionalTone}</p>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                                <Icon name="BookOpen" className="size-3.5" />
                                {section.analysis.theme.title}
                              </h4>
                              <p className="text-sm leading-relaxed text-muted-foreground">{poemAnalysis.themeInterpretation}</p>
                            </div>

                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                                <Icon name="Sparkles" className="size-3.5" />
                                {section.analysis.rhetoric.title}
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {poemAnalysis.rhetoricalDevices.map((device, idx) => (
                                  <span key={idx} className="px-3 py-1 bg-orange-500/5 text-orange-600 dark:text-orange-400 rounded-md text-xs border border-orange-500/20">
                                    {device}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-16 text-muted-foreground">
                          <Icon name="Search" className="size-10 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">{section.analysis.no_analysis}</p>
                        </div>
                      )}
                    </TabsContent>

                    {/* Audio Content */}
                    <TabsContent value="audio" className="mt-0">
                      {hasSpeechSupport ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-8">
                          {/* Visualizer */}
                          <div className="flex items-end justify-center gap-1 h-16">
                            {[...Array(16)].map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "w-1.5 bg-orange-500 rounded-full transition-all duration-150",
                                  isReading && !isPaused ? "animate-music-bar" : "h-1.5 opacity-20"
                                )}
                                style={{ animationDelay: `${i * 0.05}s` }}
                              />
                            ))}
                          </div>

                          <div className="flex items-center gap-4">
                            {!isReading ? (
                              <button
                                onClick={handleStartReading}
                                disabled={!generatedPoem.trim()}
                                className={cn(
                                  "size-14 rounded-full bg-orange-600 dark:bg-orange-500 text-white flex items-center justify-center transition-all",
                                  !generatedPoem.trim()
                                    ? "opacity-40 cursor-not-allowed"
                                    : "hover:bg-orange-700 dark:hover:bg-orange-600"
                                )}
                                aria-label={section.audio.player.play}
                              >
                                <Icon name="Play" className="size-6 ml-0.5 text-white" />
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={isPaused ? handleResumeReading : handlePauseReading}
                                  className="size-12 rounded-full border border-border hover:bg-muted text-foreground transition-colors flex items-center justify-center"
                                >
                                  <Icon name={isPaused ? "Play" : "Pause"} className="size-5" />
                                </button>
                                <button
                                  onClick={handleStopReading}
                                  className="size-12 rounded-full border border-border hover:bg-muted text-foreground transition-colors flex items-center justify-center"
                                >
                                  <Icon name="Square" className="size-5" />
                                </button>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-border bg-muted/30">
                            <span className="text-xs text-muted-foreground">{section.audio.player.speed_label}</span>
                            <div className="flex gap-1.5">
                              {[0.75, 1, 1.25, 1.5].map((speed) => (
                                <button
                                  key={speed}
                                  onClick={() => handleSpeedChange(speed)}
                                  className={cn(
                                    "h-8 w-10 rounded-md text-xs font-medium transition-colors border",
                                    readingSpeed === speed
                                      ? "border-orange-500/40 bg-orange-500/[0.08] text-orange-600 dark:text-orange-400"
                                      : "border-border bg-background text-muted-foreground hover:bg-muted"
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
                        <div className="text-center py-16 text-muted-foreground">
                          <Icon name="Volume2" className="size-10 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">{section.audio.browser_not_supported}</p>
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