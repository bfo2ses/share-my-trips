package stage

import "context"

// Repository is the port for stage persistence.
type Repository interface {
	Save(ctx context.Context, stage *Stage) error
	FindByID(ctx context.Context, id string) (*Stage, error)
	ListByTrip(ctx context.Context, tripID string) ([]*Stage, error)
	Delete(ctx context.Context, id string) error
}

// TripChecker is the port for verifying trip mutability.
type TripChecker interface {
	IsModifiable(ctx context.Context, tripID string) (bool, error)
}

// VisitDetacher detaches a stage from all visits, deleting any visits that become orphaned.
type VisitDetacher interface {
	DetachStage(ctx context.Context, stageID string) error
}
