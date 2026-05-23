"use client";

import { useState, useCallback, useMemo, useRef, useEffect, ReactNode } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
import TurnstileInvisible, {
  TurnstileInvisibleHandle,
} from "@/components/TurnstileInvisible";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface PromptHistoryItem {
  id: string;
  value: string;
  createdAt: string;
}

const DIALOGUE_PROMPT_DRAFT_KEY = "dialogue-generate:prompt-draft";
const DIALOGUE_PROMPT_HISTORY_KEY = "dialogue-generate:prompt-history";
const MAX_PROMPT_HISTORY_ITEMS = 10;

function RequiredLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      <span className="text-red-500 ml-1">*</span>
    </Label>
  );
}

export default function DialogueGenerate({ section }: DialogueGenerateProps) {
  const locale = useLocale();
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const outputScrollRef = useRef<HTMLDivElement | null>(null);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("fast");
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

  const [promptHistoryOpen, setPromptHistoryOpen] = useState(false);
  const [promptHistory, setPromptHistory] = useState<PromptHistoryItem[]>([]);
  const [promptHistoryCount, setPromptHistoryCount] = useState(0);

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

  const restorePromptDraft = useCallback((draft: string) => {
    setPrompt(draft);
  }, []);

  useDraftAutoSave({
    key: DIALOGUE_PROMPT_DRAFT_KEY,
    value: prompt,
    onRestore: restorePromptDraft,
  });

  const getPromptHistory = useCallback((): PromptHistoryItem[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(DIALOGUE_PROMPT_HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((item: any) => ({
          id: typeof item?.id === "string" ? item.id : "",
          value: typeof item?.value === "string" ? item.value : "",
          createdAt: typeof item?.createdAt === "string" ? item.createdAt : "",
        }))
        .filter((item: PromptHistoryItem) => item.id && item.value.trim());
    } catch {
      return [];
    }
  }, []);

  const setPromptHistoryStorage = useCallback((items: PromptHistoryItem[]) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(DIALOGUE_PROMPT_HISTORY_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, []);

  const refreshPromptHistoryCount = useCallback(() => {
    const items = getPromptHistory();
    setPromptHistoryCount(items.length);
  }, [getPromptHistory]);

  useEffect(() => {
    refreshPromptHistoryCount();
  }, [refreshPromptHistoryCount]);

  useEffect(() => {
    if (!promptHistoryOpen) return;
    const items = getPromptHistory();
    setPromptHistory(items);
  }, [promptHistoryOpen, getPromptHistory]);

  const savePromptToHistory = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      if (typeof window === "undefined") return;

      const existing = getPromptHistory();
      const deduped = existing.filter((x) => x.value.trim() !== trimmed);

      const newItem: PromptHistoryItem = {
        id: `dlg_prompt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        value: value,
        createdAt: new Date().toISOString(),
      };

      const next = [newItem, ...deduped].slice(0, MAX_PROMPT_HISTORY_ITEMS);
      setPromptHistoryStorage(next);
      setPromptHistoryCount(next.length);
      if (promptHistoryOpen) {
        setPromptHistory(next);
      }
    },
    [getPromptHistory, promptHistoryOpen, setPromptHistoryStorage]
  );

  const clearPromptHistory = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(DIALOGUE_PROMPT_HISTORY_KEY);
    } catch {
      // ignore
    }
    setPromptHistory([]);
    setPromptHistoryCount(0);
  }, []);

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

    savePromptToHistory(prompt);

    // Start loading state while Turnstile verification is in progress
    setIsGenerating(true);

    // Trigger invisible Turnstile verification
    // After verification succeeds, handleTurnstileSuccess will be called automatically
    turnstileRef.current?.execute();
  }, [prompt, selectedModel, characters, t, savePromptToHistory]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedDialogue);
    toast.success(t("success.dialogue_copied"));
  }, [generatedDialogue, t]);

  const downloadTextFile = useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, []);

  const markdownToPlainText = useCallback((md: string) => {
    return (
      md
        // normalize line endings
        .replace(/\r\n/g, "\n")
        // code fences
        .replace(/```[\s\S]*?```/g, (block) => {
          const inner = block.replace(/^```[a-zA-Z0-9_-]*\n?/, "").replace(/```\s*$/, "");
          return inner;
        })
        // inline code
        .replace(/`([^`]+)`/g, "$1")
        // images ![alt](url) -> alt (url)
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1 ($2)")
        // links [text](url) -> text (url)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
        // headings
        .replace(/^\s{0,3}#{1,6}\s+/gm, "")
        // blockquotes
        .replace(/^\s{0,3}>\s?/gm, "")
        // bold/italic
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/__([^_]+)__/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/_([^_]+)_/g, "$1")
        // horizontal rules
        .replace(/^\s{0,3}(-{3,}|\*{3,}|_{3,})\s*$/gm, "")
        // list markers
        .replace(/^\s{0,3}([-*+]\s+)/gm, "")
        .replace(/^\s{0,3}(\d+\.)\s+/gm, "")
        // collapse excessive blank lines
        .replace(/\n{3,}/g, "\n\n")
        .trim()
    );
  }, []);

  const handleExportMd = useCallback(() => {
    if (!generatedDialogue) return;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadTextFile(generatedDialogue, `dialogue-${timestamp}.md`, "text/markdown;charset=utf-8");
  }, [downloadTextFile, generatedDialogue]);

  const handleExportTxt = useCallback(() => {
    if (!generatedDialogue) return;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const plain = markdownToPlainText(generatedDialogue);
    downloadTextFile(plain, `dialogue-${timestamp}.txt`, "text/plain;charset=utf-8");
  }, [downloadTextFile, generatedDialogue, markdownToPlainText]);

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
    <section id="dialogue-generate" className="py-16 lg:py-24 overflow-hidden">
      {/* Subtle warm top glow + dot texture */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.05_65),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.18_0.04_65),transparent)]" />
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-orange-500/[0.04] via-orange-500/[0.02] to-transparent" />
        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]" style={{ backgroundImage: 'var(--bg-grid)', backgroundSize: '40px 40px' }} />
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
                  <RequiredLabel htmlFor="prompt">{t("ui.scenario_prompt")}</RequiredLabel>
                  <div className="relative">
                    <Textarea
                      ref={promptRef}
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={t("placeholders.scenario_prompt")}
                      className="min-h-[120px] resize-none pr-10 pb-10"
                    />
                    {prompt.trim() && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-2 right-2 h-8 w-8"
                        aria-label={t("ui.clear_prompt")}
                        onClick={() => {
                          setPrompt("");
                          requestAnimationFrame(() => {
                            promptRef.current?.focus();
                          });
                        }}
                      >
                        <Icon name="RiEraserLine" className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleRandomPrompt}>
                      <Icon name="RiShuffleLine" className="w-4 h-4 mr-2" />
                      {t("ui.random_button")}
                    </Button>
                    <DropdownMenu open={promptHistoryOpen} onOpenChange={setPromptHistoryOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Icon name="RiHistoryLine" className="w-4 h-4" />
                          {t("ui.prompt_history")}
                          {promptHistoryCount > 0 && (
                            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                              {promptHistoryCount}
                            </span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[360px] max-w-[90vw]">
                        <DropdownMenuLabel className="flex items-center justify-between">
                          <span>{t("ui.prompt_history_recent")}</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            {promptHistoryCount} / {MAX_PROMPT_HISTORY_ITEMS}
                          </span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {promptHistory.length === 0 ? (
                          <div className="p-4 text-sm text-muted-foreground">
                            {t("ui.prompt_history_empty")}
                          </div>
                        ) : (
                          <div className="max-h-[320px] overflow-y-auto">
                            {promptHistory.map((item) => {
                              const preview = (item.value.split("\n").find((l) => l.trim()) || item.value)
                                .trim()
                                .slice(0, 80);
                              return (
                                <DropdownMenuItem
                                  key={item.id}
                                  className="cursor-pointer flex-col items-start gap-1 py-2"
                                  onClick={() => {
                                    setPrompt(item.value);
                                    setPromptHistoryOpen(false);
                                    requestAnimationFrame(() => {
                                      promptRef.current?.focus();
                                    });
                                  }}
                                >
                                  <div className="w-full text-sm font-medium truncate">{preview}</div>
                                </DropdownMenuItem>
                              );
                            })}
                          </div>
                        )}
                        {promptHistoryCount > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={clearPromptHistory}>
                              {t("ui.prompt_history_clear")}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Characters */}
                <div className="space-y-3">
                  <RequiredLabel>{t("ui.characters")}</RequiredLabel>
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
                  <RequiredLabel>{t("ui.ai_model")}</RequiredLabel>
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
                  className="w-full h-12 text-lg font-semibold bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white shadow-md shadow-orange-600/20 dark:bg-orange-500 dark:shadow-orange-500/20 dark:hover:bg-orange-600"
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!generatedDialogue || isGenerating}
                          >
                            <Icon name="RiDownloadLine" className="w-4 h-4 mr-2" />
                            {t("output.export")}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={handleExportMd}
                            disabled={!generatedDialogue || isGenerating}
                          >
                            {t("output.export_md")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={handleExportTxt}
                            disabled={!generatedDialogue || isGenerating}
                          >
                            {t("output.export_txt")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                      >
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
