---
date: 2026-07-07
type: feat
status: completed
origin: docs/brainstorms/2026-07-07-trip-cover-photo-picker-requirements.md
---

# feat: Photo de couverture des voyages choisie dans l'album

## Problem Frame

`Trip.coverPhoto` existe côté backend mais aucune UI ne le définit et les cards
affichent un dégradé. On ajoute un picker (photos des jours du voyage) dans le
formulaire voyage et l'affichage sur les cards. (see origin)

## Décisions

- `coverPhoto` stocke le **`thumbUrl`** du média choisi (400 px — suffisant
  pour une card, léger pour la home mobile où la liste est la page).
- Tri de `tripMedia` : `day_id` puis `position` (pas de jointure dates).
- Fallback dégradé si pas de cover **ou si l'image ne charge pas** (`onError`)
  — un média supprimé laisse une URL morte dans `coverPhoto`, c'est accepté.

## Implementation Units

### [x] Unit 1 — Backend domaine : `ListByTrip`

**Files :** `backend/internal/domain/media/repository.go`, `query.go`,
`handler.go`, `handler_test.go`, `backend/internal/adapter/memory/media_repository.go`,
`backend/internal/adapter/postgres/media_repository.go`.

**Approach :** miroir exact de `ListByDay` (interface + query + handler +
adapters). Tri `day_id, position`. Tests handler en miroir des tests ListByDay.

**Verification :** `go test ./...` vert.

### [x] Unit 2 — GraphQL : query `tripMedia(tripID)`

**Files :** `backend/api/schema.graphqls`, `backend/internal/graphql/schema.resolvers.go`
(+ fichiers générés gqlgen).

**Approach :** `tripMedia(tripID: ID!): [Media!]!`, autorisation en miroir de
`dayMedia` (mêmes règles de visibilité du voyage). Regénérer gqlgen.

**Verification :** `go test ./...` + query jouée sur le serveur dev.

### [x] Unit 3 — Frontend : picker de cover dans TripForm

**Files :** `frontend/src/features/media/hooks/useMediaQueries.ts` (hook
`useTripMedia`), `frontend/src/features/trips/components/TripForm.tsx` +
`.module.css`, `frontend/src/features/trips/pages/TripsPage.tsx`,
`frontend/src/features/trips/pages/TripDetailPage.tsx`, codegen.

**Approach :** les pages fetchent (`useTripMedia`, en pause hors édition) et
passent les photos (`contentType image/*` filtré) à TripForm en prop
`coverChoices`. TripForm : grille de vignettes + option « Aucune » ; la
sélection alimente le champ `coverPhoto` soumis (déjà câblé). Pas de fetch dans
le composant (convention data-fetching).

**Verification :** navigateur — choisir/retirer une cover depuis la home
(drawer) et depuis la page voyage (panel édition).

### [x] Unit 4 — Frontend : cover sur les cards

**Files :** `frontend/src/features/trips/components/TripCard.tsx` + `.module.css`.

**Approach :** image de fond quand `coverPhoto` défini + voile sombre pour la
lisibilité (pays, badge) ; dégradé actuel en fallback et sur `onError`.

**Verification :** navigateur — card avec cover, card sans, card avec URL morte.

### [x] Unit 5 — Audit e2e + PR

**Approach :** recette mémoire (seed de médias via `POST /api/upload`),
parcours complet aux deux viewports, lint/build/tests, PR.

## Scope Boundaries

- Pas d'upload dédié, pas de recadrage, schéma `Trip` inchangé.
