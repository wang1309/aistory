"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useOpenPanel } from "@openpanel/nextjs";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  BookOpen,
  Copy,
  Dices,
  Lightbulb,
  RefreshCw,
  Trophy,
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
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  NFL_TEAMS,
  filterNflTeamsByScope,
  shuffleNflItems,
  type NflScopeFilter,
  type NflTeam,
} from "@/lib/nfl-teams";
import type {
  NflDrawMode,
  NflDrawResult,
  NflOption,
  RandomNflTeamGeneratorPage,
} from "@/types/blocks/random-nfl-team-generator";

interface Props {
  section: RandomNflTeamGeneratorPage;
}

const MODES: NflDrawMode[] = ["pick", "shuffle", "assign"];
const MODE_ICONS: Record<NflDrawMode, typeof Dices> = {
  pick: Dices,
  shuffle: ArrowLeftRight,
  assign: Users,
};
const MAX_PARTICIPANTS = 32;
const MAX_PARTICIPANT_LENGTH = 60;

function optionLabel(options: NflOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export default function RandomNflTeamGenerator({ section }: Props) {
  const locale = useLocale();
  const tAiTools = useTranslations("ai_tools");
  const { track } = useOpenPanel();
  const ui = section.ui;

  const [mode, setMode] = useState<NflDrawMode>("pick");
  const [scope, setScope] = useState<NflScopeFilter>("all");
  const [count, setCount] = useState(1);
  const [participantsRaw, setParticipantsRaw] = useState("");
  const [result, setResult] = useState<NflDrawResult | null>(null);

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

  const eligible = useMemo(
    () => filterNflTeamsByScope(NFL_TEAMS, scope),
    [scope]
  );

  const teamBadge = useCallback(
    (team: NflTeam) =>
      `${ui.conference_badge[team.conference]} · ${ui.division_badge[team.division]}`,
    [ui.conference_badge, ui.division_badge]
  );

  const onDraw = useCallback(() => {
    const pool = filterNflTeamsByScope(NFL_TEAMS, scope);
    if (pool.length === 0) {
      toast.error(section.validation.no_teams);
      return;
    }

    let nextResult: NflDrawResult;
    if (mode === "assign") {
      const participants = participantsRaw
        .split("\n")
        .map((line) => line.trim().slice(0, MAX_PARTICIPANT_LENGTH))
        .filter(Boolean)
        .slice(0, MAX_PARTICIPANTS);
      if (participants.length === 0) {
        toast.error(section.validation.participants_empty);
        return;
      }
      if (participants.length > pool.length) {
        toast.error(section.validation.participants_too_many);
        return;
      }
      nextResult = {
        mode,
        scope,
        teams: shuffleNflItems(pool).slice(0, participants.length),
        participants,
      };
      toast.success(section.success.assigned);
    } else if (mode === "shuffle") {
      nextResult = {
        mode,
        scope,
        teams: shuffleNflItems(pool),
        participants: [],
      };
      toast.success(section.success.shuffled);
    } else {
      const drawCount = Math.min(Math.max(count, 1), pool.length);
      setCount(drawCount);
      nextResult = {
        mode,
        scope,
        teams: shuffleNflItems(pool).slice(0, drawCount),
        participants: [],
      };
      toast.success(section.success.picked);
    }

    setResult(nextResult);
    track("nfl_team_drawn", {
      locale,
      mode,
      scope,
      pool_size: pool.length,
      drawn: nextResult.teams.length,
    });
  }, [
    count,
    locale,
    mode,
    participantsRaw,
    scope,
    section.success,
    section.validation,
    track,
  ]);

  const buildShareText = useCallback(
    (draw: NflDrawResult) => {
      const lines = [
        `${ui.share_mode_label}: ${optionLabel(ui.mode_options, draw.mode)}`,
        `${ui.share_filter_label}: ${optionLabel(ui.scope_options, draw.scope)}`,
        "",
      ];
      if (draw.mode === "assign") {
        draw.participants.forEach((participant, i) => {
          const team = draw.teams[i];
          if (team) {
            lines.push(`${participant} — ${team.name} (${teamBadge(team)})`);
          }
        });
      } else {
        draw.teams.forEach((team, i) => {
          lines.push(`${i + 1}. ${team.name} (${teamBadge(team)})`);
        });
      }
      lines.push("", ui.disclaimer);
      return lines.join("\n");
    },
    [
      teamBadge,
      ui.disclaimer,
      ui.mode_options,
      ui.scope_options,
      ui.share_filter_label,
      ui.share_mode_label,
    ]
  );

  const onCopyAll = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(buildShareText(result));
      toast.success(section.success.copied);
      track("nfl_team_copied", { locale, mode: result.mode, scope: result.scope });
    } catch (error) {
      console.error("nfl team draw copy failed", error);
      toast.error(section.validation.generic_error);
    }
  }, [buildShareText, locale, result, section.success.copied, section.validation.generic_error, track]);

  const onCopyTeam = useCallback(
    async (team: NflTeam) => {
      try {
        await navigator.clipboard.writeText(team.name);
        toast.success(section.success.copied);
        track("nfl_team_copied", { locale, mode, scope, single: true });
      } catch (error) {
        console.error("nfl team copy failed", error);
        toast.error(section.validation.generic_error);
      }
    },
    [locale, mode, scope, section.success.copied, section.validation.generic_error, track]
  );

  const onContinuation = useCallback(
    (target: "squad_name" | "backstory" | "prompt") => {
      track("nfl_team_continuation_opened", { locale, mode, scope, target });
    },
    [locale, mode, scope, track]
  );

  const onChangeMode = useCallback((next: string) => {
    setMode(next as NflDrawMode);
    setResult(null);
  }, []);

  const countOptions = useMemo(
    () =>
      Array.from({ length: eligible.length }, (_, i) => ({
        value: String(i + 1),
        label: String(i + 1),
      })),
    [eligible.length]
  );

  return (
    <section
      id="random_nfl_team_generator"
      className="min-h-[100dvh] bg-background text-foreground selection:bg-primary/20"
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.97_0_0),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.17_0_0),transparent)]" />
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-primary/[0.04] via-primary/[0.02] to-transparent" />
      </div>

      <main className="container relative z-10 mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-24">
        {/* Breadcrumb pill */}
        <div className="mb-10 flex justify-start">
          <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
            <Link
              href="/"
              className="-mx-1 -my-0.5 inline-flex items-center px-1 py-0.5 transition-colors hover:text-foreground/80"
            >
              {ui.breadcrumb_home}
            </Link>
            <span className="mx-2 text-muted-foreground/40">/</span>
            <Link
              href="/ai-tools"
              className="-mx-1 -my-0.5 inline-flex items-center px-1 py-0.5 transition-colors hover:text-foreground/80"
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
              <div className="relative flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <Trophy className="relative size-6 text-primary" />
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.04] px-3 py-1 text-xs font-medium text-primary"
                >
                  <span className="inline-block size-1 rounded-full bg-primary/60" />
                  {pill}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[2fr_3fr]">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>{ui.form_title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {/* Mode switch */}
              <div>
                <Label>{ui.mode_label}</Label>
                <div
                  className="mt-1.5 grid grid-cols-3 gap-1 rounded-lg border border-border/60 bg-muted/40 p-1"
                  role="tablist"
                  aria-label={ui.mode_label}
                >
                  {MODES.map((item) => {
                    const Icon = MODE_ICONS[item];
                    const active = mode === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChangeMode(item)}
                        className={cn(
                          "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-md px-1.5 py-2 text-center text-xs font-medium leading-tight transition-colors sm:min-h-9 sm:flex-row sm:gap-1.5 sm:px-2",
                          active
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className="size-3.5 shrink-0" />
                        <span>{optionLabel(ui.mode_options, item)}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground/70">
                  {ui.mode_hints[mode]}
                </p>
              </div>

              {/* Scope */}
              <div>
                <Label htmlFor="nfl-scope">{ui.scope_label}</Label>
                <Select
                  value={scope}
                  onValueChange={(v) => setScope(v as NflScopeFilter)}
                >
                  <SelectTrigger id="nfl-scope" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ui.scope_options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-right text-[11px] text-muted-foreground/50">
                  {ui.eligible_label} {eligible.length}
                </p>
              </div>

              {/* Mode-specific controls */}
              {mode === "pick" && (
                <div>
                  <Label htmlFor="nfl-count">{ui.count_label}</Label>
                  <Select
                    value={String(count)}
                    onValueChange={(v) => setCount(Number(v))}
                  >
                    <SelectTrigger id="nfl-count" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {countOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {mode === "assign" && (
                <div>
                  <Label htmlFor="nfl-participants">
                    {ui.participants_label}
                  </Label>
                  <Textarea
                    id="nfl-participants"
                    placeholder={ui.participants_placeholder}
                    value={participantsRaw}
                    onChange={(e) => setParticipantsRaw(e.target.value)}
                    rows={5}
                    className="mt-1.5"
                  />
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground/70">
                    {ui.participants_hint}
                  </p>
                </div>
              )}

              <Button onClick={onDraw} className="w-full">
                <Dices className="mr-2 h-4 w-4" />
                {mode === "pick"
                  ? ui.pick_button
                  : mode === "shuffle"
                    ? ui.shuffle_button
                    : ui.assign_button}
              </Button>

              {result && (
                <Button variant="outline" onClick={onDraw} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {ui.reroll_button}
                </Button>
              )}

              <p className="text-xs leading-relaxed text-muted-foreground/60">
                {ui.disclaimer}
              </p>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4" aria-live="polite">
            <p className="sr-only" role="status">
              {ui.output_title[result?.mode ?? mode]}
            </p>

            {result ? (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-base">
                      {ui.output_title[result.mode]} ·{" "}
                      {optionLabel(ui.scope_options, result.scope)}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 text-xs"
                      onClick={onCopyAll}
                    >
                      <Copy className="mr-1.5 h-3 w-3" />
                      {ui.copy_button}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {result.mode === "pick" && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {result.teams.map((team, i) => (
                          <div
                            key={team.abbr}
                            className="flex items-start justify-between gap-2 rounded-lg border border-border/40 bg-background/60 p-3"
                          >
                            <div className="min-w-0">
                              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
                                {ui.result_label} {i + 1}
                              </span>
                              <p className="mt-0.5 break-words text-base font-semibold leading-snug text-foreground">
                                {team.name}
                              </p>
                              <span className="mt-1.5 inline-flex items-center rounded-full border border-primary/20 bg-primary/[0.04] px-2 py-0.5 text-[11px] font-medium text-primary">
                                {teamBadge(team)}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-9 shrink-0"
                              onClick={() => onCopyTeam(team)}
                              aria-label={ui.copy_team_button}
                            >
                              <Copy className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {result.mode === "shuffle" && (
                      <ol className="grid gap-1.5 sm:grid-cols-2">
                        {result.teams.map((team, i) => (
                          <li
                            key={team.abbr}
                            className="flex items-baseline gap-2 rounded-md px-2 py-1.5 text-sm odd:bg-muted/40"
                          >
                            <span className="w-6 shrink-0 text-right text-xs font-semibold text-primary">
                              {i + 1}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="font-medium text-foreground">
                                {team.name}
                              </span>{" "}
                              <span className="text-xs text-muted-foreground/70">
                                {teamBadge(team)}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}

                    {result.mode === "assign" && (
                      <div className="overflow-hidden rounded-lg border border-border/40">
                        <div className="grid grid-cols-[1fr_1.2fr] gap-2 border-b border-border/40 bg-muted/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                          <span>{ui.participant_header}</span>
                          <span>{ui.team_header}</span>
                        </div>
                        {result.participants.map((participant, i) => {
                          const team = result.teams[i];
                          if (!team) return null;
                          return (
                            <div
                              key={participant + i}
                              className="grid grid-cols-[1fr_1.2fr] gap-2 border-b border-border/20 px-3 py-2 text-sm last:border-b-0"
                            >
                              <span className="min-w-0 break-words font-medium text-foreground">
                                {participant}
                              </span>
                              <span className="min-w-0 break-words text-foreground">
                                {team.name}{" "}
                                <span className="text-xs text-muted-foreground/70">
                                  {teamBadge(team)}
                                </span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {section.continuation && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        {section.continuation.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {section.continuation.description && (
                        <p className="text-sm text-muted-foreground">
                          {section.continuation.description}
                        </p>
                      )}
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Link
                          href="/ai-tools/gang-name-generator"
                          onClick={() => onContinuation("squad_name")}
                          className="group flex items-start gap-2.5 rounded-lg border border-border/40 bg-background/60 p-3 transition-colors hover:border-primary/40"
                        >
                          <Users className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span>
                            <span className="block text-sm font-medium text-foreground">
                              {section.continuation.squad_name_label}
                            </span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                              {section.continuation.squad_name_hint}
                            </span>
                          </span>
                        </Link>
                        <Link
                          href="/backstory-generator"
                          onClick={() => onContinuation("backstory")}
                          className="group flex items-start gap-2.5 rounded-lg border border-border/40 bg-background/60 p-3 transition-colors hover:border-primary/40"
                        >
                          <BookOpen className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span>
                            <span className="block text-sm font-medium text-foreground">
                              {section.continuation.backstory_label}
                            </span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                              {section.continuation.backstory_hint}
                            </span>
                          </span>
                        </Link>
                        <Link
                          href="/story-prompt-generator"
                          onClick={() => onContinuation("prompt")}
                          className="group flex items-start gap-2.5 rounded-lg border border-border/40 bg-background/60 p-3 transition-colors hover:border-primary/40"
                        >
                          <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span>
                            <span className="block text-sm font-medium text-foreground">
                              {section.continuation.prompt_label}
                            </span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                              {section.continuation.prompt_hint}
                            </span>
                          </span>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="flex h-full min-h-48 items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground">
                {ui.empty_output}
              </div>
            )}
          </div>
        </div>
      </main>
    </section>
  );
}
