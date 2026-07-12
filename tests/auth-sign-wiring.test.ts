import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const formSource = fs.readFileSync("src/components/sign/form.tsx", "utf8");
const modalSource = fs.readFileSync("src/components/sign/modal.tsx", "utf8");
const headerSource = fs.readFileSync("src/components/sign/sign_in.tsx", "utf8");

test("sign form tracks provider clicks for every auth context", () => {
  assert.match(formSource, /"auth_provider_click"/);
  assert.match(formSource, /source: resolvedSource/);
  assert.match(formSource, /trackSignInStart\("google"\)/);
  assert.match(formSource, /trackSignInStart\("github"\)/);
});

test("sign modal tracks lifecycle events", () => {
  assert.match(modalSource, /"auth_modal_open"/);
  assert.match(modalSource, /"auth_modal_close"/);
  assert.match(modalSource, /useRef/);
});

test("header sign in uses the shared auth intent gate", () => {
  assert.match(
    headerSource,
    /requireAuth\(\{[\s\S]*source: "header",[\s\S]*action: "sign_in"/
  );
});
