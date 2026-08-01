package visit

import (
	"context"
	"time"
)

// Repository is the port for visit persistence.
type Repository interface {
	Save(ctx context.Context, visit *Visit) error
	FindByID(ctx context.Context, id string) (*Visit, error)
	ListByStage(ctx context.Context, stageID string) ([]*Visit, error)
	ListByTrip(ctx context.Context, tripID string) ([]*Visit, error)
	Delete(ctx context.Context, id string) error
	// DetachStage removes stageID from all visits, deleting orphaned visits.
	DetachStage(ctx context.Context, stageID string) error
	// ListByStageAndDate returns visits whose primary stage (StageIDs[0]) is
	// stageID and whose Date matches date.
	ListByStageAndDate(ctx context.Context, stageID string, date time.Time) ([]*Visit, error)
	// NextPosition returns the next available position for a (stageID, date) group.
	NextPosition(ctx context.Context, stageID string, date time.Time) (int, error)
	// Reorder updates the positions of the given visit IDs, in order, within
	// a (stageID, date) group.
	Reorder(ctx context.Context, stageID string, date time.Time, orderedIDs []string) error
}

// TripChecker is the port for verifying trip mutability.
type TripChecker interface {
	IsModifiable(ctx context.Context, tripID string) (bool, error)
}

// StageChecker is the port for verifying stage-trip membership.
type StageChecker interface {
	BelongsToTrip(ctx context.Context, stageID, tripID string) (bool, error)
}
