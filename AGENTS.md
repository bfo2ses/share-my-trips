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

## Harnais de développement

- `make check-fast` : boucle locale rapide (format Go, tests Go, typecheck, lint et build frontend)
- `make check` : validation complète, avec race detector, vet, builds et contrôle du code généré
- `make check-generated` : régénère gqlgen et GraphQL Code Generator, puis échoue si les fichiers générés dérivent
- Ne jamais éditer manuellement `backend/internal/graphql/generated.go`, `backend/internal/graphql/models_gen.go` ou `frontend/src/graphql/generated/`
- Une tâche n'est terminée que lorsque `make check` passe
- Si l'environnement empêche une validation, signaler la commande exacte et son erreur ; ne pas pousser tant que le harnais complet n'a pas été exécuté avec succès

## Compound Engineering

- Utiliser `$ce-brainstorm` lorsque le besoin fonctionnel reste à cadrer
- Utiliser `$ce-plan` pour les changements multi-étapes ou transverses
- Utiliser `$ce-work` pour exécuter un plan ou une demande d'implémentation claire
- Utiliser `$ce-code-review` avant livraison de tout changement non mécanique
- Les reviews Compound Engineering complètent le harnais déterministe ; elles ne remplacent jamais `make check`
- Conserver les artefacts Compound Engineering dans `docs/`, selon la configuration du projet
