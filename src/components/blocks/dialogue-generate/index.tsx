"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import TurnstileInvisible, {
  TurnstileInvisibleHandle,
} from "@/components/TurnstileInvisible";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import Icon from "@/components/icon";
import DialogueBreadcrumb from "./breadcrumb";
import { DialogueGenerate as DialogueGenerateType } from "@/types/blocks/dialogue-generate";
import { DialogueCharacter } from "@/types/dialogue";

interface DialogueGenerateProps {
  section: DialogueGenerateType;
}

export default function DialogueGenerate({ section }: DialogueGenerateProps) {
  const locale = useLocale();
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const outputScrollRef = useRef<HTMLDivElement | null>(null);

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState(locale);
  const [dialogueType, setDialogueType] = useState("conversation");
  const [tone, setTone] = useState("casual");
  const [length, setLength] = useState("medium");
  const [setting, setSetting] = useState("");
  const [includeNarration, setIncludeNarration] = useState(true);
  const [characters, setCharacters] = useState<DialogueCharacter[]>([
    { name: "", personality: "", role: "" },
    { name: "", personality: "", role: "" },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDialogue, setGeneratedDialogue] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const t = useCallback(
    (key: string) => {
      const keys = key.split(".");
      let value: any = section;
      for (const k of keys) {
        value = value?.[k];
      }
      return value || key;
    },
    [section]
  );

  const AI_MODELS = useMemo(
    () => [
      {
        id: "fast",
        name: t("ai_models.fast"),
        description: t("ai_models.fast_description"),
        icon: "RiFlashlightLine",
      },
      {
        id: "standard",
        name: t("ai_models.standard"),
        description: t("ai_models.standard_description"),
        icon: "RiStarLine",
      },
      {
        id: "creative",
        name: t("ai_models.creative"),
        description: t("ai_models.creative_description"),
        icon: "RiMagicLine",
      },
    ],
    [t]
  );

  const LANGUAGE_OPTIONS = useMemo(
    () => [
      { id: "en", name: "English", flag: "🇺🇸" },
      { id: "zh", name: "中文", flag: "🇨🇳" },
      { id: "ja", name: "日本語", flag: "🇯🇵" },
      { id: "ko", name: "한국어", flag: "🇰🇷" },
      { id: "es", name: "Español", flag: "🇪🇸" },
      { id: "fr", name: "Français", flag: "🇫🇷" },
      { id: "de", name: "Deutsch", flag: "🇩🇪" },
      { id: "pt", name: "Português", flag: "🇵🇹" },
      { id: "ru", name: "Русский", flag: "🇷🇺" },
      { id: "ar", name: "العربية", flag: "🇸🇦" },
      { id: "hi", name: "हिन्दी", flag: "🇮🇳" },
      { id: "it", name: "Italiano", flag: "🇮🇹" },
    ],
    []
  );

  const DIALOGUE_TYPE_OPTIONS = useMemo(
    () => [
      { id: "conversation", name: t("dialogue_type.conversation") },
      { id: "argument", name: t("dialogue_type.argument") },
      { id: "interview", name: t("dialogue_type.interview") },
      { id: "negotiation", name: t("dialogue_type.negotiation") },
      { id: "confession", name: t("dialogue_type.confession") },
      { id: "comedy", name: t("dialogue_type.comedy") },
      { id: "dramatic", name: t("dialogue_type.dramatic") },
      { id: "philosophical", name: t("dialogue_type.philosophical") },
    ],
    [t]
  );

  const TONE_OPTIONS = useMemo(
    () => [
      { id: "casual", name: t("tone.casual") },
      { id: "formal", name: t("tone.formal") },
      { id: "emotional", name: t("tone.emotional") },
      { id: "humorous", name: t("tone.humorous") },
      { id: "tense", name: t("tone.tense") },
      { id: "romantic", name: t("tone.romantic") },
      { id: "mysterious", name: t("tone.mysterious") },
    ],
    [t]
  );

  const LENGTH_OPTIONS = useMemo(
    () => [
      { id: "short", name: t("length.short"), description: t("length.short_description") },
      { id: "medium", name: t("length.medium"), description: t("length.medium_description") },
      { id: "long", name: t("length.long"), description: t("length.long_description") },
    ],
    [t]
  );

  const handleRandomPrompt = useCallback(() => {
    const prompts = section.random_prompts || [];
    if (prompts.length > 0) {
      const randomIndex = Math.floor(Math.random() * prompts.length);
      setPrompt(prompts[randomIndex]);
      toast.success(t("success.random_prompt_selected"));
    }
  }, [section.random_prompts, t]);

  const addCharacter = useCallback(() => {
    setCharacters((prev) => [...prev, { name: "", personality: "", role: "" }]);
  }, []);

  const removeCharacter = useCallback((index: number) => {
    setCharacters((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateCharacter = useCallback(
    (index: number, field: keyof DialogueCharacter, value: string) => {
      setCharacters((prev) =>
        prev.map((char, i) => (i === index ? { ...char, [field]: value } : char))
      );
    },
    []
  );

  const performDialogueGeneration = useCallback(
    async (token: string) => {
      const validCharacters = characters.filter((c) => c.name.trim());

      setIsGenerating(true);
      setGeneratedDialogue("");

      try {
        const response = await fetch("/api/dialogue-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            turnstileToken: token,
            prompt,
            model: selectedModel,
            locale: selectedLanguage,
            characters: validCharacters,
            dialogueType,
            tone,
            length,
            setting: setting.trim() || undefined,
            includeNarration,
          }),
        });

        if (!response.ok) {
          throw new Error("Generation failed");
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No reader available");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                const content = JSON.parse(line.slice(2));
                setGeneratedDialogue((prev) => prev + content);
              } catch {
                // Skip malformed lines
              }
            }
          }
        }

        toast.success(t("success.dialogue_generated"));
      } catch (error) {
        console.error("Generation error:", error);
        toast.error(t("errors.generation_failed"));
      } finally {
        setIsGenerating(false);
      }
    },
    [
      prompt,
      selectedModel,
      selectedLanguage,
      characters,
      dialogueType,
      tone,
      length,
      setting,
      includeNarration,
      t,
    ]
  );

  const handleTurnstileSuccess = useCallback(
    (token: string) => {
      performDialogueGeneration(token);
    },
    [performDialogueGeneration]
  );

  const handleTurnstileError = useCallback(() => {
    setIsGenerating(false);
    toast.error(t("errors.generation_failed"));
  }, [t]);

  const handleGenerateClick = useCallback(() => {
    if (!prompt.trim()) {
      toast.error(t("validation.enter_scenario"));
      return;
    }
    if (!selectedModel) {
      toast.error(t("validation.select_ai_model"));
      return;
    }

    const validCharacters = characters.filter((c) => c.name.trim());
    if (validCharacters.length < 2) {
      toast.error(t("validation.add_characters"));
      return;
    }

    // Start loading state while Turnstile verification is in progress
    setIsGenerating(true);

    // Trigger invisible Turnstile verification
    // After verification succeeds, handleTurnstileSuccess will be called automatically
    turnstileRef.current?.execute();
  }, [prompt, selectedModel, characters, t]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedDialogue);
    toast.success(t("success.dialogue_copied"));
  }, [generatedDialogue, t]);

  const wordCount = useMemo(() => {
    if (!generatedDialogue) return 0;
    return generatedDialogue.split(/\s+/).filter(Boolean).length;
  }, [generatedDialogue]);

  useEffect(() => {
    if (!outputScrollRef.current) return;
    if (!generatedDialogue && !isGenerating) return;

    const el = outputScrollRef.current;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [generatedDialogue, isGenerating]);

  return (
    <section id="dialogue-generate" className="relative py-16 lg:py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.05]" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[128px] opacity-40 animate-blob" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-[100px] opacity-30" />
      </div>

      <div className="container relative px-4 md:px-6 mx-auto">
        {/* Breadcrumb */}
        <div className="mb-8">
          <DialogueBreadcrumb
            homeText={t("ui.breadcrumb_home")}
            currentText={t("ui.breadcrumb_current")}
          />
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            {t("ui.title")}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("ui.subtitle")}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left: Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="glass-premium">
              <CardContent className="p-6 space-y-6">
                {/* Scenario Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">{t("ui.scenario_prompt")}</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t("placeholders.scenario_prompt")}
                    className="min-h-[120px] resize-none"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRandomPrompt}
                    className="mt-2"
                  >
                    <Icon name="RiShuffleLine" className="w-4 h-4 mr-2" />
                    {t("ui.random_button")}
                  </Button>
                </div>

                {/* Characters */}
                <div className="space-y-3">
                  <Label>{t("ui.characters")}</Label>
                  {characters.map((char, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <Input
                          placeholder={t("placeholders.character_name")}
                          value={char.name}
                          onChange={(e) => updateCharacter(index, "name", e.target.value)}
                        />
                        <Input
                          placeholder={t("placeholders.character_personality")}
                          value={char.personality || ""}
                          onChange={(e) => updateCharacter(index, "personality", e.target.value)}
                        />
                        <Input
                          placeholder={t("placeholders.character_role")}
                          value={char.role || ""}
                          onChange={(e) => updateCharacter(index, "role", e.target.value)}
                        />
                      </div>
                      {characters.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCharacter(index)}
                          className="shrink-0"
                        >
                          <Icon name="RiDeleteBinLine" className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addCharacter}>
                    <Icon name="RiAddLine" className="w-4 h-4 mr-2" />
                    {t("ui.add_character")}
                  </Button>
                </div>

                {/* AI Model */}
                <div className="space-y-2">
                  <Label>{t("ui.ai_model")}</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {AI_MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => setSelectedModel(model.id)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedModel === model.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Icon name={model.icon} className="w-5 h-5 mb-2" />
                        <div className="font-medium text-sm">{model.name}</div>
                        <div className="text-xs text-muted-foreground">{model.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label>{t("ui.output_language")}</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <SelectItem key={lang.id} value={lang.id}>
                          {lang.flag} {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Advanced Options */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between">
                      {t("ui.advanced_options")}
                      <Icon
                        name={showAdvanced ? "RiArrowUpSLine" : "RiArrowDownSLine"}
                        className="w-4 h-4"
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    {/* Dialogue Type */}
                    <div className="space-y-2">
                      <Label>{t("ui.dialogue_type")}</Label>
                      <Select value={dialogueType} onValueChange={setDialogueType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIALOGUE_TYPE_OPTIONS.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tone */}
                    <div className="space-y-2">
                      <Label>{t("ui.tone")}</Label>
                      <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TONE_OPTIONS.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Length */}
                    <div className="space-y-2">
                      <Label>{t("ui.output_length")}</Label>
                      <Select value={length} onValueChange={setLength}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LENGTH_OPTIONS.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.name} - {l.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Setting */}
                    <div className="space-y-2">
                      <Label>{t("ui.setting")}</Label>
                      <Input
                        value={setting}
                        onChange={(e) => setSetting(e.target.value)}
                        placeholder={t("placeholders.setting")}
                      />
                    </div>

                    {/* Include Narration */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="narration"
                        checked={includeNarration}
                        onCheckedChange={(checked) => setIncludeNarration(checked as boolean)}
                      />
                      <Label htmlFor="narration">{t("ui.include_narration")}</Label>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerateClick}
                  disabled={isGenerating}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Icon name="RiLoader4Line" className="w-5 h-5 mr-2 animate-spin" />
                      {t("ui.generating")}
                    </>
                  ) : (
                    <>
                      <Icon name="RiChat3Line" className="w-5 h-5 mr-2" />
                      {t("ui.generate_button")}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right: Output */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="glass-premium h-full">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{t("output.title")}</h2>
                  {generatedDialogue && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {wordCount} {t("output.words")}
                      </span>
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        <Icon name="RiFileCopyLine" className="w-4 h-4 mr-2" />
                        {t("output.copy")}
                      </Button>
                    </div>
                  )}
                </div>

                <div
                  ref={outputScrollRef}
                  className="h-[520px] lg:h-[640px] rounded-lg bg-muted/30 p-4 overflow-y-auto"
                >
                  {generatedDialogue ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          a: ({ children, ...props }) => (
                            <a {...props} target="_blank" rel="noopener noreferrer">
                              {children}
                            </a>
                          ),
                          p: ({ children, ...props }) => {
                            const className = [
                              (props as any)?.className,
                              "whitespace-pre-wrap",
                            ]
                              .filter(Boolean)
                              .join(" ");
                            return (
                              <p {...props} className={className}>
                                {children}
                              </p>
                            );
                          },
                          li: ({ children, ...props }) => {
                            const className = [
                              (props as any)?.className,
                              "whitespace-pre-wrap",
                            ]
                              .filter(Boolean)
                              .join(" ");
                            return (
                              <li {...props} className={className}>
                                {children}
                              </li>
                            );
                          },
                        }}
                      >
                        {generatedDialogue}
                      </ReactMarkdown>
                      {isGenerating && (
                        <span className="inline-block w-2 h-4 ml-1 bg-primary/80 animate-pulse align-baseline" />
                      )}
                    </div>
                  ) : isGenerating ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Icon
                          name="RiLoader4Line"
                          className="w-8 h-8 mx-auto mb-2 animate-spin text-primary"
                        />
                        <p className="text-muted-foreground">{t("output.generating_message")}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <Icon name="RiChat3Line" className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>{t("output.empty_message")}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={handleTurnstileSuccess}
        onError={handleTurnstileError}
      />
    </section>
  );
}
