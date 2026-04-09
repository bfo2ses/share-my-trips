---
title: "feat: Add GraphQL API layer for trip context"
type: feat
status: completed
date: 2026-04-06
---

# feat: Add GraphQL API layer for trip context

## Overview

Exposer le domaine `trip` (déjà implémenté et testé) via une API GraphQL avec gqlgen. Le résultat est un serveur HTTP autonome (`cmd/server/main.go`) branché sur les handlers du domaine et l'adapter in-memory, prêt à être consommé par le frontend React.

## Problem Frame

Le domaine `trip` est complet (model, commands, queries, handlers, adapter in-memory, tests Gherkin). Il n'y a pas encore de couche de transport. Cette PR installe gqlgen, définit le schéma SDL, génère le code, implémente les resolvers, et lance un serveur HTTP — sans toucher au domaine ni aux adapters existants.

## Requirements Trace

- R1. Queries `trips` et `trip(id)` retournent les voyages depuis l'adapter in-memory.
- R2. Mutations `createTrip`, `updateTrip`, `publishTrip`, `unpublishTrip`, `closeTrip`, `reopenTrip`, `deleteTrip` pilotent les handlers du domaine.
- R3. Les erreurs métier (ErrTitleRequired, ErrNotFound, etc.) sont retournées dans le champ `errors` du payload, pas levées comme erreurs GraphQL.
- R4. Les types GraphQL réutilisent directement les types du domaine via autobind gqlgen (pas de duplication).
- R5. Un serveur HTTP minimal tourne sur un port configurable via variable d'env `PORT` (défaut 8080).

## Scope Boundaries

- Pas d'authentification dans cette PR (Phase 1).
- Pas de pagination sur `trips`.
- Les dates sont transmises en String ISO 8601 (pas de scalar custom `Date`).
- `closeTrip` accepte `firstDay` / `lastDay` en input (le domain Stage n'existe pas encore — ces dates seront calculées automatiquement en Phase 2).
- Pas de subscriptions.

## Context & Research

### Relevant Code and Patterns

- `internal/domain/trip/handler.go` — source de vérité pour toutes les opérations disponibles.
- `internal/domain/trip/model.go` — `Trip` struct et `Status` enum à autobindr.
- `internal/adapter/memory/trip_repository.go` — adapter à instancier dans `main.go`.
- `backend/CLAUDE.md` — workflow : branche `feat/trip-graphql`, commit par étape logique.

### Institutional Learnings

- Aucun `docs/solutions/` pertinent trouvé.

## Key Technical Decisions

- **gqlgen** (et non graph-gophers ou gqlparser seul) : génère les interfaces resolver et le runtime en une commande, standard du projet (mentionné dans CLAUDE.md §4).
- **Autobind sur `trip.Trip` et `trip.Status`** : évite de dupliquer les types domaine dans une couche graphql/model. Les types payload (`TripPayload`, `UserError`, `DeleteTripPayload`) sont eux générés par gqlgen car ils n'existent pas dans le domaine.
- **Payload type avec champ `errors`** : toutes les mutations retournent `TripPayload { trip: Trip, errors: [UserError!]! }` — conforme à la convention CLAUDE.md et à l'approche Shopify/relay-style (plus ergonomique que les extensions d'erreur GraphQL standard).
- **Emplacement du schéma** : `api/schema.graphqls` (distinct de `internal/` pour séparer le contrat public du code interne).
- **Code généré** : `internal/graphql/generated.go` (exécutable, non édité manuellement) + `internal/graphql/schema.resolvers.go` (scaffoldé puis complété manuellement).
- **Serveur** : `net/http` standard + handler gqlgen, pas de framework. Port via `PORT` env var.
- **Mapping d'erreurs domaine → UserError** : fonction `domainErrorToUserErrors(err error) []UserError` dans `internal/graphql/errors.go`, utilisant `errors.Is` sur les erreurs du domaine.

## Open Questions

### Resolved During Planning

- *Faut-il un scalar `Date` custom ?* → Non pour Phase 1. String ISO 8601 suffit, évite de configurer un scalar gqlgen. Réviser en Phase 3 si le frontend en a besoin.
- *Faut-il GraphQL Playground / GraphiQL ?* → Oui, activé en dev uniquement via le package `github.com/99designs/gqlgen/graphql/playground`. Contrôlé par la variable d'env `ENV=dev`.
- *`closeTrip` : d'où viennent firstDay/lastDay ?* → Input explicite en Phase 1 (le domain Stage n'existe pas). En Phase 2, le resolver calculera ces dates depuis les stages.

### Deferred to Implementation

- Valeur exacte des `field` dans `UserError` (à définir lors de l'implémentation des resolvers, en lisant les erreurs wrappées).
- Format exact de l'ISO 8601 pour les dates nulles (champ vide vs null à trancher à l'implémentation).

