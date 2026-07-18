# Creative Credit Paywall Design

## Goal

When a signed-in user selects the Creative model, reaches the page's daily
free-use limit, and has fewer credits than the configured Creative generation
cost, stop the generation in the browser and open the existing paywall. The
server remains authoritative for direct API calls, stale client state, and
concurrent requests.

## Scope

Apply the behavior to every generator already registered in
`CREATIVE_PAGE_KEYS`, including the story generator. It applies only when the
selected model is `creative`; non-Creative models keep their current behavior.

## Design

The Creative quota status endpoint will return the daily quota status plus the
server-resolved Creative cost and, for signed-in users, the current remaining
credits. This avoids exposing a separate client-side cost configuration that
could drift from `SG_CREATIVE_COST`.

`useCreativeQuotaPage` will retain that status and expose one shared guard for
the signed-in credit case. The guard returns false until all of these
conditions hold:

1. The selected model is `creative`.
2. The daily free quota has been exhausted.
3. A signed-in user has fewer credits than the server-provided Creative cost.

When the guard blocks, it shows the localized insufficient-credit toast and
opens the existing paywall without starting Turnstile verification or a
generation request. When a charged Creative request succeeds, the hook updates
its local balance so another generation in the same page visit is also
intercepted correctly.

Each Creative generator will invoke the anonymous quota guard and the new
credit guard immediately before its existing request path. The story generator
will use the same shared guard instead of its page-specific, hard-coded
five-credit check.

## Backend Fallback

`prepareCreativeQuota` and its existing `402 insufficient_credits` response
remain unchanged. The hook's existing response handler continues to open the
paywall for that response. This covers stale state, another tab spending the
credits, session changes, and clients that bypass the UI.

## Error Handling

If quota status cannot be loaded, the client does not block the generation
optimistically. The normal request proceeds and the server fallback handles an
actual shortage. An unavailable or malformed balance is treated as unknown,
not zero, so a status-fetch failure cannot falsely show a paywall.

## Tests

Add unit coverage for the shared client-side decision function, including
free quota remaining, non-Creative models, enough credits, insufficient
credits, and unknown balance. Add focused source-level integration assertions
that all registered Creative generators invoke the shared credit guard. Keep
the existing route tests proving that the server rejects insufficient credits
before generation.
