"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  BookOpen,
  ChevronDown,
  Copy,
  GraduationCap,
  Library,
  Palette,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Icon from "@/components/icon";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import type { LiteratureReviewGenerate as LiteratureReviewGenerateType } from "@/types/blocks/literature-review-generate";
import LiteratureReviewBreadcrumb from "./breadcrumb";
import { useRouter } from "@/i18n/navigation";
import { getContinueActionLabel, shouldGateAnonymousContinue } from "@/components/ai-write/workbench/_lib";
import { buildContinueIntentPayload, buildContinueTrackingPayload, CONTINUE_INTENT_KEY, GENERATOR_PREFILL_KEY } from "@/components/ai-write/workbench/continue-intent";
import { useAppContext } from "@/contexts/app";
import { useOpenPanel } from "@openpanel/nextjs";
import { useCreativeQuotaPage } from "@/hooks/useCreativeQuotaPage";
import { CreativeQuotaHint } from "@/components/blocks/creative-quota-hint";
import { CreativeQuotaPaywall } from "@/components/blocks/creative-quota-paywall";
import CompletionGuide from "@/components/story/completion-guide";
import { ACTIVATION_EVENTS, buildActivationTrackingPayload } from "@/lib/activation-funnel";

const DRAFT_KEY = "literature-review-generator:topic";
const TOPIC_LIMIT = 300;

function calculateWordCount(text: string): number {
  if (!text?.trim()) return 0;
  const cjkRegex = /[一-鿿㐀-䶿豈-﫿぀-ゟ゠-ヿ가-힯]/g;
  const cjkCount = (text.match(cjkRegex) || []).length;
  const withoutCJK = text.replace(cjkRegex, " ").trim();
  const englishCount = withoutCJK ? withoutCJK.split(/\s+/).filter(Boolean).length : 0;
  return cjkCount + englishCount;
}

interface LiteratureReviewGenerateProps {
  section?: LiteratureReviewGenerateType;
}

type GeneratorOptions = {
  topic: string;
  researchQuestion: string;
  assignmentBrief: string;
  discipline: string;
  themesOrSources: string;
  academicLevel: string;
  reviewLength: string;
  tone: string;
  model: string;
  locale: string;
};

