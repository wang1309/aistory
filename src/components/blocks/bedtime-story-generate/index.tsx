"use client";

import GeneratorNavTabs from "@/components/generator-nav-tabs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  BookOpen,
  ChevronDown,
  Copy,
  Eraser,
  Moon,
  RefreshCw,
  Settings2,
  Sparkles,
  Wand2,
  Zap,
  Palette,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Icon from "@/components/icon";
import ShareResultButton from "@/components/story/share-result-button";
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
import { LANGUAGE_OPTIONS } from "@/lib/language-options";
import { cn } from "@/lib/utils";
import type { BedtimeStoryGenerate as BedtimeStoryGenerateType } from "@/types/blocks/bedtime-story-generate";
import BedtimeStoryBreadcrumb from "./breadcrumb";
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

const DRAFT_KEY = "bedtime-story-generator:prompt";

function calculateWordCount(text: string): number {
  if (!text?.trim()) return 0;
  const cjkRegex =
    /[一-鿿㐀-䶿豈-﫿぀-ゟ゠-ヿ가-힯]/g;
  const cjkCount = (text.match(cjkRegex) || []).length;
  const withoutCJK = text.replace(cjkRegex, " ").trim();
  const englishCount = withoutCJK ? withoutCJK.split(/\s+/).filter(Boolean).length : 0;
  return cjkCount + englishCount;
}

interface BedtimeStoryGenerateProps {
  section?: BedtimeStoryGenerateType;
}

type GeneratorOptions = {
  prompt: string;
  model: string;
  locale: string;
  ageGroup: string;
  storyTheme: string;
  storyLength: string;
  endingMood: string;
  moralLesson: string;
  childName: string;
};