## High-Level Technical Design

> *Ce schéma illustre l'approche visée. Il est directif, pas prescriptif — l'agent d'implémentation doit l'utiliser comme contexte, pas comme code à reproduire.*

```
HTTP Request
    │
    ▼
cmd/server/main.go
    │  instancie TripRepository (memory)
    │  instancie trip.Handler
    │  instancie graphql.Resolver{Handler}
    │  monte le handler gqlgen sur /query
    │
    ▼
internal/graphql/generated.go   (généré, ne pas modifier)
    │  délègue vers les méthodes du Resolver
    │
    ▼
internal/graphql/schema.resolvers.go
    │  appelle handler.Create / handler.List / etc.
    │  mappe les erreurs domaine → UserError
    │
    ▼
internal/domain/trip/handler.go
    │  logique métier
    │
    ▼
internal/adapter/memory/trip_repository.go
```

Schéma SDL (directif) :
```graphql
type Trip { id, title, country, description, coverPhoto, startDate, endDate, status, createdAt, updatedAt }
enum TripStatus { draft published closed }
type UserError { field: String, message: String! }
type TripPayload { trip: Trip, errors: [UserError!]! }
type DeleteTripPayload { success: Boolean!, errors: [UserError!]! }
input CreateTripInput { title!, country!, description, coverPhoto, startDate, endDate }
input UpdateTripInput { title!, country!, description, coverPhoto, startDate, endDate }
input CloseTripInput { firstDay: String!, lastDay: String! }
Query { trips(status: [TripStatus!]): [Trip!]!, trip(id: ID!): Trip }
Mutation { createTrip, updateTrip, publishTrip, unpublishTrip, closeTrip, reopenTrip, deleteTrip }
```

## Implementation Units

- [ ] **Unit 1 : gqlgen — dépendance, config, schéma SDL**

**Goal:** Installer gqlgen, créer `gqlgen.yml` et le schéma GraphQL complet.

**Requirements:** R1, R2, R3, R4

**Dependencies:** Aucune.

**Files:**
- Create: `backend/api/schema.graphqls`
- Create: `backend/gqlgen.yml`
- Modify: `backend/go.mod` / `backend/go.sum` (via `go get`)

**Approach:**
- `go get github.com/99designs/gqlgen` + dépendance `github.com/vektah/gqlparser/v2`.
- `gqlgen.yml` configure : `schema: [api/schema.graphqls]`, `exec.filename: internal/graphql/generated.go`, `resolver: {filename: internal/graphql/schema.resolvers.go, layout: follow-schema}`, `autobind: [github.com/bfosses/sharemytrips/internal/domain/trip]`.
- La section `models` du yml mappe explicitement `TripStatus` → `trip.Status`, `Trip` → `trip.Trip`.
- Le schéma SDL expose toutes les opérations des handlers (cf. section High-Level Technical Design).

**Patterns to follow:**
- Convention CLAUDE.md : camelCase champs, PascalCase types, mutations nommées par l'action.

**Test scenarios:**
- `go build ./...` passe après l'ajout de la dépendance.
- Le schéma SDL est valide syntaxiquement (vérifié par `go run github.com/99designs/gqlgen generate`).

**Verification:**
- `go run github.com/99designs/gqlgen generate` s'exécute sans erreur depuis `backend/`.

---

- [ ] **Unit 2 : Génération du code + implémentation des resolvers**

**Goal:** Générer les interfaces gqlgen, créer le `Resolver` struct, et implémenter tous les resolvers en branchant sur `trip.Handler`.

**Requirements:** R1, R2, R3, R4

**Dependencies:** Unit 1 (schéma + config gqlgen présents).

**Files:**
- Create: `backend/internal/graphql/generated.go` (généré — ne jamais éditer manuellement)
- Create: `backend/internal/graphql/resolver.go` (struct `Resolver`, constructeur)
- Create: `backend/internal/graphql/schema.resolvers.go` (scaffoldé par gqlgen, complété manuellement)
- Create: `backend/internal/graphql/errors.go` (fonction `domainErrorToUserErrors`)

**Approach:**
- Lancer `go run github.com/99designs/gqlgen generate` pour produire `generated.go` et le scaffold de `schema.resolvers.go`.
- `resolver.go` : struct `Resolver { tripHandler *trip.Handler }` + constructeur `NewResolver`.
- `errors.go` : `domainErrorToUserErrors(err error) []UserError` — `errors.Is` sur chaque erreur domaine exportée, construit le slice `[]UserError` avec un `field` pertinent et le `message` de l'erreur. Erreurs inconnues → `{ message: "internal error" }`.
- `schema.resolvers.go` : chaque resolver appelle le handler correspondant, convertit les erreurs via `domainErrorToUserErrors`, sérialise/désérialise les dates ISO 8601 avec `time.Parse`/`time.Format`.
- Pour `trip(id)` : si `trip.ErrNotFound`, retourner `nil, nil` (comportement standard GraphQL pour un nullable).
- Pour les mutations : toujours retourner `TripPayload{ trip: result, errors: [] }` en succès, `TripPayload{ trip: nil, errors: [...] }` en cas d'erreur métier.

