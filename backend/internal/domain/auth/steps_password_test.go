package auth_test

import (
	"context"
	"errors"
	"fmt"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/auth"
)

func registerPasswordSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^je change mon mot de passe en renseignant "([^"]*)" comme mot de passe actuel et "([^"]*)" comme nouveau mot de passe$`, tc.changePassword)
	ctx.Step(`^mon mot de passe est mis à jour$`, tc.passwordChangedSuccessfully)
	ctx.Step(`^je tente de changer mon mot de passe avec un mot de passe actuel incorrect$`, tc.changePasswordWithWrongCurrent)
	ctx.Step(`^un message d'erreur m'indique que le mot de passe actuel est incorrect$`, tc.errInvalidCurrentPassword)
}

func (tc *testContext) changePassword(currentPassword, newPassword string) error {
	tc.lastUser, tc.lastErr = tc.handler.ChangePassword(context.Background(), auth.ChangePasswordCommand{
		UserID:             tc.currentUserID,
		CurrentPassword:    currentPassword,
		NewPassword:        newPassword,
		NewPasswordConfirm: newPassword,
	})
	return nil
}

func (tc *testContext) passwordChangedSuccessfully() error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	if tc.lastUser == nil {
		return fmt.Errorf("expected user in result")
	}
	return nil
}

func (tc *testContext) changePasswordWithWrongCurrent() error {
	tc.lastUser, tc.lastErr = tc.handler.ChangePassword(context.Background(), auth.ChangePasswordCommand{
		UserID:             tc.currentUserID,
		CurrentPassword:    "wrongpassword",
		NewPassword:        "NouveauMDP456!",
		NewPasswordConfirm: "NouveauMDP456!",
	})
	return nil
}

func (tc *testContext) errInvalidCurrentPassword() error {
	if !errors.Is(tc.lastErr, auth.ErrInvalidCurrentPassword) {
		return fmt.Errorf("expected ErrInvalidCurrentPassword, got: %v", tc.lastErr)
	}
	return nil
}
