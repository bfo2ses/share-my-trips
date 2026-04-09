# Frontend — Guide d'implémentation

## Architecture

### Principes

- Organisation par feature (bounded contexts miroir du backend)
- Séparation composants / hooks / pages dans chaque feature
- Types et hooks GraphQL générés automatiquement (ne pas coder à la main)
- Pas de token côté client — session via cookie httpOnly

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
│   └── generated/         # Types et hooks générés par graphql-codegen
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
- Client GraphQL : urql avec ses hooks générés par graphql-codegen (`useTripsQuery`, `useCreateTripMutation`, etc.)

## GraphQL Codegen

- Les types TypeScript et les hooks urql sont générés depuis le schéma backend
- Fichier de config : `codegen.ts` à la racine du frontend
- Output : `src/graphql/generated/` (ne pas éditer manuellement)
- Commande : `npm run codegen`
- Toujours utiliser les hooks générés plutôt qu'urql directement

## Routing

- React Router v6+ avec `createBrowserRouter`
- Routes protégées : redirection vers `/login` si non authentifié
- Routes publiques : `/login`, `/setup` (premier lancement)
- Structure des routes calquée sur la hiérarchie features/

## Authentification

- Session gérée via cookie httpOnly (posé par le backend)
- Le frontend ne stocke pas de token (pas de localStorage, pas de sessionStorage)
- Vérification de session au démarrage via query GraphQL `me`
- Redirection automatique vers `/login` si la query `me` retourne une erreur 401

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

Lancer `/ce-review` sur l'ensemble des changements de la branche.
Corriger les problèmes bloquants, puis :

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
```
