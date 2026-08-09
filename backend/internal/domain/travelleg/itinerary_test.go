package travelleg

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestInvalidatedLegs_FindsPairsThatAreNoLongerOrderedAndAdjacent(t *testing.T) {
	t.Parallel()

	legs := []*TravelLeg{{ID: "leg-1", TripID: "trip-1", FromStageID: "a", ToStageID: "b"}}
	proposed := stageRefs("trip-1", "a", "x", "b")

	invalidated := InvalidatedLegs(legs, proposed)
	require.Len(t, invalidated, 1)
	assert.Equal(t, "leg-1", invalidated[0].ID)
}

func TestValidateResolutionPlan_RequiresExactlyOneResolutionForEveryInvalidatedLeg(t *testing.T) {
	t.Parallel()

	legs := []*TravelLeg{{ID: "leg-1", TripID: "trip-1", FromStageID: "a", ToStageID: "b"}}
	proposed := stageRefs("trip-1", "a", "x", "b")

	_, err := ValidateResolutionPlan(legs, proposed, nil)
	assert.ErrorIs(t, err, ErrIncompleteResolutionPlan)

	recalculations, err := ValidateResolutionPlan(legs, proposed, []ItineraryResolution{{
		TravelLegID: "leg-1",
		Action:      ResolutionMove,
		FromStageID: "a",
		ToStageID:   "x",
	}})
	require.NoError(t, err)
	assert.Equal(t, []DistanceRecalculationRequest{{
		TravelLegID: "leg-1",
		TripID:      "trip-1",
		Reason:      DistanceRecalculationAfterMove,
	}}, recalculations)
}

func TestValidateResolutionPlan_RejectsStaleDuplicateAndOccupiedTargets(t *testing.T) {
	t.Parallel()

	proposed := stageRefs("trip-1", "a", "x", "b", "c", "y", "d")
	legs := []*TravelLeg{
		{ID: "leg-a-b", TripID: "trip-1", FromStageID: "a", ToStageID: "b"},
		{ID: "leg-c-d", TripID: "trip-1", FromStageID: "c", ToStageID: "d"},
		{ID: "leg-a-x", TripID: "trip-1", FromStageID: "a", ToStageID: "x"},
	}

	_, err := ValidateResolutionPlan(legs, proposed, []ItineraryResolution{{
		TravelLegID: "leg-a-b", Action: ResolutionMove, FromStageID: "a", ToStageID: "x",
	}, {
		TravelLegID: "leg-c-d", Action: ResolutionDelete,
	}})
	assert.ErrorIs(t, err, ErrResolutionTargetOccupied)

	_, err = ValidateResolutionPlan(legs[:2], proposed, []ItineraryResolution{{
		TravelLegID: "leg-a-b", Action: ResolutionMove, FromStageID: "a", ToStageID: "x",
	}, {
		TravelLegID: "leg-c-d", Action: ResolutionMove, FromStageID: "a", ToStageID: "x",
	}})
	assert.ErrorIs(t, err, ErrDuplicateResolutionTarget)

	_, err = ValidateResolutionPlan(legs[:2], proposed, []ItineraryResolution{{
		TravelLegID: "leg-a-b", Action: ResolutionDelete,
	}, {
		TravelLegID: "leg-a-b", Action: ResolutionDelete,
	}, {
		TravelLegID: "leg-c-d", Action: ResolutionDelete,
	}})
	assert.ErrorIs(t, err, ErrDuplicateResolution)

	_, err = ValidateResolutionPlan(legs[:2], proposed, []ItineraryResolution{{
		TravelLegID: "unknown", Action: ResolutionDelete,
	}, {
		TravelLegID: "leg-a-b", Action: ResolutionDelete,
	}, {
		TravelLegID: "leg-c-d", Action: ResolutionDelete,
	}})
	assert.ErrorIs(t, err, ErrResolutionForValidLeg)
}

func TestRecalculationRequestsForEndpoint_ReportsOnlyAffectedLegs(t *testing.T) {
	t.Parallel()

	requests := RecalculationRequestsForEndpoint([]*TravelLeg{
		{ID: "from", TripID: "trip-1", FromStageID: "a", ToStageID: "b"},
		{ID: "to", TripID: "trip-1", FromStageID: "b", ToStageID: "c"},
		{ID: "other", TripID: "trip-1", FromStageID: "c", ToStageID: "d"},
	}, "b")

	assert.Equal(t, []DistanceRecalculationRequest{
		{TravelLegID: "from", TripID: "trip-1", Reason: DistanceRecalculationAfterEndpointCoordinate},
		{TravelLegID: "to", TripID: "trip-1", Reason: DistanceRecalculationAfterEndpointCoordinate},
	}, requests)
}

func TestTravelLegClearDistance_RemovesAStaleValueAfterCalculationFailure(t *testing.T) {
	t.Parallel()

	distance := 42.0
	leg := &TravelLeg{DistanceKm: &distance}
	leg.ClearDistance()

	assert.Nil(t, leg.DistanceKm)
}

func stageRefs(tripID string, stageIDs ...string) []StageRef {
	refs := make([]StageRef, 0, len(stageIDs))
	for _, stageID := range stageIDs {
		refs = append(refs, StageRef{ID: stageID, TripID: tripID})
	}
	return refs
}
