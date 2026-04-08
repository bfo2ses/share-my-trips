package auth_test

import (
	"context"
	"errors"
	"fmt"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/auth"
)

func registerSetupSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^aucun compte n'existe en base de données$`, tc.noAccountExists)
	ctx.Step(`^je crée le compte administrateur avec le nom "([^"]*)", l'email "([^"]*)" et le mot de passe "([^"]*)"$`, tc.setupAdmin)
	ctx.Step(`^le compte administrateur est créé$`, tc.adminAccountCreated)
	ctx.Step(`^une session est ouverte automatiquement$`, tc.sessionOpenedAutomatically)
	ctx.Step(`^je tente de créer le compte admin avec des mots de passe différents$`, tc.setupAdminWithMismatchedPasswords)
	ctx.Step(`^un message d'erreur m'indique que les mots de passe ne correspondent pas$`, tc.errPasswordMismatch)
	ctx.Step(`^un compte administrateur existe$`, tc.adminAccountExists)
	ctx.Step(`^je tente d'accéder au setup initial$`, tc.trySetupWhenAlreadyDone)
	ctx.Step(`^un message d'erreur m'indique que le setup est déjà effectué$`, tc.errSetupAlreadyDone)
}

func (tc *testContext) noAccountExists() error {
	return nil // default state is empty repo
}

func (tc *testContext) setupAdmin(name, email, password string) error {
	tc.lastResult, tc.lastErr = tc.handler.SetupAdmin(context.Background(), auth.SetupAdminCommand{
		Name:            name,
		Email:           email,
		Password:        password,
		PasswordConfirm: password,
	})
	return nil
}

func (tc *testContext) adminAccountCreated() error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	if tc.lastResult == nil || tc.lastResult.User == nil {
		return fmt.Errorf("expected user in result")
	}
	if tc.lastResult.User.Role != auth.RoleAdmin {
		return fmt.Errorf("expected admin role, got %q", tc.lastResult.User.Role)
	}
	tc.adminID = tc.lastResult.User.ID
	tc.currentToken = tc.lastResult.Token
	tc.currentUserID = tc.lastResult.User.ID
	return nil
}

func (tc *testContext) sessionOpenedAutomatically() error {
	if tc.lastResult == nil || tc.lastResult.Token == "" {
		return fmt.Errorf("expected a session token in result")
	}
	// Verify the token resolves to the admin user.
	user, err := tc.handler.GetCurrentUser(context.Background(), auth.GetCurrentUserQuery{Token: tc.lastResult.Token})
	if err != nil {
		return fmt.Errorf("expected session token to be valid: %w", err)
	}
	if user.ID != tc.lastResult.User.ID {
		return fmt.Errorf("session resolves to wrong user")
	}
	return nil
}

func (tc *testContext) setupAdminWithMismatchedPasswords() error {
	tc.lastResult, tc.lastErr = tc.handler.SetupAdmin(context.Background(), auth.SetupAdminCommand{
		Name:            "Admin",
		Email:           "admin@example.com",
		Password:        "password1",
		PasswordConfirm: "password2",
	})
	return nil
}

func (tc *testContext) errPasswordMismatch() error {
	if !errors.Is(tc.lastErr, auth.ErrPasswordMismatch) {
		return fmt.Errorf("expected ErrPasswordMismatch, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) adminAccountExists() error {
	result, err := tc.handler.SetupAdmin(context.Background(), auth.SetupAdminCommand{
		Name:            "Benjamin",
		Email:           "admin@example.com",
		Password:        "MonMotDePasse123!",
		PasswordConfirm: "MonMotDePasse123!",
	})
	if err != nil {
		return fmt.Errorf("setup admin: %w", err)
	}
	tc.adminID = result.User.ID
	tc.currentToken = result.Token
	tc.currentUserID = result.User.ID
	return nil
}

func (tc *testContext) trySetupWhenAlreadyDone() error {
	tc.lastResult, tc.lastErr = tc.handler.SetupAdmin(context.Background(), auth.SetupAdminCommand{
		Name:            "Second",
		Email:           "second@example.com",
		Password:        "pass",
		PasswordConfirm: "pass",
	})
	return nil
}

func (tc *testContext) errSetupAlreadyDone() error {
	if !errors.Is(tc.lastErr, auth.ErrSetupAlreadyDone) {
		return fmt.Errorf("expected ErrSetupAlreadyDone, got: %v", tc.lastErr)
	}
	return nil
}
