import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTH_RESUME_STORAGE_KEY,
  buildPostAuthResumeTrackingPayload,
  consumePendingAuthResume,
  readPendingAuthResume,
  writePendingAuthResume,
  type PendingAuthResume,
} from "@/lib/auth-resume";

function installSessionStorage() {
  let value: string | null = null;
  const storage = {
    getItem: (_key: string) => value,
    setItem: (_key: string, nextValue: string) => {
      value = nextValue;
    },
    removeItem: () => {
      value = null;
    },
  };

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { sessionStorage: storage },
  });

  return storage;
}

function buildSaveResume(startedAt = Date.now()): PendingAuthResume {
  return {
    source: "story_save",
    action: "save_story",
    sourcePage: "story-generator",
    startedAt,
    payload: {
      prompt: "A hidden door",
      generatedStory: "The door opened.",
      selectedModel: "standard",
      selectedFormat: "none",
      selectedLength: "none",
      selectedGenre: "fantasy",
      selectedPerspective: "none",
      selectedAudience: "none",
      selectedTone: "none",
      selectedLanguage: "en",
    },
  };
}

test("pending auth resume preserves story-save state in session storage", () => {
  const storage = installSessionStorage();
  const resume = buildSaveResume();

  writePendingAuthResume(resume);

  assert.ok(storage.getItem(AUTH_RESUME_STORAGE_KEY));
  assert.deepEqual(readPendingAuthResume(), resume);
});

test("pending auth resume is consumed only once for the requested action", () => {
  installSessionStorage();
  writePendingAuthResume(buildSaveResume());

  assert.deepEqual(consumePendingAuthResume("save_story"), buildSaveResume());
  assert.equal(consumePendingAuthResume("save_story"), null);
});

test("pending auth resume stays available when another page does not match its source", () => {
  installSessionStorage();
  writePendingAuthResume(buildSaveResume());

  assert.equal(
    consumePendingAuthResume("save_story", { sourcePage: "ai-write" }),
    null
  );
  assert.deepEqual(
    consumePendingAuthResume("save_story", { sourcePage: "story-generator" }),
    buildSaveResume()
  );
});

test("expired pending auth resume is ignored", () => {
  installSessionStorage();
  writePendingAuthResume(buildSaveResume(Date.now() - 16 * 60 * 1000));

  assert.equal(readPendingAuthResume(), null);
});

test("post-auth resume tracking exposes attribution without resume content", () => {
  assert.deepEqual(
    buildPostAuthResumeTrackingPayload(buildSaveResume()),
    {
      source: "story_save",
      action: "save_story",
      source_page: "story-generator",
    }
  );
});
