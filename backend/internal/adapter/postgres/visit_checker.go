package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// VisitChecker checks visit existence and trip membership via PostgreSQL.
// Implements media.VisitChecker.
type VisitChecker struct {
	pool *pgxpool.Pool
}

func NewVisitChecker(pool *pgxpool.Pool) *VisitChecker {
	return &VisitChecker{pool: pool}
}

func (c *VisitChecker) Exists(ctx context.Context, visitID string) (bool, error) {
	var exists bool
	err := c.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM visits WHERE id = $1)`, visitID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check visit exists: %w", err)
	}
	return exists, nil
}

func (c *VisitChecker) TripID(ctx context.Context, visitID string) (string, error) {
	var tripID string
	err := c.pool.QueryRow(ctx,
		`SELECT trip_id FROM visits WHERE id = $1`, visitID).Scan(&tripID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return "", fmt.Errorf("visit not found")
		}
		return "", fmt.Errorf("get visit trip id: %w", err)
	}
	return tripID, nil
}
