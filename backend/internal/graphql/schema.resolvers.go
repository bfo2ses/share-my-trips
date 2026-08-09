package graph

// THIS CODE WILL BE UPDATED WITH SCHEMA CHANGES. PREVIOUS IMPLEMENTATION FOR SCHEMA CHANGES WILL BE KEPT IN THE COMMENT SECTION. IMPLEMENTATION FOR UNCHANGED SCHEMA WILL BE KEPT.

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/bfosses/sharemytrips/internal/domain/auth"
	"github.com/bfosses/sharemytrips/internal/domain/media"
	"github.com/bfosses/sharemytrips/internal/domain/stage"
	"github.com/bfosses/sharemytrips/internal/domain/travelleg"
	"github.com/bfosses/sharemytrips/internal/domain/trip"
	"github.com/bfosses/sharemytrips/internal/domain/visit"
)

// CreateTrip is the resolver for the createTrip field.
func (r *mutationResolver) CreateTrip(ctx context.Context, input CreateTripInput) (*TripPayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
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
		Lat:         input.Lat,
		Lng:         input.Lng,
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
	if err := r.requireEditor(ctx); err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
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
		Lat:         input.Lat,
		Lng:         input.Lng,
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
	if err := r.requireEditor(ctx); err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	t, err := r.tripHandler.Publish(ctx, trip.PublishTripCommand{ID: id})
	if err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &TripPayload{Trip: toGraphQLTrip(t), Errors: []*UserError{}}, nil
}

// UnpublishTrip is the resolver for the unpublishTrip field.
func (r *mutationResolver) UnpublishTrip(ctx context.Context, id string) (*TripPayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	t, err := r.tripHandler.Unpublish(ctx, trip.UnpublishTripCommand{ID: id})
	if err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &TripPayload{Trip: toGraphQLTrip(t), Errors: []*UserError{}}, nil
}

// CloseTrip is the resolver for the closeTrip field.
func (r *mutationResolver) CloseTrip(ctx context.Context, id string, input CloseTripInput) (*TripPayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	firstVisitDate, err := time.Parse(time.DateOnly, input.FirstVisitDate)
	if err != nil {
		return &TripPayload{Errors: []*UserError{{Field: strPtr("firstVisitDate"), Message: "invalid date format, expected YYYY-MM-DD"}}}, nil
	}
	lastVisitDate, err := time.Parse(time.DateOnly, input.LastVisitDate)
	if err != nil {
		return &TripPayload{Errors: []*UserError{{Field: strPtr("lastVisitDate"), Message: "invalid date format, expected YYYY-MM-DD"}}}, nil
	}

	t, err := r.tripHandler.Close(ctx, trip.CloseTripCommand{ID: id, FirstVisitDate: firstVisitDate, LastVisitDate: lastVisitDate})
	if err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &TripPayload{Trip: toGraphQLTrip(t), Errors: []*UserError{}}, nil
}

// ReopenTrip is the resolver for the reopenTrip field.
func (r *mutationResolver) ReopenTrip(ctx context.Context, id string) (*TripPayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	t, err := r.tripHandler.Reopen(ctx, trip.ReopenTripCommand{ID: id})
	if err != nil {
		return &TripPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &TripPayload{Trip: toGraphQLTrip(t), Errors: []*UserError{}}, nil
}

// DeleteTrip is the resolver for the deleteTrip field.
func (r *mutationResolver) DeleteTrip(ctx context.Context, id string) (*DeleteTripPayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &DeleteTripPayload{Success: false, Errors: domainErrorToUserErrors(err)}, nil
	}
	err := r.tripHandler.Delete(ctx, trip.DeleteTripCommand{ID: id})
	if err != nil {
		return &DeleteTripPayload{Success: false, Errors: domainErrorToUserErrors(err)}, nil
	}
	return &DeleteTripPayload{Success: true, Errors: []*UserError{}}, nil
}

