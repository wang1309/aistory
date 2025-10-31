"use client";

import { useState, useCallback } from "react";
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
import { useLocale } from "next-intl";
import { useAppContext } from "@/contexts/app";
import confetti from "canvas-confetti";
import { FanficStorage } from "@/lib/fanfic-storage";
import { PRESET_WORKS, getWorkById, getCharacterName, getCharacterById, getWorkName } from "@/lib/preset-works";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Heart,
  Wand2,
  Zap,
  Sparkles,
  Settings
} from "lucide-react";

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
  const { user, setShowVerificationModal, setVerificationCallback } = useAppContext();

  // ========== STATE MANAGEMENT ==========

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const [sourceType, setSourceType] = useState<'preset' | 'custom'>('preset');
  const [selectedPresetWork, setSelectedPresetWork] = useState<string>('');
  const [customWorkName, setCustomWorkName] = useState('');

  const [pairingType, setPairingType] = useState<'romantic' | 'gen' | 'poly'>('romantic');
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);

  const [plotType, setPlotType] = useState('canon');
  const [prompt, setPrompt] = useState('');

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

  // ========== STEP DEFINITIONS ==========

  const steps = [
    { id: 'step1', title: '选择原作', description: '选择作品' },
    { id: 'step2', title: '选择角色', description: '选择配对' },
    { id: 'step3', title: '故事设置', description: '配置参数' },
    { id: 'step4', title: '高级选项', description: '自定义' },
    { id: 'step5', title: '生成创作', description: '开始创作' },
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
        toast.error("单人向最多只能选择1个角色");
        return;
      }
      if (pairingType === 'romantic' && selectedCharacters.length >= 2) {
        toast.error("浪漫向最多只能选择2个角色");
        return;
      }
      setSelectedCharacters([...selectedCharacters, characterId]);
    }
  }, [selectedCharacters, pairingType]);

  const handleRemoveCharacter = useCallback((characterId: string) => {
    setSelectedCharacters(selectedCharacters.filter(id => id !== characterId));
  }, [selectedCharacters]);

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
      toast.success(`已自动进入步骤 ${nextStep}`);
    }
  }, [currentStep, completedSteps]);

  // ========== GENERATE FUNCTION ==========

  const handleGenerate = useCallback(async () => {
    if (!user) {
      setShowVerificationModal(true);
      setVerificationCallback(() => handleGenerate);
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/fanfic-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceType,
          presetWorkId: sourceType === 'preset' ? selectedPresetWork : null,
          customWorkName: sourceType === 'custom' ? customWorkName : null,
          pairingType,
          characters: selectedCharacters,
          plotType,
          prompt,
          language: 'zh',
          options: advancedOptions,
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedFanfic(data.content);
      const count = calculateWordCount(data.content);
      setWordCount(count);

      const sourceName = sourceType === 'preset'
        ? getWorkName(getWorkById(selectedPresetWork), locale)
        : customWorkName;
      const tags = [
        `#${sourceName.replace(/\s+/g, '')}`,
        `#${selectedCharacters.map(id => {
          const char = getCharacterById(getWorkById(selectedPresetWork), id);
          return char ? getCharacterName(char, locale) : id;
        }).join('×')}`,
        ...(plotType !== 'canon' ? [`#${plotType.toUpperCase()}`] : []),
      ];
      setGeneratedTags(tags);

      toast.success("创作完成！");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

    } catch (error) {
      console.error('生成失败:', error);
      toast.error(error instanceof Error ? error.message : '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  }, [user, setShowVerificationModal, setVerificationCallback, sourceType, selectedPresetWork, customWorkName, pairingType, selectedCharacters, plotType, prompt, advancedOptions, locale]);

  // ========== NEXT STEP HANDLER ==========

  const handleNextStep = () => {
    const completed = isStepCompleted(currentStep);
    if (!completed) {
      toast.error("请先完成当前步骤");
      return;
    }
    autoAdvance();
  };

  // ========== RENDER ==========

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-b from-background via-background/95 to-background">
        <div className="container mx-auto px-4 max-w-4xl"> {/* 限制最大宽度 */}
          <div className="text-center">
            <AnimatedContainer variant="slideDown">
              <p className="text-sm md:text-base font-medium text-primary tracking-wide uppercase mb-4">
                AI-Powered Fanfiction Generator
              </p>
            </AnimatedContainer>
            <AnimatedContainer variant="slideUp" delay={0.1}>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                <GradientText variant="hero">创作你的同人故事</GradientText>
              </h1>
            </AnimatedContainer>
            <AnimatedContainer variant="slideUp" delay={0.2}>
              <p className="text-lg text-muted-foreground">
                基于热门IP和角色，AI帮你创作精彩的同人小说
              </p>
            </AnimatedContainer>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Step Tabs */}
      <div className="container mx-auto px-4 max-w-4xl py-8">
        <StepTabs
          steps={steps.map((step, index) => ({
            ...step,
            isCompleted: completedSteps.includes(index + 1) || isStepCompleted(index + 1)
          }))}
          activeStepId={activeStepId}
          onStepChange={(stepId) => {
            const stepNum = parseInt(stepId.replace('step', ''));
            // Only allow navigation to completed steps or next step
            if (stepNum <= currentStep || completedSteps.includes(stepNum)) {
              setCurrentStep(stepNum);
            }
          }}
        />

        {/* Step Content */}
        <div>
          <AnimatedContainer key={currentStep} variant="scale">
            {/* Step 1: Select Source Work */}
            {currentStep === 1 && (
              <ModernCard variant="elevated">
                <ModernCardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-semibold">选择原作</h2>
                    </div>
                    {isStepCompleted(1) && (
                      <EnhancedBadge variant="success" size="sm">✓ 已完成</EnhancedBadge>
                    )}
                  </div>
                </ModernCardHeader>
                <ModernCardContent className="space-y-6">
                  {/* Source Type */}
                  <div>
                    <Label className="text-base font-medium mb-3 block">选择来源</Label>
                    <RadioGroup
                      value={sourceType}
                      onValueChange={(value: 'preset' | 'custom') => setSourceType(value)}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                        <RadioGroupItem value="preset" id="preset" />
                        <Label htmlFor="preset" className="flex-1 cursor-pointer font-medium">预置作品</Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                        <RadioGroupItem value="custom" id="custom" />
                        <Label htmlFor="custom" className="flex-1 cursor-pointer font-medium">自定义</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Preset Works */}
                  {sourceType === 'preset' && (
                    <div>
                      <Label className="text-base font-medium mb-3 block">热门IP作品</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {PRESET_WORKS.map((work) => (
                          <Button
                            key={work.id}
                            variant={selectedPresetWork === work.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePresetWorkChange(work.id)}
                            className={cn(
                              "h-auto py-3 px-3 text-sm justify-start",
                              selectedPresetWork === work.id && "bg-primary text-primary-foreground"
                            )}
                          >
                            {getWorkName(work, locale)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Input */}
                  {sourceType === 'custom' && (
                    <div>
                      <Label className="text-base font-medium mb-3 block">输入作品名称</Label>
                      <input
                        type="text"
                        placeholder="例如：你的名字、原神、咒术回战..."
                        value={customWorkName}
                        onChange={(e) => setCustomWorkName(e.target.value)}
                        className="w-full h-12 px-4 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  )}

                  {/* Next Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleNextStep}
                      disabled={!isStepCompleted(1)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      下一步
                    </Button>
                  </div>
                </ModernCardContent>
              </ModernCard>
            )}

            {/* Step 2: Select Characters */}
            {currentStep === 2 && (
              <ModernCard variant="elevated">
                <ModernCardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-pink-500" />
                      <h2 className="text-xl font-semibold">选择角色</h2>
                    </div>
                    {isStepCompleted(2) && (
                      <EnhancedBadge variant="success" size="sm">✓ 已完成</EnhancedBadge>
                    )}
                  </div>
                </ModernCardHeader>
                <ModernCardContent className="space-y-6">
                  {/* Pairing Type */}
                  <div>
                    <Label className="text-base font-medium mb-3 block">配对类型</Label>
                    <RadioGroup
                      value={pairingType}
                      onValueChange={(value: 'romantic' | 'gen' | 'poly') => {
                        setPairingType(value);
                        setSelectedCharacters([]);
                      }}
                      className="grid grid-cols-3 gap-3"
                    >
                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50">
                        <RadioGroupItem value="romantic" id="romantic" />
                        <Label htmlFor="romantic" className="flex-1 cursor-pointer">浪漫向</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50">
                        <RadioGroupItem value="gen" id="gen" />
                        <Label htmlFor="gen" className="flex-1 cursor-pointer">单人中心</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50">
                        <RadioGroupItem value="poly" id="poly" />
                        <Label htmlFor="poly" className="flex-1 cursor-pointer">多人配对</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Character Selection */}
                  {sourceType === 'preset' && selectedPresetWork && (() => {
                    const work = getWorkById(selectedPresetWork);
                    return work ? (
                      <div>
                        <Label className="text-base font-medium mb-3 block">
                          选择角色 <span className="text-sm text-muted-foreground font-normal">（已选 {selectedCharacters.length} 个）</span>
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {work.characters.map((char) => (
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
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                      上一步
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      disabled={!isStepCompleted(2)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      下一步
                    </Button>
                  </div>
                </ModernCardContent>
              </ModernCard>
            )}

            {/* Step 3: Story Options */}
            {currentStep === 3 && (
              <ModernCard variant="elevated">
                <ModernCardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-semibold">故事设置</h2>
                    </div>
                    {isStepCompleted(3) && (
                      <EnhancedBadge variant="success" size="sm">✓ 已完成</EnhancedBadge>
                    )}
                  </div>
                </ModernCardHeader>
                <ModernCardContent className="space-y-6">
                  {/* Plot Type */}
                  <div>
                    <Label className="text-base font-medium mb-3 block">剧情类型</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'canon', label: '原著向' },
                        { value: 'modern_au', label: '现代AU' },
                        { value: 'school_au', label: '校园AU' },
                        { value: 'fantasy_au', label: '奇幻AU' },
                      ].map((type) => (
                        <Button
                          key={type.value}
                          variant={plotType === type.value ? "default" : "outline"}
                          onClick={() => setPlotType(type.value)}
                          className={cn(
                            "h-auto py-3 px-4 justify-start",
                            plotType === type.value && "bg-primary text-primary-foreground"
                          )}
                        >
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Prompt */}
                  <div>
                    <Label className="text-base font-medium mb-3 block">
                      故事提示 <span className="text-sm text-muted-foreground font-normal">（至少10字）</span>
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
                        {prompt.length} / 2000 字符
                      </span>
                      {prompt.trim().length >= 10 && (
                        <EnhancedBadge variant="success" size="sm">✓ 符合要求</EnhancedBadge>
                      )}
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(2)}>
                      上一步
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      disabled={!isStepCompleted(3)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      下一步
                    </Button>
                  </div>
                </ModernCardContent>
              </ModernCard>
            )}

            {/* Step 4: Advanced Options */}
            {currentStep === 4 && (
              <ModernCard variant="elevated">
                <ModernCardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-semibold">高级选项</h2>
                    </div>
                    <EnhancedBadge variant="info" size="sm">可选</EnhancedBadge>
                  </div>
                </ModernCardHeader>
                <ModernCardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* OOC Level */}
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

                    {/* Story Length */}
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

                  {/* Navigation Buttons */}
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(3)}>
                      上一步
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      className="bg-primary hover:bg-primary/90"
                    >
                      下一步
                    </Button>
                  </div>
                </ModernCardContent>
              </ModernCard>
            )}

            {/* Step 5: Generate */}
            {currentStep === 5 && (
              <ModernCard variant="elevated">
                <ModernCardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-semibold">生成创作</h2>
                    </div>
                    {isStepCompleted(5) && (
                      <EnhancedBadge variant="success" size="sm">✓ 已完成</EnhancedBadge>
                    )}
                  </div>
                </ModernCardHeader>
                <ModernCardContent className="space-y-6">
                  {/* Summary */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">创作概要</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">原作：</span>
                        <span className="font-medium ml-2">
                          {sourceType === 'preset'
                            ? getWorkName(getWorkById(selectedPresetWork), locale)
                            : customWorkName}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">配对：</span>
                        <span className="font-medium ml-2">
                          {selectedCharacters.map(id => {
                            const char = getCharacterById(getWorkById(selectedPresetWork), id);
                            return char ? getCharacterName(char, locale) : id;
                          }).join(' × ') || '未选择'}
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
                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className={cn(
                      "w-full h-14 text-base font-medium",
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
                        开始创作同人小说
                      </>
                    )}
                  </Button>

                  {/* Progress */}
                  {isGenerating && (
                    <ProgressBar value={0} variant="gradient" showLabel label="AI创作进度" />
                  )}

                  {/* Output */}
                  {generatedFanfic && (
                    <AnimatedContainer variant="fadeIn" className="space-y-4">
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
                      <div className="prose prose-sm max-w-none dark:prose-invert p-4 rounded-lg bg-muted/30 whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                        {generatedFanfic}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedFanfic);
                            toast.success("已复制到剪贴板");
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
                    </AnimatedContainer>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-start">
                    <Button variant="outline" onClick={() => setCurrentStep(4)}>
                      上一步
                    </Button>
                  </div>
                </ModernCardContent>
              </ModernCard>
            )}
          </AnimatedContainer>
        </div>
      </div>
    </div>
  );
}
