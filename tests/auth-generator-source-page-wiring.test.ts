import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const generatorFiles: Array<[string, string]> = [
  ["src/components/blocks/story-generate/index.tsx", "story-generator"],
  ["src/components/blocks/backstory-generate/index.tsx", "backstory-generator"],
  [
    "src/components/blocks/fanfic-generate/tabbed-fanfic-generate.tsx",
    "fanfic-generator",
  ],
  ["src/components/blocks/dialogue-generate/index.tsx", "dialogue-generator"],
  [
    "src/components/blocks/dnd-backstory-generate/index.tsx",
    "dnd-backstory-generator",
  ],
  ["src/components/blocks/plot-generate/index.tsx", "plot-generator"],
  ["src/components/blocks/poem-generate/index.tsx", "poem-generator"],
  ["src/components/blocks/fantasy-generate/index.tsx", "fantasy-generator"],
];

test("generator auth intents include stable source page slugs", () => {
  for (const [file, sourcePage] of generatorFiles) {
    const source = fs.readFileSync(file, "utf8");
    if (!source.includes("requireAuth(")) continue;

    assert.match(
      source,
      new RegExp(`sourcePage: "${sourcePage}"`),
      `${file} should include sourcePage=${sourcePage}`
    );
  }
});

test("generator auth gating keeps the category source and action fields", () => {
  const storySource = fs.readFileSync(
    "src/components/blocks/story-generate/index.tsx",
    "utf8"
  );
  assert.match(storySource, /source: "story_save"/);
  assert.match(storySource, /action: "save_story"/);
  assert.match(storySource, /source: "ai_write"/);
  assert.match(storySource, /action: "continue_writing"/);
});