**Execution note:** Implémenter les resolvers test-first n'est pas applicable ici (gqlgen impose l'interface générée). Vérifier via compilation + test d'intégration manuel.

**Patterns to follow:**
- Gestion d'erreurs Go : `errors.Is` / `errors.As`, wrapping avec `fmt.Errorf`.
- `context.Context` en premier paramètre de chaque appel handler.

**Test scenarios:**
- `createTrip` sans titre → `errors` contient un UserError avec message "title is required".
- `createTrip` valide → retourne le trip avec `status: draft`.
- `trip(id: "inexistant")` → retourne `null` (pas d'erreur).
- `publishTrip` sur un trip déjà publié → `errors` contient "trip is already published".
- `trips` sans filtre → retourne tous les trips triés par date décroissante.
- `deleteTrip` sur un ID inexistant → `errors` contient "trip not found".

**Verification:**
- `go build ./...` passe.
- `go vet ./...` passe.
- Chaque resolver compile avec la signature générée par gqlgen.

---

- [ ] **Unit 3 : Serveur HTTP**

**Goal:** Créer l'entrée du serveur HTTP qui assemble les dépendances et expose le endpoint GraphQL.

**Requirements:** R5

**Dependencies:** Unit 2 (Resolver implémenté).

**Files:**
- Create: `backend/cmd/server/main.go`

**Approach:**
- `main.go` : instancie `memory.NewTripRepository()`, `trip.NewHandler(repo)`, `graphql.NewResolver(handler)`, génère le `gqlgen.NewExecutableSchema`, monte sur `net/http`.
- Route `POST /query` → handler GraphQL.
- Route `GET /` → GraphQL Playground si `os.Getenv("ENV") == "dev"`.
- Port lu depuis `os.Getenv("PORT")`, défaut `"8080"`.
- Pas de graceful shutdown pour Phase 1.

**Patterns to follow:**
- Pas de framework HTTP, `net/http` standard.
- Convention Go : `log.Fatal` en cas d'erreur de démarrage.

**Test scenarios:**
- Le serveur démarre sans erreur avec `go run ./cmd/server/`.
- `curl -X POST http://localhost:8080/query -d '{"query":"{ trips { id title } }"}' -H 'Content-Type: application/json'` retourne `{"data":{"trips":[]}}`.

**Verification:**
- `go build ./cmd/server/` produit un binaire sans erreur.
- La requête curl ci-dessus retourne une réponse JSON valide.

## System-Wide Impact

- **Interaction graph:** Aucun middleware existant — surface nette. Ajouter CORS en Phase 3 quand le frontend sera branché.
- **Error propagation:** Les erreurs domaine remontent des handlers vers `domainErrorToUserErrors`. Les erreurs inattendues (repo, réseau) sont loguées côté serveur et retournées comme `"internal error"` dans le payload — jamais exposées brutes.
- **State lifecycle risks:** L'adapter in-memory est partagé entre requêtes via le `Resolver`. Thread-safety assurée par le `sync.RWMutex` de `TripRepository`.
- **API surface parity:** Toutes les opérations du `trip.Handler` sont exposées (y compris `unpublishTrip` et `reopenTrip` qui n'apparaissent pas dans les specs frontend directement mais existent dans le domaine).
- **Integration coverage:** Pas de tests d'intégration HTTP automatisés dans cette PR — vérification manuelle via curl ou Playground. Tests HTTP à prévoir en Phase 2.

## Risks & Dependencies

- **Compatibilité gqlgen + Go 1.23** : vérifier que la version de gqlgen (v0.17.x) supporte Go 1.23. Probable mais à confirmer lors de l'install.
- **Autobind fragile** : si les noms des types GraphQL divergent des noms Go (ex: `TripStatus` vs `Status`), gqlgen refusera de binder. Prévoir une section `models` explicite dans `gqlgen.yml` pour forcer le mapping.
- **Dates nulles** : `time.Time{}` (zero value) doit être sérialisé en `null` en GraphQL. Le resolver doit vérifier `t.IsZero()` avant de formater.

## Sources & References

- Codebase : `backend/internal/domain/trip/`, `backend/internal/adapter/memory/`
- Specs : `specs/web-application/gestion-des-voyages.feature`
- Workflow : `backend/CLAUDE.md` §4 (GraphQL)
