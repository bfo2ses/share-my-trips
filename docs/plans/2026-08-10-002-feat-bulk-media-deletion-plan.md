---
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
---

# Suppression multiple des médias

## Problem frame

La galerie permet déjà de sélectionner plusieurs médias pour les déplacer, mais la suppression reste limitée à l’action média par média. Les administrateurs doivent pouvoir supprimer plusieurs photos ou vidéos depuis la même barre de sélection, avec une confirmation explicite et un retour fiable en cas d’échec.

## Scope

- Ajouter une action `Supprimer` à la barre de sélection multiple.
- Ouvrir une modale de confirmation dangereuse avec le nombre de médias concernés.
- Réutiliser la mutation GraphQL `deleteMedia` existante pour chaque média sélectionné.
- Fermer la modale et vider la sélection si toutes les suppressions réussissent.
- En cas d’échec, rafraîchir les médias déjà supprimés, les retirer de la sélection et conserver la modale ouverte avec le message d’erreur.
- Invalider les listes de médias dans le cache après chaque suppression réussie.
- Couvrir le parcours par les specs et tests frontend.

Hors périmètre : nouvelle mutation GraphQL bulk, suppression unitaire existante, changement des droits d’administration.

## Design decisions

1. Réutiliser `deleteMedia` plutôt que créer une mutation bulk. La mutation actuelle supprime déjà l’enregistrement et les fichiers associés ; cette approche limite le changement de contrat et permet de reprendre après une erreur partielle.
2. Arrêter la séquence au premier échec. Les suppressions précédentes sont confirmées par le rafraîchissement et restent supprimées ; les autres restent sélectionnées pour une nouvelle tentative.
3. Utiliser `ConfirmModal` avec `danger` et un bouton de confirmation désactivé uniquement pendant la séquence serveur.

## Implementation units

### Frontend gallery

Fichiers : `frontend/src/features/media/components/MediaGallery.tsx`, `frontend/src/features/media/components/MediaGallery.module.css`.

- Ajouter l’état et les handlers de la modale de suppression.
- Ajouter le bouton dans la barre de sélection.
- Afficher la confirmation et traiter succès, erreur GraphQL et erreur réseau.
- Préserver le style responsive existant.

Tests : `frontend/src/features/media/components/MediaGallery.test.tsx`.

- bouton visible après sélection ;
- confirmation supprime tous les médias sélectionnés ;
- annulation sans requête ;
- erreur conservant la modale ouverte ;
- sélection partiellement supprimée correctement mise à jour.

### Cache GraphQL

Fichiers : `frontend/src/graphql/client.ts`, `frontend/src/graphql/client.test.ts`.

- Invalider `visitMedia`, `travelLegMedia` et `tripMedia` après une réponse `deleteMedia` réussie.
- Ne pas invalider sur une réponse métier en erreur.

### Specification

Fichier : `specs/web-application/suppression-multiple-des-medias.feature`.

- Décrire le parcours administrateur de confirmation, de succès et d’erreur.

## Validation

`make check` doit passer, avec les tests frontend, le typecheck, le lint, le build, les tests Go, la vérification du code généré et l’E2E existant.
