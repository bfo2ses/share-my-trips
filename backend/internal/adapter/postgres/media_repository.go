package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/bfosses/sharemytrips/internal/domain/media"
)

// MediaRepository is a PostgreSQL implementation of media.Repository.
type MediaRepository struct {
	pool *pgxpool.Pool
}

func NewMediaRepository(pool *pgxpool.Pool) *MediaRepository {
	return &MediaRepository{pool: pool}
}

func (r *MediaRepository) Save(ctx context.Context, m *media.Media) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO media (id, day_id, trip_id, filename, content_type, caption, position, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (id) DO UPDATE SET
			caption = EXCLUDED.caption,
			position = EXCLUDED.position`,
		m.ID, m.DayID, m.TripID, m.Filename, m.ContentType, m.Caption, m.Position, m.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("save media: %w", err)
	}
	return nil
}

func (r *MediaRepository) FindByID(ctx context.Context, id string) (*media.Media, error) {
	var m media.Media
	err := r.pool.QueryRow(ctx, `
		SELECT id, day_id, trip_id, filename, content_type, caption, position, created_at
		FROM media WHERE id = $1`, id).Scan(
		&m.ID, &m.DayID, &m.TripID, &m.Filename, &m.ContentType, &m.Caption, &m.Position, &m.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, media.ErrNotFound
		}
		return nil, fmt.Errorf("find media: %w", err)
	}
	return &m, nil
}

func (r *MediaRepository) ListByDay(ctx context.Context, dayID string) ([]*media.Media, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, day_id, trip_id, filename, content_type, caption, position, created_at
		FROM media WHERE day_id = $1 ORDER BY position`, dayID)
	if err != nil {
		return nil, fmt.Errorf("list media: %w", err)
	}
	defer rows.Close()

	var result []*media.Media
	for rows.Next() {
		var m media.Media
		if err := rows.Scan(&m.ID, &m.DayID, &m.TripID, &m.Filename, &m.ContentType, &m.Caption, &m.Position, &m.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan media: %w", err)
		}
		result = append(result, &m)
	}
	return result, nil
}

func (r *MediaRepository) Delete(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM media WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete media: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return media.ErrNotFound
	}
	return nil
}

func (r *MediaRepository) NextPosition(ctx context.Context, dayID string) (int, error) {
	var pos int
	err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(MAX(position), -1) + 1 FROM media WHERE day_id = $1`, dayID).Scan(&pos)
	if err != nil {
		return 0, fmt.Errorf("next position: %w", err)
	}
	return pos, nil
}

func (r *MediaRepository) Reorder(ctx context.Context, dayID string, orderedIDs []string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("reorder media: begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	for i, id := range orderedIDs {
		_, err := tx.Exec(ctx,
			`UPDATE media SET position = $1 WHERE id = $2 AND day_id = $3`,
			i, id, dayID,
		)
		if err != nil {
			return fmt.Errorf("reorder media: update %s: %w", id, err)
		}
	}

	return tx.Commit(ctx)
}
