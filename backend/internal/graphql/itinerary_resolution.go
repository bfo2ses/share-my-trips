package graph

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/bfosses/sharemytrips/internal/domain/stage"
	"github.com/bfosses/sharemytrips/internal/domain/travelleg"
	"github.com/bfosses/sharemytrips/internal/domain/visit"
)

// itineraryCoordinator serializes itinerary-changing GraphQL mutations in a
// process. The in-memory development adapter has no cross-repository
// transaction, so this lock plus complete preflight makes the sequence change
// and its repairs safe from interleaving requests. PostgreSQL adapters still
// enforce their endpoint and pair constraints; a database transaction can be
// introduced behind this coordinator without changing the API contract.
type itineraryCoordinator struct {
	mu sync.Mutex
}

func (r *mutationResolver) resolveItineraryChange(
	ctx context.Context,
	tripID string,
	proposedStages []*stage.Stage,
	proposedVisits []*visit.Visit,
	inputs []*TravelLegResolutionInput,
	apply func() error,
) error {
	if r.travelLegHandler == nil {
		return apply()
	}

	r.itinerary.mu.Lock()
	defer r.itinerary.mu.Unlock()

	legs, err := r.travelLegHandler.ListByTrip(ctx, travelleg.ListTravelLegsQuery{TripID: tripID})
	if err != nil {
		return fmt.Errorf("preflight itinerary change: %w", err)
	}
	proposed := orderedStageRefs(proposedStages, proposedVisits)
	resolutions := toDomainResolutionPlan(inputs)
	if _, err := travelleg.ValidateResolutionPlan(legs, proposed, resolutions); err != nil {
		return fmt.Errorf("preflight itinerary change: %w", err)
	}

	// Endpoint deletion is protected by the database foreign keys, therefore
	// repairs must be written first. All validations for the source change are
	// deliberately completed by its handler before its repository write; after
	// the preflight above only an infrastructure failure can interrupt this
	// guarded sequence.
	if len(resolutions) > 0 {
		if err := r.travelLegHandler.ApplyValidatedResolutions(ctx, resolutions); err != nil {
			_ = r.travelLegHandler.RestoreResolvedLegs(ctx, legs)
			return fmt.Errorf("apply itinerary resolutions: %w", err)
		}
	}
	if err := apply(); err != nil {
		if len(resolutions) > 0 {
			if rollbackErr := r.travelLegHandler.RestoreResolvedLegs(ctx, legs); rollbackErr != nil {
				return fmt.Errorf("apply itinerary change: %w (rollback itinerary resolutions: %v)", err, rollbackErr)
			}
		}
		return fmt.Errorf("apply itinerary change: %w", err)
	}
	return nil
}

func (r *mutationResolver) currentItinerary(ctx context.Context, tripID string) ([]*stage.Stage, []*visit.Visit, error) {
	stages, err := r.stageHandler.ListByTrip(ctx, stage.ListByTripQuery{TripID: tripID})
	if err != nil {
		return nil, nil, fmt.Errorf("list itinerary stages: %w", err)
	}
	visits, err := r.visitHandler.ListByTrip(ctx, visit.ListByTripQuery{TripID: tripID})
	if err != nil {
		return nil, nil, fmt.Errorf("list itinerary visits: %w", err)
	}
	return stages, visits, nil
}

func orderedStageRefs(stages []*stage.Stage, visits []*visit.Visit) []travelleg.StageRef {
	primaryVisits := make([]stage.PrimaryVisit, 0, len(visits))
	for _, item := range visits {
		if item != nil && len(item.StageIDs) > 0 {
			primaryVisits = append(primaryVisits, stage.PrimaryVisit{StageID: item.StageIDs[0], Date: item.Date})
		}
	}
	ordered := stage.ChronologicalSequence(stages, primaryVisits)
	refs := make([]travelleg.StageRef, len(ordered))
	for index, item := range ordered {
		refs[index] = travelleg.StageRef{ID: item.ID, TripID: item.TripID}
	}
	return refs
}

func toDomainResolutionPlan(inputs []*TravelLegResolutionInput) []travelleg.ItineraryResolution {
	result := make([]travelleg.ItineraryResolution, 0, len(inputs))
	for _, input := range inputs {
		if input == nil {
			result = append(result, travelleg.ItineraryResolution{})
			continue
		}
		result = append(result, travelleg.ItineraryResolution{
			TravelLegID: input.TravelLegID,
			Action:      travelleg.ResolutionAction(input.Action),
			FromStageID: derefString(input.FromStageID),
			ToStageID:   derefString(input.ToStageID),
		})
	}
	return result
}

func proposedVisitsWithAdded(visits []*visit.Visit, tripID, stageID string, date time.Time) []*visit.Visit {
	result := append([]*visit.Visit(nil), visits...)
	return append(result, &visit.Visit{TripID: tripID, StageIDs: []string{stageID}, Date: date})
}

func proposedVisitsWithDate(visits []*visit.Visit, visitID string, date time.Time) []*visit.Visit {
	result := cloneVisits(visits)
	for _, item := range result {
		if item.ID == visitID {
			item.Date = date
			break
		}
	}
	return result
}

func proposedVisitsWithout(visits []*visit.Visit, visitID string) []*visit.Visit {
	result := make([]*visit.Visit, 0, len(visits))
	for _, item := range visits {
		if item.ID != visitID {
			result = append(result, item)
		}
	}
	return result
}

func proposedVisitsWithoutStage(visits []*visit.Visit, stageID string) []*visit.Visit {
	result := make([]*visit.Visit, 0, len(visits))
	for _, item := range visits {
		copy := *item
		copy.StageIDs = removeStageID(item.StageIDs, stageID)
		if len(copy.StageIDs) > 0 {
			result = append(result, &copy)
		}
	}
	return result
}

func proposedVisitsWithDetachedStage(visits []*visit.Visit, visitID, stageID string) []*visit.Visit {
	result := cloneVisits(visits)
	for _, item := range result {
		if item.ID == visitID {
			item.StageIDs = removeStageID(item.StageIDs, stageID)
			break
		}
	}
	return result
}

func proposedStagesWithout(stages []*stage.Stage, stageID string) []*stage.Stage {
	result := make([]*stage.Stage, 0, len(stages))
	for _, item := range stages {
		if item.ID != stageID {
			result = append(result, item)
		}
	}
	return result
}

func cloneVisits(visits []*visit.Visit) []*visit.Visit {
	result := make([]*visit.Visit, 0, len(visits))
	for _, item := range visits {
		copy := *item
		copy.StageIDs = append([]string(nil), item.StageIDs...)
		result = append(result, &copy)
	}
	return result
}

func removeStageID(stageIDs []string, stageID string) []string {
	result := make([]string, 0, len(stageIDs))
	for _, id := range stageIDs {
		if id != stageID {
			result = append(result, id)
		}
	}
	return result
}
