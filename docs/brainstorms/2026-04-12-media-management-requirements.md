---
date: 2026-04-12
topic: media-management
---

# Gestion des medias

## Problem Frame

Les voyages contiennent des jours, mais il n'est pas possible d'y associer des photos ou des videos. L'admin doit pouvoir uploader, organiser et legender des medias par jour. Les visiteurs doivent pouvoir consulter la galerie et visualiser chaque media en plein ecran.

## Requirements

- R1. **Upload de medias** — L'admin peut uploader des photos (JPEG, PNG, HEIC, WebP) et des videos (MP4, MOV, WebM) sur un jour. L'upload est chunke (pas de limite de taille stricte) pour supporter les gros fichiers et les connexions instables.
- R2. **Stockage NAS** — Les fichiers originaux sont stockes sur le filesystem du NAS. Le backend Go sert les fichiers via des endpoints HTTP dedies (`/media/:id/original`, `/media/:id/thumb`).
- R3. **Thumbnails photos** — Un thumbnail est genere a la premiere consultation puis mis en cache sur le filesystem. Dimensions cible : 400px de large, qualite JPEG 80%.
- R4. **Thumbnails videos** — Un placeholder iconique (icone play sur fond sombre) est affiche dans la galerie. Pas d'extraction de frame ffmpeg en V1.
- R5. **Extraction EXIF** — Les metadonnees EXIF sont extraites a l'upload (date de prise de vue, coordonnees GPS, orientation). La date EXIF est stockee sur le media.
- R6. **Legende** — Chaque media a un champ legende (texte libre, optionnel) editable par l'admin.
- R7. **Ordre et drag-and-drop** — Les medias d'un jour ont un ordre explicite (champ `position`). L'admin peut reorganiser via drag-and-drop. Les visiteurs voient l'ordre defini par l'admin.
- R8. **Suppression** — L'admin peut supprimer un media (fichier original + thumbnail supprimes du NAS).
- R9. **Galerie** — Le DayDrawer affiche la galerie de medias du jour sous forme de grille de thumbnails. Les videos sont distinguees par un badge play.
- R10. **Lightbox** — Cliquer sur un thumbnail ouvre une lightbox plein ecran avec navigation prev/next. Les photos sont affichees en taille originale (ou adaptee a l'ecran). Les videos utilisent le lecteur natif `<video>`.
- R11. **Permissions** — Seuls les admins peuvent uploader, supprimer, reorganiser et editer les legendes. Les visiteurs ont un acces lecture seule a la galerie et a la lightbox.

## Success Criteria

- Un admin peut uploader plusieurs photos/videos sur un jour et les voir apparaitre dans la galerie
- Un visiteur peut parcourir la galerie et ouvrir la lightbox sans actions d'edition visibles
- Les thumbnails sont generes automatiquement et servis rapidement apres le premier acces
- L'ordre drag-and-drop est persiste et restaure au rechargement
- Les gros fichiers (videos > 100 Mo) s'uploadent sans timeout

## Scope Boundaries

- Pas de transcoding video (les fichiers sont servis tels quels)
- Pas d'extraction de frame video pour les thumbnails (placeholder uniquement)
- Pas d'edition d'image (crop, rotation, filtres)
- Pas d'albums ou de regroupement au-dela du jour
- Pas de partage individuel de media (le partage se fait au niveau voyage)
- Cover photo du voyage : hors scope de cette iteration (champ existant, workflow separe)

## Key Decisions

- **Serving** : le backend Go sert les fichiers (pas de Nginx direct). Simplifie la securite et la config.
- **Upload chunke sans limite** : upload decoupe en morceaux avec reprise. Pas de taille max stricte.
- **Thumbnails videos = placeholder** : pas de dependance ffmpeg en V1. On pourra ajouter l'extraction de frame plus tard.
- **Lecteur video natif** : `<video>` HTML standard dans la lightbox, pas de player custom.
- **Permissions admin-only** : tout le CRUD media est reserve aux admins.

## Dependencies / Assumptions

- Le NAS expose un chemin filesystem accessible par le processus backend Go
- Le backend peut ecrire des fichiers sur ce filesystem (permissions OS)
- Le domaine `media` est un nouveau bounded context (cf. `choix-techniques.md`)
- Phase 1 : adapter in-memory + filesystem local pour dev/test
- Phase 2 : adapter filesystem NAS reel

## Outstanding Questions

### Deferred to Planning

- [Affects R1][Technical] Quel protocole de chunking utiliser ? (tus.io, custom multipart, resumable upload protocol)
- [Affects R2][Technical] Structure des repertoires sur le NAS (par trip/day, flat avec hash, etc.)
- [Affects R3][Needs research] Quelle lib Go pour le redimensionnement d'images et le support HEIC ?
- [Affects R5][Needs research] Quelle lib Go pour l'extraction EXIF (goexif, goexif2, rwcarlsen/goexif) ?
- [Affects R7][Technical] Mecanisme de reorder cote GraphQL (mutation `reorderMedia` avec liste d'IDs ordonnes, ou `moveMedia` avec position cible)

## Next Steps

→ `/ce:plan` for structured implementation planning
