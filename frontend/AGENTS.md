# Frontend — Guide d'implémentation

## Architecture

### Principes

- Organisation par feature (bounded contexts miroir du backend)
- Séparation composants / hooks / pages dans chaque feature
- Documents et types GraphQL générés automatiquement (ne pas coder à la main)
- Authentification actuelle par token Bearer stocké dans `sessionStorage`

### Structure des dossiers

```
src/
├── features/
│   ├── auth/
│   │   ├── components/    # LoginForm, SetupForm, etc.
│   │   ├── hooks/         # useAuth, useCurrentUser, etc.
│   │   └── pages/         # LoginPage, SetupPage, etc.
│   ├── trips/
│   │   ├── components/    # TripCard, TripForm, etc.
│   │   ├── hooks/
│   │   └── pages/         # TripsPage, TripDetailPage, etc.
│   ├── stages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── pages/
│   └── media/
│       ├── components/
│       ├── hooks/
│       └── pages/
├── graphql/
│   ├── client.ts
│   └── generated/         # Documents et types générés par graphql-codegen
├── router.tsx             # Configuration React Router
├── App.tsx
└── main.tsx
```

## Conventions

- Composants en PascalCase dans des fichiers PascalCase (ex: `TripCard.tsx`, `TripCard.module.css`)
- Pages suffixées par `Page` (ex: `LoginPage.tsx`, `TripsPage.tsx`)
- Un composant par fichier
- Hooks custom préfixés par `use` dans un dossier `hooks/`
- CSS Modules pour le styling (fichier `.module.css` à côté du composant)
- Client GraphQL : urql, encapsulé dans des hooks métier sous `features/*/hooks/`

## Data fetching

- Les requêtes GraphQL (`useQuery`, `useMutation`) ne s'appellent que dans les **hooks** (`hooks/`) ou les **pages** (`pages/`), jamais dans les composants (`components/`)
- Les composants reçoivent les données en props — ils ne fetchent pas eux-mêmes
- Une donnée ne doit être fetchée qu'une seule fois par page : si plusieurs composants ont besoin de la même donnée, la page la fetch et la distribue en props
- Préférer une query large au niveau page (ex: `tripDays(tripID)`) plutôt que N queries enfants (ex: `days(stageID)` × N étapes)

## GraphQL Codegen

- Les documents typés et types TypeScript sont générés depuis le schéma backend
- Fichier de config : `codegen.ts` à la racine du frontend
- Output : `src/graphql/generated/` (ne pas éditer manuellement)
- Commande : `npm run codegen`
- Utiliser les documents générés dans les hooks métier ; ne jamais modifier les fichiers générés

## Routing

- React Router v6+ avec `createBrowserRouter`
- Routes protégées : redirection vers `/login` si non authentifié
- Routes publiques : `/login`, `/setup` (premier lancement)
- Structure des routes calquée sur la hiérarchie features/

## Authentification

- Token Bearer stocké en `sessionStorage` (clé `smt_token`) — survit au refresh, effacé à la fermeture de l'onglet
- Token injecté dans urql via header `Authorization: Bearer <token>` à chaque requête
- Pas de localStorage (objectif long terme : migrer vers cookie httpOnly côté backend)
- Redirection automatique vers `/login` si pas de token

## Flux de développement

Pour chaque feature, suivre ces étapes dans l'ordre :

### 0. Créer la branche
```bash
git checkout -b feat/frontend-{feature}   # ex: feat/frontend-auth
```

### 1. Lire la spec
Trouver le fichier `.feature` correspondant dans `specs/web-application/`.

### 2. Régénérer les types
Si le schéma GraphQL backend a évolué :
```bash
npm run codegen
```

### 3. Implémenter
Dans l'ordre : queries/mutations → hooks → composants → pages → routing.

**→ Pause : présenter les composants principaux pour relecture avant de continuer.**

### 4. Review finale + Push

Lancer `make check` depuis la racine, puis
`$ce-code-review` sur l'ensemble des changements de la
branche. Corriger les problèmes bloquants, puis :

```bash
git push -u origin HEAD
```

## Commandes

```bash
# Démarrer le serveur de dev
npm run dev

# Générer les types GraphQL
npm run codegen

# Lint
npm run lint

# Build
npm run build

# Typecheck sans produire de build
npm run typecheck

# Depuis la racine : harnais complet du projet
make check
```
