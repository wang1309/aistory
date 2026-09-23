"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clipboard,
  Columns2,
  Copy,
  FileCheck2,
  FileText,
  GitCommitVertical,
  Maximize2,
  Minimize2,
  PenTool,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Wand2,
  Zap,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TurnstileInvisible, {
  TurnstileInvisibleHandle,
} from "@/components/TurnstileInvisible";
import {
  AI_HUMANIZER_REQUIREMENTS_LIMIT,
  AI_HUMANIZER_TEXT_LIMIT,
  type AiHumanizerResult,
  type HumanizerVariant,
} from "@/app/api/ai-humanizer/_lib";
import { countEssayWords } from "@/app/api/essay-extender/_lib";
import { computeHumanizerDiff } from "@/lib/humanizer-text-segment";
import { LANGUAGE_OPTIONS } from "@/lib/language-options";
import type { AiHumanizerPage } from "@/types/blocks/ai-humanizer";
import { Link } from "@/i18n/navigation";
import { useAppContext } from "@/contexts/app";
import { useOpenPanel } from "@openpanel/nextjs";
import { useCreativeQuotaPage } from "@/hooks/useCreativeQuotaPage";
import { CreativeQuotaHint } from "@/components/blocks/creative-quota-hint";
import { CreativeQuotaPaywall } from "@/components/blocks/creative-quota-paywall";
import {
  buildActivationTrackingPayload,
  getWordCountBucket,
} from "@/lib/activation-funnel";
import { cn } from "@/lib/utils";

interface AiHumanizerProps {
  section: AiHumanizerPage;
}

type DiffViewMode = "unified" | "split" | "clean";

