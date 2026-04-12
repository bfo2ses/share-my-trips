package postgres

import (
	"context"
	"fmt"
	"io/fs"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jackc/pgx/v5/pgxpool"
)

// NewPool creates a pgx connection pool from a DSN.
func NewPool(ctx context.Context, dsn string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, fmt.Errorf("postgres connect: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("postgres ping: %w", err)
	}
	return pool, nil
}

// RunMigrations applies all pending migrations using the provided filesystem.
// The FS should contain *.sql files directly (not in a subdirectory).
func RunMigrations(dsn string, sqlFS fs.FS) error {
	source, err := iofs.New(sqlFS, ".")
	if err != nil {
		return fmt.Errorf("migrations source: %w", err)
	}
	// golang-migrate pgx5 driver expects pgx5:// scheme with the rest of the DSN.
	pgxDSN := "pgx5://" + dsn[len("postgres://"):]
	m, err := migrate.NewWithSourceInstance("iofs", source, pgxDSN)
	if err != nil {
		return fmt.Errorf("migrations init: %w", err)
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migrations up: %w", err)
	}
	return nil
}
