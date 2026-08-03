---
title: Frontend test harness
date: 2026-08-03
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
---

# Frontend Test Harness

## Goal Capsule

- **Objective:** Add a deterministic React test harness that runs locally and in CI, then use it to lock down the auth/session regressions documented by COR-009 and COR-010.
- **Authority:** `specs/web-application/authentification.feature` defines user-visible auth behavior; the preserved COR-009/COR-010 reviews define the regression invariants; `AGENTS.md` and `frontend/AGENTS.md` define project workflow and frontend conventions.
- **Execution profile:** Test-first infrastructure work in one bounded branch, split into runner integration and auth regression coverage.
- **Stop conditions:** Stop if a test requires changing user-visible auth behavior, generated GraphQL files, the backend `Me` resolver, or the media upload transport.
- **Tail ownership:** Run the full deterministic harness and Compound Engineering code review before commit, push, and PR.

---

## Product Contract

### Summary

The frontend currently has typechecking, linting, and production builds but no automated tests. The new harness must make frontend tests a required part of the existing project checks and prove the auth/session invariants behind the recently fixed cache and expiry regressions.

### Problem Frame

COR-009 showed that an anonymous `me: null` cache could survive login, and COR-010 showed that an expired session could leave the UI in an incoherent authenticated state. Both fixes were reviewed without automated regression coverage because the frontend had no runner. That missing layer also leaves future React changes outside the deterministic harness introduced in PR #52.

### Actors

- A1. Developer or agent running the local harness.
- A2. CI validating a branch or `main`.
- A3. Authenticated ShareMyTrips user whose session or identity changes.

### Requirements

**Runner and workflow**

- R1. The frontend provides a non-interactive test command suitable for both local checks and CI.
- R2. React tests run with browser-like DOM APIs and shared Testing Library matchers and cleanup.
- R3. Both `make check-fast` and `make check` fail when a frontend test fails.
- R4. Test files are typechecked and linted by the existing frontend commands without weakening compiler or lint rules.

**Auth regression coverage**

- R5. Auth state transitions create isolated urql clients so anonymous, prior-user, and logged-out caches cannot cross session boundaries.
- R6. Login and logout keep the in-memory token and `sessionStorage` key `smt_token` coherent.
- R7. Protected routes redirect without a token and do not mount protected children while current-user state is loading or known to represent an expired session.
- R8. Session expiry triggers logout only for a settled, successful current-user result whose `me` value is null; fetching, transport errors, and absent data must not be reclassified as expiry.
- R9. GraphQL requests include a Bearer header exactly when a token exists.
- R10. A defensive HTTP 401 response invokes the unauthorized callback once.

### Key Flows

- F1. Deterministic validation
  - **Trigger:** A1 or A2 runs a project check.
  - **Actors:** A1, A2
  - **Steps:** The existing frontend quality gates run together with the non-watch test suite; any failing test fails the project check.
  - **Outcome:** Frontend regressions block delivery through the same entry point as backend, generation, lint, and build failures.
  - **Covered by:** R1, R2, R3, R4
- F2. Authentication transition
  - **Trigger:** A3 logs in, logs out, or changes identity through a logout/login sequence.
  - **Actors:** A3
  - **Steps:** Token storage changes and the provider derives a new urql client for the new auth state.
  - **Outcome:** Cached data from the previous auth state is not reused.
  - **Covered by:** R5, R6
- F3. Protected-route session validation
  - **Trigger:** A3 opens a protected route with no token, a loading session, or an expired session.
  - **Actors:** A3
  - **Steps:** The layout redirects unauthenticated users, keeps protected content unmounted while validation is pending, and logs out only on confirmed expiry.
  - **Outcome:** No protected subtree renders with a missing or confirmed-dead session.
  - **Covered by:** R7, R8
- F4. Authenticated GraphQL transport
  - **Trigger:** A request is executed with or without an auth token, or receives HTTP 401.
  - **Actors:** A3
  - **Steps:** The client derives request headers from its captured token and signals unauthorized responses through its callback.
  - **Outcome:** Token attachment and defensive invalidation remain coherent.
  - **Covered by:** R9, R10

