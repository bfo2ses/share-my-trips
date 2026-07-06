---
title: "refactor: Trip page — single timeline and unified expandable sheet"
type: refactor
status: completed
date: 2026-07-06
origin: docs/brainstorms/2026-07-06-trip-page-timeline-sheet-requirements.md
---

# refactor: Trip page — single timeline and unified expandable sheet

## Overview

Supprimer les tabs Timeline/Étapes de la page voyage (la timeline devient l'unique contenu, ses têtes d'étape s'enrichissent) et faire du DetailPanel mobile **le** sheet unique : extensible au geste (55svh ↔ ~92svh), au-dessus d'un fond qui ne se lit plus comme un second sheet. La spec Gherkin de consultation est mise à jour en conséquence.

## Problem Frame

Deux irritants post-#41 signalés par l'utilisateur (see origin: docs/brainstorms/2026-07-06-trip-page-timeline-sheet-requirements.md) : les tabs font doublon, et l'empilement visuel « double bottom sheets » sur mobile est confus. Constat code : la vue Étapes ne montre que numéro + ville + nombre de jours (rien que les têtes d'étape enrichies ne couvrent), et le DetailPanel commute déjà étape ↔ jour — le chantier est du retrait + de l'enrichissement, pas de la reconstruction.

## Requirements Trace

- R1. Tabs supprimées (mobile + desktop), timeline unique contenu.
- R2. Détail d'étape accessible via sélection (tête de timeline ou marqueur carte).
- R3. Une seule surface au-dessus de la page sur mobile ; commutation étape ↔ jour avec retour interne (existant, conservé).
- R4. Fond « aplati » quand le sheet est ouvert — pas de backdrop, carte visible ; fermeture par ✕/geste.
- R5. Desktop : panneau latéral inchangé hors retrait des tabs.
- R6. Mode édition intact (auto-forms, drawers manuels, EditCallbacks).
- R7. Sheet extensible au geste : ~55svh à l'ouverture, extension quasi plein écran (~92svh), réduction/fermeture au glissement.
- R8. Têtes d'étape tappables enrichies : nom + ville + dates ; tap → détail étape + zoom carte.

## Scope Boundaries

- Pas de changement du modèle jours/étapes ni de la saisie (hors coexistence des drawers de formulaires avec le sheet).
- Pas de backdrop, pas de lib de gestes/bottom-sheet (culture repo : CSS Modules artisanal, zéro lib UI).
- Pas de changement de la carte ni du layout desktop global.

## Context & Research

### Relevant Code and Patterns

- `frontend/src/features/trips/pages/TripDetailPage.tsx` : `view` state l.48 + toggle l.442-455 ; `StageSection` rend le divider `#stage-{id}` cliquable avec état actif ; la branche 'stages' (l.656-667) ne montre que index/ville/compte de jours ; `stageDateRanges` déjà calculé (l.104-114, filtre COR-008 `d.stageIDs[0]`) ; `handleStageClick` = search param + `scrollIntoView`, zoom carte indirect via `boundsKey` de `FitBounds` ; sélection 100 % en search params (`?stage`, `?day`).
- `frontend/src/features/trips/components/DetailPanel.tsx` + `.module.css` : prop-driven (`open`, `onClose`, `onBackToStage`), commutation `day ? DayDetail : StageDetail` ; mobile = sheet fixe `max-height: 55svh`, `.body` scroller interne, `transform: translateY` ; point d'attache naturel d'une poignée au-dessus du `.header` (flex-shrink: 0).
- `frontend/src/features/trips/pages/TripDetailPage.module.css` : mobile `35svh 1fr`, `.panel { border-top … }` — **aucun radius/ombre à retirer** : l'« allure de sheet » est perceptuelle ; R4 = classe d'état sur `.page` quand le détail est ouvert, mise en retrait visuelle à calibrer.
- Édition : les formulaires ne vivent PAS dans DetailPanel — le slot central commute `anyAutoForm ? formPanelWrapper : DetailPanel` (l.506-554) ; drawers manuels StageForm/DayForm séparés (`position: fixed`, plein écran mobile). Le retrait de `view` ne touche rien de tout ça.
- Breakpoint JS partagé : `frontend/src/lib/viewport.ts` (`MOBILE_QUERY`, `isMobileViewport`) livré en #41.
- Aucun code de geste pointer existant à imiter (MediaGallery/Uploader = HTML5 drag-and-drop, autre API).

### Institutional Learnings

- COR-008 : le filtre `d.stageIDs[0] === stage.id` (jours multi-étapes rendus une fois) est un point de régression connu — ne pas toucher à la logique de la timeline, seulement à son habillage.
- View transitions `trip-panel` (index.css) : hacks `isolation: auto` + `html background` à préserver ; variantes mobile déjà en place (#41).
- DetailPanel fait un fetch (`useDayMedia`) dans le composant — exception existante assumée, ne pas « corriger » au passage.

### External References

- Aucune (pas de lib ; gestes pointer events standards).

## Key Technical Decisions

- **Drag confiné à la poignée + en-tête du sheet** : élimine structurellement le conflit geste d'extension vs scroll interne du `.body` (pas d'arbitrage scrollTop, pas de faux positifs). Tap sur la poignée = bascule 55 ↔ 92svh.
- **Deux paliers + fermeture** : ouvert à ~55svh ; glissement haut → ~92svh ; glissement bas → 55svh puis fermeture (seuil de vélocité/distance à calibrer à l'exécution). Pointer events (pas de lib), transitions CSS existantes réutilisées.
- **Têtes d'étape = enrichissement du divider existant** (élément déjà cliquable, actif, ancré `#stage-{id}`) : nom + ville + dates depuis `stageDateRanges` — zéro fetch nouveau, tri COR-008 inchangé.
- **R4 sans backdrop** : classe d'état (`detailOpen` est déjà connu au niveau page) qui met le bloc page en retrait visuel (calibrage à l'exécution) ; pas d'élément DOM nouveau.
- **Spec Gherkin mise à jour dans la même unité que le retrait des tabs** (specs = source de vérité) ; aucune copie backend concernée (vérifié : testdata godog n'inclut pas consultation-des-voyages.feature).
- **Desktop** : uniquement le retrait du toggle — le panneau latéral et sa commutation existent déjà.

## Open Questions

### Resolved During Planning

- Mécanique du sheet : artisanale, drag poignée/en-tête uniquement, deux paliers (55/92svh) — pas de lib.
- Contenu des têtes d'étape : nom + ville + dates dérivées (`stageDateRanges` existant) ; le « nombre de jours » de l'ex-vue Étapes est absorbé par le détail d'étape (liste des jours déjà là).
- Ce que perd le retrait de la vue Étapes : rien d'exclusif (vérifié dans le JSX).
- Spec : trois scénarios (l.86-101) réécrits ; « détail d'une étape/d'un jour » (l.103-113) inchangés.

### Deferred to Implementation

- Seuils de distance/vélocité du geste (extension, réduction, fermeture) : à calibrer sur l'app qui tourne.
- Traitement visuel exact de la mise en retrait R4 (opacité, désaturation, les deux) : à juger à l'écran.
- Transition entre paliers pendant le drag (suivi du doigt vs snap pur) : choisir le plus simple qui reste fluide.

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

États du sheet mobile (piloté par la sélection en search params + un état de palier local) :

```
                    tap tête d'étape / marqueur
  [fermé] ─────────────────────────────────────▶ [demi 55svh · étape]
     ▲                                                  │  ▲
     │ drag bas (sous seuil) / ✕                        │  │ ← Retour à l'étape
     │                                        tap jour  ▼  │
  [demi 55svh · jour] ◀────────────────────────────────────┘
     │        ▲
     │ drag haut (poignée)                     drag bas (poignée)
     ▼        │
  [plein ~92svh · étape ou jour]  — le palier survit à la commutation étape↔jour
```

Le fond (carte + timeline) reste visible et en retrait dès qu'un palier est ouvert (classe d'état sur `.page`).

## Implementation Units

- [x] **Unit 1: Retrait des tabs et de la vue Étapes + spec**

**Goal:** La timeline devient l'unique contenu du panneau voyage, partout ; la spec reflète le produit.

**Requirements:** R1, R5

**Dependencies:** None

**Files:**
- Modify: `frontend/src/features/trips/pages/TripDetailPage.tsx` (state `view`, toggle JSX, branche 'stages' de `StageSection`)
- Modify: `frontend/src/features/trips/pages/TripDetailPage.module.css` (`.viewToggle`, `.viewBtn`, `.stageRow` et rules mortes)
- Modify: `specs/web-application/consultation-des-voyages.feature` (scénarios l.86-101 : un scénario timeline réécrit, scénarios « vue Étapes » et « bascule » supprimés, libellés FR)

**Approach:**
- Suppression pure : le type `View`, l'état, le toggle et la branche stages disparaissent ; `StageSection` perd sa prop `view`.
- Aucune modification de la logique COR-008 ni des search params.

**Patterns to follow:** libellés Gherkin en français (règle projet).

**Test scenarios:**
- Page voyage sans tabs, timeline directe (mobile + desktop).
- Sélection étape/jour, deep links `?stage`/`?day`, mode édition (auto-forms) inchangés.

**Verification:** lint + build verts ; parcours navigateur sans tabs, timeline identique à l'actuelle vue Timeline.

- [x] **Unit 2: Têtes d'étape enrichies et tappables**

**Goal:** Le divider d'étape devient une tête riche (nom + ville + dates) qui porte la navigation vers le détail d'étape.

**Requirements:** R2, R8

**Dependencies:** Unit 1

**Files:**
- Modify: `frontend/src/features/trips/pages/TripDetailPage.tsx` (`StageSection` : markup du divider, props `stageDateRanges`/ville)
- Modify: `frontend/src/features/trips/pages/TripDetailPage.module.css` (styles `.stageDivider` enrichi, état actif conservé)

**Approach:**
- Réutiliser `stageDateRanges` (déjà calculé) et `stage.city` ; conserver l'ancrage `#stage-{id}`, le `onClick` existant et l'état `stageDividerActive`.
- Cible tactile ≥ 44px (acquis #41 à respecter).

**Patterns to follow:** dividers actuels (l.642-648) ; format de dates `formatShortDate` existant.

**Test scenarios:**
- Tête affichant nom + ville + plage de dates ; étape sans jour (pas de dates) dégrade proprement.
- Tap → détail étape + zoom carte ; état actif visible.
- Jour multi-étapes toujours rendu une seule fois (COR-008).

**Verification:** navigateur 375×812 et 1440 : la timeline porte seule la navigation d'étape.

- [x] **Unit 3: Sheet extensible au geste**

**Goal:** Le DetailPanel mobile gagne une poignée et deux paliers (55svh / ~92svh), extension et fermeture au geste.

**Requirements:** R3, R7

**Dependencies:** None (parallèle aux Units 1-2)

**Files:**
- Modify: `frontend/src/features/trips/components/DetailPanel.tsx` (poignée, état de palier, pointer events sur poignée/en-tête)
- Modify: `frontend/src/features/trips/components/DetailPanel.module.css` (poignée, hauteurs par palier, transitions)

**Approach:**
- Drag **uniquement** sur poignée + `.header` (le `.body` garde son scroll natif, aucun arbitrage) ; tap poignée bascule les paliers ; drag bas depuis 55svh au-delà du seuil ferme (`onClose`).
- Palier local au composant, réinitialisé à la fermeture, survivant à la commutation étape ↔ jour.
- Desktop inchangé (poignée non rendue hors mobile — CSS `display:none` ou garde `isMobileViewport`).

**Patterns to follow:** transitions CSS existantes du sheet ; `lib/viewport.ts` si garde JS nécessaire.

**Test scenarios:**
- Ouverture à 55svh ; drag haut → ~92svh ; drag bas → 55svh puis fermeture ; tap poignée bascule.
- Scroll du contenu (galerie photos) sans déclencher le geste ; commutation étape→jour→retour conserve le palier.
- Pull-down de la lightbox (YARL) non perturbé quand elle est ouverte au-dessus du sheet.
- Desktop : aucun changement de comportement du panneau latéral.

**Verification:** parcours gestes au navigateur 375×812 ; les seuils calibrés donnent un ressenti net (pas de fermeture accidentelle).

- [x] **Unit 4: Fond en retrait quand le sheet est ouvert**

**Goal:** Tuer la perception « double sheet » : une surface active, un fond en retrait — sans backdrop.

**Requirements:** R4

**Dependencies:** Unit 3 (calibrage avec le sheet final)

**Files:**
- Modify: `frontend/src/features/trips/pages/TripDetailPage.tsx` (classe d'état sur `.page` quand `detailOpen`)
- Modify: `frontend/src/features/trips/pages/TripDetailPage.module.css` (mise en retrait mobile-only)

**Approach:**
- `detailOpen` est déjà dérivé au niveau page ; ajouter une classe conditionnelle et calibrer la mise en retrait visuellement (opacité/désaturation légère du bloc page, carte intacte).
- Pas d'élément DOM nouveau, pas de gestion de clic sur le fond.

**Patterns to follow:** classes d'état existantes (`panelOpen`, `formPanelOpen`).

**Test scenarios:**
- Sheet ouvert : fond lisiblement en retrait, carte visible, timeline non interactive au doigt ? (non — elle reste interactive, seul le retrait visuel change ; vérifier que ça ne surprend pas).
- Sheet fermé : page strictement identique à avant.

**Verification:** appréciation visuelle sur captures avant/après à 375×812.

- [x] **Unit 5: Audit final mobile + desktop + édition**

**Goal:** Prouver les critères de succès : une seule surface, navigation évidente, zéro perte fonctionnelle.

**Requirements:** R1-R8 (validation transverse)

**Dependencies:** Units 1-4

**Files:** aucun (audit) ; correctifs mineurs éventuels.

**Approach:**
- Protocole navigateur habituel (backend seedé + médias uploadés via API) : 375×812 — timeline → tête d'étape → détail → jour → photos plein écran, gestes du sheet ; 1440 — non-régression du panneau latéral, des auto-forms d'édition et des drawers manuels (mode édition activable sur mobile depuis #42 : smoke test consultation + formulaire jour sur mobile sans casse).

**Test scenarios:** critères de succès du doc d'origine, tels quels.

**Verification:** série de captures du parcours ; jamais deux surfaces empilées ; desktop et édition intacts.

## System-Wide Impact

- **Interaction graph:** la sélection en search params alimente auto-forms, `placementMode` et le zoom carte — le retrait de `view` n'y touche pas ; à re-vérifier après Unit 1 (grep `view`).
- **State lifecycle risks:** le palier du sheet est un état local nouveau — le réinitialiser à la fermeture pour éviter une réouverture surprise en plein écran.
- **API surface parity:** aucune (frontend pur, pas de codegen).
- **Integration coverage:** pas de harnais de test frontend (chantier séparé) — l'audit navigateur Unit 5 est la preuve ; les gestes réels (drag tactile) restent à confirmer sur vrai téléphone comme pour #41.

## Risks & Dependencies

- **PR #42 (toggle édition mobile) ouverte** : pas de chevauchement de fichiers, mais l'Unit 5 teste l'édition mobile — merger #42 avant de brancher ce chantier (ou rebaser).
- **Geste artisanal** : le risque classique (conflit avec le scroll) est neutralisé par le drag confiné à la poignée ; le risque résiduel est le ressenti (seuils), traité en calibrage à l'exécution.
- **Émulation vs tactile réel** : mêmes limites que #41 — passage vrai téléphone recommandé avant de clore.

## Documentation / Operational Notes

- `tasks/TASKS.md` : nouvelle entrée + PR au fil du chantier.
- Spec Gherkin mise à jour dans la PR (Unit 1) — pas d'impact godog backend (vérifié).

## Sources & References

- **Origin document:** [docs/brainstorms/2026-07-06-trip-page-timeline-sheet-requirements.md](../brainstorms/2026-07-06-trip-page-timeline-sheet-requirements.md)
- Code : `TripDetailPage.tsx`, `DetailPanel.tsx`, `TripDetailPage.module.css`, `DetailPanel.module.css`, `lib/viewport.ts`
- PRs liées : #41 (navigation mobile), #42 (toggle édition mobile, ouverte)
- Spec : `specs/web-application/consultation-des-voyages.feature` (scénarios l.86-113)
