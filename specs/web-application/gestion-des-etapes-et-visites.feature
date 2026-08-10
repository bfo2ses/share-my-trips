# language: fr

Fonctionnalité: Gestion des étapes et des visites d'un voyage
  En tant qu'administrateur
  Je veux pouvoir organiser un voyage en étapes et en visites
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
    Et les visites rattachées uniquement à cette étape sont également supprimées
    Et les visites partagées avec d'autres étapes sont conservées

  Scénario: Impossible de modifier une étape d'un voyage clôturé
    Etant donné qu'un voyage "Japon 2024" est clôturé
    Alors je ne peux pas modifier les étapes du voyage "Japon 2024"

  # --- Gestion des visites ---

  Scénario: Ajouter une visite à une étape
    Etant donné qu'une étape "Reykjavik" existe dans le voyage
    Quand j'ajoute une visite avec les informations suivantes :
      | champ       | valeur                           |
      | date        | 2025-07-01                       |
      | titre       | Arrivée et découverte du centre  |
      | description | Balade dans le centre historique |
      | latitude    | 64.1466                          |
      | longitude   | -21.9426                         |
    Alors la visite "2025-07-01" est ajoutée à l'étape "Reykjavik"

  Scénario: La date de la visite est obligatoire
    Etant donné qu'une étape "Reykjavik" existe dans le voyage
    Quand je tente d'ajouter une visite sans date
    Alors un message d'erreur m'indique que la date est obligatoire
    Et la visite n'est pas créée

  Scénario: Les coordonnées GPS de la visite sont obligatoires
    Etant donné qu'une étape "Reykjavik" existe dans le voyage
    Quand je tente d'ajouter une visite sans coordonnées GPS
    Alors un message d'erreur m'indique que les coordonnées de la visite sont obligatoires
    Et la visite n'est pas créée

  Scénario: Modifier une visite
    Etant donné qu'une visite "2025-07-01" existe dans l'étape "Reykjavik"
    Quand je modifie le titre de la visite
    Alors la visite est mise à jour

  Scénario: Supprimer une visite après confirmation
    Etant donné qu'une visite "2025-07-01" existe dans l'étape "Reykjavik"
    Quand je supprime la visite après confirmation
    Alors la visite et ses photos/vidéos sont supprimées

  # --- Visites multi-étapes ---

  Scénario: Rattacher une visite existante à une deuxième étape
    Etant donné qu'une visite "2025-07-03" existe dans l'étape "Reykjavik"
    Et qu'une étape "Cercle d'Or" existe dans le voyage
    Quand je rattache la visite "2025-07-03" à l'étape "Cercle d'Or"
    Alors la visite "2025-07-03" apparaît dans l'étape "Reykjavik"
    Et la visite "2025-07-03" apparaît dans l'étape "Cercle d'Or"

  Scénario: Détacher une visite d'une étape
    Etant donné qu'une visite "2025-07-03" est rattachée aux étapes "Reykjavik" et "Cercle d'Or"
    Quand je détache la visite "2025-07-03" de l'étape "Reykjavik"
    Alors la visite n'apparaît plus dans l'étape "Reykjavik"
    Et la visite est conservée dans l'étape "Cercle d'Or"

  Scénario: Une visite doit toujours être rattachée à au moins une étape
    Etant donné qu'une visite "2025-07-03" est rattachée uniquement à l'étape "Cercle d'Or"
    Quand je tente de détacher la visite de l'étape "Cercle d'Or"
    Alors un message m'indique qu'une visite doit appartenir à au moins une étape

  # --- Photos et vidéos d'une visite ---

  Scénario: Ajouter des photos à une visite
    Etant donné qu'une visite "2025-07-01" existe dans l'étape "Reykjavik"
    Quand j'ajoute des photos à la visite "2025-07-01"
    Alors les photos sont associées à la visite
    Et elles sont visibles dans la visite "2025-07-01"

  Scénario: Ajouter des vidéos à une visite
    Etant donné qu'une visite "2025-07-01" existe dans l'étape "Reykjavik"
    Quand j'ajoute des vidéos à la visite "2025-07-01"
    Alors les vidéos sont associées à la visite
    Et elles sont visibles dans la visite "2025-07-01"

  Scénario: Ajouter plusieurs fichiers en une seule fois
    Etant donné qu'une visite "2025-07-01" existe dans l'étape "Reykjavik"
    Quand je sélectionne plusieurs photos et vidéos à la fois
    Et que je les ajoute à la visite "2025-07-01"
    Alors tous les fichiers sont associés à la visite

  Scénario: Supprimer une photo d'une visite via la sélection multiple
    Etant donné qu'une visite "2025-07-01" contient la photo "eglise.jpg"
    Quand je sélectionne la photo "eglise.jpg"
    Et que je confirme la suppression de la sélection
    Alors la photo n'est plus associée à la visite
    Et le fichier est supprimé du stockage

  Scénario: Supprimer une vidéo d'une visite via la sélection multiple
    Etant donné qu'une visite "2025-07-01" contient la vidéo "balade.mp4"
    Quand je sélectionne la vidéo "balade.mp4"
    Et que je confirme la suppression de la sélection
    Alors la vidéo n'est plus associée à la visite
    Et le fichier est supprimé du stockage

  Scénario: Impossible d'ajouter des médias à un voyage clôturé
    Etant donné qu'un voyage "Japon 2024" est clôturé
    Et qu'une visite "2024-03-15" existe dans le voyage "Japon 2024"
    Alors je ne peux pas ajouter de photos ou vidéos à la visite "2024-03-15"

  # --- Extraction des métadonnées EXIF ---

  Scénario: Les métadonnées EXIF sont extraites à l'upload d'une photo
    Etant donné qu'une visite "2025-07-01" existe dans l'étape "Reykjavik"
    Quand j'ajoute une photo contenant des métadonnées EXIF
    Alors les métadonnées suivantes sont extraites et stockées :
      | métadonnée          |
      | date de prise de vue |
      | coordonnées GPS      |
      | orientation          |
      | modèle d'appareil    |
      | résolution           |

  Scénario: Une photo sans métadonnées EXIF est acceptée
    Etant donné qu'une visite "2025-07-01" existe dans l'étape "Reykjavik"
    Quand j'ajoute une photo sans métadonnées EXIF
    Alors la photo est ajoutée à la visite sans métadonnées complémentaires

  Scénario: Suggestion automatique de la visite à partir de la date EXIF
    Etant donné que le voyage contient les visites "2025-07-01", "2025-07-02" et "2025-07-03"
    Quand j'ajoute une photo dont la date EXIF est le 2025-07-02
    Alors l'application me suggère de rattacher la photo à la visite "2025-07-02"

  Scénario: La date EXIF ne correspond à aucune visite existante
    Etant donné que le voyage contient les visites "2025-07-01" et "2025-07-02"
    Quand j'ajoute une photo dont la date EXIF est le 2025-07-05
    Alors l'application m'indique qu'aucune visite ne correspond
    Et je dois choisir manuellement la visite de rattachement

  Scénario: Placement automatique des photos géolocalisées sur la carte
    Etant donné qu'une visite "2025-07-01" contient des photos avec des coordonnées GPS
    Alors les photos sont positionnées sur la carte à leurs coordonnées GPS respectives

  Scénario: Les photos sans coordonnées GPS ne sont pas placées sur la carte
    Etant donné qu'une visite "2025-07-01" contient des photos sans coordonnées GPS
    Alors ces photos ne sont pas positionnées sur la carte
    Et elles restent visibles dans la galerie de la visite

  # --- Ordre et navigation ---

  Scénario: Les visites d'une étape sont triées par date
    Etant donné que l'étape "Reykjavik" contient les visites suivantes :
      | date       | titre              |
      | 2025-07-02 | Musées et port     |
      | 2025-07-01 | Arrivée            |
      | 2025-07-03 | Blue Lagoon        |
    Alors les visites sont affichées dans l'ordre : "2025-07-01", "2025-07-02", "2025-07-03"

  Scénario: Les étapes d'un voyage sont triées par date de la première visite
    Etant donné que le voyage contient les étapes suivantes :
      | étape       | première_visite |
      | Vik         | 2025-07-05       |
      | Reykjavik   | 2025-07-01       |
      | Cercle d'Or | 2025-07-04       |
    Alors les étapes sont affichées dans l'ordre : "Reykjavik", "Cercle d'Or", "Vik"

  # --- Réordonnancement des visites du même jour ---

  Scénario: Une nouvelle visite est ajoutée en dernière position du jour
    Etant donné que l'étape "Reykjavik" contient les visites suivantes le "2025-07-01" :
      | titre  |
      | Musée  |
      | Marché |
    Quand j'ajoute une visite à l'étape "Reykjavik" avec les informations suivantes :
      | champ | valeur     |
      | date  | 2025-07-01 |
      | titre | Port       |
    Alors les visites du "2025-07-01" de l'étape "Reykjavik" sont affichées dans l'ordre : "Musée", "Marché", "Port"

  Scénario: Réordonner les visites d'un même jour par glisser-déposer
    Etant donné que l'étape "Reykjavik" contient les visites suivantes le "2025-07-01" :
      | titre  |
      | Musée  |
      | Marché |
      | Port   |
    Quand je réordonne les visites du "2025-07-01" dans l'ordre : "Port", "Musée", "Marché"
    Alors les visites du "2025-07-01" de l'étape "Reykjavik" sont affichées dans l'ordre : "Port", "Musée", "Marché"

  Scénario: Déplacer une visite vers un autre jour la place en fin de son nouveau jour
    Etant donné que l'étape "Reykjavik" contient les visites suivantes le "2025-07-02" :
      | titre   |
      | Cascade |
      | Volcan  |
    Et qu'une visite "Arrivée" existe le "2025-07-01" dans l'étape "Reykjavik"
    Quand je modifie la date de la visite "Arrivée" au "2025-07-02"
    Alors les visites du "2025-07-02" de l'étape "Reykjavik" sont affichées dans l'ordre : "Cascade", "Volcan", "Arrivée"
