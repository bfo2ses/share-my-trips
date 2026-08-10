package graph

import (
	"context"
	"fmt"

	"github.com/bfosses/sharemytrips/internal/domain/stage"
	"github.com/bfosses/sharemytrips/internal/domain/travelleg"
)

const automaticDistanceRecalculationMessage = "La distance n’a pas pu être recalculée. Vous pouvez la recalculer ou la saisir manuellement."

// recalculateTravelLegDistance refreshes a persisted leg after its endpoints
// changed. Provider failures are intentionally non-blocking: the leg remains
// saved but its old distance is cleared so an editor never sees a stale value.
func (r *mutationResolver) recalculateTravelLegDistance(ctx context.Context, legID string) (*TravelLegRecalculationWarning, error) {
	leg, err := r.travelLegHandler.GetByID(ctx, travelleg.GetTravelLegQuery{ID: legID})
	if err != nil {
		return nil, fmt.Errorf("load travel leg for distance recalculation: %w", err)
	}
	from, err := r.stageHandler.GetByID(ctx, stage.GetStageQuery{ID: leg.FromStageID})
	if err != nil {
		return nil, fmt.Errorf("load departure stage for distance recalculation: %w", err)
	}
	to, err := r.stageHandler.GetByID(ctx, stage.GetStageQuery{ID: leg.ToStageID})
	if err != nil {
		return nil, fmt.Errorf("load arrival stage for distance recalculation: %w", err)
	}

	distanceKm, err := r.distanceCalculator.calculate(ctx, leg.Transport, from.Lat, from.Lng, to.Lat, to.Lng)
	if err != nil {
		if _, clearErr := r.travelLegHandler.SetDistance(ctx, leg.ID, nil); clearErr != nil {
			return nil, fmt.Errorf("clear stale travel leg distance: %w", clearErr)
		}
		return &TravelLegRecalculationWarning{TravelLegID: leg.ID, Message: automaticDistanceRecalculationMessage}, nil
	}
	if _, err := r.travelLegHandler.SetDistance(ctx, leg.ID, &distanceKm); err != nil {
		return nil, fmt.Errorf("persist recalculated travel leg distance: %w", err)
	}
	return nil, nil
}

func (r *mutationResolver) recalculateTravelLegDistances(ctx context.Context, requests []travelleg.DistanceRecalculationRequest) ([]*TravelLegRecalculationWarning, error) {
	warnings := make([]*TravelLegRecalculationWarning, 0)
	for _, request := range requests {
		warning, err := r.recalculateTravelLegDistance(ctx, request.TravelLegID)
		if err != nil {
			return nil, err
		}
		if warning != nil {
			warnings = append(warnings, warning)
		}
	}
	return warnings, nil
}

func compactRecalculationWarning(warning *TravelLegRecalculationWarning) []*TravelLegRecalculationWarning {
	if warning == nil {
		return nil
	}
	return []*TravelLegRecalculationWarning{warning}
}
