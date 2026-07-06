---
date: 2026-07-06
topic: open-ideation
focus: idées d'amélioration du projet — priorité utilisateur ajoutée en cours de session : navigation mobile pour le front
---

# Ideation: Améliorations ShareMyTrips

## Codebase Context

- App familiale privée de récits de voyage (rôles ADMIN/EDITOR/READER, tout derrière login). Backend Go hexagonal + CQRS, GraphQL gqlgen, adapters memory/postgres/filesystem/imaging/crypto/mailer. Frontend React + Vite, urql + graphql-codegen, CSS Modules, thème sombre/or, cartes au centre de l'UX (react-simple-maps monde + Leaflet détail, contraste corrigé dans #39/#40).
- État : core complet (phases 1-3 du plan projet livrées), backlog `tasks/TASKS.md` vide — inflexion « qu'est-ce qu'on construit ensuite ».
- Zone fragile documentée : auth/session (3 bugs COR-008/009/010 corrigés ; backend ne renvoie jamais 401 ; expiration mi-session détectée seulement au reload ; MediaUploader XHR hors urql). Aucun test frontend (2 reviews le réclament avec cibles précises). Tests d'intégration HTTP backend promis Phase 2, jamais faits.
- Plan média actif (2026-04-12) avec différés explicites : EXIF (date/GPS/orientation), HEIC, vignettes vidéo, pagination média, couverture. Risques acceptés : orphelins post-upload, thumbnails lazy bloquants.
- DX : pas de README racine, pas de Makefile, media_data/ non gitignoré, codegen manuel, seed en dur dans Go, CLAUDE.md frontend contradictoire sur l'auth (httpOnly vs sessionStorage).
- Produit : nom « ShareMyTrips » mais zéro partage public (décision de brainstorm explicite : tout derrière login, partage au niveau trip uniquement). Desktop-first (breakpoints 768px partiels).

Process : 5 agents d'idéation (frames : frictions, capacités manquantes, automatisation, remise en cause, leviers) → ~40 idées brutes → fusion/dédoublonnage + 3 synthèses transverses → 2 critiques adversariales (coût/valeur solo-mainteneur, cohérence produit) → 7 survivantes. Priorité utilisateur « navigation mobile » intégrée au classement en cours de critique.

## Ranked Ideas

### 1. Navigation mobile d'abord
**Description:** Refonte de l'expérience mobile de consultation (et saisie légère) : cartes utilisables au pouce, panneaux/drawers tactiles, timeline mobile, gestes. Absorbe la partie mobile de l'idée « mode voyage en cours » sans le pivot live-tracking.
**Rationale:** Priorité explicite de l'utilisateur ; l'app est desktop-first alors que la consultation familiale se fait surtout au téléphone.
**Downsides:** Chantier UI transverse (toutes les pages) ; les interactions carte (drag de marqueurs, clic-création) sont pensées souris.
**Confidence:** 90%
**Complexity:** Medium
**Status:** Explored (brainstorm lancé le 2026-07-06)

### 2. Pipeline EXIF bout-en-bout
**Description:** Extraction date/GPS/orientation à l'upload alimentant : dispatch auto des photos vers les jours, coordonnées suggérées (médiane GPS) au lieu du clic carte, photos géolocalisées sur la carte Leaflet. (Couverture auto : optionnelle, hors itération courante du plan média.)
**Rationale:** Meilleur ratio valeur/coût selon les deux critiques ; supprime la corvée n°1 de la saisie ; complète les différés explicites du plan média actif ; nourrit la carte, cœur de l'UX.
**Downsides:** Dépend du pipeline média ; cas ambigus (photos sans GPS, fuseaux horaires) exigent un écran de confirmation.
**Confidence:** 85%
**Complexity:** Medium
**Status:** Unexplored

### 3. Auth solide (harnais + fix Me + transport unique + expiration mi-session)
**Description:** Harnais vitest+testing-library avec les 4 cibles listées par les reviews COR-009/010 ; fix du resolver Me qui avale les erreurs en (nil,nil) ; transport authentifié unique (fold du XHR MediaUploader) ; détection d'expiration mi-session avec préservation du brouillon. Taxonomie d'erreurs complète coupée (surdimensionnée).
**Rationale:** La justification la plus factuelle : 3 régressions auth documentées, zéro test frontend, cibles de tests déjà écrites. Prérequis du magic link.
**Downsides:** Travail invisible pour la famille ; discipline à maintenir.
**Confidence:** 85%
**Complexity:** Medium
**Status:** Unexplored

