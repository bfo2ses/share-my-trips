# language: fr

Fonctionnalité: Gestion des jours d'un voyage
  En tant qu'administrateur
  Je veux gérer les jours rattachés aux étapes de mon voyage
  Afin de détailler chaque journée

  Contexte:
    Etant donné qu'un voyage "Road trip en Islande" existe et n'est pas clôturé
    Et qu'une étape "Reykjavik" existe dans le voyage

  Scénario: Ajouter un jour à une étape
    Quand j'ajoute un jour avec les informations suivantes :
      | champ       | valeur                          |
      | date        | 2025-07-01                      |
      | titre       | Arrivée et découverte du centre |
      | description | Balade dans le centre historique |
    Alors le jour est ajouté à l'étape
    Et la date du jour est "2025-07-01"

  Scénario: La date du jour est obligatoire
    Quand je tente d'ajouter un jour sans date
    Alors un message d'erreur m'indique que la date est obligatoire
    Et le jour n'est pas créé

  Scénario: Modifier un jour
    Etant donné qu'un jour "2025-07-01" existe dans l'étape
    Quand je modifie le titre du jour avec "Nouveau titre"
    Alors le jour est mis à jour avec le titre "Nouveau titre"

  Scénario: Supprimer un jour
    Etant donné qu'un jour "2025-07-01" existe dans l'étape
    Quand je supprime le jour
    Alors le jour n'existe plus

  Scénario: Rattacher un jour existant à une deuxième étape
    Etant donné qu'un jour "2025-07-03" existe dans l'étape
    Et qu'une étape "Cercle d'Or" existe dans le voyage
    Quand je rattache le jour à l'étape "Cercle d'Or"
    Alors le jour apparaît dans l'étape "Reykjavik"
    Et le jour apparaît dans l'étape "Cercle d'Or"

  Scénario: Détacher un jour d'une étape
    Etant donné qu'un jour "2025-07-03" est rattaché aux étapes "Reykjavik" et "Cercle d'Or"
    Quand je détache le jour de l'étape "Reykjavik"
    Alors le jour n'apparaît plus dans l'étape "Reykjavik"
    Et le jour est conservé dans l'étape "Cercle d'Or"

  Scénario: Un jour doit toujours être rattaché à au moins une étape
    Etant donné qu'un jour "2025-07-03" existe dans l'étape
    Quand je tente de détacher le jour de sa seule étape
    Alors un message d'erreur m'indique qu'un jour doit appartenir à au moins une étape

  Scénario: Impossible d'ajouter un jour à un voyage clôturé
    Etant donné qu'un voyage "Japon 2024" est clôturé
    Quand je tente d'ajouter un jour au voyage clôturé
    Alors un message d'erreur m'indique que le voyage est clôturé pour les jours

  Scénario: Impossible de modifier un jour d'un voyage clôturé
    Etant donné qu'un voyage "Japon 2024" est clôturé
    Et qu'un jour "2024-03-15" existe dans le voyage clôturé
    Quand je tente de modifier le jour du voyage clôturé
    Alors un message d'erreur m'indique que le voyage est clôturé pour les jours

  Scénario: Impossible d'ajouter un jour avec une étape d'un autre voyage
    Etant donné qu'une étape "Paris" appartient à un autre voyage
    Quand je tente d'ajouter un jour avec l'étape de l'autre voyage
    Alors un message d'erreur m'indique que l'étape n'appartient pas au voyage
    Et le jour n'est pas créé

  Scénario: Impossible de rattacher un jour à une étape d'un autre voyage
    Etant donné qu'un jour "2025-07-01" existe dans l'étape
    Et qu'une étape "Paris" appartient à un autre voyage
    Quand je tente de rattacher le jour à l'étape de l'autre voyage
    Alors un message d'erreur m'indique que l'étape n'appartient pas au voyage

  Scénario: Les jours d'une étape sont triés par date
    Etant donné que l'étape contient les jours suivants :
      | date       | titre          |
      | 2025-07-02 | Musées et port |
      | 2025-07-01 | Arrivée        |
      | 2025-07-03 | Blue Lagoon    |
    Alors les jours sont affichés dans l'ordre : "2025-07-01", "2025-07-02", "2025-07-03"
