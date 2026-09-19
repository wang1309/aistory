"use client";

import { BookOpen, Dices, FileCode, FileText, Lock, LockOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { NpcCard, NpcField } from "@/lib/npc-generator";
import type { NpcGeneratorPage } from "@/types/blocks/npc-generator";

import NpcStatBlock, { type NpcStatBlockLabels } from "./stat-block";

export type NpcResultCardLabels = NpcStatBlockLabels &
  Pick<
    NpcGeneratorPage["ui"],
    | "field_name"
    | "field_race"
    | "field_presentation"
    | "field_role"
    | "field_appearance"
    | "field_mannerism"
    | "field_personality"
    | "field_motivation"
    | "field_secret"
    | "field_hook"
    | "reroll_field"
    | "lock_field"
    | "unlock_field"
    | "copy_markdown"
    | "copy_text"
    | "expand_backstory"
    | "stat_block"
  >;

interface NpcResultCardProps {
  card: NpcCard;
  lockedFields: ReadonlySet<NpcField>;
  labels: NpcResultCardLabels;
  onToggleLock(field: NpcField): void;
  onRerollField(field: NpcField): void;
  onCopy(kind: "markdown" | "text"): void;
  onExpandBackstory?(): void;
}

interface FieldActionsProps {
  field: NpcField;
  locked: boolean;
  labels: NpcResultCardLabels;
  onToggleLock(field: NpcField): void;
  onRerollField(field: NpcField): void;
}

function FieldActions({ field, locked, labels, onToggleLock, onRerollField }: FieldActionsProps) {
  const lockLabel = locked ? labels.unlock_field : labels.lock_field;
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        aria-pressed={locked}
        aria-label={lockLabel}
        title={lockLabel}
        onClick={() => onToggleLock(field)}
      >
        {locked ? <Lock className="size-4 text-primary" /> : <LockOpen className="size-4 text-muted-foreground" />}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={locked}
        aria-label={labels.reroll_field}
        title={labels.reroll_field}
        onClick={() => onRerollField(field)}
      >
        <Dices className="size-4" />
      </Button>
    </div>
  );
}

export default function NpcResultCard({
  card,
  lockedFields,
  labels,
  onToggleLock,
  onRerollField,
  onCopy,
  onExpandBackstory,
}: NpcResultCardProps) {
  const fieldRows: Array<{
    field: Exclude<NpcField, "statBlock">;
    label: string;
    value: string;
    fullWidth?: boolean;
  }> = [
    { field: "name", label: labels.field_name, value: card.name, fullWidth: true },
    { field: "race", label: labels.field_race, value: card.race },
    { field: "role", label: labels.field_role, value: card.role },
    { field: "appearance", label: labels.field_appearance, value: card.appearance },
    { field: "mannerism", label: labels.field_mannerism, value: card.mannerism },
    { field: "personality", label: labels.field_personality, value: card.personality },
    { field: "motivation", label: labels.field_motivation, value: card.motivation },
    { field: "secret", label: labels.field_secret, value: card.secret },
    { field: "hook", label: labels.field_hook, value: card.hook },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{card.name}</CardTitle>
        <CardDescription>
          {labels.field_race}: {card.race} · {labels.field_presentation}: {card.presentation} ·{" "}
          {labels.field_role}: {card.role}
        </CardDescription>
      </CardHeader>
      <CardContent
        className={cn(
          "space-y-4",
          card.statBlock && "xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start xl:gap-6 xl:space-y-0"
        )}
      >
        <div className={cn("grid gap-2 sm:grid-cols-2", card.statBlock && "xl:grid-cols-1")}>
          {fieldRows.map((row) => {
            const locked = lockedFields.has(row.field);
            return (
              <div
                key={row.field}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-lg border border-border/60 px-3 py-2",
                  row.fullWidth && "sm:col-span-2",
                  locked && "border-primary/30 bg-primary/[0.04]"
                )}
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {row.label}
                  </p>
                  <p className="text-sm text-foreground">{row.value}</p>
                </div>
                <FieldActions
                  field={row.field}
                  locked={locked}
                  labels={labels}
                  onToggleLock={onToggleLock}
                  onRerollField={onRerollField}
                />
              </div>
            );
          })}
        </div>

        {card.statBlock && (
          <div
            className={cn(
              "rounded-lg border border-border/60 px-3 py-3",
              lockedFields.has("statBlock") && "border-primary/30 bg-primary/[0.04]"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {labels.stat_block}
              </p>
              <FieldActions
                field="statBlock"
                locked={lockedFields.has("statBlock")}
                labels={labels}
                onToggleLock={onToggleLock}
                onRerollField={onRerollField}
              />
            </div>
            <div className="mt-2">
              <NpcStatBlock statBlock={card.statBlock} labels={labels} />
            </div>
          </div>
        )}

        <div className={cn("flex flex-wrap gap-2", card.statBlock && "xl:col-span-2")}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={labels.copy_markdown}
            onClick={() => onCopy("markdown")}
          >
            <FileCode className="size-4" />
            {labels.copy_markdown}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={labels.copy_text}
            onClick={() => onCopy("text")}
          >
            <FileText className="size-4" />
            {labels.copy_text}
          </Button>
          {onExpandBackstory && (
            <Button
              type="button"
              size="sm"
              aria-label={labels.expand_backstory}
              onClick={onExpandBackstory}
            >
              <BookOpen className="size-4" />
              {labels.expand_backstory}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
