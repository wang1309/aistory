"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle, ModernCardDescription } from "@/components/ui/modern-card";
import { StepIndicator } from "@/components/ui/step-indicator";
import { HeroSection } from "@/components/ui/hero-section";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { GradientText } from "@/components/ui/gradient-text";
import { QuickStartCard } from "@/components/ui/quick-start-card";
import { EnhancedBadge } from "@/components/ui/enhanced-badge";
import { StickyCTA } from "@/components/ui/sticky-cta";
import { ProgressBar } from "@/components/ui/progress-bar";
import Icon from "@/components/icon";
import { toast } from "sonner";
import { FanficGenerate as FanficGenerateType } from "@/types/blocks/fanfic-generate";
import { useLocale, useTranslations } from "next-intl";
import { useAppContext } from "@/contexts/app";
import confetti from "canvas-confetti";
import { FanficStorage } from "@/lib/fanfic-storage";
import { PRESET_WORKS, getWorkById, getCharacterName, getCharacterById, getWorkName } from "@/lib/preset-works";
import { cn } from "@/lib/utils";
import TurnstileInvisible, { TurnstileInvisibleHandle } from "@/components/TurnstileInvisible";
import { ChevronDown, ChevronLeft, ChevronRight, Sparkles, Zap, Heart, BookOpen, Wand2, Tv, Gamepad2, Film } from "lucide-react";

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

// ========== MODERN FANFIC GENERATE COMPONENT ==========

