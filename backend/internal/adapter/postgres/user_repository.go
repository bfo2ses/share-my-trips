package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/bfosses/sharemytrips/internal/domain/auth"
)

// UserRepository is a PostgreSQL implementation of auth.UserRepository.
type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

func (r *UserRepository) Save(ctx context.Context, u *auth.User) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			email = EXCLUDED.email,
			password_hash = EXCLUDED.password_hash,
			role = EXCLUDED.role,
			updated_at = EXCLUDED.updated_at`,
		u.ID, u.Name, u.Email, u.PasswordHash, string(u.Role), u.CreatedAt, u.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("save user: %w", err)
	}
	return nil
}

func (r *UserRepository) FindByID(ctx context.Context, id string) (*auth.User, error) {
	return r.scanUser(r.pool.QueryRow(ctx, `
		SELECT id, name, email, password_hash, role, created_at, updated_at
		FROM users WHERE id = $1`, id))
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*auth.User, error) {
	return r.scanUser(r.pool.QueryRow(ctx, `
		SELECT id, name, email, password_hash, role, created_at, updated_at
		FROM users WHERE email = $1`, email))
}

func (r *UserRepository) Delete(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete user: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return auth.ErrNotFound
	}
	return nil
}

func (r *UserRepository) HasAdmin(ctx context.Context) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM users WHERE role = 'admin')`).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("has admin: %w", err)
	}
	return exists, nil
}

func (r *UserRepository) List(ctx context.Context) ([]*auth.User, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, email, password_hash, role, created_at, updated_at
		FROM users ORDER BY created_at`)
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	defer rows.Close()

	var result []*auth.User
	for rows.Next() {
		var u auth.User
		var role string
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &role, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan user: %w", err)
		}
		u.Role = auth.Role(role)
		result = append(result, &u)
	}
	return result, nil
}

func (r *UserRepository) scanUser(row pgx.Row) (*auth.User, error) {
	var u auth.User
	var role string
	err := row.Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &role, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, auth.ErrNotFound
		}
		return nil, fmt.Errorf("scan user: %w", err)
	}
	u.Role = auth.Role(role)
	return &u, nil
}