### Acceptance Examples

- AE1. Given no stored token, when `AuthProvider` mounts, then it creates an anonymous client and exposes a null token.
- AE2. Given an anonymous provider, when login stores token A, then `smt_token` contains A and a different client is provided.
- AE3. Given token A, when logout occurs and token B is subsequently used, then each auth state receives a distinct client and no A-scoped client is reused for B.
- AE4. Given no token on a protected route, when the layout renders, then navigation replaces the current location with `/login` and protected children do not mount.
- AE5. Given a token while the current-user query is fetching, when the layout renders, then protected children do not mount and logout is not called.
- AE6. Given a token and a settled successful `me: null` result, when the layout renders, then logout is called and protected children never mount on the expired frame.
- AE7. Given a token with a transport error or no current-user data, when the layout renders, then logout is not called solely because `me` is unavailable.
- AE8. Given token A, when a GraphQL operation reaches fetch, then the request contains `Authorization: Bearer A`; given no token, the header is absent.
- AE9. Given an HTTP 401 result, when the exchange processes it, then the unauthorized callback runs exactly once.
- AE10. Given any failing frontend test, when either root check target runs, then the command exits non-zero.

### Scope Boundaries

- In scope: Vitest, jsdom, React Testing Library, shared setup, deterministic npm scripts, Makefile integration, and the auth/session regression cases above.
- Out of scope: backend `Me` resolver behavior, mid-visit expiry polling, draft preservation, the MediaUploader XHR transport, new auth error taxonomy, browser end-to-end testing, visual regression testing, and global coverage thresholds.
- Production code may be extracted into a pure helper only when needed for testability and only if behavior remains identical.

Product Contract unchanged after user confirmation: frontend harness only, chosen over the full auth-hardening project.

---

## Planning Contract

### Key Technical Decisions

- KTD1. **Vitest uses the existing Vite configuration.** Vitest reads Vite configuration and supports a dedicated DOM environment; extending `frontend/vite.config.ts` avoids a second configuration surface and keeps the React plugin shared. This is compatible with Vite 8 and Node 22 used by CI.
- KTD2. **jsdom is the default test environment.** The first suite targets providers, routing, storage, and React effects, so a browser-like DOM is the honest default. Browser Mode and Playwright are unnecessary for this tranche.
- KTD3. **Vitest APIs are imported explicitly.** Tests import `describe`, `it`, `expect`, and hooks from Vitest instead of enabling global test types, preserving the current strict TypeScript configuration with minimal ambient state.
- KTD4. **Testing Library cleanup and matchers live in one setup file.** The setup imports the Vitest-specific jest-dom matchers and registers deterministic cleanup, keeping test files focused on behavior.
- KTD5. **Tests are colocated with their subjects.** AuthProvider and ProtectedLayout tests live beside the components, while only shared setup belongs under `frontend/src/test/`, matching the feature-oriented frontend layout.
- KTD6. **Auth tests assert observable boundaries.** Provider tests observe context, storage, and client identity; layout tests observe navigation, logout, and whether protected children mount. Transport tests exercise the urql client through its public behavior rather than exposing production-only internals.
- KTD7. **Frontend tests are mandatory in the existing root targets.** A dedicated `frontend-test` target is part of `frontend-check`, so both local loops and CI inherit it without duplicating workflow YAML.
- KTD8. **No coverage percentage gate in the first tranche.** The goal is a reliable runner plus high-value regressions. A numeric threshold with only one subsystem covered would incentivize low-value tests or create a misleading baseline.

### Technical Design

`frontend/vite.config.ts` owns both build and test configuration. The test section selects jsdom, points to a shared setup file, and resets mocks between tests. `frontend/package.json` exposes a deterministic `vitest run` script and may expose a watch-mode companion for local work. The root Makefile calls the deterministic script through a named frontend target.

