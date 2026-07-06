---
date: 2026-07-06
topic: trip-page-timeline-sheet
---

# Page voyage : timeline unique et sheet de détail unifié

## Problem Frame

Sur la page voyage, deux irritants d'UX identifiés par l'utilisateur après la livraison mobile (#41) :
1. Les tabs **Timeline / Étapes** font doublon — le contenu de la timeline (jours groupés par étape avec dividers) suffit.
2. Sur mobile, l'ouverture d'un détail (étape ou jour) superpose le bottom sheet `DetailPanel` au bloc page (header voyage + timeline) qui a lui-même une allure de sheet → **« double bottom sheets »**, hiérarchie visuelle confuse.

Constat code : le `DetailPanel` **commute déjà** son contenu étape ↔ jour (avec « Retour à l'étape ») — le problème est la présence des tabs et la perception de deux surfaces empilées, pas la mécanique de navigation.

## Requirements

- R1. Les tabs Timeline / Étapes disparaissent (mobile **et** desktop) : la timeline est l'unique contenu du panneau voyage.
- R2. Les informations d'étape restent accessibles : sélectionner une étape (divider de timeline ou marqueur carte) ouvre son détail dans la surface de détail existante.
- R3. Sur mobile, **une seule surface** au-dessus de la page à tout moment : le bottom sheet unique commute étape ↔ jour avec retour interne (comportement actuel du DetailPanel conservé et assumé comme LE pattern).
- R4. Quand le sheet est ouvert sur mobile, le bloc page perd son allure de sheet (bords arrondis, ombres) pour se lire comme un simple fond — **pas de backdrop** : la carte reste pleinement visible. La fermeture passe par le ✕ ou le geste, pas par un tap sur le fond.
- R5. Desktop : le panneau latéral de détail garde son comportement actuel ; seul le retrait des tabs s'applique.
- R6. Le mode édition (formulaires auto dans le panneau de détail, mobile inclus depuis #42) continue de fonctionner avec la surface unique.
- R7. Le sheet est **extensible au geste** : ouverture à ~55 % de l'écran, glissement vers le haut (ou tap sur une poignée) vers un état quasi plein écran pour les jours riches en photos, glissement vers le bas pour réduire puis fermer.
- R8. Les dividers d'étape de la timeline deviennent de vraies **têtes d'étape tappables** : nom + dates (ou ville), tap → détail étape dans le sheet + zoom carte. La timeline porte seule toute la navigation.

## Success Criteria

- Parcours mobile timeline → étape → jour → photos : jamais plus d'une surface au-dessus de la page, navigation retour évidente.
- Plus aucun tab sur la page voyage, sans perte d'accès aux infos d'étape.
- Vérifiable par audit navigateur 375×812 + non-régression desktop 1440.

## Scope Boundaries

- Pas de changement du modèle jours/étapes (rattachement multi-étapes intact — COR-008 reste un point de régression à surveiller côté timeline).
- Pas de refonte de la saisie (création/édition inchangées hors adaptation à la surface unique).
- Pas de changement de la carte ni du layout global desktop.

## Key Decisions

- **Timeline seule** : la vue Étapes n'apporte rien que la timeline groupée + le détail d'étape ne couvrent — directive utilisateur explicite.
- **Sheet unique commuté** (choisi contre détail inline/accordéon et page plein écran) : préserve le lien visuel avec la carte et réutilise la mécanique existante du DetailPanel.
- **Sheet extensible au geste** (choisi contre hauteur fixe et hauteur auto) : standard mobile, indispensable pour les galeries.
- **Fond aplati sans backdrop** (choisi contre voile sombre) : la carte reste visible, la hiérarchie vient de la disparition de l'allure sheet du bloc page.
- **Dividers d'étape enrichis et tappables** : compensent la disparition de la vue Étapes en devenant le point d'entrée naturel du détail d'étape.

## Dependencies / Assumptions

- La spec Gherkin `consultation-des-voyages.feature` doit être vérifiée et mise à jour si elle décrit la vue Étapes/les tabs (règle projet : specs = source de vérité).

## Outstanding Questions

### Resolve Before Planning
_(aucune)_

### Deferred to Planning
- [Affects R7][Technical] Mécanique du sheet extensible (drag CSS/JS maison vs lib, paliers 55 % / plein écran, interaction avec le scroll interne du `.body`) — attention au conflit geste d'extension vs scroll du contenu.
- [Affects R1][Technical] Devenir du state `view` et du contenu de la vue 'stages' dans TripDetailPage (suppression propre, recyclage éventuel de morceaux dans le détail d'étape).
- [Affects R8][Technical] Contenu exact des têtes d'étape (dates dérivées des jours ? ville ?) et cohérence avec le tri COR-008.

## Next Steps
→ `/ce:plan` for structured implementation planning
