---
date: 2026-07-07
type: refactor
status: completed
origin: docs/brainstorms/2026-07-07-unified-panel-slide-requirements.md
---

# refactor: Panneau unique avec translation horizontale (timeline ⇄ étape ⇄ jour)

## Problem Frame

La page voyage garde deux surfaces de navigation (timeline + panneau/sheet de
détail). Objectif : un seul conteneur — drawer gauche 420 px sur desktop, bottom
sheet persistant sur mobile — dont le contenu translate horizontalement entre trois
niveaux : timeline (0), détail d'étape (1), détail de jour (2). La carte récupère
tout l'espace libéré. (see origin: docs/brainstorms/2026-07-07-unified-panel-slide-requirements.md)

## Requirements Trace

| Req | Couvert par |
|-----|-------------|
| R1 panneau unique 3 niveaux | Unit 1, Unit 2 |
| R2 translation gauche/droite | Unit 1 |
| R3 grille desktop 2 colonnes | Unit 1 |
| R4 sheet persistant 3 hauteurs | Unit 2 |
| R5 URL source de vérité, deep link sans animation | Unit 1 |
| R6 suppression du recede | Unit 2 |
| R7 marqueur carte → niveau + remontée du peek | Unit 3 |
| R8 FitBounds mobile avec padding sheet | Unit 3 |

## High-Level Technical Design

*Directional guidance for review, not implementation specification.*

```
<aside class=panel>                      ← TripPanel (nouveau composant structurel)
  grabZone (mobile uniquement)           ← gestes 3 snaps : peek / half / full
  viewport (overflow hidden, flex:1)
    track (width 300%, translateX(level × -100%/3), transition transform .3s)
      pane0: tripHeader + timeline       ← JSX fourni par la page (props ReactNode)
      pane1: StageDetail                 ← extrait de DetailPanel.tsx
      pane2: DayDetail                   ← extrait de DetailPanel.tsx
```

- `level = day ? 2 : stage ? 1 : 0`, dérivé des params URL — au premier rendu le
  transform est déjà à sa valeur cible, donc aucun enchaînement d'animations sur
  deep link (une transition CSS ne joue pas au premier paint).
- **Contenu rémanent** : au retour (day → null), la pane 2 doit rester peuplée
  pendant la translation. Pattern adjust-during-render (comme `wasOpen` dans #43) :
  `lastStage`/`lastDay` conservent la dernière valeur non nulle ; les panes
  affichent `stage ?? lastStage`.
- Panes inactives : `inert` + `aria-hidden` (pas de focus piégé hors écran).
- TripPanel est **structurel** : il reçoit les trois panes en props ReactNode ; la
  page garde le fetching et le câblage (convention data-fetching du frontend).

## Implementation Units

### [x] Unit 1 — TripPanel + slider, desktop 2 colonnes

**Goal :** le panneau gauche devient l'unique conteneur ; la colonne détail
desktop disparaît ; navigation par translation entre les 3 niveaux.

**Files :**
- `frontend/src/features/trips/components/TripPanel.tsx` (nouveau)
- `frontend/src/features/trips/components/TripPanel.module.css` (nouveau)
- `frontend/src/features/trips/components/StageDetail.tsx` (extrait)
- `frontend/src/features/trips/components/DayDetail.tsx` (extrait)
- `frontend/src/features/trips/components/DetailView.module.css` (renommé depuis
  `DetailPanel.module.css`, règles sheet/wrapper retirées)
- `frontend/src/features/trips/components/DetailPanel.tsx` (supprimé)
- `frontend/src/features/trips/components/DetailPanel.module.css` (supprimé)
- `frontend/src/features/trips/pages/TripDetailPage.tsx`
- `frontend/src/features/trips/pages/TripDetailPage.module.css`

**Approach :**
- Grille : base `420px 1fr` ; `.formPanelOpen` reste `420px 1fr 380px`
  (formPanelWrapper `order: 3` inchangé). `.detailOpen` supprimé.
- Le ✕ des vues détail = retour timeline (clear params) ; le retour du jour =
  clear `day` (inchangé). Comportement des affordances édition (menus ⋮,
  onEditStage/onAddDay/onEditDay) conservé tel quel.
- `view-transition-name: trip-panel` conservé sur le panneau.

**Patterns to follow :** adjust-during-render de #43 (`DetailPanel.tsx`) ;
convention CSS Modules un bloc `@media 768px` par fichier.

**Verification :** desktop 1440×900 — timeline visible, clic tête d'étape → slide
gauche vers détail étape, clic jour → slide vers détail jour, retours slide droite ;
carte occupe tout sauf 420 px ; deep link `?stage&day` atterrit au niveau 2.

### [x] Unit 2 — Sheet mobile persistant à 3 hauteurs

**Goal :** sur mobile (lecture), carte plein écran et TripPanel en sheet fixe
bottom avec snaps peek (poignée seule) / half (55svh, défaut) / full (92svh).

**Dependencies :** Unit 1.

**Files :** `TripPanel.tsx`, `TripPanel.module.css`,
`TripDetailPage.module.css`.

**Approach :**
- Snaps par classes : half = `height: 55svh`, full = `height: 92svh`, peek =
  half + `translateY(calc(100% - hauteur poignée - safe-area))`. Transition sur
  transform + height.
- Gestes : reprise de la mécanique #43 (pointer capture sur grabZone, seuils
  TAP_SLOP 8 / EXPAND 50 / DISMISS 80, live-follow vers le bas uniquement,
  pointercancel = abandon). Release : drag haut = snap supérieur, drag bas = snap
  inférieur (jamais en dessous de peek — plus de fermeture), tap/Enter = cycle
  peek→half→full→half.
