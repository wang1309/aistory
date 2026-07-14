# Pricing OpenPanel Instrumentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add OpenPanel purchase-funnel tracking to the pricing page for checkout clicks, authentication interruptions, checkout creation success, and checkout failures.

**Architecture:** Keep the existing pricing page and checkout API unchanged. Add `useOpenPanel()` to the client-side pricing block and emit events at the existing `handleCheckout` decision points, using a single local payload builder so normal and CNY checkout paths share the same event fields. Existing automatic OpenPanel screen-view tracking remains responsible for the page view.

**Tech Stack:** Next.js 15, React 19, TypeScript, `@openpanel/nextjs`, existing pricing component and `requireAuth` flow.

---

## Files and responsibilities

- Modify `src/components/blocks/pricing/index.tsx`: build pricing event context and emit the four agreed events from the existing checkout handler.
- Do not modify `src/app/[locale]/(default)/pricing/page.tsx`: it already renders the client pricing block and automatic screen views are configured globally.
- Do not modify `src/app/api/checkout/route.ts`: the frontend already receives the result needed to distinguish checkout creation from failure.
- Existing design documentation: `docs/superpowers/specs/2026-07-14-pricing-openpanel-instrumentation-design.md`.

### Task 1: Add shared pricing event context

**Files:**
- Modify: `src/components/blocks/pricing/index.tsx:1-35`

- [ ] **Step 1: Import the OpenPanel hook and initialize tracking**

Add `useOpenPanel` beside the existing client imports and initialize it inside `Pricing`:

```tsx
import { useOpenPanel } from "@openpanel/nextjs";

// inside Pricing
const { track } = useOpenPanel();
```

Keep the component as a client component; do not add another analytics provider or browser-side script.

- [ ] **Step 2: Add one payload builder for both payment paths**

Build the common payload at the beginning of `handleCheckout` so both the regular CTA and the CNY image pass identical fields:

```tsx
const trackingPayload = {
  source_page: "pricing",
  product_id: item.product_id,
  product_name: item.product_name || item.title || item.product_id,
  pricing_group: item.group || null,
  interval: item.interval,
  currency: cn_pay ? "cny" : item.currency,
  payment_method: cn_pay ? "cnpay" : "default",
  logged_in: !!user,
};
```

Use `product_name` fallback values because the type allows the display name fields to be absent. Do not include `amount`, email, order number, checkout URL, or raw error messages.

### Task 2: Instrument checkout click and authentication branches

**Files:**
- Modify: `src/components/blocks/pricing/index.tsx:27-50`

- [ ] **Step 1: Emit the click event before any early return**

At the first executable line of `handleCheckout`, call:

```tsx
track("pricing_checkout_click", trackingPayload);
```

This must happen before the `!user` guard so logged-out purchase intent is included.

- [ ] **Step 2: Emit the pre-request authentication event**

Inside the existing `if (!user)` branch, emit:

```tsx
track("pricing_auth_required", {
  ...trackingPayload,
  reason: "not_authenticated",
});
```

Then preserve the existing `requireAuth({ source: "pricing", action: "checkout" })` call and return without making a checkout request.

- [ ] **Step 3: Emit the expired-session event for HTTP 401**

In the existing `response.status === 401` branch, emit:

```tsx
track("pricing_auth_required", {
  ...trackingPayload,
  reason: "session_expired",
  http_status: 401,
});
```

Preserve the loading reset, `requireAuth` call, and return. Do not also emit `pricing_checkout_failed` for 401 because it is an expected authentication recovery path.

### Task 3: Instrument checkout success and failure outcomes

**Files:**
- Modify: `src/components/blocks/pricing/index.tsx:45-78`

- [ ] **Step 1: Treat non-success HTTP or business responses as checkout failures**

After parsing the response, handle either `!response.ok` or `code !== 0` as a failure and emit:

```tsx
track("pricing_checkout_failed", {
  ...trackingPayload,
  failure_reason: "response_error",
  http_status: response.status,
});
```

Keep the existing error toast and return. If response JSON cannot be parsed, use the same `response_error` event with `response.status` rather than exposing the parser error.

- [ ] **Step 2: Track missing checkout URLs separately**

When the API response is otherwise successful but `checkout_url` is absent, emit:

```tsx
track("pricing_checkout_failed", {
  ...trackingPayload,
  failure_reason: "missing_checkout_url",
  http_status: response.status,
});
```

Keep the existing fallback toast and return.

- [ ] **Step 3: Track checkout creation immediately before redirect**

After confirming `checkout_url` is truthy and immediately before `window.location.href = checkout_url`, emit:

```tsx
track("pricing_checkout_created", trackingPayload);
```

This event means checkout was created and the user is being sent to the provider; it must not be named or documented as a completed payment.

- [ ] **Step 4: Track request and unexpected parsing exceptions**

In the existing `catch` block, emit:

```tsx
track("pricing_checkout_failed", {
  ...trackingPayload,
  failure_reason: "network_error",
});
```

Keep the existing console logging and toast. The existing `finally` block must continue to clear `isLoading` and `productId`.

### Task 4: Verify all paths and production build

**Files:**
- Test: `src/components/blocks/pricing/index.tsx`

- [ ] **Step 1: Run formatting and diff checks**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 2: Verify event coverage statically**

Run:

```bash
rg -n 'pricing_checkout_click|pricing_auth_required|pricing_checkout_created|pricing_checkout_failed' src/components/blocks/pricing/index.tsx
```

Expected: click, both auth reasons, success, response-error, missing-URL, and network-error branches are present in the pricing component; both the regular button and CNY entry still call `handleCheckout`.

- [ ] **Step 3: Run lint**

Run:

```bash
pnpm lint
```

Expected: exit code 0 with no new lint errors.

- [ ] **Step 4: Run the production build**

Run:

```bash
pnpm build
```

Expected: exit code 0 and a successful Next.js production build.

- [ ] **Step 5: Review the final diff**

Run:

```bash
git diff -- src/components/blocks/pricing/index.tsx
git status --short
```

Confirm only the pricing component contains implementation changes, no sensitive payload fields were added, and the previously committed spec/plan files remain intact.

