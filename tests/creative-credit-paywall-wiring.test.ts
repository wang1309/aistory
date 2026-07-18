import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const creativeGenerators = [
  "src/components/blocks/story-generate/index.tsx",
  "src/components/blocks/backstory-generate/index.tsx",
  "src/components/blocks/bedtime-story-generate/index.tsx",
  "src/components/blocks/comic-generate/index.tsx",
  "src/components/blocks/dialogue-generate/index.tsx",
  "src/components/blocks/dnd-backstory-generate/index.tsx",
  "src/components/blocks/fanfic-generate/tabbed-fanfic-generate.tsx",
  "src/components/blocks/fantasy-generate/index.tsx",
  "src/components/blocks/incorrect-quote-generate/index.tsx",
  "src/components/blocks/plot-generate/index.tsx",
  "src/components/blocks/poem-generate/index.tsx",
  "src/components/blocks/romance-story-generate/index.tsx",
  "src/components/blocks/tiktok-comment-generate/index.tsx",
];

test("all Creative generators preflight insufficient credits with the shared guard", () => {
  for (const file of creativeGenerators) {
    const source = readFileSync(file, "utf8");
    assert.match(
      source,
      /guardCreativeCreditQuota/,
      `${file} must use the shared Creative credit guard`
    );
  }
});
