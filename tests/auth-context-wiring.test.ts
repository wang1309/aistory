import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const contextSource = fs.readFileSync("src/contexts/app.tsx", "utf8");
const contextTypes = fs.readFileSync("src/types/context.d.ts", "utf8");

test("app context exposes a typed auth intent gate", () => {
  assert.match(contextTypes, /authIntent: AuthIntent \| null/);
  assert.match(contextTypes, /requireAuth: \(intent: AuthIntentInput\) => void/);
  assert.match(contextTypes, /clearAuthIntent: \(\) => void/);
  assert.match(contextSource, /const \[authIntent, setAuthIntent\] = useState/);
  assert.match(contextSource, /const requireAuth = useCallback\(/);
  assert.match(contextSource, /setAuthIntent\(normalizeAuthIntent\(intent\)\)/);
});

test("auth gate opens the modal after storing a normalized intent", () => {
  assert.match(
    contextSource,
    /setAuthIntent\(normalizeAuthIntent\(intent\)\);\s*setShowSignModal\(true\)/
  );
});
