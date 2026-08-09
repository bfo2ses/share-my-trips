package travelleg

import (
	"context"
	"errors"
	"math"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewTravelLeg_ValidatesTransportAndDistance(t *testing.T) {
	t.Parallel()

	distance := 42.5
	leg, err := NewTravelLeg("leg-1", "trip-1", "stage-a", "stage-b", TransportCar, "A scenic drive", &distance)
	require.NoError(t, err)
	assert.Equal(t, TransportCar, leg.Transport)
	require.NotNil(t, leg.DistanceKm)
	assert.Equal(t, 42.5, *leg.DistanceKm)

	_, err = NewTravelLeg("leg-2", "trip-1", "stage-a", "stage-b", Transport("WALK"), "", nil)
	assert.ErrorIs(t, err, ErrInvalidTransport)

	negative := -1.0
	_, err = NewTravelLeg("leg-3", "trip-1", "stage-a", "stage-b", TransportTrain, "", &negative)
	assert.ErrorIs(t, err, ErrInvalidDistance)

	zero := 0.0
	_, err = NewTravelLeg("leg-4", "trip-1", "stage-a", "stage-b", TransportTrain, "", &zero)
	assert.NoError(t, err)

	for _, distance := range []float64{math.NaN(), math.Inf(1), math.Inf(-1)} {
		_, err = NewTravelLeg("leg-invalid", "trip-1", "stage-a", "stage-b", TransportTrain, "", &distance)
		assert.ErrorIs(t, err, ErrInvalidDistance)
	}
}

func TestHandlerAdd_AcceptsOnlyAvailableAdjacentStagesInTheSameTrip(t *testing.T) {
	t.Parallel()

	repo := newRepository()
	sequence := &stubStageSequence{byTrip: map[string][]StageRef{
		"trip-1": {
			{ID: "stage-a", TripID: "trip-1"},
			{ID: "stage-b", TripID: "trip-1"},
			{ID: "stage-c", TripID: "trip-1"},
		},
	}}
	handler := NewHandler(repo, modifiableTrips{}, sequence)

	leg, err := handler.Add(context.Background(), CreateTravelLegCommand{
		TripID: "trip-1", FromStageID: "stage-a", ToStageID: "stage-b", Transport: TransportCar,
	})
	require.NoError(t, err)
	assert.Equal(t, "stage-a", leg.FromStageID)

	_, err = handler.Add(context.Background(), CreateTravelLegCommand{
		TripID: "trip-1", FromStageID: "stage-a", ToStageID: "stage-c", Transport: TransportCar,
	})
	assert.ErrorIs(t, err, ErrStagesNotConsecutive)

	_, err = handler.Add(context.Background(), CreateTravelLegCommand{
		TripID: "trip-1", FromStageID: "stage-a", ToStageID: "foreign-stage", Transport: TransportCar,
	})
	assert.ErrorIs(t, err, ErrStageNotInTrip)

	_, err = handler.Add(context.Background(), CreateTravelLegCommand{
		TripID: "trip-1", FromStageID: "stage-a", ToStageID: "stage-b", Transport: TransportCar,
	})
	assert.ErrorIs(t, err, ErrPairAlreadyExists)
}

func TestHandlerMove_RejectsAnOccupiedOrNonAdjacentPair(t *testing.T) {
	t.Parallel()

	repo := newRepository()
	repo.legs["leg-1"] = &TravelLeg{ID: "leg-1", TripID: "trip-1", FromStageID: "stage-a", ToStageID: "stage-b", Transport: TransportCar}
	repo.legs["leg-2"] = &TravelLeg{ID: "leg-2", TripID: "trip-1", FromStageID: "stage-b", ToStageID: "stage-c", Transport: TransportTrain}
	sequence := &stubStageSequence{byTrip: map[string][]StageRef{
		"trip-1": {
			{ID: "stage-a", TripID: "trip-1"},
			{ID: "stage-b", TripID: "trip-1"},
			{ID: "stage-c", TripID: "trip-1"},
		},
	}}
	handler := NewHandler(repo, modifiableTrips{}, sequence)

	_, err := handler.Move(context.Background(), MoveTravelLegCommand{ID: "leg-1", FromStageID: "stage-b", ToStageID: "stage-c"})
	assert.ErrorIs(t, err, ErrPairAlreadyExists)

	_, err = handler.Move(context.Background(), MoveTravelLegCommand{ID: "leg-1", FromStageID: "stage-a", ToStageID: "stage-c"})
	assert.ErrorIs(t, err, ErrStagesNotConsecutive)
}

func TestHandlerAdd_RejectsAClosedTrip(t *testing.T) {
	t.Parallel()

	handler := NewHandler(newRepository(), modifiableTrips{"trip-1": false}, &stubStageSequence{byTrip: map[string][]StageRef{
		"trip-1": {{ID: "stage-a", TripID: "trip-1"}, {ID: "stage-b", TripID: "trip-1"}},
	}})

	_, err := handler.Add(context.Background(), CreateTravelLegCommand{
		TripID: "trip-1", FromStageID: "stage-a", ToStageID: "stage-b", Transport: TransportBoat,
	})
	assert.ErrorIs(t, err, ErrTripClosed)
}

func TestHandlerUpdateMoveAndDelete_SucceedForAModifiableTrip(t *testing.T) {
	t.Parallel()

	repo := newRepository()
	distance := 10.0
	repo.legs["leg-1"] = &TravelLeg{
		ID: "leg-1", TripID: "trip-1", FromStageID: "stage-a", ToStageID: "stage-b",
		Transport: TransportCar, Description: "old", DistanceKm: &distance,
	}
	sequence := &stubStageSequence{byTrip: map[string][]StageRef{
		"trip-1": stageRefs("trip-1", "stage-a", "stage-b", "stage-c"),
	}}
	handler := NewHandler(repo, modifiableTrips{}, sequence)

	updated, err := handler.Update(context.Background(), UpdateTravelLegCommand{
		ID: "leg-1", Transport: TransportTrain, Description: "new", DistanceKm: nil,
	})
	require.NoError(t, err)
	assert.Equal(t, TransportTrain, updated.Transport)
	assert.Equal(t, "new", updated.Description)
	assert.Nil(t, updated.DistanceKm)

	moved, err := handler.Move(context.Background(), MoveTravelLegCommand{
		ID: "leg-1", FromStageID: "stage-b", ToStageID: "stage-c",
	})
	require.NoError(t, err)
	assert.Equal(t, "stage-b", moved.FromStageID)
	assert.Equal(t, "stage-c", moved.ToStageID)

	require.NoError(t, handler.Delete(context.Background(), DeleteTravelLegCommand{ID: "leg-1"}))
	_, err = repo.FindByID(context.Background(), "leg-1")
	assert.ErrorIs(t, err, ErrNotFound)
}

func TestHandlerMutations_RejectAClosedTrip(t *testing.T) {
	t.Parallel()

	for _, operation := range []struct {
		name string
		run  func(*Handler) error
	}{
		{
			name: "update",
			run: func(handler *Handler) error {
				_, err := handler.Update(context.Background(), UpdateTravelLegCommand{ID: "leg-1", Transport: TransportTrain})
				return err
			},
		},
		{
			name: "move",
			run: func(handler *Handler) error {
				_, err := handler.Move(context.Background(), MoveTravelLegCommand{ID: "leg-1", FromStageID: "stage-b", ToStageID: "stage-c"})
				return err
			},
		},
		{
			name: "delete",
			run: func(handler *Handler) error {
				return handler.Delete(context.Background(), DeleteTravelLegCommand{ID: "leg-1"})
			},
		},
	} {
		t.Run(operation.name, func(t *testing.T) {
			repo := newRepository()
			repo.legs["leg-1"] = &TravelLeg{ID: "leg-1", TripID: "trip-1", FromStageID: "stage-a", ToStageID: "stage-b", Transport: TransportCar}
			handler := NewHandler(repo, modifiableTrips{"trip-1": false}, &stubStageSequence{byTrip: map[string][]StageRef{
				"trip-1": stageRefs("trip-1", "stage-a", "stage-b", "stage-c"),
			}})

			assert.ErrorIs(t, operation.run(handler), ErrTripClosed)
			_, err := repo.FindByID(context.Background(), "leg-1")
			assert.NoError(t, err, "the rejected operation must not mutate persistence")
		})
	}
}

type repository struct {
	legs map[string]*TravelLeg
}

func newRepository() *repository {
	return &repository{legs: make(map[string]*TravelLeg)}
}

func (r *repository) Save(_ context.Context, leg *TravelLeg) error {
	cp := *leg
	cp.DistanceKm = cloneDistance(leg.DistanceKm)
	r.legs[leg.ID] = &cp
	return nil
}

func (r *repository) FindByID(_ context.Context, id string) (*TravelLeg, error) {
	leg, ok := r.legs[id]
	if !ok {
		return nil, ErrNotFound
	}
	cp := *leg
	cp.DistanceKm = cloneDistance(leg.DistanceKm)
	return &cp, nil
}

func (r *repository) FindByStagePair(_ context.Context, tripID, fromStageID, toStageID string) (*TravelLeg, error) {
	for _, leg := range r.legs {
		if leg.TripID == tripID && leg.FromStageID == fromStageID && leg.ToStageID == toStageID {
			cp := *leg
			cp.DistanceKm = cloneDistance(leg.DistanceKm)
			return &cp, nil
		}
	}
	return nil, ErrNotFound
}

func (r *repository) ListByTrip(_ context.Context, tripID string) ([]*TravelLeg, error) {
	legs := make([]*TravelLeg, 0)
	for _, leg := range r.legs {
		if leg.TripID == tripID {
			cp := *leg
			cp.DistanceKm = cloneDistance(leg.DistanceKm)
			legs = append(legs, &cp)
		}
	}
	return legs, nil
}

func (r *repository) Delete(_ context.Context, id string) error {
	if _, ok := r.legs[id]; !ok {
		return ErrNotFound
	}
	delete(r.legs, id)
	return nil
}

type modifiableTrips map[string]bool

func (t modifiableTrips) IsModifiable(_ context.Context, tripID string) (bool, error) {
	modifiable, ok := t[tripID]
	if !ok {
		return true, nil
	}
	return modifiable, nil
}

type stubStageSequence struct {
	byTrip map[string][]StageRef
	err    error
}

func (s *stubStageSequence) OrderedStages(_ context.Context, tripID string) ([]StageRef, error) {
	if s.err != nil {
		return nil, s.err
	}
	return s.byTrip[tripID], nil
}

func TestHandlerAdd_WrapsSequenceErrors(t *testing.T) {
	t.Parallel()

	want := errors.New("sequence unavailable")
	handler := NewHandler(newRepository(), modifiableTrips{}, &stubStageSequence{err: want})
	_, err := handler.Add(context.Background(), CreateTravelLegCommand{
		TripID: "trip-1", FromStageID: "stage-a", ToStageID: "stage-b", Transport: TransportPlane,
	})
	assert.ErrorIs(t, err, want)
}
