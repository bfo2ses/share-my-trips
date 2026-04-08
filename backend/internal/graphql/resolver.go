package graph

import (
	"context"

	"github.com/bfosses/sharemytrips/internal/domain/auth"
	"github.com/bfosses/sharemytrips/internal/domain/day"
	"github.com/bfosses/sharemytrips/internal/domain/stage"
	"github.com/bfosses/sharemytrips/internal/domain/trip"
)

// contextKey is the type for context keys in this package.
type contextKey string

const sessionTokenKey contextKey = "session_token"

// WithSessionToken stores the session token in the context.
func WithSessionToken(ctx context.Context, token string) context.Context {
	return context.WithValue(ctx, sessionTokenKey, token)
}

// sessionTokenFromContext retrieves the session token from the context.
func sessionTokenFromContext(ctx context.Context) string {
	v, _ := ctx.Value(sessionTokenKey).(string)
	return v
}

// Resolver is the root GraphQL resolver. It holds references to domain handlers.
type Resolver struct {
	tripHandler  *trip.Handler
	stageHandler *stage.Handler
	dayHandler   *day.Handler
	authHandler  *auth.Handler
}

// NewResolver creates a new root Resolver.
func NewResolver(
	tripHandler *trip.Handler,
	stageHandler *stage.Handler,
	dayHandler *day.Handler,
	authHandler *auth.Handler,
) *Resolver {
	return &Resolver{
		tripHandler:  tripHandler,
		stageHandler: stageHandler,
		dayHandler:   dayHandler,
		authHandler:  authHandler,
	}
}