AuthProvider coverage mocks the client factory at the module boundary and renders a small context consumer that drives login/logout. This isolates the provider contract without coupling tests to urql internals. ProtectedLayout coverage uses a memory router with controlled auth and `useMe` states; a sentinel route element proves whether protected children mounted. The client transport suite uses an intercepted fetch or an equivalent public-operation seam to observe headers and 401 callback behavior.

### Assumptions

- Current auth behavior in `frontend/src/features/auth/components/AuthProvider.tsx`, `frontend/src/features/auth/components/ProtectedLayout.tsx`, and `frontend/src/graphql/client.ts` is the behavior to preserve.
- Node 22 in CI satisfies Vitest's current Node requirement.
- Tests remain fast enough to run in both `make check-fast` and `make check`; no split into slow and fast frontend suites is needed yet.
- `@testing-library/user-event` is installed only if the implemented tests drive user interactions; provider/context callbacks alone do not require it.

### Sequencing

1. Establish the runner, shared setup, npm scripts, and root harness integration with a minimal smoke test proving jsdom and matchers work.
2. Add provider and protected-layout regression tests, extracting a pure expiry predicate only if the render tests cannot express the full truth table clearly.
3. Add the client transport tests for Bearer headers and HTTP 401 signaling through public behavior.
4. Run targeted tests, the full frontend suite, and `make check`; then perform Compound Engineering code review.

---

## Implementation Units

### U1. Deterministic frontend test runner

- **Goal:** Make React tests a first-class, mandatory project check.
- **Covers:** R1, R2, R3, R4; F1; AE10; KTD1, KTD2, KTD3, KTD4, KTD7
- **Files:**
  - Modify `frontend/package.json`
  - Modify `frontend/package-lock.json`
  - Modify `frontend/vite.config.ts`
  - Add `frontend/src/test/setup.ts`
  - Add `frontend/src/test/harness.test.tsx` as a small configuration proof, unless the first auth test fully proves the same setup
  - Modify `Makefile`
- **Patterns:** Preserve the existing `frontend-check` aggregation and use the same npm/Node installation path already exercised by `.github/workflows/ci.yml`.
- **Test scenarios:**
  1. A TypeScript React test executes under jsdom and can use a jest-dom matcher.
  2. The npm test command exits after one run rather than entering watch mode.
  3. A deliberately failing test causes `frontend-test`, `make check-fast`, and `make check` to fail; remove the counter-test after proving the wiring.
  4. Existing typecheck, lint, build, and generated-code checks continue to pass with test files included.
- **Verification:** `cd frontend && npm test`; `make check-fast`; final `make check`.

### U2. Auth provider and protected-route regressions

- **Goal:** Lock down storage, client isolation, redirect, loading, and confirmed-expiry behavior without changing auth semantics.
- **Covers:** R5, R6, R7, R8; F2, F3; AE1-AE7; KTD5, KTD6
- **Files:**
  - Add `frontend/src/features/auth/components/AuthProvider.test.tsx`
  - Add `frontend/src/features/auth/components/ProtectedLayout.test.tsx`
  - Optionally modify `frontend/src/features/auth/components/ProtectedLayout.tsx` only to extract a pure expiry predicate with identical behavior
- **Patterns:** Mock the client factory at its module boundary; expose AuthContext state through a test consumer; use React Router memory routing and a sentinel outlet child; reset `sessionStorage` and mocks after every test.
- **Test scenarios:**
  1. Mount with empty storage creates an anonymous client and exposes no token.
  2. Mount with `smt_token` initializes both context and client with that token.
  3. Login writes storage, updates context, and replaces the client instance.
  4. Logout removes storage, clears context, and replaces the client instance.
  5. Login A → logout → login B produces distinct clients for all three auth states.
  6. No token redirects to `/login` with replace semantics and never mounts protected children.
  7. A fetching current-user query keeps the placeholder visible, does not call logout, and does not mount protected children.
  8. A settled successful `me: null` result calls logout and never mounts protected children on the expired render.
  9. A valid current user mounts the protected outlet.
  10. Transport error and absent-data states do not trigger expiry logout.
