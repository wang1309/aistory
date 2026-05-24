"use client";

import GeneratorNavTabs from "@/components/generator-nav-tabs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  ChevronDown,
  Copy,
  Eraser,
  RefreshCw,
  ScrollText,
  Settings2,
  ShieldQuestion,
  Sparkles,
  Sword,
  Wand2,
  Zap,
  Palette,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import TurnstileInvisible, { TurnstileInvisibleHandle } from "@/components/TurnstileInvisible";
import { GeneratorShortcutHints } from "@/components/generator-shortcut-hints";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
import { useGeneratorShortcuts } from "@/hooks/useGeneratorShortcuts";
import { StoryStorage } from "@/lib/story-storage";
import { cn } from "@/lib/utils";
import type { DndBackstoryGenerate as DndBackstoryGenerateType } from "@/types/blocks/dnd-backstory-generate";
import DndBackstoryBreadcrumb from "./breadcrumb";

const DND_DRAFT_KEY = "dnd-backstory-generator:prompt";

function calculateWordCount(text: string): number {
  if (!text?.trim()) return 0;
  const cjkRegex =
    /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g;
  const cjkCount = (text.match(cjkRegex) || []).length;
  const withoutCJK = text.replace(cjkRegex, " ").trim();
  const englishCount = withoutCJK ? withoutCJK.split(/\s+/).filter(Boolean).length : 0;
  return cjkCount + englishCount;
}

interface DndBackstoryGenerateProps {
  section?: DndBackstoryGenerateType;
}

type GeneratorOptions = {
  prompt: string;
  model: string;
  locale: string;
  race: string;
  characterClass: string;
  background: string;
  campaignTone: string;
  useCase: string;
  length: string;
  alignment: string;
  motivation: string;
  definingEvent: string;
  greatestFearOrFlaw: string;
  importantBond: string;
  secret: string;
  hookType: string;
  worldNotes: string;
  partyRole: string;
  deityOrPatron: string;
  rivalOrFaction: string;
  extraConstraints: string;
};

