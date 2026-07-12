import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const funnelSource = fs.readFileSync("src/lib/auth-funnel.ts", "utf8");
const contextSource = fs.readFileSync("src/contexts/app.tsx", "utf8");
const formSource = fs.readFileSync("src/components/sign/form.tsx", "utf8");
const workbenchSource = fs.readFileSync(
  "src/components/ai-write/workbench/index.tsx",
  "utf8"
);

test("auth funnel exposes a session-scoped pending auth marker", () => {
  assert.match(funnelSource, /AUTH_ATTEMPT_STORAGE_KEY/);
  assert.match(funnelSource, /writePendingAuthAttempt/);
  assert.match(funnelSource, /readPendingAuthAttempt/);
  assert.match(funnelSource, /clearPendingAuthAttempt/);
});

test("provider clicks persist only safe auth attempt fields", () => {
  assert.match(formSource, /writePendingAuthAttempt\(/);
  assert.match(formSource, /source: resolvedSource/);
  assert.match(formSource, /action: resolvedAction/);
  assert.match(formSource, /provider/);
});

test("authenticated session consumes the pending marker and tracks success", () => {
  assert.match(contextSource, /readPendingAuthAttempt\(/);
  assert.match(contextSource, /"auth_success"/);
  assert.match(contextSource, /clearPendingAuthAttempt\(/);
});

test("continue-writing restoration tracks the resumed action", () => {
  assert.match(workbenchSource, /track\("post_auth_action_resumed"/);
  assert.match(workbenchSource, /action: "continue_writing"/);
});
