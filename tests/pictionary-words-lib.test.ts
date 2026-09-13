import assert from "node:assert/strict";
import test from "node:test";

import {
  PICTIONARY_WORDS,
  buildPictionaryPool,
  drawPictionaryWords,
  filterPictionaryWords,
  parseCustomWordList,
  type PictionaryEntry,
} from "@/lib/pictionary-words";

test("library ships 180 curated words across 6 categories and 3 difficulties", () => {
  assert.equal(PICTIONARY_WORDS.length, 180);
  const categories = new Set(PICTIONARY_WORDS.map((w) => w.category));
  assert.deepEqual([...categories].sort(), [
    "actions",
    "animals",
    "fantasy",
    "food",
    "objects",
    "places",
  ]);
  for (const category of categories) {
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      const count = PICTIONARY_WORDS.filter(
        (w) => w.category === category && w.difficulty === difficulty
      ).length;
      assert.ok(count >= 10, `${category}/${difficulty} has only ${count} words`);
    }
  }
});

test("no duplicate words, case-insensitive", () => {
  const seen = new Set<string>();
  for (const entry of PICTIONARY_WORDS) {
    const key = entry.word.toLowerCase();
    assert.ok(!seen.has(key), `duplicate word: ${entry.word}`);
    seen.add(key);
  }
});

test("filterPictionaryWords combines category and difficulty", () => {
  const all = filterPictionaryWords(PICTIONARY_WORDS, {
    category: "all",
    difficulty: "all",
  });
  assert.equal(all.length, 180);

  const easyAnimals = filterPictionaryWords(PICTIONARY_WORDS, {
    category: "animals",
    difficulty: "easy",
  });
  assert.equal(easyAnimals.length, 10);
  assert.ok(
    easyAnimals.every((w) => w.category === "animals" && w.difficulty === "easy")
  );
});

test("drawPictionaryWords returns unique words without duplicates", () => {
  const pool = filterPictionaryWords(PICTIONARY_WORDS, {
    category: "all",
    difficulty: "all",
  });
  const drawn = drawPictionaryWords(pool, 10);
  assert.equal(drawn.length, 10);
  assert.equal(new Set(drawn.map((w) => w.word)).size, 10);
});

test("drawPictionaryWords excludes already drawn words", () => {
  const pool = filterPictionaryWords(PICTIONARY_WORDS, {
    category: "animals",
    difficulty: "easy",
  });
  const exclude = new Set(pool.map((w) => w.word.toLowerCase()).slice(0, 9));
  const drawn = drawPictionaryWords(pool, 10, exclude);
  assert.equal(drawn.length, 1);
  assert.ok(!exclude.has(drawn[0]!.word));
});

test("drawPictionaryWords drains to zero and never throws", () => {
  const pool = filterPictionaryWords(PICTIONARY_WORDS, {
    category: "food",
    difficulty: "hard",
  });
  const exclude = new Set(pool.map((w) => w.word.toLowerCase()));
  assert.deepEqual(drawPictionaryWords(pool, 5, exclude), []);
});

test("parseCustomWordList splits, trims, dedupes case-insensitively", () => {
  const result = parseCustomWordList(
    "photosynthesis\n gravity ,  Gravity\n\nvolcano"
  );
  assert.ok(result.ok);
  assert.deepEqual(result.words, ["photosynthesis", "gravity", "volcano"]);
});

test("parseCustomWordList rejects empty input and over-limit entries", () => {
  assert.equal(parseCustomWordList("   ").ok, false);
  const long = "a".repeat(61);
  assert.equal(parseCustomWordList(long).ok, false);
  const tooMany = Array.from({ length: 301 }, (_, i) => `word${i}`).join("\n");
  assert.equal(parseCustomWordList(tooMany).ok, false);
});

test("buildPictionaryPool appends custom words and keeps curated filtering", () => {
  const custom = buildPictionaryPool(
    { category: "all", difficulty: "all" },
    ["mitochondria", "plate tectonics"]
  );
  assert.equal(custom.length, 182);
  const tail: PictionaryEntry[] = custom.slice(-2);
  assert.ok(tail.every((entry) => entry.category === "custom"));

  const filtered = buildPictionaryPool(
    { category: "animals", difficulty: "easy" },
    ["mitochondria"]
  );
  assert.equal(filtered.length, 11);
});
