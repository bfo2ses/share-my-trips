package memory

import (
	"context"
	"sort"
	"sync"

	"github.com/bfosses/sharemytrips/internal/domain/stage"
)

// StageRepository is an in-memory implementation of stage.Repository.
type StageRepository struct {
	mu     sync.RWMutex
	stages map[string]*stage.Stage
}

// NewStageRepository creates a new in-memory stage repository.
func NewStageRepository() *StageRepository {
	return &StageRepository{
		stages: make(map[string]*stage.Stage),
	}
}

func (r *StageRepository) Save(_ context.Context, s *stage.Stage) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	cp := *s
	r.stages[s.ID] = &cp
	return nil
}

func (r *StageRepository) FindByID(_ context.Context, id string) (*stage.Stage, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	s, ok := r.stages[id]
	if !ok {
		return nil, stage.ErrNotFound
	}

	cp := *s
	return &cp, nil
}

func (r *StageRepository) ListByTrip(_ context.Context, tripID string) ([]*stage.Stage, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*stage.Stage
	for _, s := range r.stages {
		if s.TripID == tripID {
			cp := *s
			result = append(result, &cp)
		}
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].CreatedAt.Before(result[j].CreatedAt)
	})
	return result, nil
}

// BelongsToTrip implements day.StageChecker.
func (r *StageRepository) BelongsToTrip(_ context.Context, stageID, tripID string) (bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	s, ok := r.stages[stageID]
	if !ok {
		return false, nil
	}
	return s.TripID == tripID, nil
}

func (r *StageRepository) Delete(_ context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.stages[id]; !ok {
		return stage.ErrNotFound
	}

	delete(r.stages, id)
	return nil
}
