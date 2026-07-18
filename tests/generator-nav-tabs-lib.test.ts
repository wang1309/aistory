import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getCenteredTabScrollLeft } from "@/components/generator-nav-tabs/lib";

test("getCenteredTabScrollLeft centers the active tab within the horizontal scroller", () => {
  assert.equal(
    getCenteredTabScrollLeft({
      containerWidth: 320,
      contentWidth: 960,
      tabOffsetLeft: 420,
      tabWidth: 120,
    }),
    320
  );
});

test("getCenteredTabScrollLeft clamps to the scrollable bounds", () => {
  assert.equal(
    getCenteredTabScrollLeft({
      containerWidth: 320,
      contentWidth: 300,
      tabOffsetLeft: 80,
      tabWidth: 100,
    }),
    0
  );

  assert.equal(
    getCenteredTabScrollLeft({
      containerWidth: 320,
      contentWidth: 960,
      tabOffsetLeft: 860,
      tabWidth: 120,
    }),
    640
  );
});

test("story generator hides the tool-directory nav on mobile", () => {
  const generatorSource = readFileSync(
    "src/components/blocks/story-generate/index.tsx",
    "utf8"
  );

  assert.match(
    generatorSource,
    /hidden border-y border-border\/70 bg-card md:block/
  );
});
