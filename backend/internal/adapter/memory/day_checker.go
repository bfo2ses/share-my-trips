package memory

import (
	"context"

	"github.com/bfosses/sharemytrips/internal/domain/day"
)

// DayChecker implements media.DayChecker using the in-memory day repository.
type DayChecker struct {
	repo *DayRepository
}

// NewDayChecker creates a DayChecker backed by the given day repository.
func NewDayChecker(repo *DayRepository) *DayChecker {
	return &DayChecker{repo: repo}
}

func (c *DayChecker) Exists(ctx context.Context, dayID string) (bool, error) {
	_, err := c.repo.FindByID(ctx, dayID)
	if err == day.ErrNotFound {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func (c *DayChecker) TripID(ctx context.Context, dayID string) (string, error) {
	d, err := c.repo.FindByID(ctx, dayID)
	if err != nil {
		return "", err
	}
	return d.TripID, nil
}
