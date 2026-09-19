import { Fragment } from "react";

import type { Dnd5eNpcStatBlock } from "@/lib/npc-generator";
import type { NpcGeneratorPage } from "@/types/blocks/npc-generator";

export type NpcStatBlockLabels = Pick<
  NpcGeneratorPage["ui"],
  | "stat_armor_class"
  | "stat_hit_points"
  | "stat_speed"
  | "stat_passive_perception"
  | "stat_languages"
  | "stat_challenge_rating"
  | "stat_actions"
  | "stat_abilities"
  | "stat_ability_str"
  | "stat_ability_dex"
  | "stat_ability_con"
  | "stat_ability_int"
  | "stat_ability_wis"
  | "stat_ability_cha"
  | "stat_action_punctuation"
>;

const ABILITY_COLUMNS: Array<keyof Dnd5eNpcStatBlock["abilities"]> = [
  "str",
  "dex",
  "con",
  "int",
  "wis",
  "cha",
];

type AbilityKey = (typeof ABILITY_COLUMNS)[number];

function abilityLabel(labels: NpcStatBlockLabels, key: AbilityKey): string {
  return labels[`stat_ability_${key}` as const];
}

interface NpcStatBlockProps {
  statBlock: Dnd5eNpcStatBlock;
  labels: NpcStatBlockLabels;
}

export default function NpcStatBlock({ statBlock, labels }: NpcStatBlockProps) {
  const traitRows: Array<Array<[string, string]>> = [
    [
      [labels.stat_armor_class, String(statBlock.armorClass)],
      [labels.stat_hit_points, String(statBlock.hitPoints)],
    ],
    [
      [labels.stat_speed, statBlock.speed],
      [labels.stat_passive_perception, String(statBlock.passivePerception)],
    ],
    [
      [labels.stat_languages, statBlock.languages.join(", ")],
      [labels.stat_challenge_rating, statBlock.challengeRating],
    ],
  ];

  return (
    <div className="space-y-4 text-sm">
      <table className="w-full text-xs">
        <tbody>
          {traitRows.map((pair) => (
            <tr key={pair[0][0]} className="border-b border-border/60 last:border-b-0">
              {pair.map(([label, value]) => (
                <Fragment key={label}>
                  <th
                    scope="row"
                    className="py-1.5 pr-2 text-left align-top font-medium whitespace-nowrap text-muted-foreground"
                  >
                    {label}
                  </th>
                  <td className="py-1.5 align-top text-foreground">{value}</td>
                </Fragment>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {labels.stat_abilities}
        </h3>
        <table className="w-full text-center">
          <thead>
            <tr>
              {ABILITY_COLUMNS.map((ability) => (
                <th
                  key={ability}
                  scope="col"
                  className="pb-1 font-semibold text-muted-foreground"
                >
                  {abilityLabel(labels, ability)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border/60">
              {ABILITY_COLUMNS.map((ability) => (
                <td
                  key={ability}
                  className="pt-1.5 font-medium tabular-nums text-foreground"
                >
                  {statBlock.abilities[ability]}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <section>
        <h3 className="mb-2 font-semibold text-foreground">{labels.stat_actions}</h3>
        <ul className="space-y-2 text-muted-foreground">
          {statBlock.actions.map((action, index) => (
            <li key={`${action.name}-${index}`}>
              <strong className="font-semibold text-foreground">
                {action.name}
                {labels.stat_action_punctuation}
              </strong>{" "}
              {action.text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