export default function ModernFanficGenerate({ section }: { section: FanficGenerateType }) {
  const locale = useLocale();
  const t = useTranslations('hero_fanfic.modern');
  const { user } = useAppContext();

  // ========== STEP DEFINITIONS ==========

  const STEPS = [
    { id: 1, title: section.modern?.steps?.step1?.title || "选择原作", description: section.modern?.steps?.step1?.description || "选择你喜欢的作品和角色" },
    { id: 2, title: section.modern?.steps?.step2?.title || "配置参数", description: section.modern?.steps?.step2?.description || "设置故事类型和风格" },
    { id: 3, title: section.modern?.steps?.step3?.title || "生成创作", description: section.modern?.steps?.step3?.description || "AI{t('actions.generate_fanfic') || '开始创作'}你的同人故事" },
  ];

  // ========== STATE MANAGEMENT ==========

  const [currentStep, setCurrentStep] = useState(1);
  const [sourceType, setSourceType] = useState<'preset' | 'custom'>('preset');
  const [selectedPresetWork, setSelectedPresetWork] = useState<string>('');
  const [customWorkName, setCustomWorkName] = useState('');
  const [pairingType, setPairingType] = useState<'romantic' | 'gen' | 'poly'>('romantic');
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [plotType, setPlotType] = useState('canon');
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFanfic, setGeneratedFanfic] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const turnstileRef = useRef<TurnstileInvisibleHandle | null>(null);
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [advancedOptions, setAdvancedOptions] = useState({
    ooc: 'slight',
    fidelity: 'balanced',
    ending: 'happy',
    rating: 'teen',
    length: 'medium',
    perspective: 'third',
  });

  // ========== REF FOR LATEST STATE ==========
  const latestStateRef = useRef({
    sourceType,
    selectedPresetWork,
    customWorkName,
    pairingType,
    selectedCharacters,
    plotType,
    prompt,
    advancedOptions,
  });

  // Update ref when state changes
  useEffect(() => {
    latestStateRef.current = {
      sourceType,
      selectedPresetWork,
      customWorkName,
      pairingType,
      selectedCharacters,
      plotType,
      prompt,
      advancedOptions,
    };
  }, [sourceType, selectedPresetWork, customWorkName, pairingType, selectedCharacters, plotType, prompt, advancedOptions]);

  // ========== HANDLER FUNCTIONS ==========

  const handlePresetWorkChange = useCallback((workId: string) => {
    setSelectedPresetWork(workId);
    setSelectedCharacters([]);
  }, []);

  const handleAddCharacter = useCallback((characterId: string) => {
    if (!selectedCharacters.includes(characterId)) {
      if (pairingType === 'gen' && selectedCharacters.length >= 1) {
        toast.error(t('messages.error_gen_limit') || "Gen-focused can only select 1 character");
        return;
      }
      if (pairingType === 'romantic' && selectedCharacters.length >= 2) {
        toast.error(t('messages.error_romantic_limit') || "Romantic can only select 2 characters");
        return;
      }
      setSelectedCharacters([...selectedCharacters, characterId]);
    }
  }, [selectedCharacters, pairingType]);

  const handleRemoveCharacter = useCallback((characterId: string) => {
    setSelectedCharacters(selectedCharacters.filter(id => id !== characterId));
  }, [selectedCharacters]);

  // ========== VALIDATION ==========

  const canProceedToStep2 = useMemo(() => {
    if (sourceType === 'preset') {
      return selectedPresetWork && selectedCharacters.length > 0;
    } else {
      return customWorkName.trim() && selectedCharacters.length > 0;
    }
  }, [sourceType, selectedPresetWork, customWorkName, selectedCharacters]);

  const canProceedToStep3 = useMemo(() => {
    return prompt.trim().length >= 10;
  }, [prompt]);

  const canGenerate = useMemo(() => {
    return canProceedToStep3 && !isGenerating;
  }, [canProceedToStep3, isGenerating]);

  // ========== STEP NAVIGATION ==========

  const nextStep = () => {
    if (currentStep === 1 && !canProceedToStep2) {
      toast.error(t('messages.step_validation') || "Please complete current step first");
      return;
    }
    if (currentStep === 2 && !canProceedToStep3) {
      toast.error(t('messages.step_validation') || "Please complete current step first");
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // ========== QUICK START ==========

  const handleQuickStart = useCallback(() => {
    const popularWork = PRESET_WORKS[0]; // 使用第一个热门作品
    const popularPairing = popularWork.popularPairings[0];
    setSourceType('preset');
    setSelectedPresetWork(popularWork.id);
    setPairingType('romantic');
    setSelectedCharacters(popularPairing);
    setCurrentStep(2);
    toast.success(t('messages.auto_advance') || "Popular configuration selected!");
  }, []);

  // ========== GENERATE FUNCTION ==========

  const handleGenerate = useCallback(() => {
    if (!canGenerate) {
      toast.error(t('messages.step_validation') || "Please complete all required information");
      return;
    }

    // Start loading state while Turnstile verification is in progress
    setIsGenerating(true);

    // Trigger invisible Turnstile verification
    // After verification succeeds, handleTurnstileSuccess will be called automatically
    turnstileRef.current?.execute();
  }, [canGenerate, t]);

  // Handle verification success - start fanfic generation
  const handleVerificationSuccess = useCallback(async (token: string) => {
    console.log('=== Starting fanfic generation after verification ===');

    if (!user) {
      toast.error(t('messages.login_required') || '请先登录后再生成同人小说');
      setIsGenerating(false);
      return;
    }

    setTurnstileToken(token);

    // Get fresh state values from ref at the time of execution
    const currentState = latestStateRef.current;

    console.log('=== Current state from ref ===', {
      ...currentState,
      prompt: currentState.prompt?.substring(0, 100),
    });

    setIsGenerating(true);
    setGeneratedFanfic('');
    setWordCount(0);

    try {
      const requestData = {
        sourceType: currentState.sourceType,
        presetWorkId: currentState.sourceType === 'preset' ? currentState.selectedPresetWork : null,
        customWorkName: currentState.sourceType === 'custom' ? currentState.customWorkName : null,
        pairingType: currentState.pairingType,
        characters: currentState.selectedCharacters,
        plotType: currentState.plotType,
        prompt: currentState.prompt,
        language,
        options: currentState.advancedOptions,
        turnstileToken: token,
      };
      console.log('=== Request data ===', requestData);

      // 调用API生成同人小说
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

      // 生成标签
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

      // 保存到历史记录
      try {
        FanficStorage.saveHistory({
          title: `同人文 - ${sourceName}`,
          source: {
            type: sourceType,
            name: sourceName,
            characters: selectedCharacters,
          },
          pairing: {
            type: pairingType,
            characters: selectedCharacters,
          },
          plotType,
          prompt,
          content: accumulatedText,
          wordCount: count,
          tags,
          model: 'standard',
          options: advancedOptions,
        });
      } catch (error) {
        console.error('保存历史记录失败:', error);
      }

      toast.success(t('messages.generation_success') || "Creation complete!");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

    } catch (error) {
      console.error('Generation failed:', error);
      toast.error(error instanceof Error ? error.message : t('messages.error_generation') || 'Generation failed, please try again');
    } finally {
      setIsGenerating(false);
    }
  }, [
    user,
    sourceType,
    selectedPresetWork,
    customWorkName,
    selectedCharacters,
    plotType,
    pairingType,
    prompt,
    advancedOptions,
    language,
    locale,
    t,
  ]);

  const handleTurnstileSuccess = useCallback((token: string) => {
    console.log('✓ Turnstile verification successful (Fanfic)');
    setTurnstileToken(token);
    handleVerificationSuccess(token);
  }, [handleVerificationSuccess]);

  const handleTurnstileError = useCallback(() => {
    console.error('❌ Turnstile verification failed (Fanfic)');
    setIsGenerating(false);
    toast.error(t('messages.error_generation') || 'Generation failed, please try again');
  }, [t]);

  // ========== RENDER ==========

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection
        subtitle="AI-Powered Fanfiction Generator"
        title={
          <span>
            <GradientText variant="hero">{t('steps.step1.title') || '创作你的同人故事'}</GradientText>
          </span>
        }
        description={t('steps.step1.description') || '基于热门IP和角色，AI帮你创作精彩的同人小说。支持多种剧情类型和风格，让想象力自由飞翔。'}
        background="gradient"
      />

      {/* Step Indicator */}
      <div className="container mx-auto px-4 pb-8">
        <StepIndicator steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Step Content */}
      <div className="container mx-auto px-4 pb-32 md:pb-24">
        <AnimatedContainer variant="fadeIn" key={currentStep}>
          {/* Step 1: Select Source Work */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <ModernCard variant="elevated" className="max-w-4xl mx-auto">
                <ModernCardHeader>
                  <ModernCardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    {t('steps.step1.title') || '选择原作和角色'}
                  </ModernCardTitle>
                  <ModernCardDescription>
                    从热门IP中选择你喜欢的作品，然后挑选你最喜欢的角色进行配对
                  </ModernCardDescription>
                </ModernCardHeader>
                <ModernCardContent className="space-y-6">
                  {/* Quick Start Options */}
                  <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      {t('form.popular_works') || '快速开始'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {PRESET_WORKS.slice(0, 3).map((work) => (
                        <Button
                          key={work.id}
                          variant="outline"
                          className={cn(
                            "h-auto p-4 flex flex-col items-start gap-2",
                            selectedPresetWork === work.id && sourceType === 'preset'
                              ? "border-primary bg-primary/10"
                              : "hover:border-primary/50"
                          )}
                          onClick={() => {
                            setSourceType('preset');
                            handlePresetWorkChange(work.id);
                          }}
                        >
                          <div className="font-medium text-sm">
                            {getWorkName(work, locale)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {work.popularPairings.length} 个热门配对
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* All Works Grid */}
                  <div>
                    <h3 className="font-semibold mb-3">{t('form.custom_work') || '全部作品'}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {PRESET_WORKS.map((work) => (
                        <ModernCard
                          key={work.id}
                          variant="hover"
                          interactive
                          className={cn(
                            "p-4 cursor-pointer transition-all",
                            selectedPresetWork === work.id && sourceType === 'preset'
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                              : ""
                          )}
                          onClick={() => {
                            setSourceType('preset');
                            handlePresetWorkChange(work.id);
                          }}
                        >
                          <div className="text-center">
                            <div className="mb-2 flex justify-center">
                              {work.category === 'anime' ? <Tv className="h-6 w-6 text-primary/60" /> :
                               work.category === 'novel' ? <BookOpen className="h-6 w-6 text-primary/60" /> :
                               work.category === 'movie' ? <Film className="h-6 w-6 text-primary/60" /> :
                               <Gamepad2 className="h-6 w-6 text-primary/60" />}
                            </div>
                            <div className="font-medium text-sm">
                              {getWorkName(work, locale)}
                            </div>
                          </div>
                        </ModernCard>
                      ))}
                    </div>
                  </div>

                  {/* Character Selection */}
                  {selectedPresetWork && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-pink-500" />
                        选择配对类型
                      </h3>
                      <RadioGroup
                        value={pairingType}
                        onValueChange={(value: 'romantic' | 'gen' | 'poly') => {
                          setPairingType(value);
                          setSelectedCharacters([]);
                        }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                      >
                        <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                          <RadioGroupItem value="romantic" id="romantic" />
                          <Label htmlFor="romantic" className="flex-1 cursor-pointer">
                            <div className="font-medium">浪漫向</div>
                            <div className="text-xs text-muted-foreground">2个角色的恋爱故事</div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                          <RadioGroupItem value="gen" id="gen" />
                          <Label htmlFor="gen" className="flex-1 cursor-pointer">
                            <div className="font-medium">单人中心向</div>
                            <div className="text-xs text-muted-foreground">以一个角色为中心</div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                          <RadioGroupItem value="poly" id="poly" />
                          <Label htmlFor="poly" className="flex-1 cursor-pointer">
                            <div className="font-medium">多人配对</div>
                            <div className="text-xs text-muted-foreground">3个或更多角色</div>
                          </Label>
                        </div>
                      </RadioGroup>

                      {/* Character Grid */}
                      {selectedPresetWork && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-3">选择角色（已选 {selectedCharacters.length}）</h4>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const work = getWorkById(selectedPresetWork);
                              return work?.characters.map((char) => (
                                <Button
                                  key={char.id}
                                  variant={selectedCharacters.includes(char.id) ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => {
                                    if (selectedCharacters.includes(char.id)) {
                                      handleRemoveCharacter(char.id);
                                    } else {
                                      handleAddCharacter(char.id);
                                    }
                                  }}
                                  className={cn(
                                    "h-auto py-2 px-3",
                                    selectedCharacters.includes(char.id) && "bg-primary text-primary-foreground"
                                  )}
                                >
                                  {getCharacterName(char, locale)}
                                </Button>
                              ));
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Popular Pairings */}
                      {selectedPresetWork && (() => {
                        const work = getWorkById(selectedPresetWork);
                        return work && work.popularPairings.length > 0 ? (
                          <div className="mt-6">
                            <h4 className="font-medium mb-3">热门配对推荐</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {work.popularPairings.slice(0, 4).map((pairing, index) => {
                                const pairingNames = pairing.map(charId => {
                                  const char = getCharacterById(work, charId);
                                  return char ? getCharacterName(char, locale) : charId;
                                });
                                return (
                                  <Button
                                    key={index}
                                    variant="secondary"
                                    className="h-auto py-3 px-4 justify-start"
                                    onClick={() => {
                                      setPairingType(pairing.length === 1 ? 'gen' : 'romantic');
                                      setSelectedCharacters(pairing);
                                    }}
                                  >
                                    <Heart className="w-4 h-4 mr-2 text-pink-500" />
                                    {pairingNames.join(' × ')}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </ModernCardContent>
              </ModernCard>
            </div>
          )}

          {/* Step 2: Configure Parameters */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <ModernCard variant="elevated" className="max-w-4xl mx-auto">
                <ModernCardHeader>
                  <ModernCardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-primary" />
                    {t('steps.step3.title') || '配置故事参数'}
                  </ModernCardTitle>
                  <ModernCardDescription>
                    自定义你的故事类型、长度、风格等细节
                  </ModernCardDescription>
                </ModernCardHeader>
                <ModernCardContent className="space-y-6">
                  {/* Plot Type */}
                  <div>
                    <Label className="text-base font-medium mb-3 block">剧情类型</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { value: 'canon', label: '原著向', desc: '遵循原作设定' },
                        { value: 'modern_au', label: '现代AU', desc: '现代都市背景' },
                        { value: 'school_au', label: '校园AU', desc: '校园环境设定' },
                        { value: 'fantasy_au', label: '奇幻AU', desc: '架空魔法世界' },
                      ].map((type) => (
                        <Button
                          key={type.value}
                          variant={plotType === type.value ? "default" : "outline"}
                          className={cn(
                            "h-auto py-4 px-4 text-left justify-start",
                            plotType === type.value && "bg-primary text-primary-foreground"
                          )}
                          onClick={() => setPlotType(type.value)}
                        >
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs opacity-80 mt-1">{type.desc}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Prompt */}
                  <div>
                    <Label className="text-base font-medium mb-3 block">
                      故事提示 <span className="text-xs text-muted-foreground font-normal">（至少10个字）</span>
                    </Label>
                    <Textarea
                      placeholder="描述你想要的故事内容、情节或场景..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[120px] resize-none"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className={cn(
                        "text-xs",
                        prompt.trim().length < 10 ? "text-orange-500" : "text-muted-foreground"
                      )}>
                        {prompt.trim().length} / 2000 字符
                      </span>
                      {prompt.trim().length >= 10 && (
                        <EnhancedBadge variant="success" size="sm">
                          ✓ 符合要求
                        </EnhancedBadge>
                      )}
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between">
                        <span className="font-medium">高级选项</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">OOC程度</Label>
                          <RadioGroup
                            value={advancedOptions.ooc}
                            onValueChange={(value) => setAdvancedOptions({...advancedOptions, ooc: value})}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="slight" id="ooc-slight" />
                              <Label htmlFor="ooc-slight" className="text-sm">符合原著</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="moderate" id="ooc-moderate" />
                              <Label htmlFor="ooc-moderate" className="text-sm">轻微OOC</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="bold" id="ooc-bold" />
                              <Label htmlFor="ooc-bold" className="text-sm">大胆改编</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">故事长度</Label>
                          <RadioGroup
                            value={advancedOptions.length}
                            onValueChange={(value) => setAdvancedOptions({...advancedOptions, length: value})}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="short" id="length-short" />
                              <Label htmlFor="length-short" className="text-sm">短篇 (300-600字)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="medium" id="length-medium" />
                              <Label htmlFor="length-medium" className="text-sm">中篇 (600-1500字)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="long" id="length-long" />
                              <Label htmlFor="length-long" className="text-sm">长篇 (1500-3000字)</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </ModernCardContent>
              </ModernCard>
            </div>
          )}

          {/* Step 3: Generate */}
          {currentStep === 3 && (() => {
            const presetWork = sourceType === 'preset' ? getWorkById(selectedPresetWork) : null;
            return (
              <div className="space-y-6">
                <ModernCard variant="elevated" className="max-w-4xl mx-auto">
                <ModernCardHeader>
                  <ModernCardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    生成你的同人故事
                  </ModernCardTitle>
                  <ModernCardDescription>
                    AI正在等待{t('actions.generate_fanfic') || '开始创作'}你的专属同人小说
                  </ModernCardDescription>
                </ModernCardHeader>
                <ModernCardContent className="space-y-6">
                  {/* Summary */}
                  <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                    <h3 className="font-semibold">创作概要</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">原作：</span>
                        <span className="font-medium ml-2">
                          {sourceType === 'preset' && presetWork
                            ? getWorkName(presetWork, locale)
                            : customWorkName}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">配对：</span>
                        <span className="font-medium ml-2">
                          {selectedCharacters.map(id => {
                            const char = presetWork ? getCharacterById(presetWork, id) : null;
                            return char ? getCharacterName(char, locale) : id;
                          }).join(' × ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">类型：</span>
                        <span className="font-medium ml-2">
                          {plotType === 'canon' ? '原著向' :
                           plotType === 'modern_au' ? '现代AU' :
                           plotType === 'school_au' ? '校园AU' :
                           plotType === 'fantasy_au' ? '奇幻AU' : '跨界'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">长度：</span>
                        <span className="font-medium ml-2">
                          {advancedOptions.length === 'short' ? '短篇' :
                           advancedOptions.length === 'medium' ? '中篇' : '长篇'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="flex justify-center">
                    <Button
                      onClick={handleGenerate}
                      disabled={!canGenerate}
                      size="lg"
                      className={cn(
                        "max-w-md h-14 text-base font-medium",
                        "bg-gradient-to-r from-primary via-pink-600 to-blue-600",
                        "hover:from-primary/90 hover:via-pink-600/90 hover:to-blue-600/90",
                        "shadow-strong hover:shadow-elevated",
                        "transform hover:scale-[1.02] transition-all duration-200",
                        isGenerating && "animate-pulse"
                      )}
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                          正在创作中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          {t('actions.generate_fanfic') || '开始创作'}同人小说
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Output Display */}
                  {generatedFanfic && (
                    <div className="p-6 rounded-lg border bg-card space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Icon name="mdi:text-box" className="w-5 h-5" />
                          创作完成
                        </h3>
                        <div className="text-sm text-muted-foreground">
                          {wordCount} 字
                        </div>
                      </div>

                      {/* Tags */}
                      {generatedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {generatedTags.map((tag, index) => (
                            <EnhancedBadge key={index} variant="secondary" size="sm">
                              {tag}
                            </EnhancedBadge>
                          ))}
                        </div>
                      )}

                      {/* Content */}
                      <div className="prose prose-sm max-w-none dark:prose-invert p-4 rounded-lg bg-muted/30 whitespace-pre-wrap">
                        {generatedFanfic}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedFanfic);
                            toast.success("{t('results.copy_success') || '已复制到剪贴板'}");
                          }}
                        >
                          <Icon name="mdi:content-copy" className="w-4 h-4 mr-1" />
                          复制
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerate}
                          disabled={isGenerating}
                        >
                          <Icon name="mdi:refresh" className="w-4 h-4 mr-1" />
                          重新生成
                        </Button>
                      </div>
                    </div>
                  )}
                </ModernCardContent>
              </ModernCard>
              </div>
            );
          })()}
        </AnimatedContainer>
      </div>

      {/* Sticky Navigation */}
      {!generatedFanfic && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border p-4 shadow-2xl md:hidden">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={prevStep}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t('actions.previous') || '上一步'}
              </Button>
            )}
            {currentStep < 3 && (
              <Button
                onClick={nextStep}
                disabled={currentStep === 1 ? !canProceedToStep2 : currentStep === 2 ? !canProceedToStep3 : false}
                className={cn(
                  "flex-1 bg-gradient-to-r from-primary to-blue-500",
                  "hover:from-primary/90 hover:to-blue-600"
                )}
              >
                {t('actions.next') || '下一步'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      {!generatedFanfic && (
        <div className="hidden md:flex justify-center gap-4 pb-8">
          {currentStep > 1 && (
            <Button variant="outline" onClick={prevStep}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t('actions.previous') || '上一步'}
            </Button>
          )}
          {currentStep < 3 && (
            <Button
              onClick={nextStep}
              disabled={currentStep === 1 ? !canProceedToStep2 : currentStep === 2 ? !canProceedToStep3 : false}
              className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600"
            >
              {t('actions.next') || '下一步'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      )}

      {/* Sticky CTA for Generate */}
      {currentStep === 3 && !generatedFanfic && (
        <StickyCTA>
          {t('actions.generate_fanfic') || '开始创作'}
        </StickyCTA>
      )}
      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={handleTurnstileSuccess}
        onError={handleTurnstileError}
      />
    </div>
  );
}
