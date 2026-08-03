---
title: Backend HTTP GraphQL integration harness
date: 2026-08-03
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
---

# Backend HTTP GraphQL Integration Harness

## Goal Capsule

- **Objective:** Add a representative integration harness that exercises the real `/query` HTTP boundary through CORS, Bearer authentication, gqlgen resolvers, domain handlers, and fresh in-memory adapters.
- **Authority:** `specs/web-application/authentification.feature`, `specs/web-application/gestion-des-voyages.feature`, existing GraphQL conventions, and the server wiring in `backend/cmd/server/main.go`.
- **Execution profile:** Test-only Go change with no production behavior or dependency changes.
- **Stop conditions:** Stop if coverage requires PostgreSQL, media REST/filesystem behavior, generated GraphQL edits, or a production router refactor.
- **Tail ownership:** Run targeted tests, the full deterministic harness, Compound Engineering review, then ship through a PR.

---

## Product Contract

### Summary

The backend has thorough domain tests but no automated proof that HTTP JSON requests traverse the actual GraphQL schema, middleware, resolvers, and in-memory handlers coherently. This tranche establishes that missing layer with a small set of high-value flows rather than duplicating every operation.

### Requirements

- R1. Tests send real HTTP requests to `/query` through a test server assembled from production middleware and gqlgen types.
- R2. Each test receives isolated in-memory repositories and handlers.
- R3. CORS preflight returns the configured origin, allowed methods and headers, and short-circuits with HTTP 204.
- R4. A protected mutation with missing or invalid credentials returns its domain authorization failure in the GraphQL payload `errors` field rather than top-level data corruption or an invented HTTP 401.
- R5. Initial admin setup returns an ADMIN account and a non-empty session token.
- R6. The configured admin can log in and use a Bearer token to query `me` through the auth middleware.
- R7. An authenticated admin can create a representative trip through GraphQL and receives a DRAFT trip with no business errors.
- R8. Invalid or missing credentials on `me` preserve the current HTTP 200 plus `me: null` behavior; this test-only tranche does not redefine auth semantics.
- R9. The suite runs automatically under `go test ./...`, `make check-fast`, `make check`, and CI without new workflow wiring.

### Key Flows

- F1. HTTP transport validation
  - **Trigger:** A test sends OPTIONS or POST to `/query`.
  - **Steps:** A local HTTP server routes through CORS, auth middleware, gqlgen, resolvers, and in-memory handlers.
  - **Outcome:** The recorded status, headers, GraphQL data, and payload errors reflect the deployed boundary.
  - **Covered by:** R1-R4, R8, R9
- F2. Bootstrap and authenticated mutation
  - **Trigger:** A fresh application state receives setup, login, `me`, and `createTrip` operations.
  - **Steps:** Setup creates the admin and session, login returns a token, Bearer context resolves the account, and an authorized mutation reaches the trip handler.
  - **Outcome:** The representative vertical slice succeeds without direct resolver calls.
  - **Covered by:** R2, R5, R6, R7

### Acceptance Examples

- AE1. Given an OPTIONS request with the configured Origin, `/query` returns 204 and the expected CORS headers without executing GraphQL.
- AE2. Given no Authorization header, `createTrip` returns HTTP 200 with `trip: null` and a business `forbidden` error in the mutation payload.
- AE2a. Given an invalid Bearer token, `createTrip` returns the same HTTP 200 and payload-level `forbidden` result.
- AE3. Given fresh state, `setupAdmin` returns an ADMIN account and token; login with the same credentials returns a token.
- AE4. Given the login token in `Authorization: Bearer`, `me` returns the configured admin.
- AE5. Given the login token, `createTrip` with title, description, dates, countries, and coordinates returns a DRAFT trip and an empty errors list.
- AE6. Given an invalid Bearer token, `me` returns HTTP 200 with `data.me: null`.

### Scope Boundaries

- In scope: standard-library `httptest`, real `/query` routing, CORS, GraphQL Bearer context, setup/login/me, one denied and one successful trip mutation.
- Out of scope: complete query/mutation matrix, PostgreSQL, migrations, media REST/upload, filesystem, browser tests, performance tests, production auth changes, and coverage thresholds.

Product Contract unchanged after user confirmation: representative harness chosen over full GraphQL API coverage.

---

## Planning Contract

### Key Technical Decisions

- KTD1. **Place the harness in `backend/cmd/server`.** Tests in `package main` can exercise the actual unexported `corsMiddleware` and mirror `/query` composition without exporting production-only seams.
- KTD2. **Use `httptest.NewServer` with a private ServeMux.** A real loopback client proves HTTP serialization and routing while avoiding the global default mux used by `main`.
- KTD3. **Build fresh in-memory dependencies per test.** The factory mirrors the production in-memory branch, uses `crypto.NewBcryptHasher(bcrypt.DefaultCost)` because the production constructor rejects lower costs, and prevents state leakage.
- KTD4. **Assert GraphQL transport and business errors separately.** Helpers decode HTTP status, top-level GraphQL errors, typed data, and payload-level `errors` without treating HTTP 200 as automatic success.
- KTD5. **Keep assembly test-only.** Extracting a production application/router builder would reduce duplication but broadens risk beyond the requested no-behavior-change tranche.
- KTD6. **Preserve existing invalid-session semantics.** `me` currently maps invalid sessions to `200 + null`; the harness records that behavior and does not turn it into a new contract decision.

