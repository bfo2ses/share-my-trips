package graph

// THIS CODE WILL BE UPDATED WITH SCHEMA CHANGES. PREVIOUS IMPLEMENTATION FOR SCHEMA CHANGES WILL BE KEPT IN THE COMMENT SECTION. IMPLEMENTATION FOR UNCHANGED SCHEMA WILL BE KEPT.

import (
	"context"
)

type Resolver struct{}

// CreateTrip is the resolver for the createTrip field.
func (r *mutationResolver) CreateTrip(ctx context.Context, input CreateTripInput) (*TripPayload, error) {
	panic("not implemented")
}

// UpdateTrip is the resolver for the updateTrip field.
func (r *mutationResolver) UpdateTrip(ctx context.Context, id string, input UpdateTripInput) (*TripPayload, error) {
	panic("not implemented")
}

// PublishTrip is the resolver for the publishTrip field.
func (r *mutationResolver) PublishTrip(ctx context.Context, id string) (*TripPayload, error) {
	panic("not implemented")
}

// UnpublishTrip is the resolver for the unpublishTrip field.
func (r *mutationResolver) UnpublishTrip(ctx context.Context, id string) (*TripPayload, error) {
	panic("not implemented")
}

// CloseTrip is the resolver for the closeTrip field.
func (r *mutationResolver) CloseTrip(ctx context.Context, id string, input CloseTripInput) (*TripPayload, error) {
	panic("not implemented")
}

// ReopenTrip is the resolver for the reopenTrip field.
func (r *mutationResolver) ReopenTrip(ctx context.Context, id string) (*TripPayload, error) {
	panic("not implemented")
}

// DeleteTrip is the resolver for the deleteTrip field.
func (r *mutationResolver) DeleteTrip(ctx context.Context, id string) (*DeleteTripPayload, error) {
	panic("not implemented")
}

// Trips is the resolver for the trips field.
func (r *queryResolver) Trips(ctx context.Context, status []TripStatus) ([]*Trip, error) {
	panic("not implemented")
}

// Trip is the resolver for the trip field.
func (r *queryResolver) Trip(ctx context.Context, id string) (*Trip, error) {
	panic("not implemented")
}

// Mutation returns MutationResolver implementation.
func (r *Resolver) Mutation() MutationResolver { return &mutationResolver{r} }

// Query returns QueryResolver implementation.
func (r *Resolver) Query() QueryResolver { return &queryResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
