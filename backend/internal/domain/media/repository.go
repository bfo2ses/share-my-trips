package media

import "context"

// Repository is the port for media persistence.
type Repository interface {
	Save(ctx context.Context, m *Media) error
	FindByID(ctx context.Context, id string) (*Media, error)
	ListByVisit(ctx context.Context, visitID string) ([]*Media, error)
	ListByTrip(ctx context.Context, tripID string) ([]*Media, error)
	Delete(ctx context.Context, id string) error
	// NextPosition returns the next available position for a visit.
	NextPosition(ctx context.Context, visitID string) (int, error)
	// Reorder updates the positions of the given media IDs in order.
	Reorder(ctx context.Context, visitID string, orderedIDs []string) error
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
