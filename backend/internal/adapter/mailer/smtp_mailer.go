package mailer

import (
	"context"
	"fmt"
	"net/smtp"
)

// SMTPMailer implements auth.Mailer using a standard SMTP server.
type SMTPMailer struct {
	host         string
	port         string
	from         string
	auth         smtp.Auth
	resetURLBase string
}

// SMTPConfig holds the configuration for an SMTP mailer.
type SMTPConfig struct {
	Host         string // SMTP server host
	Port         string // SMTP server port
	From         string // Sender email address
	Username     string // SMTP username (empty to skip auth)
	Password     string // SMTP password
	ResetURLBase string // Base URL for password reset links
}

// NewSMTPMailer creates a mailer that sends emails via SMTP.
func NewSMTPMailer(cfg SMTPConfig) *SMTPMailer {
	var auth smtp.Auth
	if cfg.Username != "" {
		auth = smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.Host)
	}
	return &SMTPMailer{
		host:         cfg.Host,
		port:         cfg.Port,
		from:         cfg.From,
		auth:         auth,
		resetURLBase: cfg.ResetURLBase,
	}
}

func (m *SMTPMailer) SendPasswordReset(_ context.Context, email, token string) error {
	resetURL := fmt.Sprintf("%s?token=%s", m.resetURLBase, token)

	msg := fmt.Sprintf("From: %s\r\n"+
		"To: %s\r\n"+
		"Subject: ShareMyTrips — Reset your password\r\n"+
		"MIME-Version: 1.0\r\n"+
		"Content-Type: text/plain; charset=utf-8\r\n"+
		"\r\n"+
		"Hello,\r\n\r\n"+
		"Click the link below to reset your password:\r\n\r\n"+
		"%s\r\n\r\n"+
		"If you did not request this, you can safely ignore this email.\r\n",
		m.from, email, resetURL,
	)

	addr := fmt.Sprintf("%s:%s", m.host, m.port)
	return smtp.SendMail(addr, m.auth, m.from, []string{email}, []byte(msg))
}
