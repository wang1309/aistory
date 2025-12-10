"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Icon from "@/components/icon";
import { toast } from "sonner";
import { FantasyGenerate as FantasyGenerateType } from "@/types/blocks/fantasy-generate";
import { useLocale } from "next-intl";
import { useAppContext } from "@/contexts/app";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import TurnstileInvisible, { TurnstileInvisibleHandle } from "@/components/TurnstileInvisible";
import { Wand2, Sparkles, BookOpen, Globe, Users, Scroll } from "lucide-react";

// ========== HELPER FUNCTIONS ==========

function calculateWordCount(text: string): number {
  if (!text || !text.trim()) return 0;
  const trimmed = text.trim();
  const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/gu;
  const cjkChars = trimmed.match(cjkRegex);
  const cjkCount = cjkChars ? cjkChars.length : 0;
  const withoutCJK = trimmed.replace(cjkRegex, " ").trim();
  const englishWords = withoutCJK.split(/\s+/).filter((word) => word.length > 0);
  const englishCount = withoutCJK ? englishWords.length : 0;
  return cjkCount + englishCount;
}

// ========== COMPONENT ==========

export default function FantasyGenerate({ section }: { section: FantasyGenerateType }) {
  const locale = useLocale();
  const { user, setShowSignModal } = useAppContext();

  // Mode state
  const [mode, setMode] = useState<"quick" | "worldbuilder">("quick");
  const [currentStep, setCurrentStep] = useState(1);

  // Quick mode state
  const [prompt, setPrompt] = useState("");
  const [subgenre, setSubgenre] = useState("high_fantasy");
  const [tone, setTone] = useState("none");
  const [audience, setAudience] = useState("none");
  const [length, setLength] = useState("short");
  const [perspective, setPerspective] = useState("none");

  // Worldbuilder mode state
  const [wbSubgenre, setWbSubgenre] = useState("high_fantasy");
  const [era, setEra] = useState("medieval");
  const [worldOverview, setWorldOverview] = useState("");
  const [factions, setFactions] = useState("");
  const [magicSource, setMagicSource] = useState("innate");
  const [magicCost, setMagicCost] = useState("");
  const [magicLimitations, setMagicLimitations] = useState("");
  const [protagonistName, setProtagonistName] = useState("");
  const [protagonistRaceClass, setProtagonistRaceClass] = useState("");
  const [protagonistPersonality, setProtagonistPersonality] = useState("");
  const [protagonistBackground, setProtagonistBackground] = useState("");
  const [protagonistGoal, setProtagonistGoal] = useState("");
  const [antagonistName, setAntagonistName] = useState("");
  const [antagonistMotivation, setAntagonistMotivation] = useState("");
  const [antagonistRelationship, setAntagonistRelationship] = useState("");
  const [mainQuest, setMainQuest] = useState("");
  const [keyEvents, setKeyEvents] = useState("");
  const [twists, setTwists] = useState("");

  // AI model state
  const [selectedModel, setSelectedModel] = useState("fast");

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState("");
  const [generatedWorldview, setGeneratedWorldview] = useState("");
  const [generatedCharacters, setGeneratedCharacters] = useState("");
  const [generatedOutline, setGeneratedOutline] = useState("");
  const [activeOutputTab, setActiveOutputTab] = useState("story");

  // Refs
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Word count
  const wordCount = useMemo(() => calculateWordCount(generatedStory), [generatedStory]);

  // AI Models config
  const AI_MODELS = useMemo(
    () => [
      {
        id: "fast",
        name: section.ai_models.models.fast.name,
        badge: section.ai_models.models.fast.badge,
        badgeColor: "bg-green-500/10 text-green-600 border-green-500/30",
        icon: "⚡",
        speed: section.ai_models.models.fast.speed,
        description: section.ai_models.models.fast.description,
      },
      {
        id: "standard",
        name: section.ai_models.models.standard.name,
        badge: section.ai_models.models.standard.badge,
        badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/30",
        icon: "✒️",
        speed: section.ai_models.models.standard.speed,
        description: section.ai_models.models.standard.description,
      },
      {
        id: "creative",
        name: section.ai_models.models.creative.name,
        badge: section.ai_models.models.creative.badge,
        badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/30",
        icon: "🎨",
        speed: section.ai_models.models.creative.speed,
        description: section.ai_models.models.creative.description,
      },
    ],
    [section]
  );

  // Worldbuilder steps
  const steps = [
    { id: 1, title: section.worldbuilder_mode.steps.subgenre.title, icon: BookOpen },
    { id: 2, title: section.worldbuilder_mode.steps.setting.title, icon: Globe },
    { id: 3, title: section.worldbuilder_mode.steps.magic_system.title, icon: Sparkles },
    { id: 4, title: section.worldbuilder_mode.steps.characters.title, icon: Users },
    { id: 5, title: section.worldbuilder_mode.steps.plot.title, icon: Scroll },
  ];

  // Scroll to output when generating
  useEffect(() => {
    if (isGenerating && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isGenerating]);

  // Handle generate click
  const handleGenerateClick = useCallback(() => {
    if (mode === "quick" && !prompt.trim()) {
      toast.error(section.toasts.error_no_prompt);
      return;
    }
    if (!subgenre && mode === "quick") {
      toast.error(section.toasts.error_no_subgenre);
      return;
    }
    if (!selectedModel) {
      toast.error(section.toasts.error_no_model);
      return;
    }

    setIsGenerating(true);
    turnstileRef.current?.execute();
  }, [mode, prompt, subgenre, selectedModel, section]);

  // Perform generation
  const performGeneration = useCallback(
    async (turnstileToken: string) => {
      try {
        setGeneratedStory("");
        setGeneratedWorldview("");
        setGeneratedCharacters("");
        setGeneratedOutline("");

        const requestBody = {
          mode,
          prompt: mode === "quick" ? prompt.trim() : undefined,
          subgenre: mode === "quick" ? subgenre : wbSubgenre,
          tone: mode === "quick" ? tone : undefined,
          audience: mode === "quick" ? audience : undefined,
          length: mode === "quick" ? length : undefined,
          perspective: mode === "quick" ? perspective : undefined,
          setting:
            mode === "worldbuilder"
              ? {
                  era,
                  worldOverview,
                  factions,
                }
              : undefined,
          magicSystem:
            mode === "worldbuilder"
              ? {
                  source: magicSource,
                  cost: magicCost,
                  limitations: magicLimitations,
                }
              : undefined,
          protagonist:
            mode === "worldbuilder"
              ? {
                  name: protagonistName,
                  raceClass: protagonistRaceClass,
                  personality: protagonistPersonality,
                  background: protagonistBackground,
                  goal: protagonistGoal,
                }
              : undefined,
          antagonist:
            mode === "worldbuilder"
              ? {
                  name: antagonistName,
                  motivation: antagonistMotivation,
                  relationship: antagonistRelationship,
                }
              : undefined,
          plot:
            mode === "worldbuilder"
              ? {
                  mainQuest,
                  keyEvents,
                  twists,
                }
              : undefined,
          model: selectedModel,
          locale,
          outputLanguage: locale,
          turnstileToken,
        };

        const response = await fetch("/api/fantasy-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.message || section.toasts.error_generate_failed);
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          toast.error(section.toasts.error_no_stream);
          return;
        }

        let accumulatedText = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                const jsonStr = line.slice(2);
                const parsed = JSON.parse(jsonStr);
                if (typeof parsed === "string") {
                  accumulatedText += parsed;
                  setGeneratedStory(accumulatedText);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        if (accumulatedText.trim()) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
          toast.success(section.toasts.success_generated);
        } else {
          toast.error(section.toasts.error_no_content);
        }
      } catch (error) {
        console.error("Generation failed:", error);
        toast.error(section.toasts.error_generate_failed);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      mode,
      prompt,
      subgenre,
      wbSubgenre,
      tone,
      audience,
      length,
      perspective,
      era,
      worldOverview,
      factions,
      magicSource,
      magicCost,
      magicLimitations,
      protagonistName,
      protagonistRaceClass,
      protagonistPersonality,
      protagonistBackground,
      protagonistGoal,
      antagonistName,
      antagonistMotivation,
      antagonistRelationship,
      mainQuest,
      keyEvents,
      twists,
      selectedModel,
      locale,
      section,
    ]
  );

  const handleTurnstileSuccess = useCallback(
    (token: string) => {
      performGeneration(token);
    },
    [performGeneration]
  );

  const handleTurnstileError = useCallback(() => {
    setIsGenerating(false);
    toast.error(section.toasts.error_generate_failed);
  }, [section]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedStory);
    toast.success(section.toasts.success_copied);
  }, [generatedStory, section]);

  // ========== RENDER ==========

  return (
    <section id="fantasy_generator" className="min-h-screen relative overflow-hidden bg-background text-foreground selection:bg-emerald-500/30">
      {/* Invisible Turnstile */}
      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={handleTurnstileSuccess}
        onError={handleTurnstileError}
      />

      {/* Premium Background - Emerald/Gold Fantasy Theme */}
      <div className="absolute inset-0 -z-20 bg-noise opacity-[0.15] pointer-events-none mix-blend-overlay" />
      <div className="absolute inset-0 -z-30 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[700px] h-[700px] bg-emerald-500/20 rounded-full blur-[120px] animate-blob mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] bg-amber-500/15 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-background rounded-full blur-[150px] opacity-80" />
      </div>

      <div className="w-full max-w-6xl mx-auto px-6 py-24 sm:py-32 relative">
        {/* Header */}
        <div className="relative text-center animate-fade-in-up mb-12">
          <div className="inline-flex items-center justify-center mb-8">
            <div className="p-px bg-gradient-to-br from-emerald-500/20 to-transparent rounded-2xl">
              <div className="glass-premium rounded-2xl p-4 bg-background/50">
                <Wand2 className="size-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-8 leading-[0.9]">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 via-amber-600 to-emerald-700 dark:from-white dark:via-emerald-200 dark:to-amber-400 animate-shimmer">
              {section.header.title}
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-muted-foreground/80 max-w-2xl mx-auto font-light tracking-wide leading-relaxed">
            {section.header.subtitle}
          </p>
        </div>

        {/* Mode Tabs */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as "quick" | "worldbuilder")} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 glass-premium">
            <TabsTrigger value="quick" className="data-[state=active]:bg-emerald-500/20">
              <Sparkles className="w-4 h-4 mr-2" />
              {section.mode_tabs.quick}
            </TabsTrigger>
            <TabsTrigger value="worldbuilder" className="data-[state=active]:bg-emerald-500/20">
              <Globe className="w-4 h-4 mr-2" />
              {section.mode_tabs.worldbuilder}
            </TabsTrigger>
          </TabsList>

          {/* Quick Mode Content */}
          <TabsContent value="quick" className="mt-8">
            <div className="glass-premium rounded-3xl p-8 space-y-6">
              {/* Story Idea */}
              <div>
                <Label className="text-lg font-semibold mb-2 block">
                  {section.quick_mode.prompt.label}
                  <span className="text-destructive ml-1">{section.quick_mode.prompt.required}</span>
                </Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 2000))}
                  placeholder={section.quick_mode.prompt.placeholder}
                  className="min-h-[120px] resize-none"
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {section.quick_mode.prompt.character_counter.replace("{{count}}", prompt.length.toString())}
                </p>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Subgenre */}
                <div>
                  <Label className="mb-2 block">{section.quick_mode.subgenre.label}</Label>
                  <Select value={subgenre} onValueChange={setSubgenre}>
                    <SelectTrigger>
                      <SelectValue placeholder={section.quick_mode.subgenre.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(section.quick_mode.subgenre.options).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tone */}
                <div>
                  <Label className="mb-2 block">{section.quick_mode.tone.label}</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue placeholder={section.quick_mode.tone.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(section.quick_mode.tone.options).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Audience */}
                <div>
                  <Label className="mb-2 block">{section.quick_mode.audience.label}</Label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger>
                      <SelectValue placeholder={section.quick_mode.audience.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(section.quick_mode.audience.options).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Length */}
                <div>
                  <Label className="mb-2 block">{section.quick_mode.length.label}</Label>
                  <Select value={length} onValueChange={setLength}>
                    <SelectTrigger>
                      <SelectValue placeholder={section.quick_mode.length.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(section.quick_mode.length.options).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Perspective */}
                <div>
                  <Label className="mb-2 block">{section.quick_mode.perspective.label}</Label>
                  <Select value={perspective} onValueChange={setPerspective}>
                    <SelectTrigger>
                      <SelectValue placeholder={section.quick_mode.perspective.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(section.quick_mode.perspective.options).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Worldbuilder Mode Content */}
          <TabsContent value="worldbuilder" className="mt-8">
            {/* Step Indicator */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-2">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => setCurrentStep(step.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                        currentStep === step.id
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                          : "text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <step.icon className="w-4 h-4" />
                      <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
                    </button>
                    {index < steps.length - 1 && (
                      <div className="w-8 h-px bg-border mx-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-premium rounded-3xl p-8">
              {/* Step 1: Subgenre */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in-up">
                  <h3 className="text-xl font-semibold">{section.worldbuilder_mode.steps.subgenre.title}</h3>
                  <p className="text-muted-foreground">{section.worldbuilder_mode.steps.subgenre.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(section.worldbuilder_mode.subgenre.options).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => setWbSubgenre(key)}
                        className={cn(
                          "p-4 rounded-xl border-2 text-center transition-all hover:border-emerald-500/50",
                          wbSubgenre === key
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-border"
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Setting */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in-up">
                  <h3 className="text-xl font-semibold">{section.worldbuilder_mode.steps.setting.title}</h3>
                  <p className="text-muted-foreground">{section.worldbuilder_mode.steps.setting.description}</p>
                  
                  <div>
                    <Label className="mb-2 block">{section.worldbuilder_mode.setting.era.label}</Label>
                    <Select value={era} onValueChange={setEra}>
                      <SelectTrigger>
                        <SelectValue placeholder={section.worldbuilder_mode.setting.era.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(section.worldbuilder_mode.setting.era.options).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-2 block">{section.worldbuilder_mode.setting.world_overview.label}</Label>
                    <Textarea
                      value={worldOverview}
                      onChange={(e) => setWorldOverview(e.target.value)}
                      placeholder={section.worldbuilder_mode.setting.world_overview.placeholder}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">{section.worldbuilder_mode.setting.factions.label}</Label>
                    <Textarea
                      value={factions}
                      onChange={(e) => setFactions(e.target.value)}
                      placeholder={section.worldbuilder_mode.setting.factions.placeholder}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Magic System */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in-up">
                  <h3 className="text-xl font-semibold">{section.worldbuilder_mode.steps.magic_system.title}</h3>
                  <p className="text-muted-foreground">{section.worldbuilder_mode.steps.magic_system.description}</p>

                  <div>
                    <Label className="mb-2 block">{section.worldbuilder_mode.magic_system.source.label}</Label>
                    <Select value={magicSource} onValueChange={setMagicSource}>
                      <SelectTrigger>
                        <SelectValue placeholder={section.worldbuilder_mode.magic_system.source.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(section.worldbuilder_mode.magic_system.source.options).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-2 block">{section.worldbuilder_mode.magic_system.cost.label}</Label>
                    <Textarea
                      value={magicCost}
                      onChange={(e) => setMagicCost(e.target.value)}
                      placeholder={section.worldbuilder_mode.magic_system.cost.placeholder}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">{section.worldbuilder_mode.magic_system.limitations.label}</Label>
                    <Textarea
                      value={magicLimitations}
                      onChange={(e) => setMagicLimitations(e.target.value)}
                      placeholder={section.worldbuilder_mode.magic_system.limitations.placeholder}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Characters */}
              {currentStep === 4 && (
                <div className="space-y-8 animate-fade-in-up">
                  <h3 className="text-xl font-semibold">{section.worldbuilder_mode.steps.characters.title}</h3>
                  <p className="text-muted-foreground">{section.worldbuilder_mode.steps.characters.description}</p>

                  {/* Protagonist */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {section.worldbuilder_mode.characters.protagonist.label}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-2 block">{section.worldbuilder_mode.characters.protagonist.name.label}</Label>
                        <Input
                          value={protagonistName}
                          onChange={(e) => setProtagonistName(e.target.value)}
                          placeholder={section.worldbuilder_mode.characters.protagonist.name.placeholder}
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block">{section.worldbuilder_mode.characters.protagonist.race_class.label}</Label>
                        <Input
                          value={protagonistRaceClass}
                          onChange={(e) => setProtagonistRaceClass(e.target.value)}
                          placeholder={section.worldbuilder_mode.characters.protagonist.race_class.placeholder}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="mb-2 block">{section.worldbuilder_mode.characters.protagonist.personality.label}</Label>
                      <Input
                        value={protagonistPersonality}
                        onChange={(e) => setProtagonistPersonality(e.target.value)}
                        placeholder={section.worldbuilder_mode.characters.protagonist.personality.placeholder}
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">{section.worldbuilder_mode.characters.protagonist.background.label}</Label>
                      <Textarea
                        value={protagonistBackground}
                        onChange={(e) => setProtagonistBackground(e.target.value)}
                        placeholder={section.worldbuilder_mode.characters.protagonist.background.placeholder}
                        className="min-h-[80px]"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">{section.worldbuilder_mode.characters.protagonist.goal.label}</Label>
                      <Textarea
                        value={protagonistGoal}
                        onChange={(e) => setProtagonistGoal(e.target.value)}
                        placeholder={section.worldbuilder_mode.characters.protagonist.goal.placeholder}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>

                  {/* Antagonist */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-red-600 dark:text-red-400">
                      {section.worldbuilder_mode.characters.antagonist.label}
                    </h4>
                    <div>
                      <Label className="mb-2 block">{section.worldbuilder_mode.characters.antagonist.name.label}</Label>
                      <Input
                        value={antagonistName}
                        onChange={(e) => setAntagonistName(e.target.value)}
                        placeholder={section.worldbuilder_mode.characters.antagonist.name.placeholder}
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">{section.worldbuilder_mode.characters.antagonist.motivation.label}</Label>
                      <Textarea
                        value={antagonistMotivation}
                        onChange={(e) => setAntagonistMotivation(e.target.value)}
                        placeholder={section.worldbuilder_mode.characters.antagonist.motivation.placeholder}
                        className="min-h-[80px]"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">{section.worldbuilder_mode.characters.antagonist.relationship.label}</Label>
                      <Textarea
                        value={antagonistRelationship}
                        onChange={(e) => setAntagonistRelationship(e.target.value)}
                        placeholder={section.worldbuilder_mode.characters.antagonist.relationship.placeholder}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Plot */}
              {currentStep === 5 && (
                <div className="space-y-6 animate-fade-in-up">
                  <h3 className="text-xl font-semibold">{section.worldbuilder_mode.steps.plot.title}</h3>
                  <p className="text-muted-foreground">{section.worldbuilder_mode.steps.plot.description}</p>

                  <div>
                    <Label className="mb-2 block">{section.worldbuilder_mode.plot.main_quest.label}</Label>
                    <Textarea
                      value={mainQuest}
                      onChange={(e) => setMainQuest(e.target.value)}
                      placeholder={section.worldbuilder_mode.plot.main_quest.placeholder}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">{section.worldbuilder_mode.plot.key_events.label}</Label>
                    <Textarea
                      value={keyEvents}
                      onChange={(e) => setKeyEvents(e.target.value)}
                      placeholder={section.worldbuilder_mode.plot.key_events.placeholder}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">{section.worldbuilder_mode.plot.twists.label}</Label>
                    <Textarea
                      value={twists}
                      onChange={(e) => setTwists(e.target.value)}
                      placeholder={section.worldbuilder_mode.plot.twists.placeholder}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                  disabled={currentStep === 1}
                >
                  {section.navigation.previous}
                </Button>
                {currentStep < 5 ? (
                  <Button
                    onClick={() => setCurrentStep((s) => Math.min(5, s + 1))}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {section.navigation.next}
                  </Button>
                ) : null}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* AI Model Selection */}
        <div className="glass-premium rounded-3xl p-8 mb-8">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Icon name="mdi:brain" className="w-5 h-5" />
            {section.ai_models.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{section.ai_models.hint}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AI_MODELS.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => setSelectedModel(model.id)}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all hover:border-emerald-500/50 relative",
                  selectedModel === model.id
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-border bg-card"
                )}
              >
                <div
                  className={cn(
                    "absolute top-2 right-2 text-xs px-2 py-1 rounded-full border",
                    model.badgeColor
                  )}
                >
                  {model.badge}
                </div>
                <div className="text-2xl mb-2">{model.icon}</div>
                <div className="font-semibold mb-1">{model.name}</div>
                <div className="text-sm text-muted-foreground mb-2">{model.description}</div>
                <div className="text-xs text-muted-foreground">
                  {section.ui.speed_icon} {model.speed}
                </div>
                {selectedModel === model.id && (
                  <div className="absolute bottom-2 right-2">
                    <Icon name="mdi:check-circle" className="w-5 h-5 text-emerald-500" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="glass-premium rounded-3xl p-8 bg-gradient-to-r from-emerald-50 to-amber-50 dark:from-emerald-950/20 dark:to-amber-950/20 mb-8">
          <Button
            onClick={handleGenerateClick}
            disabled={isGenerating}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-700 hover:to-amber-700"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Icon name="mdi:loading" className="w-5 h-5 mr-2 animate-spin" />
                {section.generate_button.generating}
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                {section.generate_button.text}
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-3">{section.generate_button.tip}</p>
        </div>

        {/* Output Section */}
        {(generatedStory || isGenerating) && (
          <div ref={outputRef} className="glass-premium rounded-3xl p-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {section.output.title}
              </h3>
              {!isGenerating && (
                <div className="text-sm text-muted-foreground">
                  {section.output.word_count.replace("{{count}}", wordCount.toString())}
                </div>
              )}
            </div>

            {isGenerating && !generatedStory && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Icon name="mdi:loading" className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-500" />
                  <p className="text-muted-foreground">{section.output.loading}</p>
                </div>
              </div>
            )}

            {generatedStory && (
              <>
                <div className="prose prose-lg max-w-none dark:prose-invert mb-6 p-6 rounded-xl bg-muted/30 whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                  {generatedStory}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Icon name="mdi:content-copy" className="w-4 h-4 mr-2" />
                    {section.output.button_copy}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateClick}
                    disabled={isGenerating}
                  >
                    <Icon name="mdi:refresh" className="w-4 h-4 mr-2" />
                    {section.output.button_regenerate}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
