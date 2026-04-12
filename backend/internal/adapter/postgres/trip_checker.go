package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// TripChecker checks trip mutability via PostgreSQL.
// Implements stage.TripChecker, day.TripChecker, and media.TripChecker.
type TripChecker struct {
	pool *pgxpool.Pool
}

func NewTripChecker(pool *pgxpool.Pool) *TripChecker {
	return &TripChecker{pool: pool}
}

func (c *TripChecker) IsModifiable(ctx context.Context, tripID string) (bool, error) {
	var status string
	err := c.pool.QueryRow(ctx, `SELECT status FROM trips WHERE id = $1`, tripID).Scan(&status)
	if err != nil {
		if err == pgx.ErrNoRows {
			return false, nil
		}
		return false, fmt.Errorf("check trip modifiable: %w", err)
	}
	return status != "closed", nil
}
