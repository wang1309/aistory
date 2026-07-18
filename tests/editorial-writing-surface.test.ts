import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const heroSource = readFileSync("src/components/blocks/hero/index.tsx", "utf8");
const generatorSource = readFileSync(
  "src/components/blocks/story-generate/index.tsx",
  "utf8"
);

test("editorial hero exposes a visible quick-start writing affordance", () => {
  assert.match(heroSource, /data-testid="hero-quick-start"/);
  assert.match(heroSource, /rounded-md bg-foreground/);
  assert.doesNotMatch(heroSource, /min-h-\[92vh\]/);
  assert.doesNotMatch(heroSource, /bg-clip-text text-transparent/);
});

test("story generator uses a compact model control and suppresses metadata on mobile", () => {
  assert.match(generatorSource, /data-testid="story-model-control"/);
  assert.match(generatorSource, /hidden sm:flex/);
  assert.doesNotMatch(generatorSource, /grid grid-cols-3 gap-2/);
});

test("paper theme uses a clay action accent and warm charcoal dark surface", () => {
  const themeSource = readFileSync("src/app/theme.css", "utf8");

  assert.match(themeSource, /--primary: oklch\(0\.67 0\.14 55\)/);
  assert.match(themeSource, /--background: oklch\(0\.16 0\.01 55\)/);
  assert.match(themeSource, /--radius: 0\.5rem/);
});
