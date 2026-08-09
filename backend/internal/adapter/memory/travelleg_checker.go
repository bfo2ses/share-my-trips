package memory

import (
	"context"

	"github.com/bfosses/sharemytrips/internal/domain/travelleg"
)

// TravelLegChecker implements media.TravelLegChecker from a memory repository.
type TravelLegChecker struct{ repo travelleg.Repository }

func NewTravelLegChecker(repo travelleg.Repository) *TravelLegChecker {
	return &TravelLegChecker{repo: repo}
}

func (c *TravelLegChecker) Exists(ctx context.Context, id string) (bool, error) {
	_, err := c.repo.FindByID(ctx, id)
	if err == travelleg.ErrNotFound {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func (c *TravelLegChecker) TripID(ctx context.Context, id string) (string, error) {
	leg, err := c.repo.FindByID(ctx, id)
	if err != nil {
		return "", err
	}
	return leg.TripID, nil
}
