package memory

import (
	"context"
	"sync"
	"time"

	"github.com/bfosses/sharemytrips/internal/domain/auth"
)

// UserRepository is an in-memory implementation of auth.UserRepository.
type UserRepository struct {
	mu    sync.RWMutex
	users map[string]*auth.User // by ID
}

// NewUserRepository creates a new in-memory user repository.
func NewUserRepository() *UserRepository {
	return &UserRepository{users: make(map[string]*auth.User)}
}

func (r *UserRepository) Save(_ context.Context, u *auth.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	cp := *u
	r.users[u.ID] = &cp
	return nil
}

func (r *UserRepository) FindByID(_ context.Context, id string) (*auth.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	u, ok := r.users[id]
	if !ok {
		return nil, auth.ErrNotFound
	}
	cp := *u
	return &cp, nil
}

func (r *UserRepository) FindByEmail(_ context.Context, email string) (*auth.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, u := range r.users {
		if u.Email == email {
			cp := *u
			return &cp, nil
		}
	}
	return nil, auth.ErrNotFound
}

func (r *UserRepository) Delete(_ context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.users[id]; !ok {
		return auth.ErrNotFound
	}
	delete(r.users, id)
	return nil
}

func (r *UserRepository) HasAdmin(_ context.Context) (bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, u := range r.users {
		if u.Role == auth.RoleAdmin {
			return true, nil
		}
	}
	return false, nil
}

func (r *UserRepository) List(_ context.Context) ([]*auth.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	result := make([]*auth.User, 0, len(r.users))
	for _, u := range r.users {
		cp := *u
		result = append(result, &cp)
	}
	return result, nil
}

// SessionRepository is an in-memory implementation of auth.SessionRepository.
type SessionRepository struct {
	mu       sync.RWMutex
	sessions map[string]string // token -> userID
}

// NewSessionRepository creates a new in-memory session repository.
func NewSessionRepository() *SessionRepository {
	return &SessionRepository{sessions: make(map[string]string)}
}

func (r *SessionRepository) Save(_ context.Context, token, userID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.sessions[token] = userID
	return nil
}

func (r *SessionRepository) FindUserID(_ context.Context, token string) (string, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	id, ok := r.sessions[token]
	if !ok {
		return "", auth.ErrInvalidCredentials
	}
	return id, nil
}

func (r *SessionRepository) Delete(_ context.Context, token string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.sessions, token)
	return nil
}

func (r *SessionRepository) DeleteByUserID(_ context.Context, userID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for token, uid := range r.sessions {
		if uid == userID {
			delete(r.sessions, token)
		}
	}
	return nil
}

// PasswordResetRepository is an in-memory implementation of auth.PasswordResetRepository.
type PasswordResetRepository struct {
	mu     sync.RWMutex
	tokens map[string]*auth.PasswordResetToken // raw token -> record
	byID   map[string]*auth.PasswordResetToken // ID -> record
}

// NewPasswordResetRepository creates a new in-memory password reset repository.
func NewPasswordResetRepository() *PasswordResetRepository {
	return &PasswordResetRepository{
		tokens: make(map[string]*auth.PasswordResetToken),
		byID:   make(map[string]*auth.PasswordResetToken),
	}
}

func (r *PasswordResetRepository) Save(_ context.Context, t *auth.PasswordResetToken) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	cp := *t
	r.tokens[t.Token] = &cp
	r.byID[t.ID] = &cp
	return nil
}

func (r *PasswordResetRepository) FindByToken(_ context.Context, token string) (*auth.PasswordResetToken, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	t, ok := r.tokens[token]
	if !ok {
		return nil, auth.ErrInvalidResetToken
	}
	cp := *t
	return &cp, nil
}

func (r *PasswordResetRepository) MarkUsed(_ context.Context, id string, usedAt time.Time) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	t, ok := r.byID[id]
	if !ok {
		return auth.ErrInvalidResetToken
	}
	t.UsedAt = &usedAt
	// Keep both indexes in sync.
	r.tokens[t.Token] = t
	return nil
}
