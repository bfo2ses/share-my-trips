# language: fr

Fonctionnalité: Gestion des visites d'un voyage
  En tant qu'administrateur
  Je veux gérer les visites rattachées aux étapes de mon voyage
  Afin de détailler chaque lieu visité

  Contexte:
    Etant donné qu'un voyage "Road trip en Islande" existe et n'est pas clôturé
    Et qu'une étape "Reykjavik" existe dans le voyage

  Scénario: Ajouter une visite à une étape
    Quand j'ajoute une visite avec les informations suivantes :
      | champ       | valeur                           |
      | date        | 2025-07-01                       |
      | titre       | Arrivée et découverte du centre  |
      | description | Balade dans le centre historique |
      | latitude    | 64.1466                          |
      | longitude   | -21.9426                         |
    Alors la visite est ajoutée à l'étape
    Et la date de la visite est "2025-07-01"
    Et les coordonnées de la visite sont 64.1466, -21.9426

  Scénario: La date de la visite est obligatoire
    Quand je tente d'ajouter une visite sans date
    Alors un message d'erreur m'indique que la date est obligatoire
    Et la visite n'est pas créée

  Scénario: Les coordonnées GPS de la visite sont obligatoires
    Quand je tente d'ajouter une visite sans coordonnées GPS
    Alors un message d'erreur m'indique que les coordonnées de la visite sont obligatoires
    Et la visite n'est pas créée

  Scénario: Modifier une visite
    Etant donné qu'une visite "2025-07-01" existe dans l'étape
    Quand je modifie le titre de la visite avec "Nouveau titre"
    Alors la visite est mise à jour avec le titre "Nouveau titre"

  Scénario: Modifier les coordonnées d'une visite
    Etant donné qu'une visite "2025-07-01" existe dans l'étape
    Quand je modifie les coordonnées de la visite en 63.4305, -19.1007
    Alors les coordonnées de la visite sont 63.4305, -19.1007

  Scénario: Les coordonnées de la visite restent obligatoires à la mise à jour
    Etant donné qu'une visite "2025-07-01" existe dans l'étape
    Quand je tente de modifier la visite sans coordonnées GPS
    Alors un message d'erreur m'indique que les coordonnées de la visite sont obligatoires
    Et les coordonnées de la visite sont 64.1466, -21.9426

  Scénario: Supprimer une visite
    Etant donné qu'une visite "2025-07-01" existe dans l'étape
    Quand je supprime la visite
    Alors la visite n'existe plus

  Scénario: Rattacher une visite existante à une deuxième étape
    Etant donné qu'une visite "2025-07-03" existe dans l'étape
    Et qu'une étape "Cercle d'Or" existe dans le voyage
    Quand je rattache la visite à l'étape "Cercle d'Or"
    Alors la visite apparaît dans l'étape "Reykjavik"
    Et la visite apparaît dans l'étape "Cercle d'Or"

  Scénario: Détacher une visite d'une étape
    Etant donné qu'une visite "2025-07-03" est rattachée aux étapes "Reykjavik" et "Cercle d'Or"
    Quand je détache la visite de l'étape "Reykjavik"
    Alors la visite n'apparaît plus dans l'étape "Reykjavik"
    Et la visite est conservée dans l'étape "Cercle d'Or"

  Scénario: Une visite doit toujours être rattachée à au moins une étape
    Etant donné qu'une visite "2025-07-03" existe dans l'étape
    Quand je tente de détacher la visite de sa seule étape
    Alors un message d'erreur m'indique qu'une visite doit appartenir à au moins une étape

  Scénario: Impossible d'ajouter une visite à un voyage clôturé
    Etant donné qu'un voyage "Japon 2024" est clôturé
    Quand je tente d'ajouter une visite au voyage clôturé
    Alors un message d'erreur m'indique que le voyage est clôturé pour les visites

  Scénario: Impossible de modifier une visite d'un voyage clôturé
    Etant donné qu'un voyage "Japon 2024" est clôturé
    Et qu'une visite "2024-03-15" existe dans le voyage clôturé
    Quand je tente de modifier la visite du voyage clôturé
    Alors un message d'erreur m'indique que le voyage est clôturé pour les visites

  Scénario: Impossible d'ajouter une visite avec une étape d'un autre voyage
    Etant donné qu'une étape "Paris" appartient à un autre voyage
    Quand je tente d'ajouter une visite avec l'étape de l'autre voyage
    Alors un message d'erreur m'indique que l'étape n'appartient pas au voyage
    Et la visite n'est pas créée

  Scénario: Impossible de rattacher une visite à une étape d'un autre voyage
    Etant donné qu'une visite "2025-07-01" existe dans l'étape
    Et qu'une étape "Paris" appartient à un autre voyage
    Quand je tente de rattacher la visite à l'étape de l'autre voyage
    Alors un message d'erreur m'indique que l'étape n'appartient pas au voyage

  Scénario: Les visites d'une étape sont triées par date
    Etant donné que l'étape contient les visites suivantes :
      | date       | titre          |
      | 2025-07-02 | Musées et port |
      | 2025-07-01 | Arrivée        |
      | 2025-07-03 | Blue Lagoon    |
    Alors les visites sont affichées dans l'ordre : "2025-07-01", "2025-07-02", "2025-07-03"

  # --- Réordonnancement des visites du même jour ---

  Scénario: Une nouvelle visite est ajoutée en dernière position du jour
    Etant donné que l'étape contient les visites suivantes le "2025-07-01" :
      | titre  |
      | Musée  |
      | Marché |
    Quand j'ajoute une visite avec les informations suivantes :
      | champ       | valeur     |
      | date        | 2025-07-01 |
      | titre       | Port       |
      | latitude    | 64.1466    |
      | longitude   | -21.9426   |
    Alors les visites du jour sont affichées dans l'ordre suivant :
      | titre  |
      | Musée  |
      | Marché |
      | Port   |

  Scénario: Réordonner les visites d'un même jour
    Etant donné que l'étape contient les visites suivantes le "2025-07-01" :
      | titre  |
      | Musée  |
      | Marché |
      | Port   |
    Quand je réordonne les visites du jour dans l'ordre suivant :
      | titre  |
      | Port   |
      | Musée  |
      | Marché |
    Alors les visites du jour sont affichées dans l'ordre suivant :
      | titre  |
      | Port   |
      | Musée  |
      | Marché |

  Scénario: Réordonner avec une liste de visites incomplète échoue
    Etant donné que l'étape contient les visites suivantes le "2025-07-01" :
      | titre  |
      | Musée  |
      | Marché |
    Quand je tente de réordonner les visites du jour avec une liste incomplète
    Alors un message d'erreur m'indique que les visites ne correspondent pas au jour des visites

  Scénario: Déplacer une visite vers un autre jour la place en fin de son nouveau jour
    Etant donné que l'étape contient les visites suivantes le "2025-07-02" :
      | titre   |
      | Cascade |
      | Volcan  |
    Et qu'une visite "2025-07-01" existe dans l'étape
    Quand je modifie la date de la visite au "2025-07-02"
    Alors la visite est en dernière position du jour dans l'étape "Reykjavik"

  Scénario: Détacher l'étape principale d'une visite recalcule sa position dans sa nouvelle étape principale
    Etant donné qu'une étape "Cercle d'Or" existe dans le voyage
    Et qu'une visite "Geysir" existe dans l'étape "Cercle d'Or" le "2025-07-03"
    Et qu'une visite "2025-07-03" est rattachée aux étapes "Reykjavik" et "Cercle d'Or"
    Quand je détache la visite de l'étape "Reykjavik"
    Alors la visite est en dernière position du jour dans l'étape "Cercle d'Or"

  Scénario: Réordonner avec un identifiant dupliqué échoue
    Etant donné que l'étape contient les visites suivantes le "2025-07-01" :
      | titre  |
      | Musée  |
      | Marché |
      | Port   |
    Quand je tente de réordonner les visites du jour avec un identifiant dupliqué
    Alors un message d'erreur m'indique que les visites ne correspondent pas au jour des visites

  Scénario: Réordonner avec un identifiant étranger au jour échoue
    Etant donné que l'étape contient les visites suivantes le "2025-07-01" :
      | titre  |
      | Musée  |
      | Marché |
    Et qu'une visite "2025-07-05" existe dans l'étape
    Quand je tente de réordonner les visites du jour avec un identifiant d'un autre jour
    Alors un message d'erreur m'indique que les visites ne correspondent pas au jour des visites

  Scénario: Impossible de réordonner les visites d'un voyage clôturé
    Etant donné qu'un voyage "Japon 2024" est clôturé
    Et que l'étape contient les visites suivantes le "2024-03-15" :
      | titre  |
      | Musée  |
      | Marché |
    Et que les visites du jour appartiennent au voyage clôturé
    Quand je réordonne les visites du jour dans l'ordre suivant :
      | titre  |
      | Marché |
      | Musée  |
    Alors un message d'erreur m'indique que le voyage est clôturé pour les visites

  Scénario: Rattacher une visite à une deuxième étape ne modifie pas sa position
    Etant donné qu'une visite "2025-07-03" existe dans l'étape
    Et que je mémorise la position de la visite
    Et qu'une étape "Cercle d'Or" existe dans le voyage
    Quand je rattache la visite à l'étape "Cercle d'Or"
    Alors la position de la visite est inchangée

  Scénario: Réordonner les visites d'un jour ne modifie pas les positions d'un autre jour
    Etant donné que l'étape contient les visites suivantes le "2025-07-01" :
      | titre  |
      | Musée  |
      | Marché |
    Et que je mémorise les positions des visites du "2025-07-01"
    Et que l'étape contient les visites suivantes le "2025-07-02" :
      | titre   |
      | Cascade |
      | Volcan  |
    Quand je réordonne les visites du jour dans l'ordre suivant :
      | titre   |
      | Volcan  |
      | Cascade |
    Alors les positions des visites du "2025-07-01" sont inchangées
