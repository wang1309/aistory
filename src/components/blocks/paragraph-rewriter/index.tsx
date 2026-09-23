"use client";

import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { ArrowRight, Check, Copy, FileText, RefreshCw, Sparkles, Zap } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import TurnstileInvisible, {
  TurnstileInvisibleHandle,
} from "@/components/TurnstileInvisible";
import {
  PARAGRAPH_REWRITER_GOALS,
  PARAGRAPH_REWRITER_REQUIREMENTS_LIMIT,
  PARAGRAPH_REWRITER_TEXT_LIMIT,
  type ParagraphRewriteVariant,
  type ParagraphRewriterGoal,
  type ParagraphRewriterResult,
} from "@/app/api/paragraph-rewriter/_lib";
import { countEssayWords } from "@/app/api/essay-extender/_lib";
import { computeParagraphDiff } from "@/components/ai-write/editor/text-diff";
import { LANGUAGE_OPTIONS } from "@/lib/language-options";
import type { ParagraphRewriterPage } from "@/types/blocks/paragraph-rewriter";
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

interface ParagraphRewriterProps {
  section: ParagraphRewriterPage;
}

const LOADING_GLYPHS = ["¶", "❝", "❞", "✎", "§", "^", "—", "…"];

export default function ParagraphRewriter({ section }: ParagraphRewriterProps) {
  const { user } = useAppContext();
  const { track } = useOpenPanel();
  const creativeQuota = useCreativeQuotaPage("paragraph-rewriter");

  const [sourceText, setSourceText] = useState("");
  const [goal, setGoal] = useState<ParagraphRewriterGoal>("clearer");
  const [outputLanguage, setOutputLanguage] = useState("auto");
  const [additionalRequirements, setAdditionalRequirements] = useState("");
  const [selectedModel, setSelectedModel] = useState<"fast" | "creative">("fast");
  const [result, setResult] = useState<ParagraphRewriterResult | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<"option_a" | "option_b" | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submittedSourceText, setSubmittedSourceText] = useState("");
  const diffViewedForResponse = useRef(false);

  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const selectedVariant = result?.variants.find((variant) => variant.id === selectedVariantId) ?? null;
  const selectedDiff = useMemo(
    () => (selectedVariant ? computeParagraphDiff(submittedSourceText, selectedVariant.text) : null),
    [submittedSourceText, selectedVariant]
  );

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
  const isOverLimit = trimmedLength > PARAGRAPH_REWRITER_TEXT_LIMIT;
  const isRequirementsOverLimit =
    additionalRequirements.trim().length > PARAGRAPH_REWRITER_REQUIREMENTS_LIMIT;
  const canGenerate = trimmedLength > 0 && !isOverLimit && !isRequirementsOverLimit && !isGenerating;

  const trackingPayload = useCallback(
    (action: string, candidateId?: "option_a" | "option_b") => ({
      ...buildActivationTrackingPayload({
        sourcePage: "paragraph-rewriter",
        loggedIn: Boolean(user),
        action,
        model: selectedModel,
        contentType: "utility",
      }),
      goal,
      output_language: outputLanguage,
      ...(candidateId ? { candidate_id: candidateId } : {}),
      source_word_count_bucket: getWordCountBucket(countEssayWords(sourceText)),
    }),
    [user, goal, outputLanguage, selectedModel, sourceText]
  );

  const validateBeforeSubmit = useCallback(() => {
    const trimmed = sourceText.trim();
    if (!trimmed) {
      toast.error(t("validation.enter_source_text"));
      return false;
    }
    if (trimmed.length > PARAGRAPH_REWRITER_TEXT_LIMIT) {
      toast.error(t("validation.source_text_too_long"));
      return false;
    }
    if (additionalRequirements.trim().length > PARAGRAPH_REWRITER_REQUIREMENTS_LIMIT) {
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
    track("paragraph_rewriter_generation_started", trackingPayload("generation_started"));
    turnstileRef.current?.execute();
  }, [validateBeforeSubmit, selectedModel, creativeQuota, t, track, trackingPayload]);

  const handleTurnstileSuccess = useCallback(
    async (turnstileToken: string) => {
      try {
        const submittedSource = sourceText.trim();
        setSubmittedSourceText(submittedSource);
        const response = await fetch("/api/paragraph-rewriter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceText: submittedSource,
            goal,
            outputLanguage,
            additionalRequirements: additionalRequirements.trim(),
            model: selectedModel,
            turnstileToken,
          }),
        });

        const body = (await response.json()) as {
          code?: number;
          message?: string;
          data?: ParagraphRewriterResult;
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
        track("paragraph_rewriter_generation_succeeded", trackingPayload("generation_succeeded"));
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 250);
      } catch {
        toast.error(t("errors.generation_failed"));
        track("paragraph_rewriter_generation_failed", trackingPayload("generation_failed"));
      } finally {
        setIsGenerating(false);
      }
    },
    [sourceText, goal, outputLanguage, additionalRequirements, selectedModel, creativeQuota, t, track, trackingPayload]
  );

  const handleTurnstileError = useCallback(() => {
    setIsGenerating(false);
    toast.error(t("errors.generation_failed"));
    track("paragraph_rewriter_generation_failed", trackingPayload("generation_failed"));
  }, [t, track, trackingPayload]);

  const handleSelectVariant = useCallback(
    (variant: ParagraphRewriteVariant) => {
      if (variant.id !== selectedVariantId) {
        setCopied(false);
      }
      setSelectedVariantId(variant.id);
      track("paragraph_rewriter_variant_selected", trackingPayload("variant_selected", variant.id));
      if (!diffViewedForResponse.current) {
        diffViewedForResponse.current = true;
        track("paragraph_rewriter_diff_viewed", trackingPayload("diff_viewed", variant.id));
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
    track("paragraph_rewriter_result_copied", trackingPayload("result_copied", selectedVariant.id));
  }, [selectedVariant, t, track, trackingPayload]);

  const handleContinueToAiWrite = useCallback(() => {
    track("continue_ai_write_cta_click", {
      source_page: "paragraph-rewriter",
      logged_in: Boolean(user),
      cta_variant: "clean_ai_write",
    });
  }, [track, user]);

  return (
    <div id="paragraph_rewriter" className="relative bg-background text-foreground">
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
            <Link href="/" className="transition-colors hover:text-foreground/80">
              {t("ui.breadcrumb_home")}
            </Link>
            <span className="mx-2 text-muted-foreground/40">/</span>
            <span className="text-foreground/80">{t("ui.breadcrumb_current")}</span>
          </div>
        </div>

        <div className="relative mx-auto max-w-2xl text-center">
          <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-5">
            <span className="inline-block size-1.5 rounded-full bg-primary/50 opacity-60" />
            {t("ui.eyebrow")}
          </span>
          <h1 className="relative z-10 mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
            {titleParts.before}
            {titleParts.highlight && (
              <span className="text-gradient-ember italic">{titleParts.highlight}</span>
            )}
            {titleParts.after}
          </h1>
          <p className="relative z-10 mx-auto mt-4 max-w-xl text-base font-light leading-relaxed text-muted-foreground/80 sm:text-lg">
            {t("ui.subtitle")}
          </p>
        </div>

        <div className="mb-8 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
          <div className="space-y-4 rounded-3xl border border-border/50 bg-card p-6 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto custom-scrollbar">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="paragraph-rewriter-text" className="text-sm font-semibold text-foreground">
                  {t("ui.source_text_label")} <span className="text-primary">*</span>
                </Label>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {trimmedLength}
                </span>
              </div>
              <Textarea
                id="paragraph-rewriter-text"
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
                placeholder={t("placeholders.source_text")}
                aria-describedby="paragraph-rewriter-text-hint paragraph-rewriter-counter"
                aria-invalid={isOverLimit}
                disabled={isGenerating}
                className="min-h-[180px] resize-y rounded-xl border-border/50 bg-background p-4 text-base leading-relaxed focus-visible:border-primary/50 focus-visible:ring-primary/20"
              />
              <div className="space-y-1">
                <p id="paragraph-rewriter-text-hint" className="text-xs text-muted-foreground">
                  {t("ui.source_text_hint")}
                </p>
                <p id="paragraph-rewriter-counter" className="text-xs text-muted-foreground">
                  {t("ui.character_limit_hint")}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                {t("ui.goal_label")}
              </Label>
              <Select value={goal} onValueChange={(value) => setGoal(value as ParagraphRewriterGoal)} disabled={isGenerating}>
                <SelectTrigger
                  aria-label={t("ui.goal_label")}
                  className="h-11 w-full rounded-lg border-border/50 bg-background sm:pointer-fine:h-9"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARAGRAPH_REWRITER_GOALS.map((goalValue) => (
                    <SelectItem key={goalValue} value={goalValue}>
                      {t(`goals.${goalValue}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="paragraph-rewriter-requirements" className="text-xs font-medium tracking-wide text-muted-foreground">
                {t("ui.additional_requirements_label")}
              </Label>
              <Textarea
                id="paragraph-rewriter-requirements"
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
              pageKey="paragraph-rewriter"
              selectedModel={selectedModel}
              used={creativeQuota.used}
              limit={creativeQuota.limit}
              className="mt-3"
            />
          </div>

          <div className="relative">
            <div
              ref={resultRef}
              aria-live="polite"
              className="flex flex-col overflow-hidden rounded-3xl border border-border/50 bg-card shadow-sm lg:absolute lg:inset-0"
            >
              <div className="flex items-center gap-3 border-b border-border/40 px-6 py-4 sm:px-8">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <FileText className="size-4" aria-hidden="true" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">
                  {t("ui.result_title")}
                </h2>
                {selectedVariant && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyResult}
                    aria-label={t("ui.copy_result")}
                    className="ml-auto size-11 shrink-0"
                  >
                    {copied ? (
                      <Check className="size-4 text-primary" aria-hidden="true" />
                    ) : (
                      <Copy className="size-4" aria-hidden="true" />
                    )}
                  </Button>
                )}
              </div>

              <div className="custom-scrollbar max-h-[70dvh] min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8 lg:max-h-none">
                {isGenerating ? (
                  <div className="flex min-h-[240px] flex-col items-center justify-center gap-5 text-center opacity-70">
                    <div
                      aria-hidden="true"
                      className="relative flex h-16 w-16 items-center justify-center"
                    >
                      {LOADING_GLYPHS.map((glyph, i) => (
                        <span
                          key={glyph}
                          className="rewrite-loading-glyph absolute font-display text-4xl text-primary"
                          style={{ "--glyph-index": i } as CSSProperties}
                        >
                          {glyph}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm font-medium">{t("ui.generating")}</p>
                  </div>
                ) : result ? (
                  <div className="space-y-6">
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

                    {selectedVariant && selectedDiff && (
                      <div className="space-y-3">
                        <div className="grid gap-4 lg:grid-cols-2">
                          <article aria-labelledby="paragraph-rewriter-original" className="rounded-xl border border-border/40 bg-background/60 p-4">
                            <h3 id="paragraph-rewriter-original" className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {t("ui.original_text")}
                            </h3>
                            <p dir="auto" className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
                              {selectedDiff.original.map((segment, index) =>
                                segment.changed
                                  ? <mark key={index} className="bg-amber-200/70 text-inherit dark:bg-amber-500/25">{segment.text}</mark>
                                  : <span key={index}>{segment.text}</span>
                              )}
                            </p>
                          </article>
                          <article aria-labelledby="paragraph-rewriter-rewrite" className="rounded-xl border border-border/40 bg-background/60 p-4">
                            <h3 id="paragraph-rewriter-rewrite" className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {t("ui.rewritten_text")}
                            </h3>
                            <p dir="auto" className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
                              {selectedDiff.modified.map((segment, index) =>
                                segment.changed
                                  ? <mark key={index} className="bg-emerald-200/70 text-inherit dark:bg-emerald-500/25">{segment.text}</mark>
                                  : <span key={index}>{segment.text}</span>
                              )}
                            </p>
                          </article>
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {t("ui.changed_text_hint")}
                        </p>
                      </div>
                    )}
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
      <CreativeQuotaPaywall
        open={creativeQuota.paywallOpen}
        onClose={() => creativeQuota.setPaywallOpen(false)}
        sourcePage="paragraph-rewriter"
      />
    </div>
  );
}
