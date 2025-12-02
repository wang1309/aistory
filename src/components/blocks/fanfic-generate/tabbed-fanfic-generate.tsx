"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
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
  Settings
} from "lucide-react";
import CompletionGuide from "@/components/story/completion-guide";
import StorySaveDialog from "@/components/story/story-save-dialog";
import type { StoryStatus } from "@/models/story";
import { useAppContext } from "@/contexts/app";
import { useGeneratorShortcuts } from "@/hooks/useGeneratorShortcuts";
import { GeneratorShortcutHints } from "@/components/generator-shortcut-hints";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";

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
  const { user, setShowSignModal } = useAppContext();

  // ========== STATE MANAGEMENT ==========

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const [sourceType, setSourceType] = useState<'preset' | 'custom'>('preset');
  const [selectedPresetWork, setSelectedPresetWork] = useState<string>('');
  const [customWorkName, setCustomWorkName] = useState('');
  const [customWorldview, setCustomWorldview] = useState('');
  const [customCharacters, setCustomCharacters] = useState('');

  const [pairingType, setPairingType] = useState<'romantic' | 'gen' | 'poly'>('romantic');
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [customCharacterInput, setCustomCharacterInput] = useState('');

  const [plotType, setPlotType] = useState('canon');
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState(locale);
  const [selectedModel, setSelectedModel] = useState<string>('fast');

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
    title:
      locale === "zh"
        ? "喜欢这篇同人文吗？"
        : "Liked your story?",
    subtitle:
      locale === "zh"
        ? "你可以保存它，或者尝试新的创意！"
        : "You can save it, or try a new idea!",
    create_another:
      locale === "zh"
        ? "再写一篇同人文"
        : "Create Another",
    share_action:
      locale === "zh"
        ? "保存故事"
        : "Save Story",
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
      setShowSignModal(true);
      return;
    }

    setIsSaveDialogOpen(true);
  }, [generatedFanfic, section, user, setShowSignModal]);

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
          fast: 'gemini-2.5-flash-lite',
          standard: 'gemini-2.5-flash',
          creative: 'gemini-2.5-flash-think',
        };
        const actualModel = modelMap[modelKey] || 'gemini-2.5-flash';

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
        console.error("save fanfic failed", error);
        toast.error(
          locale === "zh"
            ? "保存失败，请稍后再试"
            : "Failed to save story, please try again."
        );
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
      setShowSignModal,
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

  // ========== RENDER ==========

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground selection:bg-pink-500/30">
    {/* Premium Background Layer - Teal/Pink Variant */}
    <div className="fixed inset-0 -z-20 bg-noise opacity-[0.15] pointer-events-none mix-blend-overlay" />
    
    <div className="fixed inset-0 -z-30 pointer-events-none overflow-hidden">
       <div className="absolute top-[-10%] right-[20%] w-[600px] h-[600px] bg-teal-500/20 rounded-full blur-[120px] animate-blob mix-blend-multiply dark:mix-blend-screen" />
       <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-pink-500/20 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-screen" />
       <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-background rounded-full blur-[150px] opacity-80" />
    </div>

    <div className="w-full max-w-6xl mx-auto px-6 py-16 sm:py-20 relative">
      {/* Breadcrumb */}
      <div className="mb-8 flex justify-start animate-fade-in-up">
        <div className="glass-premium px-6 py-2 rounded-full">
          <FanficBreadcrumb
            homeText={section.breadcrumb?.home || 'Home'}
            currentText={section.breadcrumb?.current || 'AI Fanfic Generator'}
          />
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-20 animate-fade-in-up animation-delay-1000">
        <div className="inline-flex items-center justify-center mb-8">
          <div className="p-px bg-gradient-to-br from-teal-500/20 to-transparent rounded-2xl">
            <div className="glass-premium rounded-2xl p-4 bg-background/50">
               <Sparkles className="size-8 text-teal-600 dark:text-teal-400" />
            </div>
          </div>
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-8 leading-[0.9]">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-pink-600 to-teal-600 dark:from-teal-200 dark:via-pink-200 dark:to-teal-200 animate-shimmer">
            {section.tabbed?.hero?.title || 'Fanfiction Creation'}
          </span>
        </h1>
        <p className="text-xl sm:text-2xl text-muted-foreground/80 max-w-2xl mx-auto font-light tracking-wide leading-relaxed">
          {section.tabbed?.hero?.subtitle || 'Craft your own stories in your favorite universes.'}
        </p>
      </div>

      {/* Main Flow Container */}
      <div className="glass-premium rounded-[3rem] p-1 overflow-hidden shadow-2xl shadow-teal-500/10 dark:shadow-black/20 ring-1 ring-black/5 dark:ring-white/10 animate-fade-in-up animation-delay-2000">
        <div className="bg-background/40 backdrop-blur-xl rounded-[calc(3rem-4px)] min-h-[600px] flex flex-col">
          
          {/* Custom Starlight Stepper - Responsive & Full Width */}
          <div className="border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 px-4 sm:px-8 py-6">
             <div className="flex items-center justify-between w-full max-w-4xl mx-auto relative">
                {/* Progress Line */}
                <div className="absolute left-0 top-1/2 w-full h-px bg-black/10 dark:bg-white/10 -z-10" />
                <div 
                  className="absolute left-0 top-1/2 h-px bg-gradient-to-r from-teal-500 to-pink-500 -z-10 transition-all duration-500" 
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
                          ? "bg-background border-pink-500 text-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.5)] scale-110" 
                          : isCompleted 
                            ? "bg-pink-500 border-pink-500 text-white" 
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
          <div className="flex-1 p-8 sm:p-16">
            <AnimatedContainer>
              {/* Step 1: Source Selection */}
              {currentStep === 1 && (
                <div className="space-y-12">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">{section.tabbed?.steps?.step1?.title}</h2>
                    <p className="text-muted-foreground/60 font-light">{section.tabbed?.steps?.step1?.description}</p>
                  </div>

                  <div className="glass-premium rounded-[2rem] p-8 border border-white/10 space-y-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/40">
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
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground/50 mb-4">
                          {tabbedForm?.popular_works_label || tabbedForm?.all_works_label || 'Popular IP Works'}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {PRESET_WORKS.map((work) => (
                            <button
                              key={work.id}
                              className={cn(
                                "p-4 rounded-2xl border transition-all text-left",
                                selectedPresetWork === work.id
                                  ? "border-pink-500 bg-pink-500/10"
                                  : "border-white/10 hover:border-white/30"
                              )}
                              onClick={() => handlePresetWorkChange(work.id)}
                            >
                              <div className="font-medium text-base line-clamp-1">
                                {getWorkName(work, locale)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {work.popularPairings.length} {tabbedForm?.popular_pairings_label || 'pairings'}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50 mb-2 block">
                          {section.source.custom_label}
                        </Label>
                        <Textarea
                          placeholder={section.source.preset_placeholder}
                          value={customWorkName}
                          onChange={(e) => setCustomWorkName(e.target.value)}
                          rows={2}
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Characters */}
                {currentStep === 2 && (
                  <div className="space-y-12">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold tracking-tight mb-4">{section.tabbed?.steps?.step2?.title}</h2>
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
                            "w-full px-6 py-4 rounded-2xl border transition-all text-left",
                            pairingType === option.value
                              ? "bg-pink-500 text-white border-pink-500 shadow-lg"
                              : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <div className="font-semibold text-lg">{option.label}</div>
                        </button>
                      ))}
                    </div>

                    {/* Preset Characters */}
                    <div className="space-y-4">
                      <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50">
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
                                ? "bg-pink-500 text-white border-pink-500 shadow-lg"
                                : "bg-white/5 border-white/10 hover:bg-white/10"
                            )}
                          >
                            {getCharacterName(char, locale)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Characters */}
                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50">
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
                          className="flex-1 h-12 px-4 rounded-2xl bg-white/5 border border-white/10 focus:border-pink-500/50 focus:ring-0"
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
                            <div key={charId} className="flex items-center gap-2 px-4 py-2 bg-pink-500/10 text-pink-400 rounded-full border border-pink-500/20">
                              <span className="text-sm font-semibold">
                                {(() => {
                                  const work = getWorkById(selectedPresetWork);
                                  const presetChar = work?.characters.find((c) => c.id === charId);
                                  return presetChar ? getCharacterName(presetChar, locale) : charId;
                                })()}
                              </span>
                              <button
                                onClick={() => handleRemoveCharacter(charId)}
                                className="p-1 rounded-full hover:bg-pink-500/20"
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
                  <div className="space-y-12">
                      <div className="text-center">
                         <h2 className="text-3xl font-bold tracking-tight mb-4">{section.tabbed?.steps?.step3?.title}</h2>
                         <p className="text-muted-foreground/60 font-light">{section.tabbed?.steps?.step3?.description}</p>
                      </div>

                      {/* Plot Type */}
                      <div className="space-y-4">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">{section.tabbed?.form?.plot_type_label}</Label>
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
                                "py-3 px-2 rounded-xl text-sm font-medium transition-all duration-300 border",
                                plotType === type.value 
                                  ? "bg-teal-500 text-white border-teal-500 shadow-lg"
                                  : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
                              )}
                            >
                              {type.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Language */}
                      <div className="space-y-4">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">
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
                                  ? "bg-white/10 border-white/30 text-foreground shadow-lg shadow-teal-500/20"
                                  : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {language === code && (
                                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold">
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
                        <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/10 to-pink-500/10 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">{section.tabbed?.form?.story_prompt_label}</Label>
                        <Textarea
                          ref={promptRef}
                          placeholder={section.tabbed?.form?.story_prompt_placeholder}
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="relative min-h-[200px] w-full bg-transparent border-0 border-b border-white/10 focus:border-teal-500/50 focus:ring-0 rounded-none px-0 text-xl font-light leading-relaxed placeholder:text-muted-foreground/20 resize-none transition-all duration-300"
                          style={{ boxShadow: 'none' }}
                        />
                        <div className="flex justify-end">
                           <span className={cn("text-[10px] font-bold uppercase tracking-widest", prompt.trim().length < 10 ? "text-orange-400" : "text-teal-400")}>
                              {prompt.length} / 2000
                           </span>
                        </div>
                      </div>
                  </div>
                )}

                {/* Step 4: Advanced */}
                {currentStep === 4 && (
                  <div className="space-y-12">
                     <div className="text-center">
                         <h2 className="text-3xl font-bold tracking-tight mb-4">{section.tabbed?.steps?.step4?.title}</h2>
                         <p className="text-muted-foreground/60 font-light">{section.tabbed?.form?.advanced_options?.subtitle}</p>
                     </div>

                     <div className="space-y-10">
                       {/* AI Model Selection */}
                       <div className="space-y-4">
                         <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                           {section.ai_models?.title || 'AI Model'}
                         </Label>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           {AI_MODELS.map((model) => (
                             <button
                               key={model.id}
                               type="button"
                               onClick={() => setSelectedModel(model.id)}
                               className={cn(
                                 "w-full text-left px-5 py-4 rounded-2xl border transition-all bg-white/5 hover:bg-white/10",
                                 selectedModel === model.id
                                   ? "border-pink-500/70 shadow-lg shadow-pink-500/20"
                                   : "border-white/10"
                               )}
                             >
                               <div className="flex items-center justify-between mb-1">
                                 <span className="font-semibold text-sm">{model.name}</span>
                                 {model.badge && (
                                   <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/40">
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

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-6">
                             <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{section.tabbed?.form?.advanced_options?.ooc_level}</Label>
                             <div className="space-y-3">
                                {['slight', 'moderate', 'bold'].map((opt) => (
                                  <button
                                    key={opt}
                                    onClick={() => setAdvancedOptions({...advancedOptions, ooc: opt})}
                                    className={cn(
                                      "w-full text-left px-6 py-4 rounded-xl border transition-all",
                                      advancedOptions.ooc === opt
                                        ? "bg-pink-500/10 border-pink-500/50 text-pink-400"
                                        : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                                    )}
                                  >
                                    <div className="font-bold text-sm uppercase tracking-wide">{opt}</div>
                                  </button>
                                ))}
                             </div>
                          </div>

                          <div className="space-y-6">
                             <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{section.tabbed?.form?.advanced_options?.story_length}</Label>
                             <div className="space-y-3">
                                {['short', 'medium', 'long'].map((opt) => (
                                  <button
                                    key={opt}
                                    onClick={() => setAdvancedOptions({...advancedOptions, length: opt})}
                                    className={cn(
                                      "w-full text-left px-6 py-4 rounded-xl border transition-all",
                                      advancedOptions.length === opt
                                        ? "bg-teal-500/10 border-teal-500/50 text-teal-400"
                                        : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
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
                  <div className="space-y-12">
                    {!hasStartedGeneration ? (
                      <div className="text-center py-12">
                        <div className="inline-flex p-6 rounded-full bg-white/5 mb-8 animate-pulse">
                          <Zap className="size-12 text-yellow-400" />
                        </div>
                        <h2 className="text-3xl font-bold mb-6">{section.tabbed?.steps?.step5?.title}</h2>

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
                          className="h-16 px-12 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 text-white text-lg font-bold shadow-[0_0_30px_rgba(236,72,153,0.4)] hover:shadow-[0_0_50px_rgba(236,72,153,0.6)] hover:scale-105 transition-all duration-500"
                        >
                          <Sparkles className="mr-2 size-5" />
                          <span>{section.tabbed?.form?.generation?.start_button}</span>
                        </Button>
                        <GeneratorShortcutHints showQuickSave />
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* Status Card */}
                        <div className="glass-premium rounded-[2rem] p-8 md:p-12 bg-background/40">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  "px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border",
                                  isGenerating
                                    ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/40 animate-pulse"
                                    : "bg-teal-500/10 text-teal-300 border-teal-500/40"
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
                                <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
                                {section.tabbed?.form?.generation?.status_writing || 'Streaming response...'}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Output Card */}
                        <div className="glass-premium rounded-[2rem] overflow-hidden animate-fade-in-up">
                          <div className="p-8 md:p-12 bg-background/60 min-h-[400px]">
                            {generatedTags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-8">
                                {generatedTags.map(tag => (
                                  <span key={tag} className="px-3 py-1 rounded-full bg-white/5 text-xs font-bold text-muted-foreground border border-white/5">{tag}</span>
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
                                <div className="w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
                                {section.tabbed?.form?.generation?.status_writing || 'Streaming response...'}
                              </div>
                            )}
                          </div>
                          <div className="bg-white/5 p-6 flex justify-end gap-4">
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
                  <div className="flex justify-between mt-16 pt-8 border-t border-white/5">
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