export default function BedtimeStoryGenerate({ section }: BedtimeStoryGenerateProps) {
  const locale = useLocale();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const creativeQuota = useCreativeQuotaPage("bedtime-story-generator");
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


  const ageGroups = useMemo(() => Object.entries(section?.age_groups || {}), [section]);
  const storyThemes = useMemo(() => Object.entries(section?.story_themes || {}), [section]);
  const storyLengths = useMemo(() => Object.entries(section?.story_lengths || {}), [section]);
  const endingMoods = useMemo(() => Object.entries(section?.ending_moods || {}), [section]);
  const moralLessons = useMemo(() => Object.entries(section?.moral_lessons || {}), [section]);
  const randomPrompts = useMemo(() => section?.random_prompts || [], [section]);

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("standard");
  const [selectedLanguage, setSelectedLanguage] = useState(locale);
  const [ageGroup, setAgeGroup] = useState("preschool");
  const [storyTheme, setStoryTheme] = useState("adventure");
  const [storyLength, setStoryLength] = useState("medium");
  const [endingMood, setEndingMood] = useState("happy");
  const [moralLesson, setMoralLesson] = useState("none");
  const [childName, setChildName] = useState("");
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
    ageGroup: "preschool",
    storyTheme: "adventure",
    storyLength: "medium",
    endingMood: "happy",
    moralLesson: "none",
    childName: "",
  });

  useEffect(() => {
    latestOptionsRef.current = {
      prompt,
      model: selectedModel,
      locale: selectedLanguage,
      ageGroup,
      storyTheme,
      storyLength,
      endingMood,
      moralLesson,
      childName,
    };
  }, [prompt, selectedModel, selectedLanguage, ageGroup, storyTheme, storyLength, endingMood, moralLesson, childName]);

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
      }) || creativeQuota.guardCreativeCreditQuota({ selectedModel })
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
        const response = await fetch("/api/bedtime-story/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: opts.prompt.trim(),
            model: opts.model,
            locale: opts.locale,
            ageGroup: opts.ageGroup,
            storyTheme: opts.storyTheme,
            length: opts.storyLength,
            endingMood: opts.endingMood,
            moralLesson: opts.moralLesson !== "none" ? opts.moralLesson : undefined,
            childName: opts.childName.trim() || undefined,
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
            title: (opts.prompt.trim() || "Bedtime Story").slice(0, 30),
            prompt: opts.prompt.trim(),
            content: accumulatedContent.trim(),
            wordCount: calculateWordCount(accumulatedContent),
            model: AI_MODELS.find((item) => item.id === opts.model)?.name || "AI",
            genre: "Bedtime",
          });
          toast.success(t("success.story_generated"));
          if (window.innerWidth < 1024) {
            setTimeout(() => {
              resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 250);
          }
        }
      } catch (error) {
        console.error("Bedtime story generation error:", error);
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
    downloadTextFile(generatedStory, `bedtime-story-${ts}.md`, "text/markdown;charset=utf-8");
  }, [downloadTextFile, generatedStory]);

  const handleExportTxt = useCallback(() => {
    if (!generatedStory) return;
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadTextFile(markdownToPlainText(generatedStory), `bedtime-story-${ts}.txt`, "text/plain;charset=utf-8");
  }, [downloadTextFile, markdownToPlainText, generatedStory]);

  const handleCopy = useCallback(() => {
    if (!generatedStory) return;
    navigator.clipboard.writeText(generatedStory);
    toast.success(t("success.story_copied"));
  }, [generatedStory, t]);

  const wordCount = useMemo(() => calculateWordCount(generatedStory), [generatedStory]);

  const handleSaveClick = useCallback(() => {
    const content = generatedStory.trim();
    if (!content) {
      toast.error(locale.startsWith("zh") ? "请先生成故事再保存。" : "No story to save yet. Please generate one first.");
      return;
    }
    try {
      const rawTitle = prompt.trim() || (locale.startsWith("zh") ? "未命名睡前故事" : "Untitled Bedtime Story");
      const title = rawTitle.length > 30 ? `${rawTitle.slice(0, 30)}...` : rawTitle;
      StoryStorage.saveStory({
        title,
        prompt: prompt.trim(),
        content,
        wordCount,
        model: AI_MODELS.find((m) => m.id === selectedModel)?.name || "AI",
        genre: "Bedtime",
      });
    } catch (err) {
      console.error("Failed to save bedtime story locally:", err);
    }
    if (!user) {
      writePendingAuthResume({
        source: "story_save",
        action: "save_story",
        sourcePage: "bedtime-story-generator",
        startedAt: Date.now(),
        payload: { prompt, generatedStory, selectedModel, selectedLanguage },
      });
      toast.error(locale.startsWith("zh") ? "已在本地「我的故事」中保存，登录后可以同步到云端。" : "Saved locally. Sign in to save this story to your account.");
      requireAuth({ source: "story_save", action: "save_story", sourcePage: "bedtime-story-generator" });
      return;
    }
    setIsSaveDialogOpen(true);
    track(ACTIVATION_EVENTS.saveDialogOpen, buildActivationTrackingPayload({ sourcePage: "bedtime-story-generator", loggedIn: !!user, action: "save_dialog_open", model: selectedModel, wordCount }));
  }, [AI_MODELS, generatedStory, locale, prompt, requireAuth, selectedLanguage, selectedModel, track, user, wordCount]);

  const handleConfirmSave = useCallback(async (status: StoryStatus) => {
    const content = generatedStory.trim();
    if (!content) return;
    try {
      setIsSavingStory(true);
      const rawTitle = prompt.trim() || (locale.startsWith("zh") ? "未命名睡前故事" : "Untitled Bedtime Story");
      const title = rawTitle.length > 30 ? `${rawTitle.slice(0, 30)}...` : rawTitle;
      const modelMap: Record<string, string> = { fast: "gemini-2.5-flash", standard: "gemini-3.1-flash-lite", creative: "gemini-3-flash" };
      const resp = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          prompt: prompt.trim(),
          content,
          wordCount,
          modelUsed: modelMap[selectedModel] || "gemini-3.1-flash-lite",
          settings: { locale, outputLanguage: selectedLanguage, ageGroup, storyTheme, storyLength, endingMood, moralLesson },
          status,
          visibility: status === "published" ? "public" : "private",
          sourceCategory: "bedtime",
        }),
      });
      if (!resp.ok) throw new Error("request failed with status: " + resp.status);
      const { code, message } = await resp.json();
      if (code !== 0) {
        if (message === "no auth") requireAuth({ source: "story_save", action: "save_story", sourcePage: "bedtime-story-generator" });
        toast.error(locale.startsWith("zh") ? (message === "no auth" ? "请先登录后再保存故事" : `保存失败：${message}`) : (message || "Failed to save story"));
        return;
      }
      toast.success(locale.startsWith("zh") ? (status === "published" ? "故事已发布" : "故事已保存") : (status === "published" ? "Story published" : "Story saved"));
      track(ACTIVATION_EVENTS.storySaved, buildActivationTrackingPayload({ sourcePage: "bedtime-story-generator", loggedIn: true, action: "story_saved", model: selectedModel, wordCount }));
      track(ACTIVATION_EVENTS.activationCompleted, { source_page: "bedtime-story-generator", action: "story_saved" });
      setIsSaveDialogOpen(false);
    } catch (error) {
      console.error("Save bedtime story failed", error);
      toast.error(locale.startsWith("zh") ? "保存失败，请稍后再试" : "Failed to save story, please try again.");
    } finally {
      setIsSavingStory(false);
    }
  }, [ageGroup, endingMood, generatedStory, locale, moralLesson, prompt, requireAuth, selectedLanguage, selectedModel, storyLength, storyTheme, track, wordCount]);

  const handleCreateAnother = useCallback(() => {
    setGeneratedStory("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleContinueInAiWrite = useCallback(() => {
    if (!generatedStory.trim()) return;

    track(
      "continue_ai_write_cta_click",
      buildContinueTrackingPayload({
        source_page: "bedtime-story-generator",
        logged_in: !!user,
        cta_variant: user ? "continue_ai_write" : "sign_in_to_continue_ai_write",
      })
    );

    const payload = buildContinueIntentPayload({
      source: "bedtime-story-generator",
      title: prompt,
      content: generatedStory,
    });

    if (shouldGateAnonymousContinue({ hasUser: !!user, hasGeneratedContent: !!generatedStory.trim() })) {
      try {
        window.localStorage.setItem(CONTINUE_INTENT_KEY, JSON.stringify(payload));
        window.localStorage.setItem(GENERATOR_PREFILL_KEY, JSON.stringify(payload.prefill));
      } catch {}
      track("sign_modal_open_for_continue", buildContinueTrackingPayload({ source_page: "bedtime-story-generator" }));
      setSignModalContext({ mode: "continue-ai-write", source: payload.source, redirectTo: payload.redirectTo });
      requireAuth({ source: "ai_write", action: "continue_writing", sourcePage: "bedtime-story-generator" });
      return;
    }

    try {
      window.localStorage.setItem(GENERATOR_PREFILL_KEY, JSON.stringify(payload.prefill));
    } catch {}
    router.push(payload.redirectTo as any);
  }, [generatedStory, prompt, router, user, track, setSignModalContext, requireAuth]);

  useGeneratorShortcuts({
    onGenerate: handleGenerate,
    onFocusInput: () => promptRef.current?.focus(),
  });

  return (
    <div id="bedtime_story_generator" className="min-h-screen bg-background text-foreground selection:bg-orange-500/20">
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

      <main className="container max-w-7xl mx-auto px-4 py-16 sm:py-20 lg:py-24 relative z-10">
        {/* Twinkle starfield */}
        {!reduceMotion && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden z-[1]" aria-hidden="true">
            {[
              { left: "6%", top: "14%", delay: 0, size: 22, duration: 5, peak: 0.85, glow: true },
              { left: "92%", top: "8%", delay: 1.2, size: 18, duration: 6, peak: 0.75, glow: true },
              { left: "24%", top: "28%", delay: 2.8, size: 14, duration: 7, peak: 0.7, glow: false },
              { left: "78%", top: "32%", delay: 0.6, size: 20, duration: 5.5, peak: 0.8, glow: true },
              { left: "42%", top: "6%", delay: 3.5, size: 16, duration: 6.5, peak: 0.7, glow: false },
              { left: "60%", top: "48%", delay: 2.1, size: 18, duration: 5.8, peak: 0.75, glow: true },
              { left: "12%", top: "62%", delay: 4.2, size: 14, duration: 7.2, peak: 0.7, glow: false },
              { left: "88%", top: "58%", delay: 1.8, size: 16, duration: 6.2, peak: 0.75, glow: true },
              { left: "48%", top: "76%", delay: 3.0, size: 12, duration: 7.5, peak: 0.65, glow: false },
            ].map((s, i) => (
              <motion.svg
                key={i}
                className="absolute text-orange-500 dark:text-orange-300"
                style={{
                  left: s.left,
                  top: s.top,
                  width: s.size,
                  height: s.size,
                  filter: s.glow ? "drop-shadow(0 0 6px currentColor)" : "none",
                }}
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: [0, s.peak, s.peak * 0.4, 0], scale: [0.4, 1.1, 0.85, 0.4] }}
                transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
              >
                <path d="M12 2c.4 3.6 1.4 6.4 5 7-3.6.6-4.6 3.4-5 7-.4-3.6-1.4-6.4-5-7 3.6-.6 4.6-3.4 5-7z" />
              </motion.svg>
            ))}

            {/* Shooting star 1: from upper-right to lower-left */}
            <motion.div
              className="absolute"
              style={{ top: "10%", left: "65%" }}
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 0.85, 0.85, 0],
                x: [0, -200, -700],
                y: [0, 100, 350],
              }}
              transition={{
                duration: 1.4,
                delay: 5,
                repeatDelay: 13,
                repeat: Infinity,
                ease: "easeIn",
                times: [0, 0.1, 0.9, 1],
              }}
            >
              <svg width="100" height="50" viewBox="0 0 100 50" aria-hidden="true">
                <defs>
                  <linearGradient id="bedtime-meteor-tail-1" x1="0.95" y1="0.05" x2="0.25" y2="0.75">
                    <stop offset="0%" stopColor="rgb(var(--meteor-color))" stopOpacity="0" />
                    <stop offset="100%" stopColor="rgb(var(--meteor-color))" stopOpacity="0.95" />
                  </linearGradient>
                </defs>
                <line x1="95" y1="5" x2="25" y2="40" stroke="url(#bedtime-meteor-tail-1)" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="25" cy="40" r="2.5" fill="rgb(var(--meteor-color))" style={{ filter: "drop-shadow(0 0 4px var(--meteor-glow))" }} />
              </svg>
            </motion.div>

            {/* Shooting star 2: offset timing, smaller, from upper-right */}
            <motion.div
              className="absolute"
              style={{ top: "22%", left: "88%" }}
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 0.7, 0.7, 0],
                x: [0, -160, -550],
                y: [0, 80, 280],
              }}
              transition={{
                duration: 1.2,
                delay: 12,
                repeatDelay: 15,
                repeat: Infinity,
                ease: "easeIn",
                times: [0, 0.1, 0.9, 1],
              }}
            >
              <svg width="80" height="40" viewBox="0 0 100 50" aria-hidden="true">
                <defs>
                  <linearGradient id="bedtime-meteor-tail-2" x1="0.95" y1="0.05" x2="0.25" y2="0.75">
                    <stop offset="0%" stopColor="rgb(var(--meteor-color))" stopOpacity="0" />
                    <stop offset="100%" stopColor="rgb(var(--meteor-color))" stopOpacity="0.9" />
                  </linearGradient>
                </defs>
                <line x1="95" y1="5" x2="25" y2="40" stroke="url(#bedtime-meteor-tail-2)" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="25" cy="40" r="2" fill="rgb(var(--meteor-color))" style={{ filter: "drop-shadow(0 0 3px var(--meteor-glow))" }} />
              </svg>
            </motion.div>
          </div>
        )}

        <div className="mb-10 flex justify-start">
          <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
            <BedtimeStoryBreadcrumb
              homeText={t("ui.breadcrumb_home")}
              currentText={t("ui.breadcrumb_current")}
            />
          </div>
        </div>

        <div className="mx-auto max-w-2xl text-center mb-10 sm:mb-14 lg:mb-18">
          {/* Double-bezel icon container with breathing glow */}
          <div className="group flex justify-center mb-6">
            <div className="relative rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 dark:bg-white/[0.015]">
              <div className="flex size-12 items-center justify-center rounded-xl bg-orange-500/10 relative">
                {!reduceMotion && (
                  <div className="absolute inset-0 rounded-xl bg-orange-500/20 blur-md group-hover:animate-moon-glow" aria-hidden="true" />
                )}
                <Moon className="size-6 text-orange-600 dark:text-orange-400 relative" />
              </div>
            </div>
          </div>

          {/* Eyebrow badge (no status dot) */}
          <span className="inline-flex items-center rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-5">
            AI Storyteller
          </span>

          {/* Title with italic gradient on "Bedtime Story" */}
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.08] mt-4 pb-1">
            <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 dark:from-orange-400 dark:via-orange-300 dark:to-amber-300">
              Bedtime Story
            </span>
            {" "}Generator
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground/65 leading-relaxed font-light max-w-xl mx-auto mt-5">
            {t("ui.subtitle")}
          </p>

          {/* Theme pills */}
          {section?.ui?.theme_pills?.length ? (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              {section.ui.theme_pills.map((pill: string, i: number) => (
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
                      {t("ui.age_group")}
                    </Label>
                    <Select value={ageGroup} onValueChange={setAgeGroup}>
                      <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ageGroups.map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                      {t("ui.story_theme")}
                    </Label>
                    <Select value={storyTheme} onValueChange={setStoryTheme}>
                      <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {storyThemes.map(([key, label]) => (
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
                  <CollapsibleContent className="pt-4 space-y-3 data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up overflow-hidden">
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
                    <div className="space-y-2">
                      <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                        {t("ui.ending_mood")}
                      </Label>
                      <Select value={endingMood} onValueChange={setEndingMood}>
                        <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {endingMoods.map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                        {t("ui.moral_lesson")}
                      </Label>
                      <Select value={moralLesson} onValueChange={setMoralLesson}>
                        <SelectTrigger className="h-9 bg-muted/50 border-border/50 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {moralLessons.map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                        {t("ui.child_name")}
                      </Label>
                      <Input
                        value={childName}
                        onChange={(event) => setChildName(event.target.value)}
                        placeholder={t("placeholders.child_name")}
                        className="h-9 bg-muted/50 border-border/50 rounded-lg"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              <div className="pt-6 lg:mt-auto">
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
                      <Moon className="w-5 h-5 mr-2 group-hover:animate-moon-glow" />
                      {selectedModel === "creative" && creativeQuota.anonymousCreativeExhausted
                        ? "Sign in to continue"
                        : t("ui.generate_button")}
                    </>
                  )}
                </Button>
                <GeneratorShortcutHints className="mt-3" />
                <CreativeQuotaHint
                  pageKey="bedtime-story-generator"
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
            className="relative h-[720px] max-h-[75vh] md:max-h-[60vh] lg:max-h-[75vh] min-h-[380px] sm:min-h-[520px] lg:sticky lg:top-24"
          >
            <div className="absolute inset-0 bg-orange-500/5 rounded-[2rem] blur-2xl -z-10" />

            <div
              className={cn(
                "h-full rounded-[2rem] border border-border backdrop-blur-xl overflow-hidden transition-all duration-500 flex flex-col card-hover-lift",
                generatedStory
                  ? "bg-card/80 shadow-2xl shadow-orange-500/10"
                  : "bg-card/40 shadow-xl border-dashed"
              )}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                    <BookOpen className="w-5 h-5" />
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
                      sourceCategory="bedtime"
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
                          {!reduceMotion && (
                            <motion.div
                              className="absolute inset-0 rounded-full bg-orange-500/15 blur-md"
                              animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.1, 0.9] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            />
                          )}
                          <Moon className="absolute inset-0 m-auto w-7 h-7 text-orange-500" />
                        </div>
                        <p className="text-sm font-medium">{t("output.generating_message")}</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-w-xs mx-auto">
                        <div className="relative w-20 h-20 mx-auto">
                          {!reduceMotion && (
                            <>
                              <motion.svg
                                className="absolute text-orange-400/40"
                                style={{ left: "8%", top: "5%", width: 14, height: 14 }}
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                                animate={{ opacity: [0.2, 0.7, 0.2], scale: [0.7, 1, 0.7] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                              >
                                <path d="M12 2c.4 3.6 1.4 6.4 5 7-3.6.6-4.6 3.4-5 7-.4-3.6-1.4-6.4-5-7 3.6-.6 4.6-3.4 5-7z" />
                              </motion.svg>
                              <motion.svg
                                className="absolute text-orange-400/40"
                                style={{ right: "10%", top: "20%", width: 10, height: 10 }}
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                                animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.7, 1, 0.7] }}
                                transition={{ duration: 5, delay: 1.2, repeat: Infinity, ease: "easeInOut" }}
                              >
                                <path d="M12 2c.4 3.6 1.4 6.4 5 7-3.6.6-4.6 3.4-5 7-.4-3.6-1.4-6.4-5-7 3.6-.6 4.6-3.4 5-7z" />
                              </motion.svg>
                            </>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 bg-orange-500/5 rounded-2xl flex items-center justify-center rotate-3">
                              <Moon className="w-7 h-7 text-orange-400/70" />
                            </div>
                          </div>
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
        sourcePage="bedtime-story-generator"
      />
    </div>
  );
}
