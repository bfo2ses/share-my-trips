package mailer

import (
	"context"
	"log"
)

// LogMailer implements auth.Mailer by logging reset tokens to stdout.
// Intended for development and Phase 1 only.
type LogMailer struct {
	resetURLBase string
}

// NewLogMailer creates a LogMailer that prints reset links to stdout.
func NewLogMailer(resetURLBase string) *LogMailer {
	return &LogMailer{resetURLBase: resetURLBase}
}

func (m *LogMailer) SendPasswordReset(_ context.Context, email, token string) error {
	log.Printf("[MAILER] Password reset for %s — link: %s?token=%s", email, m.resetURLBase, token)
	return nil
}
