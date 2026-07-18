"use client";

import GeneratorNavTabs from "@/components/generator-nav-tabs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  AlignLeft,
  BookOpen,
  ChevronDown,
  Copy,
  Download,
  Eraser,
  FileCode,
  FileText,
  FileType,
  Loader2,
  Palette,
  RefreshCw,
  ScrollText,
  Settings2,
  ShieldQuestion,
  Sparkles,
  Sword,
  Wand2,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import ShareResultButton from "@/components/story/share-result-button";
import CompletionGuide from "@/components/story/completion-guide";
import StorySaveDialog from "@/components/story/story-save-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TurnstileInvisible, { TurnstileInvisibleHandle } from "@/components/TurnstileInvisible";
import { GeneratorShortcutHints } from "@/components/generator-shortcut-hints";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
import { useGeneratorShortcuts } from "@/hooks/useGeneratorShortcuts";
import { StoryStorage } from "@/lib/story-storage";
import { LANGUAGE_OPTIONS } from "@/lib/language-options";
import { cn } from "@/lib/utils";
import type { StoryStatus } from "@/models/story";
import type { DndBackstoryGenerate as DndBackstoryGenerateType } from "@/types/blocks/dnd-backstory-generate";
import type { StoryMetadata } from "@/lib/pdf-export";
import DndBackstoryBreadcrumb from "./breadcrumb";
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
import { useAppContext } from "@/contexts/app";
import { useOpenPanel } from "@openpanel/nextjs";
import { ACTIVATION_EVENTS, buildActivationTrackingPayload } from "@/lib/activation-funnel";
import { useCreativeQuotaPage } from "@/hooks/useCreativeQuotaPage";
import { CreativeQuotaHint } from "@/components/blocks/creative-quota-hint";
import { CreativeQuotaPaywall } from "@/components/blocks/creative-quota-paywall";
import {
  buildPostAuthResumeTrackingPayload,
  consumePendingAuthResume,
  writePendingAuthResume,
} from "@/lib/auth-resume";

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

