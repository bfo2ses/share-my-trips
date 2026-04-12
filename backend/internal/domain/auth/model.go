package auth

import (
	"errors"
	"time"
)

// Domain errors.
var (
	ErrNameRequired           = errors.New("name is required")
	ErrEmailRequired          = errors.New("email is required")
	ErrPasswordRequired       = errors.New("password is required")
	ErrPasswordMismatch       = errors.New("passwords do not match")
	ErrEmailTaken             = errors.New("email is already taken")
	ErrNotFound               = errors.New("account not found")
	ErrInvalidCredentials     = errors.New("invalid credentials")
	ErrSetupAlreadyDone       = errors.New("admin account already exists")
	ErrCannotDeleteSelf       = errors.New("cannot delete your own account")
	ErrForbidden              = errors.New("forbidden")
	ErrInvalidResetToken      = errors.New("reset token is invalid or has already been used")
	ErrResetTokenExpired      = errors.New("reset token has expired")
	ErrInvalidCurrentPassword = errors.New("current password is incorrect")
	ErrPasswordTooLong        = errors.New("password must not exceed 128 characters")
	ErrInvalidRole            = errors.New("role must be family or editor")
)

// Role represents the role of a user account.
type Role string

const (
	RoleAdmin  Role = "admin"
	RoleEditor Role = "editor"
	RoleFamily Role = "family"
)

// User represents an authenticated account.
type User struct {
	ID           string
	Name         string
	Email        string
	PasswordHash string
	Role         Role
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// NewUser creates a new User with validated fields.
// passwordHash may be empty for family accounts created without a password.
func NewUser(id, name, email, passwordHash string, role Role) (*User, error) {
	if name == "" {
		return nil, ErrNameRequired
	}
	if email == "" {
		return nil, ErrEmailRequired
	}
	if passwordHash == "" && role == RoleAdmin {
		return nil, ErrPasswordRequired
	}
	now := time.Now()
	return &User{
		ID:           id,
		Name:         name,
		Email:        email,
		PasswordHash: passwordHash,
		Role:         role,
		CreatedAt:    now,
		UpdatedAt:    now,
	}, nil
}

// UpdatePassword replaces the stored password hash.
func (u *User) UpdatePassword(passwordHash string) {
	u.PasswordHash = passwordHash
	u.UpdatedAt = time.Now()
}

// resetTokenTTL is the duration before a password reset token expires.
const resetTokenTTL = 24 * time.Hour

// PasswordResetToken represents a one-time password reset request.
type PasswordResetToken struct {
	ID        string
	UserID    string
	Token     string
	ExpiresAt time.Time
	UsedAt    *time.Time
}

// NewPasswordResetToken creates a reset token valid for 24 hours.
func NewPasswordResetToken(id, userID, token string) *PasswordResetToken {
	return &PasswordResetToken{
		ID:        id,
		UserID:    userID,
		Token:     token,
		ExpiresAt: time.Now().Add(resetTokenTTL),
	}
}

// IsExpired reports whether the token has passed its expiry time.
func (t *PasswordResetToken) IsExpired() bool {
	return time.Now().After(t.ExpiresAt)
}

// IsUsed reports whether the token has already been consumed.
func (t *PasswordResetToken) IsUsed() bool {
	return t.UsedAt != nil
}

// LoginResult holds the result of a successful login or setup.
type LoginResult struct {
	User  *User
	Token string
}
