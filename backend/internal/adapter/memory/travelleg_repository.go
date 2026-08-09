package memory

import (
	"context"
	"sort"
	"sync"

	"github.com/bfosses/sharemytrips/internal/domain/travelleg"
)

// TravelLegRepository is an in-memory implementation of travelleg.Repository.
type TravelLegRepository struct {
	mu   sync.RWMutex
	legs map[string]*travelleg.TravelLeg
}

func NewTravelLegRepository() *TravelLegRepository {
	return &TravelLegRepository{legs: make(map[string]*travelleg.TravelLeg)}
}

func (r *TravelLegRepository) Save(_ context.Context, leg *travelleg.TravelLeg) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for id, existing := range r.legs {
		if id != leg.ID && existing.TripID == leg.TripID && existing.FromStageID == leg.FromStageID && existing.ToStageID == leg.ToStageID {
			return travelleg.ErrPairAlreadyExists
		}
	}
	r.legs[leg.ID] = cloneTravelLeg(leg)
	return nil
}

func (r *TravelLegRepository) FindByID(_ context.Context, id string) (*travelleg.TravelLeg, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	leg, ok := r.legs[id]
	if !ok {
		return nil, travelleg.ErrNotFound
	}
	return cloneTravelLeg(leg), nil
}

func (r *TravelLegRepository) FindByStagePair(_ context.Context, tripID, fromStageID, toStageID string) (*travelleg.TravelLeg, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, leg := range r.legs {
		if leg.TripID == tripID && leg.FromStageID == fromStageID && leg.ToStageID == toStageID {
			return cloneTravelLeg(leg), nil
		}
	}
	return nil, travelleg.ErrNotFound
}

func (r *TravelLegRepository) ListByTrip(_ context.Context, tripID string) ([]*travelleg.TravelLeg, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	legs := make([]*travelleg.TravelLeg, 0)
	for _, leg := range r.legs {
		if leg.TripID == tripID {
			legs = append(legs, cloneTravelLeg(leg))
		}
	}
	sort.Slice(legs, func(i, j int) bool { return legs[i].CreatedAt.Before(legs[j].CreatedAt) })
	return legs, nil
}

func (r *TravelLegRepository) Delete(_ context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.legs[id]; !ok {
		return travelleg.ErrNotFound
	}
	delete(r.legs, id)
	return nil
}

func cloneTravelLeg(leg *travelleg.TravelLeg) *travelleg.TravelLeg {
	copy := *leg
	if leg.DistanceKm != nil {
		distance := *leg.DistanceKm
		copy.DistanceKm = &distance
	}
	return &copy
}
