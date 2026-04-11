# language: fr

Fonctionnalité: Gestion des étapes et des jours d'un voyage
  En tant qu'administrateur
  Je veux pouvoir organiser un voyage en étapes et en jours
  Afin de structurer le récit de mon voyage par lieux visités

  Contexte:
    Etant donné que je suis connecté en tant qu'administrateur
    Et qu'un voyage "Road trip en Islande" existe et n'est pas clôturé

  # --- Gestion des étapes ---

  Scénario: Ajouter une étape avec un nom personnalisé
    Quand j'ajoute une étape avec les informations suivantes :
      | champ         | valeur                |
      | ville         | Grindavík             |
      | nom           | Blue Lagoon           |
      | latitude      | 63.8804               |
      | longitude     | -22.4495              |
      | description   | Bain géothermal       |
    Alors l'étape est ajoutée au voyage
    Et l'étape est affichée sous le nom "Blue Lagoon"

  Scénario: Ajouter une étape sans nom personnalisé
    Quand j'ajoute une étape avec les informations suivantes :
      | champ         | valeur               |
      | ville         | Reykjavik            |
      | latitude      | 64.1466              |
      | longitude     | -21.9426             |
      | description   | Capitale de l'Islande |
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
    Quand je modifie la description de l'étape
    Alors l'étape est mise à jour

  Scénario: Supprimer une étape demande confirmation
    Etant donné qu'une étape "Reykjavik" existe dans le voyage
    Quand je demande la suppression de l'étape
    Alors une confirmation m'est demandée

  Scénario: Confirmer la suppression d'une étape
    Etant donné qu'une confirmation de suppression est affichée pour l'étape "Reykjavik"
    Quand je confirme la suppression
    Alors l'étape est supprimée
    Et les jours rattachés uniquement à cette étape sont également supprimés
    Et les jours partagés avec d'autres étapes sont conservés

  Scénario: Impossible de modifier une étape d'un voyage clôturé
    Etant donné qu'un voyage "Japon 2024" est clôturé
    Alors je ne peux pas modifier les étapes du voyage "Japon 2024"

  # --- Gestion des jours ---

  Scénario: Ajouter un jour à une étape
    Etant donné qu'une étape "Reykjavik" existe dans le voyage
    Quand j'ajoute un jour avec les informations suivantes :
      | champ       | valeur                           |
      | date        | 2025-07-01                       |
      | titre       | Arrivée et découverte du centre  |
      | description | Balade dans le centre historique |
      | latitude    | 64.1466                          |
      | longitude   | -21.9426                         |
    Alors le jour "2025-07-01" est ajouté à l'étape "Reykjavik"

  Scénario: La date du jour est obligatoire
    Etant donné qu'une étape "Reykjavik" existe dans le voyage
    Quand je tente d'ajouter un jour sans date
    Alors un message d'erreur m'indique que la date est obligatoire
    Et le jour n'est pas créé

  Scénario: Les coordonnées GPS du jour sont obligatoires
    Etant donné qu'une étape "Reykjavik" existe dans le voyage
    Quand je tente d'ajouter un jour sans coordonnées GPS
    Alors un message d'erreur m'indique que les coordonnées du jour sont obligatoires
    Et le jour n'est pas créé

  Scénario: Modifier un jour
    Etant donné qu'un jour "2025-07-01" existe dans l'étape "Reykjavik"
    Quand je modifie le titre du jour
    Alors le jour est mis à jour

  Scénario: Supprimer un jour après confirmation
    Etant donné qu'un jour "2025-07-01" existe dans l'étape "Reykjavik"
    Quand je supprime le jour après confirmation
    Alors le jour et ses photos/vidéos sont supprimés

  # --- Jours multi-étapes ---

  Scénario: Rattacher un jour existant à une deuxième étape
    Etant donné qu'un jour "2025-07-03" existe dans l'étape "Reykjavik"
    Et qu'une étape "Cercle d'Or" existe dans le voyage
    Quand je rattache le jour "2025-07-03" à l'étape "Cercle d'Or"
    Alors le jour "2025-07-03" apparaît dans l'étape "Reykjavik"
    Et le jour "2025-07-03" apparaît dans l'étape "Cercle d'Or"

  Scénario: Détacher un jour d'une étape
    Etant donné qu'un jour "2025-07-03" est rattaché aux étapes "Reykjavik" et "Cercle d'Or"
    Quand je détache le jour "2025-07-03" de l'étape "Reykjavik"
    Alors le jour n'apparaît plus dans l'étape "Reykjavik"
    Et le jour est conservé dans l'étape "Cercle d'Or"

  Scénario: Un jour doit toujours être rattaché à au moins une étape
    Etant donné qu'un jour "2025-07-03" est rattaché uniquement à l'étape "Cercle d'Or"
    Quand je tente de détacher le jour de l'étape "Cercle d'Or"
    Alors un message m'indique qu'un jour doit appartenir à au moins une étape

  # --- Photos et vidéos d'un jour ---

  Scénario: Ajouter des photos à un jour
    Etant donné qu'un jour "2025-07-01" existe dans l'étape "Reykjavik"
    Quand j'ajoute des photos au jour "2025-07-01"
    Alors les photos sont associées au jour
    Et elles sont visibles dans le jour "2025-07-01"

  Scénario: Ajouter des vidéos à un jour
    Etant donné qu'un jour "2025-07-01" existe dans l'étape "Reykjavik"
    Quand j'ajoute des vidéos au jour "2025-07-01"
    Alors les vidéos sont associées au jour
    Et elles sont visibles dans le jour "2025-07-01"

  Scénario: Ajouter plusieurs fichiers en une seule fois
    Etant donné qu'un jour "2025-07-01" existe dans l'étape "Reykjavik"
    Quand je sélectionne plusieurs photos et vidéos à la fois
    Et que je les ajoute au jour "2025-07-01"
    Alors tous les fichiers sont associés au jour

  Scénario: Supprimer une photo d'un jour
    Etant donné qu'un jour "2025-07-01" contient la photo "eglise.jpg"
    Quand je supprime la photo "eglise.jpg"
    Alors la photo n'est plus associée au jour
    Et le fichier est supprimé du stockage

  Scénario: Supprimer une vidéo d'un jour
    Etant donné qu'un jour "2025-07-01" contient la vidéo "balade.mp4"
    Quand je supprime la vidéo "balade.mp4"
    Alors la vidéo n'est plus associée au jour
    Et le fichier est supprimé du stockage

  Scénario: Impossible d'ajouter des médias à un voyage clôturé
    Etant donné qu'un voyage "Japon 2024" est clôturé
    Et qu'un jour "2024-03-15" existe dans le voyage "Japon 2024"
    Alors je ne peux pas ajouter de photos ou vidéos au jour "2024-03-15"

  # --- Extraction des métadonnées EXIF ---

  Scénario: Les métadonnées EXIF sont extraites à l'upload d'une photo
    Etant donné qu'un jour "2025-07-01" existe dans l'étape "Reykjavik"
    Quand j'ajoute une photo contenant des métadonnées EXIF
    Alors les métadonnées suivantes sont extraites et stockées :
      | métadonnée          |
      | date de prise de vue |
      | coordonnées GPS      |
      | orientation          |
      | modèle d'appareil    |
      | résolution           |

  Scénario: Une photo sans métadonnées EXIF est acceptée
    Etant donné qu'un jour "2025-07-01" existe dans l'étape "Reykjavik"
    Quand j'ajoute une photo sans métadonnées EXIF
    Alors la photo est ajoutée au jour sans métadonnées complémentaires

  Scénario: Suggestion automatique du jour à partir de la date EXIF
    Etant donné que le voyage contient les jours "2025-07-01", "2025-07-02" et "2025-07-03"
    Quand j'ajoute une photo dont la date EXIF est le 2025-07-02
    Alors l'application me suggère de rattacher la photo au jour "2025-07-02"

  Scénario: La date EXIF ne correspond à aucun jour existant
    Etant donné que le voyage contient les jours "2025-07-01" et "2025-07-02"
    Quand j'ajoute une photo dont la date EXIF est le 2025-07-05
    Alors l'application m'indique qu'aucun jour ne correspond
    Et je dois choisir manuellement le jour de rattachement

  Scénario: Placement automatique des photos géolocalisées sur la carte
    Etant donné qu'un jour "2025-07-01" contient des photos avec des coordonnées GPS
    Alors les photos sont positionnées sur la carte à leurs coordonnées GPS respectives

  Scénario: Les photos sans coordonnées GPS ne sont pas placées sur la carte
    Etant donné qu'un jour "2025-07-01" contient des photos sans coordonnées GPS
    Alors ces photos ne sont pas positionnées sur la carte
    Et elles restent visibles dans la galerie du jour

  # --- Ordre et navigation ---

  Scénario: Les jours d'une étape sont triés par date
    Etant donné que l'étape "Reykjavik" contient les jours suivants :
      | date       | titre              |
      | 2025-07-02 | Musées et port     |
      | 2025-07-01 | Arrivée            |
      | 2025-07-03 | Blue Lagoon        |
    Alors les jours sont affichés dans l'ordre : "2025-07-01", "2025-07-02", "2025-07-03"

  Scénario: Les étapes d'un voyage sont triées par date du premier jour
    Etant donné que le voyage contient les étapes suivantes :
      | étape       | premier_jour |
      | Vik         | 2025-07-05   |
      | Reykjavik   | 2025-07-01   |
      | Cercle d'Or | 2025-07-04   |
    Alors les étapes sont affichées dans l'ordre : "Reykjavik", "Cercle d'Or", "Vik"