export default function LiteratureReviewGenerate({ section }: LiteratureReviewGenerateProps) {
  const locale = useLocale();
  const router = useRouter();
  const creativeQuota = useCreativeQuotaPage("literature-review-generator");
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
        icon: <Zap className="h-4 w-4" />,
        description: t("ai_models.fast_description"),
      },
      {
        id: "standard",
        name: t("ai_models.standard"),
        icon: <Sparkles className="h-4 w-4" />,
        description: t("ai_models.standard_description"),
      },
      {
        id: "creative",
        name: t("ai_models.creative"),
        icon: <Palette className="h-4 w-4" />,
        description: t("ai_models.creative_description"),
      },
    ],
    [t]
  );

  const academicLevels = useMemo(() => Object.entries(section?.academic_levels || {}), [section]);
  const reviewLengths = useMemo(() => Object.entries(section?.review_lengths || {}), [section]);
  const tones = useMemo(() => Object.entries(section?.tones || {}), [section]);
  const valuePoints = useMemo(() => section?.ui?.value_points || [], [section]);
  const randomTopics = useMemo(() => section?.random_prompts || [], [section]);

  const [topic, setTopic] = useState("");
  const [researchQuestion, setResearchQuestion] = useState("");
  const [assignmentBrief, setAssignmentBrief] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [themesOrSources, setThemesOrSources] = useState("");
  const [academicLevel, setAcademicLevel] = useState("undergraduate");
  const [reviewLength, setReviewLength] = useState("medium");
  const [tone, setTone] = useState("neutral");
  const [selectedModel, setSelectedModel] = useState("standard");
  const [selectedLanguage, setSelectedLanguage] = useState(locale);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReview, setGeneratedReview] = useState("");

  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const topicRef = useRef<HTMLTextAreaElement | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const outputScrollRef = useRef<HTMLDivElement | null>(null);

  const latestOptionsRef = useRef<GeneratorOptions>({
    topic: "",
    researchQuestion: "",
    assignmentBrief: "",
    discipline: "",
    themesOrSources: "",
    academicLevel: "undergraduate",
    reviewLength: "medium",
    tone: "neutral",
    model: "standard",
    locale,
  });

  useEffect(() => {
    latestOptionsRef.current = {
      topic,
      researchQuestion,
      assignmentBrief,
      discipline,
      themesOrSources,
      academicLevel,
      reviewLength,
      tone,
      model: selectedModel,
      locale: selectedLanguage,
    };
  }, [topic, researchQuestion, assignmentBrief, discipline, themesOrSources, academicLevel, reviewLength, tone, selectedModel, selectedLanguage]);

  useDraftAutoSave({
    key: `${DRAFT_KEY}:${locale}`,
    value: topic,
    onRestore: (draft) => setTopic(draft),
  });

  useEffect(() => {
    if (!isGenerating || !generatedReview) return;
    const container = outputScrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [generatedReview, isGenerating]);

  const handleRandomTopic = useCallback(() => {
    if (!randomTopics.length) return;
    const randomIndex = Math.floor(Math.random() * randomTopics.length);
    setTopic(randomTopics[randomIndex]);
    toast.success(t("success.random_topic_selected"));
    setTimeout(() => topicRef.current?.focus(), 50);
  }, [randomTopics, t]);

  const handleGenerate = useCallback(() => {
    if (!topic.trim()) {
      toast.error(t("validation.enter_topic"));
      topicRef.current?.focus();
      return;
    }
    if (topic.trim().length > TOPIC_LIMIT) {
      toast.error(t("validation.topic_too_long"));
      topicRef.current?.focus();
      return;
    }
    if (!selectedModel) {
      toast.error(t("validation.select_model"));
      return;
    }
    if (
      creativeQuota.guardAnonymousCreativeQuota({
        selectedModel,
        message: t("errors.generation_failed"),
      }) || creativeQuota.guardCreativeCreditQuota({ selectedModel })
    ) {
      return;
    }
    setGeneratedReview("");
    setIsGenerating(true);
    track(
      ACTIVATION_EVENTS.generationStarted,
      buildActivationTrackingPayload({
        sourcePage: "literature-review-generator",
        loggedIn: !!user,
        action: "generation_started",
        model: selectedModel,
      })
    );
    turnstileRef.current?.execute();
  }, [creativeQuota, selectedModel, t, topic, track, user]);

  const handleTurnstileSuccess = useCallback(
    async (turnstileToken: string) => {
      const opts = latestOptionsRef.current;

      try {
        const response = await fetch("/api/literature-review-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: opts.topic.trim(),
            researchQuestion: opts.researchQuestion.trim(),
            assignmentBrief: opts.assignmentBrief.trim(),
            discipline: opts.discipline.trim(),
            themesOrSources: opts.themesOrSources.trim(),
            academicLevel: opts.academicLevel,
            reviewLength: opts.reviewLength,
            tone: opts.tone,
            model: opts.model,
            locale: opts.locale,
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
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim().startsWith('0:"')) continue;
            try {
              const content = line
                .slice(3, -1)
                .replace(/\\n/g, "\n")
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, "\\");
              accumulatedContent += content;
              setGeneratedReview(accumulatedContent);
            } catch (error) {
              console.error("Parse error:", error);
            }
          }
        }

        if (accumulatedContent.trim()) {
          if (opts.model === "creative") creativeQuota.increment();
          StoryStorage.saveStory({
            title: (opts.topic.trim() || "Literature Review").slice(0, 30),
            prompt: opts.topic.trim(),
            content: accumulatedContent.trim(),
            wordCount: calculateWordCount(accumulatedContent),
            model: AI_MODELS.find((item) => item.id === opts.model)?.name || "AI",
            genre: "Literature Review",
          });
          toast.success(t("success.review_generated"));
          track(
            ACTIVATION_EVENTS.generationSucceeded,
            buildActivationTrackingPayload({
              sourcePage: "literature-review-generator",
              loggedIn: !!user,
              action: "generation_succeeded",
              model: opts.model,
              wordCount: calculateWordCount(accumulatedContent),
            })
          );
          setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 250);
        }
      } catch (error) {
        console.error("Literature review generation error:", error);
        toast.error(t("errors.generation_failed"));
        track(
          ACTIVATION_EVENTS.generationFailed,
          buildActivationTrackingPayload({
            sourcePage: "literature-review-generator",
            loggedIn: !!user,
            action: "generation_failed",
            model: opts.model,
          })
        );
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

  const wordCount = useMemo(() => calculateWordCount(generatedReview), [generatedReview]);

  const handleCopy = useCallback(() => {
    if (!generatedReview) return;
    navigator.clipboard.writeText(generatedReview);
    toast.success(t("success.review_copied"));
    track(
      ACTIVATION_EVENTS.resultCopied,
      buildActivationTrackingPayload({
        sourcePage: "literature-review-generator",
        loggedIn: !!user,
        action: "result_copied",
        wordCount,
      })
    );
  }, [generatedReview, t, track, user, wordCount]);

  const handleContinueInAiWrite = useCallback(() => {
    if (!generatedReview.trim()) return;
    track("continue_ai_write_cta_click", buildContinueTrackingPayload({ source_page: "literature-review-generator", logged_in: !!user, cta_variant: user ? "continue_ai_write" : "sign_in_to_continue_ai_write" }));
    const payload = buildContinueIntentPayload({ source: "literature-review-generator", title: topic, content: generatedReview });
    if (shouldGateAnonymousContinue({ hasUser: !!user, hasGeneratedContent: !!generatedReview.trim() })) {
      try {
        window.localStorage.setItem(CONTINUE_INTENT_KEY, JSON.stringify(payload));
        window.localStorage.setItem(GENERATOR_PREFILL_KEY, JSON.stringify(payload.prefill));
      } catch {}
      track("sign_modal_open_for_continue", buildContinueTrackingPayload({ source_page: "literature-review-generator" }));
      setSignModalContext({ mode: "continue-ai-write", source: payload.source, redirectTo: payload.redirectTo });
      requireAuth({ source: "ai_write", action: "continue_writing", sourcePage: "literature-review-generator" });
      return;
    }
    try { window.localStorage.setItem(GENERATOR_PREFILL_KEY, JSON.stringify(payload.prefill)); } catch {}
    router.push(payload.redirectTo as any);
  }, [generatedReview, topic, router, user, track, setSignModalContext, requireAuth]);

  const handleCreateAnother = useCallback(() => {
    if (generatedReview) {
      track("result_regenerated", buildActivationTrackingPayload({
        sourcePage: "literature-review-generator",
        loggedIn: !!user,
        action: "result_regenerated",
      }));
    }
    setGeneratedReview("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => topicRef.current?.focus(), 400);
  }, [generatedReview, track, user]);

  const handleSaveLocally = useCallback(() => {
    const content = generatedReview.trim();
    if (!content) return;
    try {
      const rawTitle = topic.trim() || "Literature Review";
      const title = rawTitle.length > 30 ? `${rawTitle.slice(0, 30)}...` : rawTitle;
      StoryStorage.saveStory({ title, prompt: topic.trim(), content, wordCount, model: AI_MODELS.find((m) => m.id === selectedModel)?.name || "AI", genre: "Literature Review" });
      toast.success(t("success.saved_locally"));
    } catch (err) {
      console.error("Failed to save literature review locally:", err);
    }
  }, [AI_MODELS, generatedReview, selectedModel, t, topic, wordCount]);

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
    if (!generatedReview) return;
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadTextFile(generatedReview, `literature-review-${ts}.md`, "text/markdown;charset=utf-8");
  }, [downloadTextFile, generatedReview]);

  const handleExportTxt = useCallback(() => {
    if (!generatedReview) return;
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadTextFile(markdownToPlainText(generatedReview), `literature-review-${ts}.txt`, "text/plain;charset=utf-8");
  }, [downloadTextFile, markdownToPlainText, generatedReview]);

  useGeneratorShortcuts({
    onGenerate: handleGenerate,
    onFocusInput: () => topicRef.current?.focus(),
  });

  return (
    <div id="literature_review_generator" className="relative bg-background text-foreground">
      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={handleTurnstileSuccess}
        onError={handleTurnstileError}
      />

      <main className="relative container max-w-6xl mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="mb-8 flex justify-start">
          <div className="inline-flex items-center rounded-full border border-border/30 bg-background px-4 py-1.5 text-xs text-muted-foreground">
            <LiteratureReviewBreadcrumb
              homeText={t("ui.breadcrumb_home")}
              currentText={t("ui.breadcrumb_current")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-14 items-start">
          {/* 左栏:价值主张 + 学术诚信说明(server-translated,静态渲染) */}
          <div className="lg:sticky lg:top-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/[0.05] px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-amber-700 dark:text-amber-400">
              <GraduationCap className="size-3.5" />
              {t("ui.eyebrow")}
            </span>

            <h1 className="mt-5 font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] text-foreground">
              <span className="italic text-amber-700 dark:text-amber-400">{t("ui.title_accent")}</span>{" "}
              <span>{t("ui.title")}</span>
            </h1>

            <div className="mt-4 h-px w-24 bg-amber-500/40" aria-hidden="true" />

            <p className="mt-5 text-base leading-relaxed text-muted-foreground/80 font-light">
              {t("ui.subtitle")}
            </p>

            {/* 编号价值点:细分割线 + 小节编号,editorial 文档感 */}
            <div className="mt-8 divide-y divide-border/40 border-y border-border/40">
              {valuePoints.map((point: { title: string; description: string }, i: number) => (
                <div key={i} className="flex gap-4 py-5">
                  <span className="font-display text-sm font-semibold text-amber-600/80 dark:text-amber-400/80 tabular-nums pt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">{point.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground/75">{point.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 学术诚信说明 */}
            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                <ShieldCheck className="size-4" />
                {t("ui.integrity_note_title")}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground/80">
                {t("ui.integrity_note")}
              </p>
            </div>
          </div>

          {/* 右栏:纸面表单 */}
          <div className="rounded-3xl border border-border/50 bg-card shadow-sm">
            <div className="border-b border-border/40 px-6 sm:px-8 py-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <BookOpen className="size-5" />
              </div>
              <span className="text-sm font-semibold text-foreground">{t("ui.eyebrow")}</span>
            </div>

            <div className="px-6 sm:px-8 py-6 space-y-6 sm:border-l-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="lr-topic" className="text-sm font-semibold text-foreground">
                    {t("ui.topic_label")} <span className="text-amber-600 dark:text-amber-400">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRandomTopic}
                      className="h-7 text-xs gap-1.5 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 px-2.5 rounded-full"
                    >
                      <Wand2 className="w-3 h-3" />
                      {t("ui.random_button")}
                    </Button>
                    <span className={cn("text-[11px] tabular-nums", topic.length > TOPIC_LIMIT ? "text-red-500" : "text-muted-foreground/60")}>
                      {topic.length}/{TOPIC_LIMIT}
                    </span>
                  </div>
                </div>
                <Textarea
                  id="lr-topic"
                  ref={topicRef}
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder={t("placeholders.topic")}
                  className="min-h-[100px] resize-none bg-background border-border/50 border-l-2 border-l-amber-500/30 focus-visible:border-amber-500/50 focus-visible:ring-amber-500/20 rounded-xl p-4 text-base leading-relaxed transition-all"
                />
                <p className="text-xs text-muted-foreground/60">{t("ui.topic_hint")}</p>
              </div>

              <div className="h-px bg-border/40" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                    {t("ui.ai_model")}
                  </Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="h-9 w-full bg-background border-border/50 rounded-lg">
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
                    <SelectTrigger className="h-9 w-full bg-background border-border/50 rounded-lg">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                    {t("ui.academic_level")}
                  </Label>
                  <Select value={academicLevel} onValueChange={setAcademicLevel}>
                    <SelectTrigger className="h-9 w-full bg-background border-border/50 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {academicLevels.map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                    {t("ui.review_length")}
                  </Label>
                  <Select value={reviewLength} onValueChange={setReviewLength}>
                    <SelectTrigger className="h-9 w-full bg-background border-border/50 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reviewLengths.map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                    {t("ui.tone")}
                  </Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="h-9 w-full bg-background border-border/50 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tones.map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 可选:研究问题 / 作业要求 / 学科 / 主题与文献 */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full flex justify-between items-center p-0 h-auto hover:bg-transparent text-xs font-medium text-muted-foreground hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Settings2 className="w-3.5 h-3.5" />
                      {t("ui.advanced_options")}
                    </span>
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showAdvanced && "rotate-180")} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4 data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up overflow-hidden">
                  <div className="space-y-2">
                    <Label htmlFor="lr-question" className="text-xs font-medium tracking-wide text-muted-foreground">
                      {t("ui.research_question_label")}
                    </Label>
                    <Input
                      id="lr-question"
                      value={researchQuestion}
                      onChange={(event) => setResearchQuestion(event.target.value)}
                      placeholder={t("placeholders.research_question")}
                      className="h-10 bg-background border-border/50 focus-visible:border-amber-500/50 focus-visible:ring-amber-500/20 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lr-brief" className="text-xs font-medium tracking-wide text-muted-foreground">
                      {t("ui.assignment_brief_label")}
                    </Label>
                    <Textarea
                      id="lr-brief"
                      value={assignmentBrief}
                      onChange={(event) => setAssignmentBrief(event.target.value)}
                      placeholder={t("placeholders.assignment_brief")}
                      className="min-h-[70px] resize-none bg-background border-border/50 focus-visible:border-amber-500/50 focus-visible:ring-amber-500/20 rounded-lg p-3 text-sm leading-relaxed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lr-discipline" className="text-xs font-medium tracking-wide text-muted-foreground">
                      {t("ui.discipline_label")}
                    </Label>
                    <Input
                      id="lr-discipline"
                      value={discipline}
                      onChange={(event) => setDiscipline(event.target.value)}
                      placeholder={t("placeholders.discipline")}
                      className="h-10 bg-background border-border/50 focus-visible:border-amber-500/50 focus-visible:ring-amber-500/20 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lr-sources" className="text-xs font-medium tracking-wide text-muted-foreground">
                      {t("ui.themes_sources_label")}
                    </Label>
                    <Textarea
                      id="lr-sources"
                      value={themesOrSources}
                      onChange={(event) => setThemesOrSources(event.target.value)}
                      placeholder={t("placeholders.themes_sources")}
                      className="min-h-[110px] resize-none bg-background border-border/50 border-l-2 border-l-amber-500/20 focus-visible:border-amber-500/50 focus-visible:ring-amber-500/20 rounded-lg p-3 text-sm leading-relaxed"
                    />
                    <p className="text-xs text-muted-foreground/60">{t("ui.themes_sources_hint")}</p>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="pt-2">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="group w-full min-h-12 h-auto whitespace-normal py-3 text-base bg-amber-600 font-semibold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 active:scale-[0.98] disabled:opacity-60 dark:bg-amber-500 dark:text-[oklch(0.20_0.02_55)] dark:shadow-amber-500/20 dark:hover:bg-amber-400"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 shrink-0 animate-spin" />
                      {t("ui.generating")}
                    </>
                  ) : (
                    <>
                      <Library className="w-5 h-5 mr-2 shrink-0" />
                      {selectedModel === "creative" && creativeQuota.anonymousCreativeExhausted
                        ? t("ui.sign_in_to_continue")
                        : t("ui.generate_button")}
                    </>
                  )}
                </Button>
                <GeneratorShortcutHints className="mt-3" />
                <CreativeQuotaHint
                  pageKey="literature-review-generator"
                  selectedModel={selectedModel}
                  used={creativeQuota.used}
                  className="mt-3"
                />
                {/* 生成按钮旁的披露:AI 文本需核查;未提供来源则不声称引用 */}
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground/70">
                  {t("ui.disclosure")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 结果面:流式草稿 + Evidence to Verify 警示 */}
        <div ref={resultRef} className="mt-12 scroll-mt-24">
          <div
            className={cn(
              "rounded-3xl border overflow-hidden transition-colors duration-300 flex flex-col",
              generatedReview
                ? "border-border/50 bg-card shadow-sm"
                : "border-dashed border-border/50 bg-card/40"
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 px-6 sm:px-8 py-4 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  <Library className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{t("output.title")}</span>
                  {generatedReview && (
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                      {wordCount} {t("output.words")}
                    </span>
                  )}
                </div>
              </div>
              {generatedReview && !isGenerating && (
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
                </div>
              )}
            </div>

            <div ref={outputScrollRef} className="max-h-[70vh] overflow-y-auto p-6 sm:p-8 custom-scrollbar">
              {generatedReview ? (
                <article className="prose prose-slate dark:prose-invert prose-lg max-w-none leading-relaxed prose-headings:font-semibold prose-p:text-slate-700 dark:prose-p:text-slate-300">
                  <ReactMarkdown>{generatedReview}</ReactMarkdown>
                </article>
              ) : (
                <div className="h-56 flex flex-col items-center justify-center text-center opacity-60">
                  {isGenerating ? (
                    <div className="space-y-5">
                      <div className="relative mx-auto w-14 h-14">
                        <div className="absolute inset-0 rounded-full border-4 border-amber-500/20" />
                        <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 animate-spin" />
                      </div>
                      <p className="text-sm font-medium animate-pulse">{t("output.generating_message")}</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-sm mx-auto">
                      <div className="w-14 h-14 mx-auto bg-amber-500/5 rounded-2xl flex items-center justify-center">
                        <Library className="w-7 h-7 text-amber-500/50" />
                      </div>
                      <p className="text-muted-foreground text-sm">{t("output.empty_message")}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Evidence to Verify:与草稿正文分离的常驻警示 */}
            {generatedReview && !isGenerating && (
              <div className="border-t border-amber-500/20 bg-amber-500/[0.04] px-6 sm:px-8 py-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                      {t("output.evidence_warning_title")}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground/80">
                      {t("output.evidence_warning")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {generatedReview && !isGenerating && (
            <CompletionGuide
              translations={section?.completion_guide}
              onCreateAnother={handleCreateAnother}
              onSave={handleSaveLocally}
              onContinue={handleContinueInAiWrite}
              continueLabel={getContinueActionLabel({ hasUser: !!user, locale })}
            />
          )}
        </div>
      </main>
      <CreativeQuotaPaywall
        open={creativeQuota.paywallOpen}
        onClose={() => creativeQuota.setPaywallOpen(false)}
        sourcePage="literature-review-generator"
      />
    </div>
  );
}
