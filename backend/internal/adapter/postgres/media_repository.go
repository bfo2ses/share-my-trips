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
		INSERT INTO media (id, visit_id, travel_leg_id, trip_id, filename, content_type, caption, position, created_at)
		VALUES ($1, NULLIF($2, ''), NULLIF($3, ''), $4, $5, $6, $7, $8, $9)
		ON CONFLICT (id) DO UPDATE SET
			caption = EXCLUDED.caption,
			position = EXCLUDED.position`,
		m.ID, m.VisitID, m.TravelLegID, m.TripID, m.Filename, m.ContentType, m.Caption, m.Position, m.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("save media: %w", err)
	}
	return nil
}

func (r *MediaRepository) FindByID(ctx context.Context, id string) (*media.Media, error) {
	var m media.Media
	err := r.pool.QueryRow(ctx, `
		SELECT id, COALESCE(visit_id, ''), COALESCE(travel_leg_id, ''), trip_id, filename, content_type, caption, position, created_at
		FROM media WHERE id = $1`, id).Scan(
		&m.ID, &m.VisitID, &m.TravelLegID, &m.TripID, &m.Filename, &m.ContentType, &m.Caption, &m.Position, &m.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, media.ErrNotFound
		}
		return nil, fmt.Errorf("find media: %w", err)
	}
	return &m, nil
}

func (r *MediaRepository) ListByVisit(ctx context.Context, visitID string) ([]*media.Media, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, COALESCE(visit_id, ''), COALESCE(travel_leg_id, ''), trip_id, filename, content_type, caption, position, created_at
		FROM media WHERE visit_id = $1 ORDER BY position`, visitID)
	if err != nil {
		return nil, fmt.Errorf("list media: %w", err)
	}
	defer rows.Close()

	var result []*media.Media
	for rows.Next() {
		var m media.Media
		if err := rows.Scan(&m.ID, &m.VisitID, &m.TravelLegID, &m.TripID, &m.Filename, &m.ContentType, &m.Caption, &m.Position, &m.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan media: %w", err)
		}
		result = append(result, &m)
	}
	return result, nil
}

func (r *MediaRepository) ListByTravelLeg(ctx context.Context, travelLegID string) ([]*media.Media, error) {
	return r.list(ctx, `SELECT id, COALESCE(visit_id, ''), COALESCE(travel_leg_id, ''), trip_id, filename, content_type, caption, position, created_at FROM media WHERE travel_leg_id = $1 ORDER BY position`, travelLegID)
}

func (r *MediaRepository) ListByOwner(ctx context.Context, owner media.Owner) ([]*media.Media, error) {
	if err := owner.Validate(); err != nil {
		return nil, err
	}
	if owner.IsVisit() {
		return r.ListByVisit(ctx, owner.VisitID)
	}
	return r.ListByTravelLeg(ctx, owner.TravelLegID)
}

