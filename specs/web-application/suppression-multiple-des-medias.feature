# language: fr

Fonctionnalité: Suppression multiple des médias
  En tant qu'administrateur
  Je veux supprimer plusieurs médias en une seule action
  Afin de nettoyer rapidement une visite ou un trajet

  Contexte:
    Etant donné que je suis connecté en tant qu'administrateur
    Et qu'un voyage "Road trip en Islande" existe et n'est pas clôturé

  Scénario: Confirmer la suppression de plusieurs médias
    Etant donné que la visite "2025-07-01" contient les photos "eglise.jpg" et "port.jpg"
    Quand je sélectionne les photos "eglise.jpg" et "port.jpg"
    Alors le bouton "Supprimer" apparaît
    Quand je clique sur "Supprimer"
    Alors une modale de confirmation de suppression apparaît
    Quand je confirme la suppression
    Alors les photos "eglise.jpg" et "port.jpg" ne sont plus associées à la visite
    Et les fichiers sont supprimés du stockage

  Scénario: Annuler la suppression de plusieurs médias
    Etant donné que la visite "2025-07-01" contient les photos "eglise.jpg" et "port.jpg"
    Quand je sélectionne les photos "eglise.jpg" et "port.jpg"
    Et que j'annule la confirmation de suppression
    Alors aucune photo n'est supprimée

  Scénario: Afficher une erreur pendant la suppression multiple
    Etant donné qu'une suppression de média échoue
    Quand je confirme la suppression de plusieurs médias
    Alors la modale reste ouverte
    Et un message d'erreur est affiché
