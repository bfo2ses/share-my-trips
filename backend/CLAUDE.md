# Backend — Guide d'implémentation

## Architecture

### Principes

- **Architecture Hexagonale** : le domaine ne dépend jamais des couches techniques
- **CQRS simple** : séparation commands/queries, même base de données
- **Inversion de dépendances** : le domaine définit des interfaces (ports), les adapters les implémentent
- **Séparation des contextes** : trip, stage, media, auth sont des packages isolés

### Structure des packages

```
internal/
├── domain/{contexte}/     # Logique métier pure, aucune dépendance technique
│   ├── model.go           # Entités et value objects
│   ├── command.go         # Définition des commands
│   ├── query.go           # Définition des queries
│   ├── repository.go      # Port (interface)
│   └── handler.go         # Command & Query handlers
├── adapter/{techno}/      # Implémentations des ports
│   ├── memory/            # Implémentation in-memory (phase 1)
│   └── postgres/          # Implémentation PostgreSQL (phase 2)
└── graphql/               # Resolvers gqlgen
```

## Conventions Go

- Suivre les conventions standard Go (Effective Go, Go Code Review Comments)
- Erreurs wrappées avec `fmt.Errorf("contexte: %w", err)` et vérifiées avec `errors.Is` / `errors.As`
- Pas de panic en dehors du main, toujours retourner des erreurs
- Interfaces définies côté consommateur (dans le domaine), pas côté implémentation
- Nommage des interfaces : pas de préfixe `I`, utiliser le comportement (ex: `Repository`, `Storage`, `Extractor`)
- Les constructeurs retournent des pointeurs : `func NewTrip(...) (*Trip, error)`
- Contexte (`context.Context`) en premier paramètre de toute fonction I/O

## Tests Go

- Utiliser **testify** pour les assertions (`assert`, `require`)
- Table-driven tests quand il y a plusieurs cas similaires
- Tests unitaires dans le même package (accès aux types non exportés)
- Nommage : `TestNomFonction_CasTesté` (ex: `TestCreateTrip_WithoutTitle`)
- Chaque contexte domaine doit avoir ses tests sur les handlers avec le repository in-memory

---

## Flux de développement

Pour chaque feature, suivre ces étapes dans l'ordre :

### 0. Créer la branche
```bash
git checkout -b feat/{contexte}-{feature}   # ex: feat/stage-creation
```

### 1. Lire la spec
Trouver le fichier `.feature` correspondant dans `specs/web-application/`.

### 2. Domaine + tests (en parallèle)
Créer ou modifier dans `internal/domain/{contexte}/` :

| Fichier         | Rôle                              |
|-----------------|-----------------------------------|
| `model.go`      | Entités et value objects          |
| `command.go`    | Définition des commands           |
| `query.go`      | Définition des queries            |
| `repository.go` | Interface du port (Repository)    |
| `handler.go`    | Command & query handlers          |

En même temps, écrire les tests :
- Copier le `.feature` dans `internal/domain/{contexte}/testdata/`
- Écrire les step definitions (voir convention ci-dessous)
- Vérifier avec `go test ./internal/domain/{contexte}/... -v`

**→ Pause : présenter les tests pour relecture avant de continuer.**

Lancer en parallèle les agents de review suivants sur les fichiers modifiés :
- `compound-engineering:review:correctness-reviewer` — logique métier et edge cases
- `compound-engineering:review:testing-reviewer` — couverture et qualité des tests

Corriger les problèmes remontés avant de continuer. Présenter un résumé des findings à l'utilisateur.

```bash
git add -p
git commit -m "feat({contexte}): add domain and tests"
```

### 3. Adapter mémoire
Implémenter dans `internal/adapter/memory/{contexte}_repository.go`.

Lancer l'agent de review :
- `compound-engineering:review:correctness-reviewer` — cohérence avec l'interface du port

```bash
git add -p
git commit -m "feat({contexte}): add memory adapter"
```

### 4. GraphQL (gqlgen)
Ajouter resolvers dans `internal/graphql/`.
*(gqlgen n'est pas encore installé — à setup à la première feature GraphQL)*

Lancer en parallèle :
- `compound-engineering:review:correctness-reviewer` — logique des resolvers
- `compound-engineering:review:api-contract-reviewer` — contrat GraphQL

```bash
git add -p
git commit -m "feat({contexte}): add graphql resolver"
```

### 5. Review finale + Push

Lancer `compound-engineering:ce-review` sur l'ensemble des changements de la branche.
Corriger les problèmes bloquants, puis :

```bash
git push -u origin HEAD
```

---

## Conventions de nommage

- **Libellés Gherkin** (steps, scénarios) : en français
- **Code** (fonctions, variables, types) : en anglais

```go
// ✓
ctx.Step(`^je crée un nouveau voyage$`, tc.createTrip)

// ✗
ctx.Step(`^je crée un nouveau voyage$`, tc.jeCreUnNouveauVoyage)
```

---

## Organisation des fichiers de test

Pour garder les fichiers lisibles (max ~150 lignes), les step definitions sont réparties par aire fonctionnelle :

```
internal/domain/{contexte}/
├── handler_test.go            # testContext, InitializeScenario, TestFeatures uniquement
├── steps_creation_test.go     # étapes de création
├── steps_lifecycle_test.go    # étapes de cycle de vie et clôture
├── steps_update_test.go       # étapes de mise à jour
├── steps_delete_test.go       # étapes de suppression
├── steps_list_test.go         # étapes de liste et tri
└── testdata/
    └── {contexte}.feature     # copie du fichier spec
```

Chaque fichier `steps_*.go` expose une fonction `registerXSteps(ctx, tc)` appelée depuis `InitializeScenario`.

Le package `trip` sert de référence pour ce pattern.

---

## Commandes

```bash
# Tous les tests
go test ./...

# Tests d'un contexte avec détail
go test ./internal/domain/{contexte}/... -v

# Vérification compilation
go build ./...
```
