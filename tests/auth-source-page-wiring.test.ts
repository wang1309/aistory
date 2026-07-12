import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const formSource = fs.readFileSync("src/components/sign/form.tsx", "utf8");
const modalSource = fs.readFileSync("src/components/sign/modal.tsx", "utf8");
const contextSource = fs.readFileSync("src/contexts/app.tsx", "utf8");
const workbenchSource = fs.readFileSync(
  "src/components/ai-write/workbench/index.tsx",
  "utf8"
);

test("sign form carries source page into pending auth and provider tracking", () => {
  assert.match(formSource, /authSourcePage\?: AuthSourcePage/);
  assert.match(formSource, /authSourcePage/);
  assert.match(formSource, /sourcePage: resolvedSourcePage/);
});

test("sign modal passes source page to lifecycle tracking and sign form", () => {
  assert.match(modalSource, /sourcePage: authIntent\?\.sourcePage/);
  assert.match(modalSource, /authSourcePage=\{authIntent\?\.sourcePage\}/);
});

test("auth success includes source page attribution", () => {
  assert.match(contextSource, /sourcePage: attempt\.sourcePage/);
});

test("post-auth action resume includes source page attribution", () => {
  assert.match(workbenchSource, /source_page: continueEntrySource/);
});
