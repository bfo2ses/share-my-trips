package memory

import (
	"context"
	"sync"

	"github.com/bfosses/sharemytrips/internal/domain/trip"
)

// TripRepository is an in-memory implementation of trip.Repository.
type TripRepository struct {
	mu    sync.RWMutex
	trips map[string]*trip.Trip
}

// NewTripRepository creates a new in-memory trip repository.
func NewTripRepository() *TripRepository {
	return &TripRepository{
		trips: make(map[string]*trip.Trip),
	}
}

func (r *TripRepository) Save(_ context.Context, t *trip.Trip) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Store a copy to avoid shared mutable state.
	copy := *t
	r.trips[t.ID] = &copy
	return nil
}

func (r *TripRepository) FindByID(_ context.Context, id string) (*trip.Trip, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	t, ok := r.trips[id]
	if !ok {
		return nil, trip.ErrNotFound
	}

	// Return a copy to avoid shared mutable state.
	copy := *t
	return &copy, nil
}

func (r *TripRepository) List(_ context.Context, filter trip.ListFilter) ([]*trip.Trip, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	statusSet := make(map[trip.Status]bool)
	for _, s := range filter.StatusIn {
		statusSet[s] = true
	}

	var result []*trip.Trip
	for _, t := range r.trips {
		if len(statusSet) > 0 && !statusSet[t.Status] {
			continue
		}
		copy := *t
		result = append(result, &copy)
	}

	return result, nil
}

func (r *TripRepository) Delete(_ context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.trips[id]; !ok {
		return trip.ErrNotFound
	}

	delete(r.trips, id)
	return nil
}
