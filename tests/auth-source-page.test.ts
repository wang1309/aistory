import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAuthTrackingPayload,
  normalizeAuthIntent,
} from "@/lib/auth-funnel";

test("normalizes and preserves a stable generator source page", () => {
  assert.deepEqual(
    normalizeAuthIntent({
      source: "ai_write",
      action: "continue_writing",
      sourcePage: "story-generator",
    }),
    {
      source: "ai_write",
      action: "continue_writing",
      sourcePage: "story-generator",
    }
  );
});

test("adds source_page to analytics payload without exposing arbitrary metadata", () => {
  assert.deepEqual(
    buildAuthTrackingPayload({
      source: "story_save",
      action: "save_story",
      sourcePage: "backstory-generator",
      metadata: {
        source_page: "spoofed-value",
        email: "private@example.com",
      },
    }),
    {
      source: "story_save",
      action: "save_story",
      source_page: "backstory-generator",
    }
  );
});
