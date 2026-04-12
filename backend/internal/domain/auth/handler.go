package auth

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
)

// Handler handles commands and queries for the auth context.
type Handler struct {
	users    UserRepository
	sessions SessionRepository
	resets   PasswordResetRepository
	hasher   PasswordHasher
	tokens   TokenGenerator
	mailer   Mailer
}

// NewHandler creates a new auth Handler.
func NewHandler(
	users UserRepository,
	sessions SessionRepository,
	resets PasswordResetRepository,
	hasher PasswordHasher,
	tokens TokenGenerator,
	mailer Mailer,
) *Handler {
	return &Handler{
		users:    users,
		sessions: sessions,
		resets:   resets,
		hasher:   hasher,
		tokens:   tokens,
		mailer:   mailer,
	}
}

// --- Commands ---

// SetupAdmin creates the first admin account and opens a session.
// Returns ErrSetupAlreadyDone if an admin already exists.
func (h *Handler) SetupAdmin(ctx context.Context, cmd SetupAdminCommand) (*LoginResult, error) {
	done, err := h.users.HasAdmin(ctx)
	if err != nil {
		return nil, fmt.Errorf("setup admin: %w", err)
	}
	if done {
		return nil, fmt.Errorf("setup admin: %w", ErrSetupAlreadyDone)
	}

	if err := h.validateNewAccount(cmd.Name, cmd.Email, cmd.Password, cmd.PasswordConfirm); err != nil {
		return nil, fmt.Errorf("setup admin: %w", err)
	}

	hash, err := h.hasher.Hash(cmd.Password)
	if err != nil {
		return nil, fmt.Errorf("setup admin: %w", err)
	}

	user, err := NewUser(uuid.New().String(), cmd.Name, cmd.Email, hash, RoleAdmin)
	if err != nil {
		return nil, fmt.Errorf("setup admin: %w", err)
	}

	if err := h.users.Save(ctx, user); err != nil {
		return nil, fmt.Errorf("setup admin: %w", err)
	}

	token, err := h.openSession(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("setup admin: %w", err)
	}

	return &LoginResult{User: user, Token: token}, nil
}

// Login authenticates a user and opens a session.
// Always returns ErrInvalidCredentials for unknown email or wrong password.
func (h *Handler) Login(ctx context.Context, cmd LoginCommand) (*LoginResult, error) {
	user, err := h.users.FindByEmail(ctx, cmd.Email)
	if err != nil {
		// Do not expose whether the email exists.
		return nil, fmt.Errorf("login: %w", ErrInvalidCredentials)
	}

	if err := h.hasher.Verify(cmd.Password, user.PasswordHash); err != nil {
		return nil, fmt.Errorf("login: %w", ErrInvalidCredentials)
	}

	token, err := h.openSession(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("login: %w", err)
	}

	return &LoginResult{User: user, Token: token}, nil
}

// Logout invalidates the given session token.
func (h *Handler) Logout(ctx context.Context, cmd LogoutCommand) error {
	if err := h.sessions.Delete(ctx, cmd.Token); err != nil {
		return fmt.Errorf("logout: %w", err)
	}
	return nil
}

// CreateAccount creates a new account. Actor must be an admin.
// When Password is empty the account is created without a usable password;
// the user must go through the password-reset flow to set one.
// Role defaults to "family" when empty. Only "family" and "editor" are accepted.
func (h *Handler) CreateAccount(ctx context.Context, cmd CreateAccountCommand) (*User, error) {
	if err := h.requireAdmin(ctx, cmd.ActorID); err != nil {
		return nil, fmt.Errorf("create account: %w", err)
	}

	role := RoleFamily
	if cmd.Role != "" {
		switch Role(cmd.Role) {
		case RoleFamily, RoleEditor:
			role = Role(cmd.Role)
		default:
			return nil, fmt.Errorf("create account: %w", ErrInvalidRole)
		}
	}

	if cmd.Password != "" {
		if err := h.validateNewAccount(cmd.Name, cmd.Email, cmd.Password, cmd.PasswordConfirm); err != nil {
			return nil, fmt.Errorf("create account: %w", err)
		}
	} else {
		if cmd.Name == "" {
			return nil, fmt.Errorf("create account: %w", ErrNameRequired)
		}
		if cmd.Email == "" {
			return nil, fmt.Errorf("create account: %w", ErrEmailRequired)
		}
	}

	if _, err := h.users.FindByEmail(ctx, cmd.Email); err == nil {
		return nil, fmt.Errorf("create account: %w", ErrEmailTaken)
	}

	var hash string
	if cmd.Password != "" {
		var err error
		hash, err = h.hasher.Hash(cmd.Password)
		if err != nil {
			return nil, fmt.Errorf("create account: %w", err)
		}
	}

	user, err := NewUser(uuid.New().String(), cmd.Name, cmd.Email, hash, role)
	if err != nil {
		return nil, fmt.Errorf("create account: %w", err)
	}

	if err := h.users.Save(ctx, user); err != nil {
		return nil, fmt.Errorf("create account: %w", err)
	}

	return user, nil
}

