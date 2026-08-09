package travelleg

import "context"

// Repository is the port for travel-leg persistence.
type Repository interface {
	Save(ctx context.Context, leg *TravelLeg) error
	FindByID(ctx context.Context, id string) (*TravelLeg, error)
	FindByStagePair(ctx context.Context, tripID, fromStageID, toStageID string) (*TravelLeg, error)
	ListByTrip(ctx context.Context, tripID string) ([]*TravelLeg, error)
	Delete(ctx context.Context, id string) error
}

// TripChecker verifies whether a trip can be changed.
type TripChecker interface {
	IsModifiable(ctx context.Context, tripID string) (bool, error)
}

// StageRef is the stage information required to validate a travel-leg pair.
type StageRef struct {
	ID     string
	TripID string
}

// StageSequence provides the authoritative chronological stage order for a
// trip. Its implementation will combine the shared stage projection with the
// current primary visits.
type StageSequence interface {
	OrderedStages(ctx context.Context, tripID string) ([]StageRef, error)
}
