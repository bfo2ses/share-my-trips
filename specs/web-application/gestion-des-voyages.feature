# language: fr

Fonctionnalité: Gestion des voyages
  En tant qu'administrateur
  Je veux pouvoir créer, modifier et supprimer des voyages
  Afin de partager mes expériences de voyage avec ma famille

  # --- Création d'un voyage ---

  Scénario: Créer un nouveau voyage avec toutes les informations
    Etant donné que je suis connecté en tant qu'administrateur
    Quand je crée un nouveau voyage avec les informations suivantes :
      | champ             | valeur                     |
      | titre             | Road trip en Islande       |
      | pays              | Islande                    |
      | latitude          | 64.1466                    |
      | longitude         | -21.9426                   |
      | date_debut        | 2025-07-01                 |
      | date_fin          | 2025-07-14                 |
      | description       | 2 semaines autour de l'île |
      | photo_couverture  | islande_cover.jpg          |
    Alors le voyage "Road trip en Islande" est créé avec le statut "brouillon"
    Et les dates affichées sont du 2025-07-01 au 2025-07-14
    Et le voyage apparaît dans ma liste de voyages

  Scénario: Créer un voyage sans photo de couverture
    Etant donné que je suis connecté en tant qu'administrateur
    Quand je crée un voyage sans photo de couverture
    Alors le voyage est créé avec une image par défaut

  Scénario: Le pays est obligatoire
    Etant donné que je suis connecté en tant qu'administrateur
    Quand je tente de créer un voyage sans renseigner le pays
    Alors un message d'erreur m'indique que le pays est obligatoire
    Et le voyage n'est pas créé

  Scénario: Le titre est obligatoire
    Etant donné que je suis connecté en tant qu'administrateur
    Quand je tente de créer un voyage sans renseigner le titre
    Alors un message d'erreur m'indique que le titre est obligatoire
    Et le voyage n'est pas créé

  Scénario: Les coordonnées GPS sont obligatoires
    Etant donné que je suis connecté en tant qu'administrateur
    Quand je tente de créer un voyage sans coordonnées GPS
    Alors un message d'erreur m'indique que les coordonnées du voyage sont obligatoires
    Et le voyage n'est pas créé

  Scénario: Les dates doivent être cohérentes
    Etant donné que je suis connecté en tant qu'administrateur
    Quand je crée un voyage avec une date de fin antérieure à la date de début
    Alors un message d'erreur m'indique que les dates sont incohérentes
    Et le voyage n'est pas créé

  # --- Visibilité et cycle de vie ---

  Scénario: Un voyage créé est en brouillon par défaut
    Etant donné que je suis connecté en tant qu'administrateur
    Quand je crée un nouveau voyage
    Alors son statut est "brouillon"

  Scénario: Publier un voyage
    Etant donné que je suis connecté en tant qu'administrateur
    Et qu'un voyage "Road trip en Islande" existe en brouillon
    Quand je publie le voyage
    Alors son statut passe à "publié"

  Scénario: Un voyage publié reste modifiable
    Etant donné que je suis connecté en tant qu'administrateur
    Et qu'un voyage "Road trip en Islande" est publié
    Alors je peux modifier ses informations
    Et je peux ajouter des jours et des étapes
    Et je peux ajouter des photos et des vidéos

  Scénario: Repasser un voyage publié en brouillon
    Etant donné que je suis connecté en tant qu'administrateur
    Et qu'un voyage "Road trip en Islande" est publié
    Quand je repasse le voyage en brouillon
    Alors son statut passe à "brouillon"

  # --- Clôture ---

  Scénario: Clôturer un voyage publié
    Etant donné que je suis connecté en tant qu'administrateur
    Et qu'un voyage "Road trip en Islande" est publié
    Et que le voyage contient des jours du 2025-07-02 au 2025-07-15
    Quand je clôture le voyage
    Alors son statut passe à "clôturé"
    Et les dates du voyage sont recalculées du 2025-07-02 au 2025-07-15

  Scénario: Un voyage clôturé n'est plus modifiable
    Etant donné que je suis connecté en tant qu'administrateur
    Et qu'un voyage "Road trip en Islande" est clôturé
    Alors je ne peux plus modifier ses informations
    Et je ne peux plus ajouter de jours ou d'étapes
    Et je ne peux plus ajouter de photos ou de vidéos

  Scénario: Impossible de clôturer un voyage sans jours
    Etant donné que je suis connecté en tant qu'administrateur
    Et qu'un voyage publié existe sans aucun jour
    Quand je tente de clôturer le voyage
    Alors un message m'indique qu'il faut au moins un jour pour clôturer

  Scénario: Impossible de clôturer un voyage en brouillon
    Etant donné que je suis connecté en tant qu'administrateur
    Et qu'un voyage "Road trip en Islande" est en brouillon
    Alors l'option de clôture n'est pas disponible

  Scénario: Réouvrir un voyage clôturé
    Etant donné que je suis connecté en tant qu'administrateur
    Et qu'un voyage "Road trip en Islande" est clôturé
    Quand je réouvre le voyage
    Alors son statut passe à "publié"
    Et je peux à nouveau le modifier

  # --- Modification d'un voyage ---

  Scénario: Modifier les informations d'un voyage existant
    Etant donné que je suis connecté en tant qu'administrateur
    Et qu'un voyage "Road trip en Islande" existe
    Quand je modifie le titre en "Islande - été 2025"
    Alors le voyage est mis à jour avec le nouveau titre

  Scénario: Modifier la photo de couverture
    Etant donné que je suis connecté en tant qu'administrateur
    Et qu'un voyage "Road trip en Islande" existe
    Quand je remplace la photo de couverture par une nouvelle image
    Alors la nouvelle photo de couverture est affichée

  Scénario: Modifier le pays d'un voyage
    Etant donné que je suis connecté en tant qu'administrateur
    Et qu'un voyage "Road trip en Islande" existe avec le pays "Islande"
    Quand je modifie le pays en "Islande, Groenland"
    Alors le pays du voyage est mis à jour

  # --- Suppression d'un voyage ---

  Scénario: Supprimer un voyage demande confirmation
    Etant donné que je suis connecté en tant qu'administrateur
    Et qu'un voyage "Road trip en Islande" existe
    Quand je demande la suppression du voyage
    Alors une confirmation m'est demandée

  Scénario: Confirmer la suppression
    Etant donné qu'une confirmation de suppression est affichée pour "Road trip en Islande"
    Quand je confirme la suppression
    Alors le voyage et tout son contenu sont supprimés définitivement
    Et il n'apparaît plus dans aucune liste

  Scénario: Annuler la suppression
    Etant donné qu'une confirmation de suppression est affichée pour "Road trip en Islande"
    Quand j'annule la suppression
    Alors le voyage est conservé intact

  # --- Tri ---

  Scénario: Les voyages sont triés par date décroissante
    Etant donné que je suis connecté en tant qu'administrateur
    Et que les voyages suivants existent :
      | titre          | date_debut |
      | Japon 2024     | 2024-03-15 |
      | Islande 2025   | 2025-07-01 |
      | Maroc 2023     | 2023-11-10 |
    Alors les voyages sont affichés dans l'ordre : "Islande 2025", "Japon 2024", "Maroc 2023"
