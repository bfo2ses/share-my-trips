package graph

import (
	"github.com/bfosses/sharemytrips/internal/domain/day"
	"github.com/bfosses/sharemytrips/internal/domain/stage"
	"github.com/bfosses/sharemytrips/internal/domain/trip"
)

// Resolver is the root GraphQL resolver. It holds references to domain handlers.
type Resolver struct {
	tripHandler  *trip.Handler
	stageHandler *stage.Handler
	dayHandler   *day.Handler
}

// NewResolver creates a new root Resolver.
func NewResolver(tripHandler *trip.Handler, stageHandler *stage.Handler, dayHandler *day.Handler) *Resolver {
	return &Resolver{
		tripHandler:  tripHandler,
		stageHandler: stageHandler,
		dayHandler:   dayHandler,
	}
}
