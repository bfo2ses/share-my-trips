package auth

// GetCurrentUserQuery resolves a session token to a User.
type GetCurrentUserQuery struct {
	Token string
}

// IsSetupDoneQuery checks whether an admin account already exists.
type IsSetupDoneQuery struct{}

// ListAccountsQuery returns all accounts (admin only).
type ListAccountsQuery struct {
	ActorID string
}
