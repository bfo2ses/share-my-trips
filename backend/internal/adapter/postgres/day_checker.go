package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// DayChecker checks day existence and trip membership via PostgreSQL.
// Implements media.DayChecker.
type DayChecker struct {
	pool *pgxpool.Pool
}

func NewDayChecker(pool *pgxpool.Pool) *DayChecker {
	return &DayChecker{pool: pool}
}

func (c *DayChecker) Exists(ctx context.Context, dayID string) (bool, error) {
	var exists bool
	err := c.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM days WHERE id = $1)`, dayID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check day exists: %w", err)
	}
	return exists, nil
}

func (c *DayChecker) TripID(ctx context.Context, dayID string) (string, error) {
	var tripID string
	err := c.pool.QueryRow(ctx,
		`SELECT trip_id FROM days WHERE id = $1`, dayID).Scan(&tripID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return "", fmt.Errorf("day not found")
		}
		return "", fmt.Errorf("get day trip id: %w", err)
	}
	return tripID, nil
}
