package crypto

import "github.com/google/uuid"

// UUIDTokenGenerator implements auth.TokenGenerator using random UUIDs.
type UUIDTokenGenerator struct{}

func (g *UUIDTokenGenerator) Generate() (string, error) {
	return uuid.New().String(), nil
}
