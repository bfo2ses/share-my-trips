---
date: 2026-07-06
topic: mobile-navigation
---

# Navigation mobile — consultation d'abord

## Problem Frame

La famille consulte ShareMyTrips surtout au téléphone, mais l'app est pensée desktop-first (un seul breakpoint 768px par composant, interactions souris). Audit visuel du 2026-07-06 sur viewport 375×812 :

- **Accueil** : les marqueurs de la carte monde font ~6 px — intappables — et la carte (non zoomable) flotte dans du vide vertical. Le panneau « Voyages » (cards) fonctionne en revanche très bien au doigt.
- **Page voyage** : le layout empilé (carte ~40 % du viewport en haut, récit dessous) tient la route ; marqueurs Leaflet 32 px tappables ; drawer de jour lisible. Restent les gestes (conflit scroll page / pan carte) et la galerie photo, non pensée pouce.
- **Header mobile** : nom masqué (avatar seul) — OK ; le toggle Lecture/Édition reste présent.

Priorité utilisateur exprimée : **la consultation des étapes et des jours** (le récit), pas l'accueil ni l'édition.

## Requirements

- R1. **Accueil mobile, liste en entrée** : sur mobile, la liste des voyages (le panneau actuel) est le chemin principal, immédiatement accessible ; la carte monde reste visible/consultable mais les marqueurs ne sont plus le passage obligé pour ouvrir un voyage.
- R2. **Page voyage : statu quo amélioré** : layout empilé conservé (carte en haut, récit dessous) ; hauteur de carte ajustée pour que le récit respire ; les tabs Timeline/Étapes et la navigation étape ↔ jour se parcourent confortablement au pouce.
- R3. **Gestes carte maîtrisés** : faire défiler la page ne panne pas la carte (gestes coopératifs ou équivalent) ; le pan/zoom volontaire de la carte reste possible ; cibles tactiles des marqueurs ≥ 40 px.
- R4. **Lecture d'un jour et galerie au doigt** : le contenu d'un jour (texte + médias) se lit sans friction ; les photos s'ouvrent en plein écran avec navigation par swipe et fermeture au geste.
- R5. **Hygiène tactile globale** : aucun scroll horizontal sur aucune page ; cibles ≥ 44 px pour les contrôles principaux ; pas besoin de pincer/zoomer pour lire ou naviguer.
- R6. **L'édition ne casse pas la consultation** : le mode édition n'est pas retravaillé sur mobile (hors scope), mais l'activer ne doit pas rendre la consultation inutilisable ni provoquer d'erreur.

## Success Criteria

- Le parcours complet au téléphone — liste → voyage → étape → jour → photos en plein écran — se fait au pouce, sans zoom pincé ni visée au pixel.
- Vérifiable par audit navigateur en viewport 375×812 (le même protocole que l'audit d'origine), captures à l'appui.

## Scope Boundaries

- Pas d'édition mobile (formulaires, drag de marqueurs, création au clic carte) — desktop reste le lieu de saisie.
- Pas de zoom/pan tactile sur la carte monde de l'accueil (la liste prend le relais).
- Pas de PWA, pas d'offline, pas de refonte du desktop.
- La galerie/lightbox concerne la consultation ; l'upload mobile est hors scope.

## Key Decisions

- **Consultation d'abord** : la famille lit au téléphone, l'admin saisit au desktop — périmètre net, livrable vite.
- **Priorité au récit (étapes/jours)** plutôt qu'à l'accueil — directive utilisateur explicite.
- **Statu quo amélioré** pour la relation carte/récit sur la page voyage (pas de carte repliable ni d'onglets carte/récit).
- **Liste en entrée sur l'accueil mobile** : à 375 px, une carte du monde est intrinsèquement illisible ; les cards, déjà réussies, portent la navigation.

## Dependencies / Assumptions

- L'audit galerie n'a pas pu être fait avec de vraies photos (seed sans médias) : valider R4 sur un jeu de données avec médias en début de chantier.

## Outstanding Questions

### Resolve Before Planning
_(aucune)_

### Deferred to Planning
- [Affects R3][Technical] Mécanisme de gestes coopératifs Leaflet (dragging désactivé jusqu'au tap, two-finger pan, ou overlay) — choisir le pattern le moins surprenant.
- [Affects R4][Technical] Lightbox : lib existante vs composant maison, cohérent avec le thème sombre/or et CSS Modules.
- [Affects R2][Technical] Hauteur de carte optimale et comportement au scroll (fixe vs légère réduction) dans le layout empilé.
- [Affects R5][Technical] Breakpoint unique 768px suffisant ou point intermédiaire nécessaire (tablette).

## Next Steps
→ `/ce:plan` for structured implementation planning
