---
date: 2026-07-07
topic: trip-cover-photo-picker
---

# Photo de couverture des voyages (picker depuis l'album)

## Problem Frame

`Trip.coverPhoto` existe de bout en bout côté backend (domaine, PostgreSQL,
GraphQL inputs) mais rien ne permet de le définir depuis l'UI, et les cards de
la home affichent un dégradé généré (`tripColor`). L'admin veut illustrer les
cards avec une vraie photo.

## Requirements

- R1. En mode édition, le formulaire voyage propose de choisir la photo de
  couverture **parmi les photos déjà uploadées sur les jours de ce voyage**
  (picker en grille de vignettes). Choix décidé avec l'utilisateur : pas
  d'upload dédié — la cover vient de l'album.
- R2. La card d'un voyage affiche `coverPhoto` quand défini, avec le dégradé
  actuel en fallback (y compris si l'image ne charge pas — média supprimé).
  Pays et badge de statut restent lisibles par-dessus.
- R3. Seules les images (`contentType` `image/*`) sont proposées ; les vidéos
  sont exclues.
- R4. L'admin peut retirer la cover (retour au dégradé).
- R5. Backend : query `tripMedia(tripID)` (médias de tous les jours du voyage),
  mêmes règles de visibilité que `dayMedia`.

## Success Criteria

- Depuis le mode édition, choisir une photo → la card de la home l'affiche.
- Un voyage sans cover (ou avec cover cassée) garde le dégradé actuel.

## Scope Boundaries

- Pas d'upload de fichier dédié à la cover.
- Pas de recadrage/édition d'image.
- `coverPhoto` reste une simple URL (schéma inchangé).

## Next Steps
→ ce-plan
