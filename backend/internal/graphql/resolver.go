package graph

import "github.com/bfosses/sharemytrips/internal/domain/trip"

// Resolver is the root GraphQL resolver. It holds references to domain handlers.
type Resolver struct {
	tripHandler *trip.Handler
}

// NewResolver creates a new root Resolver.
func NewResolver(tripHandler *trip.Handler) *Resolver {
	return &Resolver{tripHandler: tripHandler}
}
