# ShareMyTrips — Règles du projet

## Specs fonctionnelles

Les spécifications Gherkin du projet sont dans `specs/web-application/`. Toujours s'y référer avant d'implémenter une fonctionnalité.

## Architecture backend (Go)

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

### Conventions Go

- Suivre les conventions standard Go (Effective Go, Go Code Review Comments)
- Erreurs wrappées avec `fmt.Errorf("contexte: %w", err)` et vérifiées avec `errors.Is` / `errors.As`
- Pas de panic en dehors du main, toujours retourner des erreurs
- Interfaces définies côté consommateur (dans le domaine), pas côté implémentation
- Nommage des interfaces : pas de préfixe `I`, utiliser le comportement (ex: `Repository`, `Storage`, `Extractor`)
- Les constructeurs retournent des pointeurs : `func NewTrip(...) (*Trip, error)`
- Contexte (`context.Context`) en premier paramètre de toute fonction I/O

### Tests Go

- Utiliser **testify** pour les assertions (`assert`, `require`)
- Table-driven tests quand il y a plusieurs cas similaires
- Tests unitaires dans le même package (accès aux types non exportés)
- Nommage : `TestNomFonction_CasTesté` (ex: `TestCreateTrip_WithoutTitle`)
- Chaque contexte domaine doit avoir ses tests sur les handlers avec le repository in-memory

## Frontend (React)

### Conventions

- Composants en PascalCase dans des fichiers PascalCase (ex: `TripCard.tsx`, `TripCard.module.css`)
- Un composant par fichier
- Hooks custom préfixés par `use` dans un dossier `hooks/`
- CSS Modules pour le styling (fichier `.module.css` à côté du composant)
- Client GraphQL : urql avec ses hooks (`useQuery`, `useMutation`)

## GraphQL

- Nommage du schéma en camelCase pour les champs, PascalCase pour les types
- Mutations nommées par l'action : `createTrip`, `publishTrip`, `closeTrip`
- Queries nommées par ce qu'elles retournent : `trip`, `trips`, `stage`, `stages`
- Erreurs métier retournées dans le champ `errors` GraphQL, pas dans les données

## Git

- Format : **Conventional Commits**
- Types : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- Scope optionnel entre parenthèses : `feat(trip): add create command`
- Messages en anglais, concis
- Un commit par unité logique de changement

## Stratégie d'implémentation

1. **Phase 1** : domaine + handlers + adapters in-memory + API GraphQL
2. **Phase 2** : adapters PostgreSQL + filesystem
3. **Phase 3** : frontend React
4. Toujours implémenter les tests en même temps que le code
