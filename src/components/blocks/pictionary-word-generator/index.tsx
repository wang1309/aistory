"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useOpenPanel } from "@openpanel/nextjs";
import { toast } from "sonner";
import {
  Copy,
  Dices,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Timer,
  Users,
} from "lucide-react";
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
type TimerValue = (typeof TIMER_SECONDS)[number];

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function PictionaryWordGenerator({ section }: Props) {
  const { track } = useOpenPanel();
  const ui = section.ui;

  const [filter, setFilter] = useState<PictionaryPoolFilter>({
    category: "all",
    difficulty: "all",
  });
  const [count, setCount] = useState<CountValue>(1);
  const [customEnabled, setCustomEnabled] = useState(false);
  const [customRaw, setCustomRaw] = useState("");
  const [drawn, setDrawn] = useState<PictionaryEntry[]>([]);
  const [batch, setBatch] = useState<PictionaryEntry[]>([]);
  const [timerSeconds, setTimerSeconds] = useState<TimerValue>(60);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
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
    if (customInvalid) {
      toast.error(section.validation.custom_invalid);
      return;
    }
    const next = drawPictionaryWords(pool, count, exclude);
    if (next.length === 0) {
      toast.error(section.validation.no_words);
      return;
    }
    setBatch(next);
    setDrawn((prev) => [...prev, ...next]);
    track("pictionary_word_draw", {
      count: next.length,
      category: filter.category,
      difficulty: filter.difficulty,
      custom: Boolean(customWords),
    });
  }, [
    customInvalid,
    customWords,
    count,
    exclude,
    filter.category,
    filter.difficulty,
    pool,
    section.validation.custom_invalid,
    section.validation.no_words,
    track,
  ]);

  const handleResetHistory = useCallback(() => {
    setDrawn([]);
    setBatch([]);
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

  const handleTimerSelect = useCallback((value: string) => {
    const next = Number(value) as TimerValue;
    setTimerSeconds(next);
    setSecondsLeft(next);
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

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="text-center">
        <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
          {ui.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {titleParts.before}
          {titleParts.highlight && (
            <span className="text-rose-600 dark:text-rose-400">
              {titleParts.highlight}
            </span>
          )}
          {titleParts.after}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          {ui.subtitle}
        </p>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{ui.form_title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>{ui.category_label}</Label>
              <Select
                value={filter.category}
                onValueChange={(value) =>
                  setFilter((prev) => ({
                    ...prev,
                    category: value as PictionaryPoolFilter["category"],
                  }))
                }
              >
                <SelectTrigger>
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
              <Label>{ui.difficulty_label}</Label>
              <Select
                value={filter.difficulty}
                onValueChange={(value) =>
                  setFilter((prev) => ({
                    ...prev,
                    difficulty: value as PictionaryPoolFilter["difficulty"],
                  }))
                }
              >
                <SelectTrigger>
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
              <Label>{ui.count_label}</Label>
              <Select
                value={String(count)}
                onValueChange={(value) => setCount(Number(value) as CountValue)}
              >
                <SelectTrigger>
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

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-rose-600"
              checked={customEnabled}
              onChange={(event) => setCustomEnabled(event.target.checked)}
            />
            {ui.custom_toggle}
          </label>
          {customEnabled && (
            <div className="space-y-2">
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
                  customInvalid ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {ui.custom_hint}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleDraw} disabled={customInvalid} className="gap-2">
              <Dices className="size-4" />
              {batch.length > 0 ? ui.reroll_button : ui.draw_button}
            </Button>
            <Button
              variant="outline"
              onClick={handleResetHistory}
              className="gap-2"
            >
              <RotateCcw className="size-4" />
              {ui.reset_button}
            </Button>
            <span className="text-sm text-muted-foreground">
              {ui.pool_label.replace("{count}", String(pool.length))}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{ui.output_title}</CardTitle>
          {batch.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              <Copy className="size-4" />
              {ui.copy_button}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {batch.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {ui.empty_output}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {batch.map((entry) => (
                <li
                  key={entry.word}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-4 text-center text-sm font-semibold dark:border-rose-900 dark:bg-rose-950"
                >
                  {entry.word}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="size-4" />
              {ui.timer_label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={String(timerSeconds)}
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
            <p
              className={cn(
                "text-center text-5xl font-bold tabular-nums",
                timerDone && "text-rose-600 dark:text-rose-400"
              )}
              aria-live="polite"
            >
              {timerDone ? ui.timer_done : formatClock(secondsLeft)}
            </p>
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
                    className="gap-1"
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
    </section>
  );
}
