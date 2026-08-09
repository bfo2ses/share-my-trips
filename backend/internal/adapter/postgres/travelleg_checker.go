package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// TravelLegChecker checks ownership of saved travel legs for media uploads.
type TravelLegChecker struct{ pool *pgxpool.Pool }

func NewTravelLegChecker(pool *pgxpool.Pool) *TravelLegChecker { return &TravelLegChecker{pool: pool} }

func (c *TravelLegChecker) Exists(ctx context.Context, id string) (bool, error) {
	var exists bool
	if err := c.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM travel_legs WHERE id = $1)`, id).Scan(&exists); err != nil {
		return false, fmt.Errorf("check travel leg exists: %w", err)
	}
	return exists, nil
}

func (c *TravelLegChecker) TripID(ctx context.Context, id string) (string, error) {
	var tripID string
	if err := c.pool.QueryRow(ctx, `SELECT trip_id FROM travel_legs WHERE id = $1`, id).Scan(&tripID); err != nil {
		if err == pgx.ErrNoRows {
			return "", fmt.Errorf("travel leg not found")
		}
		return "", fmt.Errorf("get travel leg trip id: %w", err)
	}
	return tripID, nil
}
