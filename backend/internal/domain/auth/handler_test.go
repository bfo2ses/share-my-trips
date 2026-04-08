package auth_test

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/cucumber/godog"

	"github.com/bfosses/sharemytrips/internal/domain/auth"
)

// --- Test doubles ---

// stubHasher stores passwords in plain text for test simplicity.
type stubHasher struct{}

func (s *stubHasher) Hash(password string) (string, error) {
	if password == "" {
		return "", errors.New("empty password")
	}
	return "hash:" + password, nil
}

func (s *stubHasher) Verify(password, hash string) error {
	if "hash:"+password == hash {
		return nil
	}
	return errors.New("wrong password")
}

// stubTokenGenerator returns predictable sequential tokens.
type stubTokenGenerator struct {
	counter int
}

func (s *stubTokenGenerator) Generate() (string, error) {
	s.counter++
	return fmt.Sprintf("token-%d", s.counter), nil
}

// stubMailer records sent password reset emails.
type stubMailer struct {
	sent []sentMail
}

type sentMail struct {
	email string
	token string
}

func (m *stubMailer) SendPasswordReset(_ context.Context, email, token string) error {
	m.sent = append(m.sent, sentMail{email: email, token: token})
	return nil
}

func (m *stubMailer) lastToken() string {
	if len(m.sent) == 0 {
		return ""
	}
	return m.sent[len(m.sent)-1].token
}

// userRepo is an in-memory auth.UserRepository for tests.
type userRepo struct {
	users map[string]*auth.User // by id
}

func newUserRepo() *userRepo {
	return &userRepo{users: make(map[string]*auth.User)}
}

func (r *userRepo) Save(_ context.Context, u *auth.User) error {
	cp := *u
	r.users[u.ID] = &cp
	return nil
}

func (r *userRepo) FindByID(_ context.Context, id string) (*auth.User, error) {
	u, ok := r.users[id]
	if !ok {
		return nil, auth.ErrNotFound
	}
	cp := *u
	return &cp, nil
}

func (r *userRepo) FindByEmail(_ context.Context, email string) (*auth.User, error) {
	for _, u := range r.users {
		if u.Email == email {
			cp := *u
			return &cp, nil
		}
	}
	return nil, auth.ErrNotFound
}

func (r *userRepo) Delete(_ context.Context, id string) error {
	if _, ok := r.users[id]; !ok {
		return auth.ErrNotFound
	}
	delete(r.users, id)
	return nil
}

func (r *userRepo) HasAdmin(_ context.Context) (bool, error) {
	for _, u := range r.users {
		if u.Role == auth.RoleAdmin {
			return true, nil
		}
	}
	return false, nil
}

func (r *userRepo) List(_ context.Context) ([]*auth.User, error) {
	result := make([]*auth.User, 0, len(r.users))
	for _, u := range r.users {
		cp := *u
		result = append(result, &cp)
	}
	return result, nil
}

// sessionRepo is an in-memory auth.SessionRepository for tests.
type sessionRepo struct {
	sessions map[string]string // token -> userID
}

func newSessionRepo() *sessionRepo {
	return &sessionRepo{sessions: make(map[string]string)}
}

func (r *sessionRepo) Save(_ context.Context, token, userID string) error {
	r.sessions[token] = userID
	return nil
}

func (r *sessionRepo) FindUserID(_ context.Context, token string) (string, error) {
	id, ok := r.sessions[token]
	if !ok {
		return "", auth.ErrInvalidCredentials
	}
	return id, nil
}

func (r *sessionRepo) Delete(_ context.Context, token string) error {
	delete(r.sessions, token)
	return nil
}

// resetRepo is an in-memory auth.PasswordResetRepository for tests.
type resetRepo struct {
	tokens map[string]*auth.PasswordResetToken // token -> reset token
}

func newResetRepo() *resetRepo {
	return &resetRepo{tokens: make(map[string]*auth.PasswordResetToken)}
}

func (r *resetRepo) Save(_ context.Context, t *auth.PasswordResetToken) error {
	cp := *t
	r.tokens[t.Token] = &cp
	return nil
}

func (r *resetRepo) FindByToken(_ context.Context, token string) (*auth.PasswordResetToken, error) {
	t, ok := r.tokens[token]
	if !ok {
		return nil, auth.ErrInvalidResetToken
	}
	cp := *t
	return &cp, nil
}

func (r *resetRepo) MarkUsed(_ context.Context, id string, usedAt time.Time) error {
	for _, t := range r.tokens {
		if t.ID == id {
			t.UsedAt = &usedAt
			return nil
		}
	}
	return auth.ErrInvalidResetToken
}

// --- Test context ---

type testContext struct {
	handler       *auth.Handler
	users         *userRepo
	sessions      *sessionRepo
	resets        *resetRepo
	tokenGen      *stubTokenGenerator
	mailer        *stubMailer
	adminID       string
	currentToken  string
	currentUserID string
	lastResult    *auth.LoginResult
	lastUser      *auth.User
	lastErr       error
}

func newTestContext() *testContext {
	users := newUserRepo()
	sessions := newSessionRepo()
	resets := newResetRepo()
	tokenGen := &stubTokenGenerator{}
	mailer := &stubMailer{}
	return &testContext{
		handler:  auth.NewHandler(users, sessions, resets, &stubHasher{}, tokenGen, mailer),
		users:    users,
		sessions: sessions,
		resets:   resets,
		tokenGen: tokenGen,
		mailer:   mailer,
	}
}

func InitializeScenario(ctx *godog.ScenarioContext) {
	tc := newTestContext()

	ctx.Before(func(ctx context.Context, sc *godog.Scenario) (context.Context, error) {
		*tc = *newTestContext()
		return ctx, nil
	})

	registerSetupSteps(ctx, tc)
	registerAuthSteps(ctx, tc)
	registerAccountSteps(ctx, tc)
	registerResetSteps(ctx, tc)
	registerPasswordSteps(ctx, tc)
}

func TestFeatures(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{"testdata"},
			TestingT: t,
		},
	}

	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