### 4. Socle projet
**Description:** Makefile (dev/test/codegen/seed), README racine, gitignore media_data/, gate CI anti-drift codegen, seed extrait du Go en fixture, réconciliation du CLAUDE.md frontend (httpOnly vs sessionStorage).
**Rationale:** « Une après-midi, rentabilisée à chaque session » — taxe supprimée pour chaque session humaine ou agent.
**Downsides:** Aucun visible pour la famille.
**Confidence:** 95%
**Complexity:** Low
**Status:** Unexplored

### 5. Magic link pour les READER
**Description:** Invitation email sans mot de passe via le mailer SMTP existant : le lecteur clique, obtient une session READER. Reste « derrière login » (c'est une authentification).
**Rationale:** Le public READER (grands-parents) abandonne devant un mot de passe ; chemin le plus court vers « la famille consulte vraiment ». Après l'auth solide (#3).
**Downsides:** Surface d'auth élargie dans la zone la plus fragile — d'où le séquencement.
**Confidence:** 80%
**Complexity:** Low
**Status:** Unexplored

### 6. Notifications + résurgence
**Description:** Email « voyage publié » (événementiel simple, pas de machinerie de digest) + bandeau d'accueil « il y a un an, vous étiez à… » (requête par date anniversaire).
**Rationale:** Sans déclencheur, un album 100 % privé meurt d'oubli ; le mailer existe, coût quasi nul, valeur qui croît chaque année.
**Downsides:** Réglage anti-spam familial (fréquence) à doser.
**Confidence:** 80%
**Complexity:** Low
**Status:** Unexplored

### 7. Export artefact : mini-site statique autonome
**Description:** Un voyage terminé exportable en HTML+médias auto-contenu (hors app, hors serveur). Variante PDF livre-photo tuée (gouffre de mise en page).
**Rationale:** Assurance-vie des souvenirs sur du self-hosted ; donne un sens produit au statut « terminé » ; seule « sortie » compatible avec la décision zéro partage public.
**Downsides:** Double rendu à maintenir (app + export) ; poids des médias exportés.
**Confidence:** 70%
**Complexity:** Medium
**Status:** Unexplored

## Rejection Summary

| # | Idée | Raison du rejet |
|---|------|-----------------|
| 1 | Photos-first (inversion totale de la saisie) | L'EXIF (#2) livre 80 % de la valeur sans réarchitecturer le flux carte-first tout juste réparé (#35) |
| 2 | Liens-capacités sans login | Contredit la seule décision produit interdite (« tout derrière login ») ; redondant avec le magic link |
| 3 | Réactions/commentaires familiaux | 5 personnes qui se parlent sur WhatsApp ; entité domaine + UI pour des réactions qui n'arriveront pas |
| 4 | « Il y a un an » en feature autonome | Gardé, mais fusionné dans #6 (bandeau + mail) au lieu d'une feature séparée |
| 5 | Mode « voyage en cours » live | Pivot produit (clone Polarsteps) non demandé ; la partie mobile est absorbée par #1 |
| 6 | Notes vocales par jour | Nouveau type de média avant d'avoir fini le pipeline photo/vidéo ; usage hypothétique |
| 7 | Recherche transverse full-text | À l'échelle d'une famille, la carte monde et la mémoire humaine suffisent |
| 8 | Mémoire transversale par tags | La discipline de taggage meurt en trois voyages ; valeur n'émerge qu'à un corpus lointain |
| 9 | Scrollytelling magazine | Séduisant mais chantier frontend le plus lourd et fragile de la liste — reporté, pas enterré |
| 10 | Fédération d'instances | Ingénierie d'écosystème sans écosystème |
| 11 | Fixture stress 200 voyages / pagination | Optimise pour un utilisateur qui n'existera pas |
| 12 | Planisphère en accueil | Déjà fait — la carte monde est la page d'accueil |
| 13 | PDF livre-photo (variante de #7) | Gouffre de mise en page pour un mainteneur solo ; le site statique suffit |

## Session Log
- 2026-07-06: Idéation initiale — ~40 idées générées (5 agents), 20 candidates après fusion, 7 survivantes après critique adversariale (2 agents). Priorité utilisateur « navigation mobile front » intégrée en cours de route (idée #1 ajoutée sur directive utilisateur).
- 2026-07-06: Idée #1 (navigation mobile) sélectionnée → brainstorm lancé.
