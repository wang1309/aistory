import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const heroSource = readFileSync("src/components/blocks/hero/index.tsx", "utf8");
const generatorSource = readFileSync(
  "src/components/blocks/story-generate/index.tsx",
  "utf8"
);

test("editorial hero exposes a visible quick-start writing affordance", () => {
  assert.match(heroSource, /id="hero-quick-start-btn"/);
  assert.match(heroSource, /variant="pill"[\s\S]{0,80}size="pill"/);
  assert.doesNotMatch(heroSource, /min-h-\[92vh\]/);
  assert.doesNotMatch(heroSource, /bg-clip-text text-transparent/);
});

test("hero sits on a clean neutral canvas with a toned-down drift", () => {
  // Decorative orb / WebGL layers are gone in the neutral redesign.
  assert.doesNotMatch(heroSource, /hero-orb/);
  assert.doesNotMatch(heroSource, /Prism/);
  assert.doesNotMatch(heroSource, /sg-orb/);
  // No warm-tinted ambient radials anywhere in the hero.
  assert.doesNotMatch(heroSource, /oklch\(0\.9\d_[\d.]+_(55|65|75|80)\)/);
  // The dual-column story drift remains as the hero's visual anchor.
  assert.match(heroSource, /animate-hero-drift/);
});

test("story generator keeps its compact model control on a neutral canvas", () => {
  assert.match(generatorSource, /grid grid-cols-3 gap-2/);
  assert.match(generatorSource, /selection:bg-primary\/15/);
  assert.doesNotMatch(generatorSource, /sg-orb/);
  assert.doesNotMatch(generatorSource, /oklch\(0\.9\d_[\d.]+_(45|55|65|75|80)\)/);
});

test("neutral theme uses an ink canvas, cool primary, and tight radius", () => {
  const themeSource = readFileSync("src/app/theme.css", "utf8");

  assert.match(themeSource, /--primary: oklch\(0\.54 0\.2 262\)/);
  assert.match(themeSource, /--background: oklch\(0\.975 0\.008 85\)/);
  assert.match(themeSource, /--card: oklch\(1 0 0\)/);
  assert.match(themeSource, /--radius: 0\.75rem/);
  assert.match(themeSource, /hsl\(226 25% 12%/);
  assert.match(themeSource, /var\(--font-inter\)/);
});
