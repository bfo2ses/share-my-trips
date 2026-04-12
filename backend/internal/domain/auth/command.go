package auth

// SetupAdminCommand creates the first admin account and opens a session.
type SetupAdminCommand struct {
	Name            string
	Email           string
	Password        string
	PasswordConfirm string
}

// LoginCommand authenticates a user and opens a session.
type LoginCommand struct {
	Email    string
	Password string
}

// LogoutCommand invalidates a session token.
type LogoutCommand struct {
	Token string
}

// CreateAccountCommand creates a new account (admin only).
// Role defaults to "family" when empty. Only "family" and "editor" are accepted.
type CreateAccountCommand struct {
	ActorID         string
	Name            string
	Email           string
	Password        string
	PasswordConfirm string
	Role            string
}

// DeleteAccountCommand removes an account (admin only, cannot self-delete).
type DeleteAccountCommand struct {
	ActorID  string
	TargetID string
}

// RequestPasswordResetCommand sends a reset email to the given address.
// If the email is unknown the command is silently ignored (no error exposed).
type RequestPasswordResetCommand struct {
	Email string
}

// ResetPasswordCommand consumes a reset token and sets a new password.
type ResetPasswordCommand struct {
	Token              string
	NewPassword        string
	NewPasswordConfirm string
}

// ChangePasswordCommand updates the password of an authenticated user.
type ChangePasswordCommand struct {
	UserID             string
	CurrentPassword    string
	NewPassword        string
	NewPasswordConfirm string
}