function downloadTextFile(text: string, filename: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { user, requireAuth, setSignModalContext } = useAppContext();
  const { track } = useOpenPanel();
  const creativeQuota = useCreativeQuotaPage("dnd-backstory-generator");

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
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        icon: <Palette className="h-4 w-4" />,
        description: t("ai_models.creative_description"),
      },
    ],
    [t]
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
  const [isSavingStory, setIsSavingStory] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
    if (!user) return;

    const resume = consumePendingAuthResume("save_story", {
      sourcePage: "dnd-backstory-generator",
    });
    if (!resume) return;

    const payload = resume.payload;
    const resumedContent =
      typeof payload.generatedBackstory === "string" ? payload.generatedBackstory : "";
    if (!resumedContent.trim()) return;

    if (typeof payload.prompt === "string") setPrompt(payload.prompt);
    setGeneratedBackstory(resumedContent);
    if (typeof payload.selectedModel === "string") setSelectedModel(payload.selectedModel);
    if (typeof payload.selectedLanguage === "string") setSelectedLanguage(payload.selectedLanguage);

    setIsSaveDialogOpen(true);
    track("post_auth_action_resumed", buildPostAuthResumeTrackingPayload(resume));
  }, [track, user]);

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
    const randomSeed = randomPrompts[randomIndex];
    setPrompt(randomSeed);
    setBackground(randomSeed);
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

    if (
      creativeQuota.guardAnonymousCreativeQuota({
        selectedModel,
        message: t("toasts.creative_limit_reached"),
      })
    ) {
      return;
    }

    setGeneratedBackstory("");
    setIsGenerating(true);

    track(
      ACTIVATION_EVENTS.generationStarted,
      buildActivationTrackingPayload({
        sourcePage: "dnd-backstory-generator",
        loggedIn: !!user,
        action: "generation_started",
        model: selectedModel,
      })
    );

    turnstileRef.current?.execute();
  }, [background, characterClass, creativeQuota, customCharacterClass, customRace, prompt, race, selectedModel, t, track, user]);

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
          if (creativeQuota.handleQuotaError(response.status, errorData)) return;
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
          if (opts.model === "creative") creativeQuota.increment();
          track(
            ACTIVATION_EVENTS.generationSucceeded,
            buildActivationTrackingPayload({
              sourcePage: "dnd-backstory-generator",
              loggedIn: !!user,
              action: "generation_succeeded",
              model: opts.model,
              wordCount: calculateWordCount(accumulatedContent),
            })
          );
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
        track(
          ACTIVATION_EVENTS.generationFailed,
          buildActivationTrackingPayload({
            sourcePage: "dnd-backstory-generator",
            loggedIn: !!user,
            action: "generation_failed",
            model: opts.model,
          })
        );
        toast.error(t("errors.generation_failed"));
      } finally {
        setIsGenerating(false);
      }
    },
    [AI_MODELS, creativeQuota, t, track, user]
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

  const wordCount = useMemo(() => calculateWordCount(generatedBackstory), [generatedBackstory]);

  const handleExport = useCallback(
    async (format: "pdf" | "docx" | "epub" | "markdown" | "txt") => {
      const content = generatedBackstory.trim();
      if (!content) {
        toast.error(t("errors.no_content_to_export"));
        return;
      }

      setIsExporting(true);

      try {
        const rawTitle = prompt.trim() || t("output.title");
        const safeTitle =
          rawTitle.replace(/[^\w一-鿿]/g, "_").slice(0, 30) || "DnD_Backstory";
        const modelName =
          AI_MODELS.find((item) => item.id === selectedModel)?.name || "";

        if (format === "markdown") {
          downloadTextFile(content, `${safeTitle}.md`, "text/markdown;charset=utf-8");
        } else if (format === "txt") {
          downloadTextFile(content, `${safeTitle}.txt`, "text/plain;charset=utf-8");
        } else if (format === "pdf") {
          const metadata: StoryMetadata = {
            title: rawTitle,
            prompt:
              prompt.trim().slice(0, 200) + (prompt.length > 200 ? "..." : ""),
            wordCount,
            generatedAt: new Date(),
            model: modelName,
            tone: campaignTones.find(([key]) => key === campaignTone)?.[1],
          };
          const pdfTranslations = {
            generated_at: t("pdf.generated_at"),
            word_count_label: t("pdf.word_count_label"),
            ai_model: t("pdf.ai_model"),
            story_format: t("pdf.story_format"),
            story_genre: t("pdf.story_genre"),
            story_tone: t("pdf.story_tone"),
            prompt: t("pdf.prompt"),
            footer_text: t("pdf.footer_text"),
            page_indicator: t("pdf.page_indicator"),
          };
          const { exportStoryToPdf } = await import("@/lib/pdf-export");
          await exportStoryToPdf(content, metadata, locale, pdfTranslations);
        } else {
          // docx / epub need HTML — render the markdown source first
          const MarkdownIt = (await import("markdown-it")).default;
          const md = new MarkdownIt({ html: false, breaks: true, linkify: true });
          const html = md.render(content);

          if (format === "docx") {
            const { exportToDocx } = await import("@/lib/docx-export");
            await exportToDocx({ title: rawTitle, html });
          } else {
            const { exportToEpub } = await import("@/lib/epub-export");
            await exportToEpub({ title: rawTitle, html, locale });
          }
        }

        toast.success(t("success.backstory_exported"));
      } catch (error) {
        console.error("Export failed:", error);
        toast.error(t("errors.export_failed"));
      } finally {
        setIsExporting(false);
      }
    },
    [
      AI_MODELS,
      campaignTone,
      campaignTones,
      generatedBackstory,
      locale,
      prompt,
      selectedModel,
      t,
      wordCount,
    ]
  );

  const handleSaveClick = useCallback(() => {
    const content = generatedBackstory.trim();
    if (!content) {
      if (locale === "zh") {
        toast.error("当前没有可保存的内容，请先生成一个 DnD 背景故事。");
      } else {
        toast.error("No DnD backstory to save yet. Please generate one first.");
      }
      return;
    }

    try {
      const rawTitle = prompt.trim() || (locale === "zh" ? "未命名 DnD 背景" : "Untitled DnD Backstory");
      const title = rawTitle.length > 30 ? `${rawTitle.slice(0, 30)}...` : rawTitle;
      const modelName = AI_MODELS.find((item) => item.id === selectedModel)?.name || "AI";

      StoryStorage.saveStory({
        title,
        prompt: prompt.trim(),
        content,
        wordCount,
        model: modelName,
        genre: "DnD",
      });
    } catch (error) {
      console.error("Failed to save DnD backstory locally:", error);
    }

    if (!user) {
      writePendingAuthResume({
        source: "story_save",
        action: "save_story",
        sourcePage: "dnd-backstory-generator",
        startedAt: Date.now(),
        payload: {
          prompt,
          generatedBackstory,
          selectedModel,
          selectedLanguage,
        },
      });

      if (locale === "zh") {
        toast.error("已在本地“我的故事”中保存，登录后可以同步到云端。");
      } else {
        toast.error("Saved locally. Sign in to save this backstory to your account.");
      }

      requireAuth({
        source: "story_save",
        action: "save_story",
        sourcePage: "dnd-backstory-generator",
      });
      return;
    }

    setIsSaveDialogOpen(true);
    track(
      ACTIVATION_EVENTS.saveDialogOpen,
      buildActivationTrackingPayload({
        sourcePage: "dnd-backstory-generator",
        loggedIn: !!user,
        action: "save_dialog_open",
        model: selectedModel,
        wordCount,
      })
    );
  }, [
    AI_MODELS,
    generatedBackstory,
    locale,
    prompt,
    requireAuth,
    selectedLanguage,
    selectedModel,
    track,
    user,
    wordCount,
  ]);

  const handleConfirmSave = useCallback(
    async (status: StoryStatus) => {
      const content = generatedBackstory.trim();
      if (!content) {
        if (locale === "zh") {
          toast.error("当前没有可保存的内容，请先生成一个 DnD 背景故事。");
        } else {
          toast.error("No DnD backstory to save yet. Please generate one first.");
        }
        return;
      }

      try {
        setIsSavingStory(true);

        const opts = latestOptionsRef.current;
        const settings: Record<string, unknown> = {
          locale,
          outputLanguage: opts.locale,
          race: opts.race,
          characterClass: opts.characterClass,
          background: opts.background,
          campaignTone: opts.campaignTone,
          useCase: opts.useCase,
          length: opts.length,
          alignment: opts.alignment,
        };

        if (opts.motivation) settings.motivation = opts.motivation;
        if (opts.definingEvent) settings.definingEvent = opts.definingEvent;
        if (opts.greatestFearOrFlaw) settings.greatestFearOrFlaw = opts.greatestFearOrFlaw;
        if (opts.importantBond) settings.importantBond = opts.importantBond;
        if (opts.secret) settings.secret = opts.secret;
        if (opts.hookType) settings.hookType = opts.hookType;
        if (opts.worldNotes) settings.worldNotes = opts.worldNotes;
        if (opts.partyRole) settings.partyRole = opts.partyRole;
        if (opts.deityOrPatron) settings.deityOrPatron = opts.deityOrPatron;
        if (opts.rivalOrFaction) settings.rivalOrFaction = opts.rivalOrFaction;
        if (opts.extraConstraints) settings.extraConstraints = opts.extraConstraints;

        const rawTitle = prompt.trim() || (locale === "zh" ? "未命名 DnD 背景" : "Untitled DnD Backstory");
        const title = rawTitle.length > 30 ? `${rawTitle.slice(0, 30)}...` : rawTitle;

        const modelMap: Record<string, string> = {
          fast: "gemini-2.5-flash",
          standard: "gemini-3.1-flash-lite",
          creative: "gemini-3-flash",
        };
        const actualModel = modelMap[selectedModel || "standard"] || "gemini-3.1-flash-lite";

        const resp = await fetch("/api/stories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            prompt: prompt.trim(),
            content,
            wordCount,
            modelUsed: actualModel,
            settings,
            status,
            visibility: status === "published" ? "public" : "private",
            sourceCategory: "backstory",
          }),
        });

        if (!resp.ok) {
          throw new Error("request failed with status: " + resp.status);
        }

        const { code, message } = await resp.json();

        if (code !== 0) {
          if (message === "no auth") {
            requireAuth({
              source: "story_save",
              action: "save_story",
              sourcePage: "dnd-backstory-generator",
            });
          }

          if (locale === "zh") {
            toast.error(message === "no auth" ? "请先登录后再保存故事" : `保存失败：${message}`);
          } else {
            toast.error(message || "Failed to save story");
          }
          return;
        }

        if (locale === "zh") {
          toast.success(status === "published" ? "故事已发布" : "故事已保存");
        } else {
          toast.success(status === "published" ? "Story published" : "Story saved");
        }

        track(
          ACTIVATION_EVENTS.storySaved,
          buildActivationTrackingPayload({
            sourcePage: "dnd-backstory-generator",
            loggedIn: true,
            action: "story_saved",
            model: selectedModel,
            wordCount,
          })
        );
        track(ACTIVATION_EVENTS.activationCompleted, {
          source_page: "dnd-backstory-generator",
          action: "story_saved",
        });

        setIsSaveDialogOpen(false);
      } catch (error) {
        console.error("Save DnD backstory failed", error);
        if (locale === "zh") {
          toast.error("保存失败，请稍后再试");
        } else {
          toast.error("Failed to save story, please try again.");
        }
      } finally {
        setIsSavingStory(false);
      }
    },
    [generatedBackstory, locale, prompt, requireAuth, selectedModel, track, wordCount]
  );

  const handleContinueInAiWrite = useCallback(() => {
    if (!generatedBackstory.trim()) {
      return;
    }

    track(
      "continue_ai_write_cta_click",
      buildContinueTrackingPayload({
        source_page: "dnd-backstory-generator",
        logged_in: !!user,
        cta_variant: user ? "continue_ai_write" : "sign_in_to_continue_ai_write",
      })
    );

    const payload = buildContinueIntentPayload({
      source: "dnd-backstory-generator",
      title: prompt,
      content: generatedBackstory,
    });

    if (
      shouldGateAnonymousContinue({
        hasUser: !!user,
        hasGeneratedContent: !!generatedBackstory.trim(),
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
          source_page: "dnd-backstory-generator",
        })
      );
      setSignModalContext({
        mode: "continue-ai-write",
        source: payload.source,
        redirectTo: payload.redirectTo,
      });
      requireAuth({ source: "ai_write", action: "continue_writing", sourcePage: "dnd-backstory-generator" });
      return;
    }

    try {
      window.localStorage.setItem(GENERATOR_PREFILL_KEY, JSON.stringify(payload.prefill));
    } catch {
      // ignore prefill cache failures
    }

    router.push(payload.redirectTo as any);
  }, [generatedBackstory, prompt, router, user, track, setSignModalContext, requireAuth]);

  const handleCreateAnother = useCallback(() => {
    setGeneratedBackstory("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useGeneratorShortcuts({
    onGenerate: handleGenerate,
    onFocusInput: () => promptRef.current?.focus(),
    onQuickSave: handleSaveClick,
  });

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

      <main className="container max-w-7xl mx-auto px-4 py-16 sm:py-20 lg:py-24">
        <div className="mb-10 flex justify-start">
          <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
            <DndBackstoryBreadcrumb
              homeText={t("ui.breadcrumb_home")}
              currentText={t("ui.breadcrumb_current")}
            />
          </div>
        </div>

        <div className="relative mx-auto max-w-2xl text-center mb-14 sm:mb-18">
          {/* Ambient arcane particle layer (slow drifting motes) */}
          {!reduceMotion && (
            <div className="pointer-events-none absolute inset-0 overflow-visible z-0" aria-hidden="true">
              {[
                { left: "8%", top: "18%", size: 4, delay: 0, dur: 9, peak: 0.18 },
                { left: "90%", top: "12%", size: 6, delay: 1.5, dur: 11, peak: 0.22 },
                { left: "14%", top: "72%", size: 5, delay: 3, dur: 10, peak: 0.16 },
                { left: "85%", top: "68%", size: 7, delay: 2, dur: 12, peak: 0.2 },
                { left: "32%", top: "22%", size: 4, delay: 4, dur: 8, peak: 0.14 },
                { left: "68%", top: "82%", size: 6, delay: 5, dur: 11, peak: 0.18 },
                { left: "22%", top: "50%", size: 5, delay: 6, dur: 13, peak: 0.2 },
                { left: "78%", top: "38%", size: 4, delay: 1, dur: 9, peak: 0.16 },
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

          {/* Floating D20 dice accents (left & right) */}
          {!reduceMotion && (
            <>
              <motion.div
                className="pointer-events-none absolute z-[1] text-orange-500/45 dark:text-orange-400/45"
                style={{ left: "3%", top: "52%" }}
                initial={{ opacity: 0, y: 0, rotate: -10 }}
                animate={{ opacity: [0, 0.55, 0.55, 0], y: [0, -8, 0], rotate: [-10, -4, -10] }}
                transition={{ duration: 7, delay: 1, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              >
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                  <path d="M20 2 L20 13 M4 11 L13 17 M36 11 L27 17 M20 38 L13 17 M20 38 L27 17 M13 17 L27 17" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
                  <text x="20" y="25" fontSize="9" fontWeight="700" fill="currentColor" textAnchor="middle" fontStyle="italic">20</text>
                </svg>
              </motion.div>
              <motion.div
                className="pointer-events-none absolute z-[1] text-amber-500/45 dark:text-amber-400/45"
                style={{ right: "5%", top: "44%" }}
                initial={{ opacity: 0, y: 0, rotate: 12 }}
                animate={{ opacity: [0, 0.5, 0.5, 0], y: [0, -6, 0], rotate: [12, 5, 12] }}
                transition={{ duration: 8, delay: 2.5, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              >
                <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                  <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                  <path d="M20 2 L20 13 M4 11 L13 17 M36 11 L27 17 M20 38 L13 17 M20 38 L27 17 M13 17 L27 17" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
                  <text x="20" y="25" fontSize="9" fontWeight="700" fill="currentColor" textAnchor="middle" fontStyle="italic">d20</text>
                </svg>
              </motion.div>
            </>
          )}

          {/* Slowly rotating arcane rune ring */}
          {!reduceMotion && (
            <motion.div
              className="pointer-events-none absolute z-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500/30 dark:text-orange-400/30"
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: [0, 0.55, 0.4], rotate: 360 }}
              transition={{ opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 60, repeat: Infinity, ease: "linear" } }}
              aria-hidden="true"
            >
              <svg width="360" height="360" viewBox="0 0 360 360" fill="none">
                <circle cx="180" cy="180" r="170" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 6" />
                <circle cx="180" cy="180" r="140" stroke="currentColor" strokeWidth="0.4" />
                <circle cx="180" cy="180" r="110" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 3" />
                <path d="M180 14 L180 30 M180 330 L180 346 M14 180 L30 180 M330 180 L346 180" stroke="currentColor" strokeWidth="1" />
                <path d="M65 65 L75 75 M295 65 L285 75 M65 295 L75 285 M295 295 L285 285" stroke="currentColor" strokeWidth="0.8" />
                <text x="180" y="48" fontSize="10" fill="currentColor" textAnchor="middle" fontStyle="italic">✦</text>
                <text x="180" y="322" fontSize="10" fill="currentColor" textAnchor="middle" fontStyle="italic">✦</text>
                <text x="48" y="184" fontSize="10" fill="currentColor" textAnchor="middle" fontStyle="italic">✧</text>
                <text x="312" y="184" fontSize="10" fill="currentColor" textAnchor="middle" fontStyle="italic">✧</text>
              </svg>
            </motion.div>
          )}

          {/* Stat block number watermark (STR/DEX/CON/INT/WIS/CHA style numerals) */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none" aria-hidden="true">
            <span className="absolute left-[6%] top-[22%] font-display italic font-bold text-2xl text-orange-500/[0.07] dark:text-orange-400/[0.07] tabular-nums">18</span>
            <span className="absolute right-[7%] top-[16%] font-display italic font-bold text-xl text-amber-500/[0.07] dark:text-amber-400/[0.07] tabular-nums">14</span>
            <span className="absolute left-[10%] bottom-[14%] font-display italic font-bold text-lg text-orange-500/[0.06] dark:text-orange-400/[0.06] tabular-nums">16</span>
            <span className="absolute right-[9%] bottom-[18%] font-display italic font-bold text-2xl text-amber-500/[0.07] dark:text-amber-400/[0.07] tabular-nums">12</span>
            <span className="absolute left-[28%] top-[10%] font-display italic font-bold text-base text-orange-500/[0.05] dark:text-orange-400/[0.05] tabular-nums">10</span>
            <span className="absolute right-[26%] bottom-[8%] font-display italic font-bold text-xl text-orange-500/[0.06] dark:text-orange-400/[0.06] tabular-nums">8</span>
          </div>

          {/* Double-bezel icon container with arcane hover flare */}
          <div className="group relative z-10 flex justify-center mb-6">
            <span className="pointer-events-none absolute left-[calc(50%-2.75rem)] top-0 font-display italic font-bold text-2xl text-orange-500/0 transition-all duration-500 group-hover:text-orange-500/80 dark:group-hover:text-orange-400/80 group-hover:scale-110">
              ✦
            </span>
            <span className="pointer-events-none absolute right-[calc(50%-2.75rem)] top-0 font-display italic font-bold text-2xl text-amber-500/0 transition-all duration-500 group-hover:text-amber-500/80 dark:group-hover:text-amber-400/80 group-hover:scale-110">
              ✧
            </span>
            <div className="rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 dark:bg-white/[0.015]">
              <div className="flex size-12 items-center justify-center rounded-xl bg-orange-500/10">
                <Sword className="size-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          {/* Eyebrow badge */}
          <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-5">
            <span className="inline-block size-1.5 rounded-full bg-orange-500 opacity-60" />
            D&D Character Builder
          </span>

          {/* Title with italic gradient emphasis on "DnD Backstory" */}
          <h1 className="relative z-10 font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.08] mt-4">
            <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 dark:from-orange-400 dark:via-orange-300 dark:to-amber-300">
              DnD Backstory
            </span>
            {" "}Generator
          </h1>

          {/* Arcane rune cluster decorative anchor */}
          <div className="relative z-10 mt-3 mb-5 flex justify-center items-center gap-2">
            <span className="text-orange-500/35 dark:text-orange-400/35 text-sm">✦</span>
            {[3, 5, 7, 5, 3].map((s, i) => (
              <span key={i} className="inline-block rounded-full bg-orange-500/25 dark:bg-orange-400/30" style={{ width: s, height: s }} />
            ))}
            <span className="text-amber-500/45 dark:text-amber-400/45 text-base">⚔</span>
            {[3, 5, 7, 5, 3].map((s, i) => (
              <span key={i} className="inline-block rounded-full bg-orange-500/25 dark:bg-orange-400/30" style={{ width: s, height: s }} />
            ))}
            <span className="text-orange-500/35 dark:text-orange-400/35 text-sm">✧</span>
          </div>

          <p className="relative z-10 text-base sm:text-lg text-muted-foreground/65 leading-relaxed font-light max-w-xl mx-auto">
            {t("ui.subtitle")}
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

        <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] lg:grid-cols-[400px_1fr] xl:grid-cols-[440px_1fr] gap-8 lg:gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6 md:sticky md:top-24"
          >
            <div className="bg-card/60 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-xl shadow-black/5 dark:shadow-black/20 ring-1 ring-black/5">
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
                    className="min-h-[120px] resize-none bg-muted/50 border-border/50 focus:border-orange-500/50 focus:ring-orange-500/20 rounded-xl p-4 text-base leading-relaxed transition-all shadow-sm"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                      {t("ui.ai_model")}
                    </Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_MODELS.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center gap-2 py-0.5">
                              <span className="opacity-70">{model.icon}</span>
                              <span className="font-medium">{model.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                      {t("ui.output_language")}
                    </Label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((item) => (
                          <SelectItem key={item.code} value={item.code}>
                            <span className="mr-2">{item.flag}</span>{item.name}
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
                      <SelectTrigger className="bg-muted/50 border-border/50">
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
                      <SelectTrigger className="bg-muted/50 border-border/50">
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
                  <Label>
                    {t("ui.background")}
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
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
                      <SelectTrigger className="bg-muted/50 border-border/50">
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
                      <SelectTrigger className="bg-muted/50 border-border/50">
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
                      <SelectTrigger className="bg-muted/50 border-border/50">
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
                      <SelectTrigger className="bg-muted/50 border-border/50">
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
                        <SelectTrigger className="bg-muted/50 border-border/50">
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
                  className="group w-full h-12 text-base bg-orange-600 font-semibold text-white shadow-md shadow-orange-600/20 hover:bg-orange-700 active:scale-[0.97] disabled:opacity-60 dark:bg-orange-500 dark:shadow-orange-500/20 dark:hover:bg-orange-600 transition-all"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      {t("ui.generating")}
                    </>
                  ) : (
                    <>
                      <span className="relative inline-flex items-center justify-center mr-2">
                        <Sword className="w-5 h-5 relative z-10" />
                        {!reduceMotion && (
                          <svg
                            className="pointer-events-none absolute -inset-2 size-9 text-white/0 group-hover:animate-arcane-pulse"
                            viewBox="0 0 40 40"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" stroke="rgb(255 255 255 / 0.9)" strokeWidth="1.5" fill="rgb(255 255 255 / 0.18)" strokeLinejoin="round" />
                            <path d="M20 2 L20 13 M4 11 L13 17 M36 11 L27 17 M20 38 L13 17 M20 38 L27 17 M13 17 L27 17" stroke="rgb(255 255 255 / 0.7)" strokeWidth="1" />
                          </svg>
                        )}
                      </span>
                      {selectedModel === "creative" && creativeQuota.anonymousCreativeExhausted
                        ? "Sign in to continue"
                        : t("ui.generate_button")}
                    </>
                  )}
                </Button>
                <GeneratorShortcutHints className="mt-3" />
                <CreativeQuotaHint pageKey="dnd-backstory-generator" selectedModel={selectedModel} used={creativeQuota.used} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            ref={resultRef}
            className="relative flex h-[720px] max-h-[75vh] min-h-[400px] flex-col sm:min-h-[520px] md:sticky md:top-24"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-orange-500/5 rounded-[2rem] blur-2xl -z-10" />

            <div
              className={cn(
                "flex-1 rounded-[2rem] border border-border backdrop-blur-xl overflow-hidden transition-all duration-500 flex flex-col card-hover-lift",
                generatedBackstory
                  ? "bg-card/80 shadow-2xl shadow-orange-500/10"
                  : "bg-card/40 shadow-xl border-dashed"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-4 border-b border-border/50 bg-muted/20">
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t("output.copy")}</span>
                    </Button>
                    <ShareResultButton
                      content={generatedBackstory}
                      prompt={prompt}
                      sourceCategory="dnd-backstory"
                      title={prompt.substring(0, 30) + (prompt.length > 30 ? "..." : "")}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isExporting}
                          className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                        >
                          {isExporting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">
                            {isExporting ? t("output.exporting") : t("output.export")}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[160px]">
                        <DropdownMenuItem
                          onClick={() => handleExport("pdf")}
                          disabled={isExporting}
                        >
                          <FileText className="mr-2 h-4 w-4" /> PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExport("docx")}
                          disabled={isExporting}
                        >
                          <FileType className="mr-2 h-4 w-4" /> DOCX
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExport("epub")}
                          disabled={isExporting}
                        >
                          <BookOpen className="mr-2 h-4 w-4" /> EPUB
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExport("markdown")}
                          disabled={isExporting}
                        >
                          <FileCode className="mr-2 h-4 w-4" /> Markdown
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExport("txt")}
                          disabled={isExporting}
                        >
                          <AlignLeft className="mr-2 h-4 w-4" /> TXT
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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

        {generatedBackstory && !isGenerating ? (
          <div className="mt-10">
            <CompletionGuide
              translations={section?.completion_guide}
              onCreateAnother={handleCreateAnother}
              onSave={handleSaveClick}
              onContinue={handleContinueInAiWrite}
              continueLabel={getContinueActionLabel({ hasUser: !!user, locale })}
              continueHint={
                locale.startsWith("zh")
                  ? "保留当前内容与上下文，登录后直接继续生成"
                  : "Your content and context are preserved. Sign in to continue generating in AI Write."
              }
              isSaveDisabled={isSavingStory}
            />
          </div>
        ) : null}
      </main>
      <StorySaveDialog
        open={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        onSelect={handleConfirmSave}
        locale={locale}
        isSaving={isSavingStory}
      />
      <CreativeQuotaPaywall
        open={creativeQuota.paywallOpen}
        onClose={() => creativeQuota.setPaywallOpen(false)}
        sourcePage="dnd-backstory-generator"
      />
    </div>
  );
}