// DeleteAccount removes a family account. Actor must be an admin and cannot delete themselves.
func (h *Handler) DeleteAccount(ctx context.Context, cmd DeleteAccountCommand) error {
	if err := h.requireAdmin(ctx, cmd.ActorID); err != nil {
		return fmt.Errorf("delete account: %w", err)
	}

	if cmd.ActorID == cmd.TargetID {
		return fmt.Errorf("delete account: %w", ErrCannotDeleteSelf)
	}

	if _, err := h.users.FindByID(ctx, cmd.TargetID); err != nil {
		return fmt.Errorf("delete account: %w", ErrNotFound)
	}

	if err := h.users.Delete(ctx, cmd.TargetID); err != nil {
		return fmt.Errorf("delete account: %w", err)
	}

	return nil
}

// RequestPasswordReset sends a reset email. Silently ignores unknown emails.
func (h *Handler) RequestPasswordReset(ctx context.Context, cmd RequestPasswordResetCommand) error {
	user, err := h.users.FindByEmail(ctx, cmd.Email)
	if err != nil {
		// Unknown email: do not expose its existence.
		return nil
	}

	rawToken, err := h.tokens.Generate()
	if err != nil {
		return fmt.Errorf("request password reset: %w", err)
	}

	rt := NewPasswordResetToken(uuid.New().String(), user.ID, rawToken)
	if err := h.resets.Save(ctx, rt); err != nil {
		return fmt.Errorf("request password reset: %w", err)
	}

	go func() {
		if err := h.mailer.SendPasswordReset(context.Background(), user.Email, rawToken); err != nil {
			log.Printf("failed to send password reset email to %s: %v", user.Email, err)
		}
	}()

	return nil
}

// ResetPassword consumes a reset token and updates the user's password.
func (h *Handler) ResetPassword(ctx context.Context, cmd ResetPasswordCommand) (*User, error) {
	rt, err := h.resets.FindByToken(ctx, cmd.Token)
	if err != nil {
		return nil, fmt.Errorf("reset password: %w", ErrInvalidResetToken)
	}

	if rt.IsUsed() {
		return nil, fmt.Errorf("reset password: %w", ErrInvalidResetToken)
	}

	if rt.IsExpired() {
		return nil, fmt.Errorf("reset password: %w", ErrResetTokenExpired)
	}

	if cmd.NewPassword == "" {
		return nil, fmt.Errorf("reset password: %w", ErrPasswordRequired)
	}
	if len(cmd.NewPassword) > maxPasswordLen {
		return nil, fmt.Errorf("reset password: %w", ErrPasswordTooLong)
	}
	if cmd.NewPassword != cmd.NewPasswordConfirm {
		return nil, fmt.Errorf("reset password: %w", ErrPasswordMismatch)
	}

	// Consume the token before making any state change so it cannot be replayed
	// even if the subsequent steps fail.
	now := time.Now()
	if err := h.resets.MarkUsed(ctx, rt.ID, now); err != nil {
		return nil, fmt.Errorf("reset password: %w", err)
	}

	hash, err := h.hasher.Hash(cmd.NewPassword)
	if err != nil {
		return nil, fmt.Errorf("reset password: %w", err)
	}

	user, err := h.users.FindByID(ctx, rt.UserID)
	if err != nil {
		return nil, fmt.Errorf("reset password: %w", err)
	}

	user.UpdatePassword(hash)
	if err := h.users.Save(ctx, user); err != nil {
		return nil, fmt.Errorf("reset password: %w", err)
	}

	// Invalidate all existing sessions so any previously stolen token is revoked.
	if err := h.sessions.DeleteByUserID(ctx, user.ID); err != nil {
		return nil, fmt.Errorf("reset password: %w", err)
	}

	return user, nil
}

