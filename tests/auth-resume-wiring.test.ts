import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const storyGeneratorSource = fs.readFileSync(
  "src/components/blocks/story-generate/index.tsx",
  "utf8"
);
const workbenchSource = fs.readFileSync(
  "src/components/ai-write/workbench/index.tsx",
  "utf8"
);

test("story generator persists and consumes a pending save resume", () => {
  assert.match(storyGeneratorSource, /writePendingAuthResume\(/);
  assert.match(storyGeneratorSource, /consumePendingAuthResume\(\s*"save_story"/);
  assert.match(storyGeneratorSource, /sourcePage: "story-generator"/);
  assert.match(storyGeneratorSource, /post_auth_action_resumed/);
});

test("AI Write persists save intent across an auth redirect", () => {
  assert.match(workbenchSource, /writePendingAuthResume\(/);
  assert.match(workbenchSource, /consumePendingAuthResume\(\s*"save_story"/);
  assert.match(workbenchSource, /sourcePage: "ai-write"/);
  assert.match(workbenchSource, /post_auth_action_resumed/);
});
