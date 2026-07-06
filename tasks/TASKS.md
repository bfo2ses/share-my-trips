# Task Tracker

Format des statuts : `[ ]` à faire · `[~]` en cours · `[x]` terminé

---

## En cours

_Aucune tâche en cours._

---

## Backlog

_Aucune tâche en attente._

---

## Terminées

| # | Tâche | Branche | PR |
|---|-------|---------|-----|
| 6 | Création stage/day au clic sur la carte + drag & drop des marqueurs | `feat/frontend-map-placement` | [#18](https://github.com/bfo2ses/share-my-trips/pull/18) |
| 5 | Menu kebab pour les actions admin (trip, stage, day) + ConfirmModal | `feat/frontend-admin-action-menu` | [#17](https://github.com/bfo2ses/share-my-trips/pull/17) |
| 4 | Coordonnées GPS obligatoires sur Trip et Day + zoom étape avec marqueurs de jours | `feat/trip-day-coordinates` | [#16](https://github.com/bfo2ses/share-my-trips/pull/16) |
| 3 | Infos utilisateur depuis `me` + menu user avec déconnexion | `feat/frontend-user-menu` | [#12](https://github.com/bfo2ses/share-my-trips/pull/12) |
| 2 | Retravailler la vue d'un voyage (DetailPanel, tooltip carte, COR-008) | `feat/frontend-trip-detail-rework` | [#11](https://github.com/bfo2ses/share-my-trips/pull/11) |
| 1 | Wirer les pages trips et trip detail sur le backend GraphQL | `feat/frontend-trips-api` | [#10](https://github.com/bfo2ses/share-my-trips/pull/10) |

---

## Bugs / Corrections identifiés

| Ref | Description | Statut |
|-----|-------------|--------|
| COR-008 | Un jour multi-étapes peut apparaître en double dans la vue timeline | `[x]` corrigé dans #2 |
| COR-009 | Après login, `me` est servi depuis le cache urql (`me: null` mis en cache avant login) → header vide et voyages filtrés en lecteur ; OK après reload. Fix : recréer le client urql au login/logout | `[x]` corrigé dans [#36](https://github.com/bfo2ses/share-my-trips/pull/36) |
| COR-010 | Session expirée : le backend répond `me: null` (jamais de 401 HTTP) et l'UI restait figée en état connecté, token mort réarmé au refresh. Fix : détection `me: null` dans ProtectedLayout → logout, `makeClient(token, onUnauthorized)` sans token module partagé | `[x]` corrigé dans [#37](https://github.com/bfo2ses/share-my-trips/pull/37) |
