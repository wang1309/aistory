"use client";

import GeneratorNavTabs from "@/components/generator-nav-tabs";
import { Zap, Sparkles, Palette, Castle, Rocket, Heart, Search, PenTool } from "lucide-react";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/icon";
import { toast } from "sonner";
import { StoryGenerate as StoryGenerateType } from "@/types/blocks/story-generate";
import { useLocale } from "next-intl";
import type { StoryMetadata } from "@/lib/pdf-export";
import { useAppContext } from "@/contexts/app";
import { StoryStorage, SavedStory } from "@/lib/story-storage";
const StoryHistoryDropdown = dynamic(() => import("@/components/story-history-dropdown"), {
  ssr: false,
  loading: () => null,
});
const StoryShareButtons = dynamic(() => import("@/components/story-share-buttons"), {
  ssr: false,
  loading: () => null,
});
const GeneratorShortcutHints = dynamic(
  () => import("@/components/generator-shortcut-hints").then((m) => m.GeneratorShortcutHints),
  {
    ssr: false,
    loading: () => null,
  }
);

import type { TurnstileInvisibleHandle } from "@/components/TurnstileInvisible";
const TurnstileInvisible = dynamic(() => import("@/components/TurnstileInvisible"), {
  ssr: false,
  loading: () => null,
});
import CompletionGuide from "@/components/story/completion-guide";
import GenerationProgress from "@/components/story/generation-progress";
import { useTranslations } from "next-intl";
const StorySaveDialog = dynamic(() => import("@/components/story/story-save-dialog"), {
  ssr: false,
  loading: () => null,
});
import type { StoryStatus } from "@/models/story";
import { useGeneratorShortcuts } from "@/hooks/useGeneratorShortcuts";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";

const isDev = process.env.NODE_ENV === "development";
const devLog = (...args: any[]) => {
  if (isDev) {
    console.log(...args);
  }
};

// ========== HELPER FUNCTIONS ==========

/**
 * Calculate word count for both English and Chinese text
 * - For Chinese/Japanese/Korean: count characters (excluding whitespace and punctuation)
 * - For English and other languages: count words (space-separated)
 */
function calculateWordCount(text: string): number {
  if (!text || !text.trim()) return 0;

  // Remove leading/trailing whitespace
  const trimmed = text.trim();

  // Count CJK (Chinese, Japanese, Korean) characters
  const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/gu;
  const cjkChars = trimmed.match(cjkRegex);
  const cjkCount = cjkChars ? cjkChars.length : 0;

  // Remove CJK characters and count remaining words (space-separated)
  const withoutCJK = trimmed.replace(cjkRegex, ' ').trim();
  const englishWords = withoutCJK.split(/\s+/).filter(word => word.length > 0);
  const englishCount = withoutCJK ? englishWords.length : 0;

  return cjkCount + englishCount;
}

// ========== COMPONENT ==========

