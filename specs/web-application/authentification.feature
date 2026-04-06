# language: fr

Fonctionnalité: Authentification et gestion des comptes
  En tant qu'utilisateur de l'application
  Je veux pouvoir m'authentifier avec mon compte
  Afin d'accéder aux voyages selon mon rôle

  # --- Setup initial (premier lancement) ---

  Scénario: Création du compte administrateur au premier lancement
    Etant donné que l'application est lancée pour la première fois
    Et qu'aucun compte n'existe en base de données
    Alors un formulaire de création du compte administrateur est affiché

  Scénario: Renseigner les informations du compte administrateur
    Etant donné que le formulaire de création du compte administrateur est affiché
    Quand je renseigne les informations suivantes :
      | champ                    | valeur              |
      | nom                      | Benjamin            |
      | email                    | admin@example.com   |
      | mot_de_passe             | MonMotDePasse123!   |
      | confirmation_mot_de_passe | MonMotDePasse123!  |
    Alors le compte administrateur est créé
    Et je suis connecté automatiquement

  Scénario: Les mots de passe doivent correspondre
    Etant donné que le formulaire de création du compte administrateur est affiché
    Quand je renseigne un mot de passe et une confirmation différents
    Alors un message d'erreur m'indique que les mots de passe ne correspondent pas

  Scénario: Le setup initial n'est plus accessible après création de l'admin
    Etant donné qu'un compte administrateur existe
    Quand je tente d'accéder au formulaire de setup initial
    Alors je suis redirigé vers la page de connexion

  # --- Connexion ---

  Scénario: Se connecter avec des identifiants valides
    Etant donné que je suis sur la page de connexion
    Quand je renseigne un email et un mot de passe valides
    Alors je suis connecté et redirigé vers la page d'accueil

  Scénario: Se connecter avec un email inconnu
    Etant donné que je suis sur la page de connexion
    Quand je renseigne un email qui n'existe pas
    Alors un message d'erreur m'indique que les identifiants sont incorrects

  Scénario: Se connecter avec un mot de passe incorrect
    Etant donné que je suis sur la page de connexion
    Quand je renseigne un email valide avec un mot de passe incorrect
    Alors un message d'erreur m'indique que les identifiants sont incorrects

  Scénario: Le message d'erreur ne distingue pas email et mot de passe
    Etant donné que je suis sur la page de connexion
    Quand je renseigne des identifiants incorrects
    Alors le message d'erreur est le même que l'email soit inconnu ou le mot de passe incorrect

  Scénario: Se déconnecter
    Etant donné que je suis connecté
    Quand je me déconnecte
    Alors je suis redirigé vers la page de connexion
    Et je ne peux plus accéder aux pages protégées

  # --- Accès protégé ---

  Scénario: Accéder à une page protégée sans être connecté
    Etant donné que je ne suis pas connecté
    Quand je tente d'accéder à une page de l'application
    Alors je suis redirigé vers la page de connexion

  # --- Gestion des comptes famille (admin) ---

  Scénario: Créer un compte famille
    Etant donné que je suis connecté en tant qu'administrateur
    Quand je crée un compte famille avec les informations suivantes :
      | champ                    | valeur               |
      | nom                      | Tonton Robert        |
      | email                    | tonton@example.com   |
      | mot_de_passe             | MotDePasse456!       |
      | confirmation_mot_de_passe | MotDePasse456!      |
    Alors le compte famille "Tonton Robert" est créé
    Et il peut se connecter avec ses identifiants

  Scénario: Impossible de créer un compte avec un email déjà utilisé
    Etant donné que je suis connecté en tant qu'administrateur
    Et qu'un compte existe avec l'email "tonton@example.com"
    Quand je tente de créer un compte avec le même email
    Alors un message d'erreur m'indique que l'email est déjà utilisé

  Scénario: Supprimer un compte famille
    Etant donné que je suis connecté en tant qu'administrateur
    Et qu'un compte famille "Tonton Robert" existe
    Quand je supprime le compte "Tonton Robert" après confirmation
    Alors le compte est supprimé
    Et "Tonton Robert" ne peut plus se connecter

  Scénario: L'administrateur ne peut pas supprimer son propre compte
    Etant donné que je suis connecté en tant qu'administrateur
    Alors l'option de suppression n'est pas disponible pour mon propre compte

  Scénario: Un membre famille ne peut pas gérer les comptes
    Etant donné que je suis connecté en tant que membre famille
    Alors je n'ai pas accès à la gestion des comptes

  # --- Réinitialisation du mot de passe ---

  Scénario: Demander une réinitialisation de mot de passe
    Etant donné que je suis sur la page de connexion
    Quand je clique sur "Mot de passe oublié"
    Et que je renseigne mon email
    Alors un email de réinitialisation m'est envoyé

  Scénario: Réinitialiser son mot de passe via le lien reçu
    Etant donné que j'ai reçu un email de réinitialisation
    Quand je clique sur le lien de réinitialisation
    Et que je renseigne un nouveau mot de passe et sa confirmation
    Alors mon mot de passe est mis à jour
    Et je peux me connecter avec le nouveau mot de passe

  Scénario: Le lien de réinitialisation expire après utilisation
    Etant donné que j'ai déjà utilisé un lien de réinitialisation
    Quand je tente de réutiliser le même lien
    Alors un message m'indique que le lien n'est plus valide

  Scénario: Le lien de réinitialisation expire après un délai
    Etant donné que j'ai reçu un email de réinitialisation il y a plus de 24 heures
    Quand je clique sur le lien de réinitialisation
    Alors un message m'indique que le lien a expiré
    Et je dois refaire une demande de réinitialisation

  Scénario: Demande de réinitialisation avec un email inconnu
    Etant donné que je suis sur la page de connexion
    Quand je demande une réinitialisation pour un email qui n'existe pas
    Alors le même message de confirmation est affiché que pour un email valide

  # --- Changement de mot de passe ---

  Scénario: Changer son mot de passe depuis son profil
    Etant donné que je suis connecté
    Quand j'accède à mon profil
    Et que je renseigne mon mot de passe actuel et un nouveau mot de passe
    Alors mon mot de passe est mis à jour

  Scénario: Le mot de passe actuel doit être correct pour le changer
    Etant donné que je suis connecté
    Quand je tente de changer mon mot de passe avec un mot de passe actuel incorrect
    Alors un message d'erreur m'indique que le mot de passe actuel est incorrect
    Et le mot de passe n'est pas modifié
