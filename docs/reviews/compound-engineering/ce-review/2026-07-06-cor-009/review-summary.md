# ce-review — fix/frontend-auth-cache (COR-009) — 2026-07-06

**Scope:** branch `fix/frontend-auth-cache` vs `main` (PR #36). Files: `frontend/src/graphql/client.ts`, `frontend/src/features/auth/components/AuthProvider.tsx`, `frontend/src/main.tsx`, `tasks/TASKS.md`.

**Intent:** fix COR-009 — urql graphcache served a pre-login `me: null` after login (empty profile button, trips filtered as reader) until full reload. Fix: `makeClient()` factory + client recreated on login/logout in AuthProvider.

**Team:** correctness, testing, maintainability (always-on) · agent-native, learnings-researcher (CE) · security (conditional: auth token handling).

## Verdict: Ready to merge

No P0/P1. The fix itself was validated by correctness (token set before client swap, React 18 batching, lazy fetchOptions read, StrictMode harmless) and verified end-to-end in browser including a counter-proof on `main`.

## Findings (merged, deduped)

| Sev | Finding | Route | Outcome |
|-----|---------|-------|---------|
| P2 | 401 handler only clears the module token — sessionStorage, AuthProvider state and cache stay "logged in"; dead token re-armed from sessionStorage on refresh. Flagged by correctness, maintainability, testing, security. Pre-existing (handler predates branch), but the branch's cache-drop invariant makes it newly visible. | manual → downstream | Logged as **COR-010** in tasks/TASKS.md |
| P2 | Module-level `authToken` outside the factory forces the `setAuthToken` + `setClient` lockstep pair; `makeClient(token)` closing over its token would remove the shared mutable state. Entangled with the 401 handler rework. | gated_auto → downstream | Folded into **COR-010** suggested fix |
| P3 | TASKS.md marked COR-009 "à corriger" in the fixing branch. | safe_auto → review-fixer | **Fixed** (marked corrigé dans #36) |
| P3 | No automated regression test for the COR-009 scenario. | advisory | No frontend test harness exists yet; noted below |

## Residual risks / advisory

- Narrow race: an in-flight request on the old client 401-ing right after a successful login would clear the freshly set module token (removed if COR-010 adopts `makeClient(token)`).
- 401 detection is HTTP-only; a GraphQL-level auth error (200 + `errors`) would not trigger the handler.
- Client recreation refetches all mounted queries at once and drops in-flight results; acceptable at current scale.
- `MediaUploader.tsx` sends the Bearer token via hand-rolled XHR outside urql (pre-existing).

## Testing gaps (for when a frontend harness lands)

1. COR-009 regression: prime cache with `me: null`, `login()`, assert refetch (new client instance).
2. Cross-user: login A → logout → login B serves no cached A data.
3. 401 path: expired session ends in a coherent logged-out state (currently doesn't — COR-010).

## Agent-native / learnings

- Agent-native: no impact (no new UI action, GraphQL API unchanged).
- Learnings: no `docs/solutions/` in repo; this fix is a good first candidate for a solution entry ("auth-scoped data cached while unauthenticated must not survive login — recreate the client on auth transitions").
