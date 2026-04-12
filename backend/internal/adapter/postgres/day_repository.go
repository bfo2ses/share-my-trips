package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/bfosses/sharemytrips/internal/domain/day"
)

// DayRepository is a PostgreSQL implementation of day.Repository.
// It also implements stage.DayDetacher via DetachStage.
type DayRepository struct {
	pool *pgxpool.Pool
}

func NewDayRepository(pool *pgxpool.Pool) *DayRepository {
	return &DayRepository{pool: pool}
}

func (r *DayRepository) Save(ctx context.Context, d *day.Day) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("save day: begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		INSERT INTO days (id, trip_id, date, title, description, lat, lng, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (id) DO UPDATE SET
			title = EXCLUDED.title,
			description = EXCLUDED.description,
			lat = EXCLUDED.lat,
			lng = EXCLUDED.lng,
			updated_at = EXCLUDED.updated_at`,
		d.ID, d.TripID, d.Date, d.Title, d.Description, d.Lat, d.Lng, d.CreatedAt, d.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("save day: upsert: %w", err)
	}

	// Replace stage associations.
	_, err = tx.Exec(ctx, `DELETE FROM day_stages WHERE day_id = $1`, d.ID)
	if err != nil {
		return fmt.Errorf("save day: clear stages: %w", err)
	}
	for i, stageID := range d.StageIDs {
		_, err = tx.Exec(ctx,
			`INSERT INTO day_stages (day_id, stage_id, position) VALUES ($1, $2, $3)`,
			d.ID, stageID, i,
		)
		if err != nil {
			return fmt.Errorf("save day: insert stage %s: %w", stageID, err)
		}
	}

	return tx.Commit(ctx)
}

func (r *DayRepository) FindByID(ctx context.Context, id string) (*day.Day, error) {
	var d day.Day
	err := r.pool.QueryRow(ctx, `
		SELECT id, trip_id, date, title, description, lat, lng, created_at, updated_at
		FROM days WHERE id = $1`, id).Scan(
		&d.ID, &d.TripID, &d.Date, &d.Title, &d.Description, &d.Lat, &d.Lng, &d.CreatedAt, &d.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, day.ErrNotFound
		}
		return nil, fmt.Errorf("find day: %w", err)
	}

	stageIDs, err := r.loadStageIDs(ctx, id)
	if err != nil {
		return nil, err
	}
	d.StageIDs = stageIDs
	return &d, nil
}

func (r *DayRepository) ListByStage(ctx context.Context, stageID string) ([]*day.Day, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT d.id, d.trip_id, d.date, d.title, d.description, d.lat, d.lng, d.created_at, d.updated_at
		FROM days d
		JOIN day_stages ds ON ds.day_id = d.id
		WHERE ds.stage_id = $1
		ORDER BY d.date`, stageID)
	if err != nil {
		return nil, fmt.Errorf("list days by stage: %w", err)
	}
	return r.scanDaysWithStages(ctx, rows)
}

func (r *DayRepository) ListByTrip(ctx context.Context, tripID string) ([]*day.Day, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, trip_id, date, title, description, lat, lng, created_at, updated_at
		FROM days WHERE trip_id = $1 ORDER BY date`, tripID)
	if err != nil {
		return nil, fmt.Errorf("list days by trip: %w", err)
	}
	return r.scanDaysWithStages(ctx, rows)
}

func (r *DayRepository) Delete(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM days WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete day: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return day.ErrNotFound
	}
	return nil
}

// DetachStage implements stage.DayDetacher.
// Removes stageID from all days, deleting orphaned days.
func (r *DayRepository) DetachStage(ctx context.Context, stageID string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("detach stage: begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Remove stage from junction table.
	_, err = tx.Exec(ctx, `DELETE FROM day_stages WHERE stage_id = $1`, stageID)
	if err != nil {
		return fmt.Errorf("detach stage: delete links: %w", err)
	}

	// Delete orphaned days (no remaining stage associations).
	_, err = tx.Exec(ctx, `
		DELETE FROM days
		WHERE id NOT IN (SELECT DISTINCT day_id FROM day_stages)`)
	if err != nil {
		return fmt.Errorf("detach stage: delete orphans: %w", err)
	}

	return tx.Commit(ctx)
}

func (r *DayRepository) loadStageIDs(ctx context.Context, dayID string) ([]string, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT stage_id FROM day_stages WHERE day_id = $1 ORDER BY position`, dayID)
	if err != nil {
		return nil, fmt.Errorf("load stage ids: %w", err)
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("scan stage id: %w", err)
		}
		ids = append(ids, id)
	}
	return ids, nil
}

func (r *DayRepository) scanDaysWithStages(ctx context.Context, rows pgx.Rows) ([]*day.Day, error) {
	defer rows.Close()

	var result []*day.Day
	for rows.Next() {
		var d day.Day
		if err := rows.Scan(&d.ID, &d.TripID, &d.Date, &d.Title, &d.Description, &d.Lat, &d.Lng, &d.CreatedAt, &d.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan day: %w", err)
		}
		stageIDs, err := r.loadStageIDs(ctx, d.ID)
		if err != nil {
			return nil, err
		}
		d.StageIDs = stageIDs
		result = append(result, &d)
	}
	return result, nil
}