export default function StoryGenerate({ section }: { section: StoryGenerateType }) {
  const locale = useLocale(); // 获取当前语言
  const { user, setShowSignModal } = useAppContext();
  const t = useTranslations("generation_progress");

  // Get progress tips from translations
  const progressTips = useMemo(() => {
    try {
      return t.raw("tips") as string[];
    } catch {
      // Fallback tips if translation fails
      return [
        "Crafting the perfect opening scene...",
        "Developing unique characters...",
        "Weaving an engaging plot...",
        "Adding vivid descriptions...",
      ];
    }
  }, [t]);

  // Get translated constants (memoized for performance)
  const RANDOM_PROMPTS = useMemo(() => section.random_prompts, [section]);

  const PRESET_TEMPLATES = useMemo(() => ({
    [section.presets.items.fantasy_quest.title]: section.presets.items.fantasy_quest.template,
    [section.presets.items.scifi_thriller.title]: section.presets.items.scifi_thriller.template,
    [section.presets.items.love_story.title]: section.presets.items.love_story.template,
    [section.presets.items.crime_mystery.title]: section.presets.items.crime_mystery.template,
  }), [section]);

  const QUICK_ADD_CHIPS = useMemo(() => [
    section.prompt.quick_add_chips.plot_twist,
    section.prompt.quick_add_chips.dialogue,
    section.prompt.quick_add_chips.setting
  ], [section]);

  const LANGUAGE_OPTIONS = useMemo(() => section.prompt.language_options, [section]);

  const STORY_PRESETS = useMemo(() => [
    { icon: <Castle className="h-5 w-5" />, title: section.presets.items.fantasy_quest.title, desc: section.presets.items.fantasy_quest.desc },
    { icon: <Rocket className="h-5 w-5" />, title: section.presets.items.scifi_thriller.title, desc: section.presets.items.scifi_thriller.desc },
    { icon: <Heart className="h-5 w-5" />, title: section.presets.items.love_story.title, desc: section.presets.items.love_story.desc },
    { icon: <Search className="h-5 w-5" />, title: section.presets.items.crime_mystery.title, desc: section.presets.items.crime_mystery.desc }
  ], [section]);

  const AI_MODELS = useMemo(() => [
    {
      id: 'fast',
      name: section.ai_models.models.fastest.name,
      badge: section.ai_models.models.fastest.badge,
      badgeColor: 'bg-green-500/10 text-green-600 border-green-500/30',
      icon: <Zap className="h-4 w-4" />,
      speed: section.ai_models.models.fastest.speed,
      description: section.ai_models.models.fastest.description
    },
    {
      id: 'standard',
      name: section.ai_models.models.eloquent.name,
      badge: section.ai_models.models.eloquent.badge,
      badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
      icon: <PenTool className="h-4 w-4" />,
      speed: section.ai_models.models.eloquent.speed,
      description: section.ai_models.models.eloquent.description
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

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<string | null>("standard");
  const [selectedFormat, setSelectedFormat] = useState("none");
  const [selectedTone, setSelectedTone] = useState("none");
  const [selectedLanguage, setSelectedLanguage] = useState(locale);

  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const confettiModuleRef = useRef<((opts?: any) => void) | null>(null);
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);
  const outputScrollRef = useRef<HTMLDivElement | null>(null);
  const [selectedLength, setSelectedLength] = useState("none");
  const [selectedGenre, setSelectedGenre] = useState("none");
  const [selectedPerspective, setSelectedPerspective] = useState("none");
  const [selectedAudience, setSelectedAudience] = useState("none");

  // Use ref to store latest advanced options values to avoid stale closure
  const advancedOptionsRef = useRef({
    format: "none",
    length: "none",
    genre: "none",
    perspective: "none",
    audience: "none",
    tone: "none",
    language: locale
  });

  // Update ref whenever advanced options change
  useEffect(() => {
    advancedOptionsRef.current = {
      format: selectedFormat,
      length: selectedLength,
      genre: selectedGenre,
      perspective: selectedPerspective,
      audience: selectedAudience,
      tone: selectedTone,
      language: selectedLanguage
    };
  }, [selectedFormat, selectedLength, selectedGenre, selectedPerspective, selectedAudience, selectedTone, selectedLanguage]);

  // Wrapped setters with debug logging
  const handleFormatChange = useCallback((value: string) => {
    devLog(`📝 Format changed: "${selectedFormat}" → "${value}"`);
    setSelectedFormat(value);
  }, [selectedFormat]);

  const handleLengthChange = useCallback((value: string) => {
    devLog(`📏 Length changed: "${selectedLength}" → "${value}"`);
    setSelectedLength(value);
  }, [selectedLength]);

  const handleGenreChange = useCallback((value: string) => {
    devLog(`🎭 Genre changed: "${selectedGenre}" → "${value}"`);
    setSelectedGenre(value);
  }, [selectedGenre]);

  const handlePerspectiveChange = useCallback((value: string) => {
    devLog(`👁️ Perspective changed: "${selectedPerspective}" → "${value}"`);
    setSelectedPerspective(value);
  }, [selectedPerspective]);

  const handleAudienceChange = useCallback((value: string) => {
    devLog(`👥 Audience changed: "${selectedAudience}" → "${value}"`);
    setSelectedAudience(value);
  }, [selectedAudience]);

  const handleToneChange = useCallback((value: string) => {
    devLog(`🎨 Tone changed: "${selectedTone}" → "${value}"`);
    setSelectedTone(value);
  }, [selectedTone]);

  const handleLanguageChange = useCallback((value: string) => {
    devLog(`🌐 Language changed: "${selectedLanguage}" → "${value}"`);
    setSelectedLanguage(value);
  }, [selectedLanguage]);

  // Story generation state
  const [generatedStory, setGeneratedStory] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // PDF export state
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSavingStory, setIsSavingStory] = useState(false);
  const [hasSavedCurrentStory, setHasSavedCurrentStory] = useState(false);

  // Calculate word count (memoized for performance)
  const wordCount = useMemo(() => calculateWordCount(generatedStory), [generatedStory]);

  // Calculate number of selected advanced options (not "none")
  const selectedOptionsCount = useMemo(() => {
    let count = 0;
    if (selectedFormat !== "none") count++;
    if (selectedLength !== "none") count++;
    if (selectedGenre !== "none") count++;
    if (selectedPerspective !== "none") count++;
    if (selectedAudience !== "none") count++;
    if (selectedTone !== "none") count++;
    return count;
  }, [selectedFormat, selectedLength, selectedGenre, selectedPerspective, selectedAudience, selectedTone]);

  useDraftAutoSave({
    key: `story-generator:prompt:${locale}`,
    value: prompt,
    onRestore: (draft) => setPrompt(draft),
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem("story-generator:prefill-prompt");
      if (!raw) return;

      let promptText: string | null = null;
      try {
        const parsed = JSON.parse(raw) as { prompt?: string; value?: string } | null;
        if (parsed && typeof parsed.prompt === "string") {
          promptText = parsed.prompt;
        } else if (parsed && typeof parsed.value === "string") {
          promptText = parsed.value;
        }
      } catch {
        promptText = raw;
      }

      if (!promptText || !promptText.trim()) {
        window.localStorage.removeItem("story-generator:prefill-prompt");
        return;
      }

      setPrompt(promptText);
      window.localStorage.removeItem("story-generator:prefill-prompt");

      const element = document.getElementById("craft_story");
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }

      setTimeout(() => {
        if (promptRef.current) {
          promptRef.current.focus();
        }
      }, 200);
    } catch {
    }
  }, []);

  useEffect(() => {
    if (isGenerating && outputRef.current) {
      try {
        const element = outputRef.current;
        const rect = element.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;
        const viewportHeight = window.innerHeight || 0;
        const cardHeight = rect.height || 0;

        if (!viewportHeight) {
          return;
        }

        let targetTop = absoluteTop;

        if (cardHeight > 0 && cardHeight < viewportHeight) {
          const available = viewportHeight - cardHeight;
          const topMargin = available * 0.25; // 上方留 25% 的可用空间
          targetTop = Math.max(absoluteTop - topMargin, 0);
        } else {
          // 卡片比视口高或等高时，稍微向下滚一点，不要顶在最上方
          targetTop = Math.max(absoluteTop - viewportHeight * 0.1, 0);
        }

        window.scrollTo({ top: targetTop, behavior: "smooth" });
      } catch (e) {
        devLog("scroll to output failed", e);
      }
    }
  }, [isGenerating]);

  useEffect(() => {
    if (isGenerating && outputScrollRef.current) {
      try {
        const el = outputScrollRef.current;
        el.scrollTop = el.scrollHeight;
      } catch (e) {
        devLog("scroll generated content failed", e);
      }
    }
  }, [generatedStory, isGenerating]);

  // ========== MEMOIZED HANDLERS (Performance optimization: prevents recreation on every render) ==========

  // Quick add chips handler - appends to existing prompt
  const handleQuickAdd = useCallback((text: string) => {
    setPrompt(prev => {
      const addition = prev.trim() ? `. ${text}` : text;
      return (prev + addition).slice(0, 2000);
    });
  }, []); // Empty deps because using functional setState

  // Story preset handler - replaces entire prompt with template
  const handlePresetClick = useCallback((preset: typeof STORY_PRESETS[number]) => {
    setPrompt(PRESET_TEMPLATES[preset.title as keyof typeof PRESET_TEMPLATES] || preset.desc);
  }, [PRESET_TEMPLATES]);

  // Random prompt generator
  const handleRandomPrompt = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * RANDOM_PROMPTS.length);
    setPrompt(RANDOM_PROMPTS[randomIndex]);
  }, [RANDOM_PROMPTS]);

  // Confetti celebration for first-time story generation
  const triggerFirstTimeConfetti = useCallback(async () => {
    // Check if user has generated a story before
    const hasGeneratedBefore = localStorage.getItem('hasGeneratedStory');

    if (!hasGeneratedBefore) {
      // Trigger confetti animation
      if (!confettiModuleRef.current) {
        const mod = await import("canvas-confetti");
        confettiModuleRef.current = (mod as any).default || (mod as any);
      }
      const confetti = confettiModuleRef.current;
      if (typeof confetti !== "function") return false;
      confetti({
        particleCount: 200,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
        startVelocity: 30,
        gravity: 1,
        scalar: 1.2,
        ticks: 300
      });

      // Mark as generated
      localStorage.setItem('hasGeneratedStory', 'true');

      return true; // Return whether this is first time
    }

    return false;
  }, []);

  // Handle clicking the generate button - trigger invisible Turnstile verification
  const handleGenerateClick = useCallback(() => {
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

  // Perform story generation with Turnstile token
  const performStoryGeneration = useCallback(async (turnstileToken: string) => {
    devLog("=== Starting story generation after verification ===");

    // Get latest advanced options from ref (to avoid stale closure)
    const latestOptions = advancedOptionsRef.current;

    devLog("=== CURRENT STATE - All Options ===");
    devLog({
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      promptLength: prompt.length,
      selectedModel,
      advancedOptions: latestOptions,
      locale,
      turnstileToken: `Present (${turnstileToken.length} chars)`
    });
    devLog("⚠️ Note: If all advancedOptions are 'none', they won't affect the generated prompt");

    try {
      // 开始新一轮生成时，认为是一个全新的故事，清除上一轮的“已保存”状态
      setHasSavedCurrentStory(false);
      setIsGenerating(true);
      setGeneratedStory("");

      const requestBody = {
        prompt: prompt.trim(),
        model: selectedModel,
        locale: locale,
        outputLanguage: latestOptions.language,
        format: latestOptions.format,
        length: latestOptions.length,
        genre: latestOptions.genre,
        perspective: latestOptions.perspective,
        audience: latestOptions.audience,
        tone: latestOptions.tone,
        turnstileToken: turnstileToken,
      };

      devLog("=== Request body to API ===", JSON.stringify(requestBody, null, 2));

      const response = await fetch("/api/story-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      devLog("=== Response status ===", response.status, response.statusText);
      devLog("=== Response headers ===", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        devLog("=== Response not OK ===");
        const errorData = await response.json();
        devLog("Error data:", errorData);
        const isVerificationError = errorData.message === "verification failed" || errorData.message === "verification required";
        toast.error(isVerificationError ? section.toasts.error_verification_failed : section.toasts.error_generate_failed);
        return;
      }

      devLog("=== Starting to read stream ===");

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        devLog("=== No reader available ===");
        toast.error(section.toasts.error_no_stream);
        return;
      }

      let accumulatedText = "";
      let chunkCount = 0;
      let buffer = ""; // Buffer for incomplete lines

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          devLog(`=== Stream finished, total chunks: ${chunkCount} ===`);
          break;
        }

        chunkCount++;

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        devLog(`=== Frontend chunk ${chunkCount} ===`, chunk.substring(0, 100));

        // Add to buffer
        buffer += chunk;

        // Split by newlines but keep the last incomplete line in buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep last incomplete line

        for (const line of lines) {
          if (line.startsWith("0:")) {
            // Extract the text content from the data stream
            try {
              const jsonStr = line.slice(2); // Remove "0:" prefix
              devLog("=== Parsing line ===", jsonStr.substring(0, 50));
              const parsed = JSON.parse(jsonStr);

              if (typeof parsed === "string") {
                accumulatedText += parsed;
                setGeneratedStory(accumulatedText);
                devLog("=== Accumulated text length ===", accumulatedText.length);
              }
            } catch (e) {
              // Skip invalid JSON lines
              devLog("JSON Parse error:", e, "Line:", line.substring(0, 100));
            }
          }
        }
      }

      devLog("=== Final accumulated text length ===", accumulatedText.length);

      if (accumulatedText.trim()) {
        // Check if this is first time and trigger confetti
        const isFirstTime = await triggerFirstTimeConfetti();

        // Save story to LocalStorage
        try {
          const selectedModelName = AI_MODELS.find(m => m.id === selectedModel)?.name || '';
          StoryStorage.saveStory({
            title: prompt.substring(0, 30) + (prompt.length > 30 ? '...' : ''),
            prompt: prompt,
            content: accumulatedText,
            wordCount: calculateWordCount(accumulatedText),
            model: selectedModelName,
            format: latestOptions.format !== 'none' ? latestOptions.format : undefined,
            genre: latestOptions.genre !== 'none' ? latestOptions.genre : undefined,
            tone: latestOptions.tone !== 'none' ? latestOptions.tone : undefined,
          });
        } catch (error) {
          devLog('Failed to save story:', error);
        }

        if (isFirstTime) {
          // Special celebration message for first-time success
          toast.success('🎉 ' + section.toasts.success_generated, {
            duration: 5000,
            description: locale === 'zh' ? '你的第一个AI故事诞生了!' :
              locale === 'ja' ? '最初のAIストーリーが誕生しました!' :
                locale === 'ko' ? '첫 번째 AI 스토리가 탄생했습니다!' :
                  locale === 'de' ? 'Ihre erste KI-Geschichte wurde erstellt!' :
                    'Your first AI story is born!'
          });
        } else {
          // Regular success message
          toast.success(section.toasts.success_generated);
        }
      } else {
        devLog("=== No story content was generated ===");
        toast.error(section.toasts.error_no_content);
      }
    } catch (error) {
      devLog("=== Story generation error ===", error);
      toast.error(section.toasts.error_generate_failed);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedModel, locale, section, AI_MODELS, triggerFirstTimeConfetti]);
  // Note: advancedOptions are accessed via ref, so not in dependency array

  // Handle Turnstile verification success
  const handleTurnstileSuccess = useCallback((token: string) => {
    devLog("✓ Turnstile verification successful");
    setTurnstileToken(token);
    // Automatically start generation after verification
    performStoryGeneration(token);
  }, [performStoryGeneration]);

  // Handle Turnstile error
  const handleTurnstileError = useCallback(() => {
    console.error("❌ Turnstile verification failed");
    setIsGenerating(false);
    toast.error(section.toasts.error_verification_failed);
  }, [section]);

  // Listen for Quick Start event from Hero
  useEffect(() => {
    const handleQuickStart = () => {
      devLog("⚡ Quick Start triggered!");

      // 1. Select Standard Model if not selected
      if (selectedModel !== 'standard') {
        setSelectedModel('standard');
      }

      // 2. Generate Random Prompt
      const randomIndex = Math.floor(Math.random() * RANDOM_PROMPTS.length);
      const randomPrompt = RANDOM_PROMPTS[randomIndex];
      setPrompt(randomPrompt);

      // 3. Trigger Generation (needs a small delay to ensure state updates)
      // We use a timeout to allow the state updates to propagate
      setTimeout(() => {
        // We can't call handleGenerateClick directly because it uses the *current* state 
        // which might be stale in this closure or not yet updated.
        // However, since we're setting state above, we need to ensure the next render sees it.
        // A better approach for "auto-submit" is often a separate useEffect that watches a flag,
        // but for simplicity here, we'll manually trigger the ref execution if we have the data.

        if (turnstileRef.current) {
          setIsGenerating(true);
          turnstileRef.current.execute();
        }
      }, 100);
    };

    window.addEventListener('quick-start-story', handleQuickStart);
    return () => window.removeEventListener('quick-start-story', handleQuickStart);
  }, [RANDOM_PROMPTS, selectedModel]); // Dependencies needed for the logic inside

  // PDF export handler
  const handleExportPdf = useCallback(async () => {
    if (!generatedStory.trim()) {
      toast.error(section.toasts.error_no_content);
      return;
    }

    try {
      setIsExportingPdf(true);

      // 获取选中模型的名称
      const selectedModelName = AI_MODELS.find(model => model.id === selectedModel)?.name || '';

      // 准备PDF元数据
      const metadata: StoryMetadata = {
        title: section.output.title || 'AI Generated Story',
        prompt: prompt.substring(0, 200) + (prompt.length > 200 ? '...' : ''),
        wordCount,
        generatedAt: new Date(),
        model: selectedModelName,
        format: selectedFormat !== 'none' ? selectedFormat : undefined,
        genre: selectedGenre !== 'none' ? selectedGenre : undefined,
        tone: selectedTone !== 'none' ? selectedTone : undefined,
      };

      // 准备PDF翻译
      const pdfTranslations = {
        generated_at: section.pdf.generated_at,
        word_count_label: section.pdf.word_count_label,
        ai_model: section.pdf.ai_model,
        story_format: section.pdf.story_format,
        story_genre: section.pdf.story_genre,
        story_tone: section.pdf.story_tone,
        prompt: section.pdf.prompt,
        footer_text: section.pdf.footer_text,
        page_indicator: section.pdf.page_indicator,
      };

      const { exportStoryToPdf } = await import("@/lib/pdf-export");

      // 导出PDF (传递locale和翻译)
      await exportStoryToPdf(generatedStory, metadata, locale, pdfTranslations, (progress: number) => {
        devLog(`PDF export progress: ${progress}%`);
      });

      toast.success(section.toasts.success_pdf_exported);

    } catch (error) {
      devLog('PDF export failed:', error);
      toast.error(section.toasts.error_pdf_export_failed);
    } finally {
      setIsExportingPdf(false);
    }
  }, [generatedStory, prompt, wordCount, selectedModel, selectedFormat, selectedGenre, selectedTone, locale, section]);

  // Load story from history
  const handleLoadStory = useCallback((story: SavedStory) => {
    // Load prompt and story content
    setPrompt(story.prompt);
    setGeneratedStory(story.content);

    // Load model selection
    const modelToSelect = AI_MODELS.find(m => m.name === story.model);
    if (modelToSelect) {
      setSelectedModel(modelToSelect.id);
    }

    // Load parameters
    if (story.format) setSelectedFormat(story.format);
    if (story.genre) setSelectedGenre(story.genre);
    if (story.tone) setSelectedTone(story.tone);

    // Show success toast
    toast.success(
      locale === 'zh' ? '故事已加载' :
        locale === 'ja' ? 'ストーリーを読み込みました' :
          locale === 'ko' ? '스토리가 로드되었습니다' :
            locale === 'de' ? 'Geschichte geladen' :
              'Story loaded'
    );
  }, [AI_MODELS, locale]);

  // Share translations
  const shareTranslations = useMemo(() => ({
    title: locale === 'zh' ? '分享' : locale === 'ja' ? '共有' : 'Share',
    copy_link: locale === 'zh' ? '复制链接' : locale === 'ja' ? 'リンクをコピー' : 'Copy Link',
    share_twitter: 'Twitter',
    share_facebook: 'Facebook',
    share_linkedin: 'LinkedIn',
    link_copied: locale === 'zh' ? '链接已复制' : locale === 'ja' ? 'リンクをコピーしました' : 'Link copied!',
    share_text_template: locale === 'zh' ? '我用AI写了一个 {wordCount} 字的故事！' : locale === 'ja' ? 'AIで{wordCount}文字の物語を書きました！' : 'I wrote a {wordCount} word story with AI!',
  }), [locale]);

  // Reset for new story
  const handleCreateAnother = useCallback(() => {
    setGeneratedStory("");
    setPrompt("");
    setHasSavedCurrentStory(false);
    // Scroll to the top of the story generation section
    const element = document.getElementById('craft_story');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleSaveClick = useCallback(() => {
    if (!generatedStory.trim()) {
      toast.error(section.toasts.error_no_content);
      return;
    }

    if (!user) {
      setShowSignModal(true);
      return;
    }

    setIsSaveDialogOpen(true);
  }, [generatedStory, section, user, setShowSignModal]);

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
      if (!generatedStory.trim()) {
        toast.error(section.toasts.error_no_content);
        return;
      }

      try {
        setIsSavingStory(true);

        const latestOptions = advancedOptionsRef.current;

        const settings: Record<string, unknown> = {
          locale,
          outputLanguage: latestOptions.language,
        };

        if (latestOptions.format !== "none") {
          settings.format = latestOptions.format;
        }
        if (latestOptions.length !== "none") {
          settings.length = latestOptions.length;
        }
        if (latestOptions.genre !== "none") {
          settings.genre = latestOptions.genre;
        }
        if (latestOptions.perspective !== "none") {
          settings.perspective = latestOptions.perspective;
        }
        if (latestOptions.audience !== "none") {
          settings.audience = latestOptions.audience;
        }
        if (latestOptions.tone !== "none") {
          settings.tone = latestOptions.tone;
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
            title:
              prompt.substring(0, 30) + (prompt.length > 30 ? "..." : ""),
            prompt,
            content: generatedStory,
            wordCount,
            modelUsed: actualModel,
            settings,
            status,
            visibility: status === "published" ? "public" : "private",
            sourceCategory: "story",
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

        // 标记当前故事已经成功保存，禁用 Save Story 按钮
        setHasSavedCurrentStory(true);

        setIsSaveDialogOpen(false);
      } catch (error) {
        devLog("save story failed", error);
        toast.error(
          locale === "zh"
            ? "保存失败，请稍后再试"
            : "Failed to save story, please try again."
        );
      } finally {
        setIsSavingStory(false);
      }
    },
    [
      generatedStory,
      section,
      locale,
      AI_MODELS,
      selectedModel,
      prompt,
      wordCount,
      setShowSignModal,
    ]
  );

  // ========== RENDER ==========

  return (
    <section
      id="craft_story"
      className="min-h-screen relative overflow-hidden bg-background text-foreground selection:bg-orange-500/20"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.05_65),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.18_0.04_65),transparent)]" />
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-orange-500/[0.04] via-orange-500/[0.02] to-transparent" />
        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]" style={{ backgroundImage: 'var(--bg-grid)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="w-full max-w-6xl mx-auto px-6 py-24 sm:py-32 relative">

        {/* Header */}
        <div className="relative text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="flex items-center justify-center size-14 rounded-2xl bg-orange-500/10">
              <Icon name="book" className="size-7 text-orange-600 dark:text-orange-400" />
            </div>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight mb-4 leading-[1.15]">
            {section.header.title}
          </h2>

          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto font-light">
            {section.header.subtitle}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/10 text-[10px] font-bold tabular-nums text-orange-600 dark:text-orange-400">1</span>
            <span>{section.prompt.label}</span>
            <span className="text-border/60">→</span>
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/10 text-[10px] font-bold tabular-nums text-orange-600 dark:text-orange-400">2</span>
            <span>{section.ai_models.title}</span>
            <span className="text-border/60">→</span>
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/10 text-[10px] font-bold tabular-nums text-orange-600 dark:text-orange-400">3</span>
            <span>{section.generate_button.text}</span>
          </div>
        </div>

        <GeneratorNavTabs />

        {/* Main Panel */}
        <div className="relative mt-10 animate-fade-in-up animation-delay-1000">
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">

              {/* Editor (8 cols) */}
              <div className="lg:col-span-8 p-5 sm:p-8 lg:border-r border-border">
                <div className="flex items-center justify-between mb-6">
                  <label className="text-sm font-semibold text-foreground">
                    {section.prompt.label}
                  </label>
                  <button
                    onClick={handleRandomPrompt}
                    type="button"
                    className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-xs font-medium transition-colors"
                  >
                    <Icon name="sparkles" className="size-3.5 text-orange-500 group-hover:rotate-12 transition-transform" />
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">{section.prompt.random_button}</span>
                  </button>
                </div>

                <div className="relative mb-6">
                  <Textarea
                    id="story-prompt-input"
                    ref={promptRef}
                    value={prompt}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      if (newValue.length <= 2000) {
                        setPrompt(e.target.value);
                      }
                    }}
                    placeholder={section.prompt.placeholder}
                    className="min-h-[240px] text-base p-5 rounded-xl bg-background border border-border focus:border-orange-500/50 focus-visible:ring-orange-500/20 transition-all resize-none"
                  />
                  <div className="pointer-events-none absolute bottom-3 right-4 text-xs font-medium text-muted-foreground/40">
                    {prompt.length} / 2000
                  </div>
                </div>

                {/* Quick Add Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground/60 mr-1">
                    {section.prompt.quick_adds_label}
                  </span>
                  {QUICK_ADD_CHIPS.map((chip, i) => (
                    <button
                      key={chip}
                      onClick={() => handleQuickAdd(chip)}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>

                {/* Language */}
                <div className="mt-8 flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground">{section.prompt.language_label}</span>
                  <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-auto border-0 bg-transparent hover:bg-muted/50 rounded-full gap-2 px-3 text-sm font-medium focus:ring-0 text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl p-1 min-w-[200px]">
                      {Object.entries(LANGUAGE_OPTIONS).map(([code, option]) => (
                        <SelectItem key={code} value={code} className="rounded-lg my-0.5 cursor-pointer">
                          <span className="mr-2 text-base opacity-80">{option.flag}</span>
                          <span className="font-medium">{option.native}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sidebar (4 cols) */}
              <div className="lg:col-span-4 bg-muted/30 p-5 sm:p-8 border-t lg:border-t-0 lg:border-l border-border">
                <div className="sticky top-20 space-y-8">

                  {/* History */}
                  <div className="flex items-center justify-between pb-6 border-b border-border">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {locale === 'zh' ? '历史记录' : 'HISTORY'}
                    </h3>
                    <StoryHistoryDropdown
                      onLoadStory={handleLoadStory}
                      locale={locale}
                    />
                  </div>

                  {/* Presets */}
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                      {section.presets.title}
                    </h3>
                    <div className="space-y-2">
                      {STORY_PRESETS.map((preset) => (
                        <button
                          key={preset.title}
                          onClick={() => handlePresetClick(preset)}
                          className="group w-full text-left p-4 rounded-xl bg-background hover:bg-background/80 border border-border hover:border-orange-300 dark:hover:border-orange-400/50 transition-all duration-200"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-foreground/50 group-hover:text-orange-500 group-hover:scale-110 transition-all duration-200">
                              {preset.icon}
                            </span>
                            <div>
                              <div className="font-medium text-foreground/80 group-hover:text-foreground transition-colors text-sm">
                                {preset.title}
                              </div>
                              <div className="text-xs text-muted-foreground/60 mt-0.5">
                                {preset.desc}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div className="pt-6 border-t border-border">
                    <details className="group">
                      <summary className="list-none flex items-center justify-between cursor-pointer py-2">
                        <div className="flex items-center gap-2">
                          <Icon name="sliders" className="size-4 text-muted-foreground" />
                          <span className="text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                            {section.advanced_options.title}
                          </span>
                        </div>
                        <Icon name="chevron-down" className="size-3.5 text-muted-foreground group-open:rotate-180 transition-transform duration-200" />
                      </summary>

                      <div className="mt-4 space-y-4">
                        {[
                          { label: section.advanced_options.format.label, value: selectedFormat, setter: handleFormatChange, opts: section.advanced_options.format.options },
                          { label: section.advanced_options.genre.label, value: selectedGenre, setter: handleGenreChange, opts: section.advanced_options.genre.options },
                          { label: section.advanced_options.tone.label, value: selectedTone, setter: handleToneChange, opts: section.advanced_options.tone.options },
                          { label: section.advanced_options.perspective.label, value: selectedPerspective, setter: handlePerspectiveChange, opts: section.advanced_options.perspective.options },
                          { label: section.advanced_options.audience.label, value: selectedAudience, setter: handleAudienceChange, opts: section.advanced_options.audience.options },
                          { label: section.advanced_options.length.label, value: selectedLength, setter: handleLengthChange, opts: section.advanced_options.length.options }
                        ].map((field, i) => (
                          <div key={i} className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground/60 ml-1">{field.label}</label>
                            <Select value={field.value} onValueChange={field.setter}>
                              <SelectTrigger className="w-full bg-background border-border rounded-lg text-sm hover:bg-muted/50 transition-colors focus:ring-0 text-foreground">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {Object.entries(field.opts).map(([k, v]) => (
                                  <SelectItem key={k} value={k === 'funny' ? 'humorous' : k} className="text-sm cursor-pointer">{v}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Model Selection */}
        <div className="space-y-6 animate-fade-in-up animation-delay-2000">
          <div className="flex items-center gap-3 mt-8">
            <h3 className="text-sm font-semibold text-foreground">
              {section.ai_models.title}
            </h3>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {AI_MODELS.map((model) => {
              const isSelected = selectedModel === model.id;
              return (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`group p-5 rounded-xl text-left transition-all duration-200 ${
                    isSelected
                      ? 'bg-orange-500/[0.08] border-2 border-orange-500/40'
                      : 'bg-card border border-border hover:border-orange-300 dark:hover:border-orange-400/50 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className={`transition-all ${isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground opacity-60 group-hover:opacity-100'}`}>
                      {model.icon}
                    </span>
                    {isSelected && (
                      <div className="size-5 rounded-full bg-orange-500 flex items-center justify-center">
                        <Icon name="check" className="size-3 text-white" />
                      </div>
                    )}
                  </div>

                  <h4 className={`text-sm font-bold tracking-tight mb-1 ${isSelected ? 'text-orange-900 dark:text-orange-100' : 'text-foreground/70 group-hover:text-foreground'}`}>
                    {model.name}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {model.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${model.badgeColor}`}>
                      {model.badge}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 font-medium">
                      {model.speed}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate Button */}
        <div id="generate-button" className="flex justify-center pt-6 animate-fade-in-up animation-delay-3000">
          <div className="relative group w-full max-w-md">
            <Button
              onClick={handleGenerateClick}
              className="w-full h-14 text-lg font-semibold bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white shadow-md shadow-orange-600/20 dark:bg-orange-500 dark:shadow-orange-500/20 dark:hover:bg-orange-600 rounded-xl border-none"
            >
              <div className="flex items-center justify-center gap-2">
                {isGenerating ? (
                  <>
                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="animate-pulse">{section.generate_button.generating}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-5" />
                    <span>{section.generate_button.text}</span>
                  </>
                )}
              </div>
            </Button>

            <GeneratorShortcutHints showQuickSave />

            {/* Usage Hints */}
            <div className="mt-6 space-y-3">
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="size-1.5 rounded-full bg-orange-400" />
                  <span>{locale === 'zh' ? '免费额度' : 'Free Credit'}</span>
                </div>
                <div className="hidden sm:block w-px h-3 bg-border" />
                <div>{locale === 'zh' ? '预计耗时: ~10秒' : 'Estimated: ~10 seconds'}</div>
                <div className="hidden sm:block w-px h-3 bg-border" />
                <div className="text-emerald-600 dark:text-emerald-400 font-medium">{locale === 'zh' ? '优质内容' : 'Premium Quality'}</div>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60 max-w-lg mx-auto">
                <Icon name="lightbulb" className="size-3 text-amber-500 shrink-0" />
                <span>{locale === 'zh' ? '提供具体的提示词可以获得更好的结果。' : 'Be specific in your prompt for better results.'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Generated Story Output */}
        {(isGenerating || generatedStory) && (
          <div ref={outputRef} className="mt-16 animate-fade-in-up">
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              {/* Header */}
              <div className="flex flex-col md:flex-row items-center justify-between p-6 md:p-8 border-b border-border bg-orange-500/[0.03] dark:bg-orange-500/[0.05] gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center size-10 rounded-xl bg-orange-500/10">
                    <Icon name="book-open" className="size-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-foreground">{section.output.title}</h3>
                    {generatedStory && (
                      <div className="text-sm text-muted-foreground/60 dark:text-muted-foreground/80 font-light mt-1">
                        {wordCount.toLocaleString()} words • {section.output.status_complete}
                      </div>
                    )}
                  </div>
                </div>

                {generatedStory && !isGenerating && (
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    <Button variant="ghost" size="sm" onClick={handleGenerateClick} className="gap-1.5 text-xs">
                      <Icon name="refresh-cw" className="size-3.5" /> {locale === 'zh' ? '重新生成' : 'Regenerate'}
                    </Button>

                    <StoryShareButtons
                      storyTitle={section.output.title}
                      wordCount={wordCount}
                      model={AI_MODELS.find(m => m.id === selectedModel)?.name || 'AI'}
                      locale={locale}
                      inviteCode={user?.invite_code}
                      translations={shareTranslations}
                    />

                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(generatedStory); toast.success(section.toasts.success_copied); }} className="gap-1.5 text-xs">
                      <Icon name="copy" className="size-3.5" /> {section.output.button_copy}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleExportPdf} disabled={isExportingPdf} className="gap-1.5 text-xs">
                      <Icon name="download" className="size-3.5" /> PDF
                    </Button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div
                ref={outputScrollRef}
                className="p-8 md:p-16 min-h-[320px] min-h-[320px] max-h-[480px] overflow-y-auto"
              >
                {isGenerating && !generatedStory ? (
                  <div className="h-full flex flex-col items-center justify-center gap-6 py-20">
                    {/* Generation Progress Component */}
                    <GenerationProgress
                      isGenerating={isGenerating}
                      tips={progressTips}
                      estimatedDuration={15}
                    />
                  </div>
                ) : (
                  <div className="prose prose-lg md:prose-xl dark:prose-invert max-w-4xl mx-auto font-serif leading-loose tracking-wide text-foreground">
                    <div className="whitespace-pre-wrap">
                      {generatedStory}
                      {isGenerating && <span className="inline-block w-2 h-6 ml-1 bg-orange-500 animate-pulse" />}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        )}

        {/* Completion Guide */}
        {generatedStory && !isGenerating && (
          <CompletionGuide
            onCreateAnother={handleCreateAnother}
            onSave={handleSaveClick}
            translations={section.completion_guide}
            isSaveDisabled={isSavingStory || hasSavedCurrentStory}
          />
        )}

        <StorySaveDialog
          open={isSaveDialogOpen}
          onOpenChange={setIsSaveDialogOpen}
          onSelect={handleConfirmSave}
          locale={locale}
          isSaving={isSavingStory}
        />

      </div>

      {/* Invisible Turnstile for non-interactive verification */}
      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={handleTurnstileSuccess}
        onError={handleTurnstileError}
      />
    </section>
  );
}
