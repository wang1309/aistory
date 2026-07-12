# Authentication Funnel Instrumentation Design

## Goal

Create a consistent authentication funnel across the existing OAuth flow so the product can measure registration intent, provider conversion, failures, and whether the user's original action is resumed after authentication.

## Scope

- Add typed authentication sources and required actions.
- Replace direct `setShowSignModal(true)` calls in the agreed high-value entry points with a shared auth-intent API.
- Track modal open, close, provider click, success, and failure events in OpenPanel.
- Preserve enough client-side intent to resume save, like, comment, AI Write, checkout, and pricing actions where the existing flow supports it.
- Keep the existing Google/GitHub/Google One Tap providers unchanged.
- Do not add email/password registration or change auth copy in this phase.

## Architecture

`AppContext` owns the current `AuthIntent` and exposes `requireAuth(intent)` plus `clearAuthIntent()`. The sign modal consumes the intent, records lifecycle events, and passes the intent through OAuth using the existing `redirectTo` mechanism. Existing continue-AI-write behavior remains compatible with the new intent model.

The event payload uses non-sensitive context only: source, action, provider, locale, context mode, and success/error classification. It must not include email addresses, IP addresses, OAuth tokens, prompts, story bodies, or raw identifiers.

## Event Contract

- `auth_required`: an unauthenticated user attempted a protected action.
- `auth_modal_open`: the auth modal became visible.
- `auth_modal_close`: the modal closed before provider completion, with close reason when known.
- `auth_provider_click`: the user selected Google or GitHub.
- `auth_success`: authentication returned successfully, with `is_new_user` when available.
- `auth_error`: authentication failed or returned without a usable session.
- `post_auth_action_resumed`: the original protected action completed after authentication.
- `post_auth_action_failed`: the original action could not be resumed.

Common payload fields:

```ts
{
  source: AuthSource;
  action: AuthAction;
  provider?: "google" | "github" | "google-one-tap";
  context?: string;
  locale?: string;
  reason?: string;
}
```

## Intent Model

```ts
type AuthSource =
  | "header"
  | "story_save"
  | "story_like"
  | "story_comment"
  | "ai_write"
  | "paywall"
  | "pricing";

type AuthAction =
  | "sign_in"
  | "save_story"
  | "like_story"
  | "comment_story"
  | "continue_writing"
  | "checkout";
```

The intent may carry a safe same-origin `redirectTo` and a small action-specific resume marker. Existing generated text and story content stay in the current local draft/prefill mechanisms rather than being sent to analytics.

## Error Handling

- Tracking must never block or fail the auth interaction.
- OAuth provider selection continues to use `signIn(provider, { redirectTo })`.
- A provider callback that returns no usable session records `auth_error` and leaves the user with a retryable auth UI where the existing NextAuth flow permits it.
- Missing or malformed intent data falls back to the existing default sign-in behavior.

## Testing

- Add unit tests for auth intent construction and event payload sanitization.
- Add tests that assert every migrated protected entry point supplies a source and action.
- Preserve the existing continue-AI-write wiring tests.
- Run the focused tests, lint, and build before completion.
