# ce-review — fix/frontend-session-expiry (COR-010) — 2026-07-06

**Scope:** branch `fix/frontend-session-expiry` vs `fix/frontend-auth-cache` (PR #37, stacked on #36). Files: `frontend/src/graphql/client.ts`, `frontend/src/features/auth/components/AuthProvider.tsx`, `frontend/src/features/auth/components/ProtectedLayout.tsx`.

**Intent:** fix COR-010 — expired sessions left the UI frozen "logged in" (backend answers `me: null` HTTP 200 for invalid tokens; the GraphQL endpoint never emits 401). Fix: `me: null` detection in ProtectedLayout → logout; `makeClient(token, onUnauthorized)` with the token as constructor param (module-level `authToken` deleted); client derived from token via `useMemo` in AuthProvider.

**Team:** correctness, testing, maintainability, security. Agent-native and learnings conclusions carried over from the COR-009 run (same subsystem, no new API/UI surface, no `docs/solutions/` in repo).

## Verdict: Ready to merge (fixes applied)

No P0/P1 across the four reviewers.

## Findings (merged, deduped)

| Sev | Finding | Route | Outcome |
|-----|---------|-------|---------|
| P3 | Expired frame still rendered the protected children once, firing queries with the dead token before the logout effect ran. Flagged by correctness (0.85, safe_auto), security (0.70), maintainability (0.72). | safe_auto → review-fixer | **Fixed**: `if (fetching \|\| sessionExpired)` keeps the placeholder up (commit eb9cece) |
| P3 | Dual session-invalidation mechanisms (401 callback vs `me: null` detection) — only the second fires today; readers could mistake the live one. | safe_auto → review-fixer | **Fixed**: defensive-only comment on the 401 branch (commit eb9cece) |
| P2/P3 | No automated coverage for the `sessionExpired` predicate, the 401 wiring, or the client-per-token invariant. | advisory | No frontend test harness exists; test targets listed below for when one lands |

## Residual risks (accepted, documented in PR)

- Cache-first `me` + layout-route mount: a session expiring **mid-visit** is only detected on reload/remount; mutations fail with business errors until then. Server-side enforcement intact.
- Backend `Me` resolver swallows all `GetCurrentUser` errors as `(nil, nil)`: a transient auth-store failure is indistinguishable from expiry and now force-logs-out (availability, pre-existing backend behavior).
- Persistent transport error with a valid token still renders the layout with `user=null` (the deliberate `!error` guard); intended degraded behavior undecided.
- `useMemo` is not a semantic guarantee — a discarded memo recreates the client (refetch, not incorrect data).
- MediaUploader handles the media REST 401 as a generic upload error without logout (pre-existing).

## Test targets when a frontend harness lands (vitest + testing-library suggested)

1. Truth-table for the `sessionExpired` predicate (extract to a pure `isSessionExpired()` for render-free testing): logout fires only for token + data + `me: null` + no error; never while fetching / on error / without data.
2. AuthProvider: token transition ⇒ new client instance (cache isolation, the COR-009 invariant).
3. `makeClient` fetchOptions: Authorization header present iff token non-null.
4. mapExchange: HTTP 401 ⇒ `onUnauthorized` exactly once.
