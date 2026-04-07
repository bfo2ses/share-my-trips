# language: fr

Fonctionnalité: Gestion des étapes d'un voyage
  En tant qu'administrateur
  Je veux organiser un voyage en étapes géographiques
  Afin de structurer le récit par lieux visités

  Contexte:
    Etant donné qu'un voyage "Road trip en Islande" existe et n'est pas clôturé

  Scénario: Ajouter une étape avec un nom personnalisé
    Quand j'ajoute une étape avec les informations suivantes :
      | champ       | valeur          |
      | ville       | Grindavík       |
      | nom         | Blue Lagoon     |
      | latitude    | 63.8804         |
      | longitude   | -22.4495        |
      | description | Bain géothermal |
    Alors l'étape est ajoutée au voyage
    Et l'étape est affichée sous le nom "Blue Lagoon"

  Scénario: Ajouter une étape sans nom personnalisé
    Quand j'ajoute une étape avec les informations suivantes :
      | champ       | valeur                 |
      | ville       | Reykjavik              |
      | latitude    | 64.1466                |
      | longitude   | -21.9426               |
      | description | Capitale de l'Islande  |
    Alors l'étape est ajoutée au voyage
    Et l'étape est affichée sous le nom "Reykjavik"

  Scénario: La ville est obligatoire
    Quand je tente d'ajouter une étape sans renseigner la ville
    Alors un message d'erreur m'indique que la ville est obligatoire
    Et l'étape n'est pas créée

  Scénario: Les coordonnées GPS sont obligatoires
    Quand je tente d'ajouter une étape sans coordonnées GPS
    Alors un message d'erreur m'indique que les coordonnées sont obligatoires
    Et l'étape n'est pas créée

  Scénario: Modifier une étape
    Etant donné qu'une étape "Reykjavik" existe dans le voyage
    Quand je modifie la description de l'étape avec "Nouvelle description"
    Alors l'étape est mise à jour avec la description "Nouvelle description"

  Scénario: Supprimer une étape supprime les jours orphelins
    Etant donné qu'une étape "Reykjavik" existe dans le voyage
    Quand je supprime l'étape "Reykjavik"
    Alors l'étape n'existe plus

  Scénario: Impossible de modifier une étape d'un voyage clôturé
    Etant donné qu'un voyage "Japon 2024" est clôturé
    Et qu'une étape "Tokyo" existe dans le voyage "Japon 2024"
    Quand je tente de modifier l'étape "Tokyo"
    Alors un message d'erreur m'indique que le voyage est clôturé

  Scénario: Impossible d'ajouter une étape à un voyage clôturé
    Etant donné qu'un voyage "Japon 2024" est clôturé
    Quand je tente d'ajouter une étape au voyage clôturé
    Alors un message d'erreur m'indique que le voyage est clôturé

  Scénario: Impossible de supprimer une étape d'un voyage clôturé
    Etant donné qu'un voyage "Japon 2024" est clôturé
    Et qu'une étape "Tokyo" existe dans le voyage "Japon 2024"
    Quand je tente de supprimer l'étape "Tokyo"
    Alors un message d'erreur m'indique que le voyage est clôturé
