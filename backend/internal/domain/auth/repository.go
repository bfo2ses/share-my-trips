package auth

import (
	"context"
	"time"
)

// UserRepository is the port for user persistence.
type UserRepository interface {
	Save(ctx context.Context, user *User) error
	FindByID(ctx context.Context, id string) (*User, error)
	FindByEmail(ctx context.Context, email string) (*User, error)
	Delete(ctx context.Context, id string) error
	HasAdmin(ctx context.Context) (bool, error)
	List(ctx context.Context) ([]*User, error)
}

// SessionRepository is the port for opaque session token persistence.
type SessionRepository interface {
	Save(ctx context.Context, token, userID string) error
	FindUserID(ctx context.Context, token string) (string, error)
	Delete(ctx context.Context, token string) error
	// DeleteByUserID removes all sessions for a given user (e.g. after a password reset).
	DeleteByUserID(ctx context.Context, userID string) error
}

// PasswordResetRepository is the port for password reset token persistence.
type PasswordResetRepository interface {
	Save(ctx context.Context, t *PasswordResetToken) error
	FindByToken(ctx context.Context, token string) (*PasswordResetToken, error)
	MarkUsed(ctx context.Context, id string, usedAt time.Time) error
}

// PasswordHasher is the port for hashing and verifying passwords.
type PasswordHasher interface {
	Hash(password string) (string, error)
	Verify(password, hash string) error
}

// TokenGenerator is the port for generating random opaque tokens.
type TokenGenerator interface {
	Generate() (string, error)
}

// Mailer is the port for sending transactional emails.
// The implementation is responsible for constructing the reset URL from the token.
type Mailer interface {
	SendPasswordReset(ctx context.Context, email, token string) error
}
