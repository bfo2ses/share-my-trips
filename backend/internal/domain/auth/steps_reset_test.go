package auth_test

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/auth"
)

func registerResetSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^je demande une réinitialisation pour l'email "([^"]*)"$`, tc.requestReset)
	ctx.Step(`^un email de réinitialisation est envoyé$`, tc.resetEmailSent)
	ctx.Step(`^un token de réinitialisation valide existe pour "([^"]*)"$`, tc.validResetTokenExists)
	ctx.Step(`^je réinitialise le mot de passe avec "([^"]*)" et le token valide$`, tc.resetPasswordWithToken)
	ctx.Step(`^le mot de passe est mis à jour$`, tc.passwordUpdated)
	ctx.Step(`^je peux me connecter avec le nouveau mot de passe "([^"]*)"$`, tc.canLoginWithNewPassword)
	ctx.Step(`^un token de réinitialisation a déjà été utilisé$`, tc.usedResetTokenExists)
	ctx.Step(`^je tente de réinitialiser le mot de passe avec ce token$`, tc.tryResetWithUsedToken)
	ctx.Step(`^un message d'erreur m'indique que le token est invalide$`, tc.errInvalidResetToken)
	ctx.Step(`^un token de réinitialisation est expiré$`, tc.expiredResetTokenExists)
	ctx.Step(`^je tente de réinitialiser le mot de passe avec ce token expiré$`, tc.tryResetWithExpiredToken)
	ctx.Step(`^un message d'erreur m'indique que le token a expiré$`, tc.errResetTokenExpired)
	ctx.Step(`^je demande une réinitialisation pour un email inconnu$`, tc.requestResetForUnknownEmail)
	ctx.Step(`^aucune erreur n'est retournée$`, tc.noError)
}

func (tc *testContext) requestReset(email string) error {
	tc.lastErr = tc.handler.RequestPasswordReset(context.Background(), auth.RequestPasswordResetCommand{
		Email: email,
	})
	return nil
}

func (tc *testContext) resetEmailSent() error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	if len(tc.mailer.sent) == 0 {
		return fmt.Errorf("expected a reset email to be sent")
	}
	return nil
}

func (tc *testContext) validResetTokenExists(email string) error {
	if err := tc.adminAccountExists(); err != nil {
		return err
	}
	if err := tc.requestReset(email); err != nil {
		return err
	}
	return nil
}

func (tc *testContext) resetPasswordWithToken(newPassword string) error {
	token := tc.mailer.lastToken()
	tc.lastUser, tc.lastErr = tc.handler.ResetPassword(context.Background(), auth.ResetPasswordCommand{
		Token:              token,
		NewPassword:        newPassword,
		NewPasswordConfirm: newPassword,
	})
	return nil
}

func (tc *testContext) passwordUpdated() error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	if tc.lastUser == nil {
		return fmt.Errorf("expected user in result")
	}
	return nil
}

func (tc *testContext) canLoginWithNewPassword(password string) error {
	result, err := tc.handler.Login(context.Background(), auth.LoginCommand{
		Email:    tc.lastUser.Email,
		Password: password,
	})
	if err != nil {
		return fmt.Errorf("expected login with new password to succeed: %w", err)
	}
	if result.Token == "" {
		return fmt.Errorf("expected a session token")
	}
	return nil
}

func (tc *testContext) usedResetTokenExists() error {
	if err := tc.adminAccountExists(); err != nil {
		return err
	}
	if err := tc.requestReset("admin@example.com"); err != nil {
		return err
	}
	// Consume the token once.
	token := tc.mailer.lastToken()
	_, err := tc.handler.ResetPassword(context.Background(), auth.ResetPasswordCommand{
		Token:              token,
		NewPassword:        "NouveauMDP123!",
		NewPasswordConfirm: "NouveauMDP123!",
	})
	return err
}

func (tc *testContext) tryResetWithUsedToken() error {
	token := tc.mailer.lastToken()
	tc.lastUser, tc.lastErr = tc.handler.ResetPassword(context.Background(), auth.ResetPasswordCommand{
		Token:              token,
		NewPassword:        "AnotherMDP123!",
		NewPasswordConfirm: "AnotherMDP123!",
	})
	return nil
}

func (tc *testContext) errInvalidResetToken() error {
	if !errors.Is(tc.lastErr, auth.ErrInvalidResetToken) {
		return fmt.Errorf("expected ErrInvalidResetToken, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) expiredResetTokenExists() error {
	if err := tc.adminAccountExists(); err != nil {
		return err
	}
	if err := tc.requestReset("admin@example.com"); err != nil {
		return err
	}
	// Manually expire the token by backdating it.
	token := tc.mailer.lastToken()
	rt, err := tc.resets.FindByToken(context.Background(), token)
	if err != nil {
		return err
	}
	rt.ExpiresAt = time.Now().Add(-time.Hour)
	return tc.resets.Save(context.Background(), rt)
}

func (tc *testContext) tryResetWithExpiredToken() error {
	token := tc.mailer.lastToken()
	tc.lastUser, tc.lastErr = tc.handler.ResetPassword(context.Background(), auth.ResetPasswordCommand{
		Token:              token,
		NewPassword:        "NouveauMDP123!",
		NewPasswordConfirm: "NouveauMDP123!",
	})
	return nil
}

func (tc *testContext) errResetTokenExpired() error {
	if !errors.Is(tc.lastErr, auth.ErrResetTokenExpired) {
		return fmt.Errorf("expected ErrResetTokenExpired, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) requestResetForUnknownEmail() error {
	tc.lastErr = tc.handler.RequestPasswordReset(context.Background(), auth.RequestPasswordResetCommand{
		Email: "unknown@example.com",
	})
	return nil
}

func (tc *testContext) noError() error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	return nil
}
