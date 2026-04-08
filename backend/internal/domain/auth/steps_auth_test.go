package auth_test

import (
	"context"
	"errors"
	"fmt"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/auth"
)

func registerAuthSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^je me connecte avec l'email "([^"]*)" et le mot de passe "([^"]*)"$`, tc.login)
	ctx.Step(`^je suis connecté et un token de session est retourné$`, tc.loggedInWithToken)
	ctx.Step(`^je tente de me connecter avec un email inconnu$`, tc.loginWithUnknownEmail)
	ctx.Step(`^je tente de me connecter avec un mot de passe incorrect$`, tc.loginWithWrongPassword)
	ctx.Step(`^un message d'erreur m'indique que les identifiants sont incorrects$`, tc.errInvalidCredentials)
	ctx.Step(`^l'erreur pour un email inconnu est identique à l'erreur pour un mot de passe incorrect$`, tc.sameErrorForEmailAndPassword)
	ctx.Step(`^je suis connecté en tant qu'administrateur$`, tc.loggedInAsAdmin)
	ctx.Step(`^je me déconnecte$`, tc.logout)
	ctx.Step(`^mon token de session n'est plus valide$`, tc.tokenInvalid)
	ctx.Step(`^je tente d'obtenir l'utilisateur courant sans token$`, tc.getCurrentUserWithoutToken)
}

func (tc *testContext) login(email, password string) error {
	tc.lastResult, tc.lastErr = tc.handler.Login(context.Background(), auth.LoginCommand{
		Email:    email,
		Password: password,
	})
	if tc.lastErr == nil && tc.lastResult != nil {
		tc.currentToken = tc.lastResult.Token
		tc.currentUserID = tc.lastResult.User.ID
	}
	return nil
}

func (tc *testContext) loggedInWithToken() error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	if tc.lastResult == nil || tc.lastResult.Token == "" {
		return fmt.Errorf("expected a session token")
	}
	return nil
}

func (tc *testContext) loginWithUnknownEmail() error {
	tc.lastResult, tc.lastErr = tc.handler.Login(context.Background(), auth.LoginCommand{
		Email:    "unknown@example.com",
		Password: "anypassword",
	})
	return nil
}

func (tc *testContext) loginWithWrongPassword() error {
	tc.lastResult, tc.lastErr = tc.handler.Login(context.Background(), auth.LoginCommand{
		Email:    "admin@example.com",
		Password: "wrongpassword",
	})
	return nil
}

func (tc *testContext) errInvalidCredentials() error {
	if !errors.Is(tc.lastErr, auth.ErrInvalidCredentials) {
		return fmt.Errorf("expected ErrInvalidCredentials, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) sameErrorForEmailAndPassword() error {
	_, errUnknownEmail := tc.handler.Login(context.Background(), auth.LoginCommand{
		Email:    "doesnotexist@example.com",
		Password: "anypassword",
	})
	_, errWrongPassword := tc.handler.Login(context.Background(), auth.LoginCommand{
		Email:    "admin@example.com",
		Password: "wrongpassword",
	})

	if !errors.Is(errUnknownEmail, auth.ErrInvalidCredentials) {
		return fmt.Errorf("expected ErrInvalidCredentials for unknown email, got: %v", errUnknownEmail)
	}
	if !errors.Is(errWrongPassword, auth.ErrInvalidCredentials) {
		return fmt.Errorf("expected ErrInvalidCredentials for wrong password, got: %v", errWrongPassword)
	}
	return nil
}

func (tc *testContext) loggedInAsAdmin() error {
	if err := tc.adminAccountExists(); err != nil {
		return err
	}
	return nil
}

func (tc *testContext) logout() error {
	tc.lastErr = tc.handler.Logout(context.Background(), auth.LogoutCommand{Token: tc.currentToken})
	return nil
}

func (tc *testContext) tokenInvalid() error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected logout to succeed, got: %w", tc.lastErr)
	}
	_, err := tc.handler.GetCurrentUser(context.Background(), auth.GetCurrentUserQuery{Token: tc.currentToken})
	if err == nil {
		return fmt.Errorf("expected token to be invalidated after logout")
	}
	if !errors.Is(err, auth.ErrInvalidCredentials) {
		return fmt.Errorf("expected ErrInvalidCredentials for invalidated token, got: %v", err)
	}
	return nil
}

func (tc *testContext) getCurrentUserWithoutToken() error {
	_, tc.lastErr = tc.handler.GetCurrentUser(context.Background(), auth.GetCurrentUserQuery{Token: ""})
	return nil
}
