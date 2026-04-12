package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/bfosses/sharemytrips/internal/domain/stage"
)

// StageRepository is a PostgreSQL implementation of stage.Repository.
// It also implements day.StageChecker via BelongsToTrip.
type StageRepository struct {
	pool *pgxpool.Pool
}

func NewStageRepository(pool *pgxpool.Pool) *StageRepository {
	return &StageRepository{pool: pool}
}

func (r *StageRepository) Save(ctx context.Context, s *stage.Stage) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO stages (id, trip_id, city, name, lat, lng, description, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (id) DO UPDATE SET
			city = EXCLUDED.city,
			name = EXCLUDED.name,
			lat = EXCLUDED.lat,
			lng = EXCLUDED.lng,
			description = EXCLUDED.description,
			updated_at = EXCLUDED.updated_at`,
		s.ID, s.TripID, s.City, s.Name, s.Lat, s.Lng, s.Description, s.CreatedAt, s.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("save stage: %w", err)
	}
	return nil
}

func (r *StageRepository) FindByID(ctx context.Context, id string) (*stage.Stage, error) {
	var s stage.Stage
	err := r.pool.QueryRow(ctx, `
		SELECT id, trip_id, city, name, lat, lng, description, created_at, updated_at
		FROM stages WHERE id = $1`, id).Scan(
		&s.ID, &s.TripID, &s.City, &s.Name, &s.Lat, &s.Lng, &s.Description, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, stage.ErrNotFound
		}
		return nil, fmt.Errorf("find stage: %w", err)
	}
	return &s, nil
}

func (r *StageRepository) ListByTrip(ctx context.Context, tripID string) ([]*stage.Stage, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, trip_id, city, name, lat, lng, description, created_at, updated_at
		FROM stages WHERE trip_id = $1 ORDER BY created_at`, tripID)
	if err != nil {
		return nil, fmt.Errorf("list stages: %w", err)
	}
	defer rows.Close()

	var result []*stage.Stage
	for rows.Next() {
		var s stage.Stage
		if err := rows.Scan(&s.ID, &s.TripID, &s.City, &s.Name, &s.Lat, &s.Lng, &s.Description, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan stage: %w", err)
		}
		result = append(result, &s)
	}
	return result, nil
}

func (r *StageRepository) Delete(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM stages WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete stage: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return stage.ErrNotFound
	}
	return nil
}

// BelongsToTrip implements day.StageChecker.
func (r *StageRepository) BelongsToTrip(ctx context.Context, stageID, tripID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM stages WHERE id = $1 AND trip_id = $2)`,
		stageID, tripID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check stage belongs to trip: %w", err)
	}
	return exists, nil
}
