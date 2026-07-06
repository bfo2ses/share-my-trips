---
title: "feat: Mobile consultation navigation"
type: feat
status: completed
date: 2026-07-06
origin: docs/brainstorms/2026-07-06-mobile-navigation-requirements.md
---

# feat: Mobile consultation navigation

## Overview

Rendre le parcours de consultation (liste voyages → page voyage → étape → jour → photos) confortable au pouce sur téléphone (viewport de référence 375×812), sans toucher à l'édition ni au desktop. Le gros de la structure mobile existe déjà (layout empilé, bottom sheet, lightbox swipe) : ce plan corrige les points durs identifiés par l'audit du 2026-07-06 — accueil intappable, conflit pan-carte/scroll-page, cibles tactiles sous-dimensionnées, safe-areas absentes.

## Problem Frame

La famille consulte au téléphone mais l'app est pensée souris (see origin: docs/brainstorms/2026-07-06-mobile-navigation-requirements.md). Audit visuel 375×812 : marqueurs de la carte monde ~10-14 px effectifs, carte Leaflet dans le flux de scroll (tout drag vertical panne la carte au lieu de faire défiler la page), toggle Édition présent sur mobile, aucun `safe-area-inset`. En revanche la page voyage empilée, le bottom sheet DetailPanel (55svh) et la lightbox YARL sont des bases saines.

## Requirements Trace

- R1. Accueil mobile : la liste des voyages est le chemin principal ; les marqueurs carte ne sont plus le passage obligé.
- R2. Page voyage : statu quo empilé amélioré (hauteur carte, navigation étape↔jour au pouce).
- R3. Gestes carte maîtrisés : le scroll de page ne panne pas la carte ; pan/zoom volontaire possible ; cibles marqueurs ≥ 40 px.
- R4. Lecture d'un jour + galerie plein écran avec swipe et fermeture au geste.
- R5. Hygiène tactile : zéro scroll horizontal, cibles ≥ 44 px, pas de pincer/zoomer subi.
- R6. Le mode édition n'est pas retravaillé mais ne casse pas la consultation mobile.

## Scope Boundaries

