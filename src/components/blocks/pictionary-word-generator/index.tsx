"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useOpenPanel } from "@openpanel/nextjs";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import {
  Copy,
  Dices,
  Palette,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Timer,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  buildPictionaryPool,
  drawPictionaryWords,
  parseCustomWordList,
  type PictionaryEntry,
  type PictionaryPoolFilter,
} from "@/lib/pictionary-words";
import type { PictionaryWordGeneratorPage } from "@/types/blocks/pictionary-word-generator";

interface Props {
  section: PictionaryWordGeneratorPage;
}

const COUNTS = [1, 3, 5, 10] as const;
type CountValue = (typeof COUNTS)[number];
const TIMER_SECONDS = [30, 60, 90] as const;
const ROLL_TOTAL_MS = 700;

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function PictionaryWordGenerator({ section }: Props) {
  const { track } = useOpenPanel();
  const ui = section.ui;
  const tAiTools = useTranslations("ai_tools");

  const [filter, setFilter] = useState<PictionaryPoolFilter>({
    category: "all",
    difficulty: "all",
  });
  const [count, setCount] = useState<CountValue>(1);
  const [customEnabled, setCustomEnabled] = useState(false);
  const [customRaw, setCustomRaw] = useState("");
  const [drawn, setDrawn] = useState<PictionaryEntry[]>([]);
  const [batch, setBatch] = useState<PictionaryEntry[]>([]);
  const [rolling, setRolling] = useState(false);
  const rollTimeoutRef = useRef<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(60);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isCustomTimer, setIsCustomTimer] = useState(false);
  const [customDraft, setCustomDraft] = useState("45");
  const [scores, setScores] = useState({ a: 0, b: 0 });

  const customWords = useMemo(() => {
    if (!customEnabled) return undefined;
    const parsed = parseCustomWordList(customRaw);
    return parsed.ok ? parsed.words : undefined;
  }, [customEnabled, customRaw]);

  const pool = useMemo(
    () => buildPictionaryPool(filter, customWords),
    [filter, customWords]
  );
  const customInvalid =
    customEnabled && parseCustomWordList(customRaw).ok === false;

  const exclude = useMemo(
    () => new Set(drawn.map((entry) => entry.word.toLowerCase())),
    [drawn]
  );

  const handleDraw = useCallback(() => {
    if (rolling) return;
    if (customInvalid) {
      toast.error(section.validation.custom_invalid);
      return;
    }
    const next = drawPictionaryWords(pool, count, exclude);
    if (next.length === 0) {
      toast.error(section.validation.no_words);
      return;
    }
    setDrawn((prev) => [...prev, ...next]);
    track("pictionary_word_draw", {
      count: next.length,
      category: filter.category,
      difficulty: filter.difficulty,
      custom: Boolean(customWords),
    });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setBatch(next);
      return;
    }
    setRolling(true);
    rollTimeoutRef.current = window.setTimeout(() => {
      rollTimeoutRef.current = null;
      setRolling(false);
      setBatch(next);
    }, ROLL_TOTAL_MS);
  }, [
    customInvalid,
    customWords,
    count,
    exclude,
    filter.category,
    filter.difficulty,
    pool,
    rolling,
    section.validation.custom_invalid,
    section.validation.no_words,
    track,
  ]);

  const handleResetHistory = useCallback(() => {
    if (rollTimeoutRef.current !== null) {
      window.clearTimeout(rollTimeoutRef.current);
      rollTimeoutRef.current = null;
    }
    setRolling(false);
    setDrawn([]);
    setBatch([]);
  }, []);

  useEffect(() => {
    return () => {
      if (rollTimeoutRef.current !== null) {
        window.clearTimeout(rollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const timerDone = secondsLeft === 0 && !timerRunning;

  const handleTimerSelect = useCallback(
    (value: string) => {
      setTimerRunning(false);
      if (value === "custom") {
        setIsCustomTimer(true);
        setCustomDraft(String(timerSeconds));
        return;
      }
      setIsCustomTimer(false);
      const next = Number(value);
      setTimerSeconds(next);
      setSecondsLeft(next);
    },
    [timerSeconds]
  );

  const handleCustomTimerChange = useCallback((raw: string) => {
    setCustomDraft(raw);
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.min(600, Math.max(5, parsed));
    setTimerSeconds(clamped);
    setSecondsLeft(clamped);
    setTimerRunning(false);
  }, []);

  const handleCopy = useCallback(async () => {
    if (batch.length === 0) return;
    await navigator.clipboard.writeText(batch.map((e) => e.word).join(", "));
    toast.success(section.success.copied);
  }, [batch, section.success.copied]);

  const titleHighlight = ui.title_highlight ?? "";
  const fullTitle = ui.title;
  const titleParts = useMemo(() => {
    if (titleHighlight && fullTitle.includes(titleHighlight)) {
      const idx = fullTitle.indexOf(titleHighlight);
      return {
        before: fullTitle.slice(0, idx),
        highlight: titleHighlight,
        after: fullTitle.slice(idx + titleHighlight.length),
      };
    }
    return { before: fullTitle, highlight: "", after: "" };
  }, [fullTitle, titleHighlight]);

  const spotlight = batch.length === 1 ? batch[0] : undefined;
  const spotlightCategory = spotlight
    ? ui.category_options.find(
        (option) => option.value === spotlight.category
      )?.label
    : undefined;
  const spotlightDifficulty = spotlight
    ? ui.difficulty_options.find(
        (option) => option.value === spotlight.difficulty
      )?.label
    : undefined;

  return (
    <section className="relative w-full">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.97_0_0),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.17_0_0),transparent)]" />
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-primary/[0.04] via-primary/[0.02] to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-16 sm:py-20">
        {/* Breadcrumb pill */}
        <div className="mb-8 flex justify-start">
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

        <div className="text-center">
          <div className="group mb-6 flex justify-center">
            <div className="relative rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 dark:bg-white/[0.015]">
              <div className="relative flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <Palette className="relative size-6 text-primary" />
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

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            {ui.category_options
              .filter((option) => option.value !== "all")
              .map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.04] px-3 py-1 text-xs font-medium text-primary"
                >
                  <span className="inline-block size-1 rounded-full bg-primary/60" />
                  {option.label}
                </span>
              ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[2fr_3fr]">
          <Card>
            <CardHeader>
              <CardTitle>{ui.form_title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pictionary-category">
                    {ui.category_label}
                  </Label>
                  <Select
                    value={filter.category}
                    onValueChange={(value) =>
                      setFilter((prev) => ({
                        ...prev,
                        category: value as PictionaryPoolFilter["category"],
                      }))
                    }
                  >
                    <SelectTrigger id="pictionary-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ui.category_options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pictionary-difficulty">
                    {ui.difficulty_label}
                  </Label>
                  <Select
                    value={filter.difficulty}
                    onValueChange={(value) =>
                      setFilter((prev) => ({
                        ...prev,
                        difficulty: value as PictionaryPoolFilter["difficulty"],
                      }))
                    }
                  >
                    <SelectTrigger id="pictionary-difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ui.difficulty_options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pictionary-count">{ui.count_label}</Label>
                  <Select
                    value={String(count)}
                    onValueChange={(value) => setCount(Number(value) as CountValue)}
                  >
                    <SelectTrigger id="pictionary-count">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ui.count_options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-foreground/[0.015] p-4 dark:bg-white/[0.02]">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="accent-rose-600"
                    checked={customEnabled}
                    onChange={(event) => setCustomEnabled(event.target.checked)}
                  />
                  {ui.custom_toggle}
                </label>
                {customEnabled && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      rows={4}
                      value={customRaw}
                      placeholder={ui.custom_placeholder}
                      onChange={(event) => setCustomRaw(event.target.value)}
                      aria-invalid={customInvalid}
                    />
                    <p
                      className={cn(
                        "text-xs",
                        customInvalid
                          ? "text-destructive"
                          : "text-muted-foreground"
                      )}
                    >
                      {ui.custom_hint}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-foreground/[0.015] p-4 dark:bg-white/[0.02]">
              <Button
                onClick={handleDraw}
                disabled={customInvalid || rolling}
                className="h-12 w-full gap-2 text-[15px]"
              >
                  <Dices className="size-4" />
                  {batch.length > 0 ? ui.reroll_button : ui.draw_button}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResetHistory}
                  className="h-10 w-full gap-2"
                >
                  <RotateCcw className="size-4" />
                  {ui.reset_button}
                </Button>
                <p className="text-center text-xs text-muted-foreground/60">
                  {ui.pool_label.replace("{count}", String(pool.length))}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card aria-live="polite">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2.5">
                {ui.output_title}
                {batch.length > 0 && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {batch.length}
                  </span>
                )}
              </CardTitle>
              {batch.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-11 gap-2 sm:h-8"
              >
                  <Copy className="size-4" />
                  {ui.copy_button}
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-center">
              {rolling ? (
                <div
                  className="flex min-h-48 items-center justify-center"
                  aria-hidden="true"
                >
                  <Dices className="dice-rolling size-16 text-primary" />
                </div>
              ) : batch.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed">
                  <Dices className="size-8 text-muted-foreground/40" />
                  <p className="max-w-xs text-center text-sm text-muted-foreground">
                    {ui.empty_output}
                  </p>
                </div>
              ) : spotlight ? (
                <div className="flex flex-col items-center gap-5 text-center">
                  <p className="break-words font-display text-4xl font-bold italic text-foreground sm:text-5xl">
                    <span className="text-gradient-ember">{spotlight.word}</span>
                  </p>
                  {(spotlightCategory || spotlightDifficulty) && (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {spotlightCategory && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.04] px-3 py-1 text-xs font-medium text-primary">
                          {spotlightCategory}
                        </span>
                      )}
                      {spotlightDifficulty && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.04] px-3 py-1 text-xs font-medium text-primary">
                          {spotlightDifficulty}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <ul className="flex flex-wrap justify-center gap-3">
                  {batch.map((entry) => (
                    <li
                      key={entry.word}
                      className="min-w-24 max-w-full break-words rounded-xl border border-rose-200 bg-rose-50 px-3 py-4 text-center text-sm font-semibold transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-rose-900 dark:bg-rose-950"
                    >
                      {entry.word}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_3fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="size-4" />
                {ui.timer_label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={isCustomTimer ? "custom" : String(timerSeconds)}
                onValueChange={handleTimerSelect}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ui.timer_options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isCustomTimer && !timerRunning && !timerDone ? (
                <Input
                  type="number"
                  min={5}
                  max={600}
                  value={customDraft}
                  onChange={(event) =>
                    handleCustomTimerChange(event.target.value)
                  }
                  aria-label={ui.timer_custom_label}
                  className="h-16 w-44 rounded-none border-0 border-b-2 border-border/60 bg-transparent px-2 text-center text-5xl font-bold tabular-nums focus-visible:border-primary focus-visible:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              ) : (
                <>
                  <span className="sr-only" role="status">
                    {timerDone ? ui.timer_done : ""}
                  </span>
                  <p
                    className={cn(
                      "text-center text-5xl font-bold tabular-nums",
                      timerDone && "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {timerDone ? ui.timer_done : formatClock(secondsLeft)}
                  </p>
                </>
              )}
              <div className="flex justify-center gap-3">
                <Button
                  onClick={() => {
                    if (secondsLeft === 0) setSecondsLeft(timerSeconds);
                    setTimerRunning((prev) => !prev);
                  }}
                  className="gap-2"
                >
                  {timerRunning ? (
                    <Pause className="size-4" />
                  ) : (
                    <Play className="size-4" />
                  )}
                  {timerRunning ? ui.timer_pause : ui.timer_start}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSecondsLeft(timerSeconds);
                    setTimerRunning(false);
                  }}
                  className="gap-2"
                >
                  <RotateCcw className="size-4" />
                  {ui.timer_reset}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4" />
                {ui.score_title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {(["a", "b"] as const).map((team) => (
                  <div key={team} className="space-y-2 text-center">
                    <p className="text-sm font-medium">
                      {team === "a" ? ui.team_a : ui.team_b}
                    </p>
                    <p className="text-4xl font-bold tabular-nums">
                      {scores[team]}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-11 gap-1 sm:h-8"
                      onClick={() =>
                        setScores((prev) => ({ ...prev, [team]: prev[team] + 1 }))
                      }
                    >
                      <Plus className="size-4" />
                      1
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setScores({ a: 0, b: 0 })}
                >
                  {ui.score_reset}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {ui.disclaimer}
        </p>
      </div>
    </section>
  );
}
