"use client";

import GeneratorNavTabs from "@/components/generator-nav-tabs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  ChevronDown,
  Copy,
  Eraser,
  Flame,
  Heart,
  Palette,
  RefreshCw,
  Settings2,
  Sparkles,
  Stars,
  Wand2,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Icon from "@/components/icon";
import ShareResultButton from "@/components/story/share-result-button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import TurnstileInvisible, { TurnstileInvisibleHandle } from "@/components/TurnstileInvisible";
import { GeneratorShortcutHints } from "@/components/generator-shortcut-hints";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
import { useGeneratorShortcuts } from "@/hooks/useGeneratorShortcuts";
import { StoryStorage } from "@/lib/story-storage";
import { LANGUAGE_OPTIONS } from "@/lib/language-options";
import { cn } from "@/lib/utils";
import type { RomanceStoryGenerate as RomanceStoryGenerateType } from "@/types/blocks/romance-story-generate";
import RomanceStoryBreadcrumb from "./breadcrumb";
import { useRouter } from "@/i18n/navigation";
import { getContinueActionLabel, shouldGateAnonymousContinue } from "@/components/ai-write/workbench/_lib";
import { buildContinueIntentPayload, buildContinueTrackingPayload, CONTINUE_INTENT_KEY, GENERATOR_PREFILL_KEY } from "@/components/ai-write/workbench/continue-intent";
import { useAppContext } from "@/contexts/app";
import { useOpenPanel } from "@openpanel/nextjs";
import { useCreativeQuotaPage } from "@/hooks/useCreativeQuotaPage";
import { CreativeQuotaHint } from "@/components/blocks/creative-quota-hint";
import { CreativeQuotaPaywall } from "@/components/blocks/creative-quota-paywall";
import CompletionGuide from "@/components/story/completion-guide";
import StorySaveDialog from "@/components/story/story-save-dialog";
import type { StoryStatus } from "@/models/story";
import { writePendingAuthResume } from "@/lib/auth-resume";
import { ACTIVATION_EVENTS, buildActivationTrackingPayload } from "@/lib/activation-funnel";

const DRAFT_KEY = "romance-story-generator:prompt";

function calculateWordCount(text: string): number {
  if (!text?.trim()) return 0;
  const cjkRegex = /[一-鿿㐀-䶿豈-﫿぀-ゟ゠-ヿ가-힯]/g;
  const cjkCount = (text.match(cjkRegex) || []).length;
  const withoutCJK = text.replace(cjkRegex, " ").trim();
  const englishCount = withoutCJK ? withoutCJK.split(/\s+/).filter(Boolean).length : 0;
  return cjkCount + englishCount;
}

interface RomanceStoryGenerateProps {
  section?: RomanceStoryGenerateType;
}

type GeneratorOptions = {
  prompt: string;
  model: string;
  locale: string;
  subGenre: string;
  trope: string;
  heatLevel: string;
  setting: string;
  pov: string;
  storyLength: string;
};

