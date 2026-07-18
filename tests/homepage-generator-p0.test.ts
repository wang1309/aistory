import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pageSource = readFileSync(
  "src/app/[locale]/(default)/page.tsx",
  "utf8"
);

const generatorSource = readFileSync(
  "src/components/blocks/story-generate/index.tsx",
  "utf8"
);

test("homepage mounts the story generator as its primary creation surface", () => {
  const generatorIndex = pageSource.indexOf("{page.story_generate && (");

  assert.notEqual(generatorIndex, -1);
  assert.match(pageSource, /<StoryGenerate section=\{page\.story_generate\} \/>/);
});

test("story generator retains its addressable creation anchor", () => {
  assert.match(generatorSource, /id="craft_story"/);
  assert.match(generatorSource, /id="story-prompt-input"/);
});
