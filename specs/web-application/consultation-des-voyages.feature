# language: fr

Fonctionnalité: Consultation des voyages
  En tant qu'utilisateur connecté
  Je veux pouvoir consulter les voyages partagés
  Afin de revivre les expériences de voyage à travers les photos, vidéos et la carte

  # --- Restrictions d'accès ---

  Scénario: Un membre famille ne voit que les voyages publiés ou clôturés
    Etant donné que je suis connecté en tant que membre famille
    Et qu'un voyage "Islande" est publié
    Et qu'un voyage "Japon" est clôturé
    Et qu'un voyage "Maroc" est en brouillon
    Quand j'accède à la page d'accueil
    Alors je vois les voyages "Islande" et "Japon"
    Et je ne vois pas le voyage "Maroc"

  Scénario: Un membre famille ne peut pas créer de voyage
    Etant donné que je suis connecté en tant que membre famille
    Quand j'accède à la page d'accueil
    Alors je ne vois pas l'option de création de voyage

  Scénario: Un membre famille ne peut pas modifier un voyage
    Etant donné que je suis connecté en tant que membre famille
    Quand je consulte un voyage
    Alors je ne vois pas les options de modification

  Scénario: Un membre famille ne peut pas supprimer un voyage
    Etant donné que je suis connecté en tant que membre famille
    Quand je consulte un voyage
    Alors je ne vois pas l'option de suppression

  # --- Page d'accueil ---

  Scénario: Afficher la liste des voyages en page d'accueil
    Etant donné que je suis connecté
    Et que des voyages publiés ou clôturés existent
    Quand j'accède à la page d'accueil
    Alors les voyages sont affichés sous forme de vignettes
    Et chaque vignette montre la photo de couverture, le titre, le pays et les dates

  Scénario: Les voyages sont triés par date décroissante
    Etant donné que je suis connecté
    Et que les voyages publiés suivants existent :
      | titre          | date_debut |
      | Japon 2024     | 2024-03-15 |
      | Islande 2025   | 2025-07-01 |
    Alors les voyages sont affichés dans l'ordre : "Islande 2025", "Japon 2024"

  Scénario: Accéder à un voyage depuis la page d'accueil
    Etant donné que je suis connecté
    Quand je clique sur la vignette du voyage "Road trip en Islande"
    Alors je suis redirigé vers la page du voyage

  # --- Carte monde (page d'accueil) ---

  Scénario: Afficher la carte monde avec les pays visités
    Etant donné que je suis connecté
    Et que des voyages publiés ou clôturés existent pour les pays "Islande", "Japon" et "Maroc"
    Quand j'accède à la page d'accueil
    Alors une carte du monde est affichée
    Et un marqueur est positionné pour chaque pays ayant au moins un voyage

  Scénario: Cliquer sur un marqueur pays affiche les voyages associés
    Etant donné que la carte monde est affichée
    Et que le pays "Islande" a 2 voyages
    Quand je clique sur le marqueur "Islande"
    Alors la liste des voyages en Islande est affichée

  Scénario: La carte monde ne montre que les voyages visibles par l'utilisateur
    Etant donné que je suis connecté en tant que membre famille
    Et qu'un voyage en "Islande" est publié
    Et qu'un voyage au "Japon" est en brouillon
    Quand j'accède à la page d'accueil
    Alors seul le marqueur "Islande" est affiché sur la carte

  Scénario: Naviguer de la carte monde vers un voyage
    Etant donné que la carte monde est affichée
    Quand je clique sur le marqueur "Islande"
    Et que je sélectionne le voyage "Road trip en Islande"
    Alors je suis redirigé vers la page du voyage

  # --- Navigation dans un voyage ---

  Scénario: Consulter un voyage en vue timeline chronologique
    Etant donné que je consulte le voyage "Road trip en Islande"
    Quand je sélectionne la vue "Timeline"
    Alors les jours sont affichés chronologiquement
    Et les étapes apparaissent comme séparateurs entre les groupes de jours

  Scénario: Consulter un voyage en vue par étapes
    Etant donné que je consulte le voyage "Road trip en Islande"
    Quand je sélectionne la vue "Étapes"
    Alors les étapes sont listées dans l'ordre chronologique
    Et chaque étape affiche son nom, sa ville et le nombre de jours

  Scénario: Basculer entre les deux vues
    Etant donné que je consulte le voyage "Road trip en Islande" en vue "Timeline"
    Quand je bascule vers la vue "Étapes"
    Alors la vue change sans recharger la page

  Scénario: Consulter le détail d'une étape
    Etant donné que je consulte le voyage "Road trip en Islande"
    Quand je sélectionne l'étape "Reykjavik"
    Alors je vois la description de l'étape
    Et je vois la liste des jours rattachés à cette étape

  Scénario: Consulter le détail d'un jour
    Etant donné que je consulte l'étape "Reykjavik"
    Quand je sélectionne le jour "2025-07-01"
    Alors je vois le titre et la description du jour
    Et je vois les photos et vidéos du jour

  # --- Carte voyage (page d'un voyage) ---

  Scénario: Afficher la carte d'un voyage avec ses étapes
    Etant donné que je consulte le voyage "Road trip en Islande"
    Et que le voyage contient les étapes "Reykjavik", "Cercle d'Or" et "Vik"
    Alors une carte est affichée avec un marqueur pour chaque étape
    Et la carte est centrée et zoomée pour afficher toutes les étapes

  Scénario: Le tracé relie les étapes dans l'ordre chronologique
    Etant donné que je consulte le voyage "Road trip en Islande"
    Et que les étapes sont dans l'ordre : "Reykjavik", "Cercle d'Or", "Vik"
    Alors une ligne droite relie "Reykjavik" à "Cercle d'Or"
    Et une ligne droite relie "Cercle d'Or" à "Vik"

  Scénario: Cliquer sur un marqueur d'étape affiche les détails
    Etant donné que la carte du voyage est affichée
    Quand je clique sur le marqueur de l'étape "Reykjavik"
    Alors un résumé de l'étape est affiché avec son nom, sa ville et sa description

  Scénario: Naviguer de la carte voyage vers une étape
    Etant donné que la carte du voyage "Road trip en Islande" est affichée
    Quand je clique sur le marqueur de l'étape "Reykjavik"
    Et que je clique sur le lien vers l'étape
    Alors je suis redirigé vers la page de l'étape "Reykjavik"

  Scénario: Un voyage sans étape affiche une carte vide
    Etant donné que je consulte un voyage sans étape
    Alors la carte est affichée sans marqueur ni tracé

  # --- Carte étape (page d'une étape) ---

  Scénario: Afficher la carte zoomée d'une étape
    Etant donné que je consulte l'étape "Reykjavik" du voyage "Road trip en Islande"
    Alors une carte est affichée centrée sur les coordonnées GPS de l'étape "Reykjavik"

  Scénario: La carte d'une étape affiche le marqueur de l'étape
    Etant donné que je consulte l'étape "Reykjavik"
    Alors le marqueur de l'étape est affiché sur la carte

  # --- Galerie photos et vidéos ---

  Scénario: Afficher la galerie d'un jour sous forme de grille
    Etant donné que je consulte le jour "2025-07-01" de l'étape "Reykjavik"
    Et que le jour contient des photos et des vidéos
    Alors les médias sont affichés sous forme de grille de miniatures

  Scénario: Lancer un diaporama depuis la galerie
    Etant donné que je consulte la galerie du jour "2025-07-01"
    Quand je lance le diaporama
    Alors les photos défilent automatiquement en plein écran

  Scénario: Naviguer dans le diaporama manuellement
    Etant donné que le diaporama est en cours
    Alors je peux passer à la photo suivante
    Et je peux revenir à la photo précédente
    Et je peux quitter le diaporama

  Scénario: Les vidéos sont lisibles dans la galerie
    Etant donné que je consulte la galerie du jour "2025-07-01"
    Et qu'une vidéo est présente
    Quand je clique sur la vidéo
    Alors la vidéo est lue avec les contrôles de lecture (play, pause, volume)

  Scénario: Afficher une photo en plein écran depuis la grille
    Etant donné que je consulte la galerie du jour "2025-07-01"
    Quand je clique sur une miniature de photo
    Alors la photo est affichée en plein écran
    Et je peux naviguer vers la photo suivante ou précédente
