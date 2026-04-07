package memory

import (
	"context"
	"fmt"

	"github.com/bfosses/sharemytrips/internal/domain/trip"
)

// TripChecker wraps TripRepository to satisfy the stage.TripChecker and day.TripChecker ports.
type TripChecker struct {
	repo *TripRepository
}

// NewTripChecker creates a TripChecker backed by the given TripRepository.
func NewTripChecker(repo *TripRepository) *TripChecker {
	return &TripChecker{repo: repo}
}

// IsModifiable returns true if the trip exists and is not closed.
func (c *TripChecker) IsModifiable(ctx context.Context, tripID string) (bool, error) {
	t, err := c.repo.FindByID(ctx, tripID)
	if err != nil {
		return false, fmt.Errorf("trip checker: %w", err)
	}
	return t.Status != trip.StatusClosed, nil
}
