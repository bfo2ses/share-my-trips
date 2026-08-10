package travelleg

import "fmt"

// ResolutionAction describes how an editor resolves a leg that would no
// longer connect consecutive stages after an itinerary change.
type ResolutionAction string

const (
	ResolutionMove   ResolutionAction = "MOVE"
	ResolutionDelete ResolutionAction = "DELETE"
)

// ItineraryResolution is one deliberate choice for an invalidated travel
// leg. A move target is evaluated against the proposed, not current,
// chronological stage sequence.
type ItineraryResolution struct {
	TravelLegID string
	Action      ResolutionAction
	FromStageID string
	ToStageID   string
}

// DistanceRecalculationReason explains why a later application service must
// ask the distance calculator for a fresh value. This package deliberately
// does not calculate routes or perform I/O.
type DistanceRecalculationReason string

const (
	DistanceRecalculationAfterMove               DistanceRecalculationReason = "LEG_MOVED"
	DistanceRecalculationAfterEndpointCoordinate DistanceRecalculationReason = "ENDPOINT_COORDINATES_CHANGED"
)

// DistanceRecalculationRequest is a pure outcome. U3's calculator owns the
// actual calculation and, on failure, calls TravelLeg.ClearDistance.
type DistanceRecalculationRequest struct {
	TravelLegID string
	TripID      string
	Reason      DistanceRecalculationReason
}

// InvalidatedLegs returns the legs that are not an ordered adjacent pair in a
// proposed stage sequence. It is intentionally side-effect free so callers
// can first show every required resolution to an editor.
func InvalidatedLegs(legs []*TravelLeg, proposed []StageRef) []*TravelLeg {
	invalidated := make([]*TravelLeg, 0)
	for _, leg := range legs {
		if leg == nil || !isAdjacentPair(leg.TripID, leg.FromStageID, leg.ToStageID, proposed) {
			invalidated = append(invalidated, leg)
		}
	}
	return invalidated
}

// ValidateResolutionPlan verifies that a complete resolution plan repairs
// exactly the legs invalidated by a proposed sequence change. It returns the
// distance recalculations required by successful moves; applying moves,
// deletions and the triggering write atomically belongs to U2.
func ValidateResolutionPlan(legs []*TravelLeg, proposed []StageRef, resolutions []ItineraryResolution) ([]DistanceRecalculationRequest, error) {
	invalidated := InvalidatedLegs(legs, proposed)
	invalidatedByID := make(map[string]*TravelLeg, len(invalidated))
	for _, leg := range invalidated {
		if leg == nil || leg.ID == "" {
			return nil, ErrInvalidTravelLeg
		}
		invalidatedByID[leg.ID] = leg
	}

	if len(invalidatedByID) == 0 && len(resolutions) == 0 {
		return nil, nil
	}

	resolved := make(map[string]struct{}, len(resolutions))
	movedPairs := make(map[string]struct{}, len(resolutions))
	occupiedPairs := occupiedValidPairs(legs, proposed)
	recalculations := make([]DistanceRecalculationRequest, 0)

	for _, resolution := range resolutions {
		leg, ok := invalidatedByID[resolution.TravelLegID]
		if !ok {
			return nil, fmt.Errorf("%w: %s", ErrResolutionForValidLeg, resolution.TravelLegID)
		}
		if _, duplicate := resolved[resolution.TravelLegID]; duplicate {
			return nil, fmt.Errorf("%w: %s", ErrDuplicateResolution, resolution.TravelLegID)
		}
		resolved[resolution.TravelLegID] = struct{}{}

		switch resolution.Action {
		case ResolutionDelete:
			if resolution.FromStageID != "" || resolution.ToStageID != "" {
				return nil, ErrInvalidResolution
			}
		case ResolutionMove:
			if !isAdjacentPair(leg.TripID, resolution.FromStageID, resolution.ToStageID, proposed) {
				return nil, ErrResolutionTargetNotConsecutive
			}
			pair := stagePairKey(leg.TripID, resolution.FromStageID, resolution.ToStageID)
			if _, duplicate := movedPairs[pair]; duplicate {
				return nil, ErrDuplicateResolutionTarget
			}
			if _, occupied := occupiedPairs[pair]; occupied {
				return nil, ErrResolutionTargetOccupied
			}
			movedPairs[pair] = struct{}{}
			recalculations = append(recalculations, DistanceRecalculationRequest{
				TravelLegID: leg.ID,
				TripID:      leg.TripID,
				Reason:      DistanceRecalculationAfterMove,
			})
		default:
			return nil, ErrInvalidResolution
		}
	}

	if len(resolved) != len(invalidatedByID) {
		return nil, ErrIncompleteResolutionPlan
	}
	return recalculations, nil
}

// RecalculationRequestsForEndpoint returns every leg whose distance becomes
// stale when one endpoint's coordinates change. Stage update orchestration
// can use this narrow pure contract without importing routing concerns.
func RecalculationRequestsForEndpoint(legs []*TravelLeg, stageID string) []DistanceRecalculationRequest {
	requests := make([]DistanceRecalculationRequest, 0)
	for _, leg := range legs {
		if leg == nil || (leg.FromStageID != stageID && leg.ToStageID != stageID) {
			continue
		}
		requests = append(requests, DistanceRecalculationRequest{
			TravelLegID: leg.ID,
			TripID:      leg.TripID,
			Reason:      DistanceRecalculationAfterEndpointCoordinate,
		})
	}
	return requests
}

func isAdjacentPair(tripID, fromStageID, toStageID string, stages []StageRef) bool {
	for index, stage := range stages {
		if stage.ID != fromStageID || stage.TripID != tripID || index+1 >= len(stages) {
			continue
		}
		next := stages[index+1]
		return next.ID == toStageID && next.TripID == tripID
	}
	return false
}

func occupiedValidPairs(legs []*TravelLeg, proposed []StageRef) map[string]struct{} {
	occupied := make(map[string]struct{})
	for _, leg := range legs {
		if leg == nil || !isAdjacentPair(leg.TripID, leg.FromStageID, leg.ToStageID, proposed) {
			continue
		}
		occupied[stagePairKey(leg.TripID, leg.FromStageID, leg.ToStageID)] = struct{}{}
	}
	return occupied
}

func stagePairKey(tripID, fromStageID, toStageID string) string {
	return tripID + "\x00" + fromStageID + "\x00" + toStageID
}
