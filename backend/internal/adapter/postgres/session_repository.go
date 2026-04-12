package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// SessionRepository is a PostgreSQL implementation of auth.SessionRepository.
type SessionRepository struct {
	pool *pgxpool.Pool
}

func NewSessionRepository(pool *pgxpool.Pool) *SessionRepository {
	return &SessionRepository{pool: pool}
}

func (r *SessionRepository) Save(ctx context.Context, token, userID string) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO sessions (token, user_id) VALUES ($1, $2)
		 ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id`,
		token, userID)
	if err != nil {
		return fmt.Errorf("save session: %w", err)
	}
	return nil
}

func (r *SessionRepository) FindUserID(ctx context.Context, token string) (string, error) {
	var userID string
	err := r.pool.QueryRow(ctx,
		`SELECT user_id FROM sessions WHERE token = $1`, token).Scan(&userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return "", fmt.Errorf("session not found")
		}
		return "", fmt.Errorf("find session: %w", err)
	}
	return userID, nil
}

func (r *SessionRepository) Delete(ctx context.Context, token string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM sessions WHERE token = $1`, token)
	if err != nil {
		return fmt.Errorf("delete session: %w", err)
	}
	return nil
}

func (r *SessionRepository) DeleteByUserID(ctx context.Context, userID string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM sessions WHERE user_id = $1`, userID)
	if err != nil {
		return fmt.Errorf("delete sessions by user: %w", err)
	}
	return nil
}
