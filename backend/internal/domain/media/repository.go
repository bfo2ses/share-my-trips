package media

import "context"

// Repository is the port for media persistence.
type Repository interface {
	Save(ctx context.Context, m *Media) error
	FindByID(ctx context.Context, id string) (*Media, error)
	ListByDay(ctx context.Context, dayID string) ([]*Media, error)
	Delete(ctx context.Context, id string) error
	// NextPosition returns the next available position for a day.
	NextPosition(ctx context.Context, dayID string) (int, error)
	// Reorder updates the positions of the given media IDs in order.
	Reorder(ctx context.Context, dayID string, orderedIDs []string) error
}

// TripChecker is the port for verifying trip mutability.
type TripChecker interface {
	IsModifiable(ctx context.Context, tripID string) (bool, error)
}

// DayChecker is the port for verifying day existence and trip membership.
type DayChecker interface {
	Exists(ctx context.Context, dayID string) (bool, error)
	TripID(ctx context.Context, dayID string) (string, error)
}
