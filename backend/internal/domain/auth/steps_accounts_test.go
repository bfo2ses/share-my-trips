package auth_test

import (
	"context"
	"errors"
	"fmt"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/auth"
)

func registerAccountSteps(ctx *godog.ScenarioContext, tc *testContext) {
	ctx.Step(`^je crée un compte famille avec le nom "([^"]*)", l'email "([^"]*)" et le mot de passe "([^"]*)"$`, tc.createFamilyAccount)
	ctx.Step(`^le compte famille "([^"]*)" est créé$`, tc.familyAccountCreated)
	ctx.Step(`^un compte famille "([^"]*)" avec l'email "([^"]*)" et le mot de passe "([^"]*)" existe$`, tc.familyAccountExists)
	ctx.Step(`^un compte existe avec l'email "([^"]*)"$`, tc.accountExistsWithEmail)
	ctx.Step(`^je tente de créer un compte avec l'email "([^"]*)"$`, tc.tryCreateAccountWithEmail)
	ctx.Step(`^un message d'erreur m'indique que l'email est déjà utilisé$`, tc.errEmailTaken)
	ctx.Step(`^je supprime le compte "([^"]*)"$`, tc.deleteAccount)
	ctx.Step(`^le compte est supprimé$`, tc.accountDeleted)
	ctx.Step(`^je tente de supprimer mon propre compte$`, tc.tryDeleteOwnAccount)
	ctx.Step(`^un message d'erreur m'indique que je ne peux pas supprimer mon propre compte$`, tc.errCannotDeleteSelf)
	ctx.Step(`^je suis connecté en tant que membre famille "([^"]*)"$`, tc.loggedInAsFamilyMember)
	ctx.Step(`^je tente de créer un compte depuis le compte famille$`, tc.tryCreateAccountAsFamilyMember)
	ctx.Step(`^un message d'erreur m'indique que l'action est interdite$`, tc.errForbidden)
}

func (tc *testContext) createFamilyAccount(name, email, password string) error {
	tc.lastUser, tc.lastErr = tc.handler.CreateAccount(context.Background(), auth.CreateAccountCommand{
		ActorID:         tc.currentUserID,
		Name:            name,
		Email:           email,
		Password:        password,
		PasswordConfirm: password,
	})
	return nil
}

func (tc *testContext) familyAccountCreated(name string) error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	if tc.lastUser == nil {
		return fmt.Errorf("expected user in result")
	}
	if tc.lastUser.Name != name {
		return fmt.Errorf("expected name %q, got %q", name, tc.lastUser.Name)
	}
	if tc.lastUser.Role != auth.RoleFamily {
		return fmt.Errorf("expected family role, got %q", tc.lastUser.Role)
	}
	return nil
}

func (tc *testContext) familyAccountExists(name, email, password string) error {
	// Ensure an admin exists to authorize account creation.
	if tc.currentUserID == "" {
		if err := tc.adminAccountExists(); err != nil {
			return err
		}
	}
	user, err := tc.handler.CreateAccount(context.Background(), auth.CreateAccountCommand{
		ActorID:         tc.currentUserID,
		Name:            name,
		Email:           email,
		Password:        password,
		PasswordConfirm: password,
	})
	if err != nil {
		return fmt.Errorf("setup family account: %w", err)
	}
	tc.lastUser = user
	return nil
}

func (tc *testContext) accountExistsWithEmail(email string) error {
	return tc.familyAccountExists("Tonton Robert", email, "MotDePasse456!")
}

func (tc *testContext) tryCreateAccountWithEmail(email string) error {
	tc.lastUser, tc.lastErr = tc.handler.CreateAccount(context.Background(), auth.CreateAccountCommand{
		ActorID:         tc.currentUserID,
		Name:            "Duplicate",
		Email:           email,
		Password:        "pass123",
		PasswordConfirm: "pass123",
	})
	return nil
}

func (tc *testContext) errEmailTaken() error {
	if !errors.Is(tc.lastErr, auth.ErrEmailTaken) {
		return fmt.Errorf("expected ErrEmailTaken, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) deleteAccount(name string) error {
	// Find the account by name.
	all, err := tc.handler.ListAccounts(context.Background(), auth.ListAccountsQuery{ActorID: tc.currentUserID})
	if err != nil {
		return fmt.Errorf("list accounts: %w", err)
	}
	for _, u := range all {
		if u.Name == name {
			tc.lastErr = tc.handler.DeleteAccount(context.Background(), auth.DeleteAccountCommand{
				ActorID:  tc.currentUserID,
				TargetID: u.ID,
			})
			tc.lastUser = u
			return nil
		}
	}
	return fmt.Errorf("account %q not found", name)
}

func (tc *testContext) accountDeleted() error {
	if tc.lastErr != nil {
		return fmt.Errorf("expected no error, got: %w", tc.lastErr)
	}
	// Verify the account is gone.
	_, err := tc.users.FindByID(context.Background(), tc.lastUser.ID)
	if err == nil {
		return fmt.Errorf("expected account to be deleted")
	}
	return nil
}

func (tc *testContext) tryDeleteOwnAccount() error {
	tc.lastErr = tc.handler.DeleteAccount(context.Background(), auth.DeleteAccountCommand{
		ActorID:  tc.currentUserID,
		TargetID: tc.currentUserID,
	})
	return nil
}

func (tc *testContext) errCannotDeleteSelf() error {
	if !errors.Is(tc.lastErr, auth.ErrCannotDeleteSelf) {
		return fmt.Errorf("expected ErrCannotDeleteSelf, got: %v", tc.lastErr)
	}
	return nil
}

func (tc *testContext) loggedInAsFamilyMember(email string) error {
	result, err := tc.handler.Login(context.Background(), auth.LoginCommand{
		Email:    email,
		Password: "MotDePasse456!",
	})
	if err != nil {
		return fmt.Errorf("login as family member: %w", err)
	}
	tc.currentToken = result.Token
	tc.currentUserID = result.User.ID
	return nil
}

func (tc *testContext) tryCreateAccountAsFamilyMember() error {
	tc.lastUser, tc.lastErr = tc.handler.CreateAccount(context.Background(), auth.CreateAccountCommand{
		ActorID:         tc.currentUserID,
		Name:            "New Account",
		Email:           "new@example.com",
		Password:        "pass123",
		PasswordConfirm: "pass123",
	})
	return nil
}

func (tc *testContext) errForbidden() error {
	if !errors.Is(tc.lastErr, auth.ErrForbidden) {
		return fmt.Errorf("expected ErrForbidden, got: %v", tc.lastErr)
	}
	return nil
}
