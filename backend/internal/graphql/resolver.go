package graph

import (
	"context"

	"github.com/bfosses/sharemytrips/internal/domain/auth"
	"github.com/bfosses/sharemytrips/internal/domain/media"
	"github.com/bfosses/sharemytrips/internal/domain/stage"
	"github.com/bfosses/sharemytrips/internal/domain/travelleg"
	"github.com/bfosses/sharemytrips/internal/domain/trip"
	"github.com/bfosses/sharemytrips/internal/domain/visit"
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
	tripHandler        *trip.Handler
	stageHandler       *stage.Handler
	visitHandler       *visit.Handler
	authHandler        *auth.Handler
	mediaHandler       *media.Handler
	travelLegHandler   *travelleg.Handler
	distanceCalculator distanceCalculator
	itinerary          itineraryCoordinator
}

// NewResolver creates a new root Resolver.
func NewResolver(
	tripHandler *trip.Handler,
	stageHandler *stage.Handler,
	visitHandler *visit.Handler,
	authHandler *auth.Handler,
	mediaHandler *media.Handler,
	options ...ResolverOption,
) *Resolver {
	resolver := &Resolver{
		tripHandler:  tripHandler,
		stageHandler: stageHandler,
		visitHandler: visitHandler,
		authHandler:  authHandler,
		mediaHandler: mediaHandler,
	}
	for _, option := range options {
		option(resolver)
	}
	return resolver
}

// ResolverOption configures optional feature handlers without breaking
// existing server harnesses while a feature is rolled out.
type ResolverOption func(*Resolver)

// WithTravelLegHandler enables travel-leg GraphQL operations.
func WithTravelLegHandler(handler *travelleg.Handler) ResolverOption {
	return func(resolver *Resolver) { resolver.travelLegHandler = handler }
}

// WithRouteDistanceProvider enables road-distance calculation for cars.
func WithRouteDistanceProvider(provider RouteDistanceProvider) ResolverOption {
	return func(resolver *Resolver) { resolver.distanceCalculator.routeProvider = provider }
}
