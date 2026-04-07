package day

import "context"

// Repository is the port for day persistence.
type Repository interface {
	Save(ctx context.Context, day *Day) error
	FindByID(ctx context.Context, id string) (*Day, error)
	ListByStage(ctx context.Context, stageID string) ([]*Day, error)
	ListByTrip(ctx context.Context, tripID string) ([]*Day, error)
	Delete(ctx context.Context, id string) error
	// DetachStage removes stageID from all days, deleting orphaned days.
	DetachStage(ctx context.Context, stageID string) error
}

// TripChecker is the port for verifying trip mutability.
type TripChecker interface {
	IsModifiable(ctx context.Context, tripID string) (bool, error)
}

// StageChecker is the port for verifying stage-trip membership.
type StageChecker interface {
	BelongsToTrip(ctx context.Context, stageID, tripID string) (bool, error)
}