export default function RomanceStoryGenerate({ section }: RomanceStoryGenerateProps) {
  const locale = useLocale();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const creativeQuota = useCreativeQuotaPage("romance-story-generator");
  const { user, requireAuth, setSignModalContext } = useAppContext();
  const { track } = useOpenPanel();

  const t = useCallback(
    (path: string) => {
      const keys = path.split(".");
      let value = section as unknown as Record<string, unknown>;
      for (const key of keys) {
        value = value?.[key] as Record<string, unknown>;
      }
      return (value as unknown as string) || path;
    },
    [section]
  );

  const AI_MODELS = useMemo(
    () => [
      {
        id: "fast",
        name: t("ai_models.fast"),
        badge: "FAST",
        badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        icon: <Zap className="h-4 w-4" />,
        description: t("ai_models.fast_description"),
      },
      {
        id: "standard",
        name: t("ai_models.standard"),
        badge: "RECOMMENDED",
        badgeColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
        icon: <Sparkles className="h-4 w-4" />,
        description: t("ai_models.standard_description"),
      },
      {
        id: "creative",
        name: t("ai_models.creative"),
        badge: "PRO",
        badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        icon: <Palette className="h-4 w-4" />,
        description: t("ai_models.creative_description"),
      },
    ],
    [t]
  );


  const subGenres = useMemo(() => Object.entries(section?.sub_genres || {}), [section]);
  const tropes = useMemo(() => Object.entries(section?.tropes || {}), [section]);
  const heatLevels = useMemo(() => Object.entries(section?.heat_levels || {}), [section]);
  const settings = useMemo(() => Object.entries(section?.settings || {}), [section]);
  const povs = useMemo(() => Object.entries(section?.povs || {}), [section]);
  const storyLengths = useMemo(() => Object.entries(section?.story_lengths || {}), [section]);
  const randomPrompts = useMemo(() => section?.random_prompts || [], [section]);

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("standard");
  const [selectedLanguage, setSelectedLanguage] = useState(locale);
  const [subGenre, setSubGenre] = useState("modern");
  const [trope, setTrope] = useState("enemies_to_lovers");
  const [heatLevel, setHeatLevel] = useState("mild");
  const [setting, setSetting] = useState("contemporary_city");
  const [pov, setPov] = useState("third_person");
  const [storyLength, setStoryLength] = useState("medium");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSavingStory, setIsSavingStory] = useState(false);

  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const outputScrollRef = useRef<HTMLDivElement | null>(null);

  const latestOptionsRef = useRef<GeneratorOptions>({
    prompt: "",
    model: "standard",
    locale,
    subGenre: "modern",
    trope: "enemies_to_lovers",
    heatLevel: "mild",
    setting: "contemporary_city",
    pov: "third_person",
    storyLength: "medium",
  });

  useEffect(() => {
    latestOptionsRef.current = {
      prompt,
      model: selectedModel,
      locale: selectedLanguage,
      subGenre,
      trope,
      heatLevel,
      setting,
      pov,
      storyLength,
    };
  }, [prompt, selectedModel, selectedLanguage, subGenre, trope, heatLevel, setting, pov, storyLength]);

  useDraftAutoSave({
    key: `${DRAFT_KEY}:${locale}`,
    value: prompt,
    onRestore: (draft) => setPrompt(draft),
  });

  useEffect(() => {
    if (!isGenerating || !generatedStory) return;
    const container = outputScrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [generatedStory, isGenerating]);

  const handleRandomPrompt = useCallback(() => {
    if (!randomPrompts.length) return;
    const randomIndex = Math.floor(Math.random() * randomPrompts.length);
    setPrompt(randomPrompts[randomIndex]);
    toast.success(t("success.random_prompt_selected"));
    setTimeout(() => promptRef.current?.focus(), 50);
  }, [randomPrompts, t]);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) {
      toast.error(t("validation.enter_story_idea"));
      promptRef.current?.focus();
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
    setGeneratedStory("");
    setIsGenerating(true);
    turnstileRef.current?.execute();
  }, [creativeQuota, prompt, selectedModel, t]);

  const handleTurnstileSuccess = useCallback(
    async (turnstileToken: string) => {
      const opts = latestOptionsRef.current;

      try {
        const response = await fetch("/api/romance-story/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: opts.prompt.trim(),
            model: opts.model,
            locale: opts.locale,
            subGenre: opts.subGenre,
            trope: opts.trope,
            heatLevel: opts.heatLevel,
            setting: opts.setting,
            pov: opts.pov,
            storyLength: opts.storyLength,
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
              setGeneratedStory(accumulatedContent);
            } catch (error) {
              console.error("Parse error:", error);
            }
          }
        }

        if (accumulatedContent.trim()) {
          if (opts.model === "creative") creativeQuota.increment();
          StoryStorage.saveStory({
            title: (opts.prompt.trim() || "Romance Story").slice(0, 30),
            prompt: opts.prompt.trim(),
            content: accumulatedContent.trim(),
            wordCount: calculateWordCount(accumulatedContent),
            model: AI_MODELS.find((item) => item.id === opts.model)?.name || "AI",
            genre: "Romance",
          });
          toast.success(t("success.story_generated"));
          if (window.innerWidth < 1024) {
            setTimeout(() => {
              resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 250);
          }
        }
      } catch (error) {
        console.error("Romance story generation error:", error);
        toast.error(t("errors.generation_failed"));
      } finally {
        setIsGenerating(false);
      }
    },
    [AI_MODELS, creativeQuota, t]
  );

  const handleTurnstileError = useCallback(() => {
    setIsGenerating(false);
    toast.error(t("errors.generation_failed"));
  }, [t]);

  const wordCount = useMemo(() => calculateWordCount(generatedStory), [generatedStory]);

  const handleContinueInAiWrite = useCallback(() => {
    if (!generatedStory.trim()) return;
    track("continue_ai_write_cta_click", buildContinueTrackingPayload({ source_page: "romance-story-generator", logged_in: !!user, cta_variant: user ? "continue_ai_write" : "sign_in_to_continue_ai_write" }));
    const payload = buildContinueIntentPayload({ source: "romance-story-generator", title: prompt, content: generatedStory });
    if (shouldGateAnonymousContinue({ hasUser: !!user, hasGeneratedContent: !!generatedStory.trim() })) {
      try {
        window.localStorage.setItem(CONTINUE_INTENT_KEY, JSON.stringify(payload));
        window.localStorage.setItem(GENERATOR_PREFILL_KEY, JSON.stringify(payload.prefill));
      } catch {}
      track("sign_modal_open_for_continue", buildContinueTrackingPayload({ source_page: "romance-story-generator" }));
      setSignModalContext({ mode: "continue-ai-write", source: payload.source, redirectTo: payload.redirectTo });
      requireAuth({ source: "ai_write", action: "continue_writing", sourcePage: "romance-story-generator" });
      return;
    }
    try { window.localStorage.setItem(GENERATOR_PREFILL_KEY, JSON.stringify(payload.prefill)); } catch {}
    router.push(payload.redirectTo as any);
  }, [generatedStory, prompt, router, user, track, setSignModalContext, requireAuth]);

  const handleCreateAnother = useCallback(() => {
    setGeneratedStory("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSaveClick = useCallback(() => {
    const content = generatedStory.trim();
    if (!content) {
      toast.error(locale.startsWith("zh") ? "请先生成故事再保存。" : "No story to save yet. Please generate one first.");
      return;
    }
    try {
      const rawTitle = prompt.trim() || (locale.startsWith("zh") ? "未命名爱情故事" : "Untitled Romance Story");
      const title = rawTitle.length > 30 ? `${rawTitle.slice(0, 30)}...` : rawTitle;
      StoryStorage.saveStory({ title, prompt: prompt.trim(), content, wordCount, model: AI_MODELS.find((m) => m.id === selectedModel)?.name || "AI", genre: "Romance" });
    } catch (err) { console.error("Failed to save romance story locally:", err); }
    if (!user) {
      writePendingAuthResume({ source: "story_save", action: "save_story", sourcePage: "romance-story-generator", startedAt: Date.now(), payload: { prompt, generatedStory, selectedModel, selectedLanguage } });
      toast.error(locale.startsWith("zh") ? "已在本地「我的故事」中保存，登录后可以同步到云端。" : "Saved locally. Sign in to save this story to your account.");
      requireAuth({ source: "story_save", action: "save_story", sourcePage: "romance-story-generator" });
      return;
    }
    setIsSaveDialogOpen(true);
    track(ACTIVATION_EVENTS.saveDialogOpen, buildActivationTrackingPayload({ sourcePage: "romance-story-generator", loggedIn: !!user, action: "save_dialog_open", model: selectedModel, wordCount }));
  }, [AI_MODELS, generatedStory, locale, prompt, requireAuth, selectedLanguage, selectedModel, track, user, wordCount]);

  const handleConfirmSave = useCallback(async (status: StoryStatus) => {
    const content = generatedStory.trim();
    if (!content) return;
    try {
      setIsSavingStory(true);
      const rawTitle = prompt.trim() || (locale.startsWith("zh") ? "未命名爱情故事" : "Untitled Romance Story");
      const title = rawTitle.length > 30 ? `${rawTitle.slice(0, 30)}...` : rawTitle;
      const modelMap: Record<string, string> = { fast: "gemini-2.5-flash", standard: "gemini-3.1-flash-lite", creative: "gemini-3-flash" };
      const resp = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, prompt: prompt.trim(), content, wordCount, modelUsed: modelMap[selectedModel] || "gemini-3.1-flash-lite", settings: { locale, outputLanguage: selectedLanguage, subGenre, trope, heatLevel, setting, pov, storyLength }, status, visibility: status === "published" ? "public" : "private", sourceCategory: "romance" }),
      });
      if (!resp.ok) throw new Error("request failed with status: " + resp.status);
      const { code, message } = await resp.json();
      if (code !== 0) {
        if (message === "no auth") requireAuth({ source: "story_save", action: "save_story", sourcePage: "romance-story-generator" });
        toast.error(locale.startsWith("zh") ? (message === "no auth" ? "请先登录后再保存故事" : `保存失败：${message}`) : (message || "Failed to save story"));
        return;
      }
      toast.success(locale.startsWith("zh") ? (status === "published" ? "故事已发布" : "故事已保存") : (status === "published" ? "Story published" : "Story saved"));
      track(ACTIVATION_EVENTS.storySaved, buildActivationTrackingPayload({ sourcePage: "romance-story-generator", loggedIn: true, action: "story_saved", model: selectedModel, wordCount }));
      track(ACTIVATION_EVENTS.activationCompleted, { source_page: "romance-story-generator", action: "story_saved" });
      setIsSaveDialogOpen(false);
    } catch (error) {
      console.error("Save romance story failed", error);
      toast.error(locale.startsWith("zh") ? "保存失败，请稍后再试" : "Failed to save story, please try again.");
    } finally {
      setIsSavingStory(false);
    }
  }, [generatedStory, heatLevel, locale, pov, prompt, requireAuth, selectedLanguage, selectedModel, setting, storyLength, subGenre, track, trope, wordCount]);

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
    return md
      .replace(/\r\n/g, "\n")
      .replace(/```[\s\S]*?```/g, (b) => b.replace(/^```[a-zA-Z0-9_-]*\n?/, "").replace(/```\s*$/, ""))
      .replace(/`([^`]+)`/g, "$1")
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1 ($2)")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      .replace(/^\s{0,3}>\s?/gm, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1").replace(/__([^_]+)__/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1").replace(/_([^_]+)_/g, "$1")
      .replace(/^\s{0,3}(-{3,}|\*{3,}|_{3,})\s*$/gm, "")
      .replace(/^\s{0,3}([-*+]\s+)/gm, "")
      .replace(/^\s{0,3}(\d+\.)\s+/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }, []);

  const handleExportMd = useCallback(() => {
    if (!generatedStory) return;
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadTextFile(generatedStory, `romance-story-${ts}.md`, "text/markdown;charset=utf-8");
  }, [downloadTextFile, generatedStory]);

  const handleExportTxt = useCallback(() => {
    if (!generatedStory) return;
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadTextFile(markdownToPlainText(generatedStory), `romance-story-${ts}.txt`, "text/plain;charset=utf-8");
  }, [downloadTextFile, markdownToPlainText, generatedStory]);

  const handleCopy = useCallback(() => {
    if (!generatedStory) return;
    navigator.clipboard.writeText(generatedStory);
    toast.success(t("success.story_copied"));
  }, [generatedStory, t]);

  useGeneratorShortcuts({
    onGenerate: handleGenerate,
    onFocusInput: () => promptRef.current?.focus(),
  });

  return (
    <div id="romance_story_generator" className="min-h-screen bg-background text-foreground selection:bg-orange-500/20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.05_65),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.18_0.04_65),transparent)]" />
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-orange-500/[0.04] via-orange-500/[0.02] to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]"
          style={{ backgroundImage: "var(--bg-grid)", backgroundSize: "40px 40px" }}
        />
      </div>

      {/* Floating romance petals (ambient atmosphere). Honors prefers-reduced-motion. */}
      {!reduceMotion && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-[1]" aria-hidden="true">
          {[
            { left: "6%", delay: 0, duration: 16, size: 26, rotate: -12, opacity: 0.55 },
            { left: "84%", delay: 3, duration: 19, size: 22, rotate: 18, opacity: 0.5 },
            { left: "22%", delay: 7, duration: 22, size: 18, rotate: -22, opacity: 0.45 },
            { left: "70%", delay: 11, duration: 17, size: 24, rotate: 8, opacity: 0.5 },
            { left: "46%", delay: 14, duration: 24, size: 20, rotate: -15, opacity: 0.4 },
          ].map((p, i) => (
            <motion.svg
              key={i}
              className="absolute top-[-60px] text-orange-500 dark:text-orange-400"
              style={{ left: p.left, width: p.size, height: p.size }}
              viewBox="0 0 24 24"
              fill="currentColor"
              initial={{ y: -60, opacity: 0, rotate: p.rotate }}
              animate={{ y: 1400, opacity: [0, p.opacity, p.opacity, 0], rotate: p.rotate + 120 }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <path d="M12 2c-2.5 4-5 7-5 11 0 4 2.2 7 5 7s5-3 5-7c0-4-2.5-7-5-11z" />
            </motion.svg>
          ))}
        </div>
      )}

      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={handleTurnstileSuccess}
        onError={handleTurnstileError}
      />

      <main className="relative z-10 container max-w-7xl mx-auto px-4 py-16 sm:py-20 lg:py-24">
        <div className="mb-10 flex justify-start">
          <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
            <RomanceStoryBreadcrumb
              homeText={t("ui.breadcrumb_home")}
              currentText={t("ui.breadcrumb_current")}
            />
          </div>
        </div>

        <div className="mx-auto max-w-2xl text-center mb-14 sm:mb-18">
          {/* Double-bezel icon container with Cupid's arrow */}
          <div className="flex justify-center mb-6">
            <div className="relative rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 dark:bg-white/[0.015]">
              <div className="flex size-12 items-center justify-center rounded-xl bg-orange-500/10">
                <Heart className="size-6 text-orange-600 dark:text-orange-400" />
              </div>
              {/* Cupid's arrow piercing the heart container */}
              <svg
                className="pointer-events-none absolute -right-3 -top-2 size-6 text-orange-500/45 rotate-[20deg]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 21 L21 3" />
                <path d="M21 3 L15 3 M21 3 L21 9" />
                <path d="M3 21 L9 21 M3 21 L3 15" opacity="0.6" />
              </svg>
            </div>
          </div>

          {/* Eyebrow badge (status dot removed per design-taste-frontend §9.F) */}
          <span className="inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-5">
            AI Romance Writer
          </span>

          {/* Title: Romance in italic serif, Story Generator in roman */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.08] mt-4">
            <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 dark:from-orange-400 dark:via-orange-300 dark:to-amber-300">
              Romance
            </span>{" "}
            <span>Story Generator</span>
          </h1>

          {/* Heart-with-arrow decorative SVG (Cupid motif, replaces brush stroke) */}
          <div className="flex justify-center" aria-hidden="true">
            <svg
              className="mt-4 mb-5 h-3 w-32 text-orange-500/40"
              viewBox="0 0 160 16"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M14 9.5c-1.2 1.8-3 3-4.5 3.5-1.5-.5-3.3-1.7-4.5-3.5-1-1.5-1-3.2 0-4.3 1-1 2.5-1 3.5 0l1 .8 1-.8c1-1 2.5-1 3.5 0 1 1.1 1 2.8 0 4.3z"
                fill="currentColor"
                opacity="0.85"
                transform="rotate(-8 9.5 8.5)"
              />
              <path
                d="M22 8.5 L132 8.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M126 4.5 L134 8.5 L126 12.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M28 5 L22 8.5 L28 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.6"
              />
            </svg>
          </div>

          <p className="text-base sm:text-lg text-muted-foreground/65 leading-relaxed font-light max-w-xl mx-auto">
            {t("ui.subtitle")}
          </p>

          {/* Trope pills (romance signature element) */}
          {section?.ui?.trope_pills?.length ? (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              {section.ui.trope_pills.map((pill: string, i: number) => (
                <span
                  key={i}
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

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] xl:grid-cols-[480px_1fr] gap-8 lg:gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6 lg:sticky lg:top-24 lg:h-[720px] lg:max-h-[75vh] lg:min-h-[520px] lg:overflow-y-auto lg:pr-1"
          >
            <div className="bg-card/60 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-xl shadow-black/5 dark:shadow-black/20 ring-1 ring-black/5 lg:h-full lg:flex lg:flex-col">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    {t("ui.story_idea")}
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
                    placeholder={t("placeholders.story_idea")}
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

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                      {t("ui.sub_genre")}
                    </Label>
                    <Select value={subGenre} onValueChange={setSubGenre}>
                      <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {subGenres.map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                      {t("ui.trope")}
                    </Label>
                    <Select value={trope} onValueChange={setTrope}>
                      <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tropes.map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Heat Level: promoted to main form (romance core control, flame icon as romance motif) */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <Flame
                      className={cn(
                        "size-4 text-orange-500",
                        heatLevel === "steamy" && !reduceMotion && "animate-pulse"
                      )}
                    />
                    {t("ui.heat_level")}
                  </Label>
                  <Select value={heatLevel} onValueChange={setHeatLevel}>
                    <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {heatLevels.map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <CollapsibleContent className="pt-4 space-y-3 data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up overflow-hidden">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                        {t("ui.setting")}
                      </Label>
                      <Select value={setting} onValueChange={setSetting}>
                        <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {settings.map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                        {t("ui.pov")}
                      </Label>
                      <Select value={pov} onValueChange={setPov}>
                        <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {povs.map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                        {t("ui.story_length")}
                      </Label>
                      <Select value={storyLength} onValueChange={setStoryLength}>
                        <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {storyLengths.map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              <div className="pt-6 lg:mt-auto">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="group w-full h-12 text-base bg-orange-600 font-semibold text-white shadow-md shadow-orange-600/20 hover:bg-orange-700 active:scale-[0.97] disabled:opacity-60 dark:bg-orange-500 dark:shadow-orange-500/20 dark:hover:bg-orange-600"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      {t("ui.generating")}
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5 mr-2 group-hover:animate-heartbeat" />
                      {selectedModel === "creative" && creativeQuota.anonymousCreativeExhausted
                        ? "Sign in to continue"
                        : t("ui.generate_button")}
                    </>
                  )}
                </Button>
                <GeneratorShortcutHints className="mt-3" />
                <CreativeQuotaHint
                  pageKey="romance-story-generator"
                  selectedModel={selectedModel}
                  used={creativeQuota.used}
                  className="mt-3"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            ref={resultRef}
            className="relative h-[520px] sm:h-[720px] max-h-[75vh] min-h-[400px] sm:min-h-[520px] lg:sticky lg:top-24"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-orange-500/5 rounded-[2rem] blur-2xl -z-10" />

            <div
              className={cn(
                "h-full rounded-[2rem] border border-border backdrop-blur-xl overflow-hidden transition-all duration-500 flex flex-col card-hover-lift",
                generatedStory
                  ? "bg-card/80 shadow-2xl shadow-orange-500/10"
                  : "bg-card/40 shadow-xl border-dashed"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-4 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{t("output.title")}</span>
                    {generatedStory && (
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                        {wordCount} {t("output.words")}
                      </span>
                    )}
                  </div>
                </div>
                {generatedStory && (
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                        >
                          <Icon name="RiDownloadLine" className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{t("output.export")}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleExportMd}>
                          {t("output.export_md")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportTxt}>
                          {t("output.export_txt")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                      content={generatedStory}
                      prompt={prompt}
                      sourceCategory="romance"
                      title={prompt.substring(0, 30) + (prompt.length > 30 ? "..." : "")}
                    />
                  </div>
                )}
              </div>

              <div
                ref={outputScrollRef}
                className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar"
              >
                {generatedStory ? (
                  <div className="animate-fade-in">
                    <article className="prose prose-slate dark:prose-invert prose-lg max-w-none leading-relaxed prose-headings:font-semibold prose-p:text-slate-700 dark:prose-p:text-slate-300">
                      <ReactMarkdown>{generatedStory}</ReactMarkdown>
                    </article>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-60">
                    {isGenerating ? (
                      <div className="space-y-6">
                        <div className="relative mx-auto w-16 h-16">
                          <div className="absolute inset-0 rounded-full border-4 border-orange-500/20" />
                          <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin" />
                          <Heart className="absolute inset-0 m-auto w-6 h-6 text-orange-500 animate-pulse" />
                        </div>
                        <p className="text-sm font-medium animate-pulse">{t("output.generating_message")}</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-w-xs mx-auto">
                        <div className="w-16 h-16 mx-auto bg-orange-500/5 rounded-2xl flex items-center justify-center rotate-3">
                          <Stars className="w-8 h-8 text-orange-400/50" />
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

        {generatedStory && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 pt-8 border-t border-dashed border-border/50"
          >
            <CompletionGuide
              translations={section?.completion_guide}
              onCreateAnother={handleCreateAnother}
              onSave={handleSaveClick}
              onContinue={handleContinueInAiWrite}
              continueLabel={getContinueActionLabel({ hasUser: !!user, locale })}
              isSaveDisabled={isSavingStory}
            />
          </motion.div>
        )}
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
        sourcePage="romance-story-generator"
      />
    </div>
  );
}
