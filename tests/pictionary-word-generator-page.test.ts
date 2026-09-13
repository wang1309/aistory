import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const LOCALES = ["en", "zh", "de", "ko", "ja", "ru"] as const;
type Locale = (typeof LOCALES)[number];

interface SectionLike {
  metadata?: unknown;
  ui?: unknown;
  validation?: unknown;
  success?: unknown;
  faq?: { items?: unknown[] };
  related_tools?: unknown;
  [key: string]: unknown;
}

function readSection(locale: Locale): SectionLike {
  const raw = JSON.parse(
    readFileSync(
      `src/i18n/pages/pictionary-word-generator/${locale}.json`,
      "utf8"
    )
  ) as { pictionary_word_generator: SectionLike };
  return raw.pictionary_word_generator;
}

test("page copy exists for all six locales with identical key structure", () => {
  const sections = LOCALES.map(readSection);
  const reference = Object.keys(sections[0]!).sort();
  for (const [index, locale] of LOCALES.entries()) {
    assert.deepEqual(
      Object.keys(sections[index]!).sort(),
      reference,
      `${locale} top-level keys diverge`
    );
  }
});

test("every locale has metadata, ui, validation, success, faq, related_tools", () => {
  for (const locale of LOCALES) {
    const section = readSection(locale);
    assert.ok(section.metadata, `${locale} metadata`);
    assert.ok(section.ui, `${locale} ui`);
    assert.ok(section.validation, `${locale} validation`);
    assert.ok(section.success, `${locale} success`);
    assert.ok(section.faq, `${locale} faq`);
    assert.ok(section.related_tools, `${locale} related_tools`);
    assert.equal(section.faq?.items?.length, 6, `${locale} faq items`);
    const ui = section.ui as Record<string, unknown>;
    for (const key of [
      "category_options",
      "difficulty_options",
      "count_options",
      "timer_options",
    ]) {
      const options = ui[key] as unknown[];
      assert.ok(Array.isArray(options) && options.length > 0, `${locale} ${key}`);
    }
    assert.equal(
      (ui.category_options as unknown[]).length,
      7,
      `${locale} category options`
    );
    assert.equal(
      (ui.difficulty_options as unknown[]).length,
      4,
      `${locale} difficulty options`
    );
  }
});

test("option values stay as stable English enums across locales", () => {
  for (const locale of LOCALES) {
    const section = readSection(locale);
    const ui = section.ui as Record<
      string,
      Array<{ value: string }>
    >;
    assert.deepEqual(
      ui.category_options.map((option) => option.value),
      ["all", "animals", "food", "objects", "actions", "places", "fantasy"]
    );
    assert.deepEqual(
      ui.difficulty_options.map((option) => option.value),
      ["all", "easy", "medium", "hard"]
    );
    assert.deepEqual(
      ui.count_options.map((option) => option.value),
      ["1", "3", "5", "10"]
    );
    assert.deepEqual(
      ui.timer_options.map((option) => option.value),
      ["30", "60", "90"]
    );
  }
});

test("client block exists and is a client component", () => {
  const source = readFileSync(
    "src/components/blocks/pictionary-word-generator/index.tsx",
    "utf8"
  );
  assert.match(source, /"use client"/);
  assert.match(source, /buildPictionaryPool/);
  assert.match(source, /drawPictionaryWords/);
  assert.match(source, /parseCustomWordList/);
});

test("page wires block, sections, JSON-LD, and related tools", () => {
  const source = readFileSync(
    "src/app/[locale]/(default)/ai-tools/pictionary-word-generator/page.tsx",
    "utf8"
  );
  assert.match(source, /PictionaryWordGenerator/);
  assert.match(source, /pictionary-word-generator/);
  assert.match(source, /application\/ld\+json/);
  assert.match(source, /FAQPage/);
  assert.match(source, /WebApplication/);
  assert.match(source, /RelatedTools/);
  assert.match(source, /accent="rose"/);
});
