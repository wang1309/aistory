import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAuthTrackingPayload,
  normalizeAuthIntent,
} from "@/lib/auth-funnel";

test("normalizes an auth intent with a safe default action", () => {
  assert.deepEqual(
    normalizeAuthIntent({ source: "header" }),
    { source: "header", action: "sign_in" }
  );
});

test("builds analytics payload without sensitive or arbitrary fields", () => {
  assert.deepEqual(
    buildAuthTrackingPayload({
      source: "story_save",
      action: "save_story",
      provider: "google",
      metadata: {
        context: "story_generator",
        email: "private@example.com",
      },
    }),
    {
      source: "story_save",
      action: "save_story",
      provider: "google",
      context: "story_generator",
    }
  );
});
