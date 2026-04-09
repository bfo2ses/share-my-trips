# Task Tracker

Format des statuts : `[ ]` à faire · `[~]` en cours · `[x]` terminé

---

## En cours

### #2 — Retravailler la vue d'un voyage
**Branche :** `feat/frontend-trip-detail-rework`

Layout cible :
```
[Panel Timeline/Étapes] [Panel Détail (étape ou jour)] [Carte]
```

Sous-tâches :
- [ ] Créer la branche
- [ ] Ajouter le panneau central (Panel Détail) — vide par défaut
- [ ] Clic sur une étape (liste) → ouvre le Panel Détail avec les jours de l'étape
- [ ] Clic sur un jour → remplace le contenu du Panel Détail par le détail du jour
- [ ] Clic sur un marqueur carte → sélectionne l'étape + scroll dans la liste + ouvre Panel Détail
- [ ] Survol d'un marqueur carte → tooltip stylisé (nom de l'étape + dates début/fin)
- [ ] COR-008 : dédupliquer les jours multi-étapes dans la vue timeline
- [ ] Review + PR

---

## Backlog

_Aucune tâche en attente._

---

## Terminées

| # | Tâche | Branche | PR |
|---|-------|---------|-----|
| 1 | Wirer les pages trips et trip detail sur le backend GraphQL | `feat/frontend-trips-api` | [#10](https://github.com/bfo2ses/share-my-trips/pull/10) |

---

## Bugs / Corrections identifiés

| Ref | Description | Statut |
|-----|-------------|--------|
| COR-008 | Un jour multi-étapes peut apparaître en double dans la vue timeline | `[~]` en cours (#2) |
