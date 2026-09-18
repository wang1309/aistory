import {
  PICTIONARY_WORDS,
  type PictionaryDifficulty,
} from "@/lib/pictionary-words";
import SectionHeader from "./section-header";
import { getAccent, type AccentColor } from "./accent";

interface WordListSection {
  name?: string;
  label?: string;
  title?: string;
  description?: string;
  disabled?: boolean;
}

interface Option {
  value: string;
  label: string;
}

interface Props {
  section: WordListSection;
  categories: Option[];
  difficulties: Option[];
  accent?: AccentColor;
}

const DIFFICULTY_ORDER: PictionaryDifficulty[] = ["easy", "medium", "hard"];

export default function PictionaryWordList({
  section,
  categories,
  difficulties,
  accent = "rose",
}: Props) {
  const a = getAccent(accent);
  if (section.disabled) return null;

  const difficultyLabel = (value: PictionaryDifficulty) =>
    difficulties.find((option) => option.value === value)?.label ?? value;

  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,oklch(0.97_0_0),transparent)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,oklch(0.17_0_0),transparent)]" />
      </div>

      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label={section.label}
          title={section.title}
          description={section.description}
          accent={accent}
          align="center"
        />

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-2">
          {categories
            .filter((category) => category.value !== "all")
            .map((category) => {
              const words = PICTIONARY_WORDS.filter(
                (entry) => entry.category === category.value
              );
              return (
                <div
                  key={category.value}
                  className="h-full rounded-[1.75rem] border border-border/15 bg-card px-6 py-7"
                >
                  <h3 className="text-[0.95rem] font-bold tracking-tight text-foreground">
                    {category.label}
                  </h3>
                  <dl className="mt-4 space-y-3">
                    {DIFFICULTY_ORDER.map((difficulty) => (
                      <div key={difficulty} className="flex gap-3 text-sm">
                        <dt
                          className={`w-16 shrink-0 font-medium ${a.text}`}
                        >
                          {difficultyLabel(difficulty)}
                        </dt>
                        <dd className="leading-relaxed text-foreground/85">
                          {words
                            .filter((entry) => entry.difficulty === difficulty)
                            .map((entry) => entry.word)
                            .join(", ")}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}