- Mode édition mobile : layout actuel conservé (carte 35svh + formulaire) — les
  styles sheet ne s'appliquent pas quand `.formPanelOpen`.
- Suppression de `.sheetShown` (recede) et de ses règles.

**Verification :** mobile 375×812 — sheet à mi-hauteur avec timeline à l'arrivée,
drag haut → 92svh, drag bas ×2 → poignée seule, carte visible plein écran derrière ;
mode édition inchangé.

### [x] Unit 3 — Carte : padding sheet + remontée du peek

**Goal :** FitBounds mobile ne cache pas les marqueurs sous le sheet ; un tap
marqueur remonte le sheet s'il est en peek.

**Dependencies :** Unit 2.

**Files :** `frontend/src/features/trips/components/TripMap.tsx`,
`TripPanel.tsx`, `TripDetailPage.tsx`.

**Approach :** padding bas FitBounds mobile ≈ 55 % de la hauteur viewport quand le
sheet persistant est présent (prop dédiée, l'édition mobile garde 32 px) ; la
sélection via carte force snap ≥ half.

**Verification :** mobile — sélection d'une étape recentre la carte avec les
marqueurs dans la zone visible au-dessus du sheet ; tap marqueur en peek → sheet
remonte à half sur le bon niveau.

### [x] Unit 4 — Échappement des overlays du track transformé

**Goal :** les ConfirmModal et menus ⋮ rendus dans les panes ne doivent pas être
piégés par le `transform` du track (`position: fixed` se rattache à l'ancêtre
transformé) ni clippés par `overflow: hidden`.

**Dependencies :** Unit 1.

**Files :** `frontend/src/components/ConfirmModal/ConfirmModal.tsx`,
`frontend/src/components/ActionMenu/ActionMenu.tsx` (selon constat).

**Approach :** vérifier le rendu réel ; si piégés, `createPortal(document.body)`
sur l'overlay. Note : la containment ConfirmModal-sous-transform était déjà connue
sur mobile (#43) ; elle deviendrait visible sur desktop avec le track — à traiter
cette fois.

**Verification :** desktop et mobile — suppression étape/jour depuis le détail :
modal centrée plein écran, menu ⋮ non clippé.

### [x] Unit 5 — Audit final e2e

**Goal :** vérification navigateur complète + qualité.

**Dependencies :** Units 1-4.

**Approach :** recette e2e mémoire (backend dev + frontend dev, seed admin) ;
audits 375×812 et 1440×900 ; parcours lecture complet, deep link, mode édition
(desktop + mobile), lint + build + tsc. Spec Gherkin relue — les scénarios de
`consultation-des-voyages.feature` restent valides (agnostiques du layout), pas de
changement attendu.

**Verification :** captures aux deux viewports dans la PR ; lint/build verts.

## Scope Boundaries

- Formulaires d'édition : rendu actuel conservé (hors périmètre).
- Aucun changement backend/GraphQL.
- Contenu des vues StageDetail/DayDetail inchangé (extraction pure).

## Deferred to Implementation

- Rendu mobile actuel exact du mode édition (à constater au navigateur avant de
  figer les règles CSS `.formPanelOpen` mobile).
- ActionMenu : portal nécessaire ou non (selon son positionnement réel).
- Valeur fine du padding FitBounds (calibrage au navigateur).

## Risks

- Régression desktop du ConfirmModal via le transform du track (Unit 4 la couvre).
- Scroll par pane : chaque pane doit scroller indépendamment sans casser le
  live-follow du drag (le geste reste confiné à la grabZone, comme #43).
