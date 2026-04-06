# Choix techniques — ShareMyTrips

## Stack technique

### Frontend
- **Framework** : React avec Vite
- **Client GraphQL** : urql
- **Styling** : CSS Modules
- **Cartes** : Leaflet ou MapLibre (à déterminer à l'implémentation)

### Backend
- **Langage** : Go
- **API** : GraphQL via gqlgen
- **Architecture** : CQRS simple + Architecture Hexagonale (Ports & Adapters)
- **Accès base de données** : sqlx (SQL brut, côté commands et queries)
- **Extraction EXIF** : goexif ou lib équivalente

### Base de données
- **SGBD** : PostgreSQL

### Infrastructure
- **Conteneurisation** : Docker + docker-compose
- **Hébergement** : NAS personnel avec Docker
- **HTTPS** : géré par le reverse proxy existant (en dehors du scope de l'app)

## Architecture CQRS

```
Frontend React (urql)
        │
        ▼
   GraphQL (gqlgen)
   ┌─────┴─────┐
   │           │
Mutations    Queries
   │           │
   ▼           ▼
Commands    Query Handlers
   │           │
   ▼           ▼
Command     Read Models
Handlers       │
   │           ▼
   ▼      PostgreSQL (vues lecture)
PostgreSQL
(écriture)
```

Même base PostgreSQL pour la lecture et l'écriture, avec des modèles Go séparés.

## Principes d'architecture backend

### Séparation des contextes (Bounded Contexts)

Chaque domaine fonctionnel est isolé dans son propre package avec ses propres types, interfaces et logique métier :

```
internal/
├── domain/
│   ├── trip/          # Contexte : Gestion des voyages
│   │   ├── model.go         # Entités et value objects
│   │   ├── command.go        # Commands (Create, Update, Close...)
│   │   ├── query.go          # Queries (GetTrip, ListTrips...)
│   │   ├── repository.go     # Port : interface du repository
│   │   └── handler.go        # Command & Query handlers
│   │
│   ├── stage/         # Contexte : Étapes et jours
│   │   ├── model.go
│   │   ├── command.go
│   │   ├── query.go
│   │   ├── repository.go
│   │   └── handler.go
│   │
│   ├── media/         # Contexte : Photos, vidéos, EXIF
│   │   ├── model.go
│   │   ├── command.go
│   │   ├── query.go
│   │   ├── repository.go
│   │   ├── storage.go        # Port : interface de stockage fichiers
│   │   ├── exif.go           # Port : interface extraction EXIF
│   │   └── handler.go
│   │
│   └── auth/          # Contexte : Authentification et comptes
│       ├── model.go
│       ├── command.go
│       ├── query.go
│       ├── repository.go
│       └── handler.go
│
├── adapter/
│   ├── postgres/      # Adapter : implémentation PostgreSQL des repositories
│   │   ├── trip_repository.go
│   │   ├── stage_repository.go
│   │   ├── media_repository.go
│   │   └── auth_repository.go
│   │
│   ├── memory/        # Adapter : implémentation in-memory (dev, tests)
│   │   ├── trip_repository.go
│   │   ├── stage_repository.go
│   │   ├── media_repository.go
│   │   └── auth_repository.go
│   │
│   ├── filesystem/    # Adapter : stockage fichiers sur le NAS
│   │   └── storage.go
│   │
│   └── exif/          # Adapter : extraction métadonnées EXIF
│       └── extractor.go
│
└── graphql/           # Couche de présentation (resolvers gqlgen)
    ├── schema/
    ├── resolver/
    └── generated/
```

### Inversion de dépendances

Le domaine (domain/) ne dépend d'aucun package technique. Il définit des **ports** (interfaces Go) que les **adapters** implémentent :

```go
// domain/trip/repository.go (PORT)
type Repository interface {
    Save(ctx context.Context, trip *Trip) error
    FindByID(ctx context.Context, id string) (*Trip, error)
    List(ctx context.Context, filter ListFilter) ([]*Trip, error)
    Delete(ctx context.Context, id string) error
}

// adapter/memory/trip_repository.go (ADAPTER in-memory)
type TripRepository struct {
    trips map[string]*trip.Trip
}

// adapter/postgres/trip_repository.go (ADAPTER PostgreSQL)
type TripRepository struct {
    db *sqlx.DB
}
```

### Stratégie d'implémentation

1. **Phase 1** : implémentation avec les adapters **in-memory** pour valider la logique métier et l'API GraphQL sans dépendance infrastructure
2. **Phase 2** : implémentation des adapters **PostgreSQL** et **filesystem** pour la persistance réelle
3. Le passage de l'un à l'autre se fait par injection de dépendances au démarrage de l'application

## Contraintes

- L'app doit supporter de gros volumes de médias (50+ Go)
- Les thumbnails sont générés à la volée lors de la première consultation, puis mis en cache pour les accès suivants
- Les métadonnées EXIF sont extraites à l'upload
- L'image Docker backend doit être légère (binaire Go statique)
- Le stockage des fichiers se fait sur le filesystem du NAS
