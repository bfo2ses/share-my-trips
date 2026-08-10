package memory

import (
	"context"
	"sort"
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

func (r *MediaRepository) ListByVisit(_ context.Context, visitID string) ([]*media.Media, error) {
	return r.ListByOwner(context.Background(), media.VisitOwner(visitID))
}

func (r *MediaRepository) ListByTravelLeg(_ context.Context, travelLegID string) ([]*media.Media, error) {
	return r.ListByOwner(context.Background(), media.TravelLegOwner(travelLegID))
}

func (r *MediaRepository) ListByOwner(_ context.Context, owner media.Owner) ([]*media.Media, error) {
	if err := owner.Validate(); err != nil {
		return nil, err
	}
	r.mu.RLock()
	defer r.mu.RUnlock()
	var result []*media.Media
	for _, m := range r.media {
		if m.Owner() == owner {
			cp := *m
			result = append(result, &cp)
		}
	}
	sort.Slice(result, func(i, j int) bool { return result[i].Position < result[j].Position })
	return result, nil
}

func (r *MediaRepository) ListByTrip(_ context.Context, tripID string) ([]*media.Media, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*media.Media
	for _, m := range r.media {
		if m.TripID == tripID {
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

func (r *MediaRepository) Move(_ context.Context, mediaIDs []string, destination media.Owner) error {
	if err := destination.Validate(); err != nil {
		return err
	}
	r.mu.Lock()
	defer r.mu.Unlock()

	selected := make([]*media.Media, 0, len(mediaIDs))
	seen := make(map[string]struct{}, len(mediaIDs))
	for _, id := range mediaIDs {
		if _, ok := seen[id]; ok {
			return media.ErrIDMismatch
		}
		seen[id] = struct{}{}
		item, ok := r.media[id]
		if !ok {
			return media.ErrNotFound
		}
		selected = append(selected, item)
	}
	if len(selected) == 0 {
		return media.ErrMediaRequired
	}
	source := selected[0].Owner()
	for _, item := range selected[1:] {
		if item.Owner() != source {
			return media.ErrMixedOwners
		}
	}

	maxPosition := -1
	for _, item := range r.media {
		if item.Owner() == destination && item.Position > maxPosition {
			maxPosition = item.Position
		}
	}
	for position, item := range selected {
		item.VisitID = destination.VisitID
		item.TravelLegID = destination.TravelLegID
		item.Position = maxPosition + position + 1
	}

	remaining := make([]*media.Media, 0)
	for _, item := range r.media {
		if item.Owner() == source {
			if _, moved := seen[item.ID]; !moved {
				remaining = append(remaining, item)
			}
		}
	}
	sort.Slice(remaining, func(i, j int) bool {
		if remaining[i].Position == remaining[j].Position {
			return remaining[i].ID < remaining[j].ID
		}
		return remaining[i].Position < remaining[j].Position
	})
	for position, item := range remaining {
		item.Position = position
	}
	return nil
}

func (r *MediaRepository) NextPosition(_ context.Context, visitID string) (int, error) {
	return r.NextPositionForOwner(context.Background(), media.VisitOwner(visitID))
}

func (r *MediaRepository) NextPositionForOwner(_ context.Context, owner media.Owner) (int, error) {
	if err := owner.Validate(); err != nil {
		return 0, err
	}
	r.mu.RLock()
	defer r.mu.RUnlock()

	max := -1
	for _, m := range r.media {
		if m.Owner() == owner && m.Position > max {
			max = m.Position
		}
	}
	return max + 1, nil
}

func (r *MediaRepository) Reorder(_ context.Context, visitID string, orderedIDs []string) error {
	return r.ReorderForOwner(context.Background(), media.VisitOwner(visitID), orderedIDs)
}

func (r *MediaRepository) ReorderForOwner(_ context.Context, owner media.Owner, orderedIDs []string) error {
	if err := owner.Validate(); err != nil {
		return err
	}
	r.mu.Lock()
	defer r.mu.Unlock()

	for pos, id := range orderedIDs {
		if m, ok := r.media[id]; ok && m.Owner() == owner {
			m.Position = pos
		}
	}
	return nil
}
