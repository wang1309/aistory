"use client";

import GeneratorNavTabs from "@/components/generator-nav-tabs";
import Icon from "@/components/icon";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { useLocale } from "next-intl";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { LANGUAGE_OPTIONS } from "@/lib/language-options";
import { StoryStorage } from "@/lib/story-storage";
import {
  BookOpen,
  ChevronDown,
  Copy,
  Palette,
  RefreshCw,
  Settings2,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import TurnstileInvisible, {
  TurnstileInvisibleHandle,
} from "@/components/TurnstileInvisible";
import CompletionGuide from "@/components/story/completion-guide";
import StorySaveDialog from "@/components/story/story-save-dialog";
import { useCreativeQuotaPage } from "@/hooks/useCreativeQuotaPage";
import { CreativeQuotaHint } from "@/components/blocks/creative-quota-hint";
import { CreativeQuotaPaywall } from "@/components/blocks/creative-quota-paywall";
import { getCreativeQuotaLimitReachedMessage } from "@/lib/creative-quota-core";
import { useAppContext } from "@/contexts/app";
import { useRouter } from "@/i18n/navigation";
import type { StoryStatus } from "@/models/story";
import {
  buildContinueIntentPayload,
  CONTINUE_INTENT_KEY,
  GENERATOR_PREFILL_KEY,
} from "@/components/ai-write/workbench/continue-intent";
import {
  consumePendingAuthResume,
  writePendingAuthResume,
} from "@/lib/auth-resume";
import {
  getContinueActionLabel,
  shouldGateAnonymousContinue,
} from "@/components/ai-write/workbench/_lib";
import type { GenreStoryGenerator } from "@/lib/genre-story-generators";
import type { GenreStoryGenerateSection } from "@/types/blocks/genre-story-generate";

function calculateWordCount(text: string): number {
  if (!text || !text.trim()) return 0;
  const trimmed = text.trim();
  const cjkRegex =
    /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/gu;
  const cjkCount = trimmed.match(cjkRegex)?.length ?? 0;
  const withoutCJK = trimmed.replace(cjkRegex, " ").trim();
  const englishCount = withoutCJK
    ? withoutCJK.split(/\s+/).filter(Boolean).length
    : 0;
  return cjkCount + englishCount;
}

function firstOption(options: Record<string, string>, fallback: string): string {
  return options[fallback] ? fallback : Object.keys(options)[0] || fallback;
}

function parseProtocolLine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("0:")) return null;
  try {
    const parsed = JSON.parse(trimmed.slice(2));
    return typeof parsed === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export default function GenreStoryGenerate({
  generator,
  section,
}: {
  generator: GenreStoryGenerator;
  section: GenreStoryGenerateSection;
}) {
  const locale = useLocale();
  const router = useRouter();
  const { user, requireAuth, setSignModalContext } = useAppContext();
  const creativeQuota = useCreativeQuotaPage(generator.pageKey);

  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("standard");
  const [selectedLanguage, setSelectedLanguage] = useState(() =>
    LANGUAGE_OPTIONS.some((option) => option.code === locale) ? locale : "en"
  );
  const [length, setLength] = useState(generator.defaultLength);
  const [tone, setTone] = useState(() =>
    firstOption(section.common_fields.tone.options, "neutral")
  );
  const [perspective, setPerspective] = useState(() =>
    firstOption(section.common_fields.perspective.options, "third_person_limited")
  );
  const [audience, setAudience] = useState(() =>
    firstOption(section.common_fields.audience.options, "adult")
  );
  const [options, setOptions] = useState<Record<string, string>>(() => ({
    ...generator.defaultOptions,
  }));
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSavingStory, setIsSavingStory] = useState(false);
  const [hasSavedCurrentStory, setHasSavedCurrentStory] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const turnstileTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const generatorRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  const activeQuota = creativeQuota.forModel(selectedModel);
  const wordCount = useMemo(
    () => calculateWordCount(generatedStory),
    [generatedStory]
  );

  const aiModels = useMemo(
    () => [
      {
        id: "fast",
        name: section.ai_models.fast,
        description: section.ai_models.fast_description,
        icon: <Zap className="size-4" />,
      },
      {
        id: "standard",
        name: section.ai_models.standard,
        description: section.ai_models.standard_description,
        icon: <Sparkles className="size-4" />,
      },
      {
        id: "creative",
        name: section.ai_models.creative,
        description: section.ai_models.creative_description,
        icon: <Palette className="size-4" />,
      },
    ],
    [section.ai_models]
  );

  const genreFields = useMemo(
    () =>
      section.genre_fields.filter((field) =>
        generator.optionKeys.includes(field.key)
      ),
    [generator.optionKeys, section.genre_fields]
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (turnstileTimeoutRef.current) {
        clearTimeout(turnstileTimeoutRef.current);
        turnstileTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const resume = consumePendingAuthResume("save_story", {
      sourcePage: generator.pageKey,
    });
    if (!resume) return;

    const payload = resume.payload;
    if (typeof payload.prompt === "string") setPrompt(payload.prompt);
    if (typeof payload.generatedStory === "string") {
      setGeneratedStory(payload.generatedStory);
    }
    if (typeof payload.selectedModel === "string") {
      setSelectedModel(payload.selectedModel);
    }
    if (typeof payload.selectedLanguage === "string") {
      setSelectedLanguage(payload.selectedLanguage);
    }
    if (typeof payload.length === "string") setLength(payload.length);
    if (typeof payload.tone === "string") setTone(payload.tone);
    if (typeof payload.perspective === "string") {
      setPerspective(payload.perspective);
    }
    if (typeof payload.audience === "string") setAudience(payload.audience);
    if (
      typeof payload.options === "object" &&
      payload.options !== null &&
      !Array.isArray(payload.options)
    ) {
      setOptions(payload.options as Record<string, string>);
    }

    setHasSavedCurrentStory(false);
    setIsSaveDialogOpen(true);
  }, [generator.pageKey, user]);

  const runGeneration = useCallback(
    async (turnstileToken: string) => {
      if (turnstileTimeoutRef.current) {
        clearTimeout(turnstileTimeoutRef.current);
        turnstileTimeoutRef.current = null;
      }
      setIsGenerating(true);
      setGeneratedStory("");
      setErrorMessage("");
      setHasSavedCurrentStory(false);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/genre-story-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            genre: generator.genre,
            prompt: prompt.trim(),
            model: selectedModel,
            locale,
            outputLanguage: selectedLanguage,
            length,
            tone,
            perspective,
            audience,
            options,
            turnstileToken,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          if (creativeQuota.handleQuotaError(response.status, data)) return;
          const message =
            data && typeof data.message === "string"
              ? data.message
              : section.errors.generation_failed;
          throw new Error(message);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error(section.errors.generation_failed);
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const content = parseProtocolLine(line);
            if (content === null) continue;
            accumulated += content;
            setGeneratedStory(accumulated);
          }
        }

        if (buffer) {
          const content = parseProtocolLine(buffer);
          if (content !== null) {
            accumulated += content;
            setGeneratedStory(accumulated);
          }
        }

        if (!accumulated.trim()) {
          throw new Error(section.errors.generation_failed);
        }

        creativeQuota.increment(selectedModel);
        toast.success(section.success.story_generated);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.65 },
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : section.errors.generation_failed;
        setErrorMessage(message);
        toast.error(message);
      } finally {
        abortRef.current = null;
        setIsGenerating(false);
      }
    },
    [
      audience,
      creativeQuota,
      generator.genre,
      length,
      locale,
      options,
      perspective,
      prompt,
      section.errors.generation_failed,
      section.success.story_generated,
      selectedLanguage,
      selectedModel,
      tone,
    ]
  );

  const handleGenerateClick = useCallback(() => {
    if (!prompt.trim()) {
      toast.error(section.validation.enter_idea);
      return;
    }

    if (
      creativeQuota.guardAnonymousCreativeQuota({
        selectedModel,
        message: getCreativeQuotaLimitReachedMessage(locale),
      })
    ) {
      return;
    }
    if (creativeQuota.guardCreativeCreditQuota({ selectedModel })) {
      return;
    }

    if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      setIsGenerating(true);
      void runGeneration("");
      return;
    }

    if (!turnstileRef.current) {
      toast.error(section.validation.verification_failed || section.errors.generation_failed);
      return;
    }

    // Show the loading state immediately, before Turnstile finishes.
    setIsGenerating(true);
    if (turnstileTimeoutRef.current) {
      clearTimeout(turnstileTimeoutRef.current);
    }
    turnstileTimeoutRef.current = setTimeout(() => {
      turnstileTimeoutRef.current = null;
      setIsGenerating(false);
      toast.error(section.validation.verification_failed || section.errors.generation_failed);
    }, 15000);

    try {
      turnstileRef.current.execute();
    } catch {
      if (turnstileTimeoutRef.current) {
        clearTimeout(turnstileTimeoutRef.current);
        turnstileTimeoutRef.current = null;
      }
      setIsGenerating(false);
      toast.error(section.validation.verification_failed || section.errors.generation_failed);
    }
  }, [
    creativeQuota,
    locale,
    prompt,
    runGeneration,
    section.errors.generation_failed,
    section.validation.enter_idea,
    section.validation.verification_failed,
    selectedModel,
  ]);

  const handleRandomPrompt = useCallback(() => {
    if (!section.random_prompts.length) return;
    const next =
      section.random_prompts[
        Math.floor(Math.random() * section.random_prompts.length)
      ];
    setPrompt(next);
    toast.success(section.success.random_prompt_selected);
  }, [section.random_prompts, section.success.random_prompt_selected]);

  const handleCopy = useCallback(async () => {
    if (!generatedStory.trim()) return;
    try {
      await navigator.clipboard.writeText(generatedStory);
      toast.success(section.success.story_copied);
    } catch {
      toast.error(section.errors.generation_failed);
    }
  }, [
    generatedStory,
    section.errors.generation_failed,
    section.success.story_copied,
  ]);

  const handleCreateAnother = useCallback(() => {
    setGeneratedStory("");
    setErrorMessage("");
    setHasSavedCurrentStory(false);
    controlsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleSaveClick = useCallback(() => {
    const content = generatedStory.trim();
    if (!content) {
      toast.error(section.output.empty);
      return;
    }

    const title = (prompt.trim() || "Untitled story").slice(0, 30);

    try {
      StoryStorage.saveStory({
        title,
        prompt: prompt.trim(),
        content,
        wordCount,
        model: selectedModel,
        genre: generator.genre,
        tone,
      });
    } catch {
      // Local storage is best-effort; cloud save can still continue.
    }

    if (!user) {
      writePendingAuthResume({
        source: "story_save",
        action: "save_story",
        sourcePage: generator.pageKey,
        startedAt: Date.now(),
        payload: {
          prompt,
          generatedStory,
          selectedModel,
          selectedLanguage,
          length,
          tone,
          perspective,
          audience,
          options,
        },
      });
      toast.message(section.success.saved_locally);
      requireAuth({
        source: "story_save",
        action: "save_story",
        sourcePage: generator.pageKey,
      });
      return;
    }

    setIsSaveDialogOpen(true);
  }, [
    audience,
    generatedStory,
    generator.genre,
    generator.pageKey,
    length,
    options,
    perspective,
    prompt,
    requireAuth,
    section.output.empty,
    section.success.saved_locally,
    selectedLanguage,
    selectedModel,
    tone,
    user,
    wordCount,
  ]);

  const handleConfirmSave = useCallback(
    async (status: StoryStatus) => {
      const content = generatedStory.trim();
      if (!content) return;

      setIsSavingStory(true);
      try {
        const response = await fetch("/api/stories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: (prompt.trim() || "Untitled story").slice(0, 30),
            prompt: prompt.trim(),
            content,
            wordCount,
            modelUsed: selectedModel,
            settings: {
              locale,
              outputLanguage: selectedLanguage,
              length,
              tone,
              perspective,
              audience,
              options,
              genre: generator.genre,
            },
            status,
            visibility: status === "published" ? "public" : "private",
            sourceCategory: "story",
          }),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok || (data && data.code !== 0)) {
          throw new Error(
            data && typeof data.message === "string"
              ? data.message
              : section.errors.save_failed
          );
        }

        toast.success(section.success.story_generated);
        setHasSavedCurrentStory(true);
        setIsSaveDialogOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : section.errors.save_failed
        );
      } finally {
        setIsSavingStory(false);
      }
    },
    [
      audience,
      generatedStory,
      generator.genre,
      length,
      locale,
      options,
      perspective,
      prompt,
      section.errors.save_failed,
      section.success.story_generated,
      selectedLanguage,
      selectedModel,
      tone,
      wordCount,
    ]
  );

  const handleContinueInAiWrite = useCallback(() => {
    if (!generatedStory.trim()) return;

    const payload = buildContinueIntentPayload({
      source: generator.slug,
      entryMode: user ? "direct" : "post_auth",
      title: prompt,
      content: generatedStory,
    });

    try {
      window.localStorage.setItem(
        CONTINUE_INTENT_KEY,
        JSON.stringify(payload)
      );
      window.localStorage.setItem(
        GENERATOR_PREFILL_KEY,
        JSON.stringify(payload.prefill)
      );
    } catch {
      // Navigation must still work if storage is unavailable.
    }

    if (
      shouldGateAnonymousContinue({
        hasUser: !!user,
        hasGeneratedContent: !!generatedStory.trim(),
      })
    ) {
      setSignModalContext({
        mode: "continue-ai-write",
        source: payload.source,
        redirectTo: payload.redirectTo,
      });
      requireAuth({
        source: "ai_write",
        action: "continue_writing",
        sourcePage: generator.pageKey,
      });
      return;
    }

    router.push(payload.redirectTo as never);
  }, [
    generatedStory,
    generator.pageKey,
    generator.slug,
    prompt,
    requireAuth,
    router,
    setSignModalContext,
    user,
  ]);

  const titleHighlight = section.ui.title_highlight;
  const titleNode = titleHighlight && section.ui.title.includes(titleHighlight) ? (
    <>
      {section.ui.title.slice(0, section.ui.title.indexOf(titleHighlight))}
      <em className="font-display not-italic text-accent-copper">
        {titleHighlight}
      </em>
      {section.ui.title.slice(
        section.ui.title.indexOf(titleHighlight) + titleHighlight.length
      )}
    </>
  ) : (
    section.ui.title
  );

  const genreNumber = String(
    ["horror", "mystery", "sci_fi", "adventure"].indexOf(generator.genre) + 1
  ).padStart(2, "0");

  return (
    <div
      id="genre-story-generator"
      ref={generatorRef}
      className="relative min-h-screen overflow-clip bg-background text-foreground"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.97_0_0),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.17_0_0),transparent)]" />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
          style={{
            backgroundImage: "var(--bg-grid)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-0 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-accent-copper/[0.05] blur-[100px]"
        />
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-primary/[0.04] via-primary/[0.02] to-transparent" />
      </div>

      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={runGeneration}
        onError={() => {
          if (turnstileTimeoutRef.current) {
            clearTimeout(turnstileTimeoutRef.current);
            turnstileTimeoutRef.current = null;
          }
          setIsGenerating(false);
          toast.error(
            section.validation.verification_failed ||
              section.errors.generation_failed
          );
        }}
      />

      <main className="container relative z-10 mx-auto max-w-7xl px-4 py-14 sm:py-18 lg:py-24">
        <header className="relative mx-auto max-w-3xl text-center">
          <div
            aria-hidden="true"
            className="mx-auto flex size-14 items-center justify-center rounded-full border border-border bg-card/70 shadow-[0_0_0_6px_rgba(36,77,61,0.04)] backdrop-blur dark:shadow-[0_0_0_6px_rgba(0,0,0,0.18)]"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-accent-copper/10 text-accent-copper">
              <Icon name={generator.icon} className="size-5" />
            </span>
          </div>

          <div
            aria-hidden="true"
            className="mt-4 flex items-center justify-center gap-3"
          >
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-border" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent-copper">
              {genreNumber} / 04
            </span>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-border" />
          </div>

          <h1 className="mt-5 font-display text-[clamp(2.2rem,5vw,4.2rem)] font-normal leading-[1.02] tracking-[-0.045em]">
            {titleNode}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl font-serif text-[17px] leading-[1.75] text-muted-foreground sm:text-[19px]">
            {section.ui.subtitle}
          </p>

          <div
            aria-hidden="true"
            className="mx-auto mt-6 flex items-center justify-center gap-3"
          >
            <span className="h-px w-12 bg-border" />
            <span className="size-1.5 rotate-45 border border-accent-copper/60" />
            <span className="h-px w-12 bg-border" />
          </div>

          {section.ui.trust_line ? (
            <div className="mt-4 flex justify-center">
              <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3.5 py-1.5 text-center text-[10px] font-semibold uppercase leading-relaxed tracking-[0.14em] text-muted-foreground backdrop-blur">
                <span
                  aria-hidden="true"
                  className="size-1.5 shrink-0 rounded-full bg-accent-copper"
                />
                {section.ui.trust_line}
              </p>
            </div>
          ) : null}
        </header>

        <div className="mt-8">
          <GeneratorNavTabs />
        </div>

        <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div ref={controlsRef} className="space-y-6 lg:sticky lg:top-24">
            <section className="border border-border bg-card p-5 shadow-[8px_9px_0_rgba(36,77,61,0.06)] sm:p-6 dark:shadow-[8px_9px_0_rgba(0,0,0,0.45)]">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="genre-story-idea" className="text-[13px] font-semibold">
                    {section.ui.story_idea}
                  </Label>
                  <button
                    type="button"
                    onClick={handleRandomPrompt}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary transition-colors hover:text-primary/80"
                  >
                    <RefreshCw className="size-3.5" />
                    {section.ui.random_button}
                  </button>
                </div>
                <Textarea
                  id="genre-story-idea"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder={section.placeholders.story_idea}
                  rows={4}
                  maxLength={2000}
                  className="min-h-[112px] resize-y text-[14px] leading-relaxed"
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="flex min-w-0 flex-col gap-2">
                  <Label className="text-[12px] font-semibold">
                    {section.ui.ai_model}
                  </Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aiModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <span className="flex items-center gap-2">
                            {model.icon}
                            {model.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] leading-relaxed text-muted-foreground">
                    {aiModels.find((model) => model.id === selectedModel)?.description}
                  </p>
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                  <Label className="text-[12px] font-semibold">
                    {section.ui.output_language}
                  </Label>
                  <Select
                    value={selectedLanguage}
                    onValueChange={setSelectedLanguage}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((option) => (
                        <SelectItem key={option.code} value={option.code}>
                          {option.flag} {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                  <Label className="text-[12px] font-semibold">
                    {section.common_fields.length.label}
                  </Label>
                  <Select value={length} onValueChange={setLength}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(section.common_fields.length.options).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {genreFields.map((field) => (
                  <div key={field.key} className="flex min-w-0 flex-col gap-2">
                    <Label className="text-[12px] font-semibold">
                      {field.label}
                    </Label>
                    <Select
                      value={options[field.key] || ""}
                      onValueChange={(value) =>
                        setOptions((current) => ({
                          ...current,
                          [field.key]: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(field.options).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {field.description ? (
                      <p className="text-[10px] leading-relaxed text-muted-foreground">
                        {field.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>

              <Collapsible
                open={isAdvancedOpen}
                onOpenChange={setIsAdvancedOpen}
                className="mt-5 border-t border-border pt-4"
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 text-left">
                  <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-foreground">
                    <Settings2 className="size-4 text-primary" />
                    {section.ui.advanced_options}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform",
                      isAdvancedOpen && "rotate-180"
                    )}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="grid grid-cols-1 gap-4 pt-4">
                  {(
                    [
                      ["tone", section.common_fields.tone, tone, setTone],
                      [
                        "perspective",
                        section.common_fields.perspective,
                        perspective,
                        setPerspective,
                      ],
                      [
                        "audience",
                        section.common_fields.audience,
                        audience,
                        setAudience,
                      ],
                    ] as const
                  ).map(([key, field, value, setValue]) => (
                    <div key={key} className="flex flex-col gap-2">
                      <Label className="text-[12px] font-semibold">
                        {field.label}
                      </Label>
                      <Select value={value} onValueChange={setValue}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(field.options).map(([optionValue, label]) => (
                            <SelectItem key={optionValue} value={optionValue}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              <div className="mt-6 flex flex-col items-center gap-3">
                <Button
                  type="button"
                  onClick={handleGenerateClick}
                  disabled={isGenerating}
                  className="h-12 w-full gap-2 rounded-[2px] text-[14px] font-semibold"
                >
                  {isGenerating ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                      {section.ui.generating}
                    </>
                  ) : (
                    <>
                      <Wand2 className="size-4" />
                      {section.ui.generate_button}
                    </>
                  )}
                </Button>
                <CreativeQuotaHint
                  pageKey={generator.pageKey}
                  selectedModel={selectedModel}
                  used={activeQuota?.used ?? 0}
                  limit={activeQuota?.limit}
                  creditCost={activeQuota?.creditCost}
                />
              </div>
            </section>
          </div>

          <section
            aria-live="polite"
            className="flex h-[560px] flex-col border border-border bg-card p-5 shadow-[8px_9px_0_rgba(36,77,61,0.06)] sm:h-[620px] sm:p-7 lg:h-[680px] xl:h-[720px] dark:shadow-[8px_9px_0_rgba(0,0,0,0.45)]"
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border pb-3">
              <h2 className="font-display text-[24px] font-normal tracking-[-0.03em]">
                {section.ui.output_title}
              </h2>
              {generatedStory ? (
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground">
                    {wordCount} {section.ui.word_count}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary/80"
                  >
                    <Copy className="size-3.5" />
                    {section.ui.copy_button}
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mt-5 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
              {errorMessage ? (
                <div className="mb-5 border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] leading-relaxed text-destructive">
                  {errorMessage}
                </div>
              ) : null}

              {generatedStory ? (
                <div>
                  {generator.genre === "adventure" &&
                  length === "branching_path" &&
                  section.ui.branching_hint ? (
                    <p className="mb-4 border-l-2 border-primary/40 pl-3 text-[12px] leading-relaxed text-muted-foreground">
                      {section.ui.branching_hint}
                    </p>
                  ) : null}
                  <div className="whitespace-pre-wrap font-serif text-[15px] leading-[1.85] text-foreground">
                    {generatedStory}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
                  <BookOpen className="size-6 text-muted-foreground/60" />
                  <p className="max-w-sm text-[13px] leading-relaxed text-muted-foreground">
                    {section.output.empty}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {generatedStory && !isGenerating ? (
          <div className="mx-auto max-w-4xl">
            <CompletionGuide
              onCreateAnother={handleCreateAnother}
              onSave={hasSavedCurrentStory ? undefined : handleSaveClick}
              onContinue={handleContinueInAiWrite}
              continueLabel={getContinueActionLabel({
                hasUser: !!user,
                locale,
              })}
              translations={{
                title: section.completion_guide.title,
                subtitle: section.completion_guide.subtitle,
                create_another: section.completion_guide.create_another,
                share_action: section.completion_guide.share_action,
              }}
            />
          </div>
        ) : null}

        {section.hero_examples?.length ? (
          <section className="mx-auto mt-12 max-w-5xl">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {section.ui.example_label}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {section.hero_examples.slice(0, 3).map((example) => (
                <article
                  key={`${example.label}-${example.text.slice(0, 12)}`}
                  className="border border-border bg-card p-5 shadow-[5px_6px_0_rgba(36,77,61,0.05)] dark:shadow-[5px_6px_0_rgba(0,0,0,0.4)]"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-copper">
                    {example.label}
                  </p>
                  {example.title ? (
                    <h3 className="mt-3 font-display text-[19px] leading-snug tracking-[-0.02em]">
                      {example.title}
                    </h3>
                  ) : null}
                  <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
                    {example.text}
                  </p>
                </article>
              ))}
            </div>
          </section>
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
        sourcePage={generator.pageKey}
      />
    </div>
  );
}
