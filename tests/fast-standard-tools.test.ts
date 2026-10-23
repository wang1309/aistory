import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function source(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const FIXED_TIER_TOOLS = [
  "src/app/api/book-title-generate/route.ts",
  "src/app/api/poem-title-generate/route.ts",
  "src/app/api/youtube-name-generate/_lib.ts",
  "src/app/api/youtube-title-generate/route.ts",
  "src/app/api/city-nickname-generate/_lib.ts",
  "src/app/api/emoji-translate/_lib.ts",
  "src/app/api/story-outline-generate/route.ts",
  "src/app/api/story-outline-expand/_handler.ts",
  "src/app/api/poem-analyze/route.ts",
];

test("tools without a model selector use the fast tier", () => {
  for (const file of FIXED_TIER_TOOLS) {
    const contents = source(file);
    assert.match(contents, /resolveModelTier\("fast"\)/, file);
    assert.doesNotMatch(contents, /resolveModelTier\("standard"\)/, file);
  }
});
