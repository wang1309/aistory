import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function source(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

test("plot-to-story route reuses the plot-generator quota", () => {
  const route = source("src/app/api/story-generate-from-plot/route.ts");

  assert.match(
    route,
    /prepareCreativeQuota\(\{[\s\S]*?pageKey:\s*"plot-generator"/
  );
  assert.match(route, /creativeQuotaErrorResponse\(quotaGate\)/);
  assert.match(route, /commitCreativeQuotaCharge\(quotaGate\)/);
  assert.match(route, /withCreativeVisitorCookie\(/);
});

test("plot-to-story dialog shares the parent plot quota state", () => {
  const page = source("src/components/blocks/plot-generate/index.tsx");
  assert.match(
    page,
    /<PlotToStoryDialog[\s\S]*?creativeQuota=\{creativeQuota\}/
  );

  const dialog = source(
    "src/components/blocks/plot-generate/plot-to-story-dialog.tsx"
  );
  assert.match(dialog, /creativeQuota: CreativeQuotaPageState/);
  assert.match(dialog, /guardAnonymousCreativeQuota\(/);
  assert.match(dialog, /guardCreativeCreditQuota\(/);
  assert.match(dialog, /handleQuotaError\(response\.status, errorData\)/);
  assert.match(dialog, /creativeQuota\.increment\(selectedModel\)/);
  assert.match(
    dialog,
    /<CreativeQuotaHint[\s\S]*?pageKey="plot-generator"/
  );
});
