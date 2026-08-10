---
title: "feat: Reassign media between visits and travel legs"
type: feat
date: 2026-08-10
topic: media-reassignment
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
execution: code
---

# feat: Reassign media between visits and travel legs

## Goal Capsule

Allow an editor to select one or more photos/videos in a gallery and change
their owner between visits and travel legs of the same trip. The operation
must preserve the selected order, append media to the destination gallery,
move the original and thumbnail files, and return business errors through the
GraphQL payload.

## Product Contract

### Requirements

- R1. Move selected media from one visit to another visit.
- R2. Move selected media from one travel leg to another travel leg.
- R3. Move selected media between a visit and a travel leg in either direction.
- R4. Keep media in the same trip; reject a destination from another trip.
- R5. Preserve selection order, append it after existing destination media, and
  compact the source positions.
- R6. Editors can perform the operation; readers cannot see or invoke it.
- R7. Move both the stored original and existing thumbnail without changing the
  stable media ID or metadata.

## Decisions

- Expose one bulk `moveMedia` GraphQL mutation with a destination input that
  accepts exactly one `visitID` or `travelLegID`.
- Infer the source owner from each media ID and require all selected IDs to
  belong to the same source owner. This matches selection from one gallery and
  avoids ambiguous mixed-source ordering.
- Keep moves within one trip. The destination is validated through the same
  visit/travel-leg checkers as upload, and the trip must remain modifiable.
- Add a repository-level move operation and a storage-level move operation so
  PostgreSQL can update ownership/positions transactionally and the filesystem
  can rename originals/thumbnails safely.

## Implementation Units

### Unit 1: Domain move command and adapters

Files:

- `backend/internal/domain/media/model.go`
- `backend/internal/domain/media/command.go`
- `backend/internal/domain/media/repository.go`
- `backend/internal/domain/media/storage.go`
- `backend/internal/domain/media/handler.go`
- `backend/internal/domain/media/handler_test.go`
- `backend/internal/adapter/memory/media_repository.go`
- `backend/internal/adapter/postgres/media_repository.go`
- `backend/internal/adapter/filesystem/storage.go`
- `backend/internal/adapter/filesystem/storage_test.go`

Scenarios: success for all owner pairings, multiple selected items, missing or
duplicate IDs, mixed source owners, missing destination, cross-trip
destination, closed trip, storage rollback, file/thumbnail move, and source /
destination position updates.

### Unit 2: GraphQL contract

Files:

- `backend/api/schema.graphqls`
- `backend/internal/graphql/schema.resolvers.go`
- `backend/internal/graphql/errors.go`
- generated GraphQL files via `make check-generated`
- `backend/cmd/server/graphql_integration_test.go` or a focused new test file

Expose `MoveMediaInput`, `MoveMediaPayload`, and `moveMedia`. Keep errors in
the payload and require editor access.

### Unit 3: Frontend gallery workflow

Files:

- `frontend/src/features/media/hooks/useMediaMutations.ts`
- `frontend/src/features/media/components/MediaGallery.tsx`
- `frontend/src/features/media/components/MediaGallery.module.css`
- `frontend/src/features/media/components/MediaGallery.test.tsx`
- `frontend/src/components/ConfirmModal/ConfirmModal.tsx`
- `frontend/src/features/trips/components/VisitDetail.tsx`
- `frontend/src/features/travel-legs/components/TravelLegDetail.tsx`
- `frontend/src/features/trips/pages/TripDetailPage.tsx`

Add checkbox selection, a visible `Déplacer vers…` action as soon as one or
more media are selected, and a confirmation modal whose destination selector
is populated with the current trip's visits and travel legs. Keep the modal
open and show the server error when the move fails; close it on cancellation
or success, then refresh the source gallery. Keep transfer controls hidden for
readers.

### Unit 4: Functional specification

Add scenarios to `specs/web-application/gestion-des-etapes-et-visites.feature`
and `specs/web-application/gestion-des-trajets.feature` covering the three
requested directions and selected-media behavior.

## Validation

Run focused Go and frontend tests while iterating, then run `make check` and
`make check-generated`. Generated files must only change through the generators.
