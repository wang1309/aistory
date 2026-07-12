import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const sources = {
  comments: fs.readFileSync("src/components/story/story-comments.tsx", "utf8"),
  likes: fs.readFileSync("src/components/story/story-like-button.tsx", "utf8"),
  paywall: fs.readFileSync("src/components/story/paywall-modal.tsx", "utf8"),
  pricing: fs.readFileSync("src/components/blocks/pricing/index.tsx", "utf8"),
  story: fs.readFileSync("src/components/blocks/story-generate/index.tsx", "utf8"),
  backstory: fs.readFileSync("src/components/blocks/backstory-generate/index.tsx", "utf8"),
  outline: fs.readFileSync("src/components/blocks/story-outline-generate/index.tsx", "utf8"),
  workbench: fs.readFileSync("src/components/ai-write/workbench/index.tsx", "utf8"),
};

test("social story actions use explicit auth intents", () => {
  assert.match(sources.comments, /requireAuth\(/);
  assert.match(sources.comments, /source: "story_comment"/);
  assert.match(sources.comments, /action: "comment_story"/);
  assert.match(sources.likes, /requireAuth\(/);
  assert.match(sources.likes, /source: "story_like"/);
  assert.match(sources.likes, /action: "like_story"/);
});

test("commerce actions use explicit checkout auth intents", () => {
  assert.match(sources.paywall, /requireAuth\(/);
  assert.match(sources.paywall, /source: "paywall"/);
  assert.match(sources.paywall, /action: "checkout"/);
  assert.match(sources.pricing, /requireAuth\(/);
  assert.match(sources.pricing, /source: "pricing"/);
  assert.match(sources.pricing, /action: "checkout"/);
});

test("generator and editor protected actions use explicit auth intents", () => {
  assert.match(sources.story, /requireAuth\(/);
  assert.match(sources.backstory, /requireAuth\(/);
  assert.match(sources.outline, /requireAuth\(/);
  assert.match(sources.workbench, /requireAuth\(/);
  assert.match(sources.workbench, /source: "ai_write"/);
  assert.match(sources.workbench, /action: "continue_writing"/);
});
