package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/bfosses/sharemytrips/internal/domain/travelleg"
)

// TravelLegRepository is a PostgreSQL implementation of travelleg.Repository.
type TravelLegRepository struct{ pool *pgxpool.Pool }

func NewTravelLegRepository(pool *pgxpool.Pool) *TravelLegRepository {
	return &TravelLegRepository{pool: pool}
}

func (r *TravelLegRepository) Save(ctx context.Context, leg *travelleg.TravelLeg) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO travel_legs (id, trip_id, from_stage_id, to_stage_id, transport, description, distance_km, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (id) DO UPDATE SET
			from_stage_id = EXCLUDED.from_stage_id,
			to_stage_id = EXCLUDED.to_stage_id,
			transport = EXCLUDED.transport,
			description = EXCLUDED.description,
			distance_km = EXCLUDED.distance_km,
			updated_at = EXCLUDED.updated_at`,
		leg.ID, leg.TripID, leg.FromStageID, leg.ToStageID, leg.Transport, leg.Description, leg.DistanceKm, leg.CreatedAt, leg.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.ConstraintName == "travel_legs_unique_stage_pair" {
			return travelleg.ErrPairAlreadyExists
		}
		return fmt.Errorf("save travel leg: %w", err)
	}
	return nil
}

func (r *TravelLegRepository) FindByID(ctx context.Context, id string) (*travelleg.TravelLeg, error) {
	leg, err := r.scanOne(ctx, `SELECT id, trip_id, from_stage_id, to_stage_id, transport, description, distance_km, created_at, updated_at FROM travel_legs WHERE id = $1`, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, travelleg.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find travel leg: %w", err)
	}
	return leg, nil
}

func (r *TravelLegRepository) FindByStagePair(ctx context.Context, tripID, fromStageID, toStageID string) (*travelleg.TravelLeg, error) {
	leg, err := r.scanOne(ctx, `SELECT id, trip_id, from_stage_id, to_stage_id, transport, description, distance_km, created_at, updated_at FROM travel_legs WHERE trip_id = $1 AND from_stage_id = $2 AND to_stage_id = $3`, tripID, fromStageID, toStageID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, travelleg.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find travel leg by pair: %w", err)
	}
	return leg, nil
}

func (r *TravelLegRepository) ListByTrip(ctx context.Context, tripID string) ([]*travelleg.TravelLeg, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, trip_id, from_stage_id, to_stage_id, transport, description, distance_km, created_at, updated_at FROM travel_legs WHERE trip_id = $1 ORDER BY created_at, id`, tripID)
	if err != nil {
		return nil, fmt.Errorf("list travel legs: %w", err)
	}
	defer rows.Close()
	legs := make([]*travelleg.TravelLeg, 0)
	for rows.Next() {
		leg, err := scanTravelLeg(rows)
		if err != nil {
			return nil, err
		}
		legs = append(legs, leg)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("list travel legs: %w", err)
	}
	return legs, nil
}

func (r *TravelLegRepository) Delete(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM travel_legs WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete travel leg: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return travelleg.ErrNotFound
	}
	return nil
}

type travelLegRow interface{ Scan(...any) error }

func (r *TravelLegRepository) scanOne(ctx context.Context, query string, args ...any) (*travelleg.TravelLeg, error) {
	return scanTravelLeg(r.pool.QueryRow(ctx, query, args...))
}

func scanTravelLeg(row travelLegRow) (*travelleg.TravelLeg, error) {
	var leg travelleg.TravelLeg
	if err := row.Scan(&leg.ID, &leg.TripID, &leg.FromStageID, &leg.ToStageID, &leg.Transport, &leg.Description, &leg.DistanceKm, &leg.CreatedAt, &leg.UpdatedAt); err != nil {
		return nil, err
	}
	return &leg, nil
}
