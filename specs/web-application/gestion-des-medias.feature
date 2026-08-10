# language: fr

Fonctionnalité: Réaffectation des médias
  En tant qu'éditeur
  Je veux pouvoir changer l'appartenance de plusieurs médias
  Afin de corriger leur classement dans le récit du voyage

  Contexte:
    Etant donné que je suis connecté en tant qu'administrateur
    Et qu'un voyage "Road trip en Islande" existe et n'est pas clôturé

  Scénario: Déplacer des photos d'une visite vers une autre visite
    Etant donné que la visite "2025-07-01" contient les photos "eglise.jpg" et "port.jpg"
    Et qu'une autre visite "2025-07-02" existe dans le même voyage
    Quand je sélectionne les photos "eglise.jpg" et "port.jpg"
    Alors le bouton "Déplacer vers" apparaît
    Quand je clique sur "Déplacer vers"
    Alors une modale de déplacement apparaît
    Quand je choisis la visite "2025-07-02" et confirme
    Alors les photos ne sont plus associées à la visite "2025-07-01"
    Et les photos sont associées à la visite "2025-07-02"

  Scénario: Déplacer des photos d'un trajet vers un autre trajet
    Etant donné que le trajet "Reykjavik - Vik" contient les photos "route.jpg" et "falaise.jpg"
    Et qu'un autre trajet "Vik - Höfn" existe dans le même voyage
    Quand je sélectionne les photos "route.jpg" et "falaise.jpg"
    Alors le bouton "Déplacer vers" apparaît
    Quand je clique sur "Déplacer vers"
    Alors une modale de déplacement apparaît
    Quand je choisis le trajet "Vik - Höfn" et confirme
    Alors les photos ne sont plus associées au trajet "Reykjavik - Vik"
    Et les photos sont associées au trajet "Vik - Höfn"

  Scénario: Déplacer des photos entre une visite et un trajet dans les deux sens
    Etant donné que la visite "2025-07-03" contient la photo "cascade.jpg"
    Et que le trajet "Vik - Höfn" contient la photo "route.mp4"
    Quand je déplace "cascade.jpg" vers le trajet "Vik - Höfn"
    Et que je déplace "route.mp4" vers la visite "2025-07-03"
    Alors "cascade.jpg" est associée au trajet "Vik - Höfn"
    Et "route.mp4" est associée à la visite "2025-07-03"
