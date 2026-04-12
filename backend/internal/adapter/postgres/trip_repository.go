package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/bfosses/sharemytrips/internal/domain/trip"
)

// TripRepository is a PostgreSQL implementation of trip.Repository.
type TripRepository struct {
	pool *pgxpool.Pool
}

func NewTripRepository(pool *pgxpool.Pool) *TripRepository {
	return &TripRepository{pool: pool}
}

func (r *TripRepository) Save(ctx context.Context, t *trip.Trip) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO trips (id, title, country, description, cover_photo, lat, lng, start_date, end_date, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		ON CONFLICT (id) DO UPDATE SET
			title = EXCLUDED.title,
			country = EXCLUDED.country,
			description = EXCLUDED.description,
			cover_photo = EXCLUDED.cover_photo,
			lat = EXCLUDED.lat,
			lng = EXCLUDED.lng,
			start_date = EXCLUDED.start_date,
			end_date = EXCLUDED.end_date,
			status = EXCLUDED.status,
			updated_at = EXCLUDED.updated_at`,
		t.ID, t.Title, t.Country, t.Description, t.CoverPhoto,
		t.Lat, t.Lng, nullableTime(t.StartDate), nullableTime(t.EndDate),
		string(t.Status), t.CreatedAt, t.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("save trip: %w", err)
	}
	return nil
}

func (r *TripRepository) FindByID(ctx context.Context, id string) (*trip.Trip, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, title, country, description, cover_photo, lat, lng, start_date, end_date, status, created_at, updated_at
		FROM trips WHERE id = $1`, id)
	t, err := scanTrip(row)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, trip.ErrNotFound
		}
		return nil, fmt.Errorf("find trip: %w", err)
	}
	return t, nil
}

func (r *TripRepository) List(ctx context.Context, filter trip.ListFilter) ([]*trip.Trip, error) {
	var rows pgx.Rows
	var err error

	if len(filter.StatusIn) == 0 {
		rows, err = r.pool.Query(ctx, `
			SELECT id, title, country, description, cover_photo, lat, lng, start_date, end_date, status, created_at, updated_at
			FROM trips ORDER BY created_at DESC`)
	} else {
		statuses := make([]string, len(filter.StatusIn))
		for i, s := range filter.StatusIn {
			statuses[i] = string(s)
		}
		rows, err = r.pool.Query(ctx, `
			SELECT id, title, country, description, cover_photo, lat, lng, start_date, end_date, status, created_at, updated_at
			FROM trips WHERE status = ANY($1) ORDER BY created_at DESC`, statuses)
	}
	if err != nil {
		return nil, fmt.Errorf("list trips: %w", err)
	}
	defer rows.Close()

	var result []*trip.Trip
	for rows.Next() {
		t, err := scanTrip(rows)
		if err != nil {
			return nil, fmt.Errorf("scan trip: %w", err)
		}
		result = append(result, t)
	}
	return result, nil
}

func (r *TripRepository) Delete(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM trips WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete trip: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return trip.ErrNotFound
	}
	return nil
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanTrip(row rowScanner) (*trip.Trip, error) {
	var t trip.Trip
	var status string
	var startDate, endDate *time.Time
	err := row.Scan(
		&t.ID, &t.Title, &t.Country, &t.Description, &t.CoverPhoto,
		&t.Lat, &t.Lng, &startDate, &endDate, &status,
		&t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	t.Status = trip.Status(status)
	if startDate != nil {
		t.StartDate = *startDate
	}
	if endDate != nil {
		t.EndDate = *endDate
	}
	return &t, nil
}

func nullableTime(t time.Time) *time.Time {
	if t.IsZero() {
		return nil
	}
	return &t
}
