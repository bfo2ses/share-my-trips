package crypto

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// BcryptHasher implements auth.PasswordHasher using bcrypt.
type BcryptHasher struct {
	cost int
}

// NewBcryptHasher creates a BcryptHasher with the given cost.
// Returns an error if cost < bcrypt.DefaultCost to prevent accidental weak hashing.
func NewBcryptHasher(cost int) (*BcryptHasher, error) {
	if cost < bcrypt.DefaultCost {
		return nil, fmt.Errorf("bcrypt cost %d is below minimum acceptable value %d", cost, bcrypt.DefaultCost)
	}
	return &BcryptHasher{cost: cost}, nil
}

func (h *BcryptHasher) Hash(password string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(password), h.cost)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func (h *BcryptHasher) Verify(password, hash string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}
