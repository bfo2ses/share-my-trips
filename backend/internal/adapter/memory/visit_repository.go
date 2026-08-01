package memory

import (
	"context"
	"sort"
	"sync"
	"time"

	"github.com/bfosses/sharemytrips/internal/domain/visit"
)

// VisitRepository is an in-memory implementation of visit.Repository.
// It also implements stage.VisitDetacher via the DetachStage method.
type VisitRepository struct {
	mu     sync.RWMutex
	visits map[string]*visit.Visit
}

// NewVisitRepository creates a new in-memory visit repository.
func NewVisitRepository() *VisitRepository {
	return &VisitRepository{
		visits: make(map[string]*visit.Visit),
	}
}

func (r *VisitRepository) Save(_ context.Context, v *visit.Visit) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	cp := *v
	cp.StageIDs = make([]string, len(v.StageIDs))
	copy(cp.StageIDs, v.StageIDs)
	r.visits[v.ID] = &cp
	return nil
}

func (r *VisitRepository) FindByID(_ context.Context, id string) (*visit.Visit, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	v, ok := r.visits[id]
	if !ok {
		return nil, visit.ErrNotFound
	}

	cp := *v
	cp.StageIDs = make([]string, len(v.StageIDs))
	copy(cp.StageIDs, v.StageIDs)
	return &cp, nil
}

func (r *VisitRepository) ListByStage(_ context.Context, stageID string) ([]*visit.Visit, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*visit.Visit
	for _, v := range r.visits {
		if v.HasStage(stageID) {
			cp := *v
			cp.StageIDs = make([]string, len(v.StageIDs))
			copy(cp.StageIDs, v.StageIDs)
			result = append(result, &cp)
		}
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].Date.Before(result[j].Date)
	})
	return result, nil
}

func (r *VisitRepository) ListByTrip(_ context.Context, tripID string) ([]*visit.Visit, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*visit.Visit
	for _, v := range r.visits {
		if v.TripID == tripID {
			cp := *v
			cp.StageIDs = make([]string, len(v.StageIDs))
			copy(cp.StageIDs, v.StageIDs)
			result = append(result, &cp)
		}
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].Date.Before(result[j].Date)
	})
	return result, nil
}

func (r *VisitRepository) Delete(_ context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.visits[id]; !ok {
		return visit.ErrNotFound
	}

	delete(r.visits, id)
	return nil
}

// ListByStageAndDate returns visits whose primary stage (StageIDs[0]) is
// stageID and whose Date matches date, sorted by position.
func (r *VisitRepository) ListByStageAndDate(_ context.Context, stageID string, date time.Time) ([]*visit.Visit, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*visit.Visit
	for _, v := range r.visits {
		if len(v.StageIDs) > 0 && v.StageIDs[0] == stageID && v.Date.Equal(date) {
			cp := *v
			cp.StageIDs = make([]string, len(v.StageIDs))
			copy(cp.StageIDs, v.StageIDs)
			result = append(result, &cp)
		}
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].Position < result[j].Position
	})
	return result, nil
}

// NextPosition returns the next available position for a (stageID, date) group.
func (r *VisitRepository) NextPosition(_ context.Context, stageID string, date time.Time) (int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	max := -1
	for _, v := range r.visits {
		if len(v.StageIDs) > 0 && v.StageIDs[0] == stageID && v.Date.Equal(date) && v.Position > max {
			max = v.Position
		}
	}
	return max + 1, nil
}

// Reorder updates the positions of orderedIDs within the (stageID, date) group.
func (r *VisitRepository) Reorder(_ context.Context, stageID string, date time.Time, orderedIDs []string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for pos, id := range orderedIDs {
		if v, ok := r.visits[id]; ok && len(v.StageIDs) > 0 && v.StageIDs[0] == stageID && v.Date.Equal(date) {
			v.Position = pos
		}
	}
	return nil
}

// DetachStage removes stageID from all visits, deleting any visit that becomes orphaned.
// This implements stage.VisitDetacher.
func (r *VisitRepository) DetachStage(_ context.Context, stageID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for id, v := range r.visits {
		if !v.HasStage(stageID) {
			continue
		}
		if len(v.StageIDs) == 1 {
			delete(r.visits, id)
		} else {
			newIDs := make([]string, 0, len(v.StageIDs)-1)
			for _, sid := range v.StageIDs {
				if sid != stageID {
					newIDs = append(newIDs, sid)
				}
			}
			v.StageIDs = newIDs
			v.UpdatedAt = time.Now()
		}
	}
	return nil
}
