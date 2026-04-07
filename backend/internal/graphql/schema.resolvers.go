package graph

// THIS CODE WILL BE UPDATED WITH SCHEMA CHANGES. PREVIOUS IMPLEMENTATION FOR SCHEMA CHANGES WILL BE KEPT IN THE COMMENT SECTION. IMPLEMENTATION FOR UNCHANGED SCHEMA WILL BE KEPT.

import (
	"context"
	"errors"
	"time"

	"github.com/bfosses/sharemytrips/internal/domain/trip"
)

// CreateTrip is the resolver for the createTrip field.
func (r *mutationResolver) CreateTrip(ctx context.Context, input CreateTripInput) (*TripPayload, error) {
	startDate, startErr := parseOptionalDate(input.StartDate)
	if startErr != nil {
		return &TripPayload{Errors: []*UserError{{Field: strPtr("startDate"), Message: "invalid date format, expected YYYY-MM-DD"}}}, nil
	}
	endDate, endErr := parseOptionalDate(input.EndDate)
	if endErr != nil {
		return &TripPayload{Errors: []*UserError{{Field: strPtr("endDate"), Message: "invalid date format, expected YYYY-MM-DD"}}}, nil
	}

	t, err := r.tripHandler.Create(ctx, trip.CreateTripCommand{
		Title:       input.Title,
		Country:     input.Country,
		Description: derefString(input.Description),
		CoverPhoto:  derefString(input.CoverPhoto),
		StartDate:   startDate,
		EndDate:     endDate,
	})
	if err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &TripPayload{Trip: toGraphQLTrip(t), Errors: []*UserError{}}, nil
}

// UpdateTrip is the resolver for the updateTrip field.
func (r *mutationResolver) UpdateTrip(ctx context.Context, id string, input UpdateTripInput) (*TripPayload, error) {
	startDate, startErr := parseOptionalDate(input.StartDate)
	if startErr != nil {
		return &TripPayload{Errors: []*UserError{{Field: strPtr("startDate"), Message: "invalid date format, expected YYYY-MM-DD"}}}, nil
	}
	endDate, endErr := parseOptionalDate(input.EndDate)
	if endErr != nil {
		return &TripPayload{Errors: []*UserError{{Field: strPtr("endDate"), Message: "invalid date format, expected YYYY-MM-DD"}}}, nil
	}

	t, err := r.tripHandler.Update(ctx, trip.UpdateTripCommand{
		ID:          id,
		Title:       input.Title,
		Country:     input.Country,
		Description: derefString(input.Description),
		CoverPhoto:  derefString(input.CoverPhoto),
		StartDate:   startDate,
		EndDate:     endDate,
	})
	if err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &TripPayload{Trip: toGraphQLTrip(t), Errors: []*UserError{}}, nil
}

// PublishTrip is the resolver for the publishTrip field.
func (r *mutationResolver) PublishTrip(ctx context.Context, id string) (*TripPayload, error) {
	t, err := r.tripHandler.Publish(ctx, trip.PublishTripCommand{ID: id})
	if err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &TripPayload{Trip: toGraphQLTrip(t), Errors: []*UserError{}}, nil
}

// UnpublishTrip is the resolver for the unpublishTrip field.
func (r *mutationResolver) UnpublishTrip(ctx context.Context, id string) (*TripPayload, error) {
	t, err := r.tripHandler.Unpublish(ctx, trip.UnpublishTripCommand{ID: id})
	if err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &TripPayload{Trip: toGraphQLTrip(t), Errors: []*UserError{}}, nil
}

// CloseTrip is the resolver for the closeTrip field.
func (r *mutationResolver) CloseTrip(ctx context.Context, id string, input CloseTripInput) (*TripPayload, error) {
	firstDay, err := time.Parse(time.DateOnly, input.FirstDay)
	if err != nil {
		return &TripPayload{Errors: []*UserError{{Field: strPtr("firstDay"), Message: "invalid date format, expected YYYY-MM-DD"}}}, nil
	}
	lastDay, err := time.Parse(time.DateOnly, input.LastDay)
	if err != nil {
		return &TripPayload{Errors: []*UserError{{Field: strPtr("lastDay"), Message: "invalid date format, expected YYYY-MM-DD"}}}, nil
	}

	t, err := r.tripHandler.Close(ctx, trip.CloseTripCommand{ID: id, FirstDay: firstDay, LastDay: lastDay})
	if err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &TripPayload{Trip: toGraphQLTrip(t), Errors: []*UserError{}}, nil
}

// ReopenTrip is the resolver for the reopenTrip field.
func (r *mutationResolver) ReopenTrip(ctx context.Context, id string) (*TripPayload, error) {
	t, err := r.tripHandler.Reopen(ctx, trip.ReopenTripCommand{ID: id})
	if err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &TripPayload{Trip: toGraphQLTrip(t), Errors: []*UserError{}}, nil
}

// DeleteTrip is the resolver for the deleteTrip field.
func (r *mutationResolver) DeleteTrip(ctx context.Context, id string) (*DeleteTripPayload, error) {
	err := r.tripHandler.Delete(ctx, trip.DeleteTripCommand{ID: id})
	if err != nil {
		return &DeleteTripPayload{Success: false, Errors: domainErrorToUserErrors(err)}, nil
	}
	return &DeleteTripPayload{Success: true, Errors: []*UserError{}}, nil
}

// Trips is the resolver for the trips field.
func (r *queryResolver) Trips(ctx context.Context, status []TripStatus) ([]*Trip, error) {
	statuses := make([]trip.Status, 0, len(status))
	for _, s := range status {
		statuses = append(statuses, todomainStatus(s))
	}

	trips, err := r.tripHandler.List(ctx, trip.ListTripsQuery{StatusIn: statuses})
	if err != nil {
		return nil, err
	}

	result := make([]*Trip, 0, len(trips))
	for _, t := range trips {
		result = append(result, toGraphQLTrip(t))
	}
	return result, nil
}

// Trip is the resolver for the trip field.
func (r *queryResolver) Trip(ctx context.Context, id string) (*Trip, error) {
	t, err := r.tripHandler.GetByID(ctx, trip.GetTripQuery{ID: id})
	if err != nil {
		if errors.Is(err, trip.ErrNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return toGraphQLTrip(t), nil
}

// Mutation returns MutationResolver implementation.
func (r *Resolver) Mutation() MutationResolver { return &mutationResolver{r} }

// Query returns QueryResolver implementation.
func (r *Resolver) Query() QueryResolver { return &queryResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
