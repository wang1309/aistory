"use client";

import GeneratorNavTabs from "@/components/generator-nav-tabs";
import { useState, useCallback, useMemo, useRef, useEffect, ReactNode } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
import TurnstileInvisible, {
  TurnstileInvisibleHandle,
} from "@/components/TurnstileInvisible";

import { Button } from "@/components/ui/button";
import ShareResultButton from "@/components/story/share-result-button";
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
import { useRouter } from "@/i18n/navigation";
import { buildContinueRoute } from "@/components/ai-write/workbench/_lib";
import { DialogueGenerate as DialogueGenerateType } from "@/types/blocks/dialogue-generate";
import { LANGUAGE_OPTIONS } from "@/lib/language-options";
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
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const outputScrollRef = useRef<HTMLDivElement | null>(null);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("standard");
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
        <div className="mb-10">
          <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5">
            <DialogueBreadcrumb
              homeText={t("ui.breadcrumb_home")}
              currentText={t("ui.breadcrumb_current")}
            />
          </div>
        </div>

        {/* Header */}
        <div className="relative mx-auto text-center mb-14">
          {/* Ambient: speech exchange / twin voices motif */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-visible" aria-hidden>
            {/* Central twin speech bubbles with resonance arcs (gentle breathe) */}
            {!reduceMotion && (
              <motion.svg
                className="absolute left-1/2 top-1/2 h-[440px] w-[520px] -translate-x-1/2 -translate-y-1/2 text-orange-500/[0.07] dark:text-orange-400/[0.05]"
                viewBox="0 0 260 220"
                fill="none"
                aria-hidden
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: [0.65, 1, 0.65], scale: [0.99, 1, 0.99] }}
                transition={{ duration: 7, repeat: Infinity, ease: [0.32, 0.72, 0, 1] }}
              >
                {/* Resonance arcs between bubbles (sound waves) */}
                <g stroke="currentColor" strokeWidth="0.5" fill="none" strokeLinecap="round">
                  <path d="M 125 88 Q 132 110 125 132" opacity="0.5" />
                  <path d="M 117 82 Q 128 110 117 138" opacity="0.35" />
                  <path d="M 109 76 Q 124 110 109 144" opacity="0.22" />
                </g>

                {/* Left speech bubble (rotated -3deg, tail pointing right-down) */}
                <g transform="rotate(-3 68 78)">
                  <path
                    d="M 30 46 Q 30 38 38 38 L 98 38 Q 106 38 106 46 L 106 88 Q 106 96 98 96 L 64 96 L 50 110 L 54 96 L 38 96 Q 30 96 30 88 Z"
                    stroke="currentColor"
                    strokeWidth="0.7"
                    strokeLinejoin="round"
                    fill="currentColor"
                    fillOpacity="0.06"
                  />
                  <circle cx="52" cy="67" r="1.8" fill="currentColor" opacity="0.6" />
                  <circle cx="68" cy="67" r="1.8" fill="currentColor" opacity="0.6" />
                  <circle cx="84" cy="67" r="1.8" fill="currentColor" opacity="0.6" />
                </g>

                {/* Right speech bubble (rotated +3deg, tail pointing left-down) */}
                <g transform="rotate(3 192 134)">
                  <path
                    d="M 154 102 Q 154 94 162 94 L 222 94 Q 230 94 230 102 L 230 144 Q 230 152 222 152 L 196 152 L 210 166 L 182 152 L 162 152 Q 154 152 154 144 Z"
                    stroke="currentColor"
                    strokeWidth="0.7"
                    strokeLinejoin="round"
                    fill="currentColor"
                    fillOpacity="0.06"
                  />
                  <circle cx="176" cy="123" r="1.8" fill="currentColor" opacity="0.6" />
                  <circle cx="192" cy="123" r="1.8" fill="currentColor" opacity="0.6" />
                  <circle cx="208" cy="123" r="1.8" fill="currentColor" opacity="0.6" />
                </g>

                {/* Halo rings around the exchange */}
                <circle cx="130" cy="110" r="102" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1 5" opacity="0.4" />
                <circle cx="130" cy="110" r="80" stroke="currentColor" strokeWidth="0.3" strokeDasharray="0.5 3" opacity="0.3" />
              </motion.svg>
            )}

            {/* Floating quote mark glyph — left */}
            {!reduceMotion && (
              <motion.div
                className="pointer-events-none absolute z-[1] text-orange-500/40 dark:text-orange-400/40"
                style={{ left: "8%", top: "26%" }}
                initial={{ opacity: 0, y: 0, rotate: -8 }}
                animate={{ opacity: [0, 0.55, 0.55, 0], y: [0, -10, 0], rotate: [-8, -3, -8] }}
                transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              >
                <span className="block font-display text-5xl italic font-bold">&ldquo;</span>
              </motion.div>
            )}

            {/* Floating ellipsis glyph — right */}
            {!reduceMotion && (
              <motion.div
                className="pointer-events-none absolute z-[1] text-orange-500/35 dark:text-orange-400/35"
                style={{ right: "10%", top: "36%" }}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 0.5, 0.5, 0], y: [0, 8, 0] }}
                transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              >
                <span className="block font-display text-4xl font-bold tracking-[0.1em]">&hellip;</span>
              </motion.div>
            )}

            {/* Floating guillemet — right bottom */}
            {!reduceMotion && (
              <motion.div
                className="pointer-events-none absolute z-[1] text-orange-500/30 dark:text-orange-400/30"
                style={{ right: "20%", bottom: "18%" }}
                initial={{ opacity: 0, y: 0, rotate: 6 }}
                animate={{ opacity: [0, 0.45, 0.45, 0], y: [0, -7, 0], rotate: [6, 10, 6] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              >
                <span className="block font-display text-3xl italic font-bold">&laquo;</span>
              </motion.div>
            )}

            {/* Floating closing quote — left bottom */}
            {!reduceMotion && (
              <motion.div
                className="pointer-events-none absolute z-[1] text-orange-500/30 dark:text-orange-400/30"
                style={{ left: "14%", bottom: "22%" }}
                initial={{ opacity: 0, y: 0, rotate: 0 }}
                animate={{ opacity: [0, 0.4, 0.4, 0], y: [0, 6, 0], rotate: [0, -8, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              >
                <span className="block font-display text-3xl italic font-bold">&rdquo;</span>
              </motion.div>
            )}

            {/* Warm dust motes */}
            {!reduceMotion &&
              [
                { left: "12%", top: "16%", size: 4, delay: 0, dur: 10, peak: 0.22 },
                { left: "84%", top: "20%", size: 5, delay: 1.4, dur: 12, peak: 0.2 },
                { left: "22%", top: "72%", size: 4, delay: 2.8, dur: 9, peak: 0.18 },
                { left: "78%", top: "68%", size: 5, delay: 1.8, dur: 11, peak: 0.2 },
                { left: "32%", top: "10%", size: 4, delay: 3.5, dur: 8, peak: 0.16 },
                { left: "68%", top: "82%", size: 5, delay: 4.2, dur: 13, peak: 0.2 },
                { left: "8%", top: "52%", size: 4, delay: 2.2, dur: 9, peak: 0.18 },
                { left: "90%", top: "48%", size: 5, delay: 5, dur: 11, peak: 0.2 },
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

            {/* Editorial watermark: quote + ellipsis + guillemet (scattered glyphs) */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none" aria-hidden="true">
              <span className="absolute left-[6%] top-[20%] font-display italic font-bold text-2xl text-orange-500/[0.08] dark:text-orange-400/[0.08]">&ldquo;</span>
              <span className="absolute right-[7%] top-[14%] font-display font-bold text-xl text-orange-500/[0.08] dark:text-orange-400/[0.08]">&hellip;</span>
              <span className="absolute left-[10%] bottom-[16%] font-display italic font-bold text-lg text-orange-500/[0.07] dark:text-orange-400/[0.07]">&laquo;</span>
              <span className="absolute right-[9%] bottom-[18%] font-display italic font-bold text-2xl text-orange-500/[0.08] dark:text-orange-400/[0.08]">&rdquo;</span>
              <span className="absolute left-[28%] top-[8%] font-display font-bold text-base text-orange-500/[0.06] dark:text-orange-400/[0.06]">&hellip;</span>
              <span className="absolute right-[26%] bottom-[6%] font-display italic font-bold text-xl text-orange-500/[0.07] dark:text-orange-400/[0.07]">&raquo;</span>
            </div>
          </div>

          {/* Double-bezel icon container with quote hover flare */}
          <div className="group relative z-10 flex justify-center mb-6">
            <span className="pointer-events-none absolute left-[calc(50%-2.5rem)] top-0 font-display text-2xl italic font-bold text-orange-500/0 transition-all duration-500 group-hover:text-orange-500/80 dark:group-hover:text-orange-400/80 group-hover:scale-110" aria-hidden>
              &ldquo;
            </span>
            <span className="pointer-events-none absolute right-[calc(50%-2.5rem)] top-0 font-display text-2xl italic font-bold text-orange-500/0 transition-all duration-500 group-hover:text-orange-500/80 dark:group-hover:text-orange-400/80 group-hover:scale-110" aria-hidden>
              &laquo;
            </span>
            <div className="rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 dark:bg-white/[0.015]">
              <div className="flex size-12 items-center justify-center rounded-xl bg-orange-500/10">
                <Icon name="RiDoubleQuotesL" className="size-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          {/* Eyebrow badge */}
          <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-5">
            <span className="inline-block size-1.5 rounded-full bg-orange-500 opacity-60" />
            {t("ui.eyebrow")}
          </span>

          {/* Title */}
          <h1 className="relative z-10 font-display text-4xl md:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-foreground leading-[1.08] mt-4">
            <span className="group relative inline-block">
              <span
                className="pointer-events-none absolute -top-5 left-0 hidden md:block font-display text-xl italic font-bold text-orange-500/0 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:text-orange-500/60 dark:group-hover:text-orange-400/60"
                aria-hidden
              >
                &ldquo;
              </span>
              {(() => {
                const titleText = t("ui.title");
                const highlight = section?.ui?.title_highlight;
                if (!highlight || !titleText.includes(highlight)) {
                  return titleText;
                }
                const idx = titleText.indexOf(highlight);
                return (
                  <>
                    {titleText.slice(0, idx)}
                    <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text italic text-transparent dark:from-orange-400 dark:via-orange-500 dark:to-orange-300">
                      {highlight}
                    </span>
                    {titleText.slice(idx + highlight.length)}
                  </>
                );
              })()}
              <span
                className="pointer-events-none absolute -top-5 right-0 hidden md:block font-display text-xl italic font-bold text-orange-500/0 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:text-orange-500/60 dark:group-hover:text-orange-400/60"
                aria-hidden
              >
                &laquo;
              </span>
            </span>
          </h1>

          {/* Editorial decorative anchor: quote + halftone + ellipsis + halftone + guillemet */}
          <div className="relative z-10 mt-4 mb-5 flex items-center justify-center gap-3 text-orange-500/40 dark:text-orange-400/30">
            <span className="font-display text-lg italic font-bold">&ldquo;</span>
            <span className="flex h-3 items-center gap-[2px]" aria-hidden>
              <span className="size-[3px] rounded-full bg-current opacity-90" />
              <span className="size-[3px] rounded-full bg-current opacity-70" />
              <span className="size-[3px] rounded-full bg-current opacity-50" />
              <span className="size-[3px] rounded-full bg-current opacity-30" />
            </span>
            <span className="text-base leading-none font-bold tracking-[0.1em]">&hellip;</span>
            <span className="flex h-3 items-center gap-[2px]" aria-hidden>
              <span className="size-[3px] rounded-full bg-current opacity-30" />
              <span className="size-[3px] rounded-full bg-current opacity-50" />
              <span className="size-[3px] rounded-full bg-current opacity-70" />
              <span className="size-[3px] rounded-full bg-current opacity-90" />
            </span>
            <span className="font-display text-base italic font-bold">&laquo;</span>
          </div>

          <p className="relative z-10 text-base sm:text-lg text-muted-foreground/65 leading-relaxed font-light max-w-xl mx-auto">
            {t("ui.subtitle")}
          </p>

          {/* Theme pills: dialogue archetypes */}
          {section?.ui?.theme_pills?.length ? (
            <div className="relative z-10 mt-7 flex flex-wrap items-center justify-center gap-2">
              {section.ui.theme_pills.map((pill: string, i: number) => (
                <span
                  key={`${pill}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/[0.04] px-3 py-1 text-xs font-medium text-orange-700 dark:text-orange-300"
                >
                  <span className="inline-block size-1 rounded-full bg-orange-500/60" />
                  {pill}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <GeneratorNavTabs />

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
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                        <SelectItem key={lang.code} value={lang.code}>
                          <span className="mr-2">{lang.flag}</span>{lang.name}
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
                    <div className="flex items-center gap-2 flex-wrap">
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
                      <ShareResultButton
                        content={generatedDialogue}
                        prompt={prompt}
                        sourceCategory="dialogue"
                        title={prompt.substring(0, 30) + (prompt.length > 30 ? "..." : "")}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          try {
                            window.localStorage.setItem("ai-write:generator-prefill", JSON.stringify({ title: prompt.substring(0, 30), content: generatedDialogue }));
                          } catch {}
                          router.push(buildContinueRoute({ source: "dialogue-generator" }) as any);
                        }}
                        className="rounded-full bg-orange-600 px-4 text-white hover:bg-orange-500"
                      >
                        <Icon name="mdi:pencil-plus" className="w-4 h-4 mr-2" />
                        {t("ui.continue_writing")}
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
