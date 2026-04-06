package trip

import "context"

// ListFilter defines criteria for listing trips.
type ListFilter struct {
	// StatusIn filters trips by status. Empty means no filter.
	StatusIn []Status
}

// Repository is the port for trip persistence.
type Repository interface {
	Save(ctx context.Context, trip *Trip) error
	FindByID(ctx context.Context, id string) (*Trip, error)
	List(ctx context.Context, filter ListFilter) ([]*Trip, error)
	Delete(ctx context.Context, id string) error
}
