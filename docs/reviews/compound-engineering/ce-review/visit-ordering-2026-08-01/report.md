# ce-review — feat/visit-ordering

- Base: c0ad23f (main)
- Branch: feat/visit-ordering
- Mode: interactive
- Intent: Add explicit position-based ordering for visits sharing the same primary stage and date, with a `reorderVisits` GraphQL mutation and frontend drag-and-drop UI, mirroring the existing Media reorder feature.

## Reviewer team

- correctness (always)
- testing (always)
- maintainability (always)
- agent-native-reviewer (always)
- learnings-researcher (always)
- api-contract-reviewer — GraphQL schema/type changes
- data-migrations-reviewer — new migration 000003_add_visit_position

## Findings (merged, post-fix)

| # | Title | Confidence | Reviewers | Status |
|---|---|---|---|---|
| 1 | Postgres `Reorder` ignored (stageID, date) scoping | 0.72–0.75 | correctness, maintainability | Fixed — WHERE clause now scopes each UPDATE via visit_stages join |
| 2 | "Day" naming reintroduced after the Day→Visit rename | 0.6 | maintainability | Fixed — renamed to SameDateVisitGroup/dateGroups/Group* |
| 3 | Handler.Reorder empty-group no-op branch untested | 0.75 | testing | Fixed — added Gherkin scenario |
| 4 | Reorder scenarios never asserted on Handler.Reorder's own return value | 0.68 | testing | Fixed — reorderGroupVisits now validates the returned slice |
| 5 (residual) | AddVisit/UpdateVisit don't select `position` | 0.55 (both, below gate) | api-contract, correctness | Fixed anyway (cheap, closes a latent trap) |
| 6 (residual) | NextPosition→Save race, non-atomic | 0.55–0.65 | correctness (x2), maintainability | Not fixed — mirrors existing accepted Media trade-off, out of scope for this PR |
| 7 (residual) | specs/web-application vs testdata/visit.feature scenario divergence | 0.65 | correctness | Not fixed — matches this file's pre-existing convention (testdata already has scenarios with no specs equivalent) |
| 8 (residual) | DayVisitGroup/SameDateVisitGroup lives in the page file, not its own component file | 0.65 | maintainability | Not fixed — matches existing StageSection/VisitRow precedent in the same file |

## Coverage

- No `docs/solutions/` directory exists — nothing to consult for past learnings.
- Postgres adapter and frontend have zero automated test coverage project-wide (pre-existing convention, not a new gap).
- Concurrent reorder/add races remain untested in both directions (accepted, mirrors Media).

## Agent-native

PASS — `reorderVisits` + `visits`/`tripVisits` (now exposing `position`) are fully sufficient for any GraphQL client to reorder a day with no drag-gesture simulation needed. Same `requireEditor`/`IsModifiable` enforcement as every sibling mutation.

## Verdict

**Ready to merge** after the fixes in commit `2f435cc`. All 26 backend Gherkin scenarios pass, frontend typecheck/lint clean, full build green.