- **Verification:** `cd frontend && npm test -- AuthProvider ProtectedLayout`; then `npm test`.

### U3. GraphQL auth transport regressions

- **Goal:** Prove token capture and the defensive unauthorized callback at the public client boundary.
- **Covers:** R9, R10; F4; AE8, AE9; KTD6
- **Files:**
  - Add `frontend/src/graphql/client.test.ts`
- **Patterns:** Execute a minimal operation against `makeClient` with a controlled fetch implementation; assert externally visible request options and callback effects instead of exporting exchange configuration.
- **Test scenarios:**
  1. A client built with no token sends no Authorization header.
  2. A client built with token A sends `Authorization: Bearer A`.
  3. A client built with token A continues to use A even when another client is later constructed, proving closure isolation.
  4. One HTTP 401 response invokes `onUnauthorized` exactly once.
  5. A non-401 transport error does not invoke `onUnauthorized`.
- **Verification:** `cd frontend && npm test -- client`; then `npm test`.

---

## Verification Contract

| Gate | Command | Applies to | Done signal |
|---|---|---|---|
| Targeted provider/layout regressions | `cd frontend && npm test -- AuthProvider ProtectedLayout` | U2 | All auth state and render-state tests pass |
| Targeted transport regressions | `cd frontend && npm test -- client` | U3 | Header and unauthorized callback tests pass |
| Frontend test suite | `cd frontend && npm test` | U1-U3 | Vitest exits zero in run mode |
| Fast project loop | `make check-fast` | U1-U3 | Backend tests and all frontend gates, including tests, pass |
| Full project harness | `make check` | U1-U3 | Race, vet, builds, generation drift, frontend tests, typecheck, and lint all pass |
| Review | Compound Engineering `ce-code-review` on the branch diff | U1-U3 | No unresolved P0/P1 findings; blocking lower-severity findings fixed or explicitly resolved |

Negative verification is required for the Makefile wiring: temporarily introduce a failing frontend test and prove both root check targets stop. Revert the temporary failure before final validation.

---

## Definition of Done

- Vitest, jsdom, and the required Testing Library packages are locked in `frontend/package-lock.json` and reproducible with `npm ci`.
- `npm test` is deterministic and non-interactive; an optional watch script is clearly separate.
- Test files typecheck and lint under the existing strict configuration.
- `make check-fast` and `make check` both execute the frontend tests and fail closed on a test failure.
- AuthProvider tests prove storage coherence and a fresh client for anonymous, login, logout, and cross-user transitions.
- ProtectedLayout tests prove redirect, loading, valid-session, confirmed-expiry, error, and absent-data behavior, including the no-protected-frame invariant.
- Client tests prove Bearer-header presence/absence, per-client token capture, and exactly-once HTTP 401 signaling.
- No generated GraphQL file or out-of-scope auth behavior is changed.
- The full `make check` harness passes and the branch review has no unresolved blocking findings.

---

## Appendix

### Repository evidence

- `specs/web-application/authentification.feature`
- `docs/reviews/compound-engineering/ce-review/2026-07-06-cor-009/review-summary.md`
- `docs/reviews/compound-engineering/ce-review/2026-07-06-cor-010/review-summary.md`
- `frontend/src/features/auth/components/AuthProvider.tsx`
- `frontend/src/features/auth/components/ProtectedLayout.tsx`
- `frontend/src/graphql/client.ts`
- `Makefile`
- `.github/workflows/ci.yml`

### External guidance

- Vitest Getting Started: https://vitest.dev/guide/
- Vitest Test Environment: https://vitest.dev/guide/environment.html
- Vitest setupFiles: https://vitest.dev/config/setupfiles
- React Testing Library Setup: https://testing-library.com/docs/react-testing-library/setup/
- React Testing Library Introduction: https://testing-library.com/docs/react-testing-library/intro/