// AddStage is the resolver for the addStage field.
func (r *mutationResolver) AddStage(ctx context.Context, input AddStageInput) (*StagePayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &StagePayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	s, err := r.stageHandler.Add(ctx, stage.AddStageCommand{
		TripID:      input.TripID,
		City:        input.City,
		Name:        derefString(input.Name),
		Lat:         input.Lat,
		Lng:         input.Lng,
		Description: derefString(input.Description),
	})
	if err != nil {
		return &StagePayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &StagePayload{Stage: toGraphQLStage(s), Errors: []*UserError{}}, nil
}

// UpdateStage is the resolver for the updateStage field.
func (r *mutationResolver) UpdateStage(ctx context.Context, id string, input UpdateStageInput) (*StagePayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &StagePayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	existing, err := r.stageHandler.GetByID(ctx, stage.GetStageQuery{ID: id})
	if err != nil {
		return &StagePayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	coordinatesChanged := existing.Lat != input.Lat || existing.Lng != input.Lng
	s, err := r.stageHandler.Update(ctx, stage.UpdateStageCommand{
		ID:          id,
		City:        input.City,
		Name:        derefString(input.Name),
		Lat:         input.Lat,
		Lng:         input.Lng,
		Description: derefString(input.Description),
	})
	if err != nil {
		return &StagePayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	if r.travelLegHandler == nil || !coordinatesChanged {
		return &StagePayload{Stage: toGraphQLStage(s), Errors: []*UserError{}}, nil
	}
	legs, err := r.travelLegHandler.ListByTrip(ctx, travelleg.ListTravelLegsQuery{TripID: s.TripID})
	if err != nil {
		return &StagePayload{Stage: toGraphQLStage(s), Errors: domainErrorToUserErrors(err)}, nil
	}
	warnings, err := r.recalculateTravelLegDistances(ctx, travelleg.RecalculationRequestsForEndpoint(legs, s.ID))
	if err != nil {
		return &StagePayload{Stage: toGraphQLStage(s), Errors: domainErrorToUserErrors(err)}, nil
	}
	return &StagePayload{Stage: toGraphQLStage(s), Errors: []*UserError{}, RecalculationWarnings: warnings}, nil
}

// DeleteStage is the resolver for the deleteStage field.
func (r *mutationResolver) DeleteStage(ctx context.Context, id string, resolutionPlan []*TravelLegResolutionInput) (*DeleteStagePayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &DeleteStagePayload{Success: false, Errors: domainErrorToUserErrors(err)}, nil
	}
	item, err := r.stageHandler.GetByID(ctx, stage.GetStageQuery{ID: id})
	if err != nil {
		return &DeleteStagePayload{Success: false, Errors: domainErrorToUserErrors(err)}, nil
	}
	stages, visits, err := r.currentItinerary(ctx, item.TripID)
	if err != nil {
		return &DeleteStagePayload{Success: false, Errors: domainErrorToUserErrors(err)}, nil
	}
	warnings, err := r.resolveItineraryChange(ctx, item.TripID, proposedStagesWithout(stages, id), proposedVisitsWithoutStage(visits, id), resolutionPlan, func() error {
		return r.stageHandler.Delete(ctx, stage.DeleteStageCommand{ID: id})
	})
	if err != nil {
		return &DeleteStagePayload{Success: false, Errors: domainErrorToUserErrors(err)}, nil
	}
	return &DeleteStagePayload{Success: true, Errors: []*UserError{}, RecalculationWarnings: warnings}, nil
}

// AddVisit is the resolver for the addVisit field.
func (r *mutationResolver) AddVisit(ctx context.Context, input AddVisitInput) (*VisitPayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &VisitPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	date, err := time.Parse(dateFormat, input.Date)
	if err != nil {
		return &VisitPayload{Errors: []*UserError{{Field: strPtr("date"), Message: "invalid date format, expected YYYY-MM-DD"}}}, nil
	}
	stages, visits, err := r.currentItinerary(ctx, input.TripID)
	if err != nil {
		return &VisitPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	var v *visit.Visit
	warnings, err := r.resolveItineraryChange(ctx, input.TripID, stages, proposedVisitsWithAdded(visits, input.TripID, input.StageID, date), input.ResolutionPlan, func() error {
		var applyErr error
		v, applyErr = r.visitHandler.Add(ctx, visit.AddVisitCommand{
			TripID:      input.TripID,
			StageID:     input.StageID,
			Date:        date,
			Title:       derefString(input.Title),
			Description: derefString(input.Description),
			Lat:         input.Lat,
			Lng:         input.Lng,
		})
		return applyErr
	})
	if err != nil {
		return &VisitPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &VisitPayload{Visit: toGraphQLVisit(v), Errors: []*UserError{}, RecalculationWarnings: warnings}, nil
}

// UpdateVisit is the resolver for the updateVisit field.
func (r *mutationResolver) UpdateVisit(ctx context.Context, id string, input UpdateVisitInput) (*VisitPayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &VisitPayload{Errors: domainErrorToUserErrors(err)}, nil
	}

	// Load the existing visit even when date is omitted: its trip determines the
	// authoritative itinerary that must be preflighted.
	existing, err := r.visitHandler.GetByID(ctx, visit.GetVisitQuery{ID: id})
	if err != nil {
		return &VisitPayload{Errors: domainErrorToUserErrors(err)}, nil
	}

	// If date is provided, parse it; otherwise keep the existing visit's date.
	var dateVal time.Time
	if input.Date != nil {
		parsed, err := time.Parse(dateFormat, *input.Date)
		if err != nil {
			return &VisitPayload{Errors: []*UserError{{Field: strPtr("date"), Message: "invalid date format, expected YYYY-MM-DD"}}}, nil
		}
		dateVal = parsed
	} else {
		dateVal = existing.Date
	}

	stages, visits, err := r.currentItinerary(ctx, existing.TripID)
	if err != nil {
		return &VisitPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	var v *visit.Visit
	warnings, err := r.resolveItineraryChange(ctx, existing.TripID, stages, proposedVisitsWithDate(visits, id, dateVal), input.ResolutionPlan, func() error {
		var applyErr error
		v, applyErr = r.visitHandler.Update(ctx, visit.UpdateVisitCommand{
			ID:          id,
			Date:        dateVal,
			Title:       derefString(input.Title),
			Description: derefString(input.Description),
			Lat:         input.Lat,
			Lng:         input.Lng,
		})
		return applyErr
	})
	if err != nil {
		return &VisitPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &VisitPayload{Visit: toGraphQLVisit(v), Errors: []*UserError{}, RecalculationWarnings: warnings}, nil
}

// DeleteVisit is the resolver for the deleteVisit field.
func (r *mutationResolver) DeleteVisit(ctx context.Context, id string, resolutionPlan []*TravelLegResolutionInput) (*DeleteVisitPayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &DeleteVisitPayload{Success: false, Errors: domainErrorToUserErrors(err)}, nil
	}
	existing, err := r.visitHandler.GetByID(ctx, visit.GetVisitQuery{ID: id})
	if err != nil {
		return &DeleteVisitPayload{Success: false, Errors: domainErrorToUserErrors(err)}, nil
	}
	stages, visits, err := r.currentItinerary(ctx, existing.TripID)
	if err != nil {
		return &DeleteVisitPayload{Success: false, Errors: domainErrorToUserErrors(err)}, nil
	}
	warnings, err := r.resolveItineraryChange(ctx, existing.TripID, stages, proposedVisitsWithout(visits, id), resolutionPlan, func() error {
		return r.visitHandler.Delete(ctx, visit.DeleteVisitCommand{ID: id})
	})
	if err != nil {
		return &DeleteVisitPayload{Success: false, Errors: domainErrorToUserErrors(err)}, nil
	}
	return &DeleteVisitPayload{Success: true, Errors: []*UserError{}, RecalculationWarnings: warnings}, nil
}

// CreateTravelLeg is the resolver for the createTravelLeg field.
func (r *mutationResolver) CreateTravelLeg(ctx context.Context, input CreateTravelLegInput) (*TravelLegPayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &TravelLegPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	if r.travelLegHandler == nil {
		return &TravelLegPayload{Errors: travelLegUnavailableErrors()}, nil
	}
	leg, err := r.travelLegHandler.Add(ctx, travelleg.CreateTravelLegCommand{
		TripID:      input.TripID,
		FromStageID: input.FromStageID,
		ToStageID:   input.ToStageID,
		Transport:   toDomainTravelLegTransport(input.Transport),
		Description: derefString(input.Description),
		DistanceKm:  input.DistanceKm,
	})
	if err != nil {
		return &TravelLegPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &TravelLegPayload{TravelLeg: toGraphQLTravelLeg(leg), Errors: []*UserError{}}, nil
}

// UpdateTravelLeg is the resolver for the updateTravelLeg field.
func (r *mutationResolver) UpdateTravelLeg(ctx context.Context, id string, input UpdateTravelLegInput) (*TravelLegPayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &TravelLegPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	if r.travelLegHandler == nil {
		return &TravelLegPayload{Errors: travelLegUnavailableErrors()}, nil
	}
	leg, err := r.travelLegHandler.Update(ctx, travelleg.UpdateTravelLegCommand{
		ID:          id,
		Transport:   toDomainTravelLegTransport(input.Transport),
		Description: derefString(input.Description),
		DistanceKm:  input.DistanceKm,
	})
	if err != nil {
		return &TravelLegPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &TravelLegPayload{TravelLeg: toGraphQLTravelLeg(leg), Errors: []*UserError{}}, nil
}

// MoveTravelLeg is the resolver for the moveTravelLeg field.
func (r *mutationResolver) MoveTravelLeg(ctx context.Context, id string, input MoveTravelLegInput) (*TravelLegPayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &TravelLegPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	if r.travelLegHandler == nil {
		return &TravelLegPayload{Errors: travelLegUnavailableErrors()}, nil
	}
	leg, err := r.travelLegHandler.Move(ctx, travelleg.MoveTravelLegCommand{ID: id, FromStageID: input.FromStageID, ToStageID: input.ToStageID})
	if err != nil {
		return &TravelLegPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	warning, err := r.recalculateTravelLegDistance(ctx, leg.ID)
	if err != nil {
		return &TravelLegPayload{TravelLeg: toGraphQLTravelLeg(leg), Errors: domainErrorToUserErrors(err)}, nil
	}
	leg, err = r.travelLegHandler.GetByID(ctx, travelleg.GetTravelLegQuery{ID: leg.ID})
	if err != nil {
		return &TravelLegPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &TravelLegPayload{TravelLeg: toGraphQLTravelLeg(leg), Errors: []*UserError{}, RecalculationWarnings: compactRecalculationWarning(warning)}, nil
}

// DeleteTravelLeg is the resolver for the deleteTravelLeg field.
func (r *mutationResolver) DeleteTravelLeg(ctx context.Context, id string) (*DeleteTravelLegPayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &DeleteTravelLegPayload{Success: false, Errors: domainErrorToUserErrors(err)}, nil
	}
	if r.travelLegHandler == nil {
		return &DeleteTravelLegPayload{Success: false, Errors: travelLegUnavailableErrors()}, nil
	}
	if err := r.travelLegHandler.Delete(ctx, travelleg.DeleteTravelLegCommand{ID: id}); err != nil {
		return &DeleteTravelLegPayload{Success: false, Errors: domainErrorToUserErrors(err)}, nil
	}
	return &DeleteTravelLegPayload{Success: true, Errors: []*UserError{}}, nil
}

// CalculateTravelLegDistance is the resolver for the calculateTravelLegDistance field.
func (r *mutationResolver) CalculateTravelLegDistance(ctx context.Context, fromStageID string, toStageID string, transport TravelLegTransport) (*CalculateTravelLegDistancePayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &CalculateTravelLegDistancePayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	if r.travelLegHandler == nil {
		return &CalculateTravelLegDistancePayload{Errors: travelLegUnavailableErrors()}, nil
	}
	from, err := r.stageHandler.GetByID(ctx, stage.GetStageQuery{ID: fromStageID})
	if err != nil {
		return &CalculateTravelLegDistancePayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	if err := r.travelLegHandler.ValidateModifiable(ctx, from.TripID); err != nil {
		return &CalculateTravelLegDistancePayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	if err := r.travelLegHandler.ValidatePair(ctx, from.TripID, fromStageID, toStageID); err != nil {
		return &CalculateTravelLegDistancePayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	to, err := r.stageHandler.GetByID(ctx, stage.GetStageQuery{ID: toStageID})
	if err != nil {
		return &CalculateTravelLegDistancePayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	if !toDomainTravelLegTransport(transport).IsValid() {
		return &CalculateTravelLegDistancePayload{Errors: domainErrorToUserErrors(travelleg.ErrInvalidTransport)}, nil
	}
	distanceKm, err := r.distanceCalculator.calculate(ctx, toDomainTravelLegTransport(transport), from.Lat, from.Lng, to.Lat, to.Lng)
	if err != nil {
		return &CalculateTravelLegDistancePayload{Errors: []*UserError{{Field: strPtr("distanceKm"), Message: "road distance calculation is unavailable"}}}, nil
	}
	return &CalculateTravelLegDistancePayload{DistanceKm: &distanceKm, Errors: []*UserError{}}, nil
}

// AttachVisitToStage is the resolver for the attachVisitToStage field.
func (r *mutationResolver) AttachVisitToStage(ctx context.Context, visitID string, stageID string, resolutionPlan []*TravelLegResolutionInput) (*VisitPayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &VisitPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	existing, err := r.visitHandler.GetByID(ctx, visit.GetVisitQuery{ID: visitID})
	if err != nil {
		return &VisitPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	stages, visits, err := r.currentItinerary(ctx, existing.TripID)
	if err != nil {
		return &VisitPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	var v *visit.Visit
	warnings, err := r.resolveItineraryChange(ctx, existing.TripID, stages, visits, resolutionPlan, func() error {
		var applyErr error
		v, applyErr = r.visitHandler.AttachToStage(ctx, visit.AttachToStageCommand{VisitID: visitID, StageID: stageID})
		return applyErr
	})
	if err != nil {
		return &VisitPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &VisitPayload{Visit: toGraphQLVisit(v), Errors: []*UserError{}, RecalculationWarnings: warnings}, nil
}

// DetachVisitFromStage is the resolver for the detachVisitFromStage field.
func (r *mutationResolver) DetachVisitFromStage(ctx context.Context, visitID string, stageID string, resolutionPlan []*TravelLegResolutionInput) (*VisitPayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &VisitPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	existing, err := r.visitHandler.GetByID(ctx, visit.GetVisitQuery{ID: visitID})
	if err != nil {
		return &VisitPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	stages, visits, err := r.currentItinerary(ctx, existing.TripID)
	if err != nil {
		return &VisitPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	var v *visit.Visit
	warnings, err := r.resolveItineraryChange(ctx, existing.TripID, stages, proposedVisitsWithDetachedStage(visits, visitID, stageID), resolutionPlan, func() error {
		var applyErr error
		v, applyErr = r.visitHandler.DetachFromStage(ctx, visit.DetachFromStageCommand{VisitID: visitID, StageID: stageID})
		return applyErr
	})
	if err != nil {
		return &VisitPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &VisitPayload{Visit: toGraphQLVisit(v), Errors: []*UserError{}, RecalculationWarnings: warnings}, nil
}

// ReorderVisits is the resolver for the reorderVisits field.
func (r *mutationResolver) ReorderVisits(ctx context.Context, stageID string, date string, visitIDs []string) (*ReorderVisitsPayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &ReorderVisitsPayload{Visits: []*Visit{}, Errors: domainErrorToUserErrors(err)}, nil
	}
	parsed, err := time.Parse(dateFormat, date)
	if err != nil {
		return &ReorderVisitsPayload{Visits: []*Visit{}, Errors: []*UserError{{Field: strPtr("date"), Message: "invalid date format, expected YYYY-MM-DD"}}}, nil
	}
	list, err := r.visitHandler.Reorder(ctx, visit.ReorderVisitsCommand{
		StageID:  stageID,
		Date:     parsed,
		VisitIDs: visitIDs,
	})
	if err != nil {
		return &ReorderVisitsPayload{Visits: []*Visit{}, Errors: domainErrorToUserErrors(err)}, nil
	}
	return &ReorderVisitsPayload{Visits: toGraphQLVisitList(list), Errors: []*UserError{}}, nil
}

// SetupAdmin is the resolver for the setupAdmin field.
func (r *mutationResolver) SetupAdmin(ctx context.Context, input SetupAdminInput) (*AuthPayload, error) {
	result, err := r.authHandler.SetupAdmin(ctx, auth.SetupAdminCommand{
		Name:            input.Name,
		Email:           input.Email,
		Password:        input.Password,
		PasswordConfirm: input.PasswordConfirm,
	})
	if err != nil {
		return &AuthPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &AuthPayload{Token: &result.Token, Account: toGraphQLAccount(result.User), Errors: []*UserError{}}, nil
}

// Login is the resolver for the login field.
func (r *mutationResolver) Login(ctx context.Context, email string, password string) (*AuthPayload, error) {
	result, err := r.authHandler.Login(ctx, auth.LoginCommand{Email: email, Password: password})
	if err != nil {
		return &AuthPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &AuthPayload{Token: &result.Token, Account: toGraphQLAccount(result.User), Errors: []*UserError{}}, nil
}

// Logout is the resolver for the logout field.
func (r *mutationResolver) Logout(ctx context.Context) (bool, error) {
	token := sessionTokenFromContext(ctx)
	_ = r.authHandler.Logout(ctx, auth.LogoutCommand{Token: token})
	return true, nil
}

// CreateAccount is the resolver for the createAccount field.
func (r *mutationResolver) CreateAccount(ctx context.Context, input CreateAccountInput) (*AccountPayload, error) {
	actorID := r.currentUserID(ctx)
	var role string
	if input.Role != nil {
		role = strings.ToLower(string(*input.Role))
	}
	user, err := r.authHandler.CreateAccount(ctx, auth.CreateAccountCommand{
		ActorID:         actorID,
		Name:            input.Name,
		Email:           input.Email,
		Password:        derefString(input.Password),
		PasswordConfirm: derefString(input.PasswordConfirm),
		Role:            role,
	})
	if err != nil {
		return &AccountPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &AccountPayload{Account: toGraphQLAccount(user), Errors: []*UserError{}}, nil
}

// DeleteAccount is the resolver for the deleteAccount field.
func (r *mutationResolver) DeleteAccount(ctx context.Context, id string) (*DeleteAccountPayload, error) {
	actorID := r.currentUserID(ctx)
	if err := r.authHandler.DeleteAccount(ctx, auth.DeleteAccountCommand{ActorID: actorID, TargetID: id}); err != nil {
		return &DeleteAccountPayload{Success: false, Errors: domainErrorToUserErrors(err)}, nil
	}
	return &DeleteAccountPayload{Success: true, Errors: []*UserError{}}, nil
}

// RequestPasswordReset is the resolver for the requestPasswordReset field.
func (r *mutationResolver) RequestPasswordReset(ctx context.Context, email string) (bool, error) {
	go func() {
		_ = r.authHandler.RequestPasswordReset(context.Background(), auth.RequestPasswordResetCommand{Email: email})
	}()
	return true, nil
}

// ResetPassword is the resolver for the resetPassword field.
func (r *mutationResolver) ResetPassword(ctx context.Context, input ResetPasswordInput) (*AccountPayload, error) {
	user, err := r.authHandler.ResetPassword(ctx, auth.ResetPasswordCommand{
		Token:              input.Token,
		NewPassword:        input.NewPassword,
		NewPasswordConfirm: input.NewPasswordConfirm,
	})
	if err != nil {
		return &AccountPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &AccountPayload{Account: toGraphQLAccount(user), Errors: []*UserError{}}, nil
}

// ChangePassword is the resolver for the changePassword field.
func (r *mutationResolver) ChangePassword(ctx context.Context, input ChangePasswordInput) (*AccountPayload, error) {
	userID := r.currentUserID(ctx)
	user, err := r.authHandler.ChangePassword(ctx, auth.ChangePasswordCommand{
		UserID:             userID,
		CurrentPassword:    input.CurrentPassword,
		NewPassword:        input.NewPassword,
		NewPasswordConfirm: input.NewPasswordConfirm,
	})
	if err != nil {
		return &AccountPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &AccountPayload{Account: toGraphQLAccount(user), Errors: []*UserError{}}, nil
}

// UpdateMediaCaption is the resolver for the updateMediaCaption field.
func (r *mutationResolver) UpdateMediaCaption(ctx context.Context, id string, caption *string) (*MediaPayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &MediaPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	m, err := r.mediaHandler.UpdateCaption(ctx, media.UpdateCaptionCommand{
		ID:      id,
		Caption: derefString(caption),
	})
	if err != nil {
		return &MediaPayload{Errors: domainErrorToUserErrors(err)}, nil
	}
	return &MediaPayload{Media: toGraphQLMedia(m), Errors: []*UserError{}}, nil
}

// ReorderMedia is the resolver for the reorderMedia field.
func (r *mutationResolver) ReorderMedia(ctx context.Context, visitID string, mediaIDs []string) (*ReorderMediaPayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &ReorderMediaPayload{Media: []*Media{}, Errors: domainErrorToUserErrors(err)}, nil
	}
	list, err := r.mediaHandler.Reorder(ctx, media.ReorderCommand{
		VisitID:  visitID,
		MediaIDs: mediaIDs,
	})
	if err != nil {
		return &ReorderMediaPayload{Media: []*Media{}, Errors: domainErrorToUserErrors(err)}, nil
	}
	return &ReorderMediaPayload{Media: toGraphQLMediaList(list), Errors: []*UserError{}}, nil
}

// ReorderTravelLegMedia is the resolver for the reorderTravelLegMedia field.
func (r *mutationResolver) ReorderTravelLegMedia(ctx context.Context, travelLegID string, mediaIDs []string) (*ReorderTravelLegMediaPayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &ReorderTravelLegMediaPayload{Media: []*Media{}, Errors: domainErrorToUserErrors(err)}, nil
	}
	list, err := r.mediaHandler.ReorderTravelLeg(ctx, media.ReorderTravelLegCommand{TravelLegID: travelLegID, MediaIDs: mediaIDs})
	if err != nil {
		return &ReorderTravelLegMediaPayload{Media: []*Media{}, Errors: domainErrorToUserErrors(err)}, nil
	}
	return &ReorderTravelLegMediaPayload{Media: toGraphQLMediaList(list), Errors: []*UserError{}}, nil
}

// DeleteMedia is the resolver for the deleteMedia field.
func (r *mutationResolver) DeleteMedia(ctx context.Context, id string) (*DeleteMediaPayload, error) {
	if err := r.requireEditor(ctx); err != nil {
		return &DeleteMediaPayload{Success: false, Errors: domainErrorToUserErrors(err)}, nil
	}
	err := r.mediaHandler.Delete(ctx, media.DeleteMediaCommand{ID: id})
	if err != nil {
		return &DeleteMediaPayload{Success: false, Errors: domainErrorToUserErrors(err)}, nil
	}
	return &DeleteMediaPayload{Success: true, Errors: []*UserError{}}, nil
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

// Stage is the resolver for the stage field.
func (r *queryResolver) Stage(ctx context.Context, id string) (*Stage, error) {
	s, err := r.stageHandler.GetByID(ctx, stage.GetStageQuery{ID: id})
	if err != nil {
		if errors.Is(err, stage.ErrNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return toGraphQLStage(s), nil
}

// Stages is the resolver for the stages field.
func (r *queryResolver) Stages(ctx context.Context, tripID string) ([]*Stage, error) {
	stages, err := r.stageHandler.ListByTrip(ctx, stage.ListByTripQuery{TripID: tripID})
	if err != nil {
		return nil, err
	}

	visits, err := r.visitHandler.ListByTrip(ctx, visit.ListByTripQuery{TripID: tripID})
	if err != nil {
		return nil, err
	}
	primaryVisits := make([]stage.PrimaryVisit, 0, len(visits))
	for _, v := range visits {
		if len(v.StageIDs) == 0 {
			continue
		}
		primaryVisits = append(primaryVisits, stage.PrimaryVisit{StageID: v.StageIDs[0], Date: v.Date})
	}
	stages = stage.ChronologicalSequence(stages, primaryVisits)

	result := make([]*Stage, 0, len(stages))
	for _, s := range stages {
		result = append(result, toGraphQLStage(s))
	}
	return result, nil
}

// Visit is the resolver for the visit field.
func (r *queryResolver) Visit(ctx context.Context, id string) (*Visit, error) {
	v, err := r.visitHandler.GetByID(ctx, visit.GetVisitQuery{ID: id})
	if err != nil {
		if errors.Is(err, visit.ErrNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return toGraphQLVisit(v), nil
}

// Visits is the resolver for the visits field.
func (r *queryResolver) Visits(ctx context.Context, stageID string) ([]*Visit, error) {
	visits, err := r.visitHandler.ListByStage(ctx, visit.ListByStageQuery{StageID: stageID})
	if err != nil {
		return nil, err
	}
	result := make([]*Visit, 0, len(visits))
	for _, v := range visits {
		result = append(result, toGraphQLVisit(v))
	}
	return result, nil
}

// TripVisits is the resolver for the tripVisits field.
func (r *queryResolver) TripVisits(ctx context.Context, tripID string) ([]*Visit, error) {
	visits, err := r.visitHandler.ListByTrip(ctx, visit.ListByTripQuery{TripID: tripID})
	if err != nil {
		return nil, err
	}
	result := make([]*Visit, 0, len(visits))
	for _, v := range visits {
		result = append(result, toGraphQLVisit(v))
	}
	return result, nil
}

// VisitMedia is the resolver for the visitMedia field.
func (r *queryResolver) VisitMedia(ctx context.Context, visitID string) ([]*Media, error) {
	list, err := r.mediaHandler.ListByVisit(ctx, media.ListByVisitQuery{VisitID: visitID})
	if err != nil {
		return nil, err
	}
	return toGraphQLMediaList(list), nil
}

// TravelLeg is the resolver for the travelLeg field.
func (r *queryResolver) TravelLeg(ctx context.Context, id string) (*TravelLeg, error) {
	if r.travelLegHandler == nil {
		return nil, nil
	}
	leg, err := r.travelLegHandler.GetByID(ctx, travelleg.GetTravelLegQuery{ID: id})
	if errors.Is(err, travelleg.ErrNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return toGraphQLTravelLeg(leg), nil
}

// TravelLegs is the resolver for the travelLegs field.
func (r *queryResolver) TravelLegs(ctx context.Context, tripID string) ([]*TravelLeg, error) {
	if r.travelLegHandler == nil {
		return []*TravelLeg{}, nil
	}
	legs, err := r.travelLegHandler.ListByTrip(ctx, travelleg.ListTravelLegsQuery{TripID: tripID})
	if err != nil {
		return nil, err
	}
	return toGraphQLTravelLegList(legs), nil
}

// TravelLegMedia is the resolver for the travelLegMedia field.
func (r *queryResolver) TravelLegMedia(ctx context.Context, travelLegID string) ([]*Media, error) {
	items, err := r.mediaHandler.ListByTravelLeg(ctx, media.ListByTravelLegQuery{TravelLegID: travelLegID})
	if err != nil {
		return nil, err
	}
	return toGraphQLMediaList(items), nil
}

// TripMedia is the resolver for the tripMedia field.
func (r *queryResolver) TripMedia(ctx context.Context, tripID string) ([]*Media, error) {
	list, err := r.mediaHandler.ListByTrip(ctx, media.ListByTripQuery{TripID: tripID})
	if err != nil {
		return nil, err
	}
	return toGraphQLMediaList(list), nil
}

// Me is the resolver for the me field.
func (r *queryResolver) Me(ctx context.Context) (*Account, error) {
	token := sessionTokenFromContext(ctx)
	if token == "" {
		return nil, nil
	}
	user, err := r.authHandler.GetCurrentUser(ctx, auth.GetCurrentUserQuery{Token: token})
	if err != nil {
		return nil, nil
	}
	return toGraphQLAccount(user), nil
}

// SetupStatus is the resolver for the setupStatus field.
func (r *queryResolver) SetupStatus(ctx context.Context) (*SetupStatusPayload, error) {
	done, err := r.authHandler.IsSetupDone(ctx, auth.IsSetupDoneQuery{})
	if err != nil {
		return nil, err
	}
	return &SetupStatusPayload{Done: done}, nil
}

// Accounts is the resolver for the accounts field.
func (r *queryResolver) Accounts(ctx context.Context) ([]*Account, error) {
	actorID := r.currentUserID(ctx)
	users, err := r.authHandler.ListAccounts(ctx, auth.ListAccountsQuery{ActorID: actorID})
	if err != nil {
		return nil, err
	}
	result := make([]*Account, 0, len(users))
	for _, u := range users {
		result = append(result, toGraphQLAccount(u))
	}
	return result, nil
}

// Mutation returns MutationResolver implementation.
func (r *Resolver) Mutation() MutationResolver { return &mutationResolver{r} }

// Query returns QueryResolver implementation.
func (r *Resolver) Query() QueryResolver { return &queryResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }

func travelLegUnavailableErrors() []*UserError {
	return []*UserError{{Message: "travel leg service is unavailable"}}
}
