import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  "src/app/[locale]/(default)/page.tsx",
  "utf8"
);

test("homepage retains its server-rendered SEO block order", () => {
  const blocks = [
    "{page.hero && <Hero hero={page.hero} />}",
    "<StoryGenerate section={page.story_generate} />",
    "<ModuleToolsSection",
    "{page.branding && <Branding section={page.branding} />}",
    "{page.pricing && <Pricing pricing={page.pricing} />}",
    "{page.faq && <SectionFAQ section={page.faq} accent=\"orange\" />}",
    "{page.cta && <SectionCTA section={page.cta} accent=\"orange\" />}",
  ];
  const positions = blocks.map((block) => pageSource.indexOf(block));

  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.match(pageSource, /application\/ld\+json/);
});
