package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/bfosses/sharemytrips/internal/domain/auth"
)

// ResetRepository is a PostgreSQL implementation of auth.PasswordResetRepository.
type ResetRepository struct {
	pool *pgxpool.Pool
}

func NewResetRepository(pool *pgxpool.Pool) *ResetRepository {
	return &ResetRepository{pool: pool}
}

func (r *ResetRepository) Save(ctx context.Context, t *auth.PasswordResetToken) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used_at)
		VALUES ($1, $2, $3, $4, $5)`,
		t.ID, t.UserID, t.Token, t.ExpiresAt, t.UsedAt,
	)
	if err != nil {
		return fmt.Errorf("save reset token: %w", err)
	}
	return nil
}

func (r *ResetRepository) FindByToken(ctx context.Context, token string) (*auth.PasswordResetToken, error) {
	var t auth.PasswordResetToken
	err := r.pool.QueryRow(ctx, `
		SELECT id, user_id, token, expires_at, used_at
		FROM password_reset_tokens WHERE token = $1`, token).Scan(
		&t.ID, &t.UserID, &t.Token, &t.ExpiresAt, &t.UsedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, auth.ErrInvalidResetToken
		}
		return nil, fmt.Errorf("find reset token: %w", err)
	}
	return &t, nil
}

func (r *ResetRepository) MarkUsed(ctx context.Context, id string, usedAt time.Time) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE password_reset_tokens SET used_at = $1 WHERE id = $2`,
		usedAt, id)
	if err != nil {
		return fmt.Errorf("mark reset token used: %w", err)
	}
	return nil
}
