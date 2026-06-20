"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Heart, MessageCircle, Settings2 } from "lucide-react";
import GeneratorNavTabs from "@/components/generator-nav-tabs";
import TurnstileInvisible, {
  TurnstileInvisibleHandle,
} from "@/components/TurnstileInvisible";
import { buildContinueRoute } from "@/components/ai-write/workbench/_lib";
import { useRouter } from "@/i18n/navigation";
import Icon from "@/components/icon";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  SavedTiktokComment,
  TiktokCommentGenerate as TiktokCommentGenerateType,
} from "@/types/blocks/tiktok-comment-generate";
import type {
  TiktokCommentLength,
  TiktokCommentModelMode,
  TiktokCommentReplyGoal,
  TiktokCommentTone,
} from "@/types/tiktok-comment";
import { LANGUAGE_OPTIONS } from "@/lib/language-options";
import { TiktokCommentStorage } from "@/lib/tiktok-comment-storage";
import TiktokCommentBreadcrumb from "./breadcrumb";
import { pickRandomTiktokCommentPreset, splitReplies } from "./lib";

interface TiktokCommentGenerateProps {
  section?: TiktokCommentGenerateType;
}

const REPLY_GOAL_OPTIONS: TiktokCommentReplyGoal[] = [
  "thank_you",
  "answer_question",
  "clarify_misunderstanding",
  "drive_engagement",
  "handle_negative",
];

const TONE_OPTIONS: TiktokCommentTone[] = [
  "warm",
  "professional",
  "funny",
  "sales",
  "empathetic",
];

const LENGTH_OPTIONS: TiktokCommentLength[] = ["short", "medium", "long"];

const MODE_OPTIONS: TiktokCommentModelMode[] = [
  "fast",
  "standard",
  "creative",
];

function parseStreamLine(line: string): string | null {
  if (!line.startsWith("0:")) {
    return null;
  }

  try {
    return JSON.parse(line.slice(2)) as string;
  } catch {
    return null;
  }
}

