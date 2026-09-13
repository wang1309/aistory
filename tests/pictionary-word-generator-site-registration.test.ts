import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import sitemap from "@/app/sitemap";
import { locales } from "@/i18n/locale";
import { getToolsByModule, tools } from "@/services/tools";

test("registry exposes Pictionary Word Generator in ai-tools", () => {
  const tool = tools.find(
    (entry) => entry.slug === "pictionary-word-generator"
  );
  assert.ok(tool);
  assert.equal(tool?.module, "ai-tools");
  assert.equal(tool?.category, "utility");
  assert.equal(tool?.href, "/ai-tools/pictionary-word-generator");
  assert.equal(tool?.icon, "RiPencilLine");
  assert.equal(tool?.nameKey, "ai_tools.tools.pictionary_word_generator.name");
  assert.equal(
    tool?.shortDescKey,
    "ai_tools.tools.pictionary_word_generator.desc"
  );
  assert.ok(
    getToolsByModule("ai-tools").some(
      (entry) => entry.slug === "pictionary-word-generator"
    )
  );
});

test("sitemap includes Pictionary Word Generator for every locale", async () => {
  const urls = (await sitemap()).map((entry) => entry.url);
  for (const locale of locales) {
    const expected =
      locale === "en"
        ? "https://storiesgenerator.org/ai-tools/pictionary-word-generator"
        : `https://storiesgenerator.org/${locale}/ai-tools/pictionary-word-generator`;
    assert.ok(urls.includes(expected), `missing ${expected}`);
  }
});

test("card copy exists in every locale messages file", () => {
  for (const locale of ["en", "zh", "de", "ko", "ja", "ru"] as const) {
    const messages = JSON.parse(
      readFileSync(`src/i18n/messages/${locale}.json`, "utf8")
    ) as {
      ai_tools: {
        tools: Record<
          string,
          { pictionary_word_generator?: { name?: string; desc?: string } }
        >;
      };
    };
    const copy = messages.ai_tools.tools.pictionary_word_generator;
    assert.ok(copy?.name, `${locale} missing card name`);
    assert.ok(copy?.desc, `${locale} missing card desc`);
  }
});
