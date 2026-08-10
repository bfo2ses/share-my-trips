# language: fr

Fonctionnalité: Gestion des trajets entre les étapes
  En tant qu'administrateur
  Je veux documenter les déplacements entre des étapes consécutives
  Afin de raconter le voyage entre les lieux visités

  Contexte:
    Etant donné que je suis connecté en tant qu'administrateur
    Et qu'un voyage "Road trip aux Etats-Unis" existe et n'est pas clôturé

  Scénario: Créer un trajet entre deux étapes consécutives
    Etant donné que les étapes "San Francisco" et "Las Vegas" sont consécutives dans le voyage
    Quand je crée un trajet en voiture entre "San Francisco" et "Las Vegas"
    Alors le trajet est ajouté au voyage
    Et le trajet utilise le moyen de locomotion "voiture"

  Scénario: Un trajet peut utiliser le bus
    Etant donné que les étapes "San Francisco" et "Las Vegas" sont consécutives dans le voyage
    Quand je crée un trajet en bus entre "San Francisco" et "Las Vegas"
    Alors le trajet est ajouté au voyage
    Et le trajet utilise le moyen de locomotion "bus"

  Scénario: Un trajet doit relier deux étapes consécutives
    Etant donné que les étapes "San Francisco", "Yosemite" et "Las Vegas" existent dans cet ordre
    Quand je tente de créer un trajet entre "San Francisco" et "Las Vegas"
    Alors un message d'erreur m'indique que les étapes doivent être consécutives
    Et le trajet n'est pas créé

  Scénario: Un trajet ne peut exister qu'une fois pour une paire d'étapes
    Etant donné qu'un trajet en voiture existe entre "San Francisco" et "Las Vegas"
    Quand je crée un autre trajet entre "San Francisco" et "Las Vegas"
    Alors un message d'erreur m'indique qu'un trajet existe déjà

  Scénario: La distance d'un trajet reste facultative et positive
    Etant donné que les étapes "San Francisco" et "Las Vegas" sont consécutives dans le voyage
    Quand je crée un trajet en avion sans distance
    Alors le trajet est ajouté au voyage
    Quand je renseigne une distance négative
    Alors un message d'erreur m'indique que la distance doit être positive

  Scénario: Déplacer un trajet vers une autre paire consécutive libre
    Etant donné qu'un trajet existe entre "San Francisco" et "Yosemite"
    Et que les étapes "Yosemite" et "Las Vegas" sont consécutives sans trajet
    Quand je déplace le trajet entre "Yosemite" et "Las Vegas"
    Alors le trajet relie "Yosemite" à "Las Vegas"

  Scénario: Un voyage clôturé ne permet pas de créer un trajet
    Etant donné qu'un voyage "Japon 2024" est clôturé
    Quand je tente de créer un trajet dans le voyage "Japon 2024"
    Alors un message d'erreur m'indique que le voyage est clôturé