- Pas d'édition mobile (formulaires, drag de marqueurs, création au clic carte) ; `MediaUploader.tsx` n'est pas touché (zone auth sensible documentée).
- Pas de zoom/pan tactile sur la carte monde de l'accueil (la liste prend le relais).
- Pas de PWA/offline, pas de refonte desktop, pas d'upload mobile.
- Pas de création de harnais de test frontend (chantier séparé identifié dans l'idéation) — la vérification passe par l'audit navigateur.

## Context & Research

### Relevant Code and Patterns

- `frontend/src/features/trips/pages/TripsPage.tsx` + `.module.css` : `panelOpen` (useState, défaut `false`) ; à ≤768px le panneau devient un overlay plein écran `translateX(-100%)` ; pill `.listButton` fixée bottom 36px.
- `frontend/src/features/trips/pages/TripDetailPage.tsx` + `.module.css` : mobile = `grid-template-rows: 35svh 1fr`, carte **dans le flux**, timeline scrolle avec le body ; sélection étape/jour en **search params** (`?stage&day`, deep-linkable) ; `scrollIntoView` sur `#stage-{id}`.
- `frontend/src/features/trips/components/TripMap.tsx` : `MapContainer` sans options tactiles (défauts Leaflet 1.9.4 / react-leaflet 5) ; `FitBounds` avec `DRAWER_PAD_PX = 440` (hypothèse drawer desktop, fausse en mobile empilé) ; marqueurs divIcon étape 32/40 px, **jour 24 px** ; tooltips hover.
- `frontend/src/features/trips/components/WorldMap.tsx` : react-simple-maps sans `ZoomableGroup` ; marqueurs r=5/7 + halo r=10 ; popup in-map pour groupes multi-voyages (pattern tactile réutilisable).
- `frontend/src/features/trips/components/DetailPanel.tsx` : déjà bottom sheet ≤768px (`max-height: 55svh`, `.body` scroller interne) ; rend `<MediaGallery>` ; fetch `useDayMedia` dans le composant (exception existante à la règle hooks/pages).
- `frontend/src/features/media/components/MediaGallery.tsx` / `MediaLightbox.tsx` : grille polaroid (110 px mobile) → **yet-another-react-lightbox 3.30.1** (Captions, slide vidéo custom, swipe natif).
- `frontend/src/index.css` : tokens (`--radius-*`, `--header-height: 60px`, unités `svh` partout), **View Transitions** `trip-panel` avec hacks durement acquis (`isolation: auto`, `html background`) sous `prefers-reduced-motion` ; breakpoint unique `max-width: 768px`.
- `frontend/src/components/Header/` : ≤768px masque `.userName` seulement ; `EditModeToggle` sans règle mobile.
- **Code mort** : `DayDrawer.tsx` / `TripsDrawer.tsx` ne sont importés nulle part.

### Institutional Learnings

- Plan média 2026-04-12 : lightbox « lib existante » déjà tranchée de fait (YARL livrée en PR #19) — étendre `MediaLightbox`, ne rien construire.
- Reviews COR-009/010 : ne pas perturber le gate `fetching || sessionExpired` de `ProtectedLayout`, ni le cycle de vie du client urql (recréation = refetch global, coûteux en mobile), ni le XHR de `MediaUploader`.
- COR-008 : le dédoublonnage des jours multi-étapes dans la timeline est un point de régression connu — ne toucher que le CSS de la timeline, pas sa logique.
- Fix « nested button in media gallery » : en agrandissant les zones tappables, ne pas réintroduire de boutons imbriqués dans les thumbnails.

### External References

- Aucune (patterns Leaflet tactiles standards, lightbox déjà en place).

## Key Technical Decisions

- **Gestes carte mobile = modèle « embed »** : sur pointeur tactile (`≤768px` / `pointer: coarse`), désactiver `dragging` (le scroll de page gagne) et garder `touchZoom` deux doigts + marqueurs tappables. C'est le pattern le moins surprenant (comportement Google-Maps-embed), sans plugin tiers ni overlay.
- **Accueil mobile : panneau ouvert par défaut** : initialiser `panelOpen` selon `matchMedia('(max-width: 768px)')` — la liste plein écran est l'entrée, la carte reste accessible en fermant (✕). Pas de restructuration du layout desktop.
- **Marqueurs carte monde : zone de frappe élargie** plutôt que zoom/pan : cercle transparent de hit (~22 px rayon) autour des marqueurs existants sur mobile, sans changer le rendu visuel desktop.
- **`FitBounds` responsive** : le padding asymétrique (440 px à droite) devient fonction du layout — sur mobile empilé, padding réduit uniforme (le drawer n'existe pas ; le bottom sheet ne masque pas la carte, il est sous elle dans le flux).
- **Toggle Lecture/Édition masqué à ≤768px** : consultation-only sur mobile (R6) ; les brouillons restent visibles selon le rôle (`hasEditRole`), indépendant du toggle.
- **View transition `trip-panel` adaptée** : à ≤768px le slide-from-left n'a pas de sens sur un layout empilé — passer en fade/slide-up via media query, en préservant les hacks `isolation: auto` et `html background`.
- **Breakpoint unique 768px conservé** (convention du repo) ; pas de point tablette (question différée du brainstorm, tranchée : YAGNI pour 5 utilisateurs).
- **Safe areas** : `viewport-fit=cover` dans index.html + `env(safe-area-inset-*)` sur les éléments fixes (`.listButton`, bottom sheet, lightbox).

## Open Questions

### Resolved During Planning

- Gestes coopératifs Leaflet : modèle « embed » (dragging off + touchZoom 2 doigts sur mobile) — pas de plugin, pas d'overlay.
- Lightbox lib vs maison : déjà tranchée de fait — YARL 3.30.1 en place, on règle, on ne construit pas.
- Hauteur de carte page voyage : conserver 35svh (validé à l'audit), ajuster seulement si l'audit final montre un problème.
- Breakpoint intermédiaire tablette : non (YAGNI).

### Deferred to Implementation

- Valeurs exactes des paddings `FitBounds` mobiles : à caler visuellement sur l'app qui tourne.
- Plugin YARL Zoom (pinch dans la lightbox) : à décider en voyant le comportement réel avec de vraies photos ; ne l'ajouter que si le pincement natif manque vraiment.
- Comportement précis du tap sur marqueur avec tooltip hover (Leaflet déclenche click + tooltip) : vérifier en réel qu'il n'y a pas de double-tap requis.

## Implementation Units

- [x] **Unit 1: Accueil mobile — liste en entrée et carte monde tappable**

**Goal:** Sur mobile, on atterrit sur la liste des voyages ; la carte reste consultable et ses marqueurs deviennent tappables.

**Requirements:** R1, R5

**Dependencies:** None

**Files:**
- Modify: `frontend/src/features/trips/pages/TripsPage.tsx`, `frontend/src/features/trips/pages/TripsPage.module.css`
- Modify: `frontend/src/features/trips/components/WorldMap.tsx`, `frontend/src/features/trips/components/WorldMap.module.css`

**Approach:**
- `panelOpen` initialisé à `true` quand `matchMedia('(max-width: 768px)')` matche (état initial seulement, pas de listener — une rotation en cours de session ne referme pas le panneau).
- Zone de frappe élargie des marqueurs monde sur mobile (cercle transparent ~22 px rayon au-dessus du marqueur visuel) ; le popup multi-voyages existant sert de modèle d'interaction tactile.
- `.listButton` repositionnée avec `env(safe-area-inset-bottom)`.

**Patterns to follow:** popup in-map de `WorldMap.tsx` (interaction tap déjà fonctionnelle) ; convention breakpoint 768px.

**Test scenarios:**
- Ouverture de `/` sur 375×812 : liste visible immédiatement, chaque card ouvre son voyage au tap.
- Fermeture du panneau (✕) : carte visible, tap sur un marqueur (y compris groupe multi-voyages) ouvre le voyage ou le popup.
- Desktop inchangé (panneau fermé par défaut, carte en entrée).

**Verification:** parcours home au doigt sans visée au pixel, vérifié en navigateur 375×812 ; aucune régression visuelle desktop (1440px).

- [x] **Unit 2: Page voyage — gestes carte et fit responsive**

**Goal:** Le scroll de la page ne panne plus la carte ; le pan/zoom volontaire reste possible ; les marqueurs jour deviennent confortables.

**Requirements:** R2, R3

**Dependencies:** None

**Files:**
- Modify: `frontend/src/features/trips/components/TripMap.tsx`
- Modify: `frontend/src/features/trips/pages/TripDetailPage.module.css` (si ajustements de hauteur nécessaires)

**Approach:**
- Sur mobile : `dragging` désactivé, `touchZoom` (2 doigts) actif, `scrollWheelZoom` sans objet ; détecter via matchMedia au montage (les options `MapContainer` ne sont pas réactives — un composant enfant `useMap()` peut ajuster comme le fait déjà `PlacementZoomToggle`).
- `FitBounds` : remplacer le padding fixe `DRAWER_PAD_PX` par un padding dépendant du viewport (mobile = padding uniforme réduit).
- Marqueurs jour : zone tactile ≥ 40 px (padding transparent autour du divIcon 24 px, sans changer le rendu).

**Patterns to follow:** `PlacementZoomToggle` dans `TripMap.tsx` (composant enfant qui module les handlers Leaflet via `useMap()`).

**Test scenarios:**
- Scroll vertical démarré sur la carte : la page défile, la carte ne bouge pas.
- Zoom deux doigts sur la carte : la carte zoome, la page ne défile pas.
- Tap sur marqueur étape → zoom étape ; tap sur marqueur jour → ouverture du jour (pas de double-tap requis malgré le Tooltip hover).
- Sélection d'étape : le `flyToBounds` cadre correctement sur 375px (pas de décalage droite hérité du padding drawer).
- Desktop : drag carte et fit avec drawer inchangés.

**Verification:** les cinq scénarios passent en navigateur 375×812 et 1440px.

- [x] **Unit 3: Galerie et lightbox au doigt**

**Goal:** Les photos d'un jour s'ouvrent en plein écran, se parcourent au swipe et se ferment au geste, avec des contrôles tappables.

**Requirements:** R4, R5

**Dependencies:** None (mais la vérification exige un jeu de données avec médias — voir Unit 5)

**Files:**
- Modify: `frontend/src/features/media/components/MediaLightbox.tsx` (+ module CSS si besoin)
- Modify: `frontend/src/features/media/components/MediaGallery.module.css`

**Approach:**
- YARL : vérifier/activer plein écran réel sur mobile, swipe prev/next (natif), fermeture par geste (pull-down si disponible dans la version, sinon bouton ✕ ≥ 44 px), slides vidéo jouables au tap.
- Grille polaroid : thumbnails déjà ~110 px (tappables) ; s'assurer que les actions admin superposées ne réduisent pas la zone de tap en lecture et ne réintroduisent pas de boutons imbriqués.

**Patterns to follow:** `MediaLightbox.tsx` existant (plugin Captions, render vidéo custom) ; esthétique polaroid/manuscrite conservée.

**Test scenarios:**
- Jour avec plusieurs photos : tap thumbnail → plein écran, swipe gauche/droite navigue, fermeture au geste ou ✕.
- Jour avec vidéo : la slide vidéo se lance au tap, contrôles natifs utilisables.
- Jour sans média : aucun changement (« Aucun média pour ce jour »).

**Verification:** parcours galerie complet au doigt sur 375×812 avec de vraies photos et une vidéo.

- [x] **Unit 4: Hygiène tactile globale et transitions mobiles**

**Goal:** Cibles ≥ 44 px partout sur le parcours de consultation, zéro scroll horizontal, safe-areas gérées, toggle édition masqué, transitions adaptées au layout empilé.

**Requirements:** R5, R6

**Dependencies:** Units 1-3 (passe finale transverse)

**Files:**
- Modify: `frontend/index.html` (`viewport-fit=cover`)
- Modify: `frontend/src/index.css` (view transition `trip-panel` ≤768px, utilitaires safe-area)
- Modify: `frontend/src/components/Header/Header.module.css` (+ `EditModeToggle.module.css`) — masquer le toggle ≤768px
- Modify: modules CSS des cibles sous-dimensionnées repérées (tabs Timeline/Étapes, `.popupTripItem`, boutons ✕)
- Delete: `frontend/src/features/trips/components/DayDrawer.tsx|.module.css`, `TripsDrawer.tsx|.module.css` (code mort confirmé)

**Approach:**
- `env(safe-area-inset-*)` sur les éléments fixes (listButton, bottom sheet DetailPanel, lightbox).
- View transition `trip-panel` : à ≤768px, remplacer le slide-from-left par un fade/slide-up ; **préserver** les hacks `isolation: auto` et `html { background-color }`.
- Sweep « no horizontal scroll » : vérifier chaque page à 375px, corriger les débordements.
- Masquer `EditModeToggle` à ≤768px (les brouillons restent visibles par rôle) ; si le mode édition était actif avant réduction de viewport, la consultation doit rester fonctionnelle.

**Patterns to follow:** hacks View Transitions existants d'`index.css` (ne pas les réécrire) ; règle « composants dumb » (aucune logique nouvelle dans les composants).

**Test scenarios:**
- Aucune page du parcours ne défile horizontalement à 375px.
- Navigation liste → voyage : transition propre (pas de flash blanc, pas de slide latéral incongru).
- ADMIN sur mobile : pas de toggle édition, consultation complète y compris brouillons dans la liste.
- Build sans référence au code mort supprimé.

**Verification:** lint + build verts ; audit visuel des transitions et débordements sur 375×812.

- [x] **Unit 5: Audit final de consultation mobile**

**Goal:** Prouver le critère de succès du brainstorm : le parcours complet au pouce, captures à l'appui.

**Requirements:** R1-R6 (validation transverse)

**Dependencies:** Units 1-4

**Files:**
- Aucun fichier produit (audit) ; éventuels correctifs mineurs dans les fichiers des units précédentes.

**Approach:**
- Backend dev seedé + quelques médias réels uploadés sur un jour (le seed n'en contient pas — hypothèse du brainstorm à lever ici).
- Audit navigateur 375×812 (même protocole que l'audit d'origine) : liste → voyage → étape → jour → photos plein écran ; captures de chaque étape ; re-vérification rapide desktop 1440px.

**Test scenarios:** le critère de succès du doc d'origine, tel quel.

**Verification:** série de captures du parcours complet, sans zoom pincé ni visée au pixel ; écarts corrigés ou documentés.

## System-Wide Impact

- **Interaction graph :** `panelOpen` (TripsPage) pilote aussi la grille desktop — l'init conditionnelle ne doit changer que l'état initial mobile. `FitBounds` est utilisé par tous les modes de TripMap (overview, zoom étape, placement) — le padding responsive doit préserver le cas placement desktop (drawer 440px).
- **Error propagation :** aucune — pas de changement de flux de données ni d'API.
- **State lifecycle risks :** ne pas toucher au montage de `ProtectedLayout` (gate sessionExpired) ni au cycle de vie du client urql ; la suppression du code mort (DayDrawer/TripsDrawer) est sans risque (zéro import).
- **API surface parity :** aucune (frontend pur, schéma GraphQL intact — pas de codegen nécessaire).
- **Integration coverage :** pas de harnais de test frontend — la couverture est l'audit navigateur de l'Unit 5 ; c'est assumé et documenté (le harnais est un chantier séparé de l'idéation).

## Risks & Dependencies

- **Leaflet touch sur options non réactives** : les options de `MapContainer` sont figées au montage ; passer par un composant enfant `useMap()` (pattern `PlacementZoomToggle`) évite les remounts de carte.
- **View transitions fragiles** : deux hacks documentés dans `index.css` corrigent des bugs visuels réels — les préserver tels quels.
- **Vérification galerie** : dépend d'un jeu de données avec médias (l'assomption du brainstorm) — levée en Unit 5 par upload manuel en dev.
- **iOS réel vs Chrome desktop en viewport réduit** : les gestes (deux doigts, safe-areas) se comportent différemment en émulation ; l'audit Unit 5 en émulation est le minimum, un passage sur un vrai téléphone (réseau local) est recommandé avant de clore.

## Documentation / Operational Notes

- Mettre à jour `tasks/TASKS.md` (nouvelle tâche + PR) au fil du chantier, selon la convention du tracker.
- `frontend/CLAUDE.md` : pas de changement de convention introduit (breakpoint unique conservé).

## Sources & References

- **Origin document:** [docs/brainstorms/2026-07-06-mobile-navigation-requirements.md](../brainstorms/2026-07-06-mobile-navigation-requirements.md)
- Idéation : [docs/ideation/2026-07-06-open-ideation.md](../ideation/2026-07-06-open-ideation.md) (idée #1)
- Code : `TripsPage.tsx`, `TripDetailPage.module.css`, `TripMap.tsx`, `WorldMap.tsx`, `DetailPanel.tsx`, `MediaLightbox.tsx`, `index.css`
- Plan média (lightbox livrée) : `docs/plans/2026-04-12-001-feat-media-management-plan.md`, PR #19
- Reviews auth à ne pas perturber : `.context/compound-engineering/ce-review/2026-07-06-cor-009|010/review-summary.md`
