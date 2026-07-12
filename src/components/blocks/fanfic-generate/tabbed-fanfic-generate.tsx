"use client";

import GeneratorNavTabs from "@/components/generator-nav-tabs";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import ShareResultButton from "@/components/story/share-result-button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { StepTabs } from "@/components/ui/step-tabs";
import { ModernCard, ModernCardContent, ModernCardHeader } from "@/components/ui/modern-card";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { GradientText } from "@/components/ui/gradient-text";
import { EnhancedBadge } from "@/components/ui/enhanced-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import Icon from "@/components/icon";
import { toast } from "sonner";
import { FanficGenerate as FanficGenerateType } from "@/types/blocks/fanfic-generate";
import { useLocale, useTranslations } from "next-intl";
import confetti from "canvas-confetti";
import { FanficStorage } from "@/lib/fanfic-storage";
import { PRESET_WORKS, getWorkById, getCharacterName, getCharacterById, getWorkName } from "@/lib/preset-works";
import { cn } from "@/lib/utils";
import TurnstileInvisible, { TurnstileInvisibleHandle } from "@/components/TurnstileInvisible";
import FanficBreadcrumb from "./breadcrumb";
import {
  BookOpen,
  Heart,
  Wand2,
  Zap,
  Sparkles,
  Settings,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import CompletionGuide from "@/components/story/completion-guide";
import StorySaveDialog from "@/components/story/story-save-dialog";
import type { StoryStatus } from "@/models/story";
import { useAppContext } from "@/contexts/app";
import { useGeneratorShortcuts } from "@/hooks/useGeneratorShortcuts";
import { GeneratorShortcutHints } from "@/components/generator-shortcut-hints";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
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

// ========== HELPER FUNCTIONS ==========

function calculateWordCount(text: string): number {
  if (!text || !text.trim()) return 0;
  const trimmed = text.trim();
  const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/gu;
  const cjkChars = trimmed.match(cjkRegex);
  const cjkCount = cjkChars ? cjkChars.length : 0;
  const withoutCJK = trimmed.replace(cjkRegex, ' ').trim();
  const englishWords = withoutCJK.split(/\s+/).filter(word => word.length > 0);
  const englishCount = withoutCJK ? englishWords.length : 0;
  return cjkCount + englishCount;
}

// ========== TABBED FANFIC GENERATE COMPONENT ==========

export default function TabbedFanficGenerate({ section }: { section: FanficGenerateType }) {
  const locale = useLocale();
  const t = useTranslations();
  const tabbedForm = section.tabbed?.form as any;
  const { user, requireAuth, setSignModalContext } = useAppContext();
  const router = useRouter();
  const { track } = useOpenPanel();
  const reduceMotion = useReducedMotion();

  // ========== STATE MANAGEMENT ==========

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const [sourceType, setSourceType] = useState<'preset' | 'custom'>('preset');
  const [selectedPresetWork, setSelectedPresetWork] = useState<string>('');
  const [showAllWorks, setShowAllWorks] = useState(false);
  const [customWorkName, setCustomWorkName] = useState('');
  const [customWorldview, setCustomWorldview] = useState('');
  const [customCharacters, setCustomCharacters] = useState('');

  const [pairingType, setPairingType] = useState<'romantic' | 'gen' | 'poly'>('romantic');
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [customCharacterInput, setCustomCharacterInput] = useState('');

  const [plotType, setPlotType] = useState('canon');
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState(locale);
  const [selectedModel, setSelectedModel] = useState<string>('standard');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFanfic, setGeneratedFanfic] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [advancedOptions, setAdvancedOptions] = useState({
    ooc: 'slight',
    fidelity: 'balanced',
    ending: 'happy',
    rating: 'teen',
    length: 'medium',
    perspective: 'third',
  });
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  useDraftAutoSave({
    key: `fanfic-generator:tabbed-prompt:${locale}`,
    value: prompt,
    onRestore: (draft) => setPrompt(draft),
  });

  const [isSavingStory, setIsSavingStory] = useState(false);
  const [hasSavedCurrentStory, setHasSavedCurrentStory] = useState(false);

  const languageOptions = useMemo(() => Object.entries(section.prompt.language_options || {}), [section.prompt.language_options]);

  useEffect(() => {
    if (!languageOptions.length) return;
    if (!languageOptions.some(([code]) => code === language)) {
      setLanguage(languageOptions[0][0]);
    }
  }, [languageOptions, language]);

  const hasStartedGeneration = isGenerating || !!generatedFanfic;

  const AI_MODELS = useMemo(
    () => {
      const models = section.ai_models?.models;

      if (!models) {
        return [
          {
            id: "fast",
            name: "Character-Focused",
            badge: "Fast",
            description: "Optimized for character dynamics",
          },
          {
            id: "standard",
            name: "Creative",
            badge: "Balanced",
            description: "Balances quality and speed",
          },
          {
            id: "creative",
            name: "Depth",
            badge: "Deep",
            description: "More detailed and reflective",
          },
        ];
      }

      return [
        {
          id: "fast",
          name: models.character_focused.name,
          badge: models.character_focused.badge,
          description: models.character_focused.description,
        },
        {
          id: "standard",
          name: models.creative.name,
          badge: models.creative.badge,
          description: models.creative.description,
        },
        {
          id: "creative",
          name: models.depth.name,
          badge: models.depth.badge,
          description: models.depth.description,
        },
      ];
    },
    [section.ai_models]
  );

  const completionGuideTranslations = section.completion_guide || {
    title: "Liked your story?",
    subtitle: "Sign in to keep writing, or try a new idea!",
    create_another: "Create Another",
    share_action: "Save Story",
    continue_hint:
      "Your content and context are preserved. Sign in to continue generating in AI Write.",
  };

  // ========== REF FOR LATEST STATE ==========
  const latestStateRef = useRef({
    sourceType,
    selectedPresetWork,
    customWorkName,
    customWorldview,
    customCharacters,
    pairingType,
    selectedCharacters,
    plotType,
    prompt,
    language,
    advancedOptions,
    selectedModel,
  });

  const turnstileRef = useRef<TurnstileInvisibleHandle | null>(null);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);

  // Update ref when state changes
  useEffect(() => {
    latestStateRef.current = {
      sourceType,
      selectedPresetWork,
      customWorkName,
      customWorldview,
      customCharacters,
      pairingType,
      selectedCharacters,
      plotType,
      prompt,
      language,
      advancedOptions,
      selectedModel,
    };
  }, [sourceType, selectedPresetWork, customWorkName, pairingType, selectedCharacters, plotType, prompt, language, advancedOptions, selectedModel]);

  // ========== STEP DEFINITIONS ==========

  const steps = [
    { id: 'step1', title: section.tabbed?.steps?.step1?.title || 'Select Source', description: section.tabbed?.steps?.step1?.description || 'Choose Work' },
    { id: 'step2', title: section.tabbed?.steps?.step2?.title || 'Select Characters', description: section.tabbed?.steps?.step2?.description || 'Choose Pairing' },
    { id: 'step3', title: section.tabbed?.steps?.step3?.title || 'Story Settings', description: section.tabbed?.steps?.step3?.description || 'Configure' },
    { id: 'step4', title: section.tabbed?.steps?.step4?.title || 'Advanced Options', description: section.tabbed?.steps?.step4?.description || 'Customize' },
    { id: 'step5', title: section.tabbed?.steps?.step5?.title || 'Generate', description: section.tabbed?.steps?.step5?.description || 'Create' },
  ];

  const activeStepId = `step${currentStep}`;

  // ========== HANDLER FUNCTIONS ==========

  const handlePresetWorkChange = useCallback((workId: string) => {
    setSelectedPresetWork(workId);
    setSelectedCharacters([]);
  }, []);

  const handleAddCharacter = useCallback((characterId: string) => {
    if (!selectedCharacters.includes(characterId)) {
      if (pairingType === 'gen' && selectedCharacters.length >= 1) {
        toast.error(section.tabbed?.messages?.error_gen_limit || "Gen-focused can only select 1 character");
        return;
      }
      if (pairingType === 'romantic' && selectedCharacters.length >= 2) {
        toast.error(section.tabbed?.messages?.error_romantic_limit || "Romantic can only select 2 characters");
        return;
      }
      setSelectedCharacters([...selectedCharacters, characterId]);
    }
  }, [selectedCharacters, pairingType, section]);

  const handleRemoveCharacter = useCallback((characterId: string) => {
    setSelectedCharacters(selectedCharacters.filter(id => id !== characterId));
  }, [selectedCharacters]);

  const handleAddCustomCharacter = useCallback(() => {
    const trimmedName = customCharacterInput.trim();
    if (!trimmedName) {
      toast.error(section.tabbed?.messages?.error_empty_character || "Please enter character name");
      return;
    }
    if (selectedCharacters.includes(trimmedName)) {
      toast.error(section.tabbed?.messages?.error_duplicate_character || "This character has been added");
      return;
    }

    // Check pairing type limits
    if (pairingType === 'gen' && selectedCharacters.length >= 1) {
      toast.error(section.tabbed?.messages?.error_gen_limit || "Gen-focused can only select 1 character");
      return;
    }
    if (pairingType === 'romantic' && selectedCharacters.length >= 2) {
      toast.error(section.tabbed?.messages?.error_romantic_limit || "Romantic can only select 2 characters");
      return;
    }

    setSelectedCharacters([...selectedCharacters, trimmedName]);
    setCustomCharacterInput('');
  }, [customCharacterInput, selectedCharacters, pairingType, section]);

  // ========== AUTO ADVANCE LOGIC ==========

  // Check if current step is completed
  const isStepCompleted = useCallback((step: number) => {
    switch (step) {
      case 1:
        return sourceType === 'preset'
          ? selectedPresetWork !== ''
          : customWorkName.trim() !== '';
      case 2:
        return selectedCharacters.length > 0;
      case 3:
        return prompt.trim().length >= 10;
      case 4:
        return true; // Advanced options are optional
      case 5:
        return generatedFanfic !== '';
      default:
        return false;
    }
  }, [sourceType, selectedPresetWork, customWorkName, selectedCharacters, prompt, generatedFanfic]);

  // Auto advance to next step
  const autoAdvance = useCallback(() => {
    if (currentStep < 5) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      toast.success((section.tabbed?.messages?.step_completed || "Auto-advanced to step {{step}}").replace('{{step}}', nextStep.toString()));
    }
  }, [currentStep, completedSteps, section]);

  // ========== GENERATE FUNCTION ==========

  // Handle verification success - start fanfic generation
  const handleVerificationSuccess = useCallback(async (turnstileToken: string) => {
    console.log('=== Starting fanfic generation after verification ===');

    // Get fresh state values from ref at the time of execution
    const currentState = latestStateRef.current;

    console.log('=== Current state from ref ===', {
      ...currentState,
      prompt: currentState.prompt?.substring(0, 100),
    });

    setIsGenerating(true);
    setGeneratedFanfic('');
    setWordCount(0);
    setHasSavedCurrentStory(false);

    try {
      const requestData = {
        sourceType: currentState.sourceType,
        presetWorkId: currentState.sourceType === 'preset' ? currentState.selectedPresetWork : null,
        customWorkName: currentState.sourceType === 'custom' ? currentState.customWorkName : null,
        pairingType: currentState.pairingType,
        characters: currentState.selectedCharacters,
        plotType: currentState.plotType,
        prompt: currentState.prompt,
        language: currentState.language,
        options: currentState.advancedOptions,
        turnstileToken,
        model: currentState.selectedModel,
      };
      console.log('=== Request data ===', requestData);

      const response = await fetch('/api/fanfic-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Generation failed');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream available');
      }

      let accumulatedText = '';
      let chunkCount = 0;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log(`Stream finished, total chunks: ${chunkCount}`);
          break;
        }

        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const jsonStr = line.slice(2);
              const text = JSON.parse(jsonStr);
              accumulatedText += text;
              setGeneratedFanfic(accumulatedText);
            } catch (e) {
              console.error('Parse error:', e, 'Line:', line);
            }
          }
        }
      }

      // Validate content
      if (!accumulatedText || accumulatedText.trim().length === 0) {
        throw new Error('No content generated');
      }

      // Calculate word count
      const count = calculateWordCount(accumulatedText);
      setWordCount(count);

      // Generate tags
      const presetWork = sourceType === 'preset' ? getWorkById(selectedPresetWork) : null;
      const sourceName = sourceType === 'preset' && presetWork
        ? getWorkName(presetWork, locale)
        : customWorkName;
      const tags = [
        `#${sourceName.replace(/\s+/g, '')}`,
        `#${selectedCharacters.map(id => {
          const char = presetWork ? getCharacterById(presetWork, id) : null;
          return char ? getCharacterName(char, locale) : id;
        }).join('×')}`,
        ...(plotType !== 'canon' ? [`#${plotType.toUpperCase()}`] : []),
      ];
      setGeneratedTags(tags);

      toast.success(section.tabbed?.messages?.generation_success || "Creation complete!");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

    } catch (error) {
      console.error('Generation failed:', error);
      toast.error(error instanceof Error ? error.message : section.tabbed?.messages?.error_generation || 'Generation failed, please try again');
    } finally {
      setIsGenerating(false);
    }
  }, [sourceType, selectedPresetWork, selectedCharacters, plotType, customWorkName, locale, section]);

  const handleTurnstileSuccess = useCallback((token: string) => {
    console.log("✓ Turnstile verification successful (Tabbed Fanfic)");
    handleVerificationSuccess(token);
  }, [handleVerificationSuccess]);

  const handleTurnstileError = useCallback(() => {
    console.error("❌ Turnstile verification failed (Tabbed Fanfic)");
    setIsGenerating(false);
    toast.error(section.tabbed?.messages?.error_generation || "Generation failed, please try again");
  }, [section]);

  const handleGenerate = useCallback(() => {
    if (isGenerating) return;

    setIsGenerating(true);
    turnstileRef.current?.execute();
  }, [isGenerating]);

  const handleCreateAnother = useCallback(() => {
    setGeneratedFanfic("");
    setWordCount(0);
    setGeneratedTags([]);
    setHasSavedCurrentStory(false);
  }, []);

  const handleSaveClick = useCallback(() => {
    if (!generatedFanfic.trim()) {
      toast.error(section.toasts?.error_no_content || "No content generated");
      return;
    }

    if (!user) {
      requireAuth({ source: "story_save", action: "save_story", sourcePage: "fanfic-generator" });
      return;
    }

    setIsSaveDialogOpen(true);
  }, [generatedFanfic, section, user, requireAuth]);

  const handleContinueInAiWrite = useCallback(() => {
    if (!generatedFanfic.trim()) {
      return;
    }

    track(
      "continue_ai_write_cta_click",
      buildContinueTrackingPayload({
        source_page: "fanfic-generator",
        logged_in: !!user,
        cta_variant: user ? "continue_ai_write" : "sign_in_to_continue_ai_write",
      })
    );

    const payload = buildContinueIntentPayload({
      source: "fanfic-generator",
      title: prompt,
      content: generatedFanfic,
    });

    if (
      shouldGateAnonymousContinue({
        hasUser: !!user,
        hasGeneratedContent: !!generatedFanfic.trim(),
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
          source_page: "fanfic-generator",
        })
      );
      setSignModalContext({
        mode: "continue-ai-write",
        source: payload.source,
        redirectTo: payload.redirectTo,
      });
      requireAuth({ source: "ai_write", action: "continue_writing", sourcePage: "fanfic-generator" });
      return;
    }

    try {
      window.localStorage.setItem(GENERATOR_PREFILL_KEY, JSON.stringify(payload.prefill));
    } catch {
      // ignore prefill cache failures
    }

    router.push(payload.redirectTo as any);
  }, [generatedFanfic, prompt, router, user, track, setSignModalContext, requireAuth]);

  useGeneratorShortcuts({
    onGenerate: handleGenerate,
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
      if (!generatedFanfic.trim()) {
        toast.error(section.toasts?.error_no_content || "No content generated");
        return;
      }

      try {
        setIsSavingStory(true);

        const settings: Record<string, unknown> = {
          locale,
          outputLanguage: language,
          sourceType,
          selectedPresetWork,
          customWorkName,
          pairingType,
          selectedCharacters,
          plotType,
          advancedOptions,
        };

        const modelKey = selectedModel || 'standard';
        const modelMap: Record<string, string> = {
          fast: 'gemini-2.5-flash',
          standard: 'gemini-3.1-flash-lite',
          creative: 'gemini-3-flash',
        };
        const actualModel = modelMap[modelKey] || 'gemini-3.1-flash-lite';

        const resp = await fetch("/api/stories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title:
              prompt.substring(0, 30) + (prompt.length > 30 ? "..." : ""),
            prompt,
            content: generatedFanfic,
            wordCount,
            modelUsed: actualModel,
            settings,
            status,
            visibility: status === "published" ? "public" : "private",
            sourceCategory: "fanfic",
          }),
        });

        if (!resp.ok) {
          throw new Error("request failed with status: " + resp.status);
        }

        const { code, message } = await resp.json();

        if (code !== 0) {
          if (message === "no auth") {
            requireAuth({ source: "story_save", action: "save_story", sourcePage: "fanfic-generator" });
          }

          toast.error(
            message === "no auth"
              ? section.toasts?.save_no_auth || "Please sign in to save your story"
              : (section.toasts?.save_failed || "Failed to save story: {{reason}}").replace(
                  "{{reason}}",
                  message || ""
                )
          );
          return;
        }

        toast.success(
          status === "published"
            ? section.toasts?.save_published || "Story published"
            : section.toasts?.save_saved || "Story saved"
        );

        setHasSavedCurrentStory(true);
        setIsSaveDialogOpen(false);
      } catch (error) {
        console.error("save fanfic failed", error);
        toast.error(section.toasts?.save_error || "Failed to save story, please try again.");
      } finally {
        setIsSavingStory(false);
      }
    }, [
      generatedFanfic,
      section,
      locale,
      language,
      sourceType,
      selectedPresetWork,
      customWorkName,
      pairingType,
      selectedCharacters,
      plotType,
      advancedOptions,
      prompt,
      wordCount,
      requireAuth,
      AI_MODELS,
      selectedModel,
    ]
  );

  // ========== NEXT STEP HANDLER ==========

  const handleNextStep = () => {
    const completed = isStepCompleted(currentStep);
    if (!completed) {
      toast.error(section.tabbed?.messages?.error_complete_current || "Please complete current step first");
      return;
    }
    autoAdvance();
  };

  // 移动端首屏默认展示的预设作品数量（其余通过「显示更多」展开）
  const PRESET_VISIBLE_COUNT = 8;
  const selectedWorkIndex = PRESET_WORKS.findIndex((w) => w.id === selectedPresetWork);
  // 选中项落在折叠区间时保持展开，避免「选了却看不见」
  const effectiveShowAllWorks = showAllWorks || selectedWorkIndex >= PRESET_VISIBLE_COUNT;
  const displayedWorks = effectiveShowAllWorks ? PRESET_WORKS : PRESET_WORKS.slice(0, PRESET_VISIBLE_COUNT);

  // ========== RENDER ==========

  return (
    <div id="fanfic_generator" className="min-h-screen overflow-hidden bg-background text-foreground selection:bg-orange-500/30">
    {/* Subtle warm top glow + dot texture */}
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.05_65),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.18_0.04_65),transparent)]" />
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-orange-500/[0.04] via-orange-500/[0.02] to-transparent" />
      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]" style={{ backgroundImage: 'var(--bg-grid)', backgroundSize: '40px 40px' }} />
    </div>

    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 lg:py-20 relative">
      {/* Breadcrumb */}
      <div className="mb-10 flex justify-start">
        <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5">
          <FanficBreadcrumb
            homeText={section.breadcrumb?.home || 'Home'}
            currentText={section.breadcrumb?.current || 'AI Fanfic Generator'}
          />
        </div>
      </div>

      {/* Header */}
      <div className="relative text-center mb-10 sm:mb-16">
        {/* Ambient: warm heart motes */}
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

        {/* Floating kudos heart & bookmark corner (archive of affection motif) */}
        {!reduceMotion && (
          <>
            <motion.div
              className="pointer-events-none absolute z-[1] text-orange-500/55 dark:text-orange-400/55"
              style={{ left: "3%", top: "44%" }}
              initial={{ opacity: 0, y: 0, rotate: -8 }}
              animate={{ opacity: [0, 0.7, 0.7, 0], y: [0, -10, 0], rotate: [-8, -2, -8] }}
              transition={{ duration: 7.5, delay: 1, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M12 21s-7-4.5-9-9c-1-2.5 0-6 3.5-7c2-0.5 4 0.5 5.5 2.5c1.5-2 3.5-3 5.5-2.5c3.5 1 4.5 4.5 3.5 7c-2 4.5-9 9-9 9z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.25" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <motion.div
              className="pointer-events-none absolute z-[1] text-amber-500/55 dark:text-amber-400/55"
              style={{ right: "4%", top: "40%" }}
              initial={{ opacity: 0, y: 0, rotate: 10 }}
              animate={{ opacity: [0, 0.65, 0.65, 0], y: [0, -7, 0], rotate: [10, 4, 10] }}
              transition={{ duration: 8.5, delay: 2.5, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            >
              <svg width="32" height="36" viewBox="0 0 24 28" fill="none">
                <path d="M5 2h14v24l-7-5-7 5V2z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.2" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </>
        )}

        {/* Slowly swaying intertwined relationship threads (pairing / CP bond metaphor) */}
        {!reduceMotion && (
          <motion.div
            className="pointer-events-none absolute z-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500/35 dark:text-orange-400/35"
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: [0, 0.6, 0.45], rotate: [0, 2, 0, -2, 0] }}
            transition={{ opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 16, repeat: Infinity, ease: "easeInOut" } }}
            aria-hidden="true"
          >
            <svg width="420" height="220" viewBox="0 0 420 220" fill="none">
              <path d="M30 110 Q120 30 210 110 T390 110" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <path d="M30 110 Q120 190 210 110 T390 110" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.7" />
              <circle cx="210" cy="110" r="48" stroke="currentColor" strokeWidth="0.4" fill="none" strokeDasharray="2 5" opacity="0.5" />
              <circle cx="210" cy="110" r="90" stroke="currentColor" strokeWidth="0.3" fill="none" strokeDasharray="1 6" opacity="0.3" />
              <path d="M210 102c-2-4-9-4-9 2.5c0 5 9 11.5 9 11.5s9-6.5 9-11.5c0-6.5-7-6.5-9-2.5z" fill="currentColor" opacity="0.6" />
              <circle cx="30" cy="110" r="4.5" fill="currentColor" />
              <circle cx="390" cy="110" r="4.5" fill="currentColor" />
              <circle cx="30" cy="110" r="10" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />
              <circle cx="390" cy="110" r="10" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />
            </svg>
          </motion.div>
        )}

        {/* Editorial watermark: hearts, stars, sparks (kudos / favorite / spark culture) */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none" aria-hidden="true">
          <span className="absolute left-[5%] top-[20%] font-display italic font-bold text-2xl text-orange-500/[0.08] dark:text-orange-400/[0.08]">♥</span>
          <span className="absolute right-[6%] top-[14%] font-display italic font-bold text-xl text-amber-500/[0.08] dark:text-amber-400/[0.08]">★</span>
          <span className="absolute left-[9%] bottom-[16%] font-display italic font-bold text-lg text-orange-500/[0.07] dark:text-orange-400/[0.07]">✦</span>
          <span className="absolute right-[8%] bottom-[18%] font-display italic font-bold text-2xl text-amber-500/[0.08] dark:text-amber-400/[0.08]">♥</span>
          <span className="absolute left-[26%] top-[8%] font-display italic font-bold text-base text-orange-500/[0.06] dark:text-orange-400/[0.06]">★</span>
          <span className="absolute right-[24%] bottom-[6%] font-display italic font-bold text-xl text-amber-500/[0.07] dark:text-amber-400/[0.07]">✦</span>
        </div>

        {/* Double-bezel icon container with archive hover flare */}
        <div className="group relative z-10 flex justify-center mb-6">
          <span className="pointer-events-none absolute left-[calc(50%-2.75rem)] top-0 font-display italic font-bold text-2xl text-orange-500/0 transition-all duration-500 group-hover:text-orange-500/80 dark:group-hover:text-orange-400/80 group-hover:scale-110">
            ♥
          </span>
          <span className="pointer-events-none absolute right-[calc(50%-2.75rem)] top-0 font-display italic font-bold text-2xl text-amber-500/0 transition-all duration-500 group-hover:text-amber-500/80 dark:group-hover:text-amber-400/80 group-hover:scale-110">
            ★
          </span>
          <div className="rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 dark:bg-white/[0.015]">
            <div className="flex size-12 items-center justify-center rounded-xl bg-orange-500/10">
              <Icon name="RiBookmarkLine" className="size-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        {/* Eyebrow badge */}
        <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-5">
          <span className="inline-block size-1.5 rounded-full bg-orange-500 opacity-60" />
          AI Fanfiction Writer
        </span>

        {/* Title with italic gradient emphasis on "Fanfiction" */}
        <h1 className="relative z-10 font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.9] mt-4">
          <span className="text-foreground">Free{" "}</span>
          <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-amber-500 to-orange-400 dark:from-orange-300 dark:via-amber-300 dark:to-orange-200">
            Fanfiction
          </span>
          <span className="text-foreground"> Generator</span>
        </h1>

        {/* Editorial decorative anchor: heart + halftone + sparkle + halftone + star */}
        <div className="relative z-10 mt-3 mb-5 flex justify-center items-center gap-2">
          <span className="text-orange-500/35 dark:text-orange-400/35 text-sm">♥</span>
          {[3, 5, 7, 5, 3].map((s, i) => (
            <span key={`a-${i}`} className="inline-block rounded-full bg-orange-500/25 dark:bg-orange-400/30" style={{ width: s, height: s }} />
          ))}
          <span className="text-amber-500/45 dark:text-amber-400/45 text-base">✦</span>
          {[3, 5, 7, 5, 3].map((s, i) => (
            <span key={`b-${i}`} className="inline-block rounded-full bg-orange-500/25 dark:bg-orange-400/30" style={{ width: s, height: s }} />
          ))}
          <span className="text-orange-500/35 dark:text-orange-400/35 text-sm">★</span>
        </div>

        <p className="relative z-10 text-lg sm:text-xl text-muted-foreground/65 max-w-xl mx-auto font-light leading-relaxed">
          {section.tabbed?.hero?.subtitle || 'Craft your own stories in your favorite universes.'}
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

      <GeneratorNavTabs />

      {/* Main Flow Container */}
      <div className="glass-premium rounded-[1.75rem] sm:rounded-[2.5rem] lg:rounded-[3rem] p-1 overflow-hidden shadow-2xl shadow-orange-500/10 dark:shadow-black/20 ring-1 ring-black/5 dark:ring-white/10 animate-fade-in-up animation-delay-2000">
        <div className="bg-background/40 backdrop-blur-xl rounded-[calc(1.75rem-4px)] sm:rounded-[calc(2.5rem-4px)] lg:rounded-[calc(3rem-4px)] min-h-[520px] sm:min-h-[600px] flex flex-col">

          {/* Custom Starlight Stepper - Responsive & Full Width */}
          <div className="border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 px-4 sm:px-8 py-4 sm:py-6">
             <div className="flex items-center justify-between w-full max-w-4xl mx-auto relative">
                {/* Progress Line */}
                <div className="absolute left-0 top-1/2 w-full h-px bg-black/10 dark:bg-white/10 -z-10" />
                <div 
                  className="absolute left-0 top-1/2 h-px bg-gradient-to-r from-orange-500 to-orange-500 -z-10 transition-all duration-500" 
                  style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, index) => {
                  const stepNum = index + 1;
                  const isCompleted = completedSteps.includes(stepNum) || stepNum < currentStep;
                  const isActive = stepNum === currentStep;
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => {
                        if (stepNum <= currentStep || completedSteps.includes(stepNum)) {
                          setCurrentStep(stepNum);
                        }
                      }}
                      disabled={stepNum > currentStep && !completedSteps.includes(stepNum)}
                      className="group relative flex flex-col items-center gap-3 focus:outline-none"
                    >
                      <div className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-500 border-2",
                        isActive 
                          ? "bg-background border-orange-500 text-orange-500 shadow-[0_0_20px_rgba(236,72,153,0.5)] scale-110" 
                          : isCompleted 
                            ? "bg-orange-500 border-orange-500 text-white" 
                            : "bg-white dark:bg-slate-900 border-black/10 dark:border-white/10 text-muted-foreground"
                      )}>
                        <span className="leading-none">{stepNum}</span>
                      </div>
                    </button>
                  );
                })}
             </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 px-4 py-8 sm:px-8 sm:py-12 lg:px-16">
            <AnimatedContainer>
              {/* Step 1: Source Selection */}
              {currentStep === 1 && (
                <div className="space-y-8 sm:space-y-12">
                  <div className="text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">{section.tabbed?.steps?.step1?.title}</h2>
                    <p className="text-muted-foreground/60 font-light">{section.tabbed?.steps?.step1?.description}</p>
                  </div>

                  <div className="glass-premium rounded-3xl sm:rounded-[2rem] p-5 sm:p-8 border border-white/10 space-y-6 sm:space-y-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium tracking-wide text-muted-foreground/50">
                          {section.source.label}
                        </p>
                        <h3 className="text-2xl font-semibold mt-3">
                          {sourceType === 'preset' ? section.source.preset_label : section.source.custom_label}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          {tabbedForm?.popular_description || 'Choose a popular IP or enter your own world to kick off the story.'}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant={sourceType === 'preset' ? 'default' : 'outline'}
                          onClick={() => setSourceType('preset')}
                          className="rounded-full"
                        >
                          {section.source.preset_label}
                        </Button>
                        <Button
                          variant={sourceType === 'custom' ? 'default' : 'outline'}
                          onClick={() => setSourceType('custom')}
                          className="rounded-full"
                        >
                          {section.source.custom_label}
                        </Button>
                      </div>
                    </div>

                    {sourceType === 'preset' ? (
                      <div>
                        <p className="text-xs font-medium tracking-wide text-muted-foreground/50 mb-4">
                          {tabbedForm?.popular_works_label || tabbedForm?.all_works_label || 'Popular IP Works'}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                          {displayedWorks.map((work) => (
                            <button
                              key={work.id}
                              className={cn(
                                "p-3 sm:p-4 rounded-2xl border card-hover-lift transition-all text-left",
                                selectedPresetWork === work.id
                                  ? "border-orange-500 bg-orange-500/10"
                                  : "border-border/10 hover:border-border/30"
                              )}
                              onClick={() => handlePresetWorkChange(work.id)}
                            >
                              <div className="font-medium text-sm sm:text-base line-clamp-1">
                                {getWorkName(work, locale)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {work.popularPairings.length} {tabbedForm?.popular_pairings_label || 'pairings'}
                              </div>
                            </button>
                          ))}
                        </div>
                        {PRESET_WORKS.length > PRESET_VISIBLE_COUNT && (
                          <div className="mt-5 flex justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              onClick={() => setShowAllWorks(v => !v)}
                            >
                              {effectiveShowAllWorks ? (
                                <>
                                  {section.source.show_less || 'Show less'}
                                  <ChevronUp className="ml-1 size-4" />
                                </>
                              ) : (
                                <>
                                  {section.source.show_more || 'Show more'}
                                  <ChevronDown className="ml-1 size-4" />
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <Label className="text-xs font-medium tracking-wide text-muted-foreground/50 mb-2 block">
                          {section.source.custom_label}
                        </Label>
                        <Textarea
                          placeholder={section.source.preset_placeholder}
                          value={customWorkName}
                          onChange={(e) => setCustomWorkName(e.target.value)}
                          rows={2}
                          className="bg-muted/5 border-border/10"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Characters */}
                {currentStep === 2 && (
                  <div className="space-y-8 sm:space-y-12">
                    <div className="text-center">
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">{section.tabbed?.steps?.step2?.title}</h2>
                      <p className="text-muted-foreground/60 font-light">{section.tabbed?.steps?.step2?.description}</p>
                    </div>

                    {/* Pairing Type */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(
                        [
                          { value: 'romantic', label: section.tabbed?.form?.romantic },
                          { value: 'gen', label: section.tabbed?.form?.gen },
                          { value: 'poly', label: section.tabbed?.form?.poly }
                        ] as { value: 'romantic' | 'gen' | 'poly'; label?: string }[]
                      ).map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setPairingType(option.value);
                            setSelectedCharacters([]);
                          }}
                          className={cn(
                            "w-full px-6 py-4 rounded-2xl border card-hover-lift transition-all text-left",
                            pairingType === option.value
                              ? "bg-orange-500 text-white border-orange-500 shadow-lg"
                              : "bg-muted/5 border-border/10 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <div className="font-semibold text-lg">{option.label}</div>
                        </button>
                      ))}
                    </div>

                    {/* Preset Characters */}
                    <div className="space-y-4">
                      <Label className="text-xs font-medium tracking-wide text-muted-foreground/50">
                        {section.tabbed?.form?.preset_characters_label}
                      </Label>
                      <div className="flex flex-wrap gap-3">
                        {(sourceType === 'preset' && selectedPresetWork ? getWorkById(selectedPresetWork)?.characters : [])?.map((char) => (
                          <button
                            key={char.id}
                            onClick={() => selectedCharacters.includes(char.id) ? handleRemoveCharacter(char.id) : handleAddCharacter(char.id)}
                            className={cn(
                              "px-5 py-2 rounded-full text-sm font-semibold border transition-all",
                              selectedCharacters.includes(char.id)
                                ? "bg-orange-500 text-white border-orange-500 shadow-lg"
                                : "bg-muted/5 border-border/10 hover:bg-muted/10"
                            )}
                          >
                            {getCharacterName(char, locale)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Characters */}
                    <div className="space-y-3">
                      <Label className="text-xs font-medium tracking-wide text-muted-foreground/50">
                        {section.tabbed?.form?.custom_characters_label}
                      </Label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder={section.tabbed?.form?.custom_character_placeholder}
                          value={customCharacterInput}
                          onChange={(e) => setCustomCharacterInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomCharacter();
                            }
                          }}
                          className="flex-1 h-12 px-4 rounded-2xl bg-muted/5 border border-border/10 focus:border-orange-500/50 focus:ring-0"
                        />
                        <Button
                          onClick={handleAddCustomCharacter}
                          className="h-12 px-8 rounded-2xl bg-white/10 hover:bg-white/20 text-foreground font-bold"
                        >
                          {section.tabbed?.form?.add_character_button || 'Add'}
                        </Button>
                      </div>
                      {selectedCharacters.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                          {selectedCharacters.map((charId) => (
                            <div key={charId} className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20">
                              <span className="text-sm font-semibold">
                                {(() => {
                                  const work = getWorkById(selectedPresetWork);
                                  const presetChar = work?.characters.find((c) => c.id === charId);
                                  return presetChar ? getCharacterName(presetChar, locale) : charId;
                                })()}
                              </span>
                              <button
                                onClick={() => handleRemoveCharacter(charId)}
                                className="p-1 rounded-full hover:bg-orange-500/20"
                              >
                                <Icon name="close" className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Story Settings */}
                {currentStep === 3 && (
                  <div className="space-y-8 sm:space-y-12">
                      <div className="text-center">
                         <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">{section.tabbed?.steps?.step3?.title}</h2>
                         <p className="text-muted-foreground/60 font-light">{section.tabbed?.steps?.step3?.description}</p>
                      </div>

                      {/* Plot Type */}
                      <div className="space-y-4">
                        <Label className="text-xs font-medium tracking-wide text-muted-foreground/50 ml-1">{section.tabbed?.form?.plot_type_label}</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { value: 'canon', label: section.tabbed?.form?.canon },
                            { value: 'modern_au', label: section.tabbed?.form?.modern_au },
                            { value: 'school_au', label: section.tabbed?.form?.school_au },
                            { value: 'fantasy_au', label: section.tabbed?.form?.fantasy_au },
                            { value: 'crossover', label: section.tabbed?.form?.crossover },
                            { value: 'time_travel_au', label: section.tabbed?.form?.time_travel_au },
                            { value: 'soulmate_au', label: section.tabbed?.form?.soulmate_au },
                            { value: 'historical_au', label: section.tabbed?.form?.historical_au },
                          ].map((type) => (
                            <button
                              key={type.value}
                              onClick={() => setPlotType(type.value)}
                              className={cn(
                                "py-3 px-2 rounded-xl text-sm font-medium card-hover-lift transition-all duration-300 border",
                                plotType === type.value
                                  ? "bg-orange-500 text-white border-orange-500 shadow-lg"
                                  : "bg-muted/5 border-border/5 hover:bg-muted/10 hover:border-border/20"
                              )}
                            >
                              {type.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Language */}
                      <div className="space-y-4">
                        <Label className="text-xs font-medium tracking-wide text-muted-foreground/50 ml-1">
                          {section.tabbed?.form?.language_label || section.prompt.language_label}
                        </Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                          {Object.entries(section.prompt.language_options || {}).map(([code, lang]) => (
                            <button
                              key={code}
                              type="button"
                              onClick={() => setLanguage(code)}
                              aria-pressed={language === code}
                              className={cn(
                                "relative py-3 px-3 rounded-2xl flex flex-col items-center gap-2 border transition-all",
                                language === code
                                  ? "bg-muted/10 border-border/30 text-foreground shadow-lg shadow-orange-500/20"
                                  : "bg-muted/5 border-border/10 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {language === code && (
                                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
                                  ✓
                                </span>
                              )}
                              <span className="text-2xl" aria-hidden>
                                {lang.flag}
                              </span>
                              <div className="text-center">
                                <p className="text-sm font-semibold leading-tight">{lang.native}</p>
                                <p className="text-[10px] uppercase text-muted-foreground/80 tracking-wide">
                                  {lang.english}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Prompt */}
                      <div className="space-y-4 relative group">
                        <div className="absolute -inset-4 bg-orange-500/10 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
                        <Label className="text-xs font-medium tracking-wide text-muted-foreground/50 ml-1">{section.tabbed?.form?.story_prompt_label}</Label>
                        <Textarea
                          ref={promptRef}
                          placeholder={section.tabbed?.form?.story_prompt_placeholder}
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="relative min-h-[160px] sm:min-h-[200px] w-full bg-transparent border-0 border-b border-white/10 focus:border-orange-500/50 focus:ring-0 rounded-none px-0 text-lg sm:text-xl font-light leading-relaxed placeholder:text-muted-foreground/20 resize-none transition-all duration-300"
                          style={{ boxShadow: 'none' }}
                        />
                        <div className="flex justify-end">
                           <span className={cn("text-[10px] font-bold uppercase tracking-widest", prompt.trim().length < 10 ? "text-orange-400" : "text-orange-400")}>
                              {prompt.length} / 2000
                           </span>
                        </div>
                      </div>
                  </div>
                )}

                {/* Step 4: Advanced */}
                {currentStep === 4 && (
                  <div className="space-y-8 sm:space-y-12">
                     <div className="text-center">
                         <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">{section.tabbed?.steps?.step4?.title}</h2>
                         <p className="text-muted-foreground/60 font-light">{section.tabbed?.form?.advanced_options?.subtitle}</p>
                     </div>

                     <div className="space-y-10">
                       {/* AI Model Selection */}
                       <div className="space-y-4">
                         <Label className="text-xs font-medium tracking-wide text-muted-foreground/50">
                           {section.ai_models?.title || 'AI Model'}
                         </Label>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           {AI_MODELS.map((model) => (
                             <button
                               key={model.id}
                               type="button"
                               onClick={() => setSelectedModel(model.id)}
                               className={cn(
                                 "w-full text-left px-5 py-4 rounded-2xl border card-hover-lift transition-all",
                                 selectedModel === model.id
                                   ? "border-orange-500/70 bg-orange-500/10 shadow-lg shadow-orange-500/20"
                                   : "border-border/10 bg-muted/5 hover:bg-muted/10"
                               )}
                             >
                               <div className="flex items-center justify-between mb-1">
                                 <span className="font-semibold text-sm">{model.name}</span>
                                 {model.badge && (
                                   <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/40">
                                     {model.badge}
                                   </span>
                                 )}
                               </div>
                               {model.description && (
                                 <p className="text-xs text-muted-foreground/80 leading-snug line-clamp-2">
                                   {model.description}
                                 </p>
                               )}
                             </button>
                           ))}
                         </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
                          <div className="space-y-6">
                             <Label className="text-xs font-medium tracking-wide text-muted-foreground/50">{section.tabbed?.form?.advanced_options?.ooc_level}</Label>
                             <div className="space-y-3">
                                {['slight', 'moderate', 'bold'].map((opt) => (
                                  <button
                                    key={opt}
                                    onClick={() => setAdvancedOptions({...advancedOptions, ooc: opt})}
                                    className={cn(
                                      "w-full text-left px-6 py-4 rounded-xl border card-hover-lift transition-all",
                                      advancedOptions.ooc === opt
                                        ? "bg-orange-500/10 border-orange-500/50 text-orange-400"
                                        : "bg-muted/5 border-border/5 text-muted-foreground hover:bg-muted/10"
                                    )}
                                  >
                                    <div className="font-bold text-sm uppercase tracking-wide">{opt}</div>
                                  </button>
                                ))}
                             </div>
                          </div>

                          <div className="space-y-6">
                             <Label className="text-xs font-medium tracking-wide text-muted-foreground/50">{section.tabbed?.form?.advanced_options?.story_length}</Label>
                             <div className="space-y-3">
                                {['short', 'medium', 'long'].map((opt) => (
                                  <button
                                    key={opt}
                                    onClick={() => setAdvancedOptions({...advancedOptions, length: opt})}
                                    className={cn(
                                      "w-full text-left px-6 py-4 rounded-xl border card-hover-lift transition-all",
                                      advancedOptions.length === opt
                                        ? "bg-orange-500/10 border-orange-500/50 text-orange-400"
                                        : "bg-muted/5 border-border/5 text-muted-foreground hover:bg-muted/10"
                                    )}
                                  >
                                    <div className="font-bold text-sm uppercase tracking-wide">{opt}</div>
                                  </button>
                                ))}
                             </div>
                          </div>
                       </div>
                     </div>
                  </div>
                )}

                {/* Step 5: Output */}
                {currentStep === 5 && (
                  <div className="space-y-8 sm:space-y-12">
                    {!hasStartedGeneration ? (
                      <div className="text-center py-8 sm:py-12">
                        <div className="inline-flex p-6 rounded-full bg-muted/5 mb-8 animate-pulse">
                          <Zap className="size-12 text-yellow-400" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold mb-6">{section.tabbed?.steps?.step5?.title}</h2>

                        <div className="max-w-md mx-auto glass-premium rounded-2xl p-6 mb-8 text-left text-sm space-y-2">
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-muted-foreground">Source</span>
                            <span className="font-bold">{sourceType === 'preset' ? getWorkName(getWorkById(selectedPresetWork)!, locale) : customWorkName}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-muted-foreground">Pairing</span>
                            <span className="font-bold">{selectedCharacters.length} Characters</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type</span>
                            <span className="font-bold uppercase">{plotType}</span>
                          </div>
                        </div>

                        <Button
                          onClick={handleGenerate}
                          className="h-14 sm:h-16 px-8 sm:px-12 rounded-full bg-orange-500 text-white text-base sm:text-lg font-bold shadow-md shadow-orange-500/25 hover:bg-orange-600 active:scale-[0.97] transition-all"
                        >
                          <Sparkles className="mr-2 size-5" />
                          <span>{section.tabbed?.form?.generation?.start_button}</span>
                        </Button>
                        <GeneratorShortcutHints showQuickSave />
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* Status Card */}
                        <div className="glass-premium rounded-3xl sm:rounded-[2rem] p-5 sm:p-8 md:p-12 bg-background/40">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  "px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border",
                                  isGenerating
                                    ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/40 animate-pulse"
                                    : "bg-orange-500/10 text-orange-300 border-orange-500/40"
                                )}
                              >
                                {isGenerating
                                  ? (section.tabbed?.form?.generation?.status_writing || 'Writing...')
                                  : (section.tabbed?.form?.generation?.status_complete || 'Complete')}
                              </span>
                              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                                {wordCount > 0 ? `${wordCount} WORDS` : section.tabbed?.form?.generation?.progress_label}
                              </div>
                            </div>
                            {isGenerating && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                                {section.tabbed?.form?.generation?.status_writing || 'Streaming response...'}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Output Card */}
                        <div className="glass-premium rounded-[2rem] overflow-hidden animate-fade-in-up">
                          <div className="p-5 sm:p-8 md:p-12 bg-background/60 min-h-[400px]">
                            {generatedTags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-8">
                                {generatedTags.map(tag => (
                                  <span key={tag} className="px-3 py-1 rounded-full bg-muted/5 text-xs font-bold text-muted-foreground border border-border/5">{tag}</span>
                                ))}
                              </div>
                            )}

                            <div className="prose prose-lg dark:prose-invert max-w-none font-serif leading-loose">
                              <div className="whitespace-pre-wrap min-h-[200px]">
                                {generatedFanfic || (section.tabbed?.form?.generation?.status_writing || 'Preparing response...')}
                              </div>
                            </div>

                            {isGenerating && (
                              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                                {section.tabbed?.form?.generation?.status_writing || 'Streaming response...'}
                              </div>
                            )}
                          </div>
                          <div className="bg-muted/5 p-4 sm:p-6 flex flex-wrap justify-end gap-3 sm:gap-4">
                            <Button
                              variant="ghost"
                              disabled={!generatedFanfic}
                              onClick={() => {
                                if (!generatedFanfic) return;
                                navigator.clipboard.writeText(generatedFanfic);
                                toast.success(section.tabbed?.messages?.copy_success || 'Copied!');
                              }}
                            >
                              <Icon name="copy" className="mr-2 size-4" /> Copy
                            </Button>
                            <ShareResultButton
                              content={generatedFanfic}
                              prompt={prompt}
                              sourceCategory="fanfic"
                              title={prompt.substring(0, 30) + (prompt.length > 30 ? "..." : "")}
                            />
                            <Button variant="ghost" onClick={handleGenerate} disabled={isGenerating}>
                              <Icon name="refresh" className="mr-2 size-4" />
                              {section.tabbed?.form?.generation?.start_button || 'Regenerate'}
                            </Button>
                          </div>
                        </div>
                        {generatedFanfic && !isGenerating && (
                          <div className="mt-4">
                            <CompletionGuide
                              onCreateAnother={handleCreateAnother}
                              onSave={handleSaveClick}
                              onContinue={handleContinueInAiWrite}
                              continueLabel={getContinueActionLabel({ hasUser: !!user, locale })}
                              continueHint={completionGuideTranslations.continue_hint}
                              translations={completionGuideTranslations}
                              isSaveDisabled={isSavingStory || hasSavedCurrentStory}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex justify-start">
                      <Button
                        variant="ghost"
                        onClick={() => setCurrentStep(4)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {section.tabbed?.buttons?.previous_step || 'Previous Step'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Persistent Nav Buttons (only for steps 1-4) */}
                {currentStep < 5 && (
                  <div className="flex justify-between mt-8 sm:mt-16 pt-6 sm:pt-8 border-t border-white/5">
                    {currentStep > 1 ? (
                      <Button variant="ghost" onClick={() => setCurrentStep(currentStep - 1)} className="text-muted-foreground hover:text-foreground">
                        {section.tabbed?.buttons?.previous_step}
                      </Button>
                    ) : <div />}
                    
                    <Button
                      onClick={handleNextStep}
                      disabled={!isStepCompleted(currentStep)}
                      className="rounded-full px-8 bg-white text-black hover:bg-white/90 font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {section.tabbed?.buttons?.next_step} <Icon name="arrow-right" className="ml-2 size-4" />
                    </Button>
                  </div>
                )}

              </AnimatedContainer>
            </div>
          </div>
        </div>
      </div>
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
  );
}