export default function TiktokCommentGenerate({
  section,
}: TiktokCommentGenerateProps) {
  const locale = useLocale();
  const router = useRouter();
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const reduceMotion = useReducedMotion();
  const [sectionVisible, setSectionVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const tkEnter = (delayMs: number) =>
    `transition-all duration-[800ms] ease-[cubic-bezier(0.32,0.72,0,1)] [transition-delay:${delayMs}ms] ${
      sectionVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
    }`;

  const [comment, setComment] = useState("");
  const [context, setContext] = useState("");
  const [replyGoal, setReplyGoal] = useState<TiktokCommentReplyGoal>(
    "thank_you"
  );
  const [tone, setTone] = useState<TiktokCommentTone>("warm");
  const [length, setLength] = useState<TiktokCommentLength>("short");
  const [mode, setMode] = useState<TiktokCommentModelMode>("standard");
  const [outputLanguage, setOutputLanguage] = useState(locale);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatedReplies, setGeneratedReplies] = useState("");
  const [lastCompletedOutput, setLastCompletedOutput] = useState("");
  const [history, setHistory] = useState<SavedTiktokComment[]>([]);

  useEffect(() => {
    setHistory(TiktokCommentStorage.getHistory());
  }, []);

  const t = useCallback(
    (path: string, fallback: string) => {
      const keys = path.split(".");
      let value: unknown = section;

      for (const key of keys) {
        value = (value as Record<string, unknown> | undefined)?.[key];
      }

      return typeof value === "string" && value.trim() ? value : fallback;
    },
    [section]
  );

  const randomPresets = useMemo(
    () => section?.random_prompts ?? [],
    [section]
  );

  const replyGoalOptions = useMemo(
    () =>
      REPLY_GOAL_OPTIONS.map((value) => ({
        value,
        label: t(`reply_goal.${value}`, value),
      })),
    [t]
  );

  const toneOptions = useMemo(
    () =>
      TONE_OPTIONS.map((value) => ({
        value,
        label: t(`tone.${value}`, value),
      })),
    [t]
  );

  const lengthOptions = useMemo(
    () =>
      LENGTH_OPTIONS.map((value) => ({
        value,
        label: t(`length.${value}`, value),
      })),
    [t]
  );

  const modeOptions = useMemo(
    () =>
      MODE_OPTIONS.map((value) => ({
        value,
        label:
          t(`ai_models.${value}`, "") ||
          (value === "fast"
            ? "Fast"
            : value === "creative"
              ? "Creative"
              : "Standard"),
        description:
          t(`ai_models.${value}_description`, "") ||
          (value === "fast"
            ? "Quickest reply iteration"
            : value === "creative"
              ? "Looser and more playful tone"
              : "Balanced quality and speed"),
      })),
    [t]
  );

  const replyList = useMemo(
    () => splitReplies(generatedReplies),
    [generatedReplies]
  );

  const saveCompletedReplies = useCallback(
    (output: string) => {
      TiktokCommentStorage.saveHistory({
        comment: comment.trim(),
        context: context.trim(),
        replyGoal,
        tone,
        length,
        mode,
        outputLanguage,
        output,
      });
      setHistory(TiktokCommentStorage.getHistory());
    },
    [comment, context, length, mode, outputLanguage, replyGoal, tone]
  );

  const runGeneration = useCallback(
    async (turnstileToken: string) => {
      try {
        const response = await fetch("/api/tiktok-comment-generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            turnstileToken,
            comment,
            context,
            replyGoal,
            tone,
            length,
            mode,
            outputLanguage,
            locale,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error("request failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const text = parseStreamLine(line);
            if (text) {
              accumulated += text;
              setGeneratedReplies(accumulated);
            }
          }
        }

        buffer += decoder.decode();

        const trailingText = parseStreamLine(buffer);
        if (trailingText) {
          accumulated += trailingText;
          setGeneratedReplies(accumulated);
        }

        if (!accumulated.trim()) {
          throw new Error("empty result");
        }

        saveCompletedReplies(accumulated);
        setLastCompletedOutput(accumulated);
        toast.success(t("success.generated", "TikTok replies generated."));
      } catch (error) {
        console.error("TikTok comment generation failed:", error);
        toast.error(
          t("errors.generate_failed", "Failed to generate TikTok replies.")
        );
      } finally {
        setIsGenerating(false);
      }
    },
    [
      comment,
      context,
      length,
      locale,
      mode,
      outputLanguage,
      replyGoal,
      saveCompletedReplies,
      t,
      tone,
    ]
  );

  const handleGenerate = useCallback(() => {
    if (!comment.trim()) {
      toast.error(t("validation.comment_required", "Paste a comment first."));
      return;
    }

    setIsGenerating(true);
    setGeneratedReplies("");
    turnstileRef.current?.execute();
  }, [comment, t]);

  const handleRandomPrompt = useCallback(() => {
    const preset = pickRandomTiktokCommentPreset({ presets: randomPresets });
    setComment(preset.comment);
    setContext(preset.context);
    setReplyGoal(preset.replyGoal);
    setTone(preset.tone);
    setLength(preset.length);
    setGeneratedReplies("");
    setLastCompletedOutput("");
    toast.success(
      t("success.random_prompt_selected", "Random preset selected.")
    );
  }, [randomPresets, t]);

  const handleCopy = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        return;
      }

      try {
        await navigator.clipboard.writeText(text);
        toast.success(t("success.copied", "Copied to clipboard."));
      } catch (error) {
        console.error("Failed to copy TikTok reply:", error);
      }
    },
    [t]
  );

  const handleCopyAll = useCallback(async () => {
    if (!replyList.length) {
      return;
    }

    try {
      await navigator.clipboard.writeText(replyList.join("\n"));
      toast.success(t("success.copied_all", "All replies copied."));
    } catch (error) {
      console.error("Failed to copy all TikTok replies:", error);
    }
  }, [replyList, t]);

  const handleContinue = useCallback(
    (reply: string) => {
      const content = reply.trim();
      if (!content) {
        return;
      }

      try {
        window.localStorage.setItem(
          "ai-write:generator-prefill",
          JSON.stringify({
            title: comment.trim().slice(0, 30) || "TikTok reply",
            content,
          })
        );
      } catch {
        // ignore prefill cache failures
      }

      router.push(buildContinueRoute({ source: "tiktok-comment-generator" }) as any);
    },
    [comment, router]
  );

  const applyHistory = useCallback((item: SavedTiktokComment) => {
    setComment(item.comment);
    setContext(item.context);
    setReplyGoal(item.replyGoal);
    setTone(item.tone);
    setLength(item.length);
    setMode(item.mode);
    setOutputLanguage(item.outputLanguage);
    setGeneratedReplies(item.output);
    setLastCompletedOutput(item.output);
  }, []);

  const deleteHistory = useCallback(
    (id: string) => {
      TiktokCommentStorage.deleteById(id);
      setHistory(TiktokCommentStorage.getHistory());
      toast.success(t("success.history_deleted", "History removed."));
    },
    [t]
  );

  const clearHistory = useCallback(() => {
    TiktokCommentStorage.clearHistory();
    setHistory([]);
    toast.success(t("success.history_cleared", "History cleared."));
  }, [t]);

  return (
    <section
      ref={sectionRef}
      id="tiktok_comment_generator"
      className="overflow-hidden py-16 text-foreground selection:bg-orange-500/20 lg:py-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.05_65),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.18_0.04_65),transparent)]" />
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-orange-500/[0.04] via-orange-500/[0.02] to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]"
          style={{ backgroundImage: "var(--bg-grid)", backgroundSize: "40px 40px" }}
        />

        {!reduceMotion && [
          { pos: "left-[6%] top-[8%]", size: "size-12", opacity: 0.55, dur: 11, delay: 0 },
          { pos: "right-[8%] top-[14%]", size: "size-10", opacity: 0.5, dur: 13, delay: 1.5 },
          { pos: "left-[12%] top-[44%]", size: "size-9", opacity: 0.45, dur: 12, delay: 2.8 },
          { pos: "right-[14%] top-[48%]", size: "size-11", opacity: 0.5, dur: 14, delay: 0.8 },
          { pos: "left-[24%] top-[4%]", size: "size-8", opacity: 0.4, dur: 10, delay: 3.5 },
        ].map((b, i) => (
          <motion.div
            key={`bubble-${i}`}
            aria-hidden
            className={cn(
              "pointer-events-none absolute z-[1] hidden text-orange-500/60 dark:text-orange-400/60 md:block",
              b.pos,
              b.size
            )}
            initial={{ opacity: 0, y: 0, rotate: -6 }}
            animate={{ opacity: [0, b.opacity, b.opacity, 0], y: [0, -10, 0], rotate: [-6, -2, -6] }}
            transition={{ duration: b.dur, delay: b.delay, repeat: Infinity, ease: "easeInOut" }}
          >
            <MessageCircle className="size-full" strokeWidth={1.5} />
          </motion.div>
        ))}
      </div>

      <div className="container relative mx-auto px-4 md:px-6">
        <div className="mb-10">
          <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
            <TiktokCommentBreadcrumb
              homeText={t("ui.breadcrumb_home", "Home")}
              currentText={t("ui.breadcrumb_current", "TikTok Comment Generator")}
            />
          </div>
        </div>

        <div className="relative mx-auto mb-10 max-w-2xl text-center sm:mb-14">
        {/* Hero-scoped ambient: hearts + dust (scoped to this block, not the whole section) */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-visible" aria-hidden>
          {!reduceMotion && [
            { left: "16%", top: "20%", delay: 0, dur: 9 },
            { left: "78%", top: "30%", delay: 2.5, dur: 11 },
            { left: "44%", top: "8%", delay: 5, dur: 10 },
          ].map((h, i) => (
            <motion.div
              key={`heart-${i}`}
              aria-hidden
              className="pointer-events-none absolute z-[1] hidden text-orange-500/50 dark:text-orange-400/50 md:block"
              style={{ left: h.left, top: h.top }}
              initial={{ opacity: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0.75, 0.75, 0], y: [0, -50, -100], scale: [0.6, 1.1, 0.95] }}
              transition={{ duration: h.dur, delay: h.delay, repeat: Infinity, ease: "easeInOut" }}
            >
              <Heart className="size-6" strokeWidth={1.5} fill="currentColor" />
            </motion.div>
          ))}

          {!reduceMotion && [
            { left: "10%", top: "18%", size: 6, delay: 0, dur: 10, peak: 0.5 },
            { left: "86%", top: "22%", size: 7, delay: 1.4, dur: 12, peak: 0.45 },
            { left: "24%", top: "76%", size: 6, delay: 2.8, dur: 9, peak: 0.4 },
            { left: "76%", top: "72%", size: 7, delay: 1.8, dur: 11, peak: 0.45 },
            { left: "34%", top: "10%", size: 6, delay: 3.5, dur: 8, peak: 0.35 },
            { left: "64%", top: "84%", size: 7, delay: 4.2, dur: 13, peak: 0.45 },
          ].map((d, i) => (
            <motion.span
              key={`dust-${i}`}
              aria-hidden
              className="absolute rounded-full bg-orange-500 dark:bg-orange-400 hidden md:block"
              style={{ left: d.left, top: d.top, width: d.size, height: d.size }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, d.peak, d.peak * 0.6, 0] }}
              transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>
          <div className={cn("relative z-10 mb-6 flex justify-center", tkEnter(0))}>
            <div className="rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 dark:bg-white/[0.015]">
              <div className="flex size-12 items-center justify-center rounded-xl bg-orange-500/10">
                <Icon name="RiMessage3Line" className="size-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <span className={cn("relative z-10 mb-5 inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground", tkEnter(80))}>
            <span className="inline-block size-1.5 rounded-full bg-orange-500 opacity-60" />
            {t("ui.eyebrow", "AI Comment Tool")}
          </span>

          <h1 className={cn("relative z-10 mt-4 font-display text-4xl font-bold tracking-tight leading-[1.08] text-foreground sm:text-5xl lg:text-[3.25rem]", tkEnter(160))}>
            {(() => {
              const titleText = t("ui.title", "TikTok Comment Generator");
              const highlight = section?.ui?.title_highlight;
              if (!highlight || !titleText.includes(highlight)) {
                return titleText;
              }
              const idx = titleText.indexOf(highlight);
              return (
                <>
                  {titleText.slice(0, idx)}
                  <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent dark:from-orange-400 dark:via-orange-500 dark:to-orange-300">
                    {highlight}
                  </span>
                  {titleText.slice(idx + highlight.length)}
                </>
              );
            })()}
          </h1>

          <p className={cn("relative z-10 mx-auto mt-5 max-w-xl text-base font-light leading-relaxed text-muted-foreground/65 sm:text-lg", tkEnter(240))}>
            {t(
              "ui.subtitle",
              "Turn a single TikTok comment into 3-5 copy-ready replies with tone, length, and language controls."
            )}
          </p>

          {section?.ui?.theme_pills?.length ? (
            <div className={cn("relative z-10 mt-7 flex flex-wrap items-center justify-center gap-2", tkEnter(320))}>
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

        <div className="mx-auto mt-8 grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <Card>
            <CardHeader>
              <CardTitle>{t("ui.options_title", "Generator settings")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Label htmlFor="tiktok-comment-input">
                    {t("ui.comment_label", "Comment")}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleRandomPrompt}
                    className="h-11 justify-start px-3 text-sm text-orange-600 hover:bg-orange-500/10 dark:text-orange-400 sm:h-8 sm:justify-end sm:px-2.5 sm:text-xs"
                  >
                    {t("ui.random_button", "Random")}
                  </Button>
                </div>
                <Textarea
                  id="tiktok-comment-input"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder={t(
                    "ui.comment_placeholder",
                    "Paste the TikTok comment you want to reply to."
                  )}
                  className="min-h-24"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktok-comment-context">
                  {t("ui.context_label", "Context (optional)")}
                </Label>
                <Input
                  id="tiktok-comment-context"
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                  placeholder={t(
                    "ui.context_placeholder",
                    "Add context, e.g. product launch, Q&A clip, fan reaction."
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("ui.output_language", "Output language")}</Label>
                <Select value={outputLanguage} onValueChange={setOutputLanguage}>
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

              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex min-h-11 w-full items-center justify-between px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-transparent hover:text-orange-600 dark:hover:text-orange-400 sm:min-h-0 sm:px-0"
                  >
                    <span className="flex items-center gap-1.5">
                      <Settings2 className="h-3.5 w-3.5" />
                      {t("ui.advanced_options", "Advanced options")}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        showAdvanced ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-slide-up data-[state=open]:animate-slide-down">
                  <div className="mt-4 space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{t("ui.reply_goal_label", "Reply goal")}</Label>
                        <Select
                          value={replyGoal}
                          onValueChange={(value) =>
                            setReplyGoal(value as TiktokCommentReplyGoal)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {replyGoalOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t("ui.tone_label", "Tone")}</Label>
                        <Select
                          value={tone}
                          onValueChange={(value) =>
                            setTone(value as TiktokCommentTone)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {toneOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t("ui.length_label", "Length")}</Label>
                        <Select
                          value={length}
                          onValueChange={(value) =>
                            setLength(value as TiktokCommentLength)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {lengthOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t("ui.mode_label", "AI model")}</Label>
                        <Select
                          value={mode}
                          onValueChange={(value) =>
                            setMode(value as TiktokCommentModelMode)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {modeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {modeOptions.find((option) => option.value === mode)?.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="flex flex-wrap gap-3">
                <Button onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating
                    ? t("ui.generating_button", "Generating...")
                    : t("ui.generate_button", "Generate replies")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("ui.output_title", "Replies")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {replyList.length > 0 ? (
                <ul className="space-y-2">
                  {replyList.map((reply, index) => (
                    <motion.li
                      key={`${index}-${reply.slice(0, 20)}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.08,
                        ease: [0.32, 0.72, 0, 1],
                      }}
                      whileHover={reduceMotion ? undefined : { y: -2 }}
                      className="group flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/30 p-3 text-sm transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-orange-500/30 hover:bg-orange-500/[0.03]"
                    >
                      <span className="whitespace-pre-wrap break-words">
                        {reply}
                      </span>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(reply)}
                          className="h-11 px-3 text-xs sm:h-8"
                        >
                          {t("ui.copy_button", "Copy")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleContinue(reply)}
                          disabled={isGenerating}
                          className="h-11 px-3 text-xs sm:h-8"
                        >
                          {t("ui.continue_button", "Continue")}
                        </Button>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              ) : isGenerating ? (
                <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-lg border border-orange-500/20 bg-orange-500/[0.03] p-4 text-center">
                  <div className="flex items-end gap-1 h-8" aria-hidden>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className="w-1 rounded-full bg-orange-500 dark:bg-orange-400 animate-music-bar"
                        style={{
                          animationDelay: `${i * 0.15}s`,
                          animationDuration: `${0.8 + (i % 3) * 0.2}s`,
                          height: "100%",
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-orange-700/80 dark:text-orange-300/80">
                    {t("ui.generating_output", "Generating your replies...")}
                  </p>
                </div>
              ) : (
                <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/40 bg-muted/20 p-4 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-orange-500/5">
                    <MessageCircle
                      className="size-5 text-orange-500/60 dark:text-orange-400/60 animate-pulse"
                      strokeWidth={1.5}
                    />
                  </div>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    {t(
                      "ui.empty_output",
                      "Paste a comment and generate to see reply options here."
                    )}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyAll}
                  disabled={!replyList.length || isGenerating}
                  className="h-11 px-2 text-xs sm:h-10 sm:px-4 sm:text-sm"
                >
                  {t("ui.copy_all_button", "Copy all")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={isGenerating || !lastCompletedOutput}
                  className="h-11 px-2 text-xs sm:h-10 sm:px-4 sm:text-sm"
                >
                  {t("ui.regenerate_button", "Regenerate")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {history.length > 0 && (
          <div className="mx-auto mt-12 w-full max-w-6xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {t("ui.history_title", "Recent replies")}
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-xs text-muted-foreground"
              >
                {t("ui.history_clear", "Clear")}
              </Button>
            </div>
            <ul className="space-y-2">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{item.comment}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()} ·{" "}
                      {item.replyGoal} · {item.tone} · {item.length}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyHistory(item)}
                      className="h-11 px-3 text-xs sm:h-8"
                    >
                      {t("ui.history_apply", "Apply")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteHistory(item.id)}
                      className="h-11 px-3 text-xs text-muted-foreground hover:text-destructive sm:h-8"
                    >
                      {t("ui.history_delete", "Delete")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={runGeneration}
        onError={() => {
          setIsGenerating(false);
          toast.error(
            t("errors.verification_failed", "Verification failed. Try again.")
          );
        }}
      />
    </section>
  );
}
