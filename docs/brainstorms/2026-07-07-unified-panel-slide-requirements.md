---
date: 2026-07-07
topic: unified-panel-slide
---

# Panneau unique avec navigation par translation (timeline ⇄ étape ⇄ jour)

## Problem Frame

Après #43, la page voyage a encore deux surfaces de navigation : la timeline (colonne
gauche desktop / contenu de page mobile) et le sheet/drawer de détail (colonne milieu
desktop / bottom sheet mobile). Sur desktop, l'ouverture d'un détail consomme
420 + 380 px devant la carte ; sur mobile, la timeline reste derrière le sheet (effet
« recede »). L'utilisateur veut **un seul conteneur** dont le contenu commute par
translation horizontale — moins de place consommée, une seule surface active.

## Requirements

- R1. Un seul conteneur de navigation : drawer gauche fixe sur desktop (420 px),
  bottom sheet persistant sur mobile. Il héberge trois niveaux : timeline (0),
  détail d'étape (1), détail de jour (2).
- R2. Navigation avant (timeline → étape, étape → jour) : le contenu glisse vers la
  gauche ; navigation arrière (retour, fermeture) : il glisse vers la droite.
- R3. Desktop : la colonne détail (380 px) disparaît ; la carte occupe tout l'espace
  restant. L'ouverture d'un détail ne change plus la grille.
- R4. Mobile (lecture) : carte plein écran ; sheet persistant à trois hauteurs —
  poignée seule (peek), mi-hauteur (55svh, défaut), étendu (92svh). Les gestes
  existants (drag poignée, tap, clavier) pilotent les hauteurs ; le geste de
  fermeture ramène au peek, jamais à la disparition.
- R5. L'URL reste la source de vérité (`?stage=`, `?day=`) : un deep link atterrit
  directement au bon niveau, sans enchaîner les animations.
- R6. L'effet « recede » de la timeline (`.sheetShown`) disparaît — la timeline vit
  désormais dans le sheet.
- R7. Le clic sur un marqueur de la carte amène le panneau au bon niveau ; sur
  mobile, si le sheet est en peek, il remonte à mi-hauteur.
- R8. Le cadrage de carte mobile (FitBounds) tient compte du sheet persistant
  (padding bas) pour que les marqueurs ne soient pas cachés sous le sheet.

## Success Criteria

- Desktop : deux colonnes seulement (panneau 420 px + carte), navigation fluide
  timeline ⇄ étape ⇄ jour dans le même panneau, aucune régression carte.
- Mobile : une seule surface (le sheet) contient toute la navigation ; la carte est
  visible en permanence derrière.
- Deep link `?stage=…&day=…` ouvre directement le détail du jour.

## Scope Boundaries

- Mode édition hors périmètre : les formulaires (voyage/étape/jour) gardent leur
  rendu actuel (colonne form desktop, layout mobile actuel). Sur mobile en mode
  édition, le layout existant (carte 35svh + formulaire) est conservé.
- Pas de changement backend ni de schéma GraphQL.
- Pas de refonte du contenu des vues détail (StageDetail/DayDetail réutilisées).

## Key Decisions

- **Timeline dans le panneau unique** (choix utilisateur) : c'est ce qui « prend
  moins de place » — la carte gagne la colonne libérée.
- **Sheet mobile persistant** (choix utilisateur) : carte plein écran, timeline
  accessible en permanence via le sheet.
- **Formulaires exclus** (choix utilisateur, option « Tout, formulaires inclus »
  rejetée) : un seul refactor à la fois.

## Outstanding Questions

### Deferred to Planning
- [Affects R2][Technical] Mécanique du slider (3 panneaux dans un track flex
  translaté vs montage/démontage animé) et gestion du scroll indépendant par niveau.
- [Affects R8][Technical] Valeur du padding bas FitBounds mobile selon la hauteur
  du sheet.

## Next Steps
→ ce-plan