### Technical Design

`backend/cmd/server/graphql_integration_test.go` defines a small harness with a started `httptest.Server`, an HTTP client, and request helpers. Construction creates fresh trip, stage, visit, auth, and media handlers from in-memory adapters, then composes the same gqlgen server, authentication middleware, CORS wrapper, and `/query` mux route used by the in-memory production path.

Request helpers marshal `{query, variables}`, optionally attach Origin and Bearer headers, execute POST requests, require HTTP transport success, and decode a generic GraphQL envelope before scenario-specific assertions. The happy path remains sequential inside one isolated harness because setup, login, `me`, and mutation intentionally share state.

### Assumptions

- Existing in-memory repositories are concurrency-safe and need no test-only modifications.
- Media operations are not exercised, but the handler receives an isolated `t.TempDir()` filesystem adapter so the resolver graph remains fully wired without shared state.
- Existing testify, gqlgen, bcrypt, and standard-library dependencies are sufficient.
- CI already executes the suite transitively through `make check`.

---

## Implementation Units

### U1. Reusable HTTP GraphQL test harness

- **Goal:** Build isolated real-HTTP test assembly and request/decode helpers.
- **Covers:** R1, R2, R9; F1; KTD1-KTD5
- **Files:** Add `backend/cmd/server/graphql_integration_test.go`.
- **Patterns:** Mirror the in-memory constructors and handler composition in `backend/cmd/server/main.go`; use testify `require` for transport/setup and `assert` for returned values.
- **Test scenarios:**
  1. A fresh harness starts and accepts a JSON GraphQL POST at `/query`.
  2. Separate harness instances do not share accounts, sessions, or trips.
- **Verification:** `cd backend && go test ./cmd/server -v`.

### U2. CORS and unauthenticated boundary coverage

- **Goal:** Prove the middleware chain and GraphQL business-error convention at the external boundary.
- **Covers:** R3, R4, R8; F1; AE1, AE2, AE6; KTD4, KTD6
- **Files:** Extend `backend/cmd/server/graphql_integration_test.go`.
- **Test scenarios:**
  1. OPTIONS preflight returns 204 with exact configured origin, allowed methods, and Content-Type/Authorization headers.
  2. Missing credentials on `createTrip` return HTTP 200, no top-level GraphQL error, null trip, and payload `forbidden` error.
  3. An invalid Bearer token on `createTrip` returns the same denied payload, proving unknown sessions cannot authorize protected mutations.
  4. Invalid Bearer token on `me` returns HTTP 200, no top-level GraphQL error, and null account.
- **Verification:** `cd backend && go test ./cmd/server -run 'TestGraphQLHTTP_(CORSPreflight|ProtectedMutationRejectsMissingOrInvalidToken|MissingOrInvalidTokenReturnsNullMe)' -count=1 -v`.

### U3. Bootstrap-to-business vertical slice

- **Goal:** Prove a real authenticated journey from empty state through a protected domain mutation.
- **Covers:** R5, R6, R7; F2; AE3-AE5; KTD3, KTD4
- **Files:** Extend `backend/cmd/server/graphql_integration_test.go`.
- **Test scenarios:**
  1. Setup returns the requested ADMIN identity and a non-empty token.
  2. Login with the setup credentials returns a non-empty token and no business errors.
  3. `me` with the login Bearer token returns the admin identity and role.
  4. Authenticated `createTrip` with representative complete input returns DRAFT, preserves supplied fields, and returns no errors.
- **Verification:** `cd backend && go test ./cmd/server -run TestGraphQLHTTP_AdminAuthenticationAndTripCreation -count=1 -v`.

---

## Verification Contract

| Gate | Command | Done signal |
|---|---|---|
| Targeted integration suite | `cd backend && go test ./cmd/server -v` | All HTTP/GraphQL scenarios pass |
| Race coverage | `cd backend && go test -race ./cmd/server` | No race detected in shared request state |
| Fast project loop | `make check-fast` | Integration suite runs transitively and all fast checks pass |
| Full project harness | `make check` | Vet, race, builds, frontend gates, codegen drift, and integration tests pass |
| Review | Compound Engineering `ce-code-review` | No unresolved blocking findings |

---

## Definition of Done

- The real `/query` handler chain is tested over HTTP with fresh in-memory application state.
- CORS preflight, denied protected mutation, invalid-session `me`, setup, login, authenticated `me`, and successful trip creation are covered.
- Tests distinguish HTTP status, top-level GraphQL errors, and business payload errors.
- No production file, generated GraphQL file, dependency manifest, Makefile, or CI workflow changes solely to enable the suite.
- Targeted tests, race tests, and `make check` pass.
- Compound Engineering review has no unresolved blocking finding.

---

## Appendix

### Repository evidence

- `backend/cmd/server/main.go`
- `backend/internal/graphql/middleware.go`
- `backend/internal/graphql/schema.resolvers.go`
- `backend/api/schema.graphqls`
- `specs/web-application/authentification.feature`
- `specs/web-application/gestion-des-voyages.feature`
- `docs/plans/2026-04-06-001-feat-graphql-trip-api-plan.md`
- `docs/reviews/compound-engineering/ce-review/2026-07-06-cor-010/review-summary.md`

### External guidance

- Go `net/http/httptest`: https://pkg.go.dev/net/http/httptest
