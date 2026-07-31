package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/bfosses/sharemytrips/internal/domain/visit"
)

// VisitRepository is a PostgreSQL implementation of visit.Repository.
// It also implements stage.VisitDetacher via DetachStage.
type VisitRepository struct {
	pool *pgxpool.Pool
}

func NewVisitRepository(pool *pgxpool.Pool) *VisitRepository {
	return &VisitRepository{pool: pool}
}

func (r *VisitRepository) Save(ctx context.Context, v *visit.Visit) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("save visit: begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		INSERT INTO visits (id, trip_id, date, title, description, lat, lng, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (id) DO UPDATE SET
			date = EXCLUDED.date,
			title = EXCLUDED.title,
			description = EXCLUDED.description,
			lat = EXCLUDED.lat,
			lng = EXCLUDED.lng,
			updated_at = EXCLUDED.updated_at`,
		v.ID, v.TripID, v.Date, v.Title, v.Description, v.Lat, v.Lng, v.CreatedAt, v.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("save visit: upsert: %w", err)
	}

	// Replace stage associations.
	_, err = tx.Exec(ctx, `DELETE FROM visit_stages WHERE visit_id = $1`, v.ID)
	if err != nil {
		return fmt.Errorf("save visit: clear stages: %w", err)
	}
	for i, stageID := range v.StageIDs {
		_, err = tx.Exec(ctx,
			`INSERT INTO visit_stages (visit_id, stage_id, position) VALUES ($1, $2, $3)`,
			v.ID, stageID, i,
		)
		if err != nil {
			return fmt.Errorf("save visit: insert stage %s: %w", stageID, err)
		}
	}

	return tx.Commit(ctx)
}

func (r *VisitRepository) FindByID(ctx context.Context, id string) (*visit.Visit, error) {
	var v visit.Visit
	err := r.pool.QueryRow(ctx, `
		SELECT id, trip_id, date, title, description, lat, lng, created_at, updated_at
		FROM visits WHERE id = $1`, id).Scan(
		&v.ID, &v.TripID, &v.Date, &v.Title, &v.Description, &v.Lat, &v.Lng, &v.CreatedAt, &v.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, visit.ErrNotFound
		}
		return nil, fmt.Errorf("find visit: %w", err)
	}

	stageIDs, err := r.loadStageIDs(ctx, id)
	if err != nil {
		return nil, err
	}
	v.StageIDs = stageIDs
	return &v, nil
}

func (r *VisitRepository) ListByStage(ctx context.Context, stageID string) ([]*visit.Visit, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT v.id, v.trip_id, v.date, v.title, v.description, v.lat, v.lng, v.created_at, v.updated_at
		FROM visits v
		JOIN visit_stages vs ON vs.visit_id = v.id
		WHERE vs.stage_id = $1
		ORDER BY v.date`, stageID)
	if err != nil {
		return nil, fmt.Errorf("list visits by stage: %w", err)
	}
	return r.scanVisitsWithStages(ctx, rows)
}

func (r *VisitRepository) ListByTrip(ctx context.Context, tripID string) ([]*visit.Visit, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, trip_id, date, title, description, lat, lng, created_at, updated_at
		FROM visits WHERE trip_id = $1 ORDER BY date`, tripID)
	if err != nil {
		return nil, fmt.Errorf("list visits by trip: %w", err)
	}
	return r.scanVisitsWithStages(ctx, rows)
}

func (r *VisitRepository) Delete(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM visits WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete visit: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return visit.ErrNotFound
	}
	return nil
}

// DetachStage implements stage.VisitDetacher.
// Removes stageID from all visits, deleting orphaned visits.
func (r *VisitRepository) DetachStage(ctx context.Context, stageID string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("detach stage: begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Remove stage from junction table.
	_, err = tx.Exec(ctx, `DELETE FROM visit_stages WHERE stage_id = $1`, stageID)
	if err != nil {
		return fmt.Errorf("detach stage: delete links: %w", err)
	}

	// Delete orphaned visits (no remaining stage associations).
	_, err = tx.Exec(ctx, `
		DELETE FROM visits
		WHERE id NOT IN (SELECT DISTINCT visit_id FROM visit_stages)`)
	if err != nil {
		return fmt.Errorf("detach stage: delete orphans: %w", err)
	}

	return tx.Commit(ctx)
}

func (r *VisitRepository) loadStageIDs(ctx context.Context, visitID string) ([]string, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT stage_id FROM visit_stages WHERE visit_id = $1 ORDER BY position`, visitID)
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

func (r *VisitRepository) scanVisitsWithStages(ctx context.Context, rows pgx.Rows) ([]*visit.Visit, error) {
	defer rows.Close()

	var result []*visit.Visit
	for rows.Next() {
		var v visit.Visit
		if err := rows.Scan(&v.ID, &v.TripID, &v.Date, &v.Title, &v.Description, &v.Lat, &v.Lng, &v.CreatedAt, &v.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan visit: %w", err)
		}
		stageIDs, err := r.loadStageIDs(ctx, v.ID)
		if err != nil {
			return nil, err
		}
		v.StageIDs = stageIDs
		result = append(result, &v)
	}
	return result, nil
}
