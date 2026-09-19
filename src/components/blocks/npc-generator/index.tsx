"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Dices, Lock, RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildNpcMarkdown,
  buildNpcPlainText,
  generateNpcCard,
  mergeLockedFields,
  rerollNpcField,
  secureNpcRandom,
} from "@/lib/npc-generator";
import type {
  NpcCard,
  NpcCrTier,
  NpcField,
  NpcGameSystem,
  NpcGenerationOptions,
  NpcGeneratorData,
} from "@/lib/npc-generator";
import {
  buildNpcBackstoryPrefill,
  NPC_BACKSTORY_PREFILL_KEY,
} from "@/lib/npc-backstory-prefill";
import type { NpcGeneratorPage } from "@/types/blocks/npc-generator";
import { Link, useRouter } from "@/i18n/navigation";

import NpcResultCard from "./result-card";

interface NpcGeneratorProps {
  section: NpcGeneratorPage;
}

function reverseLookupNpcValue(
  options: Array<{ value: string; label: string }>,
  label: string
): string | null {
  const match = options.find((option) => option.label === label);
  return match ? match.value : null;
}

function resolveOptionsForReroll(
  card: NpcCard,
  lockedFields: ReadonlySet<NpcField>,
  filters: NpcGenerationOptions,
  generatorData: NpcGeneratorData
): NpcGenerationOptions {
  const race =
    lockedFields.has("race")
      ? (reverseLookupNpcValue(generatorData.races, card.race) ?? filters.race)
      : filters.race;
  const role =
    lockedFields.has("role")
      ? (reverseLookupNpcValue(generatorData.roles, card.role) ?? filters.role)
      : filters.role;
  return { ...filters, race, role };
}