// ChangePassword updates the password of an authenticated user.
func (h *Handler) ChangePassword(ctx context.Context, cmd ChangePasswordCommand) (*User, error) {
	user, err := h.users.FindByID(ctx, cmd.UserID)
	if err != nil {
		return nil, fmt.Errorf("change password: %w", ErrNotFound)
	}

	if err := h.hasher.Verify(cmd.CurrentPassword, user.PasswordHash); err != nil {
		return nil, fmt.Errorf("change password: %w", ErrInvalidCurrentPassword)
	}

	if cmd.NewPassword == "" {
		return nil, fmt.Errorf("change password: %w", ErrPasswordRequired)
	}
	if len(cmd.NewPassword) > maxPasswordLen {
		return nil, fmt.Errorf("change password: %w", ErrPasswordTooLong)
	}
	if cmd.NewPassword != cmd.NewPasswordConfirm {
		return nil, fmt.Errorf("change password: %w", ErrPasswordMismatch)
	}

	hash, err := h.hasher.Hash(cmd.NewPassword)
	if err != nil {
		return nil, fmt.Errorf("change password: %w", err)
	}

	user.UpdatePassword(hash)
	if err := h.users.Save(ctx, user); err != nil {
		return nil, fmt.Errorf("change password: %w", err)
	}

	return user, nil
}

// --- Queries ---

// GetCurrentUser resolves a session token to the authenticated user.
func (h *Handler) GetCurrentUser(ctx context.Context, query GetCurrentUserQuery) (*User, error) {
	userID, err := h.sessions.FindUserID(ctx, query.Token)
	if err != nil {
		return nil, fmt.Errorf("get current user: %w", ErrInvalidCredentials)
	}

	user, err := h.users.FindByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get current user: %w", err)
	}

	return user, nil
}

// IsSetupDone reports whether an admin account already exists.
func (h *Handler) IsSetupDone(ctx context.Context, _ IsSetupDoneQuery) (bool, error) {
	done, err := h.users.HasAdmin(ctx)
	if err != nil {
		return false, fmt.Errorf("is setup done: %w", err)
	}
	return done, nil
}

// ListAccounts returns all user accounts. Actor must be an admin.
func (h *Handler) ListAccounts(ctx context.Context, query ListAccountsQuery) ([]*User, error) {
	if err := h.requireAdmin(ctx, query.ActorID); err != nil {
		return nil, fmt.Errorf("list accounts: %w", err)
	}

	users, err := h.users.List(ctx)
	if err != nil {
		return nil, fmt.Errorf("list accounts: %w", err)
	}

	return users, nil
}

// --- Helpers ---

func (h *Handler) openSession(ctx context.Context, userID string) (string, error) {
	token, err := h.tokens.Generate()
	if err != nil {
		return "", err
	}
	if err := h.sessions.Save(ctx, token, userID); err != nil {
		return "", err
	}
	return token, nil
}

func (h *Handler) requireAdmin(ctx context.Context, actorID string) error {
	actor, err := h.users.FindByID(ctx, actorID)
	if err != nil {
		return ErrForbidden
	}
	if actor.Role != RoleAdmin {
		return ErrForbidden
	}
	return nil
}

// maxPasswordLen is the maximum accepted password length. bcrypt silently
// truncates at 72 bytes; we cap earlier to prevent credential ambiguity and
// CPU-exhaustion attacks.
const maxPasswordLen = 128

func (h *Handler) validateNewAccount(name, email, password, passwordConfirm string) error {
	if name == "" {
		return ErrNameRequired
	}
	if email == "" {
		return ErrEmailRequired
	}
	if password == "" {
		return ErrPasswordRequired
	}
	if len(password) > maxPasswordLen {
		return ErrPasswordTooLong
	}
	if password != passwordConfirm {
		return ErrPasswordMismatch
	}
	return nil
}
