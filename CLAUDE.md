# ShareMyTrips — Règles du projet

## Specs fonctionnelles

Les spécifications Gherkin du projet sont dans `specs/web-application/`. Toujours s'y référer avant d'implémenter une fonctionnalité.

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