export default function DndBackstoryGenerate({ section }: DndBackstoryGenerateProps) {
  const locale = useLocale();

  const t = useCallback(
    (path: string) => {
      const keys = path.split(".");
      let value = section as any;
      for (const key of keys) {
        value = value?.[key];
      }
      return value || path;
    },
    [section]
  );

  const AI_MODELS = useMemo(
    () => [
      {
        id: "fast",
        name: t("ai_models.fast"),
        badge: "FAST",
        badgeColor:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        icon: <Zap className="h-4 w-4" />,
        description: t("ai_models.fast_description"),
      },
      {
        id: "standard",
        name: t("ai_models.standard"),
        badge: "RECOMMENDED",
        badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        icon: <Sparkles className="h-4 w-4" />,
        description: t("ai_models.standard_description"),
      },
      {
        id: "creative",
        name: t("ai_models.creative"),
        badge: "PRO",
        badgeColor:
          "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        icon: <Palette className="h-4 w-4" />,
        description: t("ai_models.creative_description"),
      },
    ],
    [t]
  );

  const LANGUAGE_OPTIONS = useMemo(
    () => [
      { code: "en", name: "English" },
      { code: "zh", name: "中文" },
      { code: "ja", name: "日本語" },
      { code: "ko", name: "한국어" },
      { code: "de", name: "Deutsch" },
      { code: "ru", name: "Русский" },
    ],
    []
  );

  const campaignTones = useMemo(() => Object.entries(section?.campaign_tones || {}), [section]);
  const useCases = useMemo(() => Object.entries(section?.use_cases || {}), [section]);
  const lengths = useMemo(() => Object.entries(section?.lengths || {}), [section]);
  const alignments = useMemo(() => Object.entries(section?.alignments || {}), [section]);
  const hookTypes = useMemo(() => Object.entries(section?.hook_types || {}), [section]);
  const raceOptions = useMemo(() => Object.entries(section?.race_options || {}), [section]);
  const classOptions = useMemo(() => Object.entries(section?.class_options || {}), [section]);
  const randomPrompts = useMemo(() => section?.random_prompts || [], [section]);

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("standard");
  const [selectedLanguage, setSelectedLanguage] = useState(locale);
  const [race, setRace] = useState("human");
  const [customRace, setCustomRace] = useState("");
  const [characterClass, setCharacterClass] = useState("fighter");
  const [customCharacterClass, setCustomCharacterClass] = useState("");
  const [background, setBackground] = useState("");
  const [campaignTone, setCampaignTone] = useState("heroic");
  const [useCase, setUseCase] = useState("player_character");
  const [length, setLength] = useState("standard");
  const [alignment, setAlignment] = useState("neutral_good");
  const [motivation, setMotivation] = useState("");
  const [definingEvent, setDefiningEvent] = useState("");
  const [greatestFearOrFlaw, setGreatestFearOrFlaw] = useState("");
  const [importantBond, setImportantBond] = useState("");
  const [secret, setSecret] = useState("");
  const [hookType, setHookType] = useState("debt");
  const [worldNotes, setWorldNotes] = useState("");
  const [partyRole, setPartyRole] = useState("");
  const [deityOrPatron, setDeityOrPatron] = useState("");
  const [rivalOrFaction, setRivalOrFaction] = useState("");
  const [extraConstraints, setExtraConstraints] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBackstory, setGeneratedBackstory] = useState("");

  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const outputScrollRef = useRef<HTMLDivElement | null>(null);

  const latestOptionsRef = useRef<GeneratorOptions>({
    prompt: "",
    model: "standard",
    locale,
    race: "",
    characterClass: "",
    background: "",
    campaignTone: "heroic",
    useCase: "player_character",
    length: "standard",
    alignment: "neutral_good",
    motivation: "",
    definingEvent: "",
    greatestFearOrFlaw: "",
    importantBond: "",
    secret: "",
    hookType: "debt",
    worldNotes: "",
    partyRole: "",
    deityOrPatron: "",
    rivalOrFaction: "",
    extraConstraints: "",
  });

  useEffect(() => {
    latestOptionsRef.current = {
      prompt,
      model: selectedModel,
      locale: selectedLanguage,
      race: race === "custom" ? customRace : race,
      characterClass: characterClass === "custom" ? customCharacterClass : characterClass,
      background,
      campaignTone,
      useCase,
      length,
      alignment,
      motivation,
      definingEvent,
      greatestFearOrFlaw,
      importantBond,
      secret,
      hookType,
      worldNotes,
      partyRole,
      deityOrPatron,
      rivalOrFaction,
      extraConstraints,
    };
  }, [
    prompt,
    selectedModel,
    selectedLanguage,
    race,
    customRace,
    characterClass,
    customCharacterClass,
    background,
    campaignTone,
    useCase,
    length,
    alignment,
    motivation,
    definingEvent,
    greatestFearOrFlaw,
    importantBond,
    secret,
    hookType,
    worldNotes,
    partyRole,
    deityOrPatron,
    rivalOrFaction,
    extraConstraints,
  ]);

  useDraftAutoSave({
    key: `${DND_DRAFT_KEY}:${locale}`,
    value: prompt,
    onRestore: (draft) => setPrompt(draft),
  });

  useEffect(() => {
    if (!isGenerating || !generatedBackstory) return;

    const container = outputScrollRef.current;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
  }, [generatedBackstory, isGenerating]);

  const handleRandomPrompt = useCallback(() => {
    if (!randomPrompts.length) return;
    const randomIndex = Math.floor(Math.random() * randomPrompts.length);
    setPrompt(randomPrompts[randomIndex]);
    toast.success(t("success.random_prompt_selected"));
    setTimeout(() => promptRef.current?.focus(), 50);
  }, [randomPrompts, t]);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) {
      toast.error(t("validation.enter_concept"));
      promptRef.current?.focus();
      return;
    }
    const finalRace = race === "custom" ? customRace.trim() : race.trim();
    const finalClass = characterClass === "custom" ? customCharacterClass.trim() : characterClass.trim();

    if (!finalRace) {
      toast.error(t("validation.enter_race"));
      return;
    }
    if (!finalClass) {
      toast.error(t("validation.enter_class"));
      return;
    }
    if (!background.trim()) {
      toast.error(t("validation.enter_background"));
      return;
    }
    if (!selectedModel) {
      toast.error(t("validation.select_model"));
      return;
    }

    setGeneratedBackstory("");
    setIsGenerating(true);
    turnstileRef.current?.execute();
  }, [background, characterClass, customCharacterClass, customRace, prompt, race, selectedModel, t]);

  const handleTurnstileSuccess = useCallback(
    async (turnstileToken: string) => {
      const opts = latestOptionsRef.current;

      try {
        const response = await fetch("/api/dnd-backstory/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: opts.prompt.trim(),
            model: opts.model,
            locale: opts.locale,
            race: opts.race.trim(),
            characterClass: opts.characterClass.trim(),
            background: opts.background.trim(),
            campaignTone: opts.campaignTone,
            useCase: opts.useCase,
            length: opts.length,
            alignment: opts.alignment,
            motivation: opts.motivation.trim() || undefined,
            definingEvent: opts.definingEvent.trim() || undefined,
            greatestFearOrFlaw: opts.greatestFearOrFlaw.trim() || undefined,
            importantBond: opts.importantBond.trim() || undefined,
            secret: opts.secret.trim() || undefined,
            hookType: opts.hookType,
            worldNotes: opts.worldNotes.trim() || undefined,
            partyRole: opts.partyRole.trim() || undefined,
            deityOrPatron: opts.deityOrPatron.trim() || undefined,
            rivalOrFaction: opts.rivalOrFaction.trim() || undefined,
            extraConstraints: opts.extraConstraints.trim() || undefined,
            turnstileToken,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let accumulatedContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.trim().startsWith('0:"')) continue;

            try {
              const content = line
                .slice(3, -1)
                .replace(/\\n/g, "\n")
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, "\\");

              accumulatedContent += content;
              setGeneratedBackstory(accumulatedContent);
            } catch (error) {
              console.error("Parse error:", error);
            }
          }
        }

        if (accumulatedContent.trim()) {
          StoryStorage.saveStory({
            title: (opts.prompt.trim() || "DnD Backstory").slice(0, 30),
            prompt: opts.prompt.trim(),
            content: accumulatedContent.trim(),
            wordCount: calculateWordCount(accumulatedContent),
            model: AI_MODELS.find((item) => item.id === opts.model)?.name || "AI",
            genre: "DnD",
          });

          toast.success(t("success.backstory_generated"));
          if (window.innerWidth < 1024) {
            setTimeout(() => {
              resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 250);
          }
        }
      } catch (error) {
        console.error("DnD backstory generation error:", error);
        toast.error(t("errors.generation_failed"));
      } finally {
        setIsGenerating(false);
      }
    },
    [AI_MODELS, t]
  );

  const handleTurnstileError = useCallback(() => {
    setIsGenerating(false);
    toast.error(t("errors.generation_failed"));
  }, [t]);

  const handleCopy = useCallback(() => {
    if (!generatedBackstory) return;
    navigator.clipboard.writeText(generatedBackstory);
    toast.success(t("success.backstory_copied"));
  }, [generatedBackstory, t]);

  useGeneratorShortcuts({
    onGenerate: handleGenerate,
    onFocusInput: () => promptRef.current?.focus(),
  });

  const wordCount = useMemo(() => calculateWordCount(generatedBackstory), [generatedBackstory]);

  return (
    <div id="dnd_backstory_generator" className="min-h-screen bg-background text-foreground selection:bg-orange-500/20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.05_65),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.18_0.04_65),transparent)]" />
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-orange-500/[0.04] via-orange-500/[0.02] to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]"
          style={{ backgroundImage: "var(--bg-grid)", backgroundSize: "40px 40px" }}
        />
      </div>

      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={handleTurnstileSuccess}
        onError={handleTurnstileError}
      />

      <main className="container max-w-7xl mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="mb-6 flex justify-start">
          <div className="inline-flex items-center rounded-full border border-border/60 bg-white/80 dark:bg-slate-900/80 px-4 py-1.5 text-xs text-muted-foreground shadow-sm">
            <DndBackstoryBreadcrumb
              homeText={t("ui.breadcrumb_home")}
              currentText={t("ui.breadcrumb_current")}
            />
          </div>
        </div>

        <div className="text-center mb-12 sm:mb-16 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
              {t("ui.title")}
            </h1>
            <p className="text-lg text-muted-foreground/80 leading-relaxed">{t("ui.subtitle")}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/10 text-[10px] font-bold tabular-nums text-orange-600 dark:text-orange-400">
                  1
                </span>
                {t("ui.hero_step_1")}
              </span>
              <span className="text-border/60">→</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/10 text-[10px] font-bold tabular-nums text-orange-600 dark:text-orange-400">
                  2
                </span>
                {t("ui.hero_step_2")}
              </span>
              <span className="text-border/60">→</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/10 text-[10px] font-bold tabular-nums text-orange-600 dark:text-orange-400">
                  3
                </span>
                {t("ui.hero_step_3")}
              </span>
            </div>
          </motion.div>
        </div>

        <GeneratorNavTabs />

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] xl:grid-cols-[440px_1fr] gap-8 lg:gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6 lg:sticky lg:top-24"
          >
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-xl shadow-black/5 dark:shadow-black/20 ring-1 ring-black/5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    {t("ui.character_concept")}
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRandomPrompt}
                    className="h-7 text-xs gap-1.5 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 px-2.5 rounded-full"
                  >
                    <Wand2 className="w-3 h-3" />
                    {t("ui.random_button")}
                  </Button>
                </div>
                <div className="relative group">
                  <Textarea
                    ref={promptRef}
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder={t("placeholders.character_concept")}
                    className="min-h-[120px] resize-none bg-white/50 dark:bg-black/20 border-border/50 focus:border-orange-500/50 focus:ring-orange-500/20 rounded-xl p-4 text-base leading-relaxed transition-all shadow-sm"
                  />
                  {prompt && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setPrompt("")}
                      className="absolute bottom-2 right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <Eraser className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="h-px bg-border/50 my-6" />

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t("ui.ai_model")}
                    </Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="h-9 bg-white/50 dark:bg-black/20 border-border/50 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_MODELS.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t("ui.output_language")}
                    </Label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="h-9 bg-white/50 dark:bg-black/20 border-border/50 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((item) => (
                          <SelectItem key={item.code} value={item.code}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("ui.race")}</Label>
                    <Select value={race} onValueChange={setRace}>
                      <SelectTrigger className="bg-white/50 dark:bg-black/20 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {raceOptions.map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {race === "custom" && (
                      <Input
                        value={customRace}
                        onChange={(event) => setCustomRace(event.target.value)}
                        placeholder={t("placeholders.race")}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ui.character_class")}</Label>
                    <Select value={characterClass} onValueChange={setCharacterClass}>
                      <SelectTrigger className="bg-white/50 dark:bg-black/20 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {classOptions.map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {characterClass === "custom" && (
                      <Input
                        value={customCharacterClass}
                        onChange={(event) => setCustomCharacterClass(event.target.value)}
                        placeholder={t("placeholders.character_class")}
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("ui.background")}</Label>
                  <Input
                    value={background}
                    onChange={(event) => setBackground(event.target.value)}
                    placeholder={t("placeholders.background")}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("ui.campaign_tone")}</Label>
                    <Select value={campaignTone} onValueChange={setCampaignTone}>
                      <SelectTrigger className="bg-white/50 dark:bg-black/20 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {campaignTones.map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ui.use_case")}</Label>
                    <Select value={useCase} onValueChange={setUseCase}>
                      <SelectTrigger className="bg-white/50 dark:bg-black/20 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {useCases.map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("ui.output_length")}</Label>
                    <Select value={length} onValueChange={setLength}>
                      <SelectTrigger className="bg-white/50 dark:bg-black/20 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {lengths.map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("ui.alignment")}</Label>
                    <Select value={alignment} onValueChange={setAlignment}>
                      <SelectTrigger className="bg-white/50 dark:bg-black/20 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {alignments.map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full flex justify-between items-center p-0 h-auto hover:bg-transparent text-xs font-medium text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Settings2 className="w-3.5 h-3.5" />
                        {t("ui.advanced_options")}
                      </span>
                      <ChevronDown
                        className={cn("w-3.5 h-3.5 transition-transform", showAdvanced && "rotate-180")}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 space-y-4 data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up overflow-hidden">
                    <div className="space-y-2">
                      <Label>{t("ui.core_motivation")}</Label>
                      <Input
                        value={motivation}
                        onChange={(event) => setMotivation(event.target.value)}
                        placeholder={t("placeholders.core_motivation")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("ui.defining_event")}</Label>
                      <Input
                        value={definingEvent}
                        onChange={(event) => setDefiningEvent(event.target.value)}
                        placeholder={t("placeholders.defining_event")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("ui.flaw_or_fear")}</Label>
                      <Input
                        value={greatestFearOrFlaw}
                        onChange={(event) => setGreatestFearOrFlaw(event.target.value)}
                        placeholder={t("placeholders.flaw_or_fear")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("ui.important_bond")}</Label>
                      <Input
                        value={importantBond}
                        onChange={(event) => setImportantBond(event.target.value)}
                        placeholder={t("placeholders.important_bond")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("ui.secret")}</Label>
                      <Input
                        value={secret}
                        onChange={(event) => setSecret(event.target.value)}
                        placeholder={t("placeholders.secret")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("ui.hook_type")}</Label>
                      <Select value={hookType} onValueChange={setHookType}>
                        <SelectTrigger className="bg-white/50 dark:bg-black/20 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {hookTypes.map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("ui.world_notes")}</Label>
                      <Input
                        value={worldNotes}
                        onChange={(event) => setWorldNotes(event.target.value)}
                        placeholder={t("placeholders.world_notes")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("ui.party_role")}</Label>
                      <Input
                        value={partyRole}
                        onChange={(event) => setPartyRole(event.target.value)}
                        placeholder={t("placeholders.party_role")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("ui.deity_patron_oath")}</Label>
                      <Input
                        value={deityOrPatron}
                        onChange={(event) => setDeityOrPatron(event.target.value)}
                        placeholder={t("placeholders.deity_patron_oath")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("ui.rival_faction")}</Label>
                      <Input
                        value={rivalOrFaction}
                        onChange={(event) => setRivalOrFaction(event.target.value)}
                        placeholder={t("placeholders.rival_faction")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("ui.extra_constraints")}</Label>
                      <Textarea
                        value={extraConstraints}
                        onChange={(event) => setExtraConstraints(event.target.value)}
                        placeholder={t("placeholders.extra_constraints")}
                        className="min-h-[90px] resize-none"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              <div className="pt-6">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full h-12 text-base bg-orange-600 font-semibold text-white shadow-md shadow-orange-600/20 hover:bg-orange-700 disabled:opacity-60 dark:bg-orange-500 dark:shadow-orange-500/20 dark:hover:bg-orange-600"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      {t("ui.generating")}
                    </>
                  ) : (
                    <>
                      <Sword className="w-5 h-5 mr-2" />
                      {t("ui.generate_button")}
                    </>
                  )}
                </Button>
                <GeneratorShortcutHints className="mt-3" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            ref={resultRef}
            className="relative h-[720px] max-h-[75vh] min-h-[520px] lg:sticky lg:top-24"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-orange-500/5 rounded-[2rem] blur-2xl -z-10" />

            <div
              className={cn(
                "h-full rounded-[2rem] border border-border backdrop-blur-xl overflow-hidden transition-all duration-500 flex flex-col",
                generatedBackstory
                  ? "bg-white/80 dark:bg-slate-950/80 shadow-2xl shadow-orange-500/10"
                  : "bg-white/40 dark:bg-slate-900/40 shadow-xl border-dashed"
              )}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-white/20 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                    <ScrollText className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{t("output.title")}</span>
                    {generatedBackstory && (
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                        {wordCount} {t("output.words")}
                      </span>
                    )}
                  </div>
                </div>
                {generatedBackstory && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {t("output.copy")}
                  </Button>
                )}
              </div>

              <div
                ref={outputScrollRef}
                className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar"
              >
                {generatedBackstory ? (
                  <div className="animate-fade-in">
                    <article className="prose prose-slate dark:prose-invert prose-lg max-w-none leading-relaxed prose-headings:font-semibold prose-p:text-slate-700 dark:prose-p:text-slate-300">
                      <ReactMarkdown>{generatedBackstory}</ReactMarkdown>
                    </article>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-60">
                    {isGenerating ? (
                      <div className="space-y-6">
                        <div className="relative mx-auto w-16 h-16">
                          <div className="absolute inset-0 rounded-full border-4 border-orange-500/20" />
                          <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin" />
                          <ShieldQuestion className="absolute inset-0 m-auto w-6 h-6 text-orange-500 animate-pulse" />
                        </div>
                        <p className="text-sm font-medium animate-pulse">{t("output.generating_message")}</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-w-xs mx-auto">
                        <div className="w-16 h-16 mx-auto bg-orange-500/5 rounded-2xl flex items-center justify-center rotate-3">
                          <ScrollText className="w-8 h-8 text-orange-400/50" />
                        </div>
                        <p className="text-muted-foreground text-sm">{t("output.empty_message")}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
