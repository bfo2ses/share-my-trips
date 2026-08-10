package media

import "context"

// Repository is the port for media persistence.
type Repository interface {
	Save(ctx context.Context, m *Media) error
	FindByID(ctx context.Context, id string) (*Media, error)
	ListByOwner(ctx context.Context, owner Owner) ([]*Media, error)
	ListByVisit(ctx context.Context, visitID string) ([]*Media, error)
	ListByTravelLeg(ctx context.Context, travelLegID string) ([]*Media, error)
	ListByTrip(ctx context.Context, tripID string) ([]*Media, error)
	Delete(ctx context.Context, id string) error
	// Move changes ownership and positions for media selected from one owner.
	Move(ctx context.Context, mediaIDs []string, owner Owner) error
	// NextPosition returns the next available position for a visit.
	NextPosition(ctx context.Context, visitID string) (int, error)
	NextPositionForOwner(ctx context.Context, owner Owner) (int, error)
	// Reorder updates the positions of the given media IDs in order.
	Reorder(ctx context.Context, visitID string, orderedIDs []string) error
	ReorderForOwner(ctx context.Context, owner Owner, orderedIDs []string) error
}

// TripChecker is the port for verifying trip mutability.
type TripChecker interface {
	IsModifiable(ctx context.Context, tripID string) (bool, error)
}

// VisitChecker is the port for verifying visit existence and trip membership.
type VisitChecker interface {
	Exists(ctx context.Context, visitID string) (bool, error)
	TripID(ctx context.Context, visitID string) (string, error)
}

// TravelLegChecker is the corresponding ownership port for saved travel legs.
type TravelLegChecker interface {
	Exists(ctx context.Context, travelLegID string) (bool, error)
	TripID(ctx context.Context, travelLegID string) (string, error)
}