export default function NpcGenerator({ section }: NpcGeneratorProps) {
  const router = useRouter();
  const tAiTools = useTranslations("ai_tools");

  const [system, setSystem] = useState<NpcGameSystem>("fantasy");
  const [race, setRace] = useState("random");
  const [presentation, setPresentation] = useState("any");
  const [role, setRole] = useState("random");
  const [tone, setTone] = useState("random");
  const [crTier, setCrTier] = useState<NpcCrTier>("commoner");
  const [card, setCard] = useState<NpcCard | null>(null);
  const [lockedFields, setLockedFields] = useState<ReadonlySet<NpcField>>(new Set());

  const optionLists = useMemo(
    () => ({
      races: section.generator_data.races,
      presentations: section.generator_data.presentations,
      roles: section.generator_data.roles,
      tones: section.generator_data.tones,
    }),
    [section]
  );

  const crTierOptions = useMemo<Array<{ value: NpcCrTier; label: string }>>(
    () => [
      { value: "commoner", label: section.ui.cr_tier_commoner },
      { value: "trained", label: section.ui.cr_tier_trained },
      { value: "veteran", label: section.ui.cr_tier_veteran },
      { value: "elite", label: section.ui.cr_tier_elite },
    ],
    [section]
  );

  const titleParts = useMemo(() => {
    const fullTitle = section.ui.title;
    const highlight = section.ui.title_highlight;
    if (highlight && fullTitle.includes(highlight)) {
      const idx = fullTitle.indexOf(highlight);
      return {
        before: fullTitle.slice(0, idx),
        after: fullTitle.slice(idx + highlight.length),
        highlight,
      };
    }
    return { before: fullTitle, after: "", highlight: "" };
  }, [section]);

  const handleSystemChange = useCallback(
    (next: NpcGameSystem) => {
      if (next === system) return;
      setSystem(next);
      setCard(null);
      setLockedFields(new Set());
    },
    [system]
  );

  const handleGenerate = useCallback(() => {
    const options: NpcGenerationOptions = { system, race, presentation, role, tone, crTier };
    const next = generateNpcCard(options, section.generator_data, secureNpcRandom);
    setCard(next);
  }, [system, race, presentation, role, tone, crTier, section]);

  const handleRerollNpc = useCallback(() => {
    if (!card) return;
    const options = resolveOptionsForReroll(
      card,
      lockedFields,
      { system, race, presentation, role, tone, crTier },
      section.generator_data
    );
    const next = generateNpcCard(options, section.generator_data, secureNpcRandom);
    setCard(mergeLockedFields(card, next, lockedFields, system));
  }, [card, lockedFields, system, race, presentation, role, tone, crTier, section]);

  const handleRerollField = useCallback(
    (field: NpcField) => {
      if (!card) return;
      const options: NpcGenerationOptions = { system, race, presentation, role, tone, crTier };
      const next = rerollNpcField(card, field, options, section.generator_data, secureNpcRandom);
      setCard(next);
    },
    [card, system, race, presentation, role, tone, crTier, section]
  );

  const handleToggleLock = useCallback((field: NpcField) => {
    setLockedFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  }, []);

  const handleCopy = useCallback(
    async (kind: "markdown" | "text") => {
      if (!card) return;
      const text = kind === "markdown" ? buildNpcMarkdown(card) : buildNpcPlainText(card);
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        toast.error(section.ui.copy_failed);
        return;
      }
      toast.success(kind === "markdown" ? section.ui.copied_markdown : section.ui.copied_text);
    },
    [card, section]
  );

  const handleExpandBackstory = useCallback(() => {
    if (!card) return;
    try {
      const prefill = buildNpcBackstoryPrefill(card);
      window.sessionStorage.setItem(NPC_BACKSTORY_PREFILL_KEY, JSON.stringify(prefill));
    } catch {
      toast.error(section.ui.prefill_failed);
      return;
    }
    router.push("/dnd-backstory-generator");
  }, [card, router, section]);

  return (
    <section
      id="npc_generator"
      className="relative w-full overflow-hidden"
      aria-label={section.ui.title}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.97_0_0),transparent)] dark:bg-[radial-gradient(ellipse_900px_400px_at_50%_0%,oklch(0.17_0_0),transparent)]" />
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-primary/[0.04] via-primary/[0.02] to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-16 sm:py-20 lg:py-24">
        <div className="mb-10 flex justify-start">
          <div className="inline-flex items-center rounded-full border border-border/20 bg-background/80 px-4 py-1.5 text-xs text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground/80">
              {section.ui.breadcrumb_home}
            </Link>
            <span className="mx-2 text-muted-foreground/40">/</span>
            <Link href="/ai-tools" className="transition-colors hover:text-foreground/80">
              {tAiTools("tools_hub_nav")}
            </Link>
            <span className="mx-2 text-muted-foreground/40">/</span>
            <span className="text-foreground/80">{section.ui.breadcrumb_current}</span>
          </div>
        </div>

        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <div className="group mb-6 flex justify-center">
            <div className="relative rounded-2xl border border-border/15 bg-foreground/[0.012] p-1.5 dark:bg-white/[0.015]">
              <div className="relative flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <Dices className="relative size-6 text-primary" />
              </div>
            </div>
          </div>

          <span className="mb-5 inline-flex items-center rounded-full border border-border/25 bg-background/80 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {section.ui.eyebrow}
          </span>

          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
            {titleParts.before}
            {titleParts.highlight && (
              <span className="text-gradient-ember italic">{titleParts.highlight}</span>
            )}
            {titleParts.after}
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base font-light leading-relaxed text-muted-foreground/65 sm:text-lg">
            {section.ui.subtitle}
          </p>

          <div className="mt-7 hidden flex-wrap items-center justify-center gap-2 sm:flex">
            {section.ui.theme_pills.map((pill, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.04] px-3 py-1 text-xs font-medium text-primary"
              >
                <span className="inline-block size-1 rounded-full bg-primary/60" />
                {pill}
              </span>
            ))}
          </div>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[380px_1fr]">
        <div className="space-y-6 self-start rounded-2xl border border-border/60 bg-card/60 p-6 lg:sticky lg:top-24">
          <div className="space-y-3">
            <div
              role="group"
              aria-label={section.ui.system_label}
              className="grid w-full grid-cols-2 gap-1 rounded-lg border border-border/60 bg-muted/30 p-1"
            >
              <Button
                type="button"
                size="sm"
                variant={system === "fantasy" ? "default" : "ghost"}
                aria-pressed={system === "fantasy"}
                onClick={() => handleSystemChange("fantasy")}
                className="w-full justify-center"
              >
                <Sparkles className="size-4" />
                {section.ui.fantasy_mode}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={system === "dnd5e" ? "default" : "ghost"}
                aria-pressed={system === "dnd5e"}
                onClick={() => handleSystemChange("dnd5e")}
                className="w-full justify-center"
              >
                <Dices className="size-4" />
                {section.ui.dnd5e_mode}
              </Button>
            </div>
            {system === "fantasy" && (
              <p className="text-center text-xs text-muted-foreground">{section.ui.non_combat_notice}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="npc-race">{section.ui.race_label}</Label>
              <Select value={race} onValueChange={setRace}>
                <SelectTrigger id="npc-race" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {optionLists.races.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="npc-presentation">{section.ui.presentation_label}</Label>
              <Select value={presentation} onValueChange={setPresentation}>
                <SelectTrigger id="npc-presentation" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {optionLists.presentations.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="npc-role">{section.ui.role_label}</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="npc-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {optionLists.roles.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="npc-tone">{section.ui.tone_label}</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger id="npc-tone" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {optionLists.tones.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {system === "dnd5e" && (
              <div className="space-y-2">
                <Label htmlFor="npc-cr-tier">{section.ui.cr_tier_label}</Label>
                <Select value={crTier} onValueChange={(value) => setCrTier(value as NpcCrTier)}>
                  <SelectTrigger id="npc-cr-tier" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {crTierOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Button type="button" className="w-full" onClick={handleGenerate}>
            <Sparkles className="size-4" />
            {section.ui.generate}
          </Button>
        </div>

        <div className="space-y-4">
          {card ? (
            <>
              <NpcResultCard
                card={card}
                lockedFields={lockedFields}
                labels={section.ui}
                onToggleLock={handleToggleLock}
                onRerollField={handleRerollField}
                onCopy={handleCopy}
                onExpandBackstory={system === "dnd5e" ? handleExpandBackstory : undefined}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full sm:ml-auto sm:w-auto"
                onClick={handleRerollNpc}
              >
                <RefreshCw className="size-4" />
                {section.ui.reroll_npc}
              </Button>
            </>
          ) : (
            <p className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
              {section.ui.empty_state}
            </p>
          )}
        </div>
      </div>
      </div>
    </section>
  );
}
