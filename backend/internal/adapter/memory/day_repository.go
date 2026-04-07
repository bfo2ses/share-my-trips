package memory

import (
	"context"
	"sync"
	"time"

	"github.com/bfosses/sharemytrips/internal/domain/day"
)

// DayRepository is an in-memory implementation of day.Repository.
// It also implements stage.DayDetacher via the DetachStage method.
type DayRepository struct {
	mu   sync.RWMutex
	days map[string]*day.Day
}

// NewDayRepository creates a new in-memory day repository.
func NewDayRepository() *DayRepository {
	return &DayRepository{
		days: make(map[string]*day.Day),
	}
}

func (r *DayRepository) Save(_ context.Context, d *day.Day) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	cp := *d
	cp.StageIDs = make([]string, len(d.StageIDs))
	copy(cp.StageIDs, d.StageIDs)
	r.days[d.ID] = &cp
	return nil
}

func (r *DayRepository) FindByID(_ context.Context, id string) (*day.Day, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	d, ok := r.days[id]
	if !ok {
		return nil, day.ErrNotFound
	}

	cp := *d
	cp.StageIDs = make([]string, len(d.StageIDs))
	copy(cp.StageIDs, d.StageIDs)
	return &cp, nil
}

func (r *DayRepository) ListByStage(_ context.Context, stageID string) ([]*day.Day, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*day.Day
	for _, d := range r.days {
		if d.HasStage(stageID) {
			cp := *d
			cp.StageIDs = make([]string, len(d.StageIDs))
			copy(cp.StageIDs, d.StageIDs)
			result = append(result, &cp)
		}
	}
	return result, nil
}

func (r *DayRepository) ListByTrip(_ context.Context, tripID string) ([]*day.Day, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*day.Day
	for _, d := range r.days {
		if d.TripID == tripID {
			cp := *d
			cp.StageIDs = make([]string, len(d.StageIDs))
			copy(cp.StageIDs, d.StageIDs)
			result = append(result, &cp)
		}
	}
	return result, nil
}

func (r *DayRepository) Delete(_ context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.days[id]; !ok {
		return day.ErrNotFound
	}

	delete(r.days, id)
	return nil
}

// DetachStage removes stageID from all days, deleting any day that becomes orphaned.
// This implements stage.DayDetacher.
func (r *DayRepository) DetachStage(_ context.Context, stageID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for id, d := range r.days {
		if !d.HasStage(stageID) {
			continue
		}
		if len(d.StageIDs) == 1 {
			delete(r.days, id)
		} else {
			newIDs := make([]string, 0, len(d.StageIDs)-1)
			for _, sid := range d.StageIDs {
				if sid != stageID {
					newIDs = append(newIDs, sid)
				}
			}
			d.StageIDs = newIDs
			d.UpdatedAt = time.Now()
		}
	}
	return nil
}
