package memory

import (
	"context"
	"sync"

	"github.com/bfosses/sharemytrips/internal/domain/media"
)

// MediaRepository is an in-memory implementation of media.Repository.
type MediaRepository struct {
	mu    sync.RWMutex
	media map[string]*media.Media
}

// NewMediaRepository creates a new in-memory media repository.
func NewMediaRepository() *MediaRepository {
	return &MediaRepository{
		media: make(map[string]*media.Media),
	}
}

func (r *MediaRepository) Save(_ context.Context, m *media.Media) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	cp := *m
	r.media[m.ID] = &cp
	return nil
}

func (r *MediaRepository) FindByID(_ context.Context, id string) (*media.Media, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	m, ok := r.media[id]
	if !ok {
		return nil, media.ErrNotFound
	}

	cp := *m
	return &cp, nil
}

func (r *MediaRepository) ListByDay(_ context.Context, dayID string) ([]*media.Media, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*media.Media
	for _, m := range r.media {
		if m.DayID == dayID {
			cp := *m
			result = append(result, &cp)
		}
	}
	return result, nil
}

func (r *MediaRepository) Delete(_ context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.media[id]; !ok {
		return media.ErrNotFound
	}

	delete(r.media, id)
	return nil
}

func (r *MediaRepository) NextPosition(_ context.Context, dayID string) (int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	max := -1
	for _, m := range r.media {
		if m.DayID == dayID && m.Position > max {
			max = m.Position
		}
	}
	return max + 1, nil
}

func (r *MediaRepository) Reorder(_ context.Context, dayID string, orderedIDs []string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for pos, id := range orderedIDs {
		if m, ok := r.media[id]; ok && m.DayID == dayID {
			m.Position = pos
		}
	}
	return nil
}
