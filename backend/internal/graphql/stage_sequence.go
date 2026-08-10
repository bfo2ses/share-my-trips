package graph

import (
	"context"
	"fmt"

	"github.com/bfosses/sharemytrips/internal/domain/stage"
	"github.com/bfosses/sharemytrips/internal/domain/travelleg"
	"github.com/bfosses/sharemytrips/internal/domain/visit"
)

// TravelLegStageSequence adapts existing read handlers to the travel-leg
// domain's authoritative, date-derived stage order.
type TravelLegStageSequence struct {
	stageHandler *stage.Handler
	visitHandler *visit.Handler
}

func NewTravelLegStageSequence(stageHandler *stage.Handler, visitHandler *visit.Handler) *TravelLegStageSequence {
	return &TravelLegStageSequence{stageHandler: stageHandler, visitHandler: visitHandler}
}

func (s *TravelLegStageSequence) OrderedStages(ctx context.Context, tripID string) ([]travelleg.StageRef, error) {
	stages, err := s.stageHandler.ListByTrip(ctx, stage.ListByTripQuery{TripID: tripID})
	if err != nil {
		return nil, fmt.Errorf("list ordered stages: %w", err)
	}
	visits, err := s.visitHandler.ListByTrip(ctx, visit.ListByTripQuery{TripID: tripID})
	if err != nil {
		return nil, fmt.Errorf("list ordered stages: %w", err)
	}
	primaryVisits := make([]stage.PrimaryVisit, 0, len(visits))
	for _, item := range visits {
		if len(item.StageIDs) != 0 {
			primaryVisits = append(primaryVisits, stage.PrimaryVisit{StageID: item.StageIDs[0], Date: item.Date})
		}
	}
	ordered := stage.ChronologicalSequence(stages, primaryVisits)
	result := make([]travelleg.StageRef, len(ordered))
	for index, item := range ordered {
		result[index] = travelleg.StageRef{ID: item.ID, TripID: item.TripID}
	}
	return result, nil
}
