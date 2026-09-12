"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy, Dices, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import TurnstileInvisible, {
  TurnstileInvisibleHandle,
} from "@/components/TurnstileInvisible";
import { pickRandomEmojiTranslatorPreset } from "@/components/blocks/emoji-translator/lib";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  EmojiTranslatorMode,
  EmojiTranslatorResponse,
  EmojiTranslatorScenario,
  EmojiTranslatorTone,
} from "@/types/emoji-translator";
import type { EmojiTranslatorPage } from "@/types/blocks/emoji-translator";

interface Props {
  section: EmojiTranslatorPage;
}

const MAX_TEXT = 500;
const MAX_CONTEXT = 300;

// Emoji faces cycling in the loading state; keep in sync with the
// emoji-swap keyframe timing in globals.css (1s per face).
const LOADING_EMOJIS = ["😊", "🤔", "✨", "😂", "🔥", "🎉", "🥳", "👀"];

// Mode literal references keep the supported modes discoverable in source
// (add / translate / explain) and align with the API contract.
const MODES: EmojiTranslatorMode[] = ["add", "translate", "explain"];

export default function EmojiTranslator({ section }: Props) {
  const locale = useLocale();
  const tAiTools = useTranslations("ai_tools");
  const turnstileRef = useRef<TurnstileInvisibleHandle>(null);
  const ui = section.ui;

  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [mode, setMode] = useState<EmojiTranslatorMode>("add");
  const [scenario, setScenario] = useState<EmojiTranslatorScenario>("chat_reply");
  const [tone, setTone] = useState<EmojiTranslatorTone>("subtle");
  const [results, setResults] = useState<EmojiTranslatorResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const titleHighlight = ui.title_highlight ?? "";
  const fullTitle = ui.title ?? "";
  const themePills = ui.theme_pills ?? [];

  const titleParts = useMemo(() => {
    if (titleHighlight && fullTitle.includes(titleHighlight)) {
      const idx = fullTitle.indexOf(titleHighlight);
      return {
        before: fullTitle.slice(0, idx),
        after: fullTitle.slice(idx + titleHighlight.length),
        highlight: titleHighlight,
      };
    }
    return { before: fullTitle, after: "", highlight: "" };
  }, [fullTitle, titleHighlight]);

  const showContext = mode === "explain";

  const modeLabel = (value: EmojiTranslatorMode) =>
    ui.mode_options.find((opt) => opt.value === value)?.label ?? value;

  const runGeneration = useCallback(
    async (turnstileToken: string) => {
      try {
        const response = await fetch("/api/emoji-translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            context,
            mode,
            scenario,
            tone,
            locale,
            turnstileToken,
          }),
        });
        const json = await response.json();
        if (!response.ok || json.code === -1) {
          toast.error(json.message ?? section.errors.generate_failed);
          return;
        }
        setResults(json as EmojiTranslatorResponse);
        toast.success(section.success.generated);
      } catch (error) {
        console.error("emoji translator generation failed", error);
        toast.error(section.validation.generic_error);
      } finally {
        setIsGenerating(false);
      }
    },
    [text, context, mode, scenario, tone, locale, section]
  );

  const onGenerate = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error(section.validation.text_required);
      return;
    }
    if (text.length > MAX_TEXT) {
      toast.error(section.validation.text_too_long);
      return;
    }
    if (context.length > MAX_CONTEXT) {
      toast.error(section.validation.context_too_long);
      return;
    }
    setIsGenerating(true);
    turnstileRef.current?.execute();
  }, [text, context, section.validation]);

  const onRandom = useCallback(() => {
    const preset = pickRandomEmojiTranslatorPreset({
      presets: section.random_prompts ?? [],
    });
    setText(preset.text);
    setContext(preset.context);
    setMode(preset.mode);
    setScenario(preset.scenario);
    setTone(preset.tone);
    toast.success(section.success.random_prompt_selected ?? "Random example loaded.");
  }, [section.random_prompts, section.success.random_prompt_selected]);

  const onCopy = useCallback(
    async (output: string) => {
      try {
        await navigator.clipboard.writeText(output);
        toast.success(section.success.copied);
      } catch (error) {
        console.error("emoji translator copy failed", error);
        toast.error(section.validation.generic_error);
      }
    },
    [section.success.copied, section.validation.generic_error]
  );

  return (
    <section
      id="emoji_translator"
      className="min-h-[100dvh] bg-background text-foreground selection:bg-orange-500/20"
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.93_0.05_65),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.18_0.04_65),transparent)]" />
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-orange-500/[0.04] via-orange-500/[0.02] to-transparent" />
      </div>

      <main className="container relative z-10 mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-24">
        {/* Breadcrumb pill */}
        <div className="mb-10 flex justify-start">
          <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
            <Link
              href="/"
              className="transition-colors hover:text-foreground/80"
            >
              {ui.breadcrumb_home}
            </Link>
            <span className="mx-2 text-muted-foreground/40">/</span>
            <Link
              href="/ai-tools"
              className="transition-colors hover:text-foreground/80"
            >
              {tAiTools("tools_hub_nav")}
            </Link>
            <span className="mx-2 text-muted-foreground/40">/</span>
            <span className="text-foreground/80">{ui.breadcrumb_current}</span>
          </div>
        </div>

        {/* Hero copy */}
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <div className="group mb-6 flex justify-center">
            <div className="relative rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 dark:bg-white/[0.015]">
              <div className="relative flex size-12 items-center justify-center rounded-xl bg-orange-500/10">
                <Sparkles className="relative size-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <span className="mb-5 inline-flex items-center rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {ui.eyebrow}
          </span>

          <h1 className="mt-4 pb-1 font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
            {titleParts.before}
            {titleParts.highlight && (
              <span className="text-gradient-ember italic">
                {titleParts.highlight}
              </span>
            )}
            {titleParts.after}
          </h1>

          <p className="mx-auto mt-5 max-w-xl font-light text-base leading-relaxed text-muted-foreground/65 sm:text-lg">
            {ui.subtitle}
          </p>

          {themePills.length > 0 && (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              {themePills.map((pill, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/[0.04] px-3 py-1 text-xs font-medium text-orange-700 dark:text-orange-300"
                >
                  <span className="inline-block size-1 rounded-full bg-orange-500/60" />
                  {pill}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>{ui.form_title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="emoji-text">{ui.text_label}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onRandom}
                    className="h-7 gap-1.5 px-2.5 text-xs text-orange-600 hover:bg-orange-500/10 dark:text-orange-400"
                  >
                    <Dices className="size-3.5" />
                    {ui.random_button ?? "Random"}
                  </Button>
                </div>
                <Textarea
                  id="emoji-text"
                  placeholder={ui.text_placeholder}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  className="mt-1.5 resize-none"
                  maxLength={MAX_TEXT}
                />
                <p className="mt-1 text-right text-[11px] text-muted-foreground/50">
                  {text.length}/{MAX_TEXT}
                </p>
              </div>

              {showContext && (
                <div>
                  <Label htmlFor="emoji-context">{ui.context_label}</Label>
                  <Textarea
                    id="emoji-context"
                    placeholder={ui.context_placeholder}
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    rows={2}
                    className="mt-1.5 resize-none"
                    maxLength={MAX_CONTEXT}
                  />
                  <p className="mt-1 text-right text-[11px] text-muted-foreground/50">
                    {context.length}/{MAX_CONTEXT}
                  </p>
                </div>
              )}

              <div>
                <Label>{ui.mode_label}</Label>
                <Select
                  value={mode}
                  onValueChange={(v) => setMode(v as EmojiTranslatorMode)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {modeLabel(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{ui.scenario_label}</Label>
                <Select
                  value={scenario}
                  onValueChange={(v) =>
                    setScenario(v as EmojiTranslatorScenario)
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ui.scenario_options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{ui.tone_label}</Label>
                <Select
                  value={tone}
                  onValueChange={(v) => setTone(v as EmojiTranslatorTone)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ui.tone_options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={onGenerate}
                disabled={isGenerating}
                className="w-full"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? ui.generating_button : ui.generate_button}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div
            className={cn(
              "space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1 lg:pb-2",
              results && !isGenerating
                ? "lg:self-start"
                : "lg:self-stretch"
            )}
          >
            {isGenerating ? (
              <div
                aria-live="polite"
                className="flex h-full min-h-48 flex-col items-center justify-center gap-5 rounded-lg border border-dashed"
              >
                <div className="relative flex h-16 w-16 items-center justify-center">
                  {LOADING_EMOJIS.map((emoji, i) => (
                    <span
                      key={emoji}
                      aria-hidden="true"
                      className="emoji-translator-loading-emoji absolute text-5xl"
                      style={
                        {
                          "--emoji-index": i,
                        } as React.CSSProperties
                      }
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {ui.generating_button}
                </p>
              </div>
            ) : results ? (
              results.variants.map((variant, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                        {ui.result_label} {i + 1}
                      </span>
                      <CardTitle className="mt-1 break-words text-lg leading-snug">
                        {variant.output}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => onCopy(variant.output)}
                      aria-label={ui.copy_button}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">
                        {ui.reason_label}:
                      </span>{" "}
                      {variant.reason}
                    </p>
                    {variant.caution && (
                      <p className="rounded-md border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/[0.04] dark:text-amber-300">
                        <span className="font-medium">
                          {ui.caution_label}:
                        </span>{" "}
                        {variant.caution}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="flex h-full min-h-48 items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground">
                {ui.empty_output}
              </div>
            )}
          </div>
        </div>
      </main>

      <TurnstileInvisible
        ref={turnstileRef}
        onSuccess={runGeneration}
        onError={() => {
          setIsGenerating(false);
          toast.error(
            section.errors?.verification_failed ?? section.validation.generic_error
          );
        }}
      />
    </section>
  );
}
