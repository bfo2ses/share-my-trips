package memory

import (
	"context"

	"github.com/bfosses/sharemytrips/internal/domain/visit"
)

// VisitChecker implements media.VisitChecker using the in-memory visit repository.
type VisitChecker struct {
	repo *VisitRepository
}

// NewVisitChecker creates a VisitChecker backed by the given visit repository.
func NewVisitChecker(repo *VisitRepository) *VisitChecker {
	return &VisitChecker{repo: repo}
}

func (c *VisitChecker) Exists(ctx context.Context, visitID string) (bool, error) {
	_, err := c.repo.FindByID(ctx, visitID)
	if err == visit.ErrNotFound {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func (c *VisitChecker) TripID(ctx context.Context, visitID string) (string, error) {
	v, err := c.repo.FindByID(ctx, visitID)
	if err != nil {
		return "", err
	}
	return v.TripID, nil
}
