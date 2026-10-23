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
const StoryShareDialog = dynamic(() => import("@/components/story/story-share-dialog"), {
  ssr: false,
  loading: () => null,
});

import type { TurnstileInvisibleHandle } from "@/components/TurnstileInvisible";
const TurnstileInvisible = dynamic(() => import("@/components/TurnstileInvisible"), {
  ssr: false,
  loading: () => null,
});
const CompletionGuide = dynamic(() => import("@/components/story/completion-guide"), {
  ssr: false,
  loading: () => null,
});
const GenerationProgress = dynamic(() => import("@/components/story/generation-progress"), {
  ssr: false,
  loading: () => null,
});
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  getContinueActionLabel,
  shouldGateAnonymousContinue,
} from "@/components/ai-write/workbench/_lib";
import {
  buildContinueIntentPayload,
  buildContinueTrackingPayload,
  CONTINUE_INTENT_KEY,
  GENERATOR_PREFILL_KEY,
} from "@/components/ai-write/workbench/continue-intent";
import { useOpenPanel } from "@openpanel/nextjs";
import { useCreativeQuotaPage } from "@/hooks/useCreativeQuotaPage";
const CreativeQuotaPaywall = dynamic(
  () =>
    import("@/components/blocks/creative-quota-paywall").then(
      (module) => module.CreativeQuotaPaywall
    ),
  {
    ssr: false,
    loading: () => null,
  }
);
const StorySaveDialog = dynamic(() => import("@/components/story/story-save-dialog"), {
  ssr: false,
  loading: () => null,
});
import type { StoryStatus } from "@/models/story";
import { useGeneratorShortcuts } from "@/hooks/useGeneratorShortcuts";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
import {
  buildPostAuthResumeTrackingPayload,
  consumePendingAuthResume,
  writePendingAuthResume,
} from "@/lib/auth-resume";
import {
  ACTIVATION_EVENTS,
  buildActivationTrackingPayload,
} from "@/lib/activation-funnel";

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
  const router = useRouter();
  const { user, requireAuth, setSignModalContext } = useAppContext();
  const { track } = useOpenPanel();
  const t = useTranslations("generation_progress");
  const creativeQuota = useCreativeQuotaPage("story-generator");

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
      badgeColor: 'bg-accent-sage text-primary border-primary/30',
      icon: <Zap className="h-4 w-4" />,
      speed: section.ai_models.models.fastest.speed,
      description: section.ai_models.models.fastest.description
    },
    {
      id: 'standard',
      name: section.ai_models.models.eloquent.name,
      badge: section.ai_models.models.eloquent.badge,
      badgeColor: 'bg-accent-blue text-foreground border-foreground/20',
      icon: <PenTool className="h-4 w-4" />,
      speed: section.ai_models.models.eloquent.speed,
      description: section.ai_models.models.eloquent.description
    },
    {
      id: 'creative',
      name: section.ai_models.models.creative.name,
      badge: section.ai_models.models.creative.badge,
      badgeColor: 'bg-accent-rose text-accent-copper border-accent-copper/30',
      icon: <Palette className="h-4 w-4" />,
      speed: section.ai_models.models.creative.speed,
      description: section.ai_models.models.creative.description
    }
  ], [section]);

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<string | null>("standard");
  const activeQuota = creativeQuota.forModel(selectedModel);
  const [selectedFormat, setSelectedFormat] = useState("none");
  const [selectedTone, setSelectedTone] = useState("none");
  const [selectedLanguage, setSelectedLanguage] = useState(locale);

  const [turnstileToken, setTurnstileToken] = useState<string>("");
  // creative 每日免费额度(localStorage 镜像,用于 UI 即时反馈)
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const confettiModuleRef = useRef<((opts?: any) => void) | null>(null);
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);
  const outputScrollRef = useRef<HTMLDivElement | null>(null);

  // Scroll-reveal animation system
  const [sectionVisible, setSectionVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const sgEnter = (delayMs: number) =>
    `transition-all duration-[800ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
      sectionVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
    }`;
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
    devLog(`Format changed: "${selectedFormat}" → "${value}"`);
    setSelectedFormat(value);
  }, [selectedFormat]);

  const handleLengthChange = useCallback((value: string) => {
    devLog(`Length changed: "${selectedLength}" → "${value}"`);
    setSelectedLength(value);
  }, [selectedLength]);

  const handleGenreChange = useCallback((value: string) => {
    devLog(`Genre changed: "${selectedGenre}" → "${value}"`);
    setSelectedGenre(value);
  }, [selectedGenre]);

  const handlePerspectiveChange = useCallback((value: string) => {
    devLog(`Perspective changed: "${selectedPerspective}" → "${value}"`);
    setSelectedPerspective(value);
  }, [selectedPerspective]);

  const handleAudienceChange = useCallback((value: string) => {
    devLog(`Audience changed: "${selectedAudience}" → "${value}"`);
    setSelectedAudience(value);
  }, [selectedAudience]);

  const handleToneChange = useCallback((value: string) => {
    devLog(`Tone changed: "${selectedTone}" → "${value}"`);
    setSelectedTone(value);
  }, [selectedTone]);

  const handleLanguageChange = useCallback((value: string) => {
    devLog(`Language changed: "${selectedLanguage}" → "${value}"`);
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
  const [savedStoryUuid, setSavedStoryUuid] = useState<string | null>(null);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    const resume = consumePendingAuthResume("save_story", {
      sourcePage: "story-generator",
    });
    if (!resume || resume.source !== "story_save") return;

    const payload = resume.payload;
    const resumedStory = typeof payload.generatedStory === "string" ? payload.generatedStory : "";
    if (!resumedStory.trim()) return;

    if (typeof payload.prompt === "string") setPrompt(payload.prompt);
    setGeneratedStory(resumedStory);
    if (typeof payload.selectedModel === "string") setSelectedModel(payload.selectedModel);
    if (typeof payload.selectedFormat === "string") setSelectedFormat(payload.selectedFormat);
    if (typeof payload.selectedLength === "string") setSelectedLength(payload.selectedLength);
    if (typeof payload.selectedGenre === "string") setSelectedGenre(payload.selectedGenre);
    if (typeof payload.selectedPerspective === "string") setSelectedPerspective(payload.selectedPerspective);
    if (typeof payload.selectedAudience === "string") setSelectedAudience(payload.selectedAudience);
    if (typeof payload.selectedTone === "string") setSelectedTone(payload.selectedTone);
    if (typeof payload.selectedLanguage === "string") setSelectedLanguage(payload.selectedLanguage);
    setHasSavedCurrentStory(false);
    setSavedStoryUuid(null);
    setIsSaveDialogOpen(true);
    track("post_auth_action_resumed", buildPostAuthResumeTrackingPayload(resume));
  }, [track, user]);

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
      // Desktop keeps the two-column workspace in place; only mobile needs to
      // travel down to the output panel after generation starts.
      if (window.innerWidth >= 1024) {
        return;
      }
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

  // Bring the editor back into view after an example / preset fills the prompt.
  const focusPrompt = useCallback(() => {
    window.setTimeout(() => {
      if (!promptRef.current) return;
      promptRef.current.focus();
      if (window.innerWidth < 1024) {
        promptRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);
  }, []);

  // Story preset handler - replaces entire prompt with template
  const handlePresetClick = useCallback((preset: typeof STORY_PRESETS[number]) => {
    setPrompt(PRESET_TEMPLATES[preset.title as keyof typeof PRESET_TEMPLATES] || preset.desc);
    focusPrompt();
  }, [PRESET_TEMPLATES, focusPrompt]);

  // Random prompt generator
  const handleRandomPrompt = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * RANDOM_PROMPTS.length);
    setPrompt(RANDOM_PROMPTS[randomIndex]);
    focusPrompt();
  }, [RANDOM_PROMPTS, focusPrompt]);

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

    if (
      creativeQuota.guardAnonymousCreativeQuota({
        selectedModel,
        message: section.toasts.creative_limit_reached,
      }) || creativeQuota.guardCreativeCreditQuota({ selectedModel })
    ) {
      return;
    }

    // Start loading state while Turnstile verification is in progress
    setIsGenerating(true);
    track(
      ACTIVATION_EVENTS.generationStarted,
      buildActivationTrackingPayload({
        sourcePage: "story-generator",
        loggedIn: !!user,
        action: "generation_started",
        model: selectedModel,
      })
    );

    // Trigger invisible Turnstile verification
    // After verification succeeds, handleTurnstileSuccess will be called automatically
    turnstileRef.current?.execute();
  }, [creativeQuota, prompt, selectedModel, section, track, user]);

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
    devLog("Note: If all advancedOptions are 'none', they won't affect the generated prompt");

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
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (e) {
          devLog("Failed to parse error JSON:", e);
        }
        devLog("Error data:", errorData);
        const code = errorData.code as string | undefined;
        const isVerificationError =
          errorData.message === "verification failed" ||
          errorData.message === "verification required";

        if (creativeQuota.handleQuotaError(response.status, errorData)) return;
        // IP hard cap 触发(所有模型)
        if (response.status === 429 && code === "rate_limited") {
          toast.error(section.toasts.rate_limited);
          return;
        }
        if (isVerificationError) {
          toast.error(section.toasts.error_verification_failed);
          return;
        }
        toast.error(section.toasts.error_generate_failed);
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
        track(
          ACTIVATION_EVENTS.generationSucceeded,
          buildActivationTrackingPayload({
            sourcePage: "story-generator",
            loggedIn: !!user,
            action: "generation_succeeded",
            model: selectedModel,
            wordCount: calculateWordCount(accumulatedText),
          })
        );
        // 免费额度:localStorage 镜像 +1(后端 KV 已 +1)
        creativeQuota.increment(selectedModel);
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
          toast.success(section.toasts.success_generated, {
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
      track(
        ACTIVATION_EVENTS.generationFailed,
        buildActivationTrackingPayload({
          sourcePage: "story-generator",
          loggedIn: !!user,
          action: "generation_failed",
          model: selectedModel,
        })
      );
      toast.error(section.toasts.error_generate_failed);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedModel, locale, section, AI_MODELS, creativeQuota, triggerFirstTimeConfetti, router, track, user]);
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
    console.error("Turnstile verification failed");
    setIsGenerating(false);
    toast.error(section.toasts.error_verification_failed);
  }, [section]);

  // Listen for Quick Start event from Hero
  useEffect(() => {
    const handleQuickStart = () => {
      devLog("Quick Start triggered!");

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
      writePendingAuthResume({
        source: "story_save",
        action: "save_story",
        sourcePage: "story-generator",
        startedAt: Date.now(),
        payload: {
          prompt,
          generatedStory,
          selectedModel,
          selectedFormat,
          selectedLength,
          selectedGenre,
          selectedPerspective,
          selectedAudience,
          selectedTone,
          selectedLanguage,
        },
      });
      requireAuth({ source: "story_save", action: "save_story", sourcePage: "story-generator" });
      return;
    }

    setIsSaveDialogOpen(true);
    track(
      ACTIVATION_EVENTS.saveDialogOpen,
      buildActivationTrackingPayload({
        sourcePage: "story-generator",
        loggedIn: true,
        action: "save_dialog_open",
        model: selectedModel,
        wordCount,
      })
    );
  }, [
    generatedStory,
    prompt,
    requireAuth,
    section,
    selectedAudience,
    selectedFormat,
    selectedGenre,
    selectedLanguage,
    selectedLength,
    selectedModel,
    selectedPerspective,
    selectedTone,
    user,
  ]);

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

        const { code, message, data } = await resp.json();

        if (code !== 0) {
          if (message === "no auth") {
            requireAuth({ source: "story_save", action: "save_story", sourcePage: "story-generator" });
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
        if (data?.uuid) {
          setSavedStoryUuid(data.uuid as string);
        }
        track(
          ACTIVATION_EVENTS.storySaved,
          buildActivationTrackingPayload({
            sourcePage: "story-generator",
            loggedIn: true,
            action: "story_saved",
            model: selectedModel,
            wordCount,
          })
        );
        track(ACTIVATION_EVENTS.activationCompleted, {
          source_page: "story-generator",
          action: "story_saved",
        });

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
      requireAuth,
      track,
    ]
  );

  const handleContinueInAiWrite = useCallback(() => {
    if (!generatedStory.trim()) {
      return;
    }

    track(
      "continue_ai_write_cta_click",
      buildContinueTrackingPayload({
        source_page: "story-generator",
        logged_in: !!user,
        cta_variant: user ? "continue_ai_write" : "sign_in_to_continue_ai_write",
      })
    );

    const payload = buildContinueIntentPayload({
      source: "story-generator",
      title: prompt,
      content: generatedStory,
      storyUuid: savedStoryUuid ?? undefined,
    });

    // 匿名用户已有生成内容 → 先落地 prefill + 跳转意图，再弹登录
    if (
      shouldGateAnonymousContinue({
        hasUser: !!user,
        hasGeneratedContent: !!generatedStory.trim(),
      })
    ) {
      try {
        window.localStorage.setItem(CONTINUE_INTENT_KEY, JSON.stringify(payload));
        window.localStorage.setItem(GENERATOR_PREFILL_KEY, JSON.stringify(payload.prefill));
      } catch {
        // ignore prefill cache failures
      }

      track(
        "sign_modal_open_for_continue",
        buildContinueTrackingPayload({
          source_page: "story-generator",
        })
      );
      setSignModalContext({
        mode: "continue-ai-write",
        source: payload.source,
        redirectTo: payload.redirectTo,
      });
      requireAuth({ source: "ai_write", action: "continue_writing", sourcePage: "story-generator" });
      return;
    }

    // 已登录:有 savedStoryUuid 直接带 story 参数,否则先落地 prefill 再跳转
    if (savedStoryUuid) {
      router.push(payload.redirectTo as any);
      return;
    }

    try {
      window.localStorage.setItem(GENERATOR_PREFILL_KEY, JSON.stringify(payload.prefill));
    } catch {
      // ignore prefill cache failures
    }

    router.push(payload.redirectTo as any);
  }, [generatedStory, prompt, router, savedStoryUuid, user, track, setSignModalContext, requireAuth]);

  // ========== RENDER ==========

  // 当前档位每日免费额度已用完(匿名)→ 按钮文案切换为登录引导
  const creativeQuotaExhausted =
    activeQuota?.anonymousExhausted ?? false;

  const selectedModelName =
    AI_MODELS.find((model) => model.id === selectedModel)?.name ?? "";

  return (
    <section
      id="craft_story"
      className="relative scroll-mt-24 overflow-hidden border-y border-border/60 bg-muted text-foreground selection:bg-primary/15"
    >
      <div ref={sectionRef} className="relative mx-auto w-full max-w-[1210px] px-5 py-[56px] sm:px-8 sm:py-[80px]">

        {/* Header */}
        <div className="relative mb-8 text-center sm:text-left">

          {/* Eyebrow */}
          <div
            className={`mb-5 flex justify-center sm:justify-start ${sgEnter(0)}`}
            style={{ transitionDelay: sectionVisible ? "0ms" : "0ms" }}
          >
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.19em] text-accent-copper">
              <span className="inline-block size-1.5 rounded-full bg-accent-copper" />
              AI Story Generator
            </span>
          </div>

          {/* Title */}
          <div
            className={`${sgEnter(100)}`}
            style={{ transitionDelay: sectionVisible ? "100ms" : "0ms" }}
          >
            <h2 className="font-display text-[clamp(2.35rem,5vw,4rem)] font-normal leading-[0.98] tracking-[-0.06em]">
              {section.header.title}
            </h2>
          </div>

          {/* Subtitle */}
          <div
            className={`mt-4 ${sgEnter(250)}`}
            style={{ transitionDelay: sectionVisible ? "250ms" : "0ms" }}
          >
            <p className="mx-auto max-w-xl font-serif text-[17px] leading-[1.55] text-muted-foreground sm:mx-0">
              {section.header.subtitle}
            </p>
          </div>

        </div>

        <div className="hidden border-y border-border/70 bg-card md:block">
          <GeneratorNavTabs autoMarquee={false} />
        </div>

        {/* Main Workbench Panel — two-column workspace */}
        <div
          className={`relative mt-5 ${sgEnter(400)}`}
          style={{ transitionDelay: sectionVisible ? "400ms" : "0ms" }}
        >
          <div className="overflow-hidden rounded-[2px] border border-border bg-card shadow-[6px_7px_0_rgba(36,77,61,0.08)] dark:shadow-[6px_7px_0_rgba(0,0,0,0.45)]">
            <div className="relative grid grid-cols-1 lg:grid-cols-[1.6fr_1fr]">

              {/* Left: editor + controls */}
              <div className="flex flex-col p-5 sm:p-7">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <label
                    htmlFor="story-prompt-input"
                    className="text-[16px] font-semibold tracking-[-0.01em] text-foreground"
                  >
                    {section.prompt.label}
                    {section.prompt.required && (
                      <span className="ml-2 align-middle text-[10px] font-normal uppercase tracking-[0.12em] text-muted-foreground/60">
                        {section.prompt.required}
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={handleRandomPrompt}
                    className="group inline-flex items-center gap-2 rounded-[2px] border border-border bg-transparent px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent-sage/50 hover:text-foreground"
                  >
                    <Icon name="sparkles" className="size-3.5 text-muted-foreground/50 transition-colors group-hover:text-accent-copper" />
                    <span>{section.prompt.random_button}</span>
                  </button>
                </div>

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
                  className="min-h-[170px] max-h-[320px] resize-y rounded-[2px] border border-border bg-[#f7f4eb] p-4 font-serif text-[16px] leading-[1.6] text-foreground transition-all focus:border-primary/50 focus-visible:ring-primary/20 dark:bg-input/40"
                />

                <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
                  <p className="max-w-[460px] text-[11px] leading-relaxed text-muted-foreground/65">
                    {section.generate_button.tip}
                  </p>
                  <span className="ml-auto shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground/60">
                    {section.prompt.character_counter.replace("{count}", String(prompt.length))}
                  </span>
                </div>

                {/* Quick adds + language */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">
                    {section.prompt.quick_adds_label}
                  </span>
                  {QUICK_ADD_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleQuickAdd(chip)}
                      className="rounded-[2px] border border-border bg-transparent px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent-sage/50 hover:text-foreground"
                    >
                      + {chip}
                    </button>
                  ))}
                  <div className="ml-auto flex shrink-0 items-center gap-2 max-sm:ml-0">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">
                      {section.prompt.language_label}
                    </span>
                    <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                      <SelectTrigger className="h-9 w-auto gap-2 rounded-[2px] border border-border bg-transparent px-3 text-[12px] font-medium text-foreground hover:bg-accent-sage/50 focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="min-w-[200px] rounded-[2px] p-1">
                        {Object.entries(LANGUAGE_OPTIONS).map(([code, option]) => (
                          <SelectItem key={code} value={code} className="my-0.5 cursor-pointer rounded-[2px]">
                            <span className="mr-2 text-base opacity-80">{option.flag}</span>
                            <span className="font-medium">{option.native}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Model selection */}
                <div className="mt-6">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <h3 className="font-display text-[19px] font-normal leading-tight tracking-[-0.02em] text-foreground">
                      {section.ai_models.title}
                    </h3>
                    <p className="max-w-[300px] text-right text-[11px] leading-snug text-muted-foreground/65 max-sm:text-left">
                      {section.ai_models.hint}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 max-sm:grid-cols-1">
                    {AI_MODELS.map((model) => {
                      const isSelected = selectedModel === model.id;
                      return (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => setSelectedModel(model.id)}
                          className={`group relative flex min-h-[132px] flex-col items-start border p-4 text-left transition-all duration-300 ${
                            isSelected
                              ? "border-primary bg-accent-sage ring-1 ring-primary shadow-[4px_4px_0_rgba(36,77,61,0.12)]"
                              : "border-border bg-transparent hover:border-primary/40 hover:bg-card"
                          } ${creativeQuota.forModel(model.id)?.exhausted ? "opacity-60" : ""}`}
                        >
                          {creativeQuota.forModel(model.id)?.exhausted && (
                            <span
                              className="absolute right-2 top-2 size-1.5 rounded-full bg-warning ring-2 ring-background"
                              title={section.quota.creative_used_up}
                            />
                          )}
                          <span className={`font-display text-[20px] leading-tight tracking-[-0.02em] transition-colors ${isSelected ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"}`}>
                            {model.name}
                          </span>
                          <span className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/65">
                            {model.badge}
                          </span>
                          <span className="mt-auto pt-4 text-[12px] font-semibold leading-snug text-primary">
                            {model.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Advanced options — inline, collapsed by default */}
                <div className="mt-4 border-t border-border pt-1">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-2 py-2">
                      <Icon name="chevron-down" className="size-3.5 text-muted-foreground/60 transition-transform duration-300 group-open:rotate-180" />
                      <span className="text-[13px] font-semibold text-foreground/80 transition-colors group-hover:text-foreground">
                        {section.advanced_options.title}
                      </span>
                      {selectedOptionsCount > 0 && (
                        <span className="inline-flex size-4 items-center justify-center rounded-full bg-accent-sage text-[9px] font-bold text-accent-copper">
                          {selectedOptionsCount}
                        </span>
                      )}
                      <span className="ml-auto text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/45">
                        {section.advanced_options.optional_badge}
                      </span>
                    </summary>

                    <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                      {[
                        { label: section.advanced_options.format.label, value: selectedFormat, setter: handleFormatChange, opts: section.advanced_options.format.options },
                        { label: section.advanced_options.genre.label, value: selectedGenre, setter: handleGenreChange, opts: section.advanced_options.genre.options },
                        { label: section.advanced_options.tone.label, value: selectedTone, setter: handleToneChange, opts: section.advanced_options.tone.options },
                        { label: section.advanced_options.perspective.label, value: selectedPerspective, setter: handlePerspectiveChange, opts: section.advanced_options.perspective.options },
                        { label: section.advanced_options.audience.label, value: selectedAudience, setter: handleAudienceChange, opts: section.advanced_options.audience.options },
                        { label: section.advanced_options.length.label, value: selectedLength, setter: handleLengthChange, opts: section.advanced_options.length.options }
                      ].map((field, i) => (
                        <div key={i} className="space-y-1">
                          <label className="ml-0.5 text-[10px] font-medium text-muted-foreground">{field.label}</label>
                          <Select value={field.value} onValueChange={field.setter}>
                            <SelectTrigger className="h-9 w-full rounded-[2px] border-border bg-card text-[11px] text-foreground transition-colors hover:bg-accent-sage/40 focus:ring-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-[2px]">
                              {Object.entries(field.opts).map(([k, v]) => (
                                <SelectItem key={k} value={k === 'funny' ? 'humorous' : k} className="cursor-pointer text-[11px]">{v as string}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>

                {/* Generate */}
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div id="generate-button" className="w-full sm:w-auto">
                    <Button
                      onClick={handleGenerateClick}
                      className="h-12 w-full rounded-[2px] border-none bg-primary px-8 text-[13px] font-semibold text-primary-foreground shadow-[4px_4px_0_rgba(36,77,61,0.16)] transition-all duration-300 hover:bg-primary/90 hover:shadow-[6px_6px_0_rgba(36,77,61,0.16)] active:scale-[0.99] disabled:opacity-50 sm:w-auto"
                    >
                      <span className="flex items-center justify-center gap-2.5">
                        {isGenerating ? (
                          <>
                            <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                            <span className="animate-pulse">{section.generate_button.generating}</span>
                          </>
                        ) : (
                          <span>{creativeQuotaExhausted ? section.generate_button.sign_in_for_more : section.generate_button.text}</span>
                        )}
                      </span>
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground/65 sm:justify-end sm:text-right">
                    <span>{section.generate_button.info.credit}</span>
                    <span className="size-0.5 rounded-full bg-border" />
                    <span>{section.generate_button.info.time}</span>
                    <span className="size-0.5 rounded-full bg-border" />
                    <span>{section.generate_button.info.quality}</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-primary" />
                    <span className="font-semibold text-foreground">{selectedModelName}</span>
                    <span className="text-primary">{section.ai_models.selected}</span>
                  </span>
                  {activeQuota && (
                    <span className={activeQuota.exhausted ? "text-warning" : "text-muted-foreground/60"}>
                      {activeQuota.exhausted
                        ? user
                          ? section.quota.creative_credits_hint.replace("{cost}", String(activeQuota.effectiveCreditCost))
                          : section.quota.creative_used_up
                        : `${section.quota.remaining_today}: ${activeQuota.remaining}/${activeQuota.effectiveLimit}`}
                    </span>
                  )}
                </div>

                {creativeQuota.paywallOpen && (
                  <CreativeQuotaPaywall
                    open={creativeQuota.paywallOpen}
                    onClose={() => creativeQuota.setPaywallOpen(false)}
                    sourcePage="story-generator"
                  />
                )}
              </div>

              {/* Right: output workspace */}
              <div
                ref={outputRef}
                className="flex min-h-0 flex-col overflow-hidden border-t border-border bg-[#f7f4eb]/60 p-3 dark:bg-input/20 sm:p-4 lg:absolute lg:inset-y-0 lg:right-0 lg:w-[38.4615%] lg:border-l lg:border-t-0"
              >
                <div className="mb-3 flex justify-end">
                  <StoryHistoryDropdown
                    onLoadStory={handleLoadStory}
                    locale={locale}
                  />
                </div>

                {!isGenerating && !generatedStory && (
                  <div className="flex min-h-[420px] flex-1 flex-col rounded-[2px] border border-dashed border-border/80 bg-card/40 p-5 sm:p-6 lg:min-h-0">
                    <div className="flex flex-1 flex-col items-center justify-center">
                      <div className="flex w-full max-w-[320px] flex-col items-center text-center">
                        <div className="flex size-16 items-center justify-center rounded-full bg-accent-sage">
                          <Sparkles className="size-6 text-accent-copper" />
                        </div>
                        <p className="mt-5 font-display text-[22px] font-normal leading-tight tracking-[-0.02em] text-foreground">
                          {locale === 'zh' ? '你的故事将在这里呈现' : 'Your story will appear here'}
                        </p>
                        <p className="mt-2 max-w-[280px] font-serif text-[14px] leading-relaxed text-muted-foreground">
                          {locale === 'zh' ? '填写提示词，点击生成按钮开始创作' : 'Fill in a prompt above and click generate'}
                        </p>
                        <button
                          type="button"
                          onClick={handleRandomPrompt}
                          className="mt-5 inline-flex h-10 items-center gap-2 rounded-[2px] border border-border bg-card px-5 text-[12px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-accent-sage/50"
                        >
                          <Sparkles className="size-3.5 text-accent-copper" />
                          <span>{section.prompt.random_button}</span>
                        </button>

                        <div className="mt-6 w-full border-t border-border/70 pt-4 text-left">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/65">
                            {section.presets.title}
                          </p>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {STORY_PRESETS.map((preset) => (
                              <button
                                key={preset.title}
                                type="button"
                                onClick={() => handlePresetClick(preset)}
                                className="group flex items-start gap-2 rounded-[2px] border border-border bg-card/70 p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-accent-sage/40"
                              >
                                <span className="mt-0.5 shrink-0 text-accent-copper/70">{preset.icon}</span>
                                <span className="min-w-0">
                                  <span className="block truncate text-[11px] font-semibold text-foreground">{preset.title}</span>
                                  <span className="block truncate text-[10px] text-muted-foreground">{preset.desc}</span>
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isGenerating && !generatedStory && (
                  <div className="flex min-h-[420px] flex-1 flex-col items-center justify-center rounded-[2px] border border-dashed border-border/80 bg-card/40 p-4 lg:min-h-0">
                    <div className="w-full max-w-md [&>div]:border-0 [&>div]:bg-transparent [&>div]:p-4 [&>div]:shadow-none">
                      <GenerationProgress
                        isGenerating={isGenerating}
                        tips={progressTips}
                        estimatedDuration={15}
                      />
                    </div>
                  </div>
                )}

                {generatedStory && (
                  <div className="flex h-[560px] flex-col overflow-hidden rounded-[2px] border border-border bg-card lg:h-auto lg:min-h-0 lg:flex-1">
                    <div className="flex items-start justify-between gap-3 border-b border-border/70 p-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent-copper">
                          {section.output.title}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {section.output.word_count.replace("{count}", wordCount.toLocaleString())} · {isGenerating ? section.output.status_writing : section.output.status_complete}
                        </p>
                      </div>
                    </div>

                    {!isGenerating && (
                      <div className="flex flex-wrap gap-1.5 border-b border-border/70 p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateClick}
                          className="gap-1.5 text-[11px]"
                        >
                          <Icon name="refresh-cw" className="size-3.5" />
                          {locale === 'zh' ? '重新生成' : 'Regenerate'}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (!generatedStory.trim()) {
                              toast.error(section.toasts.error_no_content);
                              return;
                            }
                            setShareDialogOpen(true);
                          }}
                          className="gap-1.5 text-[11px]"
                        >
                          <Icon name="RiShareLine" className="size-3.5" />
                          {shareTranslations.title}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedStory);
                            toast.success(section.toasts.success_copied);
                          }}
                          className="gap-1.5 text-[11px]"
                        >
                          <Icon name="copy" className="size-3.5" />
                          {section.output.button_copy}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleExportPdf}
                          disabled={isExportingPdf}
                          className="gap-1.5 text-[11px]"
                        >
                          <Icon name="download" className="size-3.5" />
                          PDF
                        </Button>
                      </div>
                    )}

                    <div
                      ref={outputScrollRef}
                      className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5"
                    >
                      <div className="prose prose-sm max-w-none font-serif text-[16px] leading-[1.9] tracking-normal text-foreground dark:prose-invert">
                        <div className="whitespace-pre-wrap">
                          {generatedStory}
                          {isGenerating && <span className="ml-1 inline-block h-6 w-2 animate-pulse bg-foreground/70" />}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Completion Guide */}
        {generatedStory && !isGenerating && (
          <CompletionGuide
            onCreateAnother={handleCreateAnother}
            onSave={handleSaveClick}
            onContinue={handleContinueInAiWrite}
            continueLabel={getContinueActionLabel({ hasUser: !!user, locale })}
            continueHint={
              locale.startsWith("zh")
                ? "保留当前内容与上下文，登录后直接继续生成"
                : "Your content and context are preserved. Sign in to continue generating in AI Write."
            }
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

        <StoryShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          story={{
            title: prompt.substring(0, 30) + (prompt.length > 30 ? "..." : ""),
            content: generatedStory,
            prompt,
            sourceCategory: "story",
          }}
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