export default function AiHumanizer({ section }: AiHumanizerProps) {
  const { user } = useAppContext();
  const { track } = useOpenPanel();
  const creativeQuota = useCreativeQuotaPage("ai-humanizer");

  const [sourceText, setSourceText] = useState("");
  const [outputLanguage, setOutputLanguage] = useState("auto");
  const [additionalRequirements, setAdditionalRequirements] = useState("");
  const [selectedModel, setSelectedModel] = useState<"fast" | "creative">("fast");
  const [result, setResult] = useState<AiHumanizerResult | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<"option_a" | "option_b" | null>(null);
  const [diffViewMode, setDiffViewMode] = useState<DiffViewMode>("unified");
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [submittedSourceText, setSubmittedSourceText] = useState("");
  const diffViewedForResponse = useRef(false);

  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const resultRef = useRef<HTMLDivElement>(null);

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

  // Cycle loading steps during generation
  useEffect(() => {
    if (!isGenerating) {
      setLoadingStepIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setLoadingStepIndex((prev) => (prev + 1) % 4);
    }, 1800);
    return () => clearInterval(timer);
  }, [isGenerating]);

  const LOADING_STEPS = useMemo(
    () => [
      {
        icon: Search,
        title: t("ui.loading_step_1") || "Scanning AI patterns & sentence rhythm...",
        desc: t("ui.loading_desc_1") || "Detecting repetitive structures & hollow fillers",
      },
      {
        icon: Wand2,
        title: t("ui.loading_step_2") || "Eliminating false contrasts & buzzwords...",
        desc: t("ui.loading_desc_2") || "Restructuring qualifiers and rigid phrasing",
      },
      {
        icon: PenTool,
        title: t("ui.loading_step_3") || "Infusing human cadence & natural burstiness...",
        desc: t("ui.loading_desc_3") || "Balancing sentence lengths and authentic voice",
      },
      {
        icon: FileCheck2,
        title: t("ui.loading_step_4") || "Polishing expressions & generating options...",
        desc: t("ui.loading_desc_4") || "Preparing two distinct humanized versions",
      },
    ],
    [t]
  );

  const selectedVariant = result?.variants.find((variant) => variant.id === selectedVariantId) ?? null;
  const selectedDiff = useMemo(
    () => (selectedVariant ? computeHumanizerDiff(submittedSourceText, selectedVariant.text) : null),
    [submittedSourceText, selectedVariant]
  );

  const patternLabel = useCallback(
    (patternId: string) => {
      const key = patternId.replace(/-/g, "_");
      const entry = section.patterns?.[key];
      return entry?.label || patternId;
    },
    [section]
  );

  const titleParts = useMemo(() => {
    const fullTitle = t("ui.title");
    const highlight = t("ui.title_highlight");
    if (highlight && highlight !== "ui.title_highlight" && fullTitle.includes(highlight)) {
      const idx = fullTitle.indexOf(highlight);
      return {
        before: fullTitle.slice(0, idx),
        after: fullTitle.slice(idx + highlight.length),
        highlight,
      };
    }
    return { before: fullTitle, after: "", highlight: "" };
  }, [t]);

  const trimmedLength = sourceText.trim().length;
  const isOverLimit = trimmedLength > AI_HUMANIZER_TEXT_LIMIT;
  const isRequirementsOverLimit =
    additionalRequirements.trim().length > AI_HUMANIZER_REQUIREMENTS_LIMIT;
  const canGenerate = trimmedLength > 0 && !isOverLimit && !isRequirementsOverLimit && !isGenerating;

  const trackingPayload = useCallback(
    (action: string, candidateId?: "option_a" | "option_b") => ({
      ...buildActivationTrackingPayload({
        sourcePage: "ai-humanizer",
        loggedIn: Boolean(user),
        action,
        model: selectedModel,
        contentType: "utility",
      }),
      output_language: outputLanguage,
      ...(candidateId ? { candidate_id: candidateId } : {}),
      source_word_count_bucket: getWordCountBucket(countEssayWords(sourceText)),
    }),
    [user, outputLanguage, selectedModel, sourceText]
  );

  const validateBeforeSubmit = useCallback(() => {
    const trimmed = sourceText.trim();
    if (!trimmed) {
      toast.error(t("validation.enter_source_text"));
      return false;
    }
    if (trimmed.length > AI_HUMANIZER_TEXT_LIMIT) {
      toast.error(t("validation.source_text_too_long"));
      return false;
    }
    if (additionalRequirements.trim().length > AI_HUMANIZER_REQUIREMENTS_LIMIT) {
      toast.error(t("validation.requirements_too_long"));
      return false;
    }
    return true;
  }, [sourceText, additionalRequirements, t]);

  const handleGenerate = useCallback(() => {
    if (!validateBeforeSubmit()) return;
    if (
      creativeQuota.guardAnonymousCreativeQuota({
        selectedModel,
        message: t("errors.generation_failed"),
      }) ||
      creativeQuota.guardCreativeCreditQuota({ selectedModel })
    ) {
      return;
    }
    setResult(null);
    setSelectedVariantId(null);
    setCopied(false);
    setSubmittedSourceText("");
    diffViewedForResponse.current = false;
    setIsGenerating(true);
    track("ai_humanizer_generation_started", trackingPayload("generation_started"));
    turnstileRef.current?.execute();
  }, [validateBeforeSubmit, selectedModel, creativeQuota, t, track, trackingPayload]);

  const handleTurnstileSuccess = useCallback(
    async (turnstileToken: string) => {
      try {
        const submittedSource = sourceText.trim();
        setSubmittedSourceText(submittedSource);
        const response = await fetch("/api/ai-humanizer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceText: submittedSource,
            outputLanguage,
            additionalRequirements: additionalRequirements.trim(),
            model: selectedModel,
            turnstileToken,
          }),
        });

        const body = (await response.json()) as {
          code?: number;
          message?: string;
          data?: AiHumanizerResult;
        };

        if (!response.ok) {
          if (creativeQuota.handleQuotaError(response.status, body)) return;
          throw new Error(body.message || `HTTP ${response.status}`);
        }
        if (body.code !== 0 || !body.data) {
          throw new Error(body.message || "Generation failed");
        }

        setResult(body.data);
        setSelectedVariantId("option_a");
        if (selectedModel === "creative") creativeQuota.increment();
        track("ai_humanizer_generation_succeeded", trackingPayload("generation_succeeded"));
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 250);
      } catch {
        toast.error(t("errors.generation_failed"));
        track("ai_humanizer_generation_failed", trackingPayload("generation_failed"));
      } finally {
        setIsGenerating(false);
      }
    },
    [sourceText, outputLanguage, additionalRequirements, selectedModel, creativeQuota, t, track, trackingPayload]
  );

  const handleTurnstileError = useCallback(() => {
    setIsGenerating(false);
    toast.error(t("errors.generation_failed"));
    track("ai_humanizer_generation_failed", trackingPayload("generation_failed"));
  }, [t, track, trackingPayload]);

  const handleSelectVariant = useCallback(
    (variant: HumanizerVariant) => {
      if (variant.id !== selectedVariantId) {
        setCopied(false);
      }
      setSelectedVariantId(variant.id);
      track("ai_humanizer_variant_selected", trackingPayload("variant_selected", variant.id));
      if (!diffViewedForResponse.current) {
        diffViewedForResponse.current = true;
        track("ai_humanizer_diff_viewed", trackingPayload("diff_viewed", variant.id));
      }
    },
    [selectedVariantId, track, trackingPayload]
  );

  const handleCopyResult = useCallback(async () => {
    if (!selectedVariant) return;
    try {
      await navigator.clipboard.writeText(selectedVariant.text);
    } catch {
      toast.error(t("errors.copy_failed"));
      return;
    }
    setCopied(true);
    toast.success(t("success.result_copied"));
    track("ai_humanizer_result_copied", trackingPayload("result_copied", selectedVariant.id));
  }, [selectedVariant, t, track, trackingPayload]);

  const handleContinueToAiWrite = useCallback(() => {
    track("continue_ai_write_cta_click", {
      source_page: "ai-humanizer",
      logged_in: Boolean(user),
      cta_variant: "clean_ai_write",
    });
  }, [track, user]);

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSourceText(text);
        toast.success(t("ui.action_paste") || "Pasted");
      }
    } catch {
      toast.error("Clipboard access denied or unavailable");
    }
  }, [t]);

  const handleClearSourceText = useCallback(() => {
    setSourceText("");
    setResult(null);
    setSelectedVariantId(null);
    setSubmittedSourceText("");
  }, []);

  const handleSelectExample = useCallback((exampleText: string) => {
    setSourceText(exampleText);
    setResult(null);
    setSelectedVariantId(null);
    setSubmittedSourceText("");
  }, []);

  /** Renders the comparison content based on diffViewMode */
  const renderComparisonBody = useCallback(
    (isExpandedView: boolean = false) => {
      if (!selectedVariant || !selectedDiff) return null;

      return (
        <div className="space-y-4">
          {diffViewMode === "unified" && (
            <article
              aria-labelledby="ai-humanizer-unified"
              className={cn(
                "rounded-2xl border border-border/50 bg-background/80 p-5 shadow-xs transition-all",
                isExpandedView ? "min-h-[360px]" : "min-h-[220px]"
              )}
            >
              <div className="mb-3 flex items-center justify-between border-b border-border/30 pb-2">
                <h3 id="ai-humanizer-unified" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("ui.view_mode_unified") || "Inline Track Changes"}
                </h3>
                <span className="text-[11px] text-muted-foreground/80">
                  <span className="inline-block size-2 rounded-full bg-rose-500/80 mr-1" />
                  <span className="line-through opacity-70">Removed</span>
                  <span className="mx-2 opacity-30">|</span>
                  <span className="inline-block size-2 rounded-full bg-emerald-500/80 mr-1" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Added</span>
                </span>
              </div>
              <p dir="auto" className="whitespace-pre-wrap break-words text-base leading-relaxed text-foreground/95">
                {selectedDiff.unified.map((seg, idx) => {
                  if (seg.type === "removed") {
                    return (
                      <del
                        key={idx}
                        className="mx-0.5 rounded-sm bg-rose-100 px-1 py-0.5 text-rose-800 line-through opacity-75 dark:bg-rose-950/50 dark:text-rose-300"
                      >
                        {seg.text}
                      </del>
                    );
                  }
                  if (seg.type === "added") {
                    return (
                      <ins
                        key={idx}
                        className="mx-0.5 rounded-sm bg-emerald-100 px-1 py-0.5 font-medium text-emerald-900 no-underline dark:bg-emerald-950/60 dark:text-emerald-300"
                      >
                        {seg.text}
                      </ins>
                    );
                  }
                  return <span key={idx}>{seg.text}</span>;
                })}
              </p>
            </article>
          )}

          {diffViewMode === "split" && (
            <div className={cn("grid gap-4", isExpandedView ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 lg:grid-cols-2")}>
              <article aria-labelledby="ai-humanizer-original" className="rounded-2xl border border-border/40 bg-background/60 p-4">
                <h3 id="ai-humanizer-original" className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("ui.original_text")}
                </h3>
                <p dir="auto" className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
                  {selectedDiff.original.map((segment, index) =>
                    segment.changed ? (
                      <mark key={index} className="bg-rose-200/70 text-inherit dark:bg-rose-500/25">
                        {segment.text}
                      </mark>
                    ) : (
                      <span key={index}>{segment.text}</span>
                    )
                  )}
                </p>
              </article>
              <article aria-labelledby="ai-humanizer-rewrite" className="rounded-2xl border border-border/40 bg-background/60 p-4">
                <h3 id="ai-humanizer-rewrite" className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("ui.rewritten_text")}
                </h3>
                <p dir="auto" className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
                  {selectedDiff.modified.map((segment, index) =>
                    segment.changed ? (
                      <mark key={index} className="bg-emerald-200/70 text-inherit dark:bg-emerald-500/25">
                        {segment.text}
                      </mark>
                    ) : (
                      <span key={index}>{segment.text}</span>
                    )
                  )}
                </p>
              </article>
            </div>
          )}

          {diffViewMode === "clean" && (
            <article
              aria-labelledby="ai-humanizer-clean"
              className={cn(
                "rounded-2xl border border-border/50 bg-background/80 p-5 shadow-xs",
                isExpandedView ? "min-h-[360px]" : "min-h-[220px]"
              )}
            >
              <h3 id="ai-humanizer-clean" className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("ui.rewritten_text")}
              </h3>
              <p dir="auto" className="whitespace-pre-wrap break-words text-base leading-relaxed text-foreground">
                {selectedVariant.text}
              </p>
            </article>
          )}

          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("ui.changed_text_hint")}
          </p>
        </div>
      );
    },
    [selectedVariant, selectedDiff, diffViewMode, t]
  );

  return (
    <div id="ai_humanizer" className="relative bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-primary/[0.04] via-primary/[0.02] to-transparent" />
        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]" style={{ backgroundImage: "var(--bg-grid)", backgroundSize: "40px 40px" }} />
      </div>
      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={handleTurnstileSuccess}
        onError={handleTurnstileError}
      />

      <main className="relative container max-w-6xl mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="mb-10">
          <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
            <Link href="/" className="relative transition-colors after:absolute after:-inset-y-3.5 after:-inset-x-2 after:content-[''] hover:text-foreground/80">
              {t("ui.breadcrumb_home")}
            </Link>
            <span className="mx-2 text-muted-foreground/40">/</span>
            <Link href="/ai-tools" className="relative transition-colors after:absolute after:-inset-y-3.5 after:-inset-x-2 after:content-[''] hover:text-foreground/80">
              AI Tools
            </Link>
            <span className="mx-2 text-muted-foreground/40">/</span>
            <span className="text-foreground/80">{t("ui.breadcrumb_current")}</span>
          </div>
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-primary mb-5 shadow-xs">
            <Sparkles className="size-3 text-primary animate-pulse" />
            {t("ui.eyebrow")}
          </span>
          <h1 className="relative z-10 mt-2 font-display text-[2rem] font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
            {titleParts.before}
            {titleParts.highlight && (
              <span className="text-gradient-primary italic">{titleParts.highlight}</span>
            )}
            {titleParts.after}
          </h1>
          <p className="relative z-10 mx-auto mt-4 max-w-xl text-base font-light leading-relaxed text-muted-foreground/80 sm:text-lg">
            {t("ui.subtitle")}
          </p>

          {/* Trust Badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background/80 px-3 py-1 text-xs text-muted-foreground shadow-2xs backdrop-blur-xs">
              <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              {t("ui.trust_badge_privacy") || "100% Private"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background/80 px-3 py-1 text-xs text-muted-foreground shadow-2xs backdrop-blur-xs">
              <Target className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              {t("ui.trust_badge_fidelity") || "Preserves Core Facts"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background/80 px-3 py-1 text-xs text-muted-foreground shadow-2xs backdrop-blur-xs">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              {t("ui.trust_badge_diagnosis") || "Visual Diagnosis"}
            </span>
          </div>
        </div>

        <div className="my-8 h-px bg-gradient-to-r from-transparent via-border/80 to-transparent" />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
          {/* Left Form */}
          <div className="space-y-4 rounded-3xl border border-border/50 bg-card p-6 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto custom-scrollbar">
            {/* Source Text Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="ai-humanizer-text" className="text-sm font-semibold text-foreground">
                  {t("ui.source_text_label")} <span className="text-primary">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {trimmedLength} / {AI_HUMANIZER_TEXT_LIMIT}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePasteFromClipboard}
                      className="relative inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border/50 bg-background/80 px-3 text-xs text-muted-foreground transition-colors after:absolute after:-inset-y-1.5 after:-inset-x-1 after:content-[''] hover:bg-muted hover:text-foreground"
                      title={t("ui.action_paste") || "Paste"}
                    >
                      <Clipboard className="size-3" />
                      <span>{t("ui.action_paste") || "Paste"}</span>
                    </button>
                    {sourceText && (
                      <button
                        type="button"
                        onClick={handleClearSourceText}
                        className="relative inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border/50 bg-background/80 px-3 text-xs text-muted-foreground transition-colors after:absolute after:-inset-y-1.5 after:-inset-x-1 after:content-[''] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                        title={t("ui.action_clear") || "Clear"}
                      >
                        <Trash2 className="size-3" />
                        <span>{t("ui.action_clear") || "Clear"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Try an Example Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] font-medium text-muted-foreground/70">
                  {t("ui.examples_label") || "Examples:"}
                </span>
                {t("ui.example_1_text") && t("ui.example_1_text") !== "ui.example_1_text" && (
                  <button
                    type="button"
                    onClick={() => handleSelectExample(t("ui.example_1_text"))}
                    className="relative inline-flex min-h-9 items-center rounded-full border border-border/60 bg-muted/30 px-3.5 text-xs text-muted-foreground transition-all after:absolute after:-inset-y-1.5 after:-inset-x-1 after:content-[''] hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                  >
                    {t("ui.example_1_label") || "💼 Jargon"}
                  </button>
                )}
                {t("ui.example_2_text") && t("ui.example_2_text") !== "ui.example_2_text" && (
                  <button
                    type="button"
                    onClick={() => handleSelectExample(t("ui.example_2_text"))}
                    className="relative inline-flex min-h-9 items-center rounded-full border border-border/60 bg-muted/30 px-3.5 text-xs text-muted-foreground transition-all after:absolute after:-inset-y-1.5 after:-inset-x-1 after:content-[''] hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                  >
                    {t("ui.example_2_label") || "🎓 Preamble"}
                  </button>
                )}
                {t("ui.example_3_text") && t("ui.example_3_text") !== "ui.example_3_text" && (
                  <button
                    type="button"
                    onClick={() => handleSelectExample(t("ui.example_3_text"))}
                    className="relative inline-flex min-h-9 items-center rounded-full border border-border/60 bg-muted/30 px-3.5 text-xs text-muted-foreground transition-all after:absolute after:-inset-y-1.5 after:-inset-x-1 after:content-[''] hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                  >
                    {t("ui.example_3_label") || "🤖 False Contrast"}
                  </button>
                )}
              </div>

              <Textarea
                id="ai-humanizer-text"
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
                placeholder={t("placeholders.source_text")}
                aria-describedby="ai-humanizer-text-hint ai-humanizer-counter"
                aria-invalid={isOverLimit}
                disabled={isGenerating}
                className="min-h-[180px] resize-y rounded-xl border-border/50 bg-background p-4 text-base leading-relaxed focus-visible:border-primary/50 focus-visible:ring-primary/20"
              />
              <div className="space-y-1">
                <p id="ai-humanizer-text-hint" className="text-xs text-muted-foreground">
                  {t("ui.source_text_hint")}
                </p>
                <p id="ai-humanizer-counter" className="text-xs text-muted-foreground">
                  {t("ui.character_limit_hint")}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                {t("ui.ai_model_label")}
              </Label>
              <Select
                value={selectedModel}
                onValueChange={(value) => setSelectedModel(value as "fast" | "creative")}
                disabled={isGenerating}
              >
                <SelectTrigger
                  aria-label={t("ui.ai_model_label")}
                  className="h-11 w-full rounded-lg border-border/50 bg-background sm:pointer-fine:h-9"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">
                    <span className="flex items-center gap-1.5">
                      <Zap className="size-3.5" aria-hidden="true" />
                      {t("ai_models.fast")}
                    </span>
                  </SelectItem>
                  <SelectItem value="creative">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="size-3.5" aria-hidden="true" />
                      {t("ai_models.creative")}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedModel === "creative"
                  ? t("ai_models.creative_description")
                  : t("ai_models.fast_description")}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                {t("ui.output_language_label")}
              </Label>
              <Select
                value={outputLanguage}
                onValueChange={setOutputLanguage}
                disabled={isGenerating}
              >
                <SelectTrigger
                  aria-label={t("ui.output_language_label")}
                  className="h-11 w-full rounded-lg border-border/50 bg-background sm:pointer-fine:h-9"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">{t("ui.output_language_auto")}</SelectItem>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      <span className="mr-2">{option.flag}</span>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-humanizer-requirements" className="text-xs font-medium tracking-wide text-muted-foreground">
                {t("ui.additional_requirements_label")}
              </Label>
              <Textarea
                id="ai-humanizer-requirements"
                value={additionalRequirements}
                onChange={(event) => setAdditionalRequirements(event.target.value)}
                placeholder={t("placeholders.additional_requirements")}
                aria-invalid={isRequirementsOverLimit}
                disabled={isGenerating}
                className="min-h-[80px] resize-y rounded-xl border-border/50 bg-background p-3 text-base leading-relaxed focus-visible:border-primary/50 focus-visible:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">
                {t("ui.additional_requirements_hint")}
              </p>
            </div>

            <Button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full min-h-12 bg-primary text-base font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="mr-2 size-5 shrink-0 animate-pulse" aria-hidden="true" />
                  {t("ui.generating")}
                </>
              ) : selectedModel === "creative" &&
                creativeQuota.anonymousCreativeExhausted ? (
                <>
                  <Sparkles className="mr-2 size-5 shrink-0" aria-hidden="true" />
                  {t("ui.sign_in_to_continue")}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-5 shrink-0" aria-hidden="true" />
                  {t("ui.generate")}
                </>
              )}
            </Button>
            <CreativeQuotaHint
              pageKey="ai-humanizer"
              selectedModel={selectedModel}
              used={creativeQuota.used}
              limit={creativeQuota.limit}
              className="mt-3"
            />
          </div>

          {/* Right Result Card */}
          <div className="relative">
            <div
              ref={resultRef}
              aria-live="polite"
              className="flex flex-col overflow-hidden rounded-3xl border border-border/50 bg-card shadow-sm lg:absolute lg:inset-0"
            >
              {/* Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-6 py-4 sm:px-8">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <FileText className="size-4" aria-hidden="true" />
                  </div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {t("ui.result_title")}
                  </h2>
                </div>

                {selectedVariant && (
                  <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="inline-flex rounded-lg border border-border/60 bg-muted/40 p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setDiffViewMode("unified")}
                        className={cn(
                          "relative flex min-h-9 items-center gap-1.5 rounded-md px-3 font-medium transition-colors after:absolute after:-inset-y-1.5 after:-inset-x-0.5 after:content-['']",
                          diffViewMode === "unified"
                            ? "bg-background text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        title={t("ui.view_mode_unified") || "Inline Diff"}
                      >
                        <GitCommitVertical className="size-3.5" />
                        <span className="hidden sm:inline">{t("ui.view_mode_unified") || "Inline"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiffViewMode("split")}
                        className={cn(
                          "relative flex min-h-9 items-center gap-1.5 rounded-md px-3 font-medium transition-colors after:absolute after:-inset-y-1.5 after:-inset-x-0.5 after:content-['']",
                          diffViewMode === "split"
                            ? "bg-background text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        title={t("ui.view_mode_split") || "Side-by-side"}
                      >
                        <Columns2 className="size-3.5" />
                        <span className="hidden sm:inline">{t("ui.view_mode_split") || "Split"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiffViewMode("clean")}
                        className={cn(
                          "relative flex min-h-9 items-center gap-1.5 rounded-md px-3 font-medium transition-colors after:absolute after:-inset-y-1.5 after:-inset-x-0.5 after:content-['']",
                          diffViewMode === "clean"
                            ? "bg-background text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        title={t("ui.view_mode_clean") || "Clean Text"}
                      >
                        <FileText className="size-3.5" />
                        <span className="hidden sm:inline">{t("ui.view_mode_clean") || "Clean"}</span>
                      </button>
                    </div>

                    {/* Expand Fullscreen Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsFullscreenOpen(true)}
                      aria-label={t("ui.fullscreen_view") || "Expand Fullscreen"}
                      className="size-11 shrink-0"
                    >
                      <Maximize2 className="size-3.5" />
                    </Button>

                    {/* Copy Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopyResult}
                      aria-label={t("ui.copy_result")}
                      className="size-11 shrink-0"
                    >
                      {copied ? (
                        <Check className="size-4 text-primary" aria-hidden="true" />
                      ) : (
                        <Copy className="size-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Scrollable Result Body */}
              <div className="custom-scrollbar max-h-[70dvh] min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8 lg:max-h-none">
                {isGenerating ? (
                  <div className="flex min-h-[340px] flex-col items-center justify-center gap-6 py-6 text-center">
                    {/* Visual Document Scan Simulator */}
                    <div className="relative flex w-full max-w-sm flex-col items-center">
                      {/* Pulse Glow Behind */}
                      <div className="humanizer-ring humanizer-aura absolute -inset-12" />

                      {/* Document Preview Box */}
                      <div className="relative w-full overflow-hidden rounded-2xl border border-border/60 bg-background/90 p-5 shadow-lg backdrop-blur-xs">
                        {/* Scanner Beam */}
                        <div className="pointer-events-none absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-primary/25 to-transparent humanizer-scan-line" />

                        {/* Top Document Header */}
                        <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-rose-400 animate-pulse" />
                            <div className="size-2 rounded-full bg-amber-400 animate-pulse delay-75" />
                            <div className="size-2 rounded-full bg-emerald-400 animate-pulse delay-150" />
                          </div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-semibold">
                            Humanizing Text...
                          </span>
                        </div>

                        {/* Simulated Diff Lines */}
                        <div className="space-y-2.5 text-left">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-1/4 rounded-full bg-rose-300/40 dark:bg-rose-500/25 line-through opacity-70" />
                            <div className="h-2.5 w-2/3 rounded-full bg-emerald-300/60 dark:bg-emerald-500/35 animate-pulse" />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-full rounded-full bg-muted/60" />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-3/5 rounded-full bg-muted/60" />
                            <div className="h-2.5 w-1/3 rounded-full bg-rose-300/40 dark:bg-rose-500/25 opacity-70" />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-1/3 rounded-full bg-emerald-300/60 dark:bg-emerald-500/35 animate-pulse" />
                            <div className="h-2.5 w-1/2 rounded-full bg-muted/60" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step Status Text & Icon */}
                    <div className="flex max-w-md flex-col items-center gap-1.5 transition-all duration-300">
                      <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
                        {(() => {
                          const CurrentIcon = LOADING_STEPS[loadingStepIndex].icon;
                          return <CurrentIcon className="size-3.5 animate-spin-slow" />;
                        })()}
                        <span>{LOADING_STEPS[loadingStepIndex].title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground/80">
                        {LOADING_STEPS[loadingStepIndex].desc}
                      </p>
                    </div>
                  </div>
                ) : result ? (
                  <div className="space-y-6">
                    {/* Option A / Option B Selector */}
                    <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label={t("ui.choose_variant")}>
                      {result.variants.map((variant) => {
                        const isSelected = selectedVariantId === variant.id;
                        return (
                          <Button
                            key={variant.id}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            aria-pressed={isSelected}
                            onClick={() => handleSelectVariant(variant)}
                            disabled={isGenerating}
                            className="h-auto min-h-11 flex-col items-start gap-1.5 rounded-xl p-3 text-left"
                          >
                            <span className="flex w-full items-center gap-2 text-sm font-semibold">
                              {t(`ui.${variant.id}`)}
                              {isSelected && (
                                <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                                  {t("ui.selected_variant")}
                                </span>
                              )}
                            </span>
                            <span className="line-clamp-2 w-full text-xs font-normal opacity-70">
                              {variant.text}
                            </span>
                          </Button>
                        );
                      })}
                    </div>

                    {/* Detected Issues Tags */}
                    {selectedVariant && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {t("ui.detected_issues_label")}
                        </h3>
                        {selectedVariant.detectedIssues.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedVariant.detectedIssues.map((issue) => (
                              <span
                                key={issue.patternId}
                                className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-foreground/80"
                              >
                                {patternLabel(issue.patternId)}
                                <span className="text-primary">×{issue.count}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {t("ui.detected_issues_empty")}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Diff/Comparison Output */}
                    {renderComparisonBody(false)}
                  </div>
                ) : (
                  <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 text-center opacity-60">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/5">
                      <FileText className="size-7 text-primary/50" aria-hidden="true" />
                    </div>
                    <p className="mx-auto max-w-xs text-sm text-muted-foreground">
                      {t("ui.output_empty")}
                    </p>
                    <p className="mx-auto max-w-xs text-xs text-muted-foreground/70">
                      {t("ui.choose_variant")}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="space-y-3 border-t border-border/40 px-6 py-4 sm:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyResult}
                    disabled={!selectedVariant}
                    className="min-h-11 w-full sm:w-auto"
                  >
                    <Copy className="mr-2 size-4" aria-hidden="true" />
                    {t("ui.copy_result")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className="min-h-11 w-full sm:w-auto"
                  >
                    <RefreshCw className="mr-2 size-4" aria-hidden="true" />
                    {t("ui.regenerate")}
                  </Button>
                  <Link
                    href="/ai-write"
                    onClick={handleContinueToAiWrite}
                    className={`${buttonVariants({})} min-h-11 w-full sm:ml-auto sm:w-auto`}
                  >
                    {t("ui.continue_ai_write")}
                    <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                  </Link>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t("ui.continue_hint")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fullscreen Expanded Comparison Modal */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="max-h-[92vh] w-[95vw] max-w-6xl overflow-hidden p-0 sm:rounded-2xl">
          <DialogHeader className="border-b border-border/40 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4 pr-8">
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <FileText className="size-4 text-primary" />
                {t("ui.result_title")}
              </DialogTitle>
              {/* Modal View Mode Toggle */}
              <div className="inline-flex rounded-lg border border-border/60 bg-muted/40 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setDiffViewMode("unified")}
                  className={cn(
                    "relative flex min-h-9 items-center gap-1.5 rounded-md px-3 font-medium transition-colors after:absolute after:-inset-y-1.5 after:-inset-x-0.5 after:content-['']",
                    diffViewMode === "unified"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <GitCommitVertical className="size-3.5" />
                  {t("ui.view_mode_unified") || "Inline"}
                </button>
                <button
                  type="button"
                  onClick={() => setDiffViewMode("split")}
                  className={cn(
                    "relative flex min-h-9 items-center gap-1.5 rounded-md px-3 font-medium transition-colors after:absolute after:-inset-y-1.5 after:-inset-x-0.5 after:content-['']",
                    diffViewMode === "split"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Columns2 className="size-3.5" />
                  {t("ui.view_mode_split") || "Split"}
                </button>
                <button
                  type="button"
                  onClick={() => setDiffViewMode("clean")}
                  className={cn(
                    "relative flex min-h-9 items-center gap-1.5 rounded-md px-3 font-medium transition-colors after:absolute after:-inset-y-1.5 after:-inset-x-0.5 after:content-['']",
                    diffViewMode === "clean"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FileText className="size-3.5" />
                  {t("ui.view_mode_clean") || "Clean"}
                </button>
              </div>
            </div>
          </DialogHeader>

          <div className="custom-scrollbar max-h-[calc(92vh-8rem)] overflow-y-auto p-6 sm:p-8">
            {selectedVariant && (
              <div className="mb-6 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("ui.detected_issues_label")}
                </h3>
                {selectedVariant.detectedIssues.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedVariant.detectedIssues.map((issue) => (
                      <span
                        key={issue.patternId}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-foreground/80"
                      >
                        {patternLabel(issue.patternId)}
                        <span className="text-primary">×{issue.count}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t("ui.detected_issues_empty")}
                  </p>
                )}
              </div>
            )}
            {renderComparisonBody(true)}
          </div>

          <div className="flex items-center justify-between border-t border-border/40 bg-muted/20 px-6 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreenOpen(false)}
            >
              <Minimize2 className="mr-1.5 size-3.5" />
              {t("ui.fullscreen_close") || "Close"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCopyResult}
              disabled={!selectedVariant}
            >
              <Copy className="mr-1.5 size-3.5" />
              {copied ? t("success.result_copied") : t("ui.copy_result")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CreativeQuotaPaywall
        open={creativeQuota.paywallOpen}
        onClose={() => creativeQuota.setPaywallOpen(false)}
        sourcePage="ai-humanizer"
      />
    </div>
  );
}
