"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Check, Copy, FileText, Sparkles, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import TurnstileInvisible, {
  TurnstileInvisibleHandle,
} from "@/components/TurnstileInvisible";
import GeneratorNavTabs from "@/components/generator-nav-tabs";
import {
  ESSAY_EXTENDER_REQUIREMENTS_LIMIT,
  ESSAY_EXTENDER_TARGET_WORD_LIMIT,
  ESSAY_EXTENDER_TEXT_LIMIT,
  countEssayWords,
  type EssayExtenderResult,
} from "@/app/api/essay-extender/_lib";
import { LANGUAGE_OPTIONS } from "@/lib/language-options";
import type { EssayExtenderPage } from "@/types/blocks/essay-extender";
import { Link, useRouter } from "@/i18n/navigation";
import { useAppContext } from "@/contexts/app";
import { useOpenPanel } from "@openpanel/nextjs";
import { useCreativeQuotaPage } from "@/hooks/useCreativeQuotaPage";
import { CreativeQuotaHint } from "@/components/blocks/creative-quota-hint";
import { CreativeQuotaPaywall } from "@/components/blocks/creative-quota-paywall";
import {
  ACTIVATION_EVENTS,
  buildActivationTrackingPayload,
  getWordCountBucket,
} from "@/lib/activation-funnel";

interface EssayExtenderProps {
  section: EssayExtenderPage;
}

