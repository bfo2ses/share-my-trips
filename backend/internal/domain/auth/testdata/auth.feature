# language: fr

Fonctionnalité: Authentification et gestion des comptes
  En tant qu'utilisateur de l'application
  Je veux pouvoir m'authentifier avec mon compte
  Afin d'accéder aux voyages selon mon rôle

  # --- Setup initial (premier lancement) ---

  Scénario: Création du compte administrateur au premier lancement
    Etant donné qu'aucun compte n'existe en base de données
    Quand je crée le compte administrateur avec le nom "Benjamin", l'email "admin@example.com" et le mot de passe "MonMotDePasse123!"
    Alors le compte administrateur est créé
    Et une session est ouverte automatiquement

  Scénario: Les mots de passe doivent correspondre lors du setup
    Etant donné qu'aucun compte n'existe en base de données
    Quand je tente de créer le compte admin avec des mots de passe différents
    Alors un message d'erreur m'indique que les mots de passe ne correspondent pas

  Scénario: Le setup initial n'est plus accessible après création de l'admin
    Etant donné qu'un compte administrateur existe
    Quand je tente d'accéder au setup initial
    Alors un message d'erreur m'indique que le setup est déjà effectué

  # --- Connexion ---

  Scénario: Se connecter avec des identifiants valides
    Etant donné qu'un compte administrateur existe
    Quand je me connecte avec l'email "admin@example.com" et le mot de passe "MonMotDePasse123!"
    Alors je suis connecté et un token de session est retourné

  Scénario: Se connecter avec un email inconnu
    Etant donné qu'un compte administrateur existe
    Quand je tente de me connecter avec un email inconnu
    Alors un message d'erreur m'indique que les identifiants sont incorrects

  Scénario: Se connecter avec un mot de passe incorrect
    Etant donné qu'un compte administrateur existe
    Quand je tente de me connecter avec un mot de passe incorrect
    Alors un message d'erreur m'indique que les identifiants sont incorrects

  Scénario: Le message d'erreur ne distingue pas email et mot de passe
    Etant donné qu'un compte administrateur existe
    Alors l'erreur pour un email inconnu est identique à l'erreur pour un mot de passe incorrect

  Scénario: Se déconnecter invalide le token de session
    Etant donné que je suis connecté en tant qu'administrateur
    Quand je me déconnecte
    Alors mon token de session n'est plus valide

  Scénario: Accéder aux données sans token de session
    Quand je tente d'obtenir l'utilisateur courant sans token
    Alors un message d'erreur m'indique que les identifiants sont incorrects

  # --- Gestion des comptes famille (admin) ---

  Scénario: Créer un compte famille
    Etant donné que je suis connecté en tant qu'administrateur
    Quand je crée un compte famille avec le nom "Tonton Robert", l'email "tonton@example.com" et le mot de passe "MotDePasse456!"
    Alors le compte famille "Tonton Robert" est créé

  Scénario: Un compte famille peut se connecter avec ses identifiants
    Etant donné qu'un compte famille "Tonton Robert" avec l'email "tonton@example.com" et le mot de passe "MotDePasse456!" existe
    Quand je me connecte avec l'email "tonton@example.com" et le mot de passe "MotDePasse456!"
    Alors je suis connecté et un token de session est retourné

  Scénario: Impossible de créer un compte avec un email déjà utilisé
    Etant donné que je suis connecté en tant qu'administrateur
    Et qu'un compte existe avec l'email "tonton@example.com"
    Quand je tente de créer un compte avec l'email "tonton@example.com"
    Alors un message d'erreur m'indique que l'email est déjà utilisé

  Scénario: Supprimer un compte famille
    Etant donné que je suis connecté en tant qu'administrateur
    Et qu'un compte famille "Tonton Robert" avec l'email "tonton@example.com" et le mot de passe "MotDePasse456!" existe
    Quand je supprime le compte "Tonton Robert"
    Alors le compte est supprimé

  Scénario: L'administrateur ne peut pas supprimer son propre compte
    Etant donné que je suis connecté en tant qu'administrateur
    Quand je tente de supprimer mon propre compte
    Alors un message d'erreur m'indique que je ne peux pas supprimer mon propre compte

  Scénario: Un membre famille ne peut pas créer de compte
    Etant donné qu'un compte famille "Tonton Robert" avec l'email "tonton@example.com" et le mot de passe "MotDePasse456!" existe
    Et que je suis connecté en tant que membre famille "tonton@example.com"
    Quand je tente de créer un compte depuis le compte famille
    Alors un message d'erreur m'indique que l'action est interdite

  # --- Réinitialisation du mot de passe ---

  Scénario: Demander une réinitialisation de mot de passe
    Etant donné qu'un compte administrateur existe
    Quand je demande une réinitialisation pour l'email "admin@example.com"
    Alors un email de réinitialisation est envoyé

  Scénario: Réinitialiser son mot de passe via le token
    Etant donné qu'un token de réinitialisation valide existe pour "admin@example.com"
    Quand je réinitialise le mot de passe avec "NouveauMDP123!" et le token valide
    Alors le mot de passe est mis à jour
    Et je peux me connecter avec le nouveau mot de passe "NouveauMDP123!"

  Scénario: Le token de réinitialisation ne peut être utilisé qu'une fois
    Etant donné qu'un token de réinitialisation a déjà été utilisé
    Quand je tente de réinitialiser le mot de passe avec ce token
    Alors un message d'erreur m'indique que le token est invalide

  Scénario: Le token de réinitialisation expire après 24 heures
    Etant donné qu'un token de réinitialisation est expiré
    Quand je tente de réinitialiser le mot de passe avec ce token expiré
    Alors un message d'erreur m'indique que le token a expiré

  Scénario: Demande de réinitialisation avec un email inconnu
    Etant donné qu'un compte administrateur existe
    Quand je demande une réinitialisation pour un email inconnu
    Alors aucune erreur n'est retournée

  # --- Changement de mot de passe ---

  Scénario: Changer son mot de passe depuis son profil
    Etant donné que je suis connecté en tant qu'administrateur
    Quand je change mon mot de passe en renseignant "MonMotDePasse123!" comme mot de passe actuel et "NouveauMDP456!" comme nouveau mot de passe
    Alors mon mot de passe est mis à jour

  Scénario: Le mot de passe actuel doit être correct pour le changer
    Etant donné que je suis connecté en tant qu'administrateur
    Quand je tente de changer mon mot de passe avec un mot de passe actuel incorrect
    Alors un message d'erreur m'indique que le mot de passe actuel est incorrect