func (r *MediaRepository) ListByTrip(ctx context.Context, tripID string) ([]*media.Media, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, COALESCE(visit_id, ''), COALESCE(travel_leg_id, ''), trip_id, filename, content_type, caption, position, created_at
		FROM media WHERE trip_id = $1 ORDER BY visit_id NULLS LAST, travel_leg_id NULLS LAST, position`, tripID)
	if err != nil {
		return nil, fmt.Errorf("list media by trip: %w", err)
	}
	defer rows.Close()

	var result []*media.Media
	for rows.Next() {
		var m media.Media
		if err := rows.Scan(&m.ID, &m.VisitID, &m.TravelLegID, &m.TripID, &m.Filename, &m.ContentType, &m.Caption, &m.Position, &m.CreatedAt); err != nil {
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

func (r *MediaRepository) Move(ctx context.Context, mediaIDs []string, destination media.Owner) error {
	if err := destination.Validate(); err != nil {
		return err
	}
	if len(mediaIDs) == 0 {
		return media.ErrMediaRequired
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("move media: begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	rows, err := tx.Query(ctx, `
		SELECT id, COALESCE(visit_id, ''), COALESCE(travel_leg_id, ''), position
		FROM media WHERE id = ANY($1) ORDER BY position, id FOR UPDATE`, mediaIDs)
	if err != nil {
		return fmt.Errorf("move media: lock rows: %w", err)
	}
	type row struct {
		id       string
		visitID  string
		legID    string
		position int
	}
	selected := make([]row, 0, len(mediaIDs))
	for rows.Next() {
		var item row
		if err := rows.Scan(&item.id, &item.visitID, &item.legID, &item.position); err != nil {
			rows.Close()
			return fmt.Errorf("move media: scan rows: %w", err)
		}
		selected = append(selected, item)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return fmt.Errorf("move media: read rows: %w", err)
	}
	rows.Close()
	if len(selected) != len(mediaIDs) {
		return media.ErrIDMismatch
	}

	source := media.Owner{VisitID: selected[0].visitID, TravelLegID: selected[0].legID}
	if source == destination {
		return media.ErrSameOwner
	}
	for _, item := range selected[1:] {
		itemOwner := media.Owner{VisitID: item.visitID, TravelLegID: item.legID}
		if itemOwner != source {
			return media.ErrMixedOwners
		}
	}

	destinationColumn, destinationID := ownerColumn(destination)
	var maxPosition int
	if err := tx.QueryRow(ctx, `SELECT COALESCE(MAX(position), -1) FROM media WHERE `+destinationColumn+` = $1`, destinationID).Scan(&maxPosition); err != nil {
		return fmt.Errorf("move media: get destination position: %w", err)
	}

	for position, id := range mediaIDs {
		var query string
		if destination.IsVisit() {
			query = `UPDATE media SET visit_id = $1, travel_leg_id = NULL, position = $2 WHERE id = $3`
		} else {
			query = `UPDATE media SET visit_id = NULL, travel_leg_id = $1, position = $2 WHERE id = $3`
		}
		if _, err := tx.Exec(ctx, query, destinationID, maxPosition+position+1, id); err != nil {
			return fmt.Errorf("move media: update %s: %w", id, err)
		}
	}

	sourceColumn, sourceID := ownerColumn(source)
	if _, err := tx.Exec(ctx, `
		WITH ordered AS (
			SELECT id, ROW_NUMBER() OVER (ORDER BY position, id) - 1 AS new_position
			FROM media
			WHERE `+sourceColumn+` = $1 AND NOT (id = ANY($2))
		)
		UPDATE media AS m SET position = ordered.new_position
		FROM ordered WHERE m.id = ordered.id`, sourceID, mediaIDs); err != nil {
		return fmt.Errorf("move media: compact source positions: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("move media: commit: %w", err)
	}
	return nil
}

func (r *MediaRepository) NextPosition(ctx context.Context, visitID string) (int, error) {
	return r.NextPositionForOwner(ctx, media.VisitOwner(visitID))
}

func ownerColumn(owner media.Owner) (string, string) {
	if owner.IsVisit() {
		return "visit_id", owner.VisitID
	}
	return "travel_leg_id", owner.TravelLegID
}

func (r *MediaRepository) NextPositionForOwner(ctx context.Context, owner media.Owner) (int, error) {
	if err := owner.Validate(); err != nil {
		return 0, err
	}
	var pos int
	column, ownerID := "visit_id", owner.VisitID
	if !owner.IsVisit() {
		column, ownerID = "travel_leg_id", owner.TravelLegID
	}
	err := r.pool.QueryRow(ctx, `SELECT COALESCE(MAX(position), -1) + 1 FROM media WHERE `+column+` = $1`, ownerID).Scan(&pos)
	if err != nil {
		return 0, fmt.Errorf("next position: %w", err)
	}
	return pos, nil
}

func (r *MediaRepository) Reorder(ctx context.Context, visitID string, orderedIDs []string) error {
	return r.ReorderForOwner(ctx, media.VisitOwner(visitID), orderedIDs)
}

func (r *MediaRepository) ReorderForOwner(ctx context.Context, owner media.Owner, orderedIDs []string) error {
	if err := owner.Validate(); err != nil {
		return err
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("reorder media: begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	column, ownerID := "visit_id", owner.VisitID
	if !owner.IsVisit() {
		column, ownerID = "travel_leg_id", owner.TravelLegID
	}
	for i, id := range orderedIDs {
		_, err := tx.Exec(ctx,
			`UPDATE media SET position = $1 WHERE id = $2 AND `+column+` = $3`,
			i, id, ownerID,
		)
		if err != nil {
			return fmt.Errorf("reorder media: update %s: %w", id, err)
		}
	}

	return tx.Commit(ctx)
}

func (r *MediaRepository) list(ctx context.Context, query, ownerID string) ([]*media.Media, error) {
	rows, err := r.pool.Query(ctx, query, ownerID)
	if err != nil {
		return nil, fmt.Errorf("list media: %w", err)
	}
	defer rows.Close()
	result := make([]*media.Media, 0)
	for rows.Next() {
		var item media.Media
		if err := rows.Scan(&item.ID, &item.VisitID, &item.TravelLegID, &item.TripID, &item.Filename, &item.ContentType, &item.Caption, &item.Position, &item.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan media: %w", err)
		}
		result = append(result, &item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("list media: %w", err)
	}
	return result, nil
}