export default function EssayExtender({ section }: EssayExtenderProps) {
  const router = useRouter();
  const { user } = useAppContext();
  const { track } = useOpenPanel();
  const creativeQuota = useCreativeQuotaPage("essay-extender");

  const [sourceText, setSourceText] = useState("");
  const [targetInput, setTargetInput] = useState("500");
  const [tone, setTone] = useState("academic");
  const [focus, setFocus] = useState("balanced");
  const [outputLanguage, setOutputLanguage] = useState("auto");
  const [additionalRequirements, setAdditionalRequirements] = useState("");
  const [selectedModel, setSelectedModel] = useState<"fast" | "creative">("fast");
  const [result, setResult] = useState<EssayExtenderResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const outputScrollRef = useRef<HTMLDivElement>(null);

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

  const targetWordCount = Number.parseInt(targetInput, 10);
  const sourceWordCount = countEssayWords(sourceText);
  const trimmedLength = sourceText.trim().length;
  const isOverLimit = trimmedLength > ESSAY_EXTENDER_TEXT_LIMIT;
  const isRequirementsOverLimit =
    additionalRequirements.trim().length > ESSAY_EXTENDER_REQUIREMENTS_LIMIT;
  const hasValidTarget =
    Number.isInteger(targetWordCount) &&
    targetWordCount > sourceWordCount &&
    targetWordCount <= ESSAY_EXTENDER_TARGET_WORD_LIMIT;
  const canGenerate =
    trimmedLength > 0 && !isOverLimit && !isRequirementsOverLimit && hasValidTarget && !isGenerating;

  const trackingPayload = useCallback(
    (action: string) => ({
      ...buildActivationTrackingPayload({
        sourcePage: "essay-extender",
        loggedIn: Boolean(user),
        action,
        model: selectedModel,
        contentType: "utility",
      }),
      tone,
      focus,
      output_language: outputLanguage,
      source_word_count_bucket: getWordCountBucket(sourceWordCount),
      target_word_count_bucket: getWordCountBucket(Number.isInteger(targetWordCount) ? targetWordCount : 0),
    }),
    [user, tone, focus, outputLanguage, selectedModel, sourceWordCount, targetWordCount]
  );

  const validateBeforeSubmit = useCallback(() => {
    const trimmed = sourceText.trim();
    if (!trimmed) {
      toast.error(t("validation.enter_source_text"));
      return false;
    }
    if (trimmed.length > ESSAY_EXTENDER_TEXT_LIMIT) {
      toast.error(t("validation.source_text_too_long"));
      return false;
    }
    if (additionalRequirements.trim().length > ESSAY_EXTENDER_REQUIREMENTS_LIMIT) {
      toast.error(t("validation.requirements_too_long"));
      return false;
    }
    if (
      !Number.isInteger(targetWordCount) ||
      targetWordCount <= countEssayWords(trimmed) ||
      targetWordCount > ESSAY_EXTENDER_TARGET_WORD_LIMIT
    ) {
      toast.error(t("validation.invalid_target_word_count"));
      return false;
    }
    return true;
  }, [sourceText, additionalRequirements, targetWordCount, t]);

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
    setCopied(false);
    outputScrollRef.current?.scrollTo({ top: 0 });
    setIsGenerating(true);
    track(ACTIVATION_EVENTS.generationStarted, trackingPayload("generation_started"));
    turnstileRef.current?.execute();
  }, [validateBeforeSubmit, selectedModel, creativeQuota, t, track, trackingPayload]);

  const handleTurnstileSuccess = useCallback(
    async (turnstileToken: string) => {
      try {
        const response = await fetch("/api/essay-extender", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceText: sourceText.trim(),
            targetWordCount,
            tone,
            focus,
            outputLanguage,
            additionalRequirements: additionalRequirements.trim(),
            model: selectedModel,
            turnstileToken,
          }),
        });

        const body = (await response.json()) as {
          code?: number;
          message?: string;
          data?: EssayExtenderResult;
        };

        if (!response.ok) {
          if (creativeQuota.handleQuotaError(response.status, body)) return;
          throw new Error(body.message || `HTTP ${response.status}`);
        }
        if (body.code !== 0 || !body.data) {
          throw new Error(body.message || "Generation failed");
        }

        setResult(body.data);
        if (selectedModel === "creative") creativeQuota.increment();
        track(ACTIVATION_EVENTS.generationSucceeded, trackingPayload("generation_succeeded"));
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 250);
      } catch {
        toast.error(t("errors.generation_failed"));
        track(ACTIVATION_EVENTS.generationFailed, trackingPayload("generation_failed"));
      } finally {
        setIsGenerating(false);
      }
    },
    [sourceText, targetWordCount, tone, focus, outputLanguage, additionalRequirements, selectedModel, creativeQuota, t, track, trackingPayload]
  );

  const handleTurnstileError = useCallback(() => {
    setIsGenerating(false);
    toast.error(t("errors.generation_failed"));
    track(ACTIVATION_EVENTS.generationFailed, trackingPayload("generation_failed"));
  }, [t, track, trackingPayload]);

  const handleCopyResult = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.extendedText);
    } catch {
      toast.error(t("errors.copy_failed"));
      return;
    }
    setCopied(true);
    toast.success(t("success.result_copied"));
    track(ACTIVATION_EVENTS.resultCopied, trackingPayload("result_copied"));
  }, [result, t, track, trackingPayload]);

  const handleContinueToAiWrite = useCallback(() => {
    track("continue_ai_write_cta_click", {
      source_page: "essay-extender",
      logged_in: Boolean(user),
      cta_variant: "clean_ai_write",
    });
    router.push("/ai-write");
  }, [router, track, user]);

  const resultWordCount = result ? countEssayWords(result.extendedText) : 0;
  const addedWordCount = result ? resultWordCount - sourceWordCount : 0;

  return (
    <div id="essay_extender" className="relative bg-background text-foreground">
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
          <div className="relative z-10 mt-3 mb-5 flex justify-center items-center gap-2">
            <span className="text-primary text-sm">¶</span>
            {[3, 5, 7, 5, 3].map((s, i) => (
              <span key={i} className="inline-block rounded-full bg-primary" style={{ width: s, height: s }} />
            ))}
            <span className="text-primary text-base">✦</span>
            {[3, 5, 7, 5, 3].map((s, i) => (
              <span key={i} className="inline-block rounded-full bg-primary" style={{ width: s, height: s }} />
            ))}
            <span className="text-primary text-sm">§</span>
          </div>
          <p className="relative z-10 mx-auto max-w-xl text-base font-light leading-relaxed text-muted-foreground/80 sm:text-lg">
            {t("ui.subtitle")}
          </p>
        </div>

        <div className="mb-8 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <GeneratorNavTabs />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
          <div className="space-y-4 rounded-3xl border border-border/50 bg-card p-6 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto custom-scrollbar">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="essay-extender-text" className="text-sm font-semibold text-foreground">
                  {t("ui.source_text_label")} <span className="text-primary">*</span>
                </Label>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {sourceWordCount}
                </span>
              </div>
              <Textarea
                id="essay-extender-text"
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
                placeholder={t("placeholders.source_text")}
                aria-describedby="essay-extender-text-hint essay-extender-counter"
                disabled={isGenerating}
                className="min-h-[200px] resize-y rounded-xl border-border/50 bg-background p-4 text-base leading-relaxed focus-visible:border-primary/50 focus-visible:ring-primary/20"
              />
              <div className="space-y-1">
                <p id="essay-extender-text-hint" className="text-xs text-muted-foreground">
                  {t("ui.source_text_hint")}
                </p>
                <p id="essay-extender-counter" className="text-xs text-muted-foreground">
                  {t("ui.character_limit_hint")}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="essay-extender-target" className="text-xs font-medium tracking-wide text-muted-foreground">
                {t("ui.target_word_count_label")}
              </Label>
              <Input
                id="essay-extender-target"
                type="number"
                inputMode="numeric"
                min={1}
                max={ESSAY_EXTENDER_TARGET_WORD_LIMIT}
                step={1}
                value={targetInput}
                onChange={(event) => setTargetInput(event.target.value)}
                aria-describedby="essay-extender-target-hint"
                aria-invalid={targetInput.trim() !== "" && !hasValidTarget}
                disabled={isGenerating}
                className="h-11 rounded-lg border-border/50 bg-background sm:h-9"
              />
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("ui.target_word_count_label")}>
                {section.ui.target_shortcuts.map((shortcut) => (
                  <Button
                    key={shortcut}
                    type="button"
                    variant={targetWordCount === shortcut ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTargetInput(String(shortcut))}
                    disabled={isGenerating}
                    className="h-9 rounded-full px-3 text-xs tabular-nums min-w-11"
                  >
                    {shortcut}
                  </Button>
                ))}
              </div>
              <p id="essay-extender-target-hint" className="text-xs text-muted-foreground">
                {t("ui.target_word_count_hint")}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                  {t("ui.tone_label")}
                </Label>
                <Select value={tone} onValueChange={setTone} disabled={isGenerating}>
                  <SelectTrigger
                    aria-label={t("ui.tone_label")}
                    className="h-11 w-full rounded-lg border-border/50 bg-background sm:h-9"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {section.ui.tone_options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium tracking-wide text-muted-foreground">
                  {t("ui.focus_label")}
                </Label>
                <Select value={focus} onValueChange={setFocus} disabled={isGenerating}>
                  <SelectTrigger
                    aria-label={t("ui.focus_label")}
                    className="h-11 w-full rounded-lg border-border/50 bg-background sm:h-9"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {section.ui.focus_options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  className="h-11 w-full rounded-lg border-border/50 bg-background sm:h-9"
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
                  className="h-11 w-full rounded-lg border-border/50 bg-background sm:h-9"
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
              <Label htmlFor="essay-extender-requirements" className="text-xs font-medium tracking-wide text-muted-foreground">
                {t("ui.additional_requirements_label")}
              </Label>
              <Textarea
                id="essay-extender-requirements"
                value={additionalRequirements}
                onChange={(event) => setAdditionalRequirements(event.target.value)}
                placeholder={t("placeholders.additional_requirements")}
                disabled={isGenerating}
                className="min-h-[80px] resize-y rounded-xl border-border/50 bg-background p-3 text-sm leading-relaxed focus-visible:border-primary/50 focus-visible:ring-primary/20"
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
              pageKey="essay-extender"
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
                {result && (
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

              <div
                ref={outputScrollRef}
                className="custom-scrollbar max-h-[70dvh] min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8 lg:max-h-none"
              >
                {isGenerating ? (
                  <div className="flex min-h-[240px] flex-col items-center justify-center gap-5 text-center opacity-70">
                    <div className="relative mx-auto size-14">
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                      <div className="absolute inset-0 animate-spin rounded-full border-4 border-t-primary" />
                    </div>
                    <p className="text-sm font-medium">{t("ui.generating")}</p>
                  </div>
                ) : result ? (
                  <div className="space-y-6">
                    <dl className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-border/40 bg-background/60 p-3 text-center">
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {t("ui.actual_word_count")}
                        </dt>
                        <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                          {resultWordCount}
                        </dd>
                      </div>
                      <div className="rounded-xl border border-border/40 bg-background/60 p-3 text-center">
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {t("ui.target_word_count")}
                        </dt>
                        <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                          {Number.isInteger(targetWordCount) ? targetWordCount : "—"}
                        </dd>
                      </div>
                      <div className="rounded-xl border border-primary/30 bg-primary/[0.06] p-3 text-center">
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-primary">
                          {t("ui.added_word_count")}
                        </dt>
                        <dd className="mt-1 text-lg font-semibold tabular-nums text-primary">
                          +{addedWordCount}
                        </dd>
                      </div>
                    </dl>
                    <div className="whitespace-pre-wrap break-words text-base leading-relaxed text-foreground/90">
                      {result.extendedText}
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 text-center opacity-60">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/5">
                      <FileText className="size-7 text-primary/50" aria-hidden="true" />
                    </div>
                    <p className="mx-auto max-w-xs text-sm text-muted-foreground">
                      {t("ui.output_empty")}
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
                    disabled={!result}
                    className="min-h-11 w-full sm:w-auto"
                  >
                    <Copy className="mr-2 size-4" aria-hidden="true" />
                    {t("ui.copy_result")}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleContinueToAiWrite}
                    className="min-h-11 w-full sm:ml-auto sm:w-auto"
                  >
                    {t("ui.continue_ai_write")}
                    <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                  </Button>
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
        sourcePage="essay-extender"
      />
    </div>
  );
}
